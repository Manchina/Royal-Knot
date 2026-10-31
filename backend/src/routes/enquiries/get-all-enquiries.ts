import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries } from '../../db/schema';
import { desc, ilike, or, and } from 'drizzle-orm';

/**
 * Route: GET /api/enquiries/
 * Retrieves all lead enquiries with search & channel filtering
 */
export function registerGetAllEnquiries(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { channel?: string; search?: string } }>, reply: FastifyReply) => {
    try {
      const { channel, search } = request.query;
      const conditions = [];

      if (channel && channel !== 'ALL') {
        conditions.push(ilike(enquiries.channel, `%${channel}%`));
      }

      if (search) {
        conditions.push(
          or(
            ilike(enquiries.coupleName, `%${search}%`),
            ilike(enquiries.code, `%${search}%`),
            ilike(enquiries.phone, `%${search}%`)
          )
        );
      }

      const rows = await db
        .select()
        .from(enquiries)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(enquiries.createdAt));

      return {
        success: true,
        count: rows.length,
        data: rows,
      };
    } catch (err: any) {
      fastify.log.error(`Error querying enquiries via Drizzle: ${err.message}`);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to retrieve enquiries.',
        error: err.message,
      };
    }
  });
}
