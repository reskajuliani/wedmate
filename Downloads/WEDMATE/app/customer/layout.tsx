import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import { CustomerHeader } from '@/components/CustomerHeader';

export const metadata = {
  title: 'Portal Pengantin - WEDMATE',
  description: 'Portal perencanaan pernikahan eksklusif: manajemen booking, jadwal, checklist persiapan, dan riwayat tagihan.',
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  let userId: string | null = null;
  let userRole: string | null = null;
  let userStatus: string | null = null;

  // 1. Prioritas Pertama: Ekstraksi Sesi Cookie WEDMATE
  const sessionCookie = cookieStore.get('wedmate_session_user')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed) {
        userId = parsed.id;
        userRole = parsed.role ? parsed.role.toUpperCase() : null;
        userStatus = parsed.approval_status || parsed.status;
      }
    } catch {
      // ignore
    }
  }

  if (!userRole) {
    const rawRole =
      cookieStore.get('wedmate_user_role')?.value ||
      cookieStore.get('wedmate_role')?.value;
    userRole = rawRole ? rawRole.toUpperCase() : null;
    userStatus =
      cookieStore.get('wedmate_user_approval_status')?.value ||
      cookieStore.get('wedmate_user_status')?.value ||
      cookieStore.get('wedmate_status')?.value ||
      null;
    userId = cookieStore.get('wedmate_user_id')?.value || null;
  }

  // 2. Jika tidak ada sesi cookie dan Supabase terkonfigurasi, periksa Supabase Auth
  if (!userRole && isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, approval_status')
          .eq('id', user.id)
          .single();

        if (profile) {
          userRole = profile.role ? profile.role.toUpperCase() : null;
          userStatus = profile.approval_status || profile.status;
        }
      }
    } catch {
      // ignore
    }
  }

  // Strictly enforce Customer login
  if (!userId || !userRole) {
    redirect('/login?redirect=/customer/booking');
  }

  // Admin allowed to preview or route back to admin
  if (userRole === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex">
        {/* Desktop Sidebar (3 core menus) */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-30">
          <CustomerSidebar />
        </div>

        {/* Content area */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <CustomerHeader />
          <main className="flex-1 bg-[#FAF8F5] text-[#1A1A1A]">{children}</main>
        </div>
      </div>
    );
  }

  // Customer must have role 'CUSTOMER' AND status 'APPROVED'
  if (userRole === 'CUSTOMER') {
    if (userStatus !== 'APPROVED') {
      redirect('/approval-pending');
    }

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex">
        {/* Desktop Sidebar (3 core menus) */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-30">
          <CustomerSidebar />
        </div>

        {/* Content area */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <CustomerHeader />
          <main className="flex-1 bg-[#FAF8F5] text-[#1A1A1A]">{children}</main>
        </div>
      </div>
    );
  }

  // Any other role redirected
  redirect('/login');
}
