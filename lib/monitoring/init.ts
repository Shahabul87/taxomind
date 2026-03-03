/**
 * Monitoring System Initialization
 * Integrates monitoring with Next.js application
 */

import { initializeMonitoring, shutdownMonitoring, monitoring } from './index';
import { logger } from '@/lib/logger';

// Initialize monitoring when module is imported
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
  initializeMonitoring().catch(error => {
    logger.error('Failed to initialize monitoring', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing monitoring system');
    await shutdownMonitoring();
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing monitoring system');
    await shutdownMonitoring();
  });
}

// Export monitoring instance for use in application
export { monitoring };

/**
 * Monitoring middleware for Next.js
 */
export { apmMiddleware } from './apm';

/**
 * Database monitoring wrapper
 */
export { monitorDatabaseQuery } from './apm';

/**
 * Cache monitoring wrapper
 */
export { monitorCacheOperation } from './apm';

/**
 * Tracing utilities
 */
export { DatabaseTracer, CacheTracer, HttpTracer, AITracer, Trace } from './tracing';