/**
 * HOGANA — Operational Dataset Parser
 * 
 * Safely parses raw CSV text and JSON into strongly-typed dataset entities.
 * Preserves empty string fields as null/empty where appropriate.
 * Avoids silent coercion of empty strings to 0.
 * 
 * Invariants:
 * 1. Strict boolean parsing: accepts explicitly supported 'true'/'false'/'TRUE'/'FALSE', rejects any unrecognized/empty value.
 * 2. Strict finite number parsing: uses Number.isFinite() to reject NaN, Infinity, and -Infinity.
 * 3. Strict crew role ('driver') and status ('on_duty' | 'standby') validation.
 * 4. Runtime JSON assumptions schema and type validation for all nested objects and nullable fields.
 * 5. CSV header validation to detect missing required column names.
 * 6. Preserves empty nullable values as null; never converts missing values to zero.
 */

import { parse } from 'csv-parse/sync';
import type {
  Route,
  Stop,
  ScheduledTrip,
  StopTime,
  PassengerLoad,
  BusPosition,
  Vehicle,
  CrewAvailability,
  DemoAssumptions,
  Direction,
  TripOutcome,
  VehicleStatus,
  CrewRole,
  CrewStatus,
  SourceLabel,
  CompleteDataset
} from './types';

// Required CSV headers for each schema
export const ROUTE_HEADERS = [
  'route_id',
  'route_name',
  'origin_terminal',
  'destination_terminal',
  'total_distance_km',
  'source_label'
] as const;

export const STOP_HEADERS = [
  'stop_id',
  'stop_name',
  'route_id',
  'direction',
  'sequence',
  'lat',
  'lon',
  'dist_from_origin_km',
  'is_control_point',
  'source_label'
] as const;

export const TRIP_HEADERS = [
  'trip_id',
  'route_id',
  'direction',
  'bus_id',
  'scheduled_departure',
  'scheduled_arrival',
  'final_outcome',
  'final_outcome_reason',
  'final_outcome_recorded_at',
  'source_label'
] as const;

export const STOP_TIME_HEADERS = [
  'trip_id',
  'stop_id',
  'stop_sequence',
  'scheduled_arrival',
  'actual_arrival',
  'scheduled_departure',
  'actual_departure',
  'source_label'
] as const;

export const PASSENGER_LOAD_HEADERS = [
  'trip_id',
  'stop_id',
  'stop_sequence',
  'boardings',
  'alightings',
  'onboard_after',
  'measurement_method',
  'source_label'
] as const;

export const BUS_POSITION_HEADERS = [
  'position_id',
  'bus_id',
  'trip_id',
  'route_id',
  'direction',
  'timestamp',
  'latitude',
  'longitude',
  'speed_kmh',
  'source_label'
] as const;

export const VEHICLE_HEADERS = [
  'bus_id',
  'registration',
  'capacity_seated',
  'capacity_standing',
  'capacity_total',
  'current_location_stop_id',
  'status',
  'source_label'
] as const;

export const CREW_HEADERS = [
  'crew_id',
  'role',
  'shift_start',
  'shift_end',
  'assigned_bus_id',
  'status',
  'source_label'
] as const;

function parseRawCsvWithHeaders(
  csvText: string,
  fileName: string,
  requiredHeaders: readonly string[]
): Record<string, string>[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false
  }) as Record<string, string>[];

  if (records.length === 0) {
    // If no data rows, verify header row alone
    const firstLine = csvText.trim().split('\n')[0] || '';
    const presentHeaders = firstLine.split(',').map(h => h.trim());
    const missing = requiredHeaders.filter(h => !presentHeaders.includes(h));
    if (missing.length > 0) {
      throw new Error(`CSV header validation failed for "${fileName}": missing required column(s): [${missing.join(', ')}]`);
    }
    return [];
  }

  // Validate that all required headers exist as keys in the parsed records
  const firstRecord = records[0];
  const missingHeaders = requiredHeaders.filter(header => !(header in firstRecord));
  if (missingHeaders.length > 0) {
    throw new Error(
      `CSV header validation failed for "${fileName}": missing required column(s): [${missingHeaders.join(', ')}]`
    );
  }

  return records;
}

function parseRequiredString(val: unknown, fieldName: string, rowIdx: number): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`Parse error at row ${rowIdx + 1}: required field "${fieldName}" is missing or empty`);
  }
  return val.trim();
}

function parseNullableString(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str === '' ? null : str;
}

function parseRequiredNumber(val: unknown, fieldName: string, rowIdx: number): number {
  if (val === undefined || val === null || String(val).trim() === '') {
    throw new Error(`Parse error at row ${rowIdx + 1}: required numeric field "${fieldName}" is empty or missing`);
  }
  const str = String(val).trim();
  const num = Number(str);
  if (!Number.isFinite(num)) {
    throw new Error(`Parse error at row ${rowIdx + 1}: field "${fieldName}" has non-finite or invalid number value "${val}"`);
  }
  return num;
}

function parseNullableNumber(val: unknown, fieldName: string, rowIdx: number): number | null {
  if (val === undefined || val === null || String(val).trim() === '') {
    return null;
  }
  const str = String(val).trim();
  const num = Number(str);
  if (!Number.isFinite(num)) {
    throw new Error(`Parse error at row ${rowIdx + 1}: field "${fieldName}" has non-finite or invalid number value "${val}"`);
  }
  return num;
}

const ISO_TIMESTAMP_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 1: return 31;
    case 2: return isLeapYear(year) ? 29 : 28;
    case 3: return 31;
    case 4: return 30;
    case 5: return 31;
    case 6: return 30;
    case 7: return 31;
    case 8: return 31;
    case 9: return 30;
    case 10: return 31;
    case 11: return 30;
    case 12: return 31;
    default: return 0;
  }
}

/**
 * Validates actual calendar components for YYYY-MM-DDTHH:mm:ss.
 * Strictly verifies calendar validity (days in month, leap years, 01-12 months, 00-23 hours, 00-59 min/sec)
 * and safely handles all years (including JavaScript Date.UTC 0000–0099 edge case).
 */
export function isValidCalendarTimestamp(str: string): boolean {
  const match = ISO_TIMESTAMP_REGEX.exec(str);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > getDaysInMonth(year, month)) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  if (second < 0 || second > 59) return false;

  return true;
}

/**
 * Strict ISO timestamp validation (YYYY-MM-DDTHH:mm:ss) with calendar component validation
 */
function parseRequiredTimestamp(val: unknown, fieldName: string, rowIdx: number): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`Parse error at row ${rowIdx + 1}: required timestamp "${fieldName}" is missing or empty`);
  }
  const str = val.trim();
  if (!isValidCalendarTimestamp(str)) {
    throw new Error(
      `Parse error at row ${rowIdx + 1}: field "${fieldName}" has malformed or invalid calendar timestamp "${val}" (expected YYYY-MM-DDTHH:mm:ss)`
    );
  }
  return str;
}

function parseNullableTimestamp(val: unknown, fieldName: string, rowIdx: number): string | null {
  if (val === undefined || val === null || String(val).trim() === '') {
    return null;
  }
  const str = String(val).trim();
  if (!isValidCalendarTimestamp(str)) {
    throw new Error(
      `Parse error at row ${rowIdx + 1}: field "${fieldName}" has malformed or invalid calendar timestamp "${val}" (expected YYYY-MM-DDTHH:mm:ss)`
    );
  }
  return str;
}

/**
 * Strict boolean parsing: accepts explicitly supported 'true', 'false', 'TRUE', 'FALSE', or boolean primitives.
 * Rejects any unrecognized or empty value for required boolean fields.
 */
function parseStrictBoolean(val: unknown, fieldName: string, rowIdx: number): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === 'true' || trimmed === 'TRUE') return true;
    if (trimmed === 'false' || trimmed === 'FALSE') return false;
  }
  throw new Error(
    `Parse error at row ${rowIdx + 1}: field "${fieldName}" must be an explicitly supported boolean ('true' or 'false'), received "${val}"`
  );
}

function parseSourceLabel(val: unknown, rowIdx: number): SourceLabel {
  const str = String(val).trim();
  if (str === 'synthetic') {
    return 'synthetic';
  }
  throw new Error(`Parse error at row ${rowIdx + 1}: invalid source_label "${val}" (must be "synthetic")`);
}

function parseDirection(val: unknown, rowIdx: number): Direction {
  const str = String(val).trim();
  if (str === 'UP' || str === 'DOWN') {
    return str;
  }
  throw new Error(`Parse error at row ${rowIdx + 1}: invalid direction "${val}" (must be UP or DOWN)`);
}

function parseCrewRole(val: unknown, rowIdx: number): CrewRole {
  const str = String(val).trim();
  if (str === 'driver') {
    return 'driver';
  }
  throw new Error(`Parse error at row ${rowIdx + 1}: invalid crew role "${val}" (must be "driver")`);
}

function parseCrewStatus(val: unknown, rowIdx: number): CrewStatus {
  const str = String(val).trim();
  if (str === 'on_duty' || str === 'standby') {
    return str;
  }
  throw new Error(`Parse error at row ${rowIdx + 1}: invalid crew status "${val}" (must be "on_duty" or "standby")`);
}

/**
 * Parse routes.csv
 */
export function parseRoutesCsv(csvText: string): Route[] {
  const records = parseRawCsvWithHeaders(csvText, 'routes.csv', ROUTE_HEADERS);
  return records.map((r, i) => ({
    route_id: parseRequiredString(r.route_id, 'route_id', i),
    route_name: parseRequiredString(r.route_name, 'route_name', i),
    origin_terminal: parseRequiredString(r.origin_terminal, 'origin_terminal', i),
    destination_terminal: parseRequiredString(r.destination_terminal, 'destination_terminal', i),
    total_distance_km: parseRequiredNumber(r.total_distance_km, 'total_distance_km', i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Parse stops.csv
 */
export function parseStopsCsv(csvText: string): Stop[] {
  const records = parseRawCsvWithHeaders(csvText, 'stops.csv', STOP_HEADERS);
  return records.map((r, i) => ({
    stop_id: parseRequiredString(r.stop_id, 'stop_id', i),
    stop_name: parseRequiredString(r.stop_name, 'stop_name', i),
    route_id: parseRequiredString(r.route_id, 'route_id', i),
    direction: parseDirection(r.direction, i),
    sequence: parseRequiredNumber(r.sequence, 'sequence', i),
    lat: parseRequiredNumber(r.lat, 'lat', i),
    lon: parseRequiredNumber(r.lon, 'lon', i),
    dist_from_origin_km: parseRequiredNumber(r.dist_from_origin_km, 'dist_from_origin_km', i),
    is_control_point: parseStrictBoolean(r.is_control_point, 'is_control_point', i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Parse scheduled_trips.csv
 */
export function parseScheduledTripsCsv(csvText: string): ScheduledTrip[] {
  const records = parseRawCsvWithHeaders(csvText, 'scheduled_trips.csv', TRIP_HEADERS);
  return records.map((r, i) => {
    const outcomeStr = parseRequiredString(r.final_outcome, 'final_outcome', i);
    if (outcomeStr !== 'operated' && outcomeStr !== 'cancelled' && outcomeStr !== 'resource_shortfall') {
      throw new Error(`Parse error at row ${i + 1}: invalid final_outcome "${outcomeStr}"`);
    }

    return {
      trip_id: parseRequiredString(r.trip_id, 'trip_id', i),
      route_id: parseRequiredString(r.route_id, 'route_id', i),
      direction: parseDirection(r.direction, i),
      bus_id: parseNullableString(r.bus_id),
      scheduled_departure: parseRequiredTimestamp(r.scheduled_departure, 'scheduled_departure', i),
      scheduled_arrival: parseRequiredTimestamp(r.scheduled_arrival, 'scheduled_arrival', i),
      final_outcome: outcomeStr as TripOutcome,
      final_outcome_reason: parseNullableString(r.final_outcome_reason),
      final_outcome_recorded_at: parseNullableTimestamp(r.final_outcome_recorded_at, 'final_outcome_recorded_at', i),
      source_label: parseSourceLabel(r.source_label, i)
    };
  });
}

/**
 * Parse stop_times.csv
 */
export function parseStopTimesCsv(csvText: string): StopTime[] {
  const records = parseRawCsvWithHeaders(csvText, 'stop_times.csv', STOP_TIME_HEADERS);
  return records.map((r, i) => ({
    trip_id: parseRequiredString(r.trip_id, 'trip_id', i),
    stop_id: parseRequiredString(r.stop_id, 'stop_id', i),
    stop_sequence: parseRequiredNumber(r.stop_sequence, 'stop_sequence', i),
    scheduled_arrival: parseRequiredTimestamp(r.scheduled_arrival, 'scheduled_arrival', i),
    actual_arrival: parseNullableTimestamp(r.actual_arrival, 'actual_arrival', i),
    scheduled_departure: parseRequiredTimestamp(r.scheduled_departure, 'scheduled_departure', i),
    actual_departure: parseNullableTimestamp(r.actual_departure, 'actual_departure', i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Parse passenger_loads.csv
 */
export function parsePassengerLoadsCsv(csvText: string): PassengerLoad[] {
  const records = parseRawCsvWithHeaders(csvText, 'passenger_loads.csv', PASSENGER_LOAD_HEADERS);
  return records.map((r, i) => ({
    trip_id: parseRequiredString(r.trip_id, 'trip_id', i),
    stop_id: parseRequiredString(r.stop_id, 'stop_id', i),
    stop_sequence: parseRequiredNumber(r.stop_sequence, 'stop_sequence', i),
    boardings: parseNullableNumber(r.boardings, 'boardings', i),
    alightings: parseNullableNumber(r.alightings, 'alightings', i),
    onboard_after: parseNullableNumber(r.onboard_after, 'onboard_after', i),
    measurement_method: parseRequiredString(r.measurement_method, 'measurement_method', i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Parse bus_positions.csv
 */
export function parseBusPositionsCsv(csvText: string): BusPosition[] {
  const records = parseRawCsvWithHeaders(csvText, 'bus_positions.csv', BUS_POSITION_HEADERS);
  return records.map((r, i) => ({
    position_id: parseRequiredString(r.position_id, 'position_id', i),
    bus_id: parseRequiredString(r.bus_id, 'bus_id', i),
    trip_id: parseRequiredString(r.trip_id, 'trip_id', i),
    route_id: parseRequiredString(r.route_id, 'route_id', i),
    direction: parseDirection(r.direction, i),
    timestamp: parseRequiredTimestamp(r.timestamp, 'timestamp', i),
    latitude: parseRequiredNumber(r.latitude, 'latitude', i),
    longitude: parseRequiredNumber(r.longitude, 'longitude', i),
    speed_kmh: parseRequiredNumber(r.speed_kmh, 'speed_kmh', i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Parse vehicles.csv
 */
export function parseVehiclesCsv(csvText: string): Vehicle[] {
  const records = parseRawCsvWithHeaders(csvText, 'vehicles.csv', VEHICLE_HEADERS);
  return records.map((r, i) => {
    const statusStr = parseRequiredString(r.status, 'status', i);
    if (statusStr !== 'active' && statusStr !== 'standby' && statusStr !== 'maintenance') {
      throw new Error(`Parse error at row ${i + 1}: invalid vehicle status "${statusStr}"`);
    }

    return {
      bus_id: parseRequiredString(r.bus_id, 'bus_id', i),
      registration: parseRequiredString(r.registration, 'registration', i),
      capacity_seated: parseRequiredNumber(r.capacity_seated, 'capacity_seated', i),
      capacity_standing: parseRequiredNumber(r.capacity_standing, 'capacity_standing', i),
      capacity_total: parseRequiredNumber(r.capacity_total, 'capacity_total', i),
      current_location_stop_id: parseRequiredString(r.current_location_stop_id, 'current_location_stop_id', i),
      status: statusStr as VehicleStatus,
      source_label: parseSourceLabel(r.source_label, i)
    };
  });
}

/**
 * Parse crew_availability.csv
 */
export function parseCrewAvailabilityCsv(csvText: string): CrewAvailability[] {
  const records = parseRawCsvWithHeaders(csvText, 'crew_availability.csv', CREW_HEADERS);
  return records.map((r, i) => ({
    crew_id: parseRequiredString(r.crew_id, 'crew_id', i),
    role: parseCrewRole(r.role, i),
    shift_start: parseRequiredString(r.shift_start, 'shift_start', i),
    shift_end: parseRequiredString(r.shift_end, 'shift_end', i),
    assigned_bus_id: parseNullableString(r.assigned_bus_id),
    status: parseCrewStatus(r.status, i),
    source_label: parseSourceLabel(r.source_label, i)
  }));
}

/**
 * Runtime validator for demo_assumptions.json schema, nested structures, and nullable numeric fields.
 */
function assertAssumptionString(val: unknown, path: string): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`demo_assumptions.json schema error: "${path}" must be a non-empty string`);
  }
  return val.trim();
}

function assertAssumptionNumber(val: unknown, path: string): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new Error(`demo_assumptions.json schema error: "${path}" must be a finite number`);
  }
  return val;
}

function assertAssumptionRequiredNullableNumber(
  obj: Record<string, unknown>,
  key: string,
  parentPath: string
): number | null {
  const path = `${parentPath}.${key}`;
  if (!(key in obj) || obj[key] === undefined) {
    throw new Error(`demo_assumptions.json schema error: missing required property "${path}"`);
  }
  const val = obj[key];
  if (val === null) {
    return null;
  }
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new Error(`demo_assumptions.json schema error: "${path}" must be explicit null or a finite number`);
  }
  return val;
}

function assertAssumptionObject(val: unknown, path: string): Record<string, unknown> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(`demo_assumptions.json schema error: "${path}" must be a non-null object`);
  }
  return val as Record<string, unknown>;
}

/**
 * Parse and validate demo_assumptions.json at runtime without relying solely on type assertions.
 */
export function parseDemoAssumptionsJson(jsonText: string): DemoAssumptions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse demo_assumptions.json as valid JSON: ${msg}`);
  }

  const root = assertAssumptionObject(parsed, 'root');
  const provenance = assertAssumptionString(root._provenance, '_provenance');

  const twr = assertAssumptionObject(root.time_window_rules, 'time_window_rules');
  const intervalConvention = assertAssumptionString(twr.interval_convention, 'time_window_rules.interval_convention');
  const departureFormula = assertAssumptionString(twr.departure_formula, 'time_window_rules.departure_formula');

  const hw = assertAssumptionObject(root.headway, 'headway');
  const nominalPeakHeadway = assertAssumptionNumber(hw.nominal_peak_headway_seconds, 'headway.nominal_peak_headway_seconds');
  const nominalPeakHeadwayNote = assertAssumptionString(hw.nominal_peak_headway_note, 'headway.nominal_peak_headway_note');
  const nominalOffpeakHeadway = assertAssumptionNumber(hw.nominal_offpeak_headway_seconds, 'headway.nominal_offpeak_headway_seconds');
  const nominalOffpeakHeadwayNote = assertAssumptionString(hw.nominal_offpeak_headway_note, 'headway.nominal_offpeak_headway_note');
  const bunchingThreshold = assertAssumptionNumber(hw.bunching_threshold_seconds, 'headway.bunching_threshold_seconds');
  const bunchingThresholdNote = assertAssumptionString(hw.bunching_threshold_note, 'headway.bunching_threshold_note');
  const largeGapMultiplier = assertAssumptionNumber(hw.large_gap_multiplier, 'headway.large_gap_multiplier');
  const largeGapNote = assertAssumptionString(hw.large_gap_note, 'headway.large_gap_note');

  const cr = assertAssumptionObject(root.crowding, 'crowding');
  const overcrowdingPct = assertAssumptionNumber(cr.overcrowding_pct, 'crowding.overcrowding_pct');
  const overcrowdingNote = assertAssumptionString(cr.overcrowding_note, 'crowding.overcrowding_note');
  const severeOvercrowdingPct = assertAssumptionNumber(cr.severe_overcrowding_pct, 'crowding.severe_overcrowding_pct');
  const severeOvercrowdingNote = assertAssumptionString(cr.severe_overcrowding_note, 'crowding.severe_overcrowding_note');

  const dc = assertAssumptionObject(root.dispatch_control, 'dispatch_control');
  const maxDelayTolerance = assertAssumptionNumber(dc.max_delay_tolerance_seconds, 'dispatch_control.max_delay_tolerance_seconds');
  const maxDelayNote = assertAssumptionString(dc.max_delay_note, 'dispatch_control.max_delay_note');
  const minViableHold = assertAssumptionNumber(dc.min_viable_hold_seconds, 'dispatch_control.min_viable_hold_seconds');
  const minViableHoldNote = assertAssumptionString(dc.min_viable_hold_note, 'dispatch_control.min_viable_hold_note');
  const geofenceDwellingRadius = assertAssumptionNumber(dc.geofence_dwelling_radius_meters, 'dispatch_control.geofence_dwelling_radius_meters');
  const telemetryFreshness = assertAssumptionNumber(dc.telemetry_freshness_seconds, 'dispatch_control.telemetry_freshness_seconds');

  const sd = assertAssumptionObject(root.simulator_defaults, 'simulator_defaults');
  const baselineCycleTime = assertAssumptionNumber(sd.baseline_cycle_time_minutes, 'simulator_defaults.baseline_cycle_time_minutes');
  const cycleTimeNote = assertAssumptionString(sd.cycle_time_note, 'simulator_defaults.cycle_time_note');

  const fin = assertAssumptionObject(root.financial, 'financial');
  const fareRevenuePerBusPerDay = assertAssumptionNumber(fin.fare_revenue_per_bus_per_day_inr, 'financial.fare_revenue_per_bus_per_day_inr');
  const fareRevenueNote = assertAssumptionString(fin.fare_revenue_note, 'financial.fare_revenue_note');
  const capacityLossFixed = assertAssumptionNumber(fin.capacity_loss_fixed_schedule_pct, 'financial.capacity_loss_fixed_schedule_pct');
  const capacityLossDynamic = assertAssumptionNumber(fin.capacity_loss_dynamic_dispatch_pct, 'financial.capacity_loss_dynamic_dispatch_pct');
  const capacityLossNote = assertAssumptionString(fin.capacity_loss_note, 'financial.capacity_loss_note');
  const revenueUpliftPct = assertAssumptionNumber(fin.revenue_uplift_pct, 'financial.revenue_uplift_pct');
  const revenueUpliftNote = assertAssumptionString(fin.revenue_uplift_note, 'financial.revenue_uplift_note');
  const costPerBusHourInr = assertAssumptionRequiredNullableNumber(fin, 'cost_per_bus_hour_inr', 'financial');
  const costPerBusHourNote = assertAssumptionString(fin.cost_per_bus_hour_note, 'financial.cost_per_bus_hour_note');
  const tripsPerHour = assertAssumptionRequiredNullableNumber(fin, 'trips_per_hour', 'financial');
  const tripsPerHourNote = assertAssumptionString(fin.trips_per_hour_note, 'financial.trips_per_hour_note');

  const prc = assertAssumptionObject(root.pricing, 'pricing');
  const pricePerBusPerMonth = assertAssumptionNumber(prc.price_per_bus_per_month_inr, 'pricing.price_per_bus_per_month_inr');
  const priceNote = assertAssumptionString(prc.price_note, 'pricing.price_note');
  const exampleFleetSize = assertAssumptionNumber(prc.example_fleet_size, 'pricing.example_fleet_size');
  const exampleFleetNote = assertAssumptionString(prc.example_fleet_note, 'pricing.example_fleet_note');

  return {
    _provenance: provenance,
    time_window_rules: {
      interval_convention: intervalConvention,
      departure_formula: departureFormula
    },
    headway: {
      nominal_peak_headway_seconds: nominalPeakHeadway,
      nominal_peak_headway_note: nominalPeakHeadwayNote,
      nominal_offpeak_headway_seconds: nominalOffpeakHeadway,
      nominal_offpeak_headway_note: nominalOffpeakHeadwayNote,
      bunching_threshold_seconds: bunchingThreshold,
      bunching_threshold_note: bunchingThresholdNote,
      large_gap_multiplier: largeGapMultiplier,
      large_gap_note: largeGapNote
    },
    crowding: {
      overcrowding_pct: overcrowdingPct,
      overcrowding_note: overcrowdingNote,
      severe_overcrowding_pct: severeOvercrowdingPct,
      severe_overcrowding_note: severeOvercrowdingNote
    },
    dispatch_control: {
      max_delay_tolerance_seconds: maxDelayTolerance,
      max_delay_note: maxDelayNote,
      min_viable_hold_seconds: minViableHold,
      min_viable_hold_note: minViableHoldNote,
      geofence_dwelling_radius_meters: geofenceDwellingRadius,
      telemetry_freshness_seconds: telemetryFreshness
    },
    simulator_defaults: {
      baseline_cycle_time_minutes: baselineCycleTime,
      cycle_time_note: cycleTimeNote
    },
    financial: {
      fare_revenue_per_bus_per_day_inr: fareRevenuePerBusPerDay,
      fare_revenue_note: fareRevenueNote,
      capacity_loss_fixed_schedule_pct: capacityLossFixed,
      capacity_loss_dynamic_dispatch_pct: capacityLossDynamic,
      capacity_loss_note: capacityLossNote,
      revenue_uplift_pct: revenueUpliftPct,
      revenue_uplift_note: revenueUpliftNote,
      cost_per_bus_hour_inr: costPerBusHourInr,
      cost_per_bus_hour_note: costPerBusHourNote,
      trips_per_hour: tripsPerHour,
      trips_per_hour_note: tripsPerHourNote
    },
    pricing: {
      price_per_bus_per_month_inr: pricePerBusPerMonth,
      price_note: priceNote,
      example_fleet_size: exampleFleetSize,
      example_fleet_note: exampleFleetNote
    }
  };
}

/**
 * Parses all 9 operational files from in-memory buffers into a CompleteDataset.
 */
export async function parseDatasetFromBuffers(
  buffers: Record<string, { buffer: Buffer; filename: string }>
): Promise<CompleteDataset> {
  const routesText = buffers['routes.csv']?.buffer.toString('utf8');
  const stopsText = buffers['stops.csv']?.buffer.toString('utf8');
  const tripsText = buffers['scheduled_trips.csv']?.buffer.toString('utf8');
  const stopTimesText = buffers['stop_times.csv']?.buffer.toString('utf8');
  const passengerLoadsText = buffers['passenger_loads.csv']?.buffer.toString('utf8');
  const busPositionsText = buffers['bus_positions.csv']?.buffer.toString('utf8');
  const vehiclesText = buffers['vehicles.csv']?.buffer.toString('utf8');
  const crewText = buffers['crew_availability.csv']?.buffer.toString('utf8');
  const assumptionsText = buffers['demo_assumptions.json']?.buffer.toString('utf8');

  if (!routesText) throw new Error('Missing routes.csv');
  if (!stopsText) throw new Error('Missing stops.csv');
  if (!tripsText) throw new Error('Missing scheduled_trips.csv');
  if (!stopTimesText) throw new Error('Missing stop_times.csv');
  if (!passengerLoadsText) throw new Error('Missing passenger_loads.csv');
  if (!busPositionsText) throw new Error('Missing bus_positions.csv');
  if (!vehiclesText) throw new Error('Missing vehicles.csv');
  if (!crewText) throw new Error('Missing crew_availability.csv');
  if (!assumptionsText) throw new Error('Missing demo_assumptions.json');

  return {
    routes: parseRoutesCsv(routesText),
    stops: parseStopsCsv(stopsText),
    scheduledTrips: parseScheduledTripsCsv(tripsText),
    stopTimes: parseStopTimesCsv(stopTimesText),
    passengerLoads: parsePassengerLoadsCsv(passengerLoadsText),
    busPositions: parseBusPositionsCsv(busPositionsText),
    vehicles: parseVehiclesCsv(vehiclesText),
    crewAvailability: parseCrewAvailabilityCsv(crewText),
    assumptions: parseDemoAssumptionsJson(assumptionsText)
  };
}
