/**
 * @sam-ai/agentic - Tool Executor
 * Secure tool execution with sandboxing, permission checks, and rate limiting
 */
import type { ToolDefinition, ToolInvocation, ToolExecutionResult, ToolExecutionStatus, ToolStore, InvocationStore, RateLimit } from './types';
import { PermissionManager } from './permission-manager';
import { AuditLogger } from './audit-logger';
import { ConfirmationManager } from './confirmation-manager';
/**
 * Configuration for ToolExecutor
 */
export interface ToolExecutorConfig {
    toolStore: ToolStore;
    invocationStore: InvocationStore;
    permissionManager: PermissionManager;
    auditLogger: AuditLogger;
    confirmationManager: ConfirmationManager;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Enable sandboxed execution (limits side effects)
     */
    enableSandbox?: boolean;
    /**
     * Default execution timeout (ms)
     */
    defaultTimeoutMs?: number;
    /**
     * Maximum concurrent executions per user
     */
    maxConcurrentPerUser?: number;
    /**
     * Callback before tool execution
     */
    onBeforeExecute?: (invocation: ToolInvocation, tool: ToolDefinition) => Promise<boolean>;
    /**
     * Callback after tool execution
     */
    onAfterExecute?: (invocation: ToolInvocation, result: ToolExecutionResult) => Promise<void>;
}
/**
 * Options for executing a tool
 */
export interface ExecuteOptions {
    sessionId: string;
    skipConfirmation?: boolean;
    skipPermissionCheck?: boolean;
    metadata?: Record<string, unknown>;
    timeout?: number;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Execution result with invocation details
 */
export interface ExecutionOutcome {
    invocation: ToolInvocation;
    result: ToolExecutionResult | null;
    status: ToolExecutionStatus;
    awaitingConfirmation: boolean;
    confirmationId?: string;
}
/**
 * ToolExecutor provides secure tool execution with sandboxing,
 * permission checks, confirmation handling, and rate limiting.
 */
export declare class ToolExecutor {
    private readonly toolStore;
    private readonly invocationStore;
    private readonly permissionManager;
    private readonly auditLogger;
    private readonly confirmationManager;
    private readonly logger;
    private readonly enableSandbox;
    private readonly defaultTimeoutMs;
    private readonly maxConcurrentPerUser;
    private readonly onBeforeExecute?;
    private readonly onAfterExecute?;
    private readonly rateLimitState;
    private readonly concurrentExecutions;
    private readonly activeExecutions;
    constructor(config: ToolExecutorConfig);
    /**
     * Execute a tool with full permission, confirmation, and audit flow
     */
    execute(toolId: string, userId: string, input: unknown, options: ExecuteOptions): Promise<ExecutionOutcome>;
    /**
     * Continue execution after confirmation
     */
    continueAfterConfirmation(invocationId: string, confirmed: boolean): Promise<ExecutionOutcome>;
    /**
     * Cancel an execution
     */
    cancel(invocationId: string): Promise<boolean>;
    /**
     * Internal execution with sandboxing and timeout
     */
    private executeInternal;
    /**
     * Execute a tool handler with timeout
     */
    private executeWithTimeout;
    /**
     * Wrap a handler in a sandbox (basic implementation)
     */
    private wrapInSandbox;
    /**
     * Build execution context for a tool
     */
    private buildExecutionContext;
    /**
     * Create audit context from options
     */
    private createAuditContext;
    /**
     * Update invocation status
     */
    private updateInvocationStatus;
    /**
     * Summarize output for previous calls context
     */
    private summarizeOutput;
    /**
     * Check if rate limit allows execution
     */
    private checkRateLimit;
    /**
     * Record a rate limit hit
     */
    private recordRateLimitHit;
    /**
     * Get rate limit key
     */
    private getRateLimitKey;
    /**
     * Check concurrent execution limit
     */
    private checkConcurrentLimit;
    /**
     * Add concurrent execution
     */
    private addConcurrentExecution;
    /**
     * Remove concurrent execution
     */
    private removeConcurrentExecution;
    /**
     * Get current execution count for a user
     */
    getConcurrentExecutionCount(userId: string): number;
    /**
     * Get rate limit status for a tool/user
     */
    getRateLimitStatus(toolId: string, userId: string, rateLimit: RateLimit): {
        remaining: number;
        resetsIn: number;
    };
    /**
     * Clear all rate limit state (for testing)
     */
    clearRateLimitState(): void;
}
/**
 * Create a new ToolExecutor instance
 */
export declare function createToolExecutor(config: ToolExecutorConfig): ToolExecutor;
//# sourceMappingURL=tool-executor.d.ts.map