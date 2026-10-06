import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import http from 'node:http';
import {
  createDbPool,
  createKyselyDb,
  type Database,
} from '@invoiceflow/db';
import { buildServer } from '../src/server.js';
import { getConfig, resetConfigCache } from '../src/config.js';
import { createTestSignedToken, createTestJWKSPair } from './helpers/tokens.js';

describe('Milestone 1A Hardening: Database Security Audit & Asymmetric Auth Suite', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let appPool: pg.Pool;
  let migratorPool: pg.Pool;
  let appDb: ReturnType<typeof createKyselyDb>;
  const config = getConfig();

  const userOwner1 = '44444444-4444-4444-a444-444444444441';
  const userOwner2 = '44444444-4444-4444-a444-444444444442';
  const userOwner3 = '44444444-4444-4444-a444-444444444443';

  let tokenOwner1: string;
  let tokenOwner2: string;
  let concurrentOrgId: string;

  beforeAll(async () => {
    appPool = createDbPool({
      connectionString: config.DATABASE_URL,
      maxConnections: 10,
    });
    appDb = createKyselyDb(appPool);

    migratorPool = createDbPool({
      connectionString: config.MIGRATOR_DATABASE_URL || config.DATABASE_URL,
      maxConnections: 2,
    });

    // Cleanup & insert test users
    await migratorPool.query(
      `DELETE FROM users WHERE id IN ($1, $2, $3)`,
      [userOwner1, userOwner2, userOwner3]
    );

    await migratorPool.query(
      `INSERT INTO auth.users (id, email) VALUES
       ($1, 'owner1@audit.com'),
       ($2, 'owner2@audit.com'),
       ($3, 'owner3@audit.com')
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [userOwner1, userOwner2, userOwner3]
    );

    await migratorPool.query(
      `INSERT INTO public.users (id, email, full_name) VALUES 
       ($1, 'owner1@audit.com', 'Owner One'),
       ($2, 'owner2@audit.com', 'Owner Two'),
       ($3, 'owner3@audit.com', 'Owner Three')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [userOwner1, userOwner2, userOwner3]
    );

    app = await buildServer({ db: appDb });

    tokenOwner1 = await createTestSignedToken(userOwner1, 'owner1@audit.com');
    tokenOwner2 = await createTestSignedToken(userOwner2, 'owner2@audit.com');
  });

  afterAll(async () => {
    await app.close();
    await appPool.end();
    await migratorPool.end();
  });

  // ============================================================================
  // 1. Runtime Route Hardening & Absence of Mock-Token Endpoints
  // ============================================================================
  describe('1. Runtime Route Hardening', () => {
    it('proves that /api/auth/mock-token is completely absent from the application runtime (404)', async () => {
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/auth/mock-token',
        payload: { userId: userOwner1, email: 'owner1@audit.com' },
      });
      expect(resPost.statusCode).toBe(404);

      const resGet = await app.inject({
        method: 'GET',
        url: '/api/auth/mock-token',
      });
      expect(resGet.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // 2. Database SECURITY DEFINER Audit & Privilege Review
  // ============================================================================
  describe('2. Database Functions & Privilege Hardening Audit', () => {
    it('verifies PUBLIC EXECUTE has been revoked on all sensitive stored procedures', async () => {
      const checkAcl = await appPool.query(`
        SELECT proname, proacl::text
        FROM pg_proc
        WHERE proname IN ('get_current_org_id', 'create_organization_with_owner', 'get_user_organizations', 'get_user_membership', 'upsert_user')
      `);

      expect(checkAcl.rows.length).toBeGreaterThanOrEqual(4);
      for (const row of checkAcl.rows) {
        // In PostgreSQL ACLs, "=X/" without a grantee indicates a public execute grant.
        // It must NOT match /{=X\// or /,=X\//.
        expect(row.proacl).not.toMatch(/[{,]=X\//);
        // Must contain explicit grant to invoiceflow_app
        expect(row.proacl).toContain('invoiceflow_app=X/');
      }
    });

    it('verifies that functions enforce search_path to prevent search-path hijacking', async () => {
      const checkConfig = await appPool.query(`
        SELECT proname, proconfig
        FROM pg_proc
        WHERE proname IN ('get_current_org_id', 'create_organization_with_owner', 'get_user_organizations', 'get_user_membership', 'upsert_user')
      `);

      expect(checkConfig.rows.length).toBeGreaterThanOrEqual(4);
      for (const row of checkConfig.rows) {
        expect(row.proconfig).toBeDefined();
        const configStr = (row.proconfig || []).join(';');
        expect(configStr).toContain('search_path=');
      }
    });

    it('verifies that the runtime role invoiceflow_app CANNOT create tables in public schema', async () => {
      let threwPermissionError = false;
      try {
        await appPool.query(`CREATE TABLE public.__security_probe_table (id INT)`);
      } catch (err: any) {
        // PostgreSQL error 42501: permission denied for schema public
        if (err.code === '42501' || err.message.includes('permission denied')) {
          threwPermissionError = true;
        } else {
          throw err;
        }
      }
      expect(threwPermissionError).toBe(true);
    });

    it('verifies that SECURITY DEFINER functions are owned by migrator/admin and NOT by runtime app', async () => {
      const checkOwnership = await appPool.query(`
        SELECT p.proname, r.rolname AS owner_name
        FROM pg_proc p
        JOIN pg_roles r ON p.proowner = r.oid
        WHERE p.proname IN ('create_organization_with_owner', 'get_current_org_id', 'is_org_member')
      `);

      expect(checkOwnership.rows.length).toBeGreaterThanOrEqual(2);
      for (const row of checkOwnership.rows) {
        // Owner must be migrator or postgres; strictly NOT invoiceflow_app
        expect(row.owner_name).not.toBe('invoiceflow_app');
        expect(['invoiceflow_migrator', 'postgres']).toContain(row.owner_name);
      }
    });

    it('verifies behavioral search path safety when caller has altered search_path', async () => {
      // Connect as invoiceflow_app, alter connection search_path to pg_temp, and invoke stored procedure
      const client = new pg.Client({ connectionString: config.DATABASE_URL });
      await client.connect();
      try {
        await client.query(`SET search_path = pg_temp`);
        const res = await client.query(`SELECT public.get_current_org_id() AS org_id`);
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].org_id).toBeNull();
      } finally {
        await client.end();
      }
    });

    it('verifies that the runtime role invoiceflow_app cannot assume superuser or bypass RLS', async () => {
      const checkRole = await appPool.query(`
        SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb
        FROM pg_roles
        WHERE rolname = 'invoiceflow_app'
      `);

      expect(checkRole.rows.length).toBe(1);
      const role = checkRole.rows[0];
      expect(role.rolsuper).toBe(false);
      expect(role.rolbypassrls).toBe(false);
      expect(role.rolcreaterole).toBe(false);
      expect(role.rolcreatedb).toBe(false);
    });

    it('verifies that users table has Row-Level Security active', async () => {
      const checkRls = await appPool.query(`
        SELECT relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname = 'users' AND relnamespace = 'public'::regnamespace
      `);

      expect(checkRls.rows.length).toBe(1);
      expect(checkRls.rows[0].relrowsecurity).toBe(true);
    });
  });

  // ============================================================================
  // 3. Concurrent Last-Owner Protection Verification
  // ============================================================================
  describe('3. Concurrency Safety: Last-Owner Removal Protection', () => {
    it('creates an organization with two co-owners', async () => {
      // 1. Owner 1 creates the organization
      const resCreate = await app.inject({
        method: 'POST',
        url: '/api/organizations',
        headers: { authorization: `Bearer ${tokenOwner1}` },
        payload: {
          legalName: 'Concurrent Safety LLC',
          displayName: 'Concurrent Co',
          businessCountry: 'US',
          addressLine1: '77 Wall St',
          city: 'New York',
          postalCode: '10005',
          contactEmail: 'safety@concurrent.com',
        },
      });

      expect(resCreate.statusCode).toBe(201);
      concurrentOrgId = resCreate.json().data.id;

      // 2. Owner 1 adds Owner 2 as OWNER
      const resAdd = await app.inject({
        method: 'POST',
        url: `/api/organizations/${concurrentOrgId}/members`,
        headers: { authorization: `Bearer ${tokenOwner1}` },
        payload: {
          userId: userOwner2,
          role: 'OWNER',
        },
      });

      expect(resAdd.statusCode).toBe(201);

      // Verify there are exactly 2 owners
      const resMembers = await app.inject({
        method: 'GET',
        url: `/api/organizations/${concurrentOrgId}/members`,
        headers: { authorization: `Bearer ${tokenOwner1}` },
      });
      const owners = resMembers.json().data.filter((m: any) => m.role === 'OWNER');
      expect(owners.length).toBe(2);
    });

    it('prevents simultaneous deletion of both owners during mutual removal attempts (FOR UPDATE lock)', async () => {
      // Both Owner 1 and Owner 2 simultaneously attempt to remove each other
      const [req1, req2] = await Promise.all([
        app.inject({
          method: 'DELETE',
          url: `/api/organizations/${concurrentOrgId}/members/${userOwner2}`,
          headers: { authorization: `Bearer ${tokenOwner1}` },
        }),
        app.inject({
          method: 'DELETE',
          url: `/api/organizations/${concurrentOrgId}/members/${userOwner1}`,
          headers: { authorization: `Bearer ${tokenOwner2}` },
        }),
      ]);

      const statuses = [req1.statusCode, req2.statusCode];
      // Exactly one must succeed (200), and the other is rejected (either 403 because membership was revoked first, or 400 last owner)
      expect(statuses).toContain(200);
      expect(statuses.some((s) => s === 400 || s === 403)).toBe(true);

      // Verify exactly one owner remains in the database
      const checkOwners = await migratorPool.query(
        `SELECT user_id, role FROM organization_memberships WHERE organization_id = $1 AND role = 'OWNER'`,
        [concurrentOrgId]
      );
      expect(checkOwners.rows.length).toBe(1);
    });

    it('prevents concurrent double-deletion by the same owner, guaranteeing last-owner protection (400)', async () => {
      // 1. Re-add userOwner2 as co-owner so we have 2 owners again
      await migratorPool.query(
        `INSERT INTO organization_memberships (organization_id, user_id, role)
         VALUES ($1, $2, 'OWNER')
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'OWNER'`,
        [concurrentOrgId, userOwner2]
      );

      // Verify we have 2 owners
      const checkBefore = await migratorPool.query(
        `SELECT COUNT(*) FROM organization_memberships WHERE organization_id = $1 AND role = 'OWNER'`,
        [concurrentOrgId]
      );
      expect(Number(checkBefore.rows[0].count)).toBe(2);

      // 2. Owner 1 simultaneously attempts to remove Owner 2 and Owner 1
      const [reqA, reqB] = await Promise.all([
        app.inject({
          method: 'DELETE',
          url: `/api/organizations/${concurrentOrgId}/members/${userOwner2}`,
          headers: { authorization: `Bearer ${tokenOwner1}` },
        }),
        app.inject({
          method: 'DELETE',
          url: `/api/organizations/${concurrentOrgId}/members/${userOwner1}`,
          headers: { authorization: `Bearer ${tokenOwner1}` },
        }),
      ]);

      const statuses = [reqA.statusCode, reqB.statusCode];
      // Exactly one deletion succeeds (200), and the other fails with CANNOT_REMOVE_LAST_OWNER (400)
      expect(statuses).toContain(200);
      expect(statuses).toContain(400);

      // Verify exactly one owner remains
      const checkAfter = await migratorPool.query(
        `SELECT COUNT(*) FROM organization_memberships WHERE organization_id = $1 AND role = 'OWNER'`,
        [concurrentOrgId]
      );
      expect(Number(checkAfter.rows[0].count)).toBe(1);
    });
  });

  // ============================================================================
  // 4. Asymmetric JWKS Token Verification (Production Baseline)
  // ============================================================================
  describe('4. Asymmetric JWKS Token Verification', () => {
    let mockJwksServer: http.Server;
    let jwksPort: number;
    let testKeypair: Awaited<ReturnType<typeof createTestJWKSPair>>;

    beforeAll(async () => {
      testKeypair = await createTestJWKSPair();

      // Spin up local HTTP server exposing .well-known/jwks.json
      mockJwksServer = http.createServer((req, res) => {
        if (req.url === '/auth/v1/.well-known/jwks.json') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(testKeypair.jwks));
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => {
        mockJwksServer.listen(0, '127.0.0.1', () => {
          jwksPort = (mockJwksServer.address() as any).port;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => mockJwksServer.close(() => resolve()));
    });

    it('verifies an RS256 token signed with asymmetric private key against JWKS endpoint', async () => {
      // Temporarily set SUPABASE_JWKS_URL
      const originalEnv = process.env.SUPABASE_JWKS_URL;
      process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${jwksPort}/auth/v1/.well-known/jwks.json`;
      resetConfigCache();

      try {
        const asymServer = await buildServer({ db: appDb });

        const rsaToken = await createTestSignedToken(userOwner1, 'owner1@audit.com', {
          privateKey: testKeypair.privateKey,
          algorithm: 'RS256',
          keyId: 'test-key-1',
        });

        const res = await asymServer.inject({
          method: 'GET',
          url: '/api/auth/me',
          headers: { authorization: `Bearer ${rsaToken}` },
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().data.id).toBe(userOwner1);

        await asymServer.close();
      } finally {
        if (originalEnv) {
          process.env.SUPABASE_JWKS_URL = originalEnv;
        } else {
          delete process.env.SUPABASE_JWKS_URL;
        }
        resetConfigCache();
      }
    });

    it('rejects an HS256 token when configured for asymmetric JWKS verification', async () => {
      const originalEnv = process.env.SUPABASE_JWKS_URL;
      process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${jwksPort}/auth/v1/.well-known/jwks.json`;
      resetConfigCache();

      try {
        const asymServer = await buildServer({ db: appDb });

        // Generate an HS256 token
        const hsToken = await createTestSignedToken(userOwner1, 'owner1@audit.com', {
          algorithm: 'HS256',
        });

        const res = await asymServer.inject({
          method: 'GET',
          url: '/api/auth/me',
          headers: { authorization: `Bearer ${hsToken}` },
        });

        // Must reject HS256 because JWKS only permits asymmetric RS256/ES256
        expect(res.statusCode).toBe(401);
        expect(res.json().error.code).toBe('INVALID_TOKEN');

        await asymServer.close();
      } finally {
        if (originalEnv) {
          process.env.SUPABASE_JWKS_URL = originalEnv;
        } else {
          delete process.env.SUPABASE_JWKS_URL;
        }
        resetConfigCache();
      }
    });
  });
});
