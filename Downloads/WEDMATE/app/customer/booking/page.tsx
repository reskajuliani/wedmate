'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { WeddingPackage, Booking } from '@/lib/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import {
  CalendarDays,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  ListTodo,
  CreditCard,
  Send,
  Check,
  AlertCircle,
  Building,
  Eye,
  X,
  Info,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

function CustomerBookingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('packageId') || searchParams.get('package');

  const customerId = user?.id || '';
  const [packages, setPackages] = useState<WeddingPackage[]>(() => {
    return demoStore.getPackages(true);
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    return customerId ? demoStore.getBookings(customerId) : [];
  });
  const [previewPackageModal, setPreviewPackageModal] = useState<WeddingPackage | null>(null);

  // Booking Form State
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [guestCount, setGuestCount] = useState<number>(300);
  const [specialNotes, setSpecialNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const refreshData = async () => {
      try {
        const activePkgs = await supabaseService.getPackages(true);
        if (isMounted) setPackages(activePkgs);

        if (customerId) {
          const userBookings = await supabaseService.getBookings(customerId);
          if (isMounted) setBookings(userBookings);
        }

        // Pre-select package from URL param or default first
        if (packageParam && activePkgs.length > 0) {
          const found = activePkgs.find((p) => p.id === packageParam || p.slug === packageParam);
          if (found && isMounted) {
            setSelectedPackageId(found.id);
            setGuestCount(found.estimated_guests);
          }
        } else if (activePkgs.length > 0 && !selectedPackageId && isMounted) {
          setSelectedPackageId(activePkgs[0].id);
          setGuestCount(activePkgs[0].estimated_guests);
        }
      } catch (e) {
        console.warn('Error refreshing customer bookings:', e);
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
  }, [customerId, packageParam, selectedPackageId]);

  // Set default future date (6 months ahead)
  useEffect(() => {
    if (!weddingDate) {
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setWeddingDate(future.toISOString().split('T')[0]);
    }
  }, [weddingDate]);

  const handleSelectPackage = (pkg: WeddingPackage) => {
    setSelectedPackageId(pkg.id);
    setGuestCount(pkg.estimated_guests);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetPackage = packages.find((p) => p.id === selectedPackageId || p.slug === selectedPackageId) || packages[0];
    const packageIdToUse = selectedPackageId || targetPackage?.id;

    if (!packageIdToUse) {
      setFormError('Silakan pilih salah satu paket pernikahan.');
      return;
    }
    if (!weddingDate) {
      setFormError('Tanggal rencana pernikahan wajib diisi.');
      return;
    }
    if (!venueName.trim()) {
      setFormError('Nama gedung / venue pernikahan wajib diisi.');
      return;
    }
    if (!venueAddress.trim()) {
      setFormError('Alamat lokasi venue wajib diisi.');
      return;
    }
    if (guestCount <= 0) {
      setFormError('Jumlah estimasi tamu harus lebih dari 0.');
      return;
    }

    let effectiveCustomerId = customerId;
    if (!effectiveCustomerId && typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem('wedmate_session_user');
        if (session) {
          const parsed = JSON.parse(session);
          effectiveCustomerId = parsed?.id || '';
        }
        if (!effectiveCustomerId) {
          effectiveCustomerId = localStorage.getItem('wedmate_user_id') || '';
        }
      } catch {
        // ignore
      }
    }

    if (!effectiveCustomerId) {
      setFormError('Sesi login tidak terdeteksi. Silakan login kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBooking = await supabaseService.createBooking({
        customer_id: effectiveCustomerId,
        package_id: packageIdToUse,
        wedding_date: weddingDate,
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        guest_count: guestCount,
        notes: specialNotes.trim() || undefined,
      });

      // Clear form inputs
      setVenueName('');
      setVenueAddress('');
      setSpecialNotes('');
      showToast(
        `Pengajuan booking untuk paket "${newBooking.package?.name || targetPackage?.name || 'Pilihan'}" berhasil dikirim! Tim Admin akan segera mereview reservasi Anda.`
      );
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengirim pengajuan booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Hero */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest block mb-1">
              Portal Pengantin WEDMATE
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Pemesanan &amp; Reservasi Paket Pernikahan
            </h1>
            <p className="text-xs sm:text-sm text-[#1A1A1A]/70 mt-2 leading-relaxed">
              Jelajahi pilihan paket pernikahan komprehensif kami dari katalog database, pilih paket yang sesuai dengan impian pernikahan Anda, dan ajukan jadwal reservasi secara instan.
            </p>
          </div>

          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="self-start md:self-auto px-6 py-3.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            Isi Formulir Booking
          </button>
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

        {/* SECTION 1: ACTIVE PACKAGES CATALOG */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                Pilihan Paket Pernikahan Aktif
              </h2>
              <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                Semua paket dikurasi secara profesional dengan layanan tim Wedding Organizer terlengkap.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#C8A46A] bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-[#E8E2D8]">
              {packages.length} Paket Tersedia
            </span>
          </div>

          {packages.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Belum ada data tersedia"
              description="Saat ini belum ada paket pernikahan aktif yang tersedia di katalog database. Silakan hubungi admin kami."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-[#C8A46A] ring-2 ring-[#C8A46A]/20 shadow-md'
                        : 'border-[#E8E2D8] hover:border-[#C8A46A]/60 shadow-xs'
                    }`}
                  >
                    {/* Image / Banner - Clickable for Preview */}
                    <div
                      onClick={() => setPreviewPackageModal(pkg)}
                      className="relative h-48 w-full bg-[#FAF8F5] overflow-hidden cursor-pointer group"
                      title="Klik untuk melihat desain &amp; rincian lengkap"
                    >
                      {pkg.image_url ? (
                        <Image
                          src={pkg.image_url}
                          alt={pkg.name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#C8A46A]/40 font-serif text-2xl">
                          WEDMATE
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-[#1A1A1A] text-xs font-semibold shadow-md flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#C8A46A]" />
                          <span>Lihat Desain</span>
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-[#1A1A1A] shadow-xs flex items-center gap-1 border border-[#E8E2D8]">
                        <Users className="w-3 h-3 text-[#C8A46A]" />
                        <span>{pkg.estimated_guests} Tamu</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                          {pkg.name}
                        </h3>
                        <div className="text-lg font-serif font-bold text-[#C8A46A] mt-1">
                          {formatRupiah(pkg.price)}
                        </div>
                        <p className="text-xs text-[#1A1A1A]/70 mt-2 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>

                        {/* Features List */}
                        <div className="mt-4 pt-3 border-t border-[#E8E2D8] space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/50 block">
                            Fasilitas Unggulan:
                          </span>
                          <ul className="space-y-1.5 text-[11px] text-[#1A1A1A]/80">
                            {pkg.features.slice(0, 3).map((f, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#C8A46A] shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{f}</span>
                              </li>
                            ))}
                            {pkg.features.length > 3 && (
                              <li className="text-[10px] text-[#C8A46A] font-semibold pl-5">
                                + {pkg.features.length - 3} fasilitas lengkap lainnya
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* 2 Tombol Aksi */}
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPackageModal(pkg)}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#FAF8F5] text-[#C8A46A] border border-[#C8A46A]/60 hover:bg-[#C8A46A] hover:text-white transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Selengkapnya &amp; Desain</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-[#C8A46A] text-white shadow-xs ring-2 ring-[#C8A46A]/30'
                              : 'bg-white text-[#1A1A1A] border border-[#E8E2D8] hover:bg-[#C8A46A] hover:text-white hover:border-[#C8A46A]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: DETAIL & DESAIN PAKET PERNIKAHAN LENGKAP */}
        {previewPackageModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8E2D8] shadow-2xl overflow-hidden my-8">
              {/* Modal Image Banner */}
              <div className="relative h-64 sm:h-72 w-full bg-[#1A1A1A]">
                {previewPackageModal.image_url ? (
                  <Image
                    src={previewPackageModal.image_url}
                    alt={previewPackageModal.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C8A46A] font-serif text-3xl">
                    WEDMATE
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewPackageModal(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition cursor-pointer"
                  title="Tutup dialog"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Banner Caption */}
                <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A46A] text-white tracking-wider uppercase">
                      Kurasi Resmi WEDMATE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#C8A46A]" />
                      <span>{previewPackageModal.estimated_guests} Tamu Undangan</span>
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {previewPackageModal.name}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Price and Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8E2D8]">
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider block">
                      Total Nilai Kontrak Paket
                    </span>
                    <div className="font-serif text-2xl sm:text-3xl font-bold text-[#C8A46A]">
                      {formatRupiah(previewPackageModal.price)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs text-gray-500">
                    <span className="block font-semibold text-[#1A1A1A]">All-Inclusive Coordination</span>
                    <span>Sudah mencakup seluruh koordinasi WO dari persiapan hingga hari H</span>
                  </div>
                </div>

                {/* Concept and Design Description */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-wider block">
                    Konsep &amp; Desain Acara
                  </span>
                  <p className="text-xs sm:text-sm text-[#1A1A1A]/80 leading-relaxed bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8]">
                    {previewPackageModal.description}
                  </p>
                </div>

                {/* Full Features Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold text-[#1A1A1A] tracking-wider block">
                      Rincian Fasilitas &amp; Pelayanan Lengkap
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      {previewPackageModal.features.length} Fasilitas Disertakan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {previewPackageModal.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-[#E8E2D8] flex items-start gap-2.5 shadow-xs hover:border-[#C8A46A] transition"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-[#1A1A1A] leading-snug font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 bg-[#FAF8F5] border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewPackageModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-gray-600 hover:bg-white transition cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectPackage(previewPackageModal);
                    setPreviewPackageModal(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#C8A46A] hover:bg-[#b59157] text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Pilih Paket Ini &amp; Isi Formulir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: BOOKING FORM */}
        <div ref={formRef} className="scroll-mt-24">
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E2D8] shadow-xs space-y-6">
            <div className="border-b border-[#E8E2D8] pb-4">
              <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest block mb-1">
                Formulir Reservasi
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                Ajukan Booking Pernikahan Anda
              </h2>
              <p className="text-xs text-[#1A1A1A]/70 mt-1">
                Lengkapi rincian tanggal, venue, dan tamu undangan. Data akan langsung diteruskan ke database dan Wedding Director WEDMATE.
              </p>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field 1: Package Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A]">
                    Pilihan Paket Pernikahan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => {
                      setSelectedPackageId(e.target.value);
                      const found = packages.find((p) => p.id === e.target.value);
                      if (found) setGuestCount(found.estimated_guests);
                    }}
                    className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {formatRupiah(pkg.price)} ({pkg.estimated_guests} Tamu)
                      </option>
                    ))}
                  </select>
                  {selectedPkg && (
                    <p className="text-[11px] text-[#C8A46A] font-medium pt-1">
                      Estimasi Kontrak:{' '}<strong>{formatRupiah(selectedPkg.price)}</strong>
                    </p>
                  )}
                </div>

                {/* Field 2: Wedding Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A]">
                    Tanggal Rencana Pernikahan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                      required
                    />
                  </div>
                </div>

                {/* Field 3: Venue Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A]">
                    Nama Gedung / Venue Acara <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Contoh: Grand Ballroom Hotel Mulia Senayan"
                      className="w-full pl-9 pr-3 py-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                      required
                    />
                  </div>
                </div>

                {/* Field 4: Guest Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A]">
                    Estimasi Jumlah Tamu Undangan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      step={50}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Field 5: Venue Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Alamat Lengkap Lokasi Venue <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Alamat jalan lengkap, nomor gedung, kelurahan/kecamatan, kota"
                    className="w-full pl-9 pr-3 py-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                    required
                  />
                </div>
              </div>

              {/* Field 6: Special Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Catatan Khusus / Permintaan Konsep Acara (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Ceritakan preferensi adat, tema warna (misal: champagne &amp; white), atau permintaan khusus lainnya..."
                  className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E8E2D8]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Booking'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 3: MY BOOKING HISTORY */}
        <div className="space-y-6">
          <div className="border-b border-[#E8E2D8] pb-3">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              Riwayat Pengajuan Booking Saya
            </h2>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
              Pantau status peninjauan dan konfirmasi reservasi paket pernikahan Anda.
            </p>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada data tersedia"
              description="Anda belum memiliki pengajuan booking paket wedding. Pilih paket terbaik di atas dan lengkapi formulir untuk membuat reservasi baru."
              actionLabel="Pilih Paket &amp; Booking"
              onAction={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8]">
                    <div className="flex items-center gap-3">
                      {booking.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          TERKONFIRMASI
                        </span>
                      ) : booking.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          MENUNGGU KONFIRMASI ADMIN
                        </span>
                      ) : booking.status === 'CANCELLED' ? (
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
                      <span className="text-xs font-mono text-gray-400">ID: {booking.id}</span>
                    </div>

                    <span className="text-xs text-gray-500">
                      Diajukan pada:{' '}<strong className="text-[#1A1A1A]">{formatDateIndo(booking.created_at)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Col 1: Package */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                        Paket Wedding
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                        {booking.package?.name}
                      </h3>
                      <div className="text-base font-serif font-bold text-[#C8A46A]">
                        {formatRupiah(booking.total_price)}
                      </div>
                    </div>

                    {/* Col 2: Date & Venue */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                        Jadwal &amp; Lokasi Acara
                      </span>
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                        <Calendar className="w-4 h-4 text-[#C8A46A]" />
                        <span>{formatDateIndo(booking.wedding_date)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin className="w-4 h-4 text-[#C8A46A] shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[#1A1A1A]">{booking.venue_name}</strong>
                          <span className="text-gray-500">{booking.venue_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Actions & Real-Time Notification */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-3 ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-50/60 border-red-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div>
                        {booking.status === 'CONFIRMED' && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Reservasi Dikonfirmasi
                            </span>
                            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                              Selamat! Reservasi paket pernikahan Anda telah disetujui. Tim Wedding Organizer kami telah mengaktifkan checklist persiapan pernikahan dan invoice pembayaran Anda.
                            </p>
                          </div>
                        )}

                        {booking.status === 'PENDING' && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              Sedang Ditinjau Admin
                            </span>
                            <p className="text-xs text-amber-950 leading-relaxed">
                              Pengajuan tanggal dan venue Anda sedang diverifikasi oleh tim operasional WEDMATE. Estimasi konfirmasi: 1x24 jam kerja.
                            </p>
                          </div>
                        )}

                        {booking.status === 'CANCELLED' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs uppercase tracking-wide">
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Pengajuan Ditolak / Dibatalkan</span>
                            </div>
                            <p className="text-xs text-red-900 leading-relaxed">
                              Mohon maaf, pengajuan reservasi tanggal acara ini belum dapat dikonfirmasi oleh Admin.
                            </p>
                            <div className="p-2.5 rounded-xl bg-white border border-red-200 text-xs text-red-950">
                              <span className="font-bold block text-[10px] uppercase text-red-700 tracking-wider mb-0.5">
                                Catatan / Alasan dari Admin:
                              </span>
                              <span className="italic">
                                &quot;{booking.notes || 'Jadwal bentrok atau kuota layanan pada tanggal tersebut telah penuh.'}&quot;
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons based on Status */}
                      <div className="pt-2 border-t border-black/10">
                        {booking.status === 'CONFIRMED' && (
                          <div className="flex items-center gap-2">
                            <Link
                              href="/customer/checklist"
                              className="flex-1 py-2 px-3 rounded-xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <ListTodo className="w-3.5 h-3.5" />
                              <span>Checklist WO</span>
                            </Link>
                            <Link
                              href="/customer/payment"
                              className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF8F5] text-[#1A1A1A] font-semibold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pembayaran</span>
                            </Link>
                          </div>
                        )}

                        {booking.status === 'CANCELLED' && (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <button
                              type="button"
                              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                              className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-semibold text-xs transition text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#C8A46A]" />
                              <span>Ajukan Jadwal Lain</span>
                            </button>
                            <a
                              href={`https://wa.me/6285551124373?text=${encodeURIComponent(
                                `Halo Admin WEDMATE, saya ingin konsultasi mengenai booking saya (ID: ${booking.id}) yang dibatalkan.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>Chat WhatsApp</span>
                            </a>
                          </div>
                        )}

                        {booking.status === 'PENDING' && (
                          <div className="text-[11px] text-amber-800 text-center font-medium">
                            Status akan otomatis terupdate saat admin melakukan verifikasi.
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
      </div>
    </div>
  );
}

export default function CustomerBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-gray-500">
          Memuat formulir pemesanan paket...
        </div>
      }
    >
      <CustomerBookingContent />
    </Suspense>
  );
}
