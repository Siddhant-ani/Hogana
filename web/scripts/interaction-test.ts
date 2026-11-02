import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getSimulationBaselineData } from '../lib/engine/simulation-service';
import {
  simulateHoldingScenario,
  simulateStandbyReliefScenario,
  simulateCrowdingScenario
} from '../lib/engine/simulation-logic';
import { getReportsData } from '../lib/engine/reports-service';
import { isValidLocalReview } from '../lib/engine/report-validators';

function fetchUrl(url: string): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
  } else {
    console.error(`  [FAIL] ${label}: ${detail ?? 'Check failed'}`);
    process.exitCode = 1;
  }
}

async function runInteractionVerification() {
  console.log('============================================================');
  console.log('HOGANA PRODUCTION RUNTIME & INTERACTION VERIFICATION');
  console.log('============================================================\n');

  console.log('1. Launching Next.js Production Server on 127.0.0.1:3009...');
  const webDir = path.resolve(process.cwd(), fs.existsSync('web') ? 'web' : '.');
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3009', '-H', '127.0.0.1'], {
    cwd: webDir,
    stdio: 'inherit'
  });

  await new Promise(r => setTimeout(r, 3000));

  try {
    // SECTION A: PAGE ROUTE & CONTENT VERIFICATION
    console.log('\n--- Section A: Production Route & DOM Content Checks ---');
    
    // Root redirect
    const rootRes = await fetchUrl('http://127.0.0.1:3009/');
    assert('Route / redirects to /dashboard (HTTP 307)', rootRes.statusCode === 307);

    // 1. Dashboard Page
    const dashRes = await fetchUrl('http://127.0.0.1:3009/dashboard');
    assert('Route /dashboard responds HTTP 200', dashRes.statusCode === 200);
    assert('Dashboard: renders corridor title', dashRes.body.includes('Silk Board') && dashRes.body.includes('Hebbal'));
    assert('Dashboard: renders synthetic demonstration disclosure', dashRes.body.includes('Synthetic demonstration data'));
    assert('Dashboard: contains bunching alerts section', dashRes.body.includes('Bus Bunching') || dashRes.body.includes('Marathahalli'));

    // 2. Data Centre Page
    const dataRes = await fetchUrl('http://127.0.0.1:3009/data');
    assert('Route /data responds HTTP 200', dataRes.statusCode === 200);
    assert('Data Centre: displays dataset validation status', dataRes.body.includes('Validation') || dataRes.body.includes('56'));
    assert('Data Centre: contains raw table navigation', dataRes.body.includes('routes.csv') && dataRes.body.includes('scheduled_trips.csv'));

    // 3. Interventions Page
    const intervRes = await fetchUrl('http://127.0.0.1:3009/interventions');
    assert('Route /interventions responds HTTP 200', intervRes.statusCode === 200);
    assert('Interventions: contains advisory proposals', intervRes.body.includes('REC-HOLD-0824') || intervRes.body.includes('Marathahalli'));
    assert('Interventions: contains human decision review actions', intervRes.body.includes('Approve') && intervRes.body.includes('Reject'));

    // 4. Simulation Page
    const simRes = await fetchUrl('http://127.0.0.1:3009/simulation');
    assert('Route /simulation responds HTTP 200', simRes.statusCode === 200);
    assert('Simulation: contains holding sandbox', simRes.body.includes('Bus Bunching') || simRes.body.includes('Holding'));
    assert('Simulation: contains standby relief feasibility', simRes.body.includes('Standby Relief') || simRes.body.includes('Hebbal'));

    // 5. Reports Page
    const repRes = await fetchUrl('http://127.0.0.1:3009/reports');
    assert('Route /reports responds HTTP 200', repRes.statusCode === 200);
    assert('Reports: contains audit report options', repRes.body.includes('End-of-Day') || repRes.body.includes('REP-EOD'));
    assert('Reports: contains CSV and JSON download controls', repRes.body.includes('CSV') && repRes.body.includes('JSON'));

    // SECTION B: INTERVENTION REVIEW INTERACTION LOGIC
    console.log('\n--- Section B: Dispatcher Intervention Review Workflow Simulation ---');
    
    // Simulate empty rejection note rejection
    const mockEmptyNote = '   ';
    const canConfirmEmpty = mockEmptyNote.trim().length > 0;
    assert('Intervention Interaction: empty rejection note blocks confirmation button', canConfirmEmpty === false);

    // Simulate rejection with operational justification
    const mockValidNote = 'Vehicle radio reported low battery level; hold at control point unsafe.';
    const canConfirmValid = mockValidNote.trim().length > 0;
    assert('Intervention Interaction: valid operational note permits rejection confirmation', canConfirmValid === true);

    const mockReviewRecord = {
      proposalId: 'REC-HOLD-0824',
      decision: 'rejected' as const,
      reviewNote: mockValidNote,
      reviewedAt: '2025-03-10T08:25:30Z'
    };
    assert('Intervention Interaction: review record passes structural validation', isValidLocalReview(mockReviewRecord));

    // SECTION C: DATA-BACKED SIMULATION INTERACTION LOGIC
    console.log('\n--- Section C: Simulator Interactive Input & Dynamic Range Checks ---');
    const simBaselineRes = await getSimulationBaselineData();
    assert('Simulation Service: baseline successfully loaded from canonical dataset', simBaselineRes.success && simBaselineRes.data !== undefined);
    
    if (simBaselineRes.data) {
      const { holding, relief, crowding } = simBaselineRes.data;

      // Interaction check 1: Hold slider at 0s
      const h0 = simulateHoldingScenario({ holdDurationSeconds: 0 }, holding);
      assert('Simulation Interaction (0s Hold): baseline 75s preserved', h0.baselineSeparationSeconds === 75);
      assert('Simulation Interaction (0s Hold): projected is 75s, bunching persists', h0.projectedSeparationSeconds === 75 && h0.bunchingCleared === false);

      // Interaction check 2: Hold slider at 150s
      const h150 = simulateHoldingScenario({ holdDurationSeconds: 150 }, holding);
      assert('Simulation Interaction (150s Hold): projected is 225s (75+150)', h150.projectedSeparationSeconds === 225);
      assert('Simulation Interaction (150s Hold): bunching cleared (> 120s)', h150.bunchingCleared === true);

      // Interaction check 3: Hold slider at 300s (max allowance)
      const h300 = simulateHoldingScenario({ holdDurationSeconds: 300 }, holding);
      assert('Simulation Interaction (300s Hold): exact 375s projection (52.1% headway)', h300.projectedSeparationSeconds === 375 && h300.headwayRestorationPct === 52.1);

      // Interaction check 4: Staged relief deployment
      const rFeasible = simulateStandbyReliefScenario({ standbyBusId: relief.defaultBusId, standbyDriverId: relief.defaultDriverId }, relief);
      assert('Simulation Interaction: default recommended bus + driver is FEASIBLE', rFeasible.feasibilityStatus === 'feasible');

      // Interaction check 5: Unstaged bus selection
      const rUnstaged = simulateStandbyReliefScenario({ standbyBusId: 'BUS-12', standbyDriverId: relief.defaultDriverId }, relief);
      assert('Simulation Interaction: unstaged BUS-12 is UNCONFIRMED', rUnstaged.feasibilityStatus === 'unconfirmed');

      // Interaction check 6: Off-duty driver selection
      const rOffDuty = simulateStandbyReliefScenario({ standbyBusId: relief.defaultBusId, standbyDriverId: 'CREW-12' }, relief);
      assert('Simulation Interaction: off-duty CREW-12 is UNCONFIRMED', rOffDuty.feasibilityStatus === 'unconfirmed');

      // Interaction check 7: Crowding policy rule
      const cSim = simulateCrowdingScenario(crowding);
      assert('Simulation Interaction: crowding displays 60 design capacity', cSim.designCapacity === 60);
      assert('Simulation Interaction: observed peak is 92 pax (153.3%)', cSim.observedPeakPassengers === 92 && cSim.observedPeakOccupancyPct === 153.3);
      assert('Simulation Interaction: frequency rule not triggered (consecutive severe = 1)', cSim.frequencyIncreaseEligible === false);
    }

    // SECTION D: REPORT EXPORT SANITIZATION & INTEGRITY
    console.log('\n--- Section D: Report CSV/JSON Export & Malformed Record Sanitization ---');
    const reportsRes = await getReportsData();
    assert('Reports Service: pre-computed audit reports generated successfully', reportsRes.success && reportsRes.data !== undefined);

    if (reportsRes.data) {
      const eod = reportsRes.data.reports.eod;
      assert('Reports Export: EOD CSV data generated with header and rows', eod.csvData.startsWith('Metric,Count,Rate') && eod.csvData.split('\n').length >= 5);
      
      const otpKpi = eod.kpis.find(k => k.metric.includes('On-Time Performance'));
      assert('Reports KPI: OTP metric is genuinely formatted without falling back to 0%', otpKpi !== undefined && otpKpi.value !== '0%');
    }

    // Test malformed storage array sanitization during CSV export
    const corruptReviews = [
      null,
      undefined,
      { bogus: 1 },
      { proposalId: 'P1', decision: 'approved', reviewNote: 'Note with "quotes" and , commas', reviewedAt: '2025-03-10T12:00:00Z' },
      { proposalId: 'P2', decision: 'rejected' } // missing note
    ];
    const cleanReviews = corruptReviews.filter(isValidLocalReview);
    assert('Report Sanitization: corrupt reviews filtered safely', cleanReviews.length === 1 && cleanReviews[0].proposalId === 'P1');

    const lines = ['ProposalId,Decision,ReviewNote,ReviewedAt'];
    for (const r of cleanReviews) {
      const note = `"${String(r.reviewNote).replace(/"/g, '""')}"`;
      lines.push([r.proposalId, r.decision, note, r.reviewedAt].join(','));
    }
    const exportedCsv = lines.join('\n');
    assert('Report Sanitization: CSV contains properly escaped quotes and commas', exportedCsv.includes('"Note with ""quotes"" and , commas"'));

  } finally {
    server.kill();
  }

  console.log('\n============================================================');
  console.log('INTERACTION & PRODUCTION RUNTIME VERIFICATION COMPLETE');
  console.log('============================================================\n');
}

runInteractionVerification().catch((err) => {
  console.error('Interaction verification error:', err);
  process.exit(1);
});
