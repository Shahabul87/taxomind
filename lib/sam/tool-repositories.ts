/**
 * SAM Agentic Tool Repositories
 * Provides database-backed repositories for mentor tools
 * Integrates vector search and knowledge graph for enhanced recommendations
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  ContentToolsDependencies,
  SchedulingToolsDependencies,
  NotificationToolsDependencies,
  ContentRecommendation,
  StudySession,
  StudyBlock,
  Reminder,
  Notification,
} from '@sam-ai/agentic';
import { searchContent as vectorSearchContent } from '@/lib/sam/agentic-vector-search';
import {
  getKGContentRecommendations,
  getKGRelatedContent,
  getKGUserProfile,
  type ContentRecommendation as KGContentRecommendation,
} from '@/lib/sam/agentic-knowledge-graph';

// ============================================================================
// CONTENT REPOSITORY
// ============================================================================

interface ContentContext {
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  currentTopic?: string;
}

/**
 * Content repository backed by Course/Chapter/Section models
 * Enhanced with knowledge graph for personalized recommendations
 */
export function createContentRepository(): NonNullable<ContentToolsDependencies['contentRepository']> {
  return {
    async getRelatedContent(
      context: ContentContext,
      limit: number
    ): Promise<ContentRecommendation[]> {
      const recommendations: ContentRecommendation[] = [];

      try {
        // If we have user context, use knowledge graph for personalized recommendations
        if (context.userId && (context.courseId || context.sectionId)) {
          const kgRecommendations = await getKGContentRecommendations(
            {
              userId: context.userId,
              courseId: context.courseId,
              currentSectionId: context.sectionId,
            },
            {
              limit,
              includePrerequisites: true,
              focusOnWeakAreas: true,
            }
          );

          for (const rec of kgRecommendations) {
            recommendations.push(mapKGToContentRecommendation(rec));
          }

          // If KG provided enough recommendations, return them
          if (recommendations.length >= limit) {
            return recommendations.slice(0, limit);
          }
        }

        // If user has context for section, get KG-based related content
        if (context.userId && context.sectionId && recommendations.length < limit) {
          const relatedResult = await getKGRelatedContent(
            context.sectionId,
            context.userId,
            { limit: limit - recommendations.length }
          );

          for (const rec of relatedResult.content) {
            if (!recommendations.find((r) => r.id === rec.id)) {
              recommendations.push(mapKGToContentRecommendation(rec));
            }
          }
        }

        // Fallback to database queries if KG didnt provide enough
        if (context.courseId && recommendations.length < limit) {
          // Get chapters from the same course
          const chapters = await db.chapter.findMany({
            where: { courseId: context.courseId },
            take: limit - recommendations.length,
            orderBy: { position: 'asc' },
            include: {
              course: { select: { title: true } },
            },
          });

          for (const chapter of chapters) {
            if (!recommendations.find((r) => r.id === chapter.id)) {
              recommendations.push({
                id: chapter.id,
                type: 'chapter',
                title: chapter.title,
                description: chapter.description ?? `Chapter from ${chapter.course.title}`,
                difficulty: 'intermediate',
                relevanceScore: 0.7,
                estimatedTime: 30,
                reason: 'Related chapter from the same course',
              });
            }
          }
        }

        if (context.chapterId && recommendations.length < limit) {
          // Get sections from the chapter
          const sections = await db.section.findMany({
            where: { chapterId: context.chapterId },
            take: limit - recommendations.length,
            orderBy: { position: 'asc' },
          });

          for (const section of sections) {
            if (!recommendations.find((r) => r.id === section.id)) {
              recommendations.push({
                id: section.id,
                type: 'section',
                title: section.title,
                description: section.description ?? 'Section content',
                difficulty: 'intermediate',
                relevanceScore: 0.8,
                estimatedTime: 15,
                reason: 'Section from the current chapter',
              });
            }
          }
        }

        // Get more courses if needed
        if (recommendations.length < limit) {
          const courses = await db.course.findMany({
            where: context.courseId ? { id: { not: context.courseId } } : undefined,
            take: limit - recommendations.length,
            orderBy: { createdAt: 'desc' },
          });

          for (const course of courses) {
            if (!recommendations.find((r) => r.id === course.id)) {
              recommendations.push({
                id: course.id,
                type: 'resource',
                title: course.title,
                description: course.description ?? 'Course content',
                difficulty: 'intermediate',
                relevanceScore: 0.5,
                estimatedTime: 60,
                reason: 'Related course you might be interested in',
              });
            }
          }
        }
      } catch (error) {
        logger.error('Error fetching related content', { error, context });
      }

      // Sort by relevance and return
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    },

    async searchContent(query: string, limit: number): Promise<ContentRecommendation[]> {
      const recommendations: ContentRecommendation[] = [];

      try {
        // First, try semantic vector search
        const vectorResults = await vectorSearchContent(query, {
          topK: limit,
          minScore: 0.6,
        });

        for (const result of vectorResults) {
          // Determine type from sourceType
          let type: 'resource' | 'chapter' | 'section' | 'article' | 'video' | 'quiz' = 'resource';
          if (result.sourceType === 'chapter_content') type = 'chapter';
          else if (result.sourceType === 'section_content') type = 'section';

          recommendations.push({
            id: result.sourceId,
            type,
            title: result.content.slice(0, 100) + (result.content.length > 100 ? '...' : ''),
            description: result.content.slice(0, 200),
            difficulty: 'intermediate',
            relevanceScore: result.score,
            estimatedTime: type === 'chapter' ? 30 : 15,
            reason: `Semantic match (${Math.round(result.score * 100)}% relevance)`,
          });
        }

        // If vector search returned few results, supplement with keyword search
        if (recommendations.length < limit) {
          // Search courses
          const courses = await db.course.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: Math.ceil((limit - recommendations.length) / 2),
          });

          for (const course of courses) {
            // Avoid duplicates
            if (!recommendations.find((r) => r.id === course.id)) {
              recommendations.push({
                id: course.id,
                type: 'resource',
                title: course.title,
                description: course.description ?? '',
                difficulty: 'intermediate',
                relevanceScore: 0.6,
                estimatedTime: 60,
                reason: `Keyword match: "${query}"`,
              });
            }
          }

          // Search chapters
          const chapters = await db.chapter.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit - recommendations.length,
            include: { course: { select: { title: true } } },
          });

          for (const chapter of chapters) {
            if (!recommendations.find((r) => r.id === chapter.id)) {
              recommendations.push({
                id: chapter.id,
                type: 'chapter',
                title: chapter.title,
                description: chapter.description ?? `From: ${chapter.course.title}`,
                difficulty: 'intermediate',
                relevanceScore: 0.5,
                estimatedTime: 30,
                reason: `Keyword match: "${query}"`,
              });
            }
          }
        }
      } catch (error) {
        logger.error('Error searching content', { error, query });
      }

      // Sort by relevance score and return top results
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    },
  };
}

// ============================================================================
// SCHEDULING REPOSITORIES
// ============================================================================

// In-memory stores for sessions and reminders (until dedicated models are added)
const studySessionsCache = new Map<string, StudySession[]>();
const remindersCache = new Map<string, Reminder[]>();

/**
 * Session repository - uses in-memory cache with user isolation
 */
export function createSessionRepository(): NonNullable<SchedulingToolsDependencies['sessionRepository']> {
  return {
    async create(session: Omit<StudySession, 'id'>): Promise<StudySession> {
      const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newSession: StudySession = { ...session, id };

      const userSessions = studySessionsCache.get(session.userId) ?? [];
      userSessions.push(newSession);
      studySessionsCache.set(session.userId, userSessions);

      logger.debug('Created study session', { sessionId: id, userId: session.userId });
      return newSession;
    },

    async get(sessionId: string): Promise<StudySession | null> {
      for (const sessions of Array.from(studySessionsCache.values())) {
        const session = sessions.find((s) => s.id === sessionId);
        if (session) return session;
      }
      return null;
    },

    async update(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
      for (const [userId, sessions] of Array.from(studySessionsCache.entries())) {
        const index = sessions.findIndex((s) => s.id === sessionId);
        if (index !== -1) {
          sessions[index] = { ...sessions[index], ...updates };
          studySessionsCache.set(userId, sessions);
          return sessions[index];
        }
      }
      throw new Error(`Session not found: ${sessionId}`);
    },

    async getByUser(
      userId: string,
      options?: { from?: Date; to?: Date }
    ): Promise<StudySession[]> {
      let sessions = studySessionsCache.get(userId) ?? [];

      if (options?.from) {
        sessions = sessions.filter((s) => s.startTime >= options.from!);
      }
      if (options?.to) {
        sessions = sessions.filter((s) => s.endTime <= options.to!);
      }

      return sessions.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      );
    },
  };
}

/**
 * Reminder repository - uses in-memory cache
 */
export function createReminderRepository(): NonNullable<SchedulingToolsDependencies['reminderRepository']> {
  return {
    async create(reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
      const id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newReminder: Reminder = {
        ...reminder,
        id,
        createdAt: new Date(),
      };

      const userReminders = remindersCache.get(reminder.userId) ?? [];
      userReminders.push(newReminder);
      remindersCache.set(reminder.userId, userReminders);

      logger.debug('Created reminder', { reminderId: id, userId: reminder.userId });
      return newReminder;
    },

    async get(reminderId: string): Promise<Reminder | null> {
      for (const reminders of Array.from(remindersCache.values())) {
        const reminder = reminders.find((r) => r.id === reminderId);
        if (reminder) return reminder;
      }
      return null;
    },

    async update(reminderId: string, updates: Partial<Reminder>): Promise<Reminder> {
      for (const [userId, reminders] of Array.from(remindersCache.entries())) {
        const index = reminders.findIndex((r) => r.id === reminderId);
        if (index !== -1) {
          reminders[index] = { ...reminders[index], ...updates };
          remindersCache.set(userId, reminders);
          return reminders[index];
        }
      }
      throw new Error(`Reminder not found: ${reminderId}`);
    },

    async getByUser(userId: string, status?: string): Promise<Reminder[]> {
      let reminders = remindersCache.get(userId) ?? [];

      if (status) {
        reminders = reminders.filter((r) => r.status === status);
      }

      return reminders.sort(
        (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
      );
    },

    async delete(reminderId: string): Promise<void> {
      for (const [userId, reminders] of Array.from(remindersCache.entries())) {
        const index = reminders.findIndex((r) => r.id === reminderId);
        if (index !== -1) {
          reminders.splice(index, 1);
          remindersCache.set(userId, reminders);
          return;
        }
      }
    },
  };
}

// ============================================================================
// NOTIFICATION REPOSITORY
// ============================================================================

/**
 * Notification repository backed by Notification model
 */
export function createNotificationRepository(): NonNullable<NotificationToolsDependencies['notificationRepository']> {
  return {
    async create(
      notification: Omit<Notification, 'id' | 'createdAt'>
    ): Promise<Notification> {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create in database using the simplified Notification model
      await db.notification.create({
        data: {
          id,
          userId: notification.userId,
          title: notification.title,
          message: notification.body,
          type: notification.type,
          read: false,
        },
      });

      return {
        ...notification,
        id,
        createdAt: new Date(),
      };
    },

    async get(notificationId: string): Promise<Notification | null> {
      const record = await db.notification.findUnique({
        where: { id: notificationId },
      });

      if (!record) return null;

      return {
        id: record.id,
        userId: record.userId,
        type: record.type as Notification['type'],
        title: record.title,
        body: record.message,
        priority: 'normal',
        channels: ['in_app'],
        status: record.read ? 'read' : 'sent',
        createdAt: record.createdAt,
      };
    },

    async update(
      notificationId: string,
      updates: Partial<Notification>
    ): Promise<Notification> {
      const data: Record<string, unknown> = {};

      if (updates.title) data.title = updates.title;
      if (updates.body) data.message = updates.body;
      if (updates.status === 'read') data.read = true;

      await db.notification.update({
        where: { id: notificationId },
        data,
      });

      const existing = await this.get(notificationId);
      if (!existing) throw new Error(`Notification not found: ${notificationId}`);

      return { ...existing, ...updates };
    },

    async getByUser(
      userId: string,
      options?: { status?: string; limit?: number }
    ): Promise<Notification[]> {
      const where: Record<string, unknown> = { userId };

      if (options?.status === 'read') {
        where.read = true;
      } else if (options?.status === 'unread' || options?.status === 'sent') {
        where.read = false;
      }

      const records = await db.notification.findMany({
        where,
        take: options?.limit ?? 50,
        orderBy: { createdAt: 'desc' },
      });

      return records.map((record) => ({
        id: record.id,
        userId: record.userId,
        type: record.type as Notification['type'],
        title: record.title,
        body: record.message,
        priority: 'normal' as const,
        channels: ['in_app'] as string[],
        status: (record.read ? 'read' : 'sent') as Notification['status'],
        createdAt: record.createdAt,
      }));
    },

    async markRead(notificationId: string): Promise<Notification> {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      const notification = await this.get(notificationId);
      if (!notification) throw new Error(`Notification not found: ${notificationId}`);
      return notification;
    },

    async markAllRead(userId: string): Promise<number> {
      const result = await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return result.count;
    },
  };
}

// ============================================================================
// PROGRESS REPOSITORY
// ============================================================================

/**
 * Progress repository for analytics and reports
 */
export function createProgressRepository(): NonNullable<NotificationToolsDependencies['progressRepository']> {
  return {
    async getStudyMetrics(
      userId: string,
      startDate: Date,
      endDate: Date
    ): Promise<{
      studyTime: number;
      lessonsCompleted: number;
      assessmentsTaken: number;
      averageScore: number;
      streakDays: number;
      masteryProgress: number;
    }> {
      try {
        // Get user progress data
        const userProgressList = await db.user_progress.findMany({
          where: {
            userId,
            updatedAt: { gte: startDate, lte: endDate },
          },
        });

        const completedLessons = userProgressList.filter((p) => p.isCompleted).length;

        // Get skill assessments as proxy for quiz results
        const skillAssessments = await db.sAMSkillAssessment.findMany({
          where: {
            userId,
            assessedAt: { gte: startDate, lte: endDate },
          },
        });

        const assessmentsTaken = skillAssessments.length;
        const averageScore = assessmentsTaken > 0
          ? skillAssessments.reduce((sum: number, a) => sum + (a.score ?? 0), 0) / assessmentsTaken
          : 0;

        // Get streak info from SAMStreak if available
        let streakDays = 0;
        try {
          const streak = await db.sAMStreak.findUnique({
            where: { id: `${userId}-current` },
          });
          streakDays = streak?.currentStreak ?? 0;
        } catch {
          // SAMStreak might not exist
        }

        // Estimate study time based on completed content
        const studyTime = completedLessons * 20; // ~20 min per lesson

        // Calculate mastery progress (percentage of completed content)
        const totalEnrollments = await db.enrollment.count({ where: { userId } });
        const masteryProgress = totalEnrollments > 0
          ? Math.min(100, (completedLessons / (totalEnrollments * 10)) * 100)
          : 0;

        return {
          studyTime,
          lessonsCompleted: completedLessons,
          assessmentsTaken,
          averageScore: Math.round(averageScore * 100) / 100,
          streakDays,
          masteryProgress: Math.round(masteryProgress * 100) / 100,
        };
      } catch (error) {
        logger.error('Error getting study metrics', { error, userId });
        return {
          studyTime: 0,
          lessonsCompleted: 0,
          assessmentsTaken: 0,
          averageScore: 0,
          streakDays: 0,
          masteryProgress: 0,
        };
      }
    },

    async getGoalProgress(
      userId: string
    ): Promise<Array<{ id: string; title: string; progress: number; status: string }>> {
      try {
        const goals = await db.sAMLearningGoal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Calculate progress based on status
        const statusToProgress: Record<string, number> = {
          DRAFT: 0,
          ACTIVE: 25,
          IN_PROGRESS: 50,
          PAUSED: 50,
          COMPLETED: 100,
          ACHIEVED: 100,
          ABANDONED: 0,
        };

        return goals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          progress: statusToProgress[goal.status] ?? 0,
          status: goal.status,
        }));
      } catch (error) {
        logger.error('Error getting goal progress', { error, userId });
        return [];
      }
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps KG ContentRecommendation to agentic ContentRecommendation
 */
function mapKGToContentRecommendation(rec: KGContentRecommendation): ContentRecommendation {
  // Map content type
  let type: ContentRecommendation['type'] = 'resource';
  if (rec.type === 'section') type = 'section';
  else if (rec.type === 'chapter') type = 'chapter';

  return {
    id: rec.id,
    type,
    title: rec.title,
    description: rec.reason,
    difficulty: 'intermediate', // KG doesnt track difficulty directly
    relevanceScore: rec.relevanceScore,
    estimatedTime: rec.estimatedMinutes ?? 20,
    reason: rec.reason,
  };
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create all tool repositories
 */
export function createToolRepositories() {
  return {
    contentRepository: createContentRepository(),
    sessionRepository: createSessionRepository(),
    reminderRepository: createReminderRepository(),
    notificationRepository: createNotificationRepository(),
    progressRepository: createProgressRepository(),
  };
}
