import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { WeddingProject, WeddingTask, TaskStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getCategoryForFeature(title: string): WeddingTask['category'] {
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

function buildTasksForBooking(booking: any, projectId: string): any[] {
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

  // 3. Add core legal & coordination milestones if not already in features
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  let projects: WeddingProject[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Auto-healing: ONLY for CONFIRMED bookings!
      const { data: confirmedBookings } = await supabase
        .from('bookings')
        .select('*, package:wedding_packages(*), customer:profiles(*)')
        .eq('status', 'CONFIRMED')
        .order('created_at', { ascending: false });

      const confirmedIds = new Set((confirmedBookings || []).map((b: any) => b.id));

      // Clean up any projects that belong to non-confirmed bookings
      const { data: allProjectsInDb } = await supabase.from('wedding_projects').select('id, booking_id');
      if (allProjectsInDb) {
        for (const p of allProjectsInDb) {
          if (p.booking_id && !confirmedIds.has(p.booking_id)) {
            await supabase.from('wedding_tasks').delete().eq('project_id', p.id);
            await supabase.from('wedding_projects').delete().eq('id', p.id);
          }
        }
      }

      if (confirmedBookings && confirmedBookings.length > 0) {
        for (const b of confirmedBookings) {
          const { data: existingProj } = await supabase
            .from('wedding_projects')
            .select('id')
            .eq('booking_id', b.id)
            .maybeSingle();

          let targetProjId = existingProj?.id;

          if (!existingProj) {
            const custName = b.customer?.full_name || 'Klien Pengantin';
            const projId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'w' + Date.now();

            const { data: newProj, error: pError } = await supabase
              .from('wedding_projects')
              .insert({
                id: projId,
                booking_id: b.id,
                customer_id: b.customer_id,
                title: `Pernikahan ${custName}`,
                wedding_date: b.wedding_date,
                progress_percent: 0,
                notes: `Proyek persiapan pernikahan ${custName} di ${b.venue_name}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .maybeSingle();

            if (!pError && newProj) {
              targetProjId = newProj.id;
            }
          }

          if (targetProjId) {
            // Check existing tasks for this project
            const { data: existingTasks } = await supabase
              .from('wedding_tasks')
              .select('id')
              .eq('project_id', targetProjId);

            if (!existingTasks || existingTasks.length <= 1) {
              // Delete placeholder task if any and populate full package tasks
              if (existingTasks && existingTasks.length > 0) {
                await supabase.from('wedding_tasks').delete().eq('project_id', targetProjId);
              }
              const tasksToInsert = buildTasksForBooking(b, targetProjId);
              await supabase.from('wedding_tasks').insert(tasksToInsert);
            }
          }
        }
      }

      // 2. Fetch projects with tasks joined (only confirmed)
      let query = supabase
        .from('wedding_projects')
        .select('*, tasks:wedding_tasks(*)')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (!error && data) {
        projects = data
          .filter((p: any) => !p.booking_id || confirmedIds.has(p.booking_id))
          .map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            customer_id: p.customer_id,
            title: p.title,
            wedding_date: p.wedding_date,
            progress_percent: Number(p.progress_percent || 0),
            notes: p.notes,
            created_at: p.created_at,
            updated_at: p.updated_at,
            tasks: (p.tasks || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
          }));
      }
    } catch (e: any) {
      console.warn('GET /api/projects Supabase error:', e.message);
    }
  }

  // Merge with demoStore
  const localProjects = demoStore.getProjects(customerId || undefined);
  const map = new Map<string, WeddingProject>();
  projects.forEach((p) => map.set(p.id, p));
  localProjects.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return NextResponse.json({ ok: true, projects: merged, count: merged.length });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { action, projectId, task } = payload;

    if (action === 'ADD_TASK' && projectId && task) {
      const taskId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Date.now();

      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          await supabase.from('wedding_tasks').insert({
            id: taskId,
            project_id: projectId,
            title: task.title,
            description: task.description || null,
            category: task.category || 'Other',
            status: task.status || 'TODO',
            due_date: task.due_date || null,
            sort_order: Number(task.sort_order) || 99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch (e: any) {
          console.warn('POST /api/projects insert task error:', e.message);
        }
      }

      demoStore.createTask({
        project_id: projectId,
        title: task.title,
        description: task.description,
        category: task.category,
        status: task.status,
        due_date: task.due_date,
        sort_order: task.sort_order,
      });

      return NextResponse.json({ ok: true, taskId });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    const { taskId, status, updates } = payload;

    if (!taskId) {
      return NextResponse.json({ ok: false, error: 'Task ID required' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        };
        if (status) updatePayload.status = status;
        if (updates) Object.assign(updatePayload, updates);

        await supabase.from('wedding_tasks').update(updatePayload).eq('id', taskId);

        // Recalculate progress percent for the parent project
        const { data: t } = await supabase.from('wedding_tasks').select('project_id').eq('id', taskId).maybeSingle();
        if (t && t.project_id) {
          const { data: allTasks } = await supabase.from('wedding_tasks').select('status').eq('project_id', t.project_id);
          if (allTasks && allTasks.length > 0) {
            const completed = allTasks.filter((task) => task.status === 'COMPLETED').length;
            const pct = Math.round((completed / allTasks.length) * 100);
            await supabase.from('wedding_projects').update({ progress_percent: pct, updated_at: new Date().toISOString() }).eq('id', t.project_id);
          }
        }
      } catch (err: any) {
        console.warn('PATCH /api/projects exception:', err.message);
      }
    }

    demoStore.updateTaskStatus(taskId, status as TaskStatus);

    return NextResponse.json({ ok: true, taskId, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
