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
  const emailQuery = searchParams.get('email')?.toLowerCase();
  const idQuery = searchParams.get('id');

  let profiles: UserProfile[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (role) {
        query = query.eq('role', role);
      }
      if (emailQuery) {
        query = query.eq('email', emailQuery);
      }
      if (idQuery) {
        query = query.eq('id', idQuery);
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
      } else if (p.email && map.has(p.email.toLowerCase())) {
        // Prefer more recent status from in-memory cache if it was updated
        const existing = map.get(p.email.toLowerCase())!;
        if (p.status === 'APPROVED' && existing.status !== 'APPROVED') {
          map.set(p.email.toLowerCase(), { ...existing, status: 'APPROVED', approval_status: 'APPROVED' });
        }
      }
    }
  });

  let merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  if (emailQuery) {
    merged = merged.filter((p) => p.email.toLowerCase() === emailQuery);
  }
  if (idQuery) {
    merged = merged.filter((p) => p.id === idQuery);
  }

  return NextResponse.json({ ok: true, profiles: merged });
}

export async function POST(request: NextRequest) {
  try {
    const profile: UserProfile = await request.json();
    if (!profile || !profile.email) {
      return NextResponse.json({ ok: false, error: 'Invalid profile' }, { status: 400 });
    }

    const email = profile.email.toLowerCase();
    const existing = globalProfiles.get(email);
    const updatedStatus = existing?.status === 'APPROVED' ? 'APPROVED' : (profile.status || 'PENDING');

    const savedProfile: UserProfile = {
      ...profile,
      email,
      status: updatedStatus,
      approval_status: updatedStatus,
      updated_at: new Date().toISOString(),
    };
    globalProfiles.set(email, savedProfile);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const insertPayload: any = {
          id: profile.id,
          email: profile.email.toLowerCase(),
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role || 'CUSTOMER',
          status: updatedStatus,
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
    const { userId, email: inputEmail, status, notes } = await request.json();
    if ((!userId && !inputEmail) || !status) {
      return NextResponse.json({ ok: false, error: 'Missing target identifier or status' }, { status: 400 });
    }

    let found = false;
    const targetEmail = inputEmail ? inputEmail.toLowerCase() : '';

    for (const [keyEmail, p] of globalProfiles.entries()) {
      if (
        (userId && p.id === userId) ||
        (targetEmail && p.email.toLowerCase() === targetEmail) ||
        (userId && p.email.toLowerCase() === userId.toLowerCase())
      ) {
        globalProfiles.set(keyEmail, {
          ...p,
          status,
          approval_status: status,
          notes: notes !== undefined ? notes : p.notes,
          updated_at: new Date().toISOString(),
        });
        found = true;
        break;
      }
    }

    // If not found in current memory worker, seed it
    if (!found) {
      const emailKey = targetEmail || (userId && userId.includes('@') ? userId.toLowerCase() : `user-${userId}`);
      globalProfiles.set(emailKey, {
        id: userId || `id-${Date.now()}`,
        email: targetEmail || (userId && userId.includes('@') ? userId : ''),
        full_name: 'Calon Pengantin',
        phone: '',
        role: 'CUSTOMER',
        status,
        approval_status: status,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (notes !== undefined) {
          updatePayload.notes = notes;
        }

        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          await supabase.from('profiles').update(updatePayload).eq('id', userId);
        } else if (targetEmail) {
          await supabase.from('profiles').update(updatePayload).eq('email', targetEmail);
        } else if (userId && userId.includes('@')) {
          await supabase.from('profiles').update(updatePayload).eq('email', userId.toLowerCase());
        }
      } catch (err: any) {
        console.warn('PATCH /api/profiles Supabase update error:', err.message);
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
