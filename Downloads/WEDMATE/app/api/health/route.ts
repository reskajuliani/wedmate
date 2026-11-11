import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isSupabaseConfigured();
  let supabaseTest: any = null;

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error, count } = await supabase.from('profiles').select('*', { count: 'exact' });
      supabaseTest = {
        success: !error,
        error: error ? { message: error.message, details: error.details, code: error.code } : null,
        count: count,
        dataLength: data ? data.length : 0,
      };
    } catch (e: any) {
      supabaseTest = { success: false, exception: e.message };
    }
  }

  return NextResponse.json({
    ok: true,
    supabaseConfigured: configured,
    supabaseTest,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  });
}
