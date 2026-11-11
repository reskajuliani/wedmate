import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function clearAllAuthCookies(response: NextResponse, request: NextRequest) {
  const cookieNames = [
    'wedmate_user_id',
    'wedmate_user_role',
    'wedmate_role',
    'wedmate_user_status',
    'wedmate_status',
    'wedmate_user_approval_status',
    'wedmate_session_user',
    'sb-access-token',
    'sb-refresh-token',
  ];

  // Also read any cookies that start with 'wedmate' or 'sb-'
  const allReqCookies = request.cookies.getAll();
  allReqCookies.forEach((c) => {
    if (c.name.startsWith('wedmate') || c.name.startsWith('sb-')) {
      if (!cookieNames.includes(c.name)) {
        cookieNames.push(c.name);
      }
    }
  });

  cookieNames.forEach((name) => {
    // Standard cookie deletion via next/server
    response.cookies.delete(name);
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
    });
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      secure: true,
      sameSite: 'lax',
    });
    response.cookies.set(name, '', {
      maxAge: 0,
      expires: new Date(0),
    });
  });

  // Explicitly add Set-Cookie headers for legacy browser compatibility
  cookieNames.forEach((name) => {
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`
    );
  });
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('logged_out', '1');
  const response = NextResponse.redirect(redirectUrl);
  clearAllAuthCookies(response, request);
  return response;
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true, message: 'Logged out successfully' });
  clearAllAuthCookies(response, request);
  return response;
}
