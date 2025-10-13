#!/usr/bin/env node

/**
 * Email Job Processor - Standalone Process for Background Email Processing
 * 
 * This processor can be run as:
 * 1. Separate process: node lib/queue/email-processor.js
 * 2. In-process: import and call startProcessor()
 * 3. PM2 managed process for production
 * 4. Docker container process
 * 
 * Features:
 * - Graceful shutdown handling
 * - Health monitoring
 * - Performance metrics
 * - Auto-restart on failure
 * - Environment-aware processing
 */

import { emailQueue, EmailQueue } from './email-queue';
import { queueManager } from './queue-manager';
import { logger } from '@/lib/logger';
import { getEnvironmentConfig } from '@/lib/db-environment';
import * as process from 'process';

// Processor configuration
interface ProcessorConfig {
  concurrency: number;
  maxMemory: number; // MB
  healthCheckInterval: number; // ms
  statsInterval: number; // ms
  shutdownTimeout: number; // ms
  restartThreshold: {
    memoryMB: number;
    errorRate: number;
  };
}

const DEFAULT_CONFIG: ProcessorConfig = {
  concurrency: 3,
  maxMemory: 512, // 512MB
  healthCheckInterval: 30000, // 30 seconds
  statsInterval: 60000, // 1 minute
  shutdownTimeout: 30000, // 30 seconds
  restartThreshold: {
    memoryMB: 400, // Restart if memory > 400MB
    errorRate: 20, // Restart if error rate > 20%
  },
};

/**
 * Email Job Processor
 */
export class EmailProcessor {
  private config: ProcessorConfig;
  private isRunning = false;
  private isShuttingDown = false;
  private healthInterval?: NodeJS.Timeout;
  private statsInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private processedJobs = 0;
  private failedJobs = 0;
  private lastHealth = Date.now();
  private environmentConfig = getEnvironmentConfig();
  private emailQueue: EmailQueue;

  constructor(config?: Partial<ProcessorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.emailQueue = emailQueue;
    
    // Set up process event handlers
    this.setupProcessHandlers();
  }

  /**
   * Start the email processor
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[EMAIL_PROCESSOR] Already running');
      return;
    }

    try {
      logger.info('[EMAIL_PROCESSOR] Starting email job processor...', {
        config: this.config,
        environment: this.environmentConfig.isDevelopment ? 'development' : 
                    this.environmentConfig.isStaging ? 'staging' : 'production',
        pid: process.pid,
      });

      this.isRunning = true;
      this.startTime = Date.now();

      // Start monitoring
      this.startHealthMonitoring();
      this.startStatsReporting();

      // Ensure email queue is initialized
      await this.emailQueue.getQueueStatus(); // This will trigger initialization if needed

      logger.info('[EMAIL_PROCESSOR] Email job processor started successfully', {
        pid: process.pid,
        concurrency: this.config.concurrency,
      });

      // Keep the process alive
      if (this.isStandaloneProcess()) {
        this.keepAlive();
      }

    } catch (error) {
      logger.error('[EMAIL_PROCESSOR] Failed to start processor:', error);
      throw error;
    }
  }

  /**
   * Stop the email processor
   */
  public async stop(): Promise<void> {
    if (!this.isRunning || this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('[EMAIL_PROCESSOR] Stopping email job processor...');

    try {
      // Stop monitoring
      if (this.healthInterval) {
        clearInterval(this.healthInterval);
      }
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
      }

      // Shutdown email queue
      await this.emailQueue.shutdown();

      this.isRunning = false;
      logger.info('[EMAIL_PROCESSOR] Email job processor stopped successfully');

    } catch (error) {
      logger.error('[EMAIL_PROCESSOR] Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get processor status
   */
  public getStatus(): ProcessorStatus {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.processedJobs > 0 ? (this.failedJobs / this.processedJobs) * 100 : 0;
    const memory = process.memoryUsage();

    return {
      isRunning: this.isRunning,
      isShuttingDown: this.isShuttingDown,
      startTime: new Date(this.startTime),
      uptime,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      errorRate: Math.round(errorRate * 100) / 100,
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
      },
      config: this.config,
      environment: this.environmentConfig.isDevelopment ? 'development' : 
                  this.environmentConfig.isStaging ? 'staging' : 'production',
      pid: process.pid,
      lastHealthCheck: new Date(this.lastHealth),
    };
  }

  /**
   * Get processor metrics for monitoring
   */
  public async getMetrics(): Promise<ProcessorMetrics> {
    const status = this.getStatus();
    const queueStats = await this.emailQueue.getQueueStatus();

    return {
      ...status,
      queueStats,
      health: {
        score: this.calculateHealthScore(status, queueStats),
        status: this.getHealthStatus(status, queueStats),
        checks: {
          memory: status.memory.rss < this.config.restartThreshold.memoryMB,
          errorRate: status.errorRate < this.config.restartThreshold.errorRate,
          uptime: status.uptime > 60000, // At least 1 minute uptime
        },
      },
    };
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      logger.info('[EMAIL_PROCESSOR] Received SIGTERM, shutting down gracefully...');
      await this.gracefulShutdown();
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      logger.info('[EMAIL_PROCESSOR] Received SIGINT, shutting down gracefully...');
      await this.gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('[EMAIL_PROCESSOR] Uncaught exception:', error);
      this.gracefulShutdown().then(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[EMAIL_PROCESSOR] Unhandled rejection:', { promise, reason });
      this.gracefulShutdown().then(() => {
        process.exit(1);
      });
    });

    // Memory warnings
    process.on('warning', (warning) => {
      logger.warn('[EMAIL_PROCESSOR] Process warning:', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('[EMAIL_PROCESSOR] Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Start statistics reporting
   */
  private startStatsReporting(): void {
    this.statsInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        logger.info('[EMAIL_PROCESSOR] Status Report', metrics);
        
        // Check if restart is needed
        if (this.shouldRestart(metrics)) {
          logger.warn('[EMAIL_PROCESSOR] Restart threshold reached, initiating graceful restart');
          await this.gracefulRestart();
        }
      } catch (error) {
        logger.error('[EMAIL_PROCESSOR] Stats reporting failed:', error);
      }
    }, this.config.statsInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    this.lastHealth = Date.now();
    
    // Check memory usage
    const memory = process.memoryUsage();
    const memoryMB = memory.rss / 1024 / 1024;
    
    if (memoryMB > this.config.maxMemory) {
      logger.warn(`[EMAIL_PROCESSOR] High memory usage: ${Math.round(memoryMB)}MB`);
    }

    // Check queue health
    try {
      const queueStats = await this.emailQueue.getQueueStatus();
      if (queueStats.error) {
        logger.error('[EMAIL_PROCESSOR] Queue health check failed:', queueStats.error);
      }
    } catch (error) {
      logger.error('[EMAIL_PROCESSOR] Queue health check error:', error);
    }
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(status: ProcessorStatus, queueStats: any): number {
    let score = 100;

    // Reduce score based on error rate
    if (status.errorRate > 10) score -= 30;
    else if (status.errorRate > 5) score -= 15;

    // Reduce score based on memory usage
    const memoryPercent = (status.memory.rss / this.config.maxMemory) * 100;
    if (memoryPercent > 80) score -= 20;
    else if (memoryPercent > 60) score -= 10;

    // Reduce score based on queue health
    if (queueStats.error) score -= 40;
    else if (queueStats.circuitBreaker?.state !== 'closed') score -= 20;

    return Math.max(0, Math.round(score));
  }

  /**
   * Get health status
   */
  private getHealthStatus(status: ProcessorStatus, queueStats: any): 'healthy' | 'warning' | 'critical' | 'error' {
    const score = this.calculateHealthScore(status, queueStats);
    
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'warning';
    if (score >= 30) return 'critical';
    return 'error';
  }

  /**
   * Check if processor should restart
   */
  private shouldRestart(metrics: ProcessorMetrics): boolean {
    const { memory, errorRate } = metrics;
    const { restartThreshold } = this.config;

    return (
      memory.rss > restartThreshold.memoryMB ||
      errorRate > restartThreshold.errorRate
    );
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    try {
      const shutdownPromise = this.stop();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Shutdown timeout'));
        }, this.config.shutdownTimeout);
      });

      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      logger.error('[EMAIL_PROCESSOR] Forced shutdown due to timeout:', error);
    } finally {
      if (this.isStandaloneProcess()) {
        process.exit(0);
      }
    }
  }

  /**
   * Graceful restart
   */
  private async gracefulRestart(): Promise<void> {
    logger.info('[EMAIL_PROCESSOR] Initiating graceful restart...');
    
    try {
      await this.stop();
      
      // Wait a moment before restarting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.start();
      
      logger.info('[EMAIL_PROCESSOR] Restart completed successfully');
    } catch (error) {
      logger.error('[EMAIL_PROCESSOR] Restart failed:', error);
      throw error;
    }
  }

  /**
   * Check if running as standalone process
   */
  private isStandaloneProcess(): boolean {
    return require.main === module || process.argv[1].endsWith('email-processor.js');
  }

  /**
   * Keep the process alive for standalone execution
   */
  private keepAlive(): void {
    const keepAliveInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(keepAliveInterval);
      }
    }, 5000);
  }
}

// Types
interface ProcessorStatus {
  isRunning: boolean;
  isShuttingDown: boolean;
  startTime: Date;
  uptime: number;
  processedJobs: number;
  failedJobs: number;
  errorRate: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  config: ProcessorConfig;
  environment: string;
  pid: number;
  lastHealthCheck: Date;
}

interface ProcessorMetrics extends ProcessorStatus {
  queueStats: any;
  health: {
    score: number;
    status: 'healthy' | 'warning' | 'critical' | 'error';
    checks: {
      memory: boolean;
      errorRate: boolean;
      uptime: boolean;
    };
  };
}

// Export singleton instance
export const emailProcessor = new EmailProcessor();

// Convenience functions
export const startEmailProcessor = (config?: Partial<ProcessorConfig>) => {
  const processor = new EmailProcessor(config);
  return processor.start();
};

export const stopEmailProcessor = async () => {
  await emailProcessor.stop();
};

export const getEmailProcessorStatus = () => {
  return emailProcessor.getStatus();
};

export const getEmailProcessorMetrics = () => {
  return emailProcessor.getMetrics();
};

// CLI execution
if (require.main === module) {
  const config: Partial<ProcessorConfig> = {};
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  args.forEach(arg => {
    if (arg.startsWith('--concurrency=')) {
      config.concurrency = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--max-memory=')) {
      config.maxMemory = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      // Enable verbose logging
      process.env.LOG_LEVEL = 'debug';
    }
  });

  const processor = new EmailProcessor(config);
  
  processor.start().catch((error) => {
    logger.error('[EMAIL_PROCESSOR] Failed to start:', error);
    process.exit(1);
  });

  logger.info('[EMAIL_PROCESSOR] Started as standalone process', {
    pid: process.pid,
    config,
  });
}

export default EmailProcessor;