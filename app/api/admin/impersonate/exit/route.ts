import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

async function handleExit(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const impersonatedOrgId = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (session && impersonatedOrgId) {
    const org = await Repository.getOrganization(impersonatedOrgId);
    if (org) {
      await Repository.logActivity(
        org.id,
        'IMPERSONATION_ENDED',
        `Super Admin "${session.name || session.email}" ended impersonation of organization "${org.name}"`,
        {
          superAdminId: session.userId,
          superAdminEmail: session.email,
          targetOrganizationId: org.id,
          targetOrganizationName: org.name,
          endedAt: new Date().toISOString(),
        }
      );
    }
  }

  const redirectUrl = '/admin';
  const response = NextResponse.json({
    success: true,
    message: 'Exited impersonation successfully.',
    redirectUrl,
  });

  // Clear impersonation cookie
  response.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function POST(req: NextRequest) {
  return handleExit(req);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const impersonatedOrgId = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (session && impersonatedOrgId) {
    const org = await Repository.getOrganization(impersonatedOrgId);
    if (org) {
      await Repository.logActivity(
        org.id,
        'IMPERSONATION_ENDED',
        `Super Admin "${session.name || session.email}" ended impersonation of organization "${org.name}"`,
        {
          superAdminId: session.userId,
          superAdminEmail: session.email,
          endedAt: new Date().toISOString(),
        }
      );
    }
  }

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
  response.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
