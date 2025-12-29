import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const paramsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

interface StudyTimeSlot {
  hour: number;
  count: number;
  totalMinutes: number;
}

interface PredictionsData {
  completionDate: string;
  daysToComplete: number;
  recommendedDailyMinutes: number;
  optimalStudyTimes: string[];
  learningVelocity: number;
  burnoutRisk: "low" | "medium" | "high";
  confidence: number;
  insights: {
    averageSessionLength: number;
    mostProductiveDay: string;
    studyConsistency: number;
    weeklyTrend: "improving" | "stable" | "declining";
  };
}

interface PredictionsResponse {
  success: boolean;
  data?: PredictionsData;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /api/courses/[courseId]/smart-predictions
 * Get AI-powered learning predictions for a course
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse<PredictionsResponse>> {
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

    // Get all required data
    const [progressData, streakData, courseData] = await Promise.all([
      getProgressData(user.id, courseId),
      getStreakData(user.id, courseId),
      getCourseData(courseId),
    ]);

    // Calculate predictions
    const predictions = calculatePredictions(
      progressData,
      streakData,
      courseData
    );

    return NextResponse.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error("[SMART_PREDICTIONS_GET]", error);

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
          message: "Failed to get predictions",
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function getProgressData(userId: string, courseId: string) {
  const allProgress = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
    },
    select: {
      id: true,
      isCompleted: true,
      timeSpent: true,
      lastAccessedAt: true,
      createdAt: true,
    },
    orderBy: {
      lastAccessedAt: "asc",
    },
  });

  return allProgress;
}

async function getStreakData(userId: string, courseId: string) {
  const streakRecord = await db.study_streaks.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  return streakRecord;
}

async function getCourseData(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          Section: {
            where: { isPublished: true },
            select: {
              id: true,
              duration: true,
            },
          },
        },
      },
    },
  });

  return course;
}

function calculatePredictions(
  progressData: Array<{
    id: string;
    isCompleted: boolean;
    timeSpent: number | null;
    lastAccessedAt: Date;
    createdAt: Date;
  }>,
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
  } | null,
  courseData: {
    chapters: Array<{
      Section: Array<{
        id: string;
        duration: number | null;
      }>;
    }>;
  } | null
): PredictionsData {
  const now = new Date();

  // Calculate total sections and completed
  const totalSections =
    courseData?.chapters.reduce((acc, ch) => acc + ch.Section.length, 0) || 0;
  const completedSections = progressData.filter((p) => p.isCompleted).length;
  const remainingSections = totalSections - completedSections;

  // Analyze study patterns by hour
  const studyTimeSlots = analyzeStudyTimes(progressData);
  const optimalStudyTimes = getOptimalStudyTimes(studyTimeSlots);

  // Calculate learning velocity
  const { velocity, daysActive, firstStudyDate } =
    calculateLearningVelocity(progressData);

  // Calculate days to complete
  const effectiveVelocity = Math.max(velocity, 0.3); // Minimum velocity assumption
  const daysToComplete = Math.ceil(remainingSections / effectiveVelocity);

  // Calculate completion date
  const completionDate = new Date(now);
  completionDate.setDate(completionDate.getDate() + daysToComplete);

  // Calculate recommended daily time
  const avgSectionDuration = calculateAverageSectionDuration(courseData);
  const recommendedDailyMinutes = Math.max(
    15,
    Math.min(120, Math.ceil(effectiveVelocity * avgSectionDuration))
  );

  // Assess burnout risk
  const burnoutRisk = assessBurnoutRisk(
    velocity,
    daysActive,
    streakData?.currentStreak || 0,
    progressData
  );

  // Calculate confidence level
  const confidence = calculateConfidence(progressData.length, daysActive);

  // Calculate insights
  const insights = calculateInsights(progressData, daysActive);

  return {
    completionDate: completionDate.toISOString(),
    daysToComplete: Math.max(0, daysToComplete),
    recommendedDailyMinutes,
    optimalStudyTimes,
    learningVelocity: Number(velocity.toFixed(2)),
    burnoutRisk,
    confidence,
    insights,
  };
}

function analyzeStudyTimes(
  progressData: Array<{ lastAccessedAt: Date; timeSpent: number | null }>
): StudyTimeSlot[] {
  const hourlyData: Map<number, { count: number; totalMinutes: number }> =
    new Map();

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyData.set(i, { count: 0, totalMinutes: 0 });
  }

  // Aggregate by hour
  for (const record of progressData) {
    const hour = record.lastAccessedAt.getHours();
    const current = hourlyData.get(hour)!;
    current.count += 1;
    current.totalMinutes += Math.round((record.timeSpent || 0) / 60);
  }

  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    hour,
    count: data.count,
    totalMinutes: data.totalMinutes,
  }));
}

function getOptimalStudyTimes(studyTimeSlots: StudyTimeSlot[]): string[] {
  // Sort by activity count and total time
  const sorted = [...studyTimeSlots]
    .filter((slot) => slot.count > 0)
    .sort((a, b) => {
      // Weight by both frequency and total time spent
      const scoreA = a.count * 2 + a.totalMinutes;
      const scoreB = b.count * 2 + b.totalMinutes;
      return scoreB - scoreA;
    });

  // If no data, return default times
  if (sorted.length === 0) {
    return ["9:00 AM", "7:00 PM"];
  }

  // Get top 2 time slots
  const topSlots = sorted.slice(0, 2);

  return topSlots.map((slot) => {
    const hour = slot.hour;
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  });
}

function calculateLearningVelocity(
  progressData: Array<{
    isCompleted: boolean;
    lastAccessedAt: Date;
    createdAt: Date;
  }>
) {
  const completedRecords = progressData.filter((p) => p.isCompleted);

  if (completedRecords.length === 0) {
    return { velocity: 0, daysActive: 0, firstStudyDate: null };
  }

  // Find first study date
  const firstStudyDate = new Date(
    Math.min(...progressData.map((p) => p.createdAt.getTime()))
  );

  // Calculate days since first study
  const now = new Date();
  const daysSinceStart = Math.max(
    1,
    Math.ceil(
      (now.getTime() - firstStudyDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  // Count unique active days
  const uniqueDays = new Set(
    progressData.map((p) => p.lastAccessedAt.toISOString().split("T")[0])
  );
  const daysActive = uniqueDays.size;

  // Calculate velocity (sections per active day)
  const velocity = completedRecords.length / Math.max(1, daysActive);

  return { velocity, daysActive, firstStudyDate };
}

function calculateAverageSectionDuration(
  courseData: {
    chapters: Array<{
      Section: Array<{
        duration: number | null;
      }>;
    }>;
  } | null
): number {
  if (!courseData) return 15; // Default 15 minutes

  let totalDuration = 0;
  let sectionCount = 0;

  for (const chapter of courseData.chapters) {
    for (const section of chapter.Section) {
      totalDuration += section.duration || 15;
      sectionCount += 1;
    }
  }

  return sectionCount > 0 ? Math.round(totalDuration / sectionCount) : 15;
}

function assessBurnoutRisk(
  velocity: number,
  daysActive: number,
  currentStreak: number,
  progressData: Array<{ timeSpent: number | null; lastAccessedAt: Date }>
): "low" | "medium" | "high" {
  // Check for high intensity recent activity
  const recentWeek = new Date();
  recentWeek.setDate(recentWeek.getDate() - 7);

  const recentActivity = progressData.filter(
    (p) => p.lastAccessedAt >= recentWeek
  );
  const recentDailyAverage =
    recentActivity.length > 0 ? recentActivity.length / 7 : 0;

  // Calculate average daily time in recent week
  const recentTotalMinutes = recentActivity.reduce(
    (acc, p) => acc + Math.round((p.timeSpent || 0) / 60),
    0
  );
  const recentDailyMinutes = recentTotalMinutes / 7;

  // Risk factors
  const highVelocity = velocity > 3;
  const longStreak = currentStreak > 14;
  const highDailyTime = recentDailyMinutes > 90; // More than 1.5 hours daily
  const veryHighDailyTime = recentDailyMinutes > 150; // More than 2.5 hours daily

  // Calculate risk
  let riskScore = 0;

  if (highVelocity) riskScore += 1;
  if (longStreak) riskScore += 1;
  if (highDailyTime) riskScore += 1;
  if (veryHighDailyTime) riskScore += 2;
  if (recentDailyAverage > 4) riskScore += 1; // More than 4 sections per day

  if (riskScore >= 3) return "high";
  if (riskScore >= 1) return "medium";
  return "low";
}

function calculateConfidence(
  progressCount: number,
  daysActive: number
): number {
  // More data = higher confidence
  const dataQuality = Math.min(100, (progressCount / 20) * 100);
  const timeQuality = Math.min(100, (daysActive / 7) * 100);

  // Weight data quality higher
  const confidence = dataQuality * 0.6 + timeQuality * 0.4;

  return Math.round(Math.min(95, Math.max(30, confidence)));
}

function calculateInsights(
  progressData: Array<{
    timeSpent: number | null;
    lastAccessedAt: Date;
    isCompleted: boolean;
  }>,
  daysActive: number
): {
  averageSessionLength: number;
  mostProductiveDay: string;
  studyConsistency: number;
  weeklyTrend: "improving" | "stable" | "declining";
} {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Calculate average session length
  const totalMinutes = progressData.reduce(
    (acc, p) => acc + Math.round((p.timeSpent || 0) / 60),
    0
  );
  const averageSessionLength =
    daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0;

  // Find most productive day
  const dayActivity: Map<number, number> = new Map();
  for (let i = 0; i < 7; i++) {
    dayActivity.set(i, 0);
  }

  for (const record of progressData) {
    if (record.isCompleted) {
      const dayOfWeek = record.lastAccessedAt.getDay();
      dayActivity.set(dayOfWeek, (dayActivity.get(dayOfWeek) || 0) + 1);
    }
  }

  let mostProductiveDay = "Monday";
  let maxActivity = 0;
  for (const [day, count] of dayActivity.entries()) {
    if (count > maxActivity) {
      maxActivity = count;
      mostProductiveDay = dayNames[day];
    }
  }

  // Calculate study consistency (how regularly they study)
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentDays = new Set(
    progressData
      .filter((p) => p.lastAccessedAt >= twoWeeksAgo)
      .map((p) => p.lastAccessedAt.toISOString().split("T")[0])
  );

  const studyConsistency = Math.round((recentDays.size / 14) * 100);

  // Calculate weekly trend
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgoDate = new Date(now);
  twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);

  const thisWeekCompleted = progressData.filter(
    (p) => p.isCompleted && p.lastAccessedAt >= oneWeekAgo
  ).length;

  const lastWeekCompleted = progressData.filter(
    (p) =>
      p.isCompleted &&
      p.lastAccessedAt >= twoWeeksAgoDate &&
      p.lastAccessedAt < oneWeekAgo
  ).length;

  let weeklyTrend: "improving" | "stable" | "declining" = "stable";
  if (thisWeekCompleted > lastWeekCompleted * 1.2) {
    weeklyTrend = "improving";
  } else if (thisWeekCompleted < lastWeekCompleted * 0.8) {
    weeklyTrend = "declining";
  }

  return {
    averageSessionLength,
    mostProductiveDay,
    studyConsistency,
    weeklyTrend,
  };
}
