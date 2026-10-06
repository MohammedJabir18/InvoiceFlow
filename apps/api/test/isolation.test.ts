import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SignJWT } from 'jose';
import pg from 'pg';
import {
  createDbPool,
  createKyselyDb,
  withTenantContext,
  getUserMembership,
  type Database,
} from '@invoiceflow/db';
import { buildServer } from '../src/server.js';
import { getConfig } from '../src/config.js';

describe('Milestone 1A: Security, RLS & Multi-Tenant Isolation Suite', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let appPool: pg.Pool;
  let migratorPool: pg.Pool;
  let appDb: ReturnType<typeof createKyselyDb>;
  const config = getConfig();

  const userAliceId = '11111111-1111-4111-a111-111111111111';
  const userBobId = '22222222-2222-4222-a222-222222222222';
  const userCharlieId = '33333333-3333-4333-a333-333333333333';

  let tokenAlice: string;
  let tokenBob: string;
  let tokenCharlie: string;

  let orgAId: string;
  let orgBId: string;

  async function createSignedToken(
    userId: string,
    email: string,
    options: {
      secret?: string;
      expiresInSeconds?: number;
      audience?: string;
      issuer?: string;
      algorithm?: string;
    } = {}
  ): Promise<string> {
    const secretKey = new TextEncoder().encode(options.secret ?? config.SUPABASE_JWT_SECRET);
    const exp = Math.floor(Date.now() / 1000) + (options.expiresInSeconds ?? 3600);

    return await new SignJWT({
      email,
      role: 'authenticated',
      app_metadata: { provider: 'email' },
    })
      .setProtectedHeader({ alg: (options.algorithm as any) ?? 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setAudience(options.audience ?? 'authenticated')
      .setIssuer(options.issuer ?? `${config.SUPABASE_URL}/auth/v1`)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(secretKey);
  }

  beforeAll(async () => {
    // 1. Setup DB connections with restricted role (invoiceflow_app)
    appPool = createDbPool({
      connectionString: config.DATABASE_URL,
      maxConnections: 5,
    });
    appDb = createKyselyDb(appPool);

    // Migrator connection for test setup / cleanup
    migratorPool = createDbPool({
      connectionString: config.MIGRATOR_DATABASE_URL || config.DATABASE_URL,
      maxConnections: 2,
    });

    // Clean test records
    await migratorPool.query(
      `DELETE FROM users WHERE id IN ($1, $2, $3)`,
      [userAliceId, userBobId, userCharlieId]
    );

    await migratorPool.query(
      `INSERT INTO auth.users (id, email) VALUES
       ($1, 'alice@test.com'),
       ($2, 'bob@test.com'),
       ($3, 'charlie@test.com')
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [userAliceId, userBobId, userCharlieId]
    );

    // Insert test users
    await migratorPool.query(
      `INSERT INTO public.users (id, email, full_name) VALUES 
       ($1, 'alice@test.com', 'Alice Owner'),
       ($2, 'bob@test.com', 'Bob Tenant'),
       ($3, 'charlie@test.com', 'Charlie Member')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [userAliceId, userBobId, userCharlieId]
    );

    // 2. Build Fastify API instance
    app = await buildServer({ db: appDb });

    // 3. Generate valid tokens
    tokenAlice = await createSignedToken(userAliceId, 'alice@test.com');
    tokenBob = await createSignedToken(userBobId, 'bob@test.com');
    tokenCharlie = await createSignedToken(userCharlieId, 'charlie@test.com');
  });

  afterAll(async () => {
    await app.close();
    await appPool.end();
    await migratorPool.end();
  });

  // ============================================================================
  // 1. Token Security & jose Verification Tests
  // ============================================================================
  describe('1. Token Security & jose Verification', () => {
    it('accepts a valid signed JWT with correct sub and aud', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${tokenAlice}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(userAliceId);
      expect(body.data.email).toBe('alice@test.com');
    });

    it('rejects a request with missing authorization header (401)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects an expired JWT (401)', async () => {
      const expiredToken = await createSignedToken(userAliceId, 'alice@test.com', {
        expiresInSeconds: -60, // expired 1 minute ago
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${expiredToken}` },
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_TOKEN');
      expect(body.error.message).toContain('failed');
    });

    it('rejects a JWT signed with an invalid/forged secret (401)', async () => {
      const forgedToken = await createSignedToken(userAliceId, 'alice@test.com', {
        secret: 'a_completely_wrong_forged_secret_key_32_chars!!',
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${forgedToken}` },
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects a JWT with wrong audience (401)', async () => {
      const wrongAudToken = await createSignedToken(userAliceId, 'alice@test.com', {
        audience: 'wrong_audience',
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${wrongAudToken}` },
      });

      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.error.code).toBe('INVALID_TOKEN');
    });
  });

  // ============================================================================
  // 2. Organization Creation & Secured Bootstrap Path
  // ============================================================================
  describe('2. Secured Organization Bootstrap & Creation', () => {
    it('creates Organization A for Alice and automatically assigns OWNER role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/organizations',
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          legalName: 'Alice Global Corp',
          displayName: 'Alice Corp',
          businessCountry: 'US',
          baseCurrency: 'USD',
          timezone: 'America/New_York',
          addressLine1: '100 Broadway',
          city: 'New York',
          postalCode: '10001',
          contactEmail: 'billing@alicecorp.com',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.role).toBe('OWNER');
      orgAId = body.data.id;
    });

    it('creates Organization B for Bob and automatically assigns OWNER role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/organizations',
        headers: { authorization: `Bearer ${tokenBob}` },
        payload: {
          legalName: 'Bob Enterprises India Ltd',
          displayName: 'Bob Enterprises',
          businessCountry: 'IN',
          baseCurrency: 'INR',
          timezone: 'Asia/Kolkata',
          addressLine1: '45 MG Road',
          city: 'Bengaluru',
          postalCode: '560001',
          contactEmail: 'contact@bobenterprises.in',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.role).toBe('OWNER');
      orgBId = body.data.id;
    });

    it('lists only organizations where user holds membership', async () => {
      const resAlice = await app.inject({
        method: 'GET',
        url: '/api/organizations',
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      const aliceOrgs = resAlice.json().data;
      expect(aliceOrgs.some((o: any) => o.id === orgAId)).toBe(true);
      expect(aliceOrgs.some((o: any) => o.id === orgBId)).toBe(false);

      const resBob = await app.inject({
        method: 'GET',
        url: '/api/organizations',
        headers: { authorization: `Bearer ${tokenBob}` },
      });
      const bobOrgs = resBob.json().data;
      expect(bobOrgs.some((o: any) => o.id === orgBId)).toBe(true);
      expect(bobOrgs.some((o: any) => o.id === orgAId)).toBe(false);
    });
  });

  // ============================================================================
  // 3. PostgreSQL 17 RLS & Fail-Closed Behavior
  // ============================================================================
  describe('3. Restricted Role & Fail-Closed RLS at Database Level', () => {
    it('fails closed: selecting from organizations without tenant context returns 0 rows', async () => {
      // Direct raw query using restricted role invoiceflow_app WITHOUT setting app.current_org_id
      const result = await appPool.query('SELECT * FROM organizations');
      expect(result.rows.length).toBe(0);
    });

    it('fails closed: selecting from organization_memberships without tenant context returns 0 rows', async () => {
      const result = await appPool.query('SELECT * FROM organization_memberships');
      expect(result.rows.length).toBe(0);
    });

    it('fails closed: direct insert into organizations without matching tenant context fails', async () => {
      // Attempt to insert without setting context
      await expect(
        appPool.query(
          `INSERT INTO organizations (
            legal_name, display_name, business_country, address_line1,
            city, postal_code, contact_email
          ) VALUES ('Rogue Org', 'Rogue', 'US', 'Nowhere', 'Nowhere', '00000', 'rogue@test.com')`
        )
      ).rejects.toThrow();
    });

    it('returns only the matching organization row when tenant context is set', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgAId]);

        const resA = await client.query('SELECT id, legal_name FROM organizations');
        expect(resA.rows.length).toBe(1);
        expect(resA.rows[0].id).toBe(orgAId);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });

  // ============================================================================
  // 4. Connection Pool Reuse Safety & Context Leaks
  // ============================================================================
  describe('4. Connection Pool Reuse Safety & Transaction Cleanliness', () => {
    it('guarantees that committing a transaction clears tenant context on the pooled connection', async () => {
      const client = await appPool.connect();
      try {
        // Step 1: Open transaction and set Org A context
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgAId]);
        const testWithinTx = await client.query('SELECT id FROM organizations');
        expect(testWithinTx.rows.length).toBe(1);
        expect(testWithinTx.rows[0].id).toBe(orgAId);
        await client.query('COMMIT');

        // Step 2: Query on the EXACT same connection after COMMIT without setting context
        const testAfterCommit = await client.query('SELECT id FROM organizations');
        expect(testAfterCommit.rows.length).toBe(0); // MUST FAIL CLOSED
      } finally {
        client.release();
      }
    });

    it('guarantees that rolling back an errored transaction clears tenant context', async () => {
      const client = await appPool.connect();
      try {
        // Step 1: Open transaction and set Org B context
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgBId]);
        const testWithinTx = await client.query('SELECT id FROM organizations');
        expect(testWithinTx.rows.length).toBe(1);
        expect(testWithinTx.rows[0].id).toBe(orgBId);

        // Step 2: Rollback transaction
        await client.query('ROLLBACK');

        // Step 3: Query on the EXACT same connection after ROLLBACK
        const testAfterRollback = await client.query('SELECT id FROM organizations');
        expect(testAfterRollback.rows.length).toBe(0); // MUST FAIL CLOSED
      } finally {
        client.release();
      }
    });
  });

  // ============================================================================
  // 5. Cross-Tenant Isolation & Spoofed Context Rejection
  // ============================================================================
  describe('5. Cross-Tenant Isolation & Spoofed Header Protection', () => {
    it('rejects Alice trying to access Org B with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgBId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('rejects Bob trying to access Org A with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('rejects Alice spoofing x-organization-id header pointing to Org B', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgBId}/members`,
        headers: {
          authorization: `Bearer ${tokenAlice}`,
          'x-organization-id': orgBId,
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('rejects Alice attempting to update Org B settings', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgBId}/settings`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          displayName: 'Hacked by Alice',
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });
  });

  // ============================================================================
  // 6. Role-Based Permissions & Membership Revocation
  // ============================================================================
  describe('6. Membership Roles, Access Control & Revocation', () => {
    it('allows Alice (OWNER) to add Charlie as VIEWER to Org A', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/members`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          userId: userCharlieId,
          role: 'VIEWER',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.role).toBe('VIEWER');
    });

    it('allows Charlie to read Org A details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}`,
        headers: { authorization: `Bearer ${tokenCharlie}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.role).toBe('VIEWER');
    });

    it('prevents Charlie (VIEWER) from updating Org A settings (403 Insufficient Permissions)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/settings`,
        headers: { authorization: `Bearer ${tokenCharlie}` },
        payload: {
          displayName: 'Unauthorized Name',
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('revokes Charlie membership when Alice removes Charlie', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/organizations/${orgAId}/members/${userCharlieId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });

    it('immediately denies Charlie access to Org A following revocation', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}`,
        headers: { authorization: `Bearer ${tokenCharlie}` },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('prevents removing the last remaining OWNER of an organization', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/organizations/${orgAId}/members/${userAliceId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('CANNOT_REMOVE_LAST_OWNER');
    });
  });

  // ============================================================================
  // 7. Orthogonal Business Settings Persistence
  // ============================================================================
  describe('7. Orthogonal Settings Persistence', () => {
    it('persists country update without altering currency or timezone', async () => {
      // 1. Fetch baseline
      const resBefore = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      const initial = resBefore.json().data;
      expect(initial.businessCountry).toBe('US');
      expect(initial.baseCurrency).toBe('USD');
      expect(initial.timezone).toBe('America/New_York');

      // 2. Update ONLY businessCountry to 'GB'
      const resUpdateCountry = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/settings`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          businessCountry: 'GB',
        },
      });
      expect(resUpdateCountry.statusCode).toBe(200);
      const afterCountry = resUpdateCountry.json().data;
      expect(afterCountry.businessCountry).toBe('GB');
      expect(afterCountry.baseCurrency).toBe('USD'); // Unaltered
      expect(afterCountry.timezone).toBe('America/New_York'); // Unaltered

      // 3. Update ONLY baseCurrency to 'GBP'
      const resUpdateCurrency = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/settings`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          baseCurrency: 'GBP',
        },
      });
      expect(resUpdateCurrency.statusCode).toBe(200);
      const afterCurrency = resUpdateCurrency.json().data;
      expect(afterCurrency.businessCountry).toBe('GB'); // Preserved
      expect(afterCurrency.baseCurrency).toBe('GBP');
      expect(afterCurrency.timezone).toBe('America/New_York'); // Preserved

      // 4. Update ONLY timezone to 'Europe/London'
      const resUpdateTimezone = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/settings`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          timezone: 'Europe/London',
        },
      });
      expect(resUpdateTimezone.statusCode).toBe(200);
      const afterTimezone = resUpdateTimezone.json().data;
      expect(afterTimezone.businessCountry).toBe('GB'); // Preserved
      expect(afterTimezone.baseCurrency).toBe('GBP'); // Preserved
      expect(afterTimezone.timezone).toBe('Europe/London');
    });
  });

  // ============================================================================
  // 8. User Directory Privacy & Cross-Tenant Profile Isolation
  // ============================================================================
  describe('8. User Directory Privacy & Cross-Tenant Profile Isolation', () => {
    it('restricts direct SELECT on users to self and current-org members under runtime role', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userAliceId]);
        await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgAId]);

        const res = await client.query('SELECT id, email FROM users');
        const ids = res.rows.map((r) => r.id);

        // Alice must see herself and members of Org A
        expect(ids).toContain(userAliceId);

        // Alice must strictly NOT see Bob (who is only in Org B)
        expect(ids).not.toContain(userBobId);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('restricts direct SELECT on users to strictly self when no org context is active', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userAliceId]);

        const res = await client.query('SELECT id, email FROM users');
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].id).toBe(userAliceId);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('fails closed: direct SELECT on users with no user context returns zero rows', async () => {
      const client = await appPool.connect();
      try {
        const res = await client.query('SELECT id, email FROM users');
        expect(res.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('prevents cross-tenant leak when caller spoofs app.current_org_id for an org they do not belong to', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        // Alice sets context for Bob's organization Org B
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userAliceId]);
        await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgBId]);

        const res = await client.query('SELECT id, email FROM users');
        const ids = res.rows.map((r) => r.id);

        // Alice sees only herself because she is not a member of Org B
        expect(ids).toContain(userAliceId);
        expect(ids).not.toContain(userBobId);
        expect(res.rows.length).toBe(1);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('returns 404 when adding a non-existent user ID without exposing directory details', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000099';
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/members`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          userId: nonExistentId,
          role: 'VIEWER',
        },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('NOT_FOUND');
      expect(res.json().error.message).toBe('User does not exist');
    });

    it('verifies that GET /api/organizations/:id/members isolates member profiles across tenants', async () => {
      // Alice queries Org A members
      const resA = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/members`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      expect(resA.statusCode).toBe(200);
      const membersA = resA.json().data;
      expect(membersA.some((m: any) => m.userId === userAliceId)).toBe(true);
      expect(membersA.some((m: any) => m.userId === userBobId)).toBe(false);

      // Bob queries Org B members
      const resB = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgBId}/members`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });
      expect(resB.statusCode).toBe(200);
      const membersB = resB.json().data;
      expect(membersB.some((m: any) => m.userId === userBobId)).toBe(true);
      expect(membersB.some((m: any) => m.userId === userAliceId)).toBe(false);
    });
  });
});
