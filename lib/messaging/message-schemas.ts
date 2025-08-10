/**
 * Message Schemas
 * Event schema definitions and validation for the messaging system
 */

import { z } from 'zod';

/**
 * Base event schema
 */
export const BaseEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.any()),
  timestamp: z.date(),
  source: z.string(),
  version: z.string(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Course Event Schemas
 */

export const CourseCreatedSchema = z.object({
  type: z.literal('course.created'),
  payload: z.object({
    courseId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().min(0).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    instructorId: z.string(),
    createdAt: z.date(),
  }),
});

export const CourseUpdatedSchema = z.object({
  type: z.literal('course.updated'),
  payload: z.object({
    courseId: z.string(),
    changes: z.record(z.object({
      from: z.any(),
      to: z.any(),
    })),
    version: z.number().int().positive(),
    updatedAt: z.date(),
    updatedBy: z.string(),
  }),
});

export const CoursePublishedSchema = z.object({
  type: z.literal('course.published'),
  payload: z.object({
    courseId: z.string(),
    instructorId: z.string(),
    publishedAt: z.date(),
    previousStatus: z.string(),
  }),
});

export const CourseDeletedSchema = z.object({
  type: z.literal('course.deleted'),
  payload: z.object({
    courseId: z.string(),
    instructorId: z.string(),
    deletedAt: z.date(),
    reason: z.string().optional(),
  }),
});

/**
 * Enrollment Event Schemas
 */

export const StudentEnrolledSchema = z.object({
  type: z.literal('course.student.enrolled'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    enrollmentId: z.string(),
    enrolledAt: z.date(),
    enrollmentType: z.enum(['free', 'paid', 'trial']),
    paymentId: z.string().optional(),
  }),
});

export const StudentUnenrolledSchema = z.object({
  type: z.literal('course.student.unenrolled'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    enrollmentId: z.string(),
    unenrolledAt: z.date(),
    reason: z.enum(['manual', 'refund', 'violation', 'expired']).optional(),
  }),
});

/**
 * Progress Event Schemas
 */

export const ProgressUpdatedSchema = z.object({
  type: z.literal('course.progress.updated'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    progressPercentage: z.number().min(0).max(100),
    timeSpent: z.number().min(0), // in seconds
    updatedAt: z.date(),
  }),
});

export const ChapterCompletedSchema = z.object({
  type: z.literal('course.chapter.completed'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    chapterId: z.string(),
    completedAt: z.date(),
    sectionsCompleted: z.number().int().min(0),
    totalSections: z.number().int().min(1),
  }),
});

export const CourseCompletedSchema = z.object({
  type: z.literal('course.completed'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    completedAt: z.date(),
    finalScore: z.number().min(0).max(100).optional(),
    totalTimeSpent: z.number().min(0), // in seconds
    certificateId: z.string().optional(),
  }),
});

/**
 * Assessment Event Schemas
 */

export const AssessmentStartedSchema = z.object({
  type: z.literal('course.assessment.started'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    assessmentId: z.string(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    startedAt: z.date(),
    timeLimit: z.number().int().positive().optional(), // in seconds
  }),
});

export const AssessmentCompletedSchema = z.object({
  type: z.literal('course.assessment.completed'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    assessmentId: z.string(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    score: z.number().min(0),
    maxScore: z.number().positive(),
    attempts: z.number().int().positive(),
    timeSpent: z.number().min(0), // in seconds
    completedAt: z.date(),
    passed: z.boolean(),
  }),
});

export const AssessmentFailedSchema = z.object({
  type: z.literal('course.assessment.failed'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    assessmentId: z.string(),
    score: z.number().min(0),
    maxScore: z.number().positive(),
    attempts: z.number().int().positive(),
    reason: z.enum(['below-passing-score', 'time-expired', 'technical-error']).optional(),
    failedAt: z.date(),
  }),
});

/**
 * Certificate Event Schemas
 */

export const CertificateGeneratedSchema = z.object({
  type: z.literal('course.certificate.generated'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    certificateId: z.string(),
    certificateType: z.enum(['completion', 'achievement', 'participation']),
    generatedAt: z.date(),
    validUntil: z.date().optional(),
  }),
});

export const CertificateDownloadedSchema = z.object({
  type: z.literal('course.certificate.downloaded'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    certificateId: z.string(),
    downloadedAt: z.date(),
    downloadFormat: z.enum(['pdf', 'png', 'jpg']).optional(),
  }),
});

/**
 * Review Event Schemas
 */

export const ReviewSubmittedSchema = z.object({
  type: z.literal('course.review.submitted'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    reviewId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
    submittedAt: z.date(),
  }),
});

export const ReviewUpdatedSchema = z.object({
  type: z.literal('course.review.updated'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    reviewId: z.string(),
    oldRating: z.number().int().min(1).max(5),
    newRating: z.number().int().min(1).max(5),
    updatedAt: z.date(),
  }),
});

/**
 * Discussion Event Schemas
 */

export const DiscussionStartedSchema = z.object({
  type: z.literal('course.discussion.started'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    discussionId: z.string(),
    topic: z.string().min(1).max(200),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    startedAt: z.date(),
  }),
});

export const CommentAddedSchema = z.object({
  type: z.literal('course.comment.added'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    commentId: z.string(),
    discussionId: z.string().optional(),
    parentCommentId: z.string().optional(),
    content: z.string().min(1).max(1000),
    addedAt: z.date(),
  }),
});

/**
 * Content Interaction Schemas
 */

export const VideoWatchedSchema = z.object({
  type: z.literal('course.video.watched'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    videoId: z.string(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    watchTime: z.number().min(0), // in seconds
    totalDuration: z.number().positive(), // in seconds
    watchedAt: z.date(),
    completed: z.boolean(),
  }),
});

export const ResourceDownloadedSchema = z.object({
  type: z.literal('course.resource.downloaded'),
  payload: z.object({
    courseId: z.string(),
    userId: z.string(),
    resourceId: z.string(),
    resourceType: z.enum(['pdf', 'document', 'image', 'video', 'audio', 'archive']),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    downloadedAt: z.date(),
    fileSize: z.number().positive().optional(), // in bytes
  }),
});

/**
 * System Event Schemas
 */

export const SystemMaintenanceScheduledSchema = z.object({
  type: z.literal('system.maintenance.scheduled'),
  payload: z.object({
    maintenanceId: z.string(),
    scheduledAt: z.date(),
    estimatedDuration: z.number().positive(), // in minutes
    affectedServices: z.array(z.string()),
    description: z.string().optional(),
  }),
});

export const SystemErrorOccurredSchema = z.object({
  type: z.literal('system.error.occurred'),
  payload: z.object({
    errorId: z.string(),
    service: z.string(),
    errorType: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    occurredAt: z.date(),
    affectedUsers: z.array(z.string()).optional(),
  }),
});

/**
 * User Event Schemas
 */

export const UserRegisteredSchema = z.object({
  type: z.literal('user.registered'),
  payload: z.object({
    userId: z.string(),
    email: z.string().email(),
    username: z.string().optional(),
    registeredAt: z.date(),
    registrationMethod: z.enum(['email', 'google', 'github', 'facebook']),
    emailVerified: z.boolean(),
  }),
});

export const UserProfileUpdatedSchema = z.object({
  type: z.literal('user.profile.updated'),
  payload: z.object({
    userId: z.string(),
    changes: z.record(z.object({
      from: z.any(),
      to: z.any(),
    })),
    updatedAt: z.date(),
  }),
});

/**
 * Payment Event Schemas
 */

export const PaymentCompletedSchema = z.object({
  type: z.literal('payment.completed'),
  payload: z.object({
    paymentId: z.string(),
    userId: z.string(),
    courseId: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    paymentMethod: z.string(),
    completedAt: z.date(),
  }),
});

export const PaymentFailedSchema = z.object({
  type: z.literal('payment.failed'),
  payload: z.object({
    paymentId: z.string(),
    userId: z.string(),
    courseId: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    reason: z.string(),
    failedAt: z.date(),
  }),
});

/**
 * Analytics Event Schemas
 */

export const PageViewedSchema = z.object({
  type: z.literal('analytics.page.viewed'),
  payload: z.object({
    userId: z.string().optional(),
    sessionId: z.string(),
    page: z.string(),
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
    viewedAt: z.date(),
    timeOnPage: z.number().min(0).optional(), // in seconds
  }),
});

export const FeatureUsedSchema = z.object({
  type: z.literal('analytics.feature.used'),
  payload: z.object({
    userId: z.string().optional(),
    sessionId: z.string(),
    feature: z.string(),
    context: z.record(z.any()).optional(),
    usedAt: z.date(),
  }),
});

/**
 * Schema Registry
 */
export const EventSchemaRegistry = new Map([
  // Course events
  ['course.created', CourseCreatedSchema],
  ['course.updated', CourseUpdatedSchema],
  ['course.published', CoursePublishedSchema],
  ['course.deleted', CourseDeletedSchema],
  
  // Enrollment events
  ['course.student.enrolled', StudentEnrolledSchema],
  ['course.student.unenrolled', StudentUnenrolledSchema],
  
  // Progress events
  ['course.progress.updated', ProgressUpdatedSchema],
  ['course.chapter.completed', ChapterCompletedSchema],
  ['course.completed', CourseCompletedSchema],
  
  // Assessment events
  ['course.assessment.started', AssessmentStartedSchema],
  ['course.assessment.completed', AssessmentCompletedSchema],
  ['course.assessment.failed', AssessmentFailedSchema],
  
  // Certificate events
  ['course.certificate.generated', CertificateGeneratedSchema],
  ['course.certificate.downloaded', CertificateDownloadedSchema],
  
  // Review events
  ['course.review.submitted', ReviewSubmittedSchema],
  ['course.review.updated', ReviewUpdatedSchema],
  
  // Discussion events
  ['course.discussion.started', DiscussionStartedSchema],
  ['course.comment.added', CommentAddedSchema],
  
  // Content interaction events
  ['course.video.watched', VideoWatchedSchema],
  ['course.resource.downloaded', ResourceDownloadedSchema],
  
  // System events
  ['system.maintenance.scheduled', SystemMaintenanceScheduledSchema],
  ['system.error.occurred', SystemErrorOccurredSchema],
  
  // User events
  ['user.registered', UserRegisteredSchema],
  ['user.profile.updated', UserProfileUpdatedSchema],
  
  // Payment events
  ['payment.completed', PaymentCompletedSchema],
  ['payment.failed', PaymentFailedSchema],
  
  // Analytics events
  ['analytics.page.viewed', PageViewedSchema],
  ['analytics.feature.used', FeatureUsedSchema],
]);

/**
 * Event Validator
 */
export class EventValidator {
  /**
   * Validate event against its schema
   */
  static validate(eventType: string, event: any): { valid: boolean; errors?: string[] } {
    const schema = EventSchemaRegistry.get(eventType);
    
    if (!schema) {
      return {
        valid: false,
        errors: [`No schema found for event type: ${eventType}`],
      };
    }

    try {
      schema.parse(event);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      
      return {
        valid: false,
        errors: [`Validation error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Validate event payload only
   */
  static validatePayload(eventType: string, payload: any): { valid: boolean; errors?: string[] } {
    const schema = EventSchemaRegistry.get(eventType);
    
    if (!schema) {
      return {
        valid: false,
        errors: [`No schema found for event type: ${eventType}`],
      };
    }

    try {
      // Extract payload schema from the full event schema
      const payloadSchema = schema.shape.payload;
      payloadSchema.parse(payload);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      
      return {
        valid: false,
        errors: [`Payload validation error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Get schema for event type
   */
  static getSchema(eventType: string): z.ZodSchema | null {
    return EventSchemaRegistry.get(eventType) || null;
  }

  /**
   * Get all supported event types
   */
  static getSupportedEventTypes(): string[] {
    return Array.from(EventSchemaRegistry.keys());
  }

  /**
   * Check if event type is supported
   */
  static isEventTypeSupported(eventType: string): boolean {
    return EventSchemaRegistry.has(eventType);
  }
}

/**
 * Event Builder Helper
 */
export class EventBuilder {
  private eventType: string;
  private payload: any = {};
  private metadata: Record<string, any> = {};

  constructor(eventType: string) {
    this.eventType = eventType;
  }

  /**
   * Set payload data
   */
  withPayload(payload: any): this {
    this.payload = payload;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(key: string, value: any): this {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Add multiple metadata fields
   */
  withMetadataObject(metadata: Record<string, any>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * Build and validate the event
   */
  build(): { valid: boolean; event?: any; errors?: string[] } {
    const event = {
      type: this.eventType,
      payload: this.payload,
      metadata: this.metadata,
    };

    const validation = EventValidator.validate(this.eventType, event);
    
    if (validation.valid) {
      return { valid: true, event };
    } else {
      return { valid: false, errors: validation.errors };
    }
  }

  /**
   * Create event builder for specific type
   */
  static create(eventType: string): EventBuilder {
    return new EventBuilder(eventType);
  }
}

// Export all schemas for direct use
export {
  CourseCreatedSchema,
  CourseUpdatedSchema,
  CoursePublishedSchema,
  StudentEnrolledSchema,
  ProgressUpdatedSchema,
  CourseCompletedSchema,
  AssessmentCompletedSchema,
  CertificateGeneratedSchema,
  ReviewSubmittedSchema,
};

export default EventValidator;