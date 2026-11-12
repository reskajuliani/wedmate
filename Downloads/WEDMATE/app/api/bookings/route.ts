import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { Booking, BookingStatus } from '@/lib/types';
import { ensureProjectAndTasksForBooking, cleanupProjectForBooking } from '@/lib/task-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const status = searchParams.get('status');

  let bookings: Booking[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('bookings')
        .select('*, package:wedding_packages(*), customer:profiles(*)')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (!error && data) {
        bookings = data.map((b: any) => ({
          id: b.id,
          customer_id: b.customer_id,
          package_id: b.package_id,
          wedding_date: b.wedding_date,
          venue_name: b.venue_name,
          venue_address: b.venue_address,
          guest_count: b.guest_count,
          status: b.status,
          notes: b.notes,
          total_price: Number(b.total_price),
          created_at: b.created_at,
          updated_at: b.updated_at,
          package: b.package
            ? {
                ...b.package,
                price: Number(b.package.price),
                features: Array.isArray(b.package.features) ? b.package.features : JSON.parse(b.package.features || '[]'),
              }
            : undefined,
          customer: b.customer || undefined,
        }));
      }
    } catch (e: any) {
      console.warn('GET /api/bookings Supabase error:', e.message);
    }
  }

  // Fallback / merge with demoStore
  const localBookings = demoStore.getBookings(customerId || undefined);
  const map = new Map<string, Booking>();
  bookings.forEach((b) => map.set(b.id, b));
  localBookings.forEach((b) => {
    if (!map.has(b.id)) map.set(b.id, b);
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return NextResponse.json({ ok: true, bookings: merged, count: merged.length });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const {
      id,
      customer_id,
      package_id,
      wedding_date,
      venue_name,
      venue_address,
      guest_count,
      notes,
      total_price,
    } = payload;

    if (!customer_id || !package_id || !wedding_date || !venue_name || !venue_address) {
      return NextResponse.json({ ok: false, error: 'Semua kolom bertanda bintang wajib diisi.' }, { status: 400 });
    }

    const bookingId = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b' + Date.now());

    let calculatedPrice = Number(total_price) || 0;
    let pkgDetails: any = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();

        // 1. Fetch package to guarantee valid total price & package relationship
        const { data: dbPkg } = await supabase
          .from('wedding_packages')
          .select('*')
          .eq('id', package_id)
          .maybeSingle();

        if (dbPkg) {
          calculatedPrice = calculatedPrice || Number(dbPkg.price);
          pkgDetails = {
            ...dbPkg,
            price: Number(dbPkg.price),
            features: Array.isArray(dbPkg.features) ? dbPkg.features : JSON.parse(dbPkg.features || '[]'),
          };
        }

        // 2. Insert into bookings table via Admin Client (bypassing RLS)
        const insertPayload: any = {
          id: bookingId,
          customer_id,
          package_id,
          wedding_date,
          venue_name: venue_name.trim(),
          venue_address: venue_address.trim(),
          guest_count: Number(guest_count) || 100,
          status: 'PENDING',
          notes: notes ? notes.trim() : null,
          total_price: calculatedPrice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('bookings')
          .insert(insertPayload)
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .maybeSingle();

        if (!insertError && inserted) {
          // Auto-create project and tasks in Supabase
          try {
            const custName = inserted.customer?.full_name || 'Klien Pengantin';
            const projId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'w' + Date.now();
            const { data: newProj } = await supabase
              .from('wedding_projects')
              .insert({
                id: projId,
                booking_id: inserted.id,
                customer_id: inserted.customer_id,
                title: `Pernikahan ${custName}`,
                wedding_date: inserted.wedding_date,
                progress_percent: 0,
                notes: `Proyek pernikahan ${custName} di ${inserted.venue_name}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .maybeSingle();

            if (newProj) {
              const tasksToInsert = [
                { title: 'Konfirmasi Gedung & Fasilitas Venue Pernikahan', description: `Detail lokasi: ${inserted.venue_address}`, category: 'Venue', sort_order: 1 },
                { title: `Food Tasting & Finalisasi Menu Katering (${inserted.guest_count} Tamu)`, description: 'Memilih menu prasmanan utama, stall dessert, dan flow katering.', category: 'Catering', sort_order: 2 },
                { title: 'Fitting Busana Pengantin & Keluarga Inti', description: 'Pengukuran kebaya/beskap akad serta gaun resepsi.', category: 'Attire', sort_order: 3 },
                { title: 'Konsep Desain Dekorasi Pelaminan & Floral', description: 'Penataan lorong masuk, photobooth, dan panggung pelaminan.', category: 'Decoration', sort_order: 4 },
                { title: 'Briefing Tim Dokumentasi Foto & Video Sinematik', description: 'Penyusunan shot-list momen sakral akad dan resepsi.', category: 'Documentation', sort_order: 5 },
                { title: 'Distribusi Undangan Digital & Koordinasi RSVP Tamu', description: 'Verifikasi ejaan nama tamu VIP dan sistem buku tamu.', category: 'Invitation', sort_order: 6 },
                { title: 'Kurasi MC & Pengisi Musik Entertainment Resepsi', description: 'Pemilihan MC profesional dan daftar lagu wedding.', category: 'Entertainment', sort_order: 7 },
                { title: 'Verifikasi Berkas KUA / Catatan Sipil & Kelengkapan Saksi', description: 'Pemeriksaan surat pengantar nikah dan saksi akad.', category: 'Legal', sort_order: 8 },
              ].map((t) => ({
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
                project_id: newProj.id,
                title: t.title,
                description: t.description,
                category: t.category,
                status: 'TODO',
                due_date: inserted.wedding_date,
                sort_order: t.sort_order,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));

              await supabase.from('wedding_tasks').insert(tasksToInsert);
            }
          } catch (projErr) {
            console.warn('Auto project creation warning:', projErr);
          }

          return NextResponse.json({ ok: true, booking: inserted });
        } else if (insertError) {
          console.warn('POST /api/bookings Supabase insert error:', insertError.message);
        }
      } catch (err: any) {
        console.warn('POST /api/bookings exception:', err.message);
      }
    }

    // Always fallback to demoStore
    const localBooking = demoStore.createBooking({
      customer_id,
      package_id,
      wedding_date,
      venue_name,
      venue_address,
      guest_count,
      notes,
    });

    return NextResponse.json({ ok: true, booking: localBooking });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, notes, adminId } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'ID booking dan status wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (notes !== undefined) {
          updatePayload.notes = notes;
        }

        const { data: updated, error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', id)
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .maybeSingle();

        if (error) {
          console.warn('PATCH /api/bookings Supabase update error:', error.message);
        }

        // Trigger project & tasks auto-generation or cleanup strictly on Admin Action
        if (status === 'CONFIRMED' && updated) {
          await ensureProjectAndTasksForBooking(supabase, updated);
        } else if (status === 'CANCELLED' || status === 'REJECTED') {
          await cleanupProjectForBooking(supabase, id);
        }
      } catch (err: any) {
        console.warn('PATCH /api/bookings exception:', err.message);
      }
    }

    // Local demoStore update (safe in serverless environment)
    try {
      if (status === 'CONFIRMED') {
        demoStore.confirmBooking(id, adminId);
      } else {
        demoStore.updateBookingStatus(id, status as BookingStatus, notes);
      }
    } catch (localErr: any) {
      console.warn('demoStore local update skipped in serverless context:', localErr?.message);
    }

    return NextResponse.json({ ok: true, status, notes });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
