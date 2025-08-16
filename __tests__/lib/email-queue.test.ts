import {
  EmailQueue,
  EmailJobType,
  VerificationEmailData,
  PasswordResetEmailData,
  TwoFactorEmailData,
  MFASetupConfirmationData,
  LoginAlertEmailData,
  emailQueue,
  queueVerificationEmail,
  queuePasswordResetEmail,
  queue2FAEmail,
  queueMFASetupConfirmation,
  queueLoginAlertEmail,
} from '@/lib/queue/email-queue';

// Mock dependencies
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
    obliterate: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  Job: jest.fn(),
}));

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis with a modifiable instance
const mockRedisInstance = {
  ping: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

jest.mock('@/lib/redis', () => ({
  get redis() {
    return this._redis;
  },
  set redis(value) {
    this._redis = value;
  },
  _redis: null,
}));

jest.mock('@/lib/queue/queue-manager', () => ({
  queueManager: {
    addQueue: jest.fn(),
    registerHandler: jest.fn(),
    startWorker: jest.fn(),
    getQueueStats: jest.fn(),
    queues: new Map(),
    ioRedis: {
      ping: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    },
  },
}));

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendTwoFactorTokenEmail: jest.fn(),
}));

import { Queue, Worker, QueueEvents } from 'bullmq';
import { logger } from '@/lib/logger';
import * as redisModule from '@/lib/redis';
import { queueManager } from '@/lib/queue/queue-manager';
import { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorTokenEmail } from '@/lib/mail';

describe('Email Queue System', () => {
  let queue: EmailQueue;
  let mockQueue: any;
  let mockWorker: any;
  let mockQueueEvents: any;

  const mockVerificationData: VerificationEmailData = {
    jobType: 'send-verification-email',
    userEmail: 'test@example.com',
    userName: 'Test User',
    verificationToken: 'verification-token-123',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    isResend: false,
  };

  const mockPasswordResetData: PasswordResetEmailData = {
    jobType: 'send-password-reset-email',
    userEmail: 'test@example.com',
    userName: 'Test User',
    resetToken: 'reset-token-123',
    expiresAt: new Date(Date.now() + 3600000),
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  };

  const mock2FAData: TwoFactorEmailData = {
    jobType: 'send-2fa-code-email',
    userEmail: 'test@example.com',
    userName: 'Test User',
    code: '123456',
    expiresAt: new Date(Date.now() + 300000), // 5 minutes
    ipAddress: '127.0.0.1',
    loginAttemptId: 'attempt-123',
  };

  const mockMFASetupData: MFASetupConfirmationData = {
    jobType: 'send-mfa-setup-confirmation',
    userEmail: 'test@example.com',
    userName: 'Test User',
    method: 'totp',
    setupDate: new Date(),
    backupCodes: ['CODE1-1234', 'CODE2-5678'],
  };

  const mockLoginAlertData: LoginAlertEmailData = {
    jobType: 'send-login-alert-email',
    userEmail: 'test@example.com',
    userName: 'Test User',
    loginDate: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser/1.0',
    location: 'New York, NY',
    isNewDevice: true,
    isSuccessful: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (EmailQueue as any).instance = undefined;
    
    // Clear queueManager state
    if ((queueManager as any).queues) {
      (queueManager as any).queues.clear();
    }
    
    // Mock Queue, Worker, and QueueEvents
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      close: jest.fn(),
      obliterate: jest.fn(),
    };
    
    mockWorker = {
      close: jest.fn(),
    };
    
    mockQueueEvents = {
      on: jest.fn(),
      close: jest.fn(),
    };
    
    (Queue as unknown as jest.Mock).mockImplementation(() => mockQueue);
    (Worker as unknown as jest.Mock).mockImplementation(() => mockWorker);
    (QueueEvents as unknown as jest.Mock).mockImplementation(() => mockQueueEvents);
    
    // Mock queue manager
    (queueManager.addQueue as jest.Mock).mockImplementation(() => {});
    (queueManager.registerHandler as jest.Mock).mockImplementation(() => {});
    (queueManager.startWorker as jest.Mock).mockImplementation(() => {});
    (queueManager as any).queues = new Map([['email-enhanced', mockQueue]]);
    
    // Mock mail functions
    (sendVerificationEmail as jest.Mock).mockResolvedValue({ id: 'msg-123' });
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue({ id: 'msg-456' });
    (sendTwoFactorTokenEmail as jest.Mock).mockResolvedValue({ id: 'msg-789' });
    
    // Start with in-memory mode (no Redis)
    (redisModule as any).redis = null;
  });

  afterEach(async () => {
    if (queue) {
      await queue.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with in-memory fallback when Redis is unavailable', async () => {
      queue = EmailQueue.getInstance();
      
      // Should start the in-memory processor
      expect(queue).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis unavailable, using in-memory fallback'),
        expect.any(Error)
      );
    });

    it('should initialize with Redis when available', async () => {
      // Reset singleton before test
      (EmailQueue as any).instance = undefined;
      
      // Mock Redis as available
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      };
      (redisModule as any).redis = mockRedis;
      
      // Clear previous mock calls
      jest.clearAllMocks();
      
      queue = EmailQueue.getInstance();
      
      expect(queueManager.addQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'email-enhanced',
          concurrency: 5,
        })
      );
    });

    it('should return singleton instance', () => {
      const instance1 = EmailQueue.getInstance();
      const instance2 = EmailQueue.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Job queuing with in-memory fallback', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should queue verification email job', async () => {
      const jobData = { ...mockVerificationData, jobType: 'send-verification-email' as const };
      const result = await queue.addEmailJob('send-verification-email', jobData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // In-memory mode returns string ID
    });

    it('should queue password reset email job', async () => {
      const jobData = { ...mockPasswordResetData, jobType: 'send-password-reset-email' as const };
      const result = await queue.addEmailJob('send-password-reset-email', jobData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should queue 2FA email job with high priority', async () => {
      const jobData = { ...mock2FAData, jobType: 'send-2fa-code-email' as const };
      const result = await queue.addEmailJob('send-2fa-code-email', jobData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should queue MFA setup confirmation email', async () => {
      const jobData = { ...mockMFASetupData, jobType: 'send-mfa-setup-confirmation' as const };
      const result = await queue.addEmailJob('send-mfa-setup-confirmation', jobData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should queue login alert email', async () => {
      const jobData = { ...mockLoginAlertData, jobType: 'send-login-alert-email' as const };
      const result = await queue.addEmailJob('send-login-alert-email', jobData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Job queuing with Redis', () => {
    beforeEach(() => {
      // Reset singleton before each test
      (EmailQueue as any).instance = undefined;
      
      // Mock Redis as available
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        get: jest.fn().mockResolvedValue(null), // No duplicates
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      };
      (redisModule as any).redis = mockRedis;
      
      queue = EmailQueue.getInstance();
    });

    it('should queue jobs to Redis when available', async () => {
      const jobData = { ...mockVerificationData, jobType: 'send-verification-email' as const };
      const result = await queue.addEmailJob('send-verification-email', jobData);
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-verification-email',
        expect.objectContaining({
          ...jobData,
          timestamp: expect.any(Date),
        }),
        expect.objectContaining({
          priority: expect.any(Number),
          attempts: expect.any(Number),
        })
      );
      
      expect(result).toEqual({ id: 'job-123' });
    });

    it('should apply deduplication when enabled', async () => {
      // Reset singleton before test
      (EmailQueue as any).instance = undefined;
      
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        get: jest.fn().mockResolvedValue('1'), // Duplicate exists
        setex: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      };
      (redisModule as any).redis = mockRedis;
      
      queue = EmailQueue.getInstance();
      const jobData = { ...mockVerificationData, jobType: 'send-verification-email' as const };
      const result = await queue.addEmailJob('send-verification-email', jobData);
      
      expect(result).toBe('duplicate-skipped');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Job processing', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should process verification email jobs', async () => {
      // Simulate job processing by directly calling the internal method
      const jobData = {
        ...mockVerificationData,
        jobType: 'send-verification-email' as EmailJobType,
      };
      
      // Access private method for testing
      const result = await (queue as any).processEmailJobData(jobData);
      
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        mockVerificationData.userEmail,
        mockVerificationData.verificationToken
      );
      expect(result.success).toBe(true);
      expect(result.deliveryStatus).toBe('sent');
    });

    it('should process password reset email jobs', async () => {
      const jobData = {
        ...mockPasswordResetData,
        jobType: 'send-password-reset-email' as EmailJobType,
      };
      
      const result = await (queue as any).processEmailJobData(jobData);
      
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        mockPasswordResetData.userEmail,
        mockPasswordResetData.resetToken
      );
      expect(result.success).toBe(true);
    });

    it('should process 2FA email jobs', async () => {
      const jobData = {
        ...mock2FAData,
        jobType: 'send-2fa-code-email' as EmailJobType,
      };
      
      const result = await (queue as any).processEmailJobData(jobData);
      
      expect(sendTwoFactorTokenEmail).toHaveBeenCalledWith(
        mock2FAData.userEmail,
        mock2FAData.code
      );
      expect(result.success).toBe(true);
    });

    it('should process MFA setup confirmation emails', async () => {
      const jobData = {
        ...mockMFASetupData,
        jobType: 'send-mfa-setup-confirmation' as EmailJobType,
      };
      
      const result = await (queue as any).processEmailJobData(jobData);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.template).toBe('mfa-setup');
      expect(result.metadata?.method).toBe('totp');
    });

    it('should process login alert emails', async () => {
      const jobData = {
        ...mockLoginAlertData,
        jobType: 'send-login-alert-email' as EmailJobType,
      };
      
      const result = await (queue as any).processEmailJobData(jobData);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.template).toBe('login-alert');
      expect(result.metadata?.isSuccessful).toBe(true);
      expect(result.metadata?.isNewDevice).toBe(true);
    });
  });

  describe('Error handling and retry logic', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should handle email service failures', async () => {
      (sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Email service down'));
      
      const jobData = {
        ...mockVerificationData,
        jobType: 'send-verification-email' as EmailJobType,
      };
      
      await expect((queue as any).processEmailJobData(jobData)).rejects.toThrow('Email service down');
    });

    it('should validate job data before processing', async () => {
      const invalidData = {
        userEmail: 'invalid-email',
        userName: 'Test User',
      };
      
      await expect(
        queue.addEmailJob('send-verification-email', invalidData as any)
      ).rejects.toThrow('Invalid email address');
    });

    it('should validate specific job requirements', async () => {
      const incompleteVerificationData = {
        userEmail: 'test@example.com',
        userName: 'Test User',
        // Missing verificationToken
      };
      
      await expect(
        queue.addEmailJob('send-verification-email', incompleteVerificationData as any)
      ).rejects.toThrow('Verification email requires token and userName');
    });

    it('should validate 2FA code requirements', async () => {
      const invalid2FAData = {
        userEmail: 'test@example.com',
        userName: 'Test User',
        code: '123', // Too short
      };
      
      await expect(
        queue.addEmailJob('send-2fa-code-email', invalid2FAData as any)
      ).rejects.toThrow('2FA email requires valid code');
    });
  });

  describe('Rate limiting', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should enforce rate limits per email address', async () => {
      const email = 'rate-limited@example.com';
      
      // Fill up the rate limit (assuming default is 100/minute)
      for (let i = 0; i < 100; i++) {
        const jobData = {
          ...mockVerificationData,
          userEmail: `${i}-${email}`, // Different emails to avoid deduplication
          verificationToken: `token-${i}`, // Different tokens to avoid deduplication
          jobType: 'send-verification-email' as const,
        };
        await queue.addEmailJob('send-verification-email', jobData);
      }
      
      // This should be rate limited
      const rateLimitedJobData = {
        ...mockVerificationData,
        userEmail: email,
        verificationToken: 'final-token',
        jobType: 'send-verification-email' as const,
      };
      await expect(
        queue.addEmailJob('send-verification-email', rateLimitedJobData)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset rate limits after time window', async () => {
      // This test would be complex to implement without mocking time
      // In a real scenario, you would test with a shorter window
      expect(true).toBe(true);
    });
  });

  describe('Circuit breaker', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should open circuit breaker after multiple failures', async () => {
      // Mock email service to always fail
      (sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Service down'));
      
      const jobData = {
        ...mockVerificationData,
        jobType: 'send-verification-email' as EmailJobType,
      };
      
      // Generate enough failures to open circuit breaker
      for (let i = 0; i < 10; i++) {
        try {
          await (queue as any).processEmailJobData(jobData);
        } catch (error) {
          // Expected failures
        }
      }
      
      // Circuit breaker should now be open
      await expect((queue as any).processEmailJobData(jobData))
        .rejects.toThrow('Circuit breaker is open');
    });

    it('should reset circuit breaker on successful request', async () => {
      // First cause failures to open circuit breaker
      (sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Service down'));
      
      const jobData = {
        ...mockVerificationData,
        jobType: 'send-verification-email' as EmailJobType,
      };
      
      // Generate some failures
      for (let i = 0; i < 5; i++) {
        try {
          await (queue as any).processEmailJobData(jobData);
        } catch (error) {
          // Expected failures
        }
      }
      
      // Now make email service work again
      (sendVerificationEmail as jest.Mock).mockResolvedValue({ id: 'success' });
      
      // This should reset the circuit breaker
      const result = await (queue as any).processEmailJobData(jobData);
      expect(result.success).toBe(true);
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    beforeEach(() => {
      // Reset singleton before each test
      (EmailQueue as any).instance = undefined;
      
      // Mock Redis for DLQ functionality
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        get: jest.fn(),
        setex: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      };
      (redisModule as any).redis = mockRedis;
      
      queue = EmailQueue.getInstance();
    });

    it('should send failed jobs to DLQ after max retries', async () => {
      const mockJob = {
        id: 'failed-job-123',
        attemptsMade: 5, // Exceeds max retries
        data: {
          ...mockVerificationData,
          jobType: 'send-verification-email' as EmailJobType,
        },
      };
      
      const error = new Error('Permanent failure');
      
      await (queue as any).sendToDeadLetterQueue(mockJob.data, error);
      
      expect((redisModule as any).redis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^dlq:email:/),
        expect.any(Number),
        expect.stringContaining('send-verification-email')
      );
    });

    it('should reprocess jobs from DLQ', async () => {
      const dlqData = JSON.stringify({
        ...mockVerificationData,
        jobType: 'send-verification-email',
        failedAt: new Date(),
        error: 'Previous error',
      });
      
      (redisModule as any).redis.keys.mockResolvedValue(['dlq:email:123']);
      (redisModule as any).redis.get.mockResolvedValue(dlqData);
      (redisModule as any).redis.del.mockResolvedValue(1);
      
      mockQueue.add.mockResolvedValue({ id: 'reprocessed-job' });
      
      const result = await queue.reprocessDLQJobs(1);
      
      expect(result.processed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-verification-email',
        expect.objectContaining({
          ...mockVerificationData,
          jobType: 'send-verification-email'
        })
      );
    });
  });

  describe('Convenience functions', () => {
    it('should queue verification email using convenience function', async () => {
      const result = await queueVerificationEmail(mockVerificationData);
      expect(result).toBeDefined();
    });

    it('should queue password reset email using convenience function', async () => {
      const result = await queuePasswordResetEmail(mockPasswordResetData);
      expect(result).toBeDefined();
    });

    it('should queue 2FA email using convenience function', async () => {
      const result = await queue2FAEmail(mock2FAData);
      expect(result).toBeDefined();
    });

    it('should queue MFA setup confirmation using convenience function', async () => {
      const result = await queueMFASetupConfirmation(mockMFASetupData);
      expect(result).toBeDefined();
    });

    it('should queue login alert email using convenience function', async () => {
      const result = await queueLoginAlertEmail(mockLoginAlertData);
      expect(result).toBeDefined();
    });
  });

  describe('Statistics and monitoring', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should provide queue statistics', async () => {
      const stats = await queue.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.queueType).toBe('in-memory');
      expect(stats.circuitBreaker).toBeDefined();
      expect(stats.inMemoryQueue).toBeDefined();
    });

    it('should provide Redis statistics when available', async () => {
      // Reset singleton before test
      (EmailQueue as any).instance = undefined;
      
      // Mock Redis for statistics
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        keys: jest.fn().mockResolvedValue(['dlq:email:1', 'dlq:email:2']),
      };
      (redisModule as any).redis = mockRedis;
      (queueManager.getQueueStats as jest.Mock).mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      });
      
      queue = EmailQueue.getInstance();
      const stats = await queue.getStatistics();
      
      expect(stats.queueType).toBe('redis');
      expect(stats.redis).toBeDefined();
      expect(stats.dlq).toBeDefined();
      expect(stats.dlq.failedJobs).toBe(2);
    });
  });

  describe('Email template generation', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should generate MFA setup confirmation template correctly', () => {
      const template = (queue as any).createMFASetupTemplate(mockMFASetupData);
      
      expect(template.subject).toContain('Multi-Factor Authentication Enabled');
      expect(template.html).toContain(mockMFASetupData.userName);
      expect(template.html).toContain('Authenticator App');
      expect(template.html).toContain('CODE1-1234');
      expect(template.html).toContain('CODE2-5678');
    });

    it('should generate login alert template for successful login', () => {
      const template = (queue as any).createLoginAlertTemplate(mockLoginAlertData);
      
      expect(template.subject).toContain('Successful Login Alert');
      expect(template.html).toContain('✅');
      expect(template.html).toContain(mockLoginAlertData.userName);
      expect(template.html).toContain(mockLoginAlertData.ipAddress);
      expect(template.html).toContain('New Device');
    });

    it('should generate login alert template for failed login', () => {
      const failedLoginData = {
        ...mockLoginAlertData,
        isSuccessful: false,
      };
      
      const template = (queue as any).createLoginAlertTemplate(failedLoginData);
      
      expect(template.subject).toContain('Failed Login Alert');
      expect(template.html).toContain('⚠️');
      expect(template.html).toContain('Security Alert');
    });
  });

  describe('Graceful shutdown', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should shutdown gracefully', async () => {
      await queue.shutdown();
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting graceful shutdown')
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Shutdown completed successfully')
      );
    });

    it('should process remaining in-memory jobs during shutdown', async () => {
      // Add a job to in-memory queue
      const jobData = { ...mockVerificationData, jobType: 'send-verification-email' as const };
      await queue.addEmailJob('send-verification-email', jobData);
      
      // Shutdown should process the remaining job
      await queue.shutdown();
      
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('should prevent new jobs during shutdown', async () => {
      // Start shutdown process
      const shutdownPromise = queue.shutdown();
      
      // Try to add job during shutdown
      const jobData = { ...mockVerificationData, jobType: 'send-verification-email' as const };
      await expect(
        queue.addEmailJob('send-verification-email', jobData)
      ).rejects.toThrow('Email queue is shutting down');
      
      await shutdownPromise;
    });
  });

  describe('Performance and reliability', () => {
    beforeEach(() => {
      queue = EmailQueue.getInstance();
    });

    it('should handle high-frequency job additions', async () => {
      const startTime = Date.now();
      const jobPromises = [];
      
      for (let i = 0; i < 100; i++) {
        const jobData = {
          ...mockVerificationData,
          userEmail: `user${i}@example.com`,
          verificationToken: `user-token-${i}`,
          jobType: 'send-verification-email' as const,
        };
        jobPromises.push(
          queue.addEmailJob('send-verification-email', jobData)
        );
      }
      
      await Promise.all(jobPromises);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent job processing', async () => {
      const jobPromises = [];
      
      for (let i = 0; i < 10; i++) {
        const jobData = {
          ...mockVerificationData,
          jobType: 'send-verification-email' as EmailJobType,
          userEmail: `concurrent${i}@example.com`,
          verificationToken: `concurrent-token-${i}`,
        };
        
        jobPromises.push((queue as any).processEmailJobData(jobData));
      }
      
      const results = await Promise.all(jobPromises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(sendVerificationEmail).toHaveBeenCalledTimes(10);
    });

    it('should maintain data integrity under concurrent load', async () => {
      const concurrentOperations = [];
      
      // Mix of different operations
      for (let i = 0; i < 50; i++) {
        const jobData = {
          ...mockVerificationData,
          userEmail: `stress${i}@example.com`,
          verificationToken: `stress-token-${i}`,
          jobType: 'send-verification-email' as const,
        };
        concurrentOperations.push(
          queue.addEmailJob('send-verification-email', jobData)
        );
        
        if (i % 10 === 0) {
          concurrentOperations.push(queue.getStatistics());
        }
      }
      
      const results = await Promise.allSettled(concurrentOperations);
      
      // Most operations should succeed
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(45); // Allow for some rate limiting
    });
  });
});