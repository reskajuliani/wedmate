import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Rute Publik Terbuka & API Internal
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/approval-pending' ||
    pathname.startsWith('/api/');

  // 1. Prioritas Pertama: Ekstraksi Sesi Cookie WEDMATE (Aktif baik di Localhost maupun Vercel)
  const sessionCookie = request.cookies.get('wedmate_session_user')?.value;
  let sessionUser: {
    id: string;
    email: string;
    role: string;
    status: string;
    approval_status?: string;
  } | null = null;

  if (sessionCookie) {
    try {
      sessionUser = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      // ignore
    }
  }

  const rawRole =
    sessionUser?.role ||
    request.cookies.get('wedmate_user_role')?.value ||
    request.cookies.get('wedmate_role')?.value;
  let authRole = rawRole ? rawRole.toUpperCase() : null;

  const sessionUserId = sessionUser?.id || request.cookies.get('wedmate_user_id')?.value;
  if (
    sessionUserId === 'a0000000-0000-0000-0000-000000000001' ||
    sessionUser?.email === 'admin@wedmate.id' ||
    authRole === 'ADMIN'
  ) {
    authRole = 'ADMIN';
  }

  const authStatus =
    sessionUser?.approval_status ||
    sessionUser?.status ||
    request.cookies.get('wedmate_user_status')?.value ||
    request.cookies.get('wedmate_user_approval_status')?.value ||
    request.cookies.get('wedmate_status')?.value ||
    null;

  // Jika terautentikasi melalui cookie sesi WEDMATE
  if (authRole) {
    // Proteksi Rute Admin (/admin/*)
    if (pathname.startsWith('/admin')) {
      if (authRole === 'ADMIN') {
        return response; // Akses Admin penuh diberikan
      }
      if (authRole === 'CUSTOMER' && authStatus === 'APPROVED') {
        return NextResponse.redirect(new URL('/customer/booking', request.url));
      }
      return NextResponse.redirect(new URL('/approval-pending', request.url));
    }

    // Proteksi Rute Customer (/customer/*)
    if (pathname.startsWith('/customer')) {
      if (authRole === 'ADMIN') {
        return response; // Admin diizinkan melihat / preview customer
      }
      if (authRole === 'CUSTOMER') {
        if (authStatus === 'APPROVED') {
          return response; // Customer terverifikasi diizinkan
        }

        // Live database verification if cookie hasn't updated yet
        const rawDbUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
        const dbAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
        const hasDb = Boolean(rawDbUrl && dbAnonKey && !rawDbUrl.includes('your-project-id') && !rawDbUrl.includes('placeholder'));

        if (hasDb && (sessionUser?.id || sessionUser?.email)) {
          try {
            const supabase = createServerClient(rawDbUrl, dbAnonKey, {
              cookies: {
                getAll() {
                  return request.cookies.getAll();
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                  cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
              },
            });
            const q = sessionUser?.id
              ? supabase.from('profiles').select('status, approval_status').eq('id', sessionUser.id).single()
              : supabase.from('profiles').select('status, approval_status').eq('email', sessionUser!.email.toLowerCase()).single();

            // Run with 1500ms timeout to avoid hanging request
            const dbPromise = q.then((res: any) => res?.data);
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
            const dbProfile: any = await Promise.race([dbPromise, timeoutPromise]);

            const dbStatus = dbProfile?.approval_status || dbProfile?.status;
            if (dbStatus === 'APPROVED') {
              response.cookies.set('wedmate_user_status', 'APPROVED', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
              response.cookies.set('wedmate_status', 'APPROVED', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
              response.cookies.set('wedmate_user_approval_status', 'APPROVED', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
              return response;
            }
          } catch {
            // ignore
          }
        }

        return NextResponse.redirect(new URL('/approval-pending', request.url));
      }
      return NextResponse.redirect(new URL('/admin/approvals', request.url));
    }

    return response;
  }

  // 2. Jika tidak ada cookie sesi WEDMATE, periksa Supabase Auth (jika kredensial terkonfigurasi)
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const isSupabaseConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !key.includes('your-anon-key') &&
    !url.includes('placeholder')
  );

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient(url!, key!, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, approval_status')
          .eq('id', user.id)
          .single();

        const role = profile?.role ? profile.role.toUpperCase() : null;
        const approvalStatus = profile?.approval_status;

        if (pathname.startsWith('/admin')) {
          if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/customer/booking', request.url));
          }
          return response;
        }

        if (pathname.startsWith('/customer')) {
          if (role !== 'CUSTOMER') {
            return NextResponse.redirect(new URL('/admin/approvals', request.url));
          }
          if (approvalStatus !== 'APPROVED') {
            return NextResponse.redirect(new URL('/approval-pending', request.url));
          }
          return response;
        }

        return response;
      }
    } catch {
      // Abaikan error Supabase dan lanjutkan
    }
  }

  // 3. Pengguna belum login mencoba mengakses rute internal terproteksi
  if (!isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
