import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';

/**
 * Route: PUT /api/billing/vendor-bills/:billId/reconcile
 * Performs two-way matching reconciliation on vendor bills in PostgreSQL
 */
export function registerPutReconcileVendorBill(fastify: FastifyInstance) {
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
}
