import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { users } from '../../db/schema';
import { sql } from 'drizzle-orm';
import { DEMO_USERS } from '../../seeds/users';

/**
 * Route: GET /api/auth/me
 * Verifies JWT token and returns current authenticated user profile
 */
export function registerGetMe(fastify: FastifyInstance) {
  fastify.get(
    '/me',
    {
      onRequest: [
        async (request: FastifyRequest, reply: FastifyReply) => {
          try {
            await request.jwtVerify();
          } catch (err: any) {
            reply.status(401);
            return reply.send({ success: false, message: 'Unauthorized: Invalid or expired token' });
          }
        },
      ],
    },
    async (request: FastifyRequest) => {
      const decoded = request.user as { userId: string; role: string };

      let user: any = null;
      try {
        const rows = await db.select().from(users).where(sql`${users.id} = ${decoded.userId}`);
        if (rows.length > 0) {
          user = rows[0];
        }
      } catch {}

      if (!user) {
        user = DEMO_USERS.find((u: any) => u.id === decoded.userId) || {
          id: decoded.userId,
          email: '',
          full_name: 'Authenticated User',
          role: decoded.role,
          title: decoded.role,
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: (user as any).fullName || user.full_name,
          role: user.role,
          title: user.title || user.role,
        },
      };
    }
  );
}
