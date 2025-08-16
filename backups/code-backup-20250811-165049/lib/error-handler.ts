import { toast } from "sonner";
import { logger } from '@/lib/logger';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  operation: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface FallbackStrategy {
  type: 'cache' | 'simplified' | 'offline' | 'manual' | 'alternative_endpoint';
  action: () => Promise<any>;
  description: string;
}

export interface ErrorHandlingResult {
  success: boolean;
  data?: any;
  error?: Error;
  retryCount: number;
  fallbackUsed?: string;
  recoveryStrategy?: string;
}

export class AIErrorHandler {
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    retryableErrors: [
      'NetworkError',
      'TimeoutError',
      'RateLimitError',
      'ServiceUnavailable',
      'BadGateway'
    ]
  };

  private static errorLog: Array<{
    context: ErrorContext;
    error: Error;
    severity: ErrorSeverity;
    resolved: boolean;
    resolutionMethod?: string;
  }> = [];

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    config: Partial<RetryConfig> = {},
    fallbackStrategies: FallbackStrategy[] = []
  ): Promise<ErrorHandlingResult> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;
    let retryCount = 0;

    // Main retry loop
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - log if we had previous failures
        if (attempt > 0) {
          this.logRecovery(context, attempt, 'retry_success');
        }
        
        return {
          success: true,
          data: result,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt;
        
        const shouldRetry = this.shouldRetry(error as Error, attempt, finalConfig);
        
        if (!shouldRetry) {
          break;
        }
        
        // Calculate delay for next retry
        const delay = Math.min(
          finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelay
        );
        
        // Log retry attempt
        this.logError(context, error as Error, 'medium', false);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed - try fallback strategies
    for (const [index, fallback] of fallbackStrategies.entries()) {
      try {
        const result = await fallback.action();
        
        this.logRecovery(context, retryCount, `fallback_${fallback.type}`);
        
        // Show user notification about fallback
        toast.warning(`Using ${fallback.description} due to temporary issues`);
        
        return {
          success: true,
          data: result,
          retryCount,
          fallbackUsed: fallback.type,
          recoveryStrategy: fallback.description
        };
      } catch (fallbackError) {
        this.logError(context, fallbackError as Error, 'high', false);
        
        // Continue to next fallback
        continue;
      }
    }

    // All strategies failed
    this.logError(context, lastError, 'critical', false);
    
    return {
      success: false,
      error: lastError,
      retryCount
    };
  }

  private static shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Check if it's a fetch error with retryable status
    if ('status' in error && typeof error.status === 'number') {
      return config.retryableStatuses.includes(error.status);
    }

    // Check if it's a retryable error type
    return config.retryableErrors.some(retryableError => 
      error.name.includes(retryableError) || 
      error.message.includes(retryableError)
    );
  }

  private static logError(
    context: ErrorContext,
    error: Error,
    severity: ErrorSeverity,
    resolved: boolean
  ): void {
    const errorEntry = {
      context,
      error,
      severity,
      resolved,
      resolutionMethod: resolved ? 'immediate' : undefined
    };

    this.errorLog.push(errorEntry);

    // Log to console with context
    logger.error(`[AI_ERROR_HANDLER] ${severity.toUpperCase()}: ${context.operation}`, {
      error: error.message,
      context,
      stack: error.stack
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(errorEntry);
    }
  }

  private static logRecovery(
    context: ErrorContext,
    retryCount: number,
    method: string
  ): void {

    // Update error log
    const lastError = this.errorLog.find(entry => 
      entry.context.operation === context.operation && 
      !entry.resolved
    );
    
    if (lastError) {
      lastError.resolved = true;
      lastError.resolutionMethod = method;
    }
  }

  private static async sendToAnalytics(errorEntry: any): Promise<void> {
    try {
      // This would send to your analytics service
      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: errorEntry.context.operation,
          error: errorEntry.error.message,
          severity: errorEntry.severity,
          timestamp: errorEntry.context.timestamp,
          resolved: errorEntry.resolved
        })
      });
    } catch {
      // Silently fail analytics - don't throw errors for logging
    }
  }

  // Specific error handlers for AI operations
  static async handleAnthropicAPICall<T>(
    apiCall: () => Promise<T>,
    context: Partial<ErrorContext>,
    fallbackData?: T
  ): Promise<ErrorHandlingResult> {
    const fullContext: ErrorContext = {
      operation: 'anthropic_api_call',
      timestamp: new Date(),
      ...context
    };

    const fallbackStrategies: FallbackStrategy[] = [];
    
    if (fallbackData) {
      fallbackStrategies.push({
        type: 'cache',
        action: async () => fallbackData,
        description: 'cached response'
      });
    }

    return this.executeWithRetry(
      apiCall,
      fullContext,
      {
        maxRetries: 2,
        retryableStatuses: [429, 500, 502, 503, 504],
        retryableErrors: ['RateLimitError', 'ServiceUnavailable']
      },
      fallbackStrategies
    );
  }

  static async handleBlueprintGeneration<T>(
    generationCall: () => Promise<T>,
    context: Partial<ErrorContext>,
    simplifiedFallback?: () => Promise<T>
  ): Promise<ErrorHandlingResult> {
    const fullContext: ErrorContext = {
      operation: 'blueprint_generation',
      timestamp: new Date(),
      ...context
    };

    const fallbackStrategies: FallbackStrategy[] = [];
    
    if (simplifiedFallback) {
      fallbackStrategies.push({
        type: 'simplified',
        action: simplifiedFallback,
        description: 'simplified blueprint generation'
      });
    }

    return this.executeWithRetry(
      generationCall,
      fullContext,
      {
        maxRetries: 1, // Fewer retries for expensive operations
        initialDelay: 2000
      },
      fallbackStrategies
    );
  }

  static async handleContentOptimization<T>(
    optimizationCall: () => Promise<T>,
    context: Partial<ErrorContext>
  ): Promise<ErrorHandlingResult> {
    const fullContext: ErrorContext = {
      operation: 'content_optimization',
      timestamp: new Date(),
      ...context
    };

    const fallbackStrategies: FallbackStrategy[] = [
      {
        type: 'manual',
        action: async () => ({
          suggestions: [{
            type: 'manual',
            message: 'AI optimization unavailable. Please review content manually.',
            priority: 'low'
          }]
        }),
        description: 'manual review suggestion'
      }
    ];

    return this.executeWithRetry(
      optimizationCall,
      fullContext,
      { maxRetries: 1 },
      fallbackStrategies
    );
  }

  // User-friendly error messages
  static getUserFriendlyMessage(error: Error, operation: string): string {
    const errorMap: Record<string, string> = {
      'NetworkError': 'Network connection issue. Please check your internet connection and try again.',
      'TimeoutError': 'The request took too long. Please try again.',
      'RateLimitError': 'Too many requests. Please wait a moment and try again.',
      'ServiceUnavailable': 'AI service is temporarily unavailable. Please try again in a few minutes.',
      'BadGateway': 'Service gateway error. Please try again.',
      'Unauthorized': 'Authentication required. Please log in and try again.',
      'Forbidden': 'You don\'t have permission to perform this action.',
      'NotFound': 'The requested resource was not found.'
    };

    // Try to match error type
    for (const [errorType, message] of Object.entries(errorMap)) {
      if (error.name.includes(errorType) || error.message.includes(errorType)) {
        return message;
      }
    }

    // Operation-specific messages
    switch (operation) {
      case 'blueprint_generation':
        return 'Failed to generate course blueprint. Please try with different parameters or contact support.';
      case 'content_optimization':
        return 'Content optimization failed. You can proceed with manual review.';
      case 'anthropic_api_call':
        return 'AI service error. Please try again or use manual alternatives.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
    }
  }

  // Get error statistics for monitoring
  static getErrorStats(): {
    totalErrors: number;
    errorsByOperation: Record<string, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  } {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByOperation: {} as Record<string, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveryRate: 0
    };

    let resolvedCount = 0;

    for (const entry of this.errorLog) {
      // Count by operation
      const operation = entry.context.operation;
      stats.errorsByOperation[operation] = (stats.errorsByOperation[operation] || 0) + 1;

      // Count by severity
      stats.errorsBySeverity[entry.severity] = (stats.errorsBySeverity[entry.severity] || 0) + 1;

      // Count resolved
      if (entry.resolved) {
        resolvedCount++;
      }
    }

    stats.recoveryRate = this.errorLog.length > 0 ? (resolvedCount / this.errorLog.length) * 100 : 0;

    return stats;
  }

  // Clear old error logs (call periodically)
  static clearOldErrors(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(entry => entry.context.timestamp > cutoff);
  }
}