import { db } from '@/lib/db';
import { SAMBadgeType, SAMMessageType, SAMInteractionType, BadgeLevel } from '@prisma/client';
import { logger } from '@/lib/logger';

// SAM Conversation Management
export async function createSAMConversation(userId: string, options?: {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  title?: string;
}) {
  try {
    return await db.sAMConversation.create({
      data: {
        userId,
        courseId: options?.courseId,
        chapterId: options?.chapterId,
        sectionId: options?.sectionId,
        title: options?.title || 'SAM Conversation',
        isActive: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  } catch (error) {
    logger.error('Error creating SAM conversation:', error);
    throw error;
  }
}

export async function getSAMConversations(userId: string, options?: {
  courseId?: string;
  chapterId?: string;
  limit?: number;
}) {
  try {
    return await db.sAMConversation.findMany({
      where: {
        userId,
        courseId: options?.courseId,
        chapterId: options?.chapterId,
        isActive: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Last 10 messages
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 20,
    });
  } catch (error) {
    logger.error('Error getting SAM conversations:', error);
    throw error;
  }
}

export async function addSAMMessage(conversationId: string, data: {
  role: SAMMessageType;
  content: string;
  metadata?: any;
  parentMessageId?: string;
}) {
  try {
    const message = await db.sAMMessage.create({
      data: {
        conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata,
        parentMessageId: data.parentMessageId,
      },
    });

    // Update conversation updatedAt
    await db.sAMConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  } catch (error) {
    logger.error('Error adding SAM message:', error);
    throw error;
  }
}

// SAM Interactions
export async function recordSAMInteraction(data: {
  userId: string;
  interactionType: SAMInteractionType;
  context: any;
  result?: any;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  conversationId?: string;
}) {
  try {
    return await db.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: data.interactionType,
        context: data.context,
        result: data.result,
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
        conversationId: data.conversationId,
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
    throw error;
  }
}

// SAM Points Management
export async function awardSAMPoints(userId: string, data: {
  points: number;
  reason: string;
  source: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}) {
  try {
    // Create points record
    const pointsRecord = await db.sAMPoints.create({
      data: {
        userId,
        points: data.points,
        reason: data.reason,
        source: data.source,
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
      },
    });

    // Update user's total SAM points
    await db.user.update({
      where: { id: userId },
      data: {
        samTotalPoints: {
          increment: data.points
        }
      }
    });

    return pointsRecord;
  } catch (error) {
    logger.error('Error awarding SAM points:', error);
    throw error;
  }
}

export async function getSAMPoints(userId: string, options?: {
  courseId?: string;
  limit?: number;
}) {
  try {
    return await db.sAMPoints.findMany({
      where: {
        userId,
        courseId: options?.courseId,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  } catch (error) {
    logger.error('Error getting SAM points:', error);
    throw error;
  }
}

// SAM Badges Management
export async function unlockSAMBadge(userId: string, data: {
  badgeType: SAMBadgeType;
  level: BadgeLevel;
  description: string;
  requirements: any;
  courseId?: string;
  chapterId?: string;
}) {
  try {
    // Check if badge already exists
    const existingBadge = await db.sAMBadge.findFirst({
      where: {
        userId,
        badgeType: data.badgeType,
        level: data.level,
        courseId: data.courseId,
      }
    });

    if (existingBadge) {
      return existingBadge;
    }

    // Create new badge
    return await db.sAMBadge.create({
      data: {
        userId,
        badgeType: data.badgeType,
        level: data.level,
        description: data.description,
        requirements: data.requirements,
        courseId: data.courseId,
        chapterId: data.chapterId,
        unlockedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error unlocking SAM badge:', error);
    throw error;
  }
}

export async function getSAMBadges(userId: string, options?: {
  courseId?: string;
  badgeType?: SAMBadgeType;
}) {
  try {
    return await db.sAMBadge.findMany({
      where: {
        userId,
        courseId: options?.courseId,
        badgeType: options?.badgeType,
      },
      orderBy: { unlockedAt: 'desc' },
    });
  } catch (error) {
    logger.error('Error getting SAM badges:', error);
    throw error;
  }
}

// SAM Streaks Management
export async function updateSAMStreak(userId: string, data: {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  courseId?: string;
}) {
  try {
    return await db.sAMStreak.upsert({
      where: {
        userId_streakType_courseId: {
          userId,
          streakType: data.streakType,
          courseId: data.courseId || '',
        }
      },
      update: {
        currentStreak: data.currentStreak,
        longestStreak: Math.max(data.longestStreak, data.currentStreak),
        lastActivityDate: new Date(),
      },
      create: {
        userId,
        streakType: data.streakType,
        currentStreak: data.currentStreak,
        longestStreak: data.currentStreak,
        lastActivityDate: new Date(),
        courseId: data.courseId,
      },
    });
  } catch (error) {
    logger.error('Error updating SAM streak:', error);
    throw error;
  }
}

export async function getSAMStreaks(userId: string, options?: {
  courseId?: string;
  streakType?: string;
}) {
  try {
    return await db.sAMStreak.findMany({
      where: {
        userId,
        courseId: options?.courseId,
        streakType: options?.streakType,
      },
      orderBy: { lastActivityDate: 'desc' },
    });
  } catch (error) {
    logger.error('Error getting SAM streaks:', error);
    throw error;
  }
}

// SAM Learning Profile
export async function updateSAMLearningProfile(userId: string, data: {
  learningStyle?: string;
  preferredDifficulty?: string;
  interactionPreferences?: any;
  adaptiveSettings?: any;
  courseId?: string;
}) {
  try {
    return await db.sAMLearningProfile.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: data.courseId || '',
        }
      },
      update: {
        learningStyle: data.learningStyle,
        preferredDifficulty: data.preferredDifficulty,
        interactionPreferences: data.interactionPreferences,
        adaptiveSettings: data.adaptiveSettings,
      },
      create: {
        userId,
        learningStyle: data.learningStyle || 'adaptive',
        preferredDifficulty: data.preferredDifficulty || 'medium',
        interactionPreferences: data.interactionPreferences || {},
        adaptiveSettings: data.adaptiveSettings || {},
        courseId: data.courseId,
      },
    });
  } catch (error) {
    logger.error('Error updating SAM learning profile:', error);
    throw error;
  }
}

export async function getSAMLearningProfile(userId: string, courseId?: string) {
  try {
    return await db.sAMLearningProfile.findFirst({
      where: {
        userId,
        courseId: courseId || '',
      },
    });
  } catch (error) {
    logger.error('Error getting SAM learning profile:', error);
    return null;
  }
}

// SAM Analytics
export async function recordSAMAnalytics(data: {
  userId: string;
  sessionId: string;
  interactionCount: number;
  responseTime: number;
  satisfactionScore?: number;
  completionRate?: number;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}) {
  try {
    return await db.sAMAnalytics.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        interactionCount: data.interactionCount,
        responseTime: data.responseTime,
        satisfactionScore: data.satisfactionScore,
        completionRate: data.completionRate,
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
      },
    });
  } catch (error) {
    logger.error('Error recording SAM analytics:', error);
    throw error;
  }
}

export async function getSAMAnalytics(userId: string, options?: {
  courseId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    const whereClause: any = { userId };
    
    if (options?.courseId) {
      whereClause.courseId = options.courseId;
    }
    
    if (options?.startDate || options?.endDate) {
      whereClause.createdAt = {};
      if (options.startDate) {
        whereClause.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        whereClause.createdAt.lte = options.endDate;
      }
    }

    return await db.sAMAnalytics.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  } catch (error) {
    logger.error('Error getting SAM analytics:', error);
    throw error;
  }
}

// SAM Interactions Management
export async function getSAMInteractions(userId: string, options?: {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  interactionType?: SAMInteractionType;
  limit?: number;
}) {
  try {
    return await db.sAMInteraction.findMany({
      where: {
        userId,
        courseId: options?.courseId,
        chapterId: options?.chapterId,
        sectionId: options?.sectionId,
        interactionType: options?.interactionType,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  } catch (error) {
    logger.error('Error getting SAM interactions:', error);
    return [];
  }
}

// Utility functions
export async function getUserSAMStats(userId: string, courseId?: string) {
  try {
    // Build where clauses conditionally based on courseId
    const pointsWhere = courseId ? { userId, courseId } : { userId };
    const badgesWhere = courseId ? { userId, courseId } : { userId };
    const interactionsWhere = courseId 
      ? {
          userId,
          courseId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        }
      : {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        };

    const [totalPoints, badges, activeStreaks, recentInteractions] = await Promise.all([
      db.sAMPoints.aggregate({
        where: pointsWhere,
        _sum: { points: true },
      }),
      db.sAMBadge.count({
        where: badgesWhere,
      }),
      // SAMStreak doesn't have courseId, so always filter by userId only
      db.sAMStreak.findMany({
        where: { userId, currentStreak: { gt: 0 } },
      }),
      db.sAMInteraction.count({
        where: interactionsWhere,
      }),
    ]);

    return {
      totalPoints: totalPoints._sum.points || 0,
      badgeCount: badges,
      activeStreaks: activeStreaks.length,
      weeklyInteractions: recentInteractions,
      streaks: activeStreaks,
    };
  } catch (error) {
    logger.error('Error getting user SAM stats:', error);
    throw error;
  }
}