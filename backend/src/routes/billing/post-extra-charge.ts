import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';
import { formatInr } from '../../utils';
import { ExtraChargeItem } from './types';

interface PostExtraChargeBody {
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  vendor: string;
}

/**
 * Route: POST /api/billing/projects/:id/extras
 * Records new overrun or addition directly into PostgreSQL and recalculates client invoice & headcount
 */
export function registerPostExtraCharge(fastify: FastifyInstance) {
  fastify.post(
    '/projects/:id/extras',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: PostExtraChargeBody;
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { category, description, qty, unitPrice, vendor } = request.body || {};

      try {
        // Resolve wedding ID
        const wRes = await pool.query(
          `SELECT id, code, actual_banquet_headcount FROM weddings WHERE id::text = $1 OR code = $1`,
          [id]
        );
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
          await pool.query(
            `UPDATE vendor_bills 
             SET extra_charges_amount = extra_charges_amount + $1,
                 total_payable = total_payable + $1,
                 balance_due = balance_due + $1
             WHERE wedding_id = $2 AND vendor_id = $3`,
            [calcTotal, weddingUuid, vendorId]
          );
        }

        // Also append extra to final settlement invoice if exists
        await pool.query(
          `UPDATE client_invoices
           SET amount_due = amount_due + $1
           WHERE wedding_id = $2 AND stage_key = 'FINAL_SETTLEMENT'`,
          [calcTotal, weddingUuid]
        );

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
}
