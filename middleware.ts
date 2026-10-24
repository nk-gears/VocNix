import { NextResponse, NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. If an active authenticated session already exists, do not show login again; redirect to appropriate console
  const authEntryPaths = [
    '/admin/login',
    '/admin/signup',
    '/super-admin/login',
    '/login',
    '/login/admin',
    '/login/super-admin',
  ];

  if (authEntryPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (session) {
      const destination = session.role === 'super_admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(destination, req.url));
    }

    return NextResponse.next();
  }

  // 2. Exclude public authentication paths and health check from route guards
  const publicAuthPaths = [
    '/admin/forgot-password',
    '/super-admin/forgot-password',
    '/super-admin/setup',
    '/auth',
    '/api/auth',
    '/api/health',
  ];

  if (publicAuthPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // 3. Super Admin Protected API routes (/api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Super Admin access required', error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 4. Admin Protected API routes (/api/dashboard/*)
  if (pathname.startsWith('/api/dashboard')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required', error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 5. Super Admin Portal UI Protection (/admin)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || session.role !== 'super_admin') {
      const forwardedHost = req.headers.get('x-forwarded-host');
      const host = forwardedHost || req.headers.get('host') || 'localhost:3000';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const isHttps = !isLocalhost && (forwardedProto === 'https' || (!forwardedHost && process.env.NODE_ENV === 'production'));
      const protocol = isHttps ? 'https' : 'http';
      const origin = `${protocol}://${host}`;
      const directLoginUrl = new URL('/api/auth/super-admin-direct', origin);
      return NextResponse.redirect(directLoginUrl);
    }

    return NextResponse.next();
  }

  // 6. Organization Admin Dashboard UI Protection (/dashboard)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based rule: Super Admin can NEVER access /dashboard directly.
    // The ONLY way Super Admin can access the Admin Dashboard is through the Impersonate option.
    if (session.role === 'super_admin') {
      const impersonateOrgId = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
      const isImpersonatingQuery = req.nextUrl?.searchParams?.get('impersonate') === 'true';
      if (!impersonateOrgId && !isImpersonatingQuery) {
        const forwardedHost = req.headers.get('x-forwarded-host');
        const host = forwardedHost || req.headers.get('host') || 'localhost:3000';
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
        const forwardedProto = req.headers.get('x-forwarded-proto');
        const isHttps = !isLocalhost && (forwardedProto === 'https' || (!forwardedHost && process.env.NODE_ENV === 'production'));
        const protocol = isHttps ? 'https' : 'http';
        const origin = `${protocol}://${host}`;
        return NextResponse.redirect(new URL('/admin', origin));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/login',
    '/login/:path*',
    '/api/admin/:path*',
    '/api/dashboard/:path*',
  ],
};
