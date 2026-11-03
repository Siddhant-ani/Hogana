import 'server-only';
import { loadAndValidateInternal } from '../dataset/data-access';
import { validateDataset } from '../dataset/validator';
import { OperationalDataset } from '../dataset/types';
import { getSupabaseAdminClient, isSupabaseConfigured } from './client';
import { query } from './pg-client';

/**
 * HOGANA Dataset Repository Abstraction
 * 
 * Supports:
 * 1. LocalFileDatasetRepository: Canonical immutable data/demo/ files (tests and baseline).
 * 2. SupabaseDatasetRepository: Version-managed PostgreSQL published operational tables.
 */

export interface DatasetVersionInfo {
  id: string;
  name: string;
  versionNumber: number;
  date: string;
  source: 'local_synthetic' | 'supabase_published';
  status: string;
  isBaseline: boolean;
  publishedAt?: string;
  totalRecords?: number;
}

export interface IDatasetRepository {
  readonly source: 'local_synthetic' | 'supabase_published';
  getVersionInfo(): Promise<DatasetVersionInfo>;
  getDataset(): Promise<OperationalDataset>;
}

/**
 * 1. Local File Implementation (Immutable data/demo/ baseline)
 */
export class LocalFileDatasetRepository implements IDatasetRepository {
  readonly source = 'local_synthetic' as const;

  async getVersionInfo(): Promise<DatasetVersionInfo> {
    return {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Synthetic Baseline — 10 March 2025',
      versionNumber: 1,
      date: '2025-03-10',
      source: 'local_synthetic',
      status: 'published',
      isBaseline: true,
      publishedAt: '2025-03-10T00:00:00Z',
      totalRecords: 6481
    };
  }

  async getDataset(): Promise<OperationalDataset> {
    const { dataset, validationResult } = await loadAndValidateInternal();
    if (!validationResult.valid) {
      throw new Error(`Local synthetic dataset failed validation: ${validationResult.errors.join('; ')}`);
    }
    return dataset;
  }
}

/**
 * 2. Supabase / PostgreSQL Implementation (Active published dataset version)
 */
export class SupabaseDatasetRepository implements IDatasetRepository {
  readonly source = 'supabase_published' as const;

  async getVersionInfo(): Promise<DatasetVersionInfo> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and authentication keys.');
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('dataset_versions')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error(`No active published dataset version found in Supabase: ${error?.message || 'Empty result'}`);
      }

      return {
        id: data.id,
        name: data.dataset_name,
        versionNumber: data.version_number,
        date: data.dataset_date,
        source: 'supabase_published',
        status: data.status,
        isBaseline: data.source_type === 'synthetic_baseline',
        publishedAt: data.published_at,
        totalRecords: data.total_records
      };
    }

    // Direct PostgreSQL query fallback
    const res = await query(
      `SELECT * FROM dataset_versions WHERE is_active = true ORDER BY published_at DESC LIMIT 1`
    );
    if (res.rows.length === 0) {
      throw new Error('No active published dataset version found in PostgreSQL.');
    }
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.dataset_name,
      versionNumber: row.version_number,
      date: row.dataset_date,
      source: 'supabase_published',
      status: row.status,
      isBaseline: row.source_type === 'synthetic_baseline',
      publishedAt: row.published_at,
      totalRecords: row.total_records
    };
  }

  async getDataset(): Promise<OperationalDataset> {
    const versionInfo = await this.getVersionInfo();
    const versionId = versionInfo.id;
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      throw new Error('Supabase client unavailable.');
    }

    // Query all 8 operational tables and assumptions config concurrently
    const [
      routesRes,
      stopsRes,
      tripsRes,
      stopTimesRes,
      loadsRes,
      positionsRes,
      vehiclesRes,
      crewRes,
      versionRes
    ] = await Promise.all([
      supabase.from('routes').select('*').eq('dataset_version_id', versionId),
      supabase.from('stops').select('*').eq('dataset_version_id', versionId).order('stop_sequence_order', { ascending: true }),
      supabase.from('scheduled_trips').select('*').eq('dataset_version_id', versionId),
      supabase.from('stop_times').select('*').eq('dataset_version_id', versionId).order('stop_sequence', { ascending: true }),
      supabase.from('passenger_loads').select('*').eq('dataset_version_id', versionId).order('stop_sequence', { ascending: true }),
      supabase.from('bus_positions').select('*').eq('dataset_version_id', versionId).order('timestamp', { ascending: true }),
      supabase.from('vehicles').select('*').eq('dataset_version_id', versionId),
      supabase.from('crew_availability').select('*').eq('dataset_version_id', versionId),
      supabase.from('dataset_versions').select('assumptions_config').eq('id', versionId).single()
    ]);

    if (routesRes.error) throw new Error(`Failed to load routes from Supabase: ${routesRes.error.message}`);
    if (stopsRes.error) throw new Error(`Failed to load stops from Supabase: ${stopsRes.error.message}`);
    if (tripsRes.error) throw new Error(`Failed to load scheduled_trips from Supabase: ${tripsRes.error.message}`);
    if (stopTimesRes.error) throw new Error(`Failed to load stop_times from Supabase: ${stopTimesRes.error.message}`);
    if (loadsRes.error) throw new Error(`Failed to load passenger_loads from Supabase: ${loadsRes.error.message}`);
    if (positionsRes.error) throw new Error(`Failed to load bus_positions from Supabase: ${positionsRes.error.message}`);
    if (vehiclesRes.error) throw new Error(`Failed to load vehicles from Supabase: ${vehiclesRes.error.message}`);
    if (crewRes.error) throw new Error(`Failed to load crew_availability from Supabase: ${crewRes.error.message}`);

    const assumptions = (versionRes.data?.assumptions_config as any) || {
      _provenance: "Approved synthetic demonstration parameters",
      cost_per_bus_hour_inr: 850,
      trips_per_hour: 5,
      holding_max_delay_seconds: 300,
      bunching_threshold_seconds: 120,
      gap_threshold_multiplier: 1.5,
      passenger_capacity: { seated: 40, standing: 20, total: 60 }
    };

    return {
      routes: (routesRes.data || []).map((r: any) => ({
        route_id: r.route_id,
        route_name: r.route_name || r.route_long_name || r.route_short_name || r.route_id,
        origin_terminal: r.origin_terminal || '',
        destination_terminal: r.destination_terminal || '',
        total_distance_km: Number(r.total_distance_km || 0),
        source_label: r.source_label || 'synthetic'
      })),
      stops: (stopsRes.data || []).map((s: any) => ({
        stop_id: s.stop_id,
        stop_name: s.stop_name,
        route_id: s.route_id || '',
        direction: s.direction,
        sequence: Number(s.stop_sequence_order || 1),
        lat: Number(s.stop_lat),
        lon: Number(s.stop_lon),
        dist_from_origin_km: Number(s.dist_from_origin_km || 0),
        is_control_point: Boolean(s.is_control_point),
        source_label: s.source_label || 'synthetic'
      })),
      scheduledTrips: (tripsRes.data || []).map((t: any) => ({
        trip_id: t.trip_id,
        route_id: t.route_id,
        direction: t.direction,
        bus_id: t.bus_id || t.vehicle_id || null,
        scheduled_departure: t.scheduled_departure_time,
        scheduled_arrival: t.scheduled_arrival_time,
        final_outcome: (t.final_outcome || t.operational_status || 'operated'),
        final_outcome_reason: t.final_outcome_reason || null,
        final_outcome_recorded_at: t.final_outcome_recorded_at || null,
        source_label: t.source_label || 'synthetic'
      })),
      stopTimes: (stopTimesRes.data || []).map((st: any) => ({
        trip_id: st.trip_id,
        stop_id: st.stop_id,
        stop_sequence: Number(st.stop_sequence),
        scheduled_arrival: st.scheduled_arrival || '',
        scheduled_departure: st.scheduled_departure || '',
        actual_arrival: st.actual_arrival || null,
        actual_departure: st.actual_departure || null,
        source_label: st.source_label || 'synthetic'
      })),
      passengerLoads: (loadsRes.data || []).map((l: any) => ({
        trip_id: l.trip_id,
        stop_id: l.stop_id,
        stop_sequence: Number(l.stop_sequence),
        boardings: l.boardings !== null && l.boardings !== undefined ? Number(l.boardings) : null,
        alightings: l.alightings !== null && l.alightings !== undefined ? Number(l.alightings) : null,
        onboard_after: l.onboard_after !== null && l.onboard_after !== undefined ? Number(l.onboard_after) : (l.load_departing !== null ? Number(l.load_departing) : null),
        measurement_method: l.measurement_method || 'synthetic_estimate',
        source_label: l.source_label || 'synthetic'
      })),
      busPositions: (positionsRes.data || []).map((p: any) => ({
        position_id: p.position_id,
        bus_id: p.bus_id,
        trip_id: p.trip_id || '',
        route_id: p.route_id || '',
        direction: p.direction || 'UP',
        timestamp: p.timestamp,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        speed_kmh: Number(p.speed_kmh),
        source_label: p.source_label || 'synthetic'
      })),
      vehicles: (vehiclesRes.data || []).map((v: any) => ({
        bus_id: v.bus_id,
        registration: v.registration || v.vehicle_model || '',
        capacity_seated: Number(v.capacity_seated),
        capacity_standing: Number(v.capacity_standing),
        capacity_total: Number(v.capacity_total),
        current_location_stop_id: v.current_location_stop_id || '',
        status: v.status,
        source_label: v.source_label || 'synthetic'
      })),
      crewAvailability: (crewRes.data || []).map((c: any) => ({
        crew_id: c.crew_id,
        role: c.role || 'driver',
        shift_start: c.shift_start,
        shift_end: c.shift_end,
        assigned_bus_id: c.assigned_bus_id || null,
        status: c.status,
        source_label: c.source_label || 'synthetic'
      })),
      assumptions
    };
  }
}

/**
 * Factory for obtaining the active repository based on explicit configuration.
 */
export function getDatasetRepository(): IDatasetRepository {
  const configuredSource = process.env.DATASET_SOURCE?.toLowerCase()?.trim();
  
  if (configuredSource === 'supabase') {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'DATASET_SOURCE is set to "supabase" but required credentials (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY) are not configured. ' +
        'Cannot silently replace production data with local synthetic files.'
      );
    }
    return new SupabaseDatasetRepository();
  }

  // Default to LocalFileDatasetRepository (tests, offline, and canonical baseline)
  return new LocalFileDatasetRepository();
}
