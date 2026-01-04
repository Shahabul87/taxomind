/**
 * @sam-ai/agentic - Confirmation Gate
 * User confirmation handling for high-impact tool usage
 */

import type {
  OrchestrationConfirmationRequest,
  ConfirmationResponse,
  OrchestrationConfirmationRequestStore,
  OrchestrationLogger,
} from './types';

import type {
  ToolDefinition,
  ConfirmationType,
} from '../tool-registry/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ConfirmationGateConfig {
  /** Confirmation request store */
  confirmationStore: OrchestrationConfirmationRequestStore;

  /** Logger instance */
  logger?: OrchestrationLogger;

  /** Default expiry time for confirmations (ms) */
  defaultExpiryMs?: number;

  /** Auto-approve for safe tools */
  autoApproveForSafe?: boolean;

  /** Maximum pending confirmations per user */
  maxPendingPerUser?: number;

  /** Notification callback */
  onConfirmationRequired?: (request: OrchestrationConfirmationRequest) => void;
}

// ============================================================================
// CONFIRMATION GATE
// ============================================================================

export class ConfirmationGate {
  private readonly config: Required<ConfirmationGateConfig>;
  private readonly logger: OrchestrationLogger;

  constructor(config: ConfirmationGateConfig) {
    this.config = {
      ...config,
      defaultExpiryMs: config.defaultExpiryMs ?? 300000, // 5 minutes
      autoApproveForSafe: config.autoApproveForSafe ?? true,
      maxPendingPerUser: config.maxPendingPerUser ?? 10,
      logger: config.logger ?? this.createDefaultLogger(),
      onConfirmationRequired: config.onConfirmationRequired ?? (() => {}),
    };
    this.logger = this.config.logger;
  }

  /**
   * Check if a tool requires confirmation
   */
  requiresConfirmation(tool: ToolDefinition): boolean {
    if (this.config.autoApproveForSafe && tool.confirmationType === 'none') {
      return false;
    }

    return tool.confirmationType !== 'none';
  }

  /**
   * Get the confirmation type for a tool
   */
  getConfirmationType(tool: ToolDefinition): ConfirmationType {
    return tool.confirmationType;
  }

  /**
   * Request confirmation for a tool execution
   */
  async requestConfirmation(
    userId: string,
    sessionId: string,
    tool: ToolDefinition,
    input: Record<string, unknown>,
    options: RequestConfirmationOptions = {}
  ): Promise<OrchestrationConfirmationRequest> {
    this.logger.info('Requesting confirmation', {
      userId,
      toolId: tool.id,
      confirmationType: tool.confirmationType,
    });

    // Check if user has too many pending confirmations
    const pending = await this.config.confirmationStore.getByUser(userId, {
      status: ['pending'],
    });

    if (pending.length >= this.config.maxPendingPerUser) {
      // Expire oldest pending
      const oldest = pending.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      await this.expireConfirmation(oldest.id);
    }

    // Calculate risk level
    const riskLevel = this.assessRiskLevel(tool, input);

    // Calculate expiry
    const expiryMs = options.expiryMs ?? this.config.defaultExpiryMs;
    const expiresAt = new Date(Date.now() + expiryMs);

    // Create confirmation request
    const request = await this.config.confirmationStore.create({
      userId,
      sessionId,
      toolId: tool.id,
      toolName: tool.name,
      toolDescription: tool.description,
      plannedInput: input,
      reasoning: options.reasoning ?? this.generateReasoning(tool, input),
      riskLevel,
      stepId: options.stepId ?? null,
      stepTitle: options.stepTitle ?? null,
      status: 'pending',
      expiresAt,
      respondedAt: null,
      approvedBy: null,
      rejectionReason: null,
    });

    // Notify
    this.config.onConfirmationRequired(request);

    this.logger.debug('Confirmation created', {
      confirmationId: request.id,
      riskLevel,
      expiresAt,
    });

    return request;
  }

  /**
   * Respond to a confirmation request
   */
  async respond(
    confirmationId: string,
    response: ConfirmationResponse
  ): Promise<OrchestrationConfirmationRequest> {
    this.logger.info('Processing confirmation response', {
      confirmationId,
      approved: response.approved,
    });

    const request = await this.config.confirmationStore.get(confirmationId);

    if (!request) {
      throw new Error(`Confirmation not found: ${confirmationId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Confirmation already processed: ${request.status}`);
    }

    // Check expiry
    if (new Date() > request.expiresAt) {
      await this.expireConfirmation(confirmationId);
      throw new Error('Confirmation has expired');
    }

    // Update the request
    const updatedRequest = await this.config.confirmationStore.respond(
      confirmationId,
      response
    );

    this.logger.info('Confirmation processed', {
      confirmationId,
      status: updatedRequest.status,
    });

    return updatedRequest;
  }

  /**
   * Approve a confirmation request
   */
  async approve(
    confirmationId: string,
    _approvedBy?: string,
    modifiedInput?: Record<string, unknown>
  ): Promise<OrchestrationConfirmationRequest> {
    return this.respond(confirmationId, {
      requestId: confirmationId,
      approved: true,
      modifiedInput,
    });
  }

  /**
   * Reject a confirmation request
   */
  async reject(
    confirmationId: string,
    reason?: string
  ): Promise<OrchestrationConfirmationRequest> {
    return this.respond(confirmationId, {
      requestId: confirmationId,
      approved: false,
      rejectionReason: reason,
    });
  }

  /**
   * Get pending confirmations for a user
   */
  async getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]> {
    const pending = await this.config.confirmationStore.getByUser(userId, {
      status: ['pending'],
    });

    // Filter out expired
    const now = new Date();
    const valid: OrchestrationConfirmationRequest[] = [];
    const expired: string[] = [];

    for (const request of pending) {
      if (now > request.expiresAt) {
        expired.push(request.id);
      } else {
        valid.push(request);
      }
    }

    // Expire old ones in background
    if (expired.length > 0) {
      Promise.all(expired.map(id => this.expireConfirmation(id))).catch(err => {
        this.logger.error('Failed to expire confirmations', err);
      });
    }

    return valid;
  }

  /**
   * Expire a confirmation request
   */
  async expireConfirmation(confirmationId: string): Promise<void> {
    await this.config.confirmationStore.update(confirmationId, {
      status: 'expired',
    });

    this.logger.debug('Confirmation expired', { confirmationId });
  }

  /**
   * Expire all old confirmations
   */
  async expireOldConfirmations(maxAgeMinutes?: number): Promise<number> {
    const minutes = maxAgeMinutes ?? Math.round(this.config.defaultExpiryMs / 60000);
    return this.config.confirmationStore.expireOld(minutes);
  }

  /**
   * Check if a confirmation is still valid
   */
  async isValid(confirmationId: string): Promise<boolean> {
    const request = await this.config.confirmationStore.get(confirmationId);

    if (!request) {
      return false;
    }

    if (request.status !== 'pending') {
      return false;
    }

    if (new Date() > request.expiresAt) {
      await this.expireConfirmation(confirmationId);
      return false;
    }

    return true;
  }

  /**
   * Get confirmation request by ID
   */
  async getConfirmation(confirmationId: string): Promise<OrchestrationConfirmationRequest | null> {
    return this.config.confirmationStore.get(confirmationId);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private assessRiskLevel(
    tool: ToolDefinition,
    _input: Record<string, unknown>
  ): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
    // Map confirmation type to risk level
    const riskMap: Record<ConfirmationType, 'safe' | 'low' | 'medium' | 'high' | 'critical'> = {
      none: 'safe',
      implicit: 'low',
      explicit: 'medium',
      critical: 'critical',
    };

    return riskMap[tool.confirmationType] ?? 'medium';
  }

  private generateReasoning(
    tool: ToolDefinition,
    _input: Record<string, unknown>
  ): string {
    switch (tool.confirmationType) {
      case 'critical':
        return `This action (${tool.name}) requires explicit confirmation as it may have significant impact.`;
      case 'explicit':
        return `Please confirm you want to proceed with ${tool.name}.`;
      case 'implicit':
        return `Proceeding with ${tool.name}. Cancel if this is not intended.`;
      default:
        return `Tool ${tool.name} execution planned.`;
    }
  }

  private createDefaultLogger(): OrchestrationLogger {
    return {
      debug: (_message: string, _data?: Record<string, unknown>) => {},
      info: (_message: string, _data?: Record<string, unknown>) => {},
      warn: (message: string, data?: Record<string, unknown>) => {
        console.warn(`[ConfirmationGate] ${message}`, data);
      },
      error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
        console.error(`[ConfirmationGate] ${message}`, error, data);
      },
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface RequestConfirmationOptions {
  reasoning?: string;
  stepId?: string;
  stepTitle?: string;
  expiryMs?: number;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createConfirmationGate(
  config: ConfirmationGateConfig
): ConfirmationGate {
  return new ConfirmationGate(config);
}
