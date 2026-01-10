/**
 * SAM Check-In Trigger Evaluation API
 * Evaluates trigger conditions and returns check-ins that should be triggered
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';
import { createCheckInScheduler, NotificationChannel } from '@sam-ai/agentic';
import type { UserContext } from '@sam-ai/agentic';

// Lazy initialize check-in scheduler using TaxomindContext
let checkInSchedulerInstance: ReturnType<typeof createCheckInScheduler> | null = null;

function getCheckInScheduler() {
  if (!checkInSchedulerInstance) {
    checkInSchedulerInstance = createCheckInScheduler({
      store: getStore('checkIn'),
      logger: console,
      defaultChannel: NotificationChannel.IN_APP,
    });
  }
  return checkInSchedulerInstance;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UserContextSchema = z.object({
  lastSessionAt: z.string().datetime().optional(),
  currentStreak: z.number().int().min(0).optional(),
  streakAtRisk: z.boolean().optional(),
  masteryScore: z.number().min(0).max(1).optional(),
  masteryTrend: z.enum(['improving', 'stable', 'declining']).optional(),
  frustrationLevel: z.number().min(0).max(1).optional(),
  goalProgress: z.number().min(0).max(100).optional(),
  goalDeadline: z.string().datetime().optional(),
  lastAssessmentPassed: z.boolean().optional(),
  daysSinceLastSession: z.number().int().min(0).optional(),
});

// ============================================================================
// POST - Evaluate triggers and return triggered check-ins
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let userContext: UserContext;

    if (Object.keys(body).length > 0) {
      // Use provided context
      const validated = UserContextSchema.parse(body);
      userContext = {
        userId: session.user.id,
        lastSessionAt: validated.lastSessionAt
          ? new Date(validated.lastSessionAt)
          : undefined,
        currentStreak: validated.currentStreak,
        streakAtRisk: validated.streakAtRisk,
        masteryScore: validated.masteryScore,
        masteryTrend: validated.masteryTrend,
        frustrationLevel: validated.frustrationLevel,
        goalProgress: validated.goalProgress,
        goalDeadline: validated.goalDeadline
          ? new Date(validated.goalDeadline)
          : undefined,
        lastAssessmentPassed: validated.lastAssessmentPassed,
        daysSinceLastSession: validated.daysSinceLastSession,
      };
    } else {
      // Build context from database
      userContext = await buildUserContext(session.user.id);
    }

    const checkInScheduler = getCheckInScheduler();
    const triggeredCheckIns = await checkInScheduler.evaluateTriggers(
      session.user.id,
      userContext
    );

    // Execute triggered check-ins if any
    const executedResults = [];
    for (const triggered of triggeredCheckIns) {
      if (triggered.urgency === 'immediate') {
        const result = await checkInScheduler.executeCheckIn(triggered.checkInId);
        executedResults.push(result);
      }
    }

    logger.info(
      `Evaluated triggers for user ${session.user.id}: ${triggeredCheckIns.length} triggered, ${executedResults.length} executed`
    );

    return NextResponse.json({
      success: true,
      data: {
        triggered: triggeredCheckIns,
        executed: executedResults,
        context: userContext,
      },
    });
  } catch (error) {
    logger.error('Error evaluating check-in triggers:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid context data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to evaluate triggers' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function buildUserContext(userId: string): Promise<UserContext> {
  // Get streak info
  const streak = await db.sAMStreak.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  // Get last interaction (as proxy for last session)
  const lastSession = await db.sAMInteraction.findFirst({
    where: {
      userId,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate days since last session
  const daysSinceLastSession = lastSession
    ? Math.floor(
        (Date.now() - lastSession.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )
    : undefined;

  // Get mastery score from learning profile
  const profile = await db.sAMLearningProfile.findUnique({
    where: { userId },
  });

  // Note: SAMLearningGoal model doesn't exist in the schema
  // Goal progress tracking would need to be implemented via SAMAnalytics or a dedicated table
  const activeGoal = null;

  // Note: ASSESSMENT_RESULT is not a valid SAMInteractionType
  // Assessment results would need to be tracked differently
  const lastAssessmentPassed = undefined;

  // Calculate streak at risk
  const streakAtRisk =
    streak && daysSinceLastSession !== undefined && daysSinceLastSession >= 1;

  return {
    userId,
    lastSessionAt: lastSession?.createdAt,
    currentStreak: streak?.currentStreak ?? 0,
    streakAtRisk: streakAtRisk ?? false,
    masteryScore: profile?.preferences
      ? (profile.preferences as Record<string, unknown>).masteryScore as number | undefined
      : undefined,
    masteryTrend: undefined, // Would need historical data to calculate
    frustrationLevel: undefined, // Would need behavior analysis
    goalProgress: undefined, // Goal tracking not yet implemented
    goalDeadline: undefined, // Goal tracking not yet implemented
    lastAssessmentPassed,
    daysSinceLastSession,
  };
}
