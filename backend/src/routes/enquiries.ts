import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { enquiries, clients, weddings, enquiryChangeLogs, users } from '../db/schema';
import { eq, desc, asc, ilike, or, and, count, sql, type SQL } from 'drizzle-orm';
import { isUUID } from '../utils';

const matchEnquiry = (param: string) => (isUUID(param) ? eq(enquiries.id, param) : eq(enquiries.code, param));

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
  signatoryName?: string;
  userId?: string;
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
      } catch (logErr: unknown) {
        const msg = logErr instanceof Error ? logErr.message : 'Unknown error';
        fastify.log.warn(`Change log insert error: ${msg}`);
      }

      return {
        success: true,
        message: 'Luxury royal wedding enquiry submitted successfully. Our lead planner will connect within 24 hours.',
        data: created,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Drizzle enquiry creation error: ${msg}`);
      reply.status(500);
      return {
        success: false,
        message: 'Could not record enquiry. Database error.',
        error: msg,
      };
    }
  });

  // Get all enquiries (Drizzle ORM query with filters)
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { channel?: string; search?: string } }>, reply: FastifyReply) => {
    try {
      const { channel, search } = request.query;
      const conditions: SQL[] = [];

      if (channel && channel !== 'ALL') {
        conditions.push(ilike(sql`${enquiries.channel}`, `%${channel}%`));
      }

      if (search) {
        conditions.push(
          or(
            ilike(sql`${enquiries.coupleName}`, `%${search}%`),
            ilike(sql`${enquiries.code}`, `%${search}%`),
            ilike(sql`${enquiries.phone}`, `%${search}%`)
          )!
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Error querying enquiries via Drizzle: ${msg}`);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to retrieve enquiries.',
        error: msg,
      };
    }
  });

  // Get single enquiry by code or UUID
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Error querying single enquiry via Drizzle: ${msg}`);
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // Update enquiry status / Sign agreement on mobile (Drizzle ORM)
  fastify.patch('/:id/status', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, agreementStatus, notes, signatoryName, userId } = request.body || {};

    try {
      const isSigned = agreementStatus === 'Signed on Mobile';

      const updateValues: Partial<typeof enquiries.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (status) updateValues.status = status;
      if (agreementStatus) updateValues.agreementStatus = agreementStatus;
      if (isSigned) updateValues.agreementSignedAt = new Date();
      if (signatoryName) updateValues.primaryContactName = signatoryName;
      if (notes !== undefined) updateValues.notes = notes;

      const [updated] = await db
        .update(enquiries)
        .set(updateValues)
        .where(matchEnquiry(id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Enquiry not found.' };
      }

      const isSent = agreementStatus === 'Sent - Pending Signature';

      let action = 'STATUS_UPDATED';
      let logNotes = `Status updated to "${updated.status}". ${notes || ''}`;
      const performedBy = signatoryName
        ? `${signatoryName}${userId ? ` (UID: ${userId})` : ''} (Authorized Signatory)`
        : isSigned
        ? `Client${userId ? ` (UID: ${userId})` : ''} (Mobile Magic Link)`
        : 'Lead Planner (Devika Sharma)';

      if (isSigned) {
        action = 'AGREEMENT_SIGNED';
        logNotes = signatoryName
          ? `Client (${signatoryName}${userId ? `, UID: ${userId}` : ''}) reviewed and digitally signed royal wedding agreement via mobile magic link.`
          : `Client${userId ? ` (UID: ${userId})` : ''} reviewed and digitally signed royal wedding agreement via mobile magic link.`;
      } else if (isSent) {
        action = 'AGREEMENT_SENT';
        logNotes = `Dummy wedding service agreement generated and magic signing link dispatched to client via email & mobile.${userId ? ` (UID: ${userId})` : ''}`;
      }

      // Record audit change log
      try {
        await db.insert(enquiryChangeLogs).values({
          enquiryId: updated.id,
          action,
          fromStatus: null,
          toStatus: updated.status,
          performedBy,
          notes: logNotes,
        });
      } catch (logErr: unknown) {
        const msg = logErr instanceof Error ? logErr.message : 'Unknown error';
        fastify.log.warn(`Change log insert error: ${msg}`);
      }

      return {
        success: true,
        message: 'Enquiry updated successfully via Drizzle ORM.',
        data: updated,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Drizzle enquiry status update error: ${msg}`);
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // Convert Enquiry to Full Wedding Project (Drizzle ORM)
  fastify.post('/:id/convert', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const [enquiry] = await db
        .select()
        .from(enquiries)
        .where(matchEnquiry(id));

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

      // 4. Provision Couple User Account with default password password123
      const clientEmail = enquiry.email || `client_${weddingCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@royalknot.com`;
      const [existingUser] = await db.select().from(users).where(eq(users.email, clientEmail));
      let clientUser = existingUser;
      if (!existingUser) {
        [clientUser] = await db
          .insert(users)
          .values({
            fullName: enquiry.coupleName,
            email: clientEmail,
            password: 'password123',
            phone: enquiry.phone,
            role: 'CLIENT',
            title: 'Royal Couple',
            isActive: true,
          })
          .returning();
      }

      // 5. Update enquiry link
      await db
        .update(enquiries)
        .set({
          weddingId: newWedding.id,
          status: 'Converted to Wedding',
          agreementStatus: 'Signed on Mobile',
          updatedAt: new Date(),
        })
        .where(eq(enquiries.id, enquiry.id));

      // 6. Record change log
      try {
        await db.insert(enquiryChangeLogs).values({
          enquiryId: enquiry.id,
          action: 'CONVERTED_TO_WEDDING',
          fromStatus: enquiry.status,
          toStatus: 'Converted to Wedding',
          performedBy: 'Lead Planner (Devika Sharma)',
          notes: `Converted lead to active Wedding Project ${weddingCode} (${newWedding.primaryVenue}). Client Portal user provisioned for ${clientEmail} with default password: password123.`,
        });
      } catch (logErr: unknown) {
        const msg = logErr instanceof Error ? logErr.message : 'Unknown error';
        fastify.log.warn(`Change log insert error: ${msg}`);
      }

      return {
        success: true,
        message: `Enquiry successfully converted to Wedding Project ${weddingCode} and client user provisioned!`,
        wedding: newWedding,
        client: newClient,
        user: {
          id: clientUser?.id,
          email: clientUser?.email,
          fullName: clientUser?.fullName,
          role: clientUser?.role,
          defaultPassword: 'password123',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Enquiry conversion error via Drizzle: ${msg}`);
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // Get change log history for a specific enquiry
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Change log query error: ${msg}`);
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // Append an activity note to the change log
  fastify.post('/:id/logs', async (request: FastifyRequest<{ Params: { id: string }; Body: { notes: string; action?: string; performedBy?: string } }>, reply: FastifyReply) => {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(`Change log create error: ${msg}`);
      reply.status(500);
      return { success: false, error: msg };
    }
  });
}
