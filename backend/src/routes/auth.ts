import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DEMO_USERS } from '../seeds/users';

export async function authRoutes(fastify: FastifyInstance) {
  // Login route
  fastify.post('/login', async (request: FastifyRequest<{ Body: { email: string; password?: string } }>, reply: FastifyReply) => {
    const { email } = request.body || {};

    if (!email) {
      reply.status(400);
      return { success: false, message: 'Email is required' };
    }

    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      reply.status(401);
      return { success: false, message: 'Invalid credentials. Use demo accounts or quick login.' };
    }

    // Keep only userId and role in JWT payload
    const token = fastify.jwt.sign({
      userId: user.id,
      role: user.role,
    }, { expiresIn: '7d' });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        title: user.title,
      },
    };
  });

  // Verify token & Get current user
  fastify.get('/me', {
    onRequest: [async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err: any) {
        reply.status(401);
        return reply.send({ success: false, message: 'Unauthorized: Invalid or expired token' });
      }
    }],
  }, async (request: FastifyRequest) => {
    const decoded = request.user as { userId: string; role: string };
    const user = DEMO_USERS.find((u) => u.id === decoded.userId) || {
      id: decoded.userId,
      email: '',
      full_name: 'Authenticated User',
      role: decoded.role,
      title: decoded.role,
    };

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        title: user.title || user.role,
      },
    };
  });

  // Available roles for preview
  fastify.get('/roles', async () => {
    return {
      success: true,
      roles: DEMO_USERS.map((u) => ({
        role: u.role,
        email: u.email,
        full_name: u.full_name,
        title: u.title,
      })),
    };
  });
}
