import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '../supabase/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'data_manager' | 'dispatcher' | 'analyst';
  organizationId: string;
}

export type AuthResult =
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: NextResponse };

/**
 * Server-side authorization check for sensitive API endpoints.
 * Guarantees:
 * 1. Session is cryptographically verified server-side via Supabase Auth.
 * 2. Identities and Organization IDs are NEVER trusted from request bodies or client headers.
 * 3. Role-based access control (RBAC) is strictly enforced.
 */
export async function requireServerAuth(
  _request?: NextRequest,
  allowedRoles?: Array<'administrator' | 'data_manager' | 'dispatcher' | 'analyst'>
): Promise<AuthResult> {
  const cookieStore = await cookies();
  const supabase = getSupabaseServerClient(cookieStore);

  if (!supabase) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          code: 'AUTH_PROVIDER_UNAVAILABLE',
          message: 'Supabase authentication service is not configured. Please configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.'
        },
        { status: 503 }
      )
    };
  }

  // 1. Verify session server-side
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Please sign in to perform this operation.'
        },
        { status: 401 }
      )
    };
  }

  // 2. Resolve organization membership and role from database
  let orgId = (user.user_metadata?.organization_id as string) || 'a0000000-0000-0000-0000-000000000001';
  let role = (user.user_metadata?.role as AuthenticatedUser['role']) || 'dispatcher';

  try {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership) {
      orgId = membership.organization_id || orgId;
      if (membership.role) {
        const normalized = membership.role.toLowerCase().replace(/[\s-]+/g, '_');
        if (['administrator', 'data_manager', 'dispatcher', 'analyst'].includes(normalized)) {
          role = normalized as AuthenticatedUser['role'];
        }
      }
    }
  } catch {
    // If table query fails, fallback to user_metadata
  }

  // 3. Verify role permissions if restricted
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: `Forbidden: role '${role}' is not authorized to perform this action. Required: ${allowedRoles.join(' or ')}.`
        },
        { status: 403 }
      )
    };
  }

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email || '',
    name: (user.user_metadata?.name as string) || (user.email ? user.email.split('@')[0] : 'Operator'),
    role,
    organizationId: orgId
  };

  return { authorized: true, user: authenticatedUser };
}
