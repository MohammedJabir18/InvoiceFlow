-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Membership Roles ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('OWNER', 'ADMIN', 'FINANCE', 'VIEWER');
    END IF;
END $$;

-- 1. Users Table (Maps to Supabase auth.users with strict foreign key reference)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    business_country VARCHAR(2) NOT NULL,      -- ISO 3166-1 alpha-2, e.g. 'IN', 'US'
    tax_identifier VARCHAR(100),               -- e.g. GSTIN, VAT, EIN
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    logo_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC', -- IANA timezone string
    locale VARCHAR(20) NOT NULL DEFAULT 'en-US',
    document_language VARCHAR(10) NOT NULL DEFAULT 'en',
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',      -- ISO 4217
    reporting_currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
    financial_year_start_month SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Organization Memberships Table
CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_organization UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.organization_memberships(organization_id);

-- Helper Function to Retrieve Active Tenant Context
-- Hardened: explicit search_path prevents search-path hijacking attacks
CREATE OR REPLACE FUNCTION public.get_current_org_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE sql STABLE
SET search_path = pg_catalog, pg_temp;

-- Helper Function to Retrieve Active User Context
CREATE OR REPLACE FUNCTION public.get_current_user_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
$$ LANGUAGE sql STABLE
SET search_path = pg_catalog, pg_temp;

-- Secured Bootstrap Stored Function
-- Executes atomic creation of an organization and associates caller as OWNER.
-- Hardened: SECURITY DEFINER with fixed search_path = public, pg_temp and schema-qualified references.
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    p_user_id UUID,
    p_legal_name VARCHAR,
    p_display_name VARCHAR,
    p_business_country VARCHAR,
    p_tax_identifier VARCHAR,
    p_address_line1 VARCHAR,
    p_address_line2 VARCHAR,
    p_city VARCHAR,
    p_state_province VARCHAR,
    p_postal_code VARCHAR,
    p_contact_email VARCHAR,
    p_contact_phone VARCHAR,
    p_timezone VARCHAR,
    p_locale VARCHAR,
    p_document_language VARCHAR,
    p_base_currency VARCHAR,
    p_reporting_currency VARCHAR,
    p_financial_year_start_month SMALLINT
) RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot bootstrap organization without authenticated user ID';
    END IF;

    -- Ensure user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User % does not exist', p_user_id;
    END IF;

    -- Insert organization record
    INSERT INTO public.organizations (
        legal_name, display_name, business_country, tax_identifier,
        address_line1, address_line2, city, state_province, postal_code,
        contact_email, contact_phone, timezone, locale, document_language,
        base_currency, reporting_currency, financial_year_start_month
    ) VALUES (
        p_legal_name, p_display_name, p_business_country, p_tax_identifier,
        p_address_line1, p_address_line2, p_city, p_state_province, p_postal_code,
        p_contact_email, p_contact_phone, p_timezone, p_locale, p_document_language,
        p_base_currency, p_reporting_currency, p_financial_year_start_month
    ) RETURNING id INTO v_org_id;

    -- Insert membership assigning caller as OWNER
    INSERT INTO public.organization_memberships (
        organization_id, user_id, role
    ) VALUES (
        v_org_id, p_user_id, 'OWNER'
    );

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Explicit Secured Membership-Lookup Functions
-- Hardened: SECURITY DEFINER with fixed search_path = public, pg_temp
CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID)
RETURNS TABLE (
    organization_id UUID,
    legal_name VARCHAR,
    display_name VARCHAR,
    role membership_role,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    RETURN QUERY
    SELECT 
        o.id AS organization_id,
        o.legal_name,
        o.display_name,
        m.role,
        o.created_at,
        o.updated_at
    FROM public.organizations o
    INNER JOIN public.organization_memberships m ON m.organization_id = o.id
    WHERE m.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_user_membership(p_user_id UUID, p_org_id UUID)
RETURNS membership_role AS $$
DECLARE
    v_role membership_role;
BEGIN
    IF p_user_id IS NULL OR p_org_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role INTO v_role
    FROM public.organization_memberships
    WHERE user_id = p_user_id AND organization_id = p_org_id;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- User Profile Sync / Upsert Helper
-- Hardened: synchronizes with auth.users and public.users safely
CREATE OR REPLACE FUNCTION public.upsert_user(p_id UUID, p_email VARCHAR, p_full_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Ensure stub row exists in auth.users if not present
    INSERT INTO auth.users (id, email)
    VALUES (p_id, p_email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

    -- Upsert in public.users
    INSERT INTO public.users (id, email, full_name, updated_at)
    VALUES (p_id, p_email, p_full_name, NOW())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- Enable Row-Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS tenant_isolation_orgs ON public.organizations;
DROP POLICY IF EXISTS tenant_isolation_memberships ON public.organization_memberships;
DROP POLICY IF EXISTS users_isolation ON public.users;

-- Fail-Closed RLS Policy for organizations (both read and write)
CREATE POLICY tenant_isolation_orgs ON public.organizations
    FOR ALL
    USING (id = public.get_current_org_id())
    WITH CHECK (id = public.get_current_org_id());

-- Fail-Closed RLS Policy for organization_memberships (both read and write)
CREATE POLICY tenant_isolation_memberships ON public.organization_memberships
    FOR ALL
    USING (organization_id = public.get_current_org_id())
    WITH CHECK (organization_id = public.get_current_org_id());

-- Baseline Runtime Role Grants: Grant standard DML to invoiceflow_app
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invoiceflow_app') THEN
        GRANT USAGE ON SCHEMA public TO invoiceflow_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO invoiceflow_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO invoiceflow_app;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO invoiceflow_app;
    END IF;
END $$;
