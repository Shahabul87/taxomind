/**
 * @sam-ai/agentic - Confirmation Manager
 * Handles user confirmations for tool execution with different severity levels
 */
import type { ConfirmationStore, ConfirmationRequest, ConfirmationDetail, ConfirmationType, ToolDefinition, ToolInvocation } from './types';
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
/**
 * ConfirmationManager handles user confirmations for tool execution
 * with different severity levels and timeout handling.
 */
export declare class ConfirmationManager {
    private readonly store;
    private readonly logger;
    private readonly defaultTimeoutSeconds;
    private readonly onConfirmationRequested?;
    private readonly onConfirmationResolved?;
    private readonly pendingWaits;
    constructor(config: ConfirmationManagerConfig);
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool: ToolDefinition): boolean;
    /**
     * Check if a confirmation type requires explicit user action
     */
    requiresExplicitConfirmation(type: ConfirmationType): boolean;
    /**
     * Get the severity level for a confirmation type
     */
    getSeverityForType(type: ConfirmationType): ConfirmationRequest['severity'];
    /**
     * Create a confirmation request for a tool invocation
     */
    createConfirmationRequest(invocation: ToolInvocation, tool: ToolDefinition, options?: CreateConfirmationOptions): Promise<ConfirmationRequest>;
    /**
     * Get a confirmation request by ID
     */
    getRequest(requestId: string): Promise<ConfirmationRequest | null>;
    /**
     * Get confirmation request for an invocation
     */
    getRequestByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    /**
     * Get pending confirmation requests for a user
     */
    getPendingRequests(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Respond to a confirmation request
     */
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    /**
     * Confirm a request (shorthand for respond(id, true))
     */
    confirm(requestId: string): Promise<ConfirmationRequest>;
    /**
     * Deny a request (shorthand for respond(id, false))
     */
    deny(requestId: string): Promise<ConfirmationRequest>;
    /**
     * Auto-confirm an implicit confirmation
     */
    autoConfirmImplicit(invocation: ToolInvocation, tool: ToolDefinition): Promise<ConfirmationRequest | null>;
    /**
     * Wait for a confirmation response with timeout
     */
    waitForConfirmation(requestId: string, timeoutMs?: number): Promise<ConfirmationWaitResult>;
    /**
     * Wait for confirmation on an invocation
     */
    waitForInvocationConfirmation(invocationId: string, timeoutMs?: number): Promise<ConfirmationWaitResult | null>;
    /**
     * Confirm all pending requests for a user
     */
    confirmAllPending(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Deny all pending requests for a user
     */
    denyAllPending(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Cancel pending waits for a user (without resolving them)
     */
    cancelPendingWaits(userId?: string): void;
    /**
     * Format a message template with tool and invocation data
     */
    private formatMessage;
    /**
     * Generate an action description from tool and input
     */
    private generateActionDescription;
    /**
     * Generate default details for a confirmation request
     */
    private generateDefaultDetails;
    /**
     * Check if a request has expired
     */
    isExpired(request: ConfirmationRequest): boolean;
    /**
     * Get remaining time for a confirmation request (in seconds)
     */
    getRemainingTime(request: ConfirmationRequest): number;
}
/**
 * Create a new ConfirmationManager instance
 */
export declare function createConfirmationManager(config: ConfirmationManagerConfig): ConfirmationManager;
//# sourceMappingURL=confirmation-manager.d.ts.map