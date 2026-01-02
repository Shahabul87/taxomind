/**
 * SAM Agentic Analytics Progress API
 * Retrieves learning progress reports
 *
 * Phase 5: Frontend Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface GoalProgress {
  goalId: string;
  goalTitle: string;
  progressDelta: number;
  currentProgress: number;
}

interface ProgressReport {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalStudyTime: number;
  sessionsCompleted: number;
  topicsStudied: string[];
  skillsImproved: string[];
  goalsProgress: GoalProgress[];
  strengths: string[];
  areasForImprovement: string[];
  streak: number;
  generatedAt: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
});

// ============================================================================
// HELPERS
// ============================================================================

function getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      now.setHours(0, 0, 0, 0);
      return now;
    case 'weekly':
      const dayOfWeek = now.getDay();
      now.setDate(now.getDate() - dayOfWeek);
      now.setHours(0, 0, 0, 0);
      return now;
    case 'monthly':
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      return now;
  }
}

async function calculateStudyStreak(userId: string): Promise<number> {
  // Get daily activity for the past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activities = await db.sAMInteraction.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (activities.length === 0) return 0;

  // Group by date
  const activityDates = new Set<string>();
  for (const a of activities) {
    activityDates.add(a.createdAt.toISOString().split('T')[0]);
  }

  // Count consecutive days from today
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (activityDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // Allow missing today (streak continues from yesterday)
      break;
    }
  }

  return streak;
}

async function getGoalsProgress(
  userId: string,
  periodStart: Date
): Promise<GoalProgress[]> {
  // Try to get LearningGoal data if model exists
  try {
    const goals = await (db as unknown as {
      learningGoal: {
        findMany: (args: unknown) => Promise<{ id: string; title: string; progress: number }[]>
      }
    }).learningGoal.findMany({
      where: {
        userId,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        progress: true,
      },
    });

    // For now, assume +5% progress per period as placeholder
    return goals.map((g) => ({
      goalId: g.id,
      goalTitle: g.title,
      progressDelta: 5, // Placeholder - would need historical data
      currentProgress: g.progress,
    }));
  } catch {
    return [];
  }
}

async function analyzeStrengthsAndWeaknesses(
  userId: string,
  periodStart: Date
): Promise<{ strengths: string[]; weaknesses: string[] }> {
  // Analyze SAM interactions to find patterns
  const interactions = await db.sAMInteraction.findMany({
    where: {
      userId,
      createdAt: { gte: periodStart },
    },
    select: {
      context: true,
      success: true,
    },
  });

  // Extract topics from context
  const topicScores = new Map<string, number[]>();

  for (const interaction of interactions) {
    const ctx = interaction.context as Record<string, unknown> | null;
    if (!ctx) continue;

    const topic = ctx.topic as string;
    const score = ctx.score as number;

    if (topic && typeof score === 'number') {
      const scores = topicScores.get(topic) || [];
      scores.push(score);
      topicScores.set(topic, scores);
    }
  }

  // Calculate averages and classify
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [topic, scores] of topicScores) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 80) {
      strengths.push(topic);
    } else if (avg < 50) {
      weaknesses.push(topic);
    }
  }

  return { strengths: strengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5) };
}

// ============================================================================
// GET /api/sam/agentic/analytics/progress
// Get progress report for the specified period
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      period: searchParams.get('period'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const periodStart = getPeriodStart(period);

    // Get SAM interactions for the period
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        context: true,
        duration: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get completed chapters for the period
    const completedProgress = await db.user_progress.findMany({
      where: {
        userId: user.id,
        isCompleted: true,
        updatedAt: { gte: periodStart },
      },
      include: {
        Chapter: {
          select: { title: true },
        },
      },
    });

    // Calculate metrics
    const sessionsCompleted = interactions.length;

    // Estimate study time from processing times (in minutes)
    // Assuming average session length of 10-15 minutes
    const totalStudyTime = Math.max(
      sessionsCompleted * 10,
      Math.round(interactions.reduce((sum, i) => sum + (i.duration || 0), 0) / 60000)
    );

    // Extract unique topics
    const topicsSet = new Set<string>();
    for (const interaction of interactions) {
      const ctx = interaction.context as Record<string, unknown> | null;
      if (ctx?.topic) {
        topicsSet.add(ctx.topic as string);
      }
    }
    const topicsStudied = Array.from(topicsSet);

    // Get skills that improved
    const skillsImproved = completedProgress.map((p) => p.Chapter?.title).filter(Boolean) as string[];

    // Get goals progress
    const goalsProgress = await getGoalsProgress(user.id, periodStart);

    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = await analyzeStrengthsAndWeaknesses(user.id, periodStart);

    // Calculate streak
    const streak = await calculateStudyStreak(user.id);

    const report: ProgressReport = {
      userId: user.id,
      period,
      totalStudyTime,
      sessionsCompleted,
      topicsStudied,
      skillsImproved: skillsImproved.slice(0, 10),
      goalsProgress,
      strengths,
      areasForImprovement: weaknesses,
      streak,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[SAM Analytics Progress] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate progress report' },
      { status: 500 }
    );
  }
}
