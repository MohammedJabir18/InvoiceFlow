import { describe, it, expect } from 'vitest';
import pg from 'pg';
import { runMigrations } from '@invoiceflow/db';
import { getConfig } from '../src/config.js';

describe('Database Migration Lifecycle Suite: Fresh Setup & Upgrade Paths', () => {
  const config = getConfig();
  const baseProvisionerUrl = config.TEST_PROVISIONER_DATABASE_URL || config.MIGRATOR_DATABASE_URL || config.DATABASE_URL;

  // Helper to extract base connection string for postgres maintenance DB
  function getMaintenanceUrl(dbName: string): { maintenanceUrl: string; targetUrl: string } {
    const url = new URL(baseProvisionerUrl);
    url.pathname = '/postgres';
    const maintenanceUrl = url.toString();
    url.pathname = `/${dbName}`;
    const targetUrl = url.toString();
    return { maintenanceUrl, targetUrl };
  }

  it('verifies fresh setup applies all migrations in order on a clean database', async () => {
    const testDb = 'if_test_fresh_setup';
    const { maintenanceUrl, targetUrl } = getMaintenanceUrl(testDb);

    const maintClient = new pg.Client({ connectionString: maintenanceUrl });
    await maintClient.connect();
    await maintClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
    await maintClient.query(`CREATE DATABASE ${testDb}`);
    await maintClient.end();

    try {
      // Execute migrations on the clean database
      const applied = await runMigrations({
        connectionString: targetUrl,
        isStandaloneTest: true,
      });

      expect(applied).toEqual([
        '001_initial_schema.sql',
        '002_security_and_rls_hardening.sql',
        '003_tighten_user_directory_rls.sql',
      ]);

      // Verify tables exist and migrations ledger contains all three
      const targetClient = new pg.Client({ connectionString: targetUrl });
      await targetClient.connect();

      const ledger = await targetClient.query('SELECT name FROM public._migrations ORDER BY name');
      expect(ledger.rows.map((r) => r.name)).toEqual([
        '001_initial_schema.sql',
        '002_security_and_rls_hardening.sql',
        '003_tighten_user_directory_rls.sql',
      ]);

      const tables = await targetClient.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      const tableNames = tables.rows.map((r) => r.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('organizations');
      expect(tableNames).toContain('organization_memberships');
      expect(tableNames).toContain('_migrations');

      // Verify RLS is enabled on users
      const rls = await targetClient.query(`
        SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = 'public'::regnamespace
      `);
      expect(rls.rows[0].relrowsecurity).toBe(true);

      await targetClient.end();
    } finally {
      // Allow connection to terminate before dropping
      await new Promise((r) => setTimeout(r, 200));
      const cleanClient = new pg.Client({ connectionString: maintenanceUrl });
      await cleanClient.connect();
      await cleanClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
      await cleanClient.end();
    }
  }, 30000);

  it('verifies forward migration applies 002 upgrade to an existing 001 database while preserving data', async () => {
    const testDb = 'if_test_upgrade_path';
    const { maintenanceUrl, targetUrl } = getMaintenanceUrl(testDb);

    const maintClient = new pg.Client({ connectionString: maintenanceUrl });
    await maintClient.connect();
    await maintClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
    await maintClient.query(`CREATE DATABASE ${testDb}`);
    await maintClient.end();

    try {
      const targetClient = new pg.Client({ connectionString: targetUrl });
      await targetClient.connect();

      // 1. Manually simulate state where only 001 was applied
      // Apply standalone stub
      await targetClient.query(`
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE IF NOT EXISTS auth.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE
        );
      `);

      // Initialize ledger with 001 applied
      await targetClient.query(`
        CREATE TABLE IF NOT EXISTS public._migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Apply 001 schema manually
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const schema001 = await fs.readFile(
        path.join(__dirname, '../../../packages/db/src/migrations/001_initial_schema.sql'),
        'utf-8'
      );
      await targetClient.query(schema001);
      await targetClient.query(
        `INSERT INTO public._migrations (name) VALUES ('001_initial_schema.sql')`
      );

      // Insert pre-existing user and organization
      const testUserId = '88888888-8888-4888-a888-888888888888';
      await targetClient.query(
        `INSERT INTO auth.users (id, email) VALUES ($1, 'preserve@upgrade.com')`,
        [testUserId]
      );
      await targetClient.query(
        `INSERT INTO public.users (id, email, full_name) VALUES ($1, 'preserve@upgrade.com', 'Pre Existing')`,
        [testUserId]
      );

      await targetClient.end();

      // 2. Run migration runner to apply upgrade
      const applied = await runMigrations({
        connectionString: targetUrl,
        isStandaloneTest: false, // Already has auth.users
      });

      // Must have applied 002 and 003
      expect(applied).toEqual([
        '002_security_and_rls_hardening.sql',
        '003_tighten_user_directory_rls.sql',
      ]);

      // 3. Verify data was preserved
      const verifyClient = new pg.Client({ connectionString: targetUrl });
      await verifyClient.connect();

      const userRow = await verifyClient.query(
        'SELECT email, full_name FROM public.users WHERE id = $1',
        [testUserId]
      );
      expect(userRow.rows.length).toBe(1);
      expect(userRow.rows[0].email).toBe('preserve@upgrade.com');
      expect(userRow.rows[0].full_name).toBe('Pre Existing');

      // 4. Verify hardening from 002 and 003 is now active on the upgraded database
      const rlsCheck = await verifyClient.query(`
        SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = 'public'::regnamespace
      `);
      expect(rlsCheck.rows[0].relrowsecurity).toBe(true);

      const policyCheck = await verifyClient.query(`
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
      `);
      expect(policyCheck.rows.map((r) => r.policyname)).toContain('users_read_policy');

      await verifyClient.end();
    } finally {
      const cleanClient = new pg.Client({ connectionString: maintenanceUrl });
      await cleanClient.connect();
      await cleanClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
      await cleanClient.end();
    }
  }, 30000);

  it('verifies forward migration applies 003 upgrade to an existing 002 database while preserving data', async () => {
    const testDb = 'if_test_upgrade_002_to_003';
    const { maintenanceUrl, targetUrl } = getMaintenanceUrl(testDb);

    const maintClient = new pg.Client({ connectionString: maintenanceUrl });
    await maintClient.connect();
    await maintClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
    await maintClient.query(`CREATE DATABASE ${testDb}`);
    await maintClient.end();

    try {
      const targetClient = new pg.Client({ connectionString: targetUrl });
      await targetClient.connect();

      // 1. Manually simulate state where 001 and 002 were applied
      await targetClient.query(`
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE IF NOT EXISTS auth.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE
        );
      `);

      await targetClient.query(`
        CREATE TABLE IF NOT EXISTS public._migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      const schema001 = await fs.readFile(
        path.join(__dirname, '../../../packages/db/src/migrations/001_initial_schema.sql'),
        'utf-8'
      );
      await targetClient.query(schema001);
      await targetClient.query(
        `INSERT INTO public._migrations (name) VALUES ('001_initial_schema.sql')`
      );

      const schema002 = await fs.readFile(
        path.join(__dirname, '../../../packages/db/src/migrations/002_security_and_rls_hardening.sql'),
        'utf-8'
      );
      await targetClient.query(schema002);
      await targetClient.query(
        `INSERT INTO public._migrations (name) VALUES ('002_security_and_rls_hardening.sql')`
      );

      // Insert pre-existing user and organization
      const testUserId = '77777777-7777-4777-a777-777777777777';
      await targetClient.query(
        `INSERT INTO auth.users (id, email) VALUES ($1, 'preserve002@upgrade.com')`,
        [testUserId]
      );
      await targetClient.query(
        `INSERT INTO public.users (id, email, full_name) VALUES ($1, 'preserve002@upgrade.com', 'Existing 002 User')`,
        [testUserId]
      );

      await targetClient.end();

      // 2. Run migration runner to apply upgrade
      const applied = await runMigrations({
        connectionString: targetUrl,
        isStandaloneTest: false,
      });

      // Must have applied ONLY 003
      expect(applied).toEqual(['003_tighten_user_directory_rls.sql']);

      // 3. Verify data was preserved
      const verifyClient = new pg.Client({ connectionString: targetUrl });
      await verifyClient.connect();

      const userRow = await verifyClient.query(
        'SELECT email, full_name FROM public.users WHERE id = $1',
        [testUserId]
      );
      expect(userRow.rows.length).toBe(1);
      expect(userRow.rows[0].email).toBe('preserve002@upgrade.com');
      expect(userRow.rows[0].full_name).toBe('Existing 002 User');

      // 4. Verify 003 policy is in effect
      const policyCheck = await verifyClient.query(`
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
      `);
      expect(policyCheck.rows.map((r) => r.policyname)).toContain('users_read_policy');

      await verifyClient.end();
    } finally {
      const cleanClient = new pg.Client({ connectionString: maintenanceUrl });
      await cleanClient.connect();
      await cleanClient.query(`DROP DATABASE IF EXISTS ${testDb} WITH (FORCE)`);
      await cleanClient.end();
    }
  }, 30000);
});
