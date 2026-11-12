import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { WeddingProject, TaskStatus } from '@/lib/types';
import { ensureProjectAndTasksForBooking, cleanupProjectForBooking } from '@/lib/task-generator';

export const dynamic = 'force-dynamic';

/**
 * Fast Single-Query Project Retrieval (<150ms):
 * Directly selects from wedding_projects with related tasks.
 * Auto-healing has been decoupled and moved strictly to Admin Action Triggers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  let projects: WeddingProject[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

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

      // Safety Net: If no projects found, check if there are confirmed bookings that need healing
      if (projects.length === 0) {
        let bQuery = supabase
          .from('bookings')
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .eq('status', 'CONFIRMED');
        if (customerId) {
          bQuery = bQuery.eq('customer_id', customerId);
        }
        const { data: confirmedBookings } = await bQuery;
        if (confirmedBookings && confirmedBookings.length > 0) {
          for (const b of confirmedBookings) {
            await ensureProjectAndTasksForBooking(supabase, b);
          }
          // Re-fetch after healing
          const { data: healedData } = await query;
          if (healedData) {
            projects = healedData.map((p: any) => ({
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
        }
      }
    } catch (e: any) {
      console.warn('GET /api/projects Supabase error:', e.message);
    }
  }

  // Merge with demoStore for zero-downtime / local state
  const localProjects = demoStore.getProjects(customerId || undefined);
  const map = new Map<string, WeddingProject>();
  projects.forEach((p) => map.set(p.id, p));
  localProjects.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return NextResponse.json(
    { ok: true, projects: merged, count: merged.length },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

/**
 * Project Actions (Add Task or Manual Sync Trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { action, projectId, task } = payload;

    // 1. Trigger Action: Explicit project sync (only when invoked by Admin Action)
    if (action === 'SYNC_PROJECTS') {
      if (isSupabaseConfigured()) {
        const supabase = createAdminClient();
        const { data: confirmedBookings } = await supabase
          .from('bookings')
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .eq('status', 'CONFIRMED');

        if (confirmedBookings) {
          for (const b of confirmedBookings) {
            await ensureProjectAndTasksForBooking(supabase, b);
          }
        }
      }
      return NextResponse.json({ ok: true, message: 'Projects synced successfully.' });
    }

    // 2. Action: Reject / Cancel Project
    if (action === 'CANCEL_PROJECT' && projectId) {
      const reason = payload.reason || 'Dibatalkan oleh Admin.';
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          const { data: proj } = await supabase
            .from('wedding_projects')
            .select('booking_id')
            .eq('id', projectId)
            .maybeSingle();

          if (proj && proj.booking_id) {
            await supabase
              .from('bookings')
              .update({
                status: 'CANCELLED',
                notes: reason,
                updated_at: new Date().toISOString(),
              })
              .eq('id', proj.booking_id);

            await cleanupProjectForBooking(supabase, proj.booking_id);
          } else {
            await supabase.from('wedding_tasks').delete().eq('project_id', projectId);
            await supabase.from('wedding_projects').delete().eq('id', projectId);
          }
        } catch (e: any) {
          console.warn('POST /api/projects cancel project error:', e.message);
        }
      }

      const proj = demoStore.getProjectById(projectId);
      if (proj && proj.booking_id) {
        demoStore.cancelBooking(proj.booking_id, reason);
      }
      return NextResponse.json({ ok: true, message: 'Proyek berhasil dibatalkan.' });
    }

    // 3. Action: Restore / Re-activate Cancelled Project
    if (action === 'RESTORE_PROJECT' && payload.bookingId) {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          const { data: b } = await supabase
            .from('bookings')
            .update({
              status: 'CONFIRMED',
              notes: 'Dipulihkan kembali oleh Admin.',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payload.bookingId)
            .select('*, package:wedding_packages(*), customer:profiles(*)')
            .maybeSingle();

          if (b) {
            await ensureProjectAndTasksForBooking(supabase, b);
          }
        } catch (e: any) {
          console.warn('POST /api/projects restore project error:', e.message);
        }
      }

      demoStore.confirmBooking(payload.bookingId);
      return NextResponse.json({ ok: true, message: 'Proyek berhasil dipulihkan.' });
    }

    // 4. Action: Add custom task to project
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

/**
 * Task Status Updates (Optimistic Real-Time Calculation)
 */
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Dibatalkan oleh Admin.';

    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'Project ID wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: proj } = await supabase
          .from('wedding_projects')
          .select('booking_id')
          .eq('id', projectId)
          .maybeSingle();

        if (proj && proj.booking_id) {
          await supabase
            .from('bookings')
            .update({
              status: 'CANCELLED',
              notes: reason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', proj.booking_id);

          await cleanupProjectForBooking(supabase, proj.booking_id);
        } else {
          await supabase.from('wedding_tasks').delete().eq('project_id', projectId);
          await supabase.from('wedding_projects').delete().eq('id', projectId);
        }
      } catch (e: any) {
        console.warn('DELETE /api/projects error:', e.message);
      }
    }

    const proj = demoStore.getProjectById(projectId);
    if (proj && proj.booking_id) {
      demoStore.cancelBooking(proj.booking_id, reason);
    }

    return NextResponse.json({ ok: true, message: 'Proyek berhasil dibatalkan.' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
