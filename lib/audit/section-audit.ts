/**
 * Section Operations Audit Logging
 * Comprehensive audit trail for all section CRUD operations
 */

import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/compliance/audit-logger';
import { logger } from '@/lib/logger';

export interface SectionAuditContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  courseId: string;
  chapterId: string;
  sectionId?: string;
}

export interface SectionChangeData {
  title?: string;
  description?: string;
  videoUrl?: string;
  learningObjectives?: string;
  isFree?: boolean;
  isPublished?: boolean;
  position?: number;
  [key: string]: unknown;
}

class SectionAuditLogger {
  private static instance: SectionAuditLogger;

  private constructor() {}

  static getInstance(): SectionAuditLogger {
    if (!SectionAuditLogger.instance) {
      SectionAuditLogger.instance = new SectionAuditLogger();
    }
    return SectionAuditLogger.instance;
  }

  /**
   * Log section creation
   */
  async logSectionCreated(
    context: SectionAuditContext,
    sectionData: SectionChangeData
  ): Promise<void> {
    try {
      await auditLogger.log(
        AuditEventType.DATA_CREATE,
        AuditSeverity.INFO,
        `Section created: ${sectionData.title || 'Untitled'} in course ${context.courseId}`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION',
          resourceId: context.sectionId || 'new',
          newValue: sectionData,
          affectedResources: [
            { type: 'COURSE', id: context.courseId },
            { type: 'CHAPTER', id: context.chapterId },
          ],
          complianceFlags: ['CONTENT_CREATION'],
        }
      );

      logger.info('Section created audit logged', {
        sectionId: context.sectionId,
        courseId: context.courseId,
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log section creation audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Log section update
   */
  async logSectionUpdated(
    context: SectionAuditContext,
    oldData: SectionChangeData,
    newData: SectionChangeData
  ): Promise<void> {
    try {
      const changes = this.calculateChanges(oldData, newData);

      if (Object.keys(changes).length === 0) {
        return; // No actual changes
      }

      await auditLogger.log(
        AuditEventType.DATA_UPDATE,
        AuditSeverity.INFO,
        `Section updated: ${newData.title || oldData.title || 'Section'} - ${Object.keys(changes).join(', ')} changed`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION',
          resourceId: context.sectionId || 'unknown',
          oldValue: oldData,
          newValue: newData,
          affectedResources: [
            { type: 'COURSE', id: context.courseId },
            { type: 'CHAPTER', id: context.chapterId },
          ],
          complianceFlags: ['CONTENT_MODIFICATION'],
        }
      );

      logger.info('Section update audit logged', {
        sectionId: context.sectionId,
        changes: Object.keys(changes),
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log section update audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Log section deletion
   */
  async logSectionDeleted(
    context: SectionAuditContext,
    sectionData: SectionChangeData
  ): Promise<void> {
    try {
      await auditLogger.log(
        AuditEventType.DATA_DELETE,
        AuditSeverity.WARNING,
        `Section deleted: ${sectionData.title || 'Untitled'} from course ${context.courseId}`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION',
          resourceId: context.sectionId || 'unknown',
          oldValue: sectionData,
          affectedResources: [
            { type: 'COURSE', id: context.courseId },
            { type: 'CHAPTER', id: context.chapterId },
          ],
          complianceFlags: ['CONTENT_DELETION', 'DATA_RETENTION'],
        }
      );

      logger.warn('Section deletion audit logged', {
        sectionId: context.sectionId,
        courseId: context.courseId,
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log section deletion audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Log section publish/unpublish
   */
  async logSectionPublishStatusChanged(
    context: SectionAuditContext,
    isPublished: boolean,
    sectionTitle?: string
  ): Promise<void> {
    try {
      await auditLogger.log(
        AuditEventType.DATA_UPDATE,
        isPublished ? AuditSeverity.INFO : AuditSeverity.WARNING,
        `Section ${isPublished ? 'published' : 'unpublished'}: ${sectionTitle || 'Section'}`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION',
          resourceId: context.sectionId || 'unknown',
          oldValue: { isPublished: !isPublished },
          newValue: { isPublished },
          affectedResources: [
            { type: 'COURSE', id: context.courseId },
            { type: 'CHAPTER', id: context.chapterId },
          ],
          complianceFlags: isPublished
            ? ['CONTENT_PUBLICATION']
            : ['CONTENT_WITHDRAWAL'],
        }
      );

      logger.info('Section publish status change audit logged', {
        sectionId: context.sectionId,
        isPublished,
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log section publish status audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Log content enrichment (code, math, resources added)
   */
  async logContentEnrichment(
    context: SectionAuditContext,
    contentType: 'code' | 'math' | 'video' | 'blog' | 'article' | 'note',
    action: 'added' | 'updated' | 'removed',
    contentId?: string
  ): Promise<void> {
    try {
      await auditLogger.log(
        AuditEventType.DATA_UPDATE,
        AuditSeverity.INFO,
        `Section content ${action}: ${contentType} in section ${context.sectionId}`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION_CONTENT',
          resourceId: contentId || 'new',
          affectedResources: [
            { type: 'SECTION', id: context.sectionId || 'unknown' },
            { type: 'COURSE', id: context.courseId },
          ],
          complianceFlags: ['CONTENT_ENRICHMENT'],
        }
      );

      logger.info('Section content enrichment audit logged', {
        sectionId: context.sectionId,
        contentType,
        action,
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log content enrichment audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Log bulk operations
   */
  async logBulkOperation(
    context: Omit<SectionAuditContext, 'sectionId'>,
    operation: 'reorder' | 'publish' | 'unpublish' | 'delete',
    sectionIds: string[],
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await auditLogger.log(
        AuditEventType.DATA_UPDATE,
        AuditSeverity.WARNING,
        `Bulk section ${operation}: ${sectionIds.length} sections affected`,
        {
          userId: context.userId,
          userEmail: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
        },
        {
          resourceType: 'SECTION',
          resourceId: 'bulk',
          affectedResources: [
            { type: 'COURSE', id: context.courseId },
            { type: 'CHAPTER', id: context.chapterId },
            ...sectionIds.map(id => ({ type: 'SECTION' as const, id })),
          ],
          complianceFlags: ['BULK_OPERATION'],
          metadata: {
            operation,
            sectionCount: sectionIds.length,
            ...details,
          },
        }
      );

      logger.warn('Bulk section operation audit logged', {
        operation,
        sectionCount: sectionIds.length,
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Failed to log bulk operation audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });
    }
  }

  /**
   * Calculate specific changes between old and new data
   */
  private calculateChanges(
    oldData: SectionChangeData,
    newData: SectionChangeData
  ): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach(key => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Deep equality check for objects and arrays
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    return changes;
  }

  /**
   * Get audit trail for a section
   */
  async getSectionAuditTrail(sectionId: string, limit: number = 50): Promise<unknown[]> {
    try {
      // This would query the audit logs for the specific section
      // Implementation depends on your audit log storage
      logger.info('Retrieving section audit trail', { sectionId, limit });
      return [];
    } catch (error) {
      logger.error('Failed to retrieve section audit trail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sectionId,
      });
      return [];
    }
  }
}

// Export singleton instance
export const sectionAudit = SectionAuditLogger.getInstance();

// Convenience helper functions
export const sectionAuditHelpers = {
  logCreated: (context: SectionAuditContext, data: SectionChangeData) =>
    sectionAudit.logSectionCreated(context, data),

  logUpdated: (
    context: SectionAuditContext,
    oldData: SectionChangeData,
    newData: SectionChangeData
  ) => sectionAudit.logSectionUpdated(context, oldData, newData),

  logDeleted: (context: SectionAuditContext, data: SectionChangeData) =>
    sectionAudit.logSectionDeleted(context, data),

  logPublished: (context: SectionAuditContext, title?: string) =>
    sectionAudit.logSectionPublishStatusChanged(context, true, title),

  logUnpublished: (context: SectionAuditContext, title?: string) =>
    sectionAudit.logSectionPublishStatusChanged(context, false, title),

  logContentAdded: (
    context: SectionAuditContext,
    type: 'code' | 'math' | 'video' | 'blog' | 'article' | 'note',
    contentId?: string
  ) => sectionAudit.logContentEnrichment(context, type, 'added', contentId),

  logBulkOperation: (
    context: Omit<SectionAuditContext, 'sectionId'>,
    operation: 'reorder' | 'publish' | 'unpublish' | 'delete',
    sectionIds: string[],
    details?: Record<string, unknown>
  ) => sectionAudit.logBulkOperation(context, operation, sectionIds, details),

  getAuditTrail: (sectionId: string, limit?: number) =>
    sectionAudit.getSectionAuditTrail(sectionId, limit),
};
