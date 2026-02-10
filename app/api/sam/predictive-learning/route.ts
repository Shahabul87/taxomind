import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createPredictiveEngine } from "@sam-ai/educational";
import type {
  PredictiveStudentProfile,
  PredictiveLearningHistory,
  PredictivePerformanceMetrics,
  PredictiveBehaviorPatterns,
  StudentCohort,
  PredictiveLearningContext,
} from "@sam-ai/educational";
import { getUserScopedSAMConfig, getDatabaseAdapter } from "@/lib/adapters";
import { logger } from "@/lib/logger";
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

async function createPredictiveEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createPredictiveEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const engine = await createPredictiveEngineForUser(session.user.id);

    let result;
    switch (action) {
      case "predict-outcomes":
        result = await withRetryableTimeout(
          () => handlePredictOutcomes(engine, data, session.user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'predictOutcomes'
        );
        break;

      case "identify-at-risk":
        result = await withRetryableTimeout(
          () => handleIdentifyAtRisk(engine, data, session.user),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'identifyAtRisk'
        );
        break;

      case "recommend-interventions":
        result = await withRetryableTimeout(
          () => handleRecommendInterventions(engine, data, session.user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'recommendInterventions'
        );
        break;

      case "optimize-velocity":
        result = await withRetryableTimeout(
          () => handleOptimizeVelocity(engine, data, session.user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'optimizeVelocity'
        );
        break;

      case "calculate-probability":
        result = await withRetryableTimeout(
          () => handleCalculateProbability(engine, data, session.user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'calculateProbability'
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Predictive learning timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Operation timed out. Please try again.' },
        { status: 504 }
      );
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("Predictive learning error:", error);
    return NextResponse.json(
      { error: "Failed to process prediction" },
      { status: 500 }
    );
  }
}

async function handlePredictOutcomes(engine: ReturnType<typeof createPredictiveEngine>, data: any, userId: string) {
  const studentProfile = await buildStudentProfile(
    data.studentId || userId,
    data.courseId
  );
  return await engine.predictLearningOutcomes(studentProfile);
}

async function handleIdentifyAtRisk(engine: ReturnType<typeof createPredictiveEngine>, data: any, user: any) {
  // Check if user is admin
  if (user.role !== "ADMIN") {
    throw new Error("Insufficient permissions");
  }

  const cohort = await buildStudentCohort(data.courseId, data.timeframe);
  return await engine.identifyAtRiskStudents(cohort);
}

async function handleRecommendInterventions(engine: ReturnType<typeof createPredictiveEngine>, data: any, userId: string) {
  const studentProfile = await buildStudentProfile(
    data.studentId || userId,
    data.courseId
  );
  return await engine.recommendInterventions(studentProfile);
}

async function handleOptimizeVelocity(engine: ReturnType<typeof createPredictiveEngine>, data: any, userId: string) {
  const studentProfile = await buildStudentProfile(
    data.studentId || userId,
    data.courseId
  );
  return await engine.optimizeLearningVelocity(studentProfile);
}

async function handleCalculateProbability(engine: ReturnType<typeof createPredictiveEngine>, data: any, userId: string) {
  const context = await buildLearningContext(
    data.studentId || userId,
    data.courseId,
    data.environmentFactors
  );
  return await engine.calculateSuccessProbability(context);
}

async function buildStudentProfile(
  userId: string,
  courseId?: string
): Promise<PredictiveStudentProfile> {
  // Gather user data
  const [user, progress, activities, enrollments, achievements] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        include: {
          samLearningProfile: true,
          samStreak: true,
        },
      }),
      db.user_progress.findMany({
        where: { userId, ...(courseId ? { courseId } : {}) },
        orderBy: { lastAccessedAt: "desc" },
        take: 50,
      }),
      db.realtime_activities.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 100,
      }),
      db.enrollment.findMany({
        where: { userId },
        include: { Course: true },
      }),
      db.user_achievements.findMany({
        where: { userId },
        // orderBy: { earnedAt: "desc" }, // Field not in schema
      }),
    ]);

  if (!user) {
    throw new Error("User not found");
  }

  // Calculate learning history
  const learningHistory: PredictiveLearningHistory = {
    coursesCompleted: enrollments.filter((e: any) => e.updatedAt !== e.createdAt).length,
    averageScore: calculateAverageScore(progress),
    timeSpentLearning: calculateTotalLearningTime(activities),
    lastActivityDate: activities[0]?.timestamp || new Date(),
    learningStreak: user.samStreak?.currentStreak || 0,
    preferredLearningTime: identifyPreferredTime(activities),
    strongSubjects: identifyStrongSubjects(progress),
    weakSubjects: identifyWeakSubjects(progress),
  };

  // Calculate performance metrics
  const performanceMetrics: PredictivePerformanceMetrics = {
    overallProgress: calculateOverallProgress(progress),
    assessmentScores: extractAssessmentScores(progress),
    improvementRate: calculateImprovementRate(progress),
    consistencyScore: calculateConsistencyScore(activities),
    engagementLevel: calculateEngagementLevel(activities),
    participationRate: calculateParticipationRate(activities),
    averageScore: calculateAverageScore(progress),
  };

  // Identify behavior patterns
  const behaviorPatterns: PredictiveBehaviorPatterns = {
    studyFrequency: identifyStudyFrequency(activities),
    sessionDuration: calculateAverageSessionDuration(activities),
    contentPreferences: identifyContentPreferences(activities),
    interactionPatterns: identifyInteractionPatterns(activities),
    strugglingIndicators: identifyStrugglingIndicators(progress, activities),
  };

  return {
    userId,
    courseId,
    learningHistory,
    performanceMetrics,
    behaviorPatterns,
  };
}

async function buildStudentCohort(
  courseId: string,
  timeframe?: { start: Date; end: Date }
): Promise<StudentCohort> {
  const enrollments = await db.enrollment.findMany({
    where: {
      courseId,
      ...(timeframe
        ? {
            createdAt: {
              gte: timeframe.start,
              lte: timeframe.end,
            },
          }
        : {}),
    },
    include: {
      User: true,
    },
  });

  const students: PredictiveStudentProfile[] = [];
  for (const enrollment of enrollments) {
    try {
      const profile = await buildStudentProfile(enrollment.userId, courseId);
      students.push(profile);
    } catch (error) {
      logger.error(`Failed to build profile for user ${enrollment.userId}`);
    }
  }

  return {
    courseId,
    students,
    timeframe: timeframe || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  };
}

async function buildLearningContext(
  userId: string,
  courseId: string,
  environmentFactors?: any
): Promise<PredictiveLearningContext> {
  const studentProfile = await buildStudentProfile(userId, courseId);

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: true,
      category: true,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return {
    studentProfile,
    courseContext: {
      courseId,
      difficulty: "medium", // Would be calculated from course data
      duration: course.chapters.length * 7, // Estimated days
      prerequisites: [], // Would be extracted from course data
      assessmentTypes: ["quiz", "exam", "project"],
    },
    environmentFactors: environmentFactors || {
      deviceType: "desktop",
      networkQuality: "good",
      distractionLevel: "low",
      timeOfDay: new Date().getHours() < 12 ? "morning" : "evening",
    },
  };
}

// Helper functions
function calculateAverageScore(progress: any[]): number {
  if (progress.length === 0) return 0;
  const scores = progress
    .map((p) => p.score)
    .filter((s) => s !== null && s !== undefined);
  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
}

function calculateTotalLearningTime(activities: any[]): number {
  // Calculate total time in minutes
  let totalMinutes = 0;
  for (let i = 0; i < activities.length - 1; i++) {
    const current = new Date(activities[i].timestamp);
    const next = new Date(activities[i + 1].timestamp);
    const diff = (current.getTime() - next.getTime()) / (1000 * 60);
    if (diff < 30) {
      // Consider it same session if less than 30 minutes
      totalMinutes += diff;
    }
  }
  return totalMinutes;
}

function identifyPreferredTime(activities: any[]): string {
  const hourCounts = new Array(24).fill(0);
  activities.forEach((activity) => {
    const hour = new Date(activity.timestamp).getHours();
    hourCounts[hour]++;
  });
  const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
  if (maxHour < 6) return "early-morning";
  if (maxHour < 12) return "morning";
  if (maxHour < 18) return "afternoon";
  return "evening";
}

function identifyStrongSubjects(progress: any[]): string[] {
  const subjectScores = new Map<string, number[]>();
  progress.forEach((p) => {
    if (p.courseId && p.quizScore) {
      if (!subjectScores.has(p.courseId)) {
        subjectScores.set(p.courseId, []);
      }
      subjectScores.get(p.courseId)!.push(p.quizScore);
    }
  });

  const strongSubjects: string[] = [];
  subjectScores.forEach((scores, subject) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > 80) {
      strongSubjects.push(subject);
    }
  });
  return strongSubjects;
}

function identifyWeakSubjects(progress: any[]): string[] {
  const subjectScores = new Map<string, number[]>();
  progress.forEach((p) => {
    if (p.courseId && p.quizScore) {
      if (!subjectScores.has(p.courseId)) {
        subjectScores.set(p.courseId, []);
      }
      subjectScores.get(p.courseId)!.push(p.quizScore);
    }
  });

  const weakSubjects: string[] = [];
  subjectScores.forEach((scores, subject) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 60) {
      weakSubjects.push(subject);
    }
  });
  return weakSubjects;
}

function calculateOverallProgress(progress: any[]): number {
  if (progress.length === 0) return 0;
  const latestProgress = progress[0];
  return (latestProgress?.progressPercentage || 0) / 100;
}

function extractAssessmentScores(progress: any[]): number[] {
  return progress
    .map((p) => p.quizScore)
    .filter((s) => s !== null && s !== undefined);
}

function calculateImprovementRate(progress: any[]): number {
  if (progress.length < 2) return 0;
  const recent = progress.slice(0, 10);
  const older = progress.slice(10, 20);
  const recentAvg = calculateAverageScore(recent);
  const olderAvg = calculateAverageScore(older);
  return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
}

function calculateConsistencyScore(activities: any[]): number {
  if (activities.length === 0) return 0;
  const days = new Set<string>();
  activities.forEach((activity) => {
    days.add(new Date(activity.timestamp).toDateString());
  });
  const totalDays = Math.ceil(
    (new Date().getTime() -
      new Date(activities[activities.length - 1].timestamp).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return Math.min(1, days.size / Math.max(1, totalDays));
}

function calculateEngagementLevel(activities: any[]): number {
  if (activities.length === 0) return 0;
  const engagementActivities = activities.filter((a) =>
    [
      "VIDEO_WATCH",
      "QUIZ_SUBMIT",
      "DISCUSSION_POST",
      "RESOURCE_DOWNLOAD",
    ].includes(a.activityType)
  );
  return Math.min(1, engagementActivities.length / activities.length);
}

function calculateParticipationRate(activities: any[]): number {
  const participationActivities = activities.filter((a) =>
    ["DISCUSSION_POST", "DISCUSSION_REPLY", "QUIZ_SUBMIT"].includes(
      a.activityType
    )
  );
  return Math.min(1, participationActivities.length / Math.max(1, activities.length));
}

function identifyStudyFrequency(
  activities: any[]
): "daily" | "weekly" | "sporadic" {
  const days = new Set<string>();
  activities.forEach((activity) => {
    days.add(new Date(activity.timestamp).toDateString());
  });
  const avgDaysBetween = activities.length / days.size;
  if (avgDaysBetween < 2) return "daily";
  if (avgDaysBetween < 7) return "weekly";
  return "sporadic";
}

function calculateAverageSessionDuration(activities: any[]): number {
  const sessions: number[] = [];
  let sessionStart = 0;
  
  for (let i = 1; i < activities.length; i++) {
    const timeDiff =
      new Date(activities[i - 1].timestamp).getTime() -
      new Date(activities[i].timestamp).getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff > 30) {
      // New session
      if (sessionStart < i - 1) {
        const sessionDuration =
          (new Date(activities[sessionStart].timestamp).getTime() -
            new Date(activities[i - 1].timestamp).getTime()) /
          (1000 * 60);
        sessions.push(sessionDuration);
      }
      sessionStart = i;
    }
  }
  
  return sessions.length > 0
    ? sessions.reduce((a, b) => a + b, 0) / sessions.length
    : 30; // Default 30 minutes
}

function identifyContentPreferences(activities: any[]): string[] {
  const contentTypes = new Map<string, number>();
  activities.forEach((activity) => {
    if (activity.contentType) {
      contentTypes.set(
        activity.contentType,
        (contentTypes.get(activity.contentType) || 0) + 1
      );
    }
  });
  
  return Array.from(contentTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
}

function identifyInteractionPatterns(activities: any[]): string[] {
  const patterns: string[] = [];
  const videoCount = activities.filter((a) => a.contentType === "VIDEO").length;
  const quizCount = activities.filter((a) =>
    a.activityType?.includes("QUIZ")
  ).length;
  const discussionCount = activities.filter((a) =>
    a.activityType?.includes("DISCUSSION")
  ).length;
  
  if (videoCount > activities.length * 0.5) patterns.push("video-focused");
  if (quizCount > activities.length * 0.2) patterns.push("assessment-oriented");
  if (discussionCount > activities.length * 0.1) patterns.push("collaborative");
  
  return patterns;
}

function identifyStrugglingIndicators(
  progress: any[],
  activities: any[]
): string[] {
  const indicators: string[] = [];
  
  // Low quiz scores
  const avgScore = calculateAverageScore(progress);
  if (avgScore < 60) indicators.push("low-assessment-scores");
  
  // Repeated content
  const contentViews = new Map<string, number>();
  activities
    .filter((a) => a.contentId)
    .forEach((a) => {
      contentViews.set(a.contentId, (contentViews.get(a.contentId) || 0) + 1);
    });
  const repeatedContent = Array.from(contentViews.values()).filter(
    (count) => count > 3
  );
  if (repeatedContent.length > 0) indicators.push("repeated-content-views");
  
  // Long gaps between activities
  const recentActivity = activities[0];
  if (recentActivity) {
    const daysSinceActive = Math.floor(
      (new Date().getTime() - new Date(recentActivity.timestamp).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceActive > 7) indicators.push("extended-inactivity");
  }
  
  return indicators;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;
    const courseId = searchParams.get("courseId");
    const predictionType = searchParams.get("type");

    // Get recent predictions
    const predictions = await db.predictiveLearningAnalysis.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(courseId ? { courseId } : {}),
        ...(predictionType ? { predictionType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      predictions: predictions.map((p) => ({
        id: p.id,
        type: p.predictionType,
        confidence: p.confidence,
        validated: p.validated,
        accuracy: p.accuracy,
        createdAt: p.createdAt,
        data: JSON.parse(p.predictionData as string),
      })),
    });
  } catch (error) {
    logger.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}