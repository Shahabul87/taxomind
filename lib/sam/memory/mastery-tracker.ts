/**
 * Mastery Tracker
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Tracks and updates student mastery levels based on evaluations
 */

import type {
  TopicMastery,
  MasteryUpdate,
  MasteryLevel,
  EvaluationOutcome,
  StudentProfileStore,
} from './types';
import type { BloomsLevel } from '../pedagogical';

// ============================================================================
// MASTERY TRACKER CONFIGURATION
// ============================================================================

/**
 * Configuration for mastery tracking
 */
export interface MasteryTrackerConfig {
  /**
   * Weight given to recent assessments vs historical (0-1)
   * Higher value = more weight on recent
   */
  recencyWeight?: number;

  /**
   * Minimum assessments before mastery is considered stable
   */
  minAssessmentsForStability?: number;

  /**
   * Score thresholds for each mastery level
   */
  levelThresholds?: {
    beginner: number;
    intermediate: number;
    proficient: number;
    expert: number;
  };

  /**
   * Bloom's level weights for mastery calculation
   */
  bloomsWeights?: Record<BloomsLevel, number>;

  /**
   * Decay rate for unused topics (per day)
   */
  decayRatePerDay?: number;

  /**
   * Days before decay starts
   */
  decayStartDays?: number;
}

/**
 * Default mastery tracker configuration
 */
export const DEFAULT_MASTERY_TRACKER_CONFIG: Required<MasteryTrackerConfig> = {
  recencyWeight: 0.7,
  minAssessmentsForStability: 3,
  levelThresholds: {
    beginner: 50,
    intermediate: 70,
    proficient: 80,
    expert: 90,
  },
  bloomsWeights: {
    REMEMBER: 0.5,
    UNDERSTAND: 0.7,
    APPLY: 0.85,
    ANALYZE: 0.95,
    EVALUATE: 1.0,
    CREATE: 1.1,
  },
  decayRatePerDay: 0.5, // 0.5% per day
  decayStartDays: 30,
};

// ============================================================================
// MASTERY TRACKER IMPLEMENTATION
// ============================================================================

/**
 * Result of mastery update
 */
export interface MasteryUpdateResult {
  /**
   * Previous mastery record (if existed)
   */
  previousMastery?: TopicMastery;

  /**
   * Updated mastery record
   */
  currentMastery: TopicMastery;

  /**
   * Whether mastery level changed
   */
  levelChanged: boolean;

  /**
   * Direction of change
   */
  changeDirection?: 'improved' | 'declined' | 'unchanged';

  /**
   * Score difference
   */
  scoreDifference: number;

  /**
   * Whether mastery is now stable
   */
  isStable: boolean;

  /**
   * Recommendations based on mastery
   */
  recommendations: MasteryRecommendation[];
}

/**
 * Mastery-based recommendation
 */
export interface MasteryRecommendation {
  /**
   * Recommendation type
   */
  type:
    | 'practice_more'
    | 'advance_level'
    | 'review_basics'
    | 'challenge_increase'
    | 'maintain';

  /**
   * Recommendation message
   */
  message: string;

  /**
   * Priority (1-5, 1 = highest)
   */
  priority: number;

  /**
   * Suggested action
   */
  action?: string;
}

/**
 * Mastery Tracker
 * Tracks and updates student mastery levels
 */
export class MasteryTracker {
  private readonly config: Required<MasteryTrackerConfig>;
  private readonly profileStore: StudentProfileStore;

  constructor(
    profileStore: StudentProfileStore,
    config: MasteryTrackerConfig = {}
  ) {
    this.config = { ...DEFAULT_MASTERY_TRACKER_CONFIG, ...config };
    this.profileStore = profileStore;
  }

  /**
   * Process an evaluation outcome and update mastery
   */
  async processEvaluation(
    outcome: EvaluationOutcome
  ): Promise<MasteryUpdateResult> {
    // Get previous mastery
    const previousMastery = await this.profileStore.getMastery(
      outcome.studentId,
      outcome.topicId
    );

    // Calculate score with Bloom's weight
    const bloomsWeight = this.config.bloomsWeights[outcome.bloomsLevel];
    const weightedScore = Math.min(100, outcome.score * bloomsWeight);

    // Create mastery update
    const update: MasteryUpdate = {
      topicId: outcome.topicId,
      bloomsLevel: outcome.bloomsLevel,
      score: weightedScore,
      maxScore: outcome.maxScore,
      timestamp: outcome.evaluatedAt,
      context: {
        courseId: outcome.courseId,
        chapterId: outcome.chapterId,
        sectionId: outcome.sectionId,
        assessmentType: outcome.assessmentType,
      },
    };

    // Update mastery in store
    const currentMastery = await this.profileStore.updateMastery(
      outcome.studentId,
      update
    );

    // Calculate results
    const levelChanged = previousMastery
      ? previousMastery.level !== currentMastery.level
      : true;

    const scoreDifference = previousMastery
      ? currentMastery.score - previousMastery.score
      : currentMastery.score;

    const changeDirection = this.determineChangeDirection(
      previousMastery?.level,
      currentMastery.level
    );

    const isStable =
      currentMastery.assessmentCount >= this.config.minAssessmentsForStability;

    const recommendations = this.generateRecommendations(
      currentMastery,
      outcome,
      changeDirection
    );

    return {
      previousMastery: previousMastery ?? undefined,
      currentMastery,
      levelChanged,
      changeDirection,
      scoreDifference,
      isStable,
      recommendations,
    };
  }

  /**
   * Get mastery for a topic
   */
  async getMastery(
    studentId: string,
    topicId: string
  ): Promise<TopicMastery | null> {
    return this.profileStore.getMastery(studentId, topicId);
  }

  /**
   * Calculate mastery level from score
   */
  calculateMasteryLevel(score: number): MasteryLevel {
    const thresholds = this.config.levelThresholds;

    if (score >= thresholds.expert) return 'expert';
    if (score >= thresholds.proficient) return 'proficient';
    if (score >= thresholds.intermediate) return 'intermediate';
    if (score >= thresholds.beginner) return 'beginner';
    return 'novice';
  }

  /**
   * Apply decay to unused topics
   */
  async applyDecay(
    studentId: string,
    topicId: string,
    currentDate: Date = new Date()
  ): Promise<TopicMastery | null> {
    const mastery = await this.profileStore.getMastery(studentId, topicId);

    if (!mastery) {
      return null;
    }

    const daysSinceLastAssessment = Math.floor(
      (currentDate.getTime() - mastery.lastAssessedAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastAssessment <= this.config.decayStartDays) {
      return mastery;
    }

    const decayDays = daysSinceLastAssessment - this.config.decayStartDays;
    const decayAmount = decayDays * this.config.decayRatePerDay;
    const decayedScore = Math.max(0, mastery.score - decayAmount);

    // Only update if score actually changed
    if (decayedScore < mastery.score) {
      const update: MasteryUpdate = {
        topicId,
        bloomsLevel: mastery.bloomsLevel,
        score: decayedScore,
        maxScore: 100,
        timestamp: currentDate,
      };

      return this.profileStore.updateMastery(studentId, update);
    }

    return mastery;
  }

  /**
   * Get topics needing review (mastery below threshold)
   */
  async getTopicsNeedingReview(
    studentId: string,
    threshold: number = 70
  ): Promise<TopicMastery[]> {
    const profile = await this.profileStore.get(studentId);

    if (!profile) {
      return [];
    }

    return Object.values(profile.masteryByTopic).filter(
      (m) => m.score < threshold
    );
  }

  /**
   * Get mastery summary for a student
   */
  async getMasterySummary(studentId: string): Promise<MasterySummary> {
    const profile = await this.profileStore.get(studentId);

    if (!profile) {
      return {
        totalTopics: 0,
        averageMastery: 0,
        levelDistribution: {
          novice: 0,
          beginner: 0,
          intermediate: 0,
          proficient: 0,
          expert: 0,
        },
        bloomsDistribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        recentTrend: 'stable',
        topicsNeedingAttention: [],
        strengths: [],
      };
    }

    const masteryRecords = Object.values(profile.masteryByTopic);
    const totalTopics = masteryRecords.length;

    if (totalTopics === 0) {
      return {
        totalTopics: 0,
        averageMastery: 0,
        levelDistribution: {
          novice: 0,
          beginner: 0,
          intermediate: 0,
          proficient: 0,
          expert: 0,
        },
        bloomsDistribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        recentTrend: 'stable',
        topicsNeedingAttention: [],
        strengths: [],
      };
    }

    // Calculate averages
    const averageMastery =
      masteryRecords.reduce((sum, m) => sum + m.score, 0) / totalTopics;

    // Calculate level distribution
    const levelDistribution: Record<MasteryLevel, number> = {
      novice: 0,
      beginner: 0,
      intermediate: 0,
      proficient: 0,
      expert: 0,
    };

    for (const m of masteryRecords) {
      levelDistribution[m.level]++;
    }

    // Calculate Bloom's distribution
    const bloomsDistribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    for (const m of masteryRecords) {
      bloomsDistribution[m.bloomsLevel]++;
    }

    // Determine recent trend
    const recentRecords = masteryRecords
      .filter(
        (m) =>
          m.lastAssessedAt.getTime() >
          Date.now() - 7 * 24 * 60 * 60 * 1000
      )
      .sort((a, b) => b.lastAssessedAt.getTime() - a.lastAssessedAt.getTime());

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentRecords.length >= 2) {
      const improvingCount = recentRecords.filter(
        (m) => m.trend === 'improving'
      ).length;
      const decliningCount = recentRecords.filter(
        (m) => m.trend === 'declining'
      ).length;

      if (improvingCount > decliningCount) {
        recentTrend = 'improving';
      } else if (decliningCount > improvingCount) {
        recentTrend = 'declining';
      }
    }

    // Find topics needing attention (low mastery or declining)
    const topicsNeedingAttention = masteryRecords
      .filter(
        (m) =>
          m.level === 'novice' ||
          m.level === 'beginner' ||
          m.trend === 'declining'
      )
      .map((m) => m.topicId);

    // Find strengths (high mastery)
    const strengths = masteryRecords
      .filter((m) => m.level === 'expert' || m.level === 'proficient')
      .map((m) => m.topicId);

    return {
      totalTopics,
      averageMastery,
      levelDistribution,
      bloomsDistribution,
      recentTrend,
      topicsNeedingAttention,
      strengths,
    };
  }

  /**
   * Determine change direction between mastery levels
   */
  private determineChangeDirection(
    previous: MasteryLevel | undefined,
    current: MasteryLevel
  ): 'improved' | 'declined' | 'unchanged' {
    if (!previous) {
      return 'unchanged';
    }

    const levels: MasteryLevel[] = [
      'novice',
      'beginner',
      'intermediate',
      'proficient',
      'expert',
    ];
    const prevIndex = levels.indexOf(previous);
    const currIndex = levels.indexOf(current);

    if (currIndex > prevIndex) return 'improved';
    if (currIndex < prevIndex) return 'declined';
    return 'unchanged';
  }

  /**
   * Generate recommendations based on mastery
   */
  private generateRecommendations(
    mastery: TopicMastery,
    outcome: EvaluationOutcome,
    changeDirection: 'improved' | 'declined' | 'unchanged'
  ): MasteryRecommendation[] {
    const recommendations: MasteryRecommendation[] = [];

    // Low mastery recommendations
    if (mastery.level === 'novice' || mastery.level === 'beginner') {
      recommendations.push({
        type: 'review_basics',
        message: `Consider reviewing foundational concepts for "${outcome.topicId}"`,
        priority: 1,
        action: 'Review introductory materials and practice basic exercises',
      });
    }

    // Declining trend
    if (mastery.trend === 'declining' || changeDirection === 'declined') {
      recommendations.push({
        type: 'practice_more',
        message: `Performance in "${outcome.topicId}" is declining. More practice recommended.`,
        priority: 2,
        action: 'Schedule additional practice sessions',
      });
    }

    // High mastery - ready for challenge
    if (
      (mastery.level === 'proficient' || mastery.level === 'expert') &&
      mastery.confidence > 0.7
    ) {
      recommendations.push({
        type: 'challenge_increase',
        message: `Ready for more challenging content in "${outcome.topicId}"`,
        priority: 3,
        action: 'Explore advanced topics or higher Bloom\'s levels',
      });
    }

    // Stable high performance - maintain
    if (
      mastery.level === 'expert' &&
      mastery.trend === 'stable' &&
      changeDirection === 'unchanged'
    ) {
      recommendations.push({
        type: 'maintain',
        message: `Excellent mastery of "${outcome.topicId}". Periodic review recommended.`,
        priority: 4,
        action: 'Schedule periodic reviews to maintain mastery',
      });
    }

    // Improved - ready to advance
    if (changeDirection === 'improved' && outcome.score >= 80) {
      recommendations.push({
        type: 'advance_level',
        message: `Great improvement in "${outcome.topicId}"! Ready for the next level.`,
        priority: 2,
        action: 'Move to more advanced content',
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}

/**
 * Mastery summary for a student
 */
export interface MasterySummary {
  /**
   * Total number of topics tracked
   */
  totalTopics: number;

  /**
   * Average mastery score across all topics
   */
  averageMastery: number;

  /**
   * Distribution of mastery levels
   */
  levelDistribution: Record<MasteryLevel, number>;

  /**
   * Distribution of highest Bloom's levels achieved
   */
  bloomsDistribution: Record<BloomsLevel, number>;

  /**
   * Recent overall trend
   */
  recentTrend: 'improving' | 'stable' | 'declining';

  /**
   * Topics needing attention
   */
  topicsNeedingAttention: string[];

  /**
   * Strong topics
   */
  strengths: string[];
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a mastery tracker
 */
export function createMasteryTracker(
  profileStore: StudentProfileStore,
  config?: MasteryTrackerConfig
): MasteryTracker {
  return new MasteryTracker(profileStore, config);
}
