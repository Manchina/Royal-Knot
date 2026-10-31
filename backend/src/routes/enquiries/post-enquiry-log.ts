import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries, enquiryChangeLogs } from '../../db/schema';
import { matchEnquiry } from './types';

interface PostEnquiryLogBody {
  notes: string;
  action?: string;
  performedBy?: string;
}

/**
 * Route: POST /api/enquiries/:id/logs
 * Appends a planner note or activity record to an enquiry change log
 */
export function registerPostEnquiryLog(fastify: FastifyInstance) {
  fastify.post('/:id/logs', async (request: FastifyRequest<{ Params: { id: string }; Body: PostEnquiryLogBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { notes, action = 'PLANNER_NOTE', performedBy = 'Devika Sharma (Lead Planner)' } = request.body || {};

    if (!notes) {
      reply.status(400);
      return { success: false, message: 'Notes are required.' };
    }

    try {
      const [found] = await db.select({ id: enquiries.id }).from(enquiries).where(matchEnquiry(id));
      const enquiryId = found ? found.id : id;

      const [log] = await db
        .insert(enquiryChangeLogs)
        .values({
          enquiryId,
          action,
          performedBy,
          notes,
        })
        .returning();

      return {
        success: true,
        data: log,
      };
    } catch (err: any) {
      fastify.log.error(`Change log create error: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
