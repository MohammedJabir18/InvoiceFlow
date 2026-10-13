import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const TEST_SECRET = process.env.SUPABASE_JWT_SECRET || 'super_secret_local_dev_jwt_secret_min_32_chars_long_123456';
const DB_URL = process.env.MIGRATOR_DATABASE_URL || 'postgresql://invoiceflow_migrator@127.0.0.1:5434/invoiceflow_saas';

async function createE2EToken(userId: string, email: string): Promise<string> {
  const secretKey = new TextEncoder().encode(TEST_SECRET);
  return await new SignJWT({
    email,
    role: 'authenticated',
    app_metadata: { provider: 'email' },
  })
    .setSubject(userId)
    .setAudience('authenticated')
    .setIssuer('http://127.0.0.1:54321/auth/v1')
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 7200)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secretKey);
}

test.describe('Milestone 1A Browser Journey & Security Boundaries', () => {
  let pgClient: pg.Client;

  test.beforeAll(async () => {
    pgClient = new pg.Client({ connectionString: DB_URL });
    await pgClient.connect();
  });

  test.afterAll(async () => {
    await pgClient.end();
  });

  // ============================================================================
  // Test 1: Error Transparency When Supabase Auth Is Down
  // ============================================================================
  test('1. Never falls back to mock authentication when Supabase is unavailable', async ({
    page,
  }) => {
    // Clear cookies & storage to ensure clean unauthenticated start
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    // Check that real login screen is visible
    await expect(page.locator('text=Sign in to InvoiceFlow Cloud')).toBeVisible({ timeout: 10000 });

    // Verify there are no mock/developer buttons anywhere on the screen
    await expect(page.locator('text=Developer Quick Test Login')).not.toBeVisible();
    await expect(page.locator('text=mock-token')).not.toBeVisible();

    // Fill credentials and attempt to submit
    await page.fill('input[type="email"]', 'realuser@test.com');
    await page.fill('input[type="password"]', 'SecretPassword123!');
    await page.click('button:has-text("Sign In with Supabase")');

    // Must show explicit service failure error; must NOT silently log in or mock authenticate
    const alertMessage = page.locator('text=Supabase Auth service is currently unreachable');
    await expect(alertMessage).toBeVisible({ timeout: 10000 });

    // User must remain on login screen; protected dashboard must NOT be shown
    await expect(page.locator('text=InvoiceFlow Cloud SaaS')).not.toBeVisible();
  });

  // ============================================================================
  // Test 2: Full End-to-End User Journey: Bootstrap -> Edit Settings -> Persistence -> Logout
  // ============================================================================
  test('2. Real Browser Journey: Bootstrap Org -> Update Settings -> Reload Persistence -> Sign Out', async ({
    page,
  }) => {
    const aliceId = '66666666-6666-4666-a666-666666666661';
    const aliceEmail = 'alice.browser@test.com';

    // Cleanup and insert Alice into database
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [aliceId]);
    await pgClient.query(`DELETE FROM auth.users WHERE id = $1`, [aliceId]);

    await pgClient.query(
      `INSERT INTO auth.users (id, email) VALUES ($1, $2)`,
      [aliceId, aliceEmail]
    );
    await pgClient.query(
      `INSERT INTO public.users (id, email, full_name) VALUES ($1, $2, 'Alice Browser')`,
      [aliceId, aliceEmail]
    );

    const aliceToken = await createE2EToken(aliceId, aliceEmail);

    // 1. Visit app with authenticated token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      window.localStorage.setItem('invoiceflow_jwt_token', token);
      window.localStorage.removeItem('invoiceflow_active_org_id');
    }, aliceToken);
    await page.reload();

    // 2. Organization Onboarding: Should show onboarding button in empty state
    const createOrgBtn = page.locator('button:has-text("Create Organization")');
    await createOrgBtn.click({ timeout: 10000 });

    // Modal should be visible
    await expect(page.locator('text=Create New Organization')).toBeVisible({ timeout: 10000 });

    // Fill organization bootstrap form
    await page.fill('input[placeholder="Acme Technologies Inc."]', 'Atlas Technologies Inc.');
    await page.fill('input[placeholder="Acme Tech"]', 'Atlas Tech');
    await page.selectOption('select:has(option[value="US"])', 'US');
    await page.selectOption('select:has(option[value="USD"])', 'USD');
    await page.selectOption('select:has(option[value="UTC"])', 'America/New_York');
    await page.fill('input[placeholder="123 Innovation Drive"]', '500 Market St');
    await page.fill('input[placeholder="City"]', 'San Francisco');
    await page.fill('input[placeholder="Postal Code / ZIP"]', '94105');
    await page.fill('input[placeholder="billing@acme.com"]', 'billing@atlastech.com');

    // Submit organization creation
    await page.click('button[type="submit"]:has-text("Create Organization")');

    // Dashboard should load with Atlas Tech active
    await expect(page.locator('h1:has-text("Atlas Tech")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Tenant')).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Business Settings tab
    await page.click('button:has-text("Business Settings")');
    await expect(page.locator('h1:has-text("Business & Regional Settings")')).toBeVisible({ timeout: 10000 });

    // 4. Update orthogonal settings independently
    // Country -> India (IN), Currency -> INR, Timezone -> Asia/Kolkata
    await page.selectOption('select:has(option[value="IN"])', 'IN');
    await page.selectOption('select:has(option[value="INR"])', 'INR');
    await page.selectOption('select:has(option[value="Asia/Kolkata"])', 'Asia/Kolkata');

    await page.click('button:has-text("Save Settings")');
    await expect(page.locator('text=Settings updated successfully!')).toBeVisible({ timeout: 10000 });

    // 5. Reload the page and verify persistence across reload
    await page.reload();
    await page.click('button:has-text("Business Settings")');

    const countrySelect = page.locator('select:has(option[value="IN"])').first();
    const currencySelect = page.locator('select:has(option[value="INR"])').first();
    const timezoneSelect = page.locator('select:has(option[value="Asia/Kolkata"])').first();

    await expect(countrySelect).toHaveValue('IN');
    await expect(currencySelect).toHaveValue('INR');
    await expect(timezoneSelect).toHaveValue('Asia/Kolkata');

    // 6. Navigate to Clients tab and manage clients
    await page.click('button:has-text("Clients")');
    await expect(page.locator('h1:has-text("Client Directory")')).toBeVisible({ timeout: 10000 });

    // Empty state should be visible
    await expect(page.locator('text=No clients found')).toBeVisible({ timeout: 10000 });

    // Click "Add Client"
    await page.click('button:has-text("Add Client")');
    await expect(page.locator('h2:has-text("Add New Client")')).toBeVisible({ timeout: 10000 });

    // Fill client form
    await page.fill('input[placeholder="e.g. Acme Corporation"]', 'Acme Enterprises India');
    await page.fill('input[placeholder="e.g. Acme Group"]', 'Acme Global');
    await page.fill('input[placeholder="billing@client.com"]', 'billing@acme.in');
    await page.fill('input[placeholder="+91 98765 43210"]', '+91 98765 43210');
    await page.fill('input[placeholder="e.g. 27ABCDE1234F1Z5"]', '29AABCU9603R1ZM');
    await page.fill('input[placeholder="Address Line 1"]', '100 MG Road');
    await page.fill('input[placeholder="City"]', 'Bengaluru');
    await page.fill('input[placeholder="Postal Code / PIN"]', '560001');

    await page.click('button[type="submit"]:has-text("Create Client")');

    // Client should now appear in the directory table
    await expect(page.locator('text=Acme Enterprises India').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span:has-text("ACTIVE")').first()).toBeVisible({ timeout: 10000 });

    // Edit Client
    await page.click('button:has-text("Edit")');
    await expect(page.locator('h2:has-text("Edit Client Details")')).toBeVisible({ timeout: 10000 });
    await page.fill('input[value="Acme Global"]', 'Acme Global Private Limited');
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await expect(page.locator('text=Acme Global Private Limited')).toBeVisible({ timeout: 10000 });

    // 7. Reload and verify persistence of client and org across page reload
    await page.reload();
    await page.click('button:has-text("Clients")');
    await expect(page.locator('text=Acme Enterprises India').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Acme Global Private Limited')).toBeVisible({ timeout: 10000 });

    // 8. Sign Out and verify session termination & cache purge
    await page.click('button:has-text("Sign Out")');

    // Must be redirected back to the login screen
    await expect(page.locator('text=Sign in to InvoiceFlow Cloud')).toBeVisible({ timeout: 10000 });

    // Reload again: verify protected access is blocked
    await page.reload();
    await expect(page.locator('text=Sign in to InvoiceFlow Cloud')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Tenant')).not.toBeVisible();
  });

  // ============================================================================
  // Test 3: Two-Account / Two-Organization Browser Isolation
  // ============================================================================
  test('3. Two-Account Browser Isolation: User B cannot see User A organization or cached data', async ({
    page,
  }) => {
    const bobId = '77777777-7777-4777-a777-777777777772';
    const bobEmail = 'bob.browser@test.com';

    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [bobId]);
    await pgClient.query(`DELETE FROM auth.users WHERE id = $1`, [bobId]);

    await pgClient.query(
      `INSERT INTO auth.users (id, email) VALUES ($1, $2)`,
      [bobId, bobEmail]
    );
    await pgClient.query(
      `INSERT INTO public.users (id, email, full_name) VALUES ($1, $2, 'Bob Browser')`,
      [bobId, bobEmail]
    );

    const bobToken = await createE2EToken(bobId, bobEmail);

    // Set Bob's token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      window.localStorage.setItem('invoiceflow_jwt_token', token);
      window.localStorage.removeItem('invoiceflow_active_org_id');
    }, bobToken);
    await page.reload();

    // Bob creates his own organization: "Apex Consulting"
    const createBtn = page.locator('button:has-text("Create Organization")');
    await createBtn.click({ timeout: 10000 });

    await page.fill('input[placeholder="Acme Technologies Inc."]', 'Apex Consulting Ltd');
    await page.fill('input[placeholder="Acme Tech"]', 'Apex Consulting');
    await page.fill('input[placeholder="123 Innovation Drive"]', '12 King St');
    await page.fill('input[placeholder="City"]', 'London');
    await page.fill('input[placeholder="Postal Code / ZIP"]', 'EC1A 1BB');
    await page.fill('input[placeholder="billing@acme.com"]', 'billing@apex.co.uk');

    await page.click('button[type="submit"]:has-text("Create Organization")');
    await expect(page.locator('h1:has-text("Apex Consulting")')).toBeVisible({ timeout: 10000 });

    // Crucial isolation check: Verify Bob's organization selector does NOT contain Atlas Tech (Alice's org)
    const orgSelector = page.locator('select:has(option:has-text("Apex Consulting"))');
    await expect(orgSelector).toBeVisible({ timeout: 10000 });
    await expect(page.locator('option:has-text("Atlas Tech")')).not.toBeAttached();

    // Verify Bob's clients directory does NOT contain Alice's client
    await page.click('button:has-text("Clients")');
    await expect(page.locator('text=No clients found')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Acme Enterprises India')).not.toBeAttached();
  });

  // ============================================================================
  // Test 4: FINANCE Role Contact Editing & Lifecycle Controls Guard
  // ============================================================================
  test('4. FINANCE Role: Can edit contact info in UI without 403; lifecycle controls guarded', async ({
    page,
  }) => {
    const ownerId = '88888888-8888-4888-a888-888888888881';
    const financeId = '88888888-8888-4888-a888-888888888882';
    const orgId = '88888888-8888-4888-a888-888888888880';
    const clientId = '88888888-8888-4888-a888-888888888883';

    await pgClient.query(`DELETE FROM public.clients WHERE organization_id = $1`, [orgId]);
    await pgClient.query(`DELETE FROM public.organization_memberships WHERE organization_id = $1`, [orgId]);
    await pgClient.query(`DELETE FROM public.organizations WHERE id = $1`, [orgId]);
    await pgClient.query(`DELETE FROM public.users WHERE id IN ($1, $2)`, [ownerId, financeId]);
    await pgClient.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [ownerId, financeId]);

    await pgClient.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4)`, [
      ownerId,
      'owner.delta@test.com',
      financeId,
      'finance.delta@test.com',
    ]);
    await pgClient.query(
      `INSERT INTO public.users (id, email, full_name) VALUES ($1, $2, 'Dana Owner'), ($3, $4, 'Fiona Finance')`,
      [ownerId, 'owner.delta@test.com', financeId, 'finance.delta@test.com']
    );
    await pgClient.query(
      `INSERT INTO public.organizations (id, legal_name, display_name, business_country, address_line1, city, postal_code, contact_email)
       VALUES ($1, 'Delta Global Corp', 'Delta Global', 'US', '100 Pine St', 'Seattle', '98101', 'billing@deltaglobal.com')`,
      [orgId]
    );
    await pgClient.query(
      `INSERT INTO public.organization_memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'OWNER'), ($1, $3, 'FINANCE')`,
      [orgId, ownerId, financeId]
    );
    await pgClient.query(
      `INSERT INTO public.clients (id, organization_id, name, email, phone, notes, status)
       VALUES ($1, $2, 'Delta Client One', 'client@deltaclient.com', '+1 555 123 4567', 'Initial client note', 'ACTIVE')`,
      [clientId, orgId]
    );

    const fionaToken = await createE2EToken(financeId, 'finance.delta@test.com');

    // Sign in as Fiona (FINANCE role)
    await page.goto('/');
    await page.evaluate(
      ({ token, activeOrgId }) => {
        window.localStorage.setItem('invoiceflow_jwt_token', token);
        window.localStorage.setItem('invoiceflow_active_org_id', activeOrgId);
      },
      { token: fionaToken, activeOrgId: orgId }
    );
    await page.reload();

    // Verify organization is Delta Global
    await expect(page.locator('h1:has-text("Delta Global")')).toBeVisible({ timeout: 10000 });

    // Open Clients tab
    await page.click('button:has-text("Clients")');
    await expect(page.locator('h1:has-text("Client Directory")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Delta Client One')).toBeVisible({ timeout: 10000 });

    // 1. Verify Archive action button in table is NOT visible for FINANCE member
    await expect(page.locator('table button:has-text("Archive")')).not.toBeVisible();

    // 2. Click Edit to open edit modal
    await page.click('button:has-text("Edit")');
    await expect(page.locator('h2:has-text("Edit Client Details")')).toBeVisible({ timeout: 10000 });

    // 3. Verify Status field is read-only badge for FINANCE
    await expect(
      page.locator('text=Lifecycle status can only be modified by Owners and Admins')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('select:has(option[value="ARCHIVED"])')).not.toBeVisible();

    // 4. Update contact details (phone and notes)
    await page.fill('input[value="+1 555 123 4567"]', '+1 555 999 8888');
    await page.fill('textarea', 'Updated by Fiona in Finance');

    // 5. Submit form
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // 6. Verify modal closes cleanly without 403 error
    await expect(page.locator('h2:has-text("Edit Client Details")')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Forbidden')).not.toBeVisible();
    await expect(page.locator('text=permission to modify client lifecycle status')).not.toBeVisible();

    // 7. Verify updated phone is visible in table
    await expect(page.locator('text=+1 555 999 8888')).toBeVisible({ timeout: 5000 });

    // 8. Reload page and verify persistence across reload
    await page.reload();
    await page.click('button:has-text("Clients")');
    await expect(page.locator('text=+1 555 999 8888')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Edit")');
    await expect(page.locator('textarea')).toHaveValue('Updated by Fiona in Finance');
    await page.click('button:has-text("Cancel")');
  });

  // ============================================================================
  // Test 5: Client Directory Pagination & Filter Reset Journey (>50 clients)
  // ============================================================================
  test('5. Complete Pagination: Directory handles >50 clients with navigation and filter reset', async ({
    page,
  }) => {
    const peterId = '99999999-9999-4999-a999-999999999991';
    const peterEmail = 'peter.pagination@test.com';
    const paginationOrgId = '99999999-9999-4999-a999-999999999990';

    await pgClient.query(`DELETE FROM public.clients WHERE organization_id = $1`, [paginationOrgId]);
    await pgClient.query(`DELETE FROM public.organization_memberships WHERE organization_id = $1`, [paginationOrgId]);
    await pgClient.query(`DELETE FROM public.organizations WHERE id = $1`, [paginationOrgId]);
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [peterId]);
    await pgClient.query(`DELETE FROM auth.users WHERE id = $1`, [peterId]);

    await pgClient.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2)`, [peterId, peterEmail]);
    await pgClient.query(
      `INSERT INTO public.users (id, email, full_name) VALUES ($1, $2, 'Peter Pagination')`,
      [peterId, peterEmail]
    );
    await pgClient.query(
      `INSERT INTO public.organizations (id, legal_name, display_name, business_country, address_line1, city, postal_code, contact_email)
       VALUES ($1, 'Pagination Enterprises', 'Pagination Org', 'US', '200 Main St', 'Austin', '78701', 'billing@pagination.com')`,
      [paginationOrgId]
    );
    await pgClient.query(
      `INSERT INTO public.organization_memberships (organization_id, user_id, role)
       VALUES ($1, $2, 'OWNER')`,
      [paginationOrgId, peterId]
    );

    // Seed 52 clients with distinct created_at timestamps
    // Client 52 is newest, Client 01 is oldest
    const baseTime = Date.now() - 52 * 60 * 1000;
    for (let i = 1; i <= 52; i++) {
      const pad = String(i).padStart(2, '0');
      const clientId = `99999999-9999-4999-b999-${pad.padStart(12, '0')}`;
      const createdAt = new Date(baseTime + i * 60 * 1000).toISOString();
      await pgClient.query(
        `INSERT INTO public.clients (id, organization_id, name, email, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $5)`,
        [clientId, paginationOrgId, `Paginated Client ${pad}`, `client${pad}@test.com`, createdAt]
      );
    }

    const peterToken = await createE2EToken(peterId, peterEmail);

    // Sign in as Peter
    await page.goto('/');
    await page.evaluate(
      ({ token, activeOrgId }) => {
        window.localStorage.setItem('invoiceflow_jwt_token', token);
        window.localStorage.setItem('invoiceflow_active_org_id', activeOrgId);
      },
      { token: peterToken, activeOrgId: paginationOrgId }
    );
    await page.reload();

    // Verify organization
    await expect(page.locator('h1:has-text("Pagination Org")')).toBeVisible({ timeout: 10000 });

    // Open Clients directory
    await page.click('button:has-text("Clients")');
    await expect(page.locator('h1:has-text("Client Directory")')).toBeVisible({ timeout: 10000 });

    // 1. Verify Page 1 controls: Showing 1 to 50 of 52 clients, Page 1 of 2
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    const pageIndicator = page.locator('[data-testid="pagination-page-indicator"]');
    const prevBtn = page.locator('[data-testid="pagination-prev"]');
    const nextBtn = page.locator('[data-testid="pagination-next"]');

    await expect(paginationInfo).toContainText('Showing 1 to 50 of 52 clients', { timeout: 10000 });
    await expect(pageIndicator).toContainText('Page 1 of 2');
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();

    // Verify 50 rows on page 1
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(50);

    // Because of descending order (created_at desc, id desc), newest Client 52 is on page 1, Client 01 is on page 2
    await expect(page.locator('text=Paginated Client 52')).toBeVisible();
    await expect(page.locator('text=Paginated Client 01')).not.toBeVisible();

    // 2. Click Next to go to Page 2
    await nextBtn.click();
    await expect(paginationInfo).toContainText('Showing 51 to 52 of 52 clients', { timeout: 10000 });
    await expect(pageIndicator).toContainText('Page 2 of 2');
    await expect(prevBtn).toBeEnabled();
    await expect(nextBtn).toBeDisabled();

    // Verify exactly 2 rows on page 2
    await expect(rows).toHaveCount(2);
    await expect(page.locator('text=Paginated Client 01')).toBeVisible();

    // 3. Search while on Page 2: filter query must automatically reset page back to 1
    await page.fill('input[placeholder="Search by name, company, email..."]', 'Client 01');
    await expect(paginationInfo).toContainText('Showing 1 to 1 of 1 clients', { timeout: 10000 });
    await expect(pageIndicator).toContainText('Page 1 of 1');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('text=Paginated Client 01')).toBeVisible();

    // 4. Clear search query: should return to Page 1 showing 50 items
    await page.fill('input[placeholder="Search by name, company, email..."]', '');
    await expect(paginationInfo).toContainText('Showing 1 to 50 of 52 clients', { timeout: 10000 });
    await expect(pageIndicator).toContainText('Page 1 of 2');
    await expect(rows).toHaveCount(50);
  });
});
