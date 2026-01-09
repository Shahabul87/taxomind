/**
 * Enhanced Gamification System Types
 * Phase 6: XP, Achievements, Leaderboards
 */

// ==========================================
// Enums (matching Prisma schema)
// ==========================================

export enum AchievementCategory {
  STREAK = 'STREAK',
  COMPLETION = 'COMPLETION',
  MASTERY = 'MASTERY',
  ENGAGEMENT = 'ENGAGEMENT',
  SPEED = 'SPEED',
  DEDICATION = 'DEDICATION',
  SOCIAL = 'SOCIAL',
  SPECIAL = 'SPECIAL',
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum XPSource {
  ACHIEVEMENT = 'ACHIEVEMENT',
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  COURSE = 'COURSE',
  STREAK = 'STREAK',
  BONUS = 'BONUS',
  ADMIN = 'ADMIN',
  CHALLENGE = 'CHALLENGE',
  REFERRAL = 'REFERRAL',
}

export enum LeaderboardPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

// ==========================================
// Achievement Types
// ==========================================

export interface AchievementCriteria {
  type: 'COUNT' | 'STREAK' | 'PERCENTAGE' | 'TIME' | 'COMPOUND';
  target: number;
  metric: string;
  conditions?: AchievementCondition[];
}

export interface AchievementCondition {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: string | number | string[] | number[];
}

export interface Achievement {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  criteria: AchievementCriteria | Record<string, unknown>;
  xpReward: number;
  badgeUrl?: string | null;
  unlockMessage?: string | null;
  isHidden: boolean;
  isRepeatable: boolean;
  maxRepeats?: number | null;
  isActive: boolean;
  displayOrder: number;
  tier: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  currentProgress: number;
  targetProgress: number;
  progressData?: Record<string, unknown> | null;
  isUnlocked: boolean;
  unlockedAt?: Date | null;
  timesEarned: number;
  isNew: boolean;
  isPinned: boolean;
  seenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  achievement?: Achievement | null;
}

// ==========================================
// XP & Level Types
// ==========================================

export interface UserXP {
  id: string;
  userId: string;
  totalXP: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  streakFreezeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XPTransaction {
  id: string;
  userXPId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  levelBefore: number;
  levelAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ==========================================
// Leaderboard Types
// ==========================================

export interface LeaderboardEntry {
  id: string;
  userId: string;
  period: LeaderboardPeriod;
  periodStart: Date;
  periodEnd?: Date;
  xpEarned: number;
  achievementsUnlocked: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  studyMinutes: number;
  rank?: number;
  previousRank?: number;
  rankChange?: number;
  isVisible: boolean;
  showOnlyToFriends: boolean;
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string;
    image?: string;
  };
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  totalParticipants: number;
}

// ==========================================
// Preferences Types
// ==========================================

export interface GamificationPreferences {
  id: string;
  userId: string;
  achievementNotifications: boolean;
  levelUpNotifications: boolean;
  streakReminders: boolean;
  leaderboardUpdates: boolean;
  showOnLeaderboard: boolean;
  showAchievements: boolean;
  showLevel: boolean;
  showStreak: boolean;
  pinnedAchievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// API Response Types
// ==========================================

export interface GamificationDashboardData {
  xp: UserXP;
  recentAchievements: UserAchievement[];
  nearCompletion: UserAchievement[];
  leaderboard: LeaderboardEntry[];
  streak: {
    current: number;
    longest: number;
    todayActive: boolean;
    freezesAvailable: number;
  };
}

export interface AwardXPRequest {
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface AwardXPResponse {
  success: boolean;
  transaction: XPTransaction;
  levelUp: boolean;
  newLevel?: number;
  achievementsUnlocked?: Achievement[];
}

export interface CheckAchievementRequest {
  userId: string;
  achievementSlug: string;
  progressIncrement?: number;
  forceCheck?: boolean;
}

export interface CheckAchievementResponse {
  success: boolean;
  achievement: Achievement;
  userProgress: UserAchievement;
  newlyUnlocked: boolean;
  xpAwarded?: number;
}

// ==========================================
// Level Calculation Types
// ==========================================

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
  badge?: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: 'Novice' },
  { level: 2, xpRequired: 100, title: 'Beginner' },
  { level: 3, xpRequired: 300, title: 'Apprentice' },
  { level: 4, xpRequired: 600, title: 'Student' },
  { level: 5, xpRequired: 1000, title: 'Scholar' },
  { level: 6, xpRequired: 1500, title: 'Graduate' },
  { level: 7, xpRequired: 2100, title: 'Expert' },
  { level: 8, xpRequired: 2800, title: 'Specialist' },
  { level: 9, xpRequired: 3600, title: 'Master' },
  { level: 10, xpRequired: 4500, title: 'Grandmaster' },
  { level: 11, xpRequired: 5500, title: 'Sage' },
  { level: 12, xpRequired: 6600, title: 'Guru' },
  { level: 13, xpRequired: 7800, title: 'Virtuoso' },
  { level: 14, xpRequired: 9100, title: 'Legend' },
  { level: 15, xpRequired: 10500, title: 'Titan' },
  { level: 16, xpRequired: 12000, title: 'Champion' },
  { level: 17, xpRequired: 13600, title: 'Immortal' },
  { level: 18, xpRequired: 15300, title: 'Enlightened' },
  { level: 19, xpRequired: 17100, title: 'Transcendent' },
  { level: 20, xpRequired: 20000, title: 'Ascendant' },
];

// ==========================================
// Rarity Configurations
// ==========================================

export const RARITY_CONFIG: Record<AchievementRarity, {
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}> = {
  [AchievementRarity.COMMON]: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    glowColor: 'rgba(107, 114, 128, 0.3)',
  },
  [AchievementRarity.UNCOMMON]: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    borderColor: '#34D399',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  [AchievementRarity.RARE]: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#60A5FA',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  [AchievementRarity.EPIC]: {
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    borderColor: '#A78BFA',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  },
  [AchievementRarity.LEGENDARY]: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    borderColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
};

// ==========================================
// Category Icons
// ==========================================

export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  [AchievementCategory.STREAK]: 'Flame',
  [AchievementCategory.COMPLETION]: 'CheckCircle2',
  [AchievementCategory.MASTERY]: 'Crown',
  [AchievementCategory.ENGAGEMENT]: 'MessageCircle',
  [AchievementCategory.SPEED]: 'Zap',
  [AchievementCategory.DEDICATION]: 'Clock',
  [AchievementCategory.SOCIAL]: 'Users',
  [AchievementCategory.SPECIAL]: 'Star',
};
