import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Rute Publik Terbuka
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/approval-pending';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isSupabaseConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !key.includes('your-anon-key') &&
    !url.includes('placeholder')
  );

  // Helper untuk fallback jika Supabase credentials belum diisi (Offline/Demo Mode)
  if (!isSupabaseConfigured) {
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

    const authRoleCookie =
      sessionUser?.role ||
      request.cookies.get('wedmate_user_role')?.value ||
      request.cookies.get('wedmate_role')?.value;

    const authStatusCookie =
      sessionUser?.approval_status ||
      sessionUser?.status ||
      request.cookies.get('wedmate_user_status')?.value ||
      request.cookies.get('wedmate_user_approval_status')?.value ||
      request.cookies.get('wedmate_status')?.value;

    // Belum login mencoba akses internal app terproteksi
    if (!authRoleCookie && !isPublicRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Jika sudah login
    if (authRoleCookie) {
      // NOTE: Rute /login dan /register selalu terbuka agar pengguna dapat login/registrasi tanpa terlempar otomatis
      if (pathname === '/') {
        if (authRoleCookie === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/approvals', request.url));
        }
        if (authStatusCookie === 'APPROVED') {
          return NextResponse.redirect(new URL('/customer/booking', request.url));
        } else {
          return NextResponse.redirect(new URL('/approval-pending', request.url));
        }
      }

      // Proteksi Admin
      if (pathname.startsWith('/admin')) {
        if (authRoleCookie !== 'ADMIN') {
          if (authRoleCookie === 'CUSTOMER' && authStatusCookie === 'APPROVED') {
            return NextResponse.redirect(new URL('/customer/booking', request.url));
          }
          return NextResponse.redirect(new URL('/approval-pending', request.url));
        }
      }

      // Proteksi Customer
      if (pathname.startsWith('/customer')) {
        if (authRoleCookie === 'ADMIN') {
          return response;
        }
        if (authRoleCookie !== 'CUSTOMER') {
          return NextResponse.redirect(new URL('/admin/approvals', request.url));
        }
        if (authStatusCookie !== 'APPROVED') {
          return NextResponse.redirect(new URL('/approval-pending', request.url));
        }
      }
    }

    return response;
  }

  // Supabase Online Auth (hanya jika kredensial Supabase riil terkonfigurasi)
  const supabase = createServerClient(url!, key!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Belum login akses rute terproteksi
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Jika sudah login
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const approvalStatus = profile?.approval_status;

    if (pathname === '/') {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/approvals', request.url));
      }
      if (approvalStatus === 'APPROVED') {
        return NextResponse.redirect(new URL('/customer/booking', request.url));
      } else {
        return NextResponse.redirect(new URL('/approval-pending', request.url));
      }
    }

    // Proteksi Admin
    if (pathname.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/customer/booking', request.url));
      }
    }

    // Proteksi Customer
    if (pathname.startsWith('/customer')) {
      if (role !== 'CUSTOMER') {
        return NextResponse.redirect(new URL('/admin/approvals', request.url));
      }

      if (approvalStatus !== 'APPROVED') {
        return NextResponse.redirect(new URL('/approval-pending', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
