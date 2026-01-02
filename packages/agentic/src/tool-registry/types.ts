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
} as const;

export type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];

export const PermissionLevel = {
  READ: 'read',
  WRITE: 'write',
  EXECUTE: 'execute',
  ADMIN: 'admin',
} as const;

export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];

export const ConfirmationType = {
  NONE: 'none',
  IMPLICIT: 'implicit',
  EXPLICIT: 'explicit',
  CRITICAL: 'critical',
} as const;

export type ConfirmationType = (typeof ConfirmationType)[keyof typeof ConfirmationType];

export const AuditLogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type AuditLogLevel = (typeof AuditLogLevel)[keyof typeof AuditLogLevel];

export const ToolExecutionStatus = {
  PENDING: 'pending',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  FAILED: 'failed',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
} as const;

export type ToolExecutionStatus = (typeof ToolExecutionStatus)[keyof typeof ToolExecutionStatus];

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;

  // Input/Output schema
  inputSchema: z.ZodType<unknown>;
  outputSchema?: z.ZodType<unknown>;

  // Permissions
  requiredPermissions: PermissionLevel[];
  confirmationType: ConfirmationType;

  // Execution
  handler: ToolHandler;
  timeoutMs?: number;
  maxRetries?: number;

  // Rate limiting
  rateLimit?: RateLimit;

  // Metadata
  tags?: string[];
  examples?: ToolExample[];
  metadata?: Record<string, unknown>;

  // Lifecycle
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

// ============================================================================
// TOOL HANDLER
// ============================================================================

export type ToolHandler = (
  input: unknown,
  context: ToolExecutionContext
) => Promise<ToolExecutionResult>;

export interface ToolExecutionContext {
  userId: string;
  sessionId: string;
  requestId: string;

  // Permissions granted to this execution
  grantedPermissions: PermissionLevel[];

  // User confirmation status
  userConfirmed: boolean;

  // Previous tool calls in this session
  previousCalls: ToolCallSummary[];

  // Additional context
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

// ============================================================================
// TOOL INVOCATION
// ============================================================================

export interface ToolInvocation {
  id: string;
  toolId: string;
  userId: string;
  sessionId: string;

  // Input
  input: unknown;
  validatedInput?: unknown;

  // Status
  status: ToolExecutionStatus;

  // Confirmation
  confirmationType: ConfirmationType;
  confirmationPrompt?: string;
  userConfirmed?: boolean;
  confirmedAt?: Date;

  // Execution
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // ms

  // Result
  result?: ToolExecutionResult;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  level: AuditLogLevel;

  // Actor
  userId: string;
  sessionId: string;

  // Action
  action: AuditAction;
  toolId?: string;
  invocationId?: string;

  // Details
  input?: unknown;
  output?: unknown;
  error?: ToolError;

  // Context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}

export type AuditAction =
  | 'tool_registered'
  | 'tool_updated'
  | 'tool_disabled'
  | 'tool_enabled'
  | 'tool_invoked'
  | 'confirmation_requested'
  | 'confirmation_granted'
  | 'confirmation_denied'
  | 'execution_started'
  | 'execution_success'
  | 'execution_failed'
  | 'execution_timeout'
  | 'permission_denied'
  | 'rate_limit_exceeded';

// ============================================================================
// PERMISSION
// ============================================================================

export interface UserPermission {
  userId: string;
  toolId?: string; // Specific tool, or all tools if undefined
  category?: ToolCategory; // Specific category, or all if undefined
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

// ============================================================================
// CONFIRMATION
// ============================================================================

export interface ConfirmationRequest {
  id: string;
  invocationId: string;
  toolId: string;
  toolName: string;
  userId: string;

  // Display
  title: string;
  message: string;
  details?: ConfirmationDetail[];

  // Type
  type: ConfirmationType;
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Options
  confirmText?: string;
  cancelText?: string;
  timeout?: number; // seconds

  // Status
  status: 'pending' | 'confirmed' | 'denied' | 'expired';
  respondedAt?: Date;

  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
}

export interface ConfirmationDetail {
  label: string;
  value: string;
  type: 'text' | 'code' | 'json' | 'warning';
}

// ============================================================================
// REGISTRY QUERY
// ============================================================================

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

// ============================================================================
// STORE INTERFACES
// ============================================================================

export interface ToolStore {
  // Tool CRUD
  register(tool: ToolDefinition): Promise<void>;
  get(toolId: string): Promise<ToolDefinition | null>;
  list(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
  update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
  delete(toolId: string): Promise<void>;

  // Enable/Disable
  enable(toolId: string): Promise<void>;
  disable(toolId: string): Promise<void>;
}

export interface InvocationStore {
  create(invocation: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolInvocation>;
  get(invocationId: string): Promise<ToolInvocation | null>;
  update(invocationId: string, updates: Partial<ToolInvocation>): Promise<ToolInvocation>;
  getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]>;
  getByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<ToolInvocation[]>;
}

export interface AuditStore {
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
  query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
  count(options: AuditQueryOptions): Promise<number>;
}

export interface PermissionStore {
  grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission>;
  revoke(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
  check(
    userId: string,
    toolId: string,
    requiredLevels: PermissionLevel[]
  ): Promise<PermissionCheckResult>;
  getUserPermissions(userId: string): Promise<UserPermission[]>;
}

export interface ConfirmationStore {
  create(request: Omit<ConfirmationRequest, 'id' | 'createdAt'>): Promise<ConfirmationRequest>;
  get(requestId: string): Promise<ConfirmationRequest | null>;
  getByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
  respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
  getPending(userId: string): Promise<ConfirmationRequest[]>;
}
