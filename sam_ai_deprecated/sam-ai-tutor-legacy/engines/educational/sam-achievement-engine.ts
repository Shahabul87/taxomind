import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  TEACHER_ACHIEVEMENTS,
  CHALLENGES,
  calculateLevel,
  checkAchievementProgress,
  getAchievementRecommendations,
  type Achievement,
  type Challenge
} from '@/sam/utils/sam-achievements';
import {
  unlockSAMBadge,
  awardSAMPoints,
  updateSAMStreak,
  recordSAMInteraction,
  getUserSAMStats
} from '@/sam/utils/sam-database';
import { SAMInteractionType, SAMStreakType } from '@prisma/client';

// Track user action and check for achievement unlocks
export async function trackAchievementProgress(
  userId: string,
  action: string,
  metadata: Record<string, any> = {},
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
): Promise<{
  pointsAwarded: number;
  achievementsUnlocked: Achievement[];
  challengesCompleted: Challenge[];
  levelUp?: { oldLevel: number; newLevel: number };
}> {
  try {
    // Get current user stats
    const userStats = await getUserSAMStats(userId, context?.courseId);
    const currentLevel = calculateLevel(userStats.points);
    
    // Update action counter
    await recordSAMInteraction({
      userId,
      interactionType: action as SAMInteractionType,
      context: JSON.stringify({ action, metadata, context }),
      result: JSON.stringify(metadata),
      courseId: context?.courseId,
      chapterId: context?.chapterId,
      sectionId: context?.sectionId,
    });

    let totalPointsAwarded = 0;
    const achievementsUnlocked: Achievement[] = [];
    const challengesCompleted: Challenge[] = [];

    // Get user's current achievements
    const existingAchievements = await db.sAMBadge.findMany({
      where: { userId },
      select: { description: true }
    });
    const achievementIds = existingAchievements.map(a => a.description);

    // Check for achievement unlocks
    for (const achievement of TEACHER_ACHIEVEMENTS) {
      if (achievementIds.includes(achievement.id)) continue;

      // Check prerequisites
      const achievementExt = achievement as any;
      if (achievementExt.unlockConditions?.prerequisiteAchievements) {
        const hasPrerequisites = achievementExt.unlockConditions.prerequisiteAchievements.every(
          (prereq: string) => achievementIds.includes(prereq)
        );
        if (!hasPrerequisites) continue;
      }

      // Build updated stats for checking
      const updatedStats: any = {
        ...userStats,
        [action]: ((userStats as any)[action] || 0) + 1,
      };

      const progress = await checkAchievementProgress(achievementExt.id, userId);

      if (progress.completed) {
        // Unlock achievement
        await unlockSAMBadge(userId, {
          badgeType: achievementExt.badgeType || 'ACHIEVEMENT',
          level: achievementExt.level || 1,
          description: achievement.id,
          requirements: {
            achievementId: achievement.id,
            unlockedAction: action,
            context
          },
          courseId: context?.courseId,
          chapterId: context?.chapterId,
        });

        // Award points
        await awardSAMPoints(userId, {
          points: achievement.points,
          reason: `Achievement unlocked: ${achievement.name}`,
          source: 'achievement',
          courseId: context?.courseId,
          chapterId: context?.chapterId,
          sectionId: context?.sectionId,
        });

        totalPointsAwarded += achievement.points;
        achievementsUnlocked.push(achievement);
      }
    }

    // Check active challenges
    const activeChallenges = await getActiveChallenges(userId);
    
    for (const challenge of activeChallenges) {
      const completed = await checkChallengeCompletion(userId, challenge, action, metadata);
      
      if (completed) {
        await completeChallengeForUser(userId, challenge, context);
        challengesCompleted.push(challenge);
        totalPointsAwarded += challenge.rewards.points;
      }
    }

    // Update streaks based on action
    if (isStreakAction(action)) {
      await updateSAMStreak(userId, {
        streakType: getStreakType(action),
        currentStreak: (userStats.streak || 0) + 1,
        longestStreak: Math.max(
          userStats.streak || 0,
          (userStats.streak || 0) + 1
        ),
        courseId: context?.courseId,
      });
    }

    // Check for level up
    const newTotalPoints = userStats.points + totalPointsAwarded;
    const newLevel = calculateLevel(newTotalPoints);
    const levelUp = newLevel > currentLevel ? { oldLevel: currentLevel, newLevel } : undefined;

    // Award level up bonus
    if (levelUp) {
      const levelUpBonus = newLevel * 50; // 50 points per level
      await awardSAMPoints(userId, {
        points: levelUpBonus,
        reason: `Level up bonus: Level ${newLevel}`,
        source: 'level_up',
        courseId: context?.courseId,
      });
      totalPointsAwarded += levelUpBonus;
    }

    return {
      pointsAwarded: totalPointsAwarded,
      achievementsUnlocked,
      challengesCompleted,
      levelUp,
    };
  } catch (error: any) {
    logger.error('Error tracking achievement progress:', error);
    return {
      pointsAwarded: 0,
      achievementsUnlocked: [],
      challengesCompleted: [],
    };
  }
}

// Get active challenges for user
export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  try {
    // Get user's active challenge participations
    const activeParticipations = await db.user.findUnique({
      where: { id: userId },
      select: {
        samActiveChallenges: true,
      }
    });

    if (!activeParticipations?.samActiveChallenges) {
      return [];
    }

    // Filter challenges that are still active
    const activeChallengeIds = activeParticipations.samActiveChallenges as string[];
    return CHALLENGES.filter(challenge => activeChallengeIds.includes(challenge.id));
  } catch (error: any) {
    logger.error('Error getting active challenges:', error);
    return [];
  }
}

// Start a challenge for user
export async function startChallengeForUser(
  userId: string, 
  challengeId: string
): Promise<boolean> {
  try {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return false;

    // Add challenge to user's active challenges
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { samActiveChallenges: true }
    });

    const activeChallenges = (user?.samActiveChallenges as string[]) || [];
    if (activeChallenges.includes(challengeId)) {
      return false; // Already active
    }

    await db.user.update({
      where: { id: userId },
      data: {
        samActiveChallenges: [...activeChallenges, challengeId],
        samChallengeStartDate: new Date(),
      }
    });

    // Record the challenge start
    await recordSAMInteraction({
      userId,
      interactionType: 'CHALLENGE_STARTED' as SAMInteractionType,
      context: JSON.stringify({ challengeId, challenge }),
      result: JSON.stringify({ started: true }),
    });

    return true;
  } catch (error: any) {
    logger.error('Error starting challenge:', error);
    return false;
  }
}

// Check if challenge is completed
async function checkChallengeCompletion(
  userId: string,
  challenge: Challenge,
  action: string,
  metadata: Record<string, any>
): Promise<boolean> {
  try {
    const { requirements } = challenge;
    
    // Get user's challenge progress (this would need to be tracked separately)
    // For now, we'll use a simplified check based on recent interactions
    const timeframe = getChallengeTimeframe(challenge);
    const startDate = timeframe.start;
    
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        context: {
          path: ['action'],
          equals: requirements.type
        }
      }
    });

    const currentProgress = interactions.length + (requirements.type === action ? 1 : 0);
    return currentProgress >= requirements.target;
  } catch (error: any) {
    logger.error('Error checking challenge completion:', error);
    return false;
  }
}

// Complete challenge for user
async function completeChallengeForUser(
  userId: string,
  challenge: Challenge,
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
): Promise<void> {
  try {
    // Remove from active challenges
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { samActiveChallenges: true, samCompletedChallenges: true }
    });

    const activeChallenges = ((user?.samActiveChallenges as string[]) || [])
      .filter(id => id !== challenge.id);
    const completedChallenges = [...((user?.samCompletedChallenges as string[]) || []), challenge.id];

    await db.user.update({
      where: { id: userId },
      data: {
        samActiveChallenges: activeChallenges,
        samCompletedChallenges: completedChallenges,
      }
    });

    // Award points
    await awardSAMPoints(userId, {
      points: challenge.rewards.points,
      reason: `Challenge completed: ${challenge.name}`,
      source: 'challenge',
      courseId: context?.courseId,
      chapterId: context?.chapterId,
      sectionId: context?.sectionId,
    });

    // Award any special badges
    if (challenge.rewards.badges) {
      for (const badgeId of challenge.rewards.badges) {
        await unlockSAMBadge(userId, {
          badgeType: 'ACHIEVEMENT' as any,
          level: 'SILVER' as any,
          description: badgeId,
          requirements: { challengeId: challenge.id },
          courseId: context?.courseId,
        });
      }
    }

    // Record completion
    await recordSAMInteraction({
      userId,
      interactionType: 'CHALLENGE_COMPLETED' as SAMInteractionType,
      context: JSON.stringify({ challengeId: challenge.id, challenge }),
      result: JSON.stringify({ completed: true, rewards: challenge.rewards }),
      courseId: context?.courseId,
    });
  } catch (error: any) {
    logger.error('Error completing challenge:', error);
  }
}

// Get available challenges for user level
export async function getAvailableChallengesForUser(userId: string): Promise<Challenge[]> {
  try {
    const userStats = await getUserSAMStats(userId);
    const userLevel = calculateLevel(userStats.points);
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        samCompletedChallenges: true,
        samActiveChallenges: true 
      }
    });

    const completedChallenges = (user?.samCompletedChallenges as string[]) || [];
    const activeChallenges = (user?.samActiveChallenges as string[]) || [];
    
    return CHALLENGES.filter(challenge => {
      // Don't show completed or active challenges
      if (completedChallenges.includes(challenge.id) || activeChallenges.includes(challenge.id)) {
        return false;
      }
      
      // Check level requirements
      const levelRequirements = { easy: 1, medium: 3, hard: 5, expert: 8 };
      return userLevel >= levelRequirements[challenge.difficulty];
    });
  } catch (error: any) {
    logger.error('Error getting available challenges:', error);
    return [];
  }
}

// Get user's achievement progress summary
export async function getUserAchievementSummary(userId: string): Promise<{
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  totalAchievements: number;
  completedChallenges: number;
  activeChallenges: number;
  recommendations: Achievement[];
}> {
  try {
    const userStats = await getUserSAMStats(userId);
    const currentLevel = calculateLevel(userStats.points);
    const nextLevelPoints = getPointsForLevel(currentLevel + 1);
    const pointsToNextLevel = nextLevelPoints - userStats.points;
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        samCompletedChallenges: true,
        samActiveChallenges: true
      }
    });

    const achievements = await db.sAMBadge.findMany({
      where: { userId }
    });

    // Get personalized recommendations
    const achievementIds = achievements.map(a => a.description);
    const recommendations = await getAchievementRecommendations(userId);

    return {
      level: currentLevel,
      totalPoints: userStats.points,
      pointsToNextLevel,
      totalAchievements: achievements.length,
      completedChallenges: ((user?.samCompletedChallenges as string[]) || []).length,
      activeChallenges: ((user?.samActiveChallenges as string[]) || []).length,
      recommendations,
    };
  } catch (error: any) {
    logger.error('Error getting user achievement summary:', error);
    return {
      level: 1,
      totalPoints: 0,
      pointsToNextLevel: 100,
      totalAchievements: 0,
      completedChallenges: 0,
      activeChallenges: 0,
      recommendations: [],
    };
  }
}

// Helper functions
function isStreakAction(action: string): boolean {
  const streakActions = ['content_created', 'ai_assistance_used', 'form_completed', 'suggestion_applied'];
  return streakActions.includes(action);
}

function getStreakType(action: string): SAMStreakType {
  const streakMap: Record<string, SAMStreakType> = {
    'content_created': 'CONTENT_CREATION',
    'ai_assistance_used': 'DAILY_INTERACTION',
    'form_completed': 'FORM_COMPLETION',
    'suggestion_applied': 'DAILY_INTERACTION',
  };
  return streakMap[action] || 'DAILY_INTERACTION';
}

function getChallengeTimeframe(challenge: Challenge): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getTime() - (challenge.duration * 24 * 60 * 60 * 1000));
  return { start, end: now };
}

function getPointsForLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
  return thresholds[level] || thresholds[thresholds.length - 1];
}