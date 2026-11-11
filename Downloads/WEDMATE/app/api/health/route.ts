import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isSupabaseConfigured();
  let supabaseTest: any = null;

  if (configured) {
    try {
      const supabase = createAdminClient();
      
      // Test select profiles with admin client
      const profilesRes = await supabase.from('profiles').select('*', { count: 'exact' });
      
      // Test select packages
      const packagesRes = await supabase.from('wedding_packages').select('*', { count: 'exact' });

      // Test select bookings
      const bookingsRes = await supabase.from('bookings').select('*', { count: 'exact' });

      supabaseTest = {
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        adminProfiles: {
          success: !profilesRes.error,
          error: profilesRes.error ? profilesRes.error.message : null,
          count: profilesRes.count,
          dataLength: profilesRes.data ? profilesRes.data.length : 0,
        },
        packages: {
          success: !packagesRes.error,
          error: packagesRes.error ? packagesRes.error.message : null,
          count: packagesRes.count,
        },
        bookings: {
          success: !bookingsRes.error,
          error: bookingsRes.error ? bookingsRes.error.message : null,
          count: bookingsRes.count,
        },
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
  });
}


