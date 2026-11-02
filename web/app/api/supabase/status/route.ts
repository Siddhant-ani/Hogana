import { NextResponse } from 'next/server';
import { getSupabaseConfigStatus } from '@/lib/supabase/client';
import { getStorageUsageMetrics } from '@/lib/supabase/storage-service';
import { DEFAULT_ORG_ID } from '@/lib/supabase/persistence-service';

export async function GET() {
  const status = getSupabaseConfigStatus();
  const usage = await getStorageUsageMetrics(DEFAULT_ORG_ID);

  return NextResponse.json({
    success: true,
    data: {
      ...status,
      usage,
      provider: 'Supabase (Free Plan)',
      limits: {
        databaseLimit: '500 MB',
        storageLimit: '1 GB',
        bandwidthLimit: '2 GB / month'
      }
    }
  });
}
