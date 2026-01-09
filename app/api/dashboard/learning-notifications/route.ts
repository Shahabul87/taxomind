import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validations/dashboard";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";
import { LearningAlertType, AlertChannel } from "@prisma/client";
import { subDays, subHours } from "date-fns";

// Filter schema for learning notifications
const learningNotificationFilterSchema = z.object({
  type: z.nativeEnum(LearningAlertType).optional(),
  read: z.coerce.boolean().optional(),
  dismissed: z.coerce.boolean().optional(),
  timeRange: z.enum(["1h", "24h", "7d", "30d", "all"]).default("7d"),
});

// Create notification schema
const createNotificationSchema = z.object({
  type: z.nativeEnum(LearningAlertType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  icon: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  activityId: z.string().optional(),
  goalId: z.string().optional(),
  courseId: z.string().optional(),
  channels: z.array(z.nativeEnum(AlertChannel)).default(["IN_APP"]),
  scheduledFor: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  actionUrl: z.string().max(500).optional(),
  actionLabel: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/dashboard/learning-notifications
 * Fetch paginated learning notifications for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const pagination = paginationSchema.parse(params);
    const filters = learningNotificationFilterSchema.parse(params);

    // Build where clause
    const where: Record<string, unknown> = {
      userId: user.id,
      dismissed: false, // Default to non-dismissed
    };

    if (filters.type) where.type = filters.type;
    if (filters.read !== undefined) where.read = filters.read;
    if (filters.dismissed !== undefined) where.dismissed = filters.dismissed;

    // Time range filtering
    if (filters.timeRange !== "all") {
      const now = new Date();
      let startDate: Date;
      switch (filters.timeRange) {
        case "1h":
          startDate = subHours(now, 1);
          break;
        case "24h":
          startDate = subDays(now, 1);
          break;
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        default:
          startDate = subDays(now, 7);
      }
      where.createdAt = { gte: startDate };
    }

    // Exclude expired notifications
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    const total = await db.learningNotification.count({ where });

    const notifications = await db.learningNotification.findMany({
      where,
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    // Calculate counts by type
    const typeCounts = await db.learningNotification.groupBy({
      by: ["type"],
      where: { userId: user.id, dismissed: false },
      _count: true,
    });

    const counts = {
      total: await db.learningNotification.count({
        where: { userId: user.id, dismissed: false },
      }),
      unread: await db.learningNotification.count({
        where: { userId: user.id, read: false, dismissed: false },
      }),
      byType: typeCounts.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return successResponse(
      notifications,
      { page: pagination.page, limit: pagination.limit, total },
      { counts }
    );
  } catch (error) {
    console.error("[LEARNING_NOTIFICATIONS_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch learning notifications",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

/**
 * POST /api/dashboard/learning-notifications
 * Create a new learning notification
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const body = await req.json();
    const validatedData = createNotificationSchema.parse(body);

    // Check user notification preferences before creating
    const preferences = await db.learningNotificationPreference.findUnique({
      where: { userId: user.id },
    });

    // If preferences exist and notifications are disabled, don't create
    if (preferences && !preferences.enabled) {
      return successResponse(null, undefined, {
        skipped: true,
        reason: "User has disabled notifications",
      });
    }

    // Check quiet hours if preferences exist
    if (preferences?.quietHoursStart && preferences?.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const isInQuietHours =
        currentTime >= preferences.quietHoursStart &&
        currentTime <= preferences.quietHoursEnd;

      if (isInQuietHours && !validatedData.scheduledFor) {
        // Schedule notification for after quiet hours
        const [endHours, endMinutes] = preferences.quietHoursEnd
          .split(":")
          .map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(endHours, endMinutes + 1, 0, 0);

        // If end time is before current time, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        validatedData.scheduledFor = scheduledTime;
      }
    }

    const notification = await db.learningNotification.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        icon: validatedData.icon,
        color: validatedData.color,
        activityId: validatedData.activityId,
        goalId: validatedData.goalId,
        courseId: validatedData.courseId,
        channels: validatedData.channels,
        scheduledFor: validatedData.scheduledFor,
        expiresAt: validatedData.expiresAt,
        actionUrl: validatedData.actionUrl,
        actionLabel: validatedData.actionLabel,
        metadata: validatedData.metadata,
        deliveryStatus: "pending",
      },
    });

    return successResponse(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[LEARNING_NOTIFICATIONS_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create learning notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
