/**
 * Common error handling types used throughout the application
 */

/**
 * Base error type with standard properties
 */
export interface BaseError extends Error {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

/**
 * Application-specific error with additional context
 */
export interface AppError extends BaseError {
  code: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp?: Date;
  context?: string;
}

/**
 * API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
}

/**
 * Validation error with field-specific errors
 */
export interface ValidationError extends AppError {
  fields?: Record<string, string | string[]>;
  validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Database error with query context
 */
export interface DatabaseError extends AppError {
  query?: string;
  model?: string;
  operation?: 'create' | 'read' | 'update' | 'delete';
  constraint?: string;
}

/**
 * Network/HTTP error
 */
export interface NetworkError extends AppError {
  url?: string;
  method?: string;
  responseStatus?: number;
  responseBody?: unknown;
}

/**
 * Authentication/Authorization error
 */
export interface AuthError extends AppError {
  userId?: string;
  resource?: string;
  permission?: string;
  role?: string;
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Type guard to check if error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a message property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (hasErrorMessage(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract error details from unknown error
 */
export function getErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (isAppError(error)) {
    return error.details;
  }
  if (error !== null && typeof error === 'object' && 'details' in error) {
    return (error as Record<string, unknown>).details as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Error result type for functions that can fail
 */
export type ErrorResult<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async error result type
 */
export type AsyncErrorResult<T, E = AppError> = Promise<ErrorResult<T, E>>;