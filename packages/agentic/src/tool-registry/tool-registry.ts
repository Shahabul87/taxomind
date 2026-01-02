/**
 * @sam-ai/agentic - Tool Registry
 * Central registry for managing tool execution with permissions and audit logging
 */

import type { SAMLogger } from '@sam-ai/core';
import { z } from 'zod';
import {
  type ToolDefinition,
  type ToolInvocation,
  type ToolExecutionContext,
  type ToolCallSummary,
  type ToolStore,
  type InvocationStore,
  type AuditStore,
  type PermissionStore,
  type ConfirmationStore,
  type ConfirmationRequest,
  type AuditLogEntry,
  type ToolQueryOptions,
  type PermissionLevel,
  type ConfirmationType,
  ToolExecutionStatus,
  ConfirmationType as ConfirmationTypeEnum,
  AuditLogLevel as AuditLogLevelEnum,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ToolRegistryConfig {
  toolStore: ToolStore;
  invocationStore: InvocationStore;
  auditStore: AuditStore;
  permissionStore: PermissionStore;
  confirmationStore: ConfirmationStore;
  logger?: SAMLogger;
  defaultTimeoutMs?: number;
  enableAuditLogging?: boolean;
  rateLimitEnabled?: boolean;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

interface RateLimitState {
  count: number;
  windowStart: number;
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export class ToolRegistry {
  private readonly toolStore: ToolStore;
  private readonly invocationStore: InvocationStore;
  private readonly auditStore: AuditStore;
  private readonly permissionStore: PermissionStore;
  private readonly confirmationStore: ConfirmationStore;
  private readonly logger: SAMLogger;
  private readonly defaultTimeoutMs: number;
  private readonly enableAuditLogging: boolean;
  private readonly rateLimitEnabled: boolean;

  // In-memory rate limit tracking
  private readonly rateLimitStates: Map<string, RateLimitState> = new Map();

  constructor(config: ToolRegistryConfig) {
    this.toolStore = config.toolStore;
    this.invocationStore = config.invocationStore;
    this.auditStore = config.auditStore;
    this.permissionStore = config.permissionStore;
    this.confirmationStore = config.confirmationStore;
    this.logger = config.logger ?? console;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 30000;
    this.enableAuditLogging = config.enableAuditLogging ?? true;
    this.rateLimitEnabled = config.rateLimitEnabled ?? true;
  }

  // ============================================================================
  // TOOL REGISTRATION
  // ============================================================================

  /**
   * Register a new tool
   */
  async register(tool: ToolDefinition): Promise<void> {
    this.logger.debug?.(`[ToolRegistry] Registering tool: ${tool.id}`);

    // Validate tool definition
    this.validateToolDefinition(tool);

    // Check if tool already exists
    const existing = await this.toolStore.get(tool.id);
    if (existing) {
      throw new Error(`Tool already registered: ${tool.id}`);
    }

    await this.toolStore.register(tool);

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: 'system',
      sessionId: 'system',
      action: 'tool_registered',
      toolId: tool.id,
      metadata: {
        name: tool.name,
        category: tool.category,
        version: tool.version,
      },
    });
  }

  /**
   * Update an existing tool
   */
  async update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition> {
    this.logger.debug?.(`[ToolRegistry] Updating tool: ${toolId}`);

    const tool = await this.toolStore.update(toolId, updates);

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: 'system',
      sessionId: 'system',
      action: 'tool_updated',
      toolId,
      metadata: { updates: Object.keys(updates) },
    });

    return tool;
  }

  /**
   * Get a tool by ID
   */
  async getTool(toolId: string): Promise<ToolDefinition | null> {
    return this.toolStore.get(toolId);
  }

  /**
   * List tools with optional filtering
   */
  async listTools(options?: ToolQueryOptions): Promise<ToolDefinition[]> {
    return this.toolStore.list(options);
  }

  /**
   * Enable a tool
   */
  async enableTool(toolId: string): Promise<void> {
    await this.toolStore.enable(toolId);

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: 'system',
      sessionId: 'system',
      action: 'tool_enabled',
      toolId,
    });
  }

  /**
   * Disable a tool
   */
  async disableTool(toolId: string): Promise<void> {
    await this.toolStore.disable(toolId);

    await this.audit({
      level: AuditLogLevelEnum.WARNING,
      userId: 'system',
      sessionId: 'system',
      action: 'tool_disabled',
      toolId,
    });
  }

  // ============================================================================
  // TOOL INVOCATION
  // ============================================================================

  /**
   * Invoke a tool
   */
  async invoke(
    toolId: string,
    input: unknown,
    context: {
      userId: string;
      sessionId: string;
      skipConfirmation?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ToolInvocation> {
    const requestId = this.generateId();

    this.logger.debug?.(`[ToolRegistry] Invoking tool: ${toolId} (request: ${requestId})`);

    // Get tool
    const tool = await this.toolStore.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    if (!tool.enabled) {
      throw new Error(`Tool is disabled: ${toolId}`);
    }

    if (tool.deprecated) {
      this.logger.warn?.(`[ToolRegistry] Tool is deprecated: ${toolId} - ${tool.deprecationMessage}`);
    }

    // Create invocation record
    let invocation = await this.invocationStore.create({
      toolId,
      userId: context.userId,
      sessionId: context.sessionId,
      input,
      status: ToolExecutionStatus.PENDING,
      confirmationType: tool.confirmationType,
      metadata: context.metadata,
    });

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: context.userId,
      sessionId: context.sessionId,
      action: 'tool_invoked',
      toolId,
      invocationId: invocation.id,
      input,
      requestId,
    });

    try {
      // Validate input
      const validatedInput = await this.validateInput(tool, input);
      invocation = await this.invocationStore.update(invocation.id, { validatedInput });

      // Check permissions
      const permissionResult = await this.permissionStore.check(
        context.userId,
        toolId,
        tool.requiredPermissions
      );

      if (!permissionResult.granted) {
        await this.audit({
          level: AuditLogLevelEnum.WARNING,
          userId: context.userId,
          sessionId: context.sessionId,
          action: 'permission_denied',
          toolId,
          invocationId: invocation.id,
          metadata: {
            missingLevels: permissionResult.missingLevels,
            reason: permissionResult.reason,
          },
        });

        return this.invocationStore.update(invocation.id, {
          status: ToolExecutionStatus.DENIED,
          result: {
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: permissionResult.reason ?? 'Insufficient permissions',
              recoverable: false,
            },
          },
        });
      }

      // Check rate limits
      if (this.rateLimitEnabled && tool.rateLimit) {
        const rateLimitKey = this.getRateLimitKey(tool, context);
        if (!this.checkRateLimit(tool, rateLimitKey)) {
          await this.audit({
            level: AuditLogLevelEnum.WARNING,
            userId: context.userId,
            sessionId: context.sessionId,
            action: 'rate_limit_exceeded',
            toolId,
            invocationId: invocation.id,
          });

          return this.invocationStore.update(invocation.id, {
            status: ToolExecutionStatus.DENIED,
            result: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded for this tool',
                recoverable: true,
              },
            },
          });
        }
      }

      // Handle confirmation
      if (this.requiresConfirmation(tool, context.skipConfirmation)) {
        invocation = await this.requestConfirmation(tool, invocation);

        if (invocation.status === ToolExecutionStatus.AWAITING_CONFIRMATION) {
          return invocation;
        }

        if (invocation.status === ToolExecutionStatus.CANCELLED) {
          return invocation;
        }
      }

      // Execute tool
      return this.executeTool(tool, invocation, permissionResult.grantedLevels, requestId);
    } catch (error) {
      return this.invocationStore.update(invocation.id, {
        status: ToolExecutionStatus.FAILED,
        result: {
          success: false,
          error: {
            code: 'INVOCATION_ERROR',
            message: (error as Error).message,
            recoverable: false,
          },
        },
      });
    }
  }

  /**
   * Respond to a confirmation request
   */
  async respondToConfirmation(
    confirmationId: string,
    confirmed: boolean,
    userId: string
  ): Promise<ToolInvocation> {
    const confirmation = await this.confirmationStore.get(confirmationId);
    if (!confirmation) {
      throw new Error(`Confirmation not found: ${confirmationId}`);
    }

    if (confirmation.userId !== userId) {
      throw new Error('Unauthorized to respond to this confirmation');
    }

    if (confirmation.status !== 'pending') {
      throw new Error(`Confirmation already ${confirmation.status}`);
    }

    await this.confirmationStore.respond(confirmationId, confirmed);

    const invocation = await this.invocationStore.get(confirmation.invocationId);
    if (!invocation) {
      throw new Error(`Invocation not found: ${confirmation.invocationId}`);
    }

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId,
      sessionId: invocation.sessionId,
      action: confirmed ? 'confirmation_granted' : 'confirmation_denied',
      toolId: invocation.toolId,
      invocationId: invocation.id,
    });

    if (!confirmed) {
      return this.invocationStore.update(invocation.id, {
        status: ToolExecutionStatus.CANCELLED,
        userConfirmed: false,
        result: {
          success: false,
          error: {
            code: 'USER_CANCELLED',
            message: 'User declined the action',
            recoverable: false,
          },
        },
      });
    }

    // Get tool and continue execution
    const tool = await this.toolStore.get(invocation.toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${invocation.toolId}`);
    }

    const permissionResult = await this.permissionStore.check(
      userId,
      invocation.toolId,
      tool.requiredPermissions
    );

    return this.executeTool(
      tool,
      await this.invocationStore.update(invocation.id, {
        userConfirmed: true,
        confirmedAt: new Date(),
      }),
      permissionResult.grantedLevels,
      this.generateId()
    );
  }

  /**
   * Get pending confirmations for a user
   */
  async getPendingConfirmations(userId: string): Promise<ConfirmationRequest[]> {
    return this.confirmationStore.getPending(userId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private validateToolDefinition(tool: ToolDefinition): void {
    if (!tool.id || !tool.name || !tool.handler) {
      throw new Error('Tool must have id, name, and handler');
    }

    if (!tool.inputSchema) {
      throw new Error('Tool must have an input schema');
    }

    if (tool.requiredPermissions.length === 0) {
      throw new Error('Tool must require at least one permission level');
    }
  }

  private async validateInput(tool: ToolDefinition, input: unknown): Promise<unknown> {
    try {
      return tool.inputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  private requiresConfirmation(
    tool: ToolDefinition,
    skipConfirmation?: boolean
  ): boolean {
    if (skipConfirmation && tool.confirmationType !== ConfirmationTypeEnum.CRITICAL) {
      return false;
    }

    return (
      tool.confirmationType === ConfirmationTypeEnum.EXPLICIT ||
      tool.confirmationType === ConfirmationTypeEnum.CRITICAL
    );
  }

  private async requestConfirmation(
    tool: ToolDefinition,
    invocation: ToolInvocation
  ): Promise<ToolInvocation> {
    const confirmationRequest = await this.confirmationStore.create({
      invocationId: invocation.id,
      toolId: tool.id,
      toolName: tool.name,
      userId: invocation.userId,
      title: `Confirm: ${tool.name}`,
      message: this.generateConfirmationMessage(tool, invocation),
      type: tool.confirmationType,
      severity: this.getConfirmationSeverity(tool.confirmationType),
      status: 'pending',
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
    });

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      action: 'confirmation_requested',
      toolId: tool.id,
      invocationId: invocation.id,
    });

    return this.invocationStore.update(invocation.id, {
      status: ToolExecutionStatus.AWAITING_CONFIRMATION,
      confirmationPrompt: confirmationRequest.message,
    });
  }

  private generateConfirmationMessage(
    tool: ToolDefinition,
    invocation: ToolInvocation
  ): string {
    const inputSummary = JSON.stringify(invocation.input, null, 2).slice(0, 200);
    return `The AI assistant wants to execute "${tool.name}".\n\nDescription: ${tool.description}\n\nInput: ${inputSummary}...\n\nDo you want to proceed?`;
  }

  private getConfirmationSeverity(
    type: ConfirmationType
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case ConfirmationTypeEnum.IMPLICIT:
        return 'low';
      case ConfirmationTypeEnum.EXPLICIT:
        return 'medium';
      case ConfirmationTypeEnum.CRITICAL:
        return 'critical';
      default:
        return 'low';
    }
  }

  private async executeTool(
    tool: ToolDefinition,
    invocation: ToolInvocation,
    grantedPermissions: PermissionLevel[],
    requestId: string
  ): Promise<ToolInvocation> {
    const startTime = Date.now();

    invocation = await this.invocationStore.update(invocation.id, {
      status: ToolExecutionStatus.EXECUTING,
      startedAt: new Date(),
    });

    await this.audit({
      level: AuditLogLevelEnum.INFO,
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      action: 'execution_started',
      toolId: tool.id,
      invocationId: invocation.id,
      requestId,
    });

    try {
      // Build execution context
      const previousCalls = await this.getPreviousCalls(invocation.sessionId);
      const context: ToolExecutionContext = {
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        requestId,
        grantedPermissions,
        userConfirmed: invocation.userConfirmed ?? false,
        previousCalls,
        metadata: invocation.metadata,
      };

      // Execute with timeout
      const timeoutMs = tool.timeoutMs ?? this.defaultTimeoutMs;
      const result = await this.executeWithTimeout(
        tool.handler(invocation.validatedInput ?? invocation.input, context),
        timeoutMs
      );

      const duration = Date.now() - startTime;

      // Validate output if schema provided
      if (result.success && tool.outputSchema && result.output) {
        try {
          tool.outputSchema.parse(result.output);
        } catch (error) {
          this.logger.warn?.(`[ToolRegistry] Output validation failed for ${tool.id}`);
        }
      }

      await this.audit({
        level: result.success ? AuditLogLevelEnum.INFO : AuditLogLevelEnum.ERROR,
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        action: result.success ? 'execution_success' : 'execution_failed',
        toolId: tool.id,
        invocationId: invocation.id,
        output: result.output,
        error: result.error,
        requestId,
        metadata: { duration },
      });

      return this.invocationStore.update(invocation.id, {
        status: result.success ? ToolExecutionStatus.SUCCESS : ToolExecutionStatus.FAILED,
        completedAt: new Date(),
        duration,
        result,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = (error as Error).message.includes('timeout');

      await this.audit({
        level: AuditLogLevelEnum.ERROR,
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        action: isTimeout ? 'execution_timeout' : 'execution_failed',
        toolId: tool.id,
        invocationId: invocation.id,
        error: {
          code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
          message: (error as Error).message,
          recoverable: true,
        },
        requestId,
        metadata: { duration },
      });

      return this.invocationStore.update(invocation.id, {
        status: isTimeout ? ToolExecutionStatus.TIMEOUT : ToolExecutionStatus.FAILED,
        completedAt: new Date(),
        duration,
        result: {
          success: false,
          error: {
            code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
            message: (error as Error).message,
            recoverable: true,
          },
        },
      });
    }
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  private async getPreviousCalls(sessionId: string): Promise<ToolCallSummary[]> {
    const invocations = await this.invocationStore.getBySession(sessionId, 10);

    return invocations
      .filter((inv) => inv.status === ToolExecutionStatus.SUCCESS)
      .map((inv) => ({
        toolId: inv.toolId,
        timestamp: inv.completedAt ?? inv.createdAt,
        success: inv.result?.success ?? false,
        outputSummary: inv.result?.output
          ? JSON.stringify(inv.result.output).slice(0, 100)
          : undefined,
      }));
  }

  private getRateLimitKey(
    tool: ToolDefinition,
    context: { userId: string; sessionId: string }
  ): string {
    const scope = tool.rateLimit?.scope ?? 'user';
    switch (scope) {
      case 'global':
        return `${tool.id}:global`;
      case 'session':
        return `${tool.id}:${context.sessionId}`;
      case 'user':
      default:
        return `${tool.id}:${context.userId}`;
    }
  }

  private checkRateLimit(tool: ToolDefinition, key: string): boolean {
    if (!tool.rateLimit) return true;

    const now = Date.now();
    const state = this.rateLimitStates.get(key);

    if (!state || now - state.windowStart > tool.rateLimit.windowMs) {
      // Start new window
      this.rateLimitStates.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (state.count >= tool.rateLimit.maxCalls) {
      return false;
    }

    state.count++;
    return true;
  }

  private async audit(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<void> {
    if (!this.enableAuditLogging) return;

    try {
      await this.auditStore.log(entry);
    } catch (error) {
      this.logger.error?.(`[ToolRegistry] Audit logging failed: ${(error as Error).message}`);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createToolRegistry(config: ToolRegistryConfig): ToolRegistry {
  return new ToolRegistry(config);
}
