/**
 * Centralized Error Handling System
 * Provides consistent error management across the application
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_OPERATION = 'INVALID_OPERATION',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  [key: string]: unknown;
}

/**
 * Custom application error class with enhanced error information
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
    details?: ErrorDetails
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Factory functions for common error types
 */
export class AppErrors {
  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(message, 403, ErrorCode.FORBIDDEN);
  }

  static notFound(resource: string, id?: string): AppError {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    return new AppError(message, 404, ErrorCode.NOT_FOUND);
  }

  static validation(message: string, details?: ErrorDetails): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }

  static badRequest(message: string, details?: ErrorDetails): AppError {
    return new AppError(message, 400, ErrorCode.INVALID_INPUT, true, details);
  }

  static conflict(message: string, details?: ErrorDetails): AppError {
    return new AppError(message, 409, ErrorCode.CONFLICT, true, details);
  }

  static rateLimit(message = 'Too many requests'): AppError {
    return new AppError(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
  }

  static internal(message = 'Internal server error', isOperational = false): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_ERROR, isOperational);
  }

  static database(message = 'Database operation failed', details?: ErrorDetails): AppError {
    return new AppError(message, 500, ErrorCode.DATABASE_ERROR, false, details);
  }

  static external(service: string, message?: string): AppError {
    const errorMessage = message || `External service ${service} failed`;
    return new AppError(errorMessage, 503, ErrorCode.EXTERNAL_SERVICE_ERROR, false);
  }

  static businessRule(message: string, details?: ErrorDetails): AppError {
    return new AppError(message, 422, ErrorCode.BUSINESS_RULE_VIOLATION, true, details);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}