import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import {
  type PracticeFocusLevel,
} from '@/lib/sam/stores/prisma-practice-session-store';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const FocusLevelEnum = z.enum([
  'DEEP_FLOW',
  'HIGH',
  'MEDIUM',
  'LOW',
  'VERY_LOW',
]);

const BloomsLevelEnum = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

const UpdateSessionSchema = z.object({
  focusLevel: FocusLevelEnum.optional(),
  bloomsLevel: BloomsLevelEnum.optional(),
  notes: z.string().max(2000).optional(),
  distractionCount: z.number().int().min(0).optional(),
  pomodoroCount: z.number().int().min(0).optional(),
  breaksTaken: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// GET - Get a single practice session
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const practiceSession = await practiceSessionStore.getById(sessionId);

    if (!practiceSession) {
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      );
    }

    // Ensure user owns this session
    if (practiceSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: practiceSession,
    });
  } catch (error) {
    logger.error('Error fetching practice session:', error);

    return NextResponse.json(
      { error: 'Failed to fetch practice session' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a practice session (focus level, notes, etc.)
// ============================================================================

export async function PATCH(
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

    // Only active or paused sessions can be updated
    if (existingSession.status !== 'ACTIVE' && existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot update session',
          message: 'Only active or paused sessions can be updated',
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = UpdateSessionSchema.parse(body);

    const updatedSession = await practiceSessionStore.update(sessionId, {
      focusLevel: validated.focusLevel as PracticeFocusLevel | undefined,
      bloomsLevel: validated.bloomsLevel,
      notes: validated.notes,
      distractionCount: validated.distractionCount,
      pomodoroCount: validated.pomodoroCount,
      breaksTaken: validated.breaksTaken,
      metadata: validated.metadata,
    });

    logger.info(`Updated practice session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    logger.error('Error updating practice session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update practice session' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Abandon a practice session (doesn't count toward hours)
// ============================================================================

export async function DELETE(
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

    // Only active or paused sessions can be abandoned
    if (existingSession.status !== 'ACTIVE' && existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot abandon session',
          message: 'Only active or paused sessions can be abandoned',
        },
        { status: 400 }
      );
    }

    const abandonedSession = await practiceSessionStore.abandonSession(sessionId);

    logger.info(`Abandoned practice session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: abandonedSession,
      message: 'Session abandoned. Practice time was not recorded.',
    });
  } catch (error) {
    logger.error('Error abandoning practice session:', error);

    return NextResponse.json(
      { error: 'Failed to abandon practice session' },
      { status: 500 }
    );
  }
}
