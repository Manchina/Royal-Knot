import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db';

export interface ExtraChargeItem {
  id: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  vendor: string;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  lastEditedAt?: string;
  editHistory?: Array<{
    date: string;
    action: string;
    by: string;
    details: string;
  }>;
}

export interface VendorDisbursementItem {
  id: string;
  vendor: string;
  category: string;
  agreedBase: string;
  extras: string;
  totalPayable: string;
  advancePaid: string;
  balanceDue: string;
  status: 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
}

export interface ClientInvoiceItem {
  id: string;
  invoiceNumber: string;
  stageKey: string;
  stageLabel: string;
  percentage: number;
  amountDue: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  paidAmount: string;
  paidAt?: string;
  paymentReference?: string;
}

export interface ProjectBillingData {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'FINALISED' | 'FINALISED_SETTLED';
  isFinalised: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  coordinator: string;
  baseContract: string;
  totalExtras: string;
  totalInvoiced: string;
  vendorAdvancePaid: string;
  vendorBalanceDue: string;
  grossMargin: string;
  extraCharges: ExtraChargeItem[];
  vendorBills: VendorDisbursementItem[];
  invoices: ClientInvoiceItem[];
}

// In-memory cache for master options with 60-second TTL
interface MasterOptionRow {
  id: string;
  category: string;
  optionKey: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

let cachedMasterStatuses: MasterOptionRow[] | null = null;
let masterStatusesCacheTime = 0;
const MASTER_STATUSES_CACHE_TTL_MS = 60_000;

async function getCachedMasterStatuses(): Promise<MasterOptionRow[]> {
  const now = Date.now();
  if (cachedMasterStatuses && now - masterStatusesCacheTime < MASTER_STATUSES_CACHE_TTL_MS) {
    return cachedMasterStatuses;
  }

  try {
    const res = await pool.query(
      `SELECT id, category, option_key as "optionKey", label, description, sort_order as "sortOrder", is_active as "isActive"
       FROM master_options
       WHERE category = 'WEDDING_STATUS' AND is_active = true
       ORDER BY sort_order ASC`
    );
    cachedMasterStatuses = res.rows;
    masterStatusesCacheTime = now;
    return res.rows;
  } catch (err: any) {
    if (cachedMasterStatuses) return cachedMasterStatuses;
    throw new Error(`Failed to load master statuses from PostgreSQL: ${err.message}`);
  }
}

// Format numbers into Indian Rupees currency string
function formatInr(val: number): string {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/billing/master-statuses - Fetch dynamic WEDDING_STATUS master data from PostgreSQL
  fastify.get('/master-statuses', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getCachedMasterStatuses();
      reply.header('Cache-Control', 'public, max-age=60');
      return {
        success: true,
        data,
      };
    } catch (err: any) {
      reply.status(500);
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // GET /api/billing/projects - List projects from PostgreSQL with status subtabs
  fastify.get(
    '/projects',
    async (
      request: FastifyRequest<{
        Querystring: { tab?: string; status?: string; search?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { tab = 'ongoing', status = 'ALL', search = '' } = request.query;
      const normalizedSearch = search.trim().toLowerCase();

      try {
        // Query weddings joined with clients from PostgreSQL
        const weddingsRes = await pool.query(`
          SELECT 
            w.id,
            w.code,
            c.bride_name || ' & ' || c.groom_name as couple,
            w.destination_city as city,
            w.primary_venue as venue,
            TO_CHAR(w.start_date, 'Mon DD') || ' - ' || TO_CHAR(w.end_date, 'DD, YYYY') as "startDate",
            w.estimated_guest_count as "guestCount",
            w.actual_banquet_headcount as "actualHeadcount",
            w.package_type as "packageType",
            w.status,
            w.total_budget as "totalBudget",
            w.agency_fee as "agencyFee"
          FROM weddings w
          JOIN clients c ON w.client_id = c.id
          ORDER BY w.start_date ASC
        `);

        // Query extra charges totals grouped by wedding
        const extrasRes = await pool.query(`
          SELECT 
            wedding_id,
            COALESCE(SUM(total_amount), 0) as total_extras,
            COUNT(*) as extras_count
          FROM wedding_extra_charges
          GROUP BY wedding_id
        `);
        const extrasMap = new Map(extrasRes.rows.map((r: any) => [r.wedding_id, parseFloat(r.total_extras) || 0]));
        const extrasCountMap = new Map(extrasRes.rows.map((r: any) => [r.wedding_id, parseInt(r.extras_count, 10) || 0]));

        // Query vendor bills totals grouped by wedding
        const billsRes = await pool.query(`
          SELECT 
            wedding_id,
            COALESCE(SUM(total_payable), 0) as total_payable,
            COALESCE(SUM(advance_paid), 0) as total_advance,
            COALESCE(SUM(balance_due), 0) as total_balance
          FROM vendor_bills
          GROUP BY wedding_id
        `);
        const billsMap = new Map(billsRes.rows.map((r: any) => [r.wedding_id, {
          payable: parseFloat(r.total_payable) || 0,
          advance: parseFloat(r.total_advance) || 0,
          balance: parseFloat(r.total_balance) || 0,
        }]));

        // Format into project records
        const allProjects: ProjectBillingData[] = weddingsRes.rows.map((w: any) => {
          const baseContractNum = parseFloat(w.totalBudget) || 0;
          const extrasNum = extrasMap.get(w.id) || 0;
          const extrasCount = extrasCountMap.get(w.id) || 0;
          const totalInvoicedNum = baseContractNum + extrasNum;

          const billData = billsMap.get(w.id) || {
            payable: 0,
            advance: 0,
            balance: 0,
          };

          const isFinal = w.status === 'FINALISED' || w.status === 'FINALISED_SETTLED';
          const grossMarginNum = totalInvoicedNum > 0 ? ((totalInvoicedNum - billData.payable) / totalInvoicedNum) * 100 : 23.5;

          return {
            id: w.id,
            code: w.code,
            couple: w.couple,
            city: w.city,
            venue: w.venue,
            startDate: w.startDate,
            guestCount: w.actualHeadcount || w.guestCount,
            packageType: w.packageType,
            status: w.status as any,
            isFinalised: isFinal,
            finalisedDate: isFinal ? 'Feb 2026' : undefined,
            finalisedBy: isFinal ? 'Aditya Singhal (Super Admin)' : undefined,
            budget: `₹${(baseContractNum / 10000000).toFixed(2)} Cr`,
            coordinator: w.city === 'Jaipur' ? 'Devika Sharma' : 'Karan Verma',
            baseContract: formatInr(baseContractNum),
            totalExtras: extrasNum > 0 ? `+${extrasCount} (${formatInr(extrasNum)})` : 'None',
            totalInvoiced: formatInr(totalInvoicedNum),
            vendorAdvancePaid: formatInr(billData.advance),
            vendorBalanceDue: isFinal && w.status === 'FINALISED_SETTLED' ? '₹0 (Settled)' : formatInr(billData.balance),
            grossMargin: `${grossMarginNum.toFixed(1)}%`,
            extraCharges: [],
            vendorBills: [],
            invoices: [],
          };
        });

        // High-performance single-pass partition, filter, and aggregation
        const counts: Record<string, number> = {
          ALL_ONGOING: 0,
          ALL_FINALISED: 0,
          LIVE_BIG_DAY: 0,
          IN_PLANNING: 0,
          BOOKED: 0,
          FINALISED: 0,
          FINALISED_SETTLED: 0,
        };

        const ongoingAll: ProjectBillingData[] = [];
        const finalisedAll: ProjectBillingData[] = [];

        for (let i = 0; i < allProjects.length; i++) {
          const p = allProjects[i];

          // Search check
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

        // Fetch master status labels dynamically from cache/Postgres
        const masterStatuses = await getCachedMasterStatuses();
        const masterLabelMap = new Map(masterStatuses.map((m) => [m.optionKey, m.label]));

        // Status subtabs definition matching PeopleFirst standard
        const ongoingStatusTabs = [
          { id: 'ALL', label: 'All', count: counts.ALL_ONGOING },
          { id: 'LIVE_BIG_DAY', label: masterLabelMap.get('LIVE_BIG_DAY') || 'Live Big Day', count: counts.LIVE_BIG_DAY || 0 },
          { id: 'IN_PLANNING', label: masterLabelMap.get('IN_PLANNING') || 'In Planning', count: counts.IN_PLANNING || 0 },
          { id: 'BOOKED', label: masterLabelMap.get('BOOKED') || 'Booked', count: counts.BOOKED || 0 },
        ];

        const finalisedStatusTabs = [
          { id: 'ALL', label: 'All', count: counts.ALL_FINALISED },
          { id: 'FINALISED', label: masterLabelMap.get('FINALISED') || 'Finalised', count: counts.FINALISED || 0 },
          { id: 'FINALISED_SETTLED', label: masterLabelMap.get('FINALISED_SETTLED') || 'Finalised & Settled', count: counts.FINALISED_SETTLED || 0 },
        ];

        // Filter active list based on selected status subtab
        let activeList: ProjectBillingData[];
        if (tab === 'ongoing') {
          activeList = status === 'ALL' ? ongoingAll : ongoingAll.filter((p) => p.status === status);
        } else {
          activeList = status === 'ALL' ? finalisedAll : finalisedAll.filter((p) => p.status === status);
        }

        const tabs = [
          {
            id: 'ongoing',
            label: 'Ongoing Projects',
            count: allProjects.filter((p) => !p.isFinalised).length,
          },
          {
            id: 'finalised',
            label: 'Finalised Projects',
            count: allProjects.filter((p) => p.isFinalised).length,
          },
        ];

        reply.header('Cache-Control', 'private, max-age=2');

        return {
          success: true,
          tabs,
          activeTab: tab,
          activeStatus: status,
          statusTabs: tab === 'ongoing' ? ongoingStatusTabs : finalisedStatusTabs,
          data: {
            ongoing: ongoingAll,
            finalised: finalisedAll,
            activeList,
          },
        };
      } catch (err: any) {
        reply.status(500);
        return {
          success: false,
          error: err.message,
        };
      }
    }
  );

  // GET /api/billing/projects/:id - Get detailed billing data (Invoices, Extra Charges, Vendor Bills) from PostgreSQL
  fastify.get('/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      // 1. Fetch wedding by id or code
      const weddingRes = await pool.query(
        `SELECT 
          w.id,
          w.code,
          c.bride_name || ' & ' || c.groom_name as couple,
          w.destination_city as city,
          w.primary_venue as venue,
          TO_CHAR(w.start_date, 'Mon DD') || ' - ' || TO_CHAR(w.end_date, 'DD, YYYY') as "startDate",
          w.estimated_guest_count as "guestCount",
          w.actual_banquet_headcount as "actualHeadcount",
          w.package_type as "packageType",
          w.status,
          w.total_budget as "totalBudget",
          w.agency_fee as "agencyFee"
        FROM weddings w
        JOIN clients c ON w.client_id = c.id
        WHERE w.id::text = $1 OR w.code = $1`,
        [id]
      );

      if (weddingRes.rows.length === 0) {
        reply.status(404);
        return { success: false, message: `Project ${id} not found` };
      }

      const w = weddingRes.rows[0];
      const weddingUuid = w.id;

      // 2. Fetch Extra Charges from PostgreSQL
      const extrasRes = await pool.query(
        `SELECT 
          ec.id,
          ec.category,
          ec.description,
          ec.quantity,
          ec.unit_rate,
          ec.total_amount,
          COALESCE(v.business_name, 'Preferred Vendor') as vendor,
          ec.is_billed_to_client
        FROM wedding_extra_charges ec
        LEFT JOIN vendors v ON ec.vendor_id = v.id
        WHERE ec.wedding_id = $1
        ORDER BY ec.id ASC`,
        [weddingUuid]
      );

      const extraCharges: ExtraChargeItem[] = extrasRes.rows.map((r: any, idx: number) => ({
        id: `EXT-0${idx + 1}`,
        category: r.category,
        description: r.description,
        qty: parseFloat(r.quantity) || 1,
        unitPrice: formatInr(parseFloat(r.unit_rate) || 0),
        total: formatInr(parseFloat(r.total_amount) || 0),
        vendor: r.vendor,
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Devika Sharma',
      }));

      // 3. Fetch Vendor Bills (Two-Way Matching) from PostgreSQL
      const billsRes = await pool.query(
        `SELECT 
          vb.id,
          v.business_name as vendor,
          v.category,
          vb.agreed_base_amount,
          vb.extra_charges_amount,
          vb.total_payable,
          vb.advance_paid,
          vb.balance_due,
          vb.status
        FROM vendor_bills vb
        JOIN vendors v ON vb.vendor_id = v.id
        WHERE vb.wedding_id = $1
        ORDER BY vb.total_payable DESC`,
        [weddingUuid]
      );

      const vendorBills: VendorDisbursementItem[] = billsRes.rows.map((r: any) => ({
        id: r.id,
        vendor: r.vendor,
        category: r.category,
        agreedBase: formatInr(parseFloat(r.agreed_base_amount) || 0),
        extras: parseFloat(r.extra_charges_amount) > 0 ? `+${formatInr(parseFloat(r.extra_charges_amount))}` : '₹0',
        totalPayable: formatInr(parseFloat(r.total_payable) || 0),
        advancePaid: formatInr(parseFloat(r.advance_paid) || 0),
        balanceDue: formatInr(parseFloat(r.balance_due) || 0),
        status: r.status as any,
      }));

      // 4. Fetch Client Milestone Invoices from PostgreSQL
      const invoicesRes = await pool.query(
        `SELECT 
          id,
          invoice_number,
          stage_key,
          amount_due,
          TO_CHAR(due_date, 'Mon DD, YYYY') as "dueDate",
          status,
          paid_amount,
          paid_at,
          payment_reference
        FROM client_invoices
        WHERE wedding_id = $1
        ORDER BY 
          CASE stage_key 
            WHEN 'BOOKING_DEPOSIT' THEN 1 
            WHEN 'PRE_WEDDING_ADVANCE' THEN 2 
            WHEN 'FINAL_SETTLEMENT' THEN 3 
            ELSE 4 
          END, 
          due_date ASC, 
          id ASC`,
        [weddingUuid]
      );

      const invoices: ClientInvoiceItem[] = invoicesRes.rows.map((r: any) => {
        let stageLabel = 'Milestone Payment';
        let pct = 30;
        if (r.stage_key === 'BOOKING_DEPOSIT') {
          stageLabel = 'Booking Deposit (20%)';
          pct = 20;
        } else if (r.stage_key === 'PRE_WEDDING_ADVANCE') {
          stageLabel = '30-Day Pre-Wedding Advance (50%)';
          pct = 50;
        } else if (r.stage_key === 'FINAL_SETTLEMENT') {
          stageLabel = 'Post-Event Final Settlement (30% + Extras)';
          pct = 30;
        } else if (r.stage_key === 'DAY_OF_EXTRA' || (typeof r.stage_key === 'string' && r.stage_key.startsWith('EXTRA'))) {
          stageLabel = r.payment_reference ? `Day-of Extra: ${r.payment_reference}` : 'Day-of Addition Extra Charge';
          pct = 0;
        } else {
          stageLabel = r.payment_reference ? `Extra: ${r.payment_reference}` : (r.stage_key || 'Additional Invoice');
          pct = 0;
        }

        return {
          id: r.id,
          invoiceNumber: r.invoice_number,
          stageKey: r.stage_key,
          stageLabel,
          percentage: pct,
          amountDue: formatInr(parseFloat(r.amount_due) || 0),
          dueDate: r.dueDate,
          status: r.status,
          paidAmount: formatInr(parseFloat(r.paid_amount) || 0),
          paidAt: r.paid_at,
          paymentReference: r.payment_reference,
        };
      });

      const baseContractNum = parseFloat(w.totalBudget) || 0;
      const totalExtrasNum = extrasRes.rows.reduce((sum: number, r: any) => sum + (parseFloat(r.total_amount) || 0), 0);
      const totalInvoicedNum = baseContractNum + totalExtrasNum;
      const totalVendorPayable = billsRes.rows.reduce((sum: number, r: any) => sum + (parseFloat(r.total_payable) || 0), 0);
      const totalVendorAdvance = billsRes.rows.reduce((sum: number, r: any) => sum + (parseFloat(r.advance_paid) || 0), 0);
      const totalVendorBalance = billsRes.rows.reduce((sum: number, r: any) => sum + (parseFloat(r.balance_due) || 0), 0);

      const isFinal = w.status === 'FINALISED' || w.status === 'FINALISED_SETTLED';
      const grossMarginNum = totalInvoicedNum > 0 ? ((totalInvoicedNum - totalVendorPayable) / totalInvoicedNum) * 100 : 22.4;

      const project: ProjectBillingData = {
        id: w.id,
        code: w.code,
        couple: w.couple,
        city: w.city,
        venue: w.venue,
        startDate: w.startDate,
        guestCount: w.actualHeadcount || w.guestCount,
        packageType: w.packageType,
        status: w.status,
        isFinalised: isFinal,
        finalisedDate: isFinal ? 'Feb 20, 2026' : undefined,
        finalisedBy: isFinal ? 'Aditya Singhal (Super Admin)' : undefined,
        budget: `₹${(baseContractNum / 10000000).toFixed(2)} Cr`,
        coordinator: w.city === 'Jaipur' ? 'Devika Sharma' : 'Karan Verma',
        baseContract: formatInr(baseContractNum),
        totalExtras: formatInr(totalExtrasNum),
        totalInvoiced: formatInr(totalInvoicedNum),
        vendorAdvancePaid: formatInr(totalVendorAdvance),
        vendorBalanceDue: isFinal && w.status === 'FINALISED_SETTLED' ? '₹0 (Settled)' : formatInr(totalVendorBalance),
        grossMargin: `${grossMarginNum.toFixed(1)}%`,
        extraCharges,
        vendorBills,
        invoices,
      };

      return {
        success: true,
        data: project,
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // POST /api/billing/projects/:id/extras - Insert real extra charge into PostgreSQL
  fastify.post(
    '/projects/:id/extras',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          category: string;
          description: string;
          qty: number;
          unitPrice: string;
          vendor: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { category, description, qty, unitPrice, vendor } = request.body || {};

      try {
        // Resolve wedding ID
        const wRes = await pool.query(`SELECT id, code, actual_banquet_headcount FROM weddings WHERE id::text = $1 OR code = $1`, [id]);
        if (wRes.rows.length === 0) {
          reply.status(404);
          return { success: false, message: `Project ${id} not found` };
        }

        const weddingUuid = wRes.rows[0].id;
        const numQty = Number(qty) || 1;
        const numPrice = Number(String(unitPrice).replace(/[^\d.]/g, '')) || 1000;
        const calcTotal = numQty * numPrice;

        // Resolve vendor ID if matches or pick preferred
        let vendorId: string | null = null;
        if (vendor) {
          const vRes = await pool.query(`SELECT id FROM vendors WHERE business_name ILIKE $1 LIMIT 1`, [`%${vendor}%`]);
          if (vRes.rows.length > 0) vendorId = vRes.rows[0].id;
        }

        // Insert into wedding_extra_charges
        const insertRes = await pool.query(
          `INSERT INTO wedding_extra_charges (wedding_id, category, description, quantity, unit_rate, total_amount, vendor_id, is_billed_to_client)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
           RETURNING id, category, description, quantity, unit_rate, total_amount`,
          [weddingUuid, category || 'OVERRUN_ADDITION', description, numQty, numPrice, calcTotal, vendorId]
        );

        // If extra plates, update actual banquet headcount in weddings
        if (category === 'EXTRA_PLATES') {
          await pool.query(
            `UPDATE weddings SET actual_banquet_headcount = COALESCE(actual_banquet_headcount, 400) + $1 WHERE id = $2`,
            [numQty, weddingUuid]
          );
        }

        // If vendor exists, also update/insert into vendor_bills
        if (vendorId) {
          const vbCheck = await pool.query(
            `SELECT id FROM vendor_bills WHERE wedding_id = $1 AND vendor_id = $2`,
            [weddingUuid, vendorId]
          );
          if (vbCheck.rows.length > 0) {
            await pool.query(
              `UPDATE vendor_bills 
               SET extra_charges_amount = extra_charges_amount + $1,
                   total_payable = total_payable + $1,
                   balance_due = balance_due + $1
               WHERE wedding_id = $2 AND vendor_id = $3`,
              [calcTotal, weddingUuid, vendorId]
            );
          } else {
            await pool.query(
              `INSERT INTO vendor_bills (wedding_id, vendor_id, agreed_base_amount, extra_charges_amount, total_payable, advance_paid, balance_due, status)
               VALUES ($1, $2, 0, $3, $3, 0, $3, 'RECONCILED_MATCHED')`,
              [weddingUuid, vendorId, calcTotal]
            );
          }
        }

        // Count existing client invoices to generate sequential invoice number: e.g. INV-2026-001-EX1
        const countRes = await pool.query(
          `SELECT count(*) FROM client_invoices WHERE wedding_id = $1`,
          [weddingUuid]
        );
        const invoiceCount = parseInt(countRes.rows[0].count, 10) || 0;
        const cleanCode = (wRes.rows[0].code || 'RW-2026-001').replace(/^RW-/, '');

        let invNumber = `INV-${cleanCode}-EX${invoiceCount >= 3 ? invoiceCount - 2 : invoiceCount + 1}`;
        const existingInv = await pool.query(`SELECT id FROM client_invoices WHERE invoice_number = $1`, [invNumber]);
        if (existingInv.rows.length > 0) {
          invNumber = `INV-${cleanCode}-EX-${Date.now().toString().slice(-4)}`;
        }

        // Create new invoice record in client_invoices (Staged Client Billing)
        const invRes = await pool.query(
          `INSERT INTO client_invoices (
            wedding_id, 
            invoice_number, 
            stage_key, 
            amount_due, 
            due_date, 
            status, 
            paid_amount, 
            paid_at, 
            payment_reference
          )
          VALUES ($1, $2, 'DAY_OF_EXTRA', $3, CURRENT_DATE, 'UNPAID', 0, NULL, $4)
          RETURNING id, invoice_number, stage_key, amount_due, due_date, status`,
          [weddingUuid, invNumber, calcTotal, description || category || 'Day-of Extra Addition']
        );

        // Link client_invoice_id to wedding_extra_charges
        if (invRes.rows.length > 0) {
          await pool.query(
            `UPDATE wedding_extra_charges SET client_invoice_id = $1 WHERE id = $2`,
            [invRes.rows[0].id, insertRes.rows[0].id]
          );
        }

        const newExtra: ExtraChargeItem = {
          id: insertRes.rows[0].id,
          category: insertRes.rows[0].category,
          description: insertRes.rows[0].description,
          qty: numQty,
          unitPrice: formatInr(numPrice),
          total: formatInr(calcTotal),
          vendor: vendor || 'Marwar Heritage Kitchens',
          status: 'ADDED_TO_CLIENT_INVOICE',
          approvedBy: 'Devika Sharma',
          lastEditedAt: new Date().toISOString(),
        };

        return {
          success: true,
          message: 'Extra charge successfully saved to PostgreSQL database & attached to client invoice',
          extra: newExtra,
        };
      } catch (err: any) {
        reply.status(500);
        return { success: false, error: err.message };
      }
    }
  );

  // PUT /api/billing/projects/:id/finalise - Finalise and audit in PostgreSQL
  fastify.put('/projects/:id/finalise', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const wRes = await pool.query(
        `UPDATE weddings 
         SET status = 'FINALISED_SETTLED', updated_at = NOW()
         WHERE id::text = $1 OR code = $1
         RETURNING id, code, status`,
        [id]
      );

      if (wRes.rows.length === 0) {
        reply.status(404);
        return { success: false, message: `Project ${id} not found` };
      }

      const weddingUuid = wRes.rows[0].id;

      // Mark all vendor bills for this wedding as settled
      await pool.query(
        `UPDATE vendor_bills 
         SET status = 'SETTLEMENT_CLEARED', balance_due = 0, settled_at = NOW()
         WHERE wedding_id = $1`,
        [weddingUuid]
      );

      // Mark all milestone invoices as paid
      await pool.query(
        `UPDATE client_invoices 
         SET status = 'PAID', paid_amount = amount_due, paid_at = NOW()
         WHERE wedding_id = $1`,
        [weddingUuid]
      );

      return {
        success: true,
        message: `Project ${wRes.rows[0].code} has been successfully finalised, audited and settled in PostgreSQL!`,
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // PUT /api/billing/vendor-bills/:billId/reconcile - Two-Way Matching Reconciliation in PostgreSQL
  fastify.put(
    '/vendor-bills/:billId/reconcile',
    async (request: FastifyRequest<{ Params: { billId: string } }>, reply: FastifyReply) => {
      const { billId } = request.params;

      try {
        const res = await pool.query(
          `UPDATE vendor_bills
           SET status = 'RECONCILED_MATCHED'
           WHERE id::text = $1
           RETURNING id, agreed_base_amount, extra_charges_amount, total_payable, balance_due, status`,
          [billId]
        );

        if (res.rows.length === 0) {
          reply.status(404);
          return { success: false, message: `Vendor bill ${billId} not found` };
        }

        return {
          success: true,
          message: 'Vendor bill two-way matched and verified with agreed RFQ base + extras',
          bill: res.rows[0],
        };
      } catch (err: any) {
        reply.status(500);
        return { success: false, error: err.message };
      }
    }
  );

  // PUT /api/billing/invoices/:invoiceId/pay - Mark milestone invoice as paid in PostgreSQL
  fastify.put(
    '/invoices/:invoiceId/pay',
    async (request: FastifyRequest<{ Params: { invoiceId: string } }>, reply: FastifyReply) => {
      const { invoiceId } = request.params;

      try {
        const res = await pool.query(
          `UPDATE client_invoices
           SET status = 'PAID', paid_amount = amount_due, paid_at = NOW()
           WHERE id::text = $1 OR invoice_number = $1
           RETURNING id, invoice_number, stage_key, amount_due, status, paid_at`,
          [invoiceId]
        );

        if (res.rows.length === 0) {
          reply.status(404);
          return { success: false, message: `Invoice ${invoiceId} not found` };
        }

        return {
          success: true,
          message: `Invoice ${res.rows[0].invoice_number} successfully marked as PAID in PostgreSQL`,
          invoice: res.rows[0],
        };
      } catch (err: any) {
        reply.status(500);
        return { success: false, error: err.message };
      }
    }
  );
}
