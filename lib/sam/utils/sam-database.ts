import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import {
  BadgeLevel,
  SAMBadgeType,
  SAMInteractionType,
  SAMLearningStyle,
  SAMMessageType,
  SAMPointsCategory,
  SAMStreakType,
} from '@prisma/client';

/**
 * SAM Database Utilities
 * Backed by Prisma models defined in prisma/schema.prisma
 */

const messageTypeMap: Record<string, SAMMessageType> = {
  user: 'USER',
  assistant: 'SAM',
  sam: 'SAM',
  system: 'SYSTEM',
  action: 'ACTION',
};

function normalizeMessageType(role: string): SAMMessageType {
  const normalized = role?.toLowerCase?.() ?? '';
  return messageTypeMap[normalized] ?? 'USER';
}

function normalizeInteractionType(value?: string): SAMInteractionType {
  if (!value) return 'CHAT_MESSAGE';
  const upper = value.toUpperCase();
  if ((Object.values(SAMInteractionType) as string[]).includes(upper)) {
    return upper as SAMInteractionType;
  }

  const map: Record<string, SAMInteractionType> = {
    chat: 'CHAT_MESSAGE',
    message: 'CHAT_MESSAGE',
    form: 'FORM_POPULATE',
    submit: 'FORM_SUBMIT',
    validate: 'FORM_VALIDATE',
    generate: 'CONTENT_GENERATE',
    navigation: 'NAVIGATION',
    quick: 'QUICK_ACTION',
    analytics: 'ANALYTICS_VIEW',
    gamification: 'GAMIFICATION_ACTION',
    learning: 'LEARNING_ASSISTANCE',
  };

  return map[upper.toLowerCase()] ?? 'CHAT_MESSAGE';
}

function normalizePointsCategory(value?: string): SAMPointsCategory {
  if (!value) return 'CHAT_ENGAGEMENT';
  const upper = value.toUpperCase();
  if ((Object.values(SAMPointsCategory) as string[]).includes(upper)) {
    return upper as SAMPointsCategory;
  }

  const map: Record<string, SAMPointsCategory> = {
    chat: 'CHAT_ENGAGEMENT',
    engagement: 'CHAT_ENGAGEMENT',
    form: 'FORM_INTERACTION',
    content: 'CONTENT_CREATION',
    achievement: 'ACHIEVEMENT_UNLOCK',
    daily: 'DAILY_ACTIVITY',
    progress: 'LEARNING_PROGRESS',
    teaching: 'TEACHING_ACTIVITY',
    collaboration: 'COLLABORATION',
  };

  return map[upper.toLowerCase()] ?? 'CHAT_ENGAGEMENT';
}

function normalizeLearningStyle(style?: string): SAMLearningStyle {
  if (!style) return 'MIXED';
  const normalized = style.toUpperCase().replace(/[-\s]/g, '_');
  if ((Object.values(SAMLearningStyle) as string[]).includes(normalized)) {
    return normalized as SAMLearningStyle;
  }

  if (normalized === 'READING') return 'READING_WRITING';
  return 'MIXED';
}

function normalizeStreakType(value?: string): SAMStreakType {
  if (!value) return 'DAILY_INTERACTION';
  const upper = value.toUpperCase();
  if ((Object.values(SAMStreakType) as string[]).includes(upper)) {
    return upper as SAMStreakType;
  }
  return 'DAILY_INTERACTION';
}

function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

/**
 * Initialize SAM database tables (no-op)
 */
export async function initializeSamDatabase(): Promise<void> {
  logger.info('SAM Database initialized');
}

/**
 * Store SAM interaction (legacy helper)
 */
export async function storeSamInteraction(data: {
  userId: string;
  message: string;
  response: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: 'CHAT_MESSAGE',
        context: {
          message: data.message,
          response: data.response,
          ...data.context,
        },
      },
    });
  } catch (error) {
    logger.error('Error storing SAM interaction', error);
  }
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Get SAM conversation history (latest conversation)
 */
export async function getSamConversationHistory(
  userId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const conversation = await db.sAMConversation.findFirst({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  });

  if (!conversation) return [];

  const messages = await db.sAMMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.messageType === 'USER' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.createdAt,
  }));
}

/**
 * Clear SAM conversation history
 */
export async function clearSamConversationHistory(userId: string): Promise<void> {
  const conversations = await db.sAMConversation.findMany({
    where: { userId },
    select: { id: true },
  });

  const conversationIds = conversations.map((c) => c.id);
  if (!conversationIds.length) return;

  await db.sAMMessage.deleteMany({
    where: { conversationId: { in: conversationIds } },
  });

  await db.sAMConversation.updateMany({
    where: { id: { in: conversationIds } },
    data: {
      isActive: false,
      endedAt: new Date(),
      totalMessages: 0,
    },
  });
}

/**
 * Record SAM interaction
 */
export async function recordSAMInteraction(data: {
  userId: string;
  type?: string;
  interactionType?: string;
  context?: string | Record<string, unknown>;
  result?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  metadata?: { [key: string]: string | number | boolean };
}): Promise<SAMInteraction> {
  const interactionType = normalizeInteractionType(data.interactionType ?? data.type);
  const context =
    typeof data.context === 'string' ? { message: data.context } : data.context ?? {};

  const interaction = await db.sAMInteraction.create({
    data: {
      userId: data.userId,
      interactionType,
      context,
      actionTaken: data.result,
      formData: data.metadata ?? undefined,
      courseId: data.courseId,
      chapterId: data.chapterId,
      sectionId: data.sectionId,
    },
  });

  return {
    id: interaction.id,
    userId: interaction.userId,
    interactionType: interaction.interactionType,
    context: JSON.stringify(interaction.context),
    result: interaction.actionTaken ?? undefined,
    courseId: interaction.courseId ?? undefined,
    chapterId: interaction.chapterId ?? undefined,
    sectionId: interaction.sectionId ?? undefined,
    createdAt: interaction.createdAt,
  };
}

/**
 * Award SAM points
 */
export async function awardSAMPoints(
  userId: string,
  data:
    | number
    | {
        points: number;
        reason?: string;
        source?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
      }
): Promise<{ points: number; level: number }> {
  const points = typeof data === 'number' ? data : data.points;
  const reason = typeof data === 'number' ? 'Manual award' : data.reason ?? 'Manual award';
  const source = typeof data === 'number' ? undefined : data.source;
  const category = normalizePointsCategory(source);

  await db.sAMPoints.create({
    data: {
      userId,
      points,
      reason,
      category,
      context: source ? { source } : undefined,
      courseId: typeof data === 'number' ? undefined : data.courseId,
      chapterId: typeof data === 'number' ? undefined : data.chapterId,
      sectionId: typeof data === 'number' ? undefined : data.sectionId,
    },
  });

  const user = await db.user.update({
    where: { id: userId },
    data: { samTotalPoints: { increment: points } },
    select: { samTotalPoints: true, samLevel: true },
  });

  const nextLevel = calculateLevel(user.samTotalPoints);
  if (nextLevel !== user.samLevel) {
    await db.user.update({
      where: { id: userId },
      data: { samLevel: nextLevel },
    });
  }

  return { points: user.samTotalPoints, level: nextLevel };
}

/**
 * Unlock SAM badge
 */
export async function unlockSAMBadge(
  userId: string,
  badgeData: Record<string, unknown> | string
): Promise<{ id: string; badgeId: string }> {
  const data = typeof badgeData === 'string' ? { badgeType: badgeData } : badgeData;
  const badgeType = (data.badgeType as SAMBadgeType) ?? 'FIRST_INTERACTION';
  const level = (data.level as BadgeLevel) ?? 'BRONZE';
  const badgeId = data.badgeId ? String(data.badgeId) : `${badgeType}:${level}`;
  const name = (data.name as string) ?? badgeType.replace(/_/g, ' ');
  const description = (data.description as string) ?? 'SAM achievement unlocked';

  const badge = await db.sAMBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    update: {
      level,
      name,
      description,
      context: data.requirements as Record<string, unknown> | undefined,
      courseId: (data.courseId as string | undefined) ?? undefined,
    },
    create: {
      userId,
      badgeId,
      badgeType,
      name,
      description,
      level,
      pointsRequired: (data.pointsRequired as number | undefined) ?? 0,
      iconUrl: (data.iconUrl as string | undefined) ?? undefined,
      context: data.requirements as Record<string, unknown> | undefined,
      courseId: (data.courseId as string | undefined) ?? undefined,
    },
    select: { id: true, badgeId: true },
  });

  return badge;
}

/**
 * Get user SAM stats
 */
export async function getUserSAMStats(
  userId: string,
  courseId?: string
): Promise<{
  points: number;
  level: number;
  badges: number;
  streak: number;
}> {
  const [pointsAgg, badgesCount, streak] = await Promise.all([
    db.sAMPoints.aggregate({
      where: { userId, ...(courseId ? { courseId } : {}) },
      _sum: { points: true },
    }),
    db.sAMBadge.count({ where: { userId, ...(courseId ? { courseId } : {}) } }),
    db.sAMStreak.findUnique({ where: { userId } }),
  ]);

  const points = pointsAgg._sum.points ?? 0;
  return {
    points,
    level: calculateLevel(points),
    badges: badgesCount,
    streak: streak?.currentStreak ?? 0,
  };
}

export interface SAMMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  role?: string;
}

export interface SAMConversation {
  id: string;
  userId: string;
  title?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  messages?: SAMMessage[];
}

export interface SAMAnalysis {
  bloomsLevel?: string;
  confidence?: number;
  suggestions?: string[];
}

export interface SAMBadge {
  id: string;
  userId: string;
  badgeType: string;
  level: string;
  description?: string;
  earnedAt: Date;
  name?: string;
  iconUrl?: string | null;
  pointsRequired?: number;
}

/**
 * Get SAM conversations
 */
export async function getSAMConversations(
  userId: string,
  options?: { courseId?: string; chapterId?: string; limit?: number }
): Promise<SAMConversation[]> {
  const conversations = await db.sAMConversation.findMany({
    where: {
      userId,
      ...(options?.courseId ? { courseId: options.courseId } : {}),
      ...(options?.chapterId ? { chapterId: options.chapterId } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: options?.limit ?? 20,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    userId: conv.userId,
    courseId: conv.courseId ?? undefined,
    chapterId: conv.chapterId ?? undefined,
    sectionId: conv.sectionId ?? undefined,
    createdAt: conv.startedAt,
    updatedAt: conv.startedAt,
    startedAt: conv.startedAt,
    messages: conv.messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      createdAt: msg.createdAt,
      role: msg.messageType === 'USER' ? 'user' : 'assistant',
    })),
  }));
}

/**
 * Create SAM conversation
 */
export async function createSAMConversation(
  userId: string,
  data?: {
    title?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
): Promise<string> {
  const conversation = await db.sAMConversation.create({
    data: {
      userId,
      sessionId: randomUUID(),
      courseId: data?.courseId,
      chapterId: data?.chapterId,
      sectionId: data?.sectionId,
      startedAt: new Date(),
    },
    select: { id: true },
  });
  return conversation.id;
}

/**
 * Add SAM message
 */
export async function addSAMMessage(
  conversationId: string,
  data: {
    role: string;
    content: string;
    analysis?: SAMAnalysis;
    metadata?: { [key: string]: string | number | boolean };
    parentMessageId?: string;
  }
): Promise<SAMMessage> {
  const messageType = normalizeMessageType(data.role);

  const message = await db.sAMMessage.create({
    data: {
      conversationId,
      messageType,
      content: data.content,
      context: data.analysis ?? undefined,
      metadata: data.metadata ?? undefined,
    },
  });

  await db.sAMConversation.update({
    where: { id: conversationId },
    data: { totalMessages: { increment: 1 } },
  });

  return {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    createdAt: message.createdAt,
    role: message.messageType === 'USER' ? 'user' : 'assistant',
  };
}

/**
 * Get SAM badges
 */
export async function getSAMBadges(userId: string): Promise<SAMBadge[]> {
  const badges = await db.sAMBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  });

  return badges.map((badge) => ({
    id: badge.id,
    userId: badge.userId,
    badgeType: badge.badgeType,
    level: badge.level,
    description: badge.description,
    earnedAt: badge.earnedAt,
    name: badge.name,
    iconUrl: badge.iconUrl,
    pointsRequired: badge.pointsRequired,
  }));
}

export interface SAMLearningProfile {
  userId: string;
  courseId?: string;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  strengths?: string[];
  weaknesses?: string[];
  interests?: string[];
  goals?: string[];
  progress?: { [key: string]: number };
  interactionPreferences?: {
    preferredResponseLength?: 'concise' | 'detailed' | 'comprehensive';
    preferredExplanationStyle?: 'technical' | 'conversational' | 'step-by-step';
    includeExamples?: boolean;
  };
  adaptiveSettings?: {
    difficultyAdjustment?: 'auto' | 'manual';
    pacePreference?: 'slow' | 'moderate' | 'fast';
    feedbackFrequency?: 'minimal' | 'regular' | 'frequent';
  };
}

/**
 * Get SAM learning profile
 */
export async function getSAMLearningProfile(
  userId: string,
  _courseId?: string
): Promise<SAMLearningProfile | null> {
  const profile = await db.sAMLearningProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const learningStyle =
    profile.learningStyle === 'READING_WRITING'
      ? 'reading'
      : profile.learningStyle === 'MIXED'
        ? undefined
        : profile.learningStyle.toLowerCase();

  const preferences = (profile.preferences ?? {}) as Record<string, unknown>;
  return {
    userId: profile.userId,
    learningStyle: learningStyle as SAMLearningProfile['learningStyle'] | undefined,
    preferredDifficulty: preferences.preferredDifficulty as SAMLearningProfile['preferredDifficulty'],
    strengths: preferences.strengths as string[] | undefined,
    weaknesses: preferences.weaknesses as string[] | undefined,
    interests: preferences.interests as string[] | undefined,
    goals: preferences.goals as string[] | undefined,
    progress: preferences.progress as Record<string, number> | undefined,
    interactionPreferences: preferences.interactionPreferences as SAMLearningProfile['interactionPreferences'],
    adaptiveSettings: preferences.adaptiveSettings as SAMLearningProfile['adaptiveSettings'],
  };
}

/**
 * Update SAM learning profile
 */
export async function updateSAMLearningProfile(
  userId: string,
  data: Partial<SAMLearningProfile>
): Promise<SAMLearningProfile | null> {
  const existing = await db.sAMLearningProfile.findUnique({
    where: { userId },
  });

  const preferenceUpdates = {
    preferredDifficulty: data.preferredDifficulty,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    interests: data.interests,
    goals: data.goals,
    progress: data.progress,
    interactionPreferences: data.interactionPreferences,
    adaptiveSettings: data.adaptiveSettings,
  };

  const nextPreferences = {
    ...(existing?.preferences as Record<string, unknown> ?? {}),
    ...preferenceUpdates,
  };

  const nextLearningStyle = data.learningStyle
    ? normalizeLearningStyle(data.learningStyle)
    : existing?.learningStyle ?? 'MIXED';

  if (existing) {
    await db.sAMLearningProfile.update({
      where: { userId },
      data: {
        learningStyle: nextLearningStyle,
        preferences: nextPreferences,
        lastUpdated: new Date(),
      },
    });
  } else {
    await db.sAMLearningProfile.create({
      data: {
        userId,
        learningStyle: nextLearningStyle,
        preferredTone: 'ENCOURAGING',
        teachingMethod: 'SOCRATIC',
        responseStyle: 'DETAILED',
        preferences: nextPreferences,
      },
    });
  }

  return getSAMLearningProfile(userId);
}

/**
 * Update SAM streak
 */
export async function updateSAMStreak(
  userId: string,
  data?: {
    courseId?: string;
    activityType?: string;
    streakType?: string;
    currentStreak?: number;
    longestStreak?: number;
  }
): Promise<number> {
  const currentStreak = data?.currentStreak ?? 1;
  const longestStreak = data?.longestStreak ?? currentStreak;
  const streakType = normalizeStreakType(data?.streakType);

  const streak = await db.sAMStreak.upsert({
    where: { userId },
    update: {
      currentStreak,
      longestStreak,
      streakType,
      lastActivityDate: new Date(),
    },
    create: {
      userId,
      currentStreak,
      longestStreak,
      streakType,
      lastActivityDate: new Date(),
    },
    select: { currentStreak: true },
  });

  return streak.currentStreak;
}

export interface SAMInteraction {
  id: string;
  userId: string;
  interactionType: string;
  context?: string;
  result?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  createdAt: Date;
  metadata?: { [key: string]: string | number | boolean };
}

export interface SAMAnalytics {
  userId: string;
  totalInteractions: number;
  coursesCreated: number;
  achievementsUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  lastActive: Date;
  interactionCount?: number;
  responseTime?: number;
  satisfactionScore?: number;
  completionRate?: number;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}

/**
 * Get SAM interactions
 */
export async function getSAMInteractions(
  userId: string,
  options?: {
    courseId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SAMInteraction[]> {
  const interactions = await db.sAMInteraction.findMany({
    where: {
      userId,
      ...(options?.courseId ? { courseId: options.courseId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });

  return interactions.map((interaction) => ({
    id: interaction.id,
    userId: interaction.userId,
    interactionType: interaction.interactionType,
    context: JSON.stringify(interaction.context),
    result: interaction.actionTaken ?? undefined,
    courseId: interaction.courseId ?? undefined,
    chapterId: interaction.chapterId ?? undefined,
    sectionId: interaction.sectionId ?? undefined,
    createdAt: interaction.createdAt,
  }));
}

/**
 * Get SAM analytics (aggregated)
 */
export async function getSAMAnalytics(
  userId: string,
  options?: {
    courseId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<SAMAnalytics[]> {
  const where = {
    userId,
    ...(options?.courseId ? { courseId: options.courseId } : {}),
    ...(options?.startDate || options?.endDate
      ? {
          createdAt: {
            ...(options?.startDate ? { gte: options.startDate } : {}),
            ...(options?.endDate ? { lte: options.endDate } : {}),
          },
        }
      : {}),
  };

  const [interactionCount, pointsAgg, badgeCount, streak, lastInteraction] =
    await Promise.all([
      db.sAMInteraction.count({ where }),
      db.sAMPoints.aggregate({
        where,
        _sum: { points: true },
      }),
      db.sAMBadge.count({ where: { userId } }),
      db.sAMStreak.findUnique({ where: { userId } }),
      db.sAMInteraction.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

  const coursesCreated = await db.course.count({ where: { userId } });

  return [
    {
      userId,
      totalInteractions: interactionCount,
      coursesCreated,
      achievementsUnlocked: badgeCount,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      totalPoints: pointsAgg._sum.points ?? 0,
      lastActive: lastInteraction?.createdAt ?? new Date(),
      courseId: options?.courseId,
    },
  ];
}

/**
 * Get single SAM analytics record
 */
export async function getSAMAnalyticsForUser(userId: string): Promise<SAMAnalytics> {
  const analytics = await getSAMAnalytics(userId);
  return analytics[0];
}

/**
 * Record SAM analytics (no-op helper)
 */
export async function recordSAMAnalytics(_data: Partial<SAMAnalytics>): Promise<void> {
  logger.info('SAM Analytics recorded');
}

// Re-export main database instance for convenience
export { db };
