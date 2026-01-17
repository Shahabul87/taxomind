/**
 * SAM Recommendation Feedback API
 * Handles user feedback on recommendations to improve future suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  feedbackType: z.enum([
    'HELPFUL',
    'NOT_HELPFUL',
    'TOO_EASY',
    'TOO_HARD',
    'NOT_RELEVANT',
    'ALREADY_KNOW',
    'WRONG_TIMING',
    'COMPLETED_ELSEWHERE',
  ]),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

const dismissSchema = z.object({
  recommendationId: z.string().min(1),
  reason: z.string().optional(),
});

const batchFeedbackSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string().min(1),
      feedbackType: z.enum([
        'HELPFUL',
        'NOT_HELPFUL',
        'TOO_EASY',
        'TOO_HARD',
        'NOT_RELEVANT',
        'ALREADY_KNOW',
        'WRONG_TIMING',
        'COMPLETED_ELSEWHERE',
      ]),
      comment: z.string().optional(),
    })
  ),
});

/**
 * POST /api/sam/recommendations/feedback
 * Submit feedback for a recommendation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = body.action || 'feedback';

    if (action === 'dismiss') {
      // Handle dismiss action
      const validated = dismissSchema.parse(body);

      const recommendation = await db.sAMRecommendation.findFirst({
        where: {
          id: validated.recommendationId,
          userId: user.id,
        },
      });

      if (!recommendation) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Recommendation not found' } },
          { status: 404 }
        );
      }

      const updated = await db.sAMRecommendation.update({
        where: { id: validated.recommendationId },
        data: {
          isDismissed: true,
          dismissedAt: new Date(),
          dismissReason: validated.reason,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          isDismissed: updated.isDismissed,
          dismissedAt: updated.dismissedAt,
        },
      });
    }

    if (action === 'batch') {
      // Handle batch feedback
      const validated = batchFeedbackSchema.parse(body);

      const results = await Promise.all(
        validated.recommendations.map(async (rec) => {
          const recommendation = await db.sAMRecommendation.findFirst({
            where: {
              id: rec.id,
              userId: user.id,
            },
          });

          if (!recommendation) {
            return { id: rec.id, success: false, error: 'Not found' };
          }

          await db.sAMRecommendation.update({
            where: { id: rec.id },
            data: {
              feedbackType: rec.feedbackType,
              feedbackComment: rec.comment,
              feedbackAt: new Date(),
            },
          });

          return { id: rec.id, success: true };
        })
      );

      // Calculate feedback statistics for learning
      const feedbackCounts = validated.recommendations.reduce(
        (acc, rec) => {
          acc[rec.feedbackType] = (acc[rec.feedbackType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return NextResponse.json({
        success: true,
        data: {
          results,
          statistics: feedbackCounts,
        },
      });
    }

    // Default: single feedback
    const validated = feedbackSchema.parse(body);

    const recommendation = await db.sAMRecommendation.findFirst({
      where: {
        id: validated.recommendationId,
        userId: user.id,
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Recommendation not found' } },
        { status: 404 }
      );
    }

    // Update recommendation with feedback
    const updated = await db.sAMRecommendation.update({
      where: { id: validated.recommendationId },
      data: {
        feedbackType: validated.feedbackType,
        feedbackComment: validated.comment,
        feedbackAt: new Date(),
        userRating: validated.rating,
      },
    });

    // Track feedback for analytics
    await trackFeedbackAnalytics(user.id, updated);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        feedbackType: updated.feedbackType,
        feedbackAt: updated.feedbackAt,
        message: getFeedbackAcknowledgment(validated.feedbackType),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[SAM Recommendation Feedback] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process feedback' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sam/recommendations/feedback
 * Get feedback statistics for the user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get recommendations with feedback
    const recommendations = await db.sAMRecommendation.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        type: true,
        reason: true,
        feedbackType: true,
        feedbackAt: true,
        isDismissed: true,
        isViewed: true,
        isCompleted: true,
        userRating: true,
        difficulty: true,
      },
    });

    // Calculate statistics
    const total = recommendations.length;
    const withFeedback = recommendations.filter((r) => r.feedbackType).length;
    const dismissed = recommendations.filter((r) => r.isDismissed).length;
    const completed = recommendations.filter((r) => r.isCompleted).length;
    const viewed = recommendations.filter((r) => r.isViewed).length;

    // Feedback type breakdown
    const feedbackBreakdown = recommendations.reduce(
      (acc, r) => {
        if (r.feedbackType) {
          acc[r.feedbackType] = (acc[r.feedbackType] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Helpful ratio
    const helpfulCount = feedbackBreakdown['HELPFUL'] || 0;
    const notHelpfulCount = feedbackBreakdown['NOT_HELPFUL'] || 0;
    const helpfulRatio =
      helpfulCount + notHelpfulCount > 0
        ? helpfulCount / (helpfulCount + notHelpfulCount)
        : null;

    // Difficulty feedback
    const difficultyFeedback = {
      tooEasy: feedbackBreakdown['TOO_EASY'] || 0,
      tooHard: feedbackBreakdown['TOO_HARD'] || 0,
      justRight: helpfulCount,
    };

    // Average rating
    const ratings = recommendations
      .filter((r) => r.userRating !== null)
      .map((r) => r.userRating as number);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    return NextResponse.json({
      success: true,
      data: {
        period,
        total,
        statistics: {
          withFeedback,
          dismissed,
          completed,
          viewed,
          feedbackRate: total > 0 ? withFeedback / total : 0,
          completionRate: total > 0 ? completed / total : 0,
          viewRate: total > 0 ? viewed / total : 0,
        },
        feedbackBreakdown,
        helpfulRatio,
        difficultyFeedback,
        averageRating,
        insights: generateFeedbackInsights({
          total,
          withFeedback,
          helpfulRatio,
          difficultyFeedback,
          averageRating,
        }),
      },
    });
  } catch (error) {
    console.error('[SAM Recommendation Feedback] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get feedback statistics' } },
      { status: 500 }
    );
  }
}

/**
 * Track feedback for analytics and model improvement
 */
async function trackFeedbackAnalytics(
  userId: string,
  recommendation: {
    id: string;
    type: string;
    reason: string;
    feedbackType: string | null;
    difficulty: string;
    targetSkillId: string | null;
  }
): Promise<void> {
  try {
    // Store as an observability metric for later analysis
    await db.sAMMetric.create({
      data: {
        name: 'recommendation.feedback',
        value: recommendation.feedbackType === 'HELPFUL' ? 1 : 0,
        labels: {
          feedbackType: recommendation.feedbackType,
          recommendationType: recommendation.type,
          reason: recommendation.reason,
          difficulty: recommendation.difficulty,
          skillId: recommendation.targetSkillId,
        },
        userId,
      },
    });
  } catch (error) {
    // Non-critical, log and continue
    console.error('[SAM Recommendation Feedback] Analytics tracking failed:', error);
  }
}

/**
 * Generate a personalized acknowledgment message
 */
function getFeedbackAcknowledgment(feedbackType: string): string {
  switch (feedbackType) {
    case 'HELPFUL':
      return 'Great! We&apos;ll recommend more content like this.';
    case 'NOT_HELPFUL':
      return 'Thanks for letting us know. We&apos;ll improve our recommendations.';
    case 'TOO_EASY':
      return 'Got it! We&apos;ll suggest more challenging content next time.';
    case 'TOO_HARD':
      return 'Understood. We&apos;ll recommend content that better matches your level.';
    case 'NOT_RELEVANT':
      return 'Thanks for the feedback. We&apos;ll improve our topic matching.';
    case 'ALREADY_KNOW':
      return 'Good to know! We&apos;ll focus on new concepts for you.';
    case 'WRONG_TIMING':
      return 'Thanks! We&apos;ll learn your optimal study schedule.';
    case 'COMPLETED_ELSEWHERE':
      return 'Great job! We&apos;ve noted your progress.';
    default:
      return 'Thank you for your feedback!';
  }
}

/**
 * Generate insights from feedback statistics
 */
function generateFeedbackInsights(stats: {
  total: number;
  withFeedback: number;
  helpfulRatio: number | null;
  difficultyFeedback: { tooEasy: number; tooHard: number; justRight: number };
  averageRating: number | null;
}): string[] {
  const insights: string[] = [];

  // Feedback engagement
  if (stats.total > 0) {
    const feedbackRate = stats.withFeedback / stats.total;
    if (feedbackRate < 0.2) {
      insights.push(
        'Low feedback rate. Consider providing feedback to help improve recommendations.'
      );
    } else if (feedbackRate > 0.5) {
      insights.push('Great engagement! Your feedback helps us personalize your learning.');
    }
  }

  // Helpful ratio insights
  if (stats.helpfulRatio !== null) {
    if (stats.helpfulRatio >= 0.8) {
      insights.push('Excellent match! Most recommendations are hitting the mark.');
    } else if (stats.helpfulRatio < 0.5) {
      insights.push(
        'We&apos;re working on improving recommendation accuracy based on your feedback.'
      );
    }
  }

  // Difficulty calibration
  const { tooEasy, tooHard, justRight } = stats.difficultyFeedback;
  const difficultyTotal = tooEasy + tooHard + justRight;
  if (difficultyTotal > 5) {
    if (tooEasy > tooHard * 2) {
      insights.push('Content seems too easy for you. Increasing challenge level.');
    } else if (tooHard > tooEasy * 2) {
      insights.push('Content might be too challenging. Adjusting difficulty.');
    } else if (justRight > (tooEasy + tooHard) * 2) {
      insights.push('Difficulty level is well-calibrated to your skills!');
    }
  }

  // Rating insights
  if (stats.averageRating !== null) {
    if (stats.averageRating >= 4) {
      insights.push(`Strong average rating of ${stats.averageRating.toFixed(1)}/5.`);
    } else if (stats.averageRating < 3) {
      insights.push('Working to improve recommendation quality based on your ratings.');
    }
  }

  return insights;
}
