/**
 * @sam-ai/agentic - Tool Registry Module
 * Explicit tool registry with permissioned actions and audit logging
 */
export { ToolCategory, PermissionLevel, ConfirmationType, AuditLogLevel, ToolExecutionStatus, type ToolDefinition, type RateLimit, type ToolExample, type ToolHandler, type ToolExecutionContext, type ToolExecutionResult, type ToolError, type ToolCallSummary, type ToolInvocation, type AuditLogEntry, type AuditAction, type UserPermission, type PermissionCondition, type PermissionCheckResult, type ConfirmationRequest, type ConfirmationDetail, type ToolQueryOptions, type AuditQueryOptions, ToolCategorySchema, PermissionLevelSchema, ConfirmationTypeSchema, ToolExecutionStatusSchema, RateLimitSchema, ToolExampleSchema, RegisterToolInputSchema, InvokeToolInputSchema, type ToolStore, type InvocationStore, type AuditStore, type PermissionStore, type ConfirmationStore, } from './types';
export { ToolRegistry, createToolRegistry, type ToolRegistryConfig, } from './tool-registry';
export { InMemoryToolStore, InMemoryInvocationStore, InMemoryAuditStore, InMemoryPermissionStore, InMemoryConfirmationStore, createInMemoryStores, type InMemoryStores, } from './stores';
export { PermissionManager, createPermissionManager, UserRole, DEFAULT_ROLE_PERMISSIONS, type PermissionManagerConfig, type PermissionGrantOptions, type BatchPermissionGrant, type RolePermissionMapping, } from './permission-manager';
export { AuditLogger, createAuditLogger, type AuditLoggerConfig, type AuditContext, type AuditReportSummary, type UserActivityReport, type ToolUsageReport, } from './audit-logger';
export { ConfirmationManager, createConfirmationManager, type ConfirmationManagerConfig, type CreateConfirmationOptions, type ConfirmationTemplate, type ConfirmationWaitResult, } from './confirmation-manager';
export { ToolExecutor, createToolExecutor, type ToolExecutorConfig, type ExecuteOptions, type ExecutionOutcome, } from './tool-executor';
//# sourceMappingURL=index.d.ts.map