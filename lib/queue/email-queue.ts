/**
 * Email Queue System - Enhanced Background Job Processing
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Dead Letter Queue (DLQ) for failed emails
 * - Rate limiting and flood protection
 * - In-memory queue fallback
 * - Comprehensive monitoring and logging
 * - Email deduplication
 * - Priority-based processing
 * - Circuit breaker pattern for email provider failures
 */

import { Job, JobsOptions, Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { queueManager } from './queue-manager';
import { 
  JobType, 
  JobData, 
  EmailJobResult,
  JOB_PRIORITIES,
  JOB_PRESETS 
} from './job-definitions';

// Enhanced email job types with authentication-specific jobs
export type EmailJobType = 
  | 'send-verification-email'
  | 'send-password-reset-email' 
  | 'send-2fa-code-email'
  | 'send-mfa-setup-confirmation'
  | 'send-welcome-email'
  | 'send-notification-email'
  | 'send-course-reminder'
  | 'send-bulk-announcement'
  | 'send-certificate-email'
  | 'send-login-alert-email';

// Enhanced job data interfaces for authentication emails
export interface VerificationEmailData extends JobData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  verificationToken: string;
  expiresAt: Date;
  isResend?: boolean;
}

export interface PasswordResetEmailData extends JobData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  resetToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface TwoFactorEmailData extends JobData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  code: string;
  expiresAt: Date;
  ipAddress?: string;
  loginAttemptId?: string;
}

export interface MFASetupConfirmationData extends JobData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  method: 'totp' | 'sms' | 'email';
  setupDate: Date;
  backupCodes?: string[];
}

export interface LoginAlertEmailData extends JobData {
  jobType?: EmailJobType;
  userEmail: string;
  userName: string;
  loginDate: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isNewDevice?: boolean;
  isSuccessful: boolean;
}

// Email queue configuration with enhanced reliability
export interface EmailQueueConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  rateLimiting: {
    maxPerMinute: number;
    maxPerHour: number;
    burstLimit: number;
  };
  dlq: {
    enabled: boolean;
    maxAge: number; // in hours
    alertThreshold: number;
  };
  deduplication: {
    enabled: boolean;
    windowMinutes: number;
  };
}

// Default configuration
const DEFAULT_EMAIL_CONFIG: EmailQueueConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 2,
  jitterEnabled: true,
  circuitBreakerThreshold: 10, // failures before opening circuit
  circuitBreakerTimeout: 60000, // 1 minute
  rateLimiting: {
    maxPerMinute: 100,
    maxPerHour: 1000,
    burstLimit: 20,
  },
  dlq: {
    enabled: true,
    maxAge: 72, // 3 days
    alertThreshold: 50,
  },
  deduplication: {
    enabled: true,
    windowMinutes: 5,
  },
};

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: Date | null;
}

/**
 * Enhanced Email Queue System
 */
export class EmailQueue {
  private static instance: EmailQueue;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private inMemoryQueue: EmailJobData[] = [];
  private inMemoryProcessor: NodeJS.Timeout | null = null;
  private config: EmailQueueConfig;
  private circuitBreaker: CircuitBreakerState;
  private rateLimitCounter: Map<string, { count: number; resetTime: number }> = new Map();
  private emailService: any; // Will be injected
  private isShuttingDown = false;

  // In-memory fallback queue for when Redis is unavailable
  private fallbackQueue: {
    jobs: EmailJobData[];
    processing: boolean;
    lastProcessed: Date;
  } = {
    jobs: [],
    processing: false,
    lastProcessed: new Date(),
  };

  private constructor(config?: Partial<EmailQueueConfig>) {
    this.config = { ...DEFAULT_EMAIL_CONFIG, ...config };
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      nextAttempt: null,
    };
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<EmailQueueConfig>): EmailQueue {
    if (!EmailQueue.instance) {
      EmailQueue.instance = new EmailQueue(config);
    }
    return EmailQueue.instance;
  }

  /**
   * Initialize the email queue system
   */
  private async initialize(): Promise<void> {
    try {
      // Try to initialize Redis-based queue first
      await this.initializeRedisQueue();
      logger.info('[EMAIL_QUEUE] Initialized with Redis backend');
    } catch (error) {
      logger.warn('[EMAIL_QUEUE] Redis unavailable, using in-memory fallback:', error);
      this.initializeInMemoryQueue();
    }

    // Set up monitoring
    this.setupMonitoring();
    
    // Set up cleanup tasks
    this.setupCleanupTasks();

    logger.info('[EMAIL_QUEUE] Email queue system initialized successfully');
  }

  /**
   * Initialize Redis-based queue
   */
  private async initializeRedisQueue(): Promise<void> {
    if (!redis) {
      throw new Error('Redis not available');
    }

    // Test Redis connection
    await redis.ping();

    // Use existing queue manager for consistency
    queueManager.addQueue({
      name: 'email-enhanced',
      concurrency: 5,
      rateLimiter: {
        max: this.config.rateLimiting.maxPerMinute,
        duration: 60000,
      },
      defaultJobOptions: {
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.baseDelay,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        delay: 500, // Slight delay to prevent overwhelming email service
      },
      priority: 'high',
    });

    // Register the enhanced email handler
    queueManager.registerHandler('email-enhanced', this.processEmailJob.bind(this));
    queueManager.startWorker('email-enhanced');

    this.queue = queueManager['queues'].get('email-enhanced');
    
    if (this.queue) {
      // Set up queue events for monitoring
      this.queueEvents = new QueueEvents('email-enhanced', {
        connection: queueManager['ioRedis'],
      });
      
      this.setupQueueEventListeners();
    }
  }

  /**
   * Initialize in-memory fallback queue
   */
  private initializeInMemoryQueue(): void {
    // Start in-memory processor
    this.startInMemoryProcessor();
    logger.info('[EMAIL_QUEUE] In-memory queue processor started');
  }

  /**
   * Start in-memory queue processor
   */
  private startInMemoryProcessor(): void {
    if (this.inMemoryProcessor) {
      clearInterval(this.inMemoryProcessor);
    }

    this.inMemoryProcessor = setInterval(async () => {
      if (this.fallbackQueue.processing || this.fallbackQueue.jobs.length === 0) {
        return;
      }

      this.fallbackQueue.processing = true;

      try {
        const job = this.fallbackQueue.jobs.shift();
        if (job) {
          await this.processEmailJobData(job);
          this.fallbackQueue.lastProcessed = new Date();
        }
      } catch (error) {
        logger.error('[EMAIL_QUEUE] In-memory job processing failed:', error);
      } finally {
        this.fallbackQueue.processing = false;
      }
    }, 2000); // Process every 2 seconds
  }

  /**
   * Add email job to queue with enhanced reliability
   */
  public async addEmailJob<T extends EmailJobData>(
    jobType: EmailJobType,
    data: T,
    options?: Partial<JobsOptions>
  ): Promise<Job<T> | string> {
    if (this.isShuttingDown) {
      throw new Error('Email queue is shutting down');
    }

    // Validate job data
    this.validateEmailJobData(jobType, data);

    // Check rate limits
    await this.checkRateLimit((data as any).userEmail || 'system');

    // Check for duplicates if deduplication is enabled
    if (this.config.deduplication.enabled) {
      const isDuplicate = await this.checkDuplicate(jobType, data);
      if (isDuplicate) {
        logger.info(`[EMAIL_QUEUE] Duplicate job detected and skipped: ${jobType}`);
        return 'duplicate-skipped';
      }
    }

    // Enhanced job options
    const jobOptions: JobsOptions = {
      priority: this.getJobPriority(jobType),
      attempts: this.config.maxRetries,
      backoff: {
        type: 'exponential',
        delay: this.config.baseDelay,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...options,
    };

    // Add metadata
    const enhancedData = {
      ...data,
      jobType,
      timestamp: new Date(),
      queuedAt: Date.now(),
      attemptHistory: [],
      metadata: {
        ...data.metadata,
        priority: jobOptions.priority,
        source: 'enhanced-email-queue',
      },
    } as T & { jobType: EmailJobType };

    try {
      if (this.queue) {
        // Use Redis queue
        const job = await this.queue.add(jobType, enhancedData, jobOptions);
        logger.info(`[EMAIL_QUEUE] Job added to Redis queue: ${jobType} (ID: ${job.id})`);
        
        // Store deduplication key
        if (this.config.deduplication.enabled) {
          await this.storeDuplicationKey(jobType, data);
        }
        
        return job;
      } else {
        // Use in-memory fallback
        const jobId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memoryJob = {
          ...enhancedData,
          id: jobId,
          addedAt: Date.now(),
        };
        
        this.fallbackQueue.jobs.push(memoryJob);
        logger.info(`[EMAIL_QUEUE] Job added to in-memory queue: ${jobType} (ID: ${jobId})`);
        
        return jobId;
      }
    } catch (error) {
      logger.error(`[EMAIL_QUEUE] Failed to add job ${jobType}:`, error);
      throw error;
    }
  }

  /**
   * Process email job (main handler)
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<EmailJobResult> {
    return await this.processEmailJobData(job.data, job);
  }

  /**
   * Process email job data
   */
  private async processEmailJobData(
    data: EmailJobData, 
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    const startTime = Date.now();
    const jobId = job?.id || data.id || 'in-memory';

    try {
      // Check circuit breaker
      if (!this.isCircuitClosed()) {
        throw new Error('Circuit breaker is open - email service is temporarily unavailable');
      }

      // Update progress if Redis job
      if (job) {
        await job.updateProgress(10);
      }

      logger.info(`[EMAIL_QUEUE] Processing job ${data.jobType} (ID: ${jobId})`);

      // Route to appropriate handler based on job type
      let result: EmailJobResult;

      switch (data.jobType) {
        case 'send-verification-email':
          result = await this.handleVerificationEmail(data as VerificationEmailData, job);
          break;
        case 'send-password-reset-email':
          result = await this.handlePasswordResetEmail(data as PasswordResetEmailData, job);
          break;
        case 'send-2fa-code-email':
          result = await this.handleTwoFactorEmail(data as TwoFactorEmailData, job);
          break;
        case 'send-mfa-setup-confirmation':
          result = await this.handleMFASetupConfirmation(data as MFASetupConfirmationData, job);
          break;
        case 'send-login-alert-email':
          result = await this.handleLoginAlertEmail(data as LoginAlertEmailData, job);
          break;
        default:
          // Fallback to existing email worker handlers
          result = await this.handleGenericEmail(data, job);
          break;
      }

      // Update progress if Redis job
      if (job) {
        await job.updateProgress(100);
      }

      // Reset circuit breaker on success
      this.resetCircuitBreaker();

      const processingTime = Date.now() - startTime;
      logger.info(`[EMAIL_QUEUE] Job completed successfully: ${data.jobType} (${processingTime}ms)`);

      return {
        ...result,
        processingTime,
        metadata: {
          ...result.metadata,
          jobId,
          completedAt: new Date(),
        },
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      // Record circuit breaker failure
      this.recordCircuitBreakerFailure();

      // Handle DLQ for failed jobs
      if (job && job.attemptsMade >= this.config.maxRetries) {
        await this.sendToDeadLetterQueue(data, error);
      }

      logger.error(`[EMAIL_QUEUE] Job failed: ${data.jobType} (${processingTime}ms)`, {
        error: error.message,
        jobId,
        attempt: job?.attemptsMade || 1,
      });

      const result: EmailJobResult = {
        success: false,
        error: error.message,
        processingTime,
        deliveryStatus: 'failed',
        metadata: {
          jobId,
          failedAt: new Date(),
          errorType: error.constructor.name,
        },
      };

      throw error; // Let BullMQ handle retry logic
    }
  }

  /**
   * Handle verification email
   */
  private async handleVerificationEmail(
    data: VerificationEmailData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    const { sendVerificationEmail } = await import('@/lib/mail');
    
    if (job) await job.updateProgress(50);

    const result = await sendVerificationEmail(data.userEmail, data.verificationToken);

    return {
      success: true,
      data: result,
      messageId: result?.id,
      recipientCount: 1,
      deliveryStatus: 'sent',
      metadata: {
        template: 'verification',
        isResend: data.isResend || false,
      },
    };
  }

  /**
   * Handle password reset email
   */
  private async handlePasswordResetEmail(
    data: PasswordResetEmailData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    const { sendPasswordResetEmail } = await import('@/lib/mail');
    
    if (job) await job.updateProgress(50);

    const result = await sendPasswordResetEmail(data.userEmail, data.resetToken);

    return {
      success: true,
      data: result,
      messageId: result?.id,
      recipientCount: 1,
      deliveryStatus: 'sent',
      metadata: {
        template: 'password-reset',
        ipAddress: data.ipAddress,
        hasUserAgent: !!data.userAgent,
      },
    };
  }

  /**
   * Handle 2FA code email
   */
  private async handleTwoFactorEmail(
    data: TwoFactorEmailData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    const { sendTwoFactorTokenEmail } = await import('@/lib/mail');
    
    if (job) await job.updateProgress(50);

    const result = await sendTwoFactorTokenEmail(data.userEmail, data.code);

    return {
      success: true,
      data: result,
      messageId: result?.id,
      recipientCount: 1,
      deliveryStatus: 'sent',
      metadata: {
        template: '2fa-code',
        loginAttemptId: data.loginAttemptId,
        ipAddress: data.ipAddress,
      },
    };
  }

  /**
   * Handle MFA setup confirmation email
   */
  private async handleMFASetupConfirmation(
    data: MFASetupConfirmationData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    if (job) await job.updateProgress(30);

    // Create MFA setup confirmation email template
    const template = this.createMFASetupTemplate(data);
    
    if (job) await job.updateProgress(70);

    // Use mock email service for now (replace with actual service)
    const result = await this.sendEmail(
      data.userEmail,
      template.subject,
      template.html,
      'mfa-setup'
    );

    return {
      success: true,
      data: result,
      messageId: result.messageId,
      recipientCount: 1,
      deliveryStatus: 'sent',
      metadata: {
        template: 'mfa-setup',
        method: data.method,
        hasBackupCodes: !!data.backupCodes,
      },
    };
  }

  /**
   * Handle login alert email
   */
  private async handleLoginAlertEmail(
    data: LoginAlertEmailData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    if (job) await job.updateProgress(30);

    const template = this.createLoginAlertTemplate(data);
    
    if (job) await job.updateProgress(70);

    const result = await this.sendEmail(
      data.userEmail,
      template.subject,
      template.html,
      'login-alert'
    );

    return {
      success: true,
      data: result,
      messageId: result.messageId,
      recipientCount: 1,
      deliveryStatus: 'sent',
      metadata: {
        template: 'login-alert',
        isSuccessful: data.isSuccessful,
        isNewDevice: data.isNewDevice,
        location: data.location,
      },
    };
  }

  /**
   * Handle generic email (fallback to existing handlers)
   */
  private async handleGenericEmail(
    data: EmailJobData,
    job?: Job<EmailJobData>
  ): Promise<EmailJobResult> {
    // Import and use existing email worker
    const { emailHandlers } = await import('./workers/email-worker');
    
    const handler = emailHandlers[data.jobType as keyof typeof emailHandlers];
    
    if (!handler) {
      throw new Error(`No handler found for job type: ${data.jobType}`);
    }

    if (job) {
      return await handler(job);
    } else {
      // Create mock job for in-memory processing
      const mockJob = {
        id: data.id,
        data,
        timestamp: data.timestamp || Date.now(),
        attemptsMade: 0,
        updateProgress: async () => {},
      } as any as Job<EmailJobData>;

      return await handler(mockJob);
    }
  }

  /**
   * Create MFA setup confirmation email template
   */
  private createMFASetupTemplate(data: MFASetupConfirmationData): { subject: string; html: string } {
    const methodNames = {
      totp: 'Authenticator App',
      sms: 'SMS',
      email: 'Email',
    };

    return {
      subject: 'Multi-Factor Authentication Enabled - Taxomind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🔒 Multi-Factor Authentication Enabled</h2>
          <p>Hi ${data.userName},</p>
          <p>Multi-factor authentication has been successfully enabled for your Taxomind account using <strong>${methodNames[data.method]}</strong>.</p>
          <p><strong>Setup Date:</strong> ${data.setupDate.toLocaleString()}</p>
          ${data.backupCodes ? 
            `<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>🔑 Backup Codes</h3>
              <p>Please save these backup codes in a secure location. You can use them to access your account if you lose access to your primary authentication method:</p>
              <ul>
                ${data.backupCodes.map(code => `<li style="font-family: monospace; font-size: 14px;">${code}</li>`).join('')}
              </ul>
              <p><em>Each backup code can only be used once.</em></p>
            </div>` : 
            ''
          }
          <p>Your account security has been enhanced. If you didn't enable MFA, please contact support immediately.</p>
          <p>Best regards,<br>The Taxomind Security Team</p>
        </div>
      `,
    };
  }

  /**
   * Create login alert email template
   */
  private createLoginAlertTemplate(data: LoginAlertEmailData): { subject: string; html: string } {
    const status = data.isSuccessful ? 'Successful' : 'Failed';
    const color = data.isSuccessful ? '#28a745' : '#dc3545';
    const icon = data.isSuccessful ? '✅' : '⚠️';

    return {
      subject: `${status} Login Alert - Taxomind`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${color};">${icon} ${status} Login Alert</h2>
          <p>Hi ${data.userName},</p>
          <p>We detected a ${status.toLowerCase()} login attempt on your Taxomind account.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Login Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Date & Time:</strong> ${data.loginDate.toLocaleString()}</li>
              <li><strong>IP Address:</strong> ${data.ipAddress}</li>
              ${data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : ''}
              <li><strong>Device:</strong> ${data.isNewDevice ? 'New Device' : 'Known Device'}</li>
              <li><strong>Browser:</strong> ${data.userAgent}</li>
            </ul>
          </div>
          
          ${data.isSuccessful ? 
            `<p>If this was you, no action is needed. If you don't recognize this login, please secure your account immediately.</p>` :
            `<p style="color: #dc3545;"><strong>Security Alert:</strong> This login attempt failed. If you didn't attempt to log in, your account may be under attack.</p>`
          }
          
          <p>
            <a href="/auth/change-password" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Secure My Account
            </a>
          </p>
          
          <p>Best regards,<br>The Taxomind Security Team</p>
        </div>
      `,
    };
  }

  /**
   * Mock email sending function (replace with actual email service)
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    template: string
  ): Promise<{ messageId: string; status: string }> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    // Simulate occasional failures (2% failure rate)
    if (Math.random() < 0.02) {
      throw new Error(`Email service temporarily unavailable`);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`[EMAIL_QUEUE] Mock email sent: ${template} to ${to}`);
    
    return {
      messageId,
      status: 'sent',
    };
  }

  /**
   * Validate email job data
   */
  private validateEmailJobData(jobType: EmailJobType, data: EmailJobData): void {
    if (!data.userEmail || !this.isValidEmail(data.userEmail)) {
      throw new Error(`Invalid email address: ${data.userEmail}`);
    }

    // Job-specific validation
    switch (jobType) {
      case 'send-verification-email':
        const verifyData = data as VerificationEmailData;
        if (!verifyData.verificationToken || !verifyData.userName) {
          throw new Error('Verification email requires token and userName');
        }
        break;
      case 'send-password-reset-email':
        const resetData = data as PasswordResetEmailData;
        if (!resetData.resetToken || !resetData.userName) {
          throw new Error('Password reset email requires token and userName');
        }
        break;
      case 'send-2fa-code-email':
        const tfaData = data as TwoFactorEmailData;
        if (!tfaData.code || tfaData.code.length < 4) {
          throw new Error('2FA email requires valid code');
        }
        break;
    }
  }

  /**
   * Check if email address is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get job priority based on type
   */
  private getJobPriority(jobType: EmailJobType): number {
    const priorityMap: Record<EmailJobType, number> = {
      'send-2fa-code-email': JOB_PRIORITIES.CRITICAL,
      'send-password-reset-email': JOB_PRIORITIES.HIGH,
      'send-verification-email': JOB_PRIORITIES.HIGH,
      'send-login-alert-email': JOB_PRIORITIES.HIGH,
      'send-mfa-setup-confirmation': JOB_PRIORITIES.MEDIUM,
      'send-welcome-email': JOB_PRIORITIES.MEDIUM,
      'send-notification-email': JOB_PRIORITIES.MEDIUM,
      'send-certificate-email': JOB_PRIORITIES.MEDIUM,
      'send-course-reminder': JOB_PRIORITIES.LOW,
      'send-bulk-announcement': JOB_PRIORITIES.LOW,
    };

    return priorityMap[jobType] || JOB_PRIORITIES.MEDIUM;
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const rateLimitKey = `rate_limit_${identifier}`;
    
    let counter = this.rateLimitCounter.get(rateLimitKey);
    
    if (!counter || now > counter.resetTime) {
      // Reset counter
      counter = {
        count: 1,
        resetTime: now + 60000, // 1 minute window
      };
      this.rateLimitCounter.set(rateLimitKey, counter);
      return;
    }

    if (counter.count >= this.config.rateLimiting.maxPerMinute) {
      throw new Error(`Rate limit exceeded for ${identifier}`);
    }

    counter.count++;
  }

  /**
   * Check for duplicate jobs
   */
  private async checkDuplicate(jobType: EmailJobType, data: EmailJobData): Promise<boolean> {
    const dedupeKey = this.generateDeduplicationKey(jobType, data);
    
    try {
      if (redis) {
        const exists = await redis.get(dedupeKey);
        return !!exists;
      } else {
        // In-memory deduplication
        return false; // Simplified for in-memory mode
      }
    } catch (error) {
      logger.warn('[EMAIL_QUEUE] Deduplication check failed:', error);
      return false; // Allow job to proceed if deduplication check fails
    }
  }

  /**
   * Store deduplication key
   */
  private async storeDuplicationKey(jobType: EmailJobType, data: EmailJobData): Promise<void> {
    const dedupeKey = this.generateDeduplicationKey(jobType, data);
    const expireTime = this.config.deduplication.windowMinutes * 60; // seconds

    try {
      if (redis) {
        await redis.setex(dedupeKey, expireTime, '1');
      }
    } catch (error) {
      logger.warn('[EMAIL_QUEUE] Failed to store deduplication key:', error);
    }
  }

  /**
   * Generate deduplication key
   */
  private generateDeduplicationKey(jobType: EmailJobType, data: EmailJobData): string {
    const key = `email_dedupe_${jobType}_${data.userEmail}`;
    
    // Add job-specific identifiers
    if ('verificationToken' in data) {
      return `${key}_${data.verificationToken}`;
    }
    if ('resetToken' in data) {
      return `${key}_${data.resetToken}`;
    }
    if ('code' in data) {
      return `${key}_${data.code}`;
    }
    
    return key;
  }

  /**
   * Circuit breaker methods
   */
  private isCircuitClosed(): boolean {
    if (this.circuitBreaker.state === 'closed') {
      return true;
    }
    
    if (this.circuitBreaker.state === 'open') {
      const now = new Date();
      if (this.circuitBreaker.nextAttempt && now > this.circuitBreaker.nextAttempt) {
        this.circuitBreaker.state = 'half-open';
        return true;
      }
      return false;
    }
    
    // half-open state
    return true;
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = new Date();
    
    if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextAttempt = new Date(
        Date.now() + this.config.circuitBreakerTimeout
      );
      logger.warn('[EMAIL_QUEUE] Circuit breaker opened due to failures');
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.failures > 0) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.lastFailure = null;
      this.circuitBreaker.state = 'closed';
      this.circuitBreaker.nextAttempt = null;
      logger.info('[EMAIL_QUEUE] Circuit breaker reset - service recovered');
    }
  }

  /**
   * Send job to Dead Letter Queue
   */
  private async sendToDeadLetterQueue(data: EmailJobData, error: Error): Promise<void> {
    if (!this.config.dlq.enabled) {
      return;
    }

    const dlqKey = `dlq:email:${Date.now()}`;
    const dlqData = {
      ...data,
      failedAt: new Date(),
      error: error.message,
      stack: error.stack,
      retryCount: this.config.maxRetries,
    };

    try {
      if (redis) {
        await redis.setex(dlqKey, this.config.dlq.maxAge * 3600, JSON.stringify(dlqData));
        logger.error(`[EMAIL_QUEUE] Job sent to DLQ: ${data.jobType}`, { dlqKey });
        
        // Check DLQ threshold for alerts
        await this.checkDLQThreshold();
      } else {
        // Log to console for in-memory mode
        logger.error(`[EMAIL_QUEUE] DLQ (in-memory): ${data.jobType}`, dlqData);
      }
    } catch (dlqError) {
      logger.error('[EMAIL_QUEUE] Failed to send job to DLQ:', dlqError);
    }
  }

  /**
   * Check DLQ threshold and alert
   */
  private async checkDLQThreshold(): Promise<void> {
    try {
      if (redis) {
        const dlqKeys = await redis.keys('dlq:email:*');
        if (dlqKeys.length >= this.config.dlq.alertThreshold) {
          logger.error(`[EMAIL_QUEUE] DLQ ALERT: ${dlqKeys.length} failed jobs in DLQ`);
          // Here you would integrate with your alerting system
        }
      }
    } catch (error) {
      logger.warn('[EMAIL_QUEUE] Failed to check DLQ threshold:', error);
    }
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueEventListeners(): void {
    if (!this.queueEvents) return;

    this.queueEvents.on('completed', (args: { jobId: string; returnvalue: string }, id: string) => {
      logger.info(`[EMAIL_QUEUE] Job completed: ${args.jobId}`);
    });

    this.queueEvents.on('failed', (args: { jobId: string; failedReason: string }, id: string) => {
      logger.error(`[EMAIL_QUEUE] Job failed: ${args.jobId}`, args.failedReason);
    });

    this.queueEvents.on('error', (error: Error) => {
      logger.error('[EMAIL_QUEUE] Queue error:', error);
    });
  }

  /**
   * Setup monitoring
   */
  private setupMonitoring(): void {
    // Monitor in-memory queue size
    setInterval(() => {
      if (this.fallbackQueue.jobs.length > 100) {
        logger.warn(`[EMAIL_QUEUE] In-memory queue size: ${this.fallbackQueue.jobs.length}`);
      }
    }, 30000); // Every 30 seconds

    // Monitor circuit breaker
    setInterval(() => {
      if (this.circuitBreaker.state !== 'closed') {
        logger.info(`[EMAIL_QUEUE] Circuit breaker status: ${this.circuitBreaker.state}, failures: ${this.circuitBreaker.failures}`);
      }
    }, 60000); // Every minute
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up rate limit counters
    setInterval(() => {
      const now = Date.now();
      this.rateLimitCounter.forEach((counter, key) => {
        if (now > counter.resetTime) {
          this.rateLimitCounter.delete(key);
        }
      });
    }, 300000); // Every 5 minutes

    // Clean up old DLQ entries
    setInterval(async () => {
      try {
        if (redis) {
          const dlqKeys = await redis.keys('dlq:email:*');
          const oldKeys = dlqKeys.filter(key => {
            const timestamp = parseInt(key.split(':')[2]);
            const age = (Date.now() - timestamp) / (1000 * 3600); // hours
            return age > this.config.dlq.maxAge;
          });
          
          if (oldKeys.length > 0) {
            await redis.del(...oldKeys);
            logger.info(`[EMAIL_QUEUE] Cleaned up ${oldKeys.length} old DLQ entries`);
          }
        }
      } catch (error) {
        logger.warn('[EMAIL_QUEUE] DLQ cleanup failed:', error);
      }
    }, 3600000); // Every hour
  }

  /**
   * Get queue statistics
   */
  public async getStatistics(): Promise<any> {
    try {
      const stats = {
        queueType: this.queue ? 'redis' : 'in-memory',
        circuitBreaker: {
          state: this.circuitBreaker.state,
          failures: this.circuitBreaker.failures,
          lastFailure: this.circuitBreaker.lastFailure,
        },
        rateLimiting: {
          activeCounters: this.rateLimitCounter.size,
        },
        inMemoryQueue: {
          pendingJobs: this.fallbackQueue.jobs.length,
          processing: this.fallbackQueue.processing,
          lastProcessed: this.fallbackQueue.lastProcessed,
        },
      };

      if (this.queue) {
        // Get Redis queue stats
        const queueStats = await queueManager.getQueueStats('email-enhanced');
        stats['redis'] = queueStats;
      }

      if (redis) {
        // Get DLQ stats
        const dlqKeys = await redis.keys('dlq:email:*');
        stats['dlq'] = {
          failedJobs: dlqKeys.length,
          threshold: this.config.dlq.alertThreshold,
        };
      }

      return stats;
    } catch (error) {
      logger.error('[EMAIL_QUEUE] Failed to get statistics:', error);
      return {
        error: 'Failed to retrieve statistics',
        queueType: this.queue ? 'redis' : 'in-memory',
      };
    }
  }

  /**
   * Process failed jobs from DLQ
   */
  public async reprocessDLQJobs(limit: number = 10): Promise<{ processed: number; errors: string[] }> {
    if (!redis || !this.config.dlq.enabled) {
      return { processed: 0, errors: ['DLQ not available'] };
    }

    const errors: string[] = [];
    let processed = 0;

    try {
      const dlqKeys = await redis.keys('dlq:email:*');
      const keysToProcess = dlqKeys.slice(0, limit);

      for (const key of keysToProcess) {
        try {
          const dataStr = await redis.get(key);
          if (dataStr) {
            const data = JSON.parse(dataStr);
            // Remove DLQ metadata
            delete data.failedAt;
            delete data.error;
            delete data.stack;
            delete data.retryCount;

            // Re-queue the job
            await this.addEmailJob(data.jobType, data);
            await redis.del(key);
            processed++;
          }
        } catch (jobError: any) {
          errors.push(`Failed to reprocess ${key}: ${jobError.message}`);
        }
      }

      logger.info(`[EMAIL_QUEUE] Reprocessed ${processed} jobs from DLQ`);
    } catch (error: any) {
      errors.push(`DLQ reprocessing failed: ${error.message}`);
    }

    return { processed, errors };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('[EMAIL_QUEUE] Starting graceful shutdown...');

    try {
      // Stop in-memory processor
      if (this.inMemoryProcessor) {
        clearInterval(this.inMemoryProcessor);
        this.inMemoryProcessor = null;
      }

      // Process remaining in-memory jobs (with timeout)
      const remainingJobs = this.fallbackQueue.jobs.length;
      if (remainingJobs > 0) {
        logger.info(`[EMAIL_QUEUE] Processing ${remainingJobs} remaining in-memory jobs...`);
        
        const timeout = setTimeout(() => {
          logger.warn('[EMAIL_QUEUE] Shutdown timeout reached, some jobs may be lost');
        }, 30000); // 30 second timeout

        while (this.fallbackQueue.jobs.length > 0 && !this.fallbackQueue.processing) {
          this.fallbackQueue.processing = true;
          const job = this.fallbackQueue.jobs.shift();
          if (job) {
            try {
              await this.processEmailJobData(job);
            } catch (error) {
              logger.error('[EMAIL_QUEUE] Failed to process job during shutdown:', error);
            }
          }
          this.fallbackQueue.processing = false;
        }
        
        clearTimeout(timeout);
      }

      // Close queue events
      if (this.queueEvents) {
        await this.queueEvents.close();
      }

      logger.info('[EMAIL_QUEUE] Shutdown completed successfully');
    } catch (error) {
      logger.error('[EMAIL_QUEUE] Error during shutdown:', error);
      throw error;
    }
  }
}

// Export types and interfaces
export type EmailJobData = 
  | (VerificationEmailData & { jobType: EmailJobType })
  | (PasswordResetEmailData & { jobType: EmailJobType })
  | (TwoFactorEmailData & { jobType: EmailJobType })
  | (MFASetupConfirmationData & { jobType: EmailJobType })
  | (LoginAlertEmailData & { jobType: EmailJobType })
  | (JobData & { jobType: EmailJobType; userEmail: string });

// Export singleton instance
export const emailQueue = EmailQueue.getInstance();

// Export convenience functions
export const queueVerificationEmail = (data: VerificationEmailData) =>
  emailQueue.addEmailJob('send-verification-email', data);

export const queuePasswordResetEmail = (data: PasswordResetEmailData) =>
  emailQueue.addEmailJob('send-password-reset-email', data);

export const queue2FAEmail = (data: TwoFactorEmailData) =>
  emailQueue.addEmailJob('send-2fa-code-email', data, { priority: JOB_PRIORITIES.CRITICAL });

export const queueMFASetupConfirmation = (data: MFASetupConfirmationData) =>
  emailQueue.addEmailJob('send-mfa-setup-confirmation', data);

export const queueLoginAlertEmail = (data: LoginAlertEmailData) =>
  emailQueue.addEmailJob('send-login-alert-email', data, { priority: JOB_PRIORITIES.HIGH });

export default EmailQueue;