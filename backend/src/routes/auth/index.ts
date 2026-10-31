import { FastifyInstance } from 'fastify';
import { registerPostLogin } from './post-login';
import { registerGetMe } from './get-me';
import { registerGetRoles } from './get-roles';

/**
 * Auth Module - Mounts authentication, token verification and role preview routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  registerPostLogin(fastify);
  registerGetMe(fastify);
  registerGetRoles(fastify);
}
