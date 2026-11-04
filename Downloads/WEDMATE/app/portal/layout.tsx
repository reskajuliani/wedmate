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
    // Standalone / Demo Store Mode: Read cookies
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
      userRole = cookieStore.get('wedmate_user_role')?.value || null;
      userStatus =
        cookieStore.get('wedmate_user_approval_status')?.value ||
        cookieStore.get('wedmate_user_status')?.value ||
        null;
      userId = cookieStore.get('wedmate_user_id')?.value || null;
    }
  }

  if (!userId || !userRole) {
    redirect('/login?redirect=/customer/dashboard');
  }

  if (userRole === 'ADMIN') {
    return <div className="min-h-screen bg-ivory">{children}</div>;
  }

  if (userRole === 'CUSTOMER') {
    if (userStatus !== 'APPROVED') {
      redirect('/approval-pending');
    }
    return <div className="min-h-screen bg-ivory">{children}</div>;
  }

  redirect('/login');
}
