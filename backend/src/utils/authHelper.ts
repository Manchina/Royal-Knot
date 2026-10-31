import { FastifyRequest } from 'fastify';
import { db } from '../db';
import { users, weddings, clients, enquiries } from '../db/schema';
import { eq, sql, and, isNotNull } from 'drizzle-orm';

export interface AuthContext {
  userId: string;
  role: string;
  clientWeddingId?: string | null;
}

/**
 * Extracts and verifies the authenticated user from the request JWT.
 * For users with role 'CLIENT', resolves the specific wedding UUID that belongs to them.
 */
export async function getAuthUser(request: FastifyRequest): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const decoded = (await request.jwtVerify()) as { userId: string; role: string };
    if (!decoded || !decoded.userId) return null;

    let clientWeddingId: string | null = null;

    if (decoded.role === 'CLIENT') {
      // Find the user email
      const [u] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (u?.email) {
        const userEmail = u.email.trim();

        // 1. Check via clients table joined with weddings
        const clientWeddings = await db
          .select({ weddingId: weddings.id })
          .from(weddings)
          .innerJoin(clients, eq(weddings.clientId, clients.id))
          .where(sql`LOWER(${clients.email}) = LOWER(${userEmail})`)
          .limit(1);

        if (clientWeddings.length && clientWeddings[0].weddingId) {
          clientWeddingId = clientWeddings[0].weddingId;
        } else {
          // 2. Check via enquiries table
          const enqWeddings = await db
            .select({ weddingId: enquiries.weddingId })
            .from(enquiries)
            .where(
              and(
                sql`LOWER(${enquiries.email}) = LOWER(${userEmail})`,
                isNotNull(enquiries.weddingId)
              )
            )
            .limit(1);

          if (enqWeddings.length && enqWeddings[0].weddingId) {
            clientWeddingId = enqWeddings[0].weddingId;
          }
        }
      }

      // 3. Fallback for the default demo client account (Aanya & Raghav, Udaipur)
      if (!clientWeddingId) {
        clientWeddingId = 'c0000001-0000-0000-0000-000000000001';
      }
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
      clientWeddingId,
    };
  } catch {
    return null;
  }
}
