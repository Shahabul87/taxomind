/**
 * @sam-ai/agentic - SkillTracker
 * Tracks user skill progression and mastery levels
 */
import type { UserSkillProfile, UserSkill, ConceptPerformance, SkillUpdateResult, SkillStore, SpacedRepetitionSchedule, ReviewQuality } from './types';
import type { MemoryLogger } from '../memory/types';
export interface SkillTrackerConfig {
    store: SkillStore;
    logger?: MemoryLogger;
    masteryThreshold?: number;
    struggleThreshold?: number;
    decayRatePerDay?: number;
    maxMasteryGain?: number;
    minMasteryLoss?: number;
}
export declare class SkillTracker {
    private store;
    private logger?;
    private masteryThreshold;
    private struggleThreshold;
    private decayRatePerDay;
    private maxMasteryGain;
    private minMasteryLoss;
    constructor(config: SkillTrackerConfig);
    /**
     * Get user's complete skill profile
     */
    getSkillProfile(userId: string): Promise<UserSkillProfile>;
    /**
     * Record performance and update skill mastery
     */
    recordPerformance(performance: ConceptPerformance): Promise<SkillUpdateResult>;
    /**
     * Get concepts that are due for spaced repetition review
     */
    getConceptsDueForReview(userId: string, limit?: number): Promise<UserSkill[]>;
    /**
     * Get concepts the user is struggling with
     */
    getStrugglingConcepts(userId: string, limit?: number): Promise<UserSkill[]>;
    /**
     * Calculate spaced repetition schedule using SM-2 algorithm
     */
    calculateSpacedRepetition(schedule: SpacedRepetitionSchedule, quality: ReviewQuality): SpacedRepetitionSchedule;
    /**
     * Check if user has mastered prerequisites for a concept
     */
    checkPrerequisitesMet(userId: string, _conceptId: string, prerequisites: string[]): Promise<{
        met: boolean;
        missing: string[];
    }>;
    /**
     * Get mastery level for a specific concept
     */
    getMasteryLevel(userId: string, conceptId: string): Promise<number>;
    private createNewSkill;
    private updateExistingSkill;
    private calculateInitialMastery;
    private calculateMasteryDelta;
    private updateConfidence;
    private determineStrengthTrend;
    private applySkillDecay;
    private calculateNextReview;
    private calculateRetention;
    private calculateStreak;
    private getNewlyUnlockedConcepts;
    private getRecommendedNextConcepts;
}
export declare function createSkillTracker(config: SkillTrackerConfig): SkillTracker;
//# sourceMappingURL=skill-tracker.d.ts.map