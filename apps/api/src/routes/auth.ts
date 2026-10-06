import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import { type Database, getUserOrganizations, upsertUser } from '@invoiceflow/db';
import { authenticateToken } from '../plugins/auth.js';

const syncUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
});

export async function authRoutes(app: FastifyInstance, opts: { db: Kysely<Database> }) {
  // Sync authenticated user profile into users table
  app.post(
    '/api/auth/sync',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user!;
      const parseResult = syncUserSchema.safeParse(request.body);
      const fullName = parseResult.success ? parseResult.data.fullName : user.email.split('@')[0];

      await upsertUser(opts.db, {
        id: user.id,
        email: user.email,
        fullName,
      });

      return reply.status(200).send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName,
        },
      });
    }
  );

  // Get current user profile and memberships
  app.get(
    '/api/auth/me',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user!;
      const orgs = await getUserOrganizations(opts.db, user.id);

      return reply.status(200).send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          organizations: orgs.map((o) => ({
            id: o.organization_id,
            legalName: o.legal_name,
            displayName: o.display_name,
            role: o.role,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          })),
        },
      });
    }
  );
}
