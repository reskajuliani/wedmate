import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

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
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        userId = parsed.id;
        userRole = parsed.role;
        userStatus = parsed.approval_status || parsed.status;
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
  }

  // Strictly enforce Customer login
  if (!userId || !userRole) {
    redirect('/login?redirect=/customer/booking');
  }

  // Admin allowed to preview or route back to admin
  if (userRole === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex flex-col">
        <CustomerHeader />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Customer must have role 'CUSTOMER' AND status 'APPROVED'
  if (userRole === 'CUSTOMER') {
    if (userStatus !== 'APPROVED') {
      redirect('/approval-pending');
    }

    return (
      <div className="min-h-screen bg-[#F8F5EF] flex flex-col">
        <CustomerHeader />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Any other role redirected
  redirect('/login');
}
