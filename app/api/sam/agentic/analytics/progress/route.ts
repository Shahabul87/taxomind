/**
 * SAM Agentic Analytics Progress API
 * Retrieves learning progress reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createProgressAnalyzer,
  type ProgressReport,
  TimePeriod,
} from '@sam-ai/agentic';
import {
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
} from '@/lib/sam/stores';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
});

// ============================================================================
// LAZY SINGLETON
// ============================================================================

let progressAnalyzerInstance: ReturnType<typeof createProgressAnalyzer> | null = null;

function getProgressAnalyzer() {
  if (!progressAnalyzerInstance) {
    progressAnalyzerInstance = createProgressAnalyzer({
      logger,
      sessionStore: createPrismaLearningSessionStore(),
      progressStore: createPrismaTopicProgressStore(),
      gapStore: createPrismaLearningGapStore(),
    });
  }
  return progressAnalyzerInstance;
}

const periodMap: Record<'daily' | 'weekly' | 'monthly', TimePeriod> = {
  daily: TimePeriod.DAILY,
  weekly: TimePeriod.WEEKLY,
  monthly: TimePeriod.MONTHLY,
};

function mapProgressReport(report: ProgressReport, period: 'daily' | 'weekly' | 'monthly') {
  const strengths = report.topicBreakdown
    .filter((topic) => topic.masteryScore >= 70)
    .slice(0, 5)
    .map((topic) => topic.topicName);

  const areasForImprovement = report.topicBreakdown
    .filter((topic) => topic.masteryScore < 50)
    .slice(0, 5)
    .map((topic) => topic.topicName);

  return {
    userId: report.userId,
    period,
    totalStudyTime: report.summary.totalTimeSpent,
    sessionsCompleted: report.summary.topicsCompleted,
    topicsStudied: report.topicBreakdown.map((topic) => topic.topicName),
    skillsImproved: report.achievements.map((achievement) => achievement.title),
    goalsProgress: [],
    strengths,
    areasForImprovement,
    streak: report.summary.currentStreak,
    generatedAt: report.generatedAt.toISOString(),
  };
}

// ============================================================================
// GET /api/sam/agentic/analytics/progress
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
    const analyzer = getProgressAnalyzer();
    const report = await analyzer.generateReport(user.id, periodMap[period]);

    return NextResponse.json({
      success: true,
      data: mapProgressReport(report, period),
    });
  } catch (error) {
    logger.error('Error generating progress report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate progress report' },
      { status: 500 }
    );
  }
}
