/**
 * @sam-ai/core - Error Classes
 * Standardized error handling for SAM AI Tutor
 */
export type SAMErrorCode = 'CONFIGURATION_ERROR' | 'INITIALIZATION_ERROR' | 'ENGINE_ERROR' | 'ORCHESTRATION_ERROR' | 'AI_ERROR' | 'STORAGE_ERROR' | 'CACHE_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR' | 'RATE_LIMIT_ERROR' | 'DEPENDENCY_ERROR' | 'UNKNOWN_ERROR';
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
export declare class SAMError extends Error {
    readonly code: SAMErrorCode;
    readonly details?: Record<string, unknown>;
    readonly recoverable: boolean;
    readonly engineName?: string;
    readonly timestamp: Date;
    readonly originalCause?: Error;
    constructor(message: string, options?: {
        code?: SAMErrorCode;
        details?: Record<string, unknown>;
        cause?: Error;
        recoverable?: boolean;
        engineName?: string;
    });
    toJSON(): SAMErrorDetails;
}
/**
 * Configuration Error
 */
export declare class ConfigurationError extends SAMError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Initialization Error
 */
export declare class InitializationError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        engineName?: string;
    });
}
/**
 * Engine Error
 */
export declare class EngineError extends SAMError {
    constructor(engineName: string, message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
        recoverable?: boolean;
    });
}
/**
 * Orchestration Error
 */
export declare class OrchestrationError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
    });
}
/**
 * AI Provider Error
 */
export declare class AIError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
        recoverable?: boolean;
    });
}
/**
 * Storage Error
 */
export declare class StorageError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
    });
}
/**
 * Cache Error
 */
export declare class CacheError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
    });
}
/**
 * Validation Error
 */
export declare class ValidationError extends SAMError {
    readonly fieldErrors: Record<string, string[]>;
    constructor(message: string, fieldErrors?: Record<string, string[]>);
}
/**
 * Timeout Error
 */
export declare class TimeoutError extends SAMError {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number, engineName?: string);
}
/**
 * Rate Limit Error
 */
export declare class RateLimitError extends SAMError {
    readonly retryAfterMs?: number;
    constructor(message: string, retryAfterMs?: number);
}
/**
 * Dependency Error - when a required engine dependency fails
 */
export declare class DependencyError extends SAMError {
    readonly missingDependency: string;
    constructor(engineName: string, missingDependency: string);
}
/**
 * Check if an error is a SAMError
 */
export declare function isSAMError(error: unknown): error is SAMError;
/**
 * Wrap any error as a SAMError
 */
export declare function wrapError(error: unknown, fallbackMessage?: string): SAMError;
/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export declare function createTimeoutPromise(ms: number, engineName?: string): Promise<never>;
/**
 * Execute a promise with timeout
 */
export declare function withTimeout<T>(promise: Promise<T>, ms: number, engineName?: string): Promise<T>;
/**
 * Retry a function with exponential backoff
 */
export declare function withRetry<T>(fn: () => Promise<T>, options: {
    retries: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
}): Promise<T>;
//# sourceMappingURL=errors.d.ts.map