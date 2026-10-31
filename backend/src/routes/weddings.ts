import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { weddings, clients, users, weddingEvents, rfqRequests, vendorQuotes, vendors } from '../db/schema';
import { eq, desc, asc, sql, count } from 'drizzle-orm';
import { isUUID } from '../utils';

interface CreateWeddingBody {
  code?: string;
  couple?: string;
  brideName?: string;
  groomName?: string;
  phone?: string;
  email?: string;
  city: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  guestCount?: number;
  packageType?: string;
  budget?: string | number;
  theme?: string;
  coordinator?: string;
  notes?: string;
}

export async function weddingRoutes(fastify: FastifyInstance) {
  // 1. GET /api/weddings - List all weddings with client and coordinator details (Pure Drizzle ORM)
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          clientId: weddings.clientId,
          brideName: clients.brideName,
          groomName: clients.groomName,
          clientEmail: clients.email,
          clientPhone: clients.phone,
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
          leadPlannerId: weddings.leadPlannerId,
          coordinator: users.fullName,
          coordinatorPhone: users.phone,
          coordinatorRole: users.role,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .orderBy(desc(weddings.startDate));

      const data = rows.map((r) => {
        const isFinalised = r.status === 'FINALISED' || r.status === 'FINALISED_SETTLED';
        const numBudget = Number(r.budget) || 0;
        let budgetStr = `₹${numBudget}`;
        if (numBudget >= 10000000) {
          budgetStr = `₹${(numBudget / 10000000).toFixed(2)} Cr`;
        } else if (numBudget >= 100000) {
          budgetStr = `₹${(numBudget / 100000).toFixed(0)} Lakh`;
        }

        const couple = (r.brideName && r.groomName)
          ? `${r.brideName} & ${r.groomName}`
          : (r.brideName || r.groomName || 'Royal Couple');

        return {
          id: r.code,
          uuid: r.id,
          code: r.code,
          couple,
          brideName: r.brideName,
          groomName: r.groomName,
          clientEmail: r.clientEmail,
          clientPhone: r.clientPhone,
          city: r.city,
          venue: r.venue || 'Palace Venue',
          startDate: r.startDate,
          endDate: r.endDate,
          seasonYear: r.seasonYear,
          guestCount: r.guestCount,
          actualBanquetHeadcount: r.actualBanquetHeadcount,
          packageType: r.packageType,
          theme: r.theme,
          status: r.status,
          isFinalised,
          budget: budgetStr,
          rawBudget: numBudget,
          agencyFee: r.agencyFee,
          coordinator: r.coordinator || 'Lead Planner',
          coordinatorPhone: r.coordinatorPhone,
          coordinatorRole: r.coordinatorRole || null,
          notes: r.notes,
        };
      });

      return {
        success: true,
        data,
        total: data.length,
      };
    } catch (err: any) {
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to retrieve weddings from database', error: err.message };
    }
  });

  // 2. GET /api/weddings/options - Lightweight options for selects / comboboxes (Drizzle ORM)
  fastify.get('/options', async (_request: FastifyRequest, reply: FastifyReply) => {
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

  // 3. GET /api/weddings/:id - Single wedding by UUID or code with ceremonies & RFQs (Drizzle ORM)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const condition = isUUID(id) ? eq(weddings.id, id) : eq(weddings.code, id);

      const [wedding] = await db
        .select({
          id: weddings.id,
          uuid: weddings.id,
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
        return { success: false, message: `Wedding '${id}' not found` };
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

  // 4. POST /api/weddings - Create New Wedding Project in PostgreSQL (Drizzle ORM)
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateWeddingBody }>, reply: FastifyReply) => {
    try {
      const {
        code,
        couple,
        brideName,
        groomName,
        phone = '+91 98290 00000',
        email = '',
        city = 'Udaipur',
        venue = 'Luxury Heritage Palace',
        startDate,
        endDate,
        guestCount = 400,
        budget = 25000000,
        packageType = 'Full-Service Royal Wedding',
        theme = 'Royal Heritage',
        coordinator,
        notes = '',
      } = request.body || {};

      // Resolve bride and groom names
      let finalBride = brideName || '';
      let finalGroom = groomName || '';
      if (!finalBride && couple) {
        const parts = couple.split('&').map((p) => p.trim());
        finalBride = parts[0] || 'Bride';
        finalGroom = parts[1] || 'Groom';
      }

      if (!finalBride) finalBride = 'Royal Bride';
      if (!finalGroom) finalGroom = 'Royal Groom';

      const finalStartDate = startDate || new Date().toISOString().split('T')[0];
      const finalEndDate = endDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

      // 1. Create Client record
      const [client] = await db
        .insert(clients)
        .values({
          brideName: finalBride,
          groomName: finalGroom,
          primaryContactName: `${finalBride} & ${finalGroom}`,
          phone,
          email: email || `${finalBride.toLowerCase().replace(/\s+/g, '')}@royalknot.com`,
          cityOfResidence: city,
          notes,
        })
        .returning();

      // 2. Count existing weddings for code generation
      let finalCode = code;
      if (!finalCode) {
        const currentYear = new Date().getFullYear();
        const wCountRes = await db.select({ total: count() }).from(weddings);
        const nextCodeNum = (wCountRes[0]?.total || 0) + 1;
        finalCode = `RW-${currentYear}-${String(nextCodeNum).padStart(3, '0')}`;
      }

      // 3. Resolve lead planner user if coordinator name supplied
      let leadPlannerId: string | null = null;
      if (coordinator?.trim()) {
        const foundUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.fullName, coordinator.trim()))
          .limit(1);
        if (foundUser.length) {
          leadPlannerId = foundUser[0].id;
        }
      }

      // 4. Create Wedding record
      const rawBudget = typeof budget === 'string'
        ? parseFloat(budget.replace(/[^0-9.]/g, '')) * (budget.includes('Cr') ? 10000000 : budget.includes('Lakh') ? 100000 : 1)
        : Number(budget) || 25000000;
      const agencyFeeNum = rawBudget * 0.15; // 15% standard fee

      const [createdWedding] = await db
        .insert(weddings)
        .values({
          code: finalCode,
          clientId: client.id,
          leadPlannerId,
          packageType,
          theme,
          destinationCity: city,
          primaryVenue: venue,
          startDate: finalStartDate,
          endDate: finalEndDate,
          seasonYear: 2026,
          estimatedGuestCount: Number(guestCount) || 400,
          totalBudget: String(rawBudget),
          agencyFee: String(agencyFeeNum),
          status: 'IN_PLANNING',
          notes,
        })
        .returning();

      return {
        success: true,
        message: 'Wedding project created successfully in database',
        data: {
          id: createdWedding.code,
          uuid: createdWedding.id,
          code: createdWedding.code,
          couple: `${finalBride} & ${finalGroom}`,
          city: createdWedding.destinationCity,
          venue: createdWedding.primaryVenue,
          startDate: createdWedding.startDate,
          guestCount: createdWedding.estimatedGuestCount,
          packageType: createdWedding.packageType,
          status: createdWedding.status,
          budget: `₹${(rawBudget / 10000000).toFixed(2)} Cr`,
        },
      };
    } catch (err: any) {
      reply.status(500);
      return { success: false, message: 'Failed to create wedding project', error: err.message };
    }
  });
}
