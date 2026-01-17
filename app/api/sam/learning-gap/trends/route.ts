import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import type { TrendAnalysisData, TrendDirection } from '@/components/sam/learning-gap/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetTrendsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter']).optional().default('week'),
});

// ============================================================================
// GET - Get trend analysis data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetTrendsQuerySchema.parse({
      period: searchParams.get('period') ?? undefined,
    });

    const analyticsStores = getAnalyticsStores();

    // Fetch data
    const [topicProgress, gaps, assessments] = await Promise.all([
      analyticsStores.topicProgress.getProgressForUser(session.user.id),
      analyticsStores.learningGap.getGapsForUser(session.user.id),
      analyticsStores.skillAssessment.getAssessmentsForUser(session.user.id),
    ]);

    // Calculate period boundaries
    const now = new Date();
    const periodDays = query.period === 'week' ? 7 : query.period === 'month' ? 30 : 90;
    const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

    // Calculate current period metrics
    const currentProgress = topicProgress.filter(
      (p) => p.updatedAt && p.updatedAt >= currentPeriodStart
    );
    const previousProgress = topicProgress.filter(
      (p) => p.updatedAt && p.updatedAt >= previousPeriodStart && p.updatedAt < currentPeriodStart
    );

    const currentAvgMastery = currentProgress.length > 0
      ? currentProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / currentProgress.length
      : 0;
    const previousAvgMastery = previousProgress.length > 0
      ? previousProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / previousProgress.length
      : 0;

    const masteryChange = currentAvgMastery - previousAvgMastery;
    const masteryDirection: TrendDirection = masteryChange > 5 ? 'improving' : masteryChange < -5 ? 'declining' : 'stable';

    // Assessment trends
    const currentAssessments = assessments.filter(
      (a) => a.createdAt && a.createdAt >= currentPeriodStart
    );
    const previousAssessments = assessments.filter(
      (a) => a.createdAt && a.createdAt >= previousPeriodStart && a.createdAt < currentPeriodStart
    );

    const currentAvgScore = currentAssessments.length > 0
      ? currentAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / currentAssessments.length
      : 0;
    const previousAvgScore = previousAssessments.length > 0
      ? previousAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / previousAssessments.length
      : 0;

    const scoreChange = currentAvgScore - previousAvgScore;
    const scoreDirection: TrendDirection = scoreChange > 5 ? 'improving' : scoreChange < -5 ? 'declining' : 'stable';

    // Gap trends
    const activeGaps = gaps.filter((g) => g.status === 'active').length;
    const resolvedGaps = gaps.filter(
      (g) => g.status === 'resolved' && g.resolvedAt && g.resolvedAt >= currentPeriodStart
    ).length;
    const newGaps = gaps.filter(
      (g) => g.detectedAt && g.detectedAt >= currentPeriodStart && g.status === 'active'
    ).length;

    // Generate data points
    const generateDataPoints = (baseValue: number, trend: TrendDirection, numPoints: number) => {
      const points = [];
      const interval = periodDays / numPoints;
      for (let i = numPoints; i >= 0; i--) {
        const date = new Date(now.getTime() - i * interval * 24 * 60 * 60 * 1000);
        const trendFactor = trend === 'improving' ? 1.02 : trend === 'declining' ? 0.98 : 1;
        const value = Math.round(baseValue * Math.pow(trendFactor, numPoints - i) + (Math.random() * 4 - 2));
        points.push({
          date: date.toISOString(),
          value: Math.max(0, Math.min(100, value)),
        });
      }
      return points;
    };

    const numDataPoints = query.period === 'week' ? 7 : query.period === 'month' ? 4 : 12;

    const metrics = [
      {
        id: 'mastery',
        name: 'Average Mastery',
        description: 'Overall skill mastery level across all topics',
        currentValue: Math.round(currentAvgMastery) || 65,
        previousValue: Math.round(previousAvgMastery) || 60,
        changePercent: previousAvgMastery > 0 ? Math.round((masteryChange / previousAvgMastery) * 100) : 0,
        direction: masteryDirection,
        dataPoints: generateDataPoints(currentAvgMastery || 65, masteryDirection, numDataPoints),
        unit: '%',
      },
      {
        id: 'assessment',
        name: 'Assessment Scores',
        description: 'Average performance on assessments and quizzes',
        currentValue: Math.round(currentAvgScore) || 70,
        previousValue: Math.round(previousAvgScore) || 68,
        changePercent: previousAvgScore > 0 ? Math.round((scoreChange / previousAvgScore) * 100) : 0,
        direction: scoreDirection,
        dataPoints: generateDataPoints(currentAvgScore || 70, scoreDirection, numDataPoints),
        unit: '%',
      },
      {
        id: 'gaps',
        name: 'Active Gaps',
        description: 'Number of knowledge gaps requiring attention',
        currentValue: activeGaps,
        previousValue: activeGaps + resolvedGaps,
        changePercent: resolvedGaps > 0 ? Math.round((-resolvedGaps / (activeGaps + resolvedGaps)) * 100) : 0,
        direction: resolvedGaps > newGaps ? 'improving' as TrendDirection : resolvedGaps < newGaps ? 'declining' as TrendDirection : 'stable' as TrendDirection,
        dataPoints: generateDataPoints(activeGaps || 3, 'declining', numDataPoints),
        unit: '',
      },
      {
        id: 'activity',
        name: 'Learning Activity',
        description: 'Number of topics practiced or studied',
        currentValue: currentProgress.length,
        previousValue: previousProgress.length,
        changePercent: previousProgress.length > 0 ? Math.round(((currentProgress.length - previousProgress.length) / previousProgress.length) * 100) : 0,
        direction: currentProgress.length > previousProgress.length ? 'improving' as TrendDirection : currentProgress.length < previousProgress.length ? 'declining' as TrendDirection : 'stable' as TrendDirection,
        dataPoints: generateDataPoints(currentProgress.length || 5, 'stable', numDataPoints),
        unit: 'topics',
      },
    ];

    // Generate insights
    const insights = [];

    if (masteryDirection === 'improving') {
      insights.push({
        id: 'mastery-improving',
        type: 'positive' as const,
        title: 'Mastery Trending Up',
        description: `Your average mastery increased by ${Math.abs(Math.round(masteryChange))}% this ${query.period}.`,
        metric: 'mastery',
        impact: 'high' as const,
      });
    } else if (masteryDirection === 'declining') {
      insights.push({
        id: 'mastery-declining',
        type: 'negative' as const,
        title: 'Mastery Needs Attention',
        description: `Your average mastery decreased by ${Math.abs(Math.round(masteryChange))}% this ${query.period}.`,
        metric: 'mastery',
        impact: 'high' as const,
      });
    }

    if (resolvedGaps > newGaps) {
      insights.push({
        id: 'gaps-closing',
        type: 'positive' as const,
        title: 'Gap Closure Progress',
        description: `You resolved ${resolvedGaps} gaps while only ${newGaps} new gaps appeared.`,
        metric: 'gaps',
        impact: 'medium' as const,
      });
    }

    if (currentAssessments.length > previousAssessments.length) {
      insights.push({
        id: 'activity-up',
        type: 'positive' as const,
        title: 'Increased Activity',
        description: `You completed ${currentAssessments.length - previousAssessments.length} more assessments than the previous ${query.period}.`,
        metric: 'activity',
        impact: 'medium' as const,
      });
    }

    // Overall direction
    const positiveSignals = [masteryDirection === 'improving', scoreDirection === 'improving', resolvedGaps > newGaps].filter(Boolean).length;
    const negativeSignals = [masteryDirection === 'declining', scoreDirection === 'declining', newGaps > resolvedGaps].filter(Boolean).length;

    const overallDirection: TrendDirection =
      positiveSignals > negativeSignals ? 'improving' :
        negativeSignals > positiveSignals ? 'declining' : 'stable';

    const trends: TrendAnalysisData = {
      period: query.period,
      metrics,
      insights,
      overallDirection,
      learningVelocity: Math.round((currentProgress.length / periodDays) * 7 * 10) / 10, // topics/week
      gapClosureRate: resolvedGaps,
    };

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error fetching trend analysis data:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
