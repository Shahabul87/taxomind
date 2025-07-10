import { db } from "@/lib/db";
import { BadgeType, BadgeCategory, BadgeLevel, BadgeEvent } from "@prisma/client";
import { nanoid } from "nanoid";

export interface BadgeUnlockCriteria {
  type: 'course_completion' | 'exam_score' | 'streak' | 'time_spent' | 'skill_level' | 'activity_count' | 'combined';
  conditions: {
    courseId?: string;
    minimumScore?: number;
    streakDays?: number;
    timeSpentHours?: number;
    skillId?: string;
    skillLevel?: number;
    activityType?: string;
    count?: number;
    combinedConditions?: BadgeUnlockCriteria[];
  };
}

export interface BadgeDefinition {
  name: string;
  slug: string;
  description: string;
  badgeType: BadgeType;
  category: BadgeCategory;
  level: BadgeLevel;
  points: number;
  iconUrl?: string;
  iconData?: any;
  colorScheme?: any;
  unlockCriteria: BadgeUnlockCriteria;
  metadata?: any;
}

export class BadgeService {
  async createBadge(badgeData: BadgeDefinition): Promise<any> {
    return await db.badge.create({
      data: {
        name: badgeData.name,
        slug: badgeData.slug,
        description: badgeData.description,
        badgeType: badgeData.badgeType,
        category: badgeData.category,
        level: badgeData.level,
        points: badgeData.points,
        iconUrl: badgeData.iconUrl,
        iconData: badgeData.iconData,
        colorScheme: badgeData.colorScheme,
        unlockCriteria: badgeData.unlockCriteria,
        metadata: badgeData.metadata || {}
      }
    });
  }

  async checkAndAwardBadges(userId: string, triggerEvent: {
    type: string;
    data: any;
  }): Promise<any[]> {
    const awardedBadges: any[] = [];

    // Get all active badges
    const badges = await db.badge.findMany({
      where: { isActive: true }
    });

    for (const badge of badges) {
      // Check if user already has this badge
      const existingBadge = await db.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id
          }
        }
      });

      if (existingBadge) {
        continue; // User already has this badge
      }

      // Check if user meets the criteria
      const meetsConditions = await this.checkBadgeConditions(
        userId,
        badge.unlockCriteria as BadgeUnlockCriteria,
        triggerEvent
      );

      if (meetsConditions) {
        const userBadge = await this.awardBadge(userId, badge.id);
        awardedBadges.push({
          badge,
          userBadge
        });
      }
    }

    return awardedBadges;
  }

  async awardBadge(userId: string, badgeId: string): Promise<any> {
    const userBadge = await db.userBadge.create({
      data: {
        userId,
        badgeId,
        verificationCode: nanoid(16).toUpperCase(),
        earnedAt: new Date(),
        progress: 100,
        metadata: {
          awardedAt: new Date().toISOString()
        }
      },
      include: {
        badge: true
      }
    });

    // Log analytics event
    await this.logBadgeEvent(
      badgeId,
      BadgeEvent.EARNED,
      { userId, earnedAt: new Date() }
    );

    // Update user's badge progress
    await this.updateBadgeProgress(userId, badgeId, 100);

    return userBadge;
  }

  async checkBadgeConditions(
    userId: string,
    criteria: BadgeUnlockCriteria,
    triggerEvent: any
  ): Promise<boolean> {
    switch (criteria.type) {
      case 'course_completion':
        return await this.checkCourseCompletionCondition(userId, criteria.conditions);
      
      case 'exam_score':
        return await this.checkExamScoreCondition(userId, criteria.conditions);
      
      case 'streak':
        return await this.checkStreakCondition(userId, criteria.conditions);
      
      case 'time_spent':
        return await this.checkTimeSpentCondition(userId, criteria.conditions);
      
      case 'skill_level':
        return await this.checkSkillLevelCondition(userId, criteria.conditions);
      
      case 'activity_count':
        return await this.checkActivityCountCondition(userId, criteria.conditions);
      
      case 'combined':
        return await this.checkCombinedConditions(userId, criteria.conditions, triggerEvent);
      
      default:
        return false;
    }
  }

  private async checkCourseCompletionCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    if (conditions.courseId) {
      // Check specific course completion
      const enrollment = await db.userCourseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: conditions.courseId
          }
        }
      });
      return enrollment?.completedAt !== null;
    } else {
      // Check total completed courses
      const completedCourses = await db.userCourseEnrollment.count({
        where: {
          userId,
          completedAt: { not: null }
        }
      });
      return completedCourses >= (conditions.count || 1);
    }
  }

  private async checkExamScoreCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    const examAttempts = await db.examAttempt.findMany({
      where: {
        userId,
        passed: true,
        score: { gte: conditions.minimumScore || 0 }
      }
    });

    return examAttempts.length >= (conditions.count || 1);
  }

  private async checkStreakCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    const streakInfo = await db.streakInfo.findUnique({
      where: { userId }
    });

    return streakInfo?.currentStreak >= (conditions.streakDays || 1);
  }

  private async checkTimeSpentCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    const totalTime = await db.userVideoProgress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true }
    });

    const totalHours = (totalTime._sum.watchedSeconds || 0) / 3600;
    return totalHours >= (conditions.timeSpentHours || 1);
  }

  private async checkSkillLevelCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    if (!conditions.skillId) return false;

    const userSkill = await db.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: conditions.skillId
        }
      }
    });

    return userSkill?.proficiencyLevel >= (conditions.skillLevel || 1);
  }

  private async checkActivityCountCondition(
    userId: string,
    conditions: any
  ): Promise<boolean> {
    if (!conditions.activityType) return false;

    const activityCount = await db.recentActivity.count({
      where: {
        userId,
        activityType: conditions.activityType
      }
    });

    return activityCount >= (conditions.count || 1);
  }

  private async checkCombinedConditions(
    userId: string,
    conditions: any,
    triggerEvent: any
  ): Promise<boolean> {
    if (!conditions.combinedConditions) return false;

    const results = await Promise.all(
      conditions.combinedConditions.map((condition: BadgeUnlockCriteria) =>
        this.checkBadgeConditions(userId, condition, triggerEvent)
      )
    );

    // All conditions must be met for combined badges
    return results.every(result => result === true);
  }

  async updateBadgeProgress(userId: string, badgeId: string, progress: number): Promise<void> {
    await db.badgeProgress.upsert({
      where: {
        userId_badgeName_badgeLevel: {
          userId,
          badgeName: badgeId, // Using badgeId as badgeName for now
          badgeLevel: BadgeLevel.BRONZE // Default level
        }
      },
      update: {
        currentValue: progress,
        progress: progress,
        updatedAt: new Date()
      },
      create: {
        userId,
        badgeName: badgeId,
        badgeLevel: BadgeLevel.BRONZE,
        currentValue: progress,
        targetValue: 100,
        progress: progress,
        category: 'achievement'
      }
    });

    // Log progress update
    await this.logBadgeEvent(
      badgeId,
      BadgeEvent.PROGRESS_UPDATED,
      { userId, progress }
    );
  }

  async getUserBadges(userId: string): Promise<any[]> {
    return await db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });
  }

  async getBadgeLeaderboard(badgeId: string, limit: number = 10): Promise<any[]> {
    return await db.userBadge.findMany({
      where: { badgeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        badge: {
          select: {
            name: true,
            level: true,
            points: true
          }
        }
      },
      orderBy: {
        earnedAt: 'asc'
      },
      take: limit
    });
  }

  async getBadgeAnalytics(badgeId: string): Promise<any> {
    const analytics = await db.badgeAnalytics.findMany({
      where: { badgeId },
      orderBy: { timestamp: 'desc' }
    });

    const totalEarned = await db.userBadge.count({
      where: { badgeId }
    });

    const recentEarned = await db.userBadge.count({
      where: {
        badgeId,
        earnedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      events: analytics,
      totalEarned,
      recentEarned,
      earnedThisWeek: recentEarned
    };
  }

  private async logBadgeEvent(
    badgeId: string,
    eventType: BadgeEvent,
    eventData: any
  ): Promise<void> {
    await db.badgeAnalytics.create({
      data: {
        badgeId,
        userId: eventData.userId,
        eventType,
        eventData
      }
    });
  }

  // Pre-defined badge definitions
  static getDefaultBadges(): BadgeDefinition[] {
    return [
      {
        name: "First Steps",
        slug: "first-steps",
        description: "Complete your first course",
        badgeType: BadgeType.MILESTONE,
        category: BadgeCategory.LEARNING,
        level: BadgeLevel.BRONZE,
        points: 50,
        iconUrl: "/badges/first-steps.png",
        unlockCriteria: {
          type: 'course_completion',
          conditions: {
            count: 1
          }
        }
      },
      {
        name: "Dedicated Learner",
        slug: "dedicated-learner",
        description: "Complete 5 courses",
        badgeType: BadgeType.ACHIEVEMENT,
        category: BadgeCategory.LEARNING,
        level: BadgeLevel.SILVER,
        points: 200,
        iconUrl: "/badges/dedicated-learner.png",
        unlockCriteria: {
          type: 'course_completion',
          conditions: {
            count: 5
          }
        }
      },
      {
        name: "Expert Learner",
        slug: "expert-learner",
        description: "Complete 10 courses",
        badgeType: BadgeType.ACHIEVEMENT,
        category: BadgeCategory.LEARNING,
        level: BadgeLevel.GOLD,
        points: 500,
        iconUrl: "/badges/expert-learner.png",
        unlockCriteria: {
          type: 'course_completion',
          conditions: {
            count: 10
          }
        }
      },
      {
        name: "Perfect Score",
        slug: "perfect-score",
        description: "Score 100% on an exam",
        badgeType: BadgeType.ACHIEVEMENT,
        category: BadgeCategory.PERFORMANCE,
        level: BadgeLevel.GOLD,
        points: 300,
        iconUrl: "/badges/perfect-score.png",
        unlockCriteria: {
          type: 'exam_score',
          conditions: {
            minimumScore: 100,
            count: 1
          }
        }
      },
      {
        name: "Streak Master",
        slug: "streak-master",
        description: "Maintain a 7-day learning streak",
        badgeType: BadgeType.STREAK,
        category: BadgeCategory.ENGAGEMENT,
        level: BadgeLevel.SILVER,
        points: 150,
        iconUrl: "/badges/streak-master.png",
        unlockCriteria: {
          type: 'streak',
          conditions: {
            streakDays: 7
          }
        }
      },
      {
        name: "Time Dedication",
        slug: "time-dedication",
        description: "Spend 50 hours learning",
        badgeType: BadgeType.MILESTONE,
        category: BadgeCategory.ENGAGEMENT,
        level: BadgeLevel.BRONZE,
        points: 100,
        iconUrl: "/badges/time-dedication.png",
        unlockCriteria: {
          type: 'time_spent',
          conditions: {
            timeSpentHours: 50
          }
        }
      },
      {
        name: "High Achiever",
        slug: "high-achiever",
        description: "Complete 3 courses with 90%+ score",
        badgeType: BadgeType.ACHIEVEMENT,
        category: BadgeCategory.PERFORMANCE,
        level: BadgeLevel.GOLD,
        points: 400,
        iconUrl: "/badges/high-achiever.png",
        unlockCriteria: {
          type: 'combined',
          conditions: {
            combinedConditions: [
              {
                type: 'course_completion',
                conditions: { count: 3 }
              },
              {
                type: 'exam_score',
                conditions: { minimumScore: 90, count: 3 }
              }
            ]
          }
        }
      }
    ];
  }
}

export const badgeService = new BadgeService();