import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const explicitRedirect = req.nextUrl.searchParams.get('redirect');
  const targetPath = explicitRedirect || '/login';

  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(new URL(targetPath, redirectOrigin));
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  response.cookies.delete(IMPERSONATION_COOKIE_NAME);
  response.cookies.set(IMPERSONATION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  response.cookies.delete(IMPERSONATION_COOKIE_NAME);
  response.cookies.set(IMPERSONATION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}
