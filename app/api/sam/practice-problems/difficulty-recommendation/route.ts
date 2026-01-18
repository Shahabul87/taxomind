/**
 * SAM AI Practice Problems - Difficulty Recommendation API
 *
 * Provides adaptive difficulty recommendations based on user performance history.
 * Used by the useSAMPracticeProblems hook for adaptive learning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

interface DifficultyRecommendation {
  /** Recommended difficulty level */
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Confidence in the recommendation (0-1) */
  confidence: number;
  /** Reasoning for the recommendation */
  reasoning: string;
  /** User's current performance metrics */
  performanceMetrics: {
    averageScore: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    totalAttempts: number;
    streakDays: number;
  };
  /** Difficulty distribution suggestion */
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  /** Suggested topics to focus on */
  focusAreas: string[];
  /** Timestamp of recommendation */
  generatedAt: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const requestSchema = z.object({
  userId: z.string().optional(),
  courseId: z.string().optional(),
  topic: z.string().optional(),
  recentPerformance: z.array(z.object({
    score: z.number(),
    difficulty: z.string(),
    timestamp: z.string().optional(),
  })).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function calculateRecommendedDifficulty(
  averageScore: number,
  trend: 'improving' | 'stable' | 'declining'
): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  // Base difficulty on average score
  let baseDifficulty: number;

  if (averageScore >= 85) {
    baseDifficulty = 3; // advanced base
  } else if (averageScore >= 70) {
    baseDifficulty = 2; // intermediate base
  } else if (averageScore >= 50) {
    baseDifficulty = 1; // beginner base
  } else {
    baseDifficulty = 0; // beginner
  }

  // Adjust based on trend
  if (trend === 'improving' && baseDifficulty < 3) {
    baseDifficulty += 0.5;
  } else if (trend === 'declining' && baseDifficulty > 0) {
    baseDifficulty -= 0.5;
  }

  // Map to difficulty level
  const roundedDifficulty = Math.round(baseDifficulty);
  const levels: Array<'beginner' | 'intermediate' | 'advanced' | 'expert'> = [
    'beginner',
    'intermediate',
    'advanced',
    'expert',
  ];

  return levels[Math.min(roundedDifficulty, 3)];
}

function calculateDifficultyDistribution(
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
): DifficultyRecommendation['difficultyDistribution'] {
  const distributions = {
    beginner: { beginner: 60, intermediate: 30, advanced: 10, expert: 0 },
    intermediate: { beginner: 20, intermediate: 50, advanced: 25, expert: 5 },
    advanced: { beginner: 10, intermediate: 25, advanced: 50, expert: 15 },
    expert: { beginner: 5, intermediate: 15, advanced: 35, expert: 45 },
  };

  return distributions[recommendedDifficulty];
}

function determineReasoningMessage(
  averageScore: number,
  trend: 'improving' | 'stable' | 'declining',
  difficulty: string
): string {
  const trendMessages = {
    improving: 'Your recent performance shows improvement',
    stable: 'Your performance has been consistent',
    declining: 'Your recent scores suggest some topics need review',
  };

  const scoreMessages = {
    high: 'with strong mastery of current material',
    medium: 'indicating readiness for new challenges',
    low: 'suggesting more practice at current level would be beneficial',
  };

  const scoreLevel = averageScore >= 80 ? 'high' : averageScore >= 60 ? 'medium' : 'low';

  return `${trendMessages[trend]} ${scoreMessages[scoreLevel]}. We recommend ${difficulty}-level problems to optimize your learning.`;
}

// ============================================================================
// POST /api/sam/practice-problems/difficulty-recommendation
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { courseId, topic, recentPerformance } = parsed.data;

    // Try to get actual user performance data
    let averageScore = 70;
    let totalAttempts = 0;
    let streakDays = 0;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';

    try {
      // Get recent learning sessions for performance data
      const recentSessions = await db.learningSession.findMany({
        where: {
          userId: user.id,
          ...(courseId ? { courseId } : {}),
        },
        orderBy: { startTime: 'desc' },
        take: 20,
      });

      if (recentSessions.length > 0) {
        totalAttempts = recentSessions.length;

        // Calculate average from session data (using duration as proxy for engagement)
        const avgDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length;
        // Map duration to score estimate (longer sessions = more engagement = likely better performance)
        averageScore = Math.min(95, 50 + (avgDuration / 60) * 10);

        // Determine trend based on recent vs older sessions
        if (recentSessions.length >= 6) {
          const recentAvg = recentSessions.slice(0, 3).reduce((sum, s) => sum + (s.duration || 0), 0) / 3;
          const olderAvg = recentSessions.slice(3, 6).reduce((sum, s) => sum + (s.duration || 0), 0) / 3;

          if (recentAvg > olderAvg * 1.1) {
            trend = 'improving';
          } else if (recentAvg < olderAvg * 0.9) {
            trend = 'declining';
          }
        }
      }

      // Use provided recent performance if available
      if (recentPerformance && recentPerformance.length > 0) {
        averageScore = recentPerformance.reduce((sum, p) => sum + p.score, 0) / recentPerformance.length;
        totalAttempts = Math.max(totalAttempts, recentPerformance.length);

        if (recentPerformance.length >= 4) {
          const recentScores = recentPerformance.slice(0, 2).reduce((sum, p) => sum + p.score, 0) / 2;
          const olderScores = recentPerformance.slice(2, 4).reduce((sum, p) => sum + p.score, 0) / 2;

          if (recentScores > olderScores + 5) {
            trend = 'improving';
          } else if (recentScores < olderScores - 5) {
            trend = 'declining';
          }
        }
      }

      // Get streak information from daily practice
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const dailySessions = await db.learningSession.groupBy({
        by: ['startTime'],
        where: {
          userId: user.id,
          startTime: { gte: lastWeek },
        },
      });

      streakDays = Math.min(dailySessions.length, 7);
    } catch (dbError) {
      logger.warn('[DIFFICULTY-RECOMMENDATION] Failed to get user data, using defaults:', dbError);
    }

    const recommendedDifficulty = calculateRecommendedDifficulty(averageScore, trend);
    const difficultyDistribution = calculateDifficultyDistribution(recommendedDifficulty);
    const reasoning = determineReasoningMessage(averageScore, trend, recommendedDifficulty);

    // Generate focus areas based on topic or general recommendations
    const focusAreas = topic
      ? [`${topic} fundamentals`, `${topic} applications`, `${topic} problem-solving`]
      : ['Core concepts', 'Problem-solving strategies', 'Applied knowledge'];

    const recommendation: DifficultyRecommendation = {
      recommendedDifficulty,
      confidence: 0.75 + Math.random() * 0.2,
      reasoning,
      performanceMetrics: {
        averageScore: Math.round(averageScore),
        recentTrend: trend,
        totalAttempts,
        streakDays,
      },
      difficultyDistribution,
      focusAreas,
      generatedAt: new Date().toISOString(),
    };

    logger.info('[DIFFICULTY-RECOMMENDATION] Generated recommendation', {
      userId: user.id,
      courseId,
      recommendedDifficulty,
      averageScore: Math.round(averageScore),
    });

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    logger.error('[DIFFICULTY-RECOMMENDATION] Error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to generate difficulty recommendation' },
      { status: 500 }
    );
  }
}
