import 'server-only';
import { getSupabaseAdminClient, isSupabaseConfigured } from './client';
import {
  InterventionReviewRecord,
  SimulationRunRecord,
  ReportExportRecord,
  AuditEventRecord
} from './types';

export const DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

// In-memory fallback stores when Supabase is not configured (e.g. offline tests)
const fallbackReviews: InterventionReviewRecord[] = [];
const fallbackSimRuns: SimulationRunRecord[] = [];
const fallbackReportExports: ReportExportRecord[] = [];
const fallbackAuditEvents: AuditEventRecord[] = [];

/**
 * 1. INTERVENTION REVIEWS PERSISTENCE
 */
export async function savePersistentReview(
  orgId: string = DEFAULT_ORG_ID,
  proposalId: string,
  decision: 'approved' | 'rejected',
  reviewNote: string,
  reviewedBy: string = 'operator@hogana.transit',
  datasetVersionId?: string
): Promise<{ success: boolean; data?: InterventionReviewRecord; message: string }> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('intervention_reviews')
        .insert({
          organization_id: orgId,
          proposal_id: proposalId,
          decision,
          review_note: reviewNote,
          reviewed_by: reviewedBy,
          dataset_version_id: datasetVersionId || null,
          reviewed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also record audit event
      await recordAuditEvent(
        orgId,
        reviewedBy,
        `intervention_${decision}`,
        'proposal',
        proposalId,
        { decision, reviewNote }
      );

      return {
        success: true,
        data: data as InterventionReviewRecord,
        message: 'Review decision recorded in persistent database.'
      };
    } catch (err: unknown) {
      console.warn('Database review save failed; falling back to memory/local buffer:', err);
    }
  }

  // Fallback memory record
  const fallbackRecord: InterventionReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organization_id: orgId,
    proposal_id: proposalId,
    dataset_version_id: datasetVersionId,
    decision,
    review_note: reviewNote,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  fallbackReviews.unshift(fallbackRecord);

  return {
    success: true,
    data: fallbackRecord,
    message: 'Review saved locally (memory fallback mode).'
  };
}

export async function getPersistentReviews(
  orgId: string = DEFAULT_ORG_ID
): Promise<InterventionReviewRecord[]> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('intervention_reviews')
        .select('*')
        .eq('organization_id', orgId)
        .order('reviewed_at', { ascending: false });

      if (!error && data) {
        return data as InterventionReviewRecord[];
      }
    } catch (err) {
      console.warn('Database fetch reviews failed; using memory fallback:', err);
    }
  }

  return [...fallbackReviews];
}

/**
 * 2. SIMULATION RUNS PERSISTENCE
 */
export async function savePersistentSimRun(
  orgId: string = DEFAULT_ORG_ID,
  scenarioType: 'holding' | 'relief' | 'crowding',
  scenarioInputs: Record<string, unknown>,
  scenarioOutputs: Record<string, unknown>,
  summary: string,
  createdBy: string = 'operator@hogana.transit',
  datasetVersionId?: string
): Promise<{ success: boolean; data?: SimulationRunRecord; message: string }> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('simulation_runs')
        .insert({
          organization_id: orgId,
          scenario_type: scenarioType,
          scenario_inputs: scenarioInputs,
          scenario_outputs: scenarioOutputs,
          summary,
          created_by: createdBy,
          dataset_version_id: datasetVersionId || null
        })
        .select()
        .single();

      if (error) throw error;

      await recordAuditEvent(
        orgId,
        createdBy,
        'simulation_run_saved',
        'simulation',
        (data as any).id,
        { scenarioType, summary }
      );

      return {
        success: true,
        data: data as SimulationRunRecord,
        message: 'Simulation run recorded in database history.'
      };
    } catch (err) {
      console.warn('Database sim save failed; falling back to memory/local buffer:', err);
    }
  }

  const fallbackRecord: SimulationRunRecord = {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organization_id: orgId,
    dataset_version_id: datasetVersionId,
    scenario_type: scenarioType,
    scenario_inputs: scenarioInputs,
    scenario_outputs: scenarioOutputs,
    summary,
    created_by: createdBy,
    created_at: new Date().toISOString()
  };
  fallbackSimRuns.unshift(fallbackRecord);

  return {
    success: true,
    data: fallbackRecord,
    message: 'Simulation saved locally (memory fallback mode).'
  };
}

export async function getPersistentSimRuns(
  orgId: string = DEFAULT_ORG_ID
): Promise<SimulationRunRecord[]> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('simulation_runs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as SimulationRunRecord[];
      }
    } catch (err) {
      console.warn('Database fetch sim runs failed; using memory fallback:', err);
    }
  }

  return [...fallbackSimRuns];
}

/**
 * 3. REPORT EXPORTS PERSISTENCE
 */
export async function recordReportExport(
  orgId: string = DEFAULT_ORG_ID,
  reportType: string,
  storagePath: string,
  fileFormat: string = 'csv',
  fileSize?: number,
  generatedBy: string = 'operator@hogana.transit',
  datasetVersionId?: string
): Promise<{ success: boolean; data?: ReportExportRecord }> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('report_exports')
        .insert({
          organization_id: orgId,
          report_type: reportType,
          storage_path: storagePath,
          file_format: fileFormat,
          file_size: fileSize || null,
          generated_by: generatedBy,
          dataset_version_id: datasetVersionId || null
        })
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as ReportExportRecord };
      }
    } catch (err) {
      console.warn('Database report export recording failed:', err);
    }
  }

  const fallbackRecord: ReportExportRecord = {
    id: `rep-${Date.now()}`,
    organization_id: orgId,
    dataset_version_id: datasetVersionId,
    report_type: reportType,
    storage_path: storagePath,
    file_format: fileFormat,
    file_size: fileSize,
    generated_by: generatedBy,
    generated_at: new Date().toISOString()
  };
  fallbackReportExports.unshift(fallbackRecord);

  return { success: true, data: fallbackRecord };
}

/**
 * 4. AUDIT EVENTS PERSISTENCE
 */
export async function recordAuditEvent(
  orgId: string = DEFAULT_ORG_ID,
  userId: string,
  eventType: string,
  entityType: string,
  entityId?: string,
  eventMetadata?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('audit_events').insert({
        organization_id: orgId,
        user_id: userId.includes('@') ? null : userId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId || null,
        event_metadata: {
          ...eventMetadata,
          userEmail: userId
        }
      });
      return;
    } catch (err) {
      console.warn('Failed to record audit event in database:', err);
    }
  }

  fallbackAuditEvents.unshift({
    id: `aud-${Date.now()}`,
    organization_id: orgId,
    user_id: userId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    event_metadata: eventMetadata,
    created_at: new Date().toISOString()
  });
}
