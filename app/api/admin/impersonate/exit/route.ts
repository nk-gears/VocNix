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

  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(new URL('/admin', redirectOrigin));
  response.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
