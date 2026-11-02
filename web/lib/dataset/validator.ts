/**
 * HOGANA — Operational Dataset Validator
 * 
 * Enforces schema constraints, record counts, relational integrity,
 * synthetic source provenance, and trip outcome consistency.
 * 
 * "Do not silently repair invalid records.
 *  If validation fails, return a clear error identifying the affected file and check."
 */

import type { CompleteDataset, DatasetValidationResult, ValidationCheckResult, StopTime, PassengerLoad, BusPosition, Vehicle } from './types';

export const EXPECTED_COUNTS = {
  routes: 1,
  stops: 24,
  scheduledTrips: 86,
  stopTimes: 1032,
  passengerLoads: 924,
  busPositions: 4376,
  vehicles: 13,
  crewAvailability: 24
} as const;

export const EXPECTED_OUTCOMES = {
  operated: 77,
  cancelled: 2,
  resourceShortfall: 7,
  cancelledTripIds: ['T-DN-033', 'T-UP-008'],
  shortfallTripIds: ['T-DN-031', 'T-DN-042', 'T-UP-016', 'T-UP-017', 'T-UP-018', 'T-UP-019', 'T-UP-020']
} as const;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function validateDataset(dataset: CompleteDataset): DatasetValidationResult {
  const checks: ValidationCheckResult[] = [];
  const errors: string[] = [];

  function recordCheck(checkName: string, passed: boolean, message: string) {
    checks.push({ checkName, passed, message });
    if (!passed) {
      errors.push(`[${checkName}] ${message}`);
    }
  }

  const {
    routes,
    stops,
    scheduledTrips,
    stopTimes,
    passengerLoads,
    busPositions,
    vehicles,
    crewAvailability,
    assumptions
  } = dataset;

  // ==========================================
  // 1. BASELINE RECORD COUNTS (Checks 1 - 8)
  // ==========================================
  recordCheck(
    'routes.csv record count',
    routes.length === EXPECTED_COUNTS.routes,
    `routes.csv expected ${EXPECTED_COUNTS.routes} rows, found ${routes.length}`
  );

  recordCheck(
    'stops.csv record count',
    stops.length === EXPECTED_COUNTS.stops,
    `stops.csv expected ${EXPECTED_COUNTS.stops} rows, found ${stops.length}`
  );

  recordCheck(
    'scheduled_trips.csv record count',
    scheduledTrips.length === EXPECTED_COUNTS.scheduledTrips,
    `scheduled_trips.csv expected ${EXPECTED_COUNTS.scheduledTrips} rows, found ${scheduledTrips.length}`
  );

  recordCheck(
    'stop_times.csv record count',
    stopTimes.length === EXPECTED_COUNTS.stopTimes,
    `stop_times.csv expected ${EXPECTED_COUNTS.stopTimes} rows, found ${stopTimes.length}`
  );

  recordCheck(
    'passenger_loads.csv record count',
    passengerLoads.length === EXPECTED_COUNTS.passengerLoads,
    `passenger_loads.csv expected ${EXPECTED_COUNTS.passengerLoads} rows, found ${passengerLoads.length}`
  );

  recordCheck(
    'bus_positions.csv record count',
    busPositions.length === EXPECTED_COUNTS.busPositions,
    `bus_positions.csv expected ${EXPECTED_COUNTS.busPositions} rows, found ${busPositions.length}`
  );

  recordCheck(
    'vehicles.csv record count',
    vehicles.length === EXPECTED_COUNTS.vehicles,
    `vehicles.csv expected ${EXPECTED_COUNTS.vehicles} rows, found ${vehicles.length}`
  );

  recordCheck(
    'crew_availability.csv record count',
    crewAvailability.length === EXPECTED_COUNTS.crewAvailability,
    `crew_availability.csv expected ${EXPECTED_COUNTS.crewAvailability} rows, found ${crewAvailability.length}`
  );

  // Check 9: Assumptions provenance
  const hasProvenance = Boolean(assumptions?._provenance && assumptions._provenance.includes('HeadwayIQ concept PDF'));
  recordCheck(
    'demo_assumptions.json provenance check',
    hasProvenance,
    hasProvenance
      ? 'demo_assumptions.json synthetic provenance disclosure verified'
      : 'demo_assumptions.json missing required synthetic provenance disclosure'
  );

  // ==========================================
  // 2. PRIMARY KEY UNIQUENESS (Checks 10 - 17)
  // ==========================================
  function checkUniqueness<T>(
    items: T[],
    keyFn: (item: T) => string,
    fileName: string,
    idName: string
  ) {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    let emptyCount = 0;

    items.forEach(item => {
      const val = keyFn(item);
      if (!val || val.trim() === '') {
        emptyCount++;
      } else if (seen.has(val)) {
        duplicates.push(val);
      } else {
        seen.add(val);
      }
    });

    const passed = emptyCount === 0 && duplicates.length === 0;
    const msg = passed
      ? `${fileName} ${idName} uniqueness verified (${seen.size} unique keys)`
      : `${fileName} primary key error: ${emptyCount} empty keys, duplicates: [${duplicates.slice(0, 5).join(', ')}]`;
    recordCheck(`${fileName} PK uniqueness (${idName})`, passed, msg);
    return seen;
  }

  const routeIds = checkUniqueness(routes, r => r.route_id, 'routes.csv', 'route_id');
  const stopIds = checkUniqueness(stops, s => s.stop_id, 'stops.csv', 'stop_id');
  const tripIds = checkUniqueness(scheduledTrips, t => t.trip_id, 'scheduled_trips.csv', 'trip_id');
  const vehicleIds = checkUniqueness(vehicles, v => v.bus_id, 'vehicles.csv', 'bus_id');
  checkUniqueness(crewAvailability, c => c.crew_id, 'crew_availability.csv', 'crew_id');
  checkUniqueness(busPositions, p => p.position_id, 'bus_positions.csv', 'position_id');

  checkUniqueness(stopTimes, st => `${st.trip_id}_${st.stop_sequence}`, 'stop_times.csv', 'trip_id + stop_sequence');
  checkUniqueness(passengerLoads, pl => `${pl.trip_id}_${pl.stop_sequence}`, 'passenger_loads.csv', 'trip_id + stop_sequence');

  // ==========================================
  // 3. FOREIGN KEY INTEGRITY (Checks 18 - 24)
  // ==========================================
  let stopFkErrors = 0;
  stops.forEach(s => {
    if (!routeIds.has(s.route_id)) stopFkErrors++;
  });
  recordCheck(
    'stops.csv FK -> routes.csv',
    stopFkErrors === 0,
    `stops.csv foreign key references: ${stopFkErrors} missing route_id references`
  );

  let tripFkErrors = 0;
  scheduledTrips.forEach(t => {
    if (!routeIds.has(t.route_id)) tripFkErrors++;
    if (t.bus_id && !vehicleIds.has(t.bus_id)) tripFkErrors++;
  });
  recordCheck(
    'scheduled_trips.csv FK -> routes.csv / vehicles.csv',
    tripFkErrors === 0,
    `scheduled_trips.csv foreign key references: ${tripFkErrors} missing references`
  );

  let stopTimesFkErrors = 0;
  stopTimes.forEach(st => {
    if (!tripIds.has(st.trip_id)) stopTimesFkErrors++;
    if (!stopIds.has(st.stop_id)) stopTimesFkErrors++;
  });
  recordCheck(
    'stop_times.csv FK -> scheduled_trips.csv / stops.csv',
    stopTimesFkErrors === 0,
    `stop_times.csv foreign key references: ${stopTimesFkErrors} missing references`
  );

  let passengerLoadsFkErrors = 0;
  passengerLoads.forEach(pl => {
    if (!tripIds.has(pl.trip_id)) passengerLoadsFkErrors++;
    if (!stopIds.has(pl.stop_id)) passengerLoadsFkErrors++;
  });
  recordCheck(
    'passenger_loads.csv FK -> scheduled_trips.csv / stops.csv',
    passengerLoadsFkErrors === 0,
    `passenger_loads.csv foreign key references: ${passengerLoadsFkErrors} missing references`
  );

  let busPositionsFkErrors = 0;
  busPositions.forEach(bp => {
    if (!vehicleIds.has(bp.bus_id)) busPositionsFkErrors++;
    if (!tripIds.has(bp.trip_id)) busPositionsFkErrors++;
    if (!routeIds.has(bp.route_id)) busPositionsFkErrors++;
  });
  recordCheck(
    'bus_positions.csv FK -> vehicles / trips / routes',
    busPositionsFkErrors === 0,
    `bus_positions.csv foreign key references: ${busPositionsFkErrors} missing references`
  );

  let vehicleFkErrors = 0;
  vehicles.forEach(v => {
    if (!stopIds.has(v.current_location_stop_id)) vehicleFkErrors++;
  });
  recordCheck(
    'vehicles.csv FK -> stops.csv',
    vehicleFkErrors === 0,
    `vehicles.csv foreign key references: ${vehicleFkErrors} invalid current_location_stop_id`
  );

  let crewFkErrors = 0;
  crewAvailability.forEach(c => {
    if (c.assigned_bus_id && !vehicleIds.has(c.assigned_bus_id)) crewFkErrors++;
  });
  recordCheck(
    'crew_availability.csv FK -> vehicles.csv',
    crewFkErrors === 0,
    `crew_availability.csv foreign key references: ${crewFkErrors} invalid assigned_bus_id`
  );

  // ==========================================
  // 4. DIRECTIONS & SOURCE LABELS (Checks 25 - 26)
  // ==========================================
  let invalidDirections = 0;
  stops.forEach(s => { if (s.direction !== 'UP' && s.direction !== 'DOWN') invalidDirections++; });
  scheduledTrips.forEach(t => { if (t.direction !== 'UP' && t.direction !== 'DOWN') invalidDirections++; });
  busPositions.forEach(p => { if (p.direction !== 'UP' && p.direction !== 'DOWN') invalidDirections++; });
  recordCheck(
    'Route directions validity (UP/DOWN)',
    invalidDirections === 0,
    `Route directions: ${invalidDirections} invalid direction values (must be UP or DOWN)`
  );

  let invalidSourceLabels = 0;
  routes.forEach(r => { if (r.source_label !== 'synthetic') invalidSourceLabels++; });
  stops.forEach(s => { if (s.source_label !== 'synthetic') invalidSourceLabels++; });
  scheduledTrips.forEach(t => { if (t.source_label !== 'synthetic') invalidSourceLabels++; });
  stopTimes.forEach(st => { if (st.source_label !== 'synthetic') invalidSourceLabels++; });
  passengerLoads.forEach(pl => { if (pl.source_label !== 'synthetic') invalidSourceLabels++; });
  busPositions.forEach(bp => { if (bp.source_label !== 'synthetic') invalidSourceLabels++; });
  vehicles.forEach(v => { if (v.source_label !== 'synthetic') invalidSourceLabels++; });
  crewAvailability.forEach(c => { if (c.source_label !== 'synthetic') invalidSourceLabels++; });
  recordCheck(
    'Source labels synthetic provenance',
    invalidSourceLabels === 0,
    `Source labels: ${invalidSourceLabels} invalid or non-synthetic records found`
  );

  // ==========================================
  // 5. TRIP OUTCOME ALLOCATION (Checks 27 - 29)
  // ==========================================
  const operatedTrips = scheduledTrips.filter(t => t.final_outcome === 'operated');
  const cancelledTrips = scheduledTrips.filter(t => t.final_outcome === 'cancelled');
  const shortfallTrips = scheduledTrips.filter(t => t.final_outcome === 'resource_shortfall');

  const outcomesCorrect = (
    operatedTrips.length === EXPECTED_OUTCOMES.operated &&
    cancelledTrips.length === EXPECTED_OUTCOMES.cancelled &&
    shortfallTrips.length === EXPECTED_OUTCOMES.resourceShortfall
  );
  recordCheck(
    'Trip outcomes allocation (77 operated, 2 cancelled, 7 shortfall)',
    outcomesCorrect,
    `Trip outcomes: ${operatedTrips.length} operated (expected ${EXPECTED_OUTCOMES.operated}), ` +
    `${cancelledTrips.length} cancelled (expected ${EXPECTED_OUTCOMES.cancelled}), ` +
    `${shortfallTrips.length} shortfall (expected ${EXPECTED_OUTCOMES.resourceShortfall})`
  );

  const cancelledFoundIds = cancelledTrips.map(t => t.trip_id).sort().join(',');
  const cancelledExpectedIds = [...EXPECTED_OUTCOMES.cancelledTripIds].sort().join(',');
  recordCheck(
    'Cancelled trip IDs check (T-UP-008, T-DN-033)',
    cancelledFoundIds === cancelledExpectedIds,
    `Cancelled trip IDs expected [${cancelledExpectedIds}], found [${cancelledFoundIds}]`
  );

  const shortfallFoundIds = shortfallTrips.map(t => t.trip_id).sort().join(',');
  const shortfallExpectedIds = [...EXPECTED_OUTCOMES.shortfallTripIds].sort().join(',');
  recordCheck(
    'Resource shortfall trip IDs check',
    shortfallFoundIds === shortfallExpectedIds,
    `Shortfall trip IDs expected [${shortfallExpectedIds}], found [${shortfallFoundIds}]`
  );

  // ==========================================
  // A. TRIP AND STOP-TIME INTEGRITY (Checks 30 - 35)
  // ==========================================
  const stopTimesByTrip = new Map<string, StopTime[]>();
  stopTimes.forEach(st => {
    if (!stopTimesByTrip.has(st.trip_id)) stopTimesByTrip.set(st.trip_id, []);
    stopTimesByTrip.get(st.trip_id)!.push(st);
  });

  // A.1: Each trip must have exactly 12 stop-time records
  let tripStopCountErrors = 0;
  scheduledTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    if (list.length !== 12) tripStopCountErrors++;
  });
  recordCheck(
    'Trip stop-time record count (12 per trip)',
    tripStopCountErrors === 0,
    `Trip stop counts: ${tripStopCountErrors} trips do not have exactly 12 stop-time records`
  );

  // A.2: Stop IDs and directional sequences must match the trip direction
  const upStopsExpected = stops.filter(s => s.direction === 'UP').sort((a, b) => a.sequence - b.sequence);
  const downStopsExpected = stops.filter(s => s.direction === 'DOWN').sort((a, b) => a.sequence - b.sequence);
  let stopMatchErrors = 0;

  scheduledTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    const expected = t.direction === 'UP' ? upStopsExpected : downStopsExpected;
    list.forEach((st, idx) => {
      if (st.stop_sequence !== idx + 1 || st.stop_id !== expected[idx]?.stop_id) {
        stopMatchErrors++;
      }
    });
  });
  recordCheck(
    'Stop IDs and directional sequence alignment',
    stopMatchErrors === 0,
    `Stop alignment: ${stopMatchErrors} stop-time records mismatch directional stop sequence`
  );

  // A.3: Scheduled trip departure and arrival must match sequence 1 and sequence 12
  let schedDepArrMatchErrors = 0;
  scheduledTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    const s1 = list[0];
    const s12 = list[list.length - 1];
    if (!s1 || !s12 || t.scheduled_departure !== s1.scheduled_departure || t.scheduled_arrival !== s12.scheduled_arrival) {
      schedDepArrMatchErrors++;
    }
  });
  recordCheck(
    'Scheduled trip departure and arrival match sequence 1 and sequence 12',
    schedDepArrMatchErrors === 0,
    `Scheduled terminal times: ${schedDepArrMatchErrors} trips mismatch sequence 1 dep or sequence 12 arr`
  );

  // A.4: Scheduled travel duration must remain 55 minutes
  let sched55MinErrors = 0;
  scheduledTrips.forEach(t => {
    const depMs = new Date(t.scheduled_departure + 'Z').getTime();
    const arrMs = new Date(t.scheduled_arrival + 'Z').getTime();
    if (Number.isNaN(depMs) || Number.isNaN(arrMs) || arrMs - depMs !== 55 * 60 * 1000) {
      sched55MinErrors++;
    }
  });
  recordCheck(
    'Scheduled travel duration is 55 minutes for all trips',
    sched55MinErrors === 0,
    `Scheduled travel duration: ${sched55MinErrors} trips differ from 55-minute scheduled baseline`
  );

  // A.5: Actual arrival/departure ordering must be chronological
  let interStopChronoErrors = 0;
  scheduledTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    for (let idx = 1; idx < list.length; idx++) {
      const prev = list[idx - 1];
      const curr = list[idx];
      if (prev.actual_departure && curr.actual_arrival) {
        const prevDepMs = new Date(prev.actual_departure + 'Z').getTime();
        const currArrMs = new Date(curr.actual_arrival + 'Z').getTime();
        if (Number.isNaN(prevDepMs) || Number.isNaN(currArrMs) || currArrMs <= prevDepMs) {
          interStopChronoErrors++;
        }
      }
    }
  });
  recordCheck(
    'Actual arrival/departure ordering is chronological between stops',
    interStopChronoErrors === 0,
    `Chronological ordering: ${interStopChronoErrors} stop events occur before or equal to previous departure`
  );

  // A.6: No actual departure may occur before its actual arrival
  let depBeforeArrErrors = 0;
  stopTimes.forEach(st => {
    if (st.actual_arrival && st.actual_departure) {
      const arrMs = new Date(st.actual_arrival + 'Z').getTime();
      const depMs = new Date(st.actual_departure + 'Z').getTime();
      if (Number.isNaN(arrMs) || Number.isNaN(depMs) || depMs < arrMs) {
        depBeforeArrErrors++;
      }
    }
  });
  recordCheck(
    'No actual departure occurs before actual arrival within stop',
    depBeforeArrErrors === 0,
    `Intra-stop order: ${depBeforeArrErrors} records have departure earlier than arrival`
  );

  // ==========================================
  // B. NON-OPERATING TRIP INTEGRITY (Checks 36 - 38)
  // ==========================================
  const nonOperatingTripIds = new Set([
    ...EXPECTED_OUTCOMES.cancelledTripIds,
    ...EXPECTED_OUTCOMES.shortfallTripIds
  ]);

  let nonOpNullActualErrors = 0;
  let nonOpStopTimeCount = 0;
  nonOperatingTripIds.forEach(id => {
    const list = stopTimesByTrip.get(id) || [];
    nonOpStopTimeCount += list.length;
    list.forEach(st => {
      if (st.actual_arrival !== null || st.actual_departure !== null) {
        nonOpNullActualErrors++;
      }
    });
  });
  recordCheck(
    'Non-operating trips (9 trips) have 108 stop-time records with null actuals',
    nonOpStopTimeCount === 108 && nonOpNullActualErrors === 0,
    `Non-operating stop times: ${nonOpStopTimeCount} records (expected 108), ${nonOpNullActualErrors} have non-null actuals`
  );

  const loadsByTrip = new Map<string, PassengerLoad[]>();
  passengerLoads.forEach(pl => {
    if (!loadsByTrip.has(pl.trip_id)) loadsByTrip.set(pl.trip_id, []);
    loadsByTrip.get(pl.trip_id)!.push(pl);
  });

  let nonOpLoadsCount = 0;
  nonOperatingTripIds.forEach(id => {
    const list = loadsByTrip.get(id) || [];
    nonOpLoadsCount += list.length;
  });
  recordCheck(
    'Non-operating trips have zero passenger-load records',
    nonOpLoadsCount === 0,
    `Non-operating passenger loads: found ${nonOpLoadsCount} records (expected 0)`
  );

  const posByTrip = new Map<string, BusPosition[]>();
  busPositions.forEach(bp => {
    if (!posByTrip.has(bp.trip_id)) posByTrip.set(bp.trip_id, []);
    posByTrip.get(bp.trip_id)!.push(bp);
  });

  let nonOpPosCount = 0;
  nonOperatingTripIds.forEach(id => {
    const list = posByTrip.get(id) || [];
    nonOpPosCount += list.length;
  });
  recordCheck(
    'Non-operating trips have zero GPS position records',
    nonOpPosCount === 0,
    `Non-operating GPS positions: found ${nonOpPosCount} records (expected 0)`
  );

  // ==========================================
  // C. OPERATED TRIP INTEGRITY (Checks 39 - 40)
  // ==========================================
  let opTripLoadsCountErrors = 0;
  let plSequenceAlignmentErrors = 0;
  operatedTrips.forEach(t => {
    const list = loadsByTrip.get(t.trip_id) || [];
    const sortedLoads = [...list].sort((a, b) => a.stop_sequence - b.stop_sequence);
    const expectedStops = t.direction === 'UP' ? upStopsExpected : downStopsExpected;
    const stList = (stopTimesByTrip.get(t.trip_id) || []).sort((a, b) => a.stop_sequence - b.stop_sequence);

    if (sortedLoads.length !== 12) {
      opTripLoadsCountErrors++;
    } else {
      for (let idx = 0; idx < 12; idx++) {
        const pl = sortedLoads[idx];
        const expStop = expectedStops[idx];
        const st = stList[idx];
        if (pl.stop_sequence !== idx + 1 || pl.stop_id !== expStop?.stop_id || pl.stop_id !== st?.stop_id) {
          plSequenceAlignmentErrors++;
        }
      }
    }
  });
  recordCheck(
    'All 77 operated trips have exactly 12 passenger-load records (924 total)',
    opTripLoadsCountErrors === 0 && plSequenceAlignmentErrors === 0 && passengerLoads.length === 924,
    `Operated trip passenger load counts: ${opTripLoadsCountErrors} count errors, ${plSequenceAlignmentErrors} sequence alignment errors, total loads = ${passengerLoads.length}`
  );

  let opMissingActualEvents = 0;
  operatedTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    list.forEach(st => {
      if (st.actual_arrival === null || st.actual_departure === null) {
        opMissingActualEvents++;
      }
    });
  });
  recordCheck(
    'All operated trips have complete actual arrival and departure events',
    opMissingActualEvents === 0,
    `Operated actual stop events: ${opMissingActualEvents} missing actual arrival/departure values`
  );

  // ==========================================
  // D. PASSENGER-LOAD INTEGRITY (Checks 41 - 44)
  // ==========================================
  let plInvalidFormatErrors = 0;
  passengerLoads.forEach(pl => {
    const b = pl.boardings;
    const a = pl.alightings;
    const on = pl.onboard_after;
    if (
      b === null || a === null || on === null ||
      !Number.isInteger(b) || !Number.isInteger(a) || !Number.isInteger(on) ||
      b < 0 || a < 0 || on < 0
    ) {
      plInvalidFormatErrors++;
    }
  });
  recordCheck(
    'Boarding, alighting, and onboard values are valid non-negative integers',
    plInvalidFormatErrors === 0,
    `Passenger load format: ${plInvalidFormatErrors} records have non-integer, negative, or null values`
  );

  let plBalanceErrors = 0;
  let plIncompleteRecordErrors = 0;
  operatedTrips.forEach(t => {
    const list = loadsByTrip.get(t.trip_id) || [];
    const sortedLoads = [...list].sort((a, b) => a.stop_sequence - b.stop_sequence);
    let running: number | null = 0;
    sortedLoads.forEach((pl, idx) => {
      if (pl.boardings === null || pl.alightings === null || pl.onboard_after === null) {
        plIncompleteRecordErrors++;
        running = null; // Do not calculate subsequent balances if previous load is unknown
        return;
      }
      if (running === null) {
        return; // Prior record incomplete; do not calculate balance for downstream record
      }
      const b = pl.boardings;
      const a = pl.alightings;
      const on = pl.onboard_after;
      const expectedOn = (idx === 0 ? 0 : running) + b - a;
      if (on !== expectedOn) {
        plBalanceErrors++;
      }
      running = on;
    });
  });
  recordCheck(
    'Passenger flow balance (onboard_after = previous + boardings - alightings)',
    plBalanceErrors === 0 && plIncompleteRecordErrors === 0,
    `Passenger flow balance: ${plBalanceErrors} arithmetic balance errors, ${plIncompleteRecordErrors} incomplete/missing records`
  );

  const vehicleMap = new Map<string, Vehicle>();
  vehicles.forEach(v => vehicleMap.set(v.bus_id, v));

  let plExceedsCapLimit = 0;
  let plMissingCapacityLoadErrors = 0;
  let invalidBusAssignmentErrors = 0;
  let overcrowdingObserved = false;
  operatedTrips.forEach(t => {
    if (!t.bus_id || !vehicleMap.has(t.bus_id)) {
      invalidBusAssignmentErrors++;
      return;
    }
    const bus = vehicleMap.get(t.bus_id)!;
    const totalCap = bus.capacity_total;
    const list = loadsByTrip.get(t.trip_id) || [];
    list.forEach(pl => {
      if (pl.onboard_after === null) {
        plMissingCapacityLoadErrors++;
        return;
      }
      const on = pl.onboard_after;
      if (on > totalCap * 2.0) {
        plExceedsCapLimit++;
      }
      if (on > totalCap) {
        overcrowdingObserved = true;
      }
    });
  });
  recordCheck(
    'Passenger loads respect vehicle design capacity thresholds',
    plExceedsCapLimit === 0 && plMissingCapacityLoadErrors === 0 && invalidBusAssignmentErrors === 0 && overcrowdingObserved,
    `Passenger capacity check: ${plExceedsCapLimit} loads exceed 200% vehicle design capacity; ${plMissingCapacityLoadErrors} missing onboard loads; ${invalidBusAssignmentErrors} invalid bus assignments; peak overcrowding observed: ${overcrowdingObserved}`
  );

  let terminalNonZeroErrors = 0;
  operatedTrips.forEach(t => {
    const list = loadsByTrip.get(t.trip_id) || [];
    const seq12 = list.find(pl => pl.stop_sequence === 12);
    if (!seq12 || seq12.onboard_after !== 0) {
      terminalNonZeroErrors++;
    }
  });
  recordCheck(
    'Terminal passenger load is zero at sequence 12',
    terminalNonZeroErrors === 0,
    `Terminal passenger load: ${terminalNonZeroErrors} trips have non-zero passenger load at destination terminal sequence 12`
  );

  // ==========================================
  // E. GPS INTEGRITY (Checks 45 - 48)
  // ==========================================
  const tripMap = new Map<string, typeof scheduledTrips[0]>();
  scheduledTrips.forEach(t => tripMap.set(t.trip_id, t));

  let gpsRelationalErrors = 0;
  busPositions.forEach(bp => {
    const trip = tripMap.get(bp.trip_id);
    if (!trip || bp.bus_id !== trip.bus_id || bp.route_id !== trip.route_id || bp.direction !== trip.direction) {
      gpsRelationalErrors++;
    }
  });
  recordCheck(
    'GPS records belong to correct trip, assigned bus, route, and direction',
    gpsRelationalErrors === 0,
    `GPS relational alignment: ${gpsRelationalErrors} records mismatch parent trip attributes`
  );

  let gpsTimestampOrderErrors = 0;
  operatedTrips.forEach(t => {
    const list = posByTrip.get(t.trip_id) || [];
    for (let i = 1; i < list.length; i++) {
      const prev = new Date(list[i - 1].timestamp + 'Z').getTime();
      const curr = new Date(list[i].timestamp + 'Z').getTime();
      if (Number.isNaN(prev) || Number.isNaN(curr) || curr <= prev) {
        gpsTimestampOrderErrors++;
      }
    }
  });
  recordCheck(
    'GPS position timestamps are strictly ordered within each trip',
    gpsTimestampOrderErrors === 0,
    `GPS timestamp order: ${gpsTimestampOrderErrors} non-increasing timestamp pairs`
  );

  let gpsSamplingIntervalErrors = 0;
  let gpsEndpointAlignmentErrors = 0;

  const stopMap = new Map<string, typeof stops[0]>();
  stops.forEach(s => stopMap.set(s.stop_id, s));

  operatedTrips.forEach(t => {
    const rawList = posByTrip.get(t.trip_id) || [];
    const pList = [...rawList].sort((a, b) => new Date(a.timestamp + 'Z').getTime() - new Date(b.timestamp + 'Z').getTime());
    const stList = (stopTimesByTrip.get(t.trip_id) || []).sort((a, b) => a.stop_sequence - b.stop_sequence);
    const st1 = stList[0];
    const st12 = stList[stList.length - 1];

    if (pList.length < 2 || !st1 || !st12) {
      gpsEndpointAlignmentErrors++;
      return;
    }

    for (let i = 1; i < pList.length; i++) {
      const prevMs = new Date(pList[i - 1].timestamp + 'Z').getTime();
      const currMs = new Date(pList[i].timestamp + 'Z').getTime();
      if (Number.isNaN(prevMs) || Number.isNaN(currMs) || currMs - prevMs !== 60 * 1000) {
        gpsSamplingIntervalErrors++;
      }
    }

    const p0 = pList[0];
    const pLast = pList[pList.length - 1];
    if (p0.timestamp !== st1.actual_departure || pLast.timestamp !== st12.actual_arrival) {
      gpsEndpointAlignmentErrors++;
    }

    const s1 = stopMap.get(st1.stop_id);
    const s12 = stopMap.get(st12.stop_id);
    if (s1 && (Math.abs(p0.latitude - s1.lat) > 0.001 || Math.abs(p0.longitude - s1.lon) > 0.001)) {
      gpsEndpointAlignmentErrors++;
    }
    if (s12 && (Math.abs(pLast.latitude - s12.lat) > 0.001 || Math.abs(pLast.longitude - s12.lon) > 0.001)) {
      gpsEndpointAlignmentErrors++;
    }
  });
  recordCheck(
    'GPS 60-second sampling interval and endpoint alignment rules',
    gpsSamplingIntervalErrors === 0 && gpsEndpointAlignmentErrors === 0,
    `GPS sampling/endpoints: ${gpsSamplingIntervalErrors} non-60s intervals, ${gpsEndpointAlignmentErrors} endpoint alignment mismatches`
  );

  let gpsDisplacementJumps = 0;
  let gpsInvalidCoordinates = 0;
  let gpsSpeedMismatches = 0;
  let maxDisplacementKm = 0;

  busPositions.forEach(p => {
    if (p.latitude < 12.8 || p.latitude > 13.2 || p.longitude < 77.5 || p.longitude > 77.8 || p.speed_kmh < 0) {
      gpsInvalidCoordinates++;
    }
  });

  // Group GPS records by trip_id before checking consecutive position records; sort by timestamp for calculations
  operatedTrips.forEach(t => {
    const list = posByTrip.get(t.trip_id) || [];
    const sorted = [...list].sort((a, b) => new Date(a.timestamp + 'Z').getTime() - new Date(b.timestamp + 'Z').getTime());
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dist = haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      if (dist > maxDisplacementKm) maxDisplacementKm = dist;
      if (dist > 1.5) gpsDisplacementJumps++;
      const impliedSpeed = dist * 60;
      if (Math.abs(impliedSpeed - curr.speed_kmh) > 15 && curr.speed_kmh > 0) {
        gpsSpeedMismatches++;
      }
    }
  });
  recordCheck(
    'GPS coordinate displacement continuity and velocity consistency',
    gpsDisplacementJumps === 0 && gpsInvalidCoordinates === 0 && gpsSpeedMismatches === 0,
    `GPS continuity: max jump = ${maxDisplacementKm.toFixed(2)} km, jumps >1.5km = ${gpsDisplacementJumps}, invalid coords = ${gpsInvalidCoordinates}, speed mismatches = ${gpsSpeedMismatches}`
  );

  // ==========================================
  // F. FLEET AND CREW INTEGRITY (Checks 49 - 51)
  // ==========================================
  let capacitySumErrors = 0;
  vehicles.forEach(v => {
    if (v.capacity_seated + v.capacity_standing !== v.capacity_total) {
      capacitySumErrors++;
    }
  });
  recordCheck(
    'Vehicle capacity total matches seated plus standing',
    capacitySumErrors === 0,
    `Vehicle capacity sum: ${capacitySumErrors} vehicles have invalid capacity totals`
  );

  const b05 = vehicles.find(v => v.bus_id === 'BUS-05');
  const b08 = vehicles.find(v => v.bus_id === 'BUS-08');
  const b12 = vehicles.find(v => v.bus_id === 'BUS-12');
  const b13 = vehicles.find(v => v.bus_id === 'BUS-13');
  const activeBuses = vehicles.filter(v => v.status === 'active');

  const eodStatesValid = Boolean(
    b05 && b05.status === 'maintenance' && b05.current_location_stop_id === 'hebbal-down' &&
    b08 && b08.status === 'maintenance' && b08.current_location_stop_id === 'silk-board-up' &&
    b12 && b12.status === 'standby' && b12.current_location_stop_id === 'silk-board-up' &&
    b13 && b13.status === 'standby' && b13.current_location_stop_id === 'hebbal-down' &&
    activeBuses.length === 9 && activeBuses.every(v => v.current_location_stop_id === 'silk-board-up')
  );
  recordCheck(
    'Fleet end-of-day states (BUS-05, BUS-08, BUS-12, BUS-13)',
    eodStatesValid,
    `Fleet EOD state: BUS-05=${b05?.status}@${b05?.current_location_stop_id}, BUS-08=${b08?.status}@${b08?.current_location_stop_id}, standbys=${b12?.status}/${b13?.status}, active=${activeBuses.length}`
  );

  let crewBoundaryErrors = 0;
  crewAvailability.forEach(c => {
    if (c.role !== 'driver') crewBoundaryErrors++;
    if (c.status !== 'on_duty' && c.status !== 'standby') crewBoundaryErrors++;
    if (
      !(c.shift_start === '06:00' && c.shift_end === '14:00') &&
      !(c.shift_start === '14:00' && c.shift_end === '22:00')
    ) {
      crewBoundaryErrors++;
    }
    if (c.status === 'standby' && c.assigned_bus_id !== null) {
      crewBoundaryErrors++;
    }
  });
  recordCheck(
    'Crew roles, statuses, shifts, and assignment boundaries',
    crewBoundaryErrors === 0,
    `Crew validation: ${crewBoundaryErrors} records violate driver role, shift hours (06:00-14:00/14:00-22:00) or standby rules`
  );

  // ==========================================
  // G. PRESERVE THE EXACT OUTCOME BASELINE (Check 52)
  // ==========================================
  const totalTripCount = scheduledTrips.length;
  const cancCount = cancelledTrips.length;
  const shortCount = shortfallTrips.length;
  const opCount = operatedTrips.length;

  const cancPct = Number((cancCount / totalTripCount * 100).toFixed(2));
  const shortPct = Number((shortCount / totalTripCount * 100).toFixed(2));
  const fulfillPct = Number((opCount / totalTripCount * 100).toFixed(2));

  const ratesValid = (
    totalTripCount === 86 &&
    opCount === 77 &&
    cancCount === 2 &&
    shortCount === 7 &&
    cancPct === 2.33 &&
    shortPct === 8.14 &&
    fulfillPct === 89.53
  );
  recordCheck(
    'Operational outcome rates baseline (2.33% cancellation, 8.14% shortfall, 89.53% fulfillment)',
    ratesValid,
    `Baseline rates: Total=${totalTripCount}, Operated=${opCount} (${fulfillPct}%), Cancelled=${cancCount} (${cancPct}%), Shortfall=${shortCount} (${shortPct}%)`
  );

  // ==========================================
  // H. STRICT TIMESTAMP VALIDATION (Check 53)
  // ==========================================
  const ISO_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
  let invalidTimestampCount = 0;

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

  function isValidCalendarTimestamp(str: string): boolean {
    const match = ISO_TIMESTAMP_PATTERN.exec(str);
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

  function validateTimestamp(val: string | null | undefined, isRequired: boolean) {
    if (val === null || val === undefined || val === '') {
      if (isRequired) invalidTimestampCount++;
      return;
    }
    if (!isValidCalendarTimestamp(val)) {
      invalidTimestampCount++;
    }
  }

  scheduledTrips.forEach(t => {
    validateTimestamp(t.scheduled_departure, true);
    validateTimestamp(t.scheduled_arrival, true);
    if (t.final_outcome_recorded_at !== null) {
      validateTimestamp(t.final_outcome_recorded_at, false);
    }
  });

  stopTimes.forEach(st => {
    validateTimestamp(st.scheduled_arrival, true);
    validateTimestamp(st.scheduled_departure, true);
    if (st.actual_arrival !== null) {
      validateTimestamp(st.actual_arrival, false);
    }
    if (st.actual_departure !== null) {
      validateTimestamp(st.actual_departure, false);
    }
  });

  busPositions.forEach(bp => {
    validateTimestamp(bp.timestamp, true);
  });

  recordCheck(
    'Strict ISO timestamp formatting and valid calendar dates (YYYY-MM-DDTHH:mm:ss)',
    invalidTimestampCount === 0,
    invalidTimestampCount === 0
      ? 'All scheduled and actual timestamps across trips, stop_times, and positions are valid ISO YYYY-MM-DDTHH:mm:ss'
      : `Timestamp format errors: ${invalidTimestampCount} malformed or invalid calendar timestamps found`
  );

  // ==========================================
  // I. PROTECT APPROVED DEMONSTRATION SCENARIOS (Checks 54 - 56)
  // ==========================================

  // Check 54: Bus bunching scenario protection
  const tEvalBunching = '2025-03-10T08:24:00';
  const tEvalBunchingMs = new Date(tEvalBunching + 'Z').getTime();

  const b06Trip = scheduledTrips.find(t => t.trip_id === 'T-UP-006' && t.bus_id === 'BUS-06');
  const b07Trip = scheduledTrips.find(t => t.trip_id === 'T-UP-007' && t.bus_id === 'BUS-07');

  const b06StList = stopTimesByTrip.get('T-UP-006') || [];
  const b07StList = stopTimesByTrip.get('T-UP-007') || [];

  const b06Marathahalli = b06StList.find(st => st.stop_id === 'marathahalli-up');
  const b07Marathahalli = b07StList.find(st => st.stop_id === 'marathahalli-up');
  const marathahalliStop = stops.find(s => s.stop_id === 'marathahalli-up');

  const b07TelemetryAtEval = busPositions.find(p =>
    p.bus_id === 'BUS-07' &&
    p.trip_id === 'T-UP-007' &&
    p.timestamp === tEvalBunching
  );

  let bunchingValid = true;
  const bunchingIssues: string[] = [];

  if (!b06Trip || !b07Trip) {
    bunchingValid = false;
    bunchingIssues.push('missing T-UP-006 or T-UP-007 trip records');
  }

  if (!b06Marathahalli || b06Marathahalli.actual_departure !== '2025-03-10T08:22:45') {
    bunchingValid = false;
    bunchingIssues.push(`BUS-06 actual departure at Marathahalli was ${b06Marathahalli?.actual_departure} (expected 2025-03-10T08:22:45)`);
  }

  if (!b07Marathahalli || b07Marathahalli.actual_arrival !== '2025-03-10T08:23:45') {
    bunchingValid = false;
    bunchingIssues.push(`BUS-07 actual arrival at Marathahalli was ${b07Marathahalli?.actual_arrival} (expected 2025-03-10T08:23:45)`);
  }

  const b07DepMs = b07Marathahalli?.actual_departure ? new Date(b07Marathahalli.actual_departure + 'Z').getTime() : null;
  if (!b07DepMs || b07DepMs <= tEvalBunchingMs) {
    bunchingValid = false;
    bunchingIssues.push(`BUS-07 actual departure at Marathahalli must be after evaluation time 08:24:00 (found ${b07Marathahalli?.actual_departure})`);
  }

  if (!b07TelemetryAtEval) {
    bunchingValid = false;
    bunchingIssues.push('missing BUS-07 telemetry record at 08:24:00');
  } else {
    if (b07TelemetryAtEval.speed_kmh !== 0) {
      bunchingValid = false;
      bunchingIssues.push(`BUS-07 telemetry speed at 08:24:00 is ${b07TelemetryAtEval.speed_kmh} km/h (expected 0)`);
    }
    if (marathahalliStop) {
      const distM = haversineKm(
        b07TelemetryAtEval.latitude,
        b07TelemetryAtEval.longitude,
        marathahalliStop.lat,
        marathahalliStop.lon
      ) * 1000;
      if (distM > 100) {
        bunchingValid = false;
        bunchingIssues.push(`BUS-07 telemetry distance from Marathahalli is ${distM.toFixed(1)}m (> 100m geofence)`);
      }
    }
  }

  const b06DepMs = b06Marathahalli?.actual_departure ? new Date(b06Marathahalli.actual_departure + 'Z').getTime() : 0;
  const elapsedSeparationSeconds = (tEvalBunchingMs - b06DepMs) / 1000;
  if (elapsedSeparationSeconds !== 75) {
    bunchingValid = false;
    bunchingIssues.push(`current elapsed departure separation is ${elapsedSeparationSeconds}s (expected 75s)`);
  }

  recordCheck(
    'Bus bunching scenario protection (T_eval 08:24:00, Marathahalli, 75s separation)',
    bunchingValid,
    bunchingValid
      ? `Verified bunching anchors: T_eval=08:24:00, BUS-06 dep=08:22:45, BUS-07 arr=08:23:45, dwelling dep>T_eval, 0km/h telemetry at Marathahalli, elapsed separation=${elapsedSeparationSeconds}s`
      : `Bunching anchor violations: ${bunchingIssues.join('; ')}`
  );

  // Check 55: Large service gap scenario protection
  const tripDN32 = scheduledTrips.find(t => t.trip_id === 'T-DN-032');
  const tripDN33 = scheduledTrips.find(t => t.trip_id === 'T-DN-033');
  const tripDN34 = scheduledTrips.find(t => t.trip_id === 'T-DN-034');

  const dn32StList = stopTimesByTrip.get('T-DN-032') || [];
  const dn34StList = stopTimesByTrip.get('T-DN-034') || [];

  const dn32Seq1 = dn32StList.find(st => st.stop_sequence === 1);
  const dn34Seq1 = dn34StList.find(st => st.stop_sequence === 1);

  let largeGapValid = true;
  const largeGapIssues: string[] = [];

  if (!tripDN32 || tripDN32.bus_id !== 'BUS-06') {
    largeGapValid = false;
    largeGapIssues.push(`T-DN-032 bus_id is ${tripDN32?.bus_id} (expected BUS-06)`);
  }
  if (!dn32Seq1 || dn32Seq1.actual_departure !== '2025-03-10T17:36:00') {
    largeGapValid = false;
    largeGapIssues.push(`T-DN-032 Hebbal actual departure is ${dn32Seq1?.actual_departure} (expected 2025-03-10T17:36:00)`);
  }

  if (!tripDN33 || tripDN33.final_outcome !== 'cancelled') {
    largeGapValid = false;
    largeGapIssues.push(`T-DN-033 final_outcome is ${tripDN33?.final_outcome} (expected cancelled)`);
  }

  if (!tripDN34 || tripDN34.bus_id !== 'BUS-07') {
    largeGapValid = false;
    largeGapIssues.push(`T-DN-034 bus_id is ${tripDN34?.bus_id} (expected BUS-07)`);
  }
  if (!dn34Seq1 || dn34Seq1.actual_departure !== '2025-03-10T18:00:00') {
    largeGapValid = false;
    largeGapIssues.push(`T-DN-034 Hebbal actual departure is ${dn34Seq1?.actual_departure} (expected 2025-03-10T18:00:00)`);
  }

  const dn32DepMs = dn32Seq1?.actual_departure ? new Date(dn32Seq1.actual_departure + 'Z').getTime() : 0;
  const dn34DepMs = dn34Seq1?.actual_departure ? new Date(dn34Seq1.actual_departure + 'Z').getTime() : 0;
  const gapSeconds = (dn34DepMs - dn32DepMs) / 1000;
  if (gapSeconds !== 1440) {
    largeGapValid = false;
    largeGapIssues.push(`departure gap is ${gapSeconds}s (expected 1440s / 24 min)`);
  }

  recordCheck(
    'Large service gap scenario protection (Hebbal 1,440s gap, T-DN-033 cancelled)',
    largeGapValid,
    largeGapValid
      ? `Verified large service gap: T-DN-032 (BUS-06) dep 17:36, T-DN-033 cancelled, T-DN-034 (BUS-07) dep 18:00, gap=${gapSeconds}s (1440s)`
      : `Large service gap violations: ${largeGapIssues.join('; ')}`
  );

  // Check 56: Delay baseline and late departures scenario protection
  const expectedDelayed16Ids = [
    'T-UP-002', 'T-UP-003', 'T-UP-004', 'T-UP-005', 'T-UP-006', 'T-UP-007', 'T-UP-009', 'T-UP-010',
    'T-DN-030', 'T-DN-032', 'T-DN-034', 'T-DN-035', 'T-DN-036', 'T-DN-037', 'T-DN-038', 'T-DN-039'
  ];

  const delayedFoundTrips: string[] = [];
  let totalExtraDurationMinutes = 0;
  let standard55MinTripsCount = 0;

  operatedTrips.forEach(t => {
    const list = stopTimesByTrip.get(t.trip_id) || [];
    const s1 = list.find(s => s.stop_sequence === 1);
    const s12 = list.find(s => s.stop_sequence === 12);
    if (!s1?.actual_departure || !s12?.actual_arrival) return;

    const actDepMs = new Date(s1.actual_departure + 'Z').getTime();
    const actArrMs = new Date(s12.actual_arrival + 'Z').getTime();
    const durationMin = (actArrMs - actDepMs) / 60000;

    if (durationMin > 55) {
      delayedFoundTrips.push(t.trip_id);
      totalExtraDurationMinutes += (durationMin - 55);
    } else if (durationMin === 55) {
      standard55MinTripsCount++;
    }
  });

  const late1mIds = ['T-UP-014', 'T-UP-015', 'T-DN-043'];
  let late1mErrors = 0;
  late1mIds.forEach(id => {
    const list = stopTimesByTrip.get(id) || [];
    const s1 = list.find(s => s.stop_sequence === 1);
    if (!s1?.actual_departure || !s1.scheduled_departure) {
      late1mErrors++;
      return;
    }
    const schedDepMs = new Date(s1.scheduled_departure + 'Z').getTime();
    const actDepMs = new Date(s1.actual_departure + 'Z').getTime();
    const diffSec = (actDepMs - schedDepMs) / 1000;
    if (diffSec !== 60) {
      late1mErrors++;
    }
  });

  const delayedIdsMatch = (
    delayedFoundTrips.length === 16 &&
    delayedFoundTrips.sort().join(',') === [...expectedDelayed16Ids].sort().join(',')
  );

  const delayBaselineValid = (
    delayedIdsMatch &&
    totalExtraDurationMinutes === 64 &&
    standard55MinTripsCount === 61 &&
    late1mErrors === 0
  );

  recordCheck(
    'Delay baseline and late departures scenario protection (16 trips, 64m extra, 3 late departures)',
    delayBaselineValid,
    delayBaselineValid
      ? `Verified delay baseline: 16 delayed trips (+64m extra travel time), 61 standard 55m trips, and 3 trips (T-UP-014, T-UP-015, T-DN-043) departing exactly 1m late`
      : `Delay baseline violations: delayedCount=${delayedFoundTrips.length} (expected 16), extraMinutes=${totalExtraDurationMinutes} (expected 64), standardTrips=${standard55MinTripsCount} (expected 61), lateDeparturesErrors=${late1mErrors}`
  );

  const passedChecks = checks.filter(c => c.passed).length;
  const failedChecks = checks.filter(c => !c.passed).length;

  return {
    valid: failedChecks === 0,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    checks,
    recordCounts: {
      routes: routes.length,
      stops: stops.length,
      scheduledTrips: scheduledTrips.length,
      stopTimes: stopTimes.length,
      passengerLoads: passengerLoads.length,
      busPositions: busPositions.length,
      vehicles: vehicles.length,
      crewAvailability: crewAvailability.length
    },
    errors
  };
}

/**
 * Throw a descriptive Error if validation fails.
 */
export function assertValidDataset(dataset: CompleteDataset): void {
  const result = validateDataset(dataset);
  if (!result.valid) {
    throw new Error(
      `Operational Dataset Validation Failed with ${result.failedChecks} error(s):\n` +
      result.errors.join('\n')
    );
  }
}
