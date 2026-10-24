import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { resolveRequestOrganization } from '@/lib/auth/organization-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const org = await resolveRequestOrganization(req);
    const stats = await Repository.getDashboardStats(org.id);
    const logs = await Repository.getActivityLogs(org.id, 10);

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          admin_name: org.admin_name,
          admin_email: org.admin_email,
        },
        stats,
        activityLogs: logs,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load dashboard metrics' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
