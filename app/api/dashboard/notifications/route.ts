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
import { subDays } from "date-fns";

const notificationFilterSchema = z.object({
  category: z.enum(["DONE", "MISSED", "UPCOMING", "ACHIEVEMENT"]).optional(),
  timeRange: z.enum(["24h", "7d", "30d", "all"]).default("7d"),
  read: z.coerce.boolean().optional(),
});

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
    const filters = notificationFilterSchema.parse(params);

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };

    if (filters.category) where.category = filters.category;
    if (filters.read !== undefined) where.read = filters.read;

    // Time range filtering
    if (filters.timeRange !== "all") {
      const daysMap = { "24h": 1, "7d": 7, "30d": 30 };
      where.createdAt = {
        gte: subDays(new Date(), daysMap[filters.timeRange]),
      };
    }

    const total = await db.dashboardNotification.count({ where });

    const notifications = await db.dashboardNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    // Calculate category counts
    const counts = {
      done: await db.dashboardNotification.count({
        where: { userId: user.id, category: "DONE" },
      }),
      missed: await db.dashboardNotification.count({
        where: { userId: user.id, category: "MISSED" },
      }),
      upcoming: await db.dashboardNotification.count({
        where: { userId: user.id, category: "UPCOMING" },
      }),
      achievements: await db.dashboardNotification.count({
        where: { userId: user.id, category: "ACHIEVEMENT" },
      }),
      unread: await db.dashboardNotification.count({
        where: { userId: user.id, read: false },
      }),
    };

    return successResponse(
      notifications,
      { page: pagination.page, limit: pagination.limit, total },
      { counts }
    );
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch notifications",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

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

    const notificationSchema = z.object({
      type: z.enum(["EMAIL", "IN_APP", "SMS", "PUSH", "SLACK", "WEBHOOK"]),
      category: z.enum(["DONE", "MISSED", "UPCOMING", "ACHIEVEMENT"]),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      actionable: z.boolean().default(false),
      actionUrl: z.string().max(500).optional(),
      actionLabel: z.string().max(100).optional(),
      metadata: z.record(z.unknown()).optional(),
      expiresAt: z.coerce.date().optional(),
    });

    const validatedData = notificationSchema.parse(body);

    const notification = await db.dashboardNotification.create({
      data: {
        userId: user.id,
        ...validatedData,
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
    console.error("[NOTIFICATIONS_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
