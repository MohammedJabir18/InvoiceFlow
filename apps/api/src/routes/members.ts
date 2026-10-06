import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database, MembershipRole } from '@invoiceflow/db';
import { authenticateToken } from '../plugins/auth.js';
import { requireOrganizationMembership } from '../plugins/tenant.js';

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'FINANCE', 'VIEWER']).default('VIEWER'),
});

export async function memberRoutes(app: FastifyInstance, opts: { db: Kysely<Database> }) {
  // 1. List members of the organization
  app.get(
    '/api/organizations/:id/members',
    { preHandler: [authenticateToken, requireOrganizationMembership(opts.db)] },
    async (request, reply) => {
      const orgId = request.organizationId!;

      const members = await request.withTenantContext!(async (tx) => {
        return await tx
          .selectFrom('organization_memberships')
          .innerJoin('users', 'users.id', 'organization_memberships.user_id')
          .select([
            'organization_memberships.id as membershipId',
            'organization_memberships.role as role',
            'organization_memberships.created_at as joinedAt',
            'users.id as userId',
            'users.email as email',
            'users.full_name as fullName',
          ])
          .where('organization_memberships.organization_id', '=', orgId)
          .execute();
      });

      return reply.status(200).send({
        success: true,
        data: members.map((m) => ({
          id: m.membershipId,
          userId: m.userId,
          email: m.email,
          fullName: m.fullName,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      });
    }
  );

  // 2. Add member (OWNER or ADMIN only)
  app.post(
    '/api/organizations/:id/members',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const parseResult = addMemberSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid member data',
            details: parseResult.error.flatten(),
          },
        });
      }

      const { userId, role } = parseResult.data;

      const created = await request.withTenantContext!(async (tx) => {
        return await tx
          .insertInto('organization_memberships')
          .values({
            organization_id: orgId,
            user_id: userId,
            role: role as MembershipRole,
          })
          .returningAll()
          .executeTakeFirst();
      }).catch((err: any) => {
        if (err?.code === '23505' || err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
          reply.status(409).send({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'User is already a member of this organization',
            },
          });
          return null;
        }
        if (err?.code === '23503' || err?.message?.includes('foreign key') || err?.message?.includes('violates foreign key constraint') || err?.message === 'User does not exist') {
          reply.status(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'User does not exist',
            },
          });
          return null;
        }
        throw err;
      });

      if (!created) return;

      return reply.status(201).send({
        success: true,
        data: created,
      });
    }
  );

  // 3. Revoke/Remove member (OWNER or ADMIN only)
  app.delete(
    '/api/organizations/:id/members/:userId',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const targetUserId = (request.params as any).userId;

      const result = await request.withTenantContext!(async (tx) => {
        // Concurrency lock: Serialize member removals for this tenant to eliminate race condition
        await tx
          .selectFrom('organizations')
          .select('id')
          .where('id', '=', orgId)
          .forUpdate()
          .executeTakeFirst();

        // Check if removing an owner and ensure at least one owner remains
        const targetMember = await tx
          .selectFrom('organization_memberships')
          .selectAll()
          .where('organization_id', '=', orgId)
          .where('user_id', '=', targetUserId)
          .executeTakeFirst();

        if (!targetMember) {
          return { found: false, lastOwner: false };
        }

        if (targetMember.role === 'OWNER') {
          const ownerCountResult = await tx
            .selectFrom('organization_memberships')
            .select(tx.fn.count<number>('id').as('count'))
            .where('organization_id', '=', orgId)
            .where('role', '=', 'OWNER')
            .executeTakeFirst();

          const count = Number(ownerCountResult?.count ?? 0);
          if (count <= 1) {
            return { found: true, lastOwner: true };
          }
        }

        await tx
          .deleteFrom('organization_memberships')
          .where('organization_id', '=', orgId)
          .where('user_id', '=', targetUserId)
          .execute();

        return { found: true, lastOwner: false };
      });

      if (!result.found) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Membership not found',
          },
        });
      }

      if (result.lastOwner) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_LAST_OWNER',
            message: 'Cannot remove the last owner of the organization',
          },
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Membership revoked successfully',
      });
    }
  );
}
