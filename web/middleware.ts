import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'hogana_production_auth_secret_minimum_32_chars_key_2025';
const SESSION_COOKIE_NAME = 'hogana_session';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/data',
  '/interventions',
  '/simulation',
  '/reports',
  '/forecast',
  '/admin'
];

async function verifySessionTokenEdge(token: string): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [header, payload, sigBase64Url] = parts;

  // Check expiration
  try {
    let b64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64Payload.length % 4) b64Payload += '=';
    const parsed = JSON.parse(atob(b64Payload));
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp && parsed.exp < now) return false;
  } catch {
    return false;
  }

  // Verify HMAC signature via Web Crypto API (supported across all Edge and Node runtimes)
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let b64Sig = sigBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64Sig.length % 4) b64Sig += '=';
    const binarySig = atob(b64Sig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const dataBytes = enc.encode(`${header}.${payload}`);
    return await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionCookie ? await verifySessionTokenEdge(sessionCookie) : false;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Unauthenticated user attempting to access protected operational routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user attempting to visit login page -> redirect to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes except when explicitly checked
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
