import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Global in-memory cache for profiles across serverless invocations within worker lifecycle
const globalProfiles: Map<string, UserProfile> = (globalThis as any).__wedmate_profiles || new Map();
(globalThis as any).__wedmate_profiles = globalProfiles;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  let profiles: UserProfile[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (role) {
        query = query.eq('role', role);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        profiles = data.map((p: any) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          role: p.role,
          status: p.status || p.approval_status || 'PENDING',
          approval_status: p.approval_status || p.status || 'PENDING',
          wedding_date: p.wedding_date,
          notes: p.notes,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
      }
    } catch (e: any) {
      console.warn('GET /api/profiles Supabase fetch error:', e.message);
    }
  }

  // Merge with server memory cache
  const map = new Map<string, UserProfile>();
  profiles.forEach((p) => {
    if (p.email) map.set(p.email.toLowerCase(), p);
  });
  Array.from(globalProfiles.values()).forEach((p) => {
    if (!role || p.role === role) {
      if (p.email && !map.has(p.email.toLowerCase())) {
        map.set(p.email.toLowerCase(), p);
      }
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return NextResponse.json({ ok: true, profiles: merged });
}

export async function POST(request: NextRequest) {
  try {
    const profile: UserProfile = await request.json();
    if (!profile || !profile.email) {
      return NextResponse.json({ ok: false, error: 'Invalid profile' }, { status: 400 });
    }

    const email = profile.email.toLowerCase();
    globalProfiles.set(email, {
      ...profile,
      status: profile.status || 'PENDING',
      approval_status: profile.status || 'PENDING',
    });

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const insertPayload: any = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role || 'CUSTOMER',
          status: profile.status || 'PENDING',
          notes: profile.notes || 'Registrasi akun',
          wedding_date: profile.wedding_date || null,
        };
        await supabase.from('profiles').upsert(insertPayload, { onConflict: 'email' });
      } catch (err: any) {
        console.warn('POST /api/profiles Supabase upsert error:', err.message);
      }
    }

    return NextResponse.json({ ok: true, profile: globalProfiles.get(email) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, status, notes } = await request.json();
    if (!userId || !status) {
      return NextResponse.json({ ok: false, error: 'Missing userId or status' }, { status: 400 });
    }

    for (const [email, p] of globalProfiles.entries()) {
      if (p.id === userId) {
        globalProfiles.set(email, {
          ...p,
          status,
          approval_status: status,
          notes: notes !== undefined ? notes : p.notes,
          updated_at: new Date().toISOString(),
        });
        break;
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({
            status,
            notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (err: any) {
        console.warn('PATCH /api/profiles Supabase update error:', err.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
