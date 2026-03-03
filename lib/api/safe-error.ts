/**
 * Production-safe error response helpers.
 *
 * Strips stack traces and internal details in production.
 * Provides consistent error response format.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const IS_PRODUCTION = process.env.NODE_ENV !== 'development';

/**
 * Extract a safe error message from an unknown error.
 * In production, returns a generic message to avoid leaking internals.
 * In development, returns the actual error message.
 */
export function safeErrorMessage(error: unknown): string {
  if (IS_PRODUCTION) {
    return 'Internal server error';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
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

  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}
