/**
 * Learning Pathway Calculator
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Calculates and adjusts learning pathways based on evaluation outcomes
 */
import type { LearningPathway, PathwayStep, PathwayAdjustment, EvaluationOutcome, StudentProfileStore, MasteryLevel, BloomsLevel } from './types';
/**
 * Configuration for pathway calculation
 */
export interface PathwayCalculatorConfig {
    /**
     * Score threshold to skip ahead
     */
    skipAheadThreshold?: number;
    /**
     * Score threshold to add remediation
     */
    remediationThreshold?: number;
    /**
     * Maximum steps to skip at once
     */
    maxSkipSteps?: number;
    /**
     * Maximum remediation steps to add
     */
    maxRemediationSteps?: number;
    /**
     * Minimum mastery level to skip a topic
     */
    skipMasteryLevel?: MasteryLevel;
    /**
     * Bloom's level progression order
     */
    bloomsProgression?: BloomsLevel[];
}
/**
 * Default pathway calculator configuration
 */
export declare const DEFAULT_PATHWAY_CALCULATOR_CONFIG: Required<PathwayCalculatorConfig>;
/**
 * Pathway adjustment result
 */
export interface PathwayAdjustmentResult {
    /**
     * The adjustment made
     */
    adjustment: PathwayAdjustment;
    /**
     * Updated pathway
     */
    updatedPathway: LearningPathway;
    /**
     * Steps added
     */
    stepsAdded: PathwayStep[];
    /**
     * Steps removed
     */
    stepsRemoved: PathwayStep[];
    /**
     * Steps skipped
     */
    stepsSkipped: PathwayStep[];
    /**
     * New estimated completion time (minutes)
     */
    newEstimatedTime: number;
    /**
     * Explanation for the adjustment
     */
    explanation: string;
}
/**
 * Remediation step template
 */
export interface RemediationTemplate {
    /**
     * Topic ID for remediation
     */
    topicId: string;
    /**
     * Target Bloom's level
     */
    targetBloomsLevel: BloomsLevel;
    /**
     * Estimated duration in minutes
     */
    estimatedDuration: number;
    /**
     * Description of remediation
     */
    description: string;
}
/**
 * Learning Pathway Calculator
 * Adjusts learning pathways based on evaluation outcomes
 */
export declare class PathwayCalculator {
    private readonly config;
    private readonly profileStore;
    constructor(profileStore: StudentProfileStore, config?: PathwayCalculatorConfig);
    /**
     * Calculate pathway adjustment based on evaluation outcome
     */
    calculateAdjustment(studentId: string, pathwayId: string, outcome: EvaluationOutcome): Promise<PathwayAdjustmentResult>;
    /**
     * Recalculate entire pathway based on current mastery
     */
    recalculatePathway(studentId: string, pathwayId: string): Promise<LearningPathway>;
    /**
     * Create a new pathway for a course
     */
    createPathway(studentId: string, courseId: string, topics: {
        topicId: string;
        targetBloomsLevel: BloomsLevel;
        estimatedDuration: number;
    }[]): Promise<LearningPathway>;
    /**
     * Determine adjustment type based on outcome
     */
    private determineAdjustmentType;
    /**
     * Calculate skip ahead adjustment
     */
    private calculateSkipAhead;
    /**
     * Calculate remediation adjustment
     */
    private calculateRemediation;
    /**
     * Calculate challenge adjustment
     */
    private calculateChallenge;
    /**
     * Apply adjustment to pathway
     */
    private applyAdjustment;
    /**
     * Check if step should be marked completed based on mastery
     */
    private shouldMarkCompleted;
    /**
     * Check if step should be skipped based on mastery
     */
    private shouldSkip;
    /**
     * Get mastery level index
     */
    private masteryLevelIndex;
    /**
     * Get Bloom's level index
     */
    private bloomsLevelIndex;
}
/**
 * Create a pathway calculator
 */
export declare function createPathwayCalculator(profileStore: StudentProfileStore, config?: PathwayCalculatorConfig): PathwayCalculator;
//# sourceMappingURL=pathway-calculator.d.ts.map