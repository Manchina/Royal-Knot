import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { weddings, clients, users, weddingEvents, rfqRequests, vendorQuotes, vendors } from '../db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { isUUID } from '../utils';

export async function weddingRoutes(fastify: FastifyInstance) {
  // 1. Get all weddings with client and coordinator details (Pure Drizzle ORM)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          couple: sql<string>`concat(${clients.brideName}, ' & ', ${clients.groomName})`,
          brideName: clients.brideName,
          groomName: clients.groomName,
          clientPhone: clients.phone,
          clientEmail: clients.email,
          city: weddings.destinationCity,
          venue: weddings.primaryVenue,
          startDate: weddings.startDate,
          endDate: weddings.endDate,
          seasonYear: weddings.seasonYear,
          guestCount: weddings.estimatedGuestCount,
          actualBanquetHeadcount: weddings.actualBanquetHeadcount,
          budget: weddings.totalBudget,
          agencyFee: weddings.agencyFee,
          packageType: weddings.packageType,
          theme: weddings.theme,
          status: weddings.status,
          notes: weddings.notes,
          coordinator: users.fullName,
          coordinatorPhone: users.phone,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .orderBy(desc(weddings.startDate));

      return {
        success: true,
        data,
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // 2. Get lightweight dropdown options for selects / comboboxes (Drizzle ORM)
  fastify.get('/options', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const options = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          couple: sql<string>`concat(${clients.brideName}, ' & ', ${clients.groomName})`,
          city: weddings.destinationCity,
          venue: weddings.primaryVenue,
          guestCount: weddings.estimatedGuestCount,
          status: weddings.status,
          label: sql<string>`concat(${weddings.code}, ': ', ${clients.brideName}, ' & ', ${clients.groomName}, ' (', ${weddings.destinationCity}, ')')`,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .orderBy(desc(weddings.startDate));

      return {
        success: true,
        data: options,
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // 3. Get single wedding by ID or code (Drizzle ORM)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);

      const [wedding] = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          couple: sql<string>`concat(${clients.brideName}, ' & ', ${clients.groomName})`,
          brideName: clients.brideName,
          groomName: clients.groomName,
          clientPhone: clients.phone,
          clientEmail: clients.email,
          city: weddings.destinationCity,
          venue: weddings.primaryVenue,
          startDate: weddings.startDate,
          endDate: weddings.endDate,
          guestCount: weddings.estimatedGuestCount,
          budget: weddings.totalBudget,
          packageType: weddings.packageType,
          theme: weddings.theme,
          status: weddings.status,
          notes: weddings.notes,
          coordinator: users.fullName,
          coordinatorPhone: users.phone,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .where(condition)
        .limit(1);

      if (!wedding) {
        reply.status(404);
        return { success: false, message: 'Wedding not found' };
      }

      // Fetch ceremonies / sub-events (Drizzle ORM)
      const events = await db
        .select()
        .from(weddingEvents)
        .where(eq(weddingEvents.weddingId, wedding.id))
        .orderBy(weddingEvents.eventDate, weddingEvents.startTime);

      // Fetch RFQs and associated quotes for this wedding (Drizzle ORM)
      const rfqs = await db
        .select({
          rfqId: rfqRequests.id,
          category: rfqRequests.serviceCategory,
          status: rfqRequests.status,
          description: rfqRequests.description,
          quoteId: vendorQuotes.id,
          quoteStatus: vendorQuotes.status,
          baseCost: vendorQuotes.baseCost,
          vendorId: vendors.id,
          vendorName: vendors.businessName,
          vendorCity: vendors.city,
          vendorRating: vendors.ratingScore,
        })
        .from(rfqRequests)
        .leftJoin(vendorQuotes, eq(vendorQuotes.rfqId, rfqRequests.id))
        .leftJoin(vendors, eq(vendorQuotes.vendorId, vendors.id))
        .where(eq(rfqRequests.weddingId, wedding.id));

      return {
        success: true,
        data: {
          ...wedding,
          events,
          rfqs,
        },
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // 4. Create New Wedding Project (Drizzle ORM)
  fastify.post('/', async (request: FastifyRequest<{ Body: {
    brideName: string;
    groomName: string;
    phone: string;
    email?: string;
    city: string;
    venue?: string;
    startDate: string;
    endDate?: string;
    guestCount?: number;
    budget: number | string;
    packageType?: string;
    theme?: string;
  } }>, reply: FastifyReply) => {
    try {
      const {
        brideName,
        groomName,
        phone,
        email = '',
        city = 'Udaipur',
        venue = 'Luxury Heritage Palace',
        startDate,
        endDate,
        guestCount = 400,
        budget = 25000000,
        packageType = 'Full-Service Royal Wedding',
        theme = 'Royal Heritage',
      } = request.body || {};

      if (!brideName || !groomName || !phone || !startDate) {
        reply.status(400);
        return { success: false, message: 'Bride name, groom name, contact phone, and start date are required.' };
      }

      // 1. Create Client record
      const [client] = await db
        .insert(clients)
        .values({
          brideName,
          groomName,
          primaryContactName: `${brideName} & ${groomName}`,
          phone,
          email: email || `${brideName.toLowerCase().replace(/\s+/g, '')}@royalknot.com`,
          cityOfResidence: city,
        })
        .returning();

      // 2. Count existing weddings for code generation
      const wCountRes = await db.select({ total: count() }).from(weddings);
      const nextCodeNum = (wCountRes[0]?.total || 0) + 1;
      const code = `RW-2026-${String(nextCodeNum).padStart(3, '0')}`;

      // 3. Create Wedding record
      const totalBudgetNum = Number(budget) || 25000000;
      const agencyFeeNum = totalBudgetNum * 0.15; // 15% standard fee

      const [createdWedding] = await db
        .insert(weddings)
        .values({
          code,
          clientId: client.id,
          packageType,
          theme,
          destinationCity: city,
          primaryVenue: venue,
          startDate: startDate,
          endDate: endDate || startDate,
          seasonYear: 2026,
          estimatedGuestCount: Number(guestCount) || 400,
          totalBudget: String(totalBudgetNum),
          agencyFee: String(agencyFeeNum),
          status: 'IN_PLANNING',
        })
        .returning();

      return {
        success: true,
        message: 'Wedding project created successfully.',
        data: createdWedding,
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
