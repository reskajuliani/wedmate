import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default async function PortalLayout({
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
      userId = parsed.id;
      userRole = parsed.role ? parsed.role.toUpperCase() : null;
      userStatus = parsed.approval_status || parsed.status;
    } catch {
      // ignore
    }
  }

  if (!userRole) {
    const rawRole = cookieStore.get('wedmate_user_role')?.value || cookieStore.get('wedmate_role')?.value;
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

  if (!userId || !userRole) {
    redirect('/login?redirect=/customer/booking');
  }

  if (userRole === 'ADMIN') {
    return <div className="min-h-screen bg-[#F8F5EF]">{children}</div>;
  }

  if (userRole === 'CUSTOMER') {
    if (userStatus !== 'APPROVED') {
      redirect('/approval-pending');
    }
    return <div className="min-h-screen bg-[#F8F5EF]">{children}</div>;
  }

  redirect('/login');
}
