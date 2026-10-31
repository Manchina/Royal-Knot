import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';
import { formatInr } from '../../utils';
import { ProjectBillingData, ExtraChargeItem, VendorDisbursementItem, ClientInvoiceItem } from './types';

/**
 * Route: GET /api/billing/projects/:id
 * Fetches single project detail including client invoices, extra charges, and vendor bills
 */
export function registerGetProjectDetail(fastify: FastifyInstance) {
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
          w.agency_fee as "agencyFee",
          COALESCE(u.full_name, 'Devika Sharma') as coordinator
        FROM weddings w
        JOIN clients c ON w.client_id = c.id
        LEFT JOIN users u ON w.lead_planner_id = u.id
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
        approvedBy: w.coordinator || 'Devika Sharma',
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
        ORDER BY due_date ASC`,
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
      const grossMarginNum = totalInvoicedNum > 0 ? ((totalInvoicedNum - totalVendorPayable) / totalInvoicedNum) * 100 : 0;

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
        coordinator: w.coordinator || 'Devika Sharma',
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
}
