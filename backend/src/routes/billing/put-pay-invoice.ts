import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';

/**
 * Route: PUT /api/billing/invoices/:invoiceId/pay
 * Marks client milestone payment as PAID with timestamp and updates paid_amount in PostgreSQL
 */
export function registerPutPayInvoice(fastify: FastifyInstance) {
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
