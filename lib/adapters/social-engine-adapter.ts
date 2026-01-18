/**
 * Social Engine Database Adapter
 *
 * Prisma implementation of SocialDatabaseAdapter for the SocialEngine
 * from @sam-ai/educational package.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  SocialDatabaseAdapter,
  SocialInteraction,
  SocialEffectivenessScore,
  SocialEngagementMetrics,
  SocialSharingImpact,
  SocialMatchingResult,
  SocialDynamicsAnalysis,
} from '@sam-ai/educational';

export class PrismaSocialDatabaseAdapter implements SocialDatabaseAdapter {
  /**
   * Get interactions for a group
   */
  async getGroupInteractions(groupId: string): Promise<SocialInteraction[]> {
    try {
      // Get discussions and comments from the group
      const [discussions, comments] = await Promise.all([
        db.groupDiscussion.findMany({
          where: { groupId },
          include: {
            User: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        db.groupDiscussionComment.findMany({
          where: {
            discussion: { groupId },
          },
          include: {
            User: { select: { id: true, name: true } },
            discussion: { select: { authorId: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
      ]);

      const interactions: SocialInteraction[] = [];

      // Convert discussions to interactions
      for (const discussion of discussions) {
        interactions.push({
          id: discussion.id,
          type: 'post',
          userId: discussion.authorId,
          contentId: discussion.id,
          timestamp: discussion.createdAt,
          sentiment: this.analyzeSentiment(discussion.content),
          helpfulness: discussion.likesCount > 0 ? Math.min(1, discussion.likesCount / 10) : 0.5,
        });
      }

      // Convert comments to interactions
      for (const comment of comments) {
        interactions.push({
          id: comment.id,
          type: 'comment',
          userId: comment.authorId,
          targetUserId: comment.discussion?.authorId,
          contentId: comment.discussionId,
          timestamp: comment.createdAt,
          sentiment: this.analyzeSentiment(comment.content),
          helpfulness: 0.6, // Default helpfulness for comments
        });
      }

      return interactions;
    } catch (error) {
      logger.error('[SocialAdapter] Failed to get group interactions', { groupId, error });
      return [];
    }
  }

  /**
   * Get user learning profile for mentor matching
   */
  async getUserLearningProfile(userId: string): Promise<{
    experience: number;
    averageScore: number;
    strengths: string[];
    skillGaps: string[];
    availableHours: number;
    requiredHours: number;
  }> {
    try {
      // Get user's enrollment and progress data
      const [enrollments, completedChapters, examAttempts] = await Promise.all([
        db.enrollment.findMany({
          where: { userId },
          include: {
            course: { select: { title: true, categoryId: true } },
          },
        }),
        db.userProgress.count({
          where: { userId, isCompleted: true },
        }),
        db.examAttempt.findMany({
          where: { userId },
          select: { score: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Calculate experience based on enrollments and completions
      const experience = Math.min(12, Math.floor(enrollments.length / 2) + Math.floor(completedChapters / 10));

      // Calculate average score from exam attempts
      const averageScore = examAttempts.length > 0
        ? examAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / examAttempts.length
        : 70;

      // Extract strengths from completed courses
      const strengths = enrollments
        .filter(e => e.course?.categoryId)
        .slice(0, 5)
        .map(e => e.course?.title?.split(' ')[0] ?? 'General');

      // Identify skill gaps (simplified)
      const skillGaps = ['Advanced Topics', 'Practice'];

      return {
        experience,
        averageScore,
        strengths: [...new Set(strengths)],
        skillGaps,
        availableHours: experience > 6 ? 5 : 2,
        requiredHours: experience < 3 ? 4 : 2,
      };
    } catch (error) {
      logger.error('[SocialAdapter] Failed to get user learning profile', { userId, error });
      return {
        experience: 1,
        averageScore: 70,
        strengths: [],
        skillGaps: [],
        availableHours: 2,
        requiredHours: 3,
      };
    }
  }

  /**
   * Get user's learning style
   */
  async getLearningStyle(userId: string): Promise<{ primaryStyle: string } | null> {
    try {
      const profile = await db.adaptiveLearnerProfile.findUnique({
        where: { id: `profile_${userId}` },
        select: { primaryStyle: true },
      });

      if (profile?.primaryStyle) {
        return { primaryStyle: profile.primaryStyle };
      }

      // Default learning style
      return { primaryStyle: 'multimodal' };
    } catch (error) {
      logger.debug('[SocialAdapter] No learning style found for user', { userId });
      return { primaryStyle: 'multimodal' };
    }
  }

  /**
   * Store effectiveness score for a group
   */
  async storeEffectivenessScore(
    groupId: string,
    score: SocialEffectivenessScore
  ): Promise<void> {
    try {
      await db.sAMSocialAnalytics.upsert({
        where: { id: `effectiveness_${groupId}` },
        create: {
          id: `effectiveness_${groupId}`,
          groupId,
          type: 'effectiveness',
          data: score as unknown as Record<string, unknown>,
          overallScore: score.overall,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          data: score as unknown as Record<string, unknown>,
          overallScore: score.overall,
          updatedAt: new Date(),
        },
      });
      logger.debug('[SocialAdapter] Stored effectiveness score', { groupId, overall: score.overall });
    } catch (error) {
      logger.error('[SocialAdapter] Failed to store effectiveness score', { groupId, error });
    }
  }

  /**
   * Store engagement metrics for a community
   */
  async storeEngagementMetrics(
    communityId: string,
    metrics: SocialEngagementMetrics
  ): Promise<void> {
    try {
      await db.sAMSocialAnalytics.upsert({
        where: { id: `engagement_${communityId}` },
        create: {
          id: `engagement_${communityId}`,
          communityId,
          type: 'engagement',
          data: metrics as unknown as Record<string, unknown>,
          overallScore: metrics.participationRate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          data: metrics as unknown as Record<string, unknown>,
          overallScore: metrics.participationRate,
          updatedAt: new Date(),
        },
      });
      logger.debug('[SocialAdapter] Stored engagement metrics', { communityId });
    } catch (error) {
      logger.error('[SocialAdapter] Failed to store engagement metrics', { communityId, error });
    }
  }

  /**
   * Store knowledge sharing impact
   */
  async storeSharingImpact(impact: SocialSharingImpact): Promise<void> {
    try {
      const id = `sharing_${Date.now()}`;
      await db.sAMSocialAnalytics.create({
        data: {
          id,
          type: 'sharing_impact',
          data: impact as unknown as Record<string, unknown>,
          overallScore: impact.knowledgeTransfer,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger.debug('[SocialAdapter] Stored sharing impact', { id });
    } catch (error) {
      logger.error('[SocialAdapter] Failed to store sharing impact', { error });
    }
  }

  /**
   * Store mentor-mentee matching results
   */
  async storeMatchingResults(results: SocialMatchingResult[]): Promise<void> {
    try {
      for (const result of results) {
        await db.sAMSocialAnalytics.create({
          data: {
            id: `match_${result.mentorId}_${result.menteeId}`,
            type: 'mentor_match',
            data: result as unknown as Record<string, unknown>,
            overallScore: result.compatibilityScore,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      logger.debug('[SocialAdapter] Stored matching results', { count: results.length });
    } catch (error) {
      logger.error('[SocialAdapter] Failed to store matching results', { error });
    }
  }

  /**
   * Store group dynamics analysis
   */
  async storeDynamicsAnalysis(
    groupId: string,
    analysis: SocialDynamicsAnalysis
  ): Promise<void> {
    try {
      await db.sAMSocialAnalytics.upsert({
        where: { id: `dynamics_${groupId}` },
        create: {
          id: `dynamics_${groupId}`,
          groupId,
          type: 'dynamics',
          data: analysis as unknown as Record<string, unknown>,
          overallScore: analysis.healthScore,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          data: analysis as unknown as Record<string, unknown>,
          overallScore: analysis.healthScore,
          updatedAt: new Date(),
        },
      });
      logger.debug('[SocialAdapter] Stored dynamics analysis', { groupId, healthScore: analysis.healthScore });
    } catch (error) {
      logger.error('[SocialAdapter] Failed to store dynamics analysis', { groupId, error });
    }
  }

  // Helper method for basic sentiment analysis
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lowerText = text.toLowerCase();

    const positiveWords = ['thanks', 'great', 'awesome', 'helpful', 'excellent', 'amazing', 'good', 'love', 'perfect'];
    const negativeWords = ['bad', 'wrong', 'terrible', 'hate', 'awful', 'poor', 'issue', 'problem', 'stuck', 'help'];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

// Singleton instance
let adapterInstance: PrismaSocialDatabaseAdapter | null = null;

/**
 * Get the singleton SocialDatabaseAdapter instance
 */
export function getSocialEngineAdapter(): PrismaSocialDatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = new PrismaSocialDatabaseAdapter();
  }
  return adapterInstance;
}

/**
 * Reset the adapter instance (for testing)
 */
export function resetSocialEngineAdapter(): void {
  adapterInstance = null;
}
