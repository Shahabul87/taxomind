import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import {
  createTransactionalPracticeSessionOrchestrator,
  type TransactionalEndSessionInput,
} from '@/lib/sam/orchestrator/transactional-practice-session-orchestrator';
import { syncSessionToSkillBuildTrack } from '@/lib/practice/sync-skill-build';

// Get practice stores from TaxomindContext singleton (only for session lookup)
const {
  practiceSession: practiceSessionStore,
  skillMastery10K: masteryStore,
} = getPracticeStores();

// Create orchestrator for transactional session management
const orchestrator = createTransactionalPracticeSessionOrchestrator();

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
  // Phase 4: Timezone support for accurate day boundaries
  timezone: z.string().optional(),
  // Phase 3: Enhanced quality scoring inputs
  selfRatedDifficulty: z.number().min(1).max(5).optional(),
  focusLevel: z.enum(['DEEP_FLOW', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']).optional(),
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

    // Build orchestrator input with Phase 3/4 fields
    const orchestratorInput: TransactionalEndSessionInput = {
      notes: finalNotes.trim() || undefined,
      focusLevel: validated.focusLevel,
      pomodoroCount: validated.pomodoroNumber,
      timezone: validated.timezone,
      selfRatedDifficulty: validated.selfRatedDifficulty,
    };

    // Use transactional orchestrator for atomic session end with Phase 3/4 features
    const result = await orchestrator.endSessionTransactionally(validated.sessionId, orchestratorInput);

    const {
      session: completedSession,
      mastery: updatedMastery,
      newMilestones,
      qualityScore,
      validation,
      focusDrift,
    } = result;

    // Calculate session duration in minutes
    const sessionDurationMinutes = completedSession.rawHours * 60;

    // Sync to SkillBuildTrack for multi-dimensional tracking (with Phase 3 evidence-based scoring)
    if (existingSession.skillId) {
      await syncSessionToSkillBuildTrack({
        userId: session.user.id,
        skillId: existingSession.skillId,
        skillName: existingSession.skillName ?? 'Unknown Skill',
        durationMinutes: sessionDurationMinutes,
        qualityMultiplier: completedSession.qualityMultiplier,
        sessionType: completedSession.sessionType,
        focusLevel: completedSession.focusLevel,
        bloomsLevel: completedSession.bloomsLevel,
        courseId: existingSession.courseId,
        rawHours: completedSession.rawHours,
        qualityHours: completedSession.qualityHours,
        selfRatedDifficulty: validated.selfRatedDifficulty,
      });
    }

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
        // Phase 3: Enhanced quality scoring breakdown (mapped to UI types)
        qualityScoring: {
          multiplier: qualityScore.finalMultiplier,
          confidenceLevel: qualityScore.confidence,
          evidenceType: qualityScore.evidenceType,
          breakdown: {
            timeWeight: qualityScore.breakdown.sessionType ?? 0,
            focusWeight: qualityScore.breakdown.focus ?? 0,
            bloomsWeight: qualityScore.breakdown.blooms ?? 0,
            sessionTypeWeight: qualityScore.breakdown.sessionType ?? 0,
          },
        },
        // Phase 4: Session validation results (mapped to UI types)
        validation: {
          isValid: validation.isValid,
          flags: validation.flags,
          warnings: validation.flags.map((f: string) => `Session flagged: ${f}`),
          confidence: validation.confidence,
          adjustedDuration: validation.wasAdjusted ? validation.suggestedDuration : undefined,
        },
        // Phase 4: Focus drift analysis (mapped to UI types)
        focusDrift: {
          overallDrift: focusDrift.driftDirection,
          driftSeverity: focusDrift.driftSeverity,
          recommendations: focusDrift.recommendations,
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
