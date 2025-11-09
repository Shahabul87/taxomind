/**
 * Worker Initialization Script
 * Registers and starts all queue workers
 */

import { logger } from '@/lib/logger';
import { registerEnrollmentWorker } from './enrollment-worker';
import { registerWebhookWorker } from './webhook-worker';

/**
 * Initialize all workers
 */
export function initializeWorkers(): void {
  try {
    logger.info('[WORKERS] Initializing queue workers...');

    // Register enrollment worker
    registerEnrollmentWorker();

    // Register webhook worker
    registerWebhookWorker();

    logger.info('[WORKERS] All workers initialized successfully');
  } catch (error) {
    logger.error('[WORKERS] Error initializing workers:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
export async function shutdownWorkers(): Promise<void> {
  try {
    logger.info('[WORKERS] Shutting down workers...');

    const { queueManager } = await import('../queue-manager');
    await queueManager.shutdown();

    logger.info('[WORKERS] All workers shut down successfully');
  } catch (error) {
    logger.error('[WORKERS] Error shutting down workers:', error);
    throw error;
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    logger.info('[WORKERS] SIGTERM received, shutting down gracefully...');
    await shutdownWorkers();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('[WORKERS] SIGINT received, shutting down gracefully...');
    await shutdownWorkers();
    process.exit(0);
  });
}
