'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { WeddingProject, WeddingTask, TaskStatus } from '@/lib/types';
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
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

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
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Modal: Add Task for a Project
  const [targetProjectForTask, setTargetProjectForTask] = useState<WeddingProject | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<WeddingTask['category']>('Venue');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Subscribe to demo store
  useEffect(() => {
    const refreshData = () => {
      const all = demoStore.getProjects();
      setProjects(all);
      if (all.length > 0 && !expandedProjectId) {
        setExpandedProjectId(all[0].id);
      }
    };

    refreshData();
    const unsub = demoStore.subscribe(refreshData);
    return unsub;
  }, [expandedProjectId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleTask = (task: WeddingTask) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    demoStore.updateTaskStatus(task.id, nextStatus);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    demoStore.updateTaskStatus(taskId, newStatus);
  };

  const handleDeleteTask = (taskId: string) => {
    demoStore.deleteTask(taskId);
    showNotification('Tugas berhasil dihapus dari checklist.');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTaskTitle.trim()) {
      setFormError('Judul tugas wajib diisi.');
      return;
    }
    if (!targetProjectForTask) return;

    const existingTasks = demoStore.getTasksByProjectId(targetProjectForTask.id);
    demoStore.createTask({
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

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const titleMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notesMatch = p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return titleMatch || notesMatch;
  });

  const totalTasksAll = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const completedTasksAll = projects.reduce(
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
                Proyek & Checklist Klien Aktif
              </h1>
              <p className="text-xs text-charcoal-500 mt-1">
                Pantau seluruh proyek pernikahan pengantin, milestone kesiapan, dan checklist vendor terintegrasi.
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
              <span>Total Proyek Pernikahan</span>
              <Sparkles className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-2xl font-bold font-serif text-charcoal">{projects.length}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Proyek aktif setelah konfirmasi booking
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Tugas Checklist Terpantau</span>
              <ListTodo className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-2xl font-bold font-serif text-charcoal">{totalTasksAll}</div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-medium">
              Di seluruh proyek pasangan pengantin
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
          <div className="p-4 rounded-2xl border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold flex items-center gap-2 transition animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-softbeige shadow-sm flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama proyek pernikahan atau pasangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-softbeige bg-ivory/50 focus:outline-none focus:border-champagne focus:bg-white transition"
            />
          </div>

          <span className="text-xs text-charcoal-400 font-mono">
            Menampilkan {filteredProjects.length} Proyek
          </span>
        </div>

        {/* Projects Accordion / Cards List */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Belum Ada Proyek Pernikahan Aktif"
            description="Proyek pernikahan otomatis diinisiasi dan muncul di sini begitu Anda mengonfirmasi booking klien di tab Pengajuan Booking."
            actionLabel="Buka Pengajuan Booking"
            actionHref="/admin/approvals?tab=bookings"
          />
        ) : (
          <div className="space-y-6">
            {filteredProjects.map((proj) => {
              const isExpanded = expandedProjectId === proj.id;
              const projectTasks = demoStore.getTasksByProjectId(proj.id);
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

                      {/* Progress Stat */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-3xl font-serif font-bold text-champagne-800 font-mono">
                            {proj.progress_percent}%
                          </div>
                          <div className="text-[11px] text-charcoal-400">
                            {completedCount} dari {projectTasks.length} Tugas
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                          className="p-2.5 rounded-2xl border border-softbeige hover:border-champagne hover:bg-champagne-50 text-charcoal transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fadeIn">
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
                    placeholder="Contoh: Finalisasi rundown acara & gladi resik vendor"
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
      </div>
    </div>
  );
}
