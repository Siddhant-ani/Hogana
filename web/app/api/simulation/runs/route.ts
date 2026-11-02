import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistentSimRuns,
  savePersistentSimRun,
  DEFAULT_ORG_ID
} from '@/lib/supabase/persistence-service';

export async function GET() {
  try {
    const runs = await getPersistentSimRuns(DEFAULT_ORG_ID);
    return NextResponse.json({ success: true, data: runs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve simulation runs';
    return NextResponse.json({ success: false, error: { message: msg } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenarioType,
      scenarioInputs,
      scenarioOutputs,
      summary,
      createdBy = 'operator@hogana.transit',
      datasetVersionId
    } = body;

    if (!scenarioType || !scenarioInputs || !scenarioOutputs) {
      return NextResponse.json(
        { success: false, message: 'scenarioType, scenarioInputs, and scenarioOutputs are required.' },
        { status: 400 }
      );
    }

    const result = await savePersistentSimRun(
      DEFAULT_ORG_ID,
      scenarioType,
      scenarioInputs,
      scenarioOutputs,
      summary || `${scenarioType} simulation run`,
      createdBy,
      datasetVersionId
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save simulation run';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
