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

    // 1. Get current section and its chapter position to find prerequisite chapters
    const currentSection = await db.section.findUnique({
      where: { id: query.sectionId },
      select: {
        id: true,
        title: true,
        position: true,
        chapterId: true,
        chapter: {
          select: {
            id: true,
            position: true,
            courseId: true,
          },
        },
      },
    });

    // 2. Check for incomplete previous sections (prerequisites)
    if (currentSection?.chapter) {
      const currentChapterPosition = currentSection.chapter.position;
      const courseId = currentSection.chapter.courseId;

      // Fetch previous chapters with their sections and user progress
      const previousChapters = await db.chapter.findMany({
        where: {
          courseId,
          position: { lt: currentChapterPosition },
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
      });

      for (const chapter of previousChapters) {
        for (const section of chapter.sections) {
          const progress = section.user_progress[0];
          if (!progress?.isCompleted) {
            recommendations.push({
              id: `review-${section.id}`,
              type: 'prerequisite',
              title: `Review: ${section.title}`,
              description: 'Complete this prerequisite section for better understanding',
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
    const dueReviews = await db.spacedRepetitionSchedule.findMany({
      where: {
        userId: query.userId,
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
        title: `Review Due: ${review.conceptId}`,
        description: 'Spaced repetition review to reinforce learning',
        priority: 'medium',
        confidence: 0.85,
        action: {
          label: 'Start Review',
          href: '/dashboard/user?tab=reviews',
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
        isResolved: false,
      },
      take: 2,
      orderBy: { severity: 'desc' },
    });

    for (const gap of gaps) {
      const severityStr = String(gap.severity);
      recommendations.push({
        id: `gap-${gap.id}`,
        type: 'practice',
        title: `Practice: ${gap.topicId}`,
        description: gap.conceptName ?? 'Address this learning gap with targeted practice',
        priority: severityStr === 'CRITICAL' ? 'high' : 'medium',
        confidence: 0.7,
        action: {
          label: 'Start Practice',
        },
        metadata: {
          conceptId: gap.conceptId,
        },
      });
    }

    // 5. Suggest next section if current is almost complete
    const currentProgress = await db.user_progress.findFirst({
      where: {
        userId: query.userId,
        sectionId: query.sectionId,
      },
    });

    if (currentProgress && (currentProgress.overallProgress ?? 0) >= 80) {
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

    // 6. Check SAM recommendations table for pending recommendations
    const samRecommendations = await db.sAMRecommendation.findMany({
      where: {
        userId: query.userId,
        isCompleted: false,
        isDismissed: false,
      },
      take: 2,
      orderBy: { priority: 'desc' },
    });

    for (const rec of samRecommendations) {
      const typeStr = String(rec.type).toLowerCase();
      const priorityStr = String(rec.priority);
      recommendations.push({
        id: rec.id,
        type: (typeStr === 'review' || typeStr === 'practice' || typeStr === 'next' || typeStr === 'related' || typeStr === 'prerequisite')
          ? typeStr as RecommendationType
          : 'related',
        title: rec.title,
        description: rec.description ?? 'Personalized recommendation from SAM',
        priority: priorityStr === 'HIGH' || priorityStr === 'CRITICAL' ? 'high' : priorityStr === 'MEDIUM' ? 'medium' : 'low',
        confidence: rec.confidence,
        action: rec.resourceUrl ? {
          label: 'View',
          href: rec.resourceUrl,
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
  } catch (error: unknown) {
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
