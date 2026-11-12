'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { UserProfile, AccountStatus, Booking, BookingStatus } from '@/lib/types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Users,
  Calendar,
  CalendarDays,
  Phone,
  Mail,
  AlertTriangle,
  RotateCcw,
  Package,
  MapPin,
  Eye,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ListTodo,
  CreditCard,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { EventScheduleCalendar } from '@/components/admin/EventScheduleCalendar';

function AdminApprovalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { user } = useAuth();
  const adminId = user?.id || 'a0000000-0000-0000-0000-000000000001';

  // Active Main Tab: 'accounts' | 'bookings' | 'calendar'
  const [activeMainTab, setActiveMainTab] = useState<'accounts' | 'bookings' | 'calendar'>(
    tabParam === 'bookings' ? 'bookings' : tabParam === 'calendar' ? 'calendar' : 'accounts'
  );

  useEffect(() => {
    if (tabParam === 'bookings') {
      setActiveMainTab('bookings');
    } else if (tabParam === 'calendar') {
      setActiveMainTab('calendar');
    } else if (tabParam === 'accounts') {
      setActiveMainTab('accounts');
    }
  }, [tabParam]);

  // --- ACCOUNTS STATE ---
  // Pre-seed synchronously from local store for 0ms instant loading
  const [users, setUsers] = useState<UserProfile[]>(() => {
    return demoStore.getUsers().filter((u) => u.role === 'CUSTOMER');
  });
  const [accountStatusFilter, setAccountStatusFilter] = useState<'ALL' | AccountStatus>('ALL');
  const [accountSearch, setAccountSearch] = useState('');
  const [rejectModalUser, setRejectModalUser] = useState<UserProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // --- BOOKINGS STATE ---
  // Pre-seed synchronously from local store for 0ms instant loading
  const [bookings, setBookings] = useState<Booking[]>(() => {
    return demoStore.getBookings();
  });
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancelBookingReason, setCancelBookingReason] = useState('');

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subscribe to updates via Smart Polling (sequential + halts on background tab)
  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const refreshData = async () => {
      try {
        const allCustomers = await supabaseService.getProfiles('CUSTOMER');
        if (isMounted) setUsers(allCustomers);
      } catch (e) {
        console.warn('Error loading customers:', e);
      }
      try {
        const allBookings = await supabaseService.getBookings();
        if (isMounted) setBookings(allBookings);
      } catch (e) {
        console.warn('Error loading bookings:', e);
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
          pollTimer = setTimeout(executeSmartPoll, 4000);
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
  }, []);

  // Pending counts
  const pendingAccountsCount = users.filter((u) => u.status === 'PENDING').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING').length;

  // --- ACCOUNT ACTIONS ---
  const handleApproveAccount = async (targetUser: UserProfile) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, status: 'APPROVED', approval_status: 'APPROVED' } : u))
    );
    await supabaseService.updateProfileStatus(targetUser.id, 'APPROVED');
    try {
      await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, email: targetUser.email, status: 'APPROVED' }),
      });
    } catch {
      // ignore
    }
    showToast(`Akun ${targetUser.full_name} berhasil DISETUJUI! Customer kini dapat login ke portal.`);
  };

  const handleOpenRejectAccount = (targetUser: UserProfile) => {
    setRejectModalUser(targetUser);
    setRejectReason('Data kontak atau tanggal pernikahan belum valid.');
  };

  const handleConfirmRejectAccount = async () => {
    if (!rejectModalUser) return;
    const reason = rejectReason.trim();
    setUsers((prev) =>
      prev.map((u) => (u.id === rejectModalUser.id ? { ...u, status: 'REJECTED', approval_status: 'REJECTED', notes: reason } : u))
    );
    await supabaseService.updateProfileStatus(rejectModalUser.id, 'REJECTED', reason);
    try {
      await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: rejectModalUser.id, email: rejectModalUser.email, status: 'REJECTED', notes: reason }),
      });
    } catch {
      // ignore
    }
    showToast(`Pendaftaran akun ${rejectModalUser.full_name} DITOLAK.`);
    setRejectModalUser(null);
  };

  // --- BOOKING ACTIONS ---
  const handleConfirmBooking = async (target: Booking | string) => {
    const booking = typeof target === 'string' ? bookings.find((b) => b.id === target) : target;
    if (!booking) return;
    try {
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b))
      );
      demoStore.confirmBooking(booking.id, adminId);
      await supabaseService.updateBookingStatus(booking.id, 'CONFIRMED');
      showToast(
        `Booking ${booking.id} berhasil DIKONFIRMASI! Proyek checklist dan invoice tagihan otomatis diterbitkan ke portal klien.`
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mengonfirmasi booking.', 'error');
    }
  };

  const handleOpenCancelBooking = (booking: Booking) => {
    setCancelBookingTarget(booking);
    setCancelBookingReason('Jadwal bentrok atau kuota layanan pada tanggal tersebut penuh.');
  };

  const openRejectBookingModal = (booking: Booking) => {
    if (booking) {
      handleOpenCancelBooking(booking);
    }
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelBookingTarget) return;
    const targetId = cancelBookingTarget.id;
    const reason = cancelBookingReason.trim() || 'Jadwal bentrok atau kuota layanan pada tanggal tersebut penuh.';
    setBookings((prev) =>
      prev.map((b) => (b.id === targetId ? { ...b, status: 'CANCELLED', notes: reason } : b))
    );
    try {
      demoStore.cancelBooking(targetId, reason);
      await supabaseService.updateBookingStatus(targetId, 'CANCELLED', reason);
      showToast(`Pengajuan booking #${targetId.substring(0, 8)} berhasil DITOLAK / DIBATALKAN. Alasan penolakan telah diteruskan ke portal klien.`);
    } catch (err: any) {
      showToast(err?.message || 'Gagal membatalkan booking.', 'error');
    } finally {
      setCancelBookingTarget(null);
    }
  };

  // --- FILTERED DATA ---
  const filteredUsers = users.filter((u) => {
    const matchStatus = accountStatusFilter === 'ALL' || u.status === accountStatusFilter;
    const q = accountSearch.toLowerCase();
    const matchSearch =
      !accountSearch ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q);
    return matchStatus && matchSearch;
  });

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
    const q = bookingSearch.toLowerCase();
    const customerName = b.customer?.full_name?.toLowerCase() || '';
    const packageName = b.package?.name?.toLowerCase() || '';
    const venueName = b.venue_name?.toLowerCase() || '';
    const matchSearch =
      !bookingSearch ||
      b.id.toLowerCase().includes(q) ||
      customerName.includes(q) ||
      packageName.includes(q) ||
      venueName.includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Work Screen Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest">
                Pusat Persetujuan Operasional
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Work Screen Tunggal
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
              Persetujuan Akun &amp; Pengajuan Booking
            </h1>
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              Kelola verifikasi registrasi akun pengantin baru dan konfirmasi reservasi booking paket pernikahan dalam satu layar kerja terpadu.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] px-4 py-3 rounded-2xl text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-semibold text-[#1A1A1A]/60 block">
                Pending Akun
              </span>
              <span className="text-xl font-bold font-serif text-amber-600">
                {pendingAccountsCount}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] px-4 py-3 rounded-2xl text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-semibold text-[#1A1A1A]/60 block">
                Pending Booking
              </span>
              <span className="text-xl font-bold font-serif text-[#C8A46A]">
                {pendingBookingsCount}
              </span>
            </div>
            <button
              onClick={async () => {
                const allCustomers = await supabaseService.getProfiles('CUSTOMER');
                setUsers(allCustomers);
                const allBookings = await supabaseService.getBookings();
                setBookings(allBookings);
                showToast('Data akun dan booking berhasil disegarkan.');
              }}
              title="Segarkan data terbaru"
              className="p-3 bg-[#FAF8F5] hover:bg-[#E8E2D8] border border-[#E8E2D8] rounded-2xl text-[#1A1A1A] transition cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-[#C8A46A]" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-fadeIn shadow-xs ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* WORK SCREEN TABS */}
        <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-2">
          <button
            onClick={() => {
              setActiveMainTab('accounts');
              router.replace('/admin/approvals?tab=accounts');
            }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
              activeMainTab === 'accounts'
                ? 'bg-[#C8A46A] text-white shadow-xs'
                : 'bg-white text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#FAF8F5] border border-[#E8E2D8]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Verifikasi Akun Klien</span>
            {pendingAccountsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingAccountsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMainTab('bookings');
              router.replace('/admin/approvals?tab=bookings');
            }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
              activeMainTab === 'bookings'
                ? 'bg-[#C8A46A] text-white shadow-xs'
                : 'bg-white text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#FAF8F5] border border-[#E8E2D8]'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Konfirmasi Booking Acara</span>
            {pendingBookingsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A46A] text-white">
                {pendingBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMainTab('calendar');
              router.replace('/admin/approvals?tab=calendar');
            }}
            className={`hidden sm:flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
              activeMainTab === 'calendar'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#FAF8F5] border border-[#E8E2D8]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#C8A46A]" />
            <span>Kalender Jadwal</span>
          </button>
        </div>

        {/* TAB 1: VERIFIKASI AKUN KLEN */}
        {activeMainTab === 'accounts' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {(
                  [
                    { key: 'ALL', label: `Semua (${users.length})` },
                    { key: 'PENDING', label: `Menunggu Review (${pendingAccountsCount})` },
                    { key: 'APPROVED', label: `Disetujui (${users.filter((u) => u.status === 'APPROVED').length})` },
                    { key: 'REJECTED', label: `Ditolak (${users.filter((u) => u.status === 'REJECTED').length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setAccountStatusFilter(tab.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      accountStatusFilter === tab.key
                        ? 'bg-[#1A1A1A] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#E8E2D8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Cari nama, email, no HP..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                />
              </div>
            </div>

            {/* Accounts Table or EmptyState */}
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Belum ada data tersedia"
                description={
                  accountSearch || accountStatusFilter !== 'ALL'
                    ? 'Tidak ada akun calon pengantin yang cocok dengan kriteria filter saat ini.'
                    : 'Belum ada pendaftaran akun calon pengantin baru di dalam sistem.'
                }
                actionLabel={accountSearch || accountStatusFilter !== 'ALL' ? 'Reset Filter' : undefined}
                onAction={() => {
                  setAccountSearch('');
                  setAccountStatusFilter('ALL');
                }}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[#1A1A1A]/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-4 px-6">Calon Pengantin</th>
                        <th className="py-4 px-6">Kontak</th>
                        <th className="py-4 px-6">Tgl Registrasi</th>
                        <th className="py-4 px-6">Status Akun</th>
                        <th className="py-4 px-6 text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D8]">
                      {filteredUsers.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-[#1A1A1A] text-sm">{item.full_name}</div>
                            {item.notes && (
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                Catatan: {item.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-[#C8A46A]" />
                              <span>{item.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                              <Phone className="w-3.5 h-3.5 text-[#C8A46A]" />
                              <span>{item.phone || '-'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-500">
                            {formatDateTimeIndo(item.created_at)}
                          </td>
                          <td className="py-4 px-6">
                            {item.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                DISETUJUI
                              </span>
                            ) : item.status === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                DITOLAK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                MENUNGGU REVIEW
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {item.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApproveAccount(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRejectAccount(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : item.status === 'APPROVED' ? (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                ✓ Akun Aktif
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveAccount(item)}
                                className="text-xs text-[#C8A46A] hover:underline font-semibold cursor-pointer"
                              >
                                Pulihkan Akun
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KONFIRMASI BOOKING ACARA */}
        {activeMainTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {(
                  [
                    { key: 'ALL', label: `Semua Booking (${bookings.length})` },
                    { key: 'PENDING', label: `Menunggu Konfirmasi (${pendingBookingsCount})` },
                    { key: 'CONFIRMED', label: `Terkonfirmasi (${bookings.filter((b) => b.status === 'CONFIRMED').length})` },
                    { key: 'CANCELLED', label: `Ditolak / Dibatalkan (${bookings.filter((b) => b.status === 'CANCELLED').length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingStatusFilter(tab.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      bookingStatusFilter === tab.key
                        ? 'bg-[#1A1A1A] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#E8E2D8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Cari ID, nama klien, paket, gedung..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                />
              </div>
            </div>

            {/* Bookings Table or EmptyState */}
            {filteredBookings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Belum ada data tersedia"
                description={
                  bookingSearch || bookingStatusFilter !== 'ALL'
                    ? 'Tidak ada data reservasi booking yang sesuai dengan filter pencarian.'
                    : 'Belum ada pengajuan booking paket wedding dari pelanggan di dalam sistem.'
                }
                actionLabel={bookingSearch || bookingStatusFilter !== 'ALL' ? 'Reset Filter' : undefined}
                onAction={() => {
                  setBookingSearch('');
                  setBookingStatusFilter('ALL');
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs hover:border-[#C8A46A] transition space-y-4"
                  >
                    {/* Top line: ID, status, date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8]">
                      <div className="flex items-center gap-3">
                        {b.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            TERKONFIRMASI
                          </span>
                        ) : b.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            MENUNGGU REVIEW
                          </span>
                        ) : b.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            DIBATALKAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            SELESAI
                          </span>
                        )}
                        <span className="text-xs font-mono text-gray-400">ID: {b.id}</span>
                      </div>

                      <span className="text-xs text-gray-500">
                        Diajukan pada: <strong className="text-[#1A1A1A]">{formatDateTimeIndo(b.created_at)}</strong>
                      </span>
                    </div>

                    {/* Middle grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Col 1: Customer */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          Data Calon Pengantin
                        </span>
                        <div className="font-serif text-lg font-bold text-[#1A1A1A]">
                          {b.customer?.full_name || 'Klien WEDMATE'}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#C8A46A]" />
                          <span>{b.customer?.phone || '-'}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-[#C8A46A]" />
                          <span className="truncate">{b.customer?.email}</span>
                        </div>
                      </div>

                      {/* Col 2: Package */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          Paket Dipilih
                        </span>
                        <div className="font-serif text-lg font-bold text-[#1A1A1A]">
                          {b.package?.name || 'Paket Pilihan'}
                        </div>
                        <div className="text-sm font-bold font-serif text-[#C8A46A]">
                          {formatRupiah(b.total_price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Estimasi: {b.guest_count} Tamu Undangan
                        </div>
                      </div>

                      {/* Col 3: Date & Venue */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          Jadwal &amp; Lokasi Acara
                        </span>
                        <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C8A46A]" />
                          <span>{formatDateIndo(b.wedding_date)}</span>
                        </div>
                        <div className="text-xs text-gray-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C8A46A] shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[#1A1A1A]">{b.venue_name}</strong>
                            <span className="text-gray-500 line-clamp-1">{b.venue_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Col 4: Quick Actions */}
                      <div className="flex flex-col justify-between gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8]">
                        <div className="text-xs text-gray-500">
                          {b.status === 'PENDING' ? (
                            <span className="text-amber-800 font-medium">
                              Menunggu persetujuan admin untuk aktivasi project checklist &amp; invoice.
                            </span>
                          ) : b.status === 'CONFIRMED' ? (
                            <span className="text-emerald-800 font-medium">
                              Booking aktif. Proyek checklist dan invoice sudah diterbitkan.
                            </span>
                          ) : (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                              <div className="font-semibold text-xs text-red-900 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <span>Booking Ditolak / Dibatalkan</span>
                              </div>
                              <p className="text-[11px] text-red-700 leading-relaxed">
                                <strong>Alasan Penolakan:</strong> &ldquo;{b.notes || 'Dibatalkan oleh Admin'}&rdquo;
                              </p>
                              <p className="text-[10px] text-red-600/80">
                                Notifikasi dan alasan telah diteruskan ke portal pengantin.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#E8E2D8]">
                          <button
                            onClick={() => setDetailBooking(b)}
                            className="p-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF8F5] text-gray-600 transition cursor-pointer"
                            title="Detail Rincian"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {b.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleConfirmBooking(b)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Konfirmasi</span>
                              </button>
                              <button
                                onClick={() => handleOpenCancelBooking(b)}
                                className="py-2 px-3 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {b.status === 'CONFIRMED' && (
                            <div className="flex flex-col sm:flex-row items-center gap-1.5 w-full">
                              <Link
                                href="/admin/projects"
                                className="flex-1 py-2 px-2.5 rounded-xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs transition text-center flex items-center justify-center gap-1"
                              >
                                <ListTodo className="w-3.5 h-3.5" />
                                <span>Project</span>
                              </Link>
                              <Link
                                href="/admin/payments"
                                className="flex-1 py-2 px-2.5 rounded-xl bg-white border border-[#E8DED0] hover:bg-[#FAF8F5] text-[#1A1A1A] font-semibold text-xs transition text-center flex items-center justify-center gap-1"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Tagihan</span>
                              </Link>
                              <button
                                onClick={() => handleOpenCancelBooking(b)}
                                className="py-2 px-2.5 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Tolak / Batalkan Booking & Proyek Ini"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          )}

                          {b.status === 'CANCELLED' && (
                            <div className="flex items-center gap-2 w-full">
                              <button
                                onClick={() => handleConfirmBooking(b)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aktifkan Kembali</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KALENDER JADWAL ACARA */}
        {activeMainTab === 'calendar' && (
          <EventScheduleCalendar
            bookings={bookings}
            onConfirmBooking={handleConfirmBooking}
            onCancelBooking={(id) => {
              const found = bookings.find((b) => b.id === id);
              if (found) openRejectBookingModal(found);
            }}
          />
        )}
      </div>

      {/* MODAL: Reject Account */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E8E2D8] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Tolak Pendaftaran Akun</span>
              </div>
              <button
                onClick={() => setRejectModalUser(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Anda akan menolak registrasi atas nama{' '}
              <strong className="text-[#1A1A1A]">{rejectModalUser.full_name}</strong>{' '}
              ({rejectModalUser.email}). Customer tidak dapat mengakses dashboard booking.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1A1A1A]">Alasan Penolakan</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tulis alasan penolakan untuk customer..."
                className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRejectAccount}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition cursor-pointer"
              >
                Tolak Akun Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Booking */}
      {cancelBookingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E8E2D8] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Batalkan Pengajuan Booking</span>
              </div>
              <button
                onClick={() => setCancelBookingTarget(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Anda akan membatalkan booking{' '}
              <strong className="text-[#1A1A1A]">#{cancelBookingTarget.id}</strong>{' '}
              dari klien{' '}
              <strong className="text-[#1A1A1A]">{cancelBookingTarget.customer?.full_name}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1A1A1A]">Alasan Pembatalan</label>
              <textarea
                rows={3}
                value={cancelBookingReason}
                onChange={(e) => setCancelBookingReason(e.target.value)}
                placeholder="Tulis alasan pembatalan..."
                className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelBookingTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmCancelBooking}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition cursor-pointer"
              >
                Batalkan Booking Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Booking Detail */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E8E2D8] shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#C8A46A] tracking-wider block">
                  Rincian Booking Pernikahan
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  {detailBooking.package?.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8]">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nama Klien</span>
                <span className="font-bold text-[#1A1A1A] text-sm">{detailBooking.customer?.full_name}</span>
                <span className="block text-gray-500 mt-0.5">{detailBooking.customer?.email}</span>
                <span className="block text-gray-500">{detailBooking.customer?.phone}</span>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8]">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nilai Kontrak</span>
                <span className="font-bold font-serif text-[#C8A46A] text-base">
                  {formatRupiah(detailBooking.total_price)}
                </span>
                <span className="block text-gray-500 mt-0.5">Kapasitas: {detailBooking.guest_count} Tamu</span>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8A46A]" />
                <span className="font-bold text-[#1A1A1A]">
                  Tanggal Acara: {formatDateIndo(detailBooking.wedding_date)}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C8A46A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A1A1A]">{detailBooking.venue_name}</span>
                  <p className="text-gray-600 mt-0.5">{detailBooking.venue_address}</p>
                </div>
              </div>
            </div>

            {detailBooking.notes && (
              <div className="p-3 bg-white rounded-xl border border-[#E8E2D8] text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">
                  Catatan Tambahan dari Klien
                </span>
                <p className="text-gray-700">{detailBooking.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDetailBooking(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-black transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-gray-500">
          Memuat pusat persetujuan...
        </div>
      }
    >
      <AdminApprovalsContent />
    </Suspense>
  );
}
