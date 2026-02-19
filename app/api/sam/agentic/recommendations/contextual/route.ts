// @ts-nocheck
/**
 * SAM Contextual Recommendations API
 *
 * Generates learning recommendations based on current context.
 * Used by course learning pages to show relevant suggestions.
 *
 * @route GET /api/sam/agentic/recommendations/contextual
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Query params validation
const QuerySchema = z.object({
  userId: z.string().optional(),
  courseId: z.string(),
  sectionId: z.string(),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 3)),
});

// Recommendation types
type RecommendationType = 'review' | 'practice' | 'next' | 'related' | 'prerequisite';
type RecommendationPriority = 'high' | 'medium' | 'low';

interface ContextualRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  confidence: number;
  action?: {
    label: string;
    href?: string;
  };
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const user = await currentUser();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = QuerySchema.parse({
      userId: searchParams.get('userId') ?? user?.id,
      courseId: searchParams.get('courseId'),
      sectionId: searchParams.get('sectionId'),
      limit: searchParams.get('limit'),
    });

    if (!query.userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    const recommendations: ContextualRecommendation[] = [];

    // 1. Check for prerequisites that need review
    const currentSection = await db.section.findUnique({
      where: { id: query.sectionId },
      include: {
        chapter: {
          include: {
            Course: {
              include: {
                chapters: {
                  where: {
                    position: {
                      lt: await db.chapter.findUnique({
                        where: { id: await db.section.findUnique({
                          where: { id: query.sectionId },
                          select: { chapterId: true },
                        }).then(s => s?.chapterId ?? ''),
                        },
                        select: { position: true },
                      }).then(c => c?.position ?? 0),
                    },
                  },
                  include: {
                    sections: {
                      include: {
                        user_progress: {
                          where: { userId: query.userId },
                        },
                      },
                    },
                  },
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    // 2. Check for incomplete previous sections
    if (currentSection?.chapter?.Course?.chapters) {
      const previousChapters = currentSection.chapter.Course.chapters;

      for (const chapter of previousChapters) {
        for (const section of chapter.sections) {
          const progress = section.user_progress?.[0];
          if (!progress?.isCompleted) {
            recommendations.push({
              id: `review-${section.id}`,
              type: 'prerequisite',
              title: `Review: ${section.title}`,
              description: `Complete this prerequisite section for better understanding`,
              priority: 'high',
              confidence: 0.9,
              action: {
                label: 'Go to Section',
                href: `/courses/${query.courseId}/learn/${chapter.id}/sections/${section.id}`,
              },
            });
          }
        }
      }
    }

    // 3. Check for spaced repetition reviews due
    const dueReviews = await db.sAMSpacedRepetitionReview.findMany({
      where: {
        userId: query.userId,
        courseId: query.courseId,
        nextReviewDate: {
          lte: new Date(),
        },
      },
      take: 3,
      orderBy: { nextReviewDate: 'asc' },
    });

    for (const review of dueReviews) {
      recommendations.push({
        id: `sr-${review.id}`,
        type: 'review',
        title: `Review Due: ${review.topicId}`,
        description: 'Spaced repetition review to reinforce learning',
        priority: 'medium',
        confidence: 0.85,
        action: {
          label: 'Start Review',
          href: `/dashboard/user?tab=reviews`,
        },
        metadata: {
          interval: review.interval,
          easeFactor: review.easeFactor,
        },
      });
    }

    // 4. Check for learning gaps from SAM
    const gaps = await db.sAMLearningGap.findMany({
      where: {
        userId: query.userId,
        courseId: query.courseId,
        resolved: false,
      },
      take: 2,
      orderBy: { severity: 'desc' },
    });

    for (const gap of gaps) {
      recommendations.push({
        id: `gap-${gap.id}`,
        type: 'practice',
        title: `Practice: ${gap.topicId}`,
        description: gap.description || 'Address this learning gap with targeted practice',
        priority: gap.severity === 'HIGH' ? 'high' : 'medium',
        confidence: gap.confidence,
        action: {
          label: 'Start Practice',
        },
        metadata: {
          gapType: gap.gapType,
        },
      });
    }

    // 5. Suggest next section if current is almost complete
    const currentProgress = await db.userProgress.findFirst({
      where: {
        userId: query.userId,
        sectionId: query.sectionId,
      },
    });

    if (currentProgress && currentProgress.overallProgress >= 80) {
      const nextSection = await db.section.findFirst({
        where: {
          chapterId: currentSection?.chapterId,
          position: {
            gt: currentSection?.position ?? 0,
          },
        },
        orderBy: { position: 'asc' },
      });

      if (nextSection) {
        recommendations.push({
          id: `next-${nextSection.id}`,
          type: 'next',
          title: `Up Next: ${nextSection.title}`,
          description: 'Continue your learning journey',
          priority: 'low',
          confidence: 0.95,
          action: {
            label: 'Continue',
            href: `/courses/${query.courseId}/learn/${currentSection?.chapterId}/sections/${nextSection.id}`,
          },
        });
      }
    }

    // 6. Check SAM recommendations table
    const samRecommendations = await db.sAMRecommendation.findMany({
      where: {
        userId: query.userId,
        status: 'PENDING',
        OR: [
          { context: { path: ['courseId'], equals: query.courseId } },
          { context: { path: ['sectionId'], equals: query.sectionId } },
        ],
      },
      take: 2,
      orderBy: { priority: 'desc' },
    });

    for (const rec of samRecommendations) {
      recommendations.push({
        id: rec.id,
        type: (rec.type?.toLowerCase() as RecommendationType) || 'related',
        title: rec.title,
        description: rec.reason || 'Personalized recommendation from SAM',
        priority: rec.priority === 'HIGH' ? 'high' : rec.priority === 'MEDIUM' ? 'medium' : 'low',
        confidence: rec.confidence,
        action: rec.actionUrl ? {
          label: 'View',
          href: rec.actionUrl,
        } : undefined,
      });
    }

    // Sort by priority and confidence
    const priorityOrder: Record<RecommendationPriority, number> = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    // Limit results
    const limitedRecommendations = recommendations.slice(0, query.limit);

    return NextResponse.json({
      success: true,
      recommendations: limitedRecommendations,
      total: recommendations.length,
      context: {
        courseId: query.courseId,
        sectionId: query.sectionId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching contextual recommendations:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
