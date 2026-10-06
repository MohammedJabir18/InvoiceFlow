import { Kysely, PostgresDialect, sql, type Transaction } from 'kysely';
import { Pool, type PoolConfig } from 'pg';
import type { Database, MembershipRole } from './types.js';

export interface DbConfig {
  connectionString: string;
  maxConnections?: number;
}

export function createDbPool(config: DbConfig): Pool {
  const poolConfig: PoolConfig = {
    connectionString: config.connectionString,
    max: config.maxConnections ?? 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  return new Pool(poolConfig);
}

export function createKyselyDb(pool: Pool): Kysely<Database> {
  const dialect = new PostgresDialect({ pool });
  return new Kysely<Database>({ dialect });
}

/**
 * Executes a database operation within an explicit transaction that injects
 * a parameterized transaction-local organization context (`app.current_org_id`).
 *
 * Setting `is_local = true` ensures that PostgreSQL automatically clears the variable
 * on COMMIT, ROLLBACK, or error, guaranteeing that pooled connections do not leak tenant context.
 */
export async function withTenantContext<T>(
  orgId: string,
  db: Kysely<Database>,
  operation: (tx: Transaction<Database>) => Promise<T>
): Promise<T> {
  if (!orgId || typeof orgId !== 'string') {
    throw new Error('Tenant context requires a valid non-empty organization ID');
  }

  return await db.transaction().execute(async (tx) => {
    // Parameterized transaction-local context: SELECT set_config('app.current_org_id', $1, true)
    await sql`SELECT set_config('app.current_org_id', ${orgId}, true)`.execute(tx);
    return await operation(tx);
  });
}

export interface CreateOrganizationParams {
  userId: string;
  legalName: string;
  displayName: string;
  businessCountry: string;
  taxIdentifier?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateProvince?: string | null;
  postalCode: string;
  contactEmail: string;
  contactPhone?: string | null;
  timezone?: string;
  locale?: string;
  documentLanguage?: string;
  baseCurrency?: string;
  reportingCurrency?: string;
  financialYearStartMonth?: number;
}

export async function createOrganizationWithOwner(
  db: Kysely<Database>,
  params: CreateOrganizationParams
): Promise<string> {
  const result = await sql<{ create_organization_with_owner: string }>`
    SELECT create_organization_with_owner(
      ${params.userId}::uuid,
      ${params.legalName},
      ${params.displayName},
      ${params.businessCountry},
      ${params.taxIdentifier ?? null},
      ${params.addressLine1},
      ${params.addressLine2 ?? null},
      ${params.city},
      ${params.stateProvince ?? null},
      ${params.postalCode},
      ${params.contactEmail},
      ${params.contactPhone ?? null},
      ${params.timezone ?? 'UTC'},
      ${params.locale ?? 'en-US'},
      ${params.documentLanguage ?? 'en'},
      ${params.baseCurrency ?? 'USD'},
      ${params.reportingCurrency ?? params.baseCurrency ?? 'USD'},
      ${params.financialYearStartMonth ?? 1}::smallint
    )
  `.execute(db);

  return result.rows[0].create_organization_with_owner;
}

export interface UserOrganizationRow {
  organization_id: string;
  legal_name: string;
  display_name: string;
  role: MembershipRole;
  created_at: Date;
  updated_at: Date;
}

export async function getUserOrganizations(
  db: Kysely<Database>,
  userId: string
): Promise<UserOrganizationRow[]> {
  const result = await sql<UserOrganizationRow>`
    SELECT * FROM get_user_organizations(${userId}::uuid)
  `.execute(db);

  return result.rows;
}

export async function getUserMembership(
  db: Kysely<Database>,
  userId: string,
  orgId: string
): Promise<MembershipRole | null> {
  const result = await sql<{ get_user_membership: MembershipRole | null }>`
    SELECT get_user_membership(${userId}::uuid, ${orgId}::uuid)
  `.execute(db);

  return result.rows[0]?.get_user_membership ?? null;
}

export async function upsertUser(
  db: Kysely<Database>,
  user: { id: string; email: string; fullName: string }
): Promise<void> {
  await sql`
    SELECT upsert_user(${user.id}::uuid, ${user.email}, ${user.fullName})
  `.execute(db);
}
