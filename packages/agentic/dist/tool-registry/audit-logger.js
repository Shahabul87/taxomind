/**
 * @sam-ai/agentic - Audit Logger
 * Comprehensive audit logging with queries and reporting for tool execution
 */
import { AuditLogLevel as LogLevelEnum } from './types';
// ============================================================================
// LOG LEVEL ORDERING
// ============================================================================
const LOG_LEVEL_ORDER = {
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 1,
    [LogLevelEnum.WARNING]: 2,
    [LogLevelEnum.ERROR]: 3,
    [LogLevelEnum.CRITICAL]: 4,
};
// ============================================================================
// AUDIT LOGGER
// ============================================================================
/**
 * AuditLogger provides comprehensive audit logging with querying and
 * reporting capabilities for tool execution in the SAM AI Mentor system.
 */
export class AuditLogger {
    store;
    logger;
    minLevel;
    includePayloads;
    maxPayloadSize;
    serviceName;
    constructor(config) {
        this.store = config.auditStore;
        this.logger = config.logger ?? console;
        this.minLevel = config.minLevel ?? LogLevelEnum.INFO;
        this.includePayloads = config.includePayloads ?? false;
        this.maxPayloadSize = config.maxPayloadSize ?? 10000;
        this.serviceName = config.serviceName ?? 'sam-ai-agentic';
    }
    // ==========================================================================
    // CORE LOGGING METHODS
    // ==========================================================================
    /**
     * Log a tool-related action
     */
    async log(level, action, context, details) {
        // Check minimum level
        if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.minLevel]) {
            return null;
        }
        const entry = {
            level,
            action,
            userId: context.userId,
            sessionId: context.sessionId,
            toolId: details?.toolId,
            invocationId: details?.invocationId,
            requestId: context.requestId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            metadata: {
                ...context.metadata,
                serviceName: this.serviceName,
            },
        };
        // Conditionally include payloads
        if (this.includePayloads) {
            entry.input = this.truncatePayload(details?.input);
            entry.output = this.truncatePayload(details?.output);
        }
        if (details?.error) {
            entry.error = details.error;
        }
        try {
            const logged = await this.store.log(entry);
            this.logger.debug(`Audit log created: ${action}`, { entryId: logged.id });
            return logged;
        }
        catch (error) {
            this.logger.error('Failed to create audit log', { error, action });
            return null;
        }
    }
    /**
     * Log debug level
     */
    async debug(action, context, details) {
        return this.log(LogLevelEnum.DEBUG, action, context, details);
    }
    /**
     * Log info level
     */
    async info(action, context, details) {
        return this.log(LogLevelEnum.INFO, action, context, details);
    }
    /**
     * Log warning level
     */
    async warn(action, context, details) {
        return this.log(LogLevelEnum.WARNING, action, context, details);
    }
    /**
     * Log error level
     */
    async error(action, context, details) {
        return this.log(LogLevelEnum.ERROR, action, context, details);
    }
    /**
     * Log critical level
     */
    async critical(action, context, details) {
        return this.log(LogLevelEnum.CRITICAL, action, context, details);
    }
    // ==========================================================================
    // TOOL LIFECYCLE LOGGING
    // ==========================================================================
    /**
     * Log tool registration
     */
    async logToolRegistered(tool, context) {
        return this.info('tool_registered', context, {
            toolId: tool.id,
            input: {
                name: tool.name,
                category: tool.category,
                version: tool.version,
            },
        });
    }
    /**
     * Log tool invocation
     */
    async logToolInvoked(invocation, context) {
        return this.info('tool_invoked', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
            input: invocation.input,
        });
    }
    /**
     * Log execution start
     */
    async logExecutionStarted(invocation, context) {
        return this.info('execution_started', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
        });
    }
    /**
     * Log successful execution
     */
    async logExecutionSuccess(invocation, context) {
        return this.info('execution_success', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
            output: invocation.result?.output,
        });
    }
    /**
     * Log failed execution
     */
    async logExecutionFailed(invocation, error, context) {
        return this.error('execution_failed', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
            error,
        });
    }
    /**
     * Log permission denied
     */
    async logPermissionDenied(toolId, reason, context) {
        return this.warn('permission_denied', context, {
            toolId,
            error: {
                code: 'PERMISSION_DENIED',
                message: reason,
                recoverable: false,
            },
        });
    }
    /**
     * Log confirmation request
     */
    async logConfirmationRequested(invocation, context) {
        return this.info('confirmation_requested', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
        });
    }
    /**
     * Log confirmation granted
     */
    async logConfirmationGranted(invocation, context) {
        return this.info('confirmation_granted', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
        });
    }
    /**
     * Log confirmation denied
     */
    async logConfirmationDenied(invocation, context) {
        return this.warn('confirmation_denied', context, {
            toolId: invocation.toolId,
            invocationId: invocation.id,
        });
    }
    /**
     * Log rate limit exceeded
     */
    async logRateLimitExceeded(toolId, context) {
        return this.warn('rate_limit_exceeded', context, {
            toolId,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Tool rate limit exceeded',
                recoverable: true,
            },
        });
    }
    // ==========================================================================
    // QUERYING
    // ==========================================================================
    /**
     * Query audit logs
     */
    async query(options) {
        return this.store.query(options);
    }
    /**
     * Count audit logs matching criteria
     */
    async count(options) {
        return this.store.count(options);
    }
    /**
     * Get recent logs for a user
     */
    async getRecentUserActivity(userId, limit = 100) {
        return this.store.query({
            userId,
            limit,
        });
    }
    /**
     * Get recent logs for a tool
     */
    async getRecentToolActivity(toolId, limit = 100) {
        return this.store.query({
            toolId,
            limit,
        });
    }
    /**
     * Get errors within a time range
     */
    async getErrors(startDate, endDate, limit) {
        return this.store.query({
            level: [LogLevelEnum.ERROR, LogLevelEnum.CRITICAL],
            startDate,
            endDate,
            limit,
        });
    }
    // ==========================================================================
    // REPORTING
    // ==========================================================================
    /**
     * Generate a summary report for a time period
     */
    async generateSummaryReport(startDate, endDate) {
        const entries = await this.store.query({ startDate, endDate });
        // Initialize counters
        const byLevel = {
            [LogLevelEnum.DEBUG]: 0,
            [LogLevelEnum.INFO]: 0,
            [LogLevelEnum.WARNING]: 0,
            [LogLevelEnum.ERROR]: 0,
            [LogLevelEnum.CRITICAL]: 0,
        };
        const byAction = {};
        const toolCounts = {};
        const userCounts = {};
        let errorCount = 0;
        // Process entries
        for (const entry of entries) {
            byLevel[entry.level]++;
            if (!byAction[entry.action]) {
                byAction[entry.action] = 0;
            }
            byAction[entry.action]++;
            if (entry.toolId) {
                toolCounts[entry.toolId] = (toolCounts[entry.toolId] || 0) + 1;
            }
            userCounts[entry.userId] = (userCounts[entry.userId] || 0) + 1;
            if (entry.level === LogLevelEnum.ERROR || entry.level === LogLevelEnum.CRITICAL) {
                errorCount++;
            }
        }
        // Sort and get top tools/users
        const topTools = Object.entries(toolCounts)
            .map(([toolId, count]) => ({ toolId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const topUsers = Object.entries(userCounts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            period: { startDate, endDate },
            totalEntries: entries.length,
            byLevel,
            byAction: byAction,
            topTools,
            topUsers,
            errorRate: entries.length > 0 ? errorCount / entries.length : 0,
        };
    }
    /**
     * Generate a user activity report
     */
    async generateUserActivityReport(userId, startDate, endDate) {
        const entries = await this.store.query({ userId, startDate, endDate });
        const toolsUsed = new Set();
        let successfulExecutions = 0;
        let failedExecutions = 0;
        let deniedExecutions = 0;
        for (const entry of entries) {
            if (entry.toolId) {
                toolsUsed.add(entry.toolId);
            }
            switch (entry.action) {
                case 'execution_success':
                    successfulExecutions++;
                    break;
                case 'execution_failed':
                case 'execution_timeout':
                    failedExecutions++;
                    break;
                case 'permission_denied':
                case 'confirmation_denied':
                    deniedExecutions++;
                    break;
            }
        }
        return {
            userId,
            period: { startDate, endDate },
            totalActions: entries.length,
            toolsUsed: Array.from(toolsUsed),
            successfulExecutions,
            failedExecutions,
            deniedExecutions,
            recentActivity: entries.slice(0, 20),
        };
    }
    /**
     * Generate a tool usage report
     */
    async generateToolUsageReport(toolId, startDate, endDate) {
        const entries = await this.store.query({ toolId, startDate, endDate });
        const uniqueUsers = new Set();
        let successCount = 0;
        let totalCount = 0;
        const errorBreakdown = {};
        const usageByDay = {};
        for (const entry of entries) {
            uniqueUsers.add(entry.userId);
            if (entry.action === 'execution_success') {
                successCount++;
                totalCount++;
            }
            else if (entry.action === 'execution_failed') {
                totalCount++;
                if (entry.error?.code) {
                    errorBreakdown[entry.error.code] = (errorBreakdown[entry.error.code] || 0) + 1;
                }
            }
            // Group by day
            const day = entry.timestamp.toISOString().split('T')[0];
            usageByDay[day] = (usageByDay[day] || 0) + 1;
        }
        return {
            toolId,
            period: { startDate, endDate },
            totalInvocations: totalCount,
            uniqueUsers: uniqueUsers.size,
            successRate: totalCount > 0 ? successCount / totalCount : 0,
            errorBreakdown: Object.entries(errorBreakdown)
                .map(([errorCode, count]) => ({ errorCode, count }))
                .sort((a, b) => b.count - a.count),
            usageByDay: Object.entries(usageByDay)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date)),
        };
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Truncate payload to max size
     */
    truncatePayload(payload) {
        if (payload === undefined || payload === null) {
            return payload;
        }
        const str = JSON.stringify(payload);
        if (str.length <= this.maxPayloadSize) {
            return payload;
        }
        return {
            __truncated: true,
            __originalSize: str.length,
            __preview: str.slice(0, this.maxPayloadSize),
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new AuditLogger instance
 */
export function createAuditLogger(config) {
    return new AuditLogger(config);
}
//# sourceMappingURL=audit-logger.js.map