/**
 * @sam-ai/core - Error Classes
 * Standardized error handling for SAM AI Tutor
 */

export type SAMErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'INITIALIZATION_ERROR'
  | 'ENGINE_ERROR'
  | 'ORCHESTRATION_ERROR'
  | 'AI_ERROR'
  | 'STORAGE_ERROR'
  | 'CACHE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'DEPENDENCY_ERROR'
  | 'UNKNOWN_ERROR';

export interface SAMErrorDetails {
  code: SAMErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  recoverable: boolean;
  engineName?: string;
  timestamp: Date;
}

/**
 * Base SAM Error class
 */
export class SAMError extends Error {
  readonly code: SAMErrorCode;
  readonly details?: Record<string, unknown>;
  readonly recoverable: boolean;
  readonly engineName?: string;
  readonly timestamp: Date;
  readonly originalCause?: Error;

  constructor(
    message: string,
    options?: {
      code?: SAMErrorCode;
      details?: Record<string, unknown>;
      cause?: Error;
      recoverable?: boolean;
      engineName?: string;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'SAMError';
    this.code = options?.code ?? 'UNKNOWN_ERROR';
    this.details = options?.details;
    this.originalCause = options?.cause;
    this.recoverable = options?.recoverable ?? true;
    this.engineName = options?.engineName;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SAMError);
    }
  }

  toJSON(): SAMErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.originalCause,
      recoverable: this.recoverable,
      engineName: this.engineName,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Configuration Error
 */
export class ConfigurationError extends SAMError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'CONFIGURATION_ERROR',
      details,
      recoverable: false,
    });
    this.name = 'ConfigurationError';
  }
}

/**
 * Initialization Error
 */
export class InitializationError extends SAMError {
  constructor(message: string, options?: { cause?: Error; engineName?: string }) {
    super(message, {
      code: 'INITIALIZATION_ERROR',
      cause: options?.cause,
      engineName: options?.engineName,
      recoverable: false,
    });
    this.name = 'InitializationError';
  }
}

/**
 * Engine Error
 */
export class EngineError extends SAMError {
  constructor(
    engineName: string,
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown>; recoverable?: boolean }
  ) {
    super(message, {
      code: 'ENGINE_ERROR',
      cause: options?.cause,
      details: options?.details,
      engineName,
      recoverable: options?.recoverable ?? true,
    });
    this.name = 'EngineError';
  }
}

/**
 * Orchestration Error
 */
export class OrchestrationError extends SAMError {
  constructor(message: string, options?: { cause?: Error; details?: Record<string, unknown> }) {
    super(message, {
      code: 'ORCHESTRATION_ERROR',
      cause: options?.cause,
      details: options?.details,
      recoverable: true,
    });
    this.name = 'OrchestrationError';
  }
}

/**
 * AI Provider Error
 */
export class AIError extends SAMError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown>; recoverable?: boolean }
  ) {
    super(message, {
      code: 'AI_ERROR',
      cause: options?.cause,
      details: options?.details,
      recoverable: options?.recoverable ?? true,
    });
    this.name = 'AIError';
  }
}

/**
 * Storage Error
 */
export class StorageError extends SAMError {
  constructor(message: string, options?: { cause?: Error; details?: Record<string, unknown> }) {
    super(message, {
      code: 'STORAGE_ERROR',
      cause: options?.cause,
      details: options?.details,
      recoverable: true,
    });
    this.name = 'StorageError';
  }
}

/**
 * Cache Error
 */
export class CacheError extends SAMError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, {
      code: 'CACHE_ERROR',
      cause: options?.cause,
      recoverable: true,
    });
    this.name = 'CacheError';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends SAMError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      details: { fieldErrors },
      recoverable: true,
    });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors ?? {};
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends SAMError {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, engineName?: string) {
    super(message, {
      code: 'TIMEOUT_ERROR',
      details: { timeoutMs },
      engineName,
      recoverable: true,
    });
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends SAMError {
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      details: { retryAfterMs },
      recoverable: true,
    });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Dependency Error - when a required engine dependency fails
 */
export class DependencyError extends SAMError {
  readonly missingDependency: string;

  constructor(engineName: string, missingDependency: string) {
    super(`Engine "${engineName}" missing required dependency: ${missingDependency}`, {
      code: 'DEPENDENCY_ERROR',
      details: { missingDependency },
      engineName,
      recoverable: false,
    });
    this.name = 'DependencyError';
    this.missingDependency = missingDependency;
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Check if an error is a SAMError
 */
export function isSAMError(error: unknown): error is SAMError {
  return error instanceof SAMError;
}

/**
 * Wrap any error as a SAMError
 */
export function wrapError(error: unknown, fallbackMessage = 'An unexpected error occurred'): SAMError {
  if (error instanceof SAMError) {
    return error;
  }

  if (error instanceof Error) {
    return new SAMError(error.message || fallbackMessage, {
      cause: error,
      recoverable: true,
    });
  }

  return new SAMError(String(error) || fallbackMessage, {
    recoverable: true,
  });
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function createTimeoutPromise(ms: number, engineName?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${ms}ms`, ms, engineName));
    }, ms);
  });
}

/**
 * Execute a promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  engineName?: string
): Promise<T> {
  return Promise.race([promise, createTimeoutPromise(ms, engineName)]);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const { retries, baseDelayMs = 1000, maxDelayMs = 10000, onRetry } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        onRetry?.(lastError, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
