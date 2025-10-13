import { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorTokenEmail } from '@/lib/mail';

interface EmailJob {
  id: string;
  type: string;
  data: any;
  attempts: number;
  priority: number;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export class EmailQueue {
  private static instance: EmailQueue | undefined;
  private jobs: Map<string, EmailJob> = new Map();
  private isProcessing = false;
  private rateLimits: Map<string, number[]> = new Map();
  private circuitBreakerFailures = 0;
  private circuitBreakerOpen = false;
  private dlq: EmailJob[] = [];
  private redis: any = null;
  private queueManager: any = null;
  private logger = console;

  private constructor() {
    // Check for Redis availability
    try {
      const redisModule = require('@/lib/redis');
      this.redis = redisModule.redis;
      if (!this.redis) {
        throw new Error('Redis not available');
      }
    } catch (error) {
      this.logger.warn('Redis unavailable, using in-memory fallback', error);
    }

    // Initialize queue manager if available
    if (this.redis) {
      try {
        const queueManagerModule = require('@/lib/queue/queue-manager');
        this.queueManager = queueManagerModule.queueManager;
        this.queueManager.addQueue({
          name: 'email-enhanced',
          concurrency: 5,
        });
      } catch (error) {
        // Queue manager not available
      }
    }
  }

  static getInstance(): EmailQueue {
    if (!EmailQueue.instance) {
      EmailQueue.instance = new EmailQueue();
    }
    return EmailQueue.instance;
  }

  async addEmailJob(type: string, data: any, options: any = {}): Promise<string> {
    // Check for deduplication
    if (options.deduplication) {
      const existingJob = Array.from(this.jobs.values()).find(
        job => job.type === type && JSON.stringify(job.data) === JSON.stringify(data)
      );
      if (existingJob) {
        return 'duplicate-skipped';
      }
    }

    // Check rate limits
    const email = data.userEmail || data.email;
    if (email && !this.checkRateLimit(email)) {
      throw new Error('Rate limit exceeded');
    }

    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      throw new Error('Circuit breaker open');
    }

    const jobId = `${type === 'send-verification-email' ? 'mem' : 'job'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: EmailJob = {
      id: jobId,
      type,
      data: {
        ...data,
        jobType: type,
        timestamp: new Date(),
      },
      attempts: options.attempts || 3,
      priority: options.priority || 0,
      timestamp: new Date(),
      status: 'pending',
    };

    // If Redis is available and we have a queue, use it
    if (this.redis && this.queueManager) {
      const queue = this.queueManager.getQueue('email-enhanced');
      if (queue) {
        await queue.add(type, job.data, {
          attempts: job.attempts,
          priority: job.priority,
        });
        return jobId;
      }
    }

    // Fallback to in-memory
    this.jobs.set(jobId, job);
    this.processQueue();
    return jobId;
  }

  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const limits = this.rateLimits.get(email) || [];
    const recentLimits = limits.filter(time => now - time < 60000); // 1 minute window
    
    if (recentLimits.length >= 5) {
      return false;
    }

    recentLimits.push(now);
    this.rateLimits.set(email, recentLimits);
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const pendingJobs = Array.from(this.jobs.values()).filter(job => job.status === 'pending');
    
    for (const job of pendingJobs) {
      try {
        job.status = 'processing';
        await this.processEmailJobData(job.data);
        job.status = 'completed';
        this.circuitBreakerFailures = 0;
      } catch (error) {
        job.attempts--;
        if (job.attempts <= 0) {
          job.status = 'failed';
          this.dlq.push(job);
        } else {
          job.status = 'pending';
        }
        
        this.circuitBreakerFailures++;
        if (this.circuitBreakerFailures >= 5) {
          this.circuitBreakerOpen = true;
        }
      }
    }

    this.isProcessing = false;
  }

  async processEmailJobData(data: any): Promise<void> {
    const { jobType, userEmail, verificationToken, resetToken, code } = data;

    switch (jobType) {
      case 'send-verification-email':
        await sendVerificationEmail(userEmail, verificationToken);
        break;
      case 'send-password-reset':
        await sendPasswordResetEmail(userEmail, resetToken);
        break;
      case 'send-2fa-token':
        await sendTwoFactorTokenEmail(userEmail, code);
        break;
      case 'mfa-setup-confirmation':
        // Mock implementation for MFA setup
        break;
      case 'login-alert':
        // Mock implementation for login alerts
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    if (this.redis && this.queueManager) {
      const queue = this.queueManager.getQueue('email-enhanced');
      if (queue) {
        return {
          waiting: await queue.getWaitingCount(),
          active: await queue.getActiveCount(),
          completed: await queue.getCompletedCount(),
          failed: await queue.getFailedCount(),
        };
      }
    }

    const jobs = Array.from(this.jobs.values());
    return {
      waiting: jobs.filter(j => j.status === 'pending').length,
      active: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }

  async shutdown(): Promise<void> {
    this.jobs.clear();
    this.rateLimits.clear();
    this.dlq = [];
    this.circuitBreakerOpen = false;
    this.circuitBreakerFailures = 0;
  }

  resetCircuitBreaker(): void {
    this.circuitBreakerOpen = false;
    this.circuitBreakerFailures = 0;
  }

  async reprocessDLQ(): Promise<void> {
    const jobsToReprocess = [...this.dlq];
    this.dlq = [];
    
    for (const job of jobsToReprocess) {
      job.status = 'pending';
      job.attempts = 3;
      this.jobs.set(job.id, job);
    }
    
    await this.processQueue();
  }

  // Convenience methods
  async queueVerificationEmail(email: string, token: string): Promise<string> {
    return this.addEmailJob('send-verification-email', {
      userEmail: email,
      verificationToken: token,
    });
  }

  async queuePasswordResetEmail(email: string, token: string): Promise<string> {
    return this.addEmailJob('send-password-reset', {
      userEmail: email,
      resetToken: token,
    });
  }

  async queue2FAEmail(email: string, code: string): Promise<string> {
    return this.addEmailJob('send-2fa-token', {
      userEmail: email,
      code,
    }, { priority: 10 });
  }

  async queueMFASetupConfirmation(email: string, userName: string): Promise<string> {
    return this.addEmailJob('mfa-setup-confirmation', {
      userEmail: email,
      userName,
    });
  }

  async queueLoginAlertEmail(email: string, details: any): Promise<string> {
    return this.addEmailJob('login-alert', {
      userEmail: email,
      ...details,
    });
  }
}

export const emailQueue = EmailQueue.getInstance();