/**
 * @sam-ai/agentic - Plan Builder Engine
 * Builds executable learning plans from goal decompositions
 */
import type { SAMLogger } from '@sam-ai/core';
import { type LearningGoal, type GoalDecomposition, type ExecutionPlan, type PlanStep, type PlanSchedule, type TimeSlot } from './types';
export interface PlanBuilderConfig {
    logger?: SAMLogger;
    defaultOptions?: Partial<PlanBuilderOptions>;
}
export interface PlanBuilderOptions {
    dailyMinutes: number;
    preferredTimes?: TimeSlot[];
    excludeDays?: number[];
    generateSchedule: boolean;
    includeCheckpoints: boolean;
    includeFallbacks: boolean;
    maxDaysAhead?: number;
}
export declare class PlanBuilder {
    private readonly logger;
    private readonly defaultOptions;
    constructor(config?: PlanBuilderConfig);
    /**
     * Build an execution plan from a goal decomposition
     */
    createPlan(goal: LearningGoal, decomposition: GoalDecomposition, options?: Partial<PlanBuilderOptions>): Promise<ExecutionPlan>;
    /**
     * Optimize an existing plan based on constraints
     */
    optimizePlan(plan: ExecutionPlan, constraints: PlanConstraints): ExecutionPlan;
    /**
     * Adapt a plan based on feedback and progress
     */
    adaptPlan(plan: ExecutionPlan, adaptation: PlanAdaptationRequest): ExecutionPlan;
    /**
     * Calculate plan progress
     */
    calculateProgress(plan: ExecutionPlan): PlanProgress;
    private topologicalSort;
    private createSteps;
    private mapSubGoalTypeToStepType;
    private createStepInputs;
    private createExecutionContext;
    private generateSchedule;
    private generateCheckpoints;
    private generateFallbackStrategies;
    private applyTimeConstraint;
    private applyDeadlineConstraint;
    private applyDailyLimit;
    private increaseDifficulty;
    private decreaseDifficulty;
    private addSupportSteps;
    private skipSteps;
    private addDays;
    private generatePlanId;
    private generateStepId;
    private generateCheckpointId;
}
export interface PlanConstraints {
    maxTotalMinutes?: number;
    maxDailyMinutes?: number;
    deadline?: Date;
    excludeDays?: number[];
}
export interface PlanAdaptationRequest {
    type: 'difficulty_increase' | 'difficulty_decrease' | 'add_support' | 'skip_ahead' | 'reschedule';
    targetStepIds?: string[];
    newSchedule?: PlanSchedule;
    reason?: string;
}
export interface PlanProgress {
    overallPercentage: number;
    stepStats: {
        total: number;
        completed: number;
        failed: number;
        skipped: number;
        inProgress: number;
        pending: number;
    };
    timeStats: {
        totalEstimated: number;
        completed: number;
        remaining: number;
    };
    checkpointStats: {
        total: number;
        achieved: number;
    };
    currentStep?: PlanStep;
    nextStep?: PlanStep;
}
export declare function createPlanBuilder(config?: PlanBuilderConfig): PlanBuilder;
//# sourceMappingURL=plan-builder.d.ts.map