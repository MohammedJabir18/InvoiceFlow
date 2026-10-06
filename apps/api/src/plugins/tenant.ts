import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Kysely, Transaction } from 'kysely';
import {
  type Database,
  type MembershipRole,
  getUserMembership,
  withTenantContext,
} from '@invoiceflow/db';

declare module 'fastify' {
  interface FastifyRequest {
    organizationId?: string;
    membershipRole?: MembershipRole;
    withTenantContext?: <T>(
      operation: (tx: Transaction<Database>) => Promise<T>
    ) => Promise<T>;
  }
}

/**
 * Fastify preHandler hook that enforces organization boundary and membership verification.
 * 
 * Rules:
 * 1. The caller MUST be authenticated (request.user populated from JWT 'sub').
 * 2. Organization ID is resolved from route params (:organizationId or :id) or 'x-organization-id' header.
 * 3. The server queries verified membership using the explicit secured path (getUserMembership).
 *    A client-provided organization ID is NEVER trusted alone without verified membership.
 * 4. If membership does not exist, immediately rejects with 403 Forbidden.
 * 5. Injects request.withTenantContext helper ensuring all tenant operations execute with
 *    SELECT set_config('app.current_org_id', $orgId, true) on the exact same connection.
 */
export function requireOrganizationMembership(
  db: Kysely<Database>,
  allowedRoles?: MembershipRole[]
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user || !request.user.id) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before organization authorization',
        },
      });
      return;
    }

    const params = request.params as Record<string, string> | undefined;
    const targetOrgId =
      params?.organizationId ||
      params?.id ||
      (request.headers['x-organization-id'] as string | undefined);

    if (!targetOrgId || typeof targetOrgId !== 'string') {
      reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing required organization ID in route parameters or x-organization-id header',
        },
      });
      return;
    }

    // Verify membership via secured stored function
    const membershipRole = await getUserMembership(db, request.user.id, targetOrgId);

    if (!membershipRole) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN_ORGANIZATION_ACCESS',
          message: 'Access denied: You are not a member of the requested organization',
        },
      });
      return;
    }

    // Check role authorization if restricted roles are specified
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(membershipRole)) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${membershipRole}`,
        },
      });
      return;
    }

    request.organizationId = targetOrgId;
    request.membershipRole = membershipRole;

    // Attach transaction-scoped execution helper
    request.withTenantContext = async <T>(
      operation: (tx: Transaction<Database>) => Promise<T>
    ): Promise<T> => {
      return await withTenantContext(targetOrgId, db, operation);
    };
  };
}
