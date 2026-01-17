import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createProgressAnalyzer, TimePeriod, type ProgressReport } from '@sam-ai/agentic';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';

export type RollupPeriod = 'daily' | 'weekly' | 'monthly';

const periodMap: Record<RollupPeriod, TimePeriod> = {
  daily: TimePeriod.DAILY,
  weekly: TimePeriod.WEEKLY,
  monthly: TimePeriod.MONTHLY,
};

const analyticsPeriodMap: Record<RollupPeriod, 'DAILY' | 'WEEKLY' | 'MONTHLY'> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

const metricType = 'LEARNING_VELOCITY' as const;
const contextMarker = 'PROGRESS_ROLLUP';

let progressAnalyzerInstance: ReturnType<typeof createProgressAnalyzer> | null = null;

function getProgressAnalyzer() {
  if (!progressAnalyzerInstance) {
    const { learningSession, topicProgress, learningGap } = getAnalyticsStores();
    progressAnalyzerInstance = createProgressAnalyzer({
      logger,
      sessionStore: learningSession,
      progressStore: topicProgress,
      gapStore: learningGap,
    });
  }
  return progressAnalyzerInstance;
}

function buildRollupContext(report: ProgressReport, period: RollupPeriod) {
  return {
    marker: contextMarker,
    period,
    generatedAt: report.generatedAt.toISOString(),
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    summary: report.summary,
    topics: report.topicBreakdown.slice(0, 5).map((topic) => ({
      topicId: topic.topicId,
      topicName: topic.topicName,
      masteryScore: topic.masteryScore,
      timeSpent: topic.timeSpent,
      trend: topic.trend,
    })),
    gaps: report.gaps.slice(0, 5).map((gap) => ({
      conceptId: gap.conceptId,
      conceptName: gap.conceptName,
      severity: gap.severity,
    })),
    achievements: report.achievements.slice(0, 5).map((achievement) => ({
      title: achievement.title,
      description: achievement.description,
    })),
    recommendations: report.recommendations.slice(0, 5),
  };
}

export async function generateProgressRollup(userId: string, period: RollupPeriod) {
  const analyzer = getProgressAnalyzer();
  const report = await analyzer.generateReport(userId, periodMap[period]);
  const metricValue = Number.isFinite(report.summary.overallMastery)
    ? report.summary.overallMastery
    : 0;

  const analytics = await db.sAMAnalytics.create({
    data: {
      userId,
      metricType,
      metricValue,
      period: analyticsPeriodMap[period],
      context: buildRollupContext(report, period),
      recordedAt: new Date(),
    },
  });

  return { report, analyticsId: analytics.id };
}
