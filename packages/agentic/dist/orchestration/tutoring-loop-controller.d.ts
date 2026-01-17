/**
 * @sam-ai/agentic - Tutoring Loop Controller
 * Main orchestrator for plan-driven tutoring sessions
 * Prepares context before LLM calls and evaluates progress after responses
 */
import type { TutoringContext, StepEvaluation, StepTransition, ToolPlan, TutoringLoopResult, OrchestrationConfirmationRequestStore, TutoringSessionStore, OrchestrationLogger } from './types';
import type { GoalStore, PlanStore } from '../goal-planning/types';
import type { ToolStore } from '../tool-registry/types';
import type { SessionContext } from '../memory/types';
/**
 * AI Adapter interface for LLM-based criterion evaluation
 */
export interface CriterionEvaluationAdapter {
    evaluateCriterion(params: {
        criterion: string;
        userMessage: string;
        assistantResponse: string;
        stepContext: {
            stepTitle: string;
            stepType: string;
            objectives: string[];
        };
        memoryContext?: {
            masteredConcepts: string[];
            strugglingConcepts: string[];
        };
    }): Promise<{
        met: boolean;
        confidence: number;
        evidence: string | null;
        reasoning: string;
    }>;
}
export interface TutoringLoopControllerConfig {
    /** Goal store for retrieving active goals */
    goalStore: GoalStore;
    /** Plan store for retrieving and updating plans */
    planStore: PlanStore;
    /** Tool store for retrieving allowed tools */
    toolStore: ToolStore;
    /** Confirmation request store */
    confirmationStore: OrchestrationConfirmationRequestStore;
    /** Session store */
    sessionStore: TutoringSessionStore;
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** AI adapter for criterion evaluation (optional - uses heuristics if not provided) */
    criterionEvaluator?: CriterionEvaluationAdapter;
    /** Step completion confidence threshold (0-1) */
    stepCompletionThreshold?: number;
    /** Whether to auto-advance on step completion */
    autoAdvance?: boolean;
    /** Maximum retries for failed steps */
    maxStepRetries?: number;
    /** Session timeout in minutes */
    sessionTimeoutMinutes?: number;
}
export declare class TutoringLoopController {
    private readonly config;
    private readonly logger;
    constructor(config: TutoringLoopControllerConfig);
    /**
     * Prepare complete tutoring context for an LLM call
     */
    prepareContext(userId: string, sessionId: string, _message: string, options?: PrepareContextOptions): Promise<TutoringContext>;
    /**
     * Evaluate whether the current step can be advanced
     */
    evaluateProgress(context: TutoringContext, response: string, userMessage: string): Promise<StepEvaluation>;
    /**
     * Advance to the next step in the plan
     */
    advanceStep(planId: string, evaluation: StepEvaluation, options?: AdvanceStepOptions): Promise<StepTransition>;
    /**
     * Plan tool usage based on the current tutoring context
     */
    planToolUsage(context: TutoringContext, userMessage: string): Promise<ToolPlan>;
    /**
     * Process the complete tutoring loop
     */
    processLoop(userId: string, sessionId: string, userMessage: string, llmResponse: string, options?: ProcessLoopOptions): Promise<TutoringLoopResult>;
    private getActiveGoal;
    private getActivePlan;
    private getCurrentStep;
    private extractStepObjectives;
    private getAllowedTools;
    private buildMemoryContext;
    private getPendingInterventions;
    private getPreviousStepResults;
    private buildSessionMetadata;
    /**
     * Evaluate a single criterion for step completion
     * Uses a combination of heuristic matching and LLM evaluation
     */
    private evaluateCriterion;
    /**
     * Heuristic evaluation for common criterion types
     */
    private evaluateCriterionHeuristically;
    /**
     * Semantic similarity-based criterion evaluation
     */
    private evaluateCriterionSemantically;
    /**
     * Extract keywords from text for semantic matching
     */
    private extractKeywords;
    /**
     * Extract time requirement from criterion text (in minutes)
     */
    private extractTimeRequirement;
    /**
     * Extract number requirement from criterion text
     */
    private extractNumberRequirement;
    /**
     * Extract score requirement from criterion text (as percentage)
     */
    private extractScoreRequirement;
    private generateRecommendations;
    private getNextStepId;
    private determineTransitionType;
    private updatePlanState;
    private isPlanComplete;
    private generateCelebration;
    private generateTransitionMessage;
    /**
     * Analyze user message to determine which tools might be needed
     */
    private analyzeToolNeeds;
    /**
     * Match a tool to the user message to determine if it should be recommended
     */
    private matchToolToMessage;
    /**
     * Build suggested input for a tool based on context
     */
    private buildToolInput;
    /**
     * Extract the main topic from user message
     */
    private extractMainTopic;
    private generateToolPlanReasoning;
    private calculateToolPlanConfidence;
    private createEmptyEvaluation;
    private createDefaultLogger;
}
interface PrepareContextOptions {
    planId?: string;
    goalId?: string;
    sessionContext?: SessionContext;
}
interface AdvanceStepOptions {
    skip?: boolean;
    retry?: boolean;
    rollback?: boolean;
    targetStepId?: string;
}
interface ProcessLoopOptions {
    planId?: string;
    goalId?: string;
    sessionContext?: SessionContext;
}
export declare function createTutoringLoopController(config: TutoringLoopControllerConfig): TutoringLoopController;
export {};
//# sourceMappingURL=tutoring-loop-controller.d.ts.map