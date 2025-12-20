import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { samPersonalizationEngine } from "@/lib/sam-engines/educational/sam-personalization-engine";
import { logger } from '@/lib/logger';
import {
  LearningBehavior,
  PersonalizationContext,
} from "@/lib/sam-engines/educational/sam-personalization-engine";

export async function POST(req: NextRequest) {
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

    let result;
    switch (action) {
      case "detect-learning-style":
        result = await handleDetectLearningStyle(data, session.user.id);
        break;

      case "optimize-cognitive-load":
        result = await handleOptimizeCognitiveLoad(data, session.user.id);
        break;

      case "recognize-emotional-state":
        result = await handleRecognizeEmotionalState(data, session.user.id);
        break;

      case "analyze-motivation":
        result = await handleAnalyzeMotivation(data, session.user.id);
        break;

      case "generate-learning-path":
        result = await handleGenerateLearningPath(data, session.user.id);
        break;

      case "apply-personalization":
        result = await handleApplyPersonalization(data, session.user.id);
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
    logger.error("Personalization error:", error);
    return NextResponse.json(
      { error: "Failed to process personalization request" },
      { status: 500 }
    );
  }
}

async function handleDetectLearningStyle(data: any, userId: string) {
  const behavior = await buildLearningBehavior(data.userId || userId);
  return await samPersonalizationEngine.detectLearningStyle(behavior);
}

async function handleOptimizeCognitiveLoad(data: any, userId: string) {
  const { content } = data;
  
  if (!content) {
    throw new Error("Content is required");
  }

  const student = await db.user.findUnique({
    where: { id: data.studentId || userId },
    include: {
      samLearningProfile: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return await samPersonalizationEngine.optimizeCognitiveLoad(content, student);
}

async function handleRecognizeEmotionalState(data: any, userId: string) {
  const interactions = await getRecentInteractions(data.userId || userId);
  return await samPersonalizationEngine.recognizeEmotionalState(interactions);
}

async function handleAnalyzeMotivation(data: any, userId: string) {
  const history = await buildLearningHistory(data.userId || userId);
  return await samPersonalizationEngine.analyzeMotivationPatterns(history);
}

async function handleGenerateLearningPath(data: any, userId: string) {
  const profile = await buildStudentProfile(data.userId || userId);
  return await samPersonalizationEngine.generatePersonalizedPath(profile);
}

async function handleApplyPersonalization(data: any, userId: string) {
  const context: PersonalizationContext = {
    userId: data.userId || userId,
    currentContent: data.currentContent,
    learningGoals: data.learningGoals,
    timeConstraints: data.timeConstraints,
    preferenceOverrides: data.preferenceOverrides,
  };

  return await samPersonalizationEngine.applyPersonalization(context);
}

async function buildLearningBehavior(userId: string): Promise<LearningBehavior> {
  const [activities, progress, achievements] = await Promise.all([
    db.realtime_activities.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 200,
    }),
    db.user_progress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: "desc" },
      take: 100,
    }),
    db.user_achievements.findMany({
      where: { userId },
      // orderBy: { earnedAt: "desc" }, // Field not in schema
      take: 50,
    }),
  ]);

  // Process session patterns
  const sessionPatterns = extractSessionPatterns(activities);
  
  // Process content interactions
  const contentInteractions = activities.map((activity) => ({
    contentId: activity.courseId || activity.chapterId || "",
    contentType: activity.activityType || "",
    interactionType: activity.activityType,
    timestamp: activity.timestamp,
    duration: activity.duration || 0,
    completionRate: (activity.metadata as any)?.completionRate || 0,
    repeatViews: (activity.metadata as any)?.repeatViews || 0,
    engagementScore: (activity.metadata as any)?.engagementScore || 0.5,
  }));

  // Process assessment history
  const assessmentHistory = progress
    .filter((p) => p.progressPercent !== null)
    .map((p) => ({
      assessmentId: p.chapterId || "",
      score: p.progressPercent || 0,
      timeSpent: p.timeSpent || 0,
      attempts: 1,
      mistakePatterns: [],
      strengthAreas: [],
    }));

  // Extract time preferences
  const timePreferences = extractTimePreferences(activities);

  // Extract device usage
  const deviceUsage = extractDeviceUsage(activities);

  return {
    userId,
    sessionPatterns,
    contentInteractions,
    assessmentHistory,
    timePreferences,
    deviceUsage,
  };
}

async function getRecentInteractions(userId: string) {
  const activities = await db.realtime_activities.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return activities.map((activity) => ({
    userId,
    type: activity.activityType,
    timestamp: activity.timestamp,
    responseTime: (activity.metadata as any)?.responseTime || 0,
    isError: activity.activityType === "ERROR",
    metadata: activity.metadata,
  }));
}

async function buildLearningHistory(userId: string) {
  const [activities, achievements, progress] = await Promise.all([
    db.realtime_activities.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 500,
    }),
    db.user_achievements.findMany({
      where: { userId },
    }),
    db.user_progress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    userId,
    activities,
    achievements,
    progress,
  };
}

async function buildStudentProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      Enrollment: {
        include: {
          Course: true,
        },
      },
      samLearningProfile: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Identify skill gaps from progress
  const progress = await db.user_progress.findMany({
    where: { userId },
    orderBy: { lastAccessedAt: "desc" },
    take: 50,
  });

  const skillGaps = progress
    .filter((p) => p.progressPercent && p.progressPercent < 70)
    .map((p) => ({
      skill: p.chapterId || "unknown",
      score: p.progressPercent || 0,
    }));

  // Extract career goals from enrollments
  const careerGoals = user.Enrollment.map((e: any) => e.Course.title).slice(0, 3);

  // Determine learning pace
  const avgProgress = progress.reduce(
    (sum, p) => sum + (p.progressPercent || 0),
    0
  ) / Math.max(1, progress.length);
  
  const learningPace = avgProgress > 80 ? "fast" : avgProgress > 50 ? "normal" : "slow";

  return {
    userId,
    skillGaps,
    careerGoals,
    learningPace,
  };
}

function extractSessionPatterns(activities: any[]) {
  const sessions: any[] = [];
  let currentSession: any = null;

  activities.forEach((activity) => {
    if (
      !currentSession ||
      activity.timestamp.getTime() - currentSession.endTime.getTime() >
        30 * 60 * 1000
    ) {
      // New session
      if (currentSession) {
        sessions.push(currentSession);
      }
      currentSession = {
        startTime: activity.timestamp,
        endTime: activity.timestamp,
        activities: [activity],
        contentViewed: 1,
        assessmentsTaken: 0,
        notesCreated: 0,
      };
    } else {
      currentSession.endTime = activity.timestamp;
      currentSession.activities.push(activity);
      currentSession.contentViewed++;
      
      if (activity.activityType.includes("QUIZ")) {
        currentSession.assessmentsTaken++;
      }
    }
  });

  if (currentSession) {
    sessions.push(currentSession);
  }

  return sessions.map((session) => ({
    startTime: session.startTime,
    endTime: session.endTime,
    duration: (session.endTime - session.startTime) / (1000 * 60), // minutes
    activeDuration: session.duration * 0.8, // estimate
    contentViewed: session.contentViewed,
    assessmentsTaken: session.assessmentsTaken,
    notesCreated: session.notesCreated,
    focusScore: Math.min(1, session.activeDuration / session.duration),
  }));
}

function extractTimePreferences(activities: any[]) {
  const hourCounts = new Map<string, number>();

  activities.forEach((activity) => {
    const key = `${activity.timestamp.getDay()}-${activity.timestamp.getHours()}`;
    hourCounts.set(key, (hourCounts.get(key) || 0) + 1);
  });

  const preferences: any[] = [];
  hourCounts.forEach((count, key) => {
    const [day, hour] = key.split("-").map(Number);
    preferences.push({
      dayOfWeek: day,
      hourOfDay: hour,
      productivity: count / activities.length,
      preferenceStrength: Math.min(1, count / 10),
    });
  });

  return preferences.sort((a, b) => b.productivity - a.productivity).slice(0, 10);
}

function extractDeviceUsage(activities: any[]) {
  const deviceCounts = new Map<string, number>();
  const deviceDurations = new Map<string, number>();

  activities.forEach((activity) => {
    const device = activity.metadata?.device || "desktop";
    deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
    deviceDurations.set(
      device,
      (deviceDurations.get(device) || 0) + (activity.duration || 0)
    );
  });

  const usage: any[] = [];
  deviceCounts.forEach((count, device) => {
    usage.push({
      deviceType: device,
      usagePercentage: count / activities.length,
      averageSessionDuration: deviceDurations.get(device)! / count,
      preferredForType: [],
    });
  });

  return usage;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;
    const type = searchParams.get("type") || "overview";

    let result;
    switch (type) {
      case "learning-style":
        result = await db.learningStyleAnalysis.findFirst({
          where: { userId },
          orderBy: { analyzedAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            styleStrengths: JSON.parse(result.styleStrengths as string),
          };
        }
        break;

      case "emotional-state":
        result = await db.emotionalStateAnalysis.findFirst({
          where: { userId },
          orderBy: { analyzedAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            indicators: JSON.parse(result.indicators as string),
          };
        }
        break;

      case "motivation":
        result = await db.motivationProfile.findFirst({
          where: { userId },
          orderBy: { analyzedAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            intrinsicFactors: JSON.parse(result.intrinsicFactors as string),
            extrinsicFactors: JSON.parse(result.extrinsicFactors as string),
          };
        }
        break;

      case "learning-path":
        result = await db.personalizedLearningPath.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            nodes: JSON.parse(result.nodes as string),
            edges: JSON.parse(result.edges as string),
            alternativePaths: JSON.parse(result.alternativePaths as string),
          };
        }
        break;

      case "overview":
      default:
        const [learningStyle, emotionalState, motivation, learningPath] =
          await Promise.all([
            db.learningStyleAnalysis.findFirst({
              where: { userId },
              orderBy: { analyzedAt: "desc" },
            }),
            db.emotionalStateAnalysis.findFirst({
              where: { userId },
              orderBy: { analyzedAt: "desc" },
            }),
            db.motivationProfile.findFirst({
              where: { userId },
              orderBy: { analyzedAt: "desc" },
            }),
            db.personalizedLearningPath.findFirst({
              where: { userId },
              orderBy: { createdAt: "desc" },
            }),
          ]);

        result = {
          learningStyle: learningStyle
            ? {
                primaryStyle: learningStyle.primaryStyle,
                confidence: learningStyle.confidence,
                analyzedAt: learningStyle.analyzedAt,
              }
            : null,
          emotionalState: emotionalState
            ? {
                currentEmotion: emotionalState.currentEmotion,
                trend: emotionalState.trend,
                analyzedAt: emotionalState.analyzedAt,
              }
            : null,
          motivation: motivation
            ? {
                currentLevel: motivation.currentLevel,
                sustainabilityScore: motivation.sustainabilityScore,
                analyzedAt: motivation.analyzedAt,
              }
            : null,
          learningPath: learningPath
            ? {
                pathId: learningPath.pathId,
                targetOutcome: learningPath.targetOutcome,
                estimatedDuration: learningPath.estimatedDuration,
                createdAt: learningPath.createdAt,
              }
            : null,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching personalization data:", error);
    return NextResponse.json(
      { error: "Failed to fetch personalization data" },
      { status: 500 }
    );
  }
}