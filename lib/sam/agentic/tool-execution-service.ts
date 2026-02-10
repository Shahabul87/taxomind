/**
 * Tool Execution Service
 *
 * Handles tool registration lookup and permissioned tool execution.
 * Delegates initialization to the shared agentic-tooling module.
 */

import {
  type ToolRegistry,
  type ToolExecutor,
  type ToolDefinition,
  type ExecuteOptions,
  type ExecutionOutcome,
} from '@sam-ai/agentic';

import { ensureToolingInitialized } from '../agentic-tooling';
import type { AgenticLogger } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class ToolExecutionService {
  private toolRegistry?: ToolRegistry;
  private toolExecutor?: ToolExecutor;

  constructor(
    private readonly userId: string,
    private readonly logger: AgenticLogger,
  ) {}

  /** Initialize tool registry and executor asynchronously */
  initialize(): void {
    void this.initializeTooling();
  }

  private async initializeTooling(): Promise<void> {
    try {
      const tooling = await ensureToolingInitialized(this.userId);
      this.toolRegistry = tooling.toolRegistry;
      this.toolExecutor = tooling.toolExecutor;
      this.logger.debug('Tool Execution initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize tool execution', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    options?: Partial<ExecuteOptions>,
  ): Promise<ExecutionOutcome> {
    if (!this.toolExecutor) {
      throw new Error('Tool Execution not enabled');
    }

    const executeOptions: ExecuteOptions = {
      sessionId: options?.sessionId ?? `session_${Date.now()}`,
      skipConfirmation: options?.skipConfirmation,
      skipPermissionCheck: options?.skipPermissionCheck,
      metadata: options?.metadata,
      timeout: options?.timeout,
    };

    const result = await this.toolExecutor.execute(
      toolId,
      this.userId,
      input,
      executeOptions,
    );

    this.logger.info('Tool executed', {
      toolId,
      success: result.invocation.status === 'success',
    });

    return result;
  }

  async getAvailableTools(): Promise<ToolDefinition[]> {
    if (!this.toolRegistry) {
      throw new Error('Tool Execution not enabled');
    }

    return this.toolRegistry.listTools();
  }

  // --------------------------------------------------------------------------
  // Capability checks
  // --------------------------------------------------------------------------

  isEnabled(): boolean {
    return !!this.toolRegistry;
  }
}
