import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Returns the error message in development, generic message in production.
 * Prevents leaking internal error details to clients.
 */
export function safeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Internal server error';
}

/**
 * Creates a standardized error JSON response.
 * Logs the full error server-side, returns safe message to client.
 */
export function createErrorResponse(
  error: unknown,
  routeName: string,
  status = 500
): NextResponse {
  logger.error(`[${routeName}] Error:`, error);
  return NextResponse.json(
    { error: safeErrorMessage(error) },
    { status }
  );
}
