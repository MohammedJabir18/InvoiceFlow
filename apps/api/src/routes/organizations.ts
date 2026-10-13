import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import {
  type Database,
  createOrganizationWithOwner,
  getUserOrganizations,
} from '@invoiceflow/db';
import { authenticateToken } from '../plugins/auth.js';
import { requireOrganizationMembership } from '../plugins/tenant.js';

const createOrgSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required').max(200),
  displayName: z.string().min(1, 'Display name is required').max(200),
  businessCountry: z.string().length(2, 'Country must be a 2-letter ISO code'),
  taxIdentifier: z.string().max(100).optional().nullable(),
  addressLine1: z.string().min(1, 'Address is required').max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  stateProvince: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  contactEmail: z.string().email().max(255),
  contactPhone: z.string().max(50).optional().nullable(),
  timezone: z.string().min(1).default('UTC'),
  locale: z.string().min(1).default('en-US'),
  documentLanguage: z.string().length(2).default('en'),
  baseCurrency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
  reportingCurrency: z.string().length(3).optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).default(1),
});

const updateSettingsSchema = z.object({
  legalName: z.string().min(1).max(200).optional(),
  displayName: z.string().min(1).max(200).optional(),
  businessCountry: z.string().length(2).optional(),
  taxIdentifier: z.string().max(100).optional().nullable(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  stateProvince: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1).max(20).optional(),
  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z.string().max(50).optional().nullable(),
  timezone: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  documentLanguage: z.string().length(2).optional(),
  baseCurrency: z.string().length(3).optional(),
  reportingCurrency: z.string().length(3).optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).optional(),
});

export async function organizationRoutes(app: FastifyInstance, opts: { db: Kysely<Database> }) {
  // 1. List all organizations for the authenticated user
  app.get(
    '/api/organizations',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user!;
      const orgs = await getUserOrganizations(opts.db, user.id);

      return reply.status(200).send({
        success: true,
        data: orgs.map((o) => ({
          id: o.organization_id,
          legalName: o.legal_name,
          displayName: o.display_name,
          role: o.role,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })),
      });
    }
  );

  // 2. Secured Bootstrap Path: Create organization and link creator as OWNER
  app.post(
    '/api/organizations',
    { preHandler: [authenticateToken] },
    async (request, reply) => {
      const user = request.user!;
      const parseResult = createOrgSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid organization input data',
            details: parseResult.error.flatten(),
          },
        });
      }

      const body = parseResult.data;
      const orgId = await createOrganizationWithOwner(opts.db, {
        userId: user.id,
        legalName: body.legalName,
        displayName: body.displayName,
        businessCountry: body.businessCountry,
        taxIdentifier: body.taxIdentifier,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        stateProvince: body.stateProvince,
        postalCode: body.postalCode,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        timezone: body.timezone,
        locale: body.locale,
        documentLanguage: body.documentLanguage,
        baseCurrency: body.baseCurrency,
        reportingCurrency: body.reportingCurrency ?? body.baseCurrency,
        financialYearStartMonth: body.financialYearStartMonth,
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: orgId,
          legalName: body.legalName,
          displayName: body.displayName,
          businessCountry: body.businessCountry,
          baseCurrency: body.baseCurrency,
          timezone: body.timezone,
          locale: body.locale,
          role: 'OWNER',
        },
      });
    }
  );

  // 3. Get organization details (Protected by membership & tenant context RLS)
  app.get(
    '/api/organizations/:id',
    { preHandler: [authenticateToken, requireOrganizationMembership(opts.db)] },
    async (request, reply) => {
      const orgId = request.organizationId!;

      const org = await request.withTenantContext!(async (tx) => {
        return await tx
          .selectFrom('organizations')
          .selectAll()
          .where('id', '=', orgId)
          .executeTakeFirst();
      });

      if (!org) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Organization not found',
          },
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          id: org.id,
          legalName: org.legal_name,
          displayName: org.display_name,
          businessCountry: org.business_country,
          taxIdentifier: org.tax_identifier,
          addressLine1: org.address_line1,
          addressLine2: org.address_line2,
          city: org.city,
          stateProvince: org.state_province,
          postalCode: org.postal_code,
          contactEmail: org.contact_email,
          contactPhone: org.contact_phone,
          logoUrl: org.logo_url,
          timezone: org.timezone,
          locale: org.locale,
          documentLanguage: org.document_language,
          baseCurrency: org.base_currency,
          reportingCurrency: org.reporting_currency,
          financialYearStartMonth: org.financial_year_start_month,
          role: request.membershipRole,
          createdAt: org.created_at,
          updatedAt: org.updated_at,
        },
      });
    }
  );

  // 4. Update Business Settings (Server-side authorization: OWNER or ADMIN only)
  app.patch(
    '/api/organizations/:id/settings',
    {
      preHandler: [
        authenticateToken,
        requireOrganizationMembership(opts.db, ['OWNER', 'ADMIN']),
      ],
    },
    async (request, reply) => {
      const orgId = request.organizationId!;
      const parseResult = updateSettingsSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid organization settings update',
            details: parseResult.error.flatten(),
          },
        });
      }

      const updates = parseResult.data;
      const updateData: Record<string, any> = {
        updated_at: new Date(),
      };

      // Independently update each specified field without corrupting others
      if (updates.legalName !== undefined) updateData.legal_name = updates.legalName;
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.businessCountry !== undefined) updateData.business_country = updates.businessCountry;
      if (updates.taxIdentifier !== undefined) updateData.tax_identifier = updates.taxIdentifier;
      if (updates.addressLine1 !== undefined) updateData.address_line1 = updates.addressLine1;
      if (updates.addressLine2 !== undefined) updateData.address_line2 = updates.addressLine2;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.stateProvince !== undefined) updateData.state_province = updates.stateProvince;
      if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;
      if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
      if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
      if (updates.locale !== undefined) updateData.locale = updates.locale;
      if (updates.documentLanguage !== undefined) updateData.document_language = updates.documentLanguage;
      if (updates.baseCurrency !== undefined) updateData.base_currency = updates.baseCurrency;
      if (updates.reportingCurrency !== undefined) updateData.reporting_currency = updates.reportingCurrency;
      if (updates.financialYearStartMonth !== undefined)
        updateData.financial_year_start_month = updates.financialYearStartMonth;

      const updatedOrg = await request.withTenantContext!(async (tx) => {
        return await tx
          .updateTable('organizations')
          .set(updateData)
          .where('id', '=', orgId)
          .returningAll()
          .executeTakeFirst();
      });

      return reply.status(200).send({
        success: true,
        data: {
          id: updatedOrg!.id,
          legalName: updatedOrg!.legal_name,
          displayName: updatedOrg!.display_name,
          businessCountry: updatedOrg!.business_country,
          taxIdentifier: updatedOrg!.tax_identifier,
          addressLine1: updatedOrg!.address_line1,
          addressLine2: updatedOrg!.address_line2,
          city: updatedOrg!.city,
          stateProvince: updatedOrg!.state_province,
          postalCode: updatedOrg!.postal_code,
          contactEmail: updatedOrg!.contact_email,
          contactPhone: updatedOrg!.contact_phone,
          logoUrl: updatedOrg!.logo_url,
          timezone: updatedOrg!.timezone,
          locale: updatedOrg!.locale,
          documentLanguage: updatedOrg!.document_language,
          baseCurrency: updatedOrg!.base_currency,
          reportingCurrency: updatedOrg!.reporting_currency,
          financialYearStartMonth: updatedOrg!.financial_year_start_month,
          updatedAt: updatedOrg!.updated_at,
        },
      });
    }
  );
}
