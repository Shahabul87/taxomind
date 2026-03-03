/**
 * Phase 3: Admin Audit and Session Tracking Helpers
 *
 * Helper functions for logging admin actions to AdminAuditLog
 * and tracking sessions in AdminSessionMetrics
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface AdminAuditEventData {
  userId: string;
  action: string;
  actionCategory?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestMethod?: string;
  requestPath?: string;
  success: boolean;
  statusCode?: number;
  failureReason?: string;
  errorDetails?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  duration?: number;
}

interface AdminSessionData {
  userId: string;
  sessionId: string;
  sessionToken?: string;
  ipAddress: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  location?: string;
}

interface SessionUpdateData {
  actionsCount?: number;
  apiCallsCount?: number;
  dataAccessed?: string[];
  pagesVisited?: string[];
  isSuspicious?: boolean;
  suspicionReason?: string;
  securityScore?: number;
}

/**
 * Log an admin action to AdminAuditLog
 */
export async function logAdminAuditEvent(data: AdminAuditEventData): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        userId: data.userId,
        adminAccountId: data.userId,
        action: data.action,
        actionCategory: data.actionCategory || 'GENERAL',
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent,
        sessionId: data.sessionId,
        requestMethod: data.requestMethod,
        requestPath: data.requestPath,
        success: data.success,
        statusCode: data.statusCode,
        failureReason: data.failureReason,
        errorDetails: data.errorDetails,
        previousValue: data.previousValue ? JSON.parse(JSON.stringify(data.previousValue)) : undefined,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        duration: data.duration,
        timestamp: new Date(),
      },
    });

    logger.info(`[admin-audit] Logged action: ${data.action} for user ${data.userId} - ${data.success ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    logger.error('[admin-audit] Failed to log audit event:', error);
  }
}

/**
 * Create a new admin session metric record
 */
export async function createAdminSessionMetric(data: AdminSessionData): Promise<void> {
  try {
    await db.adminSessionMetrics.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        location: data.location,
        actionsCount: 0,
        apiCallsCount: 0,
        dataAccessed: [],
        pagesVisited: [],
        isSuspicious: false,
        securityScore: 100,
      },
    });

    logger.info(`[admin-session] Created session metric for user ${data.userId}, session ${data.sessionId}`);
  } catch (error) {
    logger.error('[admin-session] Failed to create session metric:', error);
  }
}

/**
 * Update an existing admin session metric
 */
export async function updateAdminSessionMetric(
  sessionId: string,
  updates: SessionUpdateData
): Promise<void> {
  try {
    const existingSession = await db.adminSessionMetrics.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      logger.warn(`[admin-session] Session ${sessionId} not found for update`);
      return;
    }

    await db.adminSessionMetrics.update({
      where: { sessionId },
      data: {
        lastActivity: new Date(),
        actionsCount: updates.actionsCount !== undefined ? updates.actionsCount : undefined,
        apiCallsCount: updates.apiCallsCount !== undefined ? updates.apiCallsCount : undefined,
        dataAccessed: updates.dataAccessed ? {
          push: updates.dataAccessed,
        } : undefined,
        pagesVisited: updates.pagesVisited ? {
          push: updates.pagesVisited,
        } : undefined,
        isSuspicious: updates.isSuspicious !== undefined ? updates.isSuspicious : undefined,
        suspicionReason: updates.suspicionReason,
        securityScore: updates.securityScore !== undefined ? updates.securityScore : undefined,
      },
    });

    logger.info(`[admin-session] Updated session metric for session ${sessionId}`);
  } catch (error) {
    logger.error('[admin-session] Failed to update session metric:', error);
  }
}

/**
 * End an admin session (logout)
 */
export async function endAdminSession(
  sessionId: string,
  logoutReason: string = 'USER_LOGOUT',
  wasForced: boolean = false
): Promise<void> {
  try {
    const existingSession = await db.adminSessionMetrics.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      logger.warn(`[admin-session] Session ${sessionId} not found for logout`);
      return;
    }

    const sessionDuration = Math.floor(
      (new Date().getTime() - existingSession.loginTime.getTime()) / 1000
    );

    await db.adminSessionMetrics.update({
      where: { sessionId },
      data: {
        logoutTime: new Date(),
        sessionDuration,
        logoutReason,
        wasForced,
      },
    });

    logger.info(`[admin-session] Ended session ${sessionId} after ${sessionDuration}s - Reason: ${logoutReason}`);
  } catch (error) {
    logger.error('[admin-session] Failed to end session:', error);
  }
}

/**
 * Helper: Log admin login success
 */
export async function logAdminLoginSuccess(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent?: string,
  provider: string = 'credentials'
): Promise<void> {
  await logAdminAuditEvent({
    userId,
    action: 'LOGIN',
    actionCategory: 'AUTHENTICATION',
    ipAddress,
    userAgent,
    sessionId,
    success: true,
    metadata: {
      provider,
      sessionDuration: '4_HOURS',
    },
  });
}

/**
 * Helper: Log admin login failure
 */
export async function logAdminLoginFailure(
  userId: string,
  ipAddress: string,
  failureReason: string,
  userAgent?: string
): Promise<void> {
  await logAdminAuditEvent({
    userId,
    action: 'LOGIN_FAILED',
    actionCategory: 'AUTHENTICATION',
    ipAddress,
    userAgent,
    success: false,
    failureReason,
  });
}

/**
 * Helper: Log admin logout
 */
export async function logAdminLogout(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logAdminAuditEvent({
    userId,
    action: 'LOGOUT',
    actionCategory: 'AUTHENTICATION',
    ipAddress,
    userAgent,
    sessionId,
    success: true,
  });
}
