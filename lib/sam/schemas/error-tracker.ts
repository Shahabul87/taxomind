/**
 * Validation Error Tracker
 *
 * Priority 3: Enhanced Error Tracking
 * Tracks validation failures, provides analytics, and supports monitoring dashboards
 */

import type { ValidationError, SchemaName } from './evaluation-schemas';
import { logger } from '@/lib/logger';

// ============================================================================
// ERROR TRACKING TYPES
// ============================================================================

/**
 * Severity level for errors
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error category for grouping
 */
export type ErrorCategory =
  | 'json_extraction'
  | 'schema_validation'
  | 'retry_exhausted'
  | 'timeout'
  | 'network'
  | 'unknown';

/**
 * Extended error record with tracking metadata
 */
export interface TrackedError {
  /**
   * Unique error ID
   */
  id: string;

  /**
   * Original validation error
   */
  error: ValidationError;

  /**
   * Error category for grouping
   */
  category: ErrorCategory;

  /**
   * Severity level
   */
  severity: ErrorSeverity;

  /**
   * Number of retry attempts before failure
   */
  retryAttempts: number;

  /**
   * Maximum retries configured
   */
  maxRetries: number;

  /**
   * Time spent on all attempts (ms)
   */
  totalDurationMs: number;

  /**
   * Request context for debugging
   */
  context: ErrorContext;

  /**
   * When the error was tracked
   */
  trackedAt: string;

  /**
   * Whether this error has been resolved/acknowledged
   */
  resolved: boolean;

  /**
   * Resolution notes (if resolved)
   */
  resolutionNotes?: string;
}

/**
 * Context information for debugging
 */
export interface ErrorContext {
  /**
   * User or session ID (anonymized)
   */
  sessionId?: string;

  /**
   * Request type (evaluation, grading, etc.)
   */
  requestType?: string;

  /**
   * Model used for generation
   */
  modelId?: string;

  /**
   * Prompt version if tracked
   */
  promptVersion?: string;

  /**
   * Content type being processed
   */
  contentType?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated metrics for a time period
 */
export interface ErrorMetrics {
  /**
   * Time period start
   */
  periodStart: string;

  /**
   * Time period end
   */
  periodEnd: string;

  /**
   * Total errors in period
   */
  totalErrors: number;

  /**
   * Total successful validations
   */
  totalSuccesses: number;

  /**
   * Error rate (errors / total)
   */
  errorRate: number;

  /**
   * Errors by schema
   */
  bySchema: Record<string, number>;

  /**
   * Errors by category
   */
  byCategory: Record<ErrorCategory, number>;

  /**
   * Errors by severity
   */
  bySeverity: Record<ErrorSeverity, number>;

  /**
   * Average retry attempts before failure
   */
  avgRetryAttempts: number;

  /**
   * Average duration before failure (ms)
   */
  avgDurationMs: number;

  /**
   * Most common error messages
   */
  topErrors: Array<{ message: string; count: number }>;
}

/**
 * Alert configuration for monitoring
 */
export interface AlertConfig {
  /**
   * Error rate threshold to trigger alert (0-1)
   */
  errorRateThreshold: number;

  /**
   * Minimum errors before alerting
   */
  minErrorsToAlert: number;

  /**
   * Time window for rate calculation (ms)
   */
  windowMs: number;

  /**
   * Severities that trigger immediate alerts
   */
  immediateSeverities: ErrorSeverity[];

  /**
   * Alert callback
   */
  onAlert?: (alert: ErrorAlert) => void | Promise<void>;
}

/**
 * Alert information
 */
export interface ErrorAlert {
  /**
   * Alert type
   */
  type: 'rate_exceeded' | 'critical_error' | 'pattern_detected';

  /**
   * Alert message
   */
  message: string;

  /**
   * Current metrics
   */
  metrics: Partial<ErrorMetrics>;

  /**
   * Related errors
   */
  errors: TrackedError[];

  /**
   * Alert timestamp
   */
  timestamp: string;
}

// ============================================================================
// ERROR TRACKER CLASS
// ============================================================================

/**
 * Default alert configuration
 */
export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 0.1, // 10% error rate
  minErrorsToAlert: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
  immediateSeverities: ['critical'],
};

/**
 * Error Tracker Service
 *
 * Tracks validation errors, provides analytics, and triggers alerts
 */
export class ValidationErrorTracker {
  private errors: TrackedError[] = [];
  private successCount: number = 0;
  private alertConfig: AlertConfig;
  private lastAlertTime: number = 0;
  private readonly alertCooldownMs: number = 60000; // 1 minute cooldown

  constructor(alertConfig?: Partial<AlertConfig>) {
    this.alertConfig = {
      ...DEFAULT_ALERT_CONFIG,
      ...alertConfig,
    };
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Determine error category from validation error
   */
  private categorizeError(error: ValidationError): ErrorCategory {
    switch (error.type) {
      case 'NO_JSON_FOUND':
        return 'json_extraction';
      case 'SCHEMA_ERROR':
        return 'schema_validation';
      case 'PARSE_ERROR':
        if (error.message.includes('timeout')) return 'timeout';
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return 'network';
        }
        return 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Determine severity based on error type and context
   */
  private determineSeverity(
    error: ValidationError,
    retryAttempts: number,
    maxRetries: number
  ): ErrorSeverity {
    // Critical if all retries exhausted
    if (retryAttempts >= maxRetries) {
      return 'critical';
    }

    // High for schema errors (indicates prompt/model issues)
    if (error.type === 'SCHEMA_ERROR' && error.zodErrors && error.zodErrors.length > 3) {
      return 'high';
    }

    // Medium for JSON extraction failures
    if (error.type === 'NO_JSON_FOUND') {
      return 'medium';
    }

    // Low for single failures that were retried
    return 'low';
  }

  /**
   * Track a validation error
   */
  trackError(
    error: ValidationError,
    options: {
      retryAttempts?: number;
      maxRetries?: number;
      durationMs?: number;
      context?: ErrorContext;
    } = {}
  ): TrackedError {
    const {
      retryAttempts = 0,
      maxRetries = 2,
      durationMs = 0,
      context = {},
    } = options;

    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, retryAttempts, maxRetries);

    const trackedError: TrackedError = {
      id: this.generateId(),
      error,
      category,
      severity,
      retryAttempts,
      maxRetries,
      totalDurationMs: durationMs,
      context,
      trackedAt: new Date().toISOString(),
      resolved: false,
    };

    this.errors.push(trackedError);

    // Check for immediate alerts
    this.checkImmediateAlert(trackedError);

    // Check rate-based alerts
    this.checkRateAlert();

    // Prune old errors (keep last 1000)
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    return trackedError;
  }

  /**
   * Track a successful validation
   */
  trackSuccess(): void {
    this.successCount++;
  }

  /**
   * Check for immediate severity-based alerts
   */
  private checkImmediateAlert(error: TrackedError): void {
    if (this.alertConfig.immediateSeverities.includes(error.severity)) {
      this.triggerAlert({
        type: 'critical_error',
        message: `Critical validation error: ${error.error.message}`,
        metrics: {
          totalErrors: 1,
          bySeverity: { [error.severity]: 1 } as Record<ErrorSeverity, number>,
        },
        errors: [error],
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check for rate-based alerts
   */
  private checkRateAlert(): void {
    const now = Date.now();

    // Respect cooldown
    if (now - this.lastAlertTime < this.alertCooldownMs) {
      return;
    }

    const windowStart = now - this.alertConfig.windowMs;
    const recentErrors = this.errors.filter(
      (e) => new Date(e.trackedAt).getTime() > windowStart
    );

    if (recentErrors.length < this.alertConfig.minErrorsToAlert) {
      return;
    }

    const totalInWindow = recentErrors.length + this.successCount;
    const errorRate = totalInWindow > 0 ? recentErrors.length / totalInWindow : 0;

    if (errorRate > this.alertConfig.errorRateThreshold) {
      this.lastAlertTime = now;
      this.triggerAlert({
        type: 'rate_exceeded',
        message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${(this.alertConfig.errorRateThreshold * 100).toFixed(1)}%`,
        metrics: {
          totalErrors: recentErrors.length,
          errorRate,
        },
        errors: recentErrors.slice(-10),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: ErrorAlert): void {
    if (this.alertConfig.onAlert) {
      Promise.resolve(this.alertConfig.onAlert(alert)).catch((err) => {
        logger.error('[ValidationErrorTracker] Alert callback failed', err);
      });
    } else {
      // Default: log via structured logger
      logger.warn(`[ValidationErrorTracker] Alert: ${alert.type} ${alert.message}`);
    }
  }

  /**
   * Get metrics for a time period
   */
  getMetrics(periodMs: number = 3600000): ErrorMetrics {
    const now = Date.now();
    const periodStart = new Date(now - periodMs);
    const periodEnd = new Date(now);

    const periodErrors = this.errors.filter(
      (e) => new Date(e.trackedAt).getTime() > periodStart.getTime()
    );

    const bySchema: Record<string, number> = {};
    const byCategory: Record<ErrorCategory, number> = {
      json_extraction: 0,
      schema_validation: 0,
      retry_exhausted: 0,
      timeout: 0,
      network: 0,
      unknown: 0,
    };
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalRetries = 0;
    let totalDuration = 0;
    const messageCounts: Record<string, number> = {};

    for (const error of periodErrors) {
      // By schema
      const schema = error.error.schemaName;
      bySchema[schema] = (bySchema[schema] || 0) + 1;

      // By category
      byCategory[error.category]++;

      // By severity
      bySeverity[error.severity]++;

      // Aggregates
      totalRetries += error.retryAttempts;
      totalDuration += error.totalDurationMs;

      // Message counts
      const msg = error.error.message.substring(0, 100);
      messageCounts[msg] = (messageCounts[msg] || 0) + 1;
    }

    const totalErrors = periodErrors.length;
    const totalSuccesses = this.successCount;
    const total = totalErrors + totalSuccesses;

    const topErrors = Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalErrors,
      totalSuccesses,
      errorRate: total > 0 ? totalErrors / total : 0,
      bySchema,
      byCategory,
      bySeverity,
      avgRetryAttempts: totalErrors > 0 ? totalRetries / totalErrors : 0,
      avgDurationMs: totalErrors > 0 ? totalDuration / totalErrors : 0,
      topErrors,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): TrackedError[] {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Get errors by schema
   */
  getErrorsBySchema(schemaName: SchemaName): TrackedError[] {
    return this.errors.filter((e) => e.error.schemaName === schemaName);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): TrackedError[] {
    return this.errors.filter((e) => !e.resolved);
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string, notes?: string): boolean {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolutionNotes = notes;
      return true;
    }
    return false;
  }

  /**
   * Get error by ID
   */
  getError(errorId: string): TrackedError | undefined {
    return this.errors.find((e) => e.id === errorId);
  }

  /**
   * Clear all errors (for testing)
   */
  clear(): void {
    this.errors = [];
    this.successCount = 0;
  }

  /**
   * Export errors for analysis
   */
  exportErrors(): TrackedError[] {
    return [...this.errors];
  }

  /**
   * Get statistics summary
   */
  getSummary(): {
    totalTracked: number;
    unresolvedCount: number;
    criticalCount: number;
    last24hErrorRate: number;
  } {
    const metrics24h = this.getMetrics(24 * 60 * 60 * 1000);

    return {
      totalTracked: this.errors.length,
      unresolvedCount: this.errors.filter((e) => !e.resolved).length,
      criticalCount: this.errors.filter((e) => e.severity === 'critical').length,
      last24hErrorRate: metrics24h.errorRate,
    };
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = {
      ...this.alertConfig,
      ...config,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalTracker: ValidationErrorTracker | null = null;

/**
 * Get or create the global error tracker instance
 */
export function getErrorTracker(config?: Partial<AlertConfig>): ValidationErrorTracker {
  if (!globalTracker) {
    globalTracker = new ValidationErrorTracker(config);
  }
  return globalTracker;
}

/**
 * Create a new error tracker instance (for isolated testing)
 */
export function createErrorTracker(config?: Partial<AlertConfig>): ValidationErrorTracker {
  return new ValidationErrorTracker(config);
}

// ============================================================================
// INTEGRATION WITH VALIDATION UTILS
// ============================================================================

/**
 * Options for tracked validation
 */
export interface TrackedValidationOptions {
  /**
   * Session/request ID for context
   */
  sessionId?: string;

  /**
   * Request type
   */
  requestType?: string;

  /**
   * Model being used
   */
  modelId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Type for executeWithRetry function to avoid circular dependency
 */
export type ExecuteWithRetryFn = <T>(
  executeFn: (prompt: string) => Promise<string>,
  originalPrompt: string,
  schema: import('zod').ZodSchema<T>,
  schemaName: string,
  config?: {
    maxRetries?: number;
    modifyPrompt?: boolean;
    onError?: (error: ValidationError, attempt: number) => void;
    onRetry?: (attempt: number, modifiedPrompt: string) => void;
  }
) => Promise<import('./evaluation-schemas').ValidationAttemptResult<T>>;

/**
 * Create a tracked executor that wraps executeWithRetry
 *
 * Usage:
 * ```typescript
 * import { executeWithRetry } from './validation-utils';
 * import { createTrackedExecutor, getErrorTracker } from './error-tracker';
 *
 * const tracker = getErrorTracker();
 * const trackedExecute = createTrackedExecutor(tracker, executeWithRetry);
 *
 * const result = await trackedExecute(
 *   aiCallFn,
 *   prompt,
 *   schema,
 *   'MySchema',
 *   { sessionId: 'user-123' }
 * );
 * ```
 */
export function createTrackedExecutor<T>(
  tracker: ValidationErrorTracker,
  executeWithRetry: ExecuteWithRetryFn
): (
  executeFn: (prompt: string) => Promise<string>,
  originalPrompt: string,
  schema: import('zod').ZodSchema<T>,
  schemaName: string,
  options?: TrackedValidationOptions & { maxRetries?: number }
) => Promise<import('./evaluation-schemas').ValidationAttemptResult<T>> {
  return async (executeFn, originalPrompt, schema, schemaName, options = {}) => {
    const { sessionId, requestType, modelId, metadata, maxRetries = 2 } = options;
    const startTime = Date.now();
    let retryCount = 0;

    const result = await executeWithRetry(
      executeFn,
      originalPrompt,
      schema,
      schemaName,
      {
        maxRetries,
        onError: (error, attempt) => {
          retryCount = attempt;
        },
      }
    );

    const duration = Date.now() - startTime;

    if (result.success) {
      tracker.trackSuccess();
    } else {
      tracker.trackError(result.error, {
        retryAttempts: retryCount,
        maxRetries,
        durationMs: duration,
        context: {
          sessionId,
          requestType,
          modelId,
          contentType: schemaName,
          metadata,
        },
      });
    }

    return result;
  };
}
