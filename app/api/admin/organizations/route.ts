import { NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const organizations = await Repository.getAllOrganizations();
    const plans = await Repository.getPlans();
    return NextResponse.json({ success: true, organizations, plans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, plan_id, status } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required.' },
        { status: 400 }
      );
    }

    const organization = await Repository.createOrganization({
      name: name.trim(),
      slug: slug?.trim() || undefined,
      plan_id: plan_id || undefined,
      status: status || 'active',
    });

    return NextResponse.json(
      { success: true, message: 'Organization created successfully', organization },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/admin/organizations POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create organization' },
      { status: 500 }
    );
  }
}
