'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { HeartHandshake, LogIn, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('packageId') || searchParams.get('package');
  const redirectParam = searchParams.get('redirect');

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user }),
        });
      } catch {
        // ignore
      }

      let targetUrl = '/admin/approvals';

      if (user.role === 'ADMIN' || user.id === 'a0000000-0000-0000-0000-000000000001' || user.email === 'admin@wedmate.id') {
        if (redirectParam && redirectParam.startsWith('/admin')) {
          targetUrl = redirectParam;
        } else {
          targetUrl = '/admin/approvals';
        }
      } else if (user.status === 'APPROVED' || user.approval_status === 'APPROVED') {
        if (packageParam) {
          targetUrl = `/customer/booking?packageId=${packageParam}`;
        } else if (redirectParam) {
          targetUrl = redirectParam;
        } else {
          targetUrl = '/customer/booking';
        }
      } else {
        targetUrl = '/approval-pending';
      }

      // Hard navigation using window.location.replace:
      // 1. Immediately sends fresh HTTP headers with document.cookie to the server
      // 2. Completely bypasses stale Next.js router cache or prefetched redirect loops
      // 3. Replaces login in browser history to prevent back-button loops
      // 4. Guarantees immediate paint of the target dashboard
      window.location.replace(targetUrl);
    } catch (err: any) {
      setError(err?.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-softbeige shadow-wedding">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-champagne text-white flex items-center justify-center shadow-wedding">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal">
              WED<span className="text-champagne font-sans font-light">MATE</span>
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal">Selamat Datang di WEDMATE</h2>
          <p className="mt-2 text-xs text-champagne font-serif italic font-medium">
            &ldquo;Plan Your Day, Cherish Your Moments.&rdquo;
          </p>
          <p className="mt-1 text-xs text-charcoal-500">
            Silakan masuk untuk mengakses portal layanan pernikahan Anda.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Email atau Akun Pengguna
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com atau admin"
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi Anda"
              className="w-full px-4 py-3 rounded-xl border border-softbeige bg-ivory/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-champagne hover:bg-champagne-600 text-white font-semibold text-sm shadow-wedding flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Mengalihkan ke beranda...' : 'Masuk Sekarang'}</span>
          </button>
        </form>

        <div className="pt-6 border-t border-softbeige text-center text-xs text-charcoal-500">
          Belum memiliki Akun WEDMATE?{' '}
          <Link
            href={packageParam ? `/register?packageId=${packageParam}` : '/register'}
            className="font-semibold text-champagne hover:underline"
          >
            Daftar Akun WEDMATE
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center p-8 text-sm text-charcoal-500">
          Memuat halaman masuk...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
