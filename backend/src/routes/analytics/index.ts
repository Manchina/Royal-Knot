import { FastifyInstance } from 'fastify';
import { registerGetSeasonSummary } from './get-season-summary';

/**
 * Analytics Module - Mounts Founder Season P&L, Cash Flow & SLA Scorecard routes
 */
export async function analyticsRoutes(fastify: FastifyInstance) {
  registerGetSeasonSummary(fastify);
}
