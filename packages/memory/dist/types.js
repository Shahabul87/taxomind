/**
 * Memory Integration Types
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Types for evaluation outcomes to update student profiles
 */
/**
 * Default spaced repetition configuration
 */
export const DEFAULT_SPACED_REPETITION_CONFIG = {
    initialIntervalDays: 1,
    minEasinessFactor: 1.3,
    maxIntervalDays: 365,
    goodScoreThreshold: 70,
    easyScoreThreshold: 90,
    urgentThresholdDays: 7,
};
/**
 * Default memory integration configuration
 */
export const DEFAULT_MEMORY_INTEGRATION_CONFIG = {
    updateMasteryOnEvaluation: true,
    adjustPathwayOnEvaluation: true,
    updateSpacedRepetition: true,
    storeInMemory: true,
    spacedRepetitionConfig: DEFAULT_SPACED_REPETITION_CONFIG,
    masteryImprovementThreshold: 70,
    remediationThreshold: 50,
    skipAheadThreshold: 90,
};
//# sourceMappingURL=types.js.map