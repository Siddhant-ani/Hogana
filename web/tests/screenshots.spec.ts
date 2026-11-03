import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const VALID_EMAIL = 'operator@hogana.transit';
const VALID_PASSWORD = 'HoganaOps@2025!';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test('Capture Desktop and Mobile Screenshots for all 7 routes', async ({ browser }) => {
  // 1. Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  // 1.1 Landing page
  await desktopPage.goto('http://127.0.0.1:3000/');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-desktop.png'), fullPage: true });

  // 1.2 Login page
  await desktopPage.goto('http://127.0.0.1:3000/login');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-desktop.png') });

  // Login
  await desktopPage.fill('input#email', VALID_EMAIL);
  await desktopPage.fill('input#password', VALID_PASSWORD);
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForURL('**/dashboard', { timeout: 10000 });
  await desktopPage.waitForLoadState('networkidle');

  // 1.3 Dashboard / Overview
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard-overview-desktop.png'), fullPage: true });

  // 1.4 Data & Quality
  await desktopPage.goto('http://127.0.0.1:3000/data');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04-data-quality-desktop.png'), fullPage: true });

  // 1.5 Recommendations / Interventions
  await desktopPage.goto('http://127.0.0.1:3000/interventions');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05-recommendations-desktop.png'), fullPage: true });

  // 1.6 Scenario Planning / Simulation
  await desktopPage.goto('http://127.0.0.1:3000/simulation');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '06-scenario-planning-desktop.png'), fullPage: true });

  // 1.7 Reports
  await desktopPage.goto('http://127.0.0.1:3000/reports');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '07-reports-desktop.png'), fullPage: true });

  await desktopContext.close();

  // 2. Mobile Context (iPhone 14 / modern mobile 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // 2.1 Mobile Landing
  await mobilePage.goto('http://127.0.0.1:3000/');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-mobile.png') });

  // 2.2 Mobile Login
  await mobilePage.goto('http://127.0.0.1:3000/login');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-mobile.png') });

  // Mobile Login
  await mobilePage.fill('input#email', VALID_EMAIL);
  await mobilePage.fill('input#password', VALID_PASSWORD);
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard', { timeout: 10000 });
  await mobilePage.waitForLoadState('networkidle');

  // 2.3 Mobile Overview
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard-overview-mobile.png') });

  // 2.4 Mobile Data & Quality
  await mobilePage.goto('http://127.0.0.1:3000/data');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '04-data-quality-mobile.png') });

  // 2.5 Mobile Recommendations
  await mobilePage.goto('http://127.0.0.1:3000/interventions');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '05-recommendations-mobile.png') });

  // 2.6 Mobile Scenario Planning
  await mobilePage.goto('http://127.0.0.1:3000/simulation');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '06-scenario-planning-mobile.png') });

  // 2.7 Mobile Reports
  await mobilePage.goto('http://127.0.0.1:3000/reports');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '07-reports-mobile.png') });

  await mobileContext.close();
});
