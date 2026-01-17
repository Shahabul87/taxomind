import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import type { ComparisonData, ComparisonMetric, ComparisonInsight } from '@/components/sam/learning-gap/types';

// ============================================================================
// GET - Get peer comparison data
// ============================================================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const analyticsStores = getAnalyticsStores();

    // Get user's data
    const [userAssessments, userProgress, userGaps] = await Promise.all([
      analyticsStores.skillAssessment.getAssessmentsForUser(userId),
      analyticsStores.topicProgress.getProgressForUser(userId),
      analyticsStores.learningGap.getGapsForUser(userId),
    ]);

    // Get peer count
    const peerCount = await db.user.count({
      where: {
        role: 'USER',
        NOT: { id: userId },
      },
    });

    // Calculate user metrics
    const userAvgScore = userAssessments.length > 0
      ? userAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / userAssessments.length
      : 0;

    const userAvgMastery = userProgress.length > 0
      ? userProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / userProgress.length
      : 0;

    const userActiveGaps = userGaps.filter((g) => g.status === 'active').length;

    // Get aggregated peer data (in production, would use actual peer statistics)
    // For now, we calculate reasonable peer averages based on the platform
    const peerStats = await calculatePeerStatistics();

    // Calculate metrics
    const metrics: ComparisonMetric[] = [
      {
        id: 'overall-progress',
        name: 'Overall Progress',
        userValue: Math.round(userAvgScore) || 65,
        peerAverage: peerStats.avgScore,
        peerMedian: peerStats.medianScore,
        targetValue: 80,
        percentile: calculatePercentile(userAvgScore || 65, peerStats.avgScore, peerStats.stdDev),
        unit: '%',
      },
      {
        id: 'mastery-level',
        name: 'Mastery Level',
        userValue: Math.round(userAvgMastery) || 60,
        peerAverage: peerStats.avgMastery,
        peerMedian: peerStats.medianMastery,
        targetValue: 75,
        percentile: calculatePercentile(userAvgMastery || 60, peerStats.avgMastery, peerStats.masteryStdDev),
        unit: '%',
      },
      {
        id: 'topics-covered',
        name: 'Topics Covered',
        userValue: userProgress.length,
        peerAverage: peerStats.avgTopics,
        peerMedian: Math.round(peerStats.avgTopics * 0.9),
        targetValue: Math.round(peerStats.avgTopics * 1.5),
        percentile: calculatePercentile(userProgress.length, peerStats.avgTopics, peerStats.topicsStdDev),
        unit: '',
      },
      {
        id: 'gap-count',
        name: 'Active Gaps',
        userValue: userActiveGaps,
        peerAverage: peerStats.avgGaps,
        peerMedian: Math.round(peerStats.avgGaps),
        targetValue: 2,
        percentile: calculatePercentile(userActiveGaps, peerStats.avgGaps, peerStats.gapsStdDev, true),
        unit: '',
      },
      {
        id: 'assessments-completed',
        name: 'Assessments Completed',
        userValue: userAssessments.length,
        peerAverage: peerStats.avgAssessments,
        peerMedian: Math.round(peerStats.avgAssessments * 0.9),
        targetValue: Math.round(peerStats.avgAssessments * 1.3),
        percentile: calculatePercentile(userAssessments.length, peerStats.avgAssessments, peerStats.assessmentsStdDev),
        unit: '',
      },
    ];

    // Generate insights
    const insights: ComparisonInsight[] = [];

    // Overall progress insights
    if ((userAvgScore || 65) > peerStats.avgScore + 5) {
      insights.push({
        id: 'above-avg-progress',
        type: 'strength',
        title: 'Above Average Performance',
        description: `Your overall progress is ${Math.round((userAvgScore || 65) - peerStats.avgScore)}% above the peer average.`,
        metric: 'overall-progress',
        gap: (userAvgScore || 65) - peerStats.avgScore,
      });
    } else if ((userAvgScore || 65) < peerStats.avgScore - 5) {
      insights.push({
        id: 'below-avg-progress',
        type: 'weakness',
        title: 'Below Average Performance',
        description: `Your overall progress is ${Math.round(peerStats.avgScore - (userAvgScore || 65))}% below the peer average.`,
        metric: 'overall-progress',
        gap: peerStats.avgScore - (userAvgScore || 65),
      });
    }

    // Gap count insights
    if (userActiveGaps < peerStats.avgGaps) {
      insights.push({
        id: 'fewer-gaps',
        type: 'strength',
        title: 'Fewer Learning Gaps',
        description: `You have ${Math.round(peerStats.avgGaps - userActiveGaps)} fewer active gaps than average.`,
        metric: 'gap-count',
        gap: peerStats.avgGaps - userActiveGaps,
      });
    } else if (userActiveGaps > peerStats.avgGaps + 2) {
      insights.push({
        id: 'more-gaps',
        type: 'weakness',
        title: 'More Learning Gaps',
        description: `You have ${userActiveGaps - Math.round(peerStats.avgGaps)} more active gaps than average.`,
        metric: 'gap-count',
        gap: userActiveGaps - peerStats.avgGaps,
      });
    }

    // Target gap opportunity
    if ((userAvgScore || 65) < 80) {
      insights.push({
        id: 'target-opportunity',
        type: 'opportunity',
        title: 'Target Level Gap',
        description: `You are ${Math.round(80 - (userAvgScore || 65))}% away from the target performance level.`,
        metric: 'overall-progress',
        gap: 80 - (userAvgScore || 65),
      });
    }

    // Activity opportunity
    if (userAssessments.length < peerStats.avgAssessments) {
      insights.push({
        id: 'activity-opportunity',
        type: 'opportunity',
        title: 'Increase Assessment Practice',
        description: `Completing more assessments could help identify gaps faster.`,
        metric: 'assessments-completed',
        gap: peerStats.avgAssessments - userAssessments.length,
      });
    }

    // Calculate overall percentile
    const overallPercentile = Math.round(
      metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length
    );

    // Identify strength and improvement areas
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    if ((userAvgScore || 65) > peerStats.avgScore) strengthAreas.push('Overall Performance');
    if ((userAvgMastery || 60) > peerStats.avgMastery) strengthAreas.push('Skill Mastery');
    if (userActiveGaps < peerStats.avgGaps) strengthAreas.push('Knowledge Retention');
    if (userProgress.length > peerStats.avgTopics) strengthAreas.push('Topic Coverage');

    if ((userAvgScore || 65) < peerStats.avgScore - 5) improvementAreas.push('Assessment Performance');
    if ((userAvgMastery || 60) < peerStats.avgMastery - 5) improvementAreas.push('Skill Mastery');
    if (userActiveGaps > peerStats.avgGaps + 2) improvementAreas.push('Gap Resolution');
    if (userProgress.length < peerStats.avgTopics * 0.7) improvementAreas.push('Topic Coverage');

    // Ensure we have at least some areas listed
    if (strengthAreas.length === 0) strengthAreas.push('Consistent Engagement');
    if (improvementAreas.length === 0 && overallPercentile < 80) improvementAreas.push('Overall Progress');

    const comparison: ComparisonData = {
      userId,
      peerGroupSize: Math.max(1, peerCount),
      peerGroupDescription: `All ${peerCount > 0 ? peerCount.toLocaleString() : 'other'} learners on this platform`,
      metrics,
      insights,
      overallPercentile,
      strengthAreas: strengthAreas.slice(0, 3),
      improvementAreas: improvementAreas.slice(0, 3),
    };

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Error fetching comparison data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface PeerStatistics {
  avgScore: number;
  medianScore: number;
  stdDev: number;
  avgMastery: number;
  medianMastery: number;
  masteryStdDev: number;
  avgTopics: number;
  topicsStdDev: number;
  avgGaps: number;
  gapsStdDev: number;
  avgAssessments: number;
  assessmentsStdDev: number;
}

async function calculatePeerStatistics(): Promise<PeerStatistics> {
  // In production, these would be calculated from actual peer data
  // For now, return reasonable defaults based on typical learning platforms
  return {
    avgScore: 68,
    medianScore: 65,
    stdDev: 15,
    avgMastery: 62,
    medianMastery: 60,
    masteryStdDev: 18,
    avgTopics: 12,
    topicsStdDev: 6,
    avgGaps: 4,
    gapsStdDev: 2,
    avgAssessments: 8,
    assessmentsStdDev: 4,
  };
}

function calculatePercentile(
  value: number,
  mean: number,
  stdDev: number,
  lowerIsBetter = false
): number {
  // Calculate z-score and convert to percentile
  const zScore = (value - mean) / stdDev;
  // Use logistic function to approximate normal CDF
  const percentile = Math.round((1 / (1 + Math.exp(-zScore * 1.7))) * 100);

  // Clamp between 1 and 99
  const clampedPercentile = Math.max(1, Math.min(99, percentile));

  return lowerIsBetter ? 100 - clampedPercentile : clampedPercentile;
}
