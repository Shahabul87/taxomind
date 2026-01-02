import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { z } from "zod";
import { AchievementType, BadgeLevel } from "@prisma/client";

// Validation schemas
const paramsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

// Achievement definitions matching the UI
// Uses valid AchievementType enum values from Prisma schema
const ACHIEVEMENT_DEFINITIONS = [
  // Progress-based achievements
  {
    id: "first_step",
    achievementType: AchievementType.CHAPTER_COMPLETION,
    title: "First Step",
    description: "Complete your first section",
    requirement: 1,
    type: "progress",
    rarity: "common",
    points: 10,
    badgeLevel: BadgeLevel.BRONZE,
  },
  {
    id: "getting_started",
    achievementType: AchievementType.STUDY_STREAK,
    title: "Getting Started",
    description: "Complete 5 sections",
    requirement: 5,
    type: "progress",
    rarity: "common",
    points: 10,
    badgeLevel: BadgeLevel.BRONZE,
  },
  {
    id: "making_progress",
    achievementType: AchievementType.PERFECT_QUIZ,
    title: "Making Progress",
    description: "Complete 10 sections",
    requirement: 10,
    type: "progress",
    rarity: "rare",
    points: 25,
    badgeLevel: BadgeLevel.SILVER,
  },
  {
    id: "halfway_hero",
    achievementType: AchievementType.SKILL_MASTERY,
    title: "Halfway Hero",
    description: "Complete 50% of the course",
    requirement: 50,
    type: "milestone",
    rarity: "rare",
    points: 25,
    badgeLevel: BadgeLevel.SILVER,
  },
  {
    id: "almost_there",
    achievementType: AchievementType.THOROUGH_LEARNER,
    title: "Almost There",
    description: "Complete 75% of the course",
    requirement: 75,
    type: "milestone",
    rarity: "epic",
    points: 50,
    badgeLevel: BadgeLevel.GOLD,
  },
  {
    id: "course_master",
    achievementType: AchievementType.COURSE_COMPLETION,
    title: "Course Master",
    description: "Complete the entire course",
    requirement: 100,
    type: "milestone",
    rarity: "legendary",
    points: 100,
    badgeLevel: BadgeLevel.PLATINUM,
  },
  // Streak-based achievements
  {
    id: "streak_starter",
    achievementType: AchievementType.STUDY_STREAK,
    title: "Streak Starter",
    description: "Maintain a 3-day learning streak",
    requirement: 3,
    type: "streak",
    rarity: "common",
    points: 10,
    badgeLevel: BadgeLevel.BRONZE,
  },
  {
    id: "week_warrior",
    achievementType: AchievementType.CONSISTENT_LEARNER,
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    requirement: 7,
    type: "streak",
    rarity: "rare",
    points: 25,
    badgeLevel: BadgeLevel.SILVER,
  },
  {
    id: "dedicated_learner",
    achievementType: AchievementType.CONSISTENT_LEARNER,
    title: "Dedicated Learner",
    description: "Maintain a 14-day learning streak",
    requirement: 14,
    type: "streak",
    rarity: "epic",
    points: 50,
    badgeLevel: BadgeLevel.GOLD,
  },
  {
    id: "unstoppable",
    achievementType: AchievementType.SKILL_MASTERY,
    title: "Unstoppable",
    description: "Maintain a 30-day learning streak",
    requirement: 30,
    type: "streak",
    rarity: "legendary",
    points: 100,
    badgeLevel: BadgeLevel.PLATINUM,
  },
  // Time-based achievements
  {
    id: "study_session",
    achievementType: AchievementType.TIME_MILESTONE,
    title: "Study Session",
    description: "Study for 30 minutes total",
    requirement: 30,
    type: "time",
    rarity: "common",
    points: 10,
    badgeLevel: BadgeLevel.BRONZE,
  },
  {
    id: "dedicated_time",
    achievementType: AchievementType.FAST_LEARNER,
    title: "Dedicated Time",
    description: "Study for 2 hours total",
    requirement: 120,
    type: "time",
    rarity: "rare",
    points: 25,
    badgeLevel: BadgeLevel.SILVER,
  },
] as const;

interface AchievementData {
  id: string;
  title: string;
  description: string;
  requirement: number;
  type: "progress" | "streak" | "time" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  isUnlocked: boolean;
  currentValue: number;
  unlockedAt: string | null;
  points: number;
}

interface AchievementsResponse {
  success: boolean;
  data?: {
    achievements: AchievementData[];
    totalPoints: number;
    level: number;
    unlockedCount: number;
    totalCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * GET /api/courses/[courseId]/achievements
 * Get user&apos;s achievements for a specific course
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse<AchievementsResponse>> {
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

    // Get user&apos;s progress data for this course
    const [progressData, streakData, userAchievements] = await Promise.all([
      getProgressData(user.id, courseId),
      getStreakData(user.id, courseId),
      db.user_achievements.findMany({
        where: {
          userId: user.id,
          courseId: courseId,
        },
      }),
    ]);

    // Create a map of unlocked achievements
    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.title, ua])
    );

    // Calculate achievements and check for newly unlocked ones
    const achievements: AchievementData[] = [];
    const newlyUnlocked: typeof ACHIEVEMENT_DEFINITIONS[number][] = [];
    let totalPoints = 0;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const existingUnlock = unlockedMap.get(def.title);
      let currentValue = 0;

      switch (def.type) {
        case "progress":
          currentValue = progressData.completedSections;
          break;
        case "milestone":
          currentValue = progressData.progressPercentage;
          break;
        case "streak":
          currentValue = streakData.currentStreak;
          break;
        case "time":
          currentValue = progressData.totalMinutes;
          break;
      }

      const shouldBeUnlocked = currentValue >= def.requirement;

      // If should be unlocked but not in database, mark for creation
      if (shouldBeUnlocked && !existingUnlock) {
        newlyUnlocked.push(def);
      }

      const isUnlocked = shouldBeUnlocked || !!existingUnlock;

      if (isUnlocked) {
        totalPoints += def.points;
      }

      achievements.push({
        id: def.id,
        title: def.title,
        description: def.description,
        requirement: def.requirement,
        type: def.type,
        rarity: def.rarity,
        isUnlocked,
        currentValue,
        unlockedAt: existingUnlock?.unlockedAt?.toISOString() ?? null,
        points: def.points,
      });
    }

    // Persist newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      await db.user_achievements.createMany({
        data: newlyUnlocked.map((def) => ({
          id: `achievement_${user.id}_${courseId}_${def.id}`,
          userId: user.id,
          courseId: courseId,
          achievementType: def.achievementType,
          title: def.title,
          description: def.description,
          pointsEarned: def.points,
          badgeLevel: def.badgeLevel,
          metadata: {
            type: def.type,
            rarity: def.rarity,
            requirement: def.requirement,
          },
          unlockedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      // Update unlockedAt for newly unlocked achievements
      const now = new Date().toISOString();
      for (const def of newlyUnlocked) {
        const achievement = achievements.find((a) => a.id === def.id);
        if (achievement) {
          achievement.unlockedAt = now;
        }
      }
    }

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const level = Math.floor(totalPoints / 50) + 1;

    return NextResponse.json({
      success: true,
      data: {
        achievements,
        totalPoints,
        level,
        unlockedCount,
        totalCount: ACHIEVEMENT_DEFINITIONS.length,
      },
    });
  } catch (error) {
    console.error("[ACHIEVEMENTS_GET]", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to get achievements" },
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function getProgressData(userId: string, courseId: string) {
  // Get all progress records for this course
  const progressRecords = await db.user_progress.findMany({
    where: {
      userId,
      courseId,
    },
    select: {
      isCompleted: true,
      timeSpent: true,
    },
  });

  // Get total sections in course
  const chapters = await db.chapter.findMany({
    where: { courseId },
    include: {
      sections: {
        where: { isPublished: true },
        select: { id: true },
      },
    },
  });

  const totalSections = chapters.reduce(
    (acc, chapter) => acc + chapter.sections.length,
    0
  );

  const completedSections = progressRecords.filter((p) => p.isCompleted).length;
  const progressPercentage =
    totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  // Calculate total time in minutes
  const totalMinutes = Math.round(
    progressRecords.reduce((acc, p) => acc + (p.timeSpent || 0), 0) / 60
  );

  return {
    completedSections,
    totalSections,
    progressPercentage,
    totalMinutes,
  };
}

async function getStreakData(userId: string, courseId: string) {
  const streakRecord = await db.study_streaks.findFirst({
    where: {
      userId,
      courseId,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
    },
  });

  return {
    currentStreak: streakRecord?.currentStreak ?? 0,
    longestStreak: streakRecord?.longestStreak ?? 0,
  };
}
