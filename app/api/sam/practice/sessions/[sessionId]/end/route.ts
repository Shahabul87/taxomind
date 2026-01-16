import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { type BloomsLevel } from '@/lib/sam/stores/prisma-practice-session-store';

// Get practice stores from TaxomindContext singleton
const {
  practiceSession: practiceSessionStore,
  skillMastery10K: masteryStore,
  dailyPracticeLog: dailyLogStore,
} = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BloomsLevelEnum = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

const EndSessionSchema = z.object({
  bloomsLevel: BloomsLevelEnum.optional(),
  difficultyRating: z.number().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
  reflection: z.string().max(2000).optional(),
  accomplishments: z.array(z.string()).optional(),
});

// ============================================================================
// POST - End a practice session (completes and records hours)
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

    // Only active or paused sessions can be ended
    if (existingSession.status !== 'ACTIVE' && existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot end session',
          message: 'Only active or paused sessions can be ended',
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const validated = EndSessionSchema.parse(body);

    // End the practice session
    const completedSession = await practiceSessionStore.end(sessionId, {
      bloomsLevel: validated.bloomsLevel as BloomsLevel | undefined,
      difficultyRating: validated.difficultyRating,
      notes: validated.notes
        ? (existingSession.notes ? `${existingSession.notes}\n\n${validated.notes}` : validated.notes)
        : undefined,
    });

    // Update skill mastery with the completed session
    const updatedMastery = await masteryStore.addSessionToMastery(
      session.user.id,
      existingSession.skillId,
      {
        rawHours: completedSession.rawHours,
        qualityHours: completedSession.qualityHours,
        qualityMultiplier: completedSession.qualityMultiplier,
        bloomsLevel: completedSession.bloomsLevel,
        sessionType: completedSession.sessionType,
      }
    );

    // Update daily practice log for heatmap
    await dailyLogStore.addOrUpdateLog(
      session.user.id,
      completedSession.rawHours,
      completedSession.qualityHours,
      1,
      completedSession.qualityMultiplier
    );

    // Check for newly achieved milestones
    const milestones = await masteryStore.getMilestones(
      session.user.id,
      existingSession.skillId
    );
    const newMilestones = milestones.filter(
      (m) => m.achievedAt &&
        new Date(m.achievedAt).getTime() > Date.now() - 60000 // Within last minute
    );

    logger.info(
      `Ended practice session: ${sessionId}, ` +
      `raw hours: ${completedSession.rawHours.toFixed(2)}, ` +
      `quality hours: ${completedSession.qualityHours.toFixed(2)}, ` +
      `multiplier: ${completedSession.qualityMultiplier.toFixed(2)}`
    );

    return NextResponse.json({
      success: true,
      data: {
        session: completedSession,
        mastery: updatedMastery,
        newMilestones,
        summary: {
          rawHours: completedSession.rawHours,
          qualityHours: completedSession.qualityHours,
          qualityMultiplier: completedSession.qualityMultiplier,
          totalQualityHours: updatedMastery.totalQualityHours,
          proficiencyLevel: updatedMastery.proficiencyLevel,
          currentStreak: updatedMastery.currentStreak,
          milestonesEarned: newMilestones.length,
        },
      },
      message: `Great practice! You logged ${completedSession.rawHours.toFixed(2)} hours ` +
        `(${completedSession.qualityHours.toFixed(2)} quality hours with ${completedSession.qualityMultiplier.toFixed(1)}x multiplier)`,
    });
  } catch (error) {
    logger.error('Error ending practice session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to end practice session' },
      { status: 500 }
    );
  }
}
