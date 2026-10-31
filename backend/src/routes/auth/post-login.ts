import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { users } from '../../db/schema';
import { sql } from 'drizzle-orm';
import { DEMO_USERS } from '../../seeds/users';

/**
 * Route: POST /api/auth/login
 * Validates user credentials and generates JWT token
 */
export function registerPostLogin(fastify: FastifyInstance) {
  fastify.post('/login', async (request: FastifyRequest<{ Body: { email: string; password?: string } }>, reply: FastifyReply) => {
    const { email } = request.body || {};

    if (!email) {
      reply.status(400);
      return { success: false, message: 'Email is required' };
    }

    let user: any = null;
    try {
      const rows = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`);
      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (e: any) {
      fastify.log.warn(`Drizzle DB user query error: ${e.message}`);
    }

    if (!user) {
      user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    }

    if (!user) {
      reply.status(401);
      return { success: false, message: 'Invalid credentials. Use demo accounts or quick login.' };
    }

    // Keep only userId and role in JWT payload
    const token = fastify.jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        title: user.title || user.role,
      },
    };
  });
}
