import { NextRequest, NextResponse } from 'next/server';
import { publishDatasetVersion } from '@/lib/supabase/ingestion-service';
import { requireServerAuth } from '@/lib/auth/server-auth';

export async function POST(req: NextRequest) {
  try {
    // Enforce data_manager or administrator
    const auth = await requireServerAuth(req, ['data_manager', 'administrator']);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user } = auth;
    const body = await req.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { success: false, message: 'versionId is required to publish a dataset version.' },
        { status: 400 }
      );
    }

    const result = await publishDatasetVersion(user.organizationId, versionId, user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Publish error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
