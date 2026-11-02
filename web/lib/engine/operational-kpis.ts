/**
 * HOGANA — Operational Intelligence Engine
 * Service Fulfillment, Cancellation & Shortfall KPIs (§3.6)
 * 
 * Strict Baseline Reconciliation:
 * - 86 scheduled timetable slots.
 * - 77 operated trips (89.53%).
 * - 2 cancelled trips (2.33%).
 * - 7 resource-shortfall trips (8.14%).
 * - Combined non-operated rate: 10.47%.
 * - The denominator is ALWAYS total scheduled trip slots (86).
 */

import { ScheduledTrip, StopTime } from '../dataset/types';
import { CorridorKpis, ReplayCorridorStatus } from './types';
import { deriveTripReplayStatus } from './replay-state';

export interface CalculateCorridorKpisOptions {
  scheduledTrips: ScheduledTrip[];
  routeId?: string;
  stopTimes?: StopTime[];
  evaluationTime?: string;
}

/**
 * Calculates corridor-level operational fulfillment KPIs (§3.6).
 * 
 * In default End-of-Day mode (evaluationTime not provided):
 * Reconciles with the approved baseline across all 86 planned slots:
 * - 77 operated (89.53%)
 * - 2 cancelled (2.33%)
 * - 7 resource-shortfall (8.14%)
 * 
 * In Replay As-Of mode (evaluationTime provided):
 * Requires stopTimes; throws an error if stopTimes is omitted to prevent silent fallback.
 * Strictly counts ONLY 'completed' trips towards fulfilled/operated trips.
 * 'in_progress' trips are actively operating and are NOT counted as fulfilled.
 * Denominator remains all scheduled timetable slots.
 */
export function calculateCorridorKpis(options: CalculateCorridorKpisOptions): CorridorKpis {
  const { scheduledTrips, routeId, stopTimes, evaluationTime } = options;

  // Enforce required inputs: when evaluationTime is provided, stopTimes is strictly required
  if (evaluationTime && (!stopTimes || stopTimes.length === 0)) {
    throw new Error(
      "calculateCorridorKpis: 'stopTimes' is strictly required when 'evaluationTime' is provided. Silent fallback to end-of-day historical outcomes is prohibited in as-of replay mode."
    );
  }

  const candidateTrips = routeId
    ? scheduledTrips.filter((t) => t.route_id === routeId)
    : scheduledTrips;

  const totalScheduledTrips = candidateTrips.length;
  if (totalScheduledTrips === 0) {
    return {
      totalScheduledTrips: 0,
      operatedTrips: 0,
      cancelledTrips: 0,
      resourceShortfallTrips: 0,
      cancellationRatePct: 0,
      resourceShortfallRatePct: 0,
      combinedNonOperatedRatePct: 0,
      fulfillmentRatePct: 0
    };
  }

  let operatedTrips = 0;
  let cancelledTrips = 0;
  let resourceShortfallTrips = 0;

  // As-of Replay Mode
  if (evaluationTime && stopTimes) {
    const stopTimesByTrip = new Map<string, StopTime[]>();
    for (const st of stopTimes) {
      if (!stopTimesByTrip.has(st.trip_id)) {
        stopTimesByTrip.set(st.trip_id, []);
      }
      stopTimesByTrip.get(st.trip_id)!.push(st);
    }

    for (const t of candidateTrips) {
      const stList = stopTimesByTrip.get(t.trip_id) ?? [];
      const status = deriveTripReplayStatus(t, stList, evaluationTime);
      // Strictly count ONLY completed trips as fulfilled in as-of replay mode
      if (status === 'completed') {
        operatedTrips++;
      } else if (status === 'cancelled') {
        cancelledTrips++;
      } else if (status === 'resource_shortfall') {
        resourceShortfallTrips++;
      }
      // 'in_progress', 'scheduled', and 'unknown' are NOT counted as completed/operated
    }
  } else {
    // End-of-Day Historical Audited Mode
    for (const t of candidateTrips) {
      if (t.final_outcome === 'operated') {
        operatedTrips++;
      } else if (t.final_outcome === 'cancelled') {
        cancelledTrips++;
      } else if (t.final_outcome === 'resource_shortfall') {
        resourceShortfallTrips++;
      }
    }
  }

  const cancellationRatePct = Number(((cancelledTrips / totalScheduledTrips) * 100).toFixed(2));
  const resourceShortfallRatePct = Number(
    ((resourceShortfallTrips / totalScheduledTrips) * 100).toFixed(2)
  );
  const combinedNonOperatedRatePct = Number(
    (((cancelledTrips + resourceShortfallTrips) / totalScheduledTrips) * 100).toFixed(2)
  );
  const fulfillmentRatePct = Number(((operatedTrips / totalScheduledTrips) * 100).toFixed(2));

  return {
    totalScheduledTrips,
    operatedTrips,
    cancelledTrips,
    resourceShortfallTrips,
    cancellationRatePct,
    resourceShortfallRatePct,
    combinedNonOperatedRatePct,
    fulfillmentRatePct
  };
}

export interface CalculateReplayCorridorStatusOptions {
  scheduledTrips: ScheduledTrip[];
  stopTimes: StopTime[];
  evaluationTime: string;
  routeId?: string;
}

/**
 * Calculates live / replay operational fleet status as-of an evaluation timestamp (§4.0).
 * Categorizes all planned trips into scheduled, in_progress, completed, cancelled, resource_shortfall, unknown.
 */
export function calculateReplayCorridorStatus(
  options: CalculateReplayCorridorStatusOptions
): ReplayCorridorStatus {
  const { scheduledTrips, stopTimes, evaluationTime, routeId } = options;

  const candidateTrips = routeId
    ? scheduledTrips.filter((t) => t.route_id === routeId)
    : scheduledTrips;

  const stopTimesByTrip = new Map<string, StopTime[]>();
  for (const st of stopTimes) {
    if (!stopTimesByTrip.has(st.trip_id)) {
      stopTimesByTrip.set(st.trip_id, []);
    }
    stopTimesByTrip.get(st.trip_id)!.push(st);
  }

  let scheduledCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let resourceShortfallCount = 0;
  let unknownCount = 0;

  for (const t of candidateTrips) {
    const stList = stopTimesByTrip.get(t.trip_id) ?? [];
    const status = deriveTripReplayStatus(t, stList, evaluationTime);
    if (status === 'scheduled') {
      scheduledCount++;
    } else if (status === 'in_progress') {
      inProgressCount++;
    } else if (status === 'completed') {
      completedCount++;
    } else if (status === 'cancelled') {
      cancelledCount++;
    } else if (status === 'resource_shortfall') {
      resourceShortfallCount++;
    } else {
      unknownCount++;
    }
  }

  return {
    evaluationTime,
    totalScheduledTrips: candidateTrips.length,
    scheduledCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    resourceShortfallCount,
    unknownCount
  };
}
