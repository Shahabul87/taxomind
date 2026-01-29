/**
 * SAM API Response Utility
 *
 * Provides standardized API response format for all SAM routes.
 * Ensures consistency, proper error handling, and TypeScript type safety.
 *
 * Response Format:
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "metadata": {
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_123",
 *     "version": "1.0.0"
 *   }
 * }
 * ```
 *
 * Error Format:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Invalid input data",
 *     "details": { ... }
 *   },
 *   "metadata": { ... }
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SAMError, isSAMError, getErrorMessage } from './error-handler';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standard API error codes for SAM
 */
export const SAM_ERROR_CODES = {
  // Authentication/Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // SAM-specific
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  GOAL_NOT_FOUND: 'GOAL_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  MEMORY_ERROR: 'MEMORY_ERROR',
} as const;

export type SAMErrorCode = (typeof SAM_ERROR_CODES)[keyof typeof SAM_ERROR_CODES];

/**
 * Standard error structure
 */
export interface APIError {
  code: SAMErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // For validation errors
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
  durationMs?: number;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  metadata?: ResponseMetadata;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: APIError;
  metadata?: ResponseMetadata;
}

/**
 * Union type for all API responses
 */
export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page?: number;
  totalPages?: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Build standard metadata for responses
 */
function buildMetadata(startTime?: number, requestId?: string): ResponseMetadata {
  const metadata: ResponseMetadata = {
    timestamp: new Date().toISOString(),
  };

  if (requestId) {
    metadata.requestId = requestId;
  }

  if (startTime) {
    metadata.durationMs = Date.now() - startTime;
  }

  // Add API version if defined
  if (process.env.SAM_API_VERSION) {
    metadata.version = process.env.SAM_API_VERSION;
  }

  return metadata;
}

/**
 * Create a success response
 *
 * @example
 * return successResponse({ users: [...] });
 *
 * @example
 * return successResponse(
 *   { goals: [...] },
 *   { status: 201, startTime: Date.now() }
 * );
 */
export function successResponse<T>(
  data: T,
  options: {
    status?: number;
    startTime?: number;
    requestId?: string;
    headers?: Headers | Record<string, string>;
  } = {}
): NextResponse<SuccessResponse<T>> {
  const { status = 200, startTime, requestId, headers } = options;

  const response: SuccessResponse<T> = {
    success: true,
    data,
    metadata: buildMetadata(startTime, requestId),
  };

  return NextResponse.json(response, {
    status,
    headers: headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers,
  });
}

/**
 * Create a paginated success response
 *
 * @example
 * return paginatedResponse(goals, { total: 100, limit: 20, offset: 0 });
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: {
    total: number;
    limit: number;
    offset: number;
  },
  options: {
    status?: number;
    startTime?: number;
    requestId?: string;
  } = {}
): NextResponse<SuccessResponse<PaginatedResponse<T>>> {
  const paginationMeta: PaginationMeta = {
    total: pagination.total,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: pagination.offset + items.length < pagination.total,
    page: Math.floor(pagination.offset / pagination.limit) + 1,
    totalPages: Math.ceil(pagination.total / pagination.limit),
  };

  return successResponse(
    {
      items,
      pagination: paginationMeta,
    },
    options
  );
}

/**
 * Create an error response
 *
 * @example
 * return errorResponse('VALIDATION_ERROR', 'Invalid email format', 400);
 *
 * @example
 * return errorResponse('NOT_FOUND', 'Goal not found', 404, {
 *   details: { goalId: '123' }
 * });
 */
export function errorResponse(
  code: SAMErrorCode | string,
  message: string,
  status: number,
  options: {
    details?: Record<string, unknown>;
    field?: string;
    startTime?: number;
    requestId?: string;
    headers?: Headers | Record<string, string>;
  } = {}
): NextResponse<ErrorResponse> {
  const { details, field, startTime, requestId, headers } = options;

  const apiError: APIError = {
    code,
    message,
    ...(details && { details }),
    ...(field && { field }),
  };

  const response: ErrorResponse = {
    success: false,
    error: apiError,
    metadata: buildMetadata(startTime, requestId),
  };

  return NextResponse.json(response, {
    status,
    headers: headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers,
  });
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * Handle Zod validation errors
 */
export function handleZodError(
  error: z.ZodError,
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  const details = error.errors.reduce(
    (acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );

  const firstError = error.errors[0];
  const field = firstError?.path.join('.');

  return errorResponse(SAM_ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400, {
    details,
    field,
    ...options,
  });
}

/**
 * Handle SAMError instances
 */
export function handleSAMError(
  error: SAMError,
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  // Map SAMError codes to HTTP status codes
  const statusMap: Record<string, number> = {
    SAM_INIT_ERROR: 500,
    SAM_SERVICE_UNAVAILABLE: 503,
    SAM_CONFIG_ERROR: 500,
    SAM_TIMEOUT: 504,
    SAM_RATE_LIMIT: 429,
  };

  const status = statusMap[error.code] ?? 500;

  return errorResponse(error.code, error.message, status, {
    details: error.context,
    ...options,
  });
}

/**
 * Handle any error and return appropriate response
 *
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   return handleError(error, { component: 'GoalsAPI', operation: 'create' });
 * }
 */
export function handleError(
  error: unknown,
  options: {
    component?: string;
    operation?: string;
    startTime?: number;
    requestId?: string;
    defaultMessage?: string;
  } = {}
): NextResponse<ErrorResponse> {
  const { component = 'SAM', operation = 'unknown', startTime, requestId, defaultMessage } = options;

  // Log the error
  logger.error(`[${component}] ${operation} failed`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle Zod errors
  if (error instanceof z.ZodError) {
    return handleZodError(error, { startTime, requestId });
  }

  // Handle SAM errors
  if (isSAMError(error)) {
    return handleSAMError(error, { startTime, requestId });
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error, { startTime, requestId });
  }

  // Generic error
  const message = defaultMessage ?? getErrorMessage(error) ?? 'An unexpected error occurred';
  return errorResponse(SAM_ERROR_CODES.INTERNAL_ERROR, message, 500, {
    startTime,
    requestId,
  });
}

/**
 * Check if error is a Prisma error
 */
function isPrismaError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error && typeof (error as { code: unknown }).code === 'string';
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(
  error: Error & { code: string },
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  const prismaErrorMap: Record<string, { status: number; code: SAMErrorCode; message: string }> = {
    P2002: { status: 409, code: SAM_ERROR_CODES.ALREADY_EXISTS, message: 'Resource already exists' },
    P2003: { status: 400, code: SAM_ERROR_CODES.VALIDATION_ERROR, message: 'Foreign key constraint violation' },
    P2025: { status: 404, code: SAM_ERROR_CODES.NOT_FOUND, message: 'Resource not found' },
    P2024: { status: 503, code: SAM_ERROR_CODES.SERVICE_UNAVAILABLE, message: 'Database connection timeout' },
  };

  const mapped = prismaErrorMap[error.code];
  if (mapped) {
    return errorResponse(mapped.code, mapped.message, mapped.status, {
      details: { prismaCode: error.code },
      ...options,
    });
  }

  return errorResponse(SAM_ERROR_CODES.DATABASE_ERROR, 'Database operation failed', 500, {
    details: { prismaCode: error.code },
    ...options,
  });
}

// ============================================================================
// CONVENIENCE RESPONSES
// ============================================================================

/**
 * Return 401 Unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Authentication required',
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  return errorResponse(SAM_ERROR_CODES.UNAUTHORIZED, message, 401, options);
}

/**
 * Return 403 Forbidden response
 */
export function forbiddenResponse(
  message: string = 'Access denied',
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  return errorResponse(SAM_ERROR_CODES.FORBIDDEN, message, 403, options);
}

/**
 * Return 404 Not Found response
 */
export function notFoundResponse(
  resource: string,
  options: { id?: string; startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  const { id, ...rest } = options;
  return errorResponse(SAM_ERROR_CODES.NOT_FOUND, `${resource} not found`, 404, {
    details: id ? { id } : undefined,
    ...rest,
  });
}

/**
 * Return 400 Bad Request response
 */
export function badRequestResponse(
  message: string,
  options: { details?: Record<string, unknown>; startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  return errorResponse(SAM_ERROR_CODES.INVALID_INPUT, message, 400, options);
}

/**
 * Return 429 Rate Limit response
 */
export function rateLimitResponse(
  retryAfter: number,
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  const headers = new Headers();
  headers.set('Retry-After', retryAfter.toString());

  return errorResponse(
    SAM_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
    429,
    {
      details: { retryAfter },
      headers,
      ...options,
    }
  );
}

/**
 * Return 503 Service Unavailable response
 */
export function serviceUnavailableResponse(
  service: string,
  options: { startTime?: number; requestId?: string } = {}
): NextResponse<ErrorResponse> {
  return errorResponse(
    SAM_ERROR_CODES.SERVICE_UNAVAILABLE,
    `${service} is temporarily unavailable`,
    503,
    options
  );
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Extract request ID from headers
 */
export function getRequestId(headers: Headers): string | undefined {
  return headers.get('x-request-id') ?? headers.get('x-correlation-id') ?? undefined;
}

/**
 * Create a request context for tracking
 */
export function createRequestContext(headers: Headers): {
  requestId: string | undefined;
  startTime: number;
} {
  return {
    requestId: getRequestId(headers),
    startTime: Date.now(),
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a response is a success response
 */
export function isSuccessResponse<T>(response: APIResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Check if a response is an error response
 */
export function isErrorResponse(response: APIResponse): response is ErrorResponse {
  return response.success === false;
}
