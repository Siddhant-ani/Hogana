-- ==============================================================================
-- HOGANA — Smart Bus Operations & Mobility Intelligence Platform
-- Migration 03: Private Storage Buckets & Access Policies
-- ==============================================================================

-- 1. Create Private Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'operational-source-files',
        'operational-source-files',
        false,
        52428800, -- 50 MB limit
        ARRAY['text/csv', 'application/json', 'text/plain']::text[]
    ),
    (
        'research-source-files',
        'research-source-files',
        false,
        52428800, -- 50 MB limit
        ARRAY[
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/json',
            'text/csv'
        ]::text[]
    ),
    (
        'generated-reports',
        'generated-reports',
        false,
        20971520, -- 20 MB limit
        ARRAY['text/csv', 'application/json', 'application/pdf']::text[]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects Access Policies

-- Operational Source Files:
-- Read access: Authenticated users who belong to the organization (folder path: {org_id}/{version_id}/...)
CREATE POLICY "Org members can read operational source files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'operational-source-files' AND
        is_org_member((storage.foldername(name))[1]::uuid)
    );

CREATE POLICY "Data Managers can upload operational source files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'operational-source-files' AND
        is_org_member((storage.foldername(name))[1]::uuid) AND
        get_user_org_role((storage.foldername(name))[1]::uuid) IN ('Administrator', 'Data Manager')
    );

-- Research Source Files:
CREATE POLICY "Org members can read research source files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'research-source-files' AND
        is_org_member((storage.foldername(name))[1]::uuid)
    );

CREATE POLICY "Data Managers can upload research source files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'research-source-files' AND
        is_org_member((storage.foldername(name))[1]::uuid) AND
        get_user_org_role((storage.foldername(name))[1]::uuid) IN ('Administrator', 'Data Manager')
    );

-- Generated Reports:
CREATE POLICY "Org members can read generated reports"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'generated-reports' AND
        is_org_member((storage.foldername(name))[1]::uuid)
    );

CREATE POLICY "Org members can upload generated reports"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'generated-reports' AND
        is_org_member((storage.foldername(name))[1]::uuid)
    );
