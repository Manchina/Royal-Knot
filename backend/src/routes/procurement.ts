import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { vendors, rfqRequests, vendorQuotes, weddings, clients, masterOptions } from '../db/schema';
import { eq, desc, ilike, and, ne, sql, count, type SQL } from 'drizzle-orm';
import { isUUID } from '../utils';

interface CreateVendorBody {
  businessName: string;
  category: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  city?: string;
  ratingScore?: number | string;
  pricingEstimate?: string;
  specialties?: string;
}

interface AssignOptionsBody {
  weddingId: string;
  category: string; // 'CATERER' | 'DJ' | 'DECORATOR'
  vendorIds: string[];
  description?: string;
}

interface SelectWinnerBody {
  quoteId: string;
  reason?: string;
}

interface QuoteOverviewItem {
  id: string;
  rfqId: string;
  vendorId: string | null;
  businessName: string | null;
  rating: string | null;
  phone: string | null;
  city: string | null;
  baseCost: string | null;
  pricePerPlate: string | null;
  overtimeHourlyRate: string | null;
  status: string | null;
  decisionReason: string | null;
  isWinner: boolean;
}

interface CategoryOverview {
  status: string;
  quotes: QuoteOverviewItem[];
  winner: QuoteOverviewItem | null;
}

interface WeddingOverviewGroup {
  id: string;
  code: string;
  couple_name: string | null;
  destination_city: string;
  primary_venue: string | null;
  start_date: string;
  estimated_guest_count: number;
  total_budget: string;
  wedding_status: string;
  categories: Record<string, CategoryOverview>;
}

export async function procurementRoutes(fastify: FastifyInstance) {
  // 1. Get All Vendors (with optional category & search filter) - Drizzle ORM
  fastify.get('/vendors', async (request: FastifyRequest<{ Querystring: { category?: string; search?: string; city?: string } }>, reply: FastifyReply) => {
    try {
      const { category, search, city } = request.query || {};

      const conditions: SQL[] = [];
      if (category && category !== 'ALL') {
        conditions.push(eq(vendors.category, category.toUpperCase()));
      }
      if (city && city !== 'ALL') {
        conditions.push(ilike(vendors.city, `%${city}%`));
      }
      if (search) {
        conditions.push(ilike(vendors.businessName, `%${search}%`));
      }

      const allVendors = conditions.length > 0 
        ? await db.select().from(vendors).where(and(...conditions)).orderBy(desc(vendors.ratingScore))
        : await db.select().from(vendors).orderBy(desc(vendors.ratingScore));

      // Category breakdown counts using Drizzle ORM
      const countsResult = await db
        .select({
          category: vendors.category,
          total: count(),
        })
        .from(vendors)
        .groupBy(vendors.category);

      const categoryRows = await db
        .select({
          key: masterOptions.optionKey,
        })
        .from(masterOptions)
        .where(eq(masterOptions.category, 'VENDOR_CATEGORY'));

      const countsMap: Record<string, number> = {
        ALL: allVendors.length,
      };

      for (const cat of categoryRows) {
        countsMap[cat.key] = 0;
      }

      for (const row of countsResult) {
        countsMap[row.category] = Number(row.total);
      }

      return {
        success: true,
        data: allVendors,
        counts: countsMap,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve vendors';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 2. Create New Vendor (Admin / Lead Planner) - Drizzle ORM
  fastify.post('/vendors', async (request: FastifyRequest<{ Body: CreateVendorBody }>, reply: FastifyReply) => {
    try {
      const {
        businessName,
        category,
        contactPerson = '',
        phone,
        email = '',
        city = 'Jaipur',
        ratingScore = 4.90,
        pricingEstimate = '',
        specialties = '',
      } = request.body || {};

      if (!businessName || !category || !phone) {
        reply.status(400);
        return {
          success: false,
          message: 'Business name, category, and phone number are required.',
        };
      }

      const formattedCategory = category.toUpperCase();

      const [created] = await db
        .insert(vendors)
        .values({
          businessName,
          category: formattedCategory,
          contactPerson,
          phone,
          email,
          city,
          ratingScore: ratingScore ? String(ratingScore) : '4.90',
          bankAccountInfo: {
            pricingEstimate,
            specialties,
          },
        })
        .returning();

      return {
        success: true,
        message: 'Vendor registered successfully.',
        data: created,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register vendor';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 3. Get Single Vendor Details with Quotes History & Wedding Associations (Drizzle ORM)
  fastify.get('/vendors/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      if (!isUUID(id)) {
        reply.status(400);
        return { success: false, message: 'Invalid vendor UUID format.' };
      }

      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, id))
        .limit(1);

      if (!vendor) {
        reply.status(404);
        return { success: false, message: 'Vendor not found.' };
      }

      // Fetch quote history joined with weddings and clients (Drizzle ORM)
      const quotesHistory = await db
        .select({
          quoteId: vendorQuotes.id,
          quoteReference: vendorQuotes.quoteReference,
          baseCost: vendorQuotes.baseCost,
          pricePerPlate: vendorQuotes.pricePerPlate,
          overtimeHourlyRate: vendorQuotes.overtimeHourlyRate,
          status: vendorQuotes.status,
          decisionReason: vendorQuotes.decisionReason,
          decidedAt: vendorQuotes.decidedAt,
          inclusions: vendorQuotes.inclusions,
          exclusions: vendorQuotes.exclusions,
          rfqId: rfqRequests.id,
          serviceCategory: rfqRequests.serviceCategory,
          weddingId: weddings.id,
          weddingCode: weddings.code,
          weddingCity: weddings.destinationCity,
          weddingVenue: weddings.primaryVenue,
          weddingStartDate: weddings.startDate,
          coupleName: sql<string>`concat(${clients.brideName}, ' & ', ${clients.groomName})`,
        })
        .from(vendorQuotes)
        .leftJoin(rfqRequests, eq(vendorQuotes.rfqId, rfqRequests.id))
        .leftJoin(weddings, eq(rfqRequests.weddingId, weddings.id))
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .where(eq(vendorQuotes.vendorId, id))
        .orderBy(desc(vendorQuotes.decidedAt));

      // Metrics
      const totalQuotes = quotesHistory.length;
      const awardedQuotes = quotesHistory.filter(
        (q) => q.status === 'ACCEPTED' || q.status === 'AWARDED'
      ).length;
      const winRate = totalQuotes > 0 ? Math.round((awardedQuotes / totalQuotes) * 100) : 0;

      return {
        success: true,
        data: {
          ...vendor,
          quotes: quotesHistory,
          metrics: {
            totalQuotes,
            awardedQuotes,
            winRate,
          },
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve vendor details';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 4. Update Vendor Profile (Drizzle ORM)
  fastify.put('/vendors/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateVendorBody> }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      if (!isUUID(id)) {
        reply.status(400);
        return { success: false, message: 'Invalid vendor UUID format.' };
      }

      const {
        businessName,
        category,
        contactPerson,
        phone,
        email,
        city,
        ratingScore,
        pricingEstimate,
        specialties,
      } = request.body || {};

      const updateData: Partial<typeof vendors.$inferInsert> = {};
      if (businessName) updateData.businessName = businessName;
      if (category) updateData.category = category.toUpperCase();
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (city !== undefined) updateData.city = city;
      if (ratingScore !== undefined) updateData.ratingScore = String(ratingScore);
      if (pricingEstimate !== undefined || specialties !== undefined) {
        updateData.bankAccountInfo = {
          pricingEstimate,
          specialties,
        };
      }

      const [updated] = await db
        .update(vendors)
        .set(updateData)
        .where(eq(vendors.id, id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Vendor not found.' };
      }

      return {
        success: true,
        message: 'Vendor profile updated successfully.',
        data: updated,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vendor';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 5. Get Weddings Overview with RFQs & Quotes (Pure Drizzle ORM)
  fastify.get('/weddings-overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Drizzle ORM join for weddings & clients
      const weddingsRows = await db
        .select({
          id: weddings.id,
          code: weddings.code,
          couple_name: sql<string>`concat(${clients.brideName}, ' & ', ${clients.groomName})`,
          destination_city: weddings.destinationCity,
          primary_venue: weddings.primaryVenue,
          start_date: weddings.startDate,
          estimated_guest_count: weddings.estimatedGuestCount,
          total_budget: weddings.totalBudget,
          wedding_status: weddings.status,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .orderBy(weddings.startDate);

      // Drizzle ORM join for RFQ requests, quotes, and vendors
      const rfqsRows = await db
        .select({
          rfq_id: rfqRequests.id,
          wedding_id: rfqRequests.weddingId,
          service_category: rfqRequests.serviceCategory,
          rfq_status: rfqRequests.status,
          quote_id: vendorQuotes.id,
          quote_status: vendorQuotes.status,
          base_cost: vendorQuotes.baseCost,
          price_per_plate: vendorQuotes.pricePerPlate,
          overtime_hourly_rate: vendorQuotes.overtimeHourlyRate,
          decision_reason: vendorQuotes.decisionReason,
          vendor_id: vendors.id,
          business_name: vendors.businessName,
          rating_score: vendors.ratingScore,
          phone: vendors.phone,
          vendor_city: vendors.city,
        })
        .from(rfqRequests)
        .leftJoin(vendorQuotes, eq(vendorQuotes.rfqId, rfqRequests.id))
        .leftJoin(vendors, eq(vendorQuotes.vendorId, vendors.id))
        .orderBy(rfqRequests.createdAt);

      const weddingMap: Record<string, WeddingOverviewGroup> = {};
      for (const w of weddingsRows) {
        weddingMap[w.id] = {
          ...w,
          categories: {
            CATERER: { status: 'NOT_STARTED', quotes: [], winner: null },
            DJ: { status: 'NOT_STARTED', quotes: [], winner: null },
            DECORATOR: { status: 'NOT_STARTED', quotes: [], winner: null },
          },
        };
      }

      for (const row of rfqsRows) {
        const wed = weddingMap[row.wedding_id];
        if (!wed) continue;

        const cat = row.service_category;
        if (!wed.categories[cat]) {
          wed.categories[cat] = { status: 'OPEN', quotes: [], winner: null };
        }

        if (row.rfq_status === 'AWARDED') {
          wed.categories[cat].status = 'AWARDED';
        } else if (wed.categories[cat].status === 'NOT_STARTED') {
          wed.categories[cat].status = 'OPEN';
        }

        if (row.quote_id) {
          const isWinner = row.quote_status === 'ACCEPTED' || row.quote_status === 'AWARDED';

          const quoteObj: QuoteOverviewItem = {
            id: row.quote_id,
            rfqId: row.rfq_id,
            vendorId: row.vendor_id,
            businessName: row.business_name,
            rating: row.rating_score,
            phone: row.phone,
            city: row.vendor_city,
            baseCost: row.base_cost,
            pricePerPlate: row.price_per_plate,
            overtimeHourlyRate: row.overtime_hourly_rate,
            status: row.quote_status,
            decisionReason: row.decision_reason,
            isWinner,
          };

          wed.categories[cat].quotes.push(quoteObj);

          if (isWinner) {
            wed.categories[cat].winner = quoteObj;
          }
        }
      }

      return {
        success: true,
        data: Object.values(weddingMap),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve weddings overview';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 4. Assign Vendor Options to a Wedding (Drizzle ORM)
  fastify.post('/assign-options', async (request: FastifyRequest<{ Body: AssignOptionsBody }>, reply: FastifyReply) => {
    try {
      const { weddingId, category, vendorIds, description } = request.body || {};

      if (!weddingId || !category || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        reply.status(400);
        return {
          success: false,
          message: 'Wedding ID, category, and at least one vendor are required.',
        };
      }

      const formattedCategory = category.toUpperCase();

      // Resolve weddingId to valid UUID if human-readable code was passed
      let resolvedWeddingId = weddingId;
      if (!isUUID(weddingId)) {
        const [w] = await db
          .select({ id: weddings.id })
          .from(weddings)
          .where(eq(weddings.code, weddingId))
          .limit(1);
        if (w) resolvedWeddingId = w.id;
      }

      // Check if RFQ exists using Drizzle ORM
      let rfq = (await db
        .select()
        .from(rfqRequests)
        .where(and(eq(rfqRequests.weddingId, resolvedWeddingId), eq(rfqRequests.serviceCategory, formattedCategory)))
        .limit(1))[0];

      if (!rfq) {
        const [createdRfq] = await db
          .insert(rfqRequests)
          .values({
            weddingId: resolvedWeddingId,
            serviceCategory: formattedCategory,
            description: description || `Shortlisted ${formattedCategory} options for wedding review`,
            requiredGuestCount: 400,
            status: 'OPEN',
          })
          .returning();
        rfq = createdRfq;
      } else {
        await db.update(rfqRequests).set({ status: 'OPEN' }).where(eq(rfqRequests.id, rfq.id));
      }

      // Default baseline costs based on category
      const baselineMap: Record<string, { base: string; plate?: string; overtime?: string; ref: string }> = {
        CATERER: { base: '840000.00', plate: '2100.00', overtime: '12000.00', ref: 'CAT' },
        DJ: { base: '250000.00', overtime: '15000.00', ref: 'DJ' },
        DECORATOR: { base: '1200000.00', overtime: '25000.00', ref: 'DEC' },
        PHOTOGRAPHY: { base: '450000.00', overtime: '10000.00', ref: 'PH' },
      };

      const baseInfo = baselineMap[formattedCategory] || { base: '500000.00', ref: 'VND' };

      // Insert quotes for selected vendors if not already present
      for (let i = 0; i < vendorIds.length; i++) {
        const vid = vendorIds[i];

        const existingQuote = (await db
          .select()
          .from(vendorQuotes)
          .where(and(eq(vendorQuotes.rfqId, rfq.id), eq(vendorQuotes.vendorId, vid)))
          .limit(1))[0];

        if (!existingQuote) {
          const quoteNum = Math.floor(100 + Math.random() * 900);
          const baseVariation = Number(baseInfo.base) + (i * 35000);
          const plateVariation = baseInfo.plate ? Number(baseInfo.plate) + (i * 120) : undefined;

          await db.insert(vendorQuotes).values({
            rfqId: rfq.id,
            vendorId: vid,
            quoteReference: `RK-${baseInfo.ref}-${quoteNum}`,
            baseCost: String(baseVariation),
            pricePerPlate: plateVariation ? String(plateVariation) : undefined,
            overtimeHourlyRate: baseInfo.overtime || '15000.00',
            status: 'PENDING',
            lineItems: [
              { item: `${formattedCategory} Curated Option`, cost: baseVariation }
            ],
            inclusions: 'Verified high-end equipment, professional crew & setup supervision',
            exclusions: 'Taxes, venue utility surcharge',
          });
        } else {
          await db.update(vendorQuotes).set({ status: 'PENDING' }).where(eq(vendorQuotes.id, existingQuote.id));
        }
      }

      // Clean up deselected quotes for this RFQ (only delete if not already ACCEPTED / AWARDED)
      const existingQuotesForRfq = await db
        .select()
        .from(vendorQuotes)
        .where(eq(vendorQuotes.rfqId, rfq.id));

      for (const eqQuote of existingQuotesForRfq) {
        if (!vendorIds.includes(eqQuote.vendorId) && eqQuote.status !== 'ACCEPTED') {
          await db.delete(vendorQuotes).where(eq(vendorQuotes.id, eqQuote.id));
        }
      }

      return {
        success: true,
        message: `Successfully updated assigned vendor options for this wedding category.`,
        rfqId: rfq.id,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vendor options';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 5. Unassign / Remove a Single Quote from Wedding Sourcing (Drizzle ORM)
  fastify.post('/unassign-quote', async (request: FastifyRequest<{ Body: { quoteId: string } }>, reply: FastifyReply) => {
    try {
      const { quoteId } = request.body || {};
      if (!quoteId) {
        reply.status(400);
        return { success: false, message: 'Quote ID is required.' };
      }

      const quote = (await db.select().from(vendorQuotes).where(eq(vendorQuotes.id, quoteId)).limit(1))[0];
      if (!quote) {
        reply.status(404);
        return { success: false, message: 'Quote not found.' };
      }

      if (quote.status === 'ACCEPTED') {
        reply.status(400);
        return { success: false, message: 'Cannot unassign an awarded winning vendor.' };
      }

      await db.delete(vendorQuotes).where(eq(vendorQuotes.id, quoteId));

      return {
        success: true,
        message: 'Vendor option successfully removed from this wedding.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unassign quote';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 6. Edit Negotiated Pricing for an Assigned Quote (Drizzle ORM)
  fastify.post('/edit-quote', async (request: FastifyRequest<{ Body: { quoteId: string; baseCost?: string; pricePerPlate?: string; overtimeHourlyRate?: string } }>, reply: FastifyReply) => {
    try {
      const { quoteId, baseCost, pricePerPlate, overtimeHourlyRate } = request.body || {};
      if (!quoteId) {
        reply.status(400);
        return { success: false, message: 'Quote ID is required.' };
      }

      const updateData: Partial<typeof vendorQuotes.$inferInsert> = {};
      if (baseCost !== undefined) updateData.baseCost = String(baseCost);
      if (pricePerPlate !== undefined) updateData.pricePerPlate = pricePerPlate ? String(pricePerPlate) : null;
      if (overtimeHourlyRate !== undefined) updateData.overtimeHourlyRate = overtimeHourlyRate ? String(overtimeHourlyRate) : null;

      await db.update(vendorQuotes).set(updateData).where(eq(vendorQuotes.id, quoteId));

      return {
        success: true,
        message: 'Vendor quote pricing successfully updated.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to edit quote';
      reply.status(500);
      return { success: false, error: msg };
    }
  });

  // 5. Select Winner (Drizzle ORM)
  fastify.post('/select-winner', async (request: FastifyRequest<{ Body: SelectWinnerBody }>, reply: FastifyReply) => {
    try {
      const { quoteId, reason = 'Selected and confirmed by wedding team' } = request.body || {};

      if (!quoteId) {
        reply.status(400);
        return { success: false, message: 'Quote ID is required.' };
      }

      const quote = (await db.select().from(vendorQuotes).where(eq(vendorQuotes.id, quoteId)).limit(1))[0];

      if (!quote) {
        reply.status(404);
        return { success: false, message: 'Quote not found.' };
      }

      // Mark selected quote as ACCEPTED (Drizzle ORM)
      await db
        .update(vendorQuotes)
        .set({
          status: 'ACCEPTED',
          decisionReason: reason,
          decidedAt: new Date(),
        })
        .where(eq(vendorQuotes.id, quoteId));

      // Auto-reject competing quotes (Drizzle ORM)
      await db
        .update(vendorQuotes)
        .set({
          status: 'AUTO_REJECTED',
          decisionReason: 'Auto-closed following selection of winning vendor option',
          decidedAt: new Date(),
        })
        .where(and(eq(vendorQuotes.rfqId, quote.rfqId), ne(vendorQuotes.id, quoteId)));

      // Update RFQ status to AWARDED (Drizzle ORM)
      await db
        .update(rfqRequests)
        .set({ status: 'AWARDED' })
        .where(eq(rfqRequests.id, quote.rfqId));

      return {
        success: true,
        message: 'Vendor successfully awarded and recorded as winner!',
        quoteId,
        rfqId: quote.rfqId,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to select winner';
      reply.status(500);
      return { success: false, error: msg };
    }
  });
}
