/**
 * Course Events Publisher
 * Publishes course-related events to the event bus
 */

import { EventBus, EventMessage } from '../event-bus';

export interface CourseEventPayload {
  courseId: string;
  userId?: string;
  instructorId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface CourseCreatedPayload extends CourseEventPayload {
  title: string;
  description?: string;
  category?: string;
  price?: number;
  level: string;
}

export interface CourseUpdatedPayload extends CourseEventPayload {
  changes: Record<string, { from: any; to: any }>;
  version: number;
}

export interface CoursePublishedPayload extends CourseEventPayload {
  publishedAt: Date;
  previousStatus: string;
}

export interface CourseEnrollmentPayload extends CourseEventPayload {
  enrollmentId: string;
  enrolledAt: Date;
  paymentId?: string;
  enrollmentType: 'free' | 'paid' | 'trial';
}

export interface CourseProgressPayload extends CourseEventPayload {
  chapterId?: string;
  sectionId?: string;
  progressPercentage: number;
  timeSpent: number;
  completedAt?: Date;
}

export interface CourseCompletedPayload extends CourseEventPayload {
  completedAt: Date;
  finalScore?: number;
  certificateId?: string;
  totalTimeSpent: number;
}

export interface ChapterProgressPayload extends CourseEventPayload {
  chapterId: string;
  progressPercentage: number;
  sectionsCompleted: number;
  totalSections: number;
}

export interface AssessmentCompletedPayload extends CourseEventPayload {
  assessmentId: string;
  chapterId?: string;
  sectionId?: string;
  score: number;
  maxScore: number;
  attempts: number;
  timeSpent: number;
  completedAt: Date;
}

/**
 * Course Events Publisher
 */
export class CourseEventsPublisher {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Course lifecycle events
   */

  async courseCreated(payload: CourseCreatedPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.created', payload, {
      source: 'course-service',
      userId: payload.instructorId,
      metadata: {
        courseTitle: payload.title,
        courseLevel: payload.level,
        courseCategory: payload.category,
      },
      persistent: true,
      distributed: true,
    });
  }

  async courseUpdated(payload: CourseUpdatedPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.updated', payload, {
      source: 'course-service',
      userId: payload.instructorId,
      metadata: {
        version: payload.version,
        changedFields: Object.keys(payload.changes),
      },
      persistent: true,
      distributed: true,
    });
  }

  async coursePublished(payload: CoursePublishedPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.published', payload, {
      source: 'course-service',
      userId: payload.instructorId,
      metadata: {
        previousStatus: payload.previousStatus,
        publishedAt: payload.publishedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  async courseUnpublished(payload: CourseEventPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.unpublished', payload, {
      source: 'course-service',
      userId: payload.instructorId,
      persistent: true,
      distributed: true,
    });
  }

  async courseDeleted(payload: CourseEventPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.deleted', payload, {
      source: 'course-service',
      userId: payload.instructorId,
      persistent: true,
      distributed: true,
    });
  }

  /**
   * Enrollment events
   */

  async studentEnrolled(payload: CourseEnrollmentPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.student.enrolled', payload, {
      source: 'enrollment-service',
      userId: payload.userId,
      metadata: {
        enrollmentType: payload.enrollmentType,
        enrolledAt: payload.enrolledAt.toISOString(),
        hasPayment: !!payload.paymentId,
      },
      persistent: true,
      distributed: true,
    });
  }

  async studentUnenrolled(payload: CourseEventPayload & { unenrolledAt: Date; reason?: string }): Promise<EventMessage> {
    return this.eventBus.publish('course.student.unenrolled', payload, {
      source: 'enrollment-service',
      userId: payload.userId,
      metadata: {
        unenrolledAt: payload.unenrolledAt.toISOString(),
        reason: payload.reason || 'manual',
      },
      persistent: true,
      distributed: true,
    });
  }

  /**
   * Progress events
   */

  async progressUpdated(payload: CourseProgressPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.progress.updated', payload, {
      source: 'learning-service',
      userId: payload.userId,
      metadata: {
        progressPercentage: payload.progressPercentage,
        chapterId: payload.chapterId,
        sectionId: payload.sectionId,
        timeSpent: payload.timeSpent,
      },
      persistent: false, // High frequency event
      distributed: true,
    });
  }

  async chapterCompleted(payload: ChapterProgressPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.chapter.completed', payload, {
      source: 'learning-service',
      userId: payload.userId,
      metadata: {
        chapterId: payload.chapterId,
        sectionsCompleted: payload.sectionsCompleted,
        totalSections: payload.totalSections,
      },
      persistent: true,
      distributed: true,
    });
  }

  async courseCompleted(payload: CourseCompletedPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.completed', payload, {
      source: 'learning-service',
      userId: payload.userId,
      metadata: {
        completedAt: payload.completedAt.toISOString(),
        finalScore: payload.finalScore,
        certificateGenerated: !!payload.certificateId,
        totalTimeSpent: payload.totalTimeSpent,
      },
      persistent: true,
      distributed: true,
    });
  }

  /**
   * Assessment events
   */

  async assessmentStarted(payload: CourseEventPayload & { assessmentId: string; startedAt: Date }): Promise<EventMessage> {
    return this.eventBus.publish('course.assessment.started', payload, {
      source: 'assessment-service',
      userId: payload.userId,
      metadata: {
        assessmentId: payload.assessmentId,
        startedAt: payload.startedAt.toISOString(),
      },
      persistent: false,
      distributed: true,
    });
  }

  async assessmentCompleted(payload: AssessmentCompletedPayload): Promise<EventMessage> {
    return this.eventBus.publish('course.assessment.completed', payload, {
      source: 'assessment-service',
      userId: payload.userId,
      metadata: {
        assessmentId: payload.assessmentId,
        scorePercentage: (payload.score / payload.maxScore) * 100,
        attempts: payload.attempts,
        timeSpent: payload.timeSpent,
        completedAt: payload.completedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  async assessmentFailed(payload: AssessmentCompletedPayload & { reason?: string }): Promise<EventMessage> {
    return this.eventBus.publish('course.assessment.failed', payload, {
      source: 'assessment-service',
      userId: payload.userId,
      metadata: {
        assessmentId: payload.assessmentId,
        score: payload.score,
        maxScore: payload.maxScore,
        attempts: payload.attempts,
        reason: payload.reason || 'below-passing-score',
      },
      persistent: true,
      distributed: true,
    });
  }

  /**
   * Certificate events
   */

  async certificateGenerated(payload: CourseEventPayload & {
    certificateId: string;
    generatedAt: Date;
    certificateType: string;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.certificate.generated', payload, {
      source: 'certificate-service',
      userId: payload.userId,
      metadata: {
        certificateId: payload.certificateId,
        certificateType: payload.certificateType,
        generatedAt: payload.generatedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  async certificateDownloaded(payload: CourseEventPayload & {
    certificateId: string;
    downloadedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.certificate.downloaded', payload, {
      source: 'certificate-service',
      userId: payload.userId,
      metadata: {
        certificateId: payload.certificateId,
        downloadedAt: payload.downloadedAt.toISOString(),
      },
      persistent: false,
      distributed: false, // Local tracking only
    });
  }

  /**
   * Review and rating events
   */

  async reviewSubmitted(payload: CourseEventPayload & {
    reviewId: string;
    rating: number;
    comment?: string;
    submittedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.review.submitted', payload, {
      source: 'review-service',
      userId: payload.userId,
      metadata: {
        reviewId: payload.reviewId,
        rating: payload.rating,
        hasComment: !!payload.comment,
        submittedAt: payload.submittedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  async reviewUpdated(payload: CourseEventPayload & {
    reviewId: string;
    oldRating: number;
    newRating: number;
    updatedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.review.updated', payload, {
      source: 'review-service',
      userId: payload.userId,
      metadata: {
        reviewId: payload.reviewId,
        oldRating: payload.oldRating,
        newRating: payload.newRating,
        ratingChange: payload.newRating - payload.oldRating,
        updatedAt: payload.updatedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  /**
   * Discussion and collaboration events
   */

  async discussionStarted(payload: CourseEventPayload & {
    discussionId: string;
    topic: string;
    chapterId?: string;
    sectionId?: string;
    startedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.discussion.started', payload, {
      source: 'discussion-service',
      userId: payload.userId,
      metadata: {
        discussionId: payload.discussionId,
        topic: payload.topic,
        chapterId: payload.chapterId,
        sectionId: payload.sectionId,
        startedAt: payload.startedAt.toISOString(),
      },
      persistent: true,
      distributed: true,
    });
  }

  async commentAdded(payload: CourseEventPayload & {
    commentId: string;
    discussionId?: string;
    parentCommentId?: string;
    addedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.comment.added', payload, {
      source: 'discussion-service',
      userId: payload.userId,
      metadata: {
        commentId: payload.commentId,
        discussionId: payload.discussionId,
        isReply: !!payload.parentCommentId,
        addedAt: payload.addedAt.toISOString(),
      },
      persistent: false,
      distributed: true,
    });
  }

  /**
   * Content interaction events
   */

  async videoWatched(payload: CourseEventPayload & {
    videoId: string;
    chapterId?: string;
    sectionId?: string;
    watchTime: number;
    totalDuration: number;
    completedAt?: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.video.watched', payload, {
      source: 'content-service',
      userId: payload.userId,
      metadata: {
        videoId: payload.videoId,
        watchTime: payload.watchTime,
        totalDuration: payload.totalDuration,
        completionPercentage: (payload.watchTime / payload.totalDuration) * 100,
        fullyWatched: !!payload.completedAt,
      },
      persistent: false, // High frequency event
      distributed: false, // Local analytics only
    });
  }

  async resourceDownloaded(payload: CourseEventPayload & {
    resourceId: string;
    resourceType: string;
    chapterId?: string;
    sectionId?: string;
    downloadedAt: Date;
  }): Promise<EventMessage> {
    return this.eventBus.publish('course.resource.downloaded', payload, {
      source: 'content-service',
      userId: payload.userId,
      metadata: {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        chapterId: payload.chapterId,
        sectionId: payload.sectionId,
        downloadedAt: payload.downloadedAt.toISOString(),
      },
      persistent: false,
      distributed: false,
    });
  }

  /**
   * Batch events for analytics
   */

  async publishBatchEvents(events: Array<{
    type: string;
    payload: any;
    userId?: string;
    metadata?: Record<string, any>;
  }>): Promise<EventMessage[]> {
    const publishPromises = events.map(event =>
      this.eventBus.publish(event.type, event.payload, {
        source: 'batch-publisher',
        userId: event.userId,
        metadata: event.metadata,
        persistent: false,
        distributed: true,
      })
    );

    const publishedEvents = await Promise.all(publishPromises);
    
    // Publish batch completion event
    await this.eventBus.publish('course.batch.processed', {
      eventCount: events.length,
      eventTypes: [...new Set(events.map(e => e.type))],
      processedAt: new Date(),
    }, {
      source: 'batch-publisher',
      persistent: false,
      distributed: false,
    });

    return publishedEvents;
  }

  /**
   * Utility methods
   */

  async publishWithCorrelation(
    eventType: string,
    payload: any,
    correlationId: string,
    causationId?: string
  ): Promise<EventMessage> {
    return this.eventBus.publish(eventType, payload, {
      source: 'course-service',
      correlationId,
      causationId,
      persistent: true,
      distributed: true,
    });
  }

  async publishAggregatedProgress(
    userId: string,
    courseProgressData: Array<CourseProgressPayload>
  ): Promise<EventMessage> {
    const totalProgress = courseProgressData.reduce((sum, progress) => sum + progress.progressPercentage, 0);
    const averageProgress = totalProgress / courseProgressData.length;

    return this.eventBus.publish('user.progress.aggregated', {
      userId,
      totalCourses: courseProgressData.length,
      averageProgress,
      totalTimeSpent: courseProgressData.reduce((sum, progress) => sum + progress.timeSpent, 0),
      coursesInProgress: courseProgressData.filter(p => p.progressPercentage > 0 && p.progressPercentage < 100).length,
      coursesCompleted: courseProgressData.filter(p => p.progressPercentage === 100).length,
      aggregatedAt: new Date(),
    }, {
      source: 'analytics-service',
      userId,
      persistent: true,
      distributed: true,
    });
  }
}

export default CourseEventsPublisher;