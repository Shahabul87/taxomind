/**
 * @sam-ai/agentic - Confirmation Gate
 * User confirmation handling for high-impact tool usage
 */
import type { OrchestrationConfirmationRequest, ConfirmationResponse, OrchestrationConfirmationRequestStore, OrchestrationLogger } from './types';
import type { ToolDefinition, ConfirmationType } from '../tool-registry/types';
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
export declare class ConfirmationGate {
    private readonly config;
    private readonly logger;
    constructor(config: ConfirmationGateConfig);
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool: ToolDefinition): boolean;
    /**
     * Get the confirmation type for a tool
     */
    getConfirmationType(tool: ToolDefinition): ConfirmationType;
    /**
     * Request confirmation for a tool execution
     */
    requestConfirmation(userId: string, sessionId: string, tool: ToolDefinition, input: Record<string, unknown>, options?: RequestConfirmationOptions): Promise<OrchestrationConfirmationRequest>;
    /**
     * Respond to a confirmation request
     */
    respond(confirmationId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
    /**
     * Approve a confirmation request
     */
    approve(confirmationId: string, _approvedBy?: string, modifiedInput?: Record<string, unknown>): Promise<OrchestrationConfirmationRequest>;
    /**
     * Reject a confirmation request
     */
    reject(confirmationId: string, reason?: string): Promise<OrchestrationConfirmationRequest>;
    /**
     * Get pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]>;
    /**
     * Expire a confirmation request
     */
    expireConfirmation(confirmationId: string): Promise<void>;
    /**
     * Expire all old confirmations
     */
    expireOldConfirmations(maxAgeMinutes?: number): Promise<number>;
    /**
     * Check if a confirmation is still valid
     */
    isValid(confirmationId: string): Promise<boolean>;
    /**
     * Get confirmation request by ID
     */
    getConfirmation(confirmationId: string): Promise<OrchestrationConfirmationRequest | null>;
    private assessRiskLevel;
    private generateReasoning;
    private createDefaultLogger;
}
interface RequestConfirmationOptions {
    reasoning?: string;
    stepId?: string;
    stepTitle?: string;
    expiryMs?: number;
}
export declare function createConfirmationGate(config: ConfirmationGateConfig): ConfirmationGate;
export {};
//# sourceMappingURL=confirmation-gate.d.ts.map