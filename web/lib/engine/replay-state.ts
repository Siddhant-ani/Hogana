/**
 * HOGANA — Operational Intelligence Engine
 * Replay State & Anti-Lookahead Logic (§4.0)
 * 
 * Strict Temporal Rules:
 * 1. No actual event or GPS observation after T_eval can be used.
 * 2. Scheduled future departure slots may be used for timetable calculations, but future actual events must remain hidden.
 * 3. A scheduled departure time passing does not prove that a bus actually departed.
 * 4. Missing actual departure data must never automatically mean that a vehicle is currently dwelling.
 * 5. Strict 4-criteria live dwelling evaluation.
 */

import { ScheduledTrip, StopTime, BusPosition, Stop, DemoAssumptions } from '../dataset/types';
import { ReplayTripStatus, DwellingEvaluationResult } from './types';
import { parseIsoToSeconds, isAtOrBefore, isStrictlyAfter, diffSeconds } from './time-utils';
import { haversineMeters } from './geo-utils';

/**
 * Derives the real-time replay status of a trip at evaluation timestamp T_eval (§4.0).
 * 
 * Evaluates strictly using information recorded on or before T_eval.
 */
export function deriveTripReplayStatus(
  trip: ScheduledTrip,
  tripStopTimes: StopTime[],
  evaluationTime: string
): ReplayTripStatus {
  const tEval = evaluationTime;

  // 1. Cancelled trips
  if (trip.final_outcome === 'cancelled') {
    if (trip.final_outcome_recorded_at && isAtOrBefore(trip.final_outcome_recorded_at, tEval)) {
      return 'cancelled';
    }
    // Prior to logging:
    if (isStrictlyAfter(trip.scheduled_departure, tEval)) {
      return 'scheduled';
    }
    // Scheduled departure passed but outcome not yet logged
    return 'unknown';
  }

  // 2. Resource-shortfall trips
  if (trip.final_outcome === 'resource_shortfall') {
    if (trip.final_outcome_recorded_at && isAtOrBefore(trip.final_outcome_recorded_at, tEval)) {
      return 'resource_shortfall';
    }
    // Prior to logging:
    if (isStrictlyAfter(trip.scheduled_departure, tEval)) {
      return 'scheduled';
    }
    return 'unknown';
  }

  // 3. Operated trips
  // Find origin departure (stop_sequence 1) and destination arrival (stop_sequence 12)
  const sortedStops = [...tripStopTimes].sort((a, b) => a.stop_sequence - b.stop_sequence);
  const originStop = sortedStops[0];
  const destStop = sortedStops[sortedStops.length - 1];

  const originActualDep = originStop?.actual_departure;
  const destActualArr = destStop?.actual_arrival;

  // Has destination arrival occurred on or before T_eval?
  if (destActualArr && isAtOrBefore(destActualArr, tEval)) {
    return 'completed';
  }

  // Has origin departure occurred on or before T_eval?
  if (originActualDep && isAtOrBefore(originActualDep, tEval)) {
    // Bus departed origin, but has not yet reached destination on or before T_eval
    return 'in_progress';
  }

  // If scheduled departure is still in the future, it is scheduled
  if (isStrictlyAfter(trip.scheduled_departure, tEval)) {
    return 'scheduled';
  }

  // Scheduled departure elapsed, but origin departure is unconfirmed / missing on or before T_eval
  return 'unknown';
}

/**
 * Evaluates whether a bus is currently in a strict live dwelling state at a stop at T_eval (§4.0).
 * 
 * All testable conditions must be met:
 * 1. Trip lifecycle: status(T_eval) === 'in_progress'.
 * 2. Stop arrival recorded: actual_arrival <= T_eval.
 * 3. No prior departure: actual_departure is null or > T_eval.
 * 4. Current telemetry & stationary geofence match:
 *    - Most recent telemetry for the bus <= T_eval is within 60s of T_eval.
 *    - Speed == 0 km/h.
 *    - GPS position is within 100 meters of the stop landmark.
 */
export function evaluateDwellingState(options: {
  busId: string;
  tripId: string;
  stopId: string;
  stop: Stop;
  trip: ScheduledTrip;
  tripStopTimes: StopTime[];
  busPositions: BusPosition[];
  evaluationTime: string;
  assumptions?: DemoAssumptions;
}): DwellingEvaluationResult {
  const {
    busId,
    tripId,
    stopId,
    stop,
    trip,
    tripStopTimes,
    busPositions,
    evaluationTime,
    assumptions
  } = options;

  const tEval = evaluationTime;
  const reasons: string[] = [];
  const geofenceRadius = assumptions?.dispatch_control?.geofence_dwelling_radius_meters ?? 100;
  const telemetryFreshnessSec = assumptions?.dispatch_control?.telemetry_freshness_seconds ?? 60;

  // 0. Validate that supplied busId and tripId match the supplied scheduled trip record
  if (trip.trip_id !== tripId) {
    reasons.push(`Supplied tripId ${tripId} does not match scheduled trip ${trip.trip_id}`);
  }
  if (trip.bus_id !== busId) {
    reasons.push(`Supplied busId ${busId} does not match trip assigned vehicle ${trip.bus_id ?? 'null'}`);
  }

  // 1. Trip Lifecycle check
  const tripStatus = deriveTripReplayStatus(trip, tripStopTimes, tEval);
  if (tripStatus !== 'in_progress') {
    reasons.push(`Trip ${tripId} status is ${tripStatus} (must be 'in_progress')`);
  }

  // 2. Stop arrival and departure check
  const stopEvent = tripStopTimes.find((st) => st.stop_id === stopId);
  if (!stopEvent) {
    return {
      isDwelling: false,
      busId,
      tripId,
      stopId,
      reasons: [`Stop ${stopId} not found in trip schedule`],
      distanceMeters: null,
      telemetryAgeSeconds: null,
      speedKmh: null,
      telemetryTimestamp: null,
      arrivalTimestamp: null,
      departureTimestamp: null
    };
  }

  const arrivalTs = stopEvent.actual_arrival;
  const departureTs = stopEvent.actual_departure;

  // Arrival must be recorded on or before T_eval
  if (!arrivalTs || isStrictlyAfter(arrivalTs, tEval)) {
    reasons.push(
      `Actual arrival at ${stopId} is ${arrivalTs ?? 'null'} (must be recorded <= ${tEval})`
    );
  }

  // Departure must NOT have occurred on or before T_eval
  if (departureTs && isAtOrBefore(departureTs, tEval)) {
    reasons.push(
      `Actual departure from ${stopId} already occurred at ${departureTs} (<= ${tEval})`
    );
  }

  // 3. Telemetry check: filter strictly by BOTH bus_id AND trip_id, on or before T_eval
  const tripPings = busPositions
    .filter((p) => p.bus_id === busId && p.trip_id === tripId && isAtOrBefore(p.timestamp, tEval))
    .sort((a, b) => parseIsoToSeconds(b.timestamp) - parseIsoToSeconds(a.timestamp));

  const latestPing = tripPings[0];
  if (!latestPing) {
    reasons.push(`No GPS telemetry available for bus ${busId} on trip ${tripId} on or before ${tEval}`);
    return {
      isDwelling: false,
      busId,
      tripId,
      stopId,
      reasons,
      distanceMeters: null,
      telemetryAgeSeconds: null,
      speedKmh: null,
      telemetryTimestamp: null,
      arrivalTimestamp: arrivalTs,
      departureTimestamp: departureTs
    };
  }

  // Telemetry freshness
  const ageSeconds = diffSeconds(latestPing.timestamp, tEval);
  if (ageSeconds === null || ageSeconds < 0 || ageSeconds > telemetryFreshnessSec) {
    reasons.push(
      `Latest telemetry at ${latestPing.timestamp} is ${ageSeconds ?? 'unknown'}s old (max allowed ${telemetryFreshnessSec}s)`
    );
  }

  // Speed must be zero
  if (latestPing.speed_kmh !== 0) {
    reasons.push(
      `GPS speed is ${latestPing.speed_kmh} km/h (must be 0 for stationary dwelling)`
    );
  }

  // Geofence distance
  const distanceMeters = haversineMeters(
    latestPing.latitude,
    latestPing.longitude,
    stop.lat,
    stop.lon
  );

  if (distanceMeters > geofenceRadius) {
    reasons.push(
      `GPS distance ${distanceMeters.toFixed(1)}m from stop exceeds ${geofenceRadius}m geofence`
    );
  }

  const isDwelling = reasons.length === 0;

  return {
    isDwelling,
    busId,
    tripId,
    stopId,
    reasons,
    distanceMeters,
    telemetryAgeSeconds: ageSeconds,
    speedKmh: latestPing.speed_kmh,
    telemetryTimestamp: latestPing.timestamp,
    arrivalTimestamp: arrivalTs,
    departureTimestamp: departureTs
  };
}
