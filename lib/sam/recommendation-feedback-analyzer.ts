/**
 * Recommendation Feedback Analyzer
 * Analyzes user feedback to improve future recommendation quality
 */

import { db } from '@/lib/db';
import type { SAMRecommendationFeedback, SAMDifficulty } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface FeedbackAnalysis {
  userId: string;
  analyzedAt: Date;
  sampleSize: number;

  // Overall metrics
  helpfulRatio: number;
  averageRating: number | null;

  // Difficulty calibration
  difficultyPreference: {
    preferHarder: boolean;
    preferEasier: boolean;
    calibrated: boolean;
    suggestedAdjustment: number; // -1 to 1, negative = easier, positive = harder
  };

  // Content type preferences
  contentTypePreferences: Map<string, number>; // type -> preference score

  // Timing insights
  timingInsights: {
    preferredTimes: string[];
    avoidTimes: string[];
    wrongTimingRate: number;
  };

  // Topic preferences
  topicPreferences: {
    preferredTopics: string[];
    avoidedTopics: string[];
    alreadyKnownRate: number;
  };

  // Confidence adjustments
  confidenceAdjustments: {
    overallAdjustment: number;
    byType: Map<string, number>;
    byReason: Map<string, number>;
  };
}

export interface RecommendationAdjustments {
  difficultyBias: number; // -1 (easier) to 1 (harder)
  confidenceThreshold: number; // minimum confidence to show
  priorityBoost: Map<string, number>; // type -> priority boost
  excludeTypes: string[];
  excludeTopics: string[];
  preferredDurations: { min: number; max: number };
  maxRecommendations: number;
}

// ============================================================================
// ANALYZER CLASS
// ============================================================================

/**
 * Analyzes user feedback to improve recommendations
 */
export class RecommendationFeedbackAnalyzer {
  private readonly minSampleSize = 5;
  private readonly lookbackDays = 90;

  /**
   * Analyze feedback history for a user
   */
  async analyzeFeedback(userId: string): Promise<FeedbackAnalysis> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.lookbackDays);

    // Fetch recommendations with feedback
    const recommendations = await db.sAMRecommendation.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        feedbackType: { not: null },
      },
      select: {
        id: true,
        type: true,
        reason: true,
        difficulty: true,
        feedbackType: true,
        feedbackComment: true,
        feedbackAt: true,
        userRating: true,
        targetSkillId: true,
        targetConceptId: true,
        isCompleted: true,
        isDismissed: true,
        createdAt: true,
      },
    });

    const analysis = this.computeAnalysis(userId, recommendations);
    return analysis;
  }

  /**
   * Get recommendation adjustments based on feedback analysis
   */
  async getAdjustments(userId: string): Promise<RecommendationAdjustments> {
    const analysis = await this.analyzeFeedback(userId);
    return this.computeAdjustments(analysis);
  }

  /**
   * Get quick preferences without full analysis
   */
  async getQuickPreferences(userId: string): Promise<{
    preferredTypes: string[];
    avoidedTypes: string[];
    difficultyBias: number;
    hasEnoughData: boolean;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const recentFeedback = await db.sAMRecommendation.groupBy({
      by: ['type', 'feedbackType'],
      where: {
        userId,
        createdAt: { gte: startDate },
        feedbackType: { not: null },
      },
      _count: true,
    });

    const typeScores = new Map<string, number>();
    let difficultyBias = 0;
    let totalFeedback = 0;

    for (const group of recentFeedback) {
      const count = group._count;
      totalFeedback += count;

      // Calculate type preference
      const currentScore = typeScores.get(group.type) || 0;
      if (group.feedbackType === 'HELPFUL') {
        typeScores.set(group.type, currentScore + count);
      } else if (group.feedbackType === 'NOT_HELPFUL' || group.feedbackType === 'NOT_RELEVANT') {
        typeScores.set(group.type, currentScore - count);
      }

      // Calculate difficulty bias
      if (group.feedbackType === 'TOO_EASY') {
        difficultyBias += count * 0.2;
      } else if (group.feedbackType === 'TOO_HARD') {
        difficultyBias -= count * 0.2;
      }
    }

    // Normalize difficulty bias
    if (totalFeedback > 0) {
      difficultyBias = Math.max(-1, Math.min(1, difficultyBias / totalFeedback));
    }

    // Sort types by preference
    const sortedTypes = Array.from(typeScores.entries()).sort((a, b) => b[1] - a[1]);
    const preferredTypes = sortedTypes.filter(([_, score]) => score > 0).map(([type]) => type);
    const avoidedTypes = sortedTypes.filter(([_, score]) => score < -2).map(([type]) => type);

    return {
      preferredTypes,
      avoidedTypes,
      difficultyBias,
      hasEnoughData: totalFeedback >= this.minSampleSize,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private computeAnalysis(
    userId: string,
    recommendations: Array<{
      id: string;
      type: string;
      reason: string;
      difficulty: SAMDifficulty;
      feedbackType: SAMRecommendationFeedback | null;
      feedbackComment: string | null;
      feedbackAt: Date | null;
      userRating: number | null;
      targetSkillId: string | null;
      targetConceptId: string | null;
      isCompleted: boolean;
      isDismissed: boolean;
      createdAt: Date;
    }>
  ): FeedbackAnalysis {
    const sampleSize = recommendations.length;

    // Count feedback types
    const feedbackCounts: Record<string, number> = {};
    const typeScores: Map<string, { helpful: number; total: number }> = new Map();
    const reasonScores: Map<string, { helpful: number; total: number }> = new Map();
    const topicCounts: { known: string[]; avoided: string[] } = { known: [], avoided: [] };

    let helpfulCount = 0;
    let notHelpfulCount = 0;
    let tooEasyCount = 0;
    let tooHardCount = 0;
    let wrongTimingCount = 0;
    let alreadyKnowCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const rec of recommendations) {
      const feedback = rec.feedbackType;
      if (!feedback) continue;

      feedbackCounts[feedback] = (feedbackCounts[feedback] || 0) + 1;

      // Track type preferences
      if (!typeScores.has(rec.type)) {
        typeScores.set(rec.type, { helpful: 0, total: 0 });
      }
      const typeScore = typeScores.get(rec.type)!;
      typeScore.total++;
      if (feedback === 'HELPFUL') typeScore.helpful++;

      // Track reason preferences
      if (!reasonScores.has(rec.reason)) {
        reasonScores.set(rec.reason, { helpful: 0, total: 0 });
      }
      const reasonScore = reasonScores.get(rec.reason)!;
      reasonScore.total++;
      if (feedback === 'HELPFUL') reasonScore.helpful++;

      // Count feedback types
      switch (feedback) {
        case 'HELPFUL':
          helpfulCount++;
          break;
        case 'NOT_HELPFUL':
          notHelpfulCount++;
          break;
        case 'TOO_EASY':
          tooEasyCount++;
          break;
        case 'TOO_HARD':
          tooHardCount++;
          break;
        case 'WRONG_TIMING':
          wrongTimingCount++;
          break;
        case 'ALREADY_KNOW':
          alreadyKnowCount++;
          if (rec.targetSkillId) topicCounts.known.push(rec.targetSkillId);
          if (rec.targetConceptId) topicCounts.known.push(rec.targetConceptId);
          break;
        case 'NOT_RELEVANT':
          if (rec.targetSkillId) topicCounts.avoided.push(rec.targetSkillId);
          if (rec.targetConceptId) topicCounts.avoided.push(rec.targetConceptId);
          break;
      }

      // Track ratings
      if (rec.userRating !== null) {
        ratingSum += rec.userRating;
        ratingCount++;
      }
    }

    // Calculate metrics
    const totalFeedback = helpfulCount + notHelpfulCount;
    const helpfulRatio = totalFeedback > 0 ? helpfulCount / totalFeedback : 0.5;
    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : null;

    // Difficulty preference
    const difficultyTotal = tooEasyCount + tooHardCount + helpfulCount;
    let suggestedAdjustment = 0;
    if (difficultyTotal > 0) {
      suggestedAdjustment = (tooEasyCount - tooHardCount) / difficultyTotal;
    }

    // Content type preferences
    const contentTypePreferences = new Map<string, number>();
    for (const [type, scores] of typeScores) {
      const preference = scores.total > 0 ? scores.helpful / scores.total : 0.5;
      contentTypePreferences.set(type, preference);
    }

    // Confidence adjustments by type
    const confidenceByType = new Map<string, number>();
    for (const [type, scores] of typeScores) {
      if (scores.total >= 3) {
        const successRate = scores.helpful / scores.total;
        // Adjust confidence: if success rate is low, increase threshold
        confidenceByType.set(type, successRate < 0.5 ? 0.1 : -0.1);
      }
    }

    // Confidence adjustments by reason
    const confidenceByReason = new Map<string, number>();
    for (const [reason, scores] of reasonScores) {
      if (scores.total >= 3) {
        const successRate = scores.helpful / scores.total;
        confidenceByReason.set(reason, successRate < 0.5 ? 0.1 : -0.1);
      }
    }

    return {
      userId,
      analyzedAt: new Date(),
      sampleSize,
      helpfulRatio,
      averageRating,
      difficultyPreference: {
        preferHarder: tooEasyCount > tooHardCount * 2,
        preferEasier: tooHardCount > tooEasyCount * 2,
        calibrated: Math.abs(tooEasyCount - tooHardCount) <= 2,
        suggestedAdjustment,
      },
      contentTypePreferences,
      timingInsights: {
        preferredTimes: [],
        avoidTimes: [],
        wrongTimingRate: sampleSize > 0 ? wrongTimingCount / sampleSize : 0,
      },
      topicPreferences: {
        preferredTopics: [],
        avoidedTopics: [...new Set(topicCounts.avoided)],
        alreadyKnownRate: sampleSize > 0 ? alreadyKnowCount / sampleSize : 0,
      },
      confidenceAdjustments: {
        overallAdjustment: helpfulRatio > 0.7 ? -0.05 : (helpfulRatio < 0.4 ? 0.15 : 0),
        byType: confidenceByType,
        byReason: confidenceByReason,
      },
    };
  }

  private computeAdjustments(analysis: FeedbackAnalysis): RecommendationAdjustments {
    const { difficultyPreference, contentTypePreferences, topicPreferences, confidenceAdjustments } = analysis;

    // Calculate priority boosts based on content type success
    const priorityBoost = new Map<string, number>();
    for (const [type, preference] of contentTypePreferences) {
      if (preference > 0.7) {
        priorityBoost.set(type, 1); // Boost priority
      } else if (preference < 0.3) {
        priorityBoost.set(type, -1); // Lower priority
      }
    }

    // Determine excluded types (very low success rate)
    const excludeTypes = Array.from(contentTypePreferences.entries())
      .filter(([_, pref]) => pref < 0.2)
      .map(([type]) => type);

    // Calculate confidence threshold
    const baseConfidence = 0.5;
    const adjustedConfidence = Math.max(0.3, Math.min(0.8,
      baseConfidence + confidenceAdjustments.overallAdjustment
    ));

    return {
      difficultyBias: difficultyPreference.suggestedAdjustment,
      confidenceThreshold: adjustedConfidence,
      priorityBoost,
      excludeTypes,
      excludeTopics: topicPreferences.avoidedTopics,
      preferredDurations: {
        min: 5,
        max: analysis.helpfulRatio > 0.6 ? 45 : 30, // Shorter if struggling
      },
      maxRecommendations: analysis.helpfulRatio > 0.5 ? 10 : 5, // Fewer if low success
    };
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create a feedback analyzer instance
 */
export function createFeedbackAnalyzer(): RecommendationFeedbackAnalyzer {
  return new RecommendationFeedbackAnalyzer();
}

/**
 * Get feedback-based adjustments for a user
 */
export async function getFeedbackAdjustments(userId: string): Promise<RecommendationAdjustments> {
  const analyzer = createFeedbackAnalyzer();
  return analyzer.getAdjustments(userId);
}

/**
 * Get quick preferences for a user
 */
export async function getQuickPreferences(userId: string) {
  const analyzer = createFeedbackAnalyzer();
  return analyzer.getQuickPreferences(userId);
}
