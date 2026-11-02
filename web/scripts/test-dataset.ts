import {
  getCompleteDataset,
  validateDemoDataset,
  getRoutes,
  getStops,
  getScheduledTrips,
  getStopTimes,
  getPassengerLoads,
  getBusPositions,
  getVehicles,
  getCrewAvailability,
  getDemoAssumptions,
  clearDatasetCache,
  REQUIRED_DATASET_FILES
} from '../lib/dataset';
import {
  parseRoutesCsv,
  parseStopsCsv,
  parseScheduledTripsCsv,
  parseStopTimesCsv,
  parsePassengerLoadsCsv,
  parseBusPositionsCsv,
  parseVehiclesCsv,
  parseCrewAvailabilityCsv,
  parseDemoAssumptionsJson,
  isValidCalendarTimestamp
} from '../lib/dataset/parser';
import fs from 'fs';
import path from 'path';

async function runParserTests() {
  console.log('--- TEST SUITE 1: PARSER UNIT & CALENDAR VALIDATION TESTS ---');

  let passed = 0;
  let total = 0;

  function check(label: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  [PASS] ${label}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [FAIL] ${label}: ${msg}`);
      throw err;
    }
  }

  // 1. Calendar component tests
  check('Calendar: accept valid leap day 2024-02-29T12:00:00', () => {
    if (!isValidCalendarTimestamp('2024-02-29T12:00:00')) throw new Error('Expected true');
  });

  check('Calendar: accept valid year in 0000-0099 range (0025-03-10T10:00:00)', () => {
    if (!isValidCalendarTimestamp('0025-03-10T10:00:00')) throw new Error('Expected true');
  });

  check('Calendar: accept leap day in year 0000 (0000-02-29T10:00:00)', () => {
    if (!isValidCalendarTimestamp('0000-02-29T10:00:00')) throw new Error('Expected true');
  });

  check('Calendar: reject non-leap day in year 0001 (0001-02-29T10:00:00)', () => {
    if (isValidCalendarTimestamp('0001-02-29T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject February 30 (2025-02-30T10:00:00)', () => {
    if (isValidCalendarTimestamp('2025-02-30T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject February 31 (2025-02-31T10:00:00)', () => {
    if (isValidCalendarTimestamp('2025-02-31T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject non-leap year February 29 (2025-02-29T10:00:00)', () => {
    if (isValidCalendarTimestamp('2025-02-29T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject 31st on 30-day month (2025-04-31T10:00:00)', () => {
    if (isValidCalendarTimestamp('2025-04-31T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject month 13 (2025-13-10T10:00:00)', () => {
    if (isValidCalendarTimestamp('2025-13-10T10:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject hour 24 (2025-03-10T24:00:00)', () => {
    if (isValidCalendarTimestamp('2025-03-10T24:00:00')) throw new Error('Expected false');
  });

  check('Calendar: reject minute 60 (2025-03-10T10:60:00)', () => {
    if (isValidCalendarTimestamp('2025-03-10T10:60:00')) throw new Error('Expected false');
  });

  // 2. CSV parsing and header validation
  const demoDir = fs.existsSync(path.resolve(process.cwd(), 'data', 'demo'))
    ? path.resolve(process.cwd(), 'data', 'demo')
    : path.resolve(process.cwd(), '..', 'data', 'demo');

  const routesCsv = fs.readFileSync(path.join(demoDir, 'routes.csv'), 'utf8');
  check('Parse routes.csv (1 row)', () => {
    const res = parseRoutesCsv(routesCsv);
    if (res.length !== 1) throw new Error('Count mismatch');
  });

  const tripsCsv = fs.readFileSync(path.join(demoDir, 'scheduled_trips.csv'), 'utf8');
  check('Parse scheduled_trips.csv (86 rows)', () => {
    const res = parseScheduledTripsCsv(tripsCsv);
    if (res.length !== 86) throw new Error('Count mismatch');
  });

  const stopsCsv = fs.readFileSync(path.join(demoDir, 'stops.csv'), 'utf8');
  check('Parse stops.csv (24 rows)', () => {
    const res = parseStopsCsv(stopsCsv);
    if (res.length !== 24) throw new Error('Count mismatch');
  });

  const stopTimesCsv = fs.readFileSync(path.join(demoDir, 'stop_times.csv'), 'utf8');
  check('Parse stop_times.csv (1032 rows)', () => {
    const res = parseStopTimesCsv(stopTimesCsv);
    if (res.length !== 1032) throw new Error('Count mismatch');
  });

  const loadsCsv = fs.readFileSync(path.join(demoDir, 'passenger_loads.csv'), 'utf8');
  check('Parse passenger_loads.csv (924 rows)', () => {
    const res = parsePassengerLoadsCsv(loadsCsv);
    if (res.length !== 924) throw new Error('Count mismatch');
  });

  const posCsv = fs.readFileSync(path.join(demoDir, 'bus_positions.csv'), 'utf8');
  check('Parse bus_positions.csv (4376 rows)', () => {
    const res = parseBusPositionsCsv(posCsv);
    if (res.length !== 4376) throw new Error('Count mismatch');
  });

  const vehCsv = fs.readFileSync(path.join(demoDir, 'vehicles.csv'), 'utf8');
  check('Parse vehicles.csv (13 rows)', () => {
    const res = parseVehiclesCsv(vehCsv);
    if (res.length !== 13) throw new Error('Count mismatch');
  });

  const crewCsv = fs.readFileSync(path.join(demoDir, 'crew_availability.csv'), 'utf8');
  check('Parse crew_availability.csv (24 rows)', () => {
    const res = parseCrewAvailabilityCsv(crewCsv);
    if (res.length !== 24) throw new Error('Count mismatch');
  });

  check('Scheduled trips: reject malformed timestamp (space separator)', () => {
    const bad = tripsCsv.replace('2025-03-10T07:00:00', '2025-03-10 07:00:00');
    let threw = false;
    try { parseScheduledTripsCsv(bad); } catch { threw = true; }
    if (!threw) throw new Error('Expected parse error');
  });

  check('Scheduled trips: reject Feb 30 timestamp', () => {
    const bad = tripsCsv.replace('2025-03-10T07:00:00', '2025-02-30T07:00:00');
    let threw = false;
    try { parseScheduledTripsCsv(bad); } catch { threw = true; }
    if (!threw) throw new Error('Expected parse error');
  });

  check('Stops: reject missing CSV header', () => {
    const bad = stopsCsv.replace('is_control_point', 'control_point');
    let threw = false;
    try { parseStopsCsv(bad); } catch { threw = true; }
    if (!threw) throw new Error('Expected header validation error');
  });

  // 3. Assumptions JSON parsing and nullable fields
  const assumptionsJson = fs.readFileSync(path.join(demoDir, 'demo_assumptions.json'), 'utf8');
  check('Parse demo_assumptions.json with explicit nulls', () => {
    const res = parseDemoAssumptionsJson(assumptionsJson);
    if (res.financial.cost_per_bus_hour_inr !== null || res.financial.trips_per_hour !== null) {
      throw new Error('Expected explicit nulls');
    }
  });

  check('Assumptions: reject missing required property cost_per_bus_hour_inr', () => {
    const obj = JSON.parse(assumptionsJson);
    delete obj.financial.cost_per_bus_hour_inr;
    let threw = false;
    try { parseDemoAssumptionsJson(JSON.stringify(obj)); } catch { threw = true; }
    if (!threw) throw new Error('Expected missing property error');
  });

  check('Assumptions: reject missing required property trips_per_hour', () => {
    const obj = JSON.parse(assumptionsJson);
    delete obj.financial.trips_per_hour;
    let threw = false;
    try { parseDemoAssumptionsJson(JSON.stringify(obj)); } catch { threw = true; }
    if (!threw) throw new Error('Expected missing property error');
  });

  console.log(`Parser unit tests: all ${passed}/${total} checks passed.\n`);
}

async function runDatasetLoadingTest() {
  console.log('--- TEST SUITE 2: DATASET LOADING TEST ---');
  clearDatasetCache();

  // 1. Verify list of 9 required files
  console.log('Verifying required file list (9 files):', REQUIRED_DATASET_FILES);
  if (REQUIRED_DATASET_FILES.length !== 9) {
    throw new Error(`Expected 9 required dataset files, found ${REQUIRED_DATASET_FILES.length}`);
  }

  // 2. Load complete dataset
  const dataset = await getCompleteDataset();

  console.log('Successfully loaded all nine dataset files:');
  console.log(`  1. routes.csv:           ${dataset.routes.length} records`);
  console.log(`  2. stops.csv:            ${dataset.stops.length} records`);
  console.log(`  3. scheduled_trips.csv:  ${dataset.scheduledTrips.length} records`);
  console.log(`  4. stop_times.csv:       ${dataset.stopTimes.length} records`);
  console.log(`  5. passenger_loads.csv:  ${dataset.passengerLoads.length} records`);
  console.log(`  6. bus_positions.csv:    ${dataset.busPositions.length} records`);
  console.log(`  7. vehicles.csv:         ${dataset.vehicles.length} records`);
  console.log(`  8. crew_availability.csv:${dataset.crewAvailability.length} records`);
  console.log(`  9. demo_assumptions.json: ${Boolean(dataset.assumptions._provenance)} (_provenance present)`);

  // 3. Test individual getters (they must route through getCompleteDataset())
  console.log('\nTesting individual validated getters:');
  const [routes, stops, trips, stopTimes, loads, positions, vehicles, crew, assumptions] = await Promise.all([
    getRoutes(),
    getStops(),
    getScheduledTrips(),
    getStopTimes(),
    getPassengerLoads(),
    getBusPositions(),
    getVehicles(),
    getCrewAvailability(),
    getDemoAssumptions()
  ]);

  if (routes.length !== 1) throw new Error('getRoutes() mismatch');
  if (stops.length !== 24) throw new Error('getStops() mismatch');
  if (trips.length !== 86) throw new Error('getScheduledTrips() mismatch');
  if (stopTimes.length !== 1032) throw new Error('getStopTimes() mismatch');
  if (loads.length !== 924) throw new Error('getPassengerLoads() mismatch');
  if (positions.length !== 4376) throw new Error('getBusPositions() mismatch');
  if (vehicles.length !== 13) throw new Error('getVehicles() mismatch');
  if (crew.length !== 24) throw new Error('getCrewAvailability() mismatch');
  if (!assumptions.headway) throw new Error('getDemoAssumptions() mismatch');

  console.log('All 9 individual validated getters succeeded.\n');
}

async function runDatasetValidationTest() {
  console.log('--- TEST SUITE 2: DATASET VALIDATION TEST ---');
  clearDatasetCache();

  // Test first-call validation report preservation
  const report = await validateDemoDataset();

  console.log(`Validation report status: valid=${report.valid}`);
  console.log(`Total checks:   ${report.totalChecks}`);
  console.log(`Passed checks:  ${report.passedChecks}`);
  console.log(`Failed checks:  ${report.failedChecks}`);
  console.log(`Error count:    ${report.errors.length}`);

  if (!report.valid || report.failedChecks > 0) {
    console.error('Validation failed with errors:\n', report.errors);
    throw new Error('Dataset validation test failed');
  }

  // Print all checks dynamically
  console.log('\nIndividual validation check breakdown:');
  report.checks.forEach((chk, i) => {
    console.log(`  ${i + 1}. [${chk.passed ? 'PASS' : 'FAIL'}] ${chk.checkName}: ${chk.message}`);
  });

  console.log(`\nAll ${report.totalChecks} dataset validation checks passed.\n`);
}

async function runConcurrentPromiseCacheTest() {
  console.log('--- TEST SUITE 3: IN-FLIGHT PROMISE DEDUPLICATION TEST ---');
  clearDatasetCache();

  // Fire 10 simultaneous requests before any cache is established
  console.log('Launching 10 concurrent getCompleteDataset() calls...');
  const concurrentRequests = Array.from({ length: 10 }, () => getCompleteDataset());
  const results = await Promise.all(concurrentRequests);

  // All 10 promises must resolve to the identical object reference
  const firstInstance = results[0];
  const allIdentical = results.every(res => res === firstInstance);

  if (!allIdentical) {
    throw new Error('In-flight Promise deduplication failed: multiple distinct dataset instances were created!');
  }

  console.log(`All 10 concurrent calls resolved to the exact same shared dataset reference: ${allIdentical}`);
  console.log('In-flight Promise cache verified successfully.\n');
}

async function main() {
  console.log('====================================================');
  console.log('HOGANA Server-Side Operational Dataset Test Suite');
  console.log('====================================================\n');

  await runParserTests();
  await runDatasetLoadingTest();
  await runDatasetValidationTest();
  await runConcurrentPromiseCacheTest();

  console.log('====================================================');
  console.log('ALL DATASET TESTS COMPLETED SUCCESSFULLY! ✅');
  console.log('====================================================');
}

main().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
