import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
// Practice session store for types and methods

// Get practice stores from TaxomindContext singleton
const {
  practiceSession: practiceSessionStore,
  skillMastery10K: masteryStore,
  dailyPracticeLog: dailyLogStore,
} = getPracticeStores();

// ============================================================================
// Constants
// ============================================================================

const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const POMODOROS_BEFORE_LONG_BREAK = 4;
const POMODORO_XP_BONUS = 5; // Extra XP for completing a full pomodoro

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CompletePomodoroSchema = z.object({
  sessionId: z.string().min(1),
  pomodoroNumber: z.number().int().min(1).max(20).optional().default(1),
  notes: z.string().max(2000).optional(),
  wasInterrupted: z.boolean().optional().default(false),
  interruptionReason: z.string().max(500).optional(),
});

// ============================================================================
// POST - Complete a Pomodoro practice session
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CompletePomodoroSchema.parse(body);

    // Get the session
    const existingSession = await practiceSessionStore.getById(validated.sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify it's a Pomodoro session
    if (existingSession.sessionType !== 'POMODORO') {
      return NextResponse.json(
        { error: 'Not a Pomodoro session' },
        { status: 400 }
      );
    }

    // Only active or paused sessions can be completed
    if (existingSession.status !== 'ACTIVE' && existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot complete session',
          message: 'Only active or paused sessions can be completed',
        },
        { status: 400 }
      );
    }

    // Build notes with interruption info if applicable
    let finalNotes = existingSession.notes ?? '';
    if (validated.wasInterrupted && validated.interruptionReason) {
      finalNotes += `\n\n⚠️ Interrupted: ${validated.interruptionReason}`;
    }
    if (validated.notes) {
      finalNotes += `\n\n${validated.notes}`;
    }

    // End the session
    const completedSession = await practiceSessionStore.endSession(validated.sessionId, {
      notes: finalNotes.trim() || undefined,
    });

    // Calculate session duration in minutes
    const sessionDurationMinutes = completedSession.rawHours * 60;

    // Update skill mastery only if skillId is provided
    let updatedMastery = null;
    if (existingSession.skillId) {
      updatedMastery = await masteryStore.recordSessionToMastery(
        session.user.id,
        existingSession.skillId,
        existingSession.skillName ?? 'Unknown Skill',
        completedSession.rawHours,
        completedSession.qualityHours,
        sessionDurationMinutes,
        completedSession.qualityMultiplier
      );
    }

    // Convert focus level to number for daily log
    const focusLevelToNumber = (level: string): number => {
      const mapping: Record<string, number> = {
        VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, DEEP_FLOW: 5,
      };
      return mapping[level] ?? 3;
    };

    // Update daily practice log
    await dailyLogStore.recordActivity(
      session.user.id,
      new Date(),
      {
        totalMinutes: completedSession.rawHours * 60,
        qualityHours: completedSession.qualityHours,
        sessionsCount: 1,
        sessionType: completedSession.sessionType,
        qualityMultiplier: completedSession.qualityMultiplier,
        focusLevel: focusLevelToNumber(completedSession.focusLevel),
        skillId: existingSession.skillId,
      }
    );

    // Check for new milestones
    const milestones = await masteryStore.getMilestones(session.user.id);
    const newMilestones = milestones.filter(
      (m) => m.unlockedAt &&
        new Date(m.unlockedAt).getTime() > Date.now() - 60000
    );

    // Determine break info
    const isLongBreak = validated.pomodoroNumber % POMODOROS_BEFORE_LONG_BREAK === 0;
    const breakDuration = isLongBreak ? LONG_BREAK_MINUTES : SHORT_BREAK_MINUTES;

    logger.info(
      `Completed Pomodoro #${validated.pomodoroNumber} for user: ${session.user.id}, ` +
      `raw hours: ${completedSession.rawHours.toFixed(3)}, ` +
      `quality hours: ${completedSession.qualityHours.toFixed(3)}`
    );

    return NextResponse.json({
      success: true,
      data: {
        session: completedSession,
        mastery: updatedMastery,
        newMilestones,
        pomodoro: {
          number: validated.pomodoroNumber,
          wasInterrupted: validated.wasInterrupted,
          nextPomodoroNumber: validated.pomodoroNumber + 1,
        },
        break: {
          type: isLongBreak ? 'long' : 'short',
          duration: breakDuration,
          endTime: new Date(Date.now() + breakDuration * 60 * 1000),
          message: isLongBreak
            ? `Great work! Take a ${breakDuration}-minute break. You've earned it! 🎉`
            : `Quick ${breakDuration}-minute break. Stretch and relax! ☕`,
        },
        summary: {
          rawMinutes: Math.round(completedSession.rawHours * 60),
          qualityMinutes: Math.round(completedSession.qualityHours * 60),
          qualityMultiplier: completedSession.qualityMultiplier,
          totalQualityHours: updatedMastery?.totalQualityHours ?? 0,
          bonusXp: validated.wasInterrupted ? 0 : POMODORO_XP_BONUS,
        },
      },
      message: validated.wasInterrupted
        ? `Pomodoro #${validated.pomodoroNumber} ended early. Take a break and try again!`
        : `Pomodoro #${validated.pomodoroNumber} complete! 🍅 Take your ${isLongBreak ? 'long' : 'short'} break.`,
    });
  } catch (error) {
    logger.error('Error completing Pomodoro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete Pomodoro' },
      { status: 500 }
    );
  }
}
