import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { weddings, clients, users } from '../db/schema';
import { eq, desc, asc, or } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CreateWeddingBody {
  code?: string;
  couple?: string;
  brideName?: string;
  groomName?: string;
  city: string;
  venue: string;
  startDate?: string;
  endDate?: string;
  guestCount?: number;
  packageType?: string;
  budget?: string | number;
  coordinator?: string;
  notes?: string;
}

export async function weddingsRoutes(fastify: FastifyInstance) {
  // 1. GET /api/weddings - List all weddings dynamically from database with client and coordinator joins
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
          guestCount: weddings.estimatedGuestCount,
          packageType: weddings.packageType,
          status: weddings.status,
          totalBudget: weddings.totalBudget,
          agencyFee: weddings.agencyFee,
          leadPlannerId: weddings.leadPlannerId,
          coordinator: users.fullName,
          coordinatorRole: users.role,
          notes: weddings.notes,
        })
        .from(weddings)
        .innerJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .orderBy(asc(weddings.startDate), asc(weddings.code));

      const data = rows.map((r) => {
        const isFinalised = r.status === 'FINALISED' || r.status === 'FINALISED_SETTLED';
        const numBudget = Number(r.totalBudget) || 0;
        let budgetStr = `₹${numBudget}`;
        if (numBudget >= 10000000) {
          budgetStr = `₹${(numBudget / 10000000).toFixed(2)} Cr`;
        } else if (numBudget >= 100000) {
          budgetStr = `₹${(numBudget / 100000).toFixed(0)} Lakh`;
        }

        return {
          id: r.code, // Formatted wedding code e.g. 'RW-2026-001'
          uuid: r.id,
          code: r.code,
          couple: `${r.brideName} & ${r.groomName}`,
          city: r.city,
          venue: r.venue || 'Palace Venue',
          startDate: r.startDate,
          endDate: r.endDate,
          guestCount: r.guestCount,
          packageType: r.packageType,
          status: r.status,
          isFinalised,
          budget: budgetStr,
          rawBudget: numBudget,
          coordinator: r.coordinator || 'Unassigned',
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
      return {
        success: false,
        message: 'Failed to retrieve weddings from database',
        error: err.message,
      };
    }
  });

  // 2. GET /api/weddings/:idOrCode - Single wedding by UUID or Code
  fastify.get('/:idOrCode', async (request: FastifyRequest<{ Params: { idOrCode: string } }>, reply: FastifyReply) => {
    const { idOrCode } = request.params;

    try {
      const isUuid = UUID_REGEX.test(idOrCode);
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
          guestCount: weddings.estimatedGuestCount,
          packageType: weddings.packageType,
          status: weddings.status,
          totalBudget: weddings.totalBudget,
          agencyFee: weddings.agencyFee,
          coordinator: users.fullName,
          notes: weddings.notes,
        })
        .from(weddings)
        .innerJoin(clients, eq(weddings.clientId, clients.id))
        .leftJoin(users, eq(weddings.leadPlannerId, users.id))
        .where(isUuid ? eq(weddings.id, idOrCode) : eq(weddings.code, idOrCode))
        .limit(1);

      if (!rows.length) {
        reply.status(404);
        return { success: false, message: `Wedding '${idOrCode}' not found.` };
      }

      return { success: true, data: rows[0] };
    } catch (err: any) {
      reply.status(500);
      return { success: false, message: 'Failed to fetch wedding', error: err.message };
    }
  });

  // 3. POST /api/weddings - Create a new wedding in PostgreSQL database
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateWeddingBody }>, reply: FastifyReply) => {
    const {
      code,
      couple,
      brideName,
      groomName,
      city,
      venue,
      startDate,
      endDate,
      guestCount = 400,
      packageType = 'FULL_SERVICE',
      budget = 25000000,
      coordinator,
      notes = '',
    } = request.body || {};

    try {
      // Resolve bride and groom names
      let finalBride = brideName || '';
      let finalGroom = groomName || '';
      if (!finalBride && couple) {
        const parts = couple.split('&').map((p) => p.trim());
        finalBride = parts[0] || 'Bride';
        finalGroom = parts[1] || 'Groom';
      }

      // Generate wedding code if not supplied
      let finalCode = code;
      if (!finalCode) {
        const currentYear = new Date().getFullYear();
        const countRes = await db
          .select({ code: weddings.code })
          .from(weddings);
        finalCode = `RW-${currentYear}-${String(countRes.length + 1).padStart(3, '0')}`;
      }

      // Resolve lead planner user if coordinator name supplied
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

      // Insert client record
      const [newClient] = await db
        .insert(clients)
        .values({
          brideName: finalBride,
          groomName: finalGroom,
          primaryContactName: finalGroom,
          email: `${finalBride.toLowerCase().replace(/\s+/g, '')}@client.in`,
          phone: '+91 98290 00000',
          cityOfResidence: city || 'Rajasthan',
          notes,
        })
        .returning();

      // Parse budget
      const rawBudget = typeof budget === 'string'
        ? parseFloat(budget.replace(/[^0-9.]/g, '')) * (budget.includes('Cr') ? 10000000 : 100000)
        : Number(budget) || 25000000;

      const [newWedding] = await db
        .insert(weddings)
        .values({
          code: finalCode,
          clientId: newClient.id,
          leadPlannerId,
          packageType,
          theme: 'Royal Palace Celebration',
          destinationCity: city || 'Udaipur',
          primaryVenue: venue || 'Palace Venue',
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          seasonYear: new Date().getFullYear(),
          estimatedGuestCount: guestCount,
          totalBudget: rawBudget.toFixed(2),
          agencyFee: (rawBudget * 0.1).toFixed(2),
          status: 'IN_PLANNING',
          notes,
        })
        .returning();

      return {
        success: true,
        message: 'Wedding project created successfully in database',
        data: {
          id: newWedding.code,
          uuid: newWedding.id,
          code: newWedding.code,
          couple: `${finalBride} & ${finalGroom}`,
          city: newWedding.destinationCity,
          venue: newWedding.primaryVenue,
          startDate: newWedding.startDate,
          guestCount: newWedding.estimatedGuestCount,
          packageType: newWedding.packageType,
          status: newWedding.status,
          budget: `₹${(rawBudget / 10000000).toFixed(2)} Cr`,
        },
      };
    } catch (err: any) {
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to create wedding project',
        error: err.message,
      };
    }
  });
}
