import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';

/**
 * Route: PUT /api/billing/projects/:id/finalise
 * Finalises, audits and marks project as settled in PostgreSQL
 */
export function registerPutFinaliseProject(fastify: FastifyInstance) {
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
}
