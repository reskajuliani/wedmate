import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { Booking, BookingStatus } from '@/lib/types';

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

        // If status becomes CONFIRMED, create/ensure invoice in payments
        if (status === 'CONFIRMED' && updated) {
          const invoiceNum = `INV/${new Date().getFullYear()}/WM-${Math.floor(1000 + Math.random() * 9000)}`;
          const totalAmt = Number(updated.total_price) || (updated.package ? Number(updated.package.price) : 0);

          await supabase.from('payments').insert({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'm' + Date.now(),
            booking_id: updated.id,
            customer_id: updated.customer_id,
            invoice_number: invoiceNum,
            total_amount: totalAmt,
            amount_paid: 0,
            remaining_balance: totalAmt,
            status: 'UNPAID',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.warn('PATCH /api/bookings exception:', err.message);
      }
    }

    // Local demoStore update
    if (status === 'CONFIRMED') {
      demoStore.confirmBooking(id, adminId);
    } else {
      demoStore.updateBookingStatus(id, status as BookingStatus, notes);
    }

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
