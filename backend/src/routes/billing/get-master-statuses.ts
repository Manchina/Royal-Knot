import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';
import { MasterOptionRow } from './types';

let cachedMasterStatuses: MasterOptionRow[] | null = null;
let masterStatusesCacheTime = 0;
const MASTER_STATUSES_CACHE_TTL_MS = 60_000;

export async function getCachedMasterStatuses(): Promise<MasterOptionRow[]> {
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

/**
 * Route: GET /api/billing/master-statuses
 * Returns active WEDDING_STATUS options from PostgreSQL database
 */
export function registerGetMasterStatuses(fastify: FastifyInstance) {
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
}
