import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getCleanSupabaseUrl, getCleanSupabaseAnonKey } from './client';

/**
 * Creates a privileged Supabase client for Server-Side API routes.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS) policies,
 * allowing full read/write access for admin operations, cross-device profile syncing,
 * and background status updates.
 */
export function createAdminClient() {
  const url = getCleanSupabaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = getCleanSupabaseAnonKey();
  const keyToUse = serviceKey || anonKey;

  return createSupabaseClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
