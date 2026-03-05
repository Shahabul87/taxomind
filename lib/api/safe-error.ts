/**
 * Production-safe error response helpers.
 *
 * Strips stack traces and internal details in production.
 * Provides consistent error response format.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Extract a safe error message from an unknown error.
 * Always returns a generic message to avoid leaking internals.
 * Internal error details are logged server-side only.
 */
export function safeErrorMessage(_error: unknown): string {
  return 'Internal server error';
}

/**
 * Create a production-safe error NextResponse.
 * Logs the full error server-side but returns sanitized response to client.
 *
 * @param error - The caught error
 * @param status - HTTP status code (default: 500)
 * @param context - Optional context for logging
 */
export function safeErrorResponse(
  error: unknown,
  status: number = 500,
  context?: string
): NextResponse {
  const logPrefix = context ? `[${context}]` : '[API]';

  // Always log the full error server-side
  logger.error(`${logPrefix} Error:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  const message = safeErrorMessage(error);

  // Derive an error code from the HTTP status
  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  const code = codeMap[status] ?? 'INTERNAL_ERROR';

  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}
