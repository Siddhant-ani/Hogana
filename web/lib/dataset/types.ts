/**
 * HOGANA — Smart Bus Operations & Mobility Intelligence Platform
 * Operational Dataset Integration: Domain Models & Types
 * 
 * Provenance: All entities represent synthetic demonstration data for the
 * Silk Board <-> Hebbal corridor based on docs/OPERATIONAL_DATASET_SPEC.md.
 */

export type Direction = 'UP' | 'DOWN';

export type TripOutcome = 'operated' | 'cancelled' | 'resource_shortfall';

export type VehicleStatus = 'active' | 'standby' | 'maintenance';

export type CrewRole = 'driver';

export type CrewStatus = 'on_duty' | 'standby';

export type SourceLabel = 'synthetic';

/**
 * Route entity (routes.csv)
 */
export interface Route {
  route_id: string;
  route_name: string;
  origin_terminal: string;
  destination_terminal: string;
  total_distance_km: number;
  source_label: SourceLabel;
}

/**
 * Stop entity (stops.csv)
 */
export interface Stop {
  stop_id: string;
  stop_name: string;
  route_id: string;
  direction: Direction;
  sequence: number;
  lat: number;
  lon: number;
  dist_from_origin_km: number;
  is_control_point: boolean;
  source_label: SourceLabel;
}

/**
 * Scheduled trip slot entity (scheduled_trips.csv)
 */
export interface ScheduledTrip {
  trip_id: string;
  route_id: string;
  direction: Direction;
  bus_id: string | null;
  scheduled_departure: string;
  scheduled_arrival: string;
  final_outcome: TripOutcome;
  final_outcome_reason: string | null;
  final_outcome_recorded_at: string | null;
  source_label: SourceLabel;
}

/**
 * Stop time observation / schedule entity (stop_times.csv)
 */
export interface StopTime {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  scheduled_arrival: string;
  actual_arrival: string | null;
  scheduled_departure: string;
  actual_departure: string | null;
  source_label: SourceLabel;
}

/**
 * Passenger load observation entity (passenger_loads.csv)
 */
export interface PassengerLoad {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  boardings: number | null;
  alightings: number | null;
  onboard_after: number | null;
  measurement_method: string;
  source_label: SourceLabel;
}

/**
 * GPS position telemetry entity (bus_positions.csv)
 */
export interface BusPosition {
  position_id: string;
  bus_id: string;
  trip_id: string;
  route_id: string;
  direction: Direction;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  source_label: SourceLabel;
}

/**
 * Vehicle master entity (vehicles.csv)
 */
export interface Vehicle {
  bus_id: string;
  registration: string;
  capacity_seated: number;
  capacity_standing: number;
  capacity_total: number;
  current_location_stop_id: string;
  status: VehicleStatus;
  source_label: SourceLabel;
}

/**
 * Crew availability entity (crew_availability.csv)
 */
export interface CrewAvailability {
  crew_id: string;
  role: CrewRole;
  shift_start: string;
  shift_end: string;
  assigned_bus_id: string | null;
  status: CrewStatus;
  source_label: SourceLabel;
}

/**
 * Operational demo assumptions (demo_assumptions.json)
 */
export interface DemoAssumptions {
  _provenance: string;
  time_window_rules: {
    interval_convention: string;
    departure_formula: string;
  };
  headway: {
    nominal_peak_headway_seconds: number;
    nominal_peak_headway_note: string;
    nominal_offpeak_headway_seconds: number;
    nominal_offpeak_headway_note: string;
    bunching_threshold_seconds: number;
    bunching_threshold_note: string;
    large_gap_multiplier: number;
    large_gap_note: string;
  };
  crowding: {
    overcrowding_pct: number;
    overcrowding_note: string;
    severe_overcrowding_pct: number;
    severe_overcrowding_note: string;
  };
  dispatch_control: {
    max_delay_tolerance_seconds: number;
    max_delay_note: string;
    min_viable_hold_seconds: number;
    min_viable_hold_note: string;
    geofence_dwelling_radius_meters: number;
    telemetry_freshness_seconds: number;
  };
  simulator_defaults: {
    baseline_cycle_time_minutes: number;
    cycle_time_note: string;
  };
  financial: {
    fare_revenue_per_bus_per_day_inr: number;
    fare_revenue_note: string;
    capacity_loss_fixed_schedule_pct: number;
    capacity_loss_dynamic_dispatch_pct: number;
    capacity_loss_note: string;
    revenue_uplift_pct: number;
    revenue_uplift_note: string;
    cost_per_bus_hour_inr: number | null;
    cost_per_bus_hour_note: string;
    trips_per_hour: number | null;
    trips_per_hour_note: string;
  };
  pricing: {
    price_per_bus_per_month_inr: number;
    price_note: string;
    example_fleet_size: number;
    example_fleet_note: string;
  };
}

/**
 * Container holding the complete validated demonstration dataset.
 */
export interface CompleteDataset {
  routes: Route[];
  stops: Stop[];
  scheduledTrips: ScheduledTrip[];
  stopTimes: StopTime[];
  passengerLoads: PassengerLoad[];
  busPositions: BusPosition[];
  vehicles: Vehicle[];
  crewAvailability: CrewAvailability[];
  assumptions: DemoAssumptions;
}

export type OperationalDataset = CompleteDataset;

/**
 * Validation result interface.
 */
export interface ValidationCheckResult {
  checkName: string;
  passed: boolean;
  message: string;
}

export interface DatasetValidationResult {
  valid: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: ValidationCheckResult[];
  recordCounts: {
    routes: number;
    stops: number;
    scheduledTrips: number;
    stopTimes: number;
    passengerLoads: number;
    busPositions: number;
    vehicles: number;
    crewAvailability: number;
  };
  errors: string[];
}
