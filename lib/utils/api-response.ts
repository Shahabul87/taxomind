import { NextResponse } from 'next/server';

/**
 * Standardized API response helpers following the ApiResponse<T> interface.
 * Use these in all API routes for consistent error/success formatting.
 */

interface ApiResponseBody<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Return a successful JSON response.
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponseBody<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

/**
 * Return a structured error JSON response.
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponseBody<never>> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      metadata: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

/**
 * Common error shortcuts
 */
export const apiErrors = {
  unauthorized: (message = 'Authentication required') =>
    errorResponse('UNAUTHORIZED', message, 401),
  forbidden: (message = 'Access denied') =>
    errorResponse('FORBIDDEN', message, 403),
  notFound: (resource = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (message: string, details?: Record<string, unknown>) =>
    errorResponse('BAD_REQUEST', message, 400, details),
  validationError: (details: Record<string, unknown>) =>
    errorResponse('VALIDATION_ERROR', 'Invalid request data', 400, details),
  rateLimited: (message = 'Too many requests') =>
    errorResponse('RATE_LIMITED', message, 429),
  internal: (message = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500),
} as const;
