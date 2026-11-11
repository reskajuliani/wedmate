'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { demoStore } from '@/lib/demo-store';
import { UserProfile } from '@/lib/types';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  LogOut,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export default function ApprovalPendingPage() {
  const router = useRouter();
  const { user, status, logout, refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Candidate details fallback to guarantee Name, Email, and Phone are never empty
  const [candidateProfile, setCandidateProfile] = useState<{
    full_name: string;
    email: string;
    phone: string;
  }>(() => {
    let fn = user?.full_name || '';
    let em = user?.email || '';
    let ph = user?.phone || '';

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('wedmate_pending_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!fn) fn = parsed.full_name || '';
          if (!em) em = parsed.email || '';
          if (!ph) ph = parsed.phone || '';
        }
      } catch {
        // ignore
      }

      if (!fn || !em || !ph) {
        try {
          const raw = document.cookie.match(/(?:^|;\s*)wedmate_session_user=([^;]+)/);
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw[1]));
            if (!fn) fn = parsed.full_name || '';
            if (!em) em = parsed.email || '';
            if (!ph) ph = parsed.phone || '';
          }
        } catch {
          // ignore
        }
      }
    }
    return { full_name: fn, email: em, phone: ph };
  });

  React.useEffect(() => {
    if (user?.full_name || user?.email || user?.phone) {
      setCandidateProfile({
        full_name: user.full_name || candidateProfile.full_name,
        email: user.email || candidateProfile.email,
        phone: user.phone || candidateProfile.phone,
      });
    } else if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('wedmate_pending_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          setCandidateProfile((prev) => ({
            full_name: parsed.full_name || prev.full_name,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone,
          }));
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  const isPending = status === 'PENDING' || !status;
  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  // Periksa Status: fetch latest approval status directly from Server API Registry / Supabase / demoStore
  const handleCheckStatus = async (isAutoPoll = false) => {
    if (!isAutoPoll) {
      setIsChecking(true);
      setFeedback(null);
    }

    try {
      let currentStatus = status || 'PENDING';
      const targetEmail = (candidateProfile.email || user?.email || '').toLowerCase();
      const targetId = user?.id;

      // 1. Prioritas Pertama: Periksa data profil dari server API registry
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.profiles)) {
            const matched = json.profiles.find((p: any) =>
              (targetEmail && p.email && p.email.toLowerCase() === targetEmail) ||
              (targetId && p.id === targetId)
            );
            if (matched) {
              currentStatus = matched.approval_status || matched.status;
              demoStore.createUser(matched);
            }
          }
        }
      } catch (err) {
        console.warn('API status check error:', err);
      }

      // 2. Coba periksa data profil langsung dari Supabase jika terkonfigurasi
      if (currentStatus !== 'APPROVED' && isSupabaseConfigured() && (targetId || targetEmail)) {
        try {
          const supabase = createClient();
          const query = targetId
            ? supabase.from('profiles').select('role, status, approval_status').eq('id', targetId).single()
            : supabase.from('profiles').select('role, status, approval_status').eq('email', targetEmail).single();
          const { data: profile } = await query;
          if (profile) {
            currentStatus = profile.approval_status || profile.status;
          }
        } catch {
          // ignore error
        }
      }

      // 3. Periksa data dari demoStore jika local mode
      if (currentStatus !== 'APPROVED' && (targetId || targetEmail)) {
        const storeUser = (targetId ? demoStore.getUserById(targetId) : null) || (targetEmail ? demoStore.getUserByEmail(targetEmail) : null);
        if (storeUser) {
          currentStatus = storeUser.approval_status || storeUser.status;
        }
      }

      // Jika disetujui (APPROVED), sinkronisasikan cookie & server session secara permanen
      if (currentStatus === 'APPROVED') {
        const resolvedUser: UserProfile = {
          id: targetId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c' + Date.now()),
          email: targetEmail,
          full_name: candidateProfile.full_name || user?.full_name || 'Calon Pengantin',
          phone: candidateProfile.phone || user?.phone || '',
          role: 'CUSTOMER',
          status: 'APPROVED',
          approval_status: 'APPROVED',
          created_at: user?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Simpan ke local store & local storage
        demoStore.createUser(resolvedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wedmate_active_user_id', resolvedUser.id);
          const isHttps = window.location.protocol === 'https:';
          const secureFlag = isHttps ? '; Secure' : '';
          const maxAge = 60 * 60 * 24 * 7;
          document.cookie = `wedmate_user_id=${resolvedUser.id}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_user_role=CUSTOMER; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_role=CUSTOMER; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_user_status=APPROVED; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_status=APPROVED; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_user_approval_status=APPROVED; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          document.cookie = `wedmate_session_user=${encodeURIComponent(JSON.stringify(resolvedUser))}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
        }

        // Sinkronisasi cookie HTTP ke server Vercel
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: resolvedUser }),
          });
        } catch {
          // ignore
        }

        refreshUser();

        setFeedback({
          type: 'success',
          message: 'Selamat! Akun Anda telah disetujui oleh Admin. Mengalihkan ke dashboard booking...',
        });
        setTimeout(() => {
          window.location.replace('/customer/booking');
        }, 1000);
        return;
      }

      refreshUser();

      if (!isAutoPoll) {
        if (currentStatus === 'REJECTED') {
          setFeedback({
            type: 'warning',
            message: 'Pendaftaran akun Anda ditolak oleh Admin. Silakan hubungi Concierge WA untuk informasi lebih lanjut.',
          });
        } else {
          setFeedback({
            type: 'info',
            message: 'Status akun Anda masih dalam proses peninjauan oleh tim Admin WEDMATE. Mohon menunggu maksimal 1x24 jam kerja.',
          });
        }
      }
    } catch {
      if (!isAutoPoll) {
        setFeedback({
          type: 'info',
          message: 'Status saat ini: Menunggu Persetujuan Admin. Tim kurasi kami sedang memproses pendaftaran Anda.',
        });
      }
    } finally {
      if (!isAutoPoll) {
        setIsChecking(false);
      }
    }
  };

  // Background Auto-Poll: Silently checks status every 5 seconds so user is redirected immediately after approval
  React.useEffect(() => {
    if (isApproved) return;
    const interval = setInterval(() => {
      handleCheckStatus(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isApproved, candidateProfile.email, user?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E2D8] shadow-sm text-center">
        {/* Status Icon */}
        {isApproved ? (
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        ) : isRejected ? (
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-9 h-9" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-9 h-9 animate-pulse" />
          </div>
        )}

        {/* Heading */}
        <div className="mb-2">
          <span className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-[#C8A46A] block mb-2">
            WEDMATE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {isApproved
              ? 'Akun Anda Telah Disetujui!'
              : isRejected
              ? 'Pendaftaran Akun Ditolak'
              : 'Menunggu Persetujuan Admin'}
          </h1>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase my-3 border tracking-wider">
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
              STATUS: MENUNGGU PENINJAUAN
            </span>
          )}
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium my-4 text-left flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Descriptive Body */}
        {isApproved ? (
          <div className="space-y-4 text-sm text-[#1A1A1A]/70 mt-2">
            <p>
              Selamat! Akun Anda telah diverifikasi oleh tim Admin WEDMATE. Anda sekarang memiliki akses penuh ke katalog booking paket, checklist persiapan pernikahan, dan sistem pembayaran resmi.
            </p>
            <Link
              href="/customer/booking"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-sm transition active:scale-95"
            >
              <span>Buka Portal Booking & Layanan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : isRejected ? (
          <div className="space-y-4 text-sm text-[#1A1A1A]/70 mt-2">
            <p>
              Mohon maaf, pendaftaran akun atas nama{' '}
              <strong className="text-[#1A1A1A] font-semibold">{user?.full_name}</strong> belum dapat disetujui.
            </p>
            {user?.notes && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 text-left">
                <strong>Catatan Admin:</strong> {user.notes}
              </div>
            )}
            <p className="text-xs text-[#1A1A1A]/50">
              Silakan hubungi Concierge WhatsApp WEDMATE untuk informasi verifikasi pendaftaran lebih lanjut.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-[#1A1A1A]/70 mt-2">
            <p className="text-xs sm:text-sm leading-relaxed">
              Terima kasih telah mendaftar di <strong>WEDMATE</strong>. Demi menjaga kualitas pelayanan eksklusif dan privasi pasangan, setiap akun ditinjau langsung oleh Wedding Organizer kami dalam estimasi <strong>1x24 jam kerja</strong>.
            </p>

            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-[#E8E2D8] pb-2">
                <span className="text-[#1A1A1A]/50">Nama Pasangan:</span>
                <span className="font-semibold text-[#1A1A1A]">{candidateProfile.full_name || user?.full_name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E2D8] pb-2">
                <span className="text-[#1A1A1A]/50">Email Akun:</span>
                <span className="font-semibold text-[#1A1A1A]">{candidateProfile.email || user?.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E2D8] pb-2">
                <span className="text-[#1A1A1A]/50">Nomor WhatsApp:</span>
                <span className="font-semibold text-[#1A1A1A]">{candidateProfile.phone || user?.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1A1A1A]/50">Estimasi Review:</span>
                <span className="font-semibold text-[#C8A46A]">Maksimal 24 Jam Kerja</span>
              </div>
            </div>

            {/* ACTION BUTTONS: [ Periksa Status ] & [ Keluar / Logout ] */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleCheckStatus(false)}
                disabled={isChecking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Memeriksa Status Akun...' : 'Periksa Status'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#E8E2D8] hover:border-red-200 font-semibold text-xs transition active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar / Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Concierge Contact & Logout Footer */}
        <div className="mt-8 pt-6 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <a
            href="https://wa.me/6285551124373"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#1A1A1A]/70 hover:text-[#C8A46A] font-semibold transition"
          >
            <PhoneCall className="w-4 h-4 text-[#C8A46A]" />
            <span>Butuh bantuan cepat? Hubungi Concierge WA</span>
            <ExternalLink className="w-3 h-3 text-[#1A1A1A]/40" />
          </a>

          {!isPending && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[#1A1A1A]/50 hover:text-red-600 transition font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
