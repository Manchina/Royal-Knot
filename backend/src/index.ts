import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { checkDatabaseConnection, pool } from './db';
import { authRoutes } from './routes/auth';
import { enquiryRoutes } from './routes/enquiries';
import { billingRoutes } from './routes/billing';
import { analyticsRoutes } from './routes/analytics';

dotenv.config();

// Backend server initialized

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'royal_knot_luxury_wedding_jwt_secret_2026';

async function buildServer() {
  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register JWT
  await fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      message: 'The Royal Knot API is operational',
      auth: '/api/auth/login',
      docs: '/api/health',
      timestamp: new Date().toISOString(),
    };
  });

  // Health and Database connection check endpoint
  fastify.get('/api/health', async () => {
    const dbStatus = await checkDatabaseConnection();
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  });

  // Quick seed / test query route
  fastify.get('/api/db-test', async (request, reply) => {
    try {
      const res = await pool.query('SELECT NOW() as current_time');
      return {
        success: true,
        data: res.rows[0],
      };
    } catch (err: any) {
      reply.status(500);
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // Mount Auth Routes under /api/auth
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // Mount Enquiry & Lead Capture Routes under /api/enquiries
  await fastify.register(enquiryRoutes, { prefix: '/api/enquiries' });

  // Mount Billing & Extra Charges Routes under /api/billing (PeopleFirst standard)
  await fastify.register(billingRoutes, { prefix: '/api/billing' });

  // Mount Founder Analytics & Season P&L Routes under /api/analytics
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 Server listening at http://localhost:${PORT}`);
    
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      console.log(`✅ PostgreSQL Connected successfully! (${dbCheck.version?.split(' ')[0]} ${dbCheck.version?.split(' ')[1]})\n`);
      // Auto-seed if database is empty on server startup
      const { runAutoSeedIfEmpty } = await import('./db/seed');
      await runAutoSeedIfEmpty();
    } else {
      console.warn(`⚠️ PostgreSQL connection warning: ${dbCheck.error}`);
      console.warn(`👉 Make sure your DATABASE_URL in server/.env is configured properly.\n`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
