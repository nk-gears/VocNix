import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // Check CRON_SECRET if configured (or allow Vercel Cron invocation header)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';

    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await Repository.resetAllDemoOrganizationsUsage();

    return NextResponse.json({
      success: true,
      message: 'Demo organizations usage reset completed',
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
