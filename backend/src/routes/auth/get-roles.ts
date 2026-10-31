import { FastifyInstance } from 'fastify';
import { db } from '../../db';
import { users } from '../../db/schema';
import { sql } from 'drizzle-orm';
import { DEMO_USERS } from '../../seeds/users';

/**
 * Route: GET /api/auth/roles
 * Lists available user roles and accounts for quick login preview
 */
export function registerGetRoles(fastify: FastifyInstance) {
  fastify.get('/roles', async () => {
    try {
      const rows = await db
        .select()
        .from(users)
        .where(sql`${users.isActive} = TRUE`)
        .orderBy(sql`${users.createdAt} ASC`);
      if (rows.length > 0) {
        return {
          success: true,
          roles: rows.map((u: any) => ({
            id: u.id,
            role: u.role,
            email: u.email,
            full_name: u.fullName || u.full_name,
            title: u.title || u.role,
          })),
        };
      }
    } catch {}

    return {
      success: true,
      roles: DEMO_USERS.map((u) => ({
        id: u.id,
        role: u.role,
        email: u.email,
        full_name: u.full_name,
        title: u.title,
      })),
    };
  });
}
