import { createBrowserClient } from '@supabase/ssr';

export const getCleanSupabaseUrl = (): string => {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-placeholder.supabase.co').trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  return url;
};

export const getCleanSupabaseAnonKey = (): string => {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-placeholder-anon-key').trim();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getCleanSupabaseUrl();
  const anonKey = getCleanSupabaseAnonKey();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-id') &&
    !url.includes('demo-placeholder') &&
    !anonKey.includes('your-anon-key') &&
    !anonKey.includes('demo-placeholder')
  );
};

export const createClient = () => {
  const url = getCleanSupabaseUrl();
  const anonKey = getCleanSupabaseAnonKey();

  return createBrowserClient(url, anonKey);
};
