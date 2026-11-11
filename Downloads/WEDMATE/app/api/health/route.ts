import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isSupabaseConfigured();
  let supabaseTest: any = null;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');

  if (configured) {
    try {
      const supabase = createClient();
      
      // Test select profiles
      const profilesRes = await supabase.from('profiles').select('*', { count: 'exact' });
      
      // Test select packages
      const packagesRes = await supabase.from('wedding_packages').select('*', { count: 'exact' });

      // Test select bookings
      const bookingsRes = await supabase.from('bookings').select('*', { count: 'exact' });

      // Test insert into profiles with a test record
      const testId = '00000000-0000-4000-8000-000000000001';
      const testInsertRes = await supabase.from('profiles').insert({
        id: testId,
        email: 'test_probe@wedmate.id',
        full_name: 'Probe Test',
        phone: '08123456789',
        role: 'CUSTOMER',
        status: 'PENDING',
        notes: 'Health probe',
      });

      // Try selecting the probe back
      const probeRes = await supabase.from('profiles').select('*').eq('email', 'test_probe@wedmate.id');

      // Clean up probe if it was inserted
      if (!testInsertRes.error) {
        await supabase.from('profiles').delete().eq('id', testId);
      }

      supabaseTest = {
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        profiles: {
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
        testInsert: {
          success: !testInsertRes.error,
          error: testInsertRes.error ? testInsertRes.error.message : null,
          details: testInsertRes.error ? testInsertRes.error.details : null,
          code: testInsertRes.error ? testInsertRes.error.code : null,
        },
        probeSelect: {
          success: !probeRes.error,
          found: probeRes.data ? probeRes.data.length : 0,
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

