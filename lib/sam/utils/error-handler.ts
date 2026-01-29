/**
 * SAM Error Handler
 *
 * Centralized error handling utilities for the SAM integration layer.
 * Provides consistent error handling, logging, and recovery strategies.
 *
 * ARCHITECTURE: Use these utilities instead of silent catch blocks that return null.
 * This ensures errors are properly logged and tracked for debugging.
 */

import { logger } from '@/lib/logger';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base class for SAM-specific errors
 */
export class SAMError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    options?: {
      context?: Record<string, unknown>;
      recoverable?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'SAMError';
    this.code = code;
    this.context = options?.context;
    this.recoverable = options?.recoverable ?? false;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Error thrown when a service fails to initialize
 */
export class SAMInitializationError extends SAMError {
  constructor(service: string, reason: string, cause?: Error) {
    super(
      `Failed to initialize ${service}: ${reason}`,
      'SAM_INIT_ERROR',
      { context: { service }, recoverable: false, cause }
    );
    this.name = 'SAMInitializationError';
  }
}

/**
 * Error thrown when a required service is not available
 */
export class SAMServiceUnavailableError extends SAMError {
  constructor(service: string, reason?: string) {
    super(
      `Service ${service} is not available${reason ? `: ${reason}` : ''}`,
      'SAM_SERVICE_UNAVAILABLE',
      { context: { service }, recoverable: true }
    );
    this.name = 'SAMServiceUnavailableError';
  }
}

/**
 * Error thrown when a configuration is invalid
 */
export class SAMConfigError extends SAMError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SAM_CONFIG_ERROR', { context, recoverable: false });
    this.name = 'SAMConfigError';
  }
}

/**
 * Error thrown when an operation times out
 */
export class SAMTimeoutError extends SAMError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation ${operation} timed out after ${timeoutMs}ms`,
      'SAM_TIMEOUT',
      { context: { operation, timeoutMs }, recoverable: true }
    );
    this.name = 'SAMTimeoutError';
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export interface ErrorHandlerOptions<T> {
  /** Component/module name for logging */
  component: string;
  /** Operation description for logging */
  operation: string;
  /** Default value to return on recoverable errors (makes it recoverable) */
  fallback?: T;
  /** Whether to rethrow the error after logging */
  rethrow?: boolean;
  /** Additional context for logging */
  context?: Record<string, unknown>;
  /** Custom error transformer */
  transform?: (error: Error) => Error;
}

/**
 * Wraps an async operation with proper error handling
 *
 * @example
 * // Rethrow errors (default)
 * const result = await withErrorHandling(
 *   () => riskyOperation(),
 *   { component: 'Tooling', operation: 'registerTools' }
 * );
 *
 * @example
 * // Return fallback on error
 * const result = await withErrorHandling(
 *   () => fetchOptionalData(),
 *   { component: 'Memory', operation: 'getCache', fallback: null }
 * );
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions<T>
): Promise<T> {
  const { component, operation, fallback, rethrow = true, context, transform } = options;
  const logPrefix = `[${component}]`;

  try {
    return await fn();
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    const message = originalError.message;

    // Log the error with context
    logger.error(`${logPrefix} ${operation} failed`, {
      error: message,
      stack: originalError.stack,
      ...context,
    });

    // Transform the error if a transformer is provided
    const transformedError = transform ? transform(originalError) : originalError;

    // If fallback is provided, return it (makes error recoverable)
    if (fallback !== undefined) {
      logger.warn(`${logPrefix} ${operation} using fallback value`, {
        fallbackType: typeof fallback,
      });
      return fallback;
    }

    // Rethrow if requested (default)
    if (rethrow) {
      throw transformedError;
    }

    // This shouldn't happen if options are valid, but TypeScript needs it
    throw transformedError;
  }
}

/**
 * Synchronous version of withErrorHandling
 */
export function withErrorHandlingSync<T>(
  fn: () => T,
  options: ErrorHandlerOptions<T>
): T {
  const { component, operation, fallback, rethrow = true, context, transform } = options;
  const logPrefix = `[${component}]`;

  try {
    return fn();
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    const message = originalError.message;

    logger.error(`${logPrefix} ${operation} failed`, {
      error: message,
      stack: originalError.stack,
      ...context,
    });

    const transformedError = transform ? transform(originalError) : originalError;

    if (fallback !== undefined) {
      logger.warn(`${logPrefix} ${operation} using fallback value`, {
        fallbackType: typeof fallback,
      });
      return fallback;
    }

    if (rethrow) {
      throw transformedError;
    }

    throw transformedError;
  }
}

/**
 * Wraps an operation that should never fail silently
 * Always rethrows with proper logging
 */
export async function mustSucceed<T>(
  fn: () => Promise<T>,
  component: string,
  operation: string
): Promise<T> {
  return withErrorHandling(fn, {
    component,
    operation,
    rethrow: true,
  });
}

/**
 * Wraps an optional operation that can fail gracefully
 * Returns null on error with proper logging
 */
export async function tryOptional<T>(
  fn: () => Promise<T>,
  component: string,
  operation: string
): Promise<T | null> {
  return withErrorHandling(fn, {
    component,
    operation,
    fallback: null as T | null,
  });
}

/**
 * Wraps an operation that returns an array
 * Returns empty array on error with proper logging
 */
export async function tryArray<T>(
  fn: () => Promise<T[]>,
  component: string,
  operation: string
): Promise<T[]> {
  return withErrorHandling(fn, {
    component,
    operation,
    fallback: [] as T[],
  });
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export interface RetryOptions {
  /** Maximum number of attempts */
  maxAttempts?: number;
  /** Initial delay between retries in ms */
  initialDelayMs?: number;
  /** Maximum delay between retries in ms */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Component name for logging */
  component?: string;
  /** Operation name for logging */
  operation?: string;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'component' | 'operation'>> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  isRetryable: () => true,
};

/**
 * Retries an async operation with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, isRetryable } = opts;
  const logPrefix = opts.component ? `[${opts.component}]` : '[Retry]';
  const opName = opts.operation ?? 'operation';

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !isRetryable(lastError)) {
        logger.error(`${logPrefix} ${opName} failed after ${attempt} attempts`, {
          error: lastError.message,
          attempts: attempt,
        });
        throw lastError;
      }

      logger.warn(`${logPrefix} ${opName} failed (attempt ${attempt}/${maxAttempts}), retrying...`, {
        error: lastError.message,
        nextRetryMs: delay,
      });

      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // TypeScript doesn't know we always throw or return above
  throw lastError ?? new Error('Unexpected retry failure');
}

// ============================================================================
// TIMEOUT UTILITIES
// ============================================================================

/**
 * Wraps an async operation with a timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new SAMTimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([fn(), timeoutPromise]);
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time in ms to wait before attempting recovery */
  resetTimeoutMs?: number;
  /** Component name for logging */
  component?: string;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Simple circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly component: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.component = options.component ?? 'CircuitBreaker';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        logger.info(`[${this.component}] Circuit breaker entering half-open state`);
      } else {
        throw new SAMServiceUnavailableError(
          this.component,
          'Circuit breaker is open'
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        logger.info(`[${this.component}] Circuit breaker closed after successful call`);
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
        logger.warn(`[${this.component}] Circuit breaker opened after ${this.failures} failures`);
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if error is a specific SAM error type
 */
export function isSAMError(error: unknown): error is SAMError {
  return error instanceof SAMError;
}

/**
 * Create a standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An error occurred'
): { error: string; code?: string; details?: Record<string, unknown> } {
  if (error instanceof SAMError) {
    return {
      error: error.message,
      code: error.code,
      details: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    };
  }

  return {
    error: defaultMessage,
  };
}
