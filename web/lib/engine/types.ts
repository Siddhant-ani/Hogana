/**
 * HOGANA — Smart Bus Operations & Mobility Intelligence Platform
 * Step 2: Backend Operational Intelligence — Domain Models & Calculation Types
 * 
 * Provenance: Based on docs/OPERATIONAL_DATASET_SPEC.md.
 * All headway and interval calculations are maintained in seconds internally.
 */

import { Direction } from '../dataset/types';

/**
 * Replay operational lifecycle status at an explicit evaluation timestamp T_eval.
 * Computed strictly from events recorded on or before T_eval (anti-lookahead).
 */
export type ReplayTripStatus =
  | 'scheduled'          // Scheduled departure is in the future; no actual events yet
  | 'in_progress'        // Trip has departed origin stop, final terminal arrival not yet reached
  | 'completed'          // Trip has reached final terminal on or before T_eval
  | 'cancelled'          // Trip cancellation logged on or before T_eval
  | 'resource_shortfall' // Resource shortfall logged on or before T_eval
  | 'unknown';           // Scheduled departure elapsed, but departure unconfirmed / missing data

/**
 * Result of strict live dwelling state evaluation (§4.0).
 * Requires all testable criteria:
 * 1. Trip in progress
 * 2. Stop arrival recorded <= T_eval
 * 3. Stop departure null or > T_eval
 * 4. Fresh telemetry (<= 60s from T_eval)
 * 5. Stationary (speed == 0)
 * 6. Stationary geofence within 100m of stop landmark
 */
export interface DwellingEvaluationResult {
  isDwelling: boolean;
  busId: string;
  tripId: string;
  stopId: string;
  reasons: string[];
  distanceMeters: number | null;
  telemetryAgeSeconds: number | null;
  speedKmh: number | null;
  telemetryTimestamp: string | null;
  arrivalTimestamp: string | null;
  departureTimestamp: string | null;
}

/**
 * Observed headway between consecutive operating buses at the same stop and direction (§3.1).
 */
export interface ObservedHeadway {
  stopId: string;
  direction: Direction;
  leadingTripId: string;
  trailingTripId: string;
  leadingBusId: string;
  trailingBusId: string;
  leadingActualArrival: string;
  trailingActualArrival: string;
  headwaySeconds: number;
}

/**
 * Result of observed headway calculation across a sequence of buses at a stop.
 */
export interface HeadwayCalculationResult {
  status: 'ok' | 'insufficient_data';
  stopId: string;
  direction: Direction;
  headways: ObservedHeadway[];
  validObservationCount: number;
  insufficientReason?: string;
}

/**
 * Headway irregularity (Coefficient of Variation) result (§3.3).
 */
export interface HeadwayCVResult {
  status: 'ok' | 'insufficient_data';
  stopId: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  observationCount: number;
  meanHeadwaySeconds: number | null;
  stdDevHeadwaySeconds: number | null;
  cv: number | null;
  insufficientReason?: string;
}

/**
 * Nominal scheduled service interval between adjacent scheduled departure slots (§3.2).
 */
export interface NominalScheduledInterval {
  stopId: string;
  direction: Direction;
  leadingSlotTripId: string;
  trailingSlotTripId: string;
  leadingScheduledDeparture: string;
  trailingScheduledDeparture: string;
  nominalIntervalSeconds: number;
}

/**
 * Bus bunching alert (§4.1).
 */
export interface BunchingAlert {
  alert_type: 'bunching';
  severity: 'warning';
  stop_id: string;
  direction: Direction;
  bus_id_leading: string;
  bus_id_trailing: string;
  trip_id_leading: string;
  trip_id_trailing: string;
  measured_seconds: number; // headway or elapsed separation
  threshold_seconds: number;
  bunching_type: 'arrival_headway' | 'live_dwelling_departure_separation';
  timestamp: string;
  note?: string;
}

/**
 * Large service gap alert (§4.2).
 */
export interface LargeGapAlert {
  alert_type: 'large_gap';
  severity: 'warning';
  stop_id: string;
  direction: Direction;
  bus_id_leading: string;
  bus_id_trailing: string;
  trip_id_leading: string;
  trip_id_trailing: string;
  measured_seconds: number; // arrival headway or terminal departure gap
  nominal_scheduled_headway_seconds: number;
  threshold_seconds: number;
  gap_type: 'arrival_headway' | 'terminal_departure_gap';
  timestamp: string;
  note?: string;
}

/**
 * Dispatcher advisory hold-at-stop recommendation (§4.4.1).
 */
export interface HoldRecommendation {
  status: 'recommended' | 'rejected' | 'ineligible';
  controlStopId: string;
  controlStopName: string;
  direction: Direction;
  leadingBusId: string;
  trailingBusId: string;
  leadingTripId: string;
  trailingTripId: string;
  currentElapsedSeparationSeconds: number;
  targetHeadwaySeconds: number;
  holdNeededSeconds: number;
  currentTrailingDelaySeconds: number;
  remainingDelayAllowanceSeconds: number;
  feasibleHoldSeconds: number;
  projectedSeparationSeconds: number;
  isPartialCorrection: boolean;
  recommendationText: string;
  rejectionReason?: string;
  evaluatedAt: string;
}

/**
 * Passenger crowding level classification (§3.5).
 */
export type CrowdingLevel = 'normal' | 'overcrowded' | 'severely_overcrowded';

/**
 * Passenger occupancy observation for a stop-visit (§3.4, §3.5).
 */
export interface OccupancyObservation {
  tripId: string;
  stopId: string;
  stopSequence: number;
  busId: string;
  onboardAfter: number | null;
  capacityTotal: number | null;
  occupancyPct: number | null;
  level: CrowdingLevel | 'unavailable' | 'error';
  statusText: string;
  timestamp: string | null;
}

/**
 * Passenger crowding alert (§4.3).
 */
export interface CrowdingAlert {
  alert_type: 'crowding';
  severity: 'warning' | 'critical';
  trip_id: string;
  stop_id: string;
  bus_id: string;
  onboard_after: number;
  capacity_total: number;
  occupancy_pct: number;
  timestamp: string;
}

/**
 * Frequency-increase recommendation (§4.4.3).
 */
export interface FrequencyIncreaseRecommendation {
  status: 'recommended' | 'not_indicated' | 'insufficient_data';
  tripId: string;
  routeId: string;
  direction: Direction;
  consecutiveSeverelyOvercrowdedStops: string[];
  recommendationText: string;
  reason?: string;
}

/**
 * Arrival delay result for an individual stop visit (§3.7).
 */
export interface ArrivalDelayResult {
  tripId: string;
  stopId: string;
  stopSequence: number;
  scheduledArrival: string;
  actualArrival: string | null;
  delaySeconds: number | null; // Positive = late; Negative = early; 0 = on time
  status: 'on_time' | 'late' | 'early' | 'unavailable';
}

/**
 * On-time performance aggregate (§3.7).
 */
export interface OnTimePerformanceResult {
  routeId: string;
  thresholdSeconds: number;
  totalKnownVisits: number;
  onTimeVisits: number;
  lateVisits: number;
  earlyVisits: number;
  onTimePct: number;
}

/**
 * Corridor-level operational fulfillment KPIs (§3.6).
 */
export interface CorridorKpis {
  totalScheduledTrips: number;
  operatedTrips: number;
  cancelledTrips: number;
  resourceShortfallTrips: number;
  cancellationRatePct: number;
  resourceShortfallRatePct: number;
  combinedNonOperatedRatePct: number;
  fulfillmentRatePct: number;
}

/**
 * Corridor-level live / replay operational status as-of an evaluation timestamp (§4.0).
 */
export interface ReplayCorridorStatus {
  evaluationTime: string;
  totalScheduledTrips: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  resourceShortfallCount: number;
  unknownCount: number;
}

/**
 * GPS freshness evaluation (§4.0, §7).
 */
export interface GpsFreshnessResult {
  busId: string;
  evaluationTime: string;
  latestPositionTimestamp: string | null;
  ageSeconds: number | null;
  isFreshGeneral: boolean;    // age <= 300s (5 minutes)
  isFreshDwelling: boolean;   // age <= 60s
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  status: 'fresh' | 'stale' | 'no_telemetry';
}

/**
 * Fleet inventory status (§7).
 */
export interface FleetInventory {
  totalVehicles: number;
  activeCount: number;
  standbyCount: number;
  maintenanceCount: number;
  activeVehicles: { bus_id: string; location: string }[];
  standbyVehicles: { bus_id: string; location: string }[];
  maintenanceVehicles: { bus_id: string; location: string }[];
}

/**
 * Standby driver shift coverage evaluation (§4.4.2).
 */
export interface StandbyDriverAvailability {
  totalStandbyDrivers: number;
  onShiftStandbyDrivers: { crew_id: string; shift_start: string; shift_end: string }[];
  offShiftStandbyDrivers: { crew_id: string; shift_start: string; shift_end: string }[];
  evaluationTime: string;
}

/**
 * Insert-relief-bus recommendation (§4.4.2).
 */
export interface ReliefBusRecommendation {
  status: 'feasible' | 'unconfirmed';
  routeId: string;
  direction: Direction;
  gapAlert: LargeGapAlert;
  deploymentTime: string;
  deploymentOriginStopId: string;
  standbyBusId: string | null;
  standbyDriverId: string | null;
  recommendationText: string;
  unconfirmedReason?: string;
  limitationsDisclaimer: string;
}
