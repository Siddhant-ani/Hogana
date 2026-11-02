/**
 * HOGANA — Operational Intelligence Engine
 * GPS Freshness, Fleet Availability & Relief Bus Engine (§4.4.2, §7)
 * 
 * Strict Rules:
 * - General stale-GPS threshold: > 5 minutes (300s).
 * - Dwelling telemetry threshold: <= 60s (strictly separate).
 * - No extrapolation of missing positions; future telemetry strictly excluded.
 * - Standby driver must be role='driver', status='standby', on shift [shift_start, shift_end).
 * - Relief feasibility requires standby bus staged at corridor origin + on-shift driver.
 * - Mandatory disclaimer: deadhead travel time, depot clearance, and traffic are NOT fabricated.
 */

import { Direction, Vehicle, CrewAvailability, BusPosition, Stop } from '../dataset/types';
import {
  GpsFreshnessResult,
  FleetInventory,
  StandbyDriverAvailability,
  ReliefBusRecommendation,
  LargeGapAlert
} from './types';
import { parseIsoToSeconds, diffSeconds, isAtOrBefore, isWithinWindow } from './time-utils';

export interface EvaluateGpsFreshnessOptions {
  busId: string;
  busPositions: BusPosition[];
  evaluationTime: string;
  staleThresholdSeconds?: number;
}

/**
 * Evaluates telemetry freshness for a specific vehicle at evaluation timestamp T_eval (§7).
 * Filters strictly to telemetry recorded on or before T_eval.
 */
export function evaluateGpsFreshness(options: EvaluateGpsFreshnessOptions): GpsFreshnessResult {
  const { busId, busPositions, evaluationTime, staleThresholdSeconds = 300 } = options;

  const busPings = busPositions
    .filter((p) => p.bus_id === busId && isAtOrBefore(p.timestamp, evaluationTime))
    .sort((a, b) => parseIsoToSeconds(b.timestamp) - parseIsoToSeconds(a.timestamp));

  const latest = busPings[0];
  if (!latest) {
    return {
      busId,
      evaluationTime,
      latestPositionTimestamp: null,
      ageSeconds: null,
      isFreshGeneral: false,
      isFreshDwelling: false,
      latitude: null,
      longitude: null,
      speedKmh: null,
      status: 'no_telemetry'
    };
  }

  const ageSeconds = diffSeconds(latest.timestamp, evaluationTime);
  const isFreshGeneral = ageSeconds !== null && ageSeconds >= 0 && ageSeconds <= staleThresholdSeconds;
  const isFreshDwelling = ageSeconds !== null && ageSeconds >= 0 && ageSeconds <= 60;

  return {
    busId,
    evaluationTime,
    latestPositionTimestamp: latest.timestamp,
    ageSeconds,
    isFreshGeneral,
    isFreshDwelling,
    latitude: latest.latitude,
    longitude: latest.longitude,
    speedKmh: latest.speed_kmh,
    status: isFreshGeneral ? 'fresh' : 'stale'
  };
}

/**
 * Categorizes fleet into active, standby, and maintenance inventories (§7).
 */
export function getFleetInventory(vehicles: Vehicle[]): FleetInventory {
  const activeVehicles: { bus_id: string; location: string }[] = [];
  const standbyVehicles: { bus_id: string; location: string }[] = [];
  const maintenanceVehicles: { bus_id: string; location: string }[] = [];

  for (const v of vehicles) {
    const item = { bus_id: v.bus_id, location: v.current_location_stop_id };
    if (v.status === 'active') {
      activeVehicles.push(item);
    } else if (v.status === 'standby') {
      standbyVehicles.push(item);
    } else if (v.status === 'maintenance') {
      maintenanceVehicles.push(item);
    }
  }

  return {
    totalVehicles: vehicles.length,
    activeCount: activeVehicles.length,
    standbyCount: standbyVehicles.length,
    maintenanceCount: maintenanceVehicles.length,
    activeVehicles,
    standbyVehicles,
    maintenanceVehicles
  };
}

export interface GetStandbyDriverAvailabilityOptions {
  crewAvailability: CrewAvailability[];
  evaluationTime: string;
}

/**
 * Checks whether an evaluation timestamp falls within a driver's start-inclusive, end-exclusive shift.
 * Handles both time-of-day strings (e.g. "14:00", "22:00") and full ISO timestamps.
 */
export function isShiftCovering(evalTime: string, shiftStart: string, shiftEnd: string): boolean {
  if (shiftStart.includes('T')) {
    return isWithinWindow(evalTime, shiftStart, shiftEnd);
  }

  // Extract HH:mm from evalTime
  const evalTimeOfDay = evalTime.includes('T')
    ? evalTime.split('T')[1].substring(0, 5)
    : evalTime.substring(0, 5);
  const start = shiftStart.substring(0, 5);
  const end = shiftEnd.substring(0, 5);

  if (start <= end) {
    return evalTimeOfDay >= start && evalTimeOfDay < end;
  } else {
    // Overnight shift: e.g. [22:00, 06:00)
    return evalTimeOfDay >= start || evalTimeOfDay < end;
  }
}

/**
 * Evaluates standby driver shift coverage at evaluation timestamp T_eval (§4.4.2).
 * Drivers must have role='driver' and status='standby'.
 * Shift coverage is evaluated start-inclusive, end-exclusive: [shift_start, shift_end).
 */
export function getStandbyDriverAvailability(
  options: GetStandbyDriverAvailabilityOptions
): StandbyDriverAvailability {
  const { crewAvailability, evaluationTime } = options;

  // Filter standby drivers
  const standbyDrivers = crewAvailability.filter(
    (c) => c.role === 'driver' && c.status === 'standby'
  );

  const onShiftStandbyDrivers: { crew_id: string; shift_start: string; shift_end: string }[] = [];
  const offShiftStandbyDrivers: { crew_id: string; shift_start: string; shift_end: string }[] = [];

  for (const d of standbyDrivers) {
    const item = { crew_id: d.crew_id, shift_start: d.shift_start, shift_end: d.shift_end };
    if (isShiftCovering(evaluationTime, d.shift_start, d.shift_end)) {
      onShiftStandbyDrivers.push(item);
    } else {
      offShiftStandbyDrivers.push(item);
    }
  }

  return {
    totalStandbyDrivers: standbyDrivers.length,
    onShiftStandbyDrivers,
    offShiftStandbyDrivers,
    evaluationTime
  };
}

export interface EvaluateReliefBusOptions {
  gapAlert: LargeGapAlert;
  routeId: string;
  routeName?: string;
  direction: Direction;
  vehicles: Vehicle[];
  crewAvailability: CrewAvailability[];
  stops: Stop[];
  evaluationTime: string;
}

const LIMITATIONS_DISCLAIMER =
  'Deadhead travel time, depot clearance time, and en-route traffic from base to insertion point are NOT calculated or simulated in this prototype. The system does not fabricate travel-time estimates and does not claim verified real-time route feasibility.';

/**
 * Evaluates feasibility of deploying a relief bus in response to a large gap alert (§4.4.2).
 * 
 * Preserves the approved evening demonstration scenario at Hebbal (T_eval 18:15:00):
 * - Cancelled trip T-DN-033 causes a 24-minute departure gap.
 * - Standby bus BUS-13 is staged at hebbal-down.
 * - Standby driver CREW-24 is on Shift 2 [14:00, 22:00).
 * - Feasibility is confirmed.
 */
export function evaluateReliefBusRecommendation(
  options: EvaluateReliefBusOptions
): ReliefBusRecommendation {
  const {
    gapAlert,
    routeId,
    routeName = 'Silk Board ↔ Hebbal Corridor',
    direction,
    vehicles,
    crewAvailability,
    stops,
    evaluationTime
  } = options;

  // 0. Direction validation: verify that gapAlert.direction matches the requested deployment direction
  if (gapAlert.direction !== direction) {
    return {
      status: 'unconfirmed',
      routeId,
      direction,
      gapAlert,
      deploymentTime: evaluationTime,
      deploymentOriginStopId: '',
      standbyBusId: null,
      standbyDriverId: null,
      recommendationText: `Relief deployment feasibility cannot be confirmed: Alert direction (${gapAlert.direction}) and proposed relief deployment direction (${direction}) do not match.`,
      unconfirmedReason: `Gap alert direction (${gapAlert.direction}) does not match proposed relief deployment direction (${direction})`,
      limitationsDisclaimer: LIMITATIONS_DISCLAIMER
    };
  }

  // Identify deployment origin terminal stop for this route and direction
  // UP: Silk Board (sequence 1); DOWN: Hebbal (sequence 1)
  const originStop = stops.find(
    (s) => s.route_id === routeId && s.direction === direction && s.sequence === 1
  );

  // Strictly require a recognized directional origin terminal; never fall back to gapAlert.stop_id
  if (!originStop) {
    return {
      status: 'unconfirmed',
      routeId,
      direction,
      gapAlert,
      deploymentTime: evaluationTime,
      deploymentOriginStopId: '',
      standbyBusId: null,
      standbyDriverId: null,
      recommendationText:
        'Relief deployment feasibility cannot be confirmed: Recognized origin terminal not found for route and direction.',
      unconfirmedReason: 'Recognized origin terminal not found for route and direction',
      limitationsDisclaimer: LIMITATIONS_DISCLAIMER
    };
  }

  const deploymentOriginStopId = originStop.stop_id;

  // 1. Verify Standby Vehicle Availability at origin
  const standbyVehicles = vehicles.filter((v) => v.status === 'standby');
  if (standbyVehicles.length === 0) {
    return {
      status: 'unconfirmed',
      routeId,
      direction,
      gapAlert,
      deploymentTime: evaluationTime,
      deploymentOriginStopId,
      standbyBusId: null,
      standbyDriverId: null,
      recommendationText:
        'Relief deployment feasibility cannot be confirmed: No standby vehicle available.',
      unconfirmedReason: 'No standby vehicle available',
      limitationsDisclaimer: LIMITATIONS_DISCLAIMER
    };
  }

  // Find standby vehicle staged at deployment origin
  const matchingBus = standbyVehicles.find(
    (v) => v.current_location_stop_id === deploymentOriginStopId
  );

  if (!matchingBus) {
    return {
      status: 'unconfirmed',
      routeId,
      direction,
      gapAlert,
      deploymentTime: evaluationTime,
      deploymentOriginStopId,
      standbyBusId: null,
      standbyDriverId: null,
      recommendationText:
        'Relief deployment feasibility cannot be confirmed: Standby vehicle deployment origin is unrecorded or incompatible with route direction.',
      unconfirmedReason: 'Standby vehicle deployment origin incompatible with route direction',
      limitationsDisclaimer: LIMITATIONS_DISCLAIMER
    };
  }

  // 2. Verify Standby Driver on Shift at evaluationTime
  const driverAvail = getStandbyDriverAvailability({
    crewAvailability,
    evaluationTime
  });

  if (driverAvail.onShiftStandbyDrivers.length === 0) {
    return {
      status: 'unconfirmed',
      routeId,
      direction,
      gapAlert,
      deploymentTime: evaluationTime,
      deploymentOriginStopId,
      standbyBusId: matchingBus.bus_id,
      standbyDriverId: null,
      recommendationText:
        'Relief deployment feasibility cannot be confirmed: No standby driver currently on shift for proposed deployment time.',
      unconfirmedReason: 'No standby driver currently on shift for proposed deployment time',
      limitationsDisclaimer: LIMITATIONS_DISCLAIMER
    };
  }

  const selectedDriver = driverAvail.onShiftStandbyDrivers[0];
  const originName = originStop ? originStop.stop_name : deploymentOriginStopId;
  const gapMinutes = Math.round(gapAlert.measured_seconds / 60);

  const recommendationText = `Large service gap of ${gapMinutes} min detected at ${originName} departure. Standby bus ${matchingBus.bus_id} staged at ${originName} with on-shift standby driver ${selectedDriver.crew_id} available. Recommend deploying relief trip on ${routeName} ${direction}.`;

  return {
    status: 'feasible',
    routeId,
    direction,
    gapAlert,
    deploymentTime: evaluationTime,
    deploymentOriginStopId,
    standbyBusId: matchingBus.bus_id,
    standbyDriverId: selectedDriver.crew_id,
    recommendationText,
    limitationsDisclaimer: LIMITATIONS_DISCLAIMER
  };
}
