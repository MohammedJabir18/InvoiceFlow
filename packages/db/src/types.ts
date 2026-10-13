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

export interface ClientsTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tax_identifier: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  currency: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  organizations: OrganizationsTable;
  organization_memberships: OrganizationMembershipsTable;
  clients: ClientsTable;
}

export type DbUser = Selectable<UsersTable>;
export type NewDbUser = Insertable<UsersTable>;
export type DbOrganization = Selectable<OrganizationsTable>;
export type NewDbOrganization = Insertable<OrganizationsTable>;
export type OrganizationUpdate = Updateable<OrganizationsTable>;
export type DbMembership = Selectable<OrganizationMembershipsTable>;
export type NewDbMembership = Insertable<OrganizationMembershipsTable>;
export type DbClient = Selectable<ClientsTable>;
export type NewDbClient = Insertable<ClientsTable>;
export type ClientUpdate = Updateable<ClientsTable>;
