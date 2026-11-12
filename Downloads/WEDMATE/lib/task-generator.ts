import { WeddingTask } from '@/lib/types';

export function getCategoryForFeature(title: string): WeddingTask['category'] {
  const lower = title.toLowerCase();
  if (lower.includes('dekor') || lower.includes('bunga') || lower.includes('pelaminan') || lower.includes('floral')) return 'Decoration';
  if (lower.includes('katering') || lower.includes('menu') || lower.includes('food') || lower.includes('prasmanan') || lower.includes('tasting') || lower.includes('stall')) return 'Catering';
  if (lower.includes('busana') || lower.includes('kebaya') || lower.includes('beskap') || lower.includes('rias') || lower.includes('makeup') || lower.includes('fitting') || lower.includes('gaun')) return 'Attire';
  if (lower.includes('foto') || lower.includes('video') || lower.includes('dokumentasi') || lower.includes('drone') || lower.includes('kamera') || lower.includes('cinematik') || lower.includes('cinematic')) return 'Documentation';
  if (lower.includes('venue') || lower.includes('gedung') || lower.includes('ballroom') || lower.includes('hotel') || lower.includes('akomodasi') || lower.includes('lokasi')) return 'Venue';
  if (lower.includes('mc') || lower.includes('musik') || lower.includes('sound') || lower.includes('lighting') || lower.includes('band') || lower.includes('entertainment') || lower.includes('akustik') || lower.includes('penyanyi')) return 'Entertainment';
  if (lower.includes('undangan') || lower.includes('rsvp') || lower.includes('buku tamu') || lower.includes('barcode')) return 'Invitation';
  if (lower.includes('kua') || lower.includes('legal') || lower.includes('penghulu') || lower.includes('saksi') || lower.includes('catatan sipil') || lower.includes('ijab')) return 'Legal';
  return 'Other';
}

export function buildTasksForBooking(booking: any, projectId: string): any[] {
  const tasks: any[] = [];
  let sortOrder = 1;

  // 1. Mandatory core milestone: Venue
  tasks.push({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
    project_id: projectId,
    title: `Konfirmasi Gedung & Fasilitas Venue: ${booking.venue_name || 'Lokasi Acara'}`,
    description: `Alamat: ${booking.venue_address || 'Sesuai reservasi'} • Estimasi Kapasitas: ${booking.guest_count || 100} Tamu Undangan`,
    category: 'Venue',
    status: 'TODO',
    due_date: booking.wedding_date || undefined,
    sort_order: sortOrder++,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 2. Extract features from the selected package
  let rawFeatures: string[] = [];
  if (booking.package && booking.package.features) {
    if (Array.isArray(booking.package.features)) {
      rawFeatures = booking.package.features;
    } else if (typeof booking.package.features === 'string') {
      try {
        rawFeatures = JSON.parse(booking.package.features);
      } catch {
        rawFeatures = [booking.package.features];
      }
    }
  }

  // Add each package feature as an actionable checklist task
  if (rawFeatures.length > 0) {
    for (const feature of rawFeatures) {
      tasks.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
        project_id: projectId,
        title: feature,
        description: `Fasilitas resmi paket ${booking.package?.name || 'Wedding'}. Ceklis setelah koordinasi bersama tim vendor selesai.`,
        category: getCategoryForFeature(feature),
        status: 'TODO',
        due_date: booking.wedding_date || undefined,
        sort_order: sortOrder++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // 3. Add core legal & coordination milestones if not already present
  const hasLegal = rawFeatures.some((f) => f.toLowerCase().includes('kua') || f.toLowerCase().includes('legal'));
  if (!hasLegal) {
    tasks.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
      project_id: projectId,
      title: 'Verifikasi Berkas KUA / Catatan Sipil & Kelengkapan Saksi',
      description: 'Pemeriksaan surat pengantar nikah, saksi akad nikah, dan susunan meja penghulu.',
      category: 'Legal',
      status: 'TODO',
      due_date: booking.wedding_date || undefined,
      sort_order: sortOrder++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const hasRSVP = rawFeatures.some((f) => f.toLowerCase().includes('undangan') || f.toLowerCase().includes('rsvp'));
  if (!hasRSVP) {
    tasks.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
      project_id: projectId,
      title: 'Distribusi Undangan Digital & Koordinasi Barcode RSVP Tamu',
      description: 'Verifikasi ejaan nama keluarga/tamu VIP dan pengaturan sistem buku tamu digital.',
      category: 'Invitation',
      status: 'TODO',
      due_date: booking.wedding_date || undefined,
      sort_order: sortOrder++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const hasTM = rawFeatures.some((f) => f.toLowerCase().includes('technical meeting') || f.toLowerCase().includes('gladi'));
  if (!hasTM) {
    tasks.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
      project_id: projectId,
      title: 'Technical Meeting Final & Gladi Resik Bersama Seluruh Kru WO',
      description: 'Sinkronisasi rundown H-7 bersama tim WO, keluarga inti, dan seluruh vendor pendukung.',
      category: 'Other',
      status: 'TODO',
      due_date: booking.wedding_date || undefined,
      sort_order: sortOrder++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return tasks;
}

/**
 * Triggered on Admin Action (Approve / Confirm Booking):
 * Automatically creates Invoice, Wedding Project, and Package-specific tasks
 */
export async function ensureProjectAndTasksForBooking(supabase: any, booking: any) {
  try {
    // 1. Ensure Payment Invoice
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (!existingPayment) {
      const invoiceNum = `INV/${new Date().getFullYear()}/WM-${Math.floor(1000 + Math.random() * 9000)}`;
      const totalAmt = Number(booking.total_price) || (booking.package ? Number(booking.package.price) : 25000000);

      await supabase.from('payments').insert({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'm' + Date.now(),
        booking_id: booking.id,
        customer_id: booking.customer_id,
        invoice_number: invoiceNum,
        total_amount: totalAmt,
        amount_paid: 0,
        remaining_balance: totalAmt,
        status: 'UNPAID',
        due_date: booking.wedding_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Ensure Wedding Project
    const { data: existingProj } = await supabase
      .from('wedding_projects')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    let targetProjId = existingProj?.id;

    if (!existingProj) {
      const custName = booking.customer?.full_name || 'Klien Pengantin';
      const projId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'w' + Date.now();

      const { data: newProj, error: pError } = await supabase
        .from('wedding_projects')
        .insert({
          id: projId,
          booking_id: booking.id,
          customer_id: booking.customer_id,
          title: `Pernikahan ${custName}`,
          wedding_date: booking.wedding_date,
          progress_percent: 0,
          notes: `Proyek pernikahan ${custName} di ${booking.venue_name || 'Venue'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

      if (!pError && newProj) {
        targetProjId = newProj.id;
      }
    }

    // 3. Populate package-specific tasks
    if (targetProjId) {
      const { data: existingTasks } = await supabase
        .from('wedding_tasks')
        .select('id')
        .eq('project_id', targetProjId);

      if (!existingTasks || existingTasks.length <= 1) {
        if (existingTasks && existingTasks.length > 0) {
          await supabase.from('wedding_tasks').delete().eq('project_id', targetProjId);
        }
        const tasksToInsert = buildTasksForBooking(booking, targetProjId);
        await supabase.from('wedding_tasks').insert(tasksToInsert);
      }
    }
  } catch (err: any) {
    console.warn('ensureProjectAndTasksForBooking warning:', err.message);
  }
}

/**
 * Triggered on Admin Action (Reject / Cancel Booking):
 * Cleans up project & tasks associated with the cancelled booking
 */
export async function cleanupProjectForBooking(supabase: any, bookingId: string) {
  try {
    const { data: targetProjs } = await supabase
      .from('wedding_projects')
      .select('id')
      .eq('booking_id', bookingId);

    if (targetProjs && targetProjs.length > 0) {
      for (const p of targetProjs) {
        await supabase.from('wedding_tasks').delete().eq('project_id', p.id);
        await supabase.from('wedding_projects').delete().eq('id', p.id);
      }
    }

    // Clean up or mark invoice as CANCELLED so client doesn't see dangling bills
    await supabase
      .from('payments')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId);
  } catch (err: any) {
    console.warn('cleanupProjectForBooking warning:', err.message);
  }
}
