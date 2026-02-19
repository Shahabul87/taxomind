/**
 * Adaptive Content Database Adapter
 *
 * Implements the AdaptiveContentDatabaseAdapter interface from @sam-ai/educational
 * using Prisma as the database layer.
 *
 * This adapter enables the AdaptiveContentEngine to persist learner profiles,
 * track content interactions, and cache adapted content.
 */

import type {
  AdaptiveContentDatabaseAdapter,
  AdaptiveLearnerProfile,
  ContentInteractionData,
  AdaptedContent,
  AdaptiveLearningStyle,
  ContentFormat,
  ContentComplexity,
  ReadingPace,
} from '@sam-ai/educational';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { ActivityType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Map content format to a valid ActivityType enum value
 */
function formatToActivityType(format: string): ActivityType {
  const formatMap: Record<string, ActivityType> = {
    video: 'VIDEO_WATCH',
    audio: 'RESOURCE_DOWNLOAD',
    text: 'SECTION_START',
    interactive: 'QUIZ_START',
    quiz: 'QUIZ_START',
    exercise: 'QUIZ_START',
    diagram: 'RESOURCE_DOWNLOAD',
  };
  return formatMap[format.toLowerCase()] ?? 'NAVIGATION';
}

/**
 * Map database learning style to adaptive learning style
 */
function mapToAdaptiveStyle(dbStyle: string | null): AdaptiveLearningStyle {
  const styleMap: Record<string, AdaptiveLearningStyle> = {
    VISUAL: 'visual',
    AUDITORY: 'auditory',
    READING_WRITING: 'reading',
    KINESTHETIC: 'kinesthetic',
    MIXED: 'multimodal',
  };
  return styleMap[dbStyle || 'MIXED'] || 'multimodal';
}

/**
 * Map adaptive learning style to database style
 */
function mapFromAdaptiveStyle(style: AdaptiveLearningStyle): string {
  const styleMap: Record<AdaptiveLearningStyle, string> = {
    visual: 'VISUAL',
    auditory: 'AUDITORY',
    reading: 'READING_WRITING',
    kinesthetic: 'KINESTHETIC',
    multimodal: 'MIXED',
  };
  return styleMap[style] || 'MIXED';
}

/**
 * Map activity type to content format
 */
function activityToFormat(activityType: string): ContentFormat {
  const formatMap: Record<string, ContentFormat> = {
    VIDEO_WATCH: 'video',
    AUDIO_LISTEN: 'audio',
    READING: 'text',
    CODE_PRACTICE: 'code_example',
    QUIZ_ATTEMPT: 'quiz',
    INTERACTIVE: 'interactive',
    SIMULATION: 'simulation',
    CASE_STUDY: 'case_study',
  };
  return formatMap[activityType] || 'text';
}

/**
 * Prisma implementation of AdaptiveContentDatabaseAdapter
 */
export class PrismaAdaptiveContentDatabaseAdapter implements AdaptiveContentDatabaseAdapter {
  /**
   * Get learner profile for a user
   */
  async getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile | null> {
    try {
      const profile = await db.sAMLearningProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              learningStyle: true,
            },
          },
        },
      });

      if (!profile) {
        return null;
      }

      // Extract style scores and other data from preferences JSON
      const preferences = (profile.preferences as Record<string, unknown>) || {};
      const styleScores = (preferences.styleScores as {
        visual: number;
        auditory: number;
        reading: number;
        kinesthetic: number;
      }) || {
        visual: 25,
        auditory: 25,
        reading: 25,
        kinesthetic: 25,
      };

      const primaryStyle = mapToAdaptiveStyle(profile.learningStyle);

      return {
        userId: profile.userId,
        primaryStyle,
        secondaryStyle: (preferences.secondaryStyle as AdaptiveLearningStyle) || undefined,
        styleScores,
        preferredFormats: (preferences.preferredFormats as ContentFormat[]) || ['text', 'video'],
        preferredComplexity: (preferences.preferredComplexity as ContentComplexity) || 'standard',
        readingPace: (preferences.readingPace as ReadingPace) || 'moderate',
        preferredSessionDuration: (preferences.preferredSessionDuration as number) || 25,
        bestLearningTime: preferences.bestLearningTime as number | undefined,
        knownConcepts: (preferences.knownConcepts as string[]) || [],
        conceptsInProgress: (preferences.conceptsInProgress as string[]) || [],
        strugglingAreas: (preferences.strugglingAreas as string[]) || [],
        confidence: (preferences.confidence as number) || 0.3,
        lastUpdated: profile.lastUpdated,
      };
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error getting learner profile:', error);
      return null;
    }
  }

  /**
   * Save or update learner profile
   */
  async saveLearnerProfile(profile: AdaptiveLearnerProfile): Promise<void> {
    try {
      const dbStyle = mapFromAdaptiveStyle(profile.primaryStyle);

      const preferences = {
        styleScores: profile.styleScores,
        secondaryStyle: profile.secondaryStyle,
        preferredFormats: profile.preferredFormats,
        preferredComplexity: profile.preferredComplexity,
        readingPace: profile.readingPace,
        preferredSessionDuration: profile.preferredSessionDuration,
        bestLearningTime: profile.bestLearningTime,
        knownConcepts: profile.knownConcepts,
        conceptsInProgress: profile.conceptsInProgress,
        strugglingAreas: profile.strugglingAreas,
        confidence: profile.confidence,
      };

      await db.sAMLearningProfile.upsert({
        where: { userId: profile.userId },
        update: {
          learningStyle: dbStyle as 'VISUAL' | 'AUDITORY' | 'READING_WRITING' | 'KINESTHETIC' | 'MIXED',
          preferences,
          lastUpdated: new Date(),
        },
        create: {
          userId: profile.userId,
          learningStyle: dbStyle as 'VISUAL' | 'AUDITORY' | 'READING_WRITING' | 'KINESTHETIC' | 'MIXED',
          preferences,
          lastUpdated: new Date(),
        },
      });

      logger.info('[AdaptiveContentAdapter] Saved learner profile for user:', profile.userId);
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error saving learner profile:', error);
      throw error;
    }
  }

  /**
   * Record a content interaction
   */
  async recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<string> {
    try {
      const activity = await db.realtime_activities.create({
        data: {
          id: randomUUID(),
          userId: interaction.userId,
          activityType: formatToActivityType(interaction.format),
          action: `content_${interaction.format}`,
          courseId: interaction.contentId.split('-')[0] || null,
          chapterId: interaction.contentId.split('-')[1] || null,
          duration: interaction.timeSpent,
          timestamp: interaction.timestamp,
          metadata: {
            contentId: interaction.contentId,
            format: interaction.format,
            scrollDepth: interaction.scrollDepth,
            replayCount: interaction.replayCount ?? null,
            pauseCount: interaction.pauseCount ?? null,
            notesTaken: interaction.notesTaken ?? null,
            completed: interaction.completed,
            checkPerformance: interaction.checkPerformance ?? null,
          },
        },
      });

      return activity.id;
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error recording interaction:', error);
      throw error;
    }
  }

  /**
   * Get user interactions for style detection
   */
  async getInteractions(
    userId: string,
    options?: { contentId?: string; limit?: number; since?: Date }
  ): Promise<ContentInteractionData[]> {
    try {
      const activities = await db.realtime_activities.findMany({
        where: {
          userId,
          ...(options?.contentId && {
            metadata: {
              path: ['contentId'],
              equals: options.contentId,
            },
          }),
          ...(options?.since && {
            timestamp: { gte: options.since },
          }),
        },
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 100,
      });

      return activities.map((activity) => {
        const metadata = (activity.metadata as Record<string, unknown>) || {};
        return {
          id: activity.id,
          userId: activity.userId,
          contentId: (metadata.contentId as string) || activity.courseId || '',
          format: activityToFormat(activity.activityType),
          timeSpent: activity.duration || 0,
          scrollDepth: (metadata.scrollDepth as number) || 0,
          replayCount: metadata.replayCount as number | undefined,
          pauseCount: metadata.pauseCount as number | undefined,
          notesTaken: metadata.notesTaken as boolean | undefined,
          completed: (metadata.completed as boolean) || false,
          checkPerformance: metadata.checkPerformance as number | undefined,
          timestamp: activity.timestamp,
        };
      });
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error getting interactions:', error);
      return [];
    }
  }

  /**
   * Get cached adapted content
   */
  async getCachedContent(
    originalId: string,
    style: AdaptiveLearningStyle
  ): Promise<AdaptedContent | null> {
    try {
      // Use SAMLearningProfile adaptationHistory for caching
      // JSON array fields don't support `some` filtering — filter in-memory
      const profiles = await db.sAMLearningProfile.findMany({
        take: 50,
      });

      // Filter in-memory since Prisma JSON array filtering is limited
      let cached: Record<string, unknown> | undefined;
      let profile: typeof profiles[number] | null = null;
      for (const p of profiles) {
        const history = p.adaptationHistory as Array<Record<string, unknown>> | null;
        if (!history) continue;
        const match = history.find(
          (h) => h.originalId === originalId && h.targetStyle === style
        );
        if (match) {
          cached = match;
          profile = p;
          break;
        }
      }

      if (!profile || !cached) return null;

      if (!cached) return null;

      // Check if cache is still valid (24 hours)
      const cachedAt = new Date(cached.cachedAt as string);
      const now = new Date();
      const hoursDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) return null;

      return cached.content as AdaptedContent;
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error getting cached content:', error);
      return null;
    }
  }

  /**
   * Cache adapted content
   */
  async cacheContent(content: AdaptedContent): Promise<void> {
    try {
      // Find profiles with adaptation history to check for existing cache
      const profiles = await db.sAMLearningProfile.findMany({
        take: 50,
      });

      const cacheEntry = {
        originalId: content.originalId,
        targetStyle: content.adaptationInfo.targetStyle,
        cachedAt: new Date().toISOString(),
        content,
      };

      // Find profile that has this content cached
      let profile: typeof profiles[number] | null = null;
      for (const p of profiles) {
        const history = p.adaptationHistory as Array<Record<string, unknown>> | null;
        if (history?.some((h) => h.originalId === content.originalId)) {
          profile = p;
          break;
        }
      }

      if (profile) {
        const history = profile.adaptationHistory as Array<Record<string, unknown>>;
        // Remove old cache for same content/style
        const filteredHistory = history.filter(
          (h) =>
            h.originalId !== content.originalId ||
            h.targetStyle !== content.adaptationInfo.targetStyle
        );
        // Keep only last 10 cached items
        const newHistory = [...filteredHistory.slice(-9), cacheEntry];

        await db.sAMLearningProfile.update({
          where: { id: profile.id },
          data: { adaptationHistory: { set: JSON.parse(JSON.stringify(newHistory)) as Prisma.InputJsonValue[] } },
        });
      }

      logger.info('[AdaptiveContentAdapter] Cached adapted content:', content.originalId);
    } catch (error) {
      logger.error('[AdaptiveContentAdapter] Error caching content:', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }
}

/**
 * Singleton instance
 */
let adapterInstance: PrismaAdaptiveContentDatabaseAdapter | null = null;

/**
 * Get or create the adapter instance
 */
export function getAdaptiveContentAdapter(): PrismaAdaptiveContentDatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = new PrismaAdaptiveContentDatabaseAdapter();
  }
  return adapterInstance;
}

/**
 * Reset the adapter instance (for testing)
 */
export function resetAdaptiveContentAdapter(): void {
  adapterInstance = null;
}
