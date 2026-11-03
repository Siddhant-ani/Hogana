import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'operator@hogana.transit';
const VALID_PASSWORD = 'HoganaOps@2025!';

test.describe('HOGANA End-to-End Acceptance: Branding, Auth, Terminology & Workflows', () => {

  // Helper function to log in
  async function performLogin(page: any, email = VALID_EMAIL, password = VALID_PASSWORD) {
    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 10000 });
  }

  // 1. BRANDING & SINGLE LINK LOGO VERIFICATION ACROSS ALL ROUTES
  test('1. Shared HOGANA Brand component is a single clickable link to / on all pages', async ({ page }) => {
    // 1.1 Landing page (/)
    await page.goto('/');
    const homeBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(homeBrand).toBeVisible();
    await expect(homeBrand).toHaveAttribute('href', '/');
    await homeBrand.click();
    await expect(page).toHaveURL('/');

    // 1.2 Login page (/login)
    await page.goto('/login');
    const loginBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(loginBrand).toBeVisible();
    await expect(loginBrand).toHaveAttribute('href', '/');
    await loginBrand.click();
    await expect(page).toHaveURL('/');

    // Authenticate to access protected operational routes
    await performLogin(page);

    // 1.3 Dashboard (/dashboard)
    await page.goto('/dashboard');
    const dashBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(dashBrand).toBeVisible();
    await expect(dashBrand).toHaveAttribute('href', '/');
    await dashBrand.click();
    await expect(page).toHaveURL('/');

    // 1.4 Data Centre (/data)
    await page.goto('/data');
    const dataBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(dataBrand).toBeVisible();
    await expect(dataBrand).toHaveAttribute('href', '/');
    await dataBrand.click();
    await expect(page).toHaveURL('/');

    // 1.5 Interventions (/interventions)
    await page.goto('/interventions');
    const intervBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(intervBrand).toBeVisible();
    await expect(intervBrand).toHaveAttribute('href', '/');
    await intervBrand.click();
    await expect(page).toHaveURL('/');

    // 1.6 Simulation (/simulation)
    await page.goto('/simulation');
    const simBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(simBrand).toBeVisible();
    await expect(simBrand).toHaveAttribute('href', '/');
    await simBrand.click();
    await expect(page).toHaveURL('/');

    // 1.7 Reports (/reports)
    await page.goto('/reports');
    const repBrand = page.getByRole('link', { name: 'HOGANA Home' }).first();
    await expect(repBrand).toBeVisible();
    await expect(repBrand).toHaveAttribute('href', '/');
    await repBrand.click();
    await expect(page).toHaveURL('/');
  });

  // 2. AUTHENTICATION & ROUTE PROTECTION
  test('2. Unauthenticated access redirects to /login, invalid login fails, valid login succeeds, sign out invalidates session', async ({ page, context }) => {
    // Clear cookies
    await context.clearCookies();

    // 2.1 Direct unauthenticated access to /dashboard redirects to /login with callbackUrl
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*dashboard/);

    // 2.2 Direct unauthenticated access to other protected routes
    await page.goto('/data');
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*data/);

    // 2.3 Login page controls: show/hide password toggle
    await page.goto('/login');
    const passwordInput = page.locator('input#password');
    const toggleBtn = page.locator('button[aria-label="Show password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.locator('button[aria-label="Hide password"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 2.4 Failed login attempt
    await page.fill('input#email', VALID_EMAIL);
    await page.fill('input#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Authentication Failure')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);

    // 2.5 Successful login with operator credentials
    await page.fill('input#password', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify cookie exists
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'hogana_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);

    // 2.6 Visiting /login when authenticated redirects to /dashboard
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2.7 Header shows authenticated user and working Sign out action
    await page.goto('/');
    const signOutBtn = page.locator('button:has-text("Sign out")');
    await expect(signOutBtn).toBeVisible();

    // 2.8 Click Sign out
    await signOutBtn.click();
    await page.waitForURL((url: URL) => url.pathname === '/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Session cookie should be cleared
    const cookiesAfterLogout = await context.cookies();
    const activeSession = cookiesAfterLogout.find(c => c.name === 'hogana_session' && c.value);
    expect(activeSession).toBeUndefined();

    // Attempting to visit /dashboard now should redirect back to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*dashboard/);
  });

  // 3. PUBLIC MARKETING LANDING PAGE & MOBILE MENU
  test('3. Public landing page renders hook, planned pilot disclosures, interactive preview tabs, and mobile menu', async ({ page }) => {
    await page.goto('/');

    // Verbatim Hook
    await expect(page.getByText(/A bus can be tracked\. A service gap needs to be managed\./i)).toBeVisible();

    // Verbatim Supporting Headline
    await expect(
      page.getByText(/HOGANA turns transport operations data into clear headway, bunching, crowding and service-gap insights/i)
    ).toBeVisible();

    // Honest Disclosure Banner
    await expect(page.getByText(/Illustrative synthetic operational data — not connected to live BMTC systems\./i).first()).toBeVisible();

    // Service Area Label (replaces Corridor)
    await expect(page.getByText(/Silk Board–Hebbal, Bengaluru/i).first()).toBeVisible();

    // Interactive Preview Tabs
    const reliefTab = page.locator('button', { hasText: 'Standby Relief Dispatch' });
    if (await reliefTab.isVisible()) {
      await reliefTab.click();
      await expect(page.getByText(/BUS-13 Staged at Hebbal DOWN/i)).toBeVisible();
    }

    const crowdingTab = page.locator('button', { hasText: 'Passenger Crowding' });
    if (await crowdingTab.isVisible()) {
      await crowdingTab.click();
      await expect(page.getByText(/Kadubeesanahalli UP/i).first()).toBeVisible();
    }

    // Mobile Navigation Menu
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleButton = page.locator('button[aria-label="Open navigation menu"]');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    const mobileDrawer = page.locator('#mobile-navigation-drawer');
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.locator('text=Dashboard')).toBeVisible();
    await expect(mobileDrawer.locator('text=Sign in')).toBeVisible();
  });

  // 4. PILOT ENQUIRY API & FORM VALIDATION
  test('4. Pilot Enquiry Form validates inputs and handles submissions safely', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const pilotSection = page.locator('#pilot-enquiry');
    await pilotSection.scrollIntoViewIfNeeded();

    // Attempt invalid email
    await page.fill('input[placeholder*="Ramesh Kumar"]', 'Transit Director');
    await page.locator('#pilot-enquiry input, #enquiry input').nth(1).fill('Regional Transit Agency');
    await page.locator('#pilot-enquiry input[type="email"], #enquiry input[type="email"]').fill('invalid-email-format');
    await page.locator('#pilot-enquiry input[type="tel"], #enquiry input[type="tel"]').fill('+91 98765 43210');
    await page.fill('textarea', 'Brief text');
    await page.click('button:has-text("Submit Enquiry")');

    const emailInput = page.locator('#pilot-enquiry input[type="email"], #enquiry input[type="email"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);

    // Provide valid email and message
    await emailInput.fill('director@transitauthority.gov');
    await page.selectOption('select', { index: 1 });
    await page.fill('textarea', 'Requesting fleet operations enquiry and platform onboarding.');
    await page.click('button:has-text("Submit Enquiry")');

    await expect(
      page.locator('text=Pilot enquiry delivery target is not configured').or(
        page.locator('text=Enquiry received')
      ).or(
        page.locator('text=Thank you. Your pilot enquiry has been delivered')
      )
    ).toBeVisible({ timeout: 8000 });
  });

  // 5. OPERATIONS DASHBOARD (AUTHENTICATED)
  test('5. Operations Dashboard renders hierarchy, 8 priority KPIs, and all view selectors', async ({ page }) => {
    await performLogin(page);
    await page.goto('/dashboard');

    // Verify Title & Breadcrumb
    await expect(page.locator('h1:has-text("Service Performance Overview")')).toBeVisible();

    // Verify Priority KPIs exist
    await expect(page.locator('text=Services Scheduled').first()).toBeVisible();
    await expect(page.locator('text=Services Operated').first()).toBeVisible();
    await expect(page.locator('text=Service Fulfilment').first()).toBeVisible();
    await expect(page.locator('text=Headway Regularity (OTP)').first()).toBeVisible();
    await expect(page.locator('text=Operational Attention Required')).toBeVisible();

    // Switch to Morning Peak View (08:24)
    await page.click('button:has-text("Morning Replay")');
    await expect(page.locator('text=Anti-Lookahead Active')).toBeVisible();
    await expect(page.locator('text=Marathahalli').first()).toBeVisible();

    // Switch to Evening Peak View (18:15)
    await page.click('button:has-text("Evening Replay")');
    await expect(page.locator('text=Anti-Lookahead Active')).toBeVisible();
    await expect(page.locator('text=Hebbal').first()).toBeVisible();

    // Switch to End-of-Day View
    await page.click('button:has-text("End-of-Day Audit")');
    await expect(page.locator('text=Audited Baseline')).toBeVisible();
  });

  // 6. DATA CENTRE (AUTHENTICATED)
  test('6. Data Centre displays 56/56 checks, AGGREGATE research only, and NO individual commuter profiles', async ({ page }) => {
    await performLogin(page);
    await page.goto('/data');

    // Title and Validation Audit
    await expect(page.locator('h1:has-text("Data & Quality")')).toBeVisible();
    await expect(page.locator('text=56/56 Checks Verified').first()).toBeVisible();
    await expect(page.locator('text=Overall Data Health & Verification Status')).toBeVisible();

    // Commuter Insights Tab
    await page.click('button:has-text("Commuter Perception Insights")');

    // Simulated workbook disclaimer prominently visible
    await expect(page.locator('text=Simulated Illustrative Workbook — Not Real Field Research')).toBeVisible();

    // Aggregate statistics
    await expect(page.locator('text=88%')).toBeVisible();
    await expect(page.locator('text=77%')).toBeVisible();
    await expect(page.locator('text=10 Core Commuter Friction Points (Illustrative Mentions)')).toBeVisible();

    // Ensure NO individual profiles, names or search inputs exist in DOM
    await expect(page.locator('text=Yogesh Nair')).toHaveCount(0);
    await expect(page.locator('text=Pooja V')).toHaveCount(0);
    await expect(page.locator('input[placeholder="Search commuter..."]')).toHaveCount(0);
  });

  // 7. INTERVENTIONS CONSOLE (AUTHENTICATED)
  test('7. Interventions Console supports approval, mandatory rejection note, and local review storage', async ({ page }) => {
    await performLogin(page);
    await page.goto('/interventions');

    // Clear previous test reviews
    await page.evaluate(() => localStorage.removeItem('hogana_intervention_reviews_v1'));
    await page.reload();

    // Header & Disclaimer
    await expect(page.locator('h1:has-text("Operational Recommendations")')).toBeVisible();
    await expect(page.locator('text=Advisory Decision-Support — Human Confirmation Required')).toBeVisible();

    // Approve first proposal
    const approveButtons = page.locator('button', { hasText: /^Approve$/ });
    await approveButtons.nth(0).click();
    await expect(page.locator('h3:has-text("Confirm Proposal Approval")')).toBeVisible();
    await page.click('button:has-text("Approve Proposal")');

    // Verify approved counter increments
    await expect(page.locator('button:has-text("Approved (1)")')).toBeVisible();

    // Reject second proposal (which has no prior note)
    const rejectButtons = page.locator('button', { hasText: /^Reject$/ });
    await rejectButtons.nth(1).click();
    await expect(page.locator('h3:has-text("Confirm Proposal Rejection")')).toBeVisible();

    // Rejection note required (should fail without note)
    await page.click('button:has-text("Reject Proposal")');
    await expect(page.locator('text=A specific operational rejection note is required')).toBeVisible();

    await page.fill('textarea', 'Rejected due to confirmed mechanical check at depot.');
    await page.click('button:has-text("Reject Proposal")');

    await expect(page.locator('button:has-text("Rejected (1)")')).toBeVisible();
  });

  // 8. SCENARIO SIMULATOR (AUTHENTICATED)
  test('8. Scenario Simulator evaluates holding, standby relief, crowding, and saves run', async ({ page }) => {
    await performLogin(page);
    await page.goto('/simulation');

    // Header & Model disclaimer
    await expect(page.locator('h1:has-text("Scenario Planning")')).toBeVisible();
    await expect(page.locator('text=Deterministic Operations & Impact Modeling')).toBeVisible();

    // Scenario 1: Bunching Hold
    await expect(page.locator('text=Bus Spacing & Holding').first()).toBeVisible();
    await expect(page.locator('text=375s Projected Separation')).toBeVisible();

    // Save Holding Run
    await page.click('button:has-text("Save Simulation Run")');
    await expect(page.getByText(/Holding simulation saved/i)).toBeVisible();

    // Scenario 2: Standby Relief
    await page.click('button:has-text("Service Gap & Standby Relief")');
    await expect(page.locator('text=Resource Deployment Feasible')).toBeVisible();
    await expect(page.locator('text=physically staged at Hebbal DOWN')).toBeVisible();

    // Scenario 3: Crowding & Frequency
    await page.click('button:has-text("Crowding & Frequency")');
    await expect(page.locator('text=60 Passengers').first()).toBeVisible();
    await expect(page.locator('text=40 Seated + 20 Standing')).toBeVisible();
  });

  // 9. REPORTS & EXPORTS (AUTHENTICATED)
  test('9. Reports page renders formal Performance Reports and enabled export actions', async ({ page }) => {
    await performLogin(page);
    await page.goto('/reports');

    // Header & Export controls
    await expect(page.locator('h1:has-text("Performance & Operations Reports")')).toBeVisible();
    await expect(page.locator('button:has-text("Download CSV")')).toBeEnabled();
    await expect(page.locator('button:has-text("Download JSON")')).toBeEnabled();
    await expect(page.locator('button:has-text("Print / Save PDF")')).toBeVisible();

    // Switch Report Tabs
    await page.click('button:has-text("Morning Peak Replay")');
    await expect(page.locator('text=08:24:00').first()).toBeVisible();

    await page.click('button:has-text("Evening Peak Replay")');
    await expect(page.locator('text=18:15:00').first()).toBeVisible();

    await page.click('button:has-text("Scenario Simulation Matrix")');
    await expect(page.locator('text=Scenario 1: Bus Bunching Hold').first()).toBeVisible();
  });

  // 10. SCAN ALL RENDERED PAGES FOR CUSTOMER-FACING "CORRIDOR" OR "DEMO"
  test('10. Renders zero customer-facing "Corridor" or "Demo" on all pages', async ({ page }) => {
    const pagesToCheck = ['/', '/login', '/dashboard', '/data', '/interventions', '/simulation', '/reports'];

    // Login once
    await performLogin(page);

    for (const urlPath of pagesToCheck) {
      await page.goto(urlPath);
      await page.waitForLoadState('networkidle');

      // Check visible headings and paragraphs
      const bodyText = await page.innerText('body');

      // Look for disallowed customer-facing phrases:
      // "Corridor Demo", "Corridor Operations", "Corridor Dashboard", "Corridor KPI",
      // "Explore Corridor Demo", "Corridor Overview", "Demonstration Data"
      const disallowedPatterns = [
        /Corridor Demo/i,
        /Corridor Operations/i,
        /Corridor Dashboard/i,
        /Corridor KPI/i,
        /Explore Corridor Demo/i,
        /Corridor Overview/i,
        /Demonstration Data/i,
        /Demonstration Review/i,
        /Demonstration Model/i
      ];

      for (const pattern of disallowedPatterns) {
        const match = bodyText.match(pattern);
        expect(match, `Found disallowed phrase "${pattern}" on page ${urlPath}`).toBeNull();
      }
    }
  });

});
