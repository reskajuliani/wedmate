import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';

export const metadata = {
  title: 'Panel Administrator - WEDMATE',
  description: 'Sistem manajemen operasional, verifikasi akun calon pengantin, katalog paket, booking, dan pembayaran.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // Layer 2: Server Component Guard - Direct Database & Session Verification
  let userId: string | null = null;
  let userRole: string | null = null;
  let userStatus: string | null = null;

  // 1. Check Supabase Server Auth & Database profile
  if (isSupabaseConfigured()) {
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
          userRole = profile.role;
          userStatus = profile.approval_status || profile.status;
        }
      }
    } catch {
      // In Supabase mode, failed auth strictly means unauthenticated
    }
  } else {
    // 2. Standalone / Demo Store Mode: Read cookies
    const sessionCookie = cookieStore.get('wedmate_session_user')?.value;
    let cookieUser: {
      id: string;
      role: string;
      status: string;
      approval_status?: string;
      email?: string;
    } | null = null;

    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        if (parsed) {
          cookieUser = parsed;
          userId = parsed.id;
          userRole = parsed.role;
          userStatus = parsed.approval_status || parsed.status;
        }
      } catch {
        // ignore
      }
    }

    if (!userRole) {
      userRole = cookieStore.get('wedmate_user_role')?.value || cookieStore.get('wedmate_role')?.value || null;
      userStatus =
        cookieStore.get('wedmate_user_approval_status')?.value ||
        cookieStore.get('wedmate_user_status')?.value ||
        cookieStore.get('wedmate_status')?.value ||
        null;
      userId = cookieStore.get('wedmate_user_id')?.value || null;
    }

    // Ensure admin user has valid ID
    if (userRole === 'ADMIN') {
      if (!userId) {
        userId = 'a0000000-0000-0000-0000-000000000001';
      }
    }
  }

  // Strictly enforce Admin login
  if (!userId || !userRole) {
    redirect('/login?redirect=/admin/approvals');
  }

  if (userRole !== 'ADMIN') {
    // Non-admin blocked from admin dashboard
    if (userStatus === 'APPROVED') {
      redirect('/customer/booking');
    }
    redirect('/approval-pending');
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col">
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
