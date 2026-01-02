/**
 * @sam-ai/agentic - Tool Executor
 * Secure tool execution with sandboxing, permission checks, and rate limiting
 */

import type {
  ToolDefinition,
  ToolInvocation,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutionStatus,
  ToolError,
  ToolStore,
  InvocationStore,
  RateLimit,
} from './types';
import {
  ToolExecutionStatus as ExecutionStatusEnum,
  ConfirmationType as ConfirmationTypeEnum,
} from './types';
import { PermissionManager } from './permission-manager';
import { AuditLogger, AuditContext } from './audit-logger';
import { ConfirmationManager } from './confirmation-manager';

// ============================================================================
// TYPES
// ============================================================================

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
 * Rate limit tracking entry
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

/**
 * ToolExecutor provides secure tool execution with sandboxing,
 * permission checks, confirmation handling, and rate limiting.
 */
export class ToolExecutor {
  private readonly toolStore: ToolStore;
  private readonly invocationStore: InvocationStore;
  private readonly permissionManager: PermissionManager;
  private readonly auditLogger: AuditLogger;
  private readonly confirmationManager: ConfirmationManager;
  private readonly logger: NonNullable<ToolExecutorConfig['logger']>;
  private readonly enableSandbox: boolean;
  private readonly defaultTimeoutMs: number;
  private readonly maxConcurrentPerUser: number;
  private readonly onBeforeExecute?: ToolExecutorConfig['onBeforeExecute'];
  private readonly onAfterExecute?: ToolExecutorConfig['onAfterExecute'];

  // Rate limiting state
  private readonly rateLimitState: Map<string, RateLimitEntry>;

  // Concurrent execution tracking
  private readonly concurrentExecutions: Map<string, Set<string>>;

  // Active execution tracking for cancellation
  private readonly activeExecutions: Map<string, AbortController>;

  constructor(config: ToolExecutorConfig) {
    this.toolStore = config.toolStore;
    this.invocationStore = config.invocationStore;
    this.permissionManager = config.permissionManager;
    this.auditLogger = config.auditLogger;
    this.confirmationManager = config.confirmationManager;
    this.logger = config.logger ?? console;
    this.enableSandbox = config.enableSandbox ?? true;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 30000;
    this.maxConcurrentPerUser = config.maxConcurrentPerUser ?? 5;
    this.onBeforeExecute = config.onBeforeExecute;
    this.onAfterExecute = config.onAfterExecute;

    this.rateLimitState = new Map();
    this.concurrentExecutions = new Map();
    this.activeExecutions = new Map();
  }

  // ==========================================================================
  // MAIN EXECUTION FLOW
  // ==========================================================================

  /**
   * Execute a tool with full permission, confirmation, and audit flow
   */
  async execute(
    toolId: string,
    userId: string,
    input: unknown,
    options: ExecuteOptions
  ): Promise<ExecutionOutcome> {
    const auditContext = this.createAuditContext(userId, options);

    this.logger.debug(`Executing tool: ${toolId}`, { userId, sessionId: options.sessionId });

    // Get the tool
    const tool = await this.toolStore.get(toolId);
    if (!tool) {
      this.logger.error(`Tool not found: ${toolId}`);
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Check if tool is enabled
    if (!tool.enabled) {
      await this.auditLogger.logPermissionDenied(toolId, 'Tool is disabled', auditContext);
      throw new Error(`Tool is disabled: ${toolId}`);
    }

    // Validate input
    let validatedInput: unknown;
    try {
      validatedInput = tool.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Invalid input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create invocation record
    const invocation = await this.invocationStore.create({
      toolId,
      userId,
      sessionId: options.sessionId,
      input,
      validatedInput,
      status: ExecutionStatusEnum.PENDING,
      confirmationType: tool.confirmationType,
      metadata: options.metadata,
    });

    try {
      // Permission check
      if (!options.skipPermissionCheck) {
        const permissionResult = await this.permissionManager.checkToolPermission(userId, tool);
        if (!permissionResult.granted) {
          await this.auditLogger.logPermissionDenied(
            toolId,
            permissionResult.reason ?? 'Insufficient permissions',
            auditContext
          );
          await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.DENIED);
          return {
            invocation: { ...invocation, status: ExecutionStatusEnum.DENIED },
            result: null,
            status: ExecutionStatusEnum.DENIED,
            awaitingConfirmation: false,
          };
        }
      }

      // Rate limit check
      if (tool.rateLimit) {
        const rateLimitOk = this.checkRateLimit(tool.id, userId, tool.rateLimit);
        if (!rateLimitOk) {
          await this.auditLogger.logRateLimitExceeded(toolId, auditContext);
          await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.DENIED);
          return {
            invocation: { ...invocation, status: ExecutionStatusEnum.DENIED },
            result: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded',
                recoverable: true,
              },
            },
            status: ExecutionStatusEnum.DENIED,
            awaitingConfirmation: false,
          };
        }
      }

      // Concurrent execution check
      if (!this.checkConcurrentLimit(userId)) {
        await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.DENIED);
        return {
          invocation: { ...invocation, status: ExecutionStatusEnum.DENIED },
          result: {
            success: false,
            error: {
              code: 'CONCURRENT_LIMIT_EXCEEDED',
              message: 'Maximum concurrent executions exceeded',
              recoverable: true,
            },
          },
          status: ExecutionStatusEnum.DENIED,
          awaitingConfirmation: false,
        };
      }

      // Confirmation handling
      if (!options.skipConfirmation && this.confirmationManager.requiresConfirmation(tool)) {
        if (tool.confirmationType === ConfirmationTypeEnum.IMPLICIT) {
          // Auto-confirm implicit confirmations
          await this.confirmationManager.autoConfirmImplicit(invocation, tool);
        } else {
          // Create confirmation request and wait
          const confirmRequest = await this.confirmationManager.createConfirmationRequest(
            invocation,
            tool
          );

          await this.auditLogger.logConfirmationRequested(invocation, auditContext);
          await this.updateInvocationStatus(
            invocation.id,
            ExecutionStatusEnum.AWAITING_CONFIRMATION,
            { confirmationPrompt: confirmRequest.message }
          );

          return {
            invocation: {
              ...invocation,
              status: ExecutionStatusEnum.AWAITING_CONFIRMATION,
              confirmationPrompt: confirmRequest.message,
            },
            result: null,
            status: ExecutionStatusEnum.AWAITING_CONFIRMATION,
            awaitingConfirmation: true,
            confirmationId: confirmRequest.id,
          };
        }
      }

      // Execute the tool
      return this.executeInternal(invocation, tool, validatedInput, options, auditContext);
    } catch (error) {
      // Handle unexpected errors
      const toolError: ToolError = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false,
      };

      await this.auditLogger.logExecutionFailed(invocation, toolError, auditContext);
      await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.FAILED, {
        result: { success: false, error: toolError },
      });

      return {
        invocation: { ...invocation, status: ExecutionStatusEnum.FAILED },
        result: { success: false, error: toolError },
        status: ExecutionStatusEnum.FAILED,
        awaitingConfirmation: false,
      };
    }
  }

  /**
   * Continue execution after confirmation
   */
  async continueAfterConfirmation(
    invocationId: string,
    confirmed: boolean
  ): Promise<ExecutionOutcome> {
    const invocation = await this.invocationStore.get(invocationId);
    if (!invocation) {
      throw new Error(`Invocation not found: ${invocationId}`);
    }

    if (invocation.status !== ExecutionStatusEnum.AWAITING_CONFIRMATION) {
      throw new Error(`Invocation is not awaiting confirmation: ${invocationId}`);
    }

    const tool = await this.toolStore.get(invocation.toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${invocation.toolId}`);
    }

    const auditContext: AuditContext = {
      userId: invocation.userId,
      sessionId: invocation.sessionId,
    };

    if (!confirmed) {
      await this.auditLogger.logConfirmationDenied(invocation, auditContext);
      await this.updateInvocationStatus(invocationId, ExecutionStatusEnum.CANCELLED, {
        userConfirmed: false,
        confirmedAt: new Date(),
      });

      return {
        invocation: { ...invocation, status: ExecutionStatusEnum.CANCELLED },
        result: null,
        status: ExecutionStatusEnum.CANCELLED,
        awaitingConfirmation: false,
      };
    }

    await this.auditLogger.logConfirmationGranted(invocation, auditContext);
    await this.updateInvocationStatus(invocationId, ExecutionStatusEnum.PENDING, {
      userConfirmed: true,
      confirmedAt: new Date(),
    });

    // Execute the tool
    return this.executeInternal(
      { ...invocation, userConfirmed: true },
      tool,
      invocation.validatedInput ?? invocation.input,
      { sessionId: invocation.sessionId },
      auditContext
    );
  }

  /**
   * Cancel an execution
   */
  async cancel(invocationId: string): Promise<boolean> {
    const controller = this.activeExecutions.get(invocationId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(invocationId);
      await this.updateInvocationStatus(invocationId, ExecutionStatusEnum.CANCELLED);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // INTERNAL EXECUTION
  // ==========================================================================

  /**
   * Internal execution with sandboxing and timeout
   */
  private async executeInternal(
    invocation: ToolInvocation,
    tool: ToolDefinition,
    validatedInput: unknown,
    options: ExecuteOptions,
    auditContext: AuditContext
  ): Promise<ExecutionOutcome> {
    // Track concurrent execution
    this.addConcurrentExecution(invocation.userId, invocation.id);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.activeExecutions.set(invocation.id, abortController);

    try {
      // Before execute callback
      if (this.onBeforeExecute) {
        const shouldProceed = await this.onBeforeExecute(invocation, tool);
        if (!shouldProceed) {
          await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.CANCELLED);
          return {
            invocation: { ...invocation, status: ExecutionStatusEnum.CANCELLED },
            result: null,
            status: ExecutionStatusEnum.CANCELLED,
            awaitingConfirmation: false,
          };
        }
      }

      // Update status to executing
      await this.updateInvocationStatus(invocation.id, ExecutionStatusEnum.EXECUTING, {
        startedAt: new Date(),
      });
      await this.auditLogger.logExecutionStarted(invocation, auditContext);

      // Build execution context
      const context = await this.buildExecutionContext(invocation, options);

      // Execute with timeout
      const timeoutMs = options.timeout ?? tool.timeoutMs ?? this.defaultTimeoutMs;
      const result = await this.executeWithTimeout(
        tool.handler,
        validatedInput,
        context,
        timeoutMs,
        abortController.signal
      );

      const completedAt = new Date();
      const duration = invocation.startedAt
        ? completedAt.getTime() - invocation.startedAt.getTime()
        : undefined;

      // Update invocation with result
      const finalStatus = result.success
        ? ExecutionStatusEnum.SUCCESS
        : ExecutionStatusEnum.FAILED;

      await this.updateInvocationStatus(invocation.id, finalStatus, {
        result,
        completedAt,
        duration,
      });

      if (result.success) {
        await this.auditLogger.logExecutionSuccess(
          { ...invocation, result },
          auditContext
        );
      } else {
        await this.auditLogger.logExecutionFailed(
          invocation,
          result.error ?? { code: 'UNKNOWN', message: 'Unknown error', recoverable: false },
          auditContext
        );
      }

      // After execute callback
      if (this.onAfterExecute) {
        await this.onAfterExecute(invocation, result);
      }

      // Record rate limit hit
      if (tool.rateLimit) {
        this.recordRateLimitHit(tool.id, invocation.userId, tool.rateLimit);
      }

      return {
        invocation: {
          ...invocation,
          status: finalStatus,
          result,
          completedAt,
          duration,
        },
        result,
        status: finalStatus,
        awaitingConfirmation: false,
      };
    } finally {
      // Clean up tracking
      this.removeConcurrentExecution(invocation.userId, invocation.id);
      this.activeExecutions.delete(invocation.id);
    }
  }

  /**
   * Execute a tool handler with timeout
   */
  private async executeWithTimeout(
    handler: ToolDefinition['handler'],
    input: unknown,
    context: ToolExecutionContext,
    timeoutMs: number,
    signal: AbortSignal
  ): Promise<ToolExecutionResult> {
    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (signal.aborted) {
        resolve({
          success: false,
          error: {
            code: 'CANCELLED',
            message: 'Execution was cancelled',
            recoverable: true,
          },
        });
        return;
      }

      // Timeout handler
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: {
            code: 'TIMEOUT',
            message: `Execution timed out after ${timeoutMs}ms`,
            recoverable: true,
          },
        });
      }, timeoutMs);

      // Abort handler
      const abortHandler = () => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: {
            code: 'CANCELLED',
            message: 'Execution was cancelled',
            recoverable: true,
          },
        });
      };
      signal.addEventListener('abort', abortHandler, { once: true });

      // Execute handler
      const sandboxedHandler = this.enableSandbox
        ? this.wrapInSandbox(handler)
        : handler;

      sandboxedHandler(input, context)
        .then((result) => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Wrap a handler in a sandbox (basic implementation)
   */
  private wrapInSandbox(
    handler: ToolDefinition['handler']
  ): ToolDefinition['handler'] {
    return async (input, context) => {
      // In a real implementation, this would:
      // - Run in a separate process/worker
      // - Limit file system access
      // - Limit network access
      // - Limit CPU/memory usage
      // For now, just wrap with error handling
      try {
        return await handler(input, context);
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'SANDBOX_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error in sandbox',
            recoverable: false,
          },
        };
      }
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Build execution context for a tool
   */
  private async buildExecutionContext(
    invocation: ToolInvocation,
    options: ExecuteOptions
  ): Promise<ToolExecutionContext> {
    // Get previous calls for this session
    const previousInvocations = await this.invocationStore.getBySession(
      options.sessionId,
      10
    );

    const previousCalls = previousInvocations
      .filter((inv) => inv.id !== invocation.id && inv.status === ExecutionStatusEnum.SUCCESS)
      .map((inv) => ({
        toolId: inv.toolId,
        timestamp: inv.createdAt,
        success: true,
        outputSummary: this.summarizeOutput(inv.result?.output),
      }));

    // Get granted permissions
    const tool = await this.toolStore.get(invocation.toolId);
    const grantedPermissions = tool
      ? await this.permissionManager.getEffectivePermissions(invocation.userId, tool)
      : [];

    return {
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      requestId: options.requestId ?? invocation.id,
      grantedPermissions,
      userConfirmed: invocation.userConfirmed ?? false,
      previousCalls,
      metadata: options.metadata,
    };
  }

  /**
   * Create audit context from options
   */
  private createAuditContext(userId: string, options: ExecuteOptions): AuditContext {
    return {
      userId,
      sessionId: options.sessionId,
      requestId: options.requestId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata,
    };
  }

  /**
   * Update invocation status
   */
  private async updateInvocationStatus(
    invocationId: string,
    status: ToolExecutionStatus,
    updates?: Partial<ToolInvocation>
  ): Promise<void> {
    await this.invocationStore.update(invocationId, {
      status,
      ...updates,
    });
  }

  /**
   * Summarize output for previous calls context
   */
  private summarizeOutput(output: unknown): string | undefined {
    if (output === undefined || output === null) {
      return undefined;
    }
    const str = JSON.stringify(output);
    if (str.length <= 200) {
      return str;
    }
    return str.slice(0, 197) + '...';
  }

  // ==========================================================================
  // RATE LIMITING
  // ==========================================================================

  /**
   * Check if rate limit allows execution
   */
  private checkRateLimit(
    toolId: string,
    userId: string,
    rateLimit: RateLimit
  ): boolean {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();

    if (!entry) {
      return true;
    }

    // Check if window has expired
    if (now - entry.windowStart > rateLimit.windowMs) {
      this.rateLimitState.delete(key);
      return true;
    }

    return entry.count < rateLimit.maxCalls;
  }

  /**
   * Record a rate limit hit
   */
  private recordRateLimitHit(
    toolId: string,
    userId: string,
    rateLimit: RateLimit
  ): void {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();

    if (!entry || now - entry.windowStart > rateLimit.windowMs) {
      this.rateLimitState.set(key, { count: 1, windowStart: now });
    } else {
      entry.count++;
    }
  }

  /**
   * Get rate limit key
   */
  private getRateLimitKey(
    toolId: string,
    userId: string,
    scope: RateLimit['scope']
  ): string {
    switch (scope) {
      case 'global':
        return `rate:${toolId}:global`;
      case 'user':
        return `rate:${toolId}:user:${userId}`;
      case 'session':
        return `rate:${toolId}:session:${userId}`;
      default:
        return `rate:${toolId}:${userId}`;
    }
  }

  // ==========================================================================
  // CONCURRENT EXECUTION TRACKING
  // ==========================================================================

  /**
   * Check concurrent execution limit
   */
  private checkConcurrentLimit(userId: string): boolean {
    const userExecutions = this.concurrentExecutions.get(userId);
    if (!userExecutions) {
      return true;
    }
    return userExecutions.size < this.maxConcurrentPerUser;
  }

  /**
   * Add concurrent execution
   */
  private addConcurrentExecution(userId: string, invocationId: string): void {
    let userExecutions = this.concurrentExecutions.get(userId);
    if (!userExecutions) {
      userExecutions = new Set();
      this.concurrentExecutions.set(userId, userExecutions);
    }
    userExecutions.add(invocationId);
  }

  /**
   * Remove concurrent execution
   */
  private removeConcurrentExecution(userId: string, invocationId: string): void {
    const userExecutions = this.concurrentExecutions.get(userId);
    if (userExecutions) {
      userExecutions.delete(invocationId);
      if (userExecutions.size === 0) {
        this.concurrentExecutions.delete(userId);
      }
    }
  }

  // ==========================================================================
  // STATUS QUERIES
  // ==========================================================================

  /**
   * Get current execution count for a user
   */
  getConcurrentExecutionCount(userId: string): number {
    const userExecutions = this.concurrentExecutions.get(userId);
    return userExecutions?.size ?? 0;
  }

  /**
   * Get rate limit status for a tool/user
   */
  getRateLimitStatus(
    toolId: string,
    userId: string,
    rateLimit: RateLimit
  ): { remaining: number; resetsIn: number } {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();

    if (!entry || now - entry.windowStart > rateLimit.windowMs) {
      return { remaining: rateLimit.maxCalls, resetsIn: 0 };
    }

    return {
      remaining: Math.max(0, rateLimit.maxCalls - entry.count),
      resetsIn: Math.max(0, rateLimit.windowMs - (now - entry.windowStart)),
    };
  }

  /**
   * Clear all rate limit state (for testing)
   */
  clearRateLimitState(): void {
    this.rateLimitState.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new ToolExecutor instance
 */
export function createToolExecutor(config: ToolExecutorConfig): ToolExecutor {
  return new ToolExecutor(config);
}
