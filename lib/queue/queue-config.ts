/**
 * BullMQ Queue Configuration
 * Enterprise-grade job queue system for payment processing
 */

import { ConnectionOptions, QueueOptions, WorkerOptions } from 'bullmq';

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Queue names
export const QueueNames = {
  ENROLLMENT: 'enrollment-queue',
  WEBHOOK: 'webhook-queue',
  EMAIL: 'email-queue',
  PAYMENT_RECONCILIATION: 'payment-reconciliation-queue',
} as const;

// Default queue options
export const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs
    },
  },
};

// Worker options for concurrent processing
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  limiter: {
    max: 100, // Max 100 jobs
    duration: 1000, // per second
  },
  stalledInterval: 30000, // Check for stalled jobs every 30s
  maxStalledCount: 2, // Allow 2 stalls before marking as failed
  lockDuration: 300000, // 5 min lock duration for long-running jobs
};

// Job priorities
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

// Job data types
export interface EnrollmentJobData {
  userId: string;
  courseId: string;
  enrollmentType: 'FREE' | 'PAID' | 'SCHOLARSHIP' | 'TRIAL' | 'MANUAL';
  paymentTransactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookJobData {
  webhookEventId: string;
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  retryCount?: number;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'ENROLLMENT_SUCCESS' | 'ENROLLMENT_FAILED' | 'PAYMENT_RECEIPT' | 'COURSE_WELCOME' | 'COURSE_COMPLETION' | 'REFUND_PROCESSED';
  data: Record<string, unknown>;
  emailQueueId?: string;
}

export interface PaymentReconciliationJobData {
  startDate: Date;
  endDate: Date;
  provider?: string;
}
