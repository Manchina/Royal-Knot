import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { enquiries, clients, weddings } from '../db/schema';
import { eq, desc, ilike, or, and, count } from 'drizzle-orm';

interface CreateEnquiryBody {
  coupleName: string;
  primaryContactName?: string;
  phone: string;
  email?: string;
  channel?: string;
  cityPreference: string;
  datesRough: string;
  guestCount?: number;
  theme?: string;
  budgetMax?: number;
  packagePreference?: string;
  notes?: string;
}

interface UpdateStatusBody {
  status?: string;
  agreementStatus?: string;
  notes?: string;
}

export async function enquiryRoutes(fastify: FastifyInstance) {
  // Public Lead Capture Endpoint - Submit Consultation / Enquiry (Drizzle ORM)
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

  // Get all enquiries (Drizzle ORM query with filters)
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

  // Update enquiry status / Sign agreement on mobile (Drizzle ORM)
  fastify.patch('/:id/status', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, agreementStatus, notes } = request.body || {};

    try {
      const isSigned = agreementStatus === 'Signed on Mobile';

      const updateValues: any = {
        updatedAt: new Date(),
      };
      if (status) updateValues.status = status;
      if (agreementStatus) updateValues.agreementStatus = agreementStatus;
      if (isSigned) updateValues.agreementSignedAt = new Date();
      if (notes !== undefined) updateValues.notes = notes;

      // Check if id is UUID or code
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const condition = isUUID ? eq(enquiries.id, id) : eq(enquiries.code, id);

      const [updated] = await db
        .update(enquiries)
        .set(updateValues)
        .where(condition)
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Enquiry not found.' };
      }

      return {
        success: true,
        message: 'Enquiry updated successfully via Drizzle ORM.',
        data: updated,
      };
    } catch (err: any) {
      fastify.log.error(`Drizzle enquiry status update error: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // Convert Enquiry to Full Wedding Project (Drizzle ORM)
  fastify.post('/:id/convert', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const condition = isUUID ? eq(enquiries.id, id) : eq(enquiries.code, id);

      const [enquiry] = await db
        .select()
        .from(enquiries)
        .where(condition);

      if (!enquiry) {
        reply.status(404);
        return { success: false, message: 'Enquiry not found' };
      }

      if (enquiry.weddingId) {
        return {
          success: true,
          message: 'Enquiry is already converted to an active wedding.',
          weddingId: enquiry.weddingId,
        };
      }

      // Split couple name or provide bride/groom names
      const parts = enquiry.coupleName.split('&').map((s: string) => s.trim());
      const brideName = parts[0] || 'Bride';
      const groomName = parts[1] || 'Groom';

      // 1. Create client record via Drizzle
      const [newClient] = await db
        .insert(clients)
        .values({
          brideName,
          groomName,
          primaryContactName: enquiry.primaryContactName || enquiry.coupleName,
          email: enquiry.email || 'client@royalknot.com',
          phone: enquiry.phone,
          cityOfResidence: enquiry.cityPreference,
        })
        .returning();

      // 2. Count existing weddings for code generation
      const wCountRes = await db.select({ total: count() }).from(weddings);
      const wNum = (wCountRes[0]?.total || 3) + 1;
      const weddingCode = `RW-2026-00${wNum}`;

      const totalBudget = enquiry.budgetMax ? parseFloat(enquiry.budgetMax) : 25000000.00;
      const agencyFee = totalBudget * 0.10;

      // 3. Create Wedding Project via Drizzle
      const [newWedding] = await db
        .insert(weddings)
        .values({
          code: weddingCode,
          clientId: newClient.id,
          packageType: enquiry.packagePreference || 'FULL_SERVICE',
          theme: enquiry.theme || 'Royal Heritage Grandeur',
          destinationCity: enquiry.cityPreference,
          primaryVenue: enquiry.cityPreference === 'Jaipur' ? 'Rambagh Palace / Jai Mahal' : 'The Oberoi Udaivilas / Jagmandir Island',
          startDate: '2026-12-10',
          endDate: '2026-12-13',
          seasonYear: 2026,
          estimatedGuestCount: enquiry.guestCount || 400,
          totalBudget: String(totalBudget),
          agencyFee: String(agencyFee),
          status: 'IN_PLANNING',
          notes: `Converted from lead ${enquiry.code} (${enquiry.channel})`,
        })
        .returning();

      // 4. Update enquiry link
      await db
        .update(enquiries)
        .set({
          weddingId: newWedding.id,
          status: 'Converted to Wedding',
          agreementStatus: 'Signed on Mobile',
          updatedAt: new Date(),
        })
        .where(eq(enquiries.id, enquiry.id));

      return {
        success: true,
        message: `Enquiry successfully converted to Wedding Project ${weddingCode} via Drizzle ORM!`,
        wedding: newWedding,
      };
    } catch (err: any) {
      fastify.log.error(`Enquiry conversion error via Drizzle: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
