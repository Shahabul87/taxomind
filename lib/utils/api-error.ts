import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Returns a generic error message to prevent leaking internal details to clients.
 * Internal error details should only be logged server-side.
 */
export function safeErrorMessage(_error: unknown): string {
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
