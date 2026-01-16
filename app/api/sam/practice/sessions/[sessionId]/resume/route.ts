import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// POST - Resume a paused practice session
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

    // Only paused sessions can be resumed
    if (existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot resume session',
          message: 'Only paused sessions can be resumed',
          currentStatus: existingSession.status,
        },
        { status: 400 }
      );
    }

    const resumedSession = await practiceSessionStore.resume(sessionId);

    logger.info(`Resumed practice session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: resumedSession,
      message: 'Session resumed. Timer is running.',
    });
  } catch (error) {
    logger.error('Error resuming practice session:', error);

    return NextResponse.json(
      { error: 'Failed to resume practice session' },
      { status: 500 }
    );
  }
}
