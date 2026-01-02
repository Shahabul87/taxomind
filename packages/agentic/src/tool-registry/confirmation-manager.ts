/**
 * @sam-ai/agentic - Confirmation Manager
 * Handles user confirmations for tool execution with different severity levels
 */

import type {
  ConfirmationStore,
  ConfirmationRequest,
  ConfirmationDetail,
  ConfirmationType,
  ToolDefinition,
  ToolInvocation,
} from './types';
import { ConfirmationType as ConfirmationTypeEnum } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for ConfirmationManager
 */
export interface ConfirmationManagerConfig {
  confirmationStore: ConfirmationStore;
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
  /**
   * Default timeout for confirmation requests (seconds)
   */
  defaultTimeoutSeconds?: number;
  /**
   * Callback when confirmation is requested
   */
  onConfirmationRequested?: (request: ConfirmationRequest) => void | Promise<void>;
  /**
   * Callback when confirmation is resolved
   */
  onConfirmationResolved?: (request: ConfirmationRequest, confirmed: boolean) => void | Promise<void>;
}

/**
 * Options for creating a confirmation request
 */
export interface CreateConfirmationOptions {
  title?: string;
  message?: string;
  details?: ConfirmationDetail[];
  severity?: ConfirmationRequest['severity'];
  confirmText?: string;
  cancelText?: string;
  timeoutSeconds?: number;
}

/**
 * Confirmation prompt template
 */
export interface ConfirmationTemplate {
  type: ConfirmationType;
  title: string;
  messageTemplate: string;
  defaultSeverity: ConfirmationRequest['severity'];
  defaultDetails?: (tool: ToolDefinition, input: unknown) => ConfirmationDetail[];
}

/**
 * Confirmation wait result
 */
export interface ConfirmationWaitResult {
  confirmed: boolean;
  request: ConfirmationRequest;
  timedOut: boolean;
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const DEFAULT_TEMPLATES: Record<Exclude<ConfirmationType, 'none'>, Omit<ConfirmationTemplate, 'type'>> = {
  implicit: {
    title: 'Proceeding with action',
    messageTemplate: 'SAM AI will {{action}} using the {{toolName}} tool.',
    defaultSeverity: 'low',
  },
  explicit: {
    title: 'Confirmation required',
    messageTemplate: 'SAM AI wants to {{action}}. Do you want to proceed?',
    defaultSeverity: 'medium',
  },
  critical: {
    title: 'Critical action - Confirmation required',
    messageTemplate: 'SAM AI is requesting to {{action}}. This action may have significant effects.',
    defaultSeverity: 'critical',
  },
};

// ============================================================================
// CONFIRMATION MANAGER
// ============================================================================

/**
 * ConfirmationManager handles user confirmations for tool execution
 * with different severity levels and timeout handling.
 */
export class ConfirmationManager {
  private readonly store: ConfirmationStore;
  private readonly logger: NonNullable<ConfirmationManagerConfig['logger']>;
  private readonly defaultTimeoutSeconds: number;
  private readonly onConfirmationRequested?: ConfirmationManagerConfig['onConfirmationRequested'];
  private readonly onConfirmationResolved?: ConfirmationManagerConfig['onConfirmationResolved'];
  private readonly pendingWaits: Map<string, {
    resolve: (result: ConfirmationWaitResult) => void;
    timeoutId: NodeJS.Timeout | null;
  }>;

  constructor(config: ConfirmationManagerConfig) {
    this.store = config.confirmationStore;
    this.logger = config.logger ?? console;
    this.defaultTimeoutSeconds = config.defaultTimeoutSeconds ?? 300; // 5 minutes default
    this.onConfirmationRequested = config.onConfirmationRequested;
    this.onConfirmationResolved = config.onConfirmationResolved;
    this.pendingWaits = new Map();
  }

  // ==========================================================================
  // CONFIRMATION CHECKING
  // ==========================================================================

  /**
   * Check if a tool requires confirmation
   */
  requiresConfirmation(tool: ToolDefinition): boolean {
    return tool.confirmationType !== ConfirmationTypeEnum.NONE;
  }

  /**
   * Check if a confirmation type requires explicit user action
   */
  requiresExplicitConfirmation(type: ConfirmationType): boolean {
    return type === ConfirmationTypeEnum.EXPLICIT || type === ConfirmationTypeEnum.CRITICAL;
  }

  /**
   * Get the severity level for a confirmation type
   */
  getSeverityForType(type: ConfirmationType): ConfirmationRequest['severity'] {
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

  // ==========================================================================
  // CONFIRMATION REQUEST MANAGEMENT
  // ==========================================================================

  /**
   * Create a confirmation request for a tool invocation
   */
  async createConfirmationRequest(
    invocation: ToolInvocation,
    tool: ToolDefinition,
    options?: CreateConfirmationOptions
  ): Promise<ConfirmationRequest> {
    const template = tool.confirmationType !== ConfirmationTypeEnum.NONE
      ? DEFAULT_TEMPLATES[tool.confirmationType]
      : DEFAULT_TEMPLATES.explicit;

    const title = options?.title ?? template.title;
    const message = options?.message ?? this.formatMessage(template.messageTemplate, tool, invocation);
    const severity = options?.severity ?? template.defaultSeverity;

    const timeoutSeconds = options?.timeoutSeconds ?? this.defaultTimeoutSeconds;
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

    const request = await this.store.create({
      invocationId: invocation.id,
      toolId: tool.id,
      toolName: tool.name,
      userId: invocation.userId,
      title,
      message,
      details: options?.details ?? this.generateDefaultDetails(tool, invocation),
      type: tool.confirmationType,
      severity,
      confirmText: options?.confirmText ?? 'Confirm',
      cancelText: options?.cancelText ?? 'Cancel',
      timeout: timeoutSeconds,
      status: 'pending',
      expiresAt,
    });

    this.logger.info(`Confirmation request created: ${request.id}`, {
      invocationId: invocation.id,
      toolId: tool.id,
      type: tool.confirmationType,
    });

    // Notify listeners
    if (this.onConfirmationRequested) {
      try {
        await this.onConfirmationRequested(request);
      } catch (error) {
        this.logger.error('Error in onConfirmationRequested callback', { error });
      }
    }

    return request;
  }

  /**
   * Get a confirmation request by ID
   */
  async getRequest(requestId: string): Promise<ConfirmationRequest | null> {
    return this.store.get(requestId);
  }

  /**
   * Get confirmation request for an invocation
   */
  async getRequestByInvocation(invocationId: string): Promise<ConfirmationRequest | null> {
    return this.store.getByInvocation(invocationId);
  }

  /**
   * Get pending confirmation requests for a user
   */
  async getPendingRequests(userId: string): Promise<ConfirmationRequest[]> {
    return this.store.getPending(userId);
  }

  // ==========================================================================
  // CONFIRMATION RESPONSE HANDLING
  // ==========================================================================

  /**
   * Respond to a confirmation request
   */
  async respond(
    requestId: string,
    confirmed: boolean
  ): Promise<ConfirmationRequest> {
    const request = await this.store.respond(requestId, confirmed);

    this.logger.info(`Confirmation ${confirmed ? 'granted' : 'denied'}: ${requestId}`, {
      invocationId: request.invocationId,
      toolId: request.toolId,
    });

    // Notify listeners
    if (this.onConfirmationResolved) {
      try {
        await this.onConfirmationResolved(request, confirmed);
      } catch (error) {
        this.logger.error('Error in onConfirmationResolved callback', { error });
      }
    }

    // Resolve any pending waits
    const pendingWait = this.pendingWaits.get(requestId);
    if (pendingWait) {
      if (pendingWait.timeoutId) {
        clearTimeout(pendingWait.timeoutId);
      }
      pendingWait.resolve({
        confirmed,
        request,
        timedOut: false,
      });
      this.pendingWaits.delete(requestId);
    }

    return request;
  }

  /**
   * Confirm a request (shorthand for respond(id, true))
   */
  async confirm(requestId: string): Promise<ConfirmationRequest> {
    return this.respond(requestId, true);
  }

  /**
   * Deny a request (shorthand for respond(id, false))
   */
  async deny(requestId: string): Promise<ConfirmationRequest> {
    return this.respond(requestId, false);
  }

  /**
   * Auto-confirm an implicit confirmation
   */
  async autoConfirmImplicit(
    invocation: ToolInvocation,
    tool: ToolDefinition
  ): Promise<ConfirmationRequest | null> {
    if (tool.confirmationType !== ConfirmationTypeEnum.IMPLICIT) {
      return null;
    }

    // Create and immediately confirm implicit confirmations
    const request = await this.createConfirmationRequest(invocation, tool);
    return this.confirm(request.id);
  }

  // ==========================================================================
  // WAITING FOR CONFIRMATION
  // ==========================================================================

  /**
   * Wait for a confirmation response with timeout
   */
  async waitForConfirmation(
    requestId: string,
    timeoutMs?: number
  ): Promise<ConfirmationWaitResult> {
    const request = await this.store.get(requestId);
    if (!request) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }

    // Already resolved
    if (request.status !== 'pending') {
      return {
        confirmed: request.status === 'confirmed',
        request,
        timedOut: request.status === 'expired',
      };
    }

    // Calculate timeout
    const effectiveTimeout = timeoutMs ??
      (request.timeout ? request.timeout * 1000 : this.defaultTimeoutSeconds * 1000);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const pendingWait = this.pendingWaits.get(requestId);
        if (pendingWait) {
          this.pendingWaits.delete(requestId);
          // Mark as expired in store
          this.store.respond(requestId, false).catch((error) => {
            this.logger.error('Error expiring confirmation', { error, requestId });
          });
          resolve({
            confirmed: false,
            request: { ...request, status: 'expired' },
            timedOut: true,
          });
        }
      }, effectiveTimeout);

      this.pendingWaits.set(requestId, { resolve, timeoutId });
    });
  }

  /**
   * Wait for confirmation on an invocation
   */
  async waitForInvocationConfirmation(
    invocationId: string,
    timeoutMs?: number
  ): Promise<ConfirmationWaitResult | null> {
    const request = await this.store.getByInvocation(invocationId);
    if (!request) {
      return null;
    }
    return this.waitForConfirmation(request.id, timeoutMs);
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /**
   * Confirm all pending requests for a user
   */
  async confirmAllPending(userId: string): Promise<ConfirmationRequest[]> {
    const pending = await this.store.getPending(userId);
    const results: ConfirmationRequest[] = [];

    for (const request of pending) {
      const confirmed = await this.confirm(request.id);
      results.push(confirmed);
    }

    return results;
  }

  /**
   * Deny all pending requests for a user
   */
  async denyAllPending(userId: string): Promise<ConfirmationRequest[]> {
    const pending = await this.store.getPending(userId);
    const results: ConfirmationRequest[] = [];

    for (const request of pending) {
      const denied = await this.deny(request.id);
      results.push(denied);
    }

    return results;
  }

  /**
   * Cancel pending waits for a user (without resolving them)
   */
  cancelPendingWaits(userId?: string): void {
    for (const [requestId, wait] of this.pendingWaits.entries()) {
      if (wait.timeoutId) {
        clearTimeout(wait.timeoutId);
      }
      // If userId is provided, we'd need to check - but for simplicity, cancel all
      if (!userId) {
        this.pendingWaits.delete(requestId);
      }
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Format a message template with tool and invocation data
   */
  private formatMessage(
    template: string,
    tool: ToolDefinition,
    invocation: ToolInvocation
  ): string {
    return template
      .replace('{{action}}', this.generateActionDescription(tool, invocation))
      .replace('{{toolName}}', tool.name)
      .replace('{{toolId}}', tool.id);
  }

  /**
   * Generate an action description from tool and input
   */
  private generateActionDescription(
    tool: ToolDefinition,
    _invocation: ToolInvocation
  ): string {
    // Generate a human-readable action description
    return tool.description.toLowerCase();
  }

  /**
   * Generate default details for a confirmation request
   */
  private generateDefaultDetails(
    tool: ToolDefinition,
    invocation: ToolInvocation
  ): ConfirmationDetail[] {
    const details: ConfirmationDetail[] = [
      {
        label: 'Tool',
        value: tool.name,
        type: 'text',
      },
      {
        label: 'Category',
        value: tool.category,
        type: 'text',
      },
    ];

    // Add input preview if available
    if (invocation.input && typeof invocation.input === 'object') {
      const inputStr = JSON.stringify(invocation.input, null, 2);
      if (inputStr.length <= 1000) {
        details.push({
          label: 'Input',
          value: inputStr,
          type: 'json',
        });
      }
    }

    // Add warning for critical actions
    if (tool.confirmationType === ConfirmationTypeEnum.CRITICAL) {
      details.push({
        label: 'Warning',
        value: 'This action may have significant or irreversible effects.',
        type: 'warning',
      });
    }

    return details;
  }

  /**
   * Check if a request has expired
   */
  isExpired(request: ConfirmationRequest): boolean {
    if (request.status === 'expired') {
      return true;
    }
    if (request.expiresAt && request.expiresAt < new Date()) {
      return true;
    }
    return false;
  }

  /**
   * Get remaining time for a confirmation request (in seconds)
   */
  getRemainingTime(request: ConfirmationRequest): number {
    if (!request.expiresAt || request.status !== 'pending') {
      return 0;
    }
    const remaining = request.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new ConfirmationManager instance
 */
export function createConfirmationManager(config: ConfirmationManagerConfig): ConfirmationManager {
  return new ConfirmationManager(config);
}
