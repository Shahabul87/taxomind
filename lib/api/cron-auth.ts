/**
 * Shared cron authentication utility.
 *
 * Fail-closed design: denies ALL requests when CRON_SECRET is unset.
 * Checks both `Authorization: Bearer <secret>` and `x-cron-secret` headers.
 *
 * Usage:
 *   const authResponse = withCronAuth(request);
 *   if (authResponse) return authResponse;
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify cron authorization from request headers.
 * Returns false (denies) when CRON_SECRET is not configured (fail-closed).
 */
export function verifyCronAuth(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    logger.warn('[CRON_AUTH] CRON_SECRET not configured — denying request (fail-closed)');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  // Also check x-cron-secret header (used by some cron providers)
  const cronSecretHeader = request.headers.get('x-cron-secret');
  return cronSecretHeader === CRON_SECRET;
}

/**
 * Middleware-style cron auth check.
 * Returns a 401 NextResponse if unauthorized, or null if authorized.
 *
 * Usage:
 *   const authResponse = withCronAuth(request);
 *   if (authResponse) return authResponse;
 */
export function withCronAuth(request: NextRequest): NextResponse | null {
  if (verifyCronAuth(request)) {
    return null;
  }

  logger.warn('[CRON_AUTH] Unauthorized cron request');
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
