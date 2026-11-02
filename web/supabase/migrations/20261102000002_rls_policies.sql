-- ==============================================================================
-- HOGANA — Smart Bus Operations & Mobility Intelligence Platform
-- Migration 02: Row-Level Security (RLS) & Multi-Tenant Role Access Policies
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE commuter_insight_summaries ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for role-based security
CREATE OR REPLACE FUNCTION get_user_org_role(lookup_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM organization_members
    WHERE organization_id = lookup_org_id
      AND user_id = auth.uid()
    LIMIT 1;

    RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION is_org_member(lookup_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members
        WHERE organization_id = lookup_org_id
          AND user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. POLICIES: ORGANIZATIONS & MEMBERSHIP
-- ------------------------------------------------------------------------------

-- Organizations: members can read their own organization
CREATE POLICY "Members can view their own organization"
    ON organizations FOR SELECT
    USING (is_org_member(id));

-- Organization Members: members can see member list of their organization
CREATE POLICY "Members can view membership in their organization"
    ON organization_members FOR SELECT
    USING (is_org_member(organization_id));

-- Only Administrators can add/update/delete members
CREATE POLICY "Admins can manage organization members"
    ON organization_members FOR ALL
    USING (get_user_org_role(organization_id) = 'Administrator')
    WITH CHECK (get_user_org_role(organization_id) = 'Administrator');

-- ------------------------------------------------------------------------------
-- 4. POLICIES: DATASET MANAGEMENT
-- ------------------------------------------------------------------------------

-- Dataset Versions: All members can read published/validated versions in their org
CREATE POLICY "Members can view dataset versions"
    ON dataset_versions FOR SELECT
    USING (is_org_member(organization_id));

-- Dataset Versions: Administrators and Data Managers can create / publish
CREATE POLICY "Data Managers and Admins can create dataset versions"
    ON dataset_versions FOR INSERT
    WITH CHECK (
        is_org_member(organization_id) AND
        get_user_org_role(organization_id) IN ('Administrator', 'Data Manager')
    );

CREATE POLICY "Data Managers and Admins can update dataset versions"
    ON dataset_versions FOR UPDATE
    USING (
        is_org_member(organization_id) AND
        get_user_org_role(organization_id) IN ('Administrator', 'Data Manager')
    )
    WITH CHECK (
        is_org_member(organization_id) AND
        get_user_org_role(organization_id) IN ('Administrator', 'Data Manager')
    );

-- Dataset Files: Members can view files, Data Managers & Admins can insert
CREATE POLICY "Members can view dataset files"
    ON dataset_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dataset_versions dv
            WHERE dv.id = dataset_files.dataset_version_id
              AND is_org_member(dv.organization_id)
        )
    );

CREATE POLICY "Data Managers and Admins can insert dataset files"
    ON dataset_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dataset_versions dv
            WHERE dv.id = dataset_files.dataset_version_id
              AND is_org_member(dv.organization_id)
              AND get_user_org_role(dv.organization_id) IN ('Administrator', 'Data Manager')
        )
    );

-- ------------------------------------------------------------------------------
-- 5. POLICIES: OPERATIONAL RECORDS (READ-ONLY FOR ORG MEMBERS)
-- ------------------------------------------------------------------------------

-- Macro for standard operational record select policy
CREATE POLICY "Members can view routes" ON routes FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view stops" ON stops FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view scheduled_trips" ON scheduled_trips FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view stop_times" ON stop_times FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view passenger_loads" ON passenger_loads FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view bus_positions" ON bus_positions FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view vehicles" ON vehicles FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can view crew_availability" ON crew_availability FOR SELECT USING (is_org_member(organization_id));

-- Ingestion write policies (Administrators & Data Managers only)
CREATE POLICY "Ingestion write routes" ON routes FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write stops" ON stops FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write scheduled_trips" ON scheduled_trips FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write stop_times" ON stop_times FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write passenger_loads" ON passenger_loads FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write bus_positions" ON bus_positions FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write vehicles" ON vehicles FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
CREATE POLICY "Ingestion write crew_availability" ON crew_availability FOR INSERT WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));

-- ------------------------------------------------------------------------------
-- 6. POLICIES: APPLICATION WORKFLOW RECORDS
-- ------------------------------------------------------------------------------

-- Intervention Reviews:
-- Dispatchers and Admins can create and read reviews
CREATE POLICY "Members can view intervention reviews"
    ON intervention_reviews FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "Dispatchers and Admins can create intervention reviews"
    ON intervention_reviews FOR INSERT
    WITH CHECK (
        is_org_member(organization_id) AND
        get_user_org_role(organization_id) IN ('Administrator', 'Dispatcher')
    );

-- Simulation Runs:
-- Analysts, Dispatchers, and Admins can save and view simulation runs
CREATE POLICY "Members can view simulation runs"
    ON simulation_runs FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "Members can create simulation runs"
    ON simulation_runs FOR INSERT
    WITH CHECK (is_org_member(organization_id));

-- Report Exports:
-- All members can view report metadata
CREATE POLICY "Members can view report exports"
    ON report_exports FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "Members can record report exports"
    ON report_exports FOR INSERT
    WITH CHECK (is_org_member(organization_id));

-- Audit Events:
-- All events visible to Admins; members can write their own audit trails
CREATE POLICY "Admins can view all audit events"
    ON audit_events FOR SELECT
    USING (get_user_org_role(organization_id) = 'Administrator');

CREATE POLICY "System and users can record audit events"
    ON audit_events FOR INSERT
    WITH CHECK (is_org_member(organization_id));

-- Commuter Insights:
-- All members can view aggregate summaries
CREATE POLICY "Members can view commuter insights"
    ON commuter_insight_summaries FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "Data Managers and Admins can update commuter insights"
    ON commuter_insight_summaries FOR ALL
    USING (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'))
    WITH CHECK (get_user_org_role(organization_id) IN ('Administrator', 'Data Manager'));
