/**
 * HOGANA — Operational Intelligence Engine
 * Passenger Occupancy & Crowding Engine (§3.4, §3.5, §4.3, §4.4.3)
 * 
 * Strict Rules:
 * - occupancy_pct = (onboard_after / capacity_total) * 100.
 * - capacity_total obtained directly from assigned vehicle; never assumed.
 * - Missing passenger load displays "Load data unavailable"; never treated as 0.
 * - Invalid/missing vehicle capacity triggers a data-quality error.
 * - 150% severe overcrowding represents 1.5x design capacity (e.g. 90/60).
 * - Frequency increase recommendation requires >= 3 consecutive severely overcrowded stops.
 */

import {
  Direction,
  ScheduledTrip,
  PassengerLoad,
  Vehicle,
  StopTime,
  DemoAssumptions
} from '../dataset/types';
import {
  OccupancyObservation,
  CrowdingLevel,
  CrowdingAlert,
  FrequencyIncreaseRecommendation
} from './types';
import { isAtOrBefore } from './time-utils';

export interface CalculateOccupancyOptions {
  passengerLoads: PassengerLoad[];
  vehicles: Vehicle[];
  scheduledTrips: ScheduledTrip[];
  stopTimes?: StopTime[];
  assumptions?: DemoAssumptions;
  evaluationTime?: string;
}

/**
 * Classifies a numeric occupancy percentage into crowding levels (§3.5).
 */
export function classifyCrowding(
  occupancyPct: number | null,
  assumptions?: DemoAssumptions
): CrowdingLevel | 'unavailable' {
  if (occupancyPct === null || isNaN(occupancyPct)) {
    return 'unavailable';
  }
  const overcrowdingPct = assumptions?.crowding?.overcrowding_pct ?? 100;
  const severePct = assumptions?.crowding?.severe_overcrowding_pct ?? 150;

  if (occupancyPct >= severePct) {
    return 'severely_overcrowded';
  }
  if (occupancyPct >= overcrowdingPct) {
    return 'overcrowded';
  }
  return 'normal';
}

/**
 * Calculates passenger occupancy and crowding classification for all passenger load observations (§3.4, §3.5).
 */
export function calculatePassengerOccupancy(
  options: CalculateOccupancyOptions
): OccupancyObservation[] {
  const { passengerLoads, vehicles, scheduledTrips, stopTimes, assumptions, evaluationTime } =
    options;

  const vehicleMap = new Map<string, Vehicle>();
  for (const v of vehicles) {
    vehicleMap.set(v.bus_id, v);
  }

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Build stop time lookup if provided to associate observation timestamp
  const stopTimeMap = new Map<string, StopTime>();
  if (stopTimes) {
    for (const st of stopTimes) {
      stopTimeMap.set(`${st.trip_id}:${st.stop_sequence}`, st);
    }
  }

  const results: OccupancyObservation[] = [];

  for (const pl of passengerLoads) {
    const trip = tripMap.get(pl.trip_id);
    const busId = trip?.bus_id ?? 'UNKNOWN';

    // Associate each passenger-load record with its corresponding stop-time observation
    const stKey = `${pl.trip_id}:${pl.stop_sequence}`;
    const st = stopTimeMap.get(stKey);
    const actualArrival = st?.actual_arrival ?? null;

    // Strict Anti-Lookahead in replay mode:
    // When T_eval is supplied, require confirmed actual arrival at or before T_eval.
    // Do not use scheduled arrival as proof of an actual load observation.
    // Exclude records that have not occurred on or before T_eval.
    if (evaluationTime) {
      if (!actualArrival || !isAtOrBefore(actualArrival, evaluationTime)) {
        continue;
      }
    }

    // 1. Missing onboard_after
    if (pl.onboard_after === null || pl.onboard_after === undefined) {
      results.push({
        tripId: pl.trip_id,
        stopId: pl.stop_id,
        stopSequence: pl.stop_sequence,
        busId,
        onboardAfter: null,
        capacityTotal: null,
        occupancyPct: null,
        level: 'unavailable',
        statusText: 'Load data unavailable',
        timestamp: actualArrival
      });
      continue;
    }

    // 2. Vehicle lookup & capacity validation
    const vehicle = trip?.bus_id ? vehicleMap.get(trip.bus_id) : undefined;
    if (!vehicle || !vehicle.capacity_total || vehicle.capacity_total <= 0) {
      results.push({
        tripId: pl.trip_id,
        stopId: pl.stop_id,
        stopSequence: pl.stop_sequence,
        busId,
        onboardAfter: pl.onboard_after,
        capacityTotal: vehicle?.capacity_total ?? null,
        occupancyPct: null,
        level: 'error',
        statusText: 'Vehicle capacity invalid or missing',
        timestamp: actualArrival
      });
      continue;
    }

    // 3. Occupancy calculation
    const capacityTotal = vehicle.capacity_total;
    const occupancyPct = Number(((pl.onboard_after / capacityTotal) * 100).toFixed(1));
    const level = classifyCrowding(occupancyPct, assumptions);

    let statusText: string;
    if (level === 'severely_overcrowded') {
      statusText = `Severely Overcrowded (${occupancyPct}% of design capacity)`;
    } else if (level === 'overcrowded') {
      statusText = `Overcrowded (${occupancyPct}% of design capacity)`;
    } else {
      statusText = `Normal (${occupancyPct}% of design capacity)`;
    }

    results.push({
      tripId: pl.trip_id,
      stopId: pl.stop_id,
      stopSequence: pl.stop_sequence,
      busId,
      onboardAfter: pl.onboard_after,
      capacityTotal,
      occupancyPct,
      level,
      statusText,
      timestamp: actualArrival
    });
  }

  return results;
}

/**
 * Detects crowding alerts for stop visits where occupancy reaches or exceeds warning/critical thresholds (§4.3).
 * Never creates an alert with an UNKNOWN or missing timestamp.
 */
export function detectCrowdingAlerts(
  observations: OccupancyObservation[]
): CrowdingAlert[] {
  const alerts: CrowdingAlert[] = [];

  for (const obs of observations) {
    if (
      obs.occupancyPct === null ||
      obs.onboardAfter === null ||
      obs.capacityTotal === null ||
      !obs.timestamp
    ) {
      continue;
    }

    if (obs.level === 'severely_overcrowded') {
      alerts.push({
        alert_type: 'crowding',
        severity: 'critical',
        trip_id: obs.tripId,
        stop_id: obs.stopId,
        bus_id: obs.busId,
        onboard_after: obs.onboardAfter,
        capacity_total: obs.capacityTotal,
        occupancy_pct: obs.occupancyPct,
        timestamp: obs.timestamp
      });
    } else if (obs.level === 'overcrowded') {
      alerts.push({
        alert_type: 'crowding',
        severity: 'warning',
        trip_id: obs.tripId,
        stop_id: obs.stopId,
        bus_id: obs.busId,
        onboard_after: obs.onboardAfter,
        capacity_total: obs.capacityTotal,
        occupancy_pct: obs.occupancyPct,
        timestamp: obs.timestamp
      });
    }
  }

  return alerts;
}

export interface EvaluateFrequencyIncreaseOptions {
  tripId: string;
  routeId: string;
  routeName?: string;
  direction: Direction;
  tripLoads: PassengerLoad[];
  vehicles: Vehicle[];
  scheduledTrips: ScheduledTrip[];
  stopTimes?: StopTime[];
  assumptions?: DemoAssumptions;
  evaluationTime?: string;
  expectedStopCount?: number;
}

/**
 * Evaluates whether sustained severe overcrowding across >= 3 strictly consecutive stops warrants
 * an advisory frequency-increase recommendation (§4.4.3).
 * 
 * Verifies complete and adjacent stop sequence (e.g. 1, 3, 4 is rejected as non-consecutive).
 * Detects missing intermediate stops and null loads.
 */
export function evaluateFrequencyIncreaseRecommendation(
  options: EvaluateFrequencyIncreaseOptions
): FrequencyIncreaseRecommendation {
  const {
    tripId,
    routeId,
    routeName,
    direction,
    tripLoads,
    vehicles,
    scheduledTrips,
    stopTimes,
    assumptions,
    evaluationTime
  } = options;

  // Filter strictly by the requested trip
  const relevantLoads = tripLoads.filter((l) => l.trip_id === tripId);
  if (relevantLoads.length === 0) {
    return {
      status: 'insufficient_data',
      tripId,
      routeId,
      direction,
      consecutiveSeverelyOvercrowdedStops: [],
      recommendationText: 'Incomplete load records — cannot confirm sustained corridor overcrowding.',
      reason: `No passenger load records found for trip ${tripId}`
    };
  }

  const observations = calculatePassengerOccupancy({
    passengerLoads: relevantLoads,
    vehicles,
    scheduledTrips,
    stopTimes,
    assumptions,
    evaluationTime
  });

  if (observations.length === 0) {
    return {
      status: 'insufficient_data',
      tripId,
      routeId,
      direction,
      consecutiveSeverelyOvercrowdedStops: [],
      recommendationText: 'Incomplete load records — cannot confirm sustained corridor overcrowding.',
      reason: 'No valid load observations recorded on or before evaluation time'
    };
  }

  // Sort observations strictly by stop_sequence
  observations.sort((a, b) => a.stopSequence - b.stopSequence);

  let hasMissingOrIncomplete = false;

  // If some supplied trip loads were excluded (e.g. future arrivals in replay mode or missing stop_times)
  if (observations.length < relevantLoads.length) {
    hasMissingOrIncomplete = true;
  }

  // Check if any observation has unavailable/null load or vehicle error
  for (const obs of observations) {
    if (obs.level === 'unavailable' || obs.level === 'error' || obs.onboardAfter === null) {
      hasMissingOrIncomplete = true;
    }
  }

  // Check sequence continuity: ensure no missing sequences between min and max sequence
  const observedSequences = new Set(observations.map((o) => o.stopSequence));
  const minSeq = observations[0].stopSequence;
  const maxSeq = observations[observations.length - 1].stopSequence;
  for (let s = minSeq; s <= maxSeq; s++) {
    if (!observedSequences.has(s)) {
      hasMissingOrIncomplete = true;
    }
  }

  // Track max consecutive severely overcrowded stops with strict adjacent sequence checking (seq_{i+1} === seq_i + 1)
  let currentRun: { stopId: string; seq: number }[] = [];
  let maxRun: { stopId: string; seq: number }[] = [];

  for (const obs of observations) {
    if (obs.level === 'severely_overcrowded') {
      if (currentRun.length === 0) {
        currentRun.push({ stopId: obs.stopId, seq: obs.stopSequence });
      } else {
        const last = currentRun[currentRun.length - 1];
        if (obs.stopSequence === last.seq + 1) {
          currentRun.push({ stopId: obs.stopId, seq: obs.stopSequence });
        } else {
          // Sequence gap (e.g. 1, 3): reset run and mark incomplete
          hasMissingOrIncomplete = true;
          currentRun = [{ stopId: obs.stopId, seq: obs.stopSequence }];
        }
      }
      if (currentRun.length > maxRun.length) {
        maxRun = [...currentRun];
      }
    } else {
      currentRun = [];
    }
  }

  const consecutiveStops = maxRun.map((r) => r.stopId);

  if (maxRun.length >= 3) {
    const routeLabel = routeName ?? routeId;
    return {
      status: 'recommended',
      tripId,
      routeId,
      direction,
      consecutiveSeverelyOvercrowdedStops: consecutiveStops,
      recommendationText: `Sustained severe overcrowding detected across 3+ consecutive stops on route ${routeLabel} ${direction}. Recommend scheduling additional peak service trips in next scheduling cycle.`
    };
  }

  if (hasMissingOrIncomplete) {
    return {
      status: 'insufficient_data',
      tripId,
      routeId,
      direction,
      consecutiveSeverelyOvercrowdedStops: consecutiveStops,
      recommendationText: 'Incomplete load records — cannot confirm sustained corridor overcrowding.',
      reason: 'Missing intermediate stop sequence or unavailable passenger load data'
    };
  }

  return {
    status: 'not_indicated',
    tripId,
    routeId,
    direction,
    consecutiveSeverelyOvercrowdedStops: consecutiveStops,
    recommendationText: 'No sustained severe overcrowding across 3+ consecutive stops.'
  };
}
