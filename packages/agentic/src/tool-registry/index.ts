/**
 * @sam-ai/agentic - Tool Registry Module
 * Explicit tool registry with permissioned actions and audit logging
 */

// ============================================================================
// TYPES
// ============================================================================

export {
  // Enums
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
  AuditLogLevel,
  ToolExecutionStatus,

  // Tool Definition
  type ToolDefinition,
  type RateLimit,
  type ToolExample,

  // Execution
  type ToolHandler,
  type ToolExecutionContext,
  type ToolExecutionResult,
  type ToolError,
  type ToolCallSummary,

  // Invocation
  type ToolInvocation,

  // Audit
  type AuditLogEntry,
  type AuditAction,

  // Permissions
  type UserPermission,
  type PermissionCondition,
  type PermissionCheckResult,

  // Confirmation
  type ConfirmationRequest,
  type ConfirmationDetail,

  // Query Options
  type ToolQueryOptions,
  type AuditQueryOptions,

  // Zod Schemas
  ToolCategorySchema,
  PermissionLevelSchema,
  ConfirmationTypeSchema,
  ToolExecutionStatusSchema,
  RateLimitSchema,
  ToolExampleSchema,
  RegisterToolInputSchema,
  InvokeToolInputSchema,

  // Store Interfaces
  type ToolStore,
  type InvocationStore,
  type AuditStore,
  type PermissionStore,
  type ConfirmationStore,
} from './types';

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export {
  ToolRegistry,
  createToolRegistry,
  type ToolRegistryConfig,
} from './tool-registry';

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

export {
  InMemoryToolStore,
  InMemoryInvocationStore,
  InMemoryAuditStore,
  InMemoryPermissionStore,
  InMemoryConfirmationStore,
  createInMemoryStores,
  type InMemoryStores,
} from './stores';

// ============================================================================
// PERMISSION MANAGER
// ============================================================================

export {
  PermissionManager,
  createPermissionManager,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionManagerConfig,
  type PermissionGrantOptions,
  type BatchPermissionGrant,
  type RolePermissionMapping,
} from './permission-manager';

// ============================================================================
// AUDIT LOGGER
// ============================================================================

export {
  AuditLogger,
  createAuditLogger,
  type AuditLoggerConfig,
  type AuditContext,
  type AuditReportSummary,
  type UserActivityReport,
  type ToolUsageReport,
} from './audit-logger';

// ============================================================================
// CONFIRMATION MANAGER
// ============================================================================

export {
  ConfirmationManager,
  createConfirmationManager,
  type ConfirmationManagerConfig,
  type CreateConfirmationOptions,
  type ConfirmationTemplate,
  type ConfirmationWaitResult,
} from './confirmation-manager';

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export {
  ToolExecutor,
  createToolExecutor,
  type ToolExecutorConfig,
  type ExecuteOptions,
  type ExecutionOutcome,
} from './tool-executor';
