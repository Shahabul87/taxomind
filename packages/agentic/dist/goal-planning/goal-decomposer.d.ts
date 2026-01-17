/**
 * @sam-ai/agentic - Goal Decomposer Engine
 * Decomposes learning goals into actionable sub-goals with dependencies
 */
import type { AIAdapter, SAMLogger } from '@sam-ai/core';
import { type LearningGoal, type SubGoal, type GoalDecomposition, type DecompositionOptions, type EffortEstimate } from './types';
export interface GoalDecomposerConfig {
    aiAdapter: AIAdapter;
    logger?: SAMLogger;
    defaultOptions?: Partial<DecompositionOptions>;
}
export declare class GoalDecomposer {
    private readonly ai;
    private readonly logger;
    private readonly defaultOptions;
    constructor(config: GoalDecomposerConfig);
    /**
     * Decompose a learning goal into sub-goals
     */
    decompose(goal: LearningGoal, options?: Partial<DecompositionOptions>): Promise<GoalDecomposition>;
    /**
     * Validate a decomposition for logical consistency
     */
    validateDecomposition(decomposition: GoalDecomposition): ValidationResult;
    /**
     * Estimate effort for a goal
     */
    estimateEffort(goal: LearningGoal, decomposition?: GoalDecomposition): Promise<EffortEstimate>;
    /**
     * Refine a decomposition based on feedback
     */
    refineDecomposition(decomposition: GoalDecomposition, feedback: DecompositionFeedback): Promise<GoalDecomposition>;
    private mergeOptions;
    private generateDecomposition;
    private buildDecompositionPrompt;
    private convertToSubGoals;
    private buildDependencyGraph;
    private rebuildDependencies;
    private calculateConfidence;
    private calculateEffortFactors;
    private findCircularDependencies;
    private findOrphanedSubGoals;
    private validateTimeDistribution;
    private validateTypeDistribution;
    private generateSubGoalId;
}
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}
export interface ValidationIssue {
    type: 'error' | 'warning' | 'info';
    code: string;
    message: string;
}
export interface DecompositionFeedback {
    adjustments?: SubGoalAdjustment[];
    addSubGoals?: Omit<SubGoal, 'id' | 'goalId' | 'status' | 'order'>[];
    removeSubGoalIds?: string[];
}
export interface SubGoalAdjustment {
    subGoalId: string;
    changes: Partial<SubGoal>;
}
export declare function createGoalDecomposer(config: GoalDecomposerConfig): GoalDecomposer;
//# sourceMappingURL=goal-decomposer.d.ts.map