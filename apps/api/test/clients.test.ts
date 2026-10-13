import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SignJWT } from 'jose';
import pg from 'pg';
import {
  createDbPool,
  createKyselyDb,
  type Database,
} from '@invoiceflow/db';
import { buildServer } from '../src/server.js';
import { getConfig } from '../src/config.js';

describe('SaaS Client Management & Tenant Isolation Suite', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let appPool: pg.Pool;
  let migratorPool: pg.Pool;
  let appDb: ReturnType<typeof createKyselyDb>;
  const config = getConfig();

  const userAliceId = '11111111-aaaa-4111-a111-111111111111';
  const userBobId = '22222222-bbbb-4222-a222-222222222222';
  const userViewerId = '33333333-cccc-4333-a333-333333333333';
  const userFinanceId = '44444444-dddd-4444-a444-444444444444';

  let tokenAlice: string;
  let tokenBob: string;
  let tokenViewer: string;
  let tokenFinance: string;

  let orgAId: string;
  let orgBId: string;

  async function createSignedToken(userId: string, email: string): Promise<string> {
    const secretKey = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);
    const exp = Math.floor(Date.now() / 1000) + 3600;

    return await new SignJWT({
      email,
      role: 'authenticated',
      app_metadata: { provider: 'email' },
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setAudience('authenticated')
      .setIssuer(`${config.SUPABASE_URL}/auth/v1`)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(secretKey);
  }

  beforeAll(async () => {
    appPool = createDbPool({
      connectionString: config.DATABASE_URL,
      maxConnections: 5,
    });
    appDb = createKyselyDb(appPool);

    migratorPool = createDbPool({
      connectionString: config.MIGRATOR_DATABASE_URL || config.DATABASE_URL,
      maxConnections: 2,
    });

    const userIds = [userAliceId, userBobId, userViewerId, userFinanceId];

    // Cleanup old test users
    await migratorPool.query(`DELETE FROM public.users WHERE id = ANY($1::uuid[])`, [userIds]);
    await migratorPool.query(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [userIds]);

    // Insert auth.users
    await migratorPool.query(
      `INSERT INTO auth.users (id, email) VALUES
       ($1, 'alice.client@test.com'),
       ($2, 'bob.client@test.com'),
       ($3, 'viewer.client@test.com'),
       ($4, 'finance.client@test.com')`,
      userIds
    );

    // Insert public.users
    await migratorPool.query(
      `INSERT INTO public.users (id, email, full_name) VALUES
       ($1, 'alice.client@test.com', 'Alice Owner'),
       ($2, 'bob.client@test.com', 'Bob Competitor'),
       ($3, 'viewer.client@test.com', 'Viewer Only'),
       ($4, 'finance.client@test.com', 'Finance Manager')`,
      userIds
    );

    app = await buildServer({ db: appDb });

    tokenAlice = await createSignedToken(userAliceId, 'alice.client@test.com');
    tokenBob = await createSignedToken(userBobId, 'bob.client@test.com');
    tokenViewer = await createSignedToken(userViewerId, 'viewer.client@test.com');
    tokenFinance = await createSignedToken(userFinanceId, 'finance.client@test.com');

    // Create Org A with Alice as OWNER
    const createOrgARes = await app.inject({
      method: 'POST',
      url: '/api/organizations',
      headers: { authorization: `Bearer ${tokenAlice}` },
      payload: {
        legalName: 'Alice Global Corp',
        displayName: 'Alice Global',
        businessCountry: 'IN',
        addressLine1: '123 MG Road',
        city: 'Bengaluru',
        postalCode: '560001',
        contactEmail: 'contact@alice.com',
        baseCurrency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    expect(createOrgARes.statusCode).toBe(201);
    orgAId = JSON.parse(createOrgARes.payload).data.id;

    // Add Viewer to Org A with VIEWER role
    await migratorPool.query(
      `INSERT INTO public.organization_memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'VIEWER')`,
      [orgAId, userViewerId]
    );

    // Add Finance Manager to Org A with FINANCE role
    await migratorPool.query(
      `INSERT INTO public.organization_memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'FINANCE')`,
      [orgAId, userFinanceId]
    );

    // Create Org B with Bob as OWNER
    const createOrgBRes = await app.inject({
      method: 'POST',
      url: '/api/organizations',
      headers: { authorization: `Bearer ${tokenBob}` },
      payload: {
        legalName: 'Bob Rival Enterprises',
        displayName: 'Bob Rival',
        businessCountry: 'AE',
        addressLine1: 'Sheikh Zayed Rd',
        city: 'Dubai',
        postalCode: '00000',
        contactEmail: 'contact@bob.com',
        baseCurrency: 'AED',
        timezone: 'Asia/Dubai',
      },
    });
    expect(createOrgBRes.statusCode).toBe(201);
    orgBId = JSON.parse(createOrgBRes.payload).data.id;
  });

  afterAll(async () => {
    await app.close();
    await appPool.end();
    await migratorPool.end();
  });

  describe('1. Authorization & Role Enforcement', () => {
    it('allows OWNER to create a client', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Acme India Pvt Ltd',
          email: 'accounts@acme.in',
          phone: '+91 9876543210',
          company: 'Acme Group',
          taxIdentifier: '29ABCDE1234F1Z5',
          city: 'Mumbai',
          country: 'IN',
          currency: 'INR',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Acme India Pvt Ltd');
      expect(body.data.organizationId).toBe(orgAId);
      expect(body.data.status).toBe('ACTIVE');
    });

    it('allows FINANCE to create a client', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenFinance}` },
        payload: {
          name: 'Delta Tech Solutions',
          email: 'finance@deltatech.com',
          country: 'IN',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Delta Tech Solutions');
    });

    it('rejects VIEWER from creating a client with 403 INSUFFICIENT_PERMISSIONS', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenViewer}` },
        payload: {
          name: 'Unauthorized Client Creation',
          email: 'viewer@hacked.com',
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects non-member user from creating a client in another org with 403 FORBIDDEN_ORGANIZATION_ACCESS', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenBob}` }, // Bob is NOT a member of Org A
        payload: {
          name: 'Bobs Infiltrated Client',
          email: 'bob@spy.com',
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        payload: {
          name: 'No Token Client',
        },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('2. Server-side Validation', () => {
    it('rejects client creation with empty name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: '   ',
          email: 'valid@email.com',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid email format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Valid Name',
          email: 'not-an-email',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid country code length', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Valid Name',
          country: 'IND', // Country must be 2-letter ISO code
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. Multi-Tenant Cross-Access Isolation', () => {
    let aliceClientId: string;

    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Secret Client A',
          email: 'secret@clienta.com',
          company: 'Confidential A Corp',
        },
      });
      aliceClientId = JSON.parse(res.payload).data.id;
    });

    it('Bob cannot list Alice organization clients', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });

    it('Bob listing his own org does not include Alice clients', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgBId}/clients`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.length).toBe(0); // Bob has 0 clients
    });

    it('Bob cannot read Alice client using direct client ID in Bob org', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgBId}/clients/${aliceClientId}`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).error.code).toBe('NOT_FOUND');
    });

    it('Bob cannot update Alice client through Bob org or Alice org', async () => {
      // 1. Through Alice Org (membership rejection)
      const res1 = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/clients/${aliceClientId}`,
        headers: { authorization: `Bearer ${tokenBob}` },
        payload: { name: 'Compromised Name' },
      });
      expect(res1.statusCode).toBe(403);

      // 2. Through Bob Org (tenant isolation boundary rejection)
      const res2 = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgBId}/clients/${aliceClientId}`,
        headers: { authorization: `Bearer ${tokenBob}` },
        payload: { name: 'Compromised Name' },
      });
      expect(res2.statusCode).toBe(404);
    });

    it('Bob cannot delete Alice client', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/organizations/${orgAId}/clients/${aliceClientId}`,
        headers: { authorization: `Bearer ${tokenBob}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('4. Read, Update, and Archive Lifecycle', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Starlight Enterprises',
          email: 'billing@starlight.com',
          phone: '+91 9988776655',
          company: 'Starlight Group',
          country: 'IN',
          currency: 'INR',
        },
      });
      clientId = JSON.parse(res.payload).data.id;
    });

    it('VIEWER can view client details and list clients', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenViewer}` },
      });
      expect(listRes.statusCode).toBe(200);
      const listData = JSON.parse(listRes.payload).data;
      expect(listData.some((c: any) => c.id === clientId)).toBe(true);

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients/${clientId}`,
        headers: { authorization: `Bearer ${tokenViewer}` },
      });
      expect(getRes.statusCode).toBe(200);
      expect(JSON.parse(getRes.payload).data.name).toBe('Starlight Enterprises');
    });

    it('filters clients by search query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients?search=Starlight`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload).data;
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].name).toContain('Starlight');
    });

    it('updates client details', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/organizations/${orgAId}/clients/${clientId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
        payload: {
          name: 'Starlight Holdings Ltd',
          company: 'Starlight Global',
          notes: 'Important enterprise client',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Starlight Holdings Ltd');
      expect(body.data.company).toBe('Starlight Global');
      expect(body.data.notes).toBe('Important enterprise client');
    });

    it('archives client (soft delete)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/organizations/${orgAId}/clients/${clientId}`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe('ARCHIVED');

      // Default list (ACTIVE only) should not include archived client
      const listActiveRes = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      const activeClients = JSON.parse(listActiveRes.payload).data;
      expect(activeClients.some((c: any) => c.id === clientId)).toBe(false);

      // Status=ALL should include it
      const listAllRes = await app.inject({
        method: 'GET',
        url: `/api/organizations/${orgAId}/clients?status=ALL`,
        headers: { authorization: `Bearer ${tokenAlice}` },
      });
      const allClients = JSON.parse(listAllRes.payload).data;
      expect(allClients.some((c: any) => c.id === clientId)).toBe(true);
    });
  });

  describe('5. Fail-Closed RLS Enforcement at DB Level', () => {
    it('prevents querying clients table without transaction-local tenant context', async () => {
      // Connect as invoiceflow_app role (which has RLS enforced)
      const res = await appPool.query('SELECT * FROM public.clients');
      // Because app.current_org_id is unset, RLS policy fails closed
      expect(res.rows.length).toBe(0);
    });
  });
});
