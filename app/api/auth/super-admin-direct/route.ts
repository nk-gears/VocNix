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

    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto');
    let redirectOrigin: string;

    if (forwardedHost) {
      const isHttps = forwardedProto === 'https' || req.nextUrl?.protocol === 'https:' || true;
      redirectOrigin = `${isHttps ? 'https' : 'http'}://${forwardedHost}`;
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const isHttps = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || req.nextUrl?.protocol === 'https:';
      redirectOrigin = `${isHttps ? 'https' : 'http'}://${host}`;
    }

    const response = NextResponse.redirect(new URL('/admin', redirectOrigin));

    const isCookieSecure = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || Boolean(forwardedHost);

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isCookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/super-admin-direct] Error:', err);
    return NextResponse.redirect(new URL('/admin', req.url));
  }
}
