import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { CourseAuditLog } from '@/types/course';

/**
 * Enterprise-grade course audit logging system
 * Tracks all course-related operations for compliance and security
 */

export interface AuditLogOptions {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log course creation
 */
export async function logCourseCreation(
  courseId: string,
  options: AuditLogOptions,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action: 'CREATE',
        entityType: 'COURSE',
        entityId: courseId,
        resourceType: 'COURSE',
        resourceId: courseId,
        metadata: JSON.stringify({
          ...metadata,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        }),
        timestamp: new Date(),
      },
    });

    logger.info('Course creation logged', { courseId, userId: options.userId });
  } catch (error) {
    logger.error('Failed to log course creation', {
      courseId,
      userId: options.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Log course update
 */
export async function logCourseUpdate(
  courseId: string,
  options: AuditLogOptions,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action: 'UPDATE',
        entityType: 'COURSE',
        entityId: courseId,
        resourceType: 'COURSE',
        resourceId: courseId,
        changes: changes,
        metadata: JSON.stringify({
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        }),
        timestamp: new Date(),
      },
    });

    logger.info('Course update logged', { courseId, userId: options.userId });
  } catch (error) {
    logger.error('Failed to log course update', {
      courseId,
      userId: options.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Log course deletion
 */
export async function logCourseDeletion(
  courseId: string,
  options: AuditLogOptions,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action: 'DELETE',
        entityType: 'COURSE',
        entityId: courseId,
        resourceType: 'COURSE',
        resourceId: courseId,
        metadata: JSON.stringify({
          ...metadata,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          deletedAt: new Date().toISOString(),
        }),
        timestamp: new Date(),
      },
    });

    logger.info('Course deletion logged', { courseId, userId: options.userId });
  } catch (error) {
    logger.error('Failed to log course deletion', {
      courseId,
      userId: options.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Log course publishing/unpublishing
 */
export async function logCoursePublishChange(
  courseId: string,
  isPublished: boolean,
  options: AuditLogOptions
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId,
        action: isPublished ? 'PUBLISH' : 'UNPUBLISH',
        entityType: 'COURSE',
        entityId: courseId,
        resourceType: 'COURSE',
        resourceId: courseId,
        metadata: JSON.stringify({
          isPublished,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        }),
        timestamp: new Date(),
      },
    });

    logger.info(`Course ${isPublished ? 'published' : 'unpublished'}`, {
      courseId,
      userId: options.userId,
    });
  } catch (error) {
    logger.error('Failed to log course publish change', {
      courseId,
      userId: options.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Log bulk course operations
 */
export async function logBulkCourseOperation(
  action: 'DELETE' | 'PUBLISH' | 'UNPUBLISH',
  courseIds: string[],
  options: AuditLogOptions
): Promise<void> {
  try {
    // Create individual audit logs for each course
    const auditLogs = courseIds.map((courseId) => ({
      userId: options.userId,
      action,
      entityType: 'COURSE',
      entityId: courseId,
      resourceType: 'COURSE',
      resourceId: courseId,
      metadata: JSON.stringify({
        bulkOperation: true,
        totalAffected: courseIds.length,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      }),
      timestamp: new Date(),
    }));

    await db.auditLog.createMany({
      data: auditLogs,
    });

    logger.info('Bulk course operation logged', {
      action,
      courseCount: courseIds.length,
      userId: options.userId,
    });
  } catch (error) {
    logger.error('Failed to log bulk course operation', {
      action,
      courseCount: courseIds.length,
      userId: options.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get course audit history
 */
export async function getCourseAuditHistory(
  courseId: string,
  limit: number = 50
): Promise<CourseAuditLog[]> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        resourceType: 'COURSE',
        resourceId: courseId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return logs
      .filter((log) => log.userId) // Filter out logs without userId
      .map((log) => ({
        action: log.action as CourseAuditLog['action'],
        courseId: log.resourceId || undefined,
        userId: log.userId!,
        metadata: (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) as Record<string, unknown>,
        timestamp: log.timestamp,
      }));
  } catch (error) {
    logger.error('Failed to get course audit history', {
      courseId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Get user's course operations
 */
export async function getUserCourseOperations(
  userId: string,
  limit: number = 100
): Promise<CourseAuditLog[]> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        userId,
        resourceType: 'COURSE',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return logs
      .filter((log) => log.userId) // Filter out logs without userId
      .map((log) => ({
        action: log.action as CourseAuditLog['action'],
        courseId: log.resourceId || undefined,
        userId: log.userId!,
        metadata: (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) as Record<string, unknown>,
        timestamp: log.timestamp,
      }));
  } catch (error) {
    logger.error('Failed to get user course operations', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Export audit logs for compliance reports
 */
export async function exportCourseAuditLogs(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        resourceType: 'COURSE',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Timestamp', 'Action', 'User', 'Course ID', 'Metadata'];
      const rows = logs.map((log) => [
        log.timestamp.toISOString(),
        log.action,
        log.user?.email || 'Unknown',
        log.resourceId || 'N/A',
        JSON.stringify(log.metadata),
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    // Return JSON format
    return JSON.stringify(logs, null, 2);
  } catch (error) {
    logger.error('Failed to export audit logs', {
      startDate,
      endDate,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to export audit logs');
  }
}
