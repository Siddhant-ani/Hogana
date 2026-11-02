-- ==============================================================================
-- HOGANA — Smart Bus Operations & Mobility Intelligence Platform
-- Migration 01: Core Multi-Tenant, Dataset Versioning & Operational Records Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS & MEMBERSHIP
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL DEFAULT 'transit_agency',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Data Manager', 'Dispatcher', 'Analyst')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- ------------------------------------------------------------------------------
-- 2. DATASET VERSIONING & FILE METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    dataset_date DATE NOT NULL,
    version_number INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('uploaded', 'processing', 'validation_failed', 'validated', 'published', 'archived')),
    source_type TEXT NOT NULL DEFAULT 'synthetic_baseline',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    validation_status TEXT NOT NULL DEFAULT 'pending',
    total_records INT NOT NULL DEFAULT 0,
    checksum TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    validation_report JSONB,
    assumptions_config JSONB,
    UNIQUE(organization_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_dataset_versions_org_active ON dataset_versions(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_status ON dataset_versions(status);

CREATE TABLE IF NOT EXISTS dataset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum TEXT NOT NULL,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processing_status TEXT NOT NULL DEFAULT 'uploaded',
    row_count INT NOT NULL DEFAULT 0,
    validation_result JSONB
);

CREATE INDEX IF NOT EXISTS idx_dataset_files_version ON dataset_files(dataset_version_id);

-- ------------------------------------------------------------------------------
-- 3. OPERATIONAL RECORDS (ORGANIZATION- & VERSION-AWARE)
-- ------------------------------------------------------------------------------

-- 3.1 routes
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    route_id TEXT NOT NULL,
    route_short_name TEXT NOT NULL,
    route_long_name TEXT NOT NULL,
    route_type INT NOT NULL DEFAULT 3,
    agency_id TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routes_version ON routes(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_routes_route_id ON routes(dataset_version_id, route_id);

-- 3.2 stops
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    stop_id TEXT NOT NULL,
    stop_name TEXT NOT NULL,
    stop_lat DOUBLE PRECISION NOT NULL,
    stop_lon DOUBLE PRECISION NOT NULL,
    stop_sequence_order INT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
    is_control_point BOOLEAN NOT NULL DEFAULT false,
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stops_version ON stops(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_stops_dir_seq ON stops(dataset_version_id, direction, stop_sequence_order);

-- 3.3 scheduled_trips
CREATE TABLE IF NOT EXISTS scheduled_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    trip_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
    scheduled_departure_time TEXT NOT NULL,
    scheduled_arrival_time TEXT NOT NULL,
    scheduled_headway_seconds INT NOT NULL,
    vehicle_id TEXT,
    driver_id TEXT,
    operational_status TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_trips_version ON scheduled_trips(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trips_trip_id ON scheduled_trips(dataset_version_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trips_dir_dept ON scheduled_trips(dataset_version_id, direction, scheduled_departure_time);

-- 3.4 stop_times
CREATE TABLE IF NOT EXISTS stop_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    trip_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    stop_sequence INT NOT NULL,
    scheduled_arrival TEXT,
    scheduled_departure TEXT,
    actual_arrival TEXT,
    actual_departure TEXT,
    dwell_time_seconds INT,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stop_times_version ON stop_times(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_trip_seq ON stop_times(dataset_version_id, trip_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop_actual ON stop_times(dataset_version_id, stop_id, actual_arrival);

-- 3.5 passenger_loads
CREATE TABLE IF NOT EXISTS passenger_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    trip_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    stop_sequence INT NOT NULL,
    alighting_passengers INT NOT NULL,
    boarding_passengers INT NOT NULL,
    load_arriving INT NOT NULL,
    load_departing INT NOT NULL,
    occupancy_percentage DOUBLE PRECISION,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passenger_loads_version ON passenger_loads(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_passenger_loads_trip_seq ON passenger_loads(dataset_version_id, trip_id, stop_sequence);

-- 3.6 bus_positions
CREATE TABLE IF NOT EXISTS bus_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    position_id TEXT NOT NULL,
    bus_id TEXT NOT NULL,
    trip_id TEXT,
    timestamp TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION NOT NULL,
    heading INT NOT NULL,
    distance_along_corridor_m DOUBLE PRECISION NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bus_positions_version ON bus_positions(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_bus_positions_bus_ts ON bus_positions(dataset_version_id, bus_id, timestamp);

-- 3.7 vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    bus_id TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    capacity_seated INT NOT NULL,
    capacity_standing INT NOT NULL,
    capacity_total INT NOT NULL,
    status TEXT NOT NULL,
    depot_assignment TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_version ON vehicles(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_bus_id ON vehicles(dataset_version_id, bus_id);

-- 3.8 crew_availability
CREATE TABLE IF NOT EXISTS crew_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    crew_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    shift_id TEXT NOT NULL,
    shift_start TEXT NOT NULL,
    shift_end TEXT NOT NULL,
    assigned_bus_id TEXT,
    status TEXT NOT NULL,
    depot_location TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'synthetic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crew_version ON crew_availability(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_crew_crew_id ON crew_availability(dataset_version_id, crew_id);

-- ------------------------------------------------------------------------------
-- 4. APPLICATION WORKFLOW & PERSISTENT RECORDS
-- ------------------------------------------------------------------------------

-- 4.1 intervention_reviews
CREATE TABLE IF NOT EXISTS intervention_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id TEXT NOT NULL,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    review_note TEXT NOT NULL,
    reviewed_by TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intervention_reviews_org ON intervention_reviews(organization_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_intervention_reviews_proposal ON intervention_reviews(organization_id, proposal_id);

-- 4.2 simulation_runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('holding', 'relief', 'crowding')),
    scenario_inputs JSONB NOT NULL,
    scenario_outputs JSONB NOT NULL,
    summary TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_org ON simulation_runs(organization_id, created_at DESC);

-- 4.3 report_exports
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_format TEXT NOT NULL DEFAULT 'csv',
    file_size BIGINT,
    generated_by TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_exports_org ON report_exports(organization_id, generated_at DESC);

-- 4.4 audit_events
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    event_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON audit_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(organization_id, event_type);

-- 4.5 commuter_insight_summaries (strictly aggregate research context only)
CREATE TABLE IF NOT EXISTS commuter_insight_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    dataset_title TEXT NOT NULL,
    methodology TEXT NOT NULL,
    sample_size INT NOT NULL DEFAULT 100,
    metrics JSONB NOT NULL,
    pain_points JSONB NOT NULL,
    disclaimer TEXT NOT NULL,
    is_simulated_workbook BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commuter_insights_org ON commuter_insight_summaries(organization_id);
