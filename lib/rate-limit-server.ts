"use server";

/**
 * Server-action-safe rate limiting wrapper
 * This file is specifically designed to work with Next.js 15 server actions
 */

import type { RateLimitResult } from './rate-limit';
import { logger } from '@/lib/logger';

export type AuthEndpoint =
  | 'login'
  | 'admin-login'
  | 'register'
  | 'reset'
  | 'admin-reset'
  | 'verify'
  | 'twoFactor'
  | 'mfa-recovery'
  | 'mfa-disable'
  | 'mfa-setup'
  | 'mfa-verify';

/**
 * Server-action-safe rate limit function
 * Dynamically imports the rate limiting module to avoid bundling issues
 */
export async function rateLimitAuth(
  endpoint: AuthEndpoint,
  identifier: string
): Promise<RateLimitResult> {
  try {
    // Dynamic import to avoid module-level issues in server actions
    const { rateLimitAuth: rateLimitFn } = await import('./rate-limit');
    return await rateLimitFn(endpoint, identifier);
  } catch (error) {
    logger.error('[RateLimit] Error in rate limiting, allowing request:', error);
    // Fallback: allow the request if rate limiting fails
    return {
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 3600000
    };
  }
}
