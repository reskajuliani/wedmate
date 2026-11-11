import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = body?.user;

    const response = NextResponse.json({ ok: true, user: user || null });
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https:');

    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const,
      secure: isHttps,
      httpOnly: false,
    };

    const cookieNames = [
      'wedmate_user_id',
      'wedmate_user_role',
      'wedmate_role',
      'wedmate_user_status',
      'wedmate_status',
      'wedmate_user_approval_status',
      'wedmate_session_user',
    ];

    if (!user) {
      cookieNames.forEach((name) => {
        response.cookies.delete(name);
        response.cookies.set(name, '', {
          ...cookieOptions,
          maxAge: 0,
          expires: new Date(0),
        });
        response.cookies.set(name, '', {
          ...cookieOptions,
          secure: true,
          maxAge: 0,
          expires: new Date(0),
        });
      });
      return response;
    }

    const userStatus = user.status || user.approval_status || 'PENDING';
    let role = (user.role || 'CUSTOMER').toUpperCase();
    if (user.id === 'a0000000-0000-0000-0000-000000000001' || user.email === 'admin@wedmate.id') {
      role = 'ADMIN';
    }

    response.cookies.set('wedmate_user_id', user.id, { ...cookieOptions, maxAge });
    response.cookies.set('wedmate_user_role', role, { ...cookieOptions, maxAge });
    response.cookies.set('wedmate_role', role, { ...cookieOptions, maxAge });
    response.cookies.set('wedmate_user_status', userStatus, { ...cookieOptions, maxAge });
    response.cookies.set('wedmate_status', userStatus, { ...cookieOptions, maxAge });
    response.cookies.set('wedmate_user_approval_status', userStatus, { ...cookieOptions, maxAge });

    const sessionPayload = JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      wedding_date: user.wedding_date || '',
      role: role,
      status: userStatus,
      approval_status: userStatus,
      notes: user.notes || '',
    });
    response.cookies.set('wedmate_session_user', encodeURIComponent(sessionPayload), {
      ...cookieOptions,
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('wedmate_session_user')?.value;
  let user = null;
  if (sessionCookie) {
    try {
      user = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      // ignore
    }
  }
  return NextResponse.json({ ok: true, user });
}
