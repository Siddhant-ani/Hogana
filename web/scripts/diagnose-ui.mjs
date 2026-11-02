import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const routes = [
  { path: '/', name: 'landing' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/data', name: 'data_centre' },
  { path: '/interventions', name: 'interventions' },
  { path: '/simulation', name: 'simulation' },
  { path: '/reports', name: 'reports' }
];

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 667 }
];

const outputDir = path.resolve('scratch', 'screenshots');
fs.mkdirSync(outputDir, { recursive: true });

async function runDiagnosis() {
  console.log('--- STARTING HOGANA UI DIAGNOSIS ---');
  const browser = await chromium.launch();
  let totalIssues = 0;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.name === 'mobile' 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        : undefined
    });

    const page = await context.newPage();

    for (const route of routes) {
      console.log(`\nInspecting route: ${route.path} [${vp.name}]...`);
      const consoleErrors = [];
      const consoleWarnings = [];
      const pageErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (msg.type() === 'warning') consoleWarnings.push(msg.text());
      });

      page.on('pageerror', error => {
        pageErrors.push(error.message || String(error));
      });

      page.on('requestfailed', req => {
        failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
      });

      try {
        const response = await page.goto(`http://127.0.0.1:3000${route.path}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        const status = response ? response.status() : 'NO_RESPONSE';
        console.log(`  -> HTTP Status: ${status}`);

        if (status !== 200) {
          console.error(`  [ISSUE] Non-200 HTTP response: ${status}`);
          totalIssues++;
        }

        // Wait a small moment for hydration
        await page.waitForTimeout(500);

        // Check page title and visible text
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n+/g, ' '));
        console.log(`  -> Title: "${title}"`);
        console.log(`  -> Text preview: "${bodyText}..."`);

        // Check if root redirect happened
        const currentUrl = page.url();
        console.log(`  -> Final URL: ${currentUrl}`);
        if (route.path === '/' && currentUrl.includes('/dashboard')) {
          console.error(`  [ISSUE] Route '/' unexpectedly redirected to: ${currentUrl}`);
          totalIssues++;
        }

        // Check errors
        if (pageErrors.length > 0) {
          console.error(`  [ISSUE] Page runtime errors (${pageErrors.length}):`);
          pageErrors.forEach(err => console.error(`    - ${err}`));
          totalIssues += pageErrors.length;
        }

        if (consoleErrors.length > 0) {
          console.error(`  [ISSUE] Console errors (${consoleErrors.length}):`);
          consoleErrors.forEach(err => console.error(`    - ${err}`));
          totalIssues += consoleErrors.length;
        }

        if (failedRequests.length > 0) {
          console.error(`  [ISSUE] Failed network requests (${failedRequests.length}):`);
          failedRequests.forEach(req => console.error(`    - ${req}`));
          totalIssues += failedRequests.length;
        }

        if (pageErrors.length === 0 && consoleErrors.length === 0 && status === 200) {
          console.log(`  ✓ Route ${route.path} rendered with 0 runtime/console errors`);
        }

        // Save screenshot
        const screenshotPath = path.join(outputDir, `${route.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  -> Screenshot saved to: ${screenshotPath}`);

      } catch (err) {
        console.error(`  [FATAL] Error visiting ${route.path}:`, err.message);
        totalIssues++;
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`DIAGNOSIS COMPLETE: ${totalIssues} TOTAL ISSUES FOUND`);
  console.log(`========================================`);
  process.exit(totalIssues > 0 ? 1 : 0);
}

runDiagnosis().catch(err => {
  console.error('Diagnostic harness failed:', err);
  process.exit(1);
});
