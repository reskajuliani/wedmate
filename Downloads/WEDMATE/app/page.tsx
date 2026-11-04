import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LogIn, UserPlus } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function WelcomeScreen() {
  const cookieStore = await cookies();

  // 1. Periksa sesi cookie WEDMATE terlebih dahulu
  const sessionCookie = cookieStore.get('wedmate_session_user')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed.role === 'ADMIN' || parsed.id === 'a0000000-0000-0000-0000-000000000001' || parsed.email === 'admin@wedmate.id') {
        redirect('/admin/approvals');
      } else if (parsed.status === 'APPROVED' || parsed.approval_status === 'APPROVED') {
        redirect('/customer/booking');
      } else {
        redirect('/approval-pending');
      }
    } catch {
      // ignore
    }
  }

  const roleCookie =
    cookieStore.get('wedmate_user_role')?.value ||
    cookieStore.get('wedmate_role')?.value;
  const statusCookie =
    cookieStore.get('wedmate_user_status')?.value ||
    cookieStore.get('wedmate_user_approval_status')?.value ||
    cookieStore.get('wedmate_status')?.value;
  const userIdCookie = cookieStore.get('wedmate_user_id')?.value;

  if (roleCookie === 'ADMIN' || userIdCookie === 'a0000000-0000-0000-0000-000000000001') {
    redirect('/admin/approvals');
  } else if (roleCookie === 'CUSTOMER') {
    if (statusCookie === 'APPROVED') {
      redirect('/customer/booking');
    } else {
      redirect('/approval-pending');
    }
  }

  // 2. Periksa Supabase Auth jika belum terdeteksi dari cookie
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, approval_status')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'ADMIN') {
          redirect('/admin/approvals');
        } else if (profile?.approval_status === 'APPROVED') {
          redirect('/customer/booking');
        } else {
          redirect('/approval-pending');
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] flex items-center justify-center p-6 text-[#333333]">
      <div className="w-full max-w-md bg-white border border-[#E8DED0] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
        {/* Brand Header */}
        <div className="mb-8">
          <span className="font-serif text-3xl font-bold tracking-wider text-[#C8A46A] block">
            WEDMATE
          </span>
          <p className="text-xs text-[#333333]/60 italic font-serif mt-1">
            Plan Your Day, Cherish Your Moments.
          </p>
        </div>

        <div className="mb-8">
          <h1 className="font-serif text-xl font-semibold mb-2">
            Portal Layanan Pernikahan
          </h1>
          <p className="text-xs text-[#333333]/70 leading-relaxed">
            Akses sistem manajemen perencanaan pernikahan, reservasi paket, dan pelacakan pembayaran Anda.
          </p>
        </div>

        {/* 2 PILIHAN UTAMA SAJA */}
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
            className="w-full flex items-center justify-center gap-2 bg-[#F8F5EF] hover:bg-[#E8DED0] text-[#333333] border border-[#E8DED0] py-3.5 px-6 rounded-2xl font-medium text-sm transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Registrasi Akun Baru
          </Link>
        </div>

        <p className="text-[11px] text-[#333333]/40 mt-8">
          Khusus Klien & Tim Internal Wedding Organizer
        </p>
      </div>
    </main>
  );
}
