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
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
  format,
  differenceInDays,
  eachDayOfInterval,
} from "date-fns";

const updateStreakSchema = z.object({
  useFreeze: z.boolean().optional(),
  updateWeeklyGoal: z.number().min(60).max(3360).optional(), // 1-56 hours per week in minutes
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

    // Get or create streak record
    let streak = await db.learningStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await db.learningStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          weeklyGoalMinutes: 420, // 7 hours default
        },
      });
    }

    // Check if streak needs updating (might be broken)
    const today = startOfDay(new Date());
    const lastActive = streak.lastActiveDate
      ? startOfDay(streak.lastActiveDate)
      : null;

    let streakStatus: "active" | "at_risk" | "broken" = "active";
    let daysSinceActive = 0;

    if (lastActive) {
      daysSinceActive = differenceInDays(today, lastActive);

      if (daysSinceActive === 0) {
        streakStatus = "active";
      } else if (daysSinceActive === 1) {
        streakStatus = "at_risk"; // Haven&apos;t completed today yet
      } else {
        // Check if a freeze was used
        if (daysSinceActive === 2 && streak.freezesUsed > 0) {
          const lastFreeze = streak.lastFreezeDate
            ? startOfDay(streak.lastFreezeDate)
            : null;
          if (lastFreeze && differenceInDays(today, lastFreeze) <= 2) {
            streakStatus = "active";
          } else {
            streakStatus = "broken";
          }
        } else {
          streakStatus = "broken";
        }
      }
    } else {
      streakStatus = "broken";
    }

    // Get weekly progress
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

    const weeklyLogs = await db.dailyLearningLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: weekStart,
          lte: today,
        },
      },
    });

    const weeklyCompletedMinutes = weeklyLogs.reduce(
      (sum, log) => sum + log.actualMinutes,
      0
    );

    const weeklyProgress =
      streak.weeklyGoalMinutes > 0
        ? Math.min(
            100,
            Math.round((weeklyCompletedMinutes / streak.weeklyGoalMinutes) * 100)
          )
        : 0;

    // Get activity history for the last 30 days
    const thirtyDaysAgo = subDays(today, 30);
    const recentLogs = await db.dailyLearningLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: { date: "asc" },
    });

    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const activityCalendar = last30Days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const log = recentLogs.find(
        (l) => format(l.date, "yyyy-MM-dd") === dateStr
      );

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (log && log.actualMinutes > 0) {
        if (log.actualMinutes >= 120) level = 4; // 2+ hours
        else if (log.actualMinutes >= 60) level = 3; // 1-2 hours
        else if (log.actualMinutes >= 30) level = 2; // 30-60 min
        else level = 1; // < 30 min
      }

      return {
        date: dateStr,
        minutes: log?.actualMinutes || 0,
        level,
        isToday: format(today, "yyyy-MM-dd") === dateStr,
      };
    });

    // Calculate statistics
    const activeDaysLast30 = recentLogs.filter((l) => l.actualMinutes > 0).length;
    const totalMinutesLast30 = recentLogs.reduce(
      (sum, l) => sum + l.actualMinutes,
      0
    );
    const avgMinutesPerActiveDay =
      activeDaysLast30 > 0
        ? Math.round(totalMinutesLast30 / activeDaysLast30)
        : 0;

    return successResponse({
      streak: {
        current: streakStatus === "broken" ? 0 : streak.currentStreak,
        longest: streak.longestStreak,
        status: streakStatus,
        daysSinceActive,
        streakStartDate: streak.streakStartDate,
        lastActiveDate: streak.lastActiveDate,
      },
      freezes: {
        available: streak.freezesAvailable,
        used: streak.freezesUsed,
        lastUsed: streak.lastFreezeDate,
      },
      weeklyProgress: {
        goalMinutes: streak.weeklyGoalMinutes,
        completedMinutes: weeklyCompletedMinutes,
        goalHours: Math.round((streak.weeklyGoalMinutes / 60) * 10) / 10,
        completedHours: Math.round((weeklyCompletedMinutes / 60) * 10) / 10,
        progress: weeklyProgress,
        weekStart: format(weekStart, "yyyy-MM-dd"),
        weekEnd: format(weekEnd, "yyyy-MM-dd"),
      },
      statistics: {
        totalActiveDays: streak.totalActiveDays,
        totalMinutesAllTime: streak.totalMinutesAllTime,
        averageDailyMinutes: Math.round(streak.averageDailyMinutes),
        activeDaysLast30,
        totalMinutesLast30,
        avgMinutesPerActiveDay,
      },
      activityCalendar,
    });
  } catch (error) {
    console.error("[STREAK_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch streak data",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const { useFreeze, updateWeeklyGoal } = updateStreakSchema.parse(body);

    let streak = await db.learningStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await db.learningStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          weeklyGoalMinutes: 420,
        },
      });
    }

    const updates: Record<string, unknown> = {};

    // Handle streak freeze
    if (useFreeze) {
      if (streak.freezesAvailable <= 0) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "No streak freezes available",
          HttpStatus.BAD_REQUEST
        );
      }

      const today = startOfDay(new Date());
      const lastActive = streak.lastActiveDate
        ? startOfDay(streak.lastActiveDate)
        : null;

      if (!lastActive) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Cannot use freeze - no active streak to protect",
          HttpStatus.BAD_REQUEST
        );
      }

      const daysSinceActive = differenceInDays(today, lastActive);

      if (daysSinceActive <= 1) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Freeze not needed - streak is still active",
          HttpStatus.BAD_REQUEST
        );
      }

      if (daysSinceActive > 2) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Cannot use freeze - streak already broken (more than 1 day missed)",
          HttpStatus.BAD_REQUEST
        );
      }

      // Apply freeze
      updates.freezesAvailable = streak.freezesAvailable - 1;
      updates.freezesUsed = streak.freezesUsed + 1;
      updates.lastFreezeDate = today;
      updates.lastActiveDate = subDays(today, 1); // Pretend yesterday was active
    }

    // Handle weekly goal update
    if (updateWeeklyGoal !== undefined) {
      updates.weeklyGoalMinutes = updateWeeklyGoal;
    }

    if (Object.keys(updates).length > 0) {
      streak = await db.learningStreak.update({
        where: { userId: user.id },
        data: updates,
      });
    }

    return successResponse({
      message: useFreeze
        ? "Streak freeze applied successfully"
        : "Streak settings updated",
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        freezesAvailable: streak.freezesAvailable,
        freezesUsed: streak.freezesUsed,
        weeklyGoalMinutes: streak.weeklyGoalMinutes,
      },
    });
  } catch (error) {
    console.error("[STREAK_PATCH]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update streak",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
