import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries } from '../../db/schema';
import { matchEnquiry } from './types';

/**
 * Route: GET /api/enquiries/:id
 * Fetches a single enquiry by reference code or UUID
 */
export function registerGetEnquiryById(fastify: FastifyInstance) {
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const [enquiry] = await db.select().from(enquiries).where(matchEnquiry(id));
      if (!enquiry) {
        reply.status(404);
        return { success: false, message: 'Enquiry not found.' };
      }

      return {
        success: true,
        data: enquiry,
      };
    } catch (err: any) {
      fastify.log.error(`Error querying single enquiry via Drizzle: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
