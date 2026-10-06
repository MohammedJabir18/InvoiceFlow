-- Migration 003: Tighten User Directory RLS and Profile Visibility (Forward Migration)
-- Remediation: Drop permissive users_read_policy (USING true) that allowed global directory enumeration.
-- Establishes least-privilege row-level security for public.users:
-- 1. Authenticated users can view their own profile (id = app.current_user_id).
-- 2. Within an active organization context (app.current_org_id), authorized members can view
--    co-members belonging to that same organization.
-- 3. Cross-tenant user enumeration is strictly blocked: an actor in Org A cannot query or discover users belonging to Org B.

-- 1. Drop the permissive read policy from Migration 002
DROP POLICY IF EXISTS users_read_policy ON public.users;

-- 2. Create the tightened read policy
CREATE POLICY users_read_policy ON public.users
    FOR SELECT
    USING (
        id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
        OR
        (
            NULLIF(current_setting('app.current_org_id', true), '') IS NOT NULL
            AND (
                NULLIF(current_setting('app.current_user_id', true), '') IS NULL
                OR EXISTS (
                    SELECT 1
                    FROM public.organization_memberships caller_om
                    WHERE caller_om.organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
                      AND caller_om.user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
                )
            )
            AND EXISTS (
                SELECT 1
                FROM public.organization_memberships target_om
                WHERE target_om.organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
                  AND target_om.user_id = public.users.id
            )
        )
    );

-- 3. Explicit permissions verification for runtime role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invoiceflow_app') THEN
        GRANT SELECT ON public.users TO invoiceflow_app;
        GRANT SELECT ON public.organization_memberships TO invoiceflow_app;
    END IF;
END $$;
