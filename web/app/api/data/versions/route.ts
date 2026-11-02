import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { DEFAULT_ORG_ID } from '@/lib/supabase/persistence-service';
import { getDatasetRepository } from '@/lib/supabase/dataset-repository';

export async function GET() {
  try {
    const repo = getDatasetRepository();
    const activeVersion = await repo.getVersionInfo();

    const supabase = getSupabaseAdminClient();
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('dataset_versions')
        .select('*')
        .eq('organization_id', DEFAULT_ORG_ID)
        .order('version_number', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            activeVersion,
            versions: data
          }
        });
      }
    }

    // Default baseline version when running on local files
    return NextResponse.json({
      success: true,
      data: {
        activeVersion,
        versions: [
          {
            id: 'b0000000-0000-0000-0000-000000000001',
            organization_id: DEFAULT_ORG_ID,
            dataset_name: 'Synthetic Baseline — 10 March 2025',
            dataset_date: '2025-03-10',
            version_number: 1,
            status: 'published',
            source_type: 'synthetic_baseline',
            published_at: '2025-03-10T00:00:00Z',
            validation_status: 'passed',
            total_records: 6481,
            is_active: true
          }
        ]
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch dataset versions';
    return NextResponse.json(
      { success: false, error: { message: errorMsg } },
      { status: 500 }
    );
  }
}
