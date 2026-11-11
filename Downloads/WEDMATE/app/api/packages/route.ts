import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { WeddingPackage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get('active') !== 'false';

  let packages: WeddingPackage[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from('wedding_packages').select('*').order('price', { ascending: true });
      if (onlyActive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        packages = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          price: Number(d.price),
          estimated_guests: d.estimated_guests,
          description: d.description,
          features: Array.isArray(d.features) ? d.features : JSON.parse(d.features || '[]'),
          is_active: d.is_active,
          image_url: d.image_url,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
      }
    } catch (e: any) {
      console.warn('GET /api/packages Supabase error:', e.message);
    }
  }

  // Fallback to demoStore if Supabase is empty or unavailable
  if (packages.length === 0) {
    packages = demoStore.getPackages(onlyActive);
  }

  return NextResponse.json({ ok: true, packages, count: packages.length });
}
