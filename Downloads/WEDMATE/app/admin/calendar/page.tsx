'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { Booking } from '@/lib/types';
import { EventScheduleCalendar } from '@/components/admin/EventScheduleCalendar';
import {
  CalendarDays,
  ShieldCheck,
  ArrowRight,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminCalendarPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(() => demoStore.getBookings());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      const data = await supabaseService.getBookings();
      setBookings(data);
    } catch (e) {
      console.warn('Error loading bookings for calendar:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const executeSmartPoll = async () => {
      if (!isMounted) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isFetching) return;

      isFetching = true;
      try {
        await loadData();
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
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    showToast('Jadwal kalender berhasil diperbarui!');
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      demoStore.confirmBooking(bookingId, user?.id);
      await Promise.allSettled([
        supabaseService.updateBookingStatus(bookingId, 'CONFIRMED'),
        supabaseService.restoreProject(bookingId),
      ]);
      showToast('Booking berhasil dikonfirmasi! Proyek & invoice tagihan otomatis diterbitkan.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengonfirmasi booking.', 'error');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const reason = 'Dibatalkan dari kalender jadwal oleh admin.';
      demoStore.cancelBooking(bookingId, reason);
      await supabaseService.updateBookingStatus(bookingId, 'CANCELLED', reason);
      showToast('Booking berhasil dibatalkan.', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan booking.', 'error');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest">
                Panel Administrator
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Kalender Jadwal Acara
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Kalender Reservasi Acara Pernikahan
            </h1>
            <p className="text-xs sm:text-sm text-[#1A1A1A]/70 mt-2 leading-relaxed">
              Tinjau jadwal acara pernikahan yang telah dibooking oleh calon pengantin. Klik pada tanggal yang terisi untuk melihat rincian klien, paket, venue, dan melakukan tindakan konfirmasi langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/approvals?tab=bookings"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FAF8F5] hover:bg-white text-[#1A1A1A] border border-[#E8E2D8] font-semibold text-xs transition"
            >
              <span>Daftar Pengajuan Booking</span>
              <ArrowRight className="w-4 h-4 text-[#C8A46A]" />
            </Link>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-xs transition"
            >
              <ListTodo className="w-4 h-4" />
              <span>Manajemen Proyek</span>
            </Link>
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Live Calendar Component */}
        <EventScheduleCalendar
          bookings={bookings}
          onConfirmBooking={handleConfirmBooking}
          onCancelBooking={handleCancelBooking}
        />
      </div>
    </div>
  );
}
