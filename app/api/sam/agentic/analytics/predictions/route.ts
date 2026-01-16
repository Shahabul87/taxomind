/**
 * SAM Agentic Analytics Predictions API
 * Provides AI-powered learning outcome predictions and risk assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type Trend = 'improving' | 'stable' | 'declining';

interface Prediction {
  id: string;
  type: 'grade' | 'completion' | 'mastery' | 'engagement';
  title: string;
  predictedValue: number;
  confidence: number;
  trend: Trend;
  changePercent: number;
  factors: PredictionFactor[];
  timestamp: string;
}

interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface RiskAssessment {
  id: string;
  category: string;
  level: RiskLevel;
  probability: number;
  impact: string;
  mitigations: string[];
  deadline?: string;
}

interface PerformanceForecast {
  period: string;
  predictedScore: number;
  confidence: number;
  trend: Trend;
  milestone?: string;
}

interface Intervention {
  id: string;
  type: 'study' | 'practice' | 'review' | 'support';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
  timeRequired: number;
  deadline?: string;
}

interface PredictiveInsightsData {
  predictions: Prediction[];
  risks: RiskAssessment[];
  forecasts: PerformanceForecast[];
  interventions: Intervention[];
  overallOutlook: 'positive' | 'neutral' | 'concerning';
  confidenceScore: number;
  lastUpdated: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  courseId: z.string().optional(),
  userId: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineTrend(recentScore: number, previousScore: number): Trend {
  const diff = recentScore - previousScore;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

function determineRiskLevel(probability: number): RiskLevel {
  if (probability >= 75) return 'critical';
  if (probability >= 50) return 'high';
  if (probability >= 25) return 'medium';
  return 'low';
}

function determineOutlook(
  predictions: Prediction[],
  risks: RiskAssessment[]
): 'positive' | 'neutral' | 'concerning' {
  const avgPredictedValue =
    predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.predictedValue, 0) / predictions.length
      : 70;

  const highRiskCount = risks.filter((r) => r.level === 'high' || r.level === 'critical').length;

  if (avgPredictedValue >= 75 && highRiskCount === 0) return 'positive';
  if (avgPredictedValue < 60 || highRiskCount > 1) return 'concerning';
  return 'neutral';
}

// ============================================================================
// GET /api/sam/agentic/analytics/predictions
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
      courseId: searchParams.get('courseId') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { courseId } = parsed.data;
    const targetUserId = user.id;

    // Fetch user's learning data for predictions
    const [enrollments, practiceSessionsData, masteryData] = await Promise.all([
      // Get enrollments with progress
      db.enrollment.findMany({
        where: {
          userId: targetUserId,
          ...(courseId ? { courseId } : {}),
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      // Get recent practice sessions
      db.practiceSession.aggregate({
        where: {
          userId: targetUserId,
          status: 'COMPLETED',
          endedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: { id: true },
        _sum: { qualityHours: true },
        _avg: { qualityMultiplier: true },
      }),
      // Get skill mastery data
      db.skillMastery10K.findMany({
        where: { userId: targetUserId },
        orderBy: { totalQualityHours: 'desc' },
        take: 5,
      }),
    ]);

    // Generate predictions based on actual data
    const predictions: Prediction[] = [];
    const risks: RiskAssessment[] = [];
    const forecasts: PerformanceForecast[] = [];
    const interventions: Intervention[] = [];

    // Calculate engagement metrics
    const totalPracticeSessions = practiceSessionsData._count.id;
    const totalQualityHours = practiceSessionsData._sum.qualityHours ?? 0;
    const avgQualityMultiplier = practiceSessionsData._avg.qualityMultiplier ?? 1;

    // Engagement prediction
    const engagementScore = Math.min(
      100,
      Math.round((totalPracticeSessions / 20) * 100 * avgQualityMultiplier)
    );
    predictions.push({
      id: 'pred_engagement',
      type: 'engagement',
      title: 'Engagement Level',
      predictedValue: engagementScore,
      confidence: 75,
      trend: totalPracticeSessions > 10 ? 'improving' : totalPracticeSessions > 5 ? 'stable' : 'declining',
      changePercent: Math.round((avgQualityMultiplier - 1) * 100),
      factors: [
        {
          name: 'Practice Sessions',
          impact: Math.min(40, totalPracticeSessions * 2),
          direction: totalPracticeSessions > 5 ? 'positive' : 'negative',
          description: `${totalPracticeSessions} sessions in the last 30 days`,
        },
        {
          name: 'Quality Hours',
          impact: Math.min(30, totalQualityHours * 5),
          direction: totalQualityHours > 5 ? 'positive' : 'neutral',
          description: `${totalQualityHours.toFixed(1)} quality hours logged`,
        },
      ],
      timestamp: new Date().toISOString(),
    });

    // Mastery prediction based on top skill
    if (masteryData.length > 0) {
      const topSkill = masteryData[0];
      const masteryProgress = (topSkill.totalQualityHours / 10000) * 100;
      predictions.push({
        id: 'pred_mastery',
        type: 'mastery',
        title: `${topSkill.skillName} Mastery`,
        predictedValue: Math.min(100, masteryProgress + 5), // Predicted growth
        confidence: 80,
        trend: topSkill.currentStreak > 3 ? 'improving' : 'stable',
        changePercent: topSkill.currentStreak,
        factors: [
          {
            name: 'Current Streak',
            impact: topSkill.currentStreak * 5,
            direction: topSkill.currentStreak > 0 ? 'positive' : 'neutral',
            description: `${topSkill.currentStreak} day streak`,
          },
          {
            name: 'Total Hours',
            impact: Math.min(50, topSkill.totalQualityHours),
            direction: 'positive',
            description: `${topSkill.totalQualityHours.toFixed(1)} quality hours`,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // Completion prediction for enrollments
    for (const enrollment of enrollments.slice(0, 2)) {
      const progress = (enrollment.completedChapters / Math.max(1, enrollment.totalChapters)) * 100;
      predictions.push({
        id: `pred_completion_${enrollment.courseId}`,
        type: 'completion',
        title: `${enrollment.course.title} Completion`,
        predictedValue: Math.min(100, progress + 10),
        confidence: 70,
        trend: determineTrend(progress + 10, progress),
        changePercent: 10,
        factors: [
          {
            name: 'Current Progress',
            impact: progress,
            direction: progress > 50 ? 'positive' : 'neutral',
            description: `${Math.round(progress)}% complete`,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // Risk assessment
    if (totalPracticeSessions < 5) {
      risks.push({
        id: 'risk_low_engagement',
        category: 'Engagement',
        level: determineRiskLevel(70),
        probability: 70,
        impact: 'Reduced learning velocity and skill retention',
        mitigations: [
          'Set a daily practice goal of 15-30 minutes',
          'Use the Pomodoro timer for focused sessions',
          'Track progress with the practice heatmap',
        ],
      });
    }

    if (masteryData.length > 0 && masteryData[0].currentStreak === 0) {
      risks.push({
        id: 'risk_broken_streak',
        category: 'Consistency',
        level: 'medium',
        probability: 40,
        impact: 'Loss of learning momentum',
        mitigations: [
          'Start a new practice session today',
          'Set a reminder for daily practice',
          'Begin with just 10 minutes to rebuild habit',
        ],
      });
    }

    // Performance forecasts
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString('default', {
      month: 'long',
    });

    forecasts.push(
      {
        period: currentMonth,
        predictedScore: engagementScore,
        confidence: 85,
        trend: 'stable',
        milestone: totalQualityHours > 10 ? '10 hours achieved!' : undefined,
      },
      {
        period: nextMonth,
        predictedScore: Math.min(100, engagementScore + 10),
        confidence: 70,
        trend: 'improving',
        milestone: totalQualityHours > 20 ? '25 hour milestone approaching' : undefined,
      }
    );

    // Recommended interventions
    if (totalPracticeSessions < 10) {
      interventions.push({
        id: 'int_increase_practice',
        type: 'practice',
        title: 'Increase Practice Frequency',
        description: 'Add 2-3 more practice sessions per week to improve learning outcomes.',
        priority: 'high',
        expectedImpact: 25,
        timeRequired: 30,
      });
    }

    if (masteryData.length > 0 && masteryData[0].proficiencyLevel === 'BEGINNER') {
      interventions.push({
        id: 'int_skill_focus',
        type: 'study',
        title: 'Focus on Core Concepts',
        description: `Dedicate time to understanding fundamental ${masteryData[0].skillName} concepts.`,
        priority: 'medium',
        expectedImpact: 20,
        timeRequired: 45,
      });
    }

    interventions.push({
      id: 'int_review',
      type: 'review',
      title: 'Weekly Review Session',
      description: 'Schedule a weekly review to reinforce learned concepts.',
      priority: 'low',
      expectedImpact: 15,
      timeRequired: 20,
    });

    const outlook = determineOutlook(predictions, risks);
    const confidenceScore = Math.round(
      predictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(1, predictions.length)
    );

    const data: PredictiveInsightsData = {
      predictions,
      risks,
      forecasts,
      interventions,
      overallOutlook: outlook,
      confidenceScore,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error generating predictions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
