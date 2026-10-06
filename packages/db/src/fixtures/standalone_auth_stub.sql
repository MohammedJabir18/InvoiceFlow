-- Standalone PostgreSQL Test Fixture: auth schema stub
-- Used ONLY in bare/standalone PostgreSQL testing environments where Supabase GoTrue is not running.
-- Never applied to Supabase-managed instances where auth.users is native.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
