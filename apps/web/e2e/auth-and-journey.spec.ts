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

    // 6. Sign Out and verify session termination & cache purge
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
  });
});
