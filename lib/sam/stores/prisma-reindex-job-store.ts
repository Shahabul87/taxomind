/**
 * Prisma-backed Reindex Job Store
 *
 * Provides persistent storage for memory lifecycle reindex jobs.
 * Replaces InMemoryReindexJobStore for production use.
 */

import { getDb } from './db-provider';
import { logger } from '@/lib/logger';
import type {
  ReindexJob,
  ReindexJobStore,
  ReindexJobStatus,
  ContentEntityType,
  ReindexPriority,
} from '@sam-ai/agentic';

// Map package types to Prisma enum values
const STATUS_MAP: Record<ReindexJobStatus, 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
  pending: 'PENDING',
  queued: 'PENDING', // Map queued to PENDING
  processing: 'RUNNING',
  completed: 'COMPLETED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
  retrying: 'RUNNING', // Map retrying to RUNNING
};

const REVERSE_STATUS_MAP: Record<string, ReindexJobStatus> = {
  PENDING: 'pending',
  RUNNING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Convert Prisma job to package ReindexJob type
 */
function toReindexJob(prismaJob: {
  id: string;
  entityType: string;
  entityId: string;
  courseId: string | null;
  changeType: string;
  status: string;
  priority: number;
  processedAt: Date | null;
  documentsIndexed: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ReindexJob {
  return {
    id: prismaJob.id,
    type: 'full', // Default type
    status: REVERSE_STATUS_MAP[prismaJob.status] ?? 'pending',
    priority: prismaJob.priority as ReindexPriority,
    entityType: prismaJob.entityType as ContentEntityType,
    entityId: prismaJob.entityId,
    changeType: prismaJob.changeType as 'create' | 'update' | 'delete' | 'bulk_update',
    metadata: {
      courseId: prismaJob.courseId ?? undefined,
    },
    attempts: 0,
    maxAttempts: 3,
    lastAttemptAt: undefined,
    lastError: prismaJob.error ?? undefined,
    scheduledFor: prismaJob.createdAt,
    startedAt: prismaJob.status === 'RUNNING' ? new Date() : undefined,
    completedAt: prismaJob.processedAt ?? undefined,
    createdAt: prismaJob.createdAt,
    updatedAt: prismaJob.updatedAt,
  };
}

/**
 * Prisma-backed implementation of ReindexJobStore
 */
export class PrismaReindexJobStore implements ReindexJobStore {
  async create(
    job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReindexJob> {
    try {
      const created = await getDb().sAMReindexJob.create({
        data: {
          entityType: job.entityType,
          entityId: job.entityId,
          courseId: job.metadata?.courseId ?? null,
          changeType: job.changeType,
          status: STATUS_MAP[job.status],
          priority: job.priority,
        },
      });

      logger.debug('[PrismaReindexJobStore] Created job', { id: created.id });
      return toReindexJob(created);
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to create job', { error });
      throw error;
    }
  }

  async get(id: string): Promise<ReindexJob | null> {
    try {
      const job = await getDb().sAMReindexJob.findUnique({
        where: { id },
      });

      return job ? toReindexJob(job) : null;
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to get job', { id, error });
      throw error;
    }
  }

  async update(
    id: string,
    updates: Partial<ReindexJob>
  ): Promise<ReindexJob | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.status) {
        updateData.status = STATUS_MAP[updates.status];
      }
      if (updates.priority !== undefined) {
        updateData.priority = updates.priority;
      }
      if (updates.lastError !== undefined) {
        updateData.error = updates.lastError;
      }
      if (updates.completedAt) {
        updateData.processedAt = updates.completedAt;
      }

      const updated = await getDb().sAMReindexJob.update({
        where: { id },
        data: updateData,
      });

      logger.debug('[PrismaReindexJobStore] Updated job', { id });
      return toReindexJob(updated);
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to update job', { id, error });
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await getDb().sAMReindexJob.delete({
        where: { id },
      });

      logger.debug('[PrismaReindexJobStore] Deleted job', { id });
      return true;
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to delete job', { id, error });
      return false;
    }
  }

  async findPending(limit: number): Promise<ReindexJob[]> {
    try {
      const jobs = await getDb().sAMReindexJob.findMany({
        where: {
          status: 'PENDING',
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: limit,
      });

      return jobs.map(toReindexJob);
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to find pending jobs', { error });
      throw error;
    }
  }

  async findByEntity(
    entityType: ContentEntityType,
    entityId: string
  ): Promise<ReindexJob[]> {
    try {
      const jobs = await getDb().sAMReindexJob.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map(toReindexJob);
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to find jobs by entity', {
        entityType,
        entityId,
        error,
      });
      throw error;
    }
  }

  async findByStatus(
    status: ReindexJobStatus,
    limit?: number
  ): Promise<ReindexJob[]> {
    try {
      const jobs = await getDb().sAMReindexJob.findMany({
        where: {
          status: STATUS_MAP[status],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return jobs.map(toReindexJob);
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to find jobs by status', {
        status,
        error,
      });
      throw error;
    }
  }

  async countByStatus(): Promise<Record<ReindexJobStatus, number>> {
    try {
      const counts = await getDb().sAMReindexJob.groupBy({
        by: ['status'],
        _count: true,
      });

      const result: Record<ReindexJobStatus, number> = {
        pending: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        retrying: 0,
      };

      for (const item of counts) {
        const status = REVERSE_STATUS_MAP[item.status];
        if (status) {
          result[status] = item._count;
        }
      }

      return result;
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to count by status', { error });
      throw error;
    }
  }

  async cleanupCompleted(olderThan: Date): Promise<number> {
    try {
      const result = await getDb().sAMReindexJob.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED', 'CANCELLED'],
          },
          updatedAt: {
            lt: olderThan,
          },
        },
      });

      logger.info('[PrismaReindexJobStore] Cleaned up old jobs', {
        count: result.count,
        olderThan,
      });

      return result.count;
    } catch (error) {
      logger.error('[PrismaReindexJobStore] Failed to cleanup jobs', { error });
      throw error;
    }
  }
}

/**
 * Create a new PrismaReindexJobStore instance
 */
export function createPrismaReindexJobStore(): PrismaReindexJobStore {
  return new PrismaReindexJobStore();
}
