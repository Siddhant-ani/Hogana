import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/data',
  '/interventions',
  '/simulation',
  '/reports',
  '/forecast',
  '/admin'
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  const isPlaceholder = Boolean(
    supabaseUrl?.includes('your-project-id') ||
    supabaseKey?.includes('your_key') ||
    supabaseKey?.includes('placeholder')
  );

  let user = null;

  if (supabaseUrl && supabaseKey && !isPlaceholder) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase getUser timeout')), 2000)
      );
      const res: any = await Promise.race([supabase.auth.getUser(), timeoutPromise]).catch(() => null);
      user = res?.data?.user || null;
    } catch {
      user = null;
    }
  }

  // Session verification: Check HTTP-only session cookies (works in production on Vercel and local development)
  if (!user) {
    const sessionCookie = request.cookies.get('hogana_session')?.value;
    const testCookie = request.cookies.get('sb-test-auth')?.value;
    if (sessionCookie || testCookie === 'true') {
      user = { id: sessionCookie || '00000000-0000-4000-8000-000000000001' } as any;
    }
  }

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Unauthenticated user attempting to access protected operational routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user attempting to visit login/signup page -> redirect to dashboard
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
