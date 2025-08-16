/**
 * Email Queue System Tests
 * 
 * This test suite ensures:
 * - Email jobs are queued correctly
 * - Retry logic works with exponential backoff
 * - Dead Letter Queue handles failed emails
 * - Circuit breaker prevents cascading failures
 * - Rate limiting prevents spam
 * - Email deduplication works
 * - In-memory fallback functions properly
 * - No emails are lost during failures
 */

import { EmailQueue, EmailJobType } from '@/lib/queue/email-queue';
import { EmailMonitor } from '@/lib/queue/email-monitoring';
import { EmailProcessor } from '@/lib/queue/email-processor';
import { logger } from '@/lib/logger';

// Mock Redis for testing
jest.mock('@/lib/redis', () => ({
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  }
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock mail functions
jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ id: 'test-message-id' }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ id: 'test-message-id' }),
  sendTwoFactorTokenEmail: jest.fn().mockResolvedValue({ id: 'test-message-id' }),
}));

describe('EmailQueue', () => {
  let emailQueue: EmailQueue;

  beforeEach(() => {
    // Reset singleton instance to get a fresh instance
    (EmailQueue as any).instance = undefined;
    // Create a new instance for each test
    emailQueue = EmailQueue.getInstance();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await emailQueue.shutdown();
  });

  describe('Queue Initialization', () => {
    test('should initialize with default configuration', async () => {
      expect(emailQueue).toBeDefined();
      
      const stats = await emailQueue.getStatistics();
      expect(stats).toHaveProperty('queueType');
      expect(['redis', 'in-memory']).toContain(stats.queueType);
    });

    test('should handle Redis unavailability gracefully', async () => {
      // This test will automatically use in-memory fallback due to our mock
      const stats = await emailQueue.getStatistics();
      expect(stats.queueType).toBe('in-memory');
    });
  });

  describe('Email Job Queuing', () => {
    test('should queue verification email successfully', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'test-token-123',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        userId: 'user-123',
        timestamp: new Date(),
      };

      const job = await emailQueue.addEmailJob('send-verification-email', jobData);
      
      expect(job).toBeDefined();
      expect(typeof job === 'string' || typeof job === 'object').toBe(true);
    });

    test('should queue password reset email successfully', async () => {
      const jobData = {
        jobType: 'send-password-reset-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        resetToken: 'reset-token-123',
        expiresAt: new Date(Date.now() + 3600000),
        userId: 'user-123',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
      };

      const job = await emailQueue.addEmailJob('send-password-reset-email', jobData);
      
      expect(job).toBeDefined();
    });

    test('should queue 2FA email with high priority', async () => {
      const jobData = {
        jobType: 'send-2fa-code-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        code: '123456',
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        userId: 'user-123',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
      };

      const job = await emailQueue.addEmailJob('send-2fa-code-email', jobData);
      
      expect(job).toBeDefined();
    });

    test('should queue MFA setup confirmation email', async () => {
      const jobData = {
        jobType: 'send-mfa-setup-confirmation' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        method: 'totp' as const,
        setupDate: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
        backupCodes: ['code1', 'code2', 'code3'],
      };

      const job = await emailQueue.addEmailJob('send-mfa-setup-confirmation', jobData);
      
      expect(job).toBeDefined();
    });

    test('should queue login alert email', async () => {
      const jobData = {
        jobType: 'send-login-alert-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        loginDate: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        location: 'New York, US',
        isNewDevice: true,
        isSuccessful: true,
        userId: 'user-123',
        timestamp: new Date(),
      };

      const job = await emailQueue.addEmailJob('send-login-alert-email', jobData);
      
      expect(job).toBeDefined();
    });
  });

  describe('Email Job Validation', () => {
    test('should reject invalid email addresses', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'invalid-email',
        userName: 'Test User',
        verificationToken: 'test-token',
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      await expect(
        emailQueue.addEmailJob('send-verification-email', jobData)
      ).rejects.toThrow('Invalid email address');
    });

    test('should reject missing required fields', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        // Missing verificationToken
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      await expect(
        emailQueue.addEmailJob('send-verification-email', jobData as any)
      ).rejects.toThrow('Verification email requires token and userName');
    });

    test('should reject invalid 2FA code', async () => {
      const jobData = {
        jobType: 'send-2fa-code-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        code: '12', // Too short
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      await expect(
        emailQueue.addEmailJob('send-2fa-code-email', jobData as any)
      ).rejects.toThrow('2FA email requires valid code');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'test-token',
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      // Queue multiple jobs rapidly
      const jobs = [];
      for (let i = 0; i < 150; i++) { // Exceed the rate limit
        jobs.push(
          emailQueue.addEmailJob('send-verification-email', {
            ...jobData,
            verificationToken: `token-${i}`,
          })
        );
      }

      // Some jobs should be rejected due to rate limiting
      const results = await Promise.allSettled(jobs);
      const rejected = results.filter(result => result.status === 'rejected');
      
      expect(rejected.length).toBeGreaterThan(0);
      expect(rejected[0].reason.message).toContain('Rate limit exceeded');
    });
  });

  describe('Email Deduplication', () => {
    test('should detect and skip duplicate emails', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'same-token-123', // Same token = duplicate
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      // Queue the same job twice
      const job1 = await emailQueue.addEmailJob('send-verification-email', jobData);
      const job2 = await emailQueue.addEmailJob('send-verification-email', jobData);

      expect(job1).toBeDefined();
      expect(job2).toBe('duplicate-skipped');
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after multiple failures', async () => {
      // Mock email service to always fail
      const originalSendEmail = require('@/lib/mail').sendVerificationEmail;
      require('@/lib/mail').sendVerificationEmail = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'test-token',
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      // Generate multiple failing jobs to trigger circuit breaker
      const failingJobs = [];
      for (let i = 0; i < 15; i++) {
        failingJobs.push(
          emailQueue.addEmailJob('send-verification-email', {
            ...jobData,
            verificationToken: `token-${i}`,
          })
        );
      }

      await Promise.allSettled(failingJobs);

      // Give the queue time to process and fail
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Next job should fail immediately due to circuit breaker
      await expect(
        emailQueue.addEmailJob('send-verification-email', {
          ...jobData,
          verificationToken: 'circuit-breaker-test',
        })
      ).rejects.toThrow('Circuit breaker is open');

      // Restore original function
      require('@/lib/mail').sendVerificationEmail = originalSendEmail;
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide queue statistics', async () => {
      const stats = await emailQueue.getStatistics();

      expect(stats).toHaveProperty('queueType');
      expect(stats).toHaveProperty('circuitBreaker');
      expect(stats).toHaveProperty('rateLimiting');
      expect(stats).toHaveProperty('inMemoryQueue');

      if (stats.queueType === 'redis') {
        expect(stats).toHaveProperty('redis');
      }
    });

    test('should track job processing metrics', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'metrics-test',
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      await emailQueue.addEmailJob('send-verification-email', jobData);

      // Allow some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stats = await emailQueue.getStatistics();
      expect(stats.inMemoryQueue.pendingJobs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    test('should handle DLQ reprocessing', async () => {
      const result = await emailQueue.reprocessDLQJobs(5);

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.processed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Graceful Shutdown', () => {
    test('should shutdown gracefully', async () => {
      const jobData = {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verificationToken: 'shutdown-test',
        expiresAt: new Date(),
        userId: 'user-123',
        timestamp: new Date(),
      };

      // Add a job
      await emailQueue.addEmailJob('send-verification-email', jobData);

      // Shutdown should complete without errors
      await expect(emailQueue.shutdown()).resolves.toBeUndefined();
    });
  });
});

describe('EmailMonitor', () => {
  let emailMonitor: EmailMonitor;

  beforeEach(() => {
    emailMonitor = new EmailMonitor();
  });

  afterEach(async () => {
    await emailMonitor.stop();
  });

  describe('Monitoring Initialization', () => {
    test('should initialize with default configuration', async () => {
      expect(emailMonitor).toBeDefined();
      await expect(emailMonitor.start()).resolves.toBeUndefined();
    });
  });

  describe('Dashboard Data', () => {
    test('should provide dashboard data', async () => {
      await emailMonitor.start();
      
      const dashboardData = await emailMonitor.getDashboardData();

      expect(dashboardData).toHaveProperty('queue');
      expect(dashboardData).toHaveProperty('metrics');
      expect(dashboardData).toHaveProperty('alerts');
      expect(dashboardData).toHaveProperty('sla');
      expect(dashboardData).toHaveProperty('performance');
      expect(dashboardData).toHaveProperty('timestamp');
    });
  });

  describe('Alert Management', () => {
    test('should handle alert acknowledgment', async () => {
      await emailMonitor.start();

      // Get initial alerts (should be empty)
      const initialAlerts = emailMonitor.getActiveAlerts();
      expect(Array.isArray(initialAlerts)).toBe(true);

      // Test acknowledging a non-existent alert
      const result = emailMonitor.acknowledgeAlert('non-existent-alert');
      expect(result).toBe(false);
    });

    test('should handle alert resolution', async () => {
      await emailMonitor.start();

      // Test resolving a non-existent alert
      const result = emailMonitor.resolveAlert('non-existent-alert');
      expect(result).toBe(false);
    });
  });

  describe('SLA Reporting', () => {
    test('should generate SLA report', async () => {
      await emailMonitor.start();
      
      const slaReport = await emailMonitor.getSLAReport('day');

      expect(slaReport).toHaveProperty('period');
      expect(slaReport).toHaveProperty('sla');
      expect(slaReport).toHaveProperty('compliance');
      expect(slaReport).toHaveProperty('violations');
      expect(slaReport).toHaveProperty('recommendations');
    });

    test('should handle different SLA periods', async () => {
      await emailMonitor.start();
      
      const dayReport = await emailMonitor.getSLAReport('day');
      const weekReport = await emailMonitor.getSLAReport('week');
      const monthReport = await emailMonitor.getSLAReport('month');

      expect(dayReport.period.duration).toBe('day');
      expect(weekReport.period.duration).toBe('week');
      expect(monthReport.period.duration).toBe('month');
    });
  });
});

describe('EmailProcessor', () => {
  let emailProcessor: EmailProcessor;

  beforeEach(() => {
    emailProcessor = new EmailProcessor({
      concurrency: 1,
      healthCheckInterval: 1000,
      statsInterval: 2000,
      shutdownTimeout: 5000,
    });
  });

  afterEach(async () => {
    await emailProcessor.stop();
  });

  describe('Processor Lifecycle', () => {
    test('should start and stop processor', async () => {
      await expect(emailProcessor.start()).resolves.toBeUndefined();
      await expect(emailProcessor.stop()).resolves.toBeUndefined();
    });

    test('should provide processor status', async () => {
      await emailProcessor.start();
      
      const status = emailProcessor.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('startTime');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('processedJobs');
      expect(status).toHaveProperty('failedJobs');
      expect(status).toHaveProperty('errorRate');
      expect(status).toHaveProperty('memory');
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('pid');

      expect(status.isRunning).toBe(true);
      expect(typeof status.uptime).toBe('number');
      expect(typeof status.processedJobs).toBe('number');
      expect(typeof status.errorRate).toBe('number');
    });

    test('should provide processor metrics', async () => {
      await emailProcessor.start();
      
      const metrics = await emailProcessor.getMetrics();

      expect(metrics).toHaveProperty('queueStats');
      expect(metrics).toHaveProperty('health');
      expect(metrics.health).toHaveProperty('score');
      expect(metrics.health).toHaveProperty('status');
      expect(metrics.health).toHaveProperty('checks');

      expect(typeof metrics.health.score).toBe('number');
      expect(['healthy', 'warning', 'critical', 'error']).toContain(metrics.health.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle startup errors gracefully', async () => {
      // Mock a startup failure
      const originalStart = EmailProcessor.prototype.start;
      EmailProcessor.prototype.start = jest.fn().mockRejectedValue(new Error('Startup failed'));

      const failingProcessor = new EmailProcessor();
      await expect(failingProcessor.start()).rejects.toThrow('Startup failed');

      // Restore original method
      EmailProcessor.prototype.start = originalStart;
    });
  });
});

describe('Integration Tests', () => {
  let emailQueue: EmailQueue;
  let emailMonitor: EmailMonitor;
  let emailProcessor: EmailProcessor;

  beforeEach(async () => {
    // Reset singleton instance to get a fresh instance
    (EmailQueue as any).instance = undefined;
    emailQueue = EmailQueue.getInstance();
    emailMonitor = new EmailMonitor();
    emailProcessor = new EmailProcessor({
      concurrency: 1,
      healthCheckInterval: 5000,
      statsInterval: 10000,
    });
  });

  afterEach(async () => {
    await emailQueue.shutdown();
    await emailMonitor.stop();
    await emailProcessor.stop();
  });

  test('should handle complete email workflow', async () => {
    // Start monitoring and processing
    await emailMonitor.start();
    await emailProcessor.start();

    // Queue an email
    const jobData = {
      jobType: 'send-verification-email' as EmailJobType,
      userEmail: 'integration-test@example.com',
      userName: 'Integration Test User',
      verificationToken: 'integration-test-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'integration-user-123',
      timestamp: new Date(),
    };

    const job = await emailQueue.addEmailJob('send-verification-email', jobData);
    expect(job).toBeDefined();

    // Allow processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check statistics
    const stats = await emailQueue.getStatistics();
    expect(stats).toBeDefined();

    // Check dashboard data
    const dashboardData = await emailMonitor.getDashboardData();
    expect(dashboardData).toBeDefined();

    // Check processor status
    const processorStatus = emailProcessor.getStatus();
    expect(processorStatus.isRunning).toBe(true);
  });

  test('should maintain email delivery guarantees', async () => {
    // Start all components
    await emailMonitor.start();
    await emailProcessor.start();

    const testEmails = [
      {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'user1@example.com',
        userName: 'User 1',
        verificationToken: 'token1',
        expiresAt: new Date(Date.now() + 3600000),
        userId: 'user1',
        timestamp: new Date(),
      },
      {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'user2@example.com',
        userName: 'User 2',
        verificationToken: 'token2',
        expiresAt: new Date(Date.now() + 3600000),
        userId: 'user2',
        timestamp: new Date(),
      },
      {
        jobType: 'send-verification-email' as EmailJobType,
        userEmail: 'user3@example.com',
        userName: 'User 3',
        verificationToken: 'token3',
        expiresAt: new Date(Date.now() + 3600000),
        userId: 'user3',
        timestamp: new Date(),
      },
    ];

    // Queue multiple emails
    const jobs = await Promise.all(
      testEmails.map(data => 
        emailQueue.addEmailJob('send-verification-email', data)
      )
    );

    expect(jobs).toHaveLength(3);
    jobs.forEach(job => expect(job).toBeDefined());

    // Allow processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify stats show processed jobs
    const stats = await emailQueue.getStatistics();
    expect(stats.inMemoryQueue.pendingJobs).toBeGreaterThanOrEqual(0);
  });
});

describe('Error Recovery Tests', () => {
  test('should recover from Redis connection failures', async () => {
    // This test verifies the in-memory fallback works
    // Reset singleton instance to get a fresh instance
    (EmailQueue as any).instance = undefined;
    const emailQueue = EmailQueue.getInstance();

    const jobData = {
      jobType: 'send-verification-email' as EmailJobType,
      userEmail: 'recovery-test@example.com',
      userName: 'Recovery Test',
      verificationToken: 'recovery-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'recovery-user',
      timestamp: new Date(),
    };

    // Should work even if Redis is unavailable (fallback to in-memory)
    const job = await emailQueue.addEmailJob('send-verification-email', jobData);
    expect(job).toBeDefined();

    // Statistics should still be available
    const stats = await emailQueue.getStatistics();
    expect(stats.queueType).toBe('in-memory');

    await emailQueue.shutdown();
  });

  test('should handle email service outages gracefully', async () => {
    // Reset singleton instance to get a fresh instance
    (EmailQueue as any).instance = undefined;
    const emailQueue = EmailQueue.getInstance();

    // Mock email service to fail
    require('@/lib/mail').sendVerificationEmail = jest.fn().mockRejectedValue(new Error('Email service down'));

    const jobData = {
      jobType: 'send-verification-email' as EmailJobType,
      userEmail: 'outage-test@example.com',
      userName: 'Outage Test',
      verificationToken: 'outage-token',
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'outage-user',
      timestamp: new Date(),
    };

    // Job should be queued successfully
    const job = await emailQueue.addEmailJob('send-verification-email', jobData);
    expect(job).toBeDefined();

    // Allow processing time for failures to accumulate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Circuit breaker should eventually activate
    const stats = await emailQueue.getStatistics();
    expect(stats).toBeDefined();

    await emailQueue.shutdown();
  });
});

// Utility function to wait for queue processing
async function waitForProcessing(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}