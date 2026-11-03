import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistentSimRuns,
  savePersistentSimRun,
  DEFAULT_ORG_ID
} from '@/lib/supabase/persistence-service';
import { requireServerAuth } from '@/lib/auth/server-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireServerAuth(req);
    const orgId = auth.authorized ? auth.user.organizationId : DEFAULT_ORG_ID;

    const runs = await getPersistentSimRuns(orgId);
    return NextResponse.json({ success: true, data: runs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve simulation runs';
    return NextResponse.json({ success: false, error: { message: msg } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Requires authenticated user
    const auth = await requireServerAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user } = auth;
    const body = await req.json();
    const {
      scenarioType,
      scenarioInputs,
      scenarioOutputs,
      summary,
      datasetVersionId
    } = body;

    if (!scenarioType || !scenarioInputs || !scenarioOutputs) {
      return NextResponse.json(
        { success: false, message: 'scenarioType, scenarioInputs, and scenarioOutputs are required.' },
        { status: 400 }
      );
    }

    const result = await savePersistentSimRun(
      user.organizationId,
      scenarioType,
      scenarioInputs,
      scenarioOutputs,
      summary || `${scenarioType} simulation run`,
      user.id,
      datasetVersionId
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save simulation run';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
