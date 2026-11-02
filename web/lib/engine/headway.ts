/**
 * HOGANA — Operational Intelligence Engine
 * Headway Engine: Observed Headway & Irregularity CV (§3.1, §3.3)
 * 
 * Strict Rules:
 * - All headways calculated in integer seconds internally.
 * - Only consecutive operating, non-cancelled trips at the same directional stop.
 * - Missing or null actual arrival timestamps are never converted to zero.
 * - Anti-lookahead: optional T_eval hides any event after T_eval.
 * - CV requires >= 2 valid observed headways; window is [T_start, T_end).
 */

import { Direction, ScheduledTrip, StopTime } from '../dataset/types';
import { ObservedHeadway, HeadwayCalculationResult, HeadwayCVResult } from './types';
import { parseIsoToSeconds, diffSeconds, isWithinWindow, isAtOrBefore } from './time-utils';

export interface CalculateObservedHeadwaysOptions {
  stopId: string;
  direction?: Direction;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
  evaluationTime?: string;
}

/**
 * Calculates observed headways between consecutive operating buses at a specific directional stop (§3.1).
 */
export function calculateObservedHeadways(
  options: CalculateObservedHeadwaysOptions
): HeadwayCalculationResult {
  const { stopId, direction, stopTimes, scheduledTrips, evaluationTime } = options;

  // Build trip lookup
  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Filter stopTimes for this stop
  const candidateVisits = stopTimes.filter((st) => {
    if (st.stop_id !== stopId) return false;
    const trip = tripMap.get(st.trip_id);
    if (!trip) return false;

    // Must be an operated trip
    if (trip.final_outcome !== 'operated') return false;

    // Check direction if specified
    if (direction && trip.direction !== direction) return false;

    // Must have a valid actual arrival
    if (!st.actual_arrival) return false;

    // Anti-lookahead constraint
    if (evaluationTime && !isAtOrBefore(st.actual_arrival, evaluationTime)) {
      return false;
    }

    return true;
  });

  // Sort chronologically by actual_arrival
  candidateVisits.sort((a, b) => {
    const ta = parseIsoToSeconds(a.actual_arrival!);
    const tb = parseIsoToSeconds(b.actual_arrival!);
    return ta - tb;
  });

  const observedHeadways: ObservedHeadway[] = [];

  for (let i = 1; i < candidateVisits.length; i++) {
    const lead = candidateVisits[i - 1];
    const trail = candidateVisits[i];

    const leadTrip = tripMap.get(lead.trip_id)!;
    const trailTrip = tripMap.get(trail.trip_id)!;

    const headwaySec = diffSeconds(lead.actual_arrival, trail.actual_arrival);
    if (headwaySec !== null && headwaySec >= 0) {
      observedHeadways.push({
        stopId,
        direction: leadTrip.direction,
        leadingTripId: lead.trip_id,
        trailingTripId: trail.trip_id,
        leadingBusId: leadTrip.bus_id ?? 'UNKNOWN',
        trailingBusId: trailTrip.bus_id ?? 'UNKNOWN',
        leadingActualArrival: lead.actual_arrival!,
        trailingActualArrival: trail.actual_arrival!,
        headwaySeconds: headwaySec
      });
    }
  }

  const determinedDirection: Direction =
    direction ?? (candidateVisits[0] ? tripMap.get(candidateVisits[0].trip_id)!.direction : 'UP');

  if (candidateVisits.length < 2 || observedHeadways.length === 0) {
    return {
      status: 'insufficient_data',
      stopId,
      direction: determinedDirection,
      headways: [],
      validObservationCount: candidateVisits.length,
      insufficientReason:
        candidateVisits.length < 2
          ? `Insufficient arrivals (${candidateVisits.length}): at least 2 consecutive operating arrivals required`
          : 'No valid headway pairs could be computed'
    };
  }

  return {
    status: 'ok',
    stopId,
    direction: determinedDirection,
    headways: observedHeadways,
    validObservationCount: candidateVisits.length
  };
}

export interface CalculateHeadwayCVOptions {
  stopId: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  headways?: ObservedHeadway[];
  stopTimes?: StopTime[];
  scheduledTrips?: ScheduledTrip[];
  direction?: Direction;
  evaluationTime?: string;
}

/**
 * Calculates Headway Irregularity (Coefficient of Variation) over a time window [T_start, T_end) (§3.3).
 * CV = standard deviation of observed headways / mean observed headway.
 * 
 * Requires >= 2 observed headways within the window.
 */
export function calculateHeadwayCV(options: CalculateHeadwayCVOptions): HeadwayCVResult {
  const { stopId, timeWindowStart, timeWindowEnd } = options;

  let candidateHeadways: ObservedHeadway[] = [];

  if (options.headways) {
    candidateHeadways = options.headways.filter((h) => {
      if (h.stopId !== stopId) return false;
      if (options.direction && h.direction !== options.direction) return false;
      if (options.evaluationTime && !isAtOrBefore(h.trailingActualArrival, options.evaluationTime)) {
        return false;
      }
      return true;
    });
  } else if (options.stopTimes && options.scheduledTrips) {
    const calcResult = calculateObservedHeadways({
      stopId,
      direction: options.direction,
      stopTimes: options.stopTimes,
      scheduledTrips: options.scheduledTrips,
      evaluationTime: options.evaluationTime
    });
    candidateHeadways = calcResult.headways;
  } else {
    return {
      status: 'insufficient_data',
      stopId,
      timeWindowStart,
      timeWindowEnd,
      observationCount: 0,
      meanHeadwaySeconds: null,
      stdDevHeadwaySeconds: null,
      cv: null,
      insufficientReason: 'Neither headways array nor stopTimes/scheduledTrips provided'
    };
  }

  // Filter headways whose trailing arrival timestamp falls into start-inclusive, end-exclusive window [T_start, T_end)
  const windowHeadways = candidateHeadways.filter((h) =>
    isWithinWindow(h.trailingActualArrival, timeWindowStart, timeWindowEnd)
  );

  const n = windowHeadways.length;
  if (n < 2) {
    return {
      status: 'insufficient_data',
      stopId,
      timeWindowStart,
      timeWindowEnd,
      observationCount: n,
      meanHeadwaySeconds: null,
      stdDevHeadwaySeconds: null,
      cv: null,
      insufficientReason: `Insufficient headways in window (${n}): at least 2 required to compute CV`
    };
  }

  const values = windowHeadways.map((h) => h.headwaySeconds);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  if (mean <= 0) {
    return {
      status: 'insufficient_data',
      stopId,
      timeWindowStart,
      timeWindowEnd,
      observationCount: n,
      meanHeadwaySeconds: mean,
      stdDevHeadwaySeconds: null,
      cv: null,
      insufficientReason: 'Mean headway is non-positive; CV cannot be defined'
    };
  }

  // Population standard deviation (sigma) per operational dataset specification (§3.3)
  const varianceSum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const stdDev = Math.sqrt(varianceSum / n);
  const cv = Number((stdDev / mean).toFixed(4));

  return {
    status: 'ok',
    stopId,
    timeWindowStart,
    timeWindowEnd,
    observationCount: n,
    meanHeadwaySeconds: Math.round(mean),
    stdDevHeadwaySeconds: Number(stdDev.toFixed(2)),
    cv
  };
}
