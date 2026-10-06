import type { ColumnType, Generated, Selectable, Insertable, Updateable } from 'kysely';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'FINANCE' | 'VIEWER';

export interface UsersTable {
  id: string; // UUID from Supabase auth.users.id
  email: string;
  full_name: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrganizationsTable {
  id: Generated<string>;
  legal_name: string;
  display_name: string;
  business_country: string;
  tax_identifier: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  timezone: string;
  locale: string;
  document_language: string;
  base_currency: string;
  reporting_currency: string;
  financial_year_start_month: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrganizationMembershipsTable {
  id: Generated<string>;
  organization_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  organizations: OrganizationsTable;
  organization_memberships: OrganizationMembershipsTable;
}

export type DbUser = Selectable<UsersTable>;
export type NewDbUser = Insertable<UsersTable>;
export type DbOrganization = Selectable<OrganizationsTable>;
export type NewDbOrganization = Insertable<OrganizationsTable>;
export type OrganizationUpdate = Updateable<OrganizationsTable>;
export type DbMembership = Selectable<OrganizationMembershipsTable>;
export type NewDbMembership = Insertable<OrganizationMembershipsTable>;
