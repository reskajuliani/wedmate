'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { WeddingProject, WeddingTask, Booking, TaskStatus } from '@/lib/types';
import { formatDateIndo, formatRupiah } from '@/lib/utils';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Circle,
  Calendar,
  Sparkles,
  MapPin,
  Lock,
  Search,
  Users,
  ShieldCheck,
  Package,
  ArrowRight,
  PartyPopper,
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

const CATEGORY_COLORS: Record<string, string> = {
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

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateCountdown(targetDateStr: string): TimeRemaining {
  if (!targetDateStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  }
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

export default function CustomerChecklistPage() {
  const { user } = useAuth();
  const customerId = user?.id || '';

  const [project, setProject] = useState<WeddingProject | null>(null);
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Countdown timer state
  const [countdown, setCountdown] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    let isMounted = true;
    const refreshData = async () => {
      if (!customerId) return;
      const [userProjects, userBookings] = await Promise.all([
        supabaseService.getProjects(customerId),
        supabaseService.getBookings(customerId),
      ]);
      if (!isMounted) return;

      const confirmed = userBookings.find((b) => b.status === 'CONFIRMED');
      const pending = userBookings.find((b) => b.status === 'PENDING');

      setConfirmedBooking(confirmed || null);
      setPendingBooking(pending || null);

      if (userProjects.length > 0) {
        const currentProject = userProjects[0];
        setProject(currentProject);
        setTasks(currentProject.tasks || demoStore.getTasksByProjectId(currentProject.id));
      } else {
        setProject(null);
        setTasks([]);
      }
    };

    refreshData();
    const unsub = demoStore.subscribe(refreshData);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [customerId]);

  // Real-time Countdown effect
  useEffect(() => {
    if (!project?.wedding_date && !confirmedBooking?.wedding_date) return;
    const dateStr = project?.wedding_date || confirmedBooking?.wedding_date || '';

    setCountdown(calculateCountdown(dateStr));
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(dateStr));
    }, 1000);

    return () => clearInterval(timer);
  }, [project?.wedding_date, confirmedBooking?.wedding_date]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchCategory = selectedCategory === 'ALL' || task.category === selectedCategory;
    const matchStatus = selectedStatus === 'ALL' || task.status === selectedStatus;
    const matchSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest block mb-1">
              Portal Pengantin WEDMATE
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
              Status Booking &amp; Checklist Persiapan
            </h1>
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              Pantau jadwal hitung mundur hari pernikahan dan progres checklist tugas yang disiapkan oleh tim Wedding Organizer kami.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#1A1A1A] border border-[#E8E2D8]">
              <Lock className="w-3.5 h-3.5 text-[#C8A46A]" />
              <span>Pantauan Klien (Read-Only)</span>
            </span>
          </div>
        </div>

        {/* CASE 1: NO PROJECT YET */}
        {!project ? (
          <div>
            {pendingBooking ? (
              <div className="bg-white rounded-3xl p-8 border border-[#E8E2D8] shadow-xs text-center max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                  Booking Anda Sedang Ditinjau Admin
                </h3>
                <p className="text-xs sm:text-sm text-[#1A1A1A]/70 leading-relaxed max-w-lg mx-auto">
                  Pengajuan booking paket{' '}
                  <strong className="text-[#1A1A1A] font-semibold">{pendingBooking.package?.name}</strong>{' '}
                  untuk tanggal{' '}
                  <strong className="text-[#1A1A1A] font-semibold">{formatDateIndo(pendingBooking.wedding_date)}</strong>{' '}
                  sedang dalam proses review.{' '}
                  Checklist tugas persiapan pernikahan dan wedding countdown akan otomatis aktif segera setelah Admin menyetujui reservasi Anda.
                </p>
                <div className="pt-2">
                  <Link
                    href="/customer/booking"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C8A46A] hover:bg-[#b59157] text-white text-xs font-semibold shadow-xs transition"
                  >
                    <span>Cek Rincian Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ListTodo}
                title="Belum ada data tersedia"
                description="Checklist persiapan pernikahan dan wedding countdown akan otomatis diaktifkan setelah Anda membuat pengajuan booking dan dikonfirmasi oleh tim Wedding Organizer."
                actionLabel="Ajukan Booking Sekarang"
                actionHref="/customer/booking"
              />
            )}
          </div>
        ) : (
          /* CASE 2: PROJECT ACTIVE WITH COUNTDOWN & CHECKLIST */
          <div className="space-y-8">
            {/* BOOKING STATUS & COUNTDOWN HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Col 1: Booking Status Summary */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      Status Reservasi
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      TERKONFIRMASI
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                      {project.title}
                    </h3>
                    <div className="text-xs text-[#C8A46A] font-semibold flex items-center gap-1.5 pt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateIndo(project.wedding_date)}</span>
                    </div>
                  </div>

                  {confirmedBooking && (
                    <div className="mt-4 pt-3 border-t border-[#E8E2D8] space-y-2 text-xs text-gray-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C8A46A] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#1A1A1A] block">{confirmedBooking.venue_name}</strong>
                          <span className="text-gray-500 line-clamp-1">{confirmedBooking.venue_address}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#C8A46A]" />
                        <span>Kapasitas: {confirmedBooking.guest_count} Tamu Undangan</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                  <span className="text-gray-500">Nilai Kontrak:</span>
                  <span className="font-serif font-bold text-[#C8A46A] text-sm">
                    {confirmedBooking ? formatRupiah(confirmedBooking.total_price) : '-'}
                  </span>
                </div>
              </div>

              {/* Col 2: Wedding Countdown */}
              <div className="lg:col-span-2 bg-[#1A1A1A] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Wedding Countdown
                    </span>
                    <span className="text-xs text-white/60">
                      Hari H: {formatDateIndo(project.wedding_date)}
                    </span>
                  </div>

                  {countdown.isPast ? (
                    <div className="py-8 text-center space-y-2">
                      <PartyPopper className="w-10 h-10 text-[#C8A46A] mx-auto" />
                      <h4 className="font-serif text-2xl font-bold text-white">
                        Hari Bahagia Telah Tiba!
                      </h4>
                      <p className="text-xs text-white/70">
                        Selamat atas pernikahan indah Anda. Momen berharga selamanya terukir.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 my-2">
                      <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 text-center border border-white/10">
                        <span className="font-serif text-2xl sm:text-4xl font-bold text-[#C8A46A] block">
                          {countdown.days}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70 tracking-wider">
                          Hari
                        </span>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 text-center border border-white/10">
                        <span className="font-serif text-2xl sm:text-4xl font-bold text-white block">
                          {countdown.hours.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70 tracking-wider">
                          Jam
                        </span>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 text-center border border-white/10">
                        <span className="font-serif text-2xl sm:text-4xl font-bold text-white block">
                          {countdown.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70 tracking-wider">
                          Menit
                        </span>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 text-center border border-white/10">
                        <span className="font-serif text-2xl sm:text-4xl font-bold text-[#C8A46A] block">
                          {countdown.seconds.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70 tracking-wider">
                          Detik
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">Kesiapan Checklist WO:</span>
                    <span className="font-bold text-[#C8A46A]">{progressPercent}% Selesai</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C8A46A] transition-all duration-700 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/50 pt-0.5">
                    <span>{completedCount} Selesai</span>
                    <span>{inProgressCount} Sedang Berjalan</span>
                    <span>{todoCount} Belum Mulai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WO CHECKLIST SECTION (READ-ONLY) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                    Checklist Tugas Wedding Organizer
                  </h2>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                    Daftar persiapan detail yang dijalankan secara profesional oleh tim WEDMATE untuk acara Anda.
                  </p>
                </div>

                {/* Notice pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] text-xs text-[#1A1A1A]/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dikelola Langsung Tim Wedding Director</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] space-y-3">
                {/* Status Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(
                    [
                      { key: 'ALL', label: `Semua Tugas (${tasks.length})` },
                      { key: 'COMPLETED', label: `Selesai (${completedCount})` },
                      { key: 'IN_PROGRESS', label: `Sedang Proses (${inProgressCount})` },
                      { key: 'TODO', label: `Belum Mulai (${todoCount})` },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSelectedStatus(s.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedStatus === s.key
                          ? 'bg-[#1A1A1A] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#E8E2D8]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#E8E2D8]">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === 'ALL'
                          ? 'bg-[#C8A46A] text-white'
                          : 'bg-[#FAF8F5] text-gray-600 hover:text-[#1A1A1A]'
                      }`}
                    >
                      Semua Kategori
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#C8A46A] text-white'
                            : 'bg-[#FAF8F5] text-gray-600 hover:text-[#1A1A1A]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Box */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari tugas persiapan..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                    />
                  </div>
                </div>
              </div>

              {/* Tasks List or EmptyState */}
              {filteredTasks.length === 0 ? (
                <EmptyState
                  icon={ListTodo}
                  title="Belum ada data tersedia"
                  description={
                    searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                      ? 'Tidak ada checklist yang cocok dengan filter yang dipilih.'
                      : 'Tim WO sedang menyiapkan rincian checklist persiapan untuk acara Anda.'
                  }
                  actionLabel={
                    searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                      ? 'Reset Filter'
                      : undefined
                  }
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                  }}
                />
              ) : (
                <div className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-xs divide-y divide-[#E8E2D8]">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5]/60 transition"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Status Icon */}
                        <div className="mt-0.5 shrink-0">
                          {task.status === 'COMPLETED' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : task.status === 'IN_PROGRESS' ? (
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                              <Circle className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#1A1A1A]">
                              {task.title}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Other
                              }`}
                            >
                              {task.category}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Due Date & Status Badge (Read-only) */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-9 sm:pl-0">
                        {task.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            SELESAI
                          </span>
                        ) : task.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            SEDANG PROSES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                            BELUM MULAI
                          </span>
                        )}

                        {task.due_date ? (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#C8A46A]" />
                            <span>Tenggat: {formatDateIndo(task.due_date)}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Timeline WO</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
