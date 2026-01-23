/**
 * Session Cleanup Module
 *
 * Provides utilities for cleaning up expired sessions and old login attempts.
 * Used by cron job endpoint for scheduled cleanup.
 *
 * Cleanup Rules:
 * - Delete expired sessions
 * - Delete inactive sessions older than 30 days
 * - Delete login attempts older than 7 days
 */

import { db } from '@/lib/db';

export interface CleanupResult {
  sessionsDeleted: number;
  loginAttemptsDeleted: number;
  errors: string[];
}

/**
 * Clean up expired sessions and old login attempts
 */
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  const errors: string[] = [];
  let sessionsDeleted = 0;
  let loginAttemptsDeleted = 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Delete expired sessions
  try {
    const expiredResult = await db.authSession.deleteMany({
      where: {
        OR: [
          // Expired sessions
          { expiresAt: { lt: new Date() } },
          // Inactive sessions older than 30 days
          {
            AND: [
              { lastActivity: { lt: thirtyDaysAgo } },
              { isActive: false },
            ],
          },
        ],
      },
    });
    sessionsDeleted = expiredResult.count;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error deleting sessions';
    errors.push(`Sessions cleanup: ${message}`);
    console.error('[SessionCleanup] Failed to delete expired sessions:', error);
  }

  // 2. Delete old login attempts (keep 7 days for security analysis)
  try {
    const attemptsResult = await db.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
      },
    });
    loginAttemptsDeleted = attemptsResult.count;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error deleting login attempts';
    errors.push(`LoginAttempts cleanup: ${message}`);
    console.error('[SessionCleanup] Failed to delete old login attempts:', error);
  }

  // Log summary
  console.log('[SessionCleanup] Cleanup completed:', {
    sessionsDeleted,
    loginAttemptsDeleted,
    errors: errors.length > 0 ? errors : 'none',
  });

  return {
    sessionsDeleted,
    loginAttemptsDeleted,
    errors,
  };
}

/**
 * Get cleanup statistics without performing cleanup
 * Useful for monitoring and dashboards
 */
export async function getCleanupStats(): Promise<{
  expiredSessions: number;
  oldInactiveSessions: number;
  oldLoginAttempts: number;
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [expiredSessions, oldInactiveSessions, oldLoginAttempts] = await Promise.all([
      db.authSession.count({
        where: { expiresAt: { lt: new Date() } },
      }),
      db.authSession.count({
        where: {
          lastActivity: { lt: thirtyDaysAgo },
          isActive: false,
        },
      }),
      db.loginAttempt.count({
        where: { createdAt: { lt: sevenDaysAgo } },
      }),
    ]);

    return {
      expiredSessions,
      oldInactiveSessions,
      oldLoginAttempts,
    };
  } catch (error) {
    console.error('[SessionCleanup] Failed to get cleanup stats:', error);
    return {
      expiredSessions: 0,
      oldInactiveSessions: 0,
      oldLoginAttempts: 0,
    };
  }
}
