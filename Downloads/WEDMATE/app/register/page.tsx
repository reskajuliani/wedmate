'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { WeddingPackage } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { HeartHandshake, UserPlus, AlertCircle, Sparkles, CheckCircle2, Package } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('packageId') || searchParams.get('package');

  const { register } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<WeddingPackage | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    weddingDate: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (packageParam) {
      const found =
        demoStore.getPackageById(packageParam) ||
        demoStore.getPackageBySlug(packageParam);
      if (found) {
        setSelectedPkg(found);
      }
    }
  }, [packageParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const newUser = await register({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        wedding_date: formData.weddingDate || undefined,
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('wedmate_pending_profile', JSON.stringify(newUser));
        } catch {
          // ignore
        }
      }

      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: newUser }),
        });
      } catch {
        // ignore
      }

      // Role is CUSTOMER and status is PENDING -> redirect to /approval-pending
      window.location.replace('/approval-pending');
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar. Silakan coba kembali.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-softbeige shadow-wedding">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-champagne text-white flex items-center justify-center shadow-wedding">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal">
              WED<span className="text-champagne font-sans font-light">MATE</span>
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
            Daftar Calon Pengantin
          </h2>
          <p className="mt-2 text-xs text-charcoal-500">
            Daftarkan diri Anda untuk konsultasi eksklusif dan akses portal perencanaan pernikahan
          </p>
        </div>

        {/* Selected Package Banner if applicable */}
        {selectedPkg && (
          <div className="p-4 rounded-2xl bg-champagne-100/70 border border-champagne-300 text-xs text-charcoal shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-champagne-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Package className="w-4 h-4 text-champagne-700" />
                Paket Terpilih
              </span>
              <span className="font-serif font-bold text-champagne-800 text-sm">
                {formatRupiah(selectedPkg.price)}
              </span>
            </div>
            <div className="font-serif font-bold text-base text-charcoal">{selectedPkg.name}</div>
            <div className="text-[11px] text-charcoal-600 mt-0.5">
              Kapasitas {selectedPkg.estimated_guests} Tamu • Reservasi paket ini akan otomatis didaftarkan setelah akun Anda diverifikasi.
            </div>
          </div>
        )}

        {/* Notice of Approval Requirement */}
        <div className="p-4 rounded-2xl bg-champagne-50 border border-champagne-200 text-xs text-champagne-900 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-champagne-600 shrink-0 mt-0.5" />
          <div>
            Pendaftaran baru akan otomatis berstatus{' '}
            <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-champagne-300">
              PENDING
            </span>
            . Akun Anda akan ditinjau langsung oleh Admin WEDMATE dalam 1x24 jam sebelum portal diaktifkan sepenuhnya.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Nama Pasangan Mempelai *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rina & Yoga"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Email Utama *
            </label>
            <input
              type="email"
              required
              placeholder="pasangan@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp Aktif *
            </label>
            <input
              type="tel"
              required
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Rencana Tanggal Pernikahan (Opsional)
            </label>
            <input
              type="date"
              value={formData.weddingDate}
              onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Kata Sandi *
            </label>
            <input
              type="password"
              required
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-champagne hover:bg-champagne-600 text-white font-semibold text-sm shadow-wedding flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Mendaftarkan Akun...' : 'Kirim Pendaftaran (Status Pending)'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-4 border-t border-softbeige">
          Sudah memiliki Akun WEDMATE?{' '}
          <Link
            href={packageParam ? `/login?packageId=${packageParam}` : '/login'}
            className="font-semibold text-champagne hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center p-8 text-sm text-charcoal-500">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
