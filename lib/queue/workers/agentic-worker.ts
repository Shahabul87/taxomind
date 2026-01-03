/**
 * Agentic Worker
 * Handles memory ingestion and analytics rollup jobs
 */

import { Job } from 'bullmq';
import { logger } from '@/lib/logger';
import { queueManager } from '../queue-manager';
import type { WorkerFunction } from '../job-definitions';
import type { SAMMemoryIngestionData, SAMAnalyticsRollupData } from '../job-definitions';
import { processMemoryIngestion } from '@/lib/sam/memory-ingestion';
import { generateProgressRollup, type RollupPeriod } from '@/lib/sam/analytics-rollups';

async function processAgenticJob(job: Job<SAMMemoryIngestionData | SAMAnalyticsRollupData>) {
  switch (job.name) {
    case 'sam-memory-ingestion': {
      const payload = job.data as SAMMemoryIngestionData;
      await processMemoryIngestion({
        content: payload.content,
        sourceId: payload.sourceId,
        sourceType: payload.sourceType as any,
        userId: payload.userId,
        courseId: payload.courseId,
        chapterId: payload.chapterId,
        sectionId: payload.sectionId,
        tags: payload.tags,
        language: payload.language,
        customMetadata: payload.customMetadata,
        enableSummary: payload.enableSummary,
        enableKnowledgeGraph: payload.enableKnowledgeGraph,
      });
      return { status: 'ok' };
    }
    case 'sam-analytics-rollup': {
      const payload = job.data as SAMAnalyticsRollupData;
      await generateProgressRollup(payload.userId, payload.period as RollupPeriod);
      return { status: 'ok' };
    }
    default:
      logger.warn('[AGENTIC_WORKER] Unsupported job type', { name: job.name });
      return { status: 'skipped' };
  }
}

export function registerAgenticWorker(): void {
  queueManager.registerHandler('agentic', processAgenticJob as WorkerFunction<any>);
  queueManager.startWorker('agentic');
  logger.info('[AGENTIC_WORKER] Agentic worker registered and started');
}
