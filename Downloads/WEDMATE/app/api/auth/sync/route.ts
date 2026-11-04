import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = body?.user;

    const response = NextResponse.json({ ok: true, user: user || null });
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    if (!user) {
      const cookieNames = [
        'wedmate_user_id',
        'wedmate_user_role',
        'wedmate_role',
        'wedmate_user_status',
        'wedmate_status',
        'wedmate_user_approval_status',
        'wedmate_session_user',
      ];
      cookieNames.forEach((name) => {
        response.cookies.set(name, '', { path: '/', maxAge: 0, sameSite: 'lax' });
      });
      return response;
    }

    const userStatus = user.status || user.approval_status || 'PENDING';
    let role = (user.role || 'CUSTOMER').toUpperCase();
    if (user.id === 'a0000000-0000-0000-0000-000000000001' || user.email === 'admin@wedmate.id') {
      role = 'ADMIN';
    }

    response.cookies.set('wedmate_user_id', user.id, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('wedmate_user_role', role, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('wedmate_role', role, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('wedmate_user_status', userStatus, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('wedmate_status', userStatus, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('wedmate_user_approval_status', userStatus, { path: '/', maxAge, sameSite: 'lax' });

    const sessionPayload = JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: role,
      status: userStatus,
      approval_status: userStatus,
    });
    response.cookies.set('wedmate_session_user', encodeURIComponent(sessionPayload), {
      path: '/',
      maxAge,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
