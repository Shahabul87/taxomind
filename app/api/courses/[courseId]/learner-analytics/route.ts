import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Validation schemas
const paramsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

interface DailyActivity {
  date: string;
  minutesStudied: number;
  sectionsCompleted: number;
  isActive: boolean;
}

interface WeeklyActivity {
  day: string;
  date: string;
  minutesStudied: number;
  sectionsCompleted: number;
  isActive: boolean;
}

interface LearningStats {
  totalTimeSpent: number; // in minutes
  averageSessionLength: number; // in minutes
  totalSessions: number;
  longestSession: number; // in minutes
  currentWeekMinutes: number;
  lastWeekMinutes: number;
  weekOverWeekChange: number; // percentage
}

interface CompletionVelocity {
  sectionsThisWeek: number;
  sectionsLastWeek: number;
  averageSectionsPerDay: number;
  estimatedCompletionDays: number | null;
}

interface LearnerAnalyticsResponse {
  success: boolean;
  data?: {
    weeklyActivity: WeeklyActivity[];
    recentActivity: DailyActivity[];
    learningStats: LearningStats;
    completionVelocity: CompletionVelocity;
    streakInfo: {
      currentStreak: number;
      longestStreak: number;
      todayStudied: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /api/courses/[courseId]/learner-analytics
 * Get detailed learning analytics for a learner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse<LearnerAnalyticsResponse>> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { courseId } = paramsSchema.parse(resolvedParams);

    const now = new Date();

    // Get all required data in parallel
    const [
      weeklyActivity,
      recentActivity,
      learningStats,
      completionVelocity,
      streakInfo,
    ] = await Promise.all([
      getWeeklyActivity(user.id, courseId, now),
      getRecentActivity(user.id, courseId, now, 14), // Last 14 days
      getLearningStats(user.id, courseId, now),
      getCompletionVelocity(user.id, courseId, now),
      getStreakInfo(user.id, courseId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        weeklyActivity,
        recentActivity,
        learningStats,
        completionVelocity,
        streakInfo,
      },
    });
  } catch (error) {
    logger.error("[LEARNER_ANALYTICS_GET]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: error.errors[0].message },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get learner analytics",
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayOfWeekIndex(date: Date): number {
  const day = date.getDay();
  // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
  return day === 0 ? 6 : day - 1;
}

async function getWeeklyActivity(
  userId: string,
  courseId: string,
  now: Date
): Promise<WeeklyActivity[]> {
  const startOfWeek = getStartOfWeek(now);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Get all progress records for this week
  const progressRecords = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: startOfWeek,
      },
    },
    take: 500,
    select: {
      lastAccessedAt: true,
      timeSpent: true,
      isCompleted: true,
    },
  });

  // Initialize weekly data
  const weeklyData: WeeklyActivity[] = weekDays.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + index);
    return {
      day,
      date: date.toISOString().split("T")[0],
      minutesStudied: 0,
      sectionsCompleted: 0,
      isActive: false,
    };
  });

  // Map progress to days
  for (const record of progressRecords) {
    const recordDate = new Date(record.lastAccessedAt);
    const dayIndex = getDayOfWeekIndex(recordDate);

    if (dayIndex >= 0 && dayIndex < 7) {
      weeklyData[dayIndex].minutesStudied += Math.round(
        (record.timeSpent || 0) / 60
      );
      if (record.isCompleted) {
        weeklyData[dayIndex].sectionsCompleted += 1;
      }
      weeklyData[dayIndex].isActive = true;
    }
  }

  return weeklyData;
}

async function getRecentActivity(
  userId: string,
  courseId: string,
  now: Date,
  days: number
): Promise<DailyActivity[]> {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get all progress records for the period
  const progressRecords = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: startDate,
      },
    },
    take: 500,
    select: {
      lastAccessedAt: true,
      timeSpent: true,
      isCompleted: true,
    },
  });

  // Initialize daily data
  const dailyMap = new Map<string, DailyActivity>();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      minutesStudied: 0,
      sectionsCompleted: 0,
      isActive: false,
    });
  }

  // Aggregate progress by date
  for (const record of progressRecords) {
    const dateStr = record.lastAccessedAt.toISOString().split("T")[0];
    const dayData = dailyMap.get(dateStr);

    if (dayData) {
      dayData.minutesStudied += Math.round((record.timeSpent || 0) / 60);
      if (record.isCompleted) {
        dayData.sectionsCompleted += 1;
      }
      dayData.isActive = true;
    }
  }

  return Array.from(dailyMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

async function getLearningStats(
  userId: string,
  courseId: string,
  now: Date
): Promise<LearningStats> {
  const startOfCurrentWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfCurrentWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Get all progress records
  const allProgress = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
    },
    take: 500,
    select: {
      timeSpent: true,
      lastAccessedAt: true,
    },
  });

  // Calculate total time and session stats
  let totalTimeSpent = 0;
  let currentWeekMinutes = 0;
  let lastWeekMinutes = 0;
  let longestSession = 0;

  // Group by date to count sessions
  const sessionsByDate = new Map<string, number>();

  for (const record of allProgress) {
    const timeInMinutes = Math.round((record.timeSpent || 0) / 60);
    totalTimeSpent += timeInMinutes;

    if (timeInMinutes > longestSession) {
      longestSession = timeInMinutes;
    }

    const dateStr = record.lastAccessedAt.toISOString().split("T")[0];
    sessionsByDate.set(
      dateStr,
      (sessionsByDate.get(dateStr) || 0) + timeInMinutes
    );

    // Check if in current week
    if (record.lastAccessedAt >= startOfCurrentWeek) {
      currentWeekMinutes += timeInMinutes;
    }
    // Check if in last week
    else if (
      record.lastAccessedAt >= startOfLastWeek &&
      record.lastAccessedAt < startOfCurrentWeek
    ) {
      lastWeekMinutes += timeInMinutes;
    }
  }

  const totalSessions = sessionsByDate.size;
  const averageSessionLength =
    totalSessions > 0 ? Math.round(totalTimeSpent / totalSessions) : 0;

  // Calculate week-over-week change
  const weekOverWeekChange =
    lastWeekMinutes > 0
      ? Math.round(
          ((currentWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
        )
      : currentWeekMinutes > 0
        ? 100
        : 0;

  return {
    totalTimeSpent,
    averageSessionLength,
    totalSessions,
    longestSession,
    currentWeekMinutes,
    lastWeekMinutes,
    weekOverWeekChange,
  };
}

async function getCompletionVelocity(
  userId: string,
  courseId: string,
  now: Date
): Promise<CompletionVelocity> {
  const startOfCurrentWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfCurrentWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Get completed sections this week and last week
  const [sectionsThisWeek, sectionsLastWeek, totalProgress] = await Promise.all(
    [
      db.user_progress.count({
        where: {
          userId,
          courseId,
          isCompleted: true,
          lastAccessedAt: {
            gte: startOfCurrentWeek,
          },
        },
      }),
      db.user_progress.count({
        where: {
          userId,
          courseId,
          isCompleted: true,
          lastAccessedAt: {
            gte: startOfLastWeek,
            lt: startOfCurrentWeek,
          },
        },
      }),
      db.user_progress.findMany({
        where: {
          userId,
          courseId,
          isCompleted: true,
        },
        take: 500,
        select: {
          lastAccessedAt: true,
        },
        orderBy: {
          lastAccessedAt: "asc",
        },
      }),
    ]
  );

  // Calculate average sections per day
  let averageSectionsPerDay = 0;
  if (totalProgress.length > 0) {
    const firstCompletion = totalProgress[0].lastAccessedAt;
    const daysSinceStart = Math.max(
      1,
      Math.ceil(
        (now.getTime() - firstCompletion.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    averageSectionsPerDay = Number(
      (totalProgress.length / daysSinceStart).toFixed(2)
    );
  }

  // Estimate completion days
  let estimatedCompletionDays: number | null = null;
  if (averageSectionsPerDay > 0) {
    // Get remaining sections
    const [completedCount, totalSections] = await Promise.all([
      db.user_progress.count({
        where: {
          userId,
          courseId,
          isCompleted: true,
        },
      }),
      db.section.count({
        where: {
          chapter: {
            courseId,
          },
          isPublished: true,
        },
      }),
    ]);

    const remainingSections = totalSections - completedCount;
    if (remainingSections > 0) {
      estimatedCompletionDays = Math.ceil(
        remainingSections / averageSectionsPerDay
      );
    } else {
      estimatedCompletionDays = 0;
    }
  }

  return {
    sectionsThisWeek,
    sectionsLastWeek,
    averageSectionsPerDay,
    estimatedCompletionDays,
  };
}

async function getStreakInfo(userId: string, courseId: string) {
  const streakRecord = await db.study_streaks.findFirst({
    where: {
      userId,
      courseId,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastStudyDate: true,
    },
  });

  // Check if studied today
  const today = getStartOfDay(new Date());
  const todayProgress = await db.user_progress.findFirst({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: today,
      },
    },
  });

  return {
    currentStreak: streakRecord?.currentStreak ?? 0,
    longestStreak: streakRecord?.longestStreak ?? 0,
    todayStudied: !!todayProgress,
  };
}
