import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { LearningAlertType, AlertChannel } from '@prisma/client';
import { subDays, subHours } from 'date-fns';

/**
 * Unified Notifications API v2
 *
 * This endpoint consolidates notifications from:
 * - LearningNotification (primary, feature-rich with quiet hours, scheduling)
 * - DashboardNotification (legacy, simpler categories)
 *
 * The LearningNotification system is used as the primary source as it has:
 * - Richer notification types (learning alerts)
 * - Quiet hours support
 * - Scheduling capabilities
 * - Delivery status tracking
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetNotificationsQuerySchema = z.object({
  type: z.nativeEnum(LearningAlertType).optional(),
  read: z.coerce.boolean().optional(),
  dismissed: z.coerce.boolean().optional(),
  timeRange: z.enum(['1h', '24h', '7d', '30d', 'all']).default('7d'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  // Legacy pagination support
  page: z.coerce.number().int().min(1).optional(),
  // Include legacy dashboard notifications
  includeLegacy: z.coerce.boolean().optional().default(false),
});

const CreateNotificationSchema = z.object({
  type: z.nativeEnum(LearningAlertType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  icon: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  activityId: z.string().optional(),
  goalId: z.string().optional(),
  courseId: z.string().optional(),
  channels: z.array(z.nativeEnum(AlertChannel)).default(['IN_APP']),
  scheduledFor: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  actionUrl: z.string().max(500).optional(),
  actionLabel: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const MarkReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
});

// ============================================================================
// GET - List notifications (unified)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetNotificationsQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      read: searchParams.get('read') ?? undefined,
      dismissed: searchParams.get('dismissed') ?? undefined,
      timeRange: searchParams.get('timeRange') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      includeLegacy: searchParams.get('includeLegacy') ?? undefined,
    });

    // Convert page to offset for legacy support
    const offset = query.page ? (query.page - 1) * query.limit : query.offset;

    // Build where clause for learning notifications
    const where: Record<string, unknown> = {
      userId,
      dismissed: query.dismissed ?? false,
    };

    if (query.type) where.type = query.type;
    if (query.read !== undefined) where.read = query.read;

    // Time range filtering
    if (query.timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (query.timeRange) {
        case '1h':
          startDate = subHours(now, 1);
          break;
        case '24h':
          startDate = subDays(now, 1);
          break;
        case '7d':
          startDate = subDays(now, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = subDays(now, 7);
      }
      where.createdAt = { gte: startDate };
    }

    // Exclude expired notifications
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    // Fetch learning notifications (primary)
    const [total, notifications] = await Promise.all([
      db.learningNotification.count({ where }),
      db.learningNotification.findMany({
        where,
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        skip: offset,
        take: query.limit,
      }),
    ]);

    // Format notifications with source tag
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      source: 'learning' as const,
      type: n.type,
      title: n.title,
      message: n.message,
      icon: n.icon,
      color: n.color,
      read: n.read,
      dismissed: n.dismissed,
      createdAt: n.createdAt,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      metadata: n.metadata,
      // Related entities
      activityId: n.activityId,
      goalId: n.goalId,
      courseId: n.courseId,
    }));

    // Optionally include legacy dashboard notifications
    let legacyNotifications: typeof formattedNotifications = [];
    if (query.includeLegacy) {
      const legacyWhere: Record<string, unknown> = { userId };
      if (query.read !== undefined) legacyWhere.read = query.read;

      const legacy = await db.dashboardNotification.findMany({
        where: legacyWhere,
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit legacy notifications
      });

      legacyNotifications = legacy.map((n) => ({
        id: n.id,
        source: 'dashboard' as const,
        type: n.category as unknown as LearningAlertType,
        title: n.title,
        message: n.description ?? '',
        icon: null,
        color: null,
        read: n.read,
        dismissed: false,
        createdAt: n.createdAt,
        actionUrl: n.actionUrl,
        actionLabel: n.actionLabel,
        metadata: n.metadata as Record<string, unknown> | null,
        activityId: null,
        goalId: null,
        courseId: null,
      }));
    }

    // Calculate counts
    const [unreadCount, typeCounts] = await Promise.all([
      db.learningNotification.count({
        where: { userId, read: false, dismissed: false },
      }),
      db.learningNotification.groupBy({
        by: ['type'],
        where: { userId, dismissed: false },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: [...formattedNotifications, ...legacyNotifications],
      metadata: {
        pagination: {
          total,
          limit: query.limit,
          offset,
          page: query.page ?? Math.floor(offset / query.limit) + 1,
          hasMore: offset + notifications.length < total,
        },
        counts: {
          unread: unreadCount,
          byType: typeCounts.reduce(
            (acc, item) => {
              acc[item.type] = item._count;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_V2]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new notification
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const validated = CreateNotificationSchema.parse(body);

    // Check user notification preferences before creating
    const preferences = await db.learningNotificationPreference.findUnique({
      where: { userId },
    });

    // If preferences exist and notifications are disabled, skip
    if (preferences && !preferences.enabled) {
      return NextResponse.json({
        success: true,
        data: null,
        metadata: {
          skipped: true,
          reason: 'User has disabled notifications',
        },
      });
    }

    // Check quiet hours if preferences exist
    if (preferences?.quietHoursStart && preferences?.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isInQuietHours =
        currentTime >= preferences.quietHoursStart &&
        currentTime <= preferences.quietHoursEnd;

      if (isInQuietHours && !validated.scheduledFor) {
        // Schedule notification for after quiet hours
        const [endHours, endMinutes] = preferences.quietHoursEnd.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(endHours, endMinutes + 1, 0, 0);

        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        validated.scheduledFor = scheduledTime;
      }
    }

    const notification = await db.learningNotification.create({
      data: {
        userId,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        icon: validated.icon,
        color: validated.color,
        activityId: validated.activityId,
        goalId: validated.goalId,
        courseId: validated.courseId,
        channels: validated.channels,
        scheduledFor: validated.scheduledFor,
        expiresAt: validated.expiresAt,
        actionUrl: validated.actionUrl,
        actionLabel: validated.actionLabel,
        metadata: validated.metadata,
        deliveryStatus: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_POST_V2]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Mark notifications as read
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { notificationIds } = MarkReadSchema.parse(body);

    // Mark learning notifications as read
    const updated = await db.learningNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user owns the notifications
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updated.count,
      },
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH_V2]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
