/**
 * @sam-ai/agentic - Audit Logger
 * Comprehensive audit logging with queries and reporting for tool execution
 */
import type { AuditStore, AuditLogEntry, AuditLogLevel, AuditAction, AuditQueryOptions, ToolError, ToolInvocation, ToolDefinition } from './types';
/**
 * Configuration for AuditLogger
 */
export interface AuditLoggerConfig {
    auditStore: AuditStore;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Minimum log level to persist
     */
    minLevel?: AuditLogLevel;
    /**
     * Whether to include input/output in logs (may contain sensitive data)
     */
    includePayloads?: boolean;
    /**
     * Maximum payload size to log (in characters)
     */
    maxPayloadSize?: number;
    /**
     * Service name for log context
     */
    serviceName?: string;
}
/**
 * Audit log context
 */
export interface AuditContext {
    userId: string;
    sessionId: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Audit report summary
 */
export interface AuditReportSummary {
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalEntries: number;
    byLevel: Record<AuditLogLevel, number>;
    byAction: Record<AuditAction, number>;
    topTools: Array<{
        toolId: string;
        count: number;
    }>;
    topUsers: Array<{
        userId: string;
        count: number;
    }>;
    errorRate: number;
    averageExecutionTime?: number;
}
/**
 * User activity report
 */
export interface UserActivityReport {
    userId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalActions: number;
    toolsUsed: string[];
    successfulExecutions: number;
    failedExecutions: number;
    deniedExecutions: number;
    recentActivity: AuditLogEntry[];
}
/**
 * Tool usage report
 */
export interface ToolUsageReport {
    toolId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalInvocations: number;
    uniqueUsers: number;
    successRate: number;
    averageExecutionTime?: number;
    errorBreakdown: Array<{
        errorCode: string;
        count: number;
    }>;
    usageByDay: Array<{
        date: string;
        count: number;
    }>;
}
/**
 * AuditLogger provides comprehensive audit logging with querying and
 * reporting capabilities for tool execution in the SAM AI Mentor system.
 */
export declare class AuditLogger {
    private readonly store;
    private readonly logger;
    private readonly minLevel;
    private readonly includePayloads;
    private readonly maxPayloadSize;
    private readonly serviceName;
    constructor(config: AuditLoggerConfig);
    /**
     * Log a tool-related action
     */
    log(level: AuditLogLevel, action: AuditAction, context: AuditContext, details?: {
        toolId?: string;
        invocationId?: string;
        input?: unknown;
        output?: unknown;
        error?: ToolError;
    }): Promise<AuditLogEntry | null>;
    /**
     * Log debug level
     */
    debug(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log info level
     */
    info(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log warning level
     */
    warn(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log error level
     */
    error(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log critical level
     */
    critical(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log tool registration
     */
    logToolRegistered(tool: ToolDefinition, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log tool invocation
     */
    logToolInvoked(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log execution start
     */
    logExecutionStarted(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log successful execution
     */
    logExecutionSuccess(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log failed execution
     */
    logExecutionFailed(invocation: ToolInvocation, error: ToolError, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log permission denied
     */
    logPermissionDenied(toolId: string, reason: string, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation request
     */
    logConfirmationRequested(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation granted
     */
    logConfirmationGranted(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation denied
     */
    logConfirmationDenied(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(toolId: string, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Query audit logs
     */
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    /**
     * Count audit logs matching criteria
     */
    count(options: AuditQueryOptions): Promise<number>;
    /**
     * Get recent logs for a user
     */
    getRecentUserActivity(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get recent logs for a tool
     */
    getRecentToolActivity(toolId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get errors within a time range
     */
    getErrors(startDate: Date, endDate: Date, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Generate a summary report for a time period
     */
    generateSummaryReport(startDate: Date, endDate: Date): Promise<AuditReportSummary>;
    /**
     * Generate a user activity report
     */
    generateUserActivityReport(userId: string, startDate: Date, endDate: Date): Promise<UserActivityReport>;
    /**
     * Generate a tool usage report
     */
    generateToolUsageReport(toolId: string, startDate: Date, endDate: Date): Promise<ToolUsageReport>;
    /**
     * Truncate payload to max size
     */
    private truncatePayload;
}
/**
 * Create a new AuditLogger instance
 */
export declare function createAuditLogger(config: AuditLoggerConfig): AuditLogger;
//# sourceMappingURL=audit-logger.d.ts.map