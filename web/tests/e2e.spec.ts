import { test, expect } from '@playwright/test';

test.describe('HOGANA End-to-End Application Verification', () => {

  test('1. Public Marketing Landing Page renders hook, headline and interactive tabs', async ({ page }) => {
    await page.goto('/');
    
    // Verbatim Hook from Prompt
    await expect(page.locator('text=A bus can be tracked. A service gap needs to be managed.')).toBeVisible();

    // Verbatim Supporting Headline from Prompt
    await expect(
      page.locator('text=HOGANA turns transport operations data into clear headway, bunching, crowding and service-gap insights')
    ).toBeVisible();

    // Corridor context
    await expect(page.locator('text=Silk Board ↔ Hebbal Corridor').first()).toBeVisible();

    // Switch Interactive Preview Tabs
    const reliefTab = page.locator('button', { hasText: 'Standby Relief Dispatch' });
    if (await reliefTab.isVisible()) {
      await reliefTab.click();
      await expect(page.locator('text=BUS-13 Staged at Hebbal DOWN')).toBeVisible();
    }

    const crowdingTab = page.locator('button', { hasText: 'Passenger Crowding' });
    if (await crowdingTab.isVisible()) {
      await crowdingTab.click();
      await expect(page.locator('text=Kadubeesanahalli UP')).toBeVisible();
    }
  });

  test('2. Pilot Enquiry Form submits with honest feedback', async ({ page }) => {
    await page.goto('/');

    // Scroll to pilot enquiry form
    const pilotSection = page.locator('#pilot-enquiry');
    await pilotSection.scrollIntoViewIfNeeded();

    await page.fill('input[placeholder*="Ramesh Kumar"]', 'Director S. Rao');
    await page.fill('input[placeholder*="BMTC"]', 'Bangalore Mobility Operations');
    await page.fill('input[placeholder*="name@agency"]', 's.rao@bengalurutransport.org');
    await page.selectOption('select', { index: 1 }); // "1 – 50 buses (Corridor trial)"
    await page.fill('textarea', 'Interested in evaluating headway regularity and bunching holding on the ORR corridor.');

    await page.click('button:has-text("Submit Pilot Enquiry")');

    // Verify submission feedback message from server route
    await expect(
      page.locator('text=Enquiry received')
    ).toBeVisible();
  });

  test('3. Operations Dashboard renders hierarchy, 4 priority KPIs, and view switching', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify Header
    await expect(page.locator('h1:has-text("Corridor Operations Dashboard")')).toBeVisible();

    // Verify 4 Priority KPIs exist
    await expect(page.locator('text=Operated Trips & Fulfilment')).toBeVisible();
    await expect(page.locator('text=On-Time Performance (OTP)').first()).toBeVisible();
    await expect(page.locator('text=Bus Bunching Alert')).toBeVisible();
    await expect(page.locator('text=Peak Occupancy & Crowding')).toBeVisible();

    // Switch to Morning Peak View (08:24)
    await page.click('button:has-text("Morning Replay")');
    await expect(page.locator('text=Anti-Lookahead Active')).toBeVisible();
    await expect(page.locator('text=Marathahalli').first()).toBeVisible();

    // Switch to Evening Peak View (18:15)
    await page.click('button:has-text("Evening Replay")');
    await expect(page.locator('text=Anti-Lookahead Active')).toBeVisible();
    await expect(page.locator('text=Hebbal Flyover (DOWN)').first()).toBeVisible();
    await expect(page.locator('text=1440s Gap').first()).toBeVisible();

    // Switch to End-of-Day View
    await page.click('button:has-text("End-of-Day Audit")');
    await expect(page.locator('text=Audited Baseline')).toBeVisible();
  });

  test('4. Data Centre displays 56/56 checks, Commuter Insights research tab, and CSV browser', async ({ page }) => {
    await page.goto('/data');

    // Validation Audit Tab
    await expect(page.locator('text=56/56 Checks Verified').first()).toBeVisible();
    await expect(page.locator('text=Step 1 Operational Dataset Validation Report')).toBeVisible();

    // Commuter Insights Tab
    await page.click('button:has-text("Commuter Insights — Illustrative Case Study")');
    await expect(page.locator('text=Illustrative Commuter Research Case Study')).toBeVisible();
    await expect(page.locator('text=88%')).toBeVisible(); // 88% peak commute
    await expect(page.locator('text=77%')).toBeVisible(); // 77% rarely/never vacant seat
    await expect(page.locator('text=10 Core Commuter Pain Points')).toBeVisible();
    await expect(page.locator('text=Overcrowding / no standing room').first()).toBeVisible();

    // Search within 100 commuter profiles
    const commuterSearch = page.locator('input[placeholder="Search commuter..."]');
    await commuterSearch.fill('Yogesh');
    await expect(page.locator('td:has-text("Yogesh Nair")')).toBeVisible();

    // Operational CSV Tab
    await page.click('button:has-text("vehicles.csv")');
    await expect(page.locator('h2:has-text("vehicles.csv")')).toBeVisible();
    await expect(page.locator('td:has-text("BUS-01")').first()).toBeVisible();

    // JSON Assumptions Tab
    await page.click('button:has-text("demo_assumptions.json")');
    await expect(page.locator('button:has-text("Copy JSON")')).toBeVisible();
  });

  test('5. Interventions allows approval and enforces mandatory rejection note', async ({ page }) => {
    await page.goto('/interventions');

    // Clear any previous local test decisions
    await page.evaluate(() => localStorage.removeItem('hogana_intervention_reviews_v1'));
    await page.reload();

    // Header & Disclaimer
    await expect(page.locator('h1:has-text("Corridor Operational Interventions & Human Review")')).toBeVisible();
    await expect(page.locator('text=Demonstration Review Storage')).toBeVisible();

    // Find the proposal action Reject button (not the filter tab button)
    const cardRejectBtn = page.locator('button', { hasText: /^Reject$/ }).first();
    await cardRejectBtn.click();

    // Confirm dialog should appear
    await expect(page.locator('h3:has-text("Confirm Proposal Rejection")')).toBeVisible();

    // Attempt confirming without review note (should be blocked)
    await page.click('button:has-text("Reject Proposal")');
    await expect(page.locator('text=A specific operational rejection note is required')).toBeVisible();

    // Fill review note and confirm
    await page.fill('textarea', 'Rejected due to confirmed mechanical check at depot.');
    await page.click('button:has-text("Reject Proposal")');

    // Verify rejection filter counter increments and button disables
    await expect(page.locator('button:has-text("Rejected (1)")')).toBeVisible();
    await expect(page.locator('button:has-text("Review History (1)")')).toBeVisible();

    // Check Review History drawer
    await page.click('button:has-text("Review History")');
    await expect(page.locator('h3:has-text("Local Review History")')).toBeVisible();
    await expect(page.locator('text=Rejected due to confirmed mechanical check at depot.').first()).toBeVisible();
    await page.click('button:has-text("Close History")');
  });

  test('6. Scenario Simulator evaluates deterministic holding and relief feasibility', async ({ page }) => {
    await page.goto('/simulation');

    // Header & Disclaimer
    await expect(page.locator('h1:has-text("Operational Intervention Sandbox & Impact Analysis")')).toBeVisible();
    await expect(page.locator('text=Deterministic Demonstration Model')).toBeVisible();

    // Scenario 1: Bunching Hold
    await expect(page.locator('h2:has-text("Scenario 1: Bus Bunching & Dispatcher Hold Simulation")')).toBeVisible();
    await expect(page.locator('text=375s Projected Separation')).toBeVisible();

    // Save Holding Run
    await page.click('button:has-text("Save Simulation Run")');
    await expect(page.locator('text=Holding simulation saved to demonstration history')).toBeVisible();

    // Switch to Scenario 2: Standby Relief
    await page.click('button:has-text("Scenario 2: Service Gap Relief")');
    await expect(page.locator('text=Resource Deployment Feasible')).toBeVisible();
    await expect(page.locator('text=physically staged at Hebbal DOWN')).toBeVisible();

    // Switch to Scenario 3: Crowding
    await page.click('button:has-text("Scenario 3: Crowding & Frequency")');
    await expect(page.locator('text=60 Passengers').first()).toBeVisible();
    await expect(page.locator('text=40 Seated + 20 Standing')).toBeVisible();
    await expect(page.locator('text=92 passengers on board')).toBeVisible();
    await expect(page.locator('text=153.3%')).toBeVisible();
  });

  test('7. Reports page renders formal Performance Reports and export actions', async ({ page }) => {
    await page.goto('/reports');

    // Header & Export controls
    await expect(page.locator('h1:has-text("Corridor Operations Performance Reports")')).toBeVisible();
    await expect(page.locator('button:has-text("Download CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Download JSON")')).toBeVisible();
    await expect(page.locator('button:has-text("Print / Save PDF")')).toBeVisible();

    // Switch Report Tabs
    await page.click('button:has-text("Morning Peak Replay")');
    await expect(page.locator('text=08:24:00').first()).toBeVisible();

    await page.click('button:has-text("Evening Peak Replay")');
    await expect(page.locator('text=18:15:00').first()).toBeVisible();

    await page.click('button:has-text("Scenario Simulation Matrix")');
    await expect(page.locator('text=Scenario 1: Bus Bunching Hold').first()).toBeVisible();
    await expect(page.locator('text=Scenario 2: Large Gap Relief').first()).toBeVisible();
  });

});
