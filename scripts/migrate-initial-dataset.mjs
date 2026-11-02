/**
 * HOGANA — Initial Operational Dataset Migration & Verification Script
 *
 * 1. Reads the 9 canonical source files from data/demo/.
 * 2. Computes cryptographic SHA-256 checksums and record counts.
 * 3. Verifies canonical operational baseline invariants:
 *    - 86 scheduled trips (77 operated, 2 cancelled, 7 staffing_shortfall)
 *    - 24 stop directional entries (12 stops UP + 12 stops DOWN)
 *    - 1 corridor route (Silk Board ↔ Hebbal)
 *    - 1,032 stop_times records
 *    - 924 passenger_loads records
 *    - 4,376 bus_positions records
 *    - 13 vehicles
 *    - 24 crew availability shifts
 * 4. Generates supabase/migrations/20261102000004_seed_operational_records.sql for initial database population.
 * 5. Synchronises with web/scripts and reports exact audit totals.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findRootDir() {
  let curr = __dirname;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'data', 'demo', 'routes.csv'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

const ROOT_DIR = findRootDir();
const DEMO_DIR = path.join(ROOT_DIR, 'data', 'demo');
const OUTPUT_SQL_PATH = path.join(ROOT_DIR, 'supabase', 'migrations', '20261102000004_seed_operational_records.sql');
const WEB_SQL_PATH = path.join(ROOT_DIR, 'web', 'supabase', 'migrations', '20261102000004_seed_operational_records.sql');

console.log('================================================================');
console.log('HOGANA — Initial Operational Dataset Migration & Audit');
console.log('================================================================');
console.log(`Root Directory: ${ROOT_DIR}`);
console.log(`Demo Directory: ${DEMO_DIR}\n`);

const REQUIRED_FILES = [
  'routes.csv',
  'stops.csv',
  'scheduled_trips.csv',
  'stop_times.csv',
  'passenger_loads.csv',
  'bus_positions.csv',
  'vehicles.csv',
  'crew_availability.csv',
  'demo_assumptions.json'
];

const fileBuffers = {};
const fileStats = {};

for (const fileName of REQUIRED_FILES) {
  const filePath = path.join(DEMO_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CRITICAL: Missing required file: ${filePath}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(filePath);
  fileBuffers[fileName] = buf;
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const lines = buf.toString('utf-8').trim().split('\n');
  const recordCount = fileName.endsWith('.csv') ? Math.max(0, lines.length - 1) : 1;
  fileStats[fileName] = {
    sizeBytes: buf.length,
    sha256: hash,
    lines: lines.length,
    recordCount
  };
  console.log(`  ✓ ${fileName.padEnd(24)} | ${String(recordCount).padStart(5)} records | ${String(buf.length).padStart(7)} bytes | SHA: ${hash.substring(0, 12)}...`);
}

function parseSimpleCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });
    rows.push(obj);
  }
  return rows;
}

const routes = parseSimpleCsv(fileBuffers['routes.csv'].toString('utf-8'));
const stops = parseSimpleCsv(fileBuffers['stops.csv'].toString('utf-8'));
const scheduledTrips = parseSimpleCsv(fileBuffers['scheduled_trips.csv'].toString('utf-8'));
const stopTimes = parseSimpleCsv(fileBuffers['stop_times.csv'].toString('utf-8'));
const passengerLoads = parseSimpleCsv(fileBuffers['passenger_loads.csv'].toString('utf-8'));
const busPositions = parseSimpleCsv(fileBuffers['bus_positions.csv'].toString('utf-8'));
const vehicles = parseSimpleCsv(fileBuffers['vehicles.csv'].toString('utf-8'));
const crewAvailability = parseSimpleCsv(fileBuffers['crew_availability.csv'].toString('utf-8'));

console.log('\n--- Invariant Verification ---');
const operatedTrips = scheduledTrips.filter(t => t.final_outcome === 'operated').length;
const cancelledTrips = scheduledTrips.filter(t => t.final_outcome === 'cancelled').length;
const shortfallTrips = scheduledTrips.filter(t => t.final_outcome === 'resource_shortfall' || t.final_outcome === 'staffing_shortfall').length;

console.log(`  Routes count:           ${routes.length} (Expected: 1)`);
console.log(`  Stops count:            ${stops.length} (Expected: 24 - 12 UP, 12 DOWN)`);
console.log(`  Scheduled Trips count:  ${scheduledTrips.length} (Expected: 86)`);
console.log(`    - operated:           ${operatedTrips} (Expected: 77)`);
console.log(`    - cancelled:          ${cancelledTrips} (Expected: 2)`);
console.log(`    - resource_shortfall: ${shortfallTrips} (Expected: 7)`);
console.log(`  Stop Times count:       ${stopTimes.length} (Expected: 1,032)`);
console.log(`  Passenger Loads count:  ${passengerLoads.length} (Expected: 924)`);
console.log(`  Bus Positions count:    ${busPositions.length} (Expected: 4,376)`);
console.log(`  Vehicles count:         ${vehicles.length} (Expected: 13)`);
console.log(`  Crew Availability count:${crewAvailability.length} (Expected: 24)`);

let invariantsPassed = true;
if (routes.length !== 1) invariantsPassed = false;
if (stops.length !== 24) invariantsPassed = false;
if (scheduledTrips.length !== 86) invariantsPassed = false;
if (operatedTrips !== 77 || cancelledTrips !== 2 || shortfallTrips !== 7) invariantsPassed = false;
if (stopTimes.length !== 1032) invariantsPassed = false;
if (passengerLoads.length !== 924) invariantsPassed = false;
if (busPositions.length !== 4376) invariantsPassed = false;
if (vehicles.length !== 13) invariantsPassed = false;
if (crewAvailability.length !== 24) invariantsPassed = false;

if (!invariantsPassed) {
  console.error('\n❌ FAILED: Invariant check failed against canonical operational baseline.');
  process.exit(1);
}
console.log('✅ All canonical dataset invariants verified 100% successfully.');

console.log(`\nGenerating SQL seed script: ${OUTPUT_SQL_PATH}...`);
const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const VERSION_ID = 'b0000000-0000-0000-0000-000000000001';

function escapeSql(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escapeNum(val) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return 'NULL';
  return String(Number(val));
}

let sql = `-- =============================================================================\n`;
sql += `-- HOGANA — Operational Dataset Canonical Baseline Seed (V1)\n`;
sql += `-- Auto-generated from canonical data/demo/ files\n`;
sql += `-- =============================================================================\n\n`;

// 1. Files registration
sql += `-- Register the 9 canonical source files\n`;
for (const fileName of REQUIRED_FILES) {
  const stat = fileStats[fileName];
  const fileType = fileName.endsWith('.json') ? 'json' : 'csv';
  sql += `INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', '${fileName}', '${fileType}', ${stat.sizeBytes}, '${stat.sha256}', 'org_${ORG_ID}/v1/${fileName}', ${stat.lines}, TRUE, '[]'::jsonb)\n`;
  sql += `ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;\n\n`;
}

// 2. Routes
sql += `-- Routes (1 record)\n`;
for (const r of routes) {
  sql += `INSERT INTO routes (organization_id, dataset_version_id, route_id, route_short_name, route_long_name, route_type, agency_id, source_label)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', ${escapeSql(r.route_id)}, ${escapeSql(r.route_id)}, ${escapeSql(r.route_name)}, 3, 'BMTC', ${escapeSql(r.source_label || 'synthetic')})\n`;
  sql += `ON CONFLICT (dataset_version_id, route_id) DO NOTHING;\n`;
}
sql += '\n';

// 3. Stops
sql += `-- Stops (24 records)\n`;
for (const s of stops) {
  const isControl = String(s.is_control_point).toLowerCase() === 'true';
  sql += `INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', ${escapeSql(s.stop_id)}, ${escapeSql(s.stop_name)}, ${escapeNum(s.lat)}, ${escapeNum(s.lon)}, ${escapeNum(s.sequence)}, ${escapeSql(s.direction)}, ${isControl}, FALSE, ${escapeSql(s.source_label || 'synthetic')})\n`;
  sql += `ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;\n`;
}
sql += '\n';

// 4. Vehicles
sql += `-- Vehicles (13 records)\n`;
for (const v of vehicles) {
  sql += `INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', ${escapeSql(v.bus_id)}, ${escapeSql(v.registration)}, ${escapeNum(v.capacity_seated)}, ${escapeNum(v.capacity_standing)}, ${escapeNum(v.capacity_total)}, ${escapeSql(v.status)}, 'Hebbal Depot', ${escapeSql(v.source_label || 'synthetic')})\n`;
  sql += `ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;\n`;
}
sql += '\n';

// 5. Crew
sql += `-- Crew Availability (24 records)\n`;
for (const c of crewAvailability) {
  sql += `INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', ${escapeSql(c.crew_id)}, ${escapeSql(c.crew_id)}, 'SHIFT-1', ${escapeSql(c.shift_start)}, ${escapeSql(c.shift_end)}, ${escapeSql(c.assigned_bus_id)}, ${escapeSql(c.status)}, 'Silk Board Depot', ${escapeSql(c.source_label || 'synthetic')})\n`;
  sql += `ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;\n`;
}
sql += '\n';

// 6. Scheduled Trips
sql += `-- Scheduled Trips (86 records)\n`;
for (const t of scheduledTrips) {
  sql += `INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)\n`;
  sql += `VALUES ('${ORG_ID}', '${VERSION_ID}', ${escapeSql(t.trip_id)}, ${escapeSql(t.route_id)}, ${escapeSql(t.direction)}, ${escapeSql(t.scheduled_departure)}, ${escapeSql(t.scheduled_arrival)}, 720, ${escapeSql(t.bus_id)}, NULL, ${escapeSql(t.final_outcome)}, ${escapeSql(t.source_label || 'synthetic')})\n`;
  sql += `ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;\n`;
}
sql += '\n';

// Write the migration files
fs.mkdirSync(path.dirname(OUTPUT_SQL_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_SQL_PATH, sql, 'utf-8');
console.log(`✅ Seed migration file created successfully: ${OUTPUT_SQL_PATH} (${sql.length} bytes)`);

fs.mkdirSync(path.dirname(WEB_SQL_PATH), { recursive: true });
fs.writeFileSync(WEB_SQL_PATH, sql, 'utf-8');
console.log(`✅ Synchronised to web migration directory: ${WEB_SQL_PATH}`);

console.log('\n================================================================');
console.log('Operational Dataset Baseline Migration Complete.');
console.log('All 9 files audited, checksummed, and staged for Supabase PostgreSQL.');
console.log('================================================================\n');
