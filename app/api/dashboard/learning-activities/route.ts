import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";
import { startOfDay, endOfDay, subDays, addDays } from "date-fns";
import { logger } from "@/lib/logger";

const createActivitySchema = z.object({
  type: z.enum([
    "STUDY_SESSION",
    "VIDEO_LESSON",
    "READING",
    "QUIZ",
    "ASSIGNMENT",
    "PROJECT",
    "PRACTICE",
    "LIVE_CLASS",
    "DISCUSSION",
    "REVIEW",
    "EXAM",
    "GOAL_MILESTONE",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  scheduledDate: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  estimatedDuration: z.number().min(1).max(480).default(30),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum([
      "COMPLETED",
      "IN_PROGRESS",
      "NOT_STARTED",
      "OVERDUE",
      "SKIPPED",
      "RESCHEDULED",
    ])
    .optional(),
  type: z
    .enum([
      "STUDY_SESSION",
      "VIDEO_LESSON",
      "READING",
      "QUIZ",
      "ASSIGNMENT",
      "PROJECT",
      "PRACTICE",
      "LIVE_CLASS",
      "DISCUSSION",
      "REVIEW",
      "EXAM",
      "GOAL_MILESTONE",
    ])
    .optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  courseId: z.string().optional(),
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
    const params = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };

    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.courseId) where.courseId = params.courseId;

    // Date range filtering
    if (params.startDate || params.endDate) {
      where.scheduledDate = {};
      if (params.startDate) {
        (where.scheduledDate as Record<string, unknown>).gte = startOfDay(
          params.startDate
        );
      }
      if (params.endDate) {
        (where.scheduledDate as Record<string, unknown>).lte = endOfDay(
          params.endDate
        );
      }
    } else {
      // Default: Show activities from 7 days ago to 14 days ahead
      where.scheduledDate = {
        gte: subDays(startOfDay(new Date()), 7),
        lte: addDays(endOfDay(new Date()), 14),
      };
    }

    const total = await db.learningActivity.count({ where });

    const activities = await db.learningActivity.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true },
        },
        chapter: {
          select: { id: true, title: true },
        },
      },
      orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    // Calculate summary stats
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const todayActivities = await db.learningActivity.findMany({
      where: {
        userId: user.id,
        scheduledDate: { gte: todayStart, lte: todayEnd },
      },
      take: 200,
    });

    const completedToday = todayActivities.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const plannedMinutesToday = todayActivities.reduce(
      (sum, a) => sum + a.estimatedDuration,
      0
    );
    const completedMinutesToday = todayActivities
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + (a.actualDuration || a.estimatedDuration), 0);

    return successResponse(
      activities,
      {
        page: params.page,
        limit: params.limit,
        total,
      },
      {
        todayStats: {
          total: todayActivities.length,
          completed: completedToday,
          plannedMinutes: plannedMinutesToday,
          completedMinutes: completedMinutesToday,
        },
      }
    );
  } catch (error) {
    logger.error("[LEARNING_ACTIVITIES_GET]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch learning activities",
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
    const validatedData = createActivitySchema.parse(body);

    const { courseId, chapterId, ...activityData } = validatedData;

    const activity = await db.learningActivity.create({
      data: {
        userId: user.id,
        ...activityData,
        ...(courseId && { courseId }),
        ...(chapterId && { chapterId }),
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
        chapter: {
          select: { id: true, title: true },
        },
      },
    });

    // Update daily learning log
    const dayStart = startOfDay(validatedData.scheduledDate);
    await db.dailyLearningLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: dayStart,
        },
      },
      update: {
        plannedMinutes: { increment: validatedData.estimatedDuration },
        plannedActivities: { increment: 1 },
      },
      create: {
        userId: user.id,
        date: dayStart,
        plannedMinutes: validatedData.estimatedDuration,
        plannedActivities: 1,
      },
    });

    return successResponse(activity);
  } catch (error) {
    logger.error("[LEARNING_ACTIVITIES_POST]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create learning activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
