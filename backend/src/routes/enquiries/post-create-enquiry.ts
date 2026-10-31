import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries, enquiryChangeLogs } from '../../db/schema';
import { count } from 'drizzle-orm';
import { CreateEnquiryBody } from './types';

/**
 * Route: POST /api/enquiries/
 * Public lead capture - Submit Consultation / Enquiry
 */
export function registerPostCreateEnquiry(fastify: FastifyInstance) {
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateEnquiryBody }>, reply: FastifyReply) => {
    const {
      coupleName,
      primaryContactName,
      phone,
      email,
      channel = 'Website Consultation',
      cityPreference = 'Jaipur',
      datesRough = 'Winter 2026',
      guestCount = 400,
      theme = 'Palace Royal Heritage',
      budgetMax = 25000000,
      packagePreference = 'FULL_SERVICE',
      notes = '',
    } = request.body || {};

    if (!coupleName || !phone) {
      reply.status(400);
      return {
        success: false,
        message: 'Couple names and contact phone number are required.',
      };
    }

    try {
      // Count existing enquiries to generate sequential reference code
      const countRes = await db.select({ total: count() }).from(enquiries);
      const nextNum = (countRes[0]?.total || 0) + 105;
      const code = `ENQ-2026-${nextNum}`;

      const [created] = await db
        .insert(enquiries)
        .values({
          code,
          coupleName: coupleName.trim(),
          primaryContactName: primaryContactName?.trim() || coupleName.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          channel,
          cityPreference,
          datesRough,
          guestCount: Number(guestCount) || 400,
          theme,
          budgetMax: budgetMax ? String(budgetMax) : '25000000.00',
          packagePreference,
          agreementStatus: 'Drafting Agreement',
          status: 'Initial Discovery',
          notes,
        })
        .returning();

      // Record audit change log
      try {
        await db.insert(enquiryChangeLogs).values({
          enquiryId: created.id,
          action: 'LEAD_CREATED',
          fromStatus: null,
          toStatus: 'Initial Discovery',
          performedBy: created.channel || 'Website Portal',
          notes: `Consultation lead submitted. Destination: ${created.cityPreference}, Guest count: ${created.guestCount}.`,
        });
      } catch (logErr: any) {
        fastify.log.warn(`Change log insert error: ${logErr.message}`);
      }

      return {
        success: true,
        message: 'Luxury royal wedding enquiry submitted successfully. Our lead planner will connect within 24 hours.',
        data: created,
      };
    } catch (err: any) {
      fastify.log.error(`Drizzle enquiry creation error: ${err.message}`);
      reply.status(500);
      return {
        success: false,
        message: 'Could not record enquiry. Database error.',
        error: err.message,
      };
    }
  });
}
