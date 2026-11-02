/**
 * HOGANA — Operational Intelligence Engine
 * Service Gap Engine: Nominal Timetable Headway & Large Service Gaps (§3.2, §4.2)
 * 
 * Strict Rules:
 * - Nominal scheduled intervals preserve ALL 86 scheduled departure slots (operated, cancelled, shortfall).
 * - Never derive nominal frequency only from surviving operating buses.
 * - Large gap fires only when observed headway / terminal departure gap > (nominal * multiplier).
 * - Preserves evening large gap demonstration scenario (T_eval 18:15:00, Hebbal DOWN, 1440s gap).
 */

import { Direction, ScheduledTrip, StopTime, DemoAssumptions } from '../dataset/types';
import { NominalScheduledInterval, LargeGapAlert } from './types';
import { parseIsoToSeconds, diffSeconds, isAtOrBefore } from './time-utils';

export interface CalculateNominalIntervalsOptions {
  stopId: string;
  direction?: Direction;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
}

/**
 * Calculates nominal scheduled service intervals between adjacent planned timetable slots (§3.2).
 * Preserves all scheduled departure slots, including cancelled and shortfall trips.
 */
export function calculateNominalScheduledIntervals(
  options: CalculateNominalIntervalsOptions
): NominalScheduledInterval[] {
  const { stopId, direction, stopTimes, scheduledTrips } = options;

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Filter stopTimes for this stop across ALL planned slots
  const slots = stopTimes.filter((st) => {
    if (st.stop_id !== stopId) return false;
    const trip = tripMap.get(st.trip_id);
    if (!trip) return false;
    if (direction && trip.direction !== direction) return false;
    return true;
  });

  // Sort by scheduled departure
  slots.sort((a, b) => {
    const ta = parseIsoToSeconds(a.scheduled_departure);
    const tb = parseIsoToSeconds(b.scheduled_departure);
    return ta - tb;
  });

  const intervals: NominalScheduledInterval[] = [];

  for (let i = 1; i < slots.length; i++) {
    const prev = slots[i - 1];
    const curr = slots[i];
    const prevTrip = tripMap.get(prev.trip_id)!;

    const intervalSec = diffSeconds(prev.scheduled_departure, curr.scheduled_departure);
    if (intervalSec !== null && intervalSec > 0) {
      intervals.push({
        stopId,
        direction: prevTrip.direction,
        leadingSlotTripId: prev.trip_id,
        trailingSlotTripId: curr.trip_id,
        leadingScheduledDeparture: prev.scheduled_departure,
        trailingScheduledDeparture: curr.scheduled_departure,
        nominalIntervalSeconds: intervalSec
      });
    }
  }

  return intervals;
}

/**
 * Determines nominal scheduled headway (in seconds) for a given stop and timestamp.
 * Defaults to peak (720s) or off-peak (900s) from assumptions.
 */
export function getNominalScheduledHeadwaySeconds(
  scheduledDeparture: string,
  assumptions?: DemoAssumptions
): number {
  const defaultPeak = assumptions?.headway?.nominal_peak_headway_seconds ?? 720;
  const defaultOffpeak = assumptions?.headway?.nominal_offpeak_headway_seconds ?? 900;

  // Extract HH:mm
  const timePart = scheduledDeparture.includes('T')
    ? scheduledDeparture.split('T')[1]?.substring(0, 5)
    : scheduledDeparture.substring(0, 5);

  if (!timePart) return defaultPeak;

  // Peak periods: 07:00-10:00 and 17:00-20:00
  const isPeak =
    (timePart >= '07:00' && timePart < '10:00') ||
    (timePart >= '17:00' && timePart < '20:00');

  return isPeak ? defaultPeak : defaultOffpeak;
}

export interface DetectLargeGapsOptions {
  stopId: string;
  direction?: Direction;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
  assumptions?: DemoAssumptions;
  evaluationTime?: string;
}

/**
 * Detects large service gaps from observed arrival headways at a corridor stop (§4.2).
 */
export function detectLargeGapsFromArrivals(options: DetectLargeGapsOptions): LargeGapAlert[] {
  const { stopId, direction, stopTimes, scheduledTrips, assumptions, evaluationTime } = options;

  const multiplier = assumptions?.headway?.large_gap_multiplier ?? 1.5;

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Filter valid operated stop arrivals
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

  const alerts: LargeGapAlert[] = [];

  for (let i = 1; i < validArrivals.length; i++) {
    const lead = validArrivals[i - 1];
    const trail = validArrivals[i];
    const leadTrip = tripMap.get(lead.trip_id)!;
    const trailTrip = tripMap.get(trail.trip_id)!;

    const headwaySec = diffSeconds(lead.actual_arrival, trail.actual_arrival);
    if (headwaySec === null) continue;

    const nominalSec = getNominalScheduledHeadwaySeconds(lead.scheduled_departure, assumptions);
    const thresholdSec = nominalSec * multiplier;

    if (headwaySec > thresholdSec) {
      alerts.push({
        alert_type: 'large_gap',
        severity: 'warning',
        stop_id: stopId,
        direction: leadTrip.direction,
        bus_id_leading: leadTrip.bus_id ?? 'UNKNOWN',
        bus_id_trailing: trailTrip.bus_id ?? 'UNKNOWN',
        trip_id_leading: lead.trip_id,
        trip_id_trailing: trail.trip_id,
        measured_seconds: headwaySec,
        nominal_scheduled_headway_seconds: nominalSec,
        threshold_seconds: thresholdSec,
        gap_type: 'arrival_headway',
        timestamp: trail.actual_arrival!
      });
    }
  }

  return alerts;
}

export interface DetectTerminalDepartureGapsOptions {
  originStopId: string;
  direction?: Direction;
  stopTimes: StopTime[];
  scheduledTrips: ScheduledTrip[];
  assumptions?: DemoAssumptions;
  evaluationTime?: string;
}

/**
 * Detects large terminal departure gaps between consecutive operated departures at a common origin terminal (§4.2).
 * Preserves the approved evening demonstration scenario at Hebbal terminal (T_eval 18:15:00).
 */
export function detectTerminalDepartureGaps(
  options: DetectTerminalDepartureGapsOptions
): LargeGapAlert[] {
  const { originStopId, direction, stopTimes, scheduledTrips, assumptions, evaluationTime } = options;

  const multiplier = assumptions?.headway?.large_gap_multiplier ?? 1.5;

  const tripMap = new Map<string, ScheduledTrip>();
  for (const t of scheduledTrips) {
    tripMap.set(t.trip_id, t);
  }

  // Filter stop_sequence 1 departures from this origin terminal for operated trips
  const terminalDepartures = stopTimes.filter((st) => {
    if (st.stop_id !== originStopId || st.stop_sequence !== 1) return false;
    const trip = tripMap.get(st.trip_id);
    if (!trip || trip.final_outcome !== 'operated') return false;
    if (direction && trip.direction !== direction) return false;
    if (!st.actual_departure) return false;
    if (evaluationTime && !isAtOrBefore(st.actual_departure, evaluationTime)) return false;
    return true;
  });

  terminalDepartures.sort((a, b) => {
    return parseIsoToSeconds(a.actual_departure!) - parseIsoToSeconds(b.actual_departure!);
  });

  const alerts: LargeGapAlert[] = [];

  for (let i = 1; i < terminalDepartures.length; i++) {
    const lead = terminalDepartures[i - 1];
    const trail = terminalDepartures[i];
    const leadTrip = tripMap.get(lead.trip_id)!;
    const trailTrip = tripMap.get(trail.trip_id)!;

    const gapSec = diffSeconds(lead.actual_departure, trail.actual_departure);
    if (gapSec === null) continue;

    const nominalSec = getNominalScheduledHeadwaySeconds(lead.scheduled_departure, assumptions);
    const thresholdSec = nominalSec * multiplier;

    if (gapSec > thresholdSec) {
      alerts.push({
        alert_type: 'large_gap',
        severity: 'warning',
        stop_id: originStopId,
        direction: leadTrip.direction,
        bus_id_leading: leadTrip.bus_id ?? 'UNKNOWN',
        bus_id_trailing: trailTrip.bus_id ?? 'UNKNOWN',
        trip_id_leading: lead.trip_id,
        trip_id_trailing: trail.trip_id,
        measured_seconds: gapSec,
        nominal_scheduled_headway_seconds: nominalSec,
        threshold_seconds: thresholdSec,
        gap_type: 'terminal_departure_gap',
        timestamp: trail.actual_departure!,
        note: `Terminal departure gap of ${gapSec}s exceeds ${thresholdSec}s threshold (${nominalSec}s nominal * ${multiplier})`
      });
    }
  }

  return alerts;
}
