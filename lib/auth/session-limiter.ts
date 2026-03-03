/**
 * Session Limiter Module
 *
 * Enforces concurrent session limits per user.
 * Uses AuthSession model from Prisma schema.
 *
 * Configuration:
 * - Max concurrent sessions: 5
 * - Strategy: Terminate oldest session (not reject new login)
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const MAX_CONCURRENT_SESSIONS = 5;

/**
 * Count active sessions for a user
 */
export async function countActiveSessions(userId: string): Promise<number> {
  try {
    return await db.authSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
  } catch (error) {
    logger.error('[SessionLimiter] Failed to count active sessions', error);
    return 0;
  }
}

/**
 * Enforce session limit by terminating oldest session if limit exceeded
 */
export async function enforceSessionLimit(
  userId: string,
  currentDeviceId?: string
): Promise<{ enforced: boolean; terminatedCount: number }> {
  try {
    const activeCount = await countActiveSessions(userId);

    if (activeCount >= MAX_CONCURRENT_SESSIONS) {
      // Find oldest session (excluding current device if re-authenticating)
      const oldest = await db.authSession.findFirst({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
          ...(currentDeviceId ? { NOT: { deviceId: currentDeviceId } } : {}),
        },
        orderBy: { lastActivity: 'asc' },
      });

      if (oldest) {
        await db.authSession.update({
          where: { id: oldest.id },
          data: { isActive: false },
        });

        logger.info('[SessionLimiter] Terminated oldest session', { sessionId: oldest.id, userId });
        return { enforced: true, terminatedCount: 1 };
      }
    }

    return { enforced: false, terminatedCount: 0 };
  } catch (error) {
    logger.error('[SessionLimiter] Failed to enforce session limit', error);
    return { enforced: false, terminatedCount: 0 };
  }
}

/**
 * Get all active sessions for a user
 */
export async function getActiveSessions(userId: string) {
  try {
    return await db.authSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastActivity: true,
        createdAt: true,
        isTrustedDevice: true,
        riskLevel: true,
      },
      orderBy: { lastActivity: 'desc' },
    });
  } catch (error) {
    logger.error('[SessionLimiter] Failed to get active sessions', error);
    return [];
  }
}

/**
 * Terminate all sessions for a user except optionally the current one
 */
export async function terminateAllSessions(
  userId: string,
  exceptDeviceId?: string
): Promise<{ terminatedCount: number }> {
  try {
    const result = await db.authSession.updateMany({
      where: {
        userId,
        isActive: true,
        ...(exceptDeviceId ? { NOT: { deviceId: exceptDeviceId } } : {}),
      },
      data: { isActive: false },
    });

    logger.info('[SessionLimiter] Terminated all sessions', { count: result.count, userId });
    return { terminatedCount: result.count };
  } catch (error) {
    logger.error('[SessionLimiter] Failed to terminate all sessions', error);
    return { terminatedCount: 0 };
  }
}

/**
 * Terminate a specific session
 */
export async function terminateSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify session belongs to user before terminating
    const session = await db.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return false;
    }

    await db.authSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    logger.info('[SessionLimiter] Terminated session', { sessionId, userId });
    return true;
  } catch (error) {
    logger.error('[SessionLimiter] Failed to terminate session', error);
    return false;
  }
}
