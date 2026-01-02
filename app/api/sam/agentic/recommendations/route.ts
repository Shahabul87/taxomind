/**
 * SAM Agentic Recommendations API
 * Generates personalized learning recommendations
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

interface Recommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

interface RecommendationBatch {
  recommendations: Recommendation[];
  totalEstimatedTime: number;
  generatedAt: string;
  context: {
    availableTime?: number;
    currentGoals?: string[];
    recentTopics?: string[];
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  time: z.coerce.number().min(5).max(480).optional().default(60),
  limit: z.coerce.number().min(1).max(20).optional().default(5),
  types: z.string().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function getRecentLearningActivity(userId: string) {
  // Get recent study sessions from SAM interactions
  const recentSessions = await db.sAMInteraction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      interactionType: true,
      context: true,
      createdAt: true,
    },
  });

  // Get enrolled courses progress
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      Course: {
        include: {
          chapters: {
            include: {
              user_progress: {
                where: { userId },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return { recentSessions, enrollments };
}

async function getActiveGoals(userId: string) {
  // Check if LearningGoal model exists in schema
  try {
    const goals = await (db as unknown as { learningGoal: { findMany: (args: unknown) => Promise<{ id: string; title: string; progress: number; targetMastery: string }[]> } }).learningGoal.findMany({
      where: {
        userId,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        progress: true,
        targetMastery: true,
      },
    });
    return goals;
  } catch {
    // LearningGoal model may not exist yet
    return [];
  }
}

function generateRecommendations(
  userId: string,
  availableTime: number,
  activity: Awaited<ReturnType<typeof getRecentLearningActivity>>,
  goals: { id: string; title: string; progress: number }[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let remainingTime = availableTime;

  // 1. Check for in-progress chapters that need continuation
  for (const enrollment of activity.enrollments) {
    if (!enrollment.Course) continue;
    for (const chapter of enrollment.Course.chapters) {
      const progress = chapter.user_progress[0];
      if (progress && !progress.isCompleted && remainingTime > 0) {
        const estimatedMinutes = Math.min(30, remainingTime);
        recommendations.push({
          id: generateRecommendationId(),
          type: 'content',
          title: `Continue: ${chapter.title}`,
          description: `Pick up where you left off in ${enrollment.Course.title}`,
          reason: 'You have an in-progress chapter that needs completion',
          priority: 'high',
          estimatedMinutes,
          targetUrl: `/courses/${enrollment.Course.id}/chapters/${chapter.id}`,
          metadata: {
            courseId: enrollment.Course.id,
            chapterId: chapter.id,
            courseName: enrollment.Course.title,
          },
        });
        remainingTime -= estimatedMinutes;
        break;
      }
    }
    if (recommendations.length >= 2) break;
  }

  // 2. Add goal-based recommendations
  for (const goal of goals.slice(0, 2)) {
    if (remainingTime <= 0) break;
    const estimatedMinutes = Math.min(20, remainingTime);
    recommendations.push({
      id: generateRecommendationId(),
      type: 'goal',
      title: `Work on: ${goal.title}`,
      description: `Current progress: ${goal.progress}%`,
      reason: 'This goal is active and needs attention',
      priority: goal.progress < 30 ? 'high' : 'medium',
      estimatedMinutes,
      metadata: { goalId: goal.id },
    });
    remainingTime -= estimatedMinutes;
  }

  // 3. Add practice recommendation if time allows
  if (remainingTime >= 15) {
    recommendations.push({
      id: generateRecommendationId(),
      type: 'practice',
      title: 'Practice Session',
      description: 'Reinforce your learning with practice exercises',
      reason: 'Regular practice improves retention by 40%',
      priority: 'medium',
      estimatedMinutes: Math.min(15, remainingTime),
    });
    remainingTime -= 15;
  }

  // 4. Add review recommendation based on spaced repetition
  if (remainingTime >= 10 && activity.recentSessions.length > 5) {
    recommendations.push({
      id: generateRecommendationId(),
      type: 'review',
      title: 'Review Previous Topics',
      description: 'Strengthen knowledge of recently studied material',
      reason: 'Spaced repetition enhances long-term memory',
      priority: 'low',
      estimatedMinutes: Math.min(10, remainingTime),
    });
    remainingTime -= 10;
  }

  // 5. Add break recommendation if studying for extended period
  if (availableTime >= 60 && remainingTime >= 5) {
    recommendations.push({
      id: generateRecommendationId(),
      type: 'break',
      title: 'Take a Short Break',
      description: 'Step away for a few minutes to refresh your mind',
      reason: 'Breaks improve focus and information processing',
      priority: 'low',
      estimatedMinutes: 5,
    });
  }

  return recommendations;
}

// ============================================================================
// GET /api/sam/agentic/recommendations
// Generate personalized learning recommendations
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
      time: searchParams.get('time'),
      limit: searchParams.get('limit'),
      types: searchParams.get('types'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { time: availableTime, limit } = parsed.data;

    // Get user learning activity and goals
    const [activity, goals] = await Promise.all([
      getRecentLearningActivity(user.id),
      getActiveGoals(user.id),
    ]);

    // Generate recommendations
    const allRecommendations = generateRecommendations(
      user.id,
      availableTime,
      activity,
      goals
    );

    // Apply limit
    const recommendations = allRecommendations.slice(0, limit);

    // Calculate total time
    const totalEstimatedTime = recommendations.reduce(
      (sum, rec) => sum + rec.estimatedMinutes,
      0
    );

    const batch: RecommendationBatch = {
      recommendations,
      totalEstimatedTime,
      generatedAt: new Date().toISOString(),
      context: {
        availableTime,
        currentGoals: goals.map((g) => g.id),
        recentTopics: activity.recentSessions
          .slice(0, 5)
          .map((s) => {
            const ctx = s.context as Record<string, unknown> | null;
            return ctx?.topic as string || 'General';
          }),
      },
    };

    return NextResponse.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('[SAM Recommendations] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sam/agentic/recommendations
// Track recommendation interaction (click, dismiss, complete)
// ============================================================================

const interactionSchema = z.object({
  recommendationId: z.string(),
  action: z.enum(['clicked', 'dismissed', 'completed', 'skipped']),
  feedback: z.string().optional(),
});

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
    const parsed = interactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { recommendationId, action, feedback } = parsed.data;

    // Log the interaction for analytics
    await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
        context: {
          type: 'recommendation_interaction',
          recommendationId,
          action,
          feedback,
        },
        actionTaken: `recommendation_${action}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: { tracked: true },
    });
  } catch (error) {
    console.error('[SAM Recommendations] Interaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}
