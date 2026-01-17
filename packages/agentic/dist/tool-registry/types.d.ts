/**
 * @sam-ai/agentic - Tool Registry Types
 * Types for explicit tool registry with permissioned actions and audit logging
 */
import { z } from 'zod';
export declare const ToolCategory: {
    readonly CONTENT: "content";
    readonly ASSESSMENT: "assessment";
    readonly COMMUNICATION: "communication";
    readonly ANALYTICS: "analytics";
    readonly SYSTEM: "system";
    readonly EXTERNAL: "external";
};
export type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];
export declare const PermissionLevel: {
    readonly READ: "read";
    readonly WRITE: "write";
    readonly EXECUTE: "execute";
    readonly ADMIN: "admin";
};
export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];
export declare const ConfirmationType: {
    readonly NONE: "none";
    readonly IMPLICIT: "implicit";
    readonly EXPLICIT: "explicit";
    readonly CRITICAL: "critical";
};
export type ConfirmationType = (typeof ConfirmationType)[keyof typeof ConfirmationType];
export declare const AuditLogLevel: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly ERROR: "error";
    readonly CRITICAL: "critical";
};
export type AuditLogLevel = (typeof AuditLogLevel)[keyof typeof AuditLogLevel];
export declare const ToolExecutionStatus: {
    readonly PENDING: "pending";
    readonly AWAITING_CONFIRMATION: "awaiting_confirmation";
    readonly EXECUTING: "executing";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly DENIED: "denied";
    readonly CANCELLED: "cancelled";
    readonly TIMEOUT: "timeout";
};
export type ToolExecutionStatus = (typeof ToolExecutionStatus)[keyof typeof ToolExecutionStatus];
export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ToolCategory;
    version: string;
    inputSchema: z.ZodType<unknown>;
    outputSchema?: z.ZodType<unknown>;
    requiredPermissions: PermissionLevel[];
    confirmationType: ConfirmationType;
    handler: ToolHandler;
    timeoutMs?: number;
    maxRetries?: number;
    rateLimit?: RateLimit;
    tags?: string[];
    examples?: ToolExample[];
    metadata?: Record<string, unknown>;
    enabled: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
}
export interface RateLimit {
    maxCalls: number;
    windowMs: number;
    scope: 'global' | 'user' | 'session';
}
export interface ToolExample {
    name: string;
    description: string;
    input: unknown;
    expectedOutput?: unknown;
}
export type ToolHandler = (input: unknown, context: ToolExecutionContext) => Promise<ToolExecutionResult>;
export interface ToolExecutionContext {
    userId: string;
    sessionId: string;
    requestId: string;
    grantedPermissions: PermissionLevel[];
    userConfirmed: boolean;
    previousCalls: ToolCallSummary[];
    metadata?: Record<string, unknown>;
}
export interface ToolCallSummary {
    toolId: string;
    timestamp: Date;
    success: boolean;
    outputSummary?: string;
}
export interface ToolExecutionResult {
    success: boolean;
    output?: unknown;
    error?: ToolError;
    metadata?: Record<string, unknown>;
}
export interface ToolError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
}
export interface ToolInvocation {
    id: string;
    toolId: string;
    userId: string;
    sessionId: string;
    input: unknown;
    validatedInput?: unknown;
    status: ToolExecutionStatus;
    confirmationType: ConfirmationType;
    confirmationPrompt?: string;
    userConfirmed?: boolean;
    confirmedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    result?: ToolExecutionResult;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    level: AuditLogLevel;
    userId: string;
    sessionId: string;
    action: AuditAction;
    toolId?: string;
    invocationId?: string;
    input?: unknown;
    output?: unknown;
    error?: ToolError;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
}
export type AuditAction = 'tool_registered' | 'tool_updated' | 'tool_disabled' | 'tool_enabled' | 'tool_invoked' | 'confirmation_requested' | 'confirmation_granted' | 'confirmation_denied' | 'execution_started' | 'execution_success' | 'execution_failed' | 'execution_timeout' | 'permission_denied' | 'rate_limit_exceeded';
export interface UserPermission {
    userId: string;
    toolId?: string;
    category?: ToolCategory;
    levels: PermissionLevel[];
    grantedBy?: string;
    grantedAt: Date;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
}
export interface PermissionCondition {
    type: 'time_of_day' | 'day_of_week' | 'max_calls' | 'input_match';
    value: unknown;
}
export interface PermissionCheckResult {
    granted: boolean;
    grantedLevels: PermissionLevel[];
    missingLevels: PermissionLevel[];
    reason?: string;
}
export interface ConfirmationRequest {
    id: string;
    invocationId: string;
    toolId: string;
    toolName: string;
    userId: string;
    title: string;
    message: string;
    details?: ConfirmationDetail[];
    type: ConfirmationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confirmText?: string;
    cancelText?: string;
    timeout?: number;
    status: 'pending' | 'confirmed' | 'denied' | 'expired';
    respondedAt?: Date;
    createdAt: Date;
    expiresAt?: Date;
}
export interface ConfirmationDetail {
    label: string;
    value: string;
    type: 'text' | 'code' | 'json' | 'warning';
}
export interface ToolQueryOptions {
    category?: ToolCategory;
    tags?: string[];
    enabled?: boolean;
    deprecated?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface AuditQueryOptions {
    userId?: string;
    toolId?: string;
    action?: AuditAction[];
    level?: AuditLogLevel[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare const ToolCategorySchema: z.ZodEnum<["content", "assessment", "communication", "analytics", "system", "external"]>;
export declare const PermissionLevelSchema: z.ZodEnum<["read", "write", "execute", "admin"]>;
export declare const ConfirmationTypeSchema: z.ZodEnum<["none", "implicit", "explicit", "critical"]>;
export declare const ToolExecutionStatusSchema: z.ZodEnum<["pending", "awaiting_confirmation", "executing", "success", "failed", "denied", "cancelled", "timeout"]>;
export declare const RateLimitSchema: z.ZodObject<{
    maxCalls: z.ZodNumber;
    windowMs: z.ZodNumber;
    scope: z.ZodEnum<["global", "user", "session"]>;
}, "strip", z.ZodTypeAny, {
    maxCalls: number;
    windowMs: number;
    scope: "user" | "global" | "session";
}, {
    maxCalls: number;
    windowMs: number;
    scope: "user" | "global" | "session";
}>;
export declare const ToolExampleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    input: z.ZodUnknown;
    expectedOutput: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    input?: unknown;
    expectedOutput?: unknown;
}, {
    description: string;
    name: string;
    input?: unknown;
    expectedOutput?: unknown;
}>;
export declare const RegisterToolInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["content", "assessment", "communication", "analytics", "system", "external"]>;
    version: z.ZodString;
    requiredPermissions: z.ZodArray<z.ZodEnum<["read", "write", "execute", "admin"]>, "many">;
    confirmationType: z.ZodEnum<["none", "implicit", "explicit", "critical"]>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        maxCalls: z.ZodNumber;
        windowMs: z.ZodNumber;
        scope: z.ZodEnum<["global", "user", "session"]>;
    }, "strip", z.ZodTypeAny, {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    }, {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    examples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        input: z.ZodUnknown;
        expectedOutput: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }, {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }>, "many">>;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    category: "content" | "assessment" | "system" | "communication" | "analytics" | "external";
    version: string;
    requiredPermissions: ("read" | "write" | "execute" | "admin")[];
    confirmationType: "critical" | "none" | "implicit" | "explicit";
    enabled: boolean;
    tags?: string[] | undefined;
    maxRetries?: number | undefined;
    timeoutMs?: number | undefined;
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    } | undefined;
    examples?: {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }[] | undefined;
}, {
    description: string;
    name: string;
    category: "content" | "assessment" | "system" | "communication" | "analytics" | "external";
    version: string;
    requiredPermissions: ("read" | "write" | "execute" | "admin")[];
    confirmationType: "critical" | "none" | "implicit" | "explicit";
    tags?: string[] | undefined;
    maxRetries?: number | undefined;
    timeoutMs?: number | undefined;
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    } | undefined;
    examples?: {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }[] | undefined;
    enabled?: boolean | undefined;
}>;
export declare const InvokeToolInputSchema: z.ZodObject<{
    toolId: z.ZodString;
    input: z.ZodUnknown;
    sessionId: z.ZodString;
    skipConfirmation: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    toolId: string;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    input?: unknown;
    skipConfirmation?: boolean | undefined;
}, {
    toolId: string;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    input?: unknown;
    skipConfirmation?: boolean | undefined;
}>;
export interface ToolStore {
    register(tool: ToolDefinition): Promise<void>;
    get(toolId: string): Promise<ToolDefinition | null>;
    list(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    delete(toolId: string): Promise<void>;
    enable(toolId: string): Promise<void>;
    disable(toolId: string): Promise<void>;
}
export interface InvocationStore {
    create(invocation: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolInvocation>;
    get(invocationId: string): Promise<ToolInvocation | null>;
    update(invocationId: string, updates: Partial<ToolInvocation>): Promise<ToolInvocation>;
    getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]>;
    getByUser(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ToolInvocation[]>;
}
export interface AuditStore {
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    count(options: AuditQueryOptions): Promise<number>;
}
export interface PermissionStore {
    grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission>;
    revoke(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    check(userId: string, toolId: string, requiredLevels: PermissionLevel[]): Promise<PermissionCheckResult>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
}
export interface ConfirmationStore {
    create(request: Omit<ConfirmationRequest, 'id' | 'createdAt'>): Promise<ConfirmationRequest>;
    get(requestId: string): Promise<ConfirmationRequest | null>;
    getByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    getPending(userId: string): Promise<ConfirmationRequest[]>;
}
//# sourceMappingURL=types.d.ts.map