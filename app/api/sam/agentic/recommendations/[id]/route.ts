/**
 * SAM Agentic Recommendations - Single Recommendation API
 * Update recommendation status (complete, dismiss, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION
// ============================================================================

const updateSchema = z.object({
  action: z.enum(['complete', 'dismiss', 'snooze']),
  rating: z.number().min(1).max(5).optional(),
  snoozeUntil: z.string().datetime().optional(),
});

// ============================================================================
// PATCH /api/sam/agentic/recommendations/[id]
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the recommendation belongs to the user
    const recommendation = await db.sAMRecommendation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    if (recommendation.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { action, rating, snoozeUntil } = parsed.data;

    let updateData: {
      isCompleted?: boolean;
      isViewed?: boolean;
      userRating?: number | null;
      expiresAt?: Date | null;
    } = {};

    switch (action) {
      case 'complete':
        updateData = {
          isCompleted: true,
          isViewed: true,
          userRating: rating ?? null,
        };
        break;
      case 'dismiss':
        updateData = {
          isViewed: true,
          expiresAt: new Date(), // Expired = dismissed
        };
        break;
      case 'snooze':
        if (!snoozeUntil) {
          return NextResponse.json(
            { success: false, error: 'snoozeUntil is required for snooze action' },
            { status: 400 }
          );
        }
        updateData = {
          isViewed: true,
          expiresAt: new Date(snoozeUntil),
        };
        break;
    }

    const updated = await db.sAMRecommendation.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isCompleted: true,
        isViewed: true,
        userRating: true,
        expiresAt: true,
      },
    });

    // Map to status for response
    let status: 'completed' | 'dismissed' | 'snoozed' | 'pending' = 'pending';
    if (updated.isCompleted) {
      status = 'completed';
    } else if (updated.expiresAt && updated.expiresAt <= new Date()) {
      status = 'dismissed';
    } else if (updated.expiresAt && updated.expiresAt > new Date()) {
      status = 'snoozed';
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status,
        completedAt: updated.isCompleted ? new Date().toISOString() : undefined,
        snoozedUntil: status === 'snoozed' ? updated.expiresAt?.toISOString() : undefined,
      },
    });
  } catch (error) {
    logger.error('Error updating recommendation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
