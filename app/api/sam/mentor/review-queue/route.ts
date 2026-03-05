/**
 * SAM AI Mentor - Review Queue API
 *
 * Manages spaced repetition review items.
 * Note: Uses SAMInteraction for storage until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const AddReviewSchema = z.object({
  topic: z.string().min(1).max(200),
  concept: z.string().min(1).max(500),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  sourceType: z.enum(['diagnostic', 'practice', 'manual']).optional().default('manual'),
});

const UpdateReviewSchema = z.object({
  reviewId: z.string(),
  quality: z.number().min(0).max(5), // SM-2 quality rating
});

// Context type for review entries
interface ReviewEntryContext {
  type: 'review_entry';
  topic: string;
  concept: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceType: 'diagnostic' | 'practice' | 'manual';
  easeFactor: number;
  interval: number;
  repetitions: number;
  masteryLevel: number;
  nextReviewDate: string;
  lastReviewDate?: string;
}

/**
 * GET - Get review queue for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dueOnly = searchParams.get('dueOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Get review entries from SAMInteraction
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();

    // Filter to review entries
    let reviews = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'review_entry';
      })
      .map(i => {
        const ctx = i.context as unknown as ReviewEntryContext;
        return {
          id: i.id,
          ...ctx,
          isDue: new Date(ctx.nextReviewDate) <= now,
          createdAt: i.createdAt.toISOString(),
        };
      });

    // Apply due filter
    if (dueOnly) {
      reviews = reviews.filter(r => r.isDue);
    }

    // Sort by priority and due date
    reviews.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Calculate stats
    const dueCount = reviews.filter(r => r.isDue).length;
    const upcomingCount = reviews.filter(r => !r.isDue).length;

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.slice(0, limit),
        stats: {
          dueNow: dueCount,
          upcoming: upcomingCount,
          total: reviews.length,
        },
      },
    });

  } catch (error) {
    logger.error('[REVIEW QUEUE] Get error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get review queue' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Add item to review queue
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = AddReviewSchema.parse(body);

    // Create review entry context
    const reviewContext: ReviewEntryContext = {
      type: 'review_entry',
      topic: validatedData.topic,
      concept: validatedData.concept,
      priority: validatedData.priority,
      sourceType: validatedData.sourceType,
      easeFactor: 2.5, // SM-2 default
      interval: 1,
      repetitions: 0,
      masteryLevel: 0,
      nextReviewDate: new Date().toISOString(),
    };

    const review = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
        context: reviewContext as unknown as Record<string, unknown>,
        actionTaken: 'review_added',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        ...reviewContext,
        createdAt: review.createdAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('[REVIEW QUEUE] Add error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add review' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update review (after completing a review session)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateReviewSchema.parse(body);

    const existing = await db.sAMInteraction.findFirst({
      where: { id: validatedData.reviewId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found' } },
        { status: 404 }
      );
    }

    const existingContext = existing.context as unknown as ReviewEntryContext | null;
    if (!existingContext || existingContext.type !== 'review_entry') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REVIEW', message: 'Invalid review' } },
        { status: 400 }
      );
    }

    // Apply SM-2 algorithm
    const q = validatedData.quality;
    let ef = existingContext.easeFactor;
    let interval = existingContext.interval;
    let repetitions = existingContext.repetitions;

    if (q >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ef);
      }
      repetitions++;
      ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    } else {
      // Incorrect response - reset
      repetitions = 0;
      interval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const updatedContext: ReviewEntryContext = {
      ...existingContext,
      easeFactor: ef,
      interval,
      repetitions,
      masteryLevel: Math.min(1, repetitions * 0.2),
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewDate: new Date().toISOString(),
    };

    await db.sAMInteraction.update({
      where: { id: validatedData.reviewId },
      data: {
        context: updatedContext as unknown as Record<string, unknown>,
        actionTaken: 'review_completed',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: validatedData.reviewId,
        ...updatedContext,
        nextReviewIn: `${interval} days`,
      },
    });

  } catch (error) {
    logger.error('[REVIEW QUEUE] Update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update review' } },
      { status: 500 }
    );
  }
}
