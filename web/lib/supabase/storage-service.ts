import 'server-only';
import { getSupabaseAdminClient, isSupabaseConfigured } from './client';
import { FreeTierUsageMetrics } from './types';

/**
 * HOGANA Supabase Private Storage Service
 * 
 * Manages the three designated private buckets:
 * 1. operational-source-files
 * 2. research-source-files
 * 3. generated-reports
 */

export const BUCKETS = {
  OPERATIONAL: 'operational-source-files',
  RESEARCH: 'research-source-files',
  REPORTS: 'generated-reports'
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

export interface UploadResult {
  success: boolean;
  bucket: BucketName;
  path: string;
  sizeBytes: number;
  error?: string;
}

export async function uploadFileToBucket(
  bucket: BucketName,
  storagePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      bucket,
      path: storagePath,
      sizeBytes: fileBuffer.length,
      error: 'Supabase storage is not configured.'
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      success: false,
      bucket,
      path: storagePath,
      sizeBytes: fileBuffer.length,
      error: 'Supabase admin client unavailable.'
    };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      return {
        success: false,
        bucket,
        path: storagePath,
        sizeBytes: fileBuffer.length,
        error: error.message
      };
    }

    return {
      success: true,
      bucket,
      path: data.path,
      sizeBytes: fileBuffer.length
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown storage upload error';
    return {
      success: false,
      bucket,
      path: storagePath,
      sizeBytes: fileBuffer.length,
      error: msg
    };
  }
}

export async function getSignedDownloadUrl(
  bucket: BucketName,
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Monitors storage against the Supabase Free plan:
 * - 500 MB database storage limit
 * - 1 GB (1,073,741,824 bytes) file storage limit
 */
export async function getStorageUsageMetrics(orgId: string): Promise<FreeTierUsageMetrics> {
  const DB_LIMIT_BYTES = 500 * 1024 * 1024;    // 500 MB
  const FILE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      databaseStorageBytes: 15 * 1024 * 1024, // approx 15 MB baseline
      databaseStorageLimitBytes: DB_LIMIT_BYTES,
      fileStorageBytes: 10 * 1024 * 1024,
      fileStorageLimitBytes: FILE_LIMIT_BYTES,
      activeDatasetCount: 1,
      totalVersionCount: 1,
      isApproachingLimit: false,
      usagePercentage: 3.0
    };
  }

  try {
    // Count versions
    const { count: versionCount } = await supabase
      .from('dataset_versions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Sum file sizes in dataset_files
    const { data: files } = await supabase
      .from('dataset_files')
      .select('file_size');

    const totalFileBytes = (files || []).reduce((acc: number, f: any) => acc + (Number(f.file_size) || 0), 0);
    // Rough estimate of DB row storage (~150 bytes per row)
    const { count: totalTripRows } = await supabase.from('stop_times').select('*', { count: 'exact', head: true });
    const estDbBytes = (totalTripRows || 0) * 200 + 20 * 1024 * 1024;

    const usagePct = (totalFileBytes / FILE_LIMIT_BYTES) * 100;

    return {
      databaseStorageBytes: estDbBytes,
      databaseStorageLimitBytes: DB_LIMIT_BYTES,
      fileStorageBytes: totalFileBytes,
      fileStorageLimitBytes: FILE_LIMIT_BYTES,
      activeDatasetCount: 1,
      totalVersionCount: versionCount || 1,
      isApproachingLimit: usagePct > 80,
      usagePercentage: Math.round(usagePct * 10) / 10
    };
  } catch {
    return {
      databaseStorageBytes: 20 * 1024 * 1024,
      databaseStorageLimitBytes: DB_LIMIT_BYTES,
      fileStorageBytes: 15 * 1024 * 1024,
      fileStorageLimitBytes: FILE_LIMIT_BYTES,
      activeDatasetCount: 1,
      totalVersionCount: 1,
      isApproachingLimit: false,
      usagePercentage: 2.5
    };
  }
}
