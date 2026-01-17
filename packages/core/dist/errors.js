/**
 * @sam-ai/core - Error Classes
 * Standardized error handling for SAM AI Tutor
 */
/**
 * Base SAM Error class
 */
export class SAMError extends Error {
    code;
    details;
    recoverable;
    engineName;
    timestamp;
    originalCause;
    constructor(message, options) {
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
    toJSON() {
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
    constructor(message, details) {
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
    constructor(message, options) {
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
    constructor(engineName, message, options) {
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
    constructor(message, options) {
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
    constructor(message, options) {
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
    constructor(message, options) {
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
    constructor(message, options) {
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
    fieldErrors;
    constructor(message, fieldErrors) {
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
    timeoutMs;
    constructor(message, timeoutMs, engineName) {
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
    retryAfterMs;
    constructor(message, retryAfterMs) {
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
    missingDependency;
    constructor(engineName, missingDependency) {
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
export function isSAMError(error) {
    return error instanceof SAMError;
}
/**
 * Wrap any error as a SAMError
 */
export function wrapError(error, fallbackMessage = 'An unexpected error occurred') {
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
export function createTimeoutPromise(ms, engineName) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new TimeoutError(`Operation timed out after ${ms}ms`, ms, engineName));
        }, ms);
    });
}
/**
 * Execute a promise with timeout
 */
export async function withTimeout(promise, ms, engineName) {
    return Promise.race([promise, createTimeoutPromise(ms, engineName)]);
}
/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, options) {
    const { retries, baseDelayMs = 1000, maxDelayMs = 10000, onRetry } = options;
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
//# sourceMappingURL=errors.js.map