import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getAnalyticsStores, getStore } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import {
  ContentType,
  RecommendationPriority,
  RecommendationReason,
} from '@sam-ai/agentic';
import type {
  LearningGapDashboardData,
  LearningGapData,
  LearningGapEvidence,
  GapAction,
  SkillDecayData,
  TrendAnalysisData,
  GapRecommendation,
  ComparisonData,
  GapSummary,
  GapSeverity,
  DecayRiskLevel,
  TrendDirection,
} from '@/components/sam/learning-gap/types';

// ============================================================================
// GET - Aggregate all learning gap dashboard data
// ============================================================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    logger.info('[LearningGap] Fetching data for user:', { userId });

    // Get stores from TaxomindContext
    let analyticsStores;
    let skillBuildTrackStore;
    try {
      analyticsStores = getAnalyticsStores();
      skillBuildTrackStore = getStore('skillBuildTrack');
      logger.info('[LearningGap] Stores initialized successfully');
    } catch (storeError) {
      logger.error('[LearningGap] Failed to initialize stores:', storeError);
      return NextResponse.json(
        { error: 'Failed to initialize data stores' },
        { status: 500 }
      );
    }

    // Fetch data in parallel with individual error handling
    let learningGaps: Awaited<ReturnType<typeof analyticsStores.learningGap.getByUser>> = [];
    let skillBuildProfiles: Awaited<ReturnType<typeof skillBuildTrackStore.getUserSkillProfiles>> = [];
    let topicProgressData: Awaited<ReturnType<typeof analyticsStores.topicProgress.getByUser>> = [];
    let skillAssessments: Awaited<ReturnType<typeof analyticsStores.skillAssessment.getByUser>> = [];
    let recommendations: Awaited<ReturnType<typeof analyticsStores.recommendation.getByUser>> = [];

    try {
      // Fetch learning gaps
      learningGaps = await analyticsStores.learningGap.getByUser(userId);
      logger.info('[LearningGap] Fetched learning gaps:', { count: learningGaps.length });
    } catch (gapError) {
      logger.error('[LearningGap] Error fetching learning gaps:', gapError);
    }

    try {
      // Fetch skill build profiles
      skillBuildProfiles = await skillBuildTrackStore.getUserSkillProfiles(userId);
      logger.info('[LearningGap] Fetched skill profiles:', { count: skillBuildProfiles.length });
    } catch (profileError) {
      logger.error('[LearningGap] Error fetching skill profiles:', profileError);
    }

    try {
      // Fetch topic progress
      topicProgressData = await analyticsStores.topicProgress.getByUser(userId);
      logger.info('[LearningGap] Fetched topic progress:', { count: topicProgressData.length });
    } catch (progressError) {
      logger.error('[LearningGap] Error fetching topic progress:', progressError);
    }

    try {
      // Fetch skill assessments
      skillAssessments = await analyticsStores.skillAssessment.getByUser(userId);
      logger.info('[LearningGap] Fetched skill assessments:', { count: skillAssessments.length });
    } catch (assessmentError) {
      logger.error('[LearningGap] Error fetching skill assessments:', assessmentError);
    }

    try {
      // Fetch recommendations
      recommendations = await analyticsStores.recommendation.getByUser(userId, 10);
      logger.info('[LearningGap] Fetched recommendations:', { count: recommendations.length });
    } catch (recError) {
      logger.error('[LearningGap] Error fetching recommendations:', recError);
    }

    // Transform learning gaps - map from store format to dashboard format
    const gaps: LearningGapData[] = learningGaps.map((gap) => ({
      id: gap.id,
      skillId: gap.conceptId ?? '',
      skillName: gap.conceptName ?? 'Unknown Skill',
      topicId: gap.topicId ?? undefined,
      topicName: gap.conceptName ?? undefined,
      severity: mapSeverity(gap.severity ?? 'moderate'),
      status: gap.isResolved ? 'resolved' : 'active',
      gapScore: 50, // Default gap score
      masteryLevel: 0, // Will be enriched from assessments if available
      targetMasteryLevel: 80,
      evidence: (gap.evidence ?? []).map((e) => ({
        type: ('type' in e ? String(e.type) : 'assessment') as LearningGapEvidence['type'],
        score: ('score' in e ? Number(e.score) : 0),
        expectedScore: ('expectedScore' in e ? Number((e as Record<string, unknown>).expectedScore) : 0),
        date: ('timestamp' in e ? new Date(e.timestamp).toISOString() : new Date().toISOString()),
        source: ('description' in e ? String(e.description) : 'Unknown'),
      } satisfies LearningGapEvidence)),
      suggestedActions: (gap.suggestedActions ?? []).map((action) => ({
        id: crypto.randomUUID(),
        type: 'review' as const,
        title: typeof action === 'string' ? action : String(action),
        description: '',
        estimatedTime: 30,
        priority: 'medium' as const,
        resourceUrl: undefined,
      } satisfies GapAction)),
      detectedAt: gap.detectedAt?.toISOString() ?? new Date().toISOString(),
      lastUpdated: gap.detectedAt?.toISOString() ?? new Date().toISOString(),
      resolvedAt: gap.resolvedAt?.toISOString(),
    }));

    // Calculate skill decay data from skillBuildProfiles
    const decayData: SkillDecayData[] = skillBuildProfiles
      .filter((profile) => profile.lastPracticedAt)
      .map((profile) => {
        const daysSince = getDaysSince(profile.lastPracticedAt);
        // Use compositeScore or dimensions.mastery for mastery level
        const masteryLevel = profile.compositeScore ?? profile.dimensions?.mastery ?? 0;
        const decayRate = calculateDecayRate(masteryLevel);
        const riskLevel = calculateRiskLevel(daysSince, decayRate);

        return {
          skillId: profile.skillId,
          skillName: profile.skill?.name ?? 'Unknown Skill',
          currentMastery: masteryLevel,
          riskLevel,
          daysSinceLastPractice: daysSince,
          decayRate,
          predictedDecayDate: calculateDecayDate(masteryLevel, decayRate),
          predictions: generateDecayPredictions(masteryLevel, decayRate),
          lastPracticedAt: profile.lastPracticedAt?.toISOString() ?? new Date().toISOString(),
          reviewDeadline: daysSince > 7 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };
      })
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      })
      .slice(0, 10);

    // Calculate trend analysis - transform data to expected format
    const transformedTopicProgress = topicProgressData.map((p) => ({
      mastery: p.masteryScore,
      updatedAt: p.lastAccessedAt,
      topicId: p.topicId,
    }));
    const transformedAssessments = skillAssessments.map((a) => ({
      score: a.score,
      createdAt: a.assessedAt,
    }));
    const trends = calculateTrendAnalysis(transformedTopicProgress, gaps, transformedAssessments);

    // Transform recommendations - map from store Recommendation type to GapRecommendation
    const gapRecommendations: GapRecommendation[] = recommendations.map((rec) => ({
      id: rec.id,
      gapId: rec.targetConceptId ?? rec.targetSkillId ?? '',
      type: mapRecommendationTypeFromEnum(rec.type),
      title: rec.title ?? 'Learning Recommendation',
      description: rec.description ?? '',
      reason: mapRecommendationReasonToString(rec.reason),
      expectedImpact: 15, // Default value - not stored in Recommendation
      difficulty: mapDifficultyFromEnum(rec.difficulty),
      estimatedTime: rec.estimatedDuration ?? 30,
      priority: mapPriorityFromEnum(rec.priority),
      resourceUrl: rec.resourceUrl ?? undefined,
      resourceType: rec.resourceId ? 'article' : undefined,
      prerequisites: rec.prerequisites ?? [],
    }));

    // Calculate comparison data (pass active gap count for real comparison)
    const activeGapCount = gaps.filter((g) => g.status === 'active').length;
    const comparison = await calculateComparisonData(userId, skillAssessments, activeGapCount);

    // Calculate summary
    const summary = calculateSummary(gaps);

    const dashboardData: LearningGapDashboardData = {
      gaps,
      decayData,
      trends,
      recommendations: gapRecommendations,
      comparison,
      summary,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error fetching learning gap dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning gap data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapSeverity(severity: number | string): GapSeverity {
  if (typeof severity === 'string') {
    if (severity === 'critical' || severity === 'moderate' || severity === 'minor') {
      return severity;
    }
    return 'moderate';
  }
  if (severity >= 70) return 'critical';
  if (severity >= 40) return 'moderate';
  return 'minor';
}

function mapRecommendationType(type: string): GapRecommendation['type'] {
  const typeMap: Record<string, GapRecommendation['type']> = {
    content: 'content',
    practice: 'practice',
    review: 'review',
    assessment: 'assessment',
    tutor: 'tutor',
  };
  return typeMap[type] ?? 'content';
}

// Map ContentType enum to GapRecommendation type
function mapRecommendationTypeFromEnum(type: ContentType): GapRecommendation['type'] {
  switch (type) {
    case ContentType.VIDEO:
    case ContentType.ARTICLE:
    case ContentType.TUTORIAL:
    case ContentType.DOCUMENTATION:
      return 'content';
    case ContentType.EXERCISE:
      return 'practice';
    case ContentType.QUIZ:
      return 'assessment';
    case ContentType.PROJECT:
      return 'practice';
    default:
      return 'content';
  }
}

// Map RecommendationReason enum to human-readable string
function mapRecommendationReasonToString(reason: RecommendationReason): string {
  switch (reason) {
    case RecommendationReason.KNOWLEDGE_GAP:
      return 'Address knowledge gap';
    case RecommendationReason.SKILL_DECAY:
      return 'Prevent skill decay';
    case RecommendationReason.PREREQUISITE:
      return 'Required prerequisite';
    case RecommendationReason.REINFORCEMENT:
      return 'Reinforce learning';
    case RecommendationReason.EXPLORATION:
      return 'Explore new topics';
    case RecommendationReason.CHALLENGE:
      return 'Challenge yourself';
    case RecommendationReason.REVIEW:
      return 'Review previous material';
    default:
      return 'Based on your learning patterns';
  }
}

// Map difficulty from string enum
function mapDifficultyFromEnum(difficulty: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
  return difficulty;
}

// Map RecommendationPriority enum to UI priority
function mapPriorityFromEnum(priority: RecommendationPriority): 'high' | 'medium' | 'low' {
  switch (priority) {
    case RecommendationPriority.CRITICAL:
    case RecommendationPriority.HIGH:
      return 'high';
    case RecommendationPriority.MEDIUM:
      return 'medium';
    case RecommendationPriority.LOW:
    default:
      return 'low';
  }
}

function mapDifficulty(difficulty: number | string | undefined): 'easy' | 'medium' | 'hard' {
  if (typeof difficulty === 'string') {
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
      return difficulty;
    }
    return 'medium';
  }
  if (typeof difficulty === 'number') {
    if (difficulty < 0.33) return 'easy';
    if (difficulty < 0.66) return 'medium';
    return 'hard';
  }
  return 'medium';
}

function mapPriority(priority: number): 'high' | 'medium' | 'low' {
  if (priority >= 0.7) return 'high';
  if (priority >= 0.4) return 'medium';
  return 'low';
}

function getDaysSince(date: Date | null | undefined): number {
  if (!date) return 999;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function calculateDecayRate(currentMastery: number): number {
  // Higher mastery = slower decay (well-learned skills decay slower)
  const baseRate = 2; // 2% per day base
  const masteryFactor = 1 - (currentMastery / 100) * 0.5; // 0.5-1.0
  return baseRate * masteryFactor;
}

function calculateRiskLevel(daysSince: number, decayRate: number): DecayRiskLevel {
  const projectedDecay = daysSince * decayRate;
  if (projectedDecay >= 30 || daysSince >= 30) return 'critical';
  if (projectedDecay >= 20 || daysSince >= 14) return 'high';
  if (projectedDecay >= 10 || daysSince >= 7) return 'medium';
  return 'low';
}

function calculateDecayDate(currentMastery: number, decayRate: number): string {
  // Calculate when mastery would drop below 60%
  const threshold = 60;
  if (currentMastery <= threshold) {
    return new Date().toISOString();
  }
  const daysToDecay = (currentMastery - threshold) / decayRate;
  return new Date(Date.now() + daysToDecay * 24 * 60 * 60 * 1000).toISOString();
}

function generateDecayPredictions(
  currentMastery: number,
  decayRate: number
): SkillDecayData['predictions'] {
  const predictions = [];
  for (let days = 7; days <= 28; days += 7) {
    const predictedMastery = Math.max(0, currentMastery - days * decayRate);
    predictions.push({
      date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      predictedMastery: Math.round(predictedMastery),
      confidence: Math.max(50, 95 - days * 1.5),
    });
  }
  return predictions;
}

function calculateTrendAnalysis(
  topicProgress: Array<{ mastery?: number; updatedAt?: Date; topicId?: string }>,
  gaps: LearningGapData[],
  assessments: Array<{ score?: number; createdAt?: Date }>
): TrendAnalysisData {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Calculate metrics
  const recentProgress = topicProgress.filter((p) => p.updatedAt && p.updatedAt >= oneWeekAgo);
  const previousProgress = topicProgress.filter(
    (p) => p.updatedAt && p.updatedAt >= twoWeeksAgo && p.updatedAt < oneWeekAgo
  );

  const currentAvgMastery = recentProgress.length > 0
    ? recentProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / recentProgress.length
    : 0;
  const previousAvgMastery = previousProgress.length > 0
    ? previousProgress.reduce((sum, p) => sum + (p.mastery ?? 0), 0) / previousProgress.length
    : 0;

  const masteryChange = currentAvgMastery - previousAvgMastery;
  const masteryDirection: TrendDirection = masteryChange > 5 ? 'improving' : masteryChange < -5 ? 'declining' : 'stable';

  // Assessment trends
  const recentAssessments = assessments.filter((a) => a.createdAt && a.createdAt >= oneWeekAgo);
  const previousAssessments = assessments.filter(
    (a) => a.createdAt && a.createdAt >= twoWeeksAgo && a.createdAt < oneWeekAgo
  );

  const currentAvgScore = recentAssessments.length > 0
    ? recentAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / recentAssessments.length
    : 0;
  const previousAvgScore = previousAssessments.length > 0
    ? previousAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / previousAssessments.length
    : 0;

  const scoreChange = currentAvgScore - previousAvgScore;
  const scoreDirection: TrendDirection = scoreChange > 5 ? 'improving' : scoreChange < -5 ? 'declining' : 'stable';

  // Gap trends
  const activeGaps = gaps.filter((g) => g.status === 'active').length;
  const resolvedGaps = gaps.filter((g) => g.status === 'resolved').length;

  // Generate data points (simulated weekly data)
  const generateDataPoints = (baseValue: number, trend: TrendDirection) => {
    const points = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const trendFactor = trend === 'improving' ? 1.05 : trend === 'declining' ? 0.95 : 1;
      const value = Math.round(baseValue * Math.pow(trendFactor, 4 - i) + (Math.random() * 5 - 2.5));
      points.push({
        date: date.toISOString(),
        value: Math.max(0, Math.min(100, value)),
      });
    }
    return points;
  };

  const metrics = [
    {
      id: 'mastery',
      name: 'Average Mastery',
      description: 'Overall skill mastery level',
      currentValue: Math.round(currentAvgMastery),
      previousValue: Math.round(previousAvgMastery),
      changePercent: previousAvgMastery > 0 ? Math.round((masteryChange / previousAvgMastery) * 100) : 0,
      direction: masteryDirection,
      dataPoints: generateDataPoints(currentAvgMastery || 65, masteryDirection),
      unit: '%',
    },
    {
      id: 'assessment',
      name: 'Assessment Scores',
      description: 'Average assessment performance',
      currentValue: Math.round(currentAvgScore),
      previousValue: Math.round(previousAvgScore),
      changePercent: previousAvgScore > 0 ? Math.round((scoreChange / previousAvgScore) * 100) : 0,
      direction: scoreDirection,
      dataPoints: generateDataPoints(currentAvgScore || 70, scoreDirection),
      unit: '%',
    },
    {
      id: 'gaps',
      name: 'Active Gaps',
      description: 'Number of knowledge gaps to address',
      currentValue: activeGaps,
      previousValue: activeGaps + resolvedGaps,
      changePercent: activeGaps + resolvedGaps > 0 ? Math.round(((activeGaps - (activeGaps + resolvedGaps)) / (activeGaps + resolvedGaps)) * 100) : 0,
      direction: resolvedGaps > 0 ? 'improving' as TrendDirection : 'stable' as TrendDirection,
      dataPoints: generateDataPoints(activeGaps || 3, 'declining'),
      unit: '',
    },
  ];

  // Generate insights
  const insights = [];

  if (masteryDirection === 'improving') {
    insights.push({
      id: 'mastery-up',
      type: 'positive' as const,
      title: 'Mastery Increasing',
      description: `Your average mastery improved by ${Math.abs(Math.round(masteryChange))}% this week.`,
      metric: 'mastery',
      impact: 'high' as const,
    });
  } else if (masteryDirection === 'declining') {
    insights.push({
      id: 'mastery-down',
      type: 'negative' as const,
      title: 'Mastery Declining',
      description: `Your average mastery decreased by ${Math.abs(Math.round(masteryChange))}% this week.`,
      metric: 'mastery',
      impact: 'high' as const,
    });
  }

  if (activeGaps > 5) {
    insights.push({
      id: 'many-gaps',
      type: 'negative' as const,
      title: 'Multiple Gaps Detected',
      description: `You have ${activeGaps} active learning gaps to address.`,
      metric: 'gaps',
      impact: 'medium' as const,
    });
  }

  // Overall direction
  const overallDirection: TrendDirection =
    masteryDirection === 'improving' && scoreDirection !== 'declining'
      ? 'improving'
      : masteryDirection === 'declining' || scoreDirection === 'declining'
        ? 'declining'
        : 'stable';

  return {
    period: 'week',
    metrics,
    insights,
    overallDirection,
    learningVelocity: Math.max(0, (recentProgress.length / 7) * 7), // topics/week
    gapClosureRate: resolvedGaps / 1, // gaps closed this week
  };
}

async function calculateComparisonData(
  userId: string,
  userAssessments: Array<{ score?: number; skillId?: string }>,
  userGapCount: number
): Promise<ComparisonData> {
  // Get peer count
  const peerCount = await db.user.count({
    where: {
      role: 'USER',
      NOT: { id: userId },
    },
  });

  // Calculate user's average score
  const userAvgScore = userAssessments.length > 0
    ? userAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / userAssessments.length
    : 0;

  // Get real peer assessment data from database
  const peerAssessmentStats = await db.sAMSkillAssessment.aggregate({
    where: {
      userId: { not: userId },
    },
    _avg: { score: true },
    _count: { id: true },
  });

  // Get peer gap counts
  const peerGapStats = await db.sAMLearningGap.groupBy({
    by: ['userId'],
    where: {
      userId: { not: userId },
      isResolved: false,
    },
    _count: { id: true },
  });

  // Calculate real peer averages
  const peerAvgScore = peerAssessmentStats._avg.score ?? 65;
  const peerAssessmentCount = peerAssessmentStats._count.id;

  // Calculate average gaps per peer
  const totalPeerGaps = peerGapStats.reduce((sum, p) => sum + p._count.id, 0);
  const peersWithGaps = peerGapStats.length || 1;
  const peerAvgGaps = Math.round(totalPeerGaps / peersWithGaps);

  // Get learning velocity (assessments per week) for peers
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const peerWeeklyAssessments = await db.sAMSkillAssessment.groupBy({
    by: ['userId'],
    where: {
      userId: { not: userId },
      assessedAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
  });

  const totalPeerWeeklyAssessments = peerWeeklyAssessments.reduce((sum, p) => sum + p._count.id, 0);
  const peersActive = peerWeeklyAssessments.length || 1;
  const peerAvgVelocity = Math.round(totalPeerWeeklyAssessments / peersActive);

  // User's weekly assessments
  const userWeeklyAssessments = userAssessments.filter(a => true).length; // Already filtered by caller if needed

  const metrics = [
    {
      id: 'overall-progress',
      name: 'Overall Progress',
      userValue: Math.round(userAvgScore),
      peerAverage: Math.round(peerAvgScore),
      peerMedian: Math.round(peerAvgScore * 0.95), // Approximate median
      targetValue: 80,
      percentile: calculatePercentile(userAvgScore, peerAvgScore, 15),
      unit: '%',
    },
    {
      id: 'learning-velocity',
      name: 'Learning Velocity',
      userValue: userAssessments.length,
      peerAverage: peerAvgVelocity || 3,
      peerMedian: Math.max(1, peerAvgVelocity - 1),
      targetValue: 8,
      percentile: calculatePercentile(userAssessments.length, peerAvgVelocity || 3, 3),
      unit: 'topics/week',
    },
    {
      id: 'gap-count',
      name: 'Active Gaps',
      userValue: userGapCount,
      peerAverage: peerAvgGaps || 3,
      peerMedian: Math.max(1, peerAvgGaps - 1),
      targetValue: 2,
      percentile: calculatePercentile(userGapCount, peerAvgGaps || 3, 2, true), // Lower is better
      unit: '',
    },
  ];

  // Generate insights based on real peer data
  const insights = [];

  if (userAvgScore > peerAvgScore) {
    insights.push({
      id: 'above-average',
      type: 'strength' as const,
      title: 'Above Average Performance',
      description: `Your overall progress is ${Math.round(userAvgScore - peerAvgScore)}% above the peer average.`,
      metric: 'overall-progress',
      gap: userAvgScore - peerAvgScore,
    });
  } else if (userAvgScore < peerAvgScore - 10) {
    insights.push({
      id: 'below-average',
      type: 'weakness' as const,
      title: 'Below Average Performance',
      description: `Your overall progress is ${Math.round(peerAvgScore - userAvgScore)}% below the peer average.`,
      metric: 'overall-progress',
      gap: peerAvgScore - userAvgScore,
    });
  }

  if (userAvgScore < 80) {
    insights.push({
      id: 'target-gap',
      type: 'opportunity' as const,
      title: 'Target Gap',
      description: `You're ${Math.round(80 - userAvgScore)}% away from your target mastery level.`,
      metric: 'overall-progress',
      gap: 80 - userAvgScore,
    });
  }

  if (userGapCount > peerAvgGaps) {
    insights.push({
      id: 'more-gaps',
      type: 'weakness' as const,
      title: 'More Gaps Than Average',
      description: `You have ${userGapCount - peerAvgGaps} more learning gaps than the average peer.`,
      metric: 'gap-count',
      gap: userGapCount - peerAvgGaps,
    });
  } else if (userGapCount < peerAvgGaps) {
    insights.push({
      id: 'fewer-gaps',
      type: 'strength' as const,
      title: 'Fewer Gaps Than Average',
      description: `You have ${peerAvgGaps - userGapCount} fewer learning gaps than the average peer.`,
      metric: 'gap-count',
      gap: peerAvgGaps - userGapCount,
    });
  }

  // Determine strength and improvement areas based on real data
  const strengthAreas: string[] = [];
  const improvementAreas: string[] = [];

  if (userAvgScore > peerAvgScore) strengthAreas.push('Overall Mastery');
  if (userAssessments.length > peerAvgVelocity) strengthAreas.push('Learning Velocity');
  if (userGapCount < peerAvgGaps) strengthAreas.push('Knowledge Retention');

  if (userAvgScore < peerAvgScore) improvementAreas.push('Overall Mastery');
  if (userAssessments.length < peerAvgVelocity) improvementAreas.push('Learning Velocity');
  if (userGapCount > peerAvgGaps) improvementAreas.push('Gap Reduction');

  return {
    userId,
    peerGroupSize: Math.max(1, peerCount),
    peerGroupDescription: `Compared to ${peerCount.toLocaleString()} learners on this platform`,
    metrics,
    insights,
    overallPercentile: calculatePercentile(userAvgScore, peerAvgScore, 15),
    strengthAreas: strengthAreas.length > 0 ? strengthAreas : ['Keep Learning!'],
    improvementAreas: improvementAreas.length > 0 ? improvementAreas : ['Great Progress!'],
  };
}

function calculatePercentile(
  value: number,
  mean: number,
  stdDev: number,
  lowerIsBetter = false
): number {
  // Simplified percentile calculation using normal distribution approximation
  const zScore = (value - mean) / stdDev;
  const percentile = Math.round((1 / (1 + Math.exp(-zScore * 1.7))) * 100);
  return lowerIsBetter ? 100 - percentile : percentile;
}

function calculateSummary(gaps: LearningGapData[]): GapSummary {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return {
    total: gaps.length,
    critical: gaps.filter((g) => g.severity === 'critical' && g.status === 'active').length,
    moderate: gaps.filter((g) => g.severity === 'moderate' && g.status === 'active').length,
    minor: gaps.filter((g) => g.severity === 'minor' && g.status === 'active').length,
    resolvedThisWeek: gaps.filter((g) => g.resolvedAt && new Date(g.resolvedAt) >= oneWeekAgo).length,
    newThisWeek: gaps.filter((g) => new Date(g.detectedAt) >= oneWeekAgo && g.status === 'active').length,
  };
}
