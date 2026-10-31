import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import {
  weddings,
  clients,
  users,
  vendors,
  vendorQuotes,
  rfqRequests,
  clientInvoices,
  weddingExtraCharges,
  vendorBills,
  billingChangeLogs,
  masterOptions,
} from '../db/schema';
import { eq, desc, asc, ilike, or, and, sql, inArray } from 'drizzle-orm';
import { isUUID } from '../utils';

export interface ExtraChargeItem {
  id: string;
  dbId?: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  rawTotal: number;
  vendor: string;
  vendorId?: string;
  isBilledToClient: boolean;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  createdAt?: string;
}

export interface VendorDisbursementItem {
  id: string;
  vendorId: string;
  vendor: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  agreedBase: string;
  rawAgreedBase: number;
  extras: string;
  rawExtras: number;
  totalPayable: string;
  rawTotalPayable: number;
  advancePaid: string;
  rawAdvancePaid: number;
  balanceDue: string;
  rawBalanceDue: number;
  status: 'PENDING' | 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
  awardedQuoteId?: string;
  settledAt?: string;
  createdAt?: string;
}

export interface ClientInvoiceItem {
  id: string;
  invoiceNumber: string;
  stageKey: string;
  stageLabel: string;
  percentage: number;
  amountDue: string;
  rawAmountDue: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  paidAmount: string;
  rawPaidAmount: number;
  paidAt?: string;
  paymentReference?: string;
}

export interface BillingChangelogItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  fromStatus?: string;
  toStatus?: string;
  amount?: string;
  performedBy: string;
  notes?: string;
  createdAt: string;
}

export interface AvailableQuoteItem {
  quoteId: string;
  rfqId: string;
  serviceCategory: string;
  description: string | null;
  vendorId: string;
  vendorName: string;
  baseCost: string;
  pricePerPlate: string | null;
  quoteStatus: string;
  isBilled: boolean;
  formattedCost: string;
}

export interface ProjectBillingData {
  id: string;
  code: string;
  couple: string;
  brideName?: string;
  groomName?: string;
  clientEmail?: string;
  clientPhone?: string;
  city: string;
  venue: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  actualHeadcount?: number;
  packageType: string;
  status: string;
  isFinalised: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  rawBudget: number;
  coordinator: string;
  baseContract: string;
  rawBaseContract: number;
  totalExtras: string;
  rawTotalExtras: number;
  extrasCount: number;
  totalInvoiced: string;
  rawTotalInvoiced: number;
  vendorCommitments: string;
  rawVendorCommitments: number;
  vendorAdvancePaid: string;
  rawVendorAdvancePaid: number;
  vendorBalanceDue: string;
  rawVendorBalanceDue: number;
  grossMargin: string;
  billsCount: number;
  extraCharges: ExtraChargeItem[];
  vendorBills: VendorDisbursementItem[];
  invoices: ClientInvoiceItem[];
  availableQuotes?: AvailableQuoteItem[];
  changelog?: BillingChangelogItem[];
}

function formatInr(val: number): string {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export async function billingRoutes(fastify: FastifyInstance) {
  // 1. GET /api/billing/master-statuses - Fetch dynamic WEDDING_STATUS master data
  fastify.get('/master-statuses', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await db
        .select({
          id: masterOptions.id,
          category: masterOptions.category,
          optionKey: masterOptions.optionKey,
          label: masterOptions.label,
          description: masterOptions.description,
          sortOrder: masterOptions.sortOrder,
          isActive: masterOptions.isActive,
        })
        .from(masterOptions)
        .where(and(eq(masterOptions.category, 'WEDDING_STATUS'), eq(masterOptions.isActive, true)))
        .orderBy(asc(masterOptions.sortOrder));

      reply.header('Cache-Control', 'public, max-age=60');
      return { success: true, data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 2. GET /api/billing/projects - List projects with commercial sums & PeopleFirst tabs
  fastify.get(
    '/projects',
    async (
      request: FastifyRequest<{
        Querystring: { tab?: string; status?: string; search?: string; city?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { tab = 'ongoing', status = 'ALL', search = '', city = 'ALL' } = request.query;
      const normalizedSearch = search.trim().toLowerCase();

      try {
        // Query weddings with clients and coordinators using Drizzle ORM
        const weddingRows = await db
          .select({
            id: weddings.id,
            code: weddings.code,
            brideName: clients.brideName,
            groomName: clients.groomName,
            clientEmail: clients.email,
            clientPhone: clients.phone,
            city: weddings.destinationCity,
            venue: weddings.primaryVenue,
            startDate: weddings.startDate,
            endDate: weddings.endDate,
            guestCount: weddings.estimatedGuestCount,
            actualHeadcount: weddings.actualBanquetHeadcount,
            packageType: weddings.packageType,
            status: weddings.status,
            totalBudget: weddings.totalBudget,
            agencyFee: weddings.agencyFee,
            coordinator: users.fullName,
          })
          .from(weddings)
          .leftJoin(clients, eq(weddings.clientId, clients.id))
          .leftJoin(users, eq(weddings.leadPlannerId, users.id))
          .orderBy(desc(weddings.startDate));

        // Aggregate extra charges per wedding
        const extraRows = await db
          .select({
            weddingId: weddingExtraCharges.weddingId,
            totalAmount: sql<string>`COALESCE(SUM(${weddingExtraCharges.totalAmount}), 0)`,
            count: sql<number>`COUNT(${weddingExtraCharges.id})`,
          })
          .from(weddingExtraCharges)
          .groupBy(weddingExtraCharges.weddingId);

        const extrasMap = new Map(extraRows.map((r) => [r.weddingId, parseFloat(r.totalAmount) || 0]));
        const extrasCountMap = new Map(extraRows.map((r) => [r.weddingId, Number(r.count) || 0]));

        // Aggregate vendor bills per wedding
        const billRows = await db
          .select({
            weddingId: vendorBills.weddingId,
            totalPayable: sql<string>`COALESCE(SUM(${vendorBills.totalPayable}), 0)`,
            advancePaid: sql<string>`COALESCE(SUM(${vendorBills.advancePaid}), 0)`,
            balanceDue: sql<string>`COALESCE(SUM(${vendorBills.balanceDue}), 0)`,
            count: sql<number>`COUNT(${vendorBills.id})`,
          })
          .from(vendorBills)
          .groupBy(vendorBills.weddingId);

        const billsMap = new Map(
          billRows.map((r) => [
            r.weddingId,
            {
              payable: parseFloat(r.totalPayable) || 0,
              advance: parseFloat(r.advancePaid) || 0,
              balance: parseFloat(r.balanceDue) || 0,
              count: Number(r.count) || 0,
            },
          ])
        );

        // Fetch changelog entries for finalised sign-offs strictly from DB
        const finalLogRows = await db
          .select({
            weddingId: billingChangeLogs.weddingId,
            performedBy: billingChangeLogs.performedBy,
            createdAt: billingChangeLogs.createdAt,
          })
          .from(billingChangeLogs)
          .where(eq(billingChangeLogs.action, 'PROJECT_FINALISED'));

        const finalLogMap = new Map(finalLogRows.map((l) => [l.weddingId, l]));

        // Format all projects
        const allProjects: ProjectBillingData[] = weddingRows.map((w) => {
          const baseContractNum = parseFloat(w.totalBudget) || 0;
          const extrasNum = extrasMap.get(w.id) || 0;
          const extrasCount = extrasCountMap.get(w.id) || 0;
          const totalInvoicedNum = baseContractNum + extrasNum;

          const billData = billsMap.get(w.id) || { payable: 0, advance: 0, balance: 0, count: 0 };
          const isFinal = w.status === 'FINALISED' || w.status === 'FINALISED_SETTLED';
          const grossMarginNum =
            totalInvoicedNum > 0 ? ((totalInvoicedNum - billData.payable) / totalInvoicedNum) * 100 : 0;

          const coupleStr =
            w.brideName && w.groomName ? `${w.brideName} & ${w.groomName}` : 'Royal Couple';

          const formattedStart = w.startDate
            ? new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Scheduled 2026';

          const finalLog = finalLogMap.get(w.id);
          const finalisedDate = isFinal
            ? finalLog?.createdAt
              ? new Date(finalLog.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Concluded'
            : undefined;
          const finalisedBy = isFinal ? finalLog?.performedBy || 'Finance Director' : undefined;

          return {
            id: w.id,
            code: w.code,
            couple: coupleStr,
            brideName: w.brideName || '',
            groomName: w.groomName || '',
            clientEmail: w.clientEmail || '',
            clientPhone: w.clientPhone || '',
            city: w.city || 'Jaipur',
            venue: w.venue || 'Palace Venue',
            startDate: formattedStart,
            endDate: w.endDate ? String(w.endDate) : undefined,
            guestCount: w.actualHeadcount || w.guestCount || 400,
            actualHeadcount: w.actualHeadcount || undefined,
            packageType: w.packageType || 'Full-Service Royal Wedding',
            status: w.status,
            isFinalised: isFinal,
            finalisedDate,
            finalisedBy,
            budget: `₹${(baseContractNum / 10000000).toFixed(2)} Cr`,
            rawBudget: baseContractNum,
            coordinator: w.coordinator || 'Lead Planner',
            baseContract: formatInr(baseContractNum),
            rawBaseContract: baseContractNum,
            totalExtras: extrasNum > 0 ? `+${extrasCount} (${formatInr(extrasNum)})` : 'None',
            rawTotalExtras: extrasNum,
            extrasCount,
            totalInvoiced: formatInr(totalInvoicedNum),
            rawTotalInvoiced: totalInvoicedNum,
            vendorCommitments: formatInr(billData.payable),
            rawVendorCommitments: billData.payable,
            vendorAdvancePaid: formatInr(billData.advance),
            rawVendorAdvancePaid: billData.advance,
            vendorBalanceDue: isFinal && w.status === 'FINALISED_SETTLED' ? '₹0 (Settled)' : formatInr(billData.balance),
            rawVendorBalanceDue: billData.balance,
            grossMargin: `${grossMarginNum.toFixed(1)}%`,
            billsCount: billData.count,
            extraCharges: [],
            vendorBills: [],
            invoices: [],
          };
        });

        // Calculate counts
        const ongoingAll: ProjectBillingData[] = [];
        const finalisedAll: ProjectBillingData[] = [];
        const counts: Record<string, number> = {
          ALL_ONGOING: 0,
          ALL_FINALISED: 0,
        };

        for (const p of allProjects) {
          // City filter
          if (city !== 'ALL' && p.city.toLowerCase() !== city.toLowerCase()) continue;

          // Search filter
          if (normalizedSearch) {
            const match =
              p.code.toLowerCase().includes(normalizedSearch) ||
              p.couple.toLowerCase().includes(normalizedSearch) ||
              p.venue.toLowerCase().includes(normalizedSearch) ||
              p.city.toLowerCase().includes(normalizedSearch);
            if (!match) continue;
          }

          if (p.isFinalised) {
            finalisedAll.push(p);
            counts.ALL_FINALISED++;
            counts[p.status] = (counts[p.status] || 0) + 1;
          } else {
            ongoingAll.push(p);
            counts.ALL_ONGOING++;
            counts[p.status] = (counts[p.status] || 0) + 1;
          }
        }

        // Fetch dynamic status options from master_options in DB
        const masterStatusRows = await db
          .select({
            key: masterOptions.optionKey,
            label: masterOptions.label,
          })
          .from(masterOptions)
          .where(and(eq(masterOptions.category, 'WEDDING_STATUS'), eq(masterOptions.isActive, true)))
          .orderBy(asc(masterOptions.sortOrder));

        const ongoingStatusTabs = [
          { id: 'ALL', label: 'All Projects', count: counts.ALL_ONGOING },
          ...masterStatusRows
            .filter((s) => !['FINALISED', 'FINALISED_SETTLED'].includes(s.key))
            .map((s) => ({
              id: s.key,
              label: s.label,
              count: counts[s.key] || 0,
            })),
        ];

        const finalisedStatusTabs = [
          { id: 'ALL', label: 'All Projects', count: counts.ALL_FINALISED },
          ...masterStatusRows
            .filter((s) => ['FINALISED', 'FINALISED_SETTLED'].includes(s.key))
            .map((s) => ({
              id: s.key,
              label: s.label,
              count: counts[s.key] || 0,
            })),
        ];

        let activeList = tab === 'ongoing' ? ongoingAll : finalisedAll;
        if (status !== 'ALL') {
          activeList = activeList.filter((p) => p.status === status);
        }

        const tabs = [
          { id: 'ongoing', label: 'Ongoing Projects', count: allProjects.filter((p) => !p.isFinalised).length },
          { id: 'finalised', label: 'Finalised Projects', count: allProjects.filter((p) => p.isFinalised).length },
        ];

        // Overall Aggregate Metrics for Header
        const totalBudgetSum = allProjects.reduce((sum, p) => sum + p.rawBudget, 0);
        const totalInvoicedSum = allProjects.reduce((sum, p) => sum + p.rawTotalInvoiced, 0);
        const totalVendorCommitmentsSum = allProjects.reduce((sum, p) => sum + p.rawVendorCommitments, 0);
        const avgGrossMargin =
          totalInvoicedSum > 0 ? ((totalInvoicedSum - totalVendorCommitmentsSum) / totalInvoicedSum) * 100 : 0;

        reply.header('Cache-Control', 'private, max-age=2');
        return {
          success: true,
          tabs,
          activeTab: tab,
          activeStatus: status,
          statusTabs: tab === 'ongoing' ? ongoingStatusTabs : finalisedStatusTabs,
          summary: {
            totalBudget: `₹${(totalBudgetSum / 10000000).toFixed(2)} Cr`,
            totalInvoiced: formatInr(totalInvoicedSum),
            totalVendorCommitments: formatInr(totalVendorCommitmentsSum),
            averageGrossMargin: `${avgGrossMargin.toFixed(1)}%`,
          },
          data: {
            ongoing: ongoingAll,
            finalised: finalisedAll,
            activeList,
          },
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 3. GET /api/billing/projects/:id - Full Financial Dossier (Bills, Extras, Invoices, Changelog, Awarded Quotes)
  fastify.get('/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      // 1. Fetch wedding by UUID or Code
      const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
      const [w] = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          brideName: clients.brideName,
          groomName: clients.groomName,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          city: weddings.destinationCity,
          venue: weddings.primaryVenue,
          startDate: weddings.startDate,
          endDate: weddings.endDate,
          guestCount: weddings.estimatedGuestCount,
          actualHeadcount: weddings.actualBanquetHeadcount,
          packageType: weddings.packageType,
          status: weddings.status,
          totalBudget: weddings.totalBudget,
          agencyFee: weddings.agencyFee,
          coordinator: users.fullName,
          coordinatorRole: users.role,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .where(condition)
        .limit(1);

      if (!w) {
        reply.status(404);
        return { success: false, message: `Project '${id}' not found` };
      }

      const weddingUuid = w.id;

      // 2. Fetch Extra Charges
      const extrasRows = await db
        .select({
          id: weddingExtraCharges.id,
          category: weddingExtraCharges.category,
          description: weddingExtraCharges.description,
          quantity: weddingExtraCharges.quantity,
          unitRate: weddingExtraCharges.unitRate,
          totalAmount: weddingExtraCharges.totalAmount,
          vendorId: weddingExtraCharges.vendorId,
          vendorName: vendors.businessName,
          isBilledToClient: weddingExtraCharges.isBilledToClient,
          approvedByName: users.fullName,
          createdAt: weddingExtraCharges.createdAt,
        })
        .from(weddingExtraCharges)
        .leftJoin(vendors, eq(weddingExtraCharges.vendorId, vendors.id))
        .leftJoin(users, eq(weddingExtraCharges.approvedBy, users.id))
        .where(eq(weddingExtraCharges.weddingId, weddingUuid))
        .orderBy(asc(weddingExtraCharges.createdAt));

      const extraCharges: ExtraChargeItem[] = extrasRows.map((r, idx) => {
        const totalNum = parseFloat(r.totalAmount) || 0;
        return {
          id: `EXT-0${idx + 1}`,
          dbId: r.id,
          category: r.category,
          description: r.description,
          qty: parseFloat(r.quantity) || 1,
          unitPrice: formatInr(parseFloat(r.unitRate) || 0),
          total: formatInr(totalNum),
          rawTotal: totalNum,
          vendor: r.vendorName || 'Preferred Vendor',
          vendorId: r.vendorId || undefined,
          isBilledToClient: !!r.isBilledToClient,
          status: 'ADDED_TO_CLIENT_INVOICE',
          approvedBy: r.approvedByName || w.coordinator || 'Lead Planner',
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : undefined,
        };
      });

      // 3. Fetch Vendor Bills (Purchases / Disbursements Ledger)
      const billsRows = await db
        .select({
          id: vendorBills.id,
          vendorId: vendorBills.vendorId,
          vendorName: vendors.businessName,
          category: vendors.category,
          contactPerson: vendors.contactPerson,
          phone: vendors.phone,
          agreedBaseAmount: vendorBills.agreedBaseAmount,
          extraChargesAmount: vendorBills.extraChargesAmount,
          totalPayable: vendorBills.totalPayable,
          advancePaid: vendorBills.advancePaid,
          balanceDue: vendorBills.balanceDue,
          status: vendorBills.status,
          awardedQuoteId: vendorBills.awardedQuoteId,
          settledAt: vendorBills.settledAt,
          createdAt: vendorBills.createdAt,
        })
        .from(vendorBills)
        .innerJoin(vendors, eq(vendorBills.vendorId, vendors.id))
        .where(eq(vendorBills.weddingId, weddingUuid))
        .orderBy(desc(vendorBills.totalPayable));

      const vendorBillsList: VendorDisbursementItem[] = billsRows.map((r) => {
        const baseNum = parseFloat(r.agreedBaseAmount) || 0;
        const extrasNum = parseFloat(r.extraChargesAmount) || 0;
        const payableNum = parseFloat(r.totalPayable) || (baseNum + extrasNum);
        const advNum = parseFloat(r.advancePaid) || 0;
        const balNum = parseFloat(r.balanceDue) || Math.max(0, payableNum - advNum);

        return {
          id: r.id,
          vendorId: r.vendorId,
          vendor: r.vendorName,
          category: r.category,
          contactPerson: r.contactPerson || undefined,
          phone: r.phone || undefined,
          agreedBase: formatInr(baseNum),
          rawAgreedBase: baseNum,
          extras: extrasNum > 0 ? `+${formatInr(extrasNum)}` : '₹0',
          rawExtras: extrasNum,
          totalPayable: formatInr(payableNum),
          rawTotalPayable: payableNum,
          advancePaid: formatInr(advNum),
          rawAdvancePaid: advNum,
          balanceDue: formatInr(balNum),
          rawBalanceDue: balNum,
          status: (r.status as VendorDisbursementItem['status']) || 'PENDING',
          awardedQuoteId: r.awardedQuoteId || undefined,
          settledAt: r.settledAt ? new Date(r.settledAt).toLocaleDateString('en-IN') : undefined,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : undefined,
        };
      });

      // 4. Fetch Client Milestone Invoices
      const invoicesRows = await db
        .select({
          id: clientInvoices.id,
          invoiceNumber: clientInvoices.invoiceNumber,
          stageKey: clientInvoices.stageKey,
          amountDue: clientInvoices.amountDue,
          dueDate: clientInvoices.dueDate,
          status: clientInvoices.status,
          paidAmount: clientInvoices.paidAmount,
          paidAt: clientInvoices.paidAt,
          paymentReference: clientInvoices.paymentReference,
        })
        .from(clientInvoices)
        .where(eq(clientInvoices.weddingId, weddingUuid))
        .orderBy(asc(clientInvoices.dueDate));

      // Fetch dynamic payment stages from master_options in DB
      const masterPaymentStages = await db
        .select({
          key: masterOptions.optionKey,
          label: masterOptions.label,
        })
        .from(masterOptions)
        .where(eq(masterOptions.category, 'PAYMENT_STAGE'));

      const stageLabelMap = new Map(masterPaymentStages.map((s) => [s.key, s.label]));

      const invoices: ClientInvoiceItem[] = invoicesRows.map((r) => {
        let pct = 30;
        if (r.stageKey === 'BOOKING_DEPOSIT') pct = 20;
        else if (r.stageKey === 'PRE_WEDDING_ADVANCE') pct = 50;

        const stageLabel =
          stageLabelMap.get(r.stageKey) ||
          (r.stageKey === 'BOOKING_DEPOSIT'
            ? 'Booking Deposit (20%)'
            : r.stageKey === 'PRE_WEDDING_ADVANCE'
            ? '30-Day Pre-Wedding Advance (50%)'
            : 'Post-Event Final Settlement (30% + Extras)');

        const dueNum = parseFloat(r.amountDue) || 0;
        const paidNum = parseFloat(r.paidAmount || '0') || 0;

        return {
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          stageKey: r.stageKey,
          stageLabel,
          percentage: pct,
          amountDue: formatInr(dueNum),
          rawAmountDue: dueNum,
          dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Due on Event',
          status: (r.status as ClientInvoiceItem['status']) || 'UNPAID',
          paidAmount: formatInr(paidNum),
          rawPaidAmount: paidNum,
          paidAt: r.paidAt ? new Date(r.paidAt).toLocaleString('en-IN') : undefined,
          paymentReference: r.paymentReference || undefined,
        };
      });

      // 5. Fetch Winning RFQ Quotes for this Wedding available to be billed
      const awardedQuotesRows = await db
        .select({
          quoteId: vendorQuotes.id,
          rfqId: rfqRequests.id,
          serviceCategory: rfqRequests.serviceCategory,
          description: rfqRequests.description,
          vendorId: vendors.id,
          vendorName: vendors.businessName,
          baseCost: vendorQuotes.baseCost,
          pricePerPlate: vendorQuotes.pricePerPlate,
          quoteStatus: vendorQuotes.status,
        })
        .from(rfqRequests)
        .innerJoin(vendorQuotes, eq(vendorQuotes.rfqId, rfqRequests.id))
        .innerJoin(vendors, eq(vendorQuotes.vendorId, vendors.id))
        .where(
          and(
            eq(rfqRequests.weddingId, weddingUuid),
            or(eq(vendorQuotes.status, 'AWARDED'), eq(vendorQuotes.status, 'ACCEPTED'), eq(vendorQuotes.status, 'SHORTLISTED'))
          )
        );

      // Check which quotes already have bills
      const existingBilledQuoteIds = new Set(billsRows.map((b) => b.awardedQuoteId).filter(Boolean));
      const availableQuotes = awardedQuotesRows.map((q) => ({
        ...q,
        isBilled: existingBilledQuoteIds.has(q.quoteId),
        formattedCost: formatInr(parseFloat(q.baseCost) || 0),
      }));

      // 6. Fetch Billing Change Logs (Audit Trail)
      const changelogRows = await db
        .select()
        .from(billingChangeLogs)
        .where(eq(billingChangeLogs.weddingId, weddingUuid))
        .orderBy(desc(billingChangeLogs.createdAt));

      const changelog: BillingChangelogItem[] = changelogRows.map((c) => ({
        id: c.id,
        action: c.action,
        entityType: c.entityType,
        entityId: c.entityId || undefined,
        fromStatus: c.fromStatus || undefined,
        toStatus: c.toStatus || undefined,
        amount: c.amount ? formatInr(parseFloat(c.amount)) : undefined,
        performedBy: c.performedBy || 'System',
        notes: c.notes || undefined,
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
      }));

      // Extract final signoff from changelog if project finalised
      const finalSignoffLog = changelogRows.find((c) => c.action === 'PROJECT_FINALISED');

      // Aggregations
      const baseContractNum = parseFloat(w.totalBudget) || 0;
      const totalExtrasNum = extraCharges.reduce((sum, e) => sum + e.rawTotal, 0);
      const totalInvoicedNum = baseContractNum + totalExtrasNum;
      const totalVendorPayable = vendorBillsList.reduce((sum, b) => sum + b.rawTotalPayable, 0);
      const totalVendorAdvance = vendorBillsList.reduce((sum, b) => sum + b.rawAdvancePaid, 0);
      const totalVendorBalance = vendorBillsList.reduce((sum, b) => sum + b.rawBalanceDue, 0);

      const isFinal = w.status === 'FINALISED' || w.status === 'FINALISED_SETTLED';
      const grossMarginNum =
        totalInvoicedNum > 0 ? ((totalInvoicedNum - totalVendorPayable) / totalInvoicedNum) * 100 : 0;

      const coupleStr =
        w.brideName && w.groomName ? `${w.brideName} & ${w.groomName}` : 'Royal Couple';

      const finalisedDate = isFinal
        ? finalSignoffLog?.createdAt
          ? new Date(finalSignoffLog.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Concluded'
        : undefined;
      const finalisedBy = isFinal ? finalSignoffLog?.performedBy || 'Finance Director' : undefined;

      const project: ProjectBillingData = {
        id: w.id,
        code: w.code,
        couple: coupleStr,
        brideName: w.brideName || '',
        groomName: w.groomName || '',
        clientEmail: w.clientEmail || '',
        clientPhone: w.clientPhone || '',
        city: w.city || 'Jaipur',
        venue: w.venue || 'Palace Venue',
        startDate: w.startDate
          ? new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Scheduled',
        endDate: w.endDate ? String(w.endDate) : undefined,
        guestCount: w.actualHeadcount || w.guestCount || 400,
        actualHeadcount: w.actualHeadcount || undefined,
        packageType: w.packageType || 'Full-Service Royal Wedding',
        status: w.status,
        isFinalised: isFinal,
        finalisedDate,
        finalisedBy,
        budget: `₹${(baseContractNum / 10000000).toFixed(2)} Cr`,
        rawBudget: baseContractNum,
        coordinator: w.coordinator || 'Lead Planner',
        baseContract: formatInr(baseContractNum),
        rawBaseContract: baseContractNum,
        totalExtras: formatInr(totalExtrasNum),
        rawTotalExtras: totalExtrasNum,
        extrasCount: extraCharges.length,
        totalInvoiced: formatInr(totalInvoicedNum),
        rawTotalInvoiced: totalInvoicedNum,
        vendorCommitments: formatInr(totalVendorPayable),
        rawVendorCommitments: totalVendorPayable,
        vendorAdvancePaid: formatInr(totalVendorAdvance),
        rawVendorAdvancePaid: totalVendorAdvance,
        vendorBalanceDue: isFinal && w.status === 'FINALISED_SETTLED' ? '₹0 (Settled)' : formatInr(totalVendorBalance),
        rawVendorBalanceDue: totalVendorBalance,
        grossMargin: `${grossMarginNum.toFixed(1)}%`,
        billsCount: vendorBillsList.length,
        extraCharges,
        vendorBills: vendorBillsList,
        invoices,
        availableQuotes,
        changelog,
      };

      return {
        success: true,
        data: project,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 4. POST /api/billing/projects/:id/vendor-bills - Add manual Vendor Bill
  fastify.post(
    '/projects/:id/vendor-bills',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          vendorId: string;
          category?: string;
          agreedBaseAmount: number | string;
          advancePaid?: number | string;
          awardedQuoteId?: string;
          notes?: string;
          performedBy?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const {
        vendorId,
        agreedBaseAmount,
        advancePaid = 0,
        awardedQuoteId,
        notes = 'Vendor bill created in financial ledger',
        performedBy = 'Finance Manager',
      } = request.body || {};

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db.select({ id: weddings.id, code: weddings.code }).from(weddings).where(condition).limit(1);
        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const baseNum = Number(agreedBaseAmount) || 0;
        const advNum = Number(advancePaid) || 0;
        const balanceNum = Math.max(0, baseNum - advNum);
        const status = advNum >= baseNum ? 'SETTLEMENT_CLEARED' : advNum > 0 ? 'RECONCILED_MATCHED' : 'PENDING';

        const [createdBill] = await db
          .insert(vendorBills)
          .values({
            weddingId: w.id,
            vendorId,
            awardedQuoteId: awardedQuoteId || null,
            agreedBaseAmount: String(baseNum),
            extraChargesAmount: '0.00',
            totalPayable: String(baseNum),
            advancePaid: String(advNum),
            balanceDue: String(balanceNum),
            status,
          })
          .returning();

        // Write to audit changelog
        await db.insert(billingChangeLogs).values({
          weddingId: w.id,
          action: 'BILL_CREATED',
          entityType: 'VENDOR_BILL',
          entityId: createdBill.id,
          toStatus: status,
          amount: String(baseNum),
          performedBy,
          notes: notes || `Created vendor bill for ${formatInr(baseNum)}`,
        });

        return {
          success: true,
          message: 'Vendor bill added to ledger successfully',
          data: createdBill,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 5. POST /api/billing/projects/:id/sync-awarded-quotes - Automatically bill winning RFQ quotes
  fastify.post(
    '/projects/:id/sync-awarded-quotes',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db.select({ id: weddings.id, code: weddings.code }).from(weddings).where(condition).limit(1);
        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        // Find awarded quotes
        const awardedQuotes = await db
          .select({
            quoteId: vendorQuotes.id,
            vendorId: vendors.id,
            vendorName: vendors.businessName,
            baseCost: vendorQuotes.baseCost,
            category: rfqRequests.serviceCategory,
          })
          .from(rfqRequests)
          .innerJoin(vendorQuotes, eq(vendorQuotes.rfqId, rfqRequests.id))
          .innerJoin(vendors, eq(vendorQuotes.vendorId, vendors.id))
          .where(
            and(
              eq(rfqRequests.weddingId, w.id),
              or(eq(vendorQuotes.status, 'AWARDED'), eq(vendorQuotes.status, 'ACCEPTED'))
            )
          );

        if (awardedQuotes.length === 0) {
          return {
            success: true,
            syncedCount: 0,
            message: 'No unbilled awarded quotes found in RFQs for this wedding project.',
          };
        }

        // Check already billed quotes
        const existingBills = await db
          .select({ awardedQuoteId: vendorBills.awardedQuoteId })
          .from(vendorBills)
          .where(eq(vendorBills.weddingId, w.id));
        const billedSet = new Set(existingBills.map((b) => b.awardedQuoteId).filter(Boolean));

        let createdCount = 0;
        for (const q of awardedQuotes) {
          if (!billedSet.has(q.quoteId)) {
            const baseCostNum = parseFloat(q.baseCost) || 0;
            const [bill] = await db
              .insert(vendorBills)
              .values({
                weddingId: w.id,
                vendorId: q.vendorId,
                awardedQuoteId: q.quoteId,
                agreedBaseAmount: String(baseCostNum),
                extraChargesAmount: '0.00',
                totalPayable: String(baseCostNum),
                advancePaid: '0.00',
                balanceDue: String(baseCostNum),
                status: 'PENDING',
              })
              .returning();

            await db.insert(billingChangeLogs).values({
              weddingId: w.id,
              action: 'QUOTE_AUTO_BILLED',
              entityType: 'VENDOR_BILL',
              entityId: bill.id,
              toStatus: 'PENDING',
              amount: String(baseCostNum),
              performedBy: 'Procurement Engine Sync',
              notes: `Auto-billed winning ${q.category} quote for ${q.vendorName} (${formatInr(baseCostNum)})`,
            });

            createdCount++;
          }
        }

        return {
          success: true,
          syncedCount: createdCount,
          message: `Successfully synchronized ${createdCount} winning vendor quote(s) into billing ledger.`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 6. PUT /api/billing/projects/:id/vendor-bills/:billId/reconcile - Reconcile & Record Payment
  fastify.put(
    '/projects/:id/vendor-bills/:billId/reconcile',
    async (
      request: FastifyRequest<{
        Params: { id: string; billId: string };
        Body: {
          paymentAmount?: number | string;
          paymentReference?: string;
          status?: 'PENDING' | 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
          notes?: string;
          performedBy?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id, billId } = request.params;
      const {
        paymentAmount,
        paymentReference = 'NEFT/RTGS Settlement',
        status,
        notes = 'Payment reconciled and updated',
        performedBy = 'Devika Sharma (Finance Manager)',
      } = request.body || {};

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db.select({ id: weddings.id, code: weddings.code }).from(weddings).where(condition).limit(1);
        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const [existingBill] = await db.select().from(vendorBills).where(eq(vendorBills.id, billId)).limit(1);
        if (!existingBill) {
          reply.status(404);
          return { success: false, message: `Bill ${billId} not found` };
        }

        const currentAdvance = parseFloat(existingBill.advancePaid) || 0;
        const totalPayable = parseFloat(existingBill.totalPayable) || 0;
        const additionalPay = Number(paymentAmount) || 0;

        const newAdvance = currentAdvance + additionalPay;
        const newBalance = Math.max(0, totalPayable - newAdvance);

        let targetStatus = status || existingBill.status;
        if (newBalance === 0) {
          targetStatus = 'SETTLEMENT_CLEARED';
        } else if (newAdvance > 0) {
          targetStatus = 'RECONCILED_MATCHED';
        }

        const [updatedBill] = await db
          .update(vendorBills)
          .set({
            advancePaid: String(newAdvance),
            balanceDue: String(newBalance),
            status: targetStatus,
            settledAt: newBalance === 0 ? new Date() : existingBill.settledAt,
          })
          .where(eq(vendorBills.id, billId))
          .returning();

        // Write to audit changelog
        await db.insert(billingChangeLogs).values({
          weddingId: w.id,
          action: targetStatus === 'SETTLEMENT_CLEARED' ? 'SETTLEMENT_CLEARED' : 'BILL_RECONCILED',
          entityType: 'VENDOR_BILL',
          entityId: billId,
          fromStatus: existingBill.status,
          toStatus: targetStatus,
          amount: String(additionalPay > 0 ? additionalPay : newAdvance),
          performedBy,
          notes: `${notes} [Ref: ${paymentReference}]`,
        });

        return {
          success: true,
          message: 'Vendor disbursement successfully reconciled',
          data: updatedBill,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 7. POST /api/billing/projects/:id/extras - Insert extra charge and reflect in vendor bill & client settlement
  fastify.post(
    '/projects/:id/extras',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          category: string;
          description: string;
          qty: number | string;
          unitPrice: number | string;
          vendor?: string;
          vendorId?: string;
          performedBy?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const {
        category = 'EXTRA_PLATES',
        description,
        qty = 60,
        unitPrice = 2100,
        vendor = 'Marwar Heritage Kitchens',
        vendorId,
        performedBy = 'Devika Sharma',
      } = request.body || {};

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db.select({ id: weddings.id, code: weddings.code }).from(weddings).where(condition).limit(1);
        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const quantityNum = Number(qty) || 1;
        const unitRateNum = Number(unitPrice) || 0;
        const totalAmountNum = quantityNum * unitRateNum;

        // Resolve vendor
        let resolvedVendorId = vendorId;
        if (!resolvedVendorId && vendor) {
          const [foundVendor] = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(ilike(vendors.businessName, `%${vendor.trim()}%`))
            .limit(1);
          if (foundVendor) resolvedVendorId = foundVendor.id;
        }

        // Insert into weddingExtraCharges
        const [createdExtra] = await db
          .insert(weddingExtraCharges)
          .values({
            weddingId: w.id,
            category,
            description: description || `${quantityNum} Extra Banquet Plates @ ${formatInr(unitRateNum)}`,
            quantity: String(quantityNum),
            unitRate: String(unitRateNum),
            totalAmount: String(totalAmountNum),
            vendorId: resolvedVendorId || null,
            isBilledToClient: true,
          })
          .returning();

        // If vendor bill exists, append extra charges to vendor bill total payable
        if (resolvedVendorId) {
          const [matchingBill] = await db
            .select()
            .from(vendorBills)
            .where(and(eq(vendorBills.weddingId, w.id), eq(vendorBills.vendorId, resolvedVendorId)))
            .limit(1);

          if (matchingBill) {
            const currentExtras = parseFloat(matchingBill.extraChargesAmount) || 0;
            const currentTotal = parseFloat(matchingBill.totalPayable) || 0;
            const currentBal = parseFloat(matchingBill.balanceDue) || 0;

            await db
              .update(vendorBills)
              .set({
                extraChargesAmount: String(currentExtras + totalAmountNum),
                totalPayable: String(currentTotal + totalAmountNum),
                balanceDue: String(currentBal + totalAmountNum),
              })
              .where(eq(vendorBills.id, matchingBill.id));
          }
        }

        // Write to audit changelog
        await db.insert(billingChangeLogs).values({
          weddingId: w.id,
          action: 'EXTRA_CHARGE_ADDED',
          entityType: 'EXTRA_CHARGE',
          entityId: createdExtra.id,
          amount: String(totalAmountNum),
          performedBy,
          notes: `Added extra charge: ${description} (${formatInr(totalAmountNum)})`,
        });

        return {
          success: true,
          message: 'Extra charge audited and added to client billing and vendor ledger',
          data: createdExtra,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 8. PUT /api/billing/projects/:id/pay-invoice - Mark client milestone invoice as PAID
  fastify.put(
    '/projects/:id/pay-invoice',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          invoiceId: string;
          paidAmount?: number | string;
          paymentReference?: string;
          performedBy?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const {
        invoiceId,
        paidAmount,
        paymentReference = 'HDFC-RTGS-AUTO',
        performedBy = 'Aditya Singhal (Finance Director)',
      } = request.body || {};

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db.select({ id: weddings.id, code: weddings.code }).from(weddings).where(condition).limit(1);
        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const [existingInvoice] = await db
          .select()
          .from(clientInvoices)
          .where(and(eq(clientInvoices.id, invoiceId), eq(clientInvoices.weddingId, w.id)))
          .limit(1);

        if (!existingInvoice) {
          reply.status(404);
          return { success: false, message: `Invoice ${invoiceId} not found` };
        }

        const finalPaid = paidAmount ? String(paidAmount) : existingInvoice.amountDue;

        const [updatedInvoice] = await db
          .update(clientInvoices)
          .set({
            status: 'PAID',
            paidAmount: finalPaid,
            paidAt: new Date(),
            paymentReference,
          })
          .where(eq(clientInvoices.id, invoiceId))
          .returning();

        // Write to audit changelog
        await db.insert(billingChangeLogs).values({
          weddingId: w.id,
          action: 'INVOICE_PAID',
          entityType: 'CLIENT_INVOICE',
          entityId: invoiceId,
          fromStatus: existingInvoice.status,
          toStatus: 'PAID',
          amount: finalPaid,
          performedBy,
          notes: `Settled milestone invoice ${existingInvoice.invoiceNumber} (${formatInr(parseFloat(finalPaid))}) via ${paymentReference}`,
        });

        return {
          success: true,
          message: 'Client milestone invoice payment successfully recorded',
          data: updatedInvoice,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 9. PUT /api/billing/projects/:id/finalise - Finalise project and lock ledger
  fastify.put(
    '/projects/:id/finalise',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          notes?: string;
          performedBy?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { notes = 'All vendor accounts and client milestone invoices settled', performedBy = 'Aditya Singhal (Super Admin)' } =
        request.body || {};

      try {
        const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
        const [w] = await db
          .select({ id: weddings.id, code: weddings.code, status: weddings.status })
          .from(weddings)
          .where(condition)
          .limit(1);

        if (!w) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const [updatedWedding] = await db
          .update(weddings)
          .set({
            status: 'FINALISED_SETTLED',
            updatedAt: new Date(),
          })
          .where(eq(weddings.id, w.id))
          .returning();

        // Write to audit changelog
        await db.insert(billingChangeLogs).values({
          weddingId: w.id,
          action: 'PROJECT_FINALISED',
          entityType: 'SETTLEMENT',
          fromStatus: w.status,
          toStatus: 'FINALISED_SETTLED',
          performedBy,
          notes: `Project ${w.code} signed off as FINALISED & SETTLED. ${notes}`,
        });

        return {
          success: true,
          message: `Project ${w.code} has been finalised and locked in the financial registry.`,
          data: updatedWedding,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reply.status(500);
        return { success: false, error: msg };
      }
    }
  );

  // 10. GET /api/billing/projects/:id/changelog - Get live changelog audit trail
  fastify.get('/projects/:id/changelog', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);
      const [w] = await db.select({ id: weddings.id }).from(weddings).where(condition).limit(1);
      if (!w) {
        reply.status(404);
        return { success: false, message: `Project ${id} not found` };
      }

      const logs = await db
        .select()
        .from(billingChangeLogs)
        .where(eq(billingChangeLogs.weddingId, w.id))
        .orderBy(desc(billingChangeLogs.createdAt));

      return {
        success: true,
        data: logs.map((l) => ({
          ...l,
          amountFormatted: l.amount ? formatInr(parseFloat(l.amount)) : undefined,
          dateFormatted: l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : undefined,
        })),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, error: msg };
    }
  });
}
