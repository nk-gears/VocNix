import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getUserDisplayName } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      email: session.email,
      username: session.username || session.email.split('@')[0],
      full_name: session.full_name || session.name,
      name: session.name,
      displayName: getUserDisplayName(session),
      avatar: session.avatar,
      role: session.role,
    },
  });
}
