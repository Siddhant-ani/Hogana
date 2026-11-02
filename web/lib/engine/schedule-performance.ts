/**
 * HOGANA — Operational Intelligence Engine
 * Schedule Performance & On-Time Performance Engine (§3.7)
 * 
 * Strict Rules:
 * - Arrival delay = actual_arrival - scheduled_arrival in seconds.
 * - Positive = late; Negative = early; Zero = on time.
 * - On-time performance denominator includes ONLY stop visits with known delays.
 * - Configurable threshold defaults to 120 seconds.
 */

import { StopTime, ScheduledTrip } from '../dataset/types';
import { ArrivalDelayResult, OnTimePerformanceResult } from './types';
import { diffSeconds, isAtOrBefore } from './time-utils';

export interface CalculateArrivalDelayOptions {
  scheduledArrival: string;
  actualArrival: string | null;
  thresholdSeconds?: number;
}

/**
 * Calculates arrival delay for an individual stop visit (§3.7).
 */
export function calculateArrivalDelay(
  tripId: string,
  stopId: string,
  stopSequence: number,
  scheduledArrival: string,
  actualArrival: string | null,
  thresholdSeconds = 120
): ArrivalDelayResult {
  if (!actualArrival) {
    return {
      tripId,
      stopId,
      stopSequence,
      scheduledArrival,
      actualArrival: null,
      delaySeconds: null,
      status: 'unavailable'
    };
  }

  const delaySec = diffSeconds(scheduledArrival, actualArrival);
  if (delaySec === null) {
    return {
      tripId,
      stopId,
      stopSequence,
      scheduledArrival,
      actualArrival,
      delaySeconds: null,
      status: 'unavailable'
    };
  }

  let status: 'on_time' | 'late' | 'early';
  if (Math.abs(delaySec) <= thresholdSeconds) {
    status = 'on_time';
  } else if (delaySec > thresholdSeconds) {
    status = 'late';
  } else {
    status = 'early';
  }

  return {
    tripId,
    stopId,
    stopSequence,
    scheduledArrival,
    actualArrival,
    delaySeconds: delaySec,
    status
  };
}

export interface CalculateOnTimePerformanceOptions {
  routeId: string;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
  thresholdSeconds?: number;
  evaluationTime?: string;
}

/**
 * Calculates corridor On-Time Performance (OTP) across all known stop visits (§3.7).
 * Denominator includes strictly stop-visits where delay is known (actual_arrival is non-null).
 */
export function calculateOnTimePerformance(
  options: CalculateOnTimePerformanceOptions
): OnTimePerformanceResult {
  const { routeId, stopTimes, scheduledTrips, thresholdSeconds = 120, evaluationTime } = options;

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    if (t.route_id === routeId) {
      tripMap.set(t.trip_id, t);
    }
  }

  let totalKnownVisits = 0;
  let onTimeVisits = 0;
  let lateVisits = 0;
  let earlyVisits = 0;

  for (const st of stopTimes) {
    const trip = tripMap.get(st.trip_id);
    if (!trip) continue;

    // Filter by actual arrival presence
    if (!st.actual_arrival) continue;

    // Anti-lookahead constraint
    if (evaluationTime && !isAtOrBefore(st.actual_arrival, evaluationTime)) {
      continue;
    }

    const delay = calculateArrivalDelay(
      st.trip_id,
      st.stop_id,
      st.stop_sequence,
      st.scheduled_arrival,
      st.actual_arrival,
      thresholdSeconds
    );

    if (delay.delaySeconds === null) continue;

    totalKnownVisits++;
    if (delay.status === 'on_time') {
      onTimeVisits++;
    } else if (delay.status === 'late') {
      lateVisits++;
    } else {
      earlyVisits++;
    }
  }

  const onTimePct =
    totalKnownVisits > 0 ? Number(((onTimeVisits / totalKnownVisits) * 100).toFixed(2)) : 0;

  return {
    routeId,
    thresholdSeconds,
    totalKnownVisits,
    onTimeVisits,
    lateVisits,
    earlyVisits,
    onTimePct
  };
}
