import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize: Only authenticated Super Admins can impersonate organizations
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only authenticated Super Admins can impersonate organizations.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { organizationId } = body;

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'organizationId is required.' },
        { status: 400 }
      );
    }

    // 2. Verify target organization exists
    const org = await Repository.getOrganization(organizationId);
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found.' },
        { status: 404 }
      );
    }

    // 3. Verify organization has an administrator account
    const adminUser = await Repository.getOrganizationAdmin(organizationId);
    const hasAdmin = Boolean(adminUser || org.admin_email || org.admin_user_id);

    if (!hasAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: `Organization "${org.name}" does not have an administrator account configured. Please create or assign an administrator before impersonating.`,
        },
        { status: 400 }
      );
    }

    // 4. Record impersonation start audit log
    await Repository.logActivity(
      org.id,
      'IMPERSONATION_STARTED',
      `Super Admin "${session.name || session.email}" started impersonating organization "${org.name}"`,
      {
        superAdminId: session.userId,
        superAdminEmail: session.email,
        superAdminName: session.name,
        targetOrganizationId: org.id,
        targetOrganizationName: org.name,
        targetAdminEmail: org.admin_email || adminUser?.email,
        startedAt: new Date().toISOString(),
      }
    );

    // 5. Construct response and set secure impersonation cookie
    const redirectUrl = `/dashboard?impersonate=true&orgId=${org.id}`;
    const response = NextResponse.json({
      success: true,
      message: `Super Admin impersonation started for "${org.name}".`,
      redirectUrl,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        admin_name: org.admin_name || adminUser?.full_name,
        admin_email: org.admin_email || adminUser?.email,
        contact_number: org.contact_number || adminUser?.phone,
      },
    });

    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || req.nextUrl?.protocol === 'https:';

    response.cookies.set(IMPERSONATION_COOKIE_NAME, org.id, {
      path: '/',
      httpOnly: false, // Accessible to frontend UI for banner display
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 4 * 60 * 60, // 4 hours
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/admin/impersonate POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to start impersonation.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ isImpersonating: false });
    }

    const impersonateOrgId = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
    if (!impersonateOrgId) {
      return NextResponse.json({ isImpersonating: false });
    }

    const org = await Repository.getOrganization(impersonateOrgId);
    if (!org) {
      return NextResponse.json({ isImpersonating: false });
    }

    const adminUser = await Repository.getOrganizationAdmin(org.id);

    return NextResponse.json({
      isImpersonating: true,
      superAdmin: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        admin_name: org.admin_name || adminUser?.full_name,
        admin_email: org.admin_email || adminUser?.email,
        contact_number: org.contact_number || adminUser?.phone,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ isImpersonating: false, error: err.message }, { status: 500 });
  }
}
