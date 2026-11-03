import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistentReviews,
  savePersistentReview,
  DEFAULT_ORG_ID
} from '@/lib/supabase/persistence-service';
import { requireServerAuth } from '@/lib/auth/server-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireServerAuth(req);
    const orgId = auth.authorized ? auth.user.organizationId : DEFAULT_ORG_ID;

    const reviews = await getPersistentReviews(orgId);
    return NextResponse.json({ success: true, data: reviews });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve persistent reviews';
    return NextResponse.json({ success: false, error: { message: msg } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Enforce dispatcher or administrator role
    const auth = await requireServerAuth(req, ['dispatcher', 'administrator']);
    if (!auth.authorized) {
      return auth.response;
    }

    const { user } = auth;
    const body = await req.json();
    const {
      proposalId,
      decision,
      reviewNote,
      datasetVersionId
    } = body;

    if (!proposalId || !decision) {
      return NextResponse.json(
        { success: false, message: 'proposalId and decision are required.' },
        { status: 400 }
      );
    }

    if (decision === 'rejected' && (!reviewNote || !reviewNote.trim())) {
      return NextResponse.json(
        { success: false, message: 'A specific operational rejection note is required to reject an advisory intervention proposal.' },
        { status: 422 }
      );
    }

    const result = await savePersistentReview(
      user.organizationId,
      proposalId,
      decision,
      reviewNote || (decision === 'approved' ? 'Approved by operations reviewer.' : ''),
      user.id,
      datasetVersionId
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save review';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
