/**
 * @sam-ai/agentic - Agent State Machine
 * Resumable state machine for plan execution with persistence
 */
import type { SAMLogger } from '@sam-ai/core';
import { type ExecutionPlan, type PlanStep, type PlanState, type ExecutionContext, type StepResult, type PlanStore } from './types';
export interface AgentStateMachineConfig {
    planStore: PlanStore;
    logger?: SAMLogger;
    autoSaveInterval?: number;
    maxStepRetries?: number;
}
export type StateMachineEvent = {
    type: 'START';
    plan: ExecutionPlan;
} | {
    type: 'PAUSE';
    reason?: string;
} | {
    type: 'RESUME';
} | {
    type: 'ABORT';
    reason: string;
} | {
    type: 'STEP_COMPLETE';
    stepId: string;
    result: StepResult;
} | {
    type: 'STEP_FAILED';
    stepId: string;
    error: Error;
} | {
    type: 'STEP_SKIP';
    stepId: string;
    reason: string;
} | {
    type: 'UPDATE_CONTEXT';
    context: Partial<ExecutionContext>;
} | {
    type: 'CHECKPOINT';
    data: Record<string, unknown>;
};
export type StateMachineState = 'idle' | 'running' | 'paused' | 'waiting_for_input' | 'completed' | 'failed' | 'aborted';
export interface StateMachineListener {
    onStateChange?: (from: StateMachineState, to: StateMachineState) => void;
    onStepStart?: (step: PlanStep) => void;
    onStepComplete?: (step: PlanStep, result: StepResult) => void;
    onStepFailed?: (step: PlanStep, error: Error) => void;
    onPlanComplete?: (plan: ExecutionPlan) => void;
    onPlanFailed?: (plan: ExecutionPlan, error: Error) => void;
    onCheckpoint?: (state: PlanState) => void;
}
export declare class AgentStateMachine {
    private readonly planStore;
    private readonly logger;
    private readonly autoSaveInterval;
    private readonly maxStepRetries;
    private currentState;
    private currentPlan;
    private planState;
    private listeners;
    private autoSaveTimer;
    private stepExecutor;
    constructor(config: AgentStateMachineConfig);
    /**
     * Get current state
     */
    getState(): StateMachineState;
    /**
     * Get current plan state (for resumability)
     */
    getPlanState(): PlanState | null;
    /**
     * Get current plan
     */
    getCurrentPlan(): ExecutionPlan | null;
    /**
     * Set the step executor function
     */
    setStepExecutor(executor: StepExecutorFunction): void;
    /**
     * Add a listener
     */
    addListener(listener: StateMachineListener): void;
    /**
     * Remove a listener
     */
    removeListener(listener: StateMachineListener): void;
    /**
     * Start executing a plan
     */
    start(plan: ExecutionPlan): Promise<void>;
    /**
     * Pause execution
     */
    pause(reason?: string): Promise<PlanState>;
    /**
     * Resume execution from saved state
     */
    resume(savedState?: PlanState): Promise<void>;
    /**
     * Abort execution
     */
    abort(reason: string): Promise<void>;
    /**
     * Load saved state
     */
    loadState(planId: string): Promise<PlanState | null>;
    /**
     * Save current state
     */
    saveState(): Promise<void>;
    /**
     * Complete a step manually (for external step execution)
     */
    completeStep(stepId: string, result: StepResult): Promise<void>;
    /**
     * Fail a step manually
     */
    failStep(stepId: string, error: Error): Promise<void>;
    /**
     * Skip a step
     */
    skipStep(stepId: string, reason: string): Promise<void>;
    /**
     * Update execution context
     */
    updateContext(context: Partial<ExecutionContext>): Promise<void>;
    private handleEvent;
    private executeNextStep;
    private handleStepComplete;
    private handleStepFailed;
    private handleStepSkip;
    private handlePlanComplete;
    private handlePlanFailed;
    private checkCheckpoints;
    private selectFallbackStrategy;
    private applyFallbackAction;
    private isCriticalFailure;
    private updateExecutionContext;
    private initializePlanState;
    private transitionTo;
    private startAutoSave;
    private stopAutoSave;
    private cleanup;
    private notifyStepStart;
    private notifyStepComplete;
    private notifyStepFailed;
    private notifyPlanComplete;
    private notifyPlanFailed;
    private notifyCheckpoint;
}
export type StepExecutorFunction = (step: PlanStep, context: ExecutionContext) => Promise<StepResult>;
export declare function createAgentStateMachine(config: AgentStateMachineConfig): AgentStateMachine;
//# sourceMappingURL=agent-state-machine.d.ts.map