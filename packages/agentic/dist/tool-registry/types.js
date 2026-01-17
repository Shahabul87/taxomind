/**
 * @sam-ai/agentic - Tool Registry Types
 * Types for explicit tool registry with permissioned actions and audit logging
 */
import { z } from 'zod';
// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================
export const ToolCategory = {
    CONTENT: 'content',
    ASSESSMENT: 'assessment',
    COMMUNICATION: 'communication',
    ANALYTICS: 'analytics',
    SYSTEM: 'system',
    EXTERNAL: 'external',
};
export const PermissionLevel = {
    READ: 'read',
    WRITE: 'write',
    EXECUTE: 'execute',
    ADMIN: 'admin',
};
export const ConfirmationType = {
    NONE: 'none',
    IMPLICIT: 'implicit',
    EXPLICIT: 'explicit',
    CRITICAL: 'critical',
};
export const AuditLogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
};
export const ToolExecutionStatus = {
    PENDING: 'pending',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    EXECUTING: 'executing',
    SUCCESS: 'success',
    FAILED: 'failed',
    DENIED: 'denied',
    CANCELLED: 'cancelled',
    TIMEOUT: 'timeout',
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const ToolCategorySchema = z.enum([
    'content',
    'assessment',
    'communication',
    'analytics',
    'system',
    'external',
]);
export const PermissionLevelSchema = z.enum(['read', 'write', 'execute', 'admin']);
export const ConfirmationTypeSchema = z.enum(['none', 'implicit', 'explicit', 'critical']);
export const ToolExecutionStatusSchema = z.enum([
    'pending',
    'awaiting_confirmation',
    'executing',
    'success',
    'failed',
    'denied',
    'cancelled',
    'timeout',
]);
export const RateLimitSchema = z.object({
    maxCalls: z.number().int().min(1),
    windowMs: z.number().int().min(1000),
    scope: z.enum(['global', 'user', 'session']),
});
export const ToolExampleSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    input: z.unknown(),
    expectedOutput: z.unknown().optional(),
});
export const RegisterToolInputSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    category: ToolCategorySchema,
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    requiredPermissions: z.array(PermissionLevelSchema).min(1),
    confirmationType: ConfirmationTypeSchema,
    timeoutMs: z.number().int().min(1000).max(300000).optional(),
    maxRetries: z.number().int().min(0).max(5).optional(),
    rateLimit: RateLimitSchema.optional(),
    tags: z.array(z.string()).optional(),
    examples: z.array(ToolExampleSchema).optional(),
    enabled: z.boolean().optional().default(true),
});
export const InvokeToolInputSchema = z.object({
    toolId: z.string().min(1),
    input: z.unknown(),
    sessionId: z.string().min(1),
    skipConfirmation: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map