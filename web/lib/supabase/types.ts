/**
-- ==============================================================================
-- HOGANA — Smart Bus Operations & Mobility Intelligence Platform
-- Supabase & PostgreSQL TypeScript Database Types
-- ==============================================================================
 */

export type OrganizationRole = 'Administrator' | 'Data Manager' | 'Dispatcher' | 'Analyst';

export type DatasetVersionStatus = 
  | 'uploaded'
  | 'processing'
  | 'validation_failed'
  | 'validated'
  | 'published'
  | 'archived';

export interface Organization {
  id: string;
  organization_name: string;
  organization_type: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
}

export interface DatasetVersion {
  id: string;
  organization_id: string;
  dataset_name: string;
  dataset_date: string;
  version_number: number;
  status: DatasetVersionStatus;
  source_type: string;
  created_by?: string | null;
  created_at: string;
  published_at?: string | null;
  validation_status: string;
  total_records: number;
  checksum?: string | null;
  is_active: boolean;
  validation_report?: Record<string, unknown> | null;
  assumptions_config?: Record<string, unknown> | null;
}

export interface DatasetFile {
  id: string;
  dataset_version_id: string;
  original_filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  checksum: string;
  uploaded_by?: string | null;
  uploaded_at: string;
  processing_status: string;
  row_count: number;
  validation_result?: Record<string, unknown> | null;
}

export interface InterventionReviewRecord {
  id: string;
  organization_id: string;
  proposal_id: string;
  dataset_version_id?: string | null;
  decision: 'approved' | 'rejected';
  review_note: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
}

export interface SimulationRunRecord {
  id: string;
  organization_id: string;
  dataset_version_id?: string | null;
  scenario_type: 'holding' | 'relief' | 'crowding';
  scenario_inputs: Record<string, unknown>;
  scenario_outputs: Record<string, unknown>;
  summary?: string | null;
  created_by: string;
  created_at: string;
}

export interface ReportExportRecord {
  id: string;
  organization_id: string;
  dataset_version_id?: string | null;
  report_type: string;
  storage_path: string;
  file_format: string;
  file_size?: number | null;
  generated_by: string;
  generated_at: string;
}

export interface AuditEventRecord {
  id: string;
  organization_id: string;
  user_id?: string | null;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  event_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface CommuterInsightSummaryRecord {
  id: string;
  organization_id: string;
  dataset_version_id?: string | null;
  dataset_title: string;
  methodology: string;
  sample_size: number;
  metrics: Record<string, unknown>;
  pain_points: Record<string, unknown>[];
  disclaimer: string;
  is_simulated_workbook: boolean;
  created_at: string;
}

export interface FreeTierUsageMetrics {
  databaseStorageBytes: number;
  databaseStorageLimitBytes: number; // 500 MB free plan limit
  fileStorageBytes: number;
  fileStorageLimitBytes: number;     // 1 GB free plan limit
  activeDatasetCount: number;
  totalVersionCount: number;
  isApproachingLimit: boolean;
  usagePercentage: number;
}
