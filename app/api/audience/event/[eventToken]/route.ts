import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { eventToken: string } }
) {
  try {
    const { eventToken } = params;
    if (!eventToken) {
      return NextResponse.json({ success: false, error: 'Event token is required' }, { status: 400 });
    }

    const event = await Repository.getEventByPublicToken(eventToken);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found or access link is invalid' }, { status: 404 });
    }

    if (event.status === 'ended' || event.status === 'expired') {
      return NextResponse.json({
        success: false,
        error: `This event has ${event.status}. Listening is closed.`,
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
        },
      }, { status: 403 });
    }

    // Check if the audience member has a locked language cookie
    const lockCookieName = 'vocnix_audience_lock_' + eventToken;
    const lockedRoomId = req.cookies.get(lockCookieName)?.value || null;

    // Map languages with their respective room ID and current status
    const languages = (event.languages || []).map((lang) => {
      const room = event.rooms?.find((r) => r.event_language_id === lang.id);
      return {
        id: lang.id,
        languageName: lang.language_name,
        languageCode: lang.language_code,
        roomId: room?.id || null,
        roomStatus: room?.status || 'idle',
      };
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        status: event.status,
        scheduledStart: event.scheduled_start,
      },
      languages,
      lockedRoomId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
