/**
 * Brute Force Protection Module
 *
 * Activates existing Prisma schema fields:
 * - User.isAccountLocked
 * - User.failedLoginAttempts
 * - User.lockReason
 * - LoginAttempt model
 *
 * Configuration:
 * - Max attempts: 5
 * - Lockout duration: 15 minutes
 * - Auto-unlock after lockout period
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Record a login attempt in the LoginAttempt table
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean,
  userAgent?: string
): Promise<void> {
  try {
    await db.loginAttempt.create({
      data: {
        id: uuidv4(),
        email,
        ipAddress,
        userAgent: userAgent ?? null,
        success,
      },
    });
  } catch (error) {
    // Log but don't fail auth flow
    logger.error('[BruteForce] Failed to record login attempt', error);
  }
}

/**
 * Check if a user's account is locked
 * Returns lock status and remaining time if locked
 */
export async function checkAccountLocked(userId: string): Promise<{
  locked: boolean;
  remainingMs: number;
  reason: string | null;
}> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        isAccountLocked: true,
        lockReason: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return { locked: false, remainingMs: 0, reason: null };
    }

    // If account is explicitly locked
    if (user.isAccountLocked) {
      // Check if lockout period has expired (auto-unlock)
      if (user.lastLoginAt) {
        const lockExpiry = new Date(user.lastLoginAt.getTime() + LOCKOUT_DURATION_MS);
        const now = new Date();

        if (now >= lockExpiry) {
          // Auto-unlock: lockout period has expired
          await db.user.update({
            where: { id: userId },
            data: {
              isAccountLocked: false,
              lockReason: null,
              failedLoginAttempts: 0,
            },
          });
          return { locked: false, remainingMs: 0, reason: null };
        }

        // Still locked
        return {
          locked: true,
          remainingMs: lockExpiry.getTime() - now.getTime(),
          reason: user.lockReason,
        };
      }

      // Locked without lastLoginAt - keep locked
      return {
        locked: true,
        remainingMs: LOCKOUT_DURATION_MS,
        reason: user.lockReason,
      };
    }

    return { locked: false, remainingMs: 0, reason: null };
  } catch (error) {
    logger.error('[BruteForce] Failed to check account lock status', error);
    // On error, allow login attempt (fail open for UX)
    return { locked: false, remainingMs: 0, reason: null };
  }
}

/**
 * Increment failed login attempts and lock account if threshold exceeded
 */
export async function incrementFailedAttempts(userId: string): Promise<{
  locked: boolean;
  attempts: number;
}> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (!user) {
      return { locked: false, attempts: 0 };
    }

    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        isAccountLocked: shouldLock,
        lockReason: shouldLock ? `Too many failed login attempts (${newAttempts})` : null,
        lastLoginAt: shouldLock ? new Date() : undefined, // Track when locked for auto-unlock
      },
    });

    return { locked: shouldLock, attempts: newAttempts };
  } catch (error) {
    logger.error('[BruteForce] Failed to increment failed attempts', error);
    return { locked: false, attempts: 0 };
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        isAccountLocked: false,
        lockReason: null,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('[BruteForce] Failed to reset failed attempts', error);
  }
}

/**
 * Get count of recent login attempts for IP-based rate limiting analysis
 */
export async function getRecentAttemptCount(
  email: string,
  ipAddress: string,
  windowMinutes: number = 15
): Promise<number> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await db.loginAttempt.count({
      where: {
        OR: [
          { email },
          { ipAddress },
        ],
        createdAt: { gte: windowStart },
        success: false,
      },
    });

    return count;
  } catch (error) {
    logger.error('[BruteForce] Failed to get recent attempt count', error);
    return 0;
  }
}

/**
 * Check if an email/IP combination is being rate limited by attempt count
 * This is separate from Redis rate limiting - it uses database records
 */
export async function isAttemptRateLimited(
  email: string,
  ipAddress: string,
  maxAttempts: number = 10,
  windowMinutes: number = 15
): Promise<boolean> {
  const count = await getRecentAttemptCount(email, ipAddress, windowMinutes);
  return count >= maxAttempts;
}
