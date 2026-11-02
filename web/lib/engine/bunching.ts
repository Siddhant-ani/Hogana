/**
 * HOGANA — Operational Intelligence Engine
 * Bus Bunching Detection & Dispatcher Hold Recommendation (§4.1, §4.4.1)
 * 
 * Strict Rules:
 * - Rule-based detection using configurable bunching threshold (default: 120s).
 * - Live holding evaluation strictly requires trailing bus to be dwelling at a designated control stop.
 * - Current elapsed departure separation: Delta T_current = T_eval - lead_actual_departure.
 * - Feasible hold is capped by remaining delay allowance (max_delay_tolerance - current_delay).
 * - Partial correction disclosure: never claim target is restored if projected_gap < target_headway.
 * - Missing arrival data must never generate a bunching alert.
 */

import { Direction, ScheduledTrip, StopTime, Stop, BusPosition, DemoAssumptions } from '../dataset/types';
import { BunchingAlert, HoldRecommendation } from './types';
import { parseIsoToSeconds, diffSeconds, isAtOrBefore } from './time-utils';
import { evaluateDwellingState } from './replay-state';
import { getNominalScheduledHeadwaySeconds } from './service-gaps';

export interface DetectStopArrivalBunchingOptions {
  stopId: string;
  direction?: Direction;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
  assumptions?: DemoAssumptions;
  evaluationTime?: string;
}

/**
 * Detects bus bunching from observed arrival headways at a stop (§4.1).
 * Triggers when observed arrival headway is strictly below bunching threshold.
 */
export function detectStopArrivalBunching(
  options: DetectStopArrivalBunchingOptions
): BunchingAlert[] {
  const { stopId, direction, stopTimes, scheduledTrips, assumptions, evaluationTime } = options;

  const thresholdSec = assumptions?.headway?.bunching_threshold_seconds ?? 120;

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Filter operated stop arrivals
  const validArrivals = stopTimes.filter((st) => {
    if (st.stop_id !== stopId) return false;
    const trip = tripMap.get(st.trip_id);
    if (!trip || trip.final_outcome !== 'operated') return false;
    if (direction && trip.direction !== direction) return false;
    if (!st.actual_arrival) return false;
    if (evaluationTime && !isAtOrBefore(st.actual_arrival, evaluationTime)) return false;
    return true;
  });

  validArrivals.sort((a, b) => {
    return parseIsoToSeconds(a.actual_arrival!) - parseIsoToSeconds(b.actual_arrival!);
  });

  const alerts: BunchingAlert[] = [];

  for (let i = 1; i < validArrivals.length; i++) {
    const lead = validArrivals[i - 1];
    const trail = validArrivals[i];
    const leadTrip = tripMap.get(lead.trip_id)!;
    const trailTrip = tripMap.get(trail.trip_id)!;

    const headwaySec = diffSeconds(lead.actual_arrival, trail.actual_arrival);
    if (headwaySec === null) continue;

    if (headwaySec < thresholdSec) {
      alerts.push({
        alert_type: 'bunching',
        severity: 'warning',
        stop_id: stopId,
        direction: leadTrip.direction,
        bus_id_leading: leadTrip.bus_id ?? 'UNKNOWN',
        bus_id_trailing: trailTrip.bus_id ?? 'UNKNOWN',
        trip_id_leading: lead.trip_id,
        trip_id_trailing: trail.trip_id,
        measured_seconds: headwaySec,
        threshold_seconds: thresholdSec,
        bunching_type: 'arrival_headway',
        timestamp: trail.actual_arrival!,
        note: `Observed arrival headway of ${headwaySec}s is strictly below bunching threshold (${thresholdSec}s)`
      });
    }
  }

  return alerts;
}

export interface EvaluateHoldRecommendationOptions {
  controlStopId: string;
  direction: Direction;
  stop: Stop;
  scheduledTrips: ScheduledTrip[];
  stopTimes: StopTime[];
  busPositions: BusPosition[];
  evaluationTime: string;
  assumptions?: DemoAssumptions;
}

/**
 * Evaluates live bus bunching and generates a dispatcher hold recommendation (§4.1, §4.4.1).
 * 
 * Preserves the approved morning demonstration scenario at Marathahalli UP (T_eval 08:24:00).
 */
export function evaluateHoldRecommendation(
  options: EvaluateHoldRecommendationOptions
): { alert: BunchingAlert | null; recommendation: HoldRecommendation | null } {
  const {
    controlStopId,
    direction,
    stop,
    scheduledTrips,
    stopTimes,
    busPositions,
    evaluationTime,
    assumptions
  } = options;

  const tEval = evaluationTime;
  const bunchingThreshold = assumptions?.headway?.bunching_threshold_seconds ?? 120;
  const maxDelayTolerance = assumptions?.dispatch_control?.max_delay_tolerance_seconds ?? 300;
  const minViableHold = assumptions?.dispatch_control?.min_viable_hold_seconds ?? 30;

  // Verify that the stop is a designated control point
  if (!stop.is_control_point) {
    const fallbackTarget = getNominalScheduledHeadwaySeconds(tEval, assumptions);
    return {
      alert: null,
      recommendation: {
        status: 'ineligible',
        controlStopId,
        controlStopName: stop.stop_name,
        direction,
        leadingBusId: '',
        trailingBusId: '',
        leadingTripId: '',
        trailingTripId: '',
        currentElapsedSeparationSeconds: 0,
        targetHeadwaySeconds: fallbackTarget,
        holdNeededSeconds: 0,
        currentTrailingDelaySeconds: 0,
        remainingDelayAllowanceSeconds: 0,
        feasibleHoldSeconds: 0,
        projectedSeparationSeconds: 0,
        isPartialCorrection: false,
        recommendationText: `Stop ${stop.stop_name} is not a designated control point for holding interventions.`,
        rejectionReason: 'Not a control point',
        evaluatedAt: tEval
      }
    };
  }

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Find operating trips in this direction
  const operatingTrips = scheduledTrips.filter(
    (t) => t.direction === direction && t.final_outcome === 'operated'
  );

  // Stop times for this stop
  const stopTimesForStop = stopTimes.filter((st) => st.stop_id === controlStopId);

  // Group stop times by trip
  const stopTimesByTrip = new Map<string, StopTime[]>();
  for (const st of stopTimes) {
    if (!stopTimesByTrip.has(st.trip_id)) {
      stopTimesByTrip.set(st.trip_id, []);
    }
    stopTimesByTrip.get(st.trip_id)!.push(st);
  }

  // Find a trailing bus currently dwelling at this control stop
  let dwellingBusResult: {
    trip: ScheduledTrip;
    stopTime: StopTime;
    dwellingState: ReturnType<typeof evaluateDwellingState>;
  } | null = null;

  for (const trip of operatingTrips) {
    if (!trip.bus_id) continue;
    const stList = stopTimesByTrip.get(trip.trip_id) ?? [];
    const stEvent = stopTimesForStop.find((s) => s.trip_id === trip.trip_id);
    if (!stEvent) continue;

    const dwelling = evaluateDwellingState({
      busId: trip.bus_id,
      tripId: trip.trip_id,
      stopId: controlStopId,
      stop,
      trip,
      tripStopTimes: stList,
      busPositions,
      evaluationTime: tEval,
      assumptions
    });

    if (dwelling.isDwelling) {
      dwellingBusResult = { trip, stopTime: stEvent, dwellingState: dwelling };
      break;
    }
  }

  if (!dwellingBusResult) {
    return { alert: null, recommendation: null };
  }

  const trailingTrip = dwellingBusResult.trip;
  const trailingStopTime = dwellingBusResult.stopTime;
  const trailingBusId = trailingTrip.bus_id!;

  // Find the immediate preceding operating bus that departed from this stop on or before T_eval
  const departedBuses = stopTimesForStop
    .filter((st) => {
      const trip = tripMap.get(st.trip_id);
      if (!trip || trip.final_outcome !== 'operated' || trip.direction !== direction) return false;
      if (trip.trip_id === trailingTrip.trip_id) return false;
      if (!st.actual_departure) return false;
      return isAtOrBefore(st.actual_departure, tEval);
    })
    .sort((a, b) => parseIsoToSeconds(b.actual_departure!) - parseIsoToSeconds(a.actual_departure!));

  const leadingStopTime = departedBuses[0];
  if (!leadingStopTime) {
    // No preceding bus has departed yet
    return { alert: null, recommendation: null };
  }

  const leadingTrip = tripMap.get(leadingStopTime.trip_id)!;
  const leadingBusId = leadingTrip.bus_id ?? 'UNKNOWN';

  // Current elapsed departure separation: Delta T_current = T_eval - actual_departure(leading)
  const currentElapsedSeparation = diffSeconds(leadingStopTime.actual_departure, tEval);
  if (currentElapsedSeparation === null || currentElapsedSeparation < 0) {
    return { alert: null, recommendation: null };
  }

  // Check bunching trigger: Delta T_current < bunching_threshold_seconds
  if (currentElapsedSeparation >= bunchingThreshold) {
    // Not bunched
    return { alert: null, recommendation: null };
  }

  const alert: BunchingAlert = {
    alert_type: 'bunching',
    severity: 'warning',
    stop_id: controlStopId,
    direction,
    bus_id_leading: leadingBusId,
    bus_id_trailing: trailingBusId,
    trip_id_leading: leadingTrip.trip_id,
    trip_id_trailing: trailingTrip.trip_id,
    measured_seconds: currentElapsedSeparation,
    threshold_seconds: bunchingThreshold,
    bunching_type: 'live_dwelling_departure_separation',
    timestamp: tEval,
    note: `Current elapsed departure separation of ${currentElapsedSeparation}s is strictly below ${bunchingThreshold}s threshold while trailing bus is dwelling`
  };

  // Determine dynamic target headway from control stop scheduled departure and timetable assumptions (§3.2, §4.4.1)
  // Peak target: 720s (12 min); Off-peak target: 900s (15 min)
  const targetHeadway = getNominalScheduledHeadwaySeconds(
    trailingStopTime.scheduled_departure,
    assumptions
  );

  // Hold calculation (§4.4.1)
  const holdNeeded = targetHeadway - currentElapsedSeparation;

  // Trailing bus delay at T_eval: max(0, T_eval - scheduled_departure)
  const schedDepSec = parseIsoToSeconds(trailingStopTime.scheduled_departure);
  const tEvalSec = parseIsoToSeconds(tEval);
  const currentTrailingDelay = Math.max(0, tEvalSec - schedDepSec);

  // Remaining delay allowance: max_delay_tolerance - currentTrailingDelay
  const remainingDelayAllowance = Math.max(0, maxDelayTolerance - currentTrailingDelay);

  // Feasible hold: min(hold_needed, remaining_allowance) rounded down to nearest 30 seconds
  const rawFeasibleHold = Math.min(holdNeeded, remainingDelayAllowance);
  const feasibleHold = Math.floor(rawFeasibleHold / 30) * 30;

  if (feasibleHold < minViableHold) {
    const rejectionReason = `Trailing bus cannot absorb hold without exceeding maximum delay tolerance (${maxDelayTolerance} s).`;
    return {
      alert,
      recommendation: {
        status: 'rejected',
        controlStopId,
        controlStopName: stop.stop_name,
        direction,
        leadingBusId,
        trailingBusId,
        leadingTripId: leadingTrip.trip_id,
        trailingTripId: trailingTrip.trip_id,
        currentElapsedSeparationSeconds: currentElapsedSeparation,
        targetHeadwaySeconds: targetHeadway,
        holdNeededSeconds: holdNeeded,
        currentTrailingDelaySeconds: currentTrailingDelay,
        remainingDelayAllowanceSeconds: remainingDelayAllowance,
        feasibleHoldSeconds: 0,
        projectedSeparationSeconds: currentElapsedSeparation,
        isPartialCorrection: false,
        recommendationText: `Holding rejected: ${rejectionReason}`,
        rejectionReason,
        evaluatedAt: tEval
      }
    };
  }

  const projectedSeparation = currentElapsedSeparation + feasibleHold;
  const isPartialCorrection = projectedSeparation < targetHeadway;

  let recommendationText: string;
  if (!isPartialCorrection) {
    recommendationText = `Recommend holding trailing bus ${trailingBusId} at ${stop.stop_name} for ${feasibleHold} s. Projected departure gap of ${projectedSeparation} s restores the target service interval (${targetHeadway} s).`;
  } else {
    recommendationText = `Recommend holding trailing bus ${trailingBusId} at ${stop.stop_name} for ${feasibleHold} s (capped by maximum delay allowance). Note: This is a partial correction. Projected departure gap will increase from ${currentElapsedSeparation} s to ${projectedSeparation} s, attenuating bunching but not fully restoring the ${targetHeadway} s target interval.`;
  }

  return {
    alert,
    recommendation: {
      status: 'recommended',
      controlStopId,
      controlStopName: stop.stop_name,
      direction,
      leadingBusId,
      trailingBusId,
      leadingTripId: leadingTrip.trip_id,
      trailingTripId: trailingTrip.trip_id,
      currentElapsedSeparationSeconds: currentElapsedSeparation,
      targetHeadwaySeconds: targetHeadway,
      holdNeededSeconds: holdNeeded,
      currentTrailingDelaySeconds: currentTrailingDelay,
      remainingDelayAllowanceSeconds: remainingDelayAllowance,
      feasibleHoldSeconds: feasibleHold,
      projectedSeparationSeconds: projectedSeparation,
      isPartialCorrection,
      recommendationText,
      evaluatedAt: tEval
    }
  };
}
