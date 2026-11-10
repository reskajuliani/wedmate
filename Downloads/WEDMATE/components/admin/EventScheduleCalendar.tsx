'use client';

import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus } from '@/lib/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  Check,
  X,
  Sparkles,
  RotateCcw,
  Phone,
  Mail,
  Info,
  CalendarDays,
  Tag,
} from 'lucide-react';

export interface EventScheduleCalendarProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

interface CalendarCell {
  dayNumber: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookings: Booking[];
}

export function EventScheduleCalendar({
  bookings = [],
  onSelectBooking,
  onConfirmBooking,
  onCancelBooking,
}: EventScheduleCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeBookingDetail, setActiveBookingDetail] = useState<Booking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group bookings by wedding_date key (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      if (!b.wedding_date) return;
      // b.wedding_date may be ISO string or YYYY-MM-DD
      const dateKey = b.wedding_date.split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(b);
      map.set(dateKey, list);
    });
    return map;
  }, [bookings]);

  // Compute 42 calendar grid cells (6 rows x 7 cols)
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const cells: CalendarCell[] = [];

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Convert getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Monday-based (0=Mon, ..., 6=Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    // Number of days in current month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    // 1. Trailing days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;

      cells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    // 2. Days of current month
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      cells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    // 3. Leading days of next month to complete 35 or 42 cells
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum);
      const dateKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;

      cells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    return cells;
  }, [year, month, bookingsByDate, today]);

  // Status visual helper
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'TERKONFIRMASI',
        };
      case 'PENDING':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'PENDING',
        };
      case 'CANCELLED':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'BATAL',
        };
      default:
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'SELESAI',
        };
    }
  };

  const handleCellClick = (cell: CalendarCell) => {
    if (cell.bookings.length > 0) {
      setSelectedDate(cell.dateKey);
      setActiveBookingDetail(cell.bookings[0]);
    }
  };

  const handleBookingChipClick = (e: React.MouseEvent, booking: Booking, dateKey: string) => {
    e.stopPropagation();
    setSelectedDate(dateKey);
    setActiveBookingDetail(booking);
    if (onSelectBooking) onSelectBooking(booking);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setActiveBookingDetail(null);
  };

  const selectedDateBookings = selectedDate ? bookingsByDate.get(selectedDate) || [] : [];

  // Summary counts for the active visible month
  const currentMonthBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b.wedding_date) return false;
      const parts = b.wedding_date.split('T')[0].split('-');
      const bYear = parseInt(parts[0], 10);
      const bMonth = parseInt(parts[1], 10) - 1;
      return bYear === year && bMonth === month;
    });
  }, [bookings, year, month]);

  const monthConfirmedCount = currentMonthBookings.filter((b) => b.status === 'CONFIRMED').length;
  const monthPendingCount = currentMonthBookings.filter((b) => b.status === 'PENDING').length;
  const monthTotalRevenue = currentMonthBookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((acc, b) => acc + (b.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E2D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-[#C8A46A] tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Live Schedule Grid
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {MONTH_NAMES[month]} {year}
          </h2>
          <p className="text-xs text-[#1A1A1A]/70 mt-1">
            Visualisasi jadwal acara pernikahan pelanggan. Klik pada tanggal yang terisi untuk melihat detail dan tindakan cepat.
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] hover:bg-white text-[#1A1A1A] font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C8A46A]" />
            <span>Hari Ini</span>
          </button>
          <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-[#1A1A1A] transition cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-[#1A1A1A] transition cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-gray-500 block">
            Total Acara Bulan Ini
          </span>
          <span className="text-2xl font-bold font-serif text-[#1A1A1A]">
            {currentMonthBookings.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-amber-700 block">
            Menunggu Review
          </span>
          <span className="text-2xl font-bold font-serif text-amber-600">
            {monthPendingCount}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-emerald-700 block">
            Sudah Terkonfirmasi
          </span>
          <span className="text-2xl font-bold font-serif text-emerald-600">
            {monthConfirmedCount}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-[#C8A46A] block">
            Estimasi Nilai Terkonfirmasi
          </span>
          <span className="text-lg sm:text-xl font-bold font-serif text-[#C8A46A]">
            {formatRupiah(monthTotalRevenue)}
          </span>
        </div>
      </div>

      {/* Main Calendar Grid Container */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-xs">
        {/* 7-Day Header */}
        <div className="grid grid-cols-7 border-b border-[#E8E2D8] bg-[#FAF8F5]">
          {DAY_NAMES.map((dayName, idx) => (
            <div
              key={dayName}
              className={`py-3.5 text-center text-xs font-bold uppercase tracking-wider ${
                idx >= 5 ? 'text-[#C8A46A]' : 'text-[#1A1A1A]/70'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E2D8] bg-[#E8E2D8]">
          {calendarCells.map((cell, idx) => {
            const hasBookings = cell.bookings.length > 0;

            return (
              <div
                key={`${cell.dateKey}-${idx}`}
                onClick={() => handleCellClick(cell)}
                className={`min-h-[115px] sm:min-h-[130px] p-2 sm:p-2.5 flex flex-col justify-between transition relative ${
                  cell.isCurrentMonth
                    ? 'bg-white hover:bg-[#FAF8F5]/80'
                    : 'bg-[#FAF8F5]/40 text-gray-300'
                } ${hasBookings ? 'cursor-pointer hover:border-[#C8A46A]' : ''}`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      cell.isToday
                        ? 'bg-[#C8A46A] text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-[#1A1A1A]'
                        : 'text-gray-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {hasBookings && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E2D8] text-[#C8A46A]">
                      {cell.bookings.length} {cell.bookings.length === 1 ? 'acara' : 'acara'}
                    </span>
                  )}
                </div>

                {/* Bookings Chips List */}
                <div className="space-y-1 overflow-hidden">
                  {cell.bookings.slice(0, 2).map((b) => {
                    const badge = getStatusBadge(b.status);
                    const clientName = b.customer?.full_name || 'Klien';

                    return (
                      <div
                        key={b.id}
                        onClick={(e) => handleBookingChipClick(e, b, cell.dateKey)}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold truncate border flex items-center gap-1.5 transition ${badge.pill} hover:opacity-90 shadow-2xs`}
                        title={`${clientName} (${badge.label}) - ${b.venue_name || 'Gedung'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                        <span className="truncate">{clientName}</span>
                      </div>
                    );
                  })}

                  {cell.bookings.length > 2 && (
                    <div className="text-[10px] font-medium text-gray-500 pl-1">
                      +{cell.bookings.length - 2} acara lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Guide Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-[#1A1A1A]">Indikator Warna Status:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-gray-700 font-medium">PENDING (Menunggu Konfirmasi)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-700 font-medium">CONFIRMED (Sudah Terkonfirmasi)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-gray-700 font-medium">CANCELLED (Dibatalkan)</span>
          </div>
        </div>
        <div className="text-gray-500 text-[11px]">
          * Jadwal dihitung berdasarkan tanggal acara pernikahan (<code>wedding_date</code>)
        </div>
      </div>

      {/* DATE DETAILS MODAL */}
      {selectedDate && activeBookingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E8E2D8] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8E2D8]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#C8A46A] tracking-wider block">
                  Detail Reservasi Tanggal Acara
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-0.5">
                  {formatDateIndo(selectedDate)}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If multiple bookings exist on this date, show switcher tabs */}
            {selectedDateBookings.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {selectedDateBookings.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBookingDetail(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                      activeBookingDetail.id === b.id
                        ? 'bg-[#1A1A1A] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-gray-700 hover:bg-white border border-[#E8E2D8]'
                    }`}
                  >
                    <span>Acara #{idx + 1}: {b.customer?.full_name || 'Klien'}</span>
                    <span className={`w-2 h-2 rounded-full ${getStatusBadge(b.status).dot}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Booking Details Card */}
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  getStatusBadge(activeBookingDetail.status).pill
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      getStatusBadge(activeBookingDetail.status).dot
                    }`}
                  />
                  <span>Status: {getStatusBadge(activeBookingDetail.status).label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">
                  ID: {activeBookingDetail.id}
                </span>
              </div>

              {/* Client & Package Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Bride / Groom / Customer */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                    Nama Calon Pengantin
                  </span>
                  <div className="font-serif text-base font-bold text-[#1A1A1A]">
                    {activeBookingDetail.customer?.full_name || 'Klien WEDMATE'}
                  </div>
                  <div className="text-gray-600 flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-[#C8A46A]" />
                    <span>{activeBookingDetail.customer?.phone || '-'}</span>
                  </div>
                  <div className="text-gray-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C8A46A]" />
                    <span>{activeBookingDetail.customer?.email || '-'}</span>
                  </div>
                </div>

                {/* Package & Price */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                    Paket yang Dipilih
                  </span>
                  <div className="font-serif text-base font-bold text-[#1A1A1A]">
                    {activeBookingDetail.package?.name || '-'}
                  </div>
                  <div className="text-base font-bold font-serif text-[#C8A46A] pt-1">
                    {formatRupiah(activeBookingDetail.total_price)}
                  </div>
                  <div className="text-gray-500 text-[11px] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{activeBookingDetail.guest_count} Tamu Undangan</span>
                  </div>
                </div>
              </div>

              {/* Venue & Location */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                  Venue / Lokasi Gedung
                </span>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C8A46A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1A1A1A] block text-sm">
                      {activeBookingDetail.venue_name || 'Belum ditentukan'}
                    </strong>
                    <p className="text-gray-600 mt-0.5">
                      {activeBookingDetail.venue_address || 'Alamat venue belum diisi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Notes if any */}
              {activeBookingDetail.notes && (
                <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] text-xs">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">
                    Catatan Reservasi dari Klien
                  </span>
                  <p className="text-gray-700 italic">"{activeBookingDetail.notes}"</p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition text-center cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {activeBookingDetail.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        const id = activeBookingDetail.id;
                        closeModal();
                        onConfirmBooking?.(id);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Konfirmasi Booking</span>
                    </button>
                    <button
                      onClick={() => {
                        const id = activeBookingDetail.id;
                        closeModal();
                        onCancelBooking?.(id);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Batalkan Booking</span>
                    </button>
                  </>
                )}

                {activeBookingDetail.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      const id = activeBookingDetail.id;
                      closeModal();
                      onCancelBooking?.(id);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batalkan Reservasi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
