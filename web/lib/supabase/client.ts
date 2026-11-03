import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

/**
 * HOGANA Supabase Client Layer
 * 
 * Provides browser, server, and administrative clients.
 * Designed with Supabase Free plan boundaries and safety fallbacks.
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasServiceRoleKey: boolean;
  hasDatabaseUrl: boolean;
  hasDirectUrl: boolean;
  url: string | null;
  mode: 'supabase_active' | 'local_fallback';
  missingKeys: string[];
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || null;
  const secretKey = process.env.SUPABASE_SECRET_KEY || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  const dbUrl = process.env.DATABASE_URL || null;
  const directUrl = process.env.DIRECT_URL || null;

  const missingKeys: string[] = [];
  if (!url) missingKeys.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  if (!publishableKey) missingKeys.push('SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  if (!secretKey && !serviceRoleKey) missingKeys.push('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');

  const isConfigured = Boolean(url && publishableKey && (secretKey || serviceRoleKey));

  return {
    isConfigured,
    hasUrl: Boolean(url),
    hasPublishableKey: Boolean(publishableKey),
    hasSecretKey: Boolean(secretKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    hasDatabaseUrl: Boolean(dbUrl && !dbUrl.includes('[YOUR-PASSWORD]')),
    hasDirectUrl: Boolean(directUrl && !directUrl.includes('[YOUR-PASSWORD]')),
    url: url ? url.replace(/^(https?:\/\/[^.]+).*/, '$1.supabase.co') : null,
    mode: isConfigured ? 'supabase_active' : 'local_fallback',
    missingKeys
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

/**
 * Browser-side Supabase client for authenticated operations in client components.
 */
let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (cachedBrowserClient) return cachedBrowserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  cachedBrowserClient = createBrowserClient(url, key);
  return cachedBrowserClient;
}

/**
 * Server-side Supabase client with cookie session integration.
 */
export function getSupabaseServerClient(cookieStore?: ReadonlyRequestCookies): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  if (!cookieStore) {
    // Return standard client without cookie-persisted session if no cookieStore provided
    return createClient(url, key, {
      auth: { persistSession: false }
    });
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      }
    }
  });
}

/**
 * Privileged server-only Supabase client for data ingestion, background jobs,
 * and operations requiring service-role privileges.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // A publishable key must never be used as a replacement for an administrative secret key.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
