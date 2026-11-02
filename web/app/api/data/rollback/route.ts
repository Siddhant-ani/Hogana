import { NextRequest, NextResponse } from 'next/server';
import { rollbackDatasetVersion } from '@/lib/supabase/ingestion-service';
import { DEFAULT_ORG_ID } from '@/lib/supabase/persistence-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { versionId, userId = 'operator@hogana.transit' } = body;

    if (!versionId) {
      return NextResponse.json(
        { success: false, message: 'versionId is required to rollback a dataset version.' },
        { status: 400 }
      );
    }

    const result = await rollbackDatasetVersion(DEFAULT_ORG_ID, versionId, userId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Rollback error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
