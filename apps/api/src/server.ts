import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createDbPool, createKyselyDb, type Database } from '@invoiceflow/db';
import type { Kysely } from 'kysely';
import { getConfig } from './config.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { organizationRoutes } from './routes/organizations.js';
import { memberRoutes } from './routes/members.js';

export interface BuildServerOptions {
  db?: Kysely<Database>;
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const config = getConfig();

  const app = fastify({
    logger: config.NODE_ENV !== 'test',
  });

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  // Cross-Origin Resource Sharing
  await app.register(cors, {
    origin: [config.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  });

  // Database Connection
  const db =
    options.db ??
    createKyselyDb(
      createDbPool({
        connectionString: config.DATABASE_URL,
        maxConnections: 10,
      })
    );

  // Register Routes
  await app.register(healthRoutes, { db });
  await app.register(authRoutes, { db });
  await app.register(organizationRoutes, { db });
  await app.register(memberRoutes, { db });

  return app;
}
