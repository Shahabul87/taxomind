/**
 * @sam-ai/agentic - Active Step Executor
 * Wires StepExecutor to runtime with tool binding and real-time execution
 */

import type {
  TutoringContext,
  ToolPlan,
  PlannedToolExecution,
  OrchestrationConfirmationRequest,
  ConfirmationResponse,
  OrchestrationConfirmationRequestStore,
  OrchestrationLogger,
} from './types';

import type {
  PlanStep,
  StepStatus,
  StepMetrics,
} from '../goal-planning/types';

import type {
  ToolDefinition,
  ToolExecutionResult,
  ToolExecutionContext,
  ToolStore,
} from '../tool-registry/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

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

// ============================================================================
// EXECUTION RESULT TYPES
// ============================================================================

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

// ============================================================================
// ACTIVE STEP EXECUTOR
// ============================================================================

export class ActiveStepExecutor {
  private readonly config: Required<ActiveStepExecutorConfig>;
  private readonly logger: OrchestrationLogger;
  private readonly pendingConfirmations: Map<string, PendingConfirmation> = new Map();

  constructor(config: ActiveStepExecutorConfig) {
    this.config = {
      ...config,
      defaultTimeoutMs: config.defaultTimeoutMs ?? 30000,
      maxConcurrentTools: config.maxConcurrentTools ?? 3,
      requireConfirmation: config.requireConfirmation ?? true,
      confirmationExpiryMs: config.confirmationExpiryMs ?? 300000, // 5 minutes
      logger: config.logger ?? this.createDefaultLogger(),
    };
    this.logger = this.config.logger;
  }

  /**
   * Execute a step with its associated tools
   */
  async executeStep(
    step: PlanStep,
    context: TutoringContext,
    toolPlan: ToolPlan
  ): Promise<StepExecutionResult> {
    const startedAt = new Date();

    this.logger.info('Executing step', {
      stepId: step.id,
      stepType: step.type,
      toolCount: toolPlan.tools.length,
    });

    const toolResults: ToolExecutionSummary[] = [];
    const errors: StepExecutionError[] = [];
    const artifacts: Artifact[] = [];

    // Execute tools based on plan
    if (toolPlan.tools.length > 0) {
      const results = await this.executeToolPlan(toolPlan, context);
      toolResults.push(...results.summaries);
      errors.push(...results.errors);
      artifacts.push(...results.artifacts);
    }

    // Determine overall status
    const hasErrors = errors.some(e => !e.recoverable);
    const hasPendingConfirmations = toolResults.some(
      r => r.status === 'pending_confirmation'
    );

    let status: StepStatus;
    if (hasErrors) {
      status = 'failed';
    } else if (hasPendingConfirmations) {
      status = 'blocked';
    } else {
      status = 'completed';
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Calculate time efficiency based on estimated vs actual duration
    const estimatedMs = step.estimatedMinutes * 60 * 1000;
    const timeEfficiency = estimatedMs > 0 ? estimatedMs / duration : 1;

    const metrics: StepMetrics = {
      engagement: 1, // Would be calculated from user interaction patterns
      comprehension: errors.length === 0 ? 1 : 0.5, // Based on error rate
      timeEfficiency: Math.min(timeEfficiency, 2), // Cap at 2x efficiency
      ...this.calculateAdditionalMetrics(toolResults),
    };

    const output: StepExecutionOutput = {
      message: this.generateOutputMessage(step, status, toolResults),
      data: this.aggregateToolOutputs(toolResults),
      artifacts,
    };

    const result: StepExecutionResult = {
      stepId: step.id,
      status,
      output,
      metrics,
      toolResults,
      errors,
      startedAt,
      completedAt,
    };

    this.logger.info('Step execution complete', {
      stepId: step.id,
      status,
      duration,
      toolsExecuted: toolResults.length,
      errorsCount: errors.length,
    });

    return result;
  }

  /**
   * Execute a tool plan with confirmation handling
   */
  async executeToolPlan(
    toolPlan: ToolPlan,
    context: TutoringContext
  ): Promise<ToolPlanExecutionResult> {
    const summaries: ToolExecutionSummary[] = [];
    const errors: StepExecutionError[] = [];
    const artifacts: Artifact[] = [];

    // Separate tools that need confirmation
    const { needsConfirmation, canExecute } = this.categorizeTools(
      toolPlan.tools,
      context
    );

    // Execute tools that don't need confirmation
    const immediateResults = await this.executeToolsBatch(
      canExecute,
      context
    );
    summaries.push(...immediateResults.summaries);
    errors.push(...immediateResults.errors);
    artifacts.push(...immediateResults.artifacts);

    // Request confirmation for remaining tools
    for (const tool of needsConfirmation) {
      const confirmationResult = await this.requestToolConfirmation(
        tool,
        context
      );
      summaries.push(confirmationResult);
    }

    return { summaries, errors, artifacts };
  }

  /**
   * Execute a single tool
   */
  async executeTool(
    tool: PlannedToolExecution,
    context: TutoringContext
  ): Promise<ToolExecutionSummary> {
    const startTime = Date.now();

    this.logger.debug('Executing tool', {
      toolId: tool.toolId,
      toolName: tool.toolName,
    });

    try {
      // Get tool definition
      const toolDef = await this.config.toolStore.get(tool.toolId);
      if (!toolDef) {
        return {
          toolId: tool.toolId,
          toolName: tool.toolName,
          status: 'failed',
          error: `Tool not found: ${tool.toolId}`,
          duration: Date.now() - startTime,
        };
      }

      // Check if tool is enabled
      if (!toolDef.enabled) {
        return {
          toolId: tool.toolId,
          toolName: tool.toolName,
          status: 'skipped',
          error: 'Tool is disabled',
          duration: Date.now() - startTime,
        };
      }

      // Validate input
      const validatedInput = await this.validateToolInput(toolDef, tool.input);

      // Build execution context
      const execContext: ToolExecutionContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        requestId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        grantedPermissions: toolDef.requiredPermissions,
        userConfirmed: !tool.requiresConfirmation,
        previousCalls: [],
      };

      // Execute with timeout
      const result = await this.executeWithTimeout(
        toolDef.handler(validatedInput, execContext),
        toolDef.timeoutMs ?? this.config.defaultTimeoutMs
      );

      return {
        toolId: tool.toolId,
        toolName: tool.toolName,
        status: result.success ? 'success' : 'failed',
        result,
        error: result.error?.message,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Tool execution failed', error as Error, {
        toolId: tool.toolId,
      });

      return {
        toolId: tool.toolId,
        toolName: tool.toolName,
        status: 'failed',
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Handle confirmation response for a pending tool execution
   */
  async handleConfirmation(
    confirmationId: string,
    response: ConfirmationResponse,
    context: TutoringContext
  ): Promise<ToolExecutionSummary | null> {
    const pending = this.pendingConfirmations.get(confirmationId);
    if (!pending) {
      this.logger.warn('Confirmation not found', { confirmationId });
      return null;
    }

    // Update confirmation in store
    await this.config.confirmationStore.respond(confirmationId, response);

    // Remove from pending
    this.pendingConfirmations.delete(confirmationId);

    if (!response.approved) {
      return {
        toolId: pending.tool.toolId,
        toolName: pending.tool.toolName,
        status: 'skipped',
        error: response.rejectionReason ?? 'User declined',
        duration: 0,
        confirmationId,
      };
    }

    // Execute the tool with possibly modified input
    const toolToExecute: PlannedToolExecution = {
      ...pending.tool,
      input: response.modifiedInput ?? pending.tool.input,
      requiresConfirmation: false, // Already confirmed
    };

    return this.executeTool(toolToExecute, context);
  }

  /**
   * Get all pending confirmations for a user
   */
  async getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]> {
    return this.config.confirmationStore.getByUser(userId, {
      status: ['pending'],
    });
  }

  /**
   * Cancel a pending confirmation
   */
  async cancelConfirmation(confirmationId: string): Promise<boolean> {
    const pending = this.pendingConfirmations.get(confirmationId);
    if (!pending) {
      return false;
    }

    await this.config.confirmationStore.update(confirmationId, {
      status: 'expired',
    });

    this.pendingConfirmations.delete(confirmationId);
    return true;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeTools(
    tools: PlannedToolExecution[],
    _context: TutoringContext
  ): { needsConfirmation: PlannedToolExecution[]; canExecute: PlannedToolExecution[] } {
    const needsConfirmation: PlannedToolExecution[] = [];
    const canExecute: PlannedToolExecution[] = [];

    for (const tool of tools) {
      if (tool.requiresConfirmation && this.config.requireConfirmation) {
        needsConfirmation.push(tool);
      } else {
        canExecute.push(tool);
      }
    }

    return { needsConfirmation, canExecute };
  }

  private async executeToolsBatch(
    tools: PlannedToolExecution[],
    context: TutoringContext
  ): Promise<ToolPlanExecutionResult> {
    const summaries: ToolExecutionSummary[] = [];
    const errors: StepExecutionError[] = [];
    const artifacts: Artifact[] = [];

    // Execute in batches based on max concurrency
    const batches = this.chunkArray(tools, this.config.maxConcurrentTools);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(tool => this.executeTool(tool, context))
      );

      for (const result of batchResults) {
        summaries.push(result);

        if (result.status === 'failed' && result.error) {
          errors.push({
            code: 'TOOL_EXECUTION_ERROR',
            message: result.error,
            toolId: result.toolId,
            recoverable: true,
          });
        }

        // Extract artifacts from successful results
        if (result.status === 'success' && result.result?.output) {
          const extractedArtifacts = this.extractArtifacts(
            result.toolId,
            result.result.output
          );
          artifacts.push(...extractedArtifacts);
        }
      }
    }

    return { summaries, errors, artifacts };
  }

  private async requestToolConfirmation(
    tool: PlannedToolExecution,
    context: TutoringContext
  ): Promise<ToolExecutionSummary> {
    const expiresAt = new Date(Date.now() + this.config.confirmationExpiryMs);

    const request = await this.config.confirmationStore.create({
      userId: context.userId,
      sessionId: context.sessionId,
      toolId: tool.toolId,
      toolName: tool.toolName,
      toolDescription: tool.reasoning,
      plannedInput: tool.input,
      reasoning: tool.reasoning,
      riskLevel: this.assessRiskLevel(tool),
      stepId: context.currentStep?.id ?? null,
      stepTitle: context.currentStep?.title ?? null,
      status: 'pending',
      expiresAt,
      respondedAt: null,
      approvedBy: null,
      rejectionReason: null,
    });

    // Store pending confirmation
    this.pendingConfirmations.set(request.id, {
      request,
      tool,
      context,
      createdAt: new Date(),
    });

    this.logger.info('Confirmation requested', {
      confirmationId: request.id,
      toolId: tool.toolId,
    });

    return {
      toolId: tool.toolId,
      toolName: tool.toolName,
      status: 'pending_confirmation',
      duration: 0,
      confirmationId: request.id,
    };
  }

  private async validateToolInput(
    toolDef: ToolDefinition,
    input: Record<string, unknown>
  ): Promise<unknown> {
    try {
      return toolDef.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Invalid tool input: ${error instanceof Error ? error.message : 'validation failed'}`);
    }
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
      ),
    ]);
  }

  private assessRiskLevel(
    tool: PlannedToolExecution
  ): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
    // Simple risk assessment based on priority and confirmation requirement
    if (!tool.requiresConfirmation) return 'safe';
    if (tool.priority >= 8) return 'low';
    if (tool.priority >= 5) return 'medium';
    if (tool.priority >= 3) return 'high';
    return 'critical';
  }

  private extractArtifacts(
    toolId: string,
    output: unknown
  ): Artifact[] {
    const artifacts: Artifact[] = [];

    if (typeof output === 'object' && output !== null) {
      const outputObj = output as Record<string, unknown>;

      // Check for artifact-like properties
      if (outputObj.content && outputObj.type) {
        artifacts.push({
          id: `artifact-${toolId}-${Date.now()}`,
          type: (outputObj.type as Artifact['type']) || 'content',
          title: (outputObj.title as string) || 'Generated Content',
          content: outputObj.content,
          metadata: outputObj.metadata as Record<string, unknown> | undefined,
        });
      }
    }

    return artifacts;
  }

  private calculateAdditionalMetrics(
    results: ToolExecutionSummary[]
  ): Partial<StepMetrics> {
    const successCount = results.filter(r => r.status === 'success').length;
    const successRate = results.length > 0 ? successCount / results.length : 1;

    // Calculate mastery gain based on success rate
    return {
      masteryGain: successRate * 0.1, // Small mastery gain per step
    };
  }

  private generateOutputMessage(
    step: PlanStep,
    status: StepStatus,
    results: ToolExecutionSummary[]
  ): string {
    const successCount = results.filter(r => r.status === 'success').length;

    switch (status) {
      case 'completed':
        return `Step "${step.title}" completed successfully. ${successCount} tools executed.`;
      case 'failed':
        return `Step "${step.title}" failed. Please check the errors and try again.`;
      case 'blocked':
        return `Step "${step.title}" is waiting for confirmation to proceed.`;
      default:
        return `Step "${step.title}" status: ${status}`;
    }
  }

  private aggregateToolOutputs(
    results: ToolExecutionSummary[]
  ): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {};

    for (const result of results) {
      if (result.status === 'success' && result.result?.output) {
        aggregated[result.toolId] = result.result.output;
      }
    }

    return aggregated;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private createDefaultLogger(): OrchestrationLogger {
    return {
      debug: (_message: string, _data?: Record<string, unknown>) => {},
      info: (_message: string, _data?: Record<string, unknown>) => {},
      warn: (message: string, data?: Record<string, unknown>) => {
        console.warn(`[ActiveStepExecutor] ${message}`, data);
      },
      error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
        console.error(`[ActiveStepExecutor] ${message}`, error, data);
      },
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface PendingConfirmation {
  request: OrchestrationConfirmationRequest;
  tool: PlannedToolExecution;
  context: TutoringContext;
  createdAt: Date;
}

interface ToolPlanExecutionResult {
  summaries: ToolExecutionSummary[];
  errors: StepExecutionError[];
  artifacts: Artifact[];
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createActiveStepExecutor(
  config: ActiveStepExecutorConfig
): ActiveStepExecutor {
  return new ActiveStepExecutor(config);
}
