/**
 * Mastery Tracker
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Tracks and updates student mastery levels based on evaluations
 */
import type { TopicMastery, MasteryLevel, EvaluationOutcome, StudentProfileStore, BloomsLevel } from './types';
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
export declare const DEFAULT_MASTERY_TRACKER_CONFIG: Required<MasteryTrackerConfig>;
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
    type: 'practice_more' | 'advance_level' | 'review_basics' | 'challenge_increase' | 'maintain';
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
export declare class MasteryTracker {
    private readonly config;
    private readonly profileStore;
    constructor(profileStore: StudentProfileStore, config?: MasteryTrackerConfig);
    /**
     * Process an evaluation outcome and update mastery
     */
    processEvaluation(outcome: EvaluationOutcome): Promise<MasteryUpdateResult>;
    /**
     * Get mastery for a topic
     */
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    /**
     * Calculate mastery level from score
     */
    calculateMasteryLevel(score: number): MasteryLevel;
    /**
     * Apply decay to unused topics
     */
    applyDecay(studentId: string, topicId: string, currentDate?: Date): Promise<TopicMastery | null>;
    /**
     * Get topics needing review (mastery below threshold)
     */
    getTopicsNeedingReview(studentId: string, threshold?: number): Promise<TopicMastery[]>;
    /**
     * Get mastery summary for a student
     */
    getMasterySummary(studentId: string): Promise<MasterySummary>;
    /**
     * Determine change direction between mastery levels
     */
    private determineChangeDirection;
    /**
     * Generate recommendations based on mastery
     */
    private generateRecommendations;
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
/**
 * Create a mastery tracker
 */
export declare function createMasteryTracker(profileStore: StudentProfileStore, config?: MasteryTrackerConfig): MasteryTracker;
//# sourceMappingURL=mastery-tracker.d.ts.map