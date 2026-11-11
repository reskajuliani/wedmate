import Link from 'next/link';
import { cookies } from 'next/headers';
import { LogIn, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WelcomeScreen() {
  const cookieStore = await cookies();

  // Deteksi sesi aktif tanpa melakukan auto-redirect paksa agar pengguna selalu dapat melihat Welcome Screen
  let activeUser: { name: string; role: string; dashboardUrl: string } | null = null;
  const sessionCookie = cookieStore.get('wedmate_session_user')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed) {
        const isAdm =
          parsed.role === 'ADMIN' ||
          parsed.id === 'a0000000-0000-0000-0000-000000000001' ||
          parsed.email === 'admin@wedmate.id';
        activeUser = {
          name: parsed.full_name || (isAdm ? 'Admin WEDMATE' : 'Calon Pengantin'),
          role: isAdm ? 'ADMIN' : 'CUSTOMER',
          dashboardUrl: isAdm
            ? '/admin/approvals'
            : parsed.status === 'APPROVED' || parsed.approval_status === 'APPROVED'
            ? '/customer/booking'
            : '/approval-pending',
        };
      }
    } catch {
      // ignore
    }
  }

  if (!activeUser) {
    const rawRole = cookieStore.get('wedmate_user_role')?.value || cookieStore.get('wedmate_role')?.value;
    const userId = cookieStore.get('wedmate_user_id')?.value;
    if (rawRole === 'ADMIN' || userId === 'a0000000-0000-0000-0000-000000000001') {
      activeUser = {
        name: 'Admin WEDMATE',
        role: 'ADMIN',
        dashboardUrl: '/admin/approvals',
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-[#1A1A1A]">
      <div className="w-full max-w-md bg-white border border-[#E8E2D8] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
        {/* Brand Header */}
        <div className="mb-6">
          <span className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-[#C8A46A] block">
            WEDMATE
          </span>
          <p className="text-xs text-[#1A1A1A]/60 italic font-serif mt-1">
            Plan Your Day, Cherish Your Moments.
          </p>
        </div>

        <div className="mb-8">
          <h1 className="font-serif text-xl sm:text-2xl font-semibold mb-2 text-[#1A1A1A]">
            Portal Layanan &amp; Manajemen Pernikahan
          </h1>
          <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
            Akses sistem manajemen perencanaan pernikahan, reservasi paket, dan pelacakan pembayaran Anda.
          </p>
        </div>

        {/* Informasi Sesi Aktif Jika Ada */}
        {activeUser && (
          <div className="mb-5 p-3.5 bg-[#FAF8F5] border border-[#C8A46A]/30 rounded-2xl text-left flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#C8A46A]/10 text-[#C8A46A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#1A1A1A]/50 leading-none">Terhubung sebagai</p>
                <p className="text-xs font-semibold text-[#1A1A1A] mt-0.5">{activeUser.name}</p>
              </div>
            </div>
            <Link
              href={activeUser.dashboardUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C8A46A] text-white text-[11px] font-semibold hover:bg-[#b59157] transition shadow-xs"
            >
              <span>Buka Panel</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* HANYA ADA 2 TOMBOL UTAMA */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-[#C8A46A] hover:bg-[#b59157] text-white py-3.5 px-6 rounded-2xl font-medium text-sm transition shadow-sm active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Masuk ke Akun
          </Link>

          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 bg-[#FAF8F5] hover:bg-[#E8E2D8] text-[#1A1A1A] border border-[#E8E2D8] py-3.5 px-6 rounded-2xl font-medium text-sm transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Registrasi Akun Baru
          </Link>
        </div>

        <p className="text-[11px] text-[#1A1A1A]/40 mt-8">
          Khusus Klien &amp; Tim Internal Wedding Organizer
        </p>
      </div>
    </main>
  );
}
