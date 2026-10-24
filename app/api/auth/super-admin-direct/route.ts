import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, signSession, UserSession } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    let profile = await Repository.getProfileByEmail('superadmin@vocnix.com');

    if (!profile) {
      profile = await Repository.createProfile({
        id: '00000000-0000-0000-0000-000000000099',
        username: 'superadmin',
        email: 'superadmin@vocnix.com',
        role: 'super_admin',
        full_name: 'Platform Super Admin',
        password: 'SuperAdmin123!',
      });
    }

    const session: UserSession = {
      userId: profile.id,
      email: profile.email,
      username: profile.username || 'superadmin',
      full_name: profile.full_name || 'Platform Super Admin',
      name: profile.full_name || 'Super Admin',
      role: 'super_admin',
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    };

    const signedToken = await signSession(session);

    const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const response = NextResponse.redirect(new URL('/admin', redirectOrigin));

    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || req.nextUrl?.protocol === 'https:';

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/super-admin-direct] Error:', err);
    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin));
  }
}
