import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database, DbClient } from '@invoiceflow/db';
import { authenticateToken } from '../plugins/auth.js';
import { requireOrganizationMembership } from '../plugins/tenant.js';

const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(200),
  email: z.string().trim().email('Invalid email address').max(255).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  taxIdentifier: z.string().trim().max(100).optional().nullable(),
  addressLine1: z.string().trim().max(255).optional().nullable(),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  stateProvince: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().length(2, 'Country must be a 2-letter ISO code').optional().nullable().or(z.literal('')),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
});

const updateClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name cannot be empty').max(200).optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  taxIdentifier: z.string().trim().max(100).optional().nullable(),
  addressLine1: z.string().trim().max(255).optional().nullable(),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  stateProvince: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().length(2, 'Country must be a 2-letter ISO code').optional().nullable().or(z.literal('')),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

const orgParamsSchema = z.object({
  id: z.string().uuid({ message: 'Organization ID must be a valid UUID' }),
});

const clientParamsSchema = z.object({
  id: z.string().uuid({ message: 'Organization ID must be a valid UUID' }),
  clientId: z.string().uuid({ message: 'Client ID must be a valid UUID' }),
});

const listClientsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).optional().default('ACTIVE'),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(50),
});

function formatClientResponse(row: DbClient) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    taxIdentifier: row.tax_identifier,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    stateProvince: row.state_province,
    postalCode: row.postal_code,
    country: row.country,
    currency: row.currency,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function clientRoutes(app: FastifyInstance, opts: { db: Kysely<Database> }) {
  // 1. List clients for organization (All membership roles: OWNER, ADMIN, FINANCE, VIEWER)
  app.get(
    '/api/organizations/:id/clients',
    { preHandler: [authenticateToken, requireOrganizationMembership(opts.db)] },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const paramsResult = orgParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid organization route parameters',
            details: paramsResult.error.flatten(),
          },
        });
      }

      const queryResult = listClientsQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        });
      }

      const { status, search, page, limit } = queryResult.data;
      const offset = (page - 1) * limit;

      const [clients, totalCount] = await request.withTenantContext!(async (tx) => {
        let baseQuery = tx
          .selectFrom('clients')
          .where('organization_id', '=', orgId);

        if (status !== 'ALL') {
          baseQuery = baseQuery.where('status', '=', status);
        }

        if (search && search.trim().length > 0) {
          const searchPattern = `%${search.trim()}%`;
          baseQuery = baseQuery.where((eb) =>
            eb.or([
              eb('name', 'ilike', searchPattern),
              eb('company', 'ilike', searchPattern),
              eb('email', 'ilike', searchPattern),
            ])
          );
        }

        const countRes = await baseQuery
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst();

        const rows = await baseQuery
          .selectAll()
          .orderBy('created_at', 'desc')
          .orderBy('id', 'desc')
          .limit(limit)
          .offset(offset)
          .execute();

        return [rows, Number(countRes?.count ?? 0)] as const;
      });

      return reply.status(200).send({
        success: true,
        data: clients.map(formatClientResponse),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }
  );

  // 2. Create client (Roles: OWNER, ADMIN, FINANCE)
  app.post(
    '/api/organizations/:id/clients',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN', 'FINANCE']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const paramsResult = orgParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid organization route parameters',
            details: paramsResult.error.flatten(),
          },
        });
      }

      const parseResult = createClientSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client input data',
            details: parseResult.error.flatten(),
          },
        });
      }

      const body = parseResult.data;

      const newClient = await request.withTenantContext!(async (tx) => {
        return await tx
          .insertInto('clients')
          .values({
            organization_id: orgId,
            name: body.name,
            email: body.email && body.email.length > 0 ? body.email : null,
            phone: body.phone && body.phone.length > 0 ? body.phone : null,
            company: body.company && body.company.length > 0 ? body.company : null,
            tax_identifier: body.taxIdentifier && body.taxIdentifier.length > 0 ? body.taxIdentifier : null,
            address_line1: body.addressLine1 && body.addressLine1.length > 0 ? body.addressLine1 : null,
            address_line2: body.addressLine2 && body.addressLine2.length > 0 ? body.addressLine2 : null,
            city: body.city && body.city.length > 0 ? body.city : null,
            state_province: body.stateProvince && body.stateProvince.length > 0 ? body.stateProvince : null,
            postal_code: body.postalCode && body.postalCode.length > 0 ? body.postalCode : null,
            country: body.country && body.country.length > 0 ? body.country : null,
            currency: body.currency && body.currency.length > 0 ? body.currency : null,
            notes: body.notes && body.notes.length > 0 ? body.notes : null,
            status: 'ACTIVE',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      });

      return reply.status(201).send({
        success: true,
        data: formatClientResponse(newClient),
      });
    }
  );

  // 3. Get single client details (Roles: OWNER, ADMIN, FINANCE, VIEWER)
  app.get(
    '/api/organizations/:id/clients/:clientId',
    { preHandler: [authenticateToken, requireOrganizationMembership(opts.db)] },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const paramsResult = clientParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client route parameters',
            details: paramsResult.error.flatten(),
          },
        });
      }
      const { clientId } = paramsResult.data;

      const client = await request.withTenantContext!(async (tx) => {
        return await tx
          .selectFrom('clients')
          .selectAll()
          .where('id', '=', clientId)
          .where('organization_id', '=', orgId)
          .executeTakeFirst();
      });

      if (!client) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Client not found in this organization',
          },
        });
      }

      return reply.status(200).send({
        success: true,
        data: formatClientResponse(client),
      });
    }
  );

  // 4. Update client (Roles: OWNER, ADMIN, FINANCE)
  app.patch(
    '/api/organizations/:id/clients/:clientId',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN', 'FINANCE']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const paramsResult = clientParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client route parameters',
            details: paramsResult.error.flatten(),
          },
        });
      }
      const { clientId } = paramsResult.data;

      const parseResult = updateClientSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client update data',
            details: parseResult.error.flatten(),
          },
        });
      }

      const updates = parseResult.data;

      // Enforce unified archive/restore permission policy:
      // Only OWNER and ADMIN can alter client status (archive or restore).
      if (
        updates.status !== undefined &&
        request.membershipRole !== 'OWNER' &&
        request.membershipRole !== 'ADMIN'
      ) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only business owners and admins can archive or restore clients',
          },
        });
      }

      const updateData: Record<string, any> = {
        updated_at: new Date(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email && updates.email.length > 0 ? updates.email : null;
      if (updates.phone !== undefined) updateData.phone = updates.phone && updates.phone.length > 0 ? updates.phone : null;
      if (updates.company !== undefined) updateData.company = updates.company && updates.company.length > 0 ? updates.company : null;
      if (updates.taxIdentifier !== undefined) updateData.tax_identifier = updates.taxIdentifier && updates.taxIdentifier.length > 0 ? updates.taxIdentifier : null;
      if (updates.addressLine1 !== undefined) updateData.address_line1 = updates.addressLine1 && updates.addressLine1.length > 0 ? updates.addressLine1 : null;
      if (updates.addressLine2 !== undefined) updateData.address_line2 = updates.addressLine2 && updates.addressLine2.length > 0 ? updates.addressLine2 : null;
      if (updates.city !== undefined) updateData.city = updates.city && updates.city.length > 0 ? updates.city : null;
      if (updates.stateProvince !== undefined) updateData.state_province = updates.stateProvince && updates.stateProvince.length > 0 ? updates.stateProvince : null;
      if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode && updates.postalCode.length > 0 ? updates.postalCode : null;
      if (updates.country !== undefined) updateData.country = updates.country && updates.country.length > 0 ? updates.country : null;
      if (updates.currency !== undefined) updateData.currency = updates.currency && updates.currency.length > 0 ? updates.currency : null;
      if (updates.notes !== undefined) updateData.notes = updates.notes && updates.notes.length > 0 ? updates.notes : null;
      if (updates.status !== undefined) updateData.status = updates.status;

      const updatedClient = await request.withTenantContext!(async (tx) => {
        return await tx
          .updateTable('clients')
          .set(updateData)
          .where('id', '=', clientId)
          .where('organization_id', '=', orgId)
          .returningAll()
          .executeTakeFirst();
      });

      if (!updatedClient) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Client not found in this organization',
          },
        });
      }

      return reply.status(200).send({
        success: true,
        data: formatClientResponse(updatedClient),
      });
    }
  );

  // 5. Archive client (Roles: OWNER, ADMIN)
  app.delete(
    '/api/organizations/:id/clients/:clientId',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const paramsResult = clientParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client route parameters',
            details: paramsResult.error.flatten(),
          },
        });
      }
      const { clientId } = paramsResult.data;

      const query = request.query as Record<string, unknown> | undefined;
      if (query?.permanent === 'true' || query?.permanent === true) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PERMANENT_DELETION_DISABLED',
            message: 'Permanent client deletion is deferred until retention and document reference policies are defined. Use archiving instead.',
          },
        });
      }

      // Soft delete / archive by default
      const archived = await request.withTenantContext!(async (tx) => {
        return await tx
          .updateTable('clients')
          .set({ status: 'ARCHIVED', updated_at: new Date() })
          .where('id', '=', clientId)
          .where('organization_id', '=', orgId)
          .returningAll()
          .executeTakeFirst();
      });

      if (!archived) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Client not found in this organization',
          },
        });
      }

      return reply.status(200).send({
        success: true,
        data: formatClientResponse(archived),
      });
    }
  );
}
