/**
 * SAM Agentic Notifications API
 * Manages SAM-related notifications for proactive interventions
 *
 * Phase 4: Proactive Features
 * - Lists SAM notifications
 * - Marks notifications as read/dismissed
 * - Tracks notification engagement
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetNotificationsQuerySchema = z.object({
  type: z.enum(['SAM_CHECK_IN', 'SAM_INTERVENTION', 'SAM_MILESTONE', 'SAM_RECOMMENDATION']).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const MarkReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1).max(100),
});

const DismissSchema = z.object({
  notificationId: z.string(),
  feedback: z.enum(['helpful', 'not_helpful', 'too_frequent', 'irrelevant']).optional(),
});

// ============================================================================
// GET - Get user&apos;s SAM notifications
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetNotificationsQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      unreadOnly: searchParams.get('unreadOnly') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
      type: {
        in: query.type
          ? [query.type]
          : ['SAM_CHECK_IN', 'SAM_INTERVENTION', 'SAM_MILESTONE', 'SAM_RECOMMENDATION'],
      },
    };

    if (query.unreadOnly) {
      whereClause.read = false;
    }

    // Get notifications
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      db.notification.count({ where: whereClause }),
      db.notification.count({
        where: {
          ...whereClause,
          read: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + notifications.length < total,
        },
        unreadCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching SAM notifications:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Mark notifications as read
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = MarkReadSchema.parse(body);

    // Update notifications (only user's own)
    const result = await db.notification.updateMany({
      where: {
        id: { in: validated.notificationIds },
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    logger.info(`Marked ${result.count} notifications as read for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        updated: result.count,
      },
    });
  } catch (error) {
    logger.error('Error marking notifications as read:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Dismiss notification with feedback
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = DismissSchema.parse(body);

    // Get notification to verify ownership
    const notification = await db.notification.findFirst({
      where: {
        id: validated.notificationId,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Update notification with dismissal - since schema doesn't have data field,
    // we encode dismissal info in the type field
    const dismissedType = `${notification.type}:dismissed${validated.feedback ? `:${validated.feedback}` : ''}`;
    await db.notification.update({
      where: { id: validated.notificationId },
      data: {
        read: true,
        type: dismissedType,
      },
    });

    // Track feedback for improving notification quality
    if (validated.feedback) {
      logger.info('Notification feedback received', {
        notificationId: validated.notificationId,
        userId: session.user.id,
        feedback: validated.feedback,
        type: notification.type,
      });

      // TODO: Store feedback for analytics and notification tuning
    }

    return NextResponse.json({
      success: true,
      data: {
        dismissed: true,
        feedbackRecorded: !!validated.feedback,
      },
    });
  } catch (error) {
    logger.error('Error dismissing notification:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to dismiss notification' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Clear all read SAM notifications
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete only read SAM notifications for this user
    const result = await db.notification.deleteMany({
      where: {
        userId: session.user.id,
        read: true,
        type: {
          in: ['SAM_CHECK_IN', 'SAM_INTERVENTION', 'SAM_MILESTONE', 'SAM_RECOMMENDATION'],
        },
      },
    });

    logger.info(`Cleared ${result.count} read SAM notifications for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
      },
    });
  } catch (error) {
    logger.error('Error clearing notifications:', error);

    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
