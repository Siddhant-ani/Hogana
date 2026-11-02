/**
 * HOGANA — Step 2: Backend Operational Intelligence Test Suite
 * 
 * Comprehensive automated verification for all operational calculation engines:
 * 1. Observed headway & irregularity CV (with deterministic population sigma)
 * 2. Nominal timetable headway & large service gaps
 * 3. Bus bunching detection & dispatcher holding recommendations
 * 4. Passenger occupancy & crowding classification (with strict anti-lookahead)
 * 5. Schedule arrival delay & on-time performance
 * 6. Operational fulfillment KPIs & baseline reconciliation (end-of-day vs as-of replay)
 * 7. GPS freshness & fleet availability (origin terminal validation & shift boundaries)
 * 8. Replay state lifecycle & strict telemetry identity protections
 * 9. Approved demonstration scenario integrations (morning bunching & evening large gap)
 */

import { getCompleteDataset } from '../lib/dataset/data-access';
import {
  calculateObservedHeadways,
  calculateHeadwayCV,
  calculateNominalScheduledIntervals,
  detectLargeGapsFromArrivals,
  detectTerminalDepartureGaps,
  detectStopArrivalBunching,
  evaluateHoldRecommendation,
  calculatePassengerOccupancy,
  classifyCrowding,
  detectCrowdingAlerts,
  evaluateFrequencyIncreaseRecommendation,
  calculateArrivalDelay,
  calculateOnTimePerformance,
  calculateCorridorKpis,
  calculateReplayCorridorStatus,
  evaluateGpsFreshness,
  getFleetInventory,
  getStandbyDriverAvailability,
  isShiftCovering,
  evaluateReliefBusRecommendation,
  deriveTripReplayStatus,
  evaluateDwellingState
} from '../lib/engine';
import {
  ScheduledTrip,
  StopTime,
  PassengerLoad,
  BusPosition,
  Vehicle,
  Stop
} from '../lib/dataset/types';
import { ObservedHeadway } from '../lib/engine/types';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, message?: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`  [FAIL] ${name}: ${message ?? 'Assertion failed'}`);
    results.push({ name, passed: false, message });
  }
}

async function runEngineTests() {
  console.log('============================================================');
  console.log('HOGANA STEP 2: BACKEND OPERATIONAL INTELLIGENCE TEST SUITE');
  console.log('============================================================\n');

  // Load the approved complete demonstration dataset
  const dataset = await getCompleteDataset();
  const {
    stops,
    scheduledTrips,
    stopTimes,
    passengerLoads,
    busPositions,
    vehicles,
    crewAvailability,
    assumptions
  } = dataset;

  // ========================================================
  // 1. OBSERVED HEADWAY ENGINE TESTS
  // ========================================================
  console.log('=== TEST SUITE 1: OBSERVED HEADWAY & HEADWAY IRREGULARITY CV ===');

  // 1.1 Calculate observed headways at Marathahalli UP
  const marathahalliHeadways = calculateObservedHeadways({
    stopId: 'marathahalli-up',
    direction: 'UP',
    stopTimes,
    scheduledTrips
  });
  assert(
    'Headway: returns status ok for stop with valid operating trips',
    marathahalliHeadways.status === 'ok' && marathahalliHeadways.headways.length > 0,
    `Status: ${marathahalliHeadways.status}, count: ${marathahalliHeadways.headways.length}`
  );

  // 1.2 Verify chronological ordering
  let isChronological = true;
  for (let i = 1; i < marathahalliHeadways.headways.length; i++) {
    const prev = marathahalliHeadways.headways[i - 1];
    const curr = marathahalliHeadways.headways[i];
    if (curr.leadingActualArrival !== prev.trailingActualArrival) {
      isChronological = false;
      break;
    }
  }
  assert(
    'Headway: consecutive pairs are chained and chronologically ordered',
    isChronological,
    'Consecutive headway chain mismatch'
  );

  // 1.3 Missing actual arrival does not calculate headway and never defaults to zero
  const syntheticStopTimesMissing: StopTime[] = [
    {
      trip_id: 'TEST-1',
      stop_id: 'test-stop',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:00:00',
      actual_arrival: '2025-03-10T08:00:10',
      scheduled_departure: '2025-03-10T08:00:00',
      actual_departure: '2025-03-10T08:00:30',
      source_label: 'synthetic'
    },
    {
      trip_id: 'TEST-2',
      stop_id: 'test-stop',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:12:00',
      actual_arrival: null, // missing arrival
      scheduled_departure: '2025-03-10T08:12:00',
      actual_departure: null,
      source_label: 'synthetic'
    },
    {
      trip_id: 'TEST-3',
      stop_id: 'test-stop',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:24:00',
      actual_arrival: '2025-03-10T08:24:10',
      scheduled_departure: '2025-03-10T08:24:00',
      actual_departure: '2025-03-10T08:24:40',
      source_label: 'synthetic'
    }
  ];
  const syntheticTrips: ScheduledTrip[] = [
    {
      trip_id: 'TEST-1',
      route_id: 'test-route',
      direction: 'UP',
      bus_id: 'BUS-01',
      scheduled_departure: '2025-03-10T08:00:00',
      scheduled_arrival: '2025-03-10T08:55:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    },
    {
      trip_id: 'TEST-2',
      route_id: 'test-route',
      direction: 'UP',
      bus_id: 'BUS-02',
      scheduled_departure: '2025-03-10T08:12:00',
      scheduled_arrival: '2025-03-10T09:07:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    },
    {
      trip_id: 'TEST-3',
      route_id: 'test-route',
      direction: 'UP',
      bus_id: 'BUS-03',
      scheduled_departure: '2025-03-10T08:24:00',
      scheduled_arrival: '2025-03-10T09:19:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    }
  ];

  const missingResult = calculateObservedHeadways({
    stopId: 'test-stop',
    direction: 'UP',
    stopTimes: syntheticStopTimesMissing,
    scheduledTrips: syntheticTrips
  });
  assert(
    'Headway: missing arrival is excluded and never treated as zero',
    missingResult.status === 'ok' &&
      missingResult.headways.length === 1 &&
      missingResult.headways[0].leadingTripId === 'TEST-1' &&
      missingResult.headways[0].trailingTripId === 'TEST-3' &&
      missingResult.headways[0].headwaySeconds === 1440,
    `Calculated headway: ${JSON.stringify(missingResult.headways)}`
  );

  // 1.4 Insufficient data (< 2 valid observations)
  const singleVisitResult = calculateObservedHeadways({
    stopId: 'test-stop',
    direction: 'UP',
    stopTimes: [syntheticStopTimesMissing[0]],
    scheduledTrips: [syntheticTrips[0]]
  });
  assert(
    'Headway: returns insufficient_data status when < 2 valid arrivals',
    singleVisitResult.status === 'insufficient_data' && singleVisitResult.headways.length === 0,
    `Status was ${singleVisitResult.status}`
  );

  // 1.5 Headway Irregularity CV: Deterministic known values test with population sigma
  // Known values: 600s and 800s
  // Mean = 700s
  // Variance = ((600-700)^2 + (800-700)^2) / 2 = (10000 + 10000)/2 = 10000
  // Population StdDev = sqrt(10000) = 100.00s
  // CV = 100 / 700 = 0.142857... -> 0.1429
  const deterministicHeadways: ObservedHeadway[] = [
    {
      stopId: 'det-stop',
      direction: 'UP',
      leadingTripId: 'T1',
      trailingTripId: 'T2',
      leadingBusId: 'B1',
      trailingBusId: 'B2',
      leadingActualArrival: '2025-03-10T08:00:00',
      trailingActualArrival: '2025-03-10T08:10:00', // 600s
      headwaySeconds: 600
    },
    {
      stopId: 'det-stop',
      direction: 'UP',
      leadingTripId: 'T2',
      trailingTripId: 'T3',
      leadingBusId: 'B2',
      trailingBusId: 'B3',
      leadingActualArrival: '2025-03-10T08:10:00',
      trailingActualArrival: '2025-03-10T08:23:20', // 800s
      headwaySeconds: 800
    }
  ];

  const detCvResult = calculateHeadwayCV({
    stopId: 'det-stop',
    direction: 'UP',
    timeWindowStart: '2025-03-10T08:00:00',
    timeWindowEnd: '2025-03-10T09:00:00',
    headways: deterministicHeadways
  });
  assert(
    'Headway CV: deterministic test verifies exact mean (700s), population sigma (100.00s), and CV (0.1429)',
    detCvResult.status === 'ok' &&
      detCvResult.meanHeadwaySeconds === 700 &&
      detCvResult.stdDevHeadwaySeconds === 100.0 &&
      detCvResult.cv === 0.1429,
    `Result: mean=${detCvResult.meanHeadwaySeconds}, stdDev=${detCvResult.stdDevHeadwaySeconds}, cv=${detCvResult.cv}`
  );

  // 1.6 Headway CV: Stop and direction filtering on precomputed headways
  const mixedHeadways: ObservedHeadway[] = [
    ...deterministicHeadways,
    {
      stopId: 'other-stop', // different stop
      direction: 'UP',
      leadingTripId: 'TX1',
      trailingTripId: 'TX2',
      leadingBusId: 'BX1',
      trailingBusId: 'BX2',
      leadingActualArrival: '2025-03-10T08:00:00',
      trailingActualArrival: '2025-03-10T08:15:00',
      headwaySeconds: 900
    },
    {
      stopId: 'det-stop',
      direction: 'DOWN', // different direction
      leadingTripId: 'TY1',
      trailingTripId: 'TY2',
      leadingBusId: 'BY1',
      trailingBusId: 'BY2',
      leadingActualArrival: '2025-03-10T08:00:00',
      trailingActualArrival: '2025-03-10T08:15:00',
      headwaySeconds: 900
    }
  ];
  const filteredCvResult = calculateHeadwayCV({
    stopId: 'det-stop',
    direction: 'UP',
    timeWindowStart: '2025-03-10T08:00:00',
    timeWindowEnd: '2025-03-10T09:00:00',
    headways: mixedHeadways
  });
  assert(
    'Headway CV: filters supplied headways by stopId and direction',
    filteredCvResult.status === 'ok' &&
      filteredCvResult.observationCount === 2 &&
      filteredCvResult.meanHeadwaySeconds === 700,
    `Count was ${filteredCvResult.observationCount}`
  );

  // 1.7 Headway CV: T_eval anti-lookahead excludes future headways
  const cvWithFuture = calculateHeadwayCV({
    stopId: 'det-stop',
    direction: 'UP',
    timeWindowStart: '2025-03-10T08:00:00',
    timeWindowEnd: '2025-03-10T09:00:00',
    headways: deterministicHeadways,
    evaluationTime: '2025-03-10T08:15:00' // T2 is 08:10 (ok), T3 is 08:23:20 (future -> excluded)
  });
  assert(
    'Headway CV: T_eval excludes future arrival observations, returning insufficient_data when < 2 remain',
    cvWithFuture.status === 'insufficient_data' && cvWithFuture.cv === null,
    `Status was ${cvWithFuture.status}`
  );

  // 1.8 Headway CV on approved dataset
  const cvWindowResult = calculateHeadwayCV({
    stopId: 'marathahalli-up',
    direction: 'UP',
    timeWindowStart: '2025-03-10T07:00:00',
    timeWindowEnd: '2025-03-10T09:00:00',
    stopTimes,
    scheduledTrips
  });
  assert(
    'Headway CV: valid calculation over 2-hour morning window on corridor dataset',
    cvWindowResult.status === 'ok' &&
      typeof cvWindowResult.cv === 'number' &&
      cvWindowResult.cv > 0 &&
      cvWindowResult.observationCount >= 2,
    `CV result: ${JSON.stringify(cvWindowResult)}`
  );

  // ========================================================
  // 2. NOMINAL SCHEDULED HEADWAY & SERVICE GAPS
  // ========================================================
  console.log('\n=== TEST SUITE 2: NOMINAL SCHEDULED INTERVALS & SERVICE GAPS ===');

  // 2.1 Nominal scheduled intervals preserve all 86 planned slots
  const nominalSilkBoard = calculateNominalScheduledIntervals({
    stopId: 'silk-board-up',
    direction: 'UP',
    stopTimes,
    scheduledTrips
  });
  assert(
    'Nominal headway: preserves all scheduled departure slots (42 intervals for 43 planned UP trips)',
    nominalSilkBoard.length === 42,
    `Found ${nominalSilkBoard.length} nominal intervals`
  );

  // 2.2 Verify peak nominal interval is 720s (12 min)
  const morningPeakInterval = nominalSilkBoard[0];
  assert(
    'Nominal headway: peak interval is exactly 720 seconds (12 min)',
    morningPeakInterval.nominalIntervalSeconds === 720,
    `Interval was ${morningPeakInterval.nominalIntervalSeconds}`
  );

  // 2.3 Cancelled and shortfall slots are retained in nominal calculation
  const shortfallSlotRetained = nominalSilkBoard.some(
    (i) => i.leadingSlotTripId === 'T-UP-016' || i.trailingSlotTripId === 'T-UP-016'
  );
  assert(
    'Nominal headway: shortfall trip T-UP-016 is retained in the scheduled grid',
    shortfallSlotRetained,
    'T-UP-016 was not found in nominal intervals'
  );

  // 2.4 Large Gap Detection: Boundary condition
  const testTripA: ScheduledTrip = {
    trip_id: 'T-A',
    route_id: 'r1',
    direction: 'UP',
    bus_id: 'B-1',
    scheduled_departure: '2025-03-10T08:00:00',
    scheduled_arrival: '2025-03-10T08:55:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };
  const testTripB: ScheduledTrip = {
    trip_id: 'T-B',
    route_id: 'r1',
    direction: 'UP',
    bus_id: 'B-2',
    scheduled_departure: '2025-03-10T08:12:00',
    scheduled_arrival: '2025-03-10T09:07:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };

  const stBoundaryExact: StopTime[] = [
    {
      trip_id: 'T-A',
      stop_id: 's1',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:00:00',
      actual_arrival: '2025-03-10T08:00:00',
      scheduled_departure: '2025-03-10T08:00:00',
      actual_departure: '2025-03-10T08:00:00',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-B',
      stop_id: 's1',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:12:00',
      actual_arrival: '2025-03-10T08:18:00', // 18m = 1080s
      scheduled_departure: '2025-03-10T08:12:00',
      actual_departure: '2025-03-10T08:18:00',
      source_label: 'synthetic'
    }
  ];

  const gapExact = detectLargeGapsFromArrivals({
    stopId: 's1',
    direction: 'UP',
    stopTimes: stBoundaryExact,
    scheduledTrips: [testTripA, testTripB],
    assumptions
  });
  assert(
    'Large Gap: exactly at threshold (1080s == 720 * 1.5) does NOT trigger alert',
    gapExact.length === 0,
    `Alert count: ${gapExact.length}`
  );

  const stBoundaryAbove: StopTime[] = [
    stBoundaryExact[0],
    { ...stBoundaryExact[1], actual_arrival: '2025-03-10T08:18:01' }
  ];
  const gapAbove = detectLargeGapsFromArrivals({
    stopId: 's1',
    direction: 'UP',
    stopTimes: stBoundaryAbove,
    scheduledTrips: [testTripA, testTripB],
    assumptions
  });
  assert(
    'Large Gap: strictly above threshold (1081s > 1080s) triggers large-gap alert',
    gapAbove.length === 1 && gapAbove[0].measured_seconds === 1081,
    `Alert: ${JSON.stringify(gapAbove)}`
  );

  // 2.5 Evening large gap demonstration scenario (T_eval = 18:15:00 at Hebbal terminal)
  const eveningGaps = detectTerminalDepartureGaps({
    originStopId: 'hebbal-down',
    direction: 'DOWN',
    stopTimes,
    scheduledTrips,
    assumptions,
    evaluationTime: '2025-03-10T18:15:00'
  });
  const demoGap = eveningGaps.find(
    (g) => g.trip_id_leading === 'T-DN-032' && g.trip_id_trailing === 'T-DN-034'
  );
  assert(
    'Large Gap Demo: detects 1440s terminal departure gap at Hebbal caused by cancelled T-DN-033',
    demoGap !== undefined &&
      demoGap.bus_id_leading === 'BUS-06' &&
      demoGap.bus_id_trailing === 'BUS-07' &&
      demoGap.measured_seconds === 1440 &&
      demoGap.threshold_seconds === 1080,
    `Demo gap result: ${JSON.stringify(demoGap)}`
  );

  // ========================================================
  // 3. BUS BUNCHING & HOLDING RECOMMENDATION ENGINE
  // ========================================================
  console.log('\n=== TEST SUITE 3: BUS BUNCHING & DISPATCHER HOLD RECOMMENDATIONS ===');

  // 3.1 Arrival bunching boundary tests
  const stBunching119: StopTime[] = [
    {
      trip_id: 'T-A',
      stop_id: 's1',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:00:00',
      actual_arrival: '2025-03-10T08:00:00',
      scheduled_departure: '2025-03-10T08:00:00',
      actual_departure: '2025-03-10T08:00:30',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-B',
      stop_id: 's1',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:12:00',
      actual_arrival: '2025-03-10T08:01:59', // 119 seconds later
      scheduled_departure: '2025-03-10T08:12:00',
      actual_departure: '2025-03-10T08:02:30',
      source_label: 'synthetic'
    }
  ];
  const bunching119 = detectStopArrivalBunching({
    stopId: 's1',
    direction: 'UP',
    stopTimes: stBunching119,
    scheduledTrips: [testTripA, testTripB],
    assumptions
  });
  assert(
    'Bunching: 119s (< 120s) triggers bunching alert',
    bunching119.length === 1 && bunching119[0].measured_seconds === 119,
    `Alert count: ${bunching119.length}`
  );

  const stBunching120: StopTime[] = [
    stBunching119[0],
    { ...stBunching119[1], actual_arrival: '2025-03-10T08:02:00' } // 120s later
  ];
  const bunching120 = detectStopArrivalBunching({
    stopId: 's1',
    direction: 'UP',
    stopTimes: stBunching120,
    scheduledTrips: [testTripA, testTripB],
    assumptions
  });
  assert(
    'Bunching: exactly 120s (= threshold) does NOT trigger bunching alert',
    bunching120.length === 0,
    `Alert count: ${bunching120.length}`
  );

  // 3.2 Morning bunching scenario at Marathahalli UP (T_eval = 08:24:00)
  const marathahalliStop = stops.find((s) => s.stop_id === 'marathahalli-up')!;
  const morningHoldEval = evaluateHoldRecommendation({
    controlStopId: 'marathahalli-up',
    direction: 'UP',
    stop: marathahalliStop,
    scheduledTrips,
    stopTimes,
    busPositions,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });

  assert(
    'Morning Bunching Demo: bunching alert triggered with 75s current elapsed separation',
    morningHoldEval.alert !== null &&
      morningHoldEval.alert.bus_id_leading === 'BUS-06' &&
      morningHoldEval.alert.bus_id_trailing === 'BUS-07' &&
      morningHoldEval.alert.measured_seconds === 75 &&
      morningHoldEval.alert.threshold_seconds === 120,
    `Alert: ${JSON.stringify(morningHoldEval.alert)}`
  );

  assert(
    'Morning Hold Demo: generates 300s feasible hold (capped by 300s delay allowance) with partial correction disclosure',
    morningHoldEval.recommendation !== null &&
      morningHoldEval.recommendation.status === 'recommended' &&
      morningHoldEval.recommendation.targetHeadwaySeconds === 720 &&
      morningHoldEval.recommendation.feasibleHoldSeconds === 300 &&
      morningHoldEval.recommendation.projectedSeparationSeconds === 375 &&
      morningHoldEval.recommendation.isPartialCorrection === true &&
      morningHoldEval.recommendation.recommendationText.includes('partial correction'),
    `Recommendation: ${JSON.stringify(morningHoldEval.recommendation)}`
  );

  // 3.3 Dynamic Hold Target Headway: Peak vs Off-Peak
  assert(
    'Hold Target Headway: morning peak scheduled departure (08:24:00) dynamically selects 720s target headway',
    morningHoldEval.recommendation !== null &&
      morningHoldEval.recommendation.targetHeadwaySeconds === 720,
    `Target headway was ${morningHoldEval.recommendation?.targetHeadwaySeconds}`
  );

  const offPeakTripLeading: ScheduledTrip = {
    trip_id: 'T-OFF-LEAD',
    route_id: 'silk-board-hebbal',
    direction: 'UP',
    bus_id: 'BUS-01',
    scheduled_departure: '2025-03-10T11:15:00',
    scheduled_arrival: '2025-03-10T12:10:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };
  const offPeakTripTrailing: ScheduledTrip = {
    trip_id: 'T-OFF-TRAIL',
    route_id: 'silk-board-hebbal',
    direction: 'UP',
    bus_id: 'BUS-02',
    scheduled_departure: '2025-03-10T11:30:00',
    scheduled_arrival: '2025-03-10T12:25:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };
  const offPeakStopTimes: StopTime[] = [
    {
      trip_id: 'T-OFF-LEAD',
      stop_id: 'silk-board-up',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T11:15:00',
      actual_arrival: '2025-03-10T11:15:00',
      scheduled_departure: '2025-03-10T11:15:00',
      actual_departure: '2025-03-10T11:15:00',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OFF-LEAD',
      stop_id: 'marathahalli-up',
      stop_sequence: 6,
      scheduled_arrival: '2025-03-10T11:40:00',
      actual_arrival: '2025-03-10T11:40:00',
      scheduled_departure: '2025-03-10T11:41:00',
      actual_departure: '2025-03-10T11:44:00',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OFF-TRAIL',
      stop_id: 'silk-board-up',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T11:30:00',
      actual_arrival: '2025-03-10T11:30:00',
      scheduled_departure: '2025-03-10T11:30:00',
      actual_departure: '2025-03-10T11:30:00',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OFF-TRAIL',
      stop_id: 'marathahalli-up',
      stop_sequence: 6,
      scheduled_arrival: '2025-03-10T11:45:00',
      actual_arrival: '2025-03-10T11:45:00',
      scheduled_departure: '2025-03-10T11:46:00', // Off-peak scheduled departure (11:46:00)
      actual_departure: null, // Currently dwelling
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OFF-TRAIL',
      stop_id: 'hebbal-up',
      stop_sequence: 12,
      scheduled_arrival: '2025-03-10T12:25:00',
      actual_arrival: null, // Not yet reached
      scheduled_departure: '2025-03-10T12:25:00',
      actual_departure: null,
      source_label: 'synthetic'
    }
  ];
  const offPeakGps: BusPosition[] = [
    {
      position_id: 'P-OFF-1',
      bus_id: 'BUS-02',
      trip_id: 'T-OFF-TRAIL',
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      timestamp: '2025-03-10T11:45:15',
      latitude: marathahalliStop.lat,
      longitude: marathahalliStop.lon,
      speed_kmh: 0,
      source_label: 'synthetic'
    }
  ];
  const offPeakHoldEval = evaluateHoldRecommendation({
    controlStopId: 'marathahalli-up',
    direction: 'UP',
    stop: marathahalliStop,
    scheduledTrips: [offPeakTripLeading, offPeakTripTrailing],
    stopTimes: offPeakStopTimes,
    busPositions: offPeakGps,
    evaluationTime: '2025-03-10T11:45:15',
    assumptions
  });
  assert(
    'Hold Target Headway: off-peak scheduled departure (11:46:00) dynamically selects 900s target headway',
    offPeakHoldEval.recommendation !== null &&
      offPeakHoldEval.recommendation.targetHeadwaySeconds === 900 &&
      offPeakHoldEval.recommendation.status === 'recommended',
    `Off-peak result: ${JSON.stringify(offPeakHoldEval.recommendation)}`
  );

  // 3.4 Hold rejection on non-control point
  const nonControlStop: Stop = { ...marathahalliStop, is_control_point: false };
  const nonControlEval = evaluateHoldRecommendation({
    controlStopId: 'marathahalli-up',
    direction: 'UP',
    stop: nonControlStop,
    scheduledTrips,
    stopTimes,
    busPositions,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });
  assert(
    'Hold Recommendation: rejected/ineligible if stop is not a designated control point',
    nonControlEval.recommendation?.status === 'ineligible',
    `Status was ${nonControlEval.recommendation?.status}`
  );

  // ========================================================
  // 4. PASSENGER OCCUPANCY & CROWDING ENGINE
  // ========================================================
  console.log('\n=== TEST SUITE 4: PASSENGER OCCUPANCY & CROWDING CLASSIFICATION ===');

  // 4.1 Classification thresholds: <100%, 100%, 150%, >150%
  assert('Crowding: 99.9% is normal', classifyCrowding(99.9, assumptions) === 'normal');
  assert('Crowding: 100.0% is overcrowded', classifyCrowding(100.0, assumptions) === 'overcrowded');
  assert('Crowding: 149.9% is overcrowded', classifyCrowding(149.9, assumptions) === 'overcrowded');
  assert(
    'Crowding: 150.0% is severely_overcrowded',
    classifyCrowding(150.0, assumptions) === 'severely_overcrowded'
  );
  assert(
    'Crowding: 160.0% is severely_overcrowded',
    classifyCrowding(160.0, assumptions) === 'severely_overcrowded'
  );

  // 4.2 Anti-Lookahead & Null Handling Tests for calculatePassengerOccupancy()
  const testTripOcc: ScheduledTrip = {
    trip_id: 'T-OCC-1',
    route_id: 'r1',
    direction: 'UP',
    bus_id: 'BUS-V1',
    scheduled_departure: '2025-03-10T08:00:00',
    scheduled_arrival: '2025-03-10T08:55:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };

  const testVehicles: Vehicle[] = [
    {
      bus_id: 'BUS-V1',
      registration: 'KA-01-F-1001',
      capacity_seated: 40,
      capacity_standing: 20,
      capacity_total: 60,
      current_location_stop_id: 'silk-board-up',
      status: 'active',
      source_label: 'synthetic'
    },
    {
      bus_id: 'BUS-V2',
      registration: 'KA-01-F-1002',
      capacity_seated: 0,
      capacity_standing: 0,
      capacity_total: 0, // invalid capacity
      current_location_stop_id: 'silk-board-up',
      status: 'active',
      source_label: 'synthetic'
    }
  ];

  const testStopTimesOcc: StopTime[] = [
    {
      trip_id: 'T-OCC-1',
      stop_id: 's1',
      stop_sequence: 1,
      scheduled_arrival: '2025-03-10T08:00:00',
      actual_arrival: '2025-03-10T08:00:15', // before T_eval (08:15:00)
      scheduled_departure: '2025-03-10T08:00:00',
      actual_departure: '2025-03-10T08:00:45',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OCC-1',
      stop_id: 's2',
      stop_sequence: 2,
      scheduled_arrival: '2025-03-10T08:15:00',
      actual_arrival: '2025-03-10T08:15:00', // exactly at T_eval
      scheduled_departure: '2025-03-10T08:15:00',
      actual_departure: '2025-03-10T08:15:30',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OCC-1',
      stop_id: 's3',
      stop_sequence: 3,
      scheduled_arrival: '2025-03-10T08:25:00',
      actual_arrival: '2025-03-10T08:26:00', // strictly after T_eval (future)
      scheduled_departure: '2025-03-10T08:25:00',
      actual_departure: '2025-03-10T08:26:30',
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-OCC-1',
      stop_id: 's4',
      stop_sequence: 4,
      scheduled_arrival: '2025-03-10T08:10:00',
      actual_arrival: null, // null actual arrival (unobserved)
      scheduled_departure: '2025-03-10T08:10:00',
      actual_departure: null,
      source_label: 'synthetic'
    }
  ];

  const testLoadsOcc: PassengerLoad[] = [
    { trip_id: 'T-OCC-1', stop_id: 's1', stop_sequence: 1, boardings: 45, alightings: 0, onboard_after: 45, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-OCC-1', stop_id: 's2', stop_sequence: 2, boardings: 15, alightings: 0, onboard_after: 60, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-OCC-1', stop_id: 's3', stop_sequence: 3, boardings: 30, alightings: 0, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-OCC-1', stop_id: 's4', stop_sequence: 4, boardings: 10, alightings: 0, onboard_after: 70, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-OCC-1', stop_id: 's5', stop_sequence: 5, boardings: 10, alightings: 0, onboard_after: 70, measurement_method: 'synthetic', source_label: 'synthetic' } // missing from stop_times
  ];

  // Evaluate at T_eval = 08:15:00
  const occReplay = calculatePassengerOccupancy({
    passengerLoads: testLoadsOcc,
    vehicles: testVehicles,
    scheduledTrips: [testTripOcc],
    stopTimes: testStopTimesOcc,
    assumptions,
    evaluationTime: '2025-03-10T08:15:00'
  });

  assert(
    'Occupancy Anti-Lookahead: stop with actual_arrival before T_eval is included',
    occReplay.some((o) => o.stopSequence === 1 && o.occupancyPct === 75.0),
    'Stop 1 before T_eval was not included'
  );

  assert(
    'Occupancy Anti-Lookahead: stop with actual_arrival exactly at T_eval is included',
    occReplay.some((o) => o.stopSequence === 2 && o.occupancyPct === 100.0),
    'Stop 2 at T_eval was not included'
  );

  assert(
    'Occupancy Anti-Lookahead: stop with actual_arrival after T_eval is strictly excluded',
    !occReplay.some((o) => o.stopSequence === 3),
    'Stop 3 (future) was incorrectly included'
  );

  assert(
    'Occupancy Anti-Lookahead: stop with null actual_arrival is excluded in replay mode',
    !occReplay.some((o) => o.stopSequence === 4),
    'Stop 4 (null actual) was incorrectly included'
  );

  assert(
    'Occupancy Anti-Lookahead: load without corresponding stop-time record is excluded in replay mode',
    !occReplay.some((o) => o.stopSequence === 5),
    'Stop 5 (missing stop_time) was incorrectly included'
  );

  // 4.3 Null load & zero capacity guards
  const testLoadsNullAndCap: PassengerLoad[] = [
    { trip_id: 'T-OCC-1', stop_id: 's1', stop_sequence: 1, boardings: 0, alightings: 0, onboard_after: null, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-OCC-2', stop_id: 's1', stop_sequence: 1, boardings: 40, alightings: 0, onboard_after: 40, measurement_method: 'synthetic', source_label: 'synthetic' }
  ];
  const occNullCap = calculatePassengerOccupancy({
    passengerLoads: testLoadsNullAndCap,
    vehicles: testVehicles,
    scheduledTrips: [
      testTripOcc,
      { ...testTripOcc, trip_id: 'T-OCC-2', bus_id: 'BUS-V2' } // BUS-V2 has 0 capacity
    ],
    stopTimes: testStopTimesOcc
  });
  assert(
    'Occupancy: null onboard_after returns "Load data unavailable" and is never treated as zero',
    occNullCap[0].level === 'unavailable' &&
      occNullCap[0].statusText === 'Load data unavailable' &&
      occNullCap[0].occupancyPct === null,
    `Result: ${JSON.stringify(occNullCap[0])}`
  );
  assert(
    'Occupancy: zero/invalid capacity produces data error',
    occNullCap[1].level === 'error' &&
      occNullCap[1].statusText.includes('capacity invalid') &&
      occNullCap[1].occupancyPct === null,
    `Result: ${JSON.stringify(occNullCap[1])}`
  );

  // 4.4 Crowding alerts never carry UNKNOWN timestamp
  const alertCheck = detectCrowdingAlerts(occReplay);
  assert(
    'Crowding Alerts: verified actual timestamps are present on all generated alerts (no UNKNOWN)',
    alertCheck.length > 0 && alertCheck.every((a) => a.timestamp && a.timestamp !== 'UNKNOWN'),
    `Alerts: ${JSON.stringify(alertCheck)}`
  );

  // 4.5 Frequency Increase Recommendation: Complete Sequence & Adjacency Tests
  // Case A: 3 genuinely consecutive stops (seq 1, 2, 3) with severe overcrowding -> RECOMMENDED
  const loadsConsecutive3: PassengerLoad[] = [
    { trip_id: 'T-FREQ', stop_id: 's1', stop_sequence: 1, boardings: 90, alightings: 0, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's2', stop_sequence: 2, boardings: 5, alightings: 5, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's3', stop_sequence: 3, boardings: 5, alightings: 5, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' }
  ];
  const freqTrip: ScheduledTrip = {
    trip_id: 'T-FREQ',
    route_id: 'silk-board-hebbal',
    direction: 'UP',
    bus_id: 'BUS-V1',
    scheduled_departure: '2025-03-10T08:00:00',
    scheduled_arrival: '2025-03-10T08:55:00',
    final_outcome: 'operated',
    final_outcome_reason: null,
    final_outcome_recorded_at: null,
    source_label: 'synthetic'
  };

  const recConsecutive = evaluateFrequencyIncreaseRecommendation({
    tripId: 'T-FREQ',
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    tripLoads: loadsConsecutive3,
    vehicles: testVehicles,
    scheduledTrips: [freqTrip],
    assumptions
  });
  assert(
    'Frequency Increase: 3 genuinely consecutive stops (seq 1, 2, 3) triggers recommendation',
    recConsecutive.status === 'recommended' &&
      recConsecutive.consecutiveSeverelyOvercrowdedStops.length === 3,
    `Status: ${recConsecutive.status}`
  );

  // Case B: 3 severe loads with a missing sequence between them (e.g. 1, 3, 4) -> NOT consecutive -> insufficient_data
  const loadsGapSeq: PassengerLoad[] = [
    { trip_id: 'T-FREQ', stop_id: 's1', stop_sequence: 1, boardings: 90, alightings: 0, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    // sequence 2 is missing!
    { trip_id: 'T-FREQ', stop_id: 's3', stop_sequence: 3, boardings: 5, alightings: 5, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's4', stop_sequence: 4, boardings: 5, alightings: 5, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' }
  ];
  const recGapSeq = evaluateFrequencyIncreaseRecommendation({
    tripId: 'T-FREQ',
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    tripLoads: loadsGapSeq,
    vehicles: testVehicles,
    scheduledTrips: [freqTrip],
    assumptions
  });
  assert(
    'Frequency Increase: non-consecutive sequence (1, 3, 4) rejects recommendation and returns insufficient_data',
    recGapSeq.status === 'insufficient_data',
    `Status was ${recGapSeq.status}`
  );

  // Case C: Intermediate stop has null load -> insufficient_data
  const loadsNullIntermediate: PassengerLoad[] = [
    { trip_id: 'T-FREQ', stop_id: 's1', stop_sequence: 1, boardings: 90, alightings: 0, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's2', stop_sequence: 2, boardings: 5, alightings: 5, onboard_after: null, measurement_method: 'synthetic', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's3', stop_sequence: 3, boardings: 5, alightings: 5, onboard_after: 90, measurement_method: 'synthetic', source_label: 'synthetic' }
  ];
  const recNullInter = evaluateFrequencyIncreaseRecommendation({
    tripId: 'T-FREQ',
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    tripLoads: loadsNullIntermediate,
    vehicles: testVehicles,
    scheduledTrips: [freqTrip],
    assumptions
  });
  assert(
    'Frequency Increase: null load in intermediate stop returns insufficient_data',
    recNullInter.status === 'insufficient_data',
    `Status was ${recNullInter.status}`
  );

  // Case D: Replay mode where 3rd stop arrival is in the future -> insufficient_data
  const stopTimesFuture3: StopTime[] = [
    { trip_id: 'T-FREQ', stop_id: 's1', stop_sequence: 1, scheduled_arrival: '08:00', actual_arrival: '2025-03-10T08:00:00', scheduled_departure: '08:00', actual_departure: '08:00', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's2', stop_sequence: 2, scheduled_arrival: '08:10', actual_arrival: '2025-03-10T08:10:00', scheduled_departure: '08:10', actual_departure: '08:10', source_label: 'synthetic' },
    { trip_id: 'T-FREQ', stop_id: 's3', stop_sequence: 3, scheduled_arrival: '08:20', actual_arrival: '2025-03-10T08:20:00', scheduled_departure: '08:20', actual_departure: '08:20', source_label: 'synthetic' }
  ];
  const recReplayFuture = evaluateFrequencyIncreaseRecommendation({
    tripId: 'T-FREQ',
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    tripLoads: loadsConsecutive3,
    vehicles: testVehicles,
    scheduledTrips: [freqTrip],
    stopTimes: stopTimesFuture3,
    assumptions,
    evaluationTime: '2025-03-10T08:15:00' // Stop 3 is at 08:20 (future -> not yet observed)
  });
  assert(
    'Frequency Increase: future stop arrival is excluded in replay mode, returning insufficient_data',
    recReplayFuture.status === 'insufficient_data',
    `Status was ${recReplayFuture.status}`
  );

  // 4.6 Dataset-wide occupancy calculation using approved dataset
  const datasetOccupancy = calculatePassengerOccupancy({
    passengerLoads,
    vehicles,
    scheduledTrips,
    stopTimes,
    assumptions
  });
  assert(
    'Occupancy: successfully evaluates all 924 passenger-load records from the approved dataset',
    datasetOccupancy.length === 924,
    `Evaluated count was ${datasetOccupancy.length}`
  );

  // ========================================================
  // 5. SCHEDULE PERFORMANCE & ON-TIME PERFORMANCE
  // ========================================================
  console.log('\n=== TEST SUITE 5: SCHEDULE PERFORMANCE & ON-TIME PERFORMANCE ===');

  // 5.1 Arrival delay calculations: late (+), early (-), on-time (0)
  const delayLate = calculateArrivalDelay('T1', 'S1', 1, '2025-03-10T08:00:00', '2025-03-10T08:03:00', 120);
  assert(
    'Delay: +180s is late (positive delay)',
    delayLate.delaySeconds === 180 && delayLate.status === 'late',
    `Delay: ${delayLate.delaySeconds}`
  );

  const delayEarly = calculateArrivalDelay('T1', 'S1', 1, '2025-03-10T08:00:00', '2025-03-10T07:57:00', 120);
  assert(
    'Delay: -180s is early (negative delay)',
    delayEarly.delaySeconds === -180 && delayEarly.status === 'early',
    `Delay: ${delayEarly.delaySeconds}`
  );

  const delayOnTime = calculateArrivalDelay('T1', 'S1', 1, '2025-03-10T08:00:00', '2025-03-10T08:01:00', 120);
  assert(
    'Delay: +60s is on-time (within 120s threshold)',
    delayOnTime.delaySeconds === 60 && delayOnTime.status === 'on_time',
    `Delay: ${delayOnTime.delaySeconds}`
  );

  // 5.2 On-Time Performance across complete corridor
  const otpResult = calculateOnTimePerformance({
    routeId: 'silk-board-hebbal',
    stopTimes,
    scheduledTrips,
    thresholdSeconds: 120
  });
  assert(
    'On-Time Performance: denominator includes strictly known delay visits (924 operated visits)',
    otpResult.totalKnownVisits === 924 &&
      otpResult.onTimeVisits + otpResult.lateVisits + otpResult.earlyVisits === 924 &&
      otpResult.onTimePct > 0,
    `OTP Result: ${JSON.stringify(otpResult)}`
  );

  // ========================================================
  // 6. OPERATIONAL KPIS & BASELINE RECONCILIATION
  // ========================================================
  console.log('\n=== TEST SUITE 6: OPERATIONAL KPIS & BASELINE RECONCILIATION ===');

  // 6.1 End-of-Day historical baseline KPIs
  const kpis = calculateCorridorKpis({ scheduledTrips });
  assert(
    'KPIs: total scheduled trips is exactly 86',
    kpis.totalScheduledTrips === 86,
    `Found ${kpis.totalScheduledTrips}`
  );
  assert(
    'KPIs: operated trips is exactly 77 (fulfillment rate 89.53%)',
    kpis.operatedTrips === 77 && kpis.fulfillmentRatePct === 89.53,
    `Operated: ${kpis.operatedTrips}, rate: ${kpis.fulfillmentRatePct}%`
  );
  assert(
    'KPIs: cancelled trips is exactly 2 (cancellation rate 2.33%)',
    kpis.cancelledTrips === 2 && kpis.cancellationRatePct === 2.33,
    `Cancelled: ${kpis.cancelledTrips}, rate: ${kpis.cancellationRatePct}%`
  );
  assert(
    'KPIs: resource shortfall trips is exactly 7 (shortfall rate 8.14%)',
    kpis.resourceShortfallTrips === 7 && kpis.resourceShortfallRatePct === 8.14,
    `Shortfall: ${kpis.resourceShortfallTrips}, rate: ${kpis.resourceShortfallRatePct}%`
  );
  assert(
    'KPIs: combined non-operated rate is exactly 10.47%',
    kpis.combinedNonOperatedRatePct === 10.47,
    `Combined rate: ${kpis.combinedNonOperatedRatePct}%`
  );

  // 6.2 As-of Replay fleet status at morning evaluation time 08:24:00
  const replayStatus0824 = calculateReplayCorridorStatus({
    scheduledTrips,
    stopTimes,
    evaluationTime: '2025-03-10T08:24:00'
  });
  assert(
    'Replay Status: at 08:24:00 distinguishes active, completed, scheduled, and cancelled trips',
    replayStatus0824.totalScheduledTrips === 86 &&
      replayStatus0824.cancelledCount === 1 && // T-UP-008 logged at 08:10
      replayStatus0824.scheduledCount > 0 &&
      replayStatus0824.inProgressCount > 0,
    `Replay status at 08:24: ${JSON.stringify(replayStatus0824)}`
  );

  // 6.3 Replay KPI fulfillment logic: completed vs in-progress vs future
  const syntheticKpiTrips: ScheduledTrip[] = [
    {
      trip_id: 'T-COMP-1',
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      bus_id: 'BUS-01',
      scheduled_departure: '2025-03-10T07:00:00',
      scheduled_arrival: '2025-03-10T07:55:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-PROG-1',
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      bus_id: 'BUS-02',
      scheduled_departure: '2025-03-10T08:00:00',
      scheduled_arrival: '2025-03-10T08:55:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    },
    {
      trip_id: 'T-FUT-1',
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      bus_id: 'BUS-03',
      scheduled_departure: '2025-03-10T09:00:00',
      scheduled_arrival: '2025-03-10T09:55:00',
      final_outcome: 'operated',
      final_outcome_reason: null,
      final_outcome_recorded_at: null,
      source_label: 'synthetic'
    }
  ];

  const syntheticKpiStopTimes: StopTime[] = [
    // T-COMP-1: Completed before 08:30:00 (seq 12 arrival at 07:55:00)
    { trip_id: 'T-COMP-1', stop_id: 's1', stop_sequence: 1, scheduled_arrival: '2025-03-10T07:00:00', actual_arrival: '2025-03-10T07:00:00', scheduled_departure: '2025-03-10T07:00:00', actual_departure: '2025-03-10T07:00:00', source_label: 'synthetic' },
    { trip_id: 'T-COMP-1', stop_id: 's12', stop_sequence: 12, scheduled_arrival: '2025-03-10T07:55:00', actual_arrival: '2025-03-10T07:55:00', scheduled_departure: '2025-03-10T07:55:00', actual_departure: '2025-03-10T07:55:00', source_label: 'synthetic' },

    // T-PROG-1: Departed sequence 1 at 08:00:00, seq 12 arrival is 08:55:00 (> 08:30:00) -> in-progress
    { trip_id: 'T-PROG-1', stop_id: 's1', stop_sequence: 1, scheduled_arrival: '2025-03-10T08:00:00', actual_arrival: '2025-03-10T08:00:00', scheduled_departure: '2025-03-10T08:00:00', actual_departure: '2025-03-10T08:00:00', source_label: 'synthetic' },
    { trip_id: 'T-PROG-1', stop_id: 's12', stop_sequence: 12, scheduled_arrival: '2025-03-10T08:55:00', actual_arrival: '2025-03-10T08:55:00', scheduled_departure: '2025-03-10T08:55:00', actual_departure: '2025-03-10T08:55:00', source_label: 'synthetic' },

    // T-FUT-1: Scheduled in the future (09:00:00 > 08:30:00) -> scheduled
    { trip_id: 'T-FUT-1', stop_id: 's1', stop_sequence: 1, scheduled_arrival: '2025-03-10T09:00:00', actual_arrival: '2025-03-10T09:00:00', scheduled_departure: '2025-03-10T09:00:00', actual_departure: '2025-03-10T09:00:00', source_label: 'synthetic' },
    { trip_id: 'T-FUT-1', stop_id: 's12', stop_sequence: 12, scheduled_arrival: '2025-03-10T09:55:00', actual_arrival: '2025-03-10T09:55:00', scheduled_departure: '2025-03-10T09:55:00', actual_departure: '2025-03-10T09:55:00', source_label: 'synthetic' }
  ];

  const replayKpis = calculateCorridorKpis({
    scheduledTrips: syntheticKpiTrips,
    stopTimes: syntheticKpiStopTimes,
    evaluationTime: '2025-03-10T08:30:00'
  });

  assert(
    'Replay KPIs: completed trip counts as fulfilled (1 operated trip, 33.33% fulfillment rate)',
    replayKpis.operatedTrips === 1 && replayKpis.fulfillmentRatePct === 33.33,
    `Operated: ${replayKpis.operatedTrips}, rate: ${replayKpis.fulfillmentRatePct}%`
  );
  assert(
    'Replay KPIs: in-progress trip does not count as fulfilled/operated',
    replayKpis.operatedTrips === 1 && replayKpis.totalScheduledTrips === 3,
    `Expected exactly 1 completed operated trip out of 3 scheduled`
  );
  assert(
    'Replay KPIs: future scheduled trip does not count as fulfilled/operated',
    replayKpis.operatedTrips === 1,
    `Expected future trip not to increment operated count`
  );

  // 6.4 Missing stopTimes with evaluationTime throws an explicit error
  let missingStopTimesErrorThrown = false;
  try {
    calculateCorridorKpis({
      scheduledTrips,
      evaluationTime: '2025-03-10T08:24:00'
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('stopTimes') && err.message.includes('required')) {
      missingStopTimesErrorThrown = true;
    }
  }
  assert(
    'KPIs: omitting stopTimes with evaluationTime throws an explicit error without falling back to historical outcomes',
    missingStopTimesErrorThrown,
    'Expected calculateCorridorKpis to throw when stopTimes is omitted with evaluationTime'
  );

  // ========================================================
  // 7. GPS FRESHNESS & FLEET AVAILABILITY
  // ========================================================
  console.log('\n=== TEST SUITE 7: GPS FRESHNESS & FLEET AVAILABILITY ===');

  // 7.1 Fresh GPS at 08:24:00
  const freshness0s = evaluateGpsFreshness({
    busId: 'BUS-07',
    busPositions,
    evaluationTime: '2025-03-10T08:24:00'
  });
  assert(
    'GPS: 0s age telemetry is fresh general and fresh dwelling',
    freshness0s.status === 'fresh' &&
      freshness0s.ageSeconds === 0 &&
      freshness0s.isFreshGeneral === true &&
      freshness0s.isFreshDwelling === true,
    `Freshness: ${JSON.stringify(freshness0s)}`
  );

  // 7.2 Stale GPS (> 300s)
  const freshnessStale = evaluateGpsFreshness({
    busId: 'BUS-07',
    busPositions,
    evaluationTime: '2025-03-10T10:00:00'
  });
  assert(
    'GPS: 48-minute-old telemetry is stale (> 300s)',
    freshnessStale.status === 'stale' &&
      freshnessStale.isFreshGeneral === false &&
      freshnessStale.isFreshDwelling === false &&
      (freshnessStale.ageSeconds ?? 0) > 300,
    `Freshness: ${JSON.stringify(freshnessStale)}`
  );

  // 7.3 GPS 5-minute boundary tests: exactly 300s vs 301s
  const syntheticGps: BusPosition[] = [
    {
      position_id: 'P-TEST',
      bus_id: 'B-TEST',
      trip_id: 'T-TEST',
      route_id: 'r1',
      direction: 'UP',
      timestamp: '2025-03-10T08:00:00',
      latitude: 12.9172,
      longitude: 77.623,
      speed_kmh: 0,
      source_label: 'synthetic'
    }
  ];
  const fresh300 = evaluateGpsFreshness({
    busId: 'B-TEST',
    busPositions: syntheticGps,
    evaluationTime: '2025-03-10T08:05:00' // exactly 300s
  });
  assert(
    'GPS: exactly 300s (5 minutes) is considered fresh general',
    fresh300.status === 'fresh' && fresh300.ageSeconds === 300 && fresh300.isFreshGeneral === true,
    `Age: ${fresh300.ageSeconds}`
  );

  const stale301 = evaluateGpsFreshness({
    busId: 'B-TEST',
    busPositions: syntheticGps,
    evaluationTime: '2025-03-10T08:05:01' // 301s
  });
  assert(
    'GPS: 301s (> 5 minutes) is considered stale',
    stale301.status === 'stale' && stale301.ageSeconds === 301 && stale301.isFreshGeneral === false,
    `Age: ${stale301.ageSeconds}`
  );

  // 7.4 Fleet Inventory
  const fleetInv = getFleetInventory(vehicles);
  assert(
    'Fleet: correctly categorizes 13 vehicles (9 active, 2 standby, 2 maintenance)',
    fleetInv.totalVehicles === 13 &&
      fleetInv.activeCount === 9 &&
      fleetInv.standbyCount === 2 &&
      fleetInv.maintenanceCount === 2,
    `Inventory: ${JSON.stringify(fleetInv)}`
  );

  // 7.5 Standby Driver Shift Coverage & Exact Boundaries
  // Shift 1: [06:00, 14:00); Shift 2: [14:00, 22:00)
  assert(
    'Shift Boundary: 14:00:00 (start of Shift 2) is on-shift for Shift 2',
    isShiftCovering('2025-03-10T14:00:00', '14:00', '22:00') === true
  );
  assert(
    'Shift Boundary: 14:00:00 (end of Shift 1) is off-shift for Shift 1 (end-exclusive)',
    isShiftCovering('2025-03-10T14:00:00', '06:00', '14:00') === false
  );
  assert(
    'Shift Boundary: 22:00:00 (end of Shift 2) is off-shift for Shift 2 (end-exclusive)',
    isShiftCovering('2025-03-10T22:00:00', '14:00', '22:00') === false
  );

  // 7.5b Standby Driver Availability function test
  const standbyAvail1815 = getStandbyDriverAvailability({
    crewAvailability,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Standby Drivers: correctly identifies 1 on-shift driver (CREW-24) and 1 off-shift driver (CREW-12) at 18:15:00',
    standbyAvail1815.onShiftStandbyDrivers.length === 1 &&
      standbyAvail1815.onShiftStandbyDrivers[0].crew_id === 'CREW-24' &&
      standbyAvail1815.offShiftStandbyDrivers.length === 1 &&
      standbyAvail1815.offShiftStandbyDrivers[0].crew_id === 'CREW-12',
    `Standby avail: ${JSON.stringify(standbyAvail1815)}`
  );

  // 7.6 Relief Recommendation: Correct terminal and vehicle (BUS-13 at hebbal-down)
  const reliefRec = evaluateReliefBusRecommendation({
    gapAlert: demoGap!,
    routeId: 'silk-board-hebbal',
    direction: 'DOWN',
    vehicles,
    crewAvailability,
    stops,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Relief Recommendation: confirms feasibility with BUS-13 at Hebbal and driver CREW-24',
    reliefRec.status === 'feasible' &&
      reliefRec.standbyBusId === 'BUS-13' &&
      reliefRec.standbyDriverId === 'CREW-24' &&
      reliefRec.recommendationText.includes('BUS-13 staged at Hebbal') &&
      reliefRec.limitationsDisclaimer.includes('Deadhead travel time'),
    `Relief result: ${JSON.stringify(reliefRec)}`
  );

  // 7.6b Relief Recommendation: Matching UP alert and UP deployment (BUS-12 and CREW-12 staged at Silk Board)
  const upGapAlert: import('../lib/engine/types').LargeGapAlert = {
    alert_type: 'large_gap',
    severity: 'warning',
    stop_id: 'silk-board-up',
    direction: 'UP',
    bus_id_leading: 'BUS-01',
    bus_id_trailing: 'BUS-02',
    trip_id_leading: 'T-UP-001',
    trip_id_trailing: 'T-UP-003',
    measured_seconds: 1440,
    nominal_scheduled_headway_seconds: 720,
    threshold_seconds: 1080,
    gap_type: 'terminal_departure_gap',
    timestamp: '2025-03-10T08:30:00'
  };
  const reliefRecUp = evaluateReliefBusRecommendation({
    gapAlert: upGapAlert,
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    vehicles,
    crewAvailability,
    stops,
    evaluationTime: '2025-03-10T08:30:00'
  });
  assert(
    'Relief Recommendation: matching UP alert and UP deployment confirms feasibility with BUS-12 and CREW-12 at Silk Board',
    reliefRecUp.status === 'feasible' &&
      reliefRecUp.standbyBusId === 'BUS-12' &&
      reliefRecUp.standbyDriverId === 'CREW-12' &&
      reliefRecUp.recommendationText.includes('BUS-12 staged at Silk Board'),
    `Relief UP result: ${JSON.stringify(reliefRecUp)}`
  );

  // 7.6c Relief Recommendation: DOWN alert with UP deployment direction mismatch
  const reliefRecDownAlertUpDeployment = evaluateReliefBusRecommendation({
    gapAlert: demoGap!,
    routeId: 'silk-board-hebbal',
    direction: 'UP',
    vehicles,
    crewAvailability,
    stops,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Relief Recommendation: DOWN alert with UP deployment returns unconfirmed with direction mismatch reason',
    reliefRecDownAlertUpDeployment.status === 'unconfirmed' &&
      reliefRecDownAlertUpDeployment.standbyBusId === null &&
      reliefRecDownAlertUpDeployment.standbyDriverId === null &&
      Boolean(reliefRecDownAlertUpDeployment.unconfirmedReason?.includes('Gap alert direction (DOWN) does not match proposed relief deployment direction (UP)')),
    `Result: ${JSON.stringify(reliefRecDownAlertUpDeployment)}`
  );

  // 7.6d Relief Recommendation: UP alert with DOWN deployment direction mismatch
  const reliefRecUpAlertDownDeployment = evaluateReliefBusRecommendation({
    gapAlert: upGapAlert,
    routeId: 'silk-board-hebbal',
    direction: 'DOWN',
    vehicles,
    crewAvailability,
    stops,
    evaluationTime: '2025-03-10T08:30:00'
  });
  assert(
    'Relief Recommendation: UP alert with DOWN deployment returns unconfirmed with direction mismatch reason',
    reliefRecUpAlertDownDeployment.status === 'unconfirmed' &&
      reliefRecUpAlertDownDeployment.standbyBusId === null &&
      reliefRecUpAlertDownDeployment.standbyDriverId === null &&
      Boolean(reliefRecUpAlertDownDeployment.unconfirmedReason?.includes('Gap alert direction (UP) does not match proposed relief deployment direction (DOWN)')),
    `Result: ${JSON.stringify(reliefRecUpAlertDownDeployment)}`
  );

  // 7.7 Relief Recommendation: Missing origin terminal returns unconfirmed (no fallback to gapAlert.stop_id)
  const stopsWithoutOrigin = stops.filter(
    (s) => !(s.route_id === 'silk-board-hebbal' && s.direction === 'DOWN' && s.sequence === 1)
  );
  const reliefMissingOrigin = evaluateReliefBusRecommendation({
    gapAlert: demoGap!,
    routeId: 'silk-board-hebbal',
    direction: 'DOWN',
    vehicles,
    crewAvailability,
    stops: stopsWithoutOrigin,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Relief Recommendation: missing origin terminal returns unconfirmed without fallback',
    reliefMissingOrigin.status === 'unconfirmed' &&
      Boolean(reliefMissingOrigin.unconfirmedReason?.includes('origin terminal not found')),
    `Status: ${reliefMissingOrigin.status}, reason: ${reliefMissingOrigin.unconfirmedReason}`
  );

  // 7.8 Relief Recommendation: Standby bus at wrong terminal
  const vehiclesWrongTerminal = vehicles.map((v) =>
    v.bus_id === 'BUS-13' ? { ...v, current_location_stop_id: 'silk-board-up' } : v
  );
  const reliefWrongTerminal = evaluateReliefBusRecommendation({
    gapAlert: demoGap!,
    routeId: 'silk-board-hebbal',
    direction: 'DOWN',
    vehicles: vehiclesWrongTerminal,
    crewAvailability,
    stops,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Relief Recommendation: standby vehicle at wrong terminal returns unconfirmed',
    reliefWrongTerminal.status === 'unconfirmed' &&
      Boolean(reliefWrongTerminal.unconfirmedReason?.includes('incompatible with route direction')),
    `Reason: ${reliefWrongTerminal.unconfirmedReason}`
  );

  // 7.9 Relief Recommendation: Driver outside shift
  const crewOutsideShift = crewAvailability.map((c) =>
    c.crew_id === 'CREW-24' ? { ...c, shift_start: '06:00', shift_end: '14:00' } : c
  );
  const reliefDriverOffShift = evaluateReliefBusRecommendation({
    gapAlert: demoGap!,
    routeId: 'silk-board-hebbal',
    direction: 'DOWN',
    vehicles,
    crewAvailability: crewOutsideShift,
    stops,
    evaluationTime: '2025-03-10T18:15:00'
  });
  assert(
    'Relief Recommendation: driver outside shift returns unconfirmed',
    reliefDriverOffShift.status === 'unconfirmed' &&
      Boolean(reliefDriverOffShift.unconfirmedReason?.includes('No standby driver currently on shift')),
    `Reason: ${reliefDriverOffShift.unconfirmedReason}`
  );

  // ========================================================
  // 8. REPLAY STATE & TELEMETRY IDENTITY PROTECTIONS
  // ========================================================
  console.log('\n=== TEST SUITE 8: REPLAY STATE & ANTI-LOOKAHEAD PROTECTIONS ===');

  // 8.1 Replay lifecycle status
  const tripDN33 = scheduledTrips.find((t) => t.trip_id === 'T-DN-033')!;
  const dn33StopTimes = stopTimes.filter((st) => st.trip_id === 'T-DN-033');

  const dn33At1730 = deriveTripReplayStatus(tripDN33, dn33StopTimes, '2025-03-10T17:30:00');
  assert(
    'Replay: before cancellation recorded time, trip status is "scheduled"',
    dn33At1730 === 'scheduled',
    `Status was ${dn33At1730}`
  );

  const dn33At1745 = deriveTripReplayStatus(tripDN33, dn33StopTimes, '2025-03-10T17:45:00');
  assert(
    'Replay: after cancellation recorded time, trip status is "cancelled"',
    dn33At1745 === 'cancelled',
    `Status was ${dn33At1745}`
  );

  // 8.2 Strict dwelling state: correct bus AND trip telemetry confirms dwelling
  const b07Trip = scheduledTrips.find((t) => t.trip_id === 'T-UP-007')!;
  const b07StopTimes = stopTimes.filter((st) => st.trip_id === 'T-UP-007');

  const dwellingAt0824 = evaluateDwellingState({
    busId: 'BUS-07',
    tripId: 'T-UP-007',
    stopId: 'marathahalli-up',
    stop: marathahalliStop,
    trip: b07Trip,
    tripStopTimes: b07StopTimes,
    busPositions,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });
  assert(
    'Dwelling Telemetry Identity: correct bus AND trip telemetry confirms dwelling',
    dwellingAt0824.isDwelling === true &&
      dwellingAt0824.speedKmh === 0 &&
      (dwellingAt0824.distanceMeters ?? 999) <= 100 &&
      (dwellingAt0824.telemetryAgeSeconds ?? 999) <= 60,
    `Dwelling result: ${JSON.stringify(dwellingAt0824)}`
  );

  // 8.3 Same bus but DIFFERENT trip telemetry does NOT confirm dwelling
  const fakePositionsDiffTrip: BusPosition[] = [
    {
      position_id: 'P-DIFF',
      bus_id: 'BUS-07',
      trip_id: 'T-UP-099', // different trip!
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      timestamp: '2025-03-10T08:24:00',
      latitude: marathahalliStop.lat,
      longitude: marathahalliStop.lon,
      speed_kmh: 0,
      source_label: 'synthetic'
    }
  ];
  const dwellingDiffTrip = evaluateDwellingState({
    busId: 'BUS-07',
    tripId: 'T-UP-007',
    stopId: 'marathahalli-up',
    stop: marathahalliStop,
    trip: b07Trip,
    tripStopTimes: b07StopTimes,
    busPositions: fakePositionsDiffTrip,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });
  assert(
    'Dwelling Telemetry Identity: same bus but different trip telemetry does NOT confirm dwelling',
    dwellingDiffTrip.isDwelling === false &&
      dwellingDiffTrip.reasons.some((r) => r.includes('No GPS telemetry available for bus BUS-07 on trip T-UP-007')),
    `Reasons: ${dwellingDiffTrip.reasons.join(', ')}`
  );

  // 8.4 Future GPS record is excluded
  const fakePositionsFuture: BusPosition[] = [
    {
      position_id: 'P-FUT',
      bus_id: 'BUS-07',
      trip_id: 'T-UP-007',
      route_id: 'silk-board-hebbal',
      direction: 'UP',
      timestamp: '2025-03-10T08:24:01', // 1s in the future
      latitude: marathahalliStop.lat,
      longitude: marathahalliStop.lon,
      speed_kmh: 0,
      source_label: 'synthetic'
    }
  ];
  const dwellingFuture = evaluateDwellingState({
    busId: 'BUS-07',
    tripId: 'T-UP-007',
    stopId: 'marathahalli-up',
    stop: marathahalliStop,
    trip: b07Trip,
    tripStopTimes: b07StopTimes,
    busPositions: fakePositionsFuture,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });
  assert(
    'Dwelling Telemetry Identity: future GPS observation is excluded, yielding dwelling=false',
    dwellingFuture.isDwelling === false,
    `Dwelling: ${dwellingFuture.isDwelling}`
  );

  // 8.5 Supplied busId / tripId mismatch with scheduled trip
  const dwellingMismatch = evaluateDwellingState({
    busId: 'BUS-99', // mismatch!
    tripId: 'T-UP-007',
    stopId: 'marathahalli-up',
    stop: marathahalliStop,
    trip: b07Trip,
    tripStopTimes: b07StopTimes,
    busPositions,
    evaluationTime: '2025-03-10T08:24:00',
    assumptions
  });
  assert(
    'Dwelling Telemetry Identity: busId mismatch with scheduled trip yields dwelling=false',
    dwellingMismatch.isDwelling === false &&
      dwellingMismatch.reasons.some((r) => r.includes('does not match trip assigned vehicle')),
    `Reasons: ${dwellingMismatch.reasons.join(', ')}`
  );

  // ========================================================
  // FINAL SUMMARY
  // ========================================================
  console.log('\n============================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL ENGINE CHECKS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.error('ENGINE TEST SUITE FAILED!');
    process.exit(1);
  } else {
    console.log('ALL ENGINE CHECKS PASSED CLEANLY! ✅');
  }
}

runEngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
