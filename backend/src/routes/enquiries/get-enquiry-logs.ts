import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries, enquiryChangeLogs } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { matchEnquiry } from './types';

/**
 * Route: GET /api/enquiries/:id/logs
 * Retrieves audit change log history for an enquiry
 */
export function registerGetEnquiryLogs(fastify: FastifyInstance) {
  fastify.get('/:id/logs', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const [found] = await db.select({ id: enquiries.id }).from(enquiries).where(matchEnquiry(id));
      const enquiryId = found ? found.id : id;

      const logs = await db
        .select()
        .from(enquiryChangeLogs)
        .where(eq(enquiryChangeLogs.enquiryId, enquiryId))
        .orderBy(desc(enquiryChangeLogs.createdAt));

      return {
        success: true,
        count: logs.length,
        data: logs,
      };
    } catch (err: any) {
      fastify.log.error(`Change log query error: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
