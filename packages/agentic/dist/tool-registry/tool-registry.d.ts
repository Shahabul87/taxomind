/**
 * @sam-ai/agentic - Tool Registry
 * Central registry for managing tool execution with permissions and audit logging
 */
import type { SAMLogger } from '@sam-ai/core';
import { type ToolDefinition, type ToolInvocation, type ToolStore, type InvocationStore, type AuditStore, type PermissionStore, type ConfirmationStore, type ConfirmationRequest, type ToolQueryOptions } from './types';
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
export declare class ToolRegistry {
    private readonly toolStore;
    private readonly invocationStore;
    private readonly auditStore;
    private readonly permissionStore;
    private readonly confirmationStore;
    private readonly logger;
    private readonly defaultTimeoutMs;
    private readonly enableAuditLogging;
    private readonly rateLimitEnabled;
    private readonly rateLimitStates;
    constructor(config: ToolRegistryConfig);
    /**
     * Register a new tool
     */
    register(tool: ToolDefinition): Promise<void>;
    /**
     * Update an existing tool
     */
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    /**
     * Get a tool by ID
     */
    getTool(toolId: string): Promise<ToolDefinition | null>;
    /**
     * List tools with optional filtering
     */
    listTools(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    /**
     * Enable a tool
     */
    enableTool(toolId: string): Promise<void>;
    /**
     * Disable a tool
     */
    disableTool(toolId: string): Promise<void>;
    /**
     * Invoke a tool
     */
    invoke(toolId: string, input: unknown, context: {
        userId: string;
        sessionId: string;
        skipConfirmation?: boolean;
        metadata?: Record<string, unknown>;
    }): Promise<ToolInvocation>;
    /**
     * Respond to a confirmation request
     */
    respondToConfirmation(confirmationId: string, confirmed: boolean, userId: string): Promise<ToolInvocation>;
    /**
     * Get pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<ConfirmationRequest[]>;
    private validateToolDefinition;
    private validateInput;
    private requiresConfirmation;
    private requestConfirmation;
    private generateConfirmationMessage;
    private getConfirmationSeverity;
    private executeTool;
    private executeWithTimeout;
    private getPreviousCalls;
    private getRateLimitKey;
    private checkRateLimit;
    private audit;
    private generateId;
}
export declare function createToolRegistry(config: ToolRegistryConfig): ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map