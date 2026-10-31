import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries, clients, weddings, enquiryChangeLogs, users } from '../../db/schema';
import { eq, count } from 'drizzle-orm';
import { matchEnquiry } from './types';

/**
 * Route: POST /api/enquiries/:id/convert
 * Converts a signed enquiry into a live Wedding Project and provisions client portal access
 */
export function registerPostConvertEnquiry(fastify: FastifyInstance) {
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
      } catch (logErr: any) {
        fastify.log.warn(`Change log insert error: ${logErr.message}`);
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
    } catch (err: any) {
      fastify.log.error(`Enquiry conversion error via Drizzle: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
