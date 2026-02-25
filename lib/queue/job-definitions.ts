/**
 * Job Definitions
 * Job type definitions, schemas, and configurations for the queue system
 */

import { Job, JobsOptions } from 'bullmq';

/**
 * Job Types - All possible job types in the system
 */
export type JobType =
  // Email jobs
  | 'send-welcome-email'
  | 'send-notification-email'
  | 'send-course-reminder'
  | 'send-password-reset'
  | 'send-course-completion-certificate'
  | 'send-bulk-announcement'

  // Analytics jobs
  | 'process-user-activity'
  | 'calculate-course-analytics'
  | 'generate-learning-insights'
  | 'update-user-progress'
  | 'compute-recommendation-scores'
  | 'aggregate-platform-metrics'

  // AI generation jobs
  | 'generate-course-content'
  | 'generate-quiz-questions'
  | 'create-learning-path'
  | 'analyze-course-effectiveness'
  | 'generate-personalized-content'
  | 'process-ai-feedback'

  // File processing jobs
  | 'process-video-upload'
  | 'generate-video-thumbnail'
  | 'convert-document'
  | 'optimize-image'
  | 'extract-video-captions'
  | 'process-batch-upload'

  // Notification jobs
  | 'send-push-notification'
  | 'send-webhook'
  | 'update-user-badges'
  | 'trigger-achievement'
  | 'send-reminder-notification'

  // Cleanup jobs
  | 'cleanup-temp-files'
  | 'archive-old-data'
  | 'update-cache'
  | 'optimize-database'
  | 'cleanup-failed-jobs'

  // Agentic jobs
  | 'sam-memory-ingestion'
  | 'sam-analytics-rollup'

  // Course creation pipeline job
  | 'generate-course-pipeline'

  // Payment & Enrollment jobs (Phase 3)
  | 'process-enrollment'
  | 'process-webhook'
  | 'send-enrollment-email'
  | 'reconcile-payments';

/**
 * Base job data interface
 */
export interface JobData {
  id?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Email job data interfaces
 */
export interface SendWelcomeEmailData extends JobData {
  userId: string;
  userEmail: string;
  userName: string;
  verificationToken?: string;
}

export interface SendNotificationEmailData extends JobData {
  userId: string;
  userEmail: string;
  subject: string;
  template: string;
  templateData: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
}

export interface SendCourseReminderData extends JobData {
  userId: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  lastAccessDate: Date;
  reminderType: 'progress' | 'completion' | 'upcoming';
}

export interface SendBulkAnnouncementData extends JobData {
  userIds: string[];
  subject: string;
  message: string;
  template?: string;
  segmentCriteria?: Record<string, any>;
}

/**
 * Analytics job data interfaces
 */
export interface ProcessUserActivityData extends JobData {
  userId: string;
  activityType: string;
  activityData: Record<string, any>;
  sessionId?: string;
  courseId?: string;
  chapterId?: string;
}

export interface SAMMemoryIngestionData extends JobData {
  content: string;
  sourceId: string;
  sourceType: string;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  tags?: string[];
  language?: string;
  customMetadata?: Record<string, unknown>;
  enableSummary?: boolean;
  enableKnowledgeGraph?: boolean;
}

export interface SAMAnalyticsRollupData extends JobData {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface CalculateCourseAnalyticsData extends JobData {
  courseId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metricsToCalculate: string[];
}

export interface GenerateLearningInsightsData extends JobData {
  userId: string;
  analysisType: 'progress' | 'performance' | 'engagement' | 'predictions';
  timeRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * AI generation job data interfaces
 */
export interface GenerateCourseContentData extends JobData {
  courseId: string;
  contentType: 'chapter' | 'section' | 'quiz' | 'exercise';
  generationParams: {
    topic: string;
    difficulty: string;
    targetAudience: string;
    learningObjectives: string[];
  };
  templateId?: string;
}

export interface GenerateQuizQuestionsData extends JobData {
  courseId: string;
  chapterId?: string;
  sectionId?: string;
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: string[];
  bloomsTaxonomyLevel: string[];
}

export interface CreateLearningPathData extends JobData {
  userId: string;
  goals: string[];
  currentSkills: string[];
  timeConstraints: {
    hoursPerWeek: number;
    totalWeeks: number;
  };
  preferredLearningStyle: string;
}

/**
 * File processing job data interfaces
 */
export interface ProcessVideoUploadData extends JobData {
  userId: string;
  videoId: string;
  filePath: string;
  fileName: string;
  courseId?: string;
  chapterId?: string;
  processingOptions: {
    generateThumbnail: boolean;
    extractCaptions: boolean;
    transcodeFormats: string[];
  };
}

export interface OptimizeImageData extends JobData {
  imageId: string;
  filePath: string;
  optimizationLevel: 'low' | 'medium' | 'high';
  targetFormats: string[];
  maxWidth?: number;
  maxHeight?: number;
}

export interface ProcessBatchUploadData extends JobData {
  userId: string;
  uploadBatchId: string;
  files: Array<{
    id: string;
    filePath: string;
    fileName: string;
    fileType: string;
  }>;
  processingOptions: Record<string, any>;
}

/**
 * Notification job data interfaces
 */
export interface SendPushNotificationData extends JobData {
  userId: string;
  title: string;
  message: string;
  actionUrl?: string;
  category: string;
  priority?: 'high' | 'medium' | 'low';
  scheduleFor?: Date;
}

export interface SendWebhookData extends JobData {
  webhookUrl: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential';
  };
}

export interface UpdateUserBadgesData extends JobData {
  userId: string;
  achievementData: {
    type: string;
    criteria: Record<string, any>;
    timestamp: Date;
  };
}

/**
 * Cleanup job data interfaces
 */
export interface CleanupTempFilesData extends JobData {
  directory?: string;
  olderThanHours: number;
  filePatterns?: string[];
  dryRun?: boolean;
}

export interface ArchiveOldDataData extends JobData {
  tableName: string;
  archiveCriteria: Record<string, any>;
  olderThanDays: number;
  batchSize?: number;
}

/**
 * Queue configuration interface
 */
export interface QueueConfig {
  name: string;
  concurrency: number;
  rateLimiter?: {
    max: number;
    duration: number;
    groupKey?: string;
  };
  defaultJobOptions?: JobsOptions;
  priority?: 'high' | 'medium' | 'low';
  processorTimeout?: number;
}

/**
 * Queue metrics interface
 */
export interface QueueMetrics {
  processed: number;
  failed: number;
  active: number;
  waiting: number;
  completed: number;
  delayed: number;
  avgProcessingTime: number;
  lastJobTime: Date | null;
  throughputPerMinute: number;
  errorRate: number;
  peakActiveJobs: number;
  totalRetries: number;
  lastMetricsCollection?: number;
  lastProcessedCount?: number;
}

/**
 * Worker function type
 */
export type WorkerFunction<T extends JobData> = (job: Job<T>) => Promise<any>;

/**
 * Job result interfaces
 */
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface EmailJobResult extends JobResult {
  messageId?: string;
  recipientCount?: number;
  deliveryStatus?: 'sent' | 'queued' | 'failed';
}

export interface AnalyticsJobResult extends JobResult {
  metricsComputed: string[];
  recordsProcessed: number;
  insights?: Record<string, any>;
}

export interface AIGenerationJobResult extends JobResult {
  generatedContent: {
    type: string;
    content: any;
    quality_score?: number;
    metadata: Record<string, any>;
  };
  tokensUsed?: number;
  model?: string;
}

export interface FileProcessingJobResult extends JobResult {
  processedFiles: Array<{
    originalPath: string;
    processedPath: string;
    format: string;
    size: number;
  }>;
  totalProcessingTime: number;
}

/**
 * Job priority constants
 */
export const JOB_PRIORITIES = {
  CRITICAL: 1000,
  HIGH: 100,
  MEDIUM: 50,
  LOW: 10,
  BACKGROUND: 1,
} as const;

/**
 * Job delay constants (in milliseconds)
 */
export const JOB_DELAYS = {
  IMMEDIATE: 0,
  SHORT: 5000,      // 5 seconds
  MEDIUM: 30000,    // 30 seconds
  LONG: 300000,     // 5 minutes
  HOURLY: 3600000,  // 1 hour
} as const;

/**
 * Common job options presets
 */
export const JOB_PRESETS = {
  EMAIL_CRITICAL: {
    priority: JOB_PRIORITIES.CRITICAL,
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },

  EMAIL_STANDARD: {
    priority: JOB_PRIORITIES.HIGH,
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },

  ANALYTICS_BATCH: {
    priority: JOB_PRIORITIES.MEDIUM,
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 25,
  },

  AI_GENERATION: {
    priority: JOB_PRIORITIES.LOW,
    attempts: 2,
    backoff: { type: 'exponential' as const, delay: 10000 },
    removeOnComplete: 20,
    removeOnFail: 10,
    delay: 2000, // Rate limiting delay
  },

  FILE_PROCESSING: {
    priority: JOB_PRIORITIES.MEDIUM,
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: 30,
    removeOnFail: 15,
  },

  CLEANUP_BACKGROUND: {
    priority: JOB_PRIORITIES.BACKGROUND,
    attempts: 1,
    removeOnComplete: 5,
    removeOnFail: 5,
  },
} as const;

/**
 * Job validation schemas
 */
export class JobValidator {
  /**
   * Validate email job data
   */
  static validateEmailJob(data: any): data is SendNotificationEmailData {
    return (
      data &&
      typeof data.userId === 'string' &&
      typeof data.userEmail === 'string' &&
      typeof data.subject === 'string' &&
      typeof data.template === 'string' &&
      data.templateData &&
      typeof data.templateData === 'object'
    );
  }

  /**
   * Validate analytics job data
   */
  static validateAnalyticsJob(data: any): data is ProcessUserActivityData {
    return (
      data &&
      typeof data.userId === 'string' &&
      typeof data.activityType === 'string' &&
      data.activityData &&
      typeof data.activityData === 'object'
    );
  }

  /**
   * Validate AI generation job data
   */
  static validateAIGenerationJob(data: any): data is GenerateCourseContentData {
    return (
      data &&
      typeof data.courseId === 'string' &&
      typeof data.contentType === 'string' &&
      data.generationParams &&
      typeof data.generationParams.topic === 'string'
    );
  }

  /**
   * Validate file processing job data
   */
  static validateFileProcessingJob(data: any): data is ProcessVideoUploadData {
    return (
      data &&
      typeof data.userId === 'string' &&
      typeof data.videoId === 'string' &&
      typeof data.filePath === 'string' &&
      typeof data.fileName === 'string'
    );
  }
}

/**
 * Job factory for creating standardized jobs
 */
export class JobFactory {
  /**
   * Create welcome email job
   */
  static createWelcomeEmailJob(
    userId: string,
    userEmail: string,
    userName: string,
    verificationToken?: string
  ): { type: JobType; data: SendWelcomeEmailData; options: JobsOptions } {
    return {
      type: 'send-welcome-email',
      data: {
        userId,
        userEmail,
        userName,
        verificationToken,
        timestamp: new Date(),
      },
      options: JOB_PRESETS.EMAIL_CRITICAL,
    };
  }

  /**
   * Create course analytics job
   */
  static createCourseAnalyticsJob(
    courseId: string,
    timeRange: { start: Date; end: Date },
    metricsToCalculate: string[]
  ): { type: JobType; data: CalculateCourseAnalyticsData; options: JobsOptions } {
    return {
      type: 'calculate-course-analytics',
      data: {
        courseId,
        timeRange,
        metricsToCalculate,
        timestamp: new Date(),
      },
      options: JOB_PRESETS.ANALYTICS_BATCH,
    };
  }

  /**
   * Create AI content generation job
   */
  static createAIContentJob(
    courseId: string,
    contentType: 'chapter' | 'section' | 'quiz' | 'exercise',
    generationParams: any
  ): { type: JobType; data: GenerateCourseContentData; options: JobsOptions } {
    return {
      type: 'generate-course-content',
      data: {
        courseId,
        contentType,
        generationParams,
        timestamp: new Date(),
      },
      options: JOB_PRESETS.AI_GENERATION,
    };
  }

  /**
   * Create video processing job
   */
  static createVideoProcessingJob(
    userId: string,
    videoId: string,
    filePath: string,
    fileName: string,
    processingOptions: any
  ): { type: JobType; data: ProcessVideoUploadData; options: JobsOptions } {
    return {
      type: 'process-video-upload',
      data: {
        userId,
        videoId,
        filePath,
        fileName,
        processingOptions,
        timestamp: new Date(),
      },
      options: JOB_PRESETS.FILE_PROCESSING,
    };
  }

  /**
   * Create recurring cleanup job
   */
  static createRecurringCleanupJob(
    directory: string,
    olderThanHours: number
  ): { type: JobType; data: CleanupTempFilesData; options: JobsOptions } {
    return {
      type: 'cleanup-temp-files',
      data: {
        directory,
        olderThanHours,
        timestamp: new Date(),
      },
      options: {
        ...JOB_PRESETS.CLEANUP_BACKGROUND,
        repeat: { pattern: '0 2 * * *' }, // Run daily at 2 AM
        jobId: 'cleanup-temp-files-daily',
      },
    };
  }
}

const JobDefinitions = {
  JOB_PRIORITIES,
  JOB_DELAYS,
  JOB_PRESETS,
  JobValidator,
  JobFactory,
};

export default JobDefinitions;
