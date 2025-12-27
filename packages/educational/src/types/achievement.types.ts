/**
 * Achievement Engine Types
 */

import type { SAMConfig } from '@sam-ai/core';

// ============================================================================
// ACHIEVEMENT ENGINE TYPES
// ============================================================================

export interface AchievementEngineConfig {
  samConfig: SAMConfig;
  database: AchievementDatabaseAdapter;
  achievements?: Achievement[];
  challenges?: Challenge[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  badgeType?: string;
  level?: number;
  unlockConditions?: AchievementUnlockConditions;
}

export type AchievementCategory =
  | 'learning'
  | 'teaching'
  | 'collaboration'
  | 'consistency'
  | 'mastery'
  | 'creativity';

export interface AchievementUnlockConditions {
  prerequisiteAchievements?: string[];
  requiredActions?: Record<string, number>;
  minLevel?: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: ChallengeDifficulty;
  duration: number;
  category: ChallengeCategory;
  points: number;
  bonusMultiplier?: number;
  requirements: ChallengeRequirements;
  rewards: ChallengeRewards;
}

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ChallengeCategory = 'daily' | 'weekly' | 'monthly' | 'special';

export interface ChallengeRequirements {
  type: ChallengeRequirementType;
  target: number;
  conditions?: Record<string, string | number | boolean>;
}

export type ChallengeRequirementType =
  | 'create_content'
  | 'use_ai'
  | 'form_completion'
  | 'streak_maintenance'
  | 'collaboration'
  | 'improvement';

export interface ChallengeRewards {
  points: number;
  badges?: string[];
  specialRewards?: string[];
}

export interface AchievementProgress {
  completed: boolean;
  progress: number;
  total: number;
}

export interface AchievementTrackingResult {
  pointsAwarded: number;
  achievementsUnlocked: Achievement[];
  challengesCompleted: Challenge[];
  levelUp?: LevelUpInfo;
}

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

export interface AchievementSummary {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  totalAchievements: number;
  completedChallenges: number;
  activeChallenges: number;
  recommendations: Achievement[];
}

export interface AchievementContext {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}

export interface UserStats {
  points: number;
  streak: number;
  level: number;
  badges: string[];
  completedChallenges: string[];
  activeChallenges: string[];
}

export interface AchievementDatabaseAdapter {
  getUserStats(userId: string, courseId?: string): Promise<UserStats>;

  getUserBadges(userId: string): Promise<Array<{ description: string }>>;
  unlockBadge(
    userId: string,
    data: {
      badgeType: string;
      level: number;
      description: string;
      requirements: Record<string, unknown>;
      courseId?: string;
      chapterId?: string;
    }
  ): Promise<void>;

  awardPoints(
    userId: string,
    data: {
      points: number;
      reason: string;
      source: string;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
    }
  ): Promise<void>;

  updateStreak(
    userId: string,
    data: {
      streakType: string;
      currentStreak: number;
      longestStreak: number;
      courseId?: string;
    }
  ): Promise<void>;

  recordInteraction(data: {
    userId: string;
    interactionType: string;
    context: string;
    result: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }): Promise<void>;

  getUserChallenges(userId: string): Promise<{
    activeChallenges: string[];
    completedChallenges: string[];
    challengeStartDate?: Date;
  }>;

  updateUserChallenges(
    userId: string,
    data: {
      activeChallenges?: string[];
      completedChallenges?: string[];
      challengeStartDate?: Date;
    }
  ): Promise<void>;

  getInteractionsSince(
    userId: string,
    since: Date,
    actionType?: string
  ): Promise<Array<{ createdAt: Date; context: unknown }>>;

  checkAchievementProgress(
    achievementId: string,
    userId: string
  ): Promise<AchievementProgress>;
}

export interface AchievementEngine {
  trackProgress(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
    context?: AchievementContext
  ): Promise<AchievementTrackingResult>;

  getActiveChallenges(userId: string): Promise<Challenge[]>;

  startChallenge(userId: string, challengeId: string): Promise<boolean>;

  getAvailableChallenges(userId: string): Promise<Challenge[]>;

  getSummary(userId: string): Promise<AchievementSummary>;

  getAchievements(): Achievement[];

  getChallenges(): Challenge[];

  calculateLevel(points: number): number;

  getPointsForLevel(level: number): number;
}
