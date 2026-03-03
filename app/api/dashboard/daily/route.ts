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
import { logger } from "@/lib/logger";
import { startOfDay, endOfDay, format, differenceInMinutes } from "date-fns";

const querySchema = z.object({
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
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
    const { date } = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Fetch scheduled learning activities for the day
    const activities = await db.learningActivity.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      take: 200,
      include: {
        course: {
          select: { id: true, title: true },
        },
        chapter: {
          select: { id: true, title: true },
        },
      },
      orderBy: [{ startTime: "asc" }, { scheduledDate: "asc" }],
    });

    // Fetch tasks for the day
    const tasks = await db.dashboardTodo.findMany({
      where: {
        userId: user.id,
        OR: [
          { dueDate: { gte: dayStart, lte: dayEnd } },
          { dueDate: null, completed: false },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 10,
    });

    // Fetch active goals
    const goals = await db.learningGoal.findMany({
      where: {
        userId: user.id,
        status: { in: ["ON_TRACK", "AHEAD", "BEHIND", "AT_RISK"] },
      },
      include: {
        milestones: {
          orderBy: { position: "asc" },
          take: 3,
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { targetDate: "asc" },
      take: 5,
    });

    // Fetch or create daily learning log
    let dailyLog = await db.dailyLearningLog.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: dayStart,
        },
      },
    });

    if (!dailyLog) {
      // Calculate planned metrics from activities
      const plannedMinutes = activities.reduce(
        (sum, a) => sum + a.estimatedDuration,
        0
      );

      dailyLog = await db.dailyLearningLog.create({
        data: {
          userId: user.id,
          date: dayStart,
          plannedMinutes,
          plannedActivities: activities.length,
          plannedTasks: tasks.filter((t) => !t.completed).length,
        },
      });
    }

    // Fetch streak info
    let streak = await db.learningStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await db.learningStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    // Calculate daily stats
    const completedActivities = activities.filter(
      (a) => a.status === "COMPLETED"
    );
    const actualMinutes = completedActivities.reduce(
      (sum, a) => sum + (a.actualDuration || a.estimatedDuration),
      0
    );
    const completionRate =
      activities.length > 0
        ? Math.round((completedActivities.length / activities.length) * 100)
        : 0;

    // Get greeting based on time
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17) greeting = "Good evening";

    // Calculate weekly progress
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklyLogs = await db.dailyLearningLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay(weekStart),
          lte: dayEnd,
        },
      },
      take: 200,
    });

    const weeklyCompletedMinutes = weeklyLogs.reduce(
      (sum, log) => sum + log.actualMinutes,
      0
    );
    const weeklyGoal = streak.weeklyGoalMinutes;
    const weeklyProgress =
      weeklyGoal > 0
        ? Math.min(100, Math.round((weeklyCompletedMinutes / weeklyGoal) * 100))
        : 0;

    const response = {
      date: format(date, "yyyy-MM-dd"),
      greeting,
      userName: user.name?.split(" ")[0] || "Learner",

      // Daily Stats
      stats: {
        streak: streak.currentStreak,
        plannedHours: Math.round((dailyLog.plannedMinutes / 60) * 10) / 10,
        completedHours: Math.round((actualMinutes / 60) * 10) / 10,
        completionRate,
        weeklyProgress,
        weeklyGoalHours: Math.round((weeklyGoal / 60) * 10) / 10,
        weeklyCompletedHours:
          Math.round((weeklyCompletedMinutes / 60) * 10) / 10,
      },

      // Activities for the day
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        startTime: a.startTime,
        endTime: a.endTime,
        estimatedDuration: a.estimatedDuration,
        actualDuration: a.actualDuration,
        status: a.status,
        progress: a.progress,
        priority: a.priority,
        tags: a.tags,
        courseName: a.course?.title,
        chapterName: a.chapter?.title,
      })),

      // Tasks
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        dueDate: t.dueDate,
        tags: t.tags,
      })),

      // Goals
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        progress: g.progress,
        status: g.status,
        targetDate: g.targetDate,
        courseName: g.course?.title,
        milestones: g.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          completed: m.completed,
          targetDate: m.targetDate,
        })),
      })),

      // Daily Log
      dailyLog: {
        id: dailyLog.id,
        plannedMinutes: dailyLog.plannedMinutes,
        actualMinutes: dailyLog.actualMinutes,
        plannedActivities: dailyLog.plannedActivities,
        completedActivities: dailyLog.completedActivities,
        focusScore: dailyLog.focusScore,
        productivityScore: dailyLog.productivityScore,
      },

      // Streak Info
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        freezesAvailable: streak.freezesAvailable,
      },
    };

    return successResponse(response);
  } catch (error) {
    logger.error("[DAILY_AGENDA_GET]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch daily agenda",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
