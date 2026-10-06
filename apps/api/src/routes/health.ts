import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '@invoiceflow/db';

export async function healthRoutes(app: FastifyInstance, opts: { db: Kysely<Database> }) {
  app.get('/health', async (_request, reply) => {
    try {
      const result = await sql<{ status: number }>`SELECT 1 as status`.execute(opts.db);
      if (result.rows.length > 0) {
        return reply.status(200).send({
          status: 'healthy',
          database: 'connected',
          timestamp: new Date().toISOString(),
        });
      }
      return reply.status(503).send({ status: 'unhealthy', database: 'disconnected' });
    } catch (err: any) {
      return reply.status(503).send({
        status: 'unhealthy',
        database: 'error',
        error: err.message,
      });
    }
  });
}
