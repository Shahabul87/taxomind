import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// POST - Pause a practice session
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify session exists and belongs to user
    const existingSession = await practiceSessionStore.getById(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      );
    }

    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only active sessions can be paused
    if (existingSession.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'Cannot pause session',
          message: 'Only active sessions can be paused',
          currentStatus: existingSession.status,
        },
        { status: 400 }
      );
    }

    const pausedSession = await practiceSessionStore.pauseSession(sessionId);

    logger.info(`Paused practice session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: pausedSession,
      message: 'Session paused. Resume when ready to continue.',
    });
  } catch (error) {
    logger.error('Error pausing practice session:', error);

    return NextResponse.json(
      { error: 'Failed to pause practice session' },
      { status: 500 }
    );
  }
}
