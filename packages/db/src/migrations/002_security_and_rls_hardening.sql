-- Migration 002: Security, Permissions, and RLS Hardening (Forward Migration)
-- Applied forward to harden existing and fresh schemas

-- 1. Enable Row-Level Security on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. User Directory Read & Self-Modification Policies
DROP POLICY IF EXISTS tenant_isolation_users ON public.users;
DROP POLICY IF EXISTS users_read_policy ON public.users;
DROP POLICY IF EXISTS users_modify_policy ON public.users;

CREATE POLICY users_read_policy ON public.users
    FOR SELECT
    USING (true);

CREATE POLICY users_modify_policy ON public.users
    FOR ALL
    USING (id = NULLIF(current_setting('app.current_user_id', true), '')::UUID)
    WITH CHECK (id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

-- 3. Hardened search_path on all SECURITY DEFINER functions to prevent search-path hijacking
ALTER FUNCTION public.get_current_org_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_current_user_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_organization_with_owner(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, SMALLINT) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_organizations(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_membership(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.upsert_user(UUID, VARCHAR, VARCHAR) SET search_path = public, pg_temp;

-- 4. Scope Schema Privileges: Revoke CREATE on schema public to prevent unauthorized table creation
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invoiceflow_app') THEN
        REVOKE CREATE ON SCHEMA public FROM invoiceflow_app;
    END IF;
END $$;

-- 5. Revoke PUBLIC EXECUTE on all application stored procedures
REVOKE ALL ON FUNCTION public.get_current_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_organization_with_owner(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, SMALLINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_organizations(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_membership(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_user(UUID, VARCHAR, VARCHAR) FROM PUBLIC;

-- 6. Data API Exposure Protection: Revoke all public schema grants from Supabase PostgREST roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    END IF;
END $$;

-- 7. Runtime Role Grants: Grant only necessary DML and execution privileges to invoiceflow_app
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invoiceflow_app') THEN
        GRANT USAGE ON SCHEMA public TO invoiceflow_app;
        GRANT USAGE ON SCHEMA auth TO invoiceflow_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO invoiceflow_app;
        GRANT SELECT, INSERT, UPDATE ON auth.users TO invoiceflow_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, SMALLINT) TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.get_user_membership(UUID, UUID) TO invoiceflow_app;
        GRANT EXECUTE ON FUNCTION public.upsert_user(UUID, VARCHAR, VARCHAR) TO invoiceflow_app;
    END IF;
END $$;
