import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const paramsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

interface StreakResponse {
  success: boolean;
  data?: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string;
    streakStart: string;
    weeklyActivity: boolean[]; // Mon-Sun
    weeklyGoalMinutes: number;
    weeklyActualMinutes: number;
    todayStudied: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /api/courses/[courseId]/streak
 * Get user's streak data for a specific course
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse<StreakResponse>> {
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

    // Get or create streak record
    let streakRecord = await db.study_streaks.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
      },
    });

    // Calculate weekly activity from user_progress
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const weeklyActivity = await calculateWeeklyActivity(user.id, courseId, startOfWeek);

    // Check if user studied today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayStudied = await checkTodayActivity(user.id, courseId, todayStart);

    if (!streakRecord) {
      // Create new streak record
      streakRecord = await db.study_streaks.create({
        data: {
          id: `streak_${user.id}_${courseId}`,
          userId: user.id,
          courseId: courseId,
          currentStreak: todayStudied ? 1 : 0,
          longestStreak: todayStudied ? 1 : 0,
          lastStudyDate: todayStudied ? now : new Date(0),
          streakStart: todayStudied ? now : new Date(0),
          weeklyGoalMinutes: 120, // Default 2 hours per week
          weeklyActualMinutes: 0,
          updatedAt: now,
        },
      });
    } else {
      // Update streak based on activity
      const updatedStreak = await updateStreakIfNeeded(
        streakRecord,
        todayStudied,
        now
      );
      if (updatedStreak) {
        streakRecord = updatedStreak;
      }
    }

    // Calculate weekly minutes from user_progress
    const weeklyMinutes = await calculateWeeklyMinutes(user.id, courseId, startOfWeek);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: streakRecord.currentStreak,
        longestStreak: streakRecord.longestStreak,
        lastStudyDate: streakRecord.lastStudyDate.toISOString(),
        streakStart: streakRecord.streakStart.toISOString(),
        weeklyActivity,
        weeklyGoalMinutes: streakRecord.weeklyGoalMinutes,
        weeklyActualMinutes: weeklyMinutes,
        todayStudied,
      },
    });
  } catch (error) {
    console.error("[STREAK_GET]", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to get streak data" },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[courseId]/streak
 * Record study activity and update streak
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse<StreakResponse>> {
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

    const body = await req.json().catch(() => ({}));
    const minutesStudied = body.minutesStudied || 0;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Get or create streak record
    let streakRecord = await db.study_streaks.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
      },
    });

    if (!streakRecord) {
      // Create new streak record
      streakRecord = await db.study_streaks.create({
        data: {
          id: `streak_${user.id}_${courseId}`,
          userId: user.id,
          courseId: courseId,
          currentStreak: 1,
          longestStreak: 1,
          lastStudyDate: now,
          streakStart: now,
          weeklyGoalMinutes: 120,
          weeklyActualMinutes: minutesStudied,
          updatedAt: now,
        },
      });
    } else {
      // Update streak
      const lastStudyDate = new Date(streakRecord.lastStudyDate);
      lastStudyDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (todayStart.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newCurrentStreak = streakRecord.currentStreak;
      let newStreakStart = streakRecord.streakStart;

      if (daysDiff === 0) {
        // Same day - no change to streak count
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        newCurrentStreak += 1;
      } else {
        // Streak broken - reset
        newCurrentStreak = 1;
        newStreakStart = now;
      }

      streakRecord = await db.study_streaks.update({
        where: { id: streakRecord.id },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(streakRecord.longestStreak, newCurrentStreak),
          lastStudyDate: now,
          streakStart: newStreakStart,
          weeklyActualMinutes: streakRecord.weeklyActualMinutes + minutesStudied,
          updatedAt: now,
        },
      });
    }

    // Get updated weekly activity
    const startOfWeek = getStartOfWeek(now);
    const weeklyActivity = await calculateWeeklyActivity(user.id, courseId, startOfWeek);
    const weeklyMinutes = await calculateWeeklyMinutes(user.id, courseId, startOfWeek);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: streakRecord.currentStreak,
        longestStreak: streakRecord.longestStreak,
        lastStudyDate: streakRecord.lastStudyDate.toISOString(),
        streakStart: streakRecord.streakStart.toISOString(),
        weeklyActivity,
        weeklyGoalMinutes: streakRecord.weeklyGoalMinutes,
        weeklyActualMinutes: weeklyMinutes,
        todayStudied: true,
      },
    });
  } catch (error) {
    console.error("[STREAK_POST]", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to update streak" },
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function calculateWeeklyActivity(
  userId: string,
  courseId: string,
  startOfWeek: Date
): Promise<boolean[]> {
  const weeklyActivity: boolean[] = [false, false, false, false, false, false, false];

  // Get all progress updates for this week
  const progressRecords = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: startOfWeek,
      },
    },
    select: {
      lastAccessedAt: true,
    },
  });

  // Map progress to days of week
  for (const record of progressRecords) {
    const dayIndex = getDayOfWeekIndex(record.lastAccessedAt);
    weeklyActivity[dayIndex] = true;
  }

  return weeklyActivity;
}

async function checkTodayActivity(
  userId: string,
  courseId: string,
  todayStart: Date
): Promise<boolean> {
  const todayProgress = await db.user_progress.findFirst({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: todayStart,
      },
    },
  });

  return !!todayProgress;
}

async function calculateWeeklyMinutes(
  userId: string,
  courseId: string,
  startOfWeek: Date
): Promise<number> {
  const result = await db.user_progress.aggregate({
    where: {
      userId,
      courseId,
      lastAccessedAt: {
        gte: startOfWeek,
      },
    },
    _sum: {
      timeSpent: true,
    },
  });

  // timeSpent is in seconds, convert to minutes
  return Math.round((result._sum.timeSpent || 0) / 60);
}

function getDayOfWeekIndex(date: Date): number {
  const day = date.getDay();
  // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
  return day === 0 ? 6 : day - 1;
}

async function updateStreakIfNeeded(
  streakRecord: {
    id: string;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
    streakStart: Date;
    weeklyGoalMinutes: number;
    weeklyActualMinutes: number;
  },
  todayStudied: boolean,
  now: Date
) {
  const lastStudyDate = new Date(streakRecord.lastStudyDate);
  lastStudyDate.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (todayStart.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If streak is broken (more than 1 day gap) and user studied today, reset streak
  if (daysDiff > 1 && todayStudied) {
    return await db.study_streaks.update({
      where: { id: streakRecord.id },
      data: {
        currentStreak: 1,
        streakStart: now,
        lastStudyDate: now,
        updatedAt: now,
      },
    });
  }

  // If consecutive day and user studied, increment streak
  if (daysDiff === 1 && todayStudied) {
    const newStreak = streakRecord.currentStreak + 1;
    return await db.study_streaks.update({
      where: { id: streakRecord.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streakRecord.longestStreak, newStreak),
        lastStudyDate: now,
        updatedAt: now,
      },
    });
  }

  // If same day and studied, just update lastStudyDate
  if (daysDiff === 0 && todayStudied) {
    return await db.study_streaks.update({
      where: { id: streakRecord.id },
      data: {
        lastStudyDate: now,
        updatedAt: now,
      },
    });
  }

  return null;
}
