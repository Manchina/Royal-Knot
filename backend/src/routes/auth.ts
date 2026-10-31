import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { isUUID } from '../utils';

export async function authRoutes(fastify: FastifyInstance) {
  // Login route
  fastify.post('/login', async (request: FastifyRequest<{ Body: { email: string; password?: string } }>, reply: FastifyReply) => {
    const { email } = request.body || {};

    if (!email) {
      reply.status(400);
      return { success: false, message: 'Email is required' };
    }

    try {
      const rows = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
        .limit(1);

      if (!rows.length) {
        reply.status(401);
        return { success: false, message: 'Invalid credentials. User not found in database.' };
      }

      const user = rows[0];

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
          full_name: user.fullName,
          role: user.role,
          title: user.title || user.role,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database authentication error';
      fastify.log.error(msg);
      reply.status(500);
      return { success: false, message: msg };
    }
  });

  // Verify token & Get current user
  fastify.get(
    '/me',
    {
      onRequest: [
        async (request: FastifyRequest, reply: FastifyReply) => {
          try {
            await request.jwtVerify();
          } catch {
            reply.status(401);
            return reply.send({ success: false, message: 'Unauthorized: Invalid or expired token' });
          }
        },
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const decoded = request.user as { userId: string; role: string };

      if (!isUUID(decoded.userId)) {
        reply.status(401);
        return { success: false, message: 'Invalid user session' };
      }

      const rows = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (!rows.length) {
        reply.status(401);
        return { success: false, message: 'User record not found in database' };
      }

      const user = rows[0];
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          title: user.title || user.role,
        },
      };
    }
  );

  // Available roles for preview strictly from database
  fastify.get('/roles', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await db
        .select({
          id: users.id,
          role: users.role,
          email: users.email,
          full_name: users.fullName,
          title: users.title,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(sql`${users.createdAt} ASC`);

      return {
        success: true,
        roles: rows.map((u) => ({
          id: u.id,
          role: u.role,
          email: u.email,
          full_name: u.full_name,
          title: u.title || u.role,
        })),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve roles from database';
      reply.status(500);
      return { success: false, message: msg, roles: [] };
    }
  });
}
