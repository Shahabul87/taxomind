import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// GET - Get user's currently active practice session
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeSession = await practiceSessionStore.getActiveSession(session.user.id);

    if (!activeSession) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active practice session',
      });
    }

    // Calculate current elapsed time
    const now = new Date();
    let elapsedSeconds = 0;

    if (activeSession.status === 'ACTIVE' && activeSession.startedAt) {
      const startTime = new Date(activeSession.startedAt);
      const pausedSeconds = activeSession.totalPausedSeconds || 0;
      elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pausedSeconds;
    } else if (activeSession.status === 'PAUSED') {
      // For paused sessions, use the stored elapsed time
      const startTime = new Date(activeSession.startedAt);
      const lastPauseStart = activeSession.pausedAt
        ? new Date(activeSession.pausedAt)
        : now;
      const pausedSeconds = activeSession.totalPausedSeconds || 0;
      elapsedSeconds = Math.floor((lastPauseStart.getTime() - startTime.getTime()) / 1000) - pausedSeconds;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...activeSession,
        currentElapsedSeconds: elapsedSeconds,
        currentElapsedMinutes: Math.floor(elapsedSeconds / 60),
        currentElapsedHours: elapsedSeconds / 3600,
      },
    });
  } catch (error) {
    logger.error('Error fetching active practice session:', error);

    return NextResponse.json(
      { error: 'Failed to fetch active practice session' },
      { status: 500 }
    );
  }
}
