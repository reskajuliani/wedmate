'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { WeddingProject, WeddingTask, TaskStatus, Booking } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  XCircle,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ChecklistDocumentModal } from '@/components/documents/ChecklistDocumentModal';

const CATEGORIES: WeddingTask['category'][] = [
  'Venue',
  'Catering',
  'Attire',
  'Decoration',
  'Documentation',
  'Invitation',
  'Entertainment',
  'Legal',
  'Other',
];

const CATEGORY_COLORS: Record<WeddingTask['category'], string> = {
  Venue: 'bg-blue-50 text-blue-700 border-blue-200',
  Catering: 'bg-amber-50 text-amber-700 border-amber-200',
  Attire: 'bg-purple-50 text-purple-700 border-purple-200',
  Decoration: 'bg-rose-50 text-rose-700 border-rose-200',
  Documentation: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Invitation: 'bg-violet-50 text-violet-700 border-violet-200',
  Entertainment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Legal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Other: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const [activeProjects, setActiveProjects] = useState<WeddingProject[]>(() => {
    return demoStore.getProjects();
  });
  const [cancelledProjects, setCancelledProjects] = useState<WeddingProject[]>([]);
  const [projectFilter, setProjectFilter] = useState<'ACTIVE' | 'CANCELLED' | 'ALL'>('ACTIVE');

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Modal: Add Task for a Project
  const [targetProjectForTask, setTargetProjectForTask] = useState<WeddingProject | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<WeddingTask['category']>('Venue');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Print Checklist Modal State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedPrintProject, setSelectedPrintProject] = useState<WeddingProject | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal: Tolak / Batalkan Proyek
  const [cancelTargetProject, setCancelTargetProject] = useState<WeddingProject | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Subscribe to store with Smart Polling
  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const refreshData = async () => {
      try {
        const [allProjects, allBookings] = await Promise.all([
          supabaseService.getProjects(),
          supabaseService.getBookings(),
        ]);
        if (!isMounted) return;

        // Build mapping of bookings for rich details
        const bookingMap = new Map<string, Booking>();
        allBookings.forEach((b) => bookingMap.set(b.id, b));

        // Enrich active projects with their booking details
        const enrichedActive = allProjects.map((p) => ({
          ...p,
          booking: p.booking || bookingMap.get(p.booking_id),
        }));
        setActiveProjects(enrichedActive);

        // Cancelled bookings become cancelled project items
        const cancelled: WeddingProject[] = allBookings
          .filter((b) => b.status === 'CANCELLED')
          .map((b) => ({
            id: b.id,
            booking_id: b.id,
            customer_id: b.customer_id,
            title: `Pernikahan ${b.customer?.full_name || 'Klien'}`,
            wedding_date: b.wedding_date,
            progress_percent: 0,
            notes: b.notes || 'Dibatalkan oleh Admin',
            created_at: b.created_at,
            updated_at: b.updated_at,
            tasks: [] as WeddingTask[],
            booking: b,
          }));
        setCancelledProjects(cancelled);

        if (enrichedActive.length > 0 && !expandedProjectId) {
          setExpandedProjectId(enrichedActive[0].id);
        }
      } catch (err) {
        console.warn('Refresh projects error:', err);
      }
    };

    const executeSmartPoll = async () => {
      if (!isMounted) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isFetching) return;

      isFetching = true;
      try {
        await refreshData();
      } finally {
        isFetching = false;
        if (isMounted) {
          pollTimer = setTimeout(executeSmartPoll, 3000);
        }
      }
    };

    executeSmartPoll();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && isMounted && !isFetching) {
        if (pollTimer) clearTimeout(pollTimer);
        executeSmartPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const unsub = demoStore.subscribe(executeSmartPoll);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsub();
    };
  }, [expandedProjectId]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleTask = async (task: WeddingTask) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    setActiveProjects((prev) =>
      prev.map((p) => {
        if (p.id === task.project_id) {
          const updatedTasks = (p.tasks || []).map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t));
          const completed = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
          const pct = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
          return { ...p, tasks: updatedTasks, progress_percent: pct };
        }
        return p;
      })
    );
    await supabaseService.updateTaskStatus(task.id, nextStatus);
    showNotification(`Tugas diperbarui ke status ${nextStatus}. Progres klien terupdate!`);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setActiveProjects((prev) =>
      prev.map((p) => {
        const foundTask = (p.tasks || []).find((t) => t.id === taskId);
        if (foundTask) {
          const updatedTasks = (p.tasks || []).map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
          const completed = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
          const pct = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
          return { ...p, tasks: updatedTasks, progress_percent: pct };
        }
        return p;
      })
    );
    await supabaseService.updateTaskStatus(taskId, newStatus);
    showNotification(`Status tugas berhasil diubah ke ${newStatus}. Progres diperbarui.`);
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabaseService.deleteTask(taskId);
    showNotification('Tugas berhasil dihapus dari checklist.');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTaskTitle.trim()) {
      setFormError('Judul tugas wajib diisi.');
      return;
    }
    if (!targetProjectForTask) return;

    const existingTasks = demoStore.getTasksByProjectId(targetProjectForTask.id);
    await supabaseService.createTask({
      project_id: targetProjectForTask.id,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      category: newTaskCategory,
      status: 'TODO',
      due_date: newTaskDueDate || undefined,
      sort_order: existingTasks.length + 1,
    });

    setTargetProjectForTask(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    showNotification('Tugas baru berhasil ditambahkan ke checklist klien.');
  };

  // --- REJECT / CANCEL PROJECT HANDLERS ---
  const handleOpenCancelProject = (proj: WeddingProject) => {
    setCancelTargetProject(proj);
    setCancelReason('Jadwal bentrok atau kuota layanan pada tanggal tersebut telah penuh.');
  };

  const handleConfirmCancelProject = async () => {
    if (!cancelTargetProject) return;
    const target = cancelTargetProject;
    const bookingId = target.booking_id || target.id;
    const reason = cancelReason.trim() || 'Jadwal bentrok atau kuota layanan pada tanggal tersebut telah penuh.';

    setIsSubmittingCancel(true);
    try {
      // Optimistic UI updates
      setActiveProjects((prev) => prev.filter((p) => p.id !== target.id));
      setCancelledProjects((prev) => [
        {
          ...target,
          id: bookingId,
          booking_id: bookingId,
          notes: reason,
          progress_percent: 0,
          tasks: [],
        },
        ...prev.filter((p) => (p.booking_id || p.id) !== bookingId),
      ]);

      // Sync to demoStore, Supabase Projects Registry & Bookings API
      demoStore.cancelBooking(bookingId, reason);
      await Promise.allSettled([
        supabaseService.cancelProject(target.id, reason),
        supabaseService.updateBookingStatus(bookingId, 'CANCELLED', reason),
      ]);

      showNotification(`Proyek "${target.title}" berhasil DITOLAK / DIBATALKAN. Alasan penolakan telah diteruskan ke portal klien.`);
    } catch (err: any) {
      showNotification(err?.message || 'Gagal membatalkan proyek.', 'error');
    } finally {
      setIsSubmittingCancel(false);
      setCancelTargetProject(null);
    }
  };

  const handleReactivateProject = async (proj: WeddingProject) => {
    const bookingId = proj.booking_id || proj.id;
    try {
      demoStore.confirmBooking(bookingId, user?.id);
      await Promise.allSettled([
        supabaseService.restoreProject(bookingId),
        supabaseService.updateBookingStatus(bookingId, 'CONFIRMED'),
      ]);
      showNotification(`Proyek "${proj.title}" berhasil DIAKTIFKAN KEMBALI. Checklist tugas dan invoice telah dipulihkan.`);
      // Switch tab to active view
      setProjectFilter('ACTIVE');
    } catch (err: any) {
      showNotification(err?.message || 'Gagal mengaktifkan kembali proyek.', 'error');
    }
  };

  // --- FILTERING ---
  const visibleProjects = (
    projectFilter === 'ACTIVE'
      ? activeProjects
      : projectFilter === 'CANCELLED'
      ? cancelledProjects
      : [...activeProjects, ...cancelledProjects]
  ).filter((p) => {
    const titleMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notesMatch = p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const venueMatch = p.booking?.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return titleMatch || notesMatch || venueMatch;
  });

  const totalTasksAll = activeProjects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const completedTasksAll = activeProjects.reduce(
    (sum, p) => sum + (p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-ivory py-10 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/admin/approvals"
              className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-champagne font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pusat Persetujuan</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-softbeige shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-semibold text-champagne tracking-widest">
                  Pengawasan Operasional
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Wedding Director Panel
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-charcoal">
                Proyek &amp; Checklist Klien
              </h1>
              <p className="text-xs text-charcoal-500 mt-1">
                Pantau seluruh proyek pernikahan pengantin, kelola checklist persiapan, dan pantau status penolakan atau pembatalan proyek.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/approvals?tab=bookings"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-champagne hover:bg-champagne-600 text-white font-semibold text-xs shadow-wedding transition"
              >
                <span>Kelola Booking Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Total Proyek Berjalan</span>
              <Sparkles className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-2xl font-bold font-serif text-charcoal">{activeProjects.length}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center justify-between">
              <span>Proyek aktif dikonfirmasi</span>
              {cancelledProjects.length > 0 && (
                <span className="text-red-600 font-semibold">({cancelledProjects.length} ditolak)</span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Tugas Checklist Terpantau</span>
              <ListTodo className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-2xl font-bold font-serif text-charcoal">{totalTasksAll}</div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-medium">
              Di seluruh proyek pasangan pengantin aktif
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Tugas Telah Selesai</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-emerald-800">
              {completedTasksAll} / {totalTasksAll}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              {totalTasksAll > 0 ? Math.round((completedTasksAll / totalTasksAll) * 100) : 0}% eksekusi selesai
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition animate-fadeIn ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filter Pills & Search */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-softbeige shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { key: 'ACTIVE', label: `Proyek Berjalan (${activeProjects.length})` },
                  { key: 'CANCELLED', label: `Ditolak / Dibatalkan (${cancelledProjects.length})` },
                  { key: 'ALL', label: `Semua Proyek (${activeProjects.length + cancelledProjects.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setProjectFilter(tab.key)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    projectFilter === tab.key
                      ? tab.key === 'CANCELLED'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-charcoal-600 hover:text-charcoal border border-softbeige'
                  }`}
                >
                  {tab.key === 'CANCELLED' && <XCircle className="w-3.5 h-3.5" />}
                  {tab.key === 'ACTIVE' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari proyek atau venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-softbeige bg-ivory/50 focus:outline-none focus:border-champagne focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Projects Accordion / Cards List */}
        {visibleProjects.length === 0 ? (
          projectFilter === 'CANCELLED' ? (
            <div className="bg-white rounded-3xl p-10 border border-softbeige text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-charcoal">Tidak Ada Proyek yang Ditolak</h4>
              <p className="text-xs text-charcoal-500">
                Saat ini tidak ada proyek pernikahan yang ditolak atau dibatalkan. Semua reservasi berjalan normal.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={ListTodo}
              title="Belum ada data tersedia"
              description="Proyek pernikahan otomatis diinisiasi dan muncul di sini begitu Anda mengonfirmasi booking klien di tab Pengajuan Booking."
              actionLabel="Buka Pengajuan Booking"
              actionHref="/admin/approvals?tab=bookings"
            />
          )
        ) : (
          <div className="space-y-6">
            {visibleProjects.map((proj) => {
              const isCancelled = cancelledProjects.some(
                (cp) => cp.id === proj.id || (proj.booking_id && cp.booking_id === proj.booking_id)
              );

              // -----------------------------------------------------------
              // 1. RENDER: CANCELLED / REJECTED PROJECT CARD
              // -----------------------------------------------------------
              if (isCancelled) {
                return (
                  <div
                    key={proj.id}
                    className="bg-white rounded-3xl border border-red-200/90 shadow-xs overflow-hidden transition-all duration-300 relative"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-400" />

                    <div className="p-6 sm:p-8 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase flex items-center gap-1 border border-red-200">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>DITOLAK / DIBATALKAN</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              ID: {proj.booking_id ? proj.booking_id.substring(0, 8) : proj.id.substring(0, 8)}
                            </span>
                            <span className="text-xs text-charcoal-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-champagne" />
                              <span>{formatDateIndo(proj.wedding_date)}</span>
                            </span>
                          </div>

                          <h3 className="font-serif text-2xl font-bold text-charcoal">
                            {proj.title}
                          </h3>

                          {proj.booking && (
                            <div className="text-xs text-charcoal-500 flex items-center gap-2 flex-wrap pt-0.5">
                              {proj.booking.package && (
                                <span className="font-semibold text-charcoal-700 bg-softbeige/60 px-2.5 py-0.5 rounded-lg">
                                  Paket: {proj.booking.package.name}
                                </span>
                              )}
                              {proj.booking.venue_name && (
                                <span className="text-charcoal-500">
                                  Lokasi: {proj.booking.venue_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReactivateProject(proj)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-emerald-200"
                            title="Aktifkan kembali proyek ini dan pulihkan tugas checklist serta tagihan"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aktifkan Kembali</span>
                          </button>

                          <Link
                            href="/admin/approvals?tab=bookings"
                            className="px-3.5 py-2.5 rounded-xl border border-softbeige hover:bg-ivory text-charcoal-600 font-semibold text-xs transition flex items-center gap-1"
                            title="Lihat rincian pemesanan di Pusat Persetujuan"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pusat Persetujuan</span>
                          </Link>
                        </div>
                      </div>

                      {/* Rejection Banner */}
                      <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-red-950 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Status: Proyek Ditolak / Dibatalkan oleh Admin</span>
                          </div>
                          <span className="text-[10px] font-mono text-red-600 font-semibold">
                            Checklist &amp; Tagihan Dinonaktifkan
                          </span>
                        </div>

                        <div className="bg-white/80 p-3 rounded-xl border border-red-200 text-xs text-red-950 space-y-0.5">
                          <span className="font-bold block text-[10px] uppercase text-red-700 tracking-wider">
                            Alasan Penolakan / Catatan Admin:
                          </span>
                          <p className="italic text-red-900">
                            &ldquo;{proj.notes || 'Jadwal bentrok atau kuota layanan pada tanggal tersebut telah penuh.'}&rdquo;
                          </p>
                        </div>

                        <div className="text-[11px] text-red-700/80 flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>
                            Alasan di atas telah diteruskan secara otomatis ke Portal Pengantin klien. Klien dapat mengajukan jadwal atau paket lain dari akun mereka.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // -----------------------------------------------------------
              // 2. RENDER: ACTIVE WEDDING PROJECT CARD
              // -----------------------------------------------------------
              const isExpanded = expandedProjectId === proj.id;
              const projectTasks = proj.tasks || demoStore.getTasksByProjectId(proj.id);
              const completedCount = projectTasks.filter((t) => t.status === 'COMPLETED').length;

              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-3xl border border-softbeige shadow-sm overflow-hidden transition-all duration-300"
                >
                  {/* Project Header Bar */}
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-champagne-100 text-champagne-800 uppercase">
                            ID: {proj.id.substring(0, 8)}
                          </span>
                          <span className="text-xs text-charcoal-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-champagne" />
                            <span>{formatDateIndo(proj.wedding_date)}</span>
                          </span>
                        </div>

                        <h3 className="font-serif text-2xl font-bold text-charcoal">
                          {proj.title}
                        </h3>

                        {proj.notes && (
                          <p className="text-xs text-charcoal-500 mt-1 max-w-2xl leading-relaxed">
                            {proj.notes}
                          </p>
                        )}
                      </div>

                      {/* Header Actions & Progress Stat */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Cetak Lembar Kerja Proyek */}
                        <button
                          onClick={() => {
                            setSelectedPrintProject(proj);
                            setIsChecklistModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-softbeige hover:bg-ivory text-charcoal-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Cetak Lembar Kerja Checklist Proyek Ini"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C8A46A]" />
                          <span className="hidden sm:inline">Cetak Checklist</span>
                        </button>

                        {/* Tolak / Batalkan Proyek Button */}
                        <button
                          onClick={() => handleOpenCancelProject(proj)}
                          className="px-3 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Tolak atau Batalkan Proyek Ini"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tolak / Batalkan</span>
                        </button>

                        <div className="text-right">
                          <div className="text-2xl sm:text-3xl font-serif font-bold text-champagne-800 font-mono">
                            {proj.progress_percent}%
                          </div>
                          <div className="text-[11px] text-charcoal-400">
                            {completedCount} dari {projectTasks.length} Tugas
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                          className="p-2.5 rounded-2xl border border-softbeige hover:border-champagne hover:bg-champagne-50 text-charcoal transition"
                          title={isExpanded ? 'Tutup Rincian Checklist' : 'Buka Rincian Checklist'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-champagne" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-charcoal-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-softbeige rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-champagne-600 via-champagne to-champagne-500 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Checklist Section */}
                  {isExpanded && (
                    <div className="border-t border-softbeige bg-ivory/40 p-6 sm:p-8 space-y-5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ListTodo className="w-4 h-4 text-champagne" />
                          <h4 className="font-serif text-base font-bold text-charcoal">
                            Daftar Checklist Tugas Proyek ({projectTasks.length})
                          </h4>
                        </div>

                        <button
                          onClick={() => {
                            setTargetProjectForTask(proj);
                            setNewTaskTitle('');
                            setNewTaskDescription('');
                            setNewTaskDueDate('');
                            setFormError('');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-champagne hover:bg-champagne-600 text-white font-semibold text-xs shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Tugas ke Proyek Ini</span>
                        </button>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2.5">
                        {projectTasks.length === 0 ? (
                          <div className="p-8 text-center bg-white rounded-2xl border border-softbeige text-xs text-charcoal-400">
                            Belum ada tugas untuk proyek ini.
                          </div>
                        ) : (
                          projectTasks.map((task) => {
                            const isDone = task.status === 'COMPLETED';
                            const isInProgress = task.status === 'IN_PROGRESS';

                            return (
                              <div
                                key={task.id}
                                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                  isDone
                                    ? 'bg-emerald-50/40 border-emerald-200'
                                    : isInProgress
                                    ? 'bg-amber-50/40 border-amber-200'
                                    : 'bg-white border-softbeige'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <button
                                    onClick={() => handleToggleTask(task)}
                                    title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                      isDone
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : isInProgress
                                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                                        : 'border-charcoal-300 hover:border-champagne text-transparent hover:text-champagne-300'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>

                                  <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                                          CATEGORY_COLORS[task.category] || 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {task.category}
                                      </span>
                                      <span
                                        className={`text-xs font-bold ${
                                          isDone ? 'text-charcoal-400 line-through' : 'text-charcoal'
                                        }`}
                                      >
                                        {task.title}
                                      </span>
                                    </div>
                                    {task.description && (
                                      <p className="text-[11px] text-charcoal-500">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-softbeige">
                                  {task.due_date && (
                                    <span className="text-[11px] text-charcoal-400 font-mono">
                                      Due: {formatDateIndo(task.due_date)}
                                    </span>
                                  )}

                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      handleStatusChange(task.id, e.target.value as TaskStatus)
                                    }
                                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border font-mono ${
                                      isDone
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : isInProgress
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-ivory text-charcoal-600 border-softbeige'
                                    }`}
                                  >
                                    <option value="TODO">TODO</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                  </select>

                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Hapus tugas"
                                    className="p-1 text-charcoal-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: TAMBAH TUGAS (ADMIN) */}
        {targetProjectForTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-softbeige shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-softbeige">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-champagne-100 text-champagne-700 flex items-center justify-center">
                    <ListTodo className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-charcoal">
                      Tambah Tugas Checklist Klien
                    </h3>
                    <p className="text-xs text-charcoal-400">
                      Untuk proyek: <strong>{targetProjectForTask.title}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTargetProjectForTask(null)}
                  className="p-2 text-charcoal-400 hover:text-charcoal hover:bg-ivory rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">
                    Judul Tugas *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Contoh: Finalisasi rundown acara & gladi resik bersama tim WO"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Kategori *
                    </label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) =>
                        setNewTaskCategory(e.target.value as WeddingTask['category'])
                      }
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne bg-white font-medium"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Target Tenggat Waktu (Due Date)
                    </label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">
                    Keterangan / Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Contoh: Dikoordinasikan oleh WO Field Manager..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-softbeige">
                  <button
                    type="button"
                    onClick={() => setTargetProjectForTask(null)}
                    className="px-5 py-2.5 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-ivory transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-champagne hover:bg-champagne-600 text-white text-xs font-semibold shadow-wedding hover:shadow-wedding-lg transition"
                  >
                    Tambah ke Checklist
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: TOLAK / BATALKAN PROYEK (ADMIN) */}
        {cancelTargetProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-softbeige shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-softbeige">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-charcoal">
                      Tolak / Batalkan Proyek
                    </h3>
                    <p className="text-xs text-charcoal-400">
                      ID: {cancelTargetProject.booking_id ? cancelTargetProject.booking_id.substring(0, 8) : cancelTargetProject.id.substring(0, 8)} • {cancelTargetProject.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelTargetProject(null)}
                  className="p-2 text-charcoal-400 hover:text-charcoal hover:bg-ivory rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  Konfirmasi Pembatalan Proyek
                </p>
                <p className="text-red-700 leading-relaxed text-[11px]">
                  Tindakan ini akan membatalkan status booking klien, menonaktifkan seluruh tugas checklist proyek, dan membatalkan invoice tagihan. Alasan penolakan di bawah akan otomatis ditampilkan ke pengantin di portal mereka.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-charcoal">
                    Alasan Penolakan / Pembatalan *
                  </label>
                  <span className="text-[10px] text-gray-400">Pilih opsi cepat atau ketik sendiri</span>
                </div>

                {/* Preset Chips for Fast Selection */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Jadwal bentrok dengan agenda WO lain',
                    'Klien mengajukan pembatalan jadwal',
                    'Venue tidak tersedia pada tanggal tersebut',
                    'Kuota tim operasional pada tanggal ini penuh',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCancelReason(preset)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer text-left ${
                        cancelReason === preset
                          ? 'bg-red-100 border-red-300 text-red-900 font-semibold'
                          : 'bg-[#FAF8F5] border-[#E8E2D8] text-gray-600 hover:border-red-200 hover:text-red-800'
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Jadwal bentrok dengan acara lain, atau kuota tim operasional pada tanggal tersebut telah penuh..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                />
                <p className="text-[10px] text-charcoal-400">
                  Wajib cantumkan alasan yang jelas agar pengantin memahami alasan pembatalan dan dapat mengajukan jadwal lain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-softbeige">
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={() => setCancelTargetProject(null)}
                  className="px-5 py-2.5 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-ivory transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={handleConfirmCancelProject}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isSubmittingCancel ? 'Memproses...' : 'Konfirmasi Tolak Proyek'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Checklist Worksheet Modal for Admin */}
        <ChecklistDocumentModal
          isOpen={isChecklistModalOpen}
          onClose={() => {
            setIsChecklistModalOpen(false);
            setSelectedPrintProject(null);
          }}
          project={selectedPrintProject}
          tasks={selectedPrintProject?.tasks || (selectedPrintProject ? demoStore.getTasksByProjectId(selectedPrintProject.id) : [])}
          confirmedBooking={selectedPrintProject?.booking as any || null}
          clientName={selectedPrintProject?.booking?.customer?.full_name || selectedPrintProject?.title || 'Klien Pengantin'}
        />
      </div>
    </div>
  );
}
