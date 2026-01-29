/**
 * Mastery Tracker
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Tracks and updates student mastery levels based on evaluations
 */
import type { TopicMastery, MasteryLevel, EvaluationOutcome, StudentProfileStore, BloomsLevel } from './types';
import type { BloomsSubLevel } from '@sam-ai/pedagogy';
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
     * @deprecated Use bloomsDecayRates for Bloom's-weighted decay
     */
    decayRatePerDay?: number;
    /**
     * Days before decay starts
     */
    decayStartDays?: number;
    /**
     * Bloom's level-specific decay rates (Phase 6: Enhanced Mastery Decay)
     * Higher cognitive levels decay faster as they require more practice to maintain
     */
    bloomsDecayRates?: Record<BloomsLevel, number>;
    /**
     * Sub-level decay modifier (Phase 6: Enhanced Mastery Decay)
     * ADVANCED skills decay faster than BASIC skills
     * Format: { BASIC: multiplier, INTERMEDIATE: multiplier, ADVANCED: multiplier }
     */
    subLevelDecayModifiers?: Record<BloomsSubLevel, number>;
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
     * Phase 6: Enhanced with Bloom's-weighted decay rates
     *
     * @param studentId - Student identifier
     * @param topicId - Topic identifier
     * @param currentDate - Current date for decay calculation
     * @param subLevel - Optional sub-level for more granular decay (BASIC/INTERMEDIATE/ADVANCED)
     */
    applyDecay(studentId: string, topicId: string, currentDate?: Date, subLevel?: BloomsSubLevel): Promise<TopicMastery | null>;
    /**
     * Get the Bloom's-level specific decay rate (Phase 6)
     * Higher cognitive levels decay faster as they require more practice to maintain
     *
     * @param bloomsLevel - The Bloom's taxonomy level
     * @returns Decay rate per day as a percentage
     */
    getBloomsDecayRate(bloomsLevel: BloomsLevel): number;
    /**
     * Calculate effective decay rate including sub-level modifier (Phase 6)
     *
     * @param bloomsLevel - The Bloom's taxonomy level
     * @param subLevel - Optional sub-level (BASIC/INTERMEDIATE/ADVANCED)
     * @returns Effective decay rate per day as a percentage
     */
    getEffectiveDecayRate(bloomsLevel: BloomsLevel, subLevel?: BloomsSubLevel): number;
    /**
     * Estimate days until mastery decays to a target score (Phase 6)
     *
     * @param currentScore - Current mastery score
     * @param targetScore - Target score to decay to
     * @param bloomsLevel - The Bloom's taxonomy level
     * @param subLevel - Optional sub-level for more precise estimation
     * @returns Estimated days until decay reaches target (after grace period)
     */
    estimateDaysUntilDecay(currentScore: number, targetScore: number, bloomsLevel: BloomsLevel, subLevel?: BloomsSubLevel): number;
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