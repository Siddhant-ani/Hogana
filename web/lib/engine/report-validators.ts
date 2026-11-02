/**
 * HOGANA — Report & Local Record Validation Utilities
 * 
 * Safe schema validators for local demonstration records (reviews and simulation runs).
 * Ensures corrupted, partial, or malformed browser storage records are safely
 * rejected before table rendering, CSV serialization, or JSON download.
 */

export interface LocalStoredReview {
  proposalId: string;
  decision: 'approved' | 'rejected';
  reviewNote: string;
  reviewedAt: string;
}

export interface LocalStoredSimRun {
  id: string;
  scenarioType: 'holding' | 'relief' | 'crowding';
  summary: string;
  details: string;
  simulatedAt: string;
}

export function isValidLocalReview(item: unknown): item is LocalStoredReview {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.proposalId === 'string' &&
    record.proposalId.trim().length > 0 &&
    (record.decision === 'approved' || record.decision === 'rejected') &&
    typeof record.reviewNote === 'string' &&
    typeof record.reviewedAt === 'string' &&
    record.reviewedAt.trim().length > 0
  );
}

export function isValidLocalSimRun(item: unknown): item is LocalStoredSimRun {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    record.id.trim().length > 0 &&
    (record.scenarioType === 'holding' || record.scenarioType === 'relief' || record.scenarioType === 'crowding') &&
    typeof record.summary === 'string' &&
    typeof record.details === 'string' &&
    typeof record.simulatedAt === 'string' &&
    record.simulatedAt.trim().length > 0
  );
}

export function formatSafeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
  } catch {
    return dateStr;
  }
}
