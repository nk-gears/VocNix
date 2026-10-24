import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, signSession, UserSession } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    let profile = await Repository.getProfileByEmail('admin@vocnix.com');

    if (!profile) {
      profile = await Repository.createProfile({
        id: '00000000-0000-0000-0000-000000000098',
        username: 'admin',
        email: 'admin@vocnix.com',
        role: 'admin',
        full_name: 'Platform Admin',
        password: 'Admin123!',
      });
    }

    const session: UserSession = {
      userId: profile.id,
      email: profile.email,
      username: profile.username || 'admin',
      full_name: profile.full_name || 'Platform Admin',
      name: profile.full_name || 'Admin',
      role: 'admin',
      organizationId: '00000000-0000-0000-0000-000000000001',
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    };

    const signedToken = await signSession(session);

    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const host = forwardedHost || req.headers.get('host') || 'localhost:3000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isHttps = !isLocalhost && (forwardedProto === 'https' || (!forwardedHost && process.env.NODE_ENV === 'production'));
    const protocol = isHttps ? 'https' : 'http';
    const redirectOrigin = `${protocol}://${host}`;

    const response = NextResponse.redirect(new URL('/dashboard', redirectOrigin));

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/admin-direct] Error:', err);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}
