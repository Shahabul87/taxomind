/**
 * @sam-ai/agentic - Active Step Executor
 * Wires StepExecutor to runtime with tool binding and real-time execution
 */
import type { TutoringContext, ToolPlan, PlannedToolExecution, OrchestrationConfirmationRequest, ConfirmationResponse, OrchestrationConfirmationRequestStore, OrchestrationLogger } from './types';
import type { PlanStep, StepStatus, StepMetrics } from '../goal-planning/types';
import type { ToolExecutionResult, ToolStore } from '../tool-registry/types';
export interface ActiveStepExecutorConfig {
    /** Tool store for executing tools */
    toolStore: ToolStore;
    /** Confirmation store for managing confirmations */
    confirmationStore: OrchestrationConfirmationRequestStore;
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** Default timeout for tool execution (ms) */
    defaultTimeoutMs?: number;
    /** Maximum concurrent tool executions */
    maxConcurrentTools?: number;
    /** Whether to require confirmation for high-risk tools */
    requireConfirmation?: boolean;
    /** Confirmation expiry time (ms) */
    confirmationExpiryMs?: number;
}
export interface StepExecutionResult {
    stepId: string;
    status: StepStatus;
    output: StepExecutionOutput;
    metrics: StepMetrics;
    toolResults: ToolExecutionSummary[];
    errors: StepExecutionError[];
    startedAt: Date;
    completedAt: Date;
}
export interface StepExecutionOutput {
    message: string;
    data?: Record<string, unknown>;
    artifacts?: Artifact[];
}
export interface Artifact {
    id: string;
    type: 'content' | 'quiz' | 'exercise' | 'resource' | 'feedback';
    title: string;
    content: unknown;
    metadata?: Record<string, unknown>;
}
export interface ToolExecutionSummary {
    toolId: string;
    toolName: string;
    status: 'success' | 'failed' | 'skipped' | 'pending_confirmation';
    result?: ToolExecutionResult;
    error?: string;
    duration: number;
    confirmationId?: string;
}
export interface StepExecutionError {
    code: string;
    message: string;
    toolId?: string;
    recoverable: boolean;
    details?: Record<string, unknown>;
}
export declare class ActiveStepExecutor {
    private readonly config;
    private readonly logger;
    private readonly pendingConfirmations;
    constructor(config: ActiveStepExecutorConfig);
    /**
     * Execute a step with its associated tools
     */
    executeStep(step: PlanStep, context: TutoringContext, toolPlan: ToolPlan): Promise<StepExecutionResult>;
    /**
     * Execute a tool plan with confirmation handling
     */
    executeToolPlan(toolPlan: ToolPlan, context: TutoringContext): Promise<ToolPlanExecutionResult>;
    /**
     * Execute a single tool
     */
    executeTool(tool: PlannedToolExecution, context: TutoringContext): Promise<ToolExecutionSummary>;
    /**
     * Handle confirmation response for a pending tool execution
     */
    handleConfirmation(confirmationId: string, response: ConfirmationResponse, context: TutoringContext): Promise<ToolExecutionSummary | null>;
    /**
     * Get all pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]>;
    /**
     * Cancel a pending confirmation
     */
    cancelConfirmation(confirmationId: string): Promise<boolean>;
    private categorizeTools;
    private executeToolsBatch;
    private requestToolConfirmation;
    private validateToolInput;
    private executeWithTimeout;
    private assessRiskLevel;
    private extractArtifacts;
    private calculateAdditionalMetrics;
    private generateOutputMessage;
    private aggregateToolOutputs;
    private chunkArray;
    private createDefaultLogger;
}
interface ToolPlanExecutionResult {
    summaries: ToolExecutionSummary[];
    errors: StepExecutionError[];
    artifacts: Artifact[];
}
export declare function createActiveStepExecutor(config: ActiveStepExecutorConfig): ActiveStepExecutor;
export {};
//# sourceMappingURL=active-step-executor.d.ts.map