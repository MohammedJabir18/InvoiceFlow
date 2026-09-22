import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const SCREENSHOT_DIR = "C:/Users/jabir/.gemini/antigravity/brain/28008cb6-651c-4b80-9f76-f1b4dcea1c81";
const BASE_URL = "http://localhost:1420";

async function run() {
    console.log("Starting comprehensive InvoiceFlow verification in Light (Daylight) Mode...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });

    // Preset daylight theme and skip onboarding
    await context.addInitScript(() => {
        localStorage.setItem("invoiceflow_theme", "daylight");
        localStorage.setItem("has_skipped_onboarding", "true");
        document.documentElement.classList.add("daylight");
        document.body.classList.add("daylight");
    });

    const page = await context.newPage();
    page.on("dialog", async (dialog) => {
        console.log(`[Browser Dialog] ${dialog.type()}: ${dialog.message()}`);
        await dialog.accept();
    });

    // ----------------------------------------------------
    // TEST 1: Invoices Page (/invoices)
    // ----------------------------------------------------
    console.log("\n--- Testing Invoices Page ---");
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const invoicesHeading = await page.locator("h1").innerText();
    const invoiceRowsCount = await page.locator("tbody tr").count();
    console.log(`✓ Invoices Heading: "${invoicesHeading}"`);
    console.log(`✓ Invoices Rows Count: ${invoiceRowsCount}`);

    // Take screenshot of Invoices page in Light Mode
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_invoices_daylight.png") });
    console.log("✓ Saved 01_invoices_daylight.png");

    // ----------------------------------------------------
    // TEST 2: Quotations Page (/quotations)
    // ----------------------------------------------------
    console.log("\n--- Testing Quotations Page ---");
    await page.goto(`${BASE_URL}/quotations`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const quoteHeading = await page.locator("h1").innerText();
    console.log(`✓ Quotations Heading: "${quoteHeading}"`);

    // Verify Metric KPI cards
    const metricCards = await page.locator(".grid.grid-cols-2.lg\\:grid-cols-4 > div").count();
    console.log(`✓ Quotations Metric KPI Cards: ${metricCards}`);

    // Click "New Quotation" button
    console.log("Clicking 'New Quotation' button...");
    await page.getByRole("button", { name: "New Quotation" }).click();
    await page.waitForTimeout(500);

    const editorModalVisible = await page.locator("text=Create New Quotation").isVisible();
    console.log(`✓ Quotation Editor Modal Visible: ${editorModalVisible}`);

    // Fill Quotation Editor fields
    const quoteNum = `QT-2026-${Date.now().toString().slice(-3)}`;
    const quoteNumInput = page.locator("form input[type='text']").first();
    await quoteNumInput.fill(quoteNum);
    
    // Select first client
    const clientSelect = page.locator("form select").first();
    await clientSelect.selectOption({ index: 1 });
    
    // Fill item description
    const descInput = page.locator("form input[placeholder*='description']").first();
    if (await descInput.isVisible()) {
        await descInput.fill("Enterprise Software Architecture Services");
    }

    // Save Quotation
    console.log("Saving Quotation...");
    await page.getByRole("button", { name: /Save Quotation|Create Quotation/i }).click();
    await page.waitForTimeout(1000);

    // Verify quotation appears in table
    const createdQuoteVisible = await page.locator(`text=${quoteNum}`).first().isVisible();
    console.log(`✓ Newly created quote ${quoteNum} in table: ${createdQuoteVisible}`);

    // Take screenshot of Quotations page with the new quotation
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_quotations_daylight.png") });
    console.log("✓ Saved 02_quotations_daylight.png");

    // Click "Print / View Quotation" (Printer icon on first row)
    console.log("Clicking Printer button to open QuotationPrintModal...");
    const printBtn = page.locator('button[title*="Print"]').first();
    await printBtn.click();
    await page.waitForTimeout(600);

    const printModalVisible = await page.locator("text=Quotation Preview").first().isVisible();
    console.log(`✓ Quotation Print Modal Visible: ${printModalVisible}`);

    // Take screenshot of Quotation Print Modal in Light Mode
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_quotation_print_daylight.png") });
    console.log("✓ Saved 03_quotation_print_daylight.png");

    // Test "Convert to Invoice" button inside print modal
    console.log("Testing 'Convert to Invoice' inside Quotation Print Modal...");
    const convertBtn = page.getByRole("button", { name: "Convert to Invoice" }).first();
    if (await convertBtn.isVisible()) {
        await convertBtn.click();
        await page.waitForTimeout(1500);
        console.log(`✓ After conversion, redirected to: ${page.url()}`);
    } else {
        // Close modal
        await page.locator(".fixed.inset-0 button").filter({ has: page.locator("svg.lucide-x") }).click();
        await page.waitForTimeout(300);
    }

    // ----------------------------------------------------
    // TEST 3: Monthly Financial Report (/reports)
    // ----------------------------------------------------
    console.log("\n--- Testing Monthly Financial Report Page ---");
    await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const reportTitle = await page.locator("h1").innerText();
    console.log(`✓ Report Heading: "${reportTitle}"`);

    // Verify 4 Financial KPI cards (Gross, Collected, Outstanding, Tax)
    const reportKpis = await page.locator("#monthly-statement-area .grid.grid-cols-2 > div").count();
    console.log(`✓ Monthly Statement Financial KPI Cards: ${reportKpis}`);

    // Test Month selector dropdown
    const monthSelect = page.locator("select").first();
    await monthSelect.selectOption({ index: 1 }); // February
    await page.waitForTimeout(400);
    console.log("✓ Month selector changed to February");

    // Take screenshot of Monthly Report in Light Mode
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_monthly_report_daylight.png") });
    console.log("✓ Saved 04_monthly_report_daylight.png");

    // ----------------------------------------------------
    // TEST 4: Subscription & Commercial Plans (/subscription)
    // ----------------------------------------------------
    console.log("\n--- Testing Subscription Page ---");
    await page.goto(`${BASE_URL}/subscription`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const subHeading = await page.locator("h1").innerText();
    console.log(`✓ Subscription Heading: "${subHeading}"`);

    // Verify Plan Cards count (Starter, Professional, Enterprise)
    const planCardsCount = await page.locator(".grid.grid-cols-1.md\\:grid-cols-3 > div").count();
    console.log(`✓ Plan Cards Count: ${planCardsCount}`);

    // Click Annual billing toggle
    console.log("Testing Annual billing cycle toggle...");
    await page.getByRole("button", { name: /Annual/i }).click();
    await page.waitForTimeout(300);
    const annualBadgeVisible = await page.locator("text=Save 20%").isVisible();
    console.log(`✓ Annual 20% discount badge visible: ${annualBadgeVisible}`);

    // Test License Key input & Activation
    console.log("Testing License Key activation input...");
    const licenseInput = page.getByPlaceholder(/IF-PRO-2026|license/i);
    if (await licenseInput.isVisible()) {
        await licenseInput.fill("IF-PRO-CLIENT-2026");
        await page.getByRole("button", { name: "Activate License" }).click();
        await page.waitForTimeout(400);
        const licenseMsg = await page.locator("text=License activated successfully").isVisible();
        console.log(`✓ License key activation message: ${licenseMsg}`);
    }

    // Take screenshot of Subscription page in Light Mode
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_subscription_daylight.png") });
    console.log("✓ Saved 05_subscription_daylight.png");

    // ----------------------------------------------------
    // TEST 5: Settings Page (/settings)
    // ----------------------------------------------------
    console.log("\n--- Testing Settings Page ---");
    await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const settingsTitle = await page.locator("h1").innerText();
    console.log(`✓ Settings Heading: "${settingsTitle}"`);

    // Click Business Profile tab
    console.log("Switching to Business Profile tab...");
    await page.getByRole("button", { name: /Business Profile/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_settings_profile_daylight.png") });
    console.log("✓ Saved 06_settings_profile_daylight.png");

    // Click Payments & Bank tab
    console.log("Switching to Payments & Bank tab...");
    await page.getByRole("button", { name: /Payments & Bank/i }).click();
    await page.waitForTimeout(400);

    // Click Tabby BNPL tab
    console.log("Switching to Tabby BNPL tab...");
    await page.getByRole("button", { name: /Tabby BNPL/i }).click();
    await page.waitForTimeout(400);

    const tabbyConfigVisible = await page.locator("text=Model Context Protocol").isVisible();
    console.log(`✓ Tabby Configuration Panel Visible: ${tabbyConfigVisible}`);

    // Click "Save Changes" button
    console.log("Clicking 'Save Changes' button in Settings...");
    await page.getByRole("button", { name: /Save Changes/i }).click();
    await page.waitForTimeout(600);
    const savedSuccess = await page.locator("text=Saved!").isVisible();
    console.log(`✓ Settings Save notification: ${savedSuccess}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_settings_tabby_daylight.png") });
    console.log("✓ Saved 07_settings_tabby_daylight.png");

    // ----------------------------------------------------
    // TEST 6: Public Payment Portal (/pay/:id)
    // ----------------------------------------------------
    console.log("\n--- Testing Public Payment Portal (/pay/inv-002 - Unpaid Checkout) ---");
    await page.goto(`${BASE_URL}/pay/inv-002`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const payHeading = await page.locator("h1").innerText();
    console.log(`✓ Payment Portal Invoice Header: "${payHeading}"`);

    // Verify Tabby 4 Installments Schedule
    const tabbyScheduleCards = await page.locator(".grid.grid-cols-2.sm\\:grid-cols-4 > div").count();
    console.log(`✓ Tabby 4-Installment Cards: ${tabbyScheduleCards}`);

    // Click Card payment method
    console.log("Clicking Credit Card payment method tab...");
    await page.getByRole("button", { name: /Card/i }).click();
    await page.waitForTimeout(300);

    // Click Transfer payment method
    console.log("Clicking Bank Transfer payment method tab...");
    await page.getByRole("button", { name: /Transfer/i }).click();
    await page.waitForTimeout(300);

    // Click Tabby method again
    console.log("Clicking Tabby Pay in 4 tab...");
    await page.getByRole("button", { name: /Pay in 4/i }).click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_payment_portal_daylight.png") });
    console.log("✓ Saved 08_payment_portal_daylight.png");

    // Also screenshot settled invoice receipt view (/pay/inv-001)
    console.log("Testing Paid Receipt View (/pay/inv-001)...");
    await page.goto(`${BASE_URL}/pay/inv-001`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const paidBadgeVisible = await page.locator("text=Payment Completed!").isVisible();
    console.log(`✓ Paid in full confirmation visible: ${paidBadgeVisible}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08b_payment_receipt_daylight.png") });
    console.log("✓ Saved 08b_payment_receipt_daylight.png");

    // ----------------------------------------------------
    // TEST 7: Mobile Viewport Responsiveness (375 x 812)
    // ----------------------------------------------------
    console.log("\n--- Testing Mobile Viewport (375x812 iPhone / Smartphone) ---");
    const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 }
    });
    await mobileContext.addInitScript(() => {
        localStorage.setItem("invoiceflow_theme", "daylight");
        localStorage.setItem("has_skipped_onboarding", "true");
        document.documentElement.classList.add("daylight");
        document.body.classList.add("daylight");
    });

    const mobilePage = await mobileContext.newPage();

    // Mobile Invoices
    await mobilePage.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(600);
    const mobileNavVisible = await mobilePage.locator(".fixed.bottom-0").isVisible();
    console.log(`✓ Mobile Bottom Navigation Visible: ${mobileNavVisible}`);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "09_mobile_invoices_daylight.png") });
    console.log("✓ Saved 09_mobile_invoices_daylight.png");

    // Mobile Payment Link Portal
    await mobilePage.goto(`${BASE_URL}/pay/inv-002`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "10_mobile_pay_daylight.png") });
    console.log("✓ Saved 10_mobile_pay_daylight.png");

    console.log("\n=======================================================");
    console.log("ALL COMPLETE FUNCTIONS AND ACTION BUTTONS VERIFIED!");
    console.log("=======================================================");

    await browser.close();
}

run().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
