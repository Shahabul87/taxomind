import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * SECURITY: Debug Endpoint Guard
 *
 * This utility ensures debug endpoints are only accessible in development
 * or to admin users in non-production environments.
 *
 * Usage in API routes:
 * ```typescript
 * import { debugGuard } from '@/lib/debug-guard';
 *
 * export async function GET() {
 *   const guardResult = await debugGuard();
 *   if (guardResult) return guardResult;
 *
 *   // Debug endpoint logic here
 * }
 * ```
 */
export async function debugGuard(): Promise<NextResponse | null> {
  // SECURITY: Block all debug endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  // In non-production, require authentication
  // NOTE: Users don't have roles - only AdminAccount has roles
  // For debug endpoints in development, just require authentication
  const user = await currentUser();
  if (!user) {
    return new NextResponse('Unauthorized - Authentication required', { status: 401 });
  }

  // Allow access
  return null;
}

/**
 * Check if debug mode is enabled (for conditional logic)
 */
export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEBUG_MODE === 'true';
}

/**
 * Log debug information (only in debug mode)
 */
export function debugLog(message: string, data?: any): void {
  if (isDebugMode()) {
    logger.debug(`[DEBUG] ${message}`, data || '');
  }
}
