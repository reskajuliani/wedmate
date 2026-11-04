'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function ApprovalPendingPage() {
  const { user, status, logout } = useAuth();

  const isPending = status === 'PENDING';
  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-softbeige shadow-wedding text-center">
        {/* Status Icon */}
        {isApproved ? (
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        ) : isRejected ? (
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-9 h-9" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-9 h-9" />
          </div>
        )}

        {/* Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
          {isApproved
            ? 'Akun Anda Telah Disetujui!'
            : isRejected
            ? 'Pendaftaran Akun Ditolak'
            : 'Menunggu Persetujuan Admin'}
        </h2>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase my-3 border tracking-wider">
          {isApproved ? (
            <span className="text-emerald-700 bg-emerald-50 border-emerald-300">
              STATUS: APPROVED
            </span>
          ) : isRejected ? (
            <span className="text-red-700 bg-red-50 border-red-300">
              STATUS: REJECTED
            </span>
          ) : (
            <span className="text-amber-700 bg-amber-50 border-amber-300">
              STATUS: PENDING REVIEW
            </span>
          )}
        </div>

        {/* Descriptive Body */}
        {isApproved ? (
          <div className="space-y-4 text-sm text-charcoal-600 mt-2">
            <p>
              Selamat! Akun Anda telah diverifikasi oleh tim Admin WEDMATE. Anda sekarang memiliki akses penuh ke katalog booking, checklist persiapan pernikahan, dan sistem pembayaran.
            </p>
            <Link
              href="/customer/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-wedding transition"
            >
              <span>Buka Menu Booking & Layanan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : isRejected ? (
          <div className="space-y-4 text-sm text-charcoal-600 mt-2">
            <p>
              Mohon maaf, pendaftaran akun atas nama{' '}
              <strong className="text-charcoal">{user?.full_name}</strong>{' '}
              belum dapat disetujui.
            </p>
            {user?.notes && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 text-left">
                <strong>Catatan Admin:</strong> {user.notes}
              </div>
            )}
            <p className="text-xs text-charcoal-400">
              Silakan hubungi WhatsApp Concierge WEDMATE untuk informasi verifikasi lebih lanjut.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-charcoal-600 mt-2">
            <p>
              Terima kasih telah mendaftar di{' '}
              <strong>WEDMATE</strong>.{' '}
              Demi menjaga kualitas dan privasi setiap pasangan, tim kurasi kami meninjau setiap pendaftaran akun dalam waktu estimasi{' '}
              <strong>1x24 jam</strong>.
            </p>

            <div className="p-4 bg-ivory/60 rounded-2xl border border-softbeige text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-softbeige pb-1.5">
                <span className="text-charcoal-400">Nama Mempelai:</span>
                <span className="font-semibold text-charcoal">{user?.full_name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-softbeige pb-1.5">
                <span className="text-charcoal-400">Email:</span>
                <span className="font-semibold text-charcoal">{user?.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-softbeige pb-1.5">
                <span className="text-charcoal-400">Nomor Telepon:</span>
                <span className="font-semibold text-charcoal">{user?.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Estimasi Persetujuan:</span>
                <span className="font-semibold text-champagne-700">Maks. 24 Jam Kerja</span>
              </div>
            </div>
          </div>
        )}

        {/* Concierge Contact */}
        <div className="mt-8 pt-6 border-t border-softbeige flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <a
            href="https://wa.me/6285551124373"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-charcoal-700 hover:text-champagne font-semibold transition"
          >
            <PhoneCall className="w-4 h-4 text-champagne" />
            <span>Butuh bantuan cepat? Hubungi Concierge WA</span>
            <ExternalLink className="w-3 h-3 text-charcoal-400" />
          </a>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1 text-charcoal-400 hover:text-red-600 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
