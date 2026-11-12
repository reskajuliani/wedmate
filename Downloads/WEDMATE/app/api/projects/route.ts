import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { WeddingProject, WeddingTask, TaskStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DEFAULT_TASK_TEMPLATES: {
  title: string;
  description: string;
  category: WeddingTask['category'];
  sort_order: number;
}[] = [
  {
    title: 'Konfirmasi Gedung & Fasilitas Venue Pernikahan',
    description: 'Verifikasi kelengkapan ruang akad, ballroom, ruang rias, dan izin keramaian.',
    category: 'Venue',
    sort_order: 1,
  },
  {
    title: 'Food Tasting & Finalisasi Menu Katering',
    description: 'Memilih menu prasmanan utama, stall dessert premium, dan alur flow katering.',
    category: 'Catering',
    sort_order: 2,
  },
  {
    title: 'Fitting Busana Pengantin & Keluarga Inti',
    description: 'Pengukuran kebaya/beskap akad serta gaun resepsi kedua mempelai dan orang tua.',
    category: 'Attire',
    sort_order: 3,
  },
  {
    title: 'Finalisasi Konsep Dekorasi Pelaminan & Floral',
    description: 'Penataan lorong masuk (aisle), photobooth, panggung musik, dan bunga segar.',
    category: 'Decoration',
    sort_order: 4,
  },
  {
    title: 'Briefing Tim Dokumentasi Foto & Video Sinematik',
    description: 'Penyusunan shot-list momen sakral, video teaser same-day edit, dan drone operator.',
    category: 'Documentation',
    sort_order: 5,
  },
  {
    title: 'Distribusi Undangan Digital & Koordinasi RSVP Tamu',
    description: 'Verifikasi ejaan nama tamu VIP, barcode RSVP, dan buku tamu digital.',
    category: 'Invitation',
    sort_order: 6,
  },
  {
    title: 'Kurasi MC & Pengisi Musik Entertainment Resepsi',
    description: 'Pemilihan MC profesional, band akustik / mini chamber, dan daftar lagu wedding.',
    category: 'Entertainment',
    sort_order: 7,
  },
  {
    title: 'Verifikasi Berkas KUA / Catatan Sipil & Kelengkapan Saksi',
    description: 'Pemeriksaan surat pengantar nikah, saksi akad, dan susunan meja penghulu.',
    category: 'Legal',
    sort_order: 8,
  },
];

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
        .select('*, customer:profiles(*)')
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
              const tasksToInsert = DEFAULT_TASK_TEMPLATES.map((tpl) => ({
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9),
                project_id: newProj.id,
                title: tpl.title,
                description: tpl.description,
                category: tpl.category,
                status: 'TODO',
                due_date: b.wedding_date,
                sort_order: tpl.sort_order,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));

              await supabase.from('wedding_tasks').insert(tasksToInsert);
            }
          }
        }
      }

      // 2. Fetch projects with tasks joined
      let query = supabase
        .from('wedding_projects')
        .select('*, tasks:wedding_tasks(*)')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (!error && data) {
        projects = data.map((p: any) => ({
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
            sort_order: task.sort_order || 99,
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
        console.warn('PATCH /api/projects error:', err.message);
      }
    }

    if (status) {
      demoStore.updateTaskStatus(taskId, status as TaskStatus);
    }

    return NextResponse.json({ ok: true, taskId, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
