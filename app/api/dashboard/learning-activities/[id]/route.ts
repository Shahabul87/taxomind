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
import { startOfDay } from "date-fns";

const updateActivitySchema = z.object({
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
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  courseId: z.string().nullable().optional(),
  chapterId: z.string().nullable().optional(),
  sectionId: z.string().nullable().optional(),
  scheduledDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  estimatedDuration: z.number().min(1).max(480).optional(),
  actualDuration: z.number().min(0).nullable().optional(),
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
  progress: z.number().min(0).max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await context.params;

    const activity = await db.learningActivity.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true },
        },
        chapter: {
          select: { id: true, title: true },
        },
        parentActivity: {
          select: { id: true, title: true, recurrenceRule: true },
        },
        childActivities: {
          select: { id: true, scheduledDate: true, status: true },
          take: 10,
        },
      },
    });

    if (!activity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (activity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "Access denied",
        HttpStatus.FORBIDDEN
      );
    }

    return successResponse(activity);
  } catch (error) {
    console.error("[LEARNING_ACTIVITY_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await context.params;

    // Check if activity exists and belongs to user
    const existingActivity = await db.learningActivity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingActivity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "Access denied",
        HttpStatus.FORBIDDEN
      );
    }

    const body = await req.json();
    const validatedData = updateActivitySchema.parse(body);

    // Handle status change to COMPLETED
    const wasCompleted = existingActivity.status === "COMPLETED";
    const isNowCompleted = validatedData.status === "COMPLETED";
    const completedAt = isNowCompleted && !wasCompleted ? new Date() : undefined;

    const activity = await db.learningActivity.update({
      where: { id },
      data: {
        ...validatedData,
        ...(completedAt && { completedAt }),
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

    // Update daily learning log if status changed
    if (isNowCompleted && !wasCompleted) {
      const dayStart = startOfDay(activity.scheduledDate);
      const actualDuration =
        activity.actualDuration || activity.estimatedDuration;

      await db.dailyLearningLog.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: dayStart,
          },
        },
        update: {
          actualMinutes: { increment: actualDuration },
          completedActivities: { increment: 1 },
        },
        create: {
          userId: user.id,
          date: dayStart,
          actualMinutes: actualDuration,
          completedActivities: 1,
        },
      });

      // Update streak
      await updateStreak(user.id);
    } else if (!isNowCompleted && wasCompleted) {
      // Decrement if un-completing
      const dayStart = startOfDay(activity.scheduledDate);
      const duration =
        existingActivity.actualDuration || existingActivity.estimatedDuration;

      await db.dailyLearningLog.update({
        where: {
          userId_date: {
            userId: user.id,
            date: dayStart,
          },
        },
        data: {
          actualMinutes: { decrement: duration },
          completedActivities: { decrement: 1 },
        },
      });
    }

    return successResponse(activity);
  } catch (error) {
    console.error("[LEARNING_ACTIVITY_PATCH]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await context.params;

    const activity = await db.learningActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (activity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "Access denied",
        HttpStatus.FORBIDDEN
      );
    }

    // Update daily learning log
    const dayStart = startOfDay(activity.scheduledDate);

    if (activity.status === "COMPLETED") {
      const duration = activity.actualDuration || activity.estimatedDuration;
      await db.dailyLearningLog.update({
        where: {
          userId_date: {
            userId: user.id,
            date: dayStart,
          },
        },
        data: {
          actualMinutes: { decrement: duration },
          completedActivities: { decrement: 1 },
          plannedMinutes: { decrement: activity.estimatedDuration },
          plannedActivities: { decrement: 1 },
        },
      });
    } else {
      await db.dailyLearningLog.update({
        where: {
          userId_date: {
            userId: user.id,
            date: dayStart,
          },
        },
        data: {
          plannedMinutes: { decrement: activity.estimatedDuration },
          plannedActivities: { decrement: 1 },
        },
      });
    }

    await db.learningActivity.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[LEARNING_ACTIVITY_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

// Helper function to update streak
async function updateStreak(userId: string): Promise<void> {
  const today = startOfDay(new Date());

  let streak = await db.learningStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    streak = await db.learningStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        streakStartDate: today,
        lastActiveDate: today,
        totalActiveDays: 1,
      },
    });
    return;
  }

  const lastActive = streak.lastActiveDate
    ? startOfDay(streak.lastActiveDate)
    : null;
  const daysSinceActive = lastActive
    ? Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 999;

  if (daysSinceActive === 0) {
    // Already active today, no change
    return;
  } else if (daysSinceActive === 1) {
    // Consecutive day - extend streak
    const newStreak = streak.currentStreak + 1;
    await db.learningStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
        totalActiveDays: { increment: 1 },
      },
    });
  } else {
    // Streak broken - start new one
    await db.learningStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        streakStartDate: today,
        lastActiveDate: today,
        totalActiveDays: { increment: 1 },
      },
    });
  }
}
