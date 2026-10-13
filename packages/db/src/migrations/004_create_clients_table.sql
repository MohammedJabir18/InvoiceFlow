-- 004_create_clients_table.sql
-- Multi-tenant clients table with fail-closed Row Level Security

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(200),
    tax_identifier VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2),
    currency VARCHAR(3),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(organization_id, status);

-- Enable Row-Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if re-running
DROP POLICY IF EXISTS tenant_isolation_clients ON public.clients;

-- Fail-Closed RLS Policy: All queries and mutations strictly scoped to active org context
CREATE POLICY tenant_isolation_clients ON public.clients
    FOR ALL
    USING (organization_id = public.get_current_org_id())
    WITH CHECK (organization_id = public.get_current_org_id());

-- Grant DML to restricted app role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invoiceflow_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO invoiceflow_app;
    END IF;
END $$;
