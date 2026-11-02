-- ==============================================================================
-- HOGANA — Smart Bus Operations & Mobility Intelligence Platform
-- Initial Database Seed: Baseline Organization & Version 1 Dataset Registration
-- ==============================================================================

-- 1. Create Default Pilot Evaluation Organization
INSERT INTO organizations (id, organization_name, organization_type)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Bengaluru Metropolitan Transport Corporation (BMTC) — Pilot Evaluation',
    'transit_agency'
) ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name;

-- 2. Register Initial Synthetic Baseline Version (Version 1: 10 March 2025)
INSERT INTO dataset_versions (
    id,
    organization_id,
    dataset_name,
    dataset_date,
    version_number,
    status,
    source_type,
    published_at,
    validation_status,
    total_records,
    is_active,
    validation_report,
    assumptions_config
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Synthetic Baseline — 10 March 2025',
    '2025-03-10',
    1,
    'published',
    'synthetic_baseline',
    '2025-03-10T00:00:00Z',
    'passed',
    6481, -- 1 + 24 + 86 + 1032 + 924 + 4376 + 13 + 24 + 1
    true,
    '{"passed": 56, "failed": 0, "status": "valid", "rulesEvaluated": 56}'::jsonb,
    '{"cost_per_bus_hour_inr": 850, "trips_per_hour": 5, "holding_max_delay_seconds": 300, "bunching_threshold_seconds": 120, "gap_threshold_multiplier": 1.5}'::jsonb
) ON CONFLICT (organization_id, version_number) DO UPDATE SET
    is_active = true,
    status = 'published';
