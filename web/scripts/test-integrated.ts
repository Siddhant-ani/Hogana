/**
 * HOGANA — Steps 4, 5 & 6: Integrated Release Verification Suite
 * 
 * Verifies:
 * 1. Dispatcher Intervention Workflow Service & Recommendation Integrity
 * 2. Deterministic Scenario Simulator Logic (Holding, Standby Relief, Crowding)
 * 3. Operational Reports Service (EOD, Morning, Evening, Simulation, CSV/JSON)
 * 4. Human Review & Local Demonstration Invariants
 */

import { getInterventionsData } from '../lib/engine/interventions-service';
import {
  simulateHoldingScenario,
  simulateStandbyReliefScenario,
  simulateCrowdingScenario
} from '../lib/engine/simulation-logic';
import { getSimulationBaselineData } from '../lib/engine/simulation-service';
import { getReportsData } from '../lib/engine/reports-service';
import { isValidLocalReview, isValidLocalSimRun } from '../lib/engine/report-validators';
import { getCommuterResearchData } from '../lib/research/commuter-research-service';

async function verifyIntegratedRelease() {
  console.log('============================================================');
  console.log('HOGANA STEPS 4, 5 & 6: INTEGRATED RELEASE VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}: ${message ?? 'Assertion failed'}`);
      failed++;
    }
  }

  // --- 1. INTERVENTIONS WORKFLOW TESTS ---
  console.log('=== TEST SUITE 1: DISPATCHER INTERVENTION RECOMMENDATIONS ===');
  const interventionsRes = await getInterventionsData();
  assert('Interventions: service succeeds', interventionsRes.success && interventionsRes.data !== undefined);

  if (interventionsRes.data) {
    const proposals = interventionsRes.data.proposals;
    assert('Interventions: aggregates 3 advisory proposals', proposals.length === 3);

    // Proposal 1: Morning Bunching Hold
    const holdProp = proposals.find((p) => p.id === 'REC-HOLD-0824');
    assert('Interventions: REC-HOLD-0824 proposal exists', holdProp !== undefined);
    if (holdProp) {
      assert('REC-HOLD-0824: category is bunching_holding', holdProp.category === 'bunching_holding');
      assert('REC-HOLD-0824: priority is high', holdProp.priority === 'high');
      assert('REC-HOLD-0824: location is Marathahalli UP', holdProp.locationName.includes('Marathahalli'));
      assert('REC-HOLD-0824: target bus is BUS-07', holdProp.busId === 'BUS-07');
      assert('REC-HOLD-0824: recommends 300s hold', holdProp.recommendedAction.includes('300s'));
      assert('REC-HOLD-0824: discloses partial correction limitation', holdProp.limitations.includes('Partial correction'));
      assert('REC-HOLD-0824: source is Morning Replay (08:24:00)', holdProp.sourceTimestamp === '2025-03-10T08:24:00');
    }

    // Proposal 2: Evening Gap Relief
    const reliefProp = proposals.find((p) => p.id === 'REC-RELIEF-1815');
    assert('Interventions: REC-RELIEF-1815 proposal exists', reliefProp !== undefined);
    if (reliefProp) {
      assert('REC-RELIEF-1815: category is service_gap_relief', reliefProp.category === 'service_gap_relief');
      assert('REC-RELIEF-1815: priority is high', reliefProp.priority === 'high');
      assert('REC-RELIEF-1815: location is Hebbal DOWN Terminal', reliefProp.locationName.includes('Hebbal'));
      assert('REC-RELIEF-1815: target bus is BUS-13', reliefProp.busId === 'BUS-13');
      assert('REC-RELIEF-1815: recommends driver CREW-24', reliefProp.recommendedAction.includes('CREW-24'));
      assert('REC-RELIEF-1815: source is Evening Replay (18:15:00)', reliefProp.sourceTimestamp === '2025-03-10T18:15:00');
    }

    // Proposal 3: Crowding Frequency Review
    const crowdProp = proposals.find((p) => p.id === 'REC-FREQ-CROWD');
    assert('Interventions: REC-FREQ-CROWD proposal exists', crowdProp !== undefined);
    if (crowdProp) {
      assert('REC-FREQ-CROWD: category is crowding_frequency', crowdProp.category === 'crowding_frequency');
      assert('REC-FREQ-CROWD: recommends maintaining timetable (not triggered)', crowdProp.recommendedAction.includes('Maintain current timetable'));
    }
  }

  // --- 2. DETERMINISTIC SCENARIO SIMULATOR TESTS ---
  console.log('\n=== TEST SUITE 2: DATA-BACKED SCENARIO SIMULATOR ===');

  const baselineRes = await getSimulationBaselineData();
  assert('Sim Baseline: service succeeds', baselineRes.success && baselineRes.data !== undefined);
  const baseline = baselineRes.data;

  // Test 2.1: Holding Scenarios with Data-Backed Baseline
  console.log('--- Scenario 1: Bus Bunching Hold (0s, 60s, 150s, 300s) ---');
  assert('Sim Baseline: holding anchor has 75s separation', baseline?.holding.baselineSeparationSeconds === 75);
  assert('Sim Baseline: holding anchor has 120s bunching threshold', baseline?.holding.bunchingThresholdSeconds === 120);
  assert('Sim Baseline: target headway is 720s', baseline?.holding.targetHeadwaySeconds === 720);
  assert('Sim Baseline: max hold is 300s', baseline?.holding.maxHoldingAllowanceSeconds === 300);

  const hold0 = simulateHoldingScenario({ holdDurationSeconds: 0 }, baseline?.holding);
  assert('Sim Hold 0s: baseline is 75s', hold0.baselineSeparationSeconds === 75);
  assert('Sim Hold 0s: projected is 75s', hold0.projectedSeparationSeconds === 75);
  assert('Sim Hold 0s: bunching persists (< 120s)', hold0.bunchingCleared === false && hold0.correctionStatus === 'bunching_persists');

  const hold60 = simulateHoldingScenario({ holdDurationSeconds: 60 }, baseline?.holding);
  assert('Sim Hold 60s: projected is 135s', hold60.projectedSeparationSeconds === 135);
  assert('Sim Hold 60s: clears 120s bunching', hold60.bunchingCleared === true);
  assert('Sim Hold 60s: partial correction (135s < 720s target)', hold60.correctionStatus === 'cleared_partial');

  const hold300 = simulateHoldingScenario({ holdDurationSeconds: 300 }, baseline?.holding);
  assert('Sim Hold 300s: preserves exact 375s projection (75 + 300)', hold300.projectedSeparationSeconds === 375);
  assert('Sim Hold 300s: bunching cleared', hold300.bunchingCleared === true);
  assert('Sim Hold 300s: partial correction (375s < 720s)', hold300.correctionStatus === 'cleared_partial');
  assert('Sim Hold 300s: restores 52.1% of nominal 720s headway', hold300.headwayRestorationPct === 52.1);
  assert('Sim Hold 300s: capped at max holding allowance (300s)', hold300.maxHoldingAllowanceSeconds === 300);

  // Test 2.2: Standby Relief Scenarios with Data-Backed Fleet & Crew
  console.log('--- Scenario 2: Standby Relief Feasibility ---');
  assert('Sim Baseline: relief vehicles contain staged BUS-13', baseline?.relief.vehicles.some((v) => v.busId === 'BUS-13' && v.isStagedAtHebbal) === true);
  assert('Sim Baseline: relief drivers contain on-shift CREW-24', baseline?.relief.drivers.some((d) => d.crewId === 'CREW-24' && d.isOnShiftAt1815) === true);

  const reliefFeasible = simulateStandbyReliefScenario({ standbyBusId: 'BUS-13', standbyDriverId: 'CREW-24' }, baseline?.relief);
  assert('Sim Relief: BUS-13 + CREW-24 is FEASIBLE', reliefFeasible.feasibilityStatus === 'feasible');
  assert('Sim Relief: bus physically staged at Hebbal DOWN', reliefFeasible.busStagedAtTerminal === true);
  assert('Sim Relief: driver on active Shift 2 duty at 18:15:00', reliefFeasible.driverOnShiftAtEvalTime === true);
  assert('Sim Relief: measured gap is 1440s vs 1080s threshold', reliefFeasible.measuredGapSeconds === 1440 && reliefFeasible.largeGapThresholdSeconds === 1080);
  assert('Sim Relief: limitation discloses transit time not modeled', reliefFeasible.limitations.includes('deadhead transit'));
  assert(
    'Sim Relief: dispatch window explicitly states dispatch timing is not estimated',
    reliefFeasible.estimatedDispatchWindowMinutes === 'Dispatch timing is not estimated from available data'
  );

  const reliefWrongBus = simulateStandbyReliefScenario({ standbyBusId: 'BUS-12', standbyDriverId: 'CREW-24' }, baseline?.relief);
  assert('Sim Relief: BUS-12 (staged at Silk Board) is UNCONFIRMED for Hebbal DOWN', reliefWrongBus.feasibilityStatus === 'unconfirmed');

  const reliefWrongDriver = simulateStandbyReliefScenario({ standbyBusId: 'BUS-13', standbyDriverId: 'CREW-12' }, baseline?.relief);
  assert('Sim Relief: CREW-12 (Shift 1 off-duty) is UNCONFIRMED for 18:15:00', reliefWrongDriver.feasibilityStatus === 'unconfirmed');

  // Test 2.3: Crowding Baseline & Frequency Increase Evaluation
  console.log('--- Scenario 3: Passenger Crowding & Frequency Increase ---');
  const crowdSim = simulateCrowdingScenario(baseline?.crowding);
  assert('Sim Crowding: 60 design capacity (40 seated + 20 standing)', crowdSim.designCapacity === 60 && crowdSim.seatedCapacity === 40 && crowdSim.standingCapacity === 20);
  assert('Sim Crowding: 100% warning (60 pax) and 150% severe (90 pax)', crowdSim.warningThresholdPct === 100 && crowdSim.severeThresholdPct === 150);
  assert('Sim Crowding: peak load is exactly 92 pax (153.3%)', crowdSim.observedPeakPassengers === 92 && crowdSim.observedPeakOccupancyPct === 153.3);
  assert('Sim Crowding: peak location is Kadubeesanahalli UP on T-UP-006', crowdSim.peakStopName === 'Kadubeesanahalli UP' && crowdSim.peakTripId === 'T-UP-006');
  assert('Sim Crowding: frequency increase NOT triggered (max consecutive severe = 1)', crowdSim.frequencyIncreaseEligible === false);

  // Test 2.4: Safe Failure Under Missing Source Observations (No Fallback Invention)
  console.log('--- Simulation Baseline Safety: Missing Source Fail-Safe Checks ---');
  const safeHoldMissing = simulateHoldingScenario({ holdDurationSeconds: 150 });
  assert('Sim Safety: holding without baseline fails safely (available: false)', safeHoldMissing.available === false && safeHoldMissing.correctionStatus === 'unavailable');
  assert('Sim Safety: holding without baseline does not invent 75s separation', safeHoldMissing.baselineSeparationSeconds === null && safeHoldMissing.projectedSeparationSeconds === null);

  const safeHoldIncomplete = simulateHoldingScenario({ holdDurationSeconds: 150 }, { baselineSeparationSeconds: 75 });
  assert('Sim Safety: incomplete holding baseline fails safely (available: false)', safeHoldIncomplete.available === false && safeHoldIncomplete.projectedSeparationSeconds === null);

  const safeReliefMissing = simulateStandbyReliefScenario({ standbyBusId: 'BUS-13', standbyDriverId: 'CREW-24' });
  assert('Sim Safety: relief without baseline fails safely (available: false)', safeReliefMissing.available === false && safeReliefMissing.feasibilityStatus === 'unavailable');
  assert('Sim Safety: relief without baseline does not manufacture staged status', safeReliefMissing.busStagedAtTerminal === false && safeReliefMissing.measuredGapSeconds === null);

  const safeReliefIncomplete = simulateStandbyReliefScenario({ standbyBusId: 'BUS-13', standbyDriverId: 'CREW-24' }, { measuredGapSeconds: 1440 });
  assert('Sim Safety: incomplete relief baseline fails safely without vehicles/drivers', safeReliefIncomplete.available === false);

  const safeCrowdMissing = simulateCrowdingScenario();
  assert('Sim Safety: crowding without baseline fails safely (available: false)', safeCrowdMissing.available === false && safeCrowdMissing.designCapacity === null);
  assert('Sim Safety: crowding without baseline does not invent 92 pax peak', safeCrowdMissing.observedPeakPassengers === null && safeCrowdMissing.observedPeakOccupancyPct === null);

  const safeCrowdIncomplete = simulateCrowdingScenario({ designCapacity: 60 });
  assert('Sim Safety: incomplete crowding baseline fails safely (available: false)', safeCrowdIncomplete.available === false && safeCrowdIncomplete.observedPeakPassengers === null);

  // --- 3. OPERATIONAL REPORTS SERVICE TESTS ---
  console.log('\n=== TEST SUITE 3: OPERATIONAL REPORTS & EXPORTS ===');
  const reportsRes = await getReportsData();
  if (!reportsRes.success) {
    console.error('Reports Error:', reportsRes.error?.message);
  }
  assert('Reports: service succeeds', reportsRes.success && reportsRes.data !== undefined);

  if (reportsRes.data) {
    const { eod, morning, evening, simulation } = reportsRes.data.reports;

    // EOD Report
    assert('EOD Report: exists with correct ID', eod.reportId === 'REP-EOD-20250310');
    assert('EOD Report: disclaimer is present and correct', eod.disclaimer.includes('Illustrative synthetic') || eod.disclaimer.includes('Synthetic demonstration'));
    assert('EOD Report: reconciles 86 scheduled trips', eod.kpis.some((k) => k.metric.includes('Scheduled') && k.value.includes('86')));
    assert('EOD Report: reconciles 77 operated trips', eod.kpis.some((k) => k.metric.includes('Operated') && k.value.includes('77')));
    const otpKpi = eod.kpis.find((k) => k.metric.includes('On-Time Performance'));
    assert('EOD Report: OTP metric does not fall back to zero', otpKpi !== undefined && otpKpi.value !== '0%');
    assert('EOD Report: section heading uses Non-Operated Slots Reconciliation', eod.sections.some((s) => s.heading.includes('Non-Operated Slots Reconciliation')));
    assert('EOD Report: no lost kilometres claim in headings', !eod.sections.some((s) => s.heading.includes('Lost Kilometres')));
    assert('EOD Report: CSV export is generated with content', eod.csvData.length > 50 && eod.csvData.includes('Scheduled Slots'));

    // Morning Report
    assert('Morning Report: exists with evaluation timestamp 08:24:00', morning.evaluationTimestamp === '2025-03-10T08:24:00');
    assert('Morning Report: highlights 75s bunching at Marathahalli UP', morning.kpis.some((k) => k.value.includes('75s separation')));
    assert('Morning Report: CSV export is generated with content', morning.csvData.length > 30);

    // Evening Report
    assert('Evening Report: exists with evaluation timestamp 18:15:00', evening.evaluationTimestamp === '2025-03-10T18:15:00');
    assert('Evening Report: highlights 1,440s gap at Hebbal DOWN', evening.kpis.some((k) => k.value.includes('1,440s')));
    assert('Evening Report: confirms standby relief feasibility', evening.kpis.some((k) => k.value.includes('Feasible')));

    // Simulation Report
    assert('Simulation Report: exists with correct comparative matrix', simulation.sections.length > 0 && simulation.sections[0].rows.length === 3);
    const simRow0 = simulation.sections[0].rows[0];
    assert('Simulation Report: row 1 derived from actual hold simulation', String(simRow0.ProjectedResult).includes('375s separation') && String(simRow0.Intervention).includes('300s hold'));
    assert('Simulation Report: CSV export is generated with content', simulation.csvData.length > 50);
  }

  // --- 4. REVIEW WORKFLOW & SAFE STORAGE TESTS ---
  console.log('\n=== TEST SUITE 4: REVIEW WORKFLOW & STORAGE INTEGRITY ===');
  // Test 4.1: Mandatory Rejection Note Validation
  const validateRejection = (note: string) => {
    return note.trim().length > 0;
  };
  assert('Rejection Validation: empty note is rejected', validateRejection('') === false);
  assert('Rejection Validation: whitespace note is rejected', validateRejection('   ') === false);
  assert('Rejection Validation: non-empty operational note is accepted', validateRejection('Bus currently has low battery') === true);

  // Test 4.2: Storage Structure Validation (safe against malformed JSON)
  const validateStoredRecord = (item: unknown): boolean => {
    if (!item || typeof item !== 'object') return false;
    const r = item as Record<string, unknown>;
    return (
      typeof r.proposalId === 'string' &&
      (r.decision === 'approved' || r.decision === 'rejected') &&
      typeof r.reviewNote === 'string' &&
      typeof r.reviewedAt === 'string'
    );
  };
  assert('Storage Validation: valid review record is accepted', validateStoredRecord({ proposalId: 'REC-1', decision: 'approved', reviewNote: 'OK', reviewedAt: '2025-03-10T10:00:00' }) === true);
  assert('Storage Validation: malformed record missing note is rejected', validateStoredRecord({ proposalId: 'REC-1', decision: 'approved' }) === false);
  assert('Storage Validation: malformed decision is rejected', validateStoredRecord({ proposalId: 'REC-1', decision: 'invalid_status', reviewNote: 'test', reviewedAt: '2025-03-10' }) === false);
  assert('Storage Validation: null or primitive is rejected without throwing', validateStoredRecord(null) === false && validateStoredRecord('corrupt') === false);

  // Test 4.3: Reports Local Record Validators (isValidLocalReview & isValidLocalSimRun)
  assert('Reports Validator: isValidLocalReview accepts valid review', isValidLocalReview({ proposalId: 'REC-HOLD-0824', decision: 'approved', reviewNote: 'Approved by lead', reviewedAt: '2025-03-10T09:00:00Z' }) === true);
  assert('Reports Validator: isValidLocalReview rejects null', isValidLocalReview(null) === false);
  assert('Reports Validator: isValidLocalReview rejects missing reviewNote', isValidLocalReview({ proposalId: 'REC-1', decision: 'approved' }) === false);
  assert('Reports Validator: isValidLocalReview rejects non-string reviewNote', isValidLocalReview({ proposalId: 'REC-1', decision: 'approved', reviewNote: 123, reviewedAt: '2025-03-10' }) === false);
  assert('Reports Validator: isValidLocalReview rejects invalid decision', isValidLocalReview({ proposalId: 'REC-1', decision: 'pending', reviewNote: 'note', reviewedAt: '2025-03-10' }) === false);

  assert('Reports Validator: isValidLocalSimRun accepts valid run', isValidLocalSimRun({ id: 'SIM-1', scenarioType: 'holding', summary: '300s hold', details: '375s projected', simulatedAt: '2025-03-10T10:00:00Z' }) === true);
  assert('Reports Validator: isValidLocalSimRun rejects invalid scenarioType', isValidLocalSimRun({ id: 'SIM-1', scenarioType: 'unknown', summary: '300s', details: 'details', simulatedAt: '2025-03-10' }) === false);
  assert('Reports Validator: isValidLocalSimRun rejects missing summary', isValidLocalSimRun({ id: 'SIM-1', scenarioType: 'holding', details: 'details', simulatedAt: '2025-03-10' }) === false);

  // Test 4.4: CSV Export Formatting Resilient to Malformed Arrays
  const mixedReviews = [
    null,
    { corrupt: true },
    { proposalId: 'REC-VALID-1', decision: 'approved', reviewNote: 'Clean note', reviewedAt: '2025-03-10T10:00:00Z' },
    { proposalId: 'REC-MALFORMED', decision: 'rejected' } // missing note
  ];
  const sanitizedReviews = mixedReviews.filter(isValidLocalReview);
  assert('Reports Export: mixed reviews filtered to exactly valid records', sanitizedReviews.length === 1 && sanitizedReviews[0].proposalId === 'REC-VALID-1');

  let csvExportSucceeded = false;
  try {
    const lines = ['ProposalId,Decision,ReviewNote,ReviewedAt'];
    for (const r of sanitizedReviews) {
      const note = `"${String(r.reviewNote).replace(/"/g, '""')}"`;
      lines.push([r.proposalId, r.decision, note, r.reviewedAt].join(','));
    }
    const csvContent = lines.join('\n');
    csvExportSucceeded = csvContent.includes('REC-VALID-1');
  } catch {
    csvExportSucceeded = false;
  }
  assert('Reports Export: CSV generation with malformed input succeeds without crashing', csvExportSucceeded === true);

  // --- 5. COMMUTER RESEARCH AGGREGATE ISOLATION TESTS ---
  console.log('\n=== TEST SUITE 5: COMMUTER RESEARCH AGGREGATE ISOLATION ===');
  const commuterRes = await getCommuterResearchData();
  assert('Commuter Research: service loads successfully', commuterRes.success && commuterRes.data !== undefined);
  if (commuterRes.data) {
    const rData = commuterRes.data;
    assert('Commuter Research: discloses simulated workbook', rData.isSimulatedWorkbook === true && rData.disclaimer.includes('simulated case study'));
    assert('Commuter Research: sample size is 100', rData.sampleSize === 100);
    assert('Commuter Research: reports 88% peak commute', rData.metrics.peakTravelPatternPct === 88);
    assert('Commuter Research: reports 77% seat scarcity', rData.metrics.rarelyOrNeverVacantPct === 77);
    assert('Commuter Research: contains 10 pain points', rData.commuterPainPoints.length === 10);
    assert('Commuter Research: travel window distribution is aggregate', rData.metrics.travelWindowDistribution.bothPeaks === 38);
    // Explicitly verify NO sampleProfiles field exists on the returned data
    assert('Commuter Research Boundary: sampleProfiles is undefined', (rData as unknown as Record<string, unknown>).sampleProfiles === undefined);
  }

  // --- 6. MISSING-DATA & SILENT FALLBACK PROTECTION TESTS ---
  console.log('\n=== TEST SUITE 6: MISSING DATA FAIL-SAFES & SILENT FALLBACK REMOVAL ===');

  // Holding missing baseline
  const missingHold = simulateHoldingScenario({ holdDurationSeconds: 150 }, undefined);
  assert('Missing Data Hold: returns available: false when baseline undefined', missingHold.available === false);
  assert('Missing Data Hold: projectedSeparationSeconds is null', missingHold.projectedSeparationSeconds === null);
  assert('Missing Data Hold: baselineSeparationSeconds is null', missingHold.baselineSeparationSeconds === null);

  // Relief missing baseline
  const missingRelief = simulateStandbyReliefScenario({ standbyBusId: 'BUS-1', standbyDriverId: 'CREW-1' }, undefined);
  assert('Missing Data Relief: returns available: false when baseline undefined', missingRelief.available === false);
  assert('Missing Data Relief: measuredGapSeconds is null', missingRelief.measuredGapSeconds === null);
  assert('Missing Data Relief: feasibilityStatus is unavailable', missingRelief.feasibilityStatus === 'unavailable');

  // Crowding missing baseline
  const missingCrowd = simulateCrowdingScenario(undefined);
  assert('Missing Data Crowding: returns available: false when baseline undefined', missingCrowd.available === false);
  assert('Missing Data Crowding: observedPeakPassengers is null', missingCrowd.observedPeakPassengers === null);

  // Crowding without seated/standing capacities must NOT fallback to 40/20
  const crowdNoFallbacks = simulateCrowdingScenario({
    designCapacity: 60,
    observedPeakPassengers: 85,
    observedPeakOccupancyPct: 141.7
    // seatedCapacity and standingCapacity intentionally omitted
  });
  assert('Missing Capacity Fallback: seatedCapacity is explicitly null (no silent 40 fallback)', crowdNoFallbacks.seatedCapacity === null);
  assert('Missing Capacity Fallback: standingCapacity is explicitly null (no silent 20 fallback)', crowdNoFallbacks.standingCapacity === null);
  assert('Missing Capacity Fallback: designCapacity preserved', crowdNoFallbacks.designCapacity === 60);

  console.log('\n============================================================');
  console.log(`TOTAL INTEGRATED RELEASE CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyIntegratedRelease().catch((err) => {
  console.error('Fatal Integrated Release verification error:', err);
  process.exit(1);
});
