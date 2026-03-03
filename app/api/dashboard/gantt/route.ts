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
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
} from "date-fns";

const querySchema = z.object({
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  weeks: z.coerce.number().min(1).max(12).default(1),
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

    // Calculate date range
    const referenceDate = params.startDate || new Date();
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(addWeeks(weekStart, params.weeks - 1), {
      weekStartsOn: 0,
    });

    // Fetch daily learning logs for the range
    const dailyLogs = await db.dailyLearningLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: { date: "asc" },
      take: 200,
    });

    // Fetch activities for the range
    const activities = await db.learningActivity.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      take: 200,
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    // Get all days in the range
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Build timeline data for each day
    const timeline = allDays.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayName = format(day, "EEE");
      const dayLabel = format(day, "MMM d");
      const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
      const isPast = day < startOfDay(new Date());

      // Find daily log for this day
      const log = dailyLogs.find(
        (l) => format(l.date, "yyyy-MM-dd") === dateStr
      );

      // Find activities for this day
      const dayActivities = activities.filter(
        (a) => format(a.scheduledDate, "yyyy-MM-dd") === dateStr
      );

      // Calculate metrics
      const plannedMinutes = log?.plannedMinutes || 0;
      const actualMinutes = log?.actualMinutes || 0;
      const plannedHours = Math.round((plannedMinutes / 60) * 10) / 10;
      const actualHours = Math.round((actualMinutes / 60) * 10) / 10;

      const completedActivities = dayActivities.filter(
        (a) => a.status === "COMPLETED"
      ).length;
      const totalActivities = dayActivities.length;
      const completionRate =
        totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0;

      return {
        date: dateStr,
        dayName,
        dayLabel,
        isToday,
        isPast,
        metrics: {
          plannedHours,
          actualHours,
          plannedMinutes,
          actualMinutes,
          completedActivities,
          totalActivities,
          completionRate,
          focusScore: log?.focusScore || null,
          productivityScore: log?.productivityScore || null,
        },
        activities: dayActivities.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          status: a.status,
          startTime: a.startTime,
          endTime: a.endTime,
          estimatedDuration: a.estimatedDuration,
          actualDuration: a.actualDuration,
          progress: a.progress,
          courseName: a.course?.title,
        })),
      };
    });

    // Calculate weekly summaries
    const weeklyData: Array<{
      weekStart: string;
      weekEnd: string;
      totalPlannedHours: number;
      totalActualHours: number;
      totalActivities: number;
      completedActivities: number;
      averageCompletionRate: number;
      days: typeof timeline;
    }> = [];

    for (let i = 0; i < params.weeks; i++) {
      const wStart = addWeeks(weekStart, i);
      const wEnd = endOfWeek(wStart, { weekStartsOn: 0 });

      const weekDays = timeline.filter((d) => {
        const dayDate = new Date(d.date);
        return dayDate >= wStart && dayDate <= wEnd;
      });

      const weekPlannedMinutes = weekDays.reduce(
        (sum, d) => sum + d.metrics.plannedMinutes,
        0
      );
      const weekActualMinutes = weekDays.reduce(
        (sum, d) => sum + d.metrics.actualMinutes,
        0
      );
      const weekTotalActivities = weekDays.reduce(
        (sum, d) => sum + d.metrics.totalActivities,
        0
      );
      const weekCompletedActivities = weekDays.reduce(
        (sum, d) => sum + d.metrics.completedActivities,
        0
      );

      weeklyData.push({
        weekStart: format(wStart, "yyyy-MM-dd"),
        weekEnd: format(wEnd, "yyyy-MM-dd"),
        totalPlannedHours: Math.round((weekPlannedMinutes / 60) * 10) / 10,
        totalActualHours: Math.round((weekActualMinutes / 60) * 10) / 10,
        totalActivities: weekTotalActivities,
        completedActivities: weekCompletedActivities,
        averageCompletionRate:
          weekTotalActivities > 0
            ? Math.round((weekCompletedActivities / weekTotalActivities) * 100)
            : 0,
        days: weekDays,
      });
    }

    // Calculate overall summary
    const overallPlannedMinutes = timeline.reduce(
      (sum, d) => sum + d.metrics.plannedMinutes,
      0
    );
    const overallActualMinutes = timeline.reduce(
      (sum, d) => sum + d.metrics.actualMinutes,
      0
    );
    const overallTotalActivities = timeline.reduce(
      (sum, d) => sum + d.metrics.totalActivities,
      0
    );
    const overallCompletedActivities = timeline.reduce(
      (sum, d) => sum + d.metrics.completedActivities,
      0
    );

    return successResponse({
      range: {
        start: format(weekStart, "yyyy-MM-dd"),
        end: format(weekEnd, "yyyy-MM-dd"),
        weeks: params.weeks,
        totalDays: allDays.length,
      },
      summary: {
        totalPlannedHours: Math.round((overallPlannedMinutes / 60) * 10) / 10,
        totalActualHours: Math.round((overallActualMinutes / 60) * 10) / 10,
        totalActivities: overallTotalActivities,
        completedActivities: overallCompletedActivities,
        overallCompletionRate:
          overallTotalActivities > 0
            ? Math.round(
                (overallCompletedActivities / overallTotalActivities) * 100
              )
            : 0,
        efficiency:
          overallPlannedMinutes > 0
            ? Math.round((overallActualMinutes / overallPlannedMinutes) * 100)
            : 0,
      },
      weeks: weeklyData,
      timeline,
    });
  } catch (error) {
    logger.error("[GANTT_GET]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch gantt timeline data",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
