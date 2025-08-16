/**
 * Notification Subscriber
 * Handles notification events from the event bus
 */

import { EventBus, EventMessage } from '../event-bus';
import { logger } from '@/lib/logger';

export interface NotificationPayload {
  userId: string;
  type: 'email' | 'push' | 'in-app' | 'sms';
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduled?: Date;
  metadata?: Record<string, any>;
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  template: string;
  templateData: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface InAppNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  priority: string;
  expiresAt?: Date;
}

/**
 * Notification Service Interface
 */
interface NotificationService {
  sendEmail(data: EmailNotificationData): Promise<{ success: boolean; messageId?: string }>;
  sendPushNotification(data: PushNotificationData): Promise<{ success: boolean; notificationId?: string }>;
  createInAppNotification(data: InAppNotificationData): Promise<{ success: boolean; notificationId?: string }>;
  sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

/**
 * Mock Notification Service
 */
class MockNotificationService implements NotificationService {
  async sendEmail(data: EmailNotificationData): Promise<{ success: boolean; messageId?: string }> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate occasional failures (2% failure rate)
    if (Math.random() < 0.02) {
      throw new Error('Email service temporarily unavailable');
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return { success: true, messageId };
  }

  async sendPushNotification(data: PushNotificationData): Promise<{ success: boolean; notificationId?: string }> {
    // Simulate push notification delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    const notificationId = `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return { success: true, notificationId };
  }

  async createInAppNotification(data: InAppNotificationData): Promise<{ success: boolean; notificationId?: string }> {
    // Simulate database write
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    
    const notificationId = `in_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return { success: true, notificationId };
  }

  async sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));
    
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[NOTIFICATION_SERVICE] SMS sent to ${phone}: ${message.substring(0, 50)}...`);
    
    return { success: true, messageId };
  }
}

/**
 * Notification Event Subscriber
 */
export class NotificationSubscriber {
  private eventBus: EventBus;
  private notificationService: NotificationService;
  private subscriptionIds: string[] = [];

  constructor(eventBus: EventBus, notificationService?: NotificationService) {
    this.eventBus = eventBus;
    this.notificationService = notificationService || new MockNotificationService();
    
    this.setupSubscriptions();
  }

  /**
   * Setup event subscriptions
   */
  private setupSubscriptions(): void {
    // Course-related notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('course.student.enrolled', this.handleStudentEnrolled.bind(this), {
        subscriberId: 'notification-service-enrollment',
        retries: 3,
        errorHandling: 'retry',
      })
    );

    this.subscriptionIds.push(
      this.eventBus.subscribe('course.published', this.handleCoursePublished.bind(this), {
        subscriberId: 'notification-service-published',
        retries: 2,
        errorHandling: 'retry',
      })
    );

    this.subscriptionIds.push(
      this.eventBus.subscribe('course.completed', this.handleCourseCompleted.bind(this), {
        subscriberId: 'notification-service-completed',
        retries: 3,
        errorHandling: 'retry',
      })
    );

    this.subscriptionIds.push(
      this.eventBus.subscribe('course.certificate.generated', this.handleCertificateGenerated.bind(this), {
        subscriberId: 'notification-service-certificate',
        retries: 3,
        errorHandling: 'retry',
      })
    );

    // Assessment notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('course.assessment.completed', this.handleAssessmentCompleted.bind(this), {
        subscriberId: 'notification-service-assessment',
        retries: 2,
        errorHandling: 'retry',
      })
    );

    this.subscriptionIds.push(
      this.eventBus.subscribe('course.assessment.failed', this.handleAssessmentFailed.bind(this), {
        subscriberId: 'notification-service-assessment-failed',
        retries: 2,
        errorHandling: 'retry',
      })
    );

    // Progress and milestone notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('course.chapter.completed', this.handleChapterCompleted.bind(this), {
        subscriberId: 'notification-service-chapter',
        retries: 1,
        errorHandling: 'ignore', // Non-critical
      })
    );

    // Discussion notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('course.comment.added', this.handleCommentAdded.bind(this), {
        subscriberId: 'notification-service-comments',
        retries: 1,
        errorHandling: 'ignore',
      })
    );

    // Review notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('course.review.submitted', this.handleReviewSubmitted.bind(this), {
        subscriberId: 'notification-service-reviews',
        retries: 2,
        errorHandling: 'retry',
      })
    );

    // System notifications
    this.subscriptionIds.push(
      this.eventBus.subscribe('system.maintenance.scheduled', this.handleMaintenanceScheduled.bind(this), {
        subscriberId: 'notification-service-maintenance',
        retries: 3,
        errorHandling: 'retry',
      })
    );

  }

  /**
   * Event Handlers
   */

  private async handleStudentEnrolled(event: EventMessage): Promise<void> {
    const { courseId, userId, enrollmentType } = event.payload;

    // Send welcome email
    await this.sendWelcomeEmail(userId, courseId, enrollmentType);

    // Create in-app notification
    await this.createInAppNotification({
      userId,
      type: 'enrollment',
      title: 'Welcome to your new course!',
      message: 'You have successfully enrolled in a new course. Start learning now!',
      actionUrl: `/courses/${courseId}`,
      read: false,
      priority: 'medium',
    });

    // Send push notification if enabled
    await this.sendPushNotification({
      userId,
      title: '🎉 Enrollment Successful!',
      body: 'Welcome to your new course. Start your learning journey now!',
      actionUrl: `/courses/${courseId}`,
      data: {
        courseId,
        eventType: 'enrollment',
      },
    });
  }

  private async handleCoursePublished(event: EventMessage): Promise<void> {
    const { courseId, instructorId } = event.payload;
    const courseTitle = event.metadata?.courseTitle || 'Your Course';

    // Notify instructor
    await this.createInAppNotification({
      userId: instructorId,
      type: 'course_published',
      title: 'Course Published Successfully!',
      message: `Your course "${courseTitle}" is now live and available to students.`,
      actionUrl: `/teacher/courses/${courseId}`,
      read: false,
      priority: 'high',
    });

    // Send email confirmation
    await this.sendCoursePublishedEmail(instructorId, courseId, courseTitle);
  }

  private async handleCourseCompleted(event: EventMessage): Promise<void> {
    const { courseId, userId, finalScore, totalTimeSpent } = event.payload;

    // Send congratulations email
    await this.sendCourseCompletionEmail(userId, courseId, finalScore, totalTimeSpent);

    // Create in-app notification
    await this.createInAppNotification({
      userId,
      type: 'course_completed',
      title: '🏆 Course Completed!',
      message: 'Congratulations on completing your course! Your certificate is being generated.',
      actionUrl: `/courses/${courseId}/certificate`,
      read: false,
      priority: 'high',
    });

    // Send push notification
    await this.sendPushNotification({
      userId,
      title: '🎊 Congratulations!',
      body: 'You have successfully completed your course!',
      actionUrl: `/courses/${courseId}/certificate`,
      data: {
        courseId,
        eventType: 'completion',
        finalScore,
      },
    });
  }

  private async handleCertificateGenerated(event: EventMessage): Promise<void> {
    const { courseId, userId, certificateId } = event.payload;

    // Send certificate ready email
    await this.sendCertificateReadyEmail(userId, courseId, certificateId);

    // Update in-app notification
    await this.createInAppNotification({
      userId,
      type: 'certificate_ready',
      title: '📜 Certificate Ready!',
      message: 'Your course completion certificate is ready for download.',
      actionUrl: `/certificates/${certificateId}`,
      read: false,
      priority: 'high',
    });

    // Send push notification
    await this.sendPushNotification({
      userId,
      title: '📜 Certificate Ready!',
      body: 'Your course completion certificate is ready for download.',
      actionUrl: `/certificates/${certificateId}`,
      data: {
        certificateId,
        courseId,
        eventType: 'certificate',
      },
    });
  }

  private async handleAssessmentCompleted(event: EventMessage): Promise<void> {
    const { courseId, userId, assessmentId, score, maxScore } = event.payload;
    const scorePercentage = event.metadata?.scorePercentage || 0;

    if (scorePercentage >= 70) { // Passing score
      await this.createInAppNotification({
        userId,
        type: 'assessment_passed',
        title: '✅ Assessment Passed!',
        message: `Great job! You scored ${scorePercentage.toFixed(1)}% on your assessment.`,
        actionUrl: `/courses/${courseId}/assessments/${assessmentId}/results`,
        read: false,
        priority: 'medium',
      });
    }

    // Send detailed results email
    await this.sendAssessmentResultsEmail(userId, courseId, assessmentId, score, maxScore, scorePercentage);
  }

  private async handleAssessmentFailed(event: EventMessage): Promise<void> {
    const { courseId, userId, assessmentId, score, maxScore, attempts } = event.payload;
    const scorePercentage = (score / maxScore) * 100;

    await this.createInAppNotification({
      userId,
      type: 'assessment_failed',
      title: '📚 Keep Learning!',
      message: `You scored ${scorePercentage.toFixed(1)}%. Review the material and try again!`,
      actionUrl: `/courses/${courseId}`,
      read: false,
      priority: 'medium',
    });

    // Send encouragement email with study tips
    await this.sendAssessmentEncouragementEmail(userId, courseId, assessmentId, scorePercentage, attempts);
  }

  private async handleChapterCompleted(event: EventMessage): Promise<void> {
    const { courseId, userId, chapterId, sectionsCompleted, totalSections } = event.payload;

    // Only notify for significant milestones
    if (sectionsCompleted === totalSections) {
      await this.createInAppNotification({
        userId,
        type: 'chapter_completed',
        title: '🎯 Chapter Completed!',
        message: 'You have completed another chapter. Keep up the great work!',
        actionUrl: `/courses/${courseId}`,
        read: false,
        priority: 'low',
      });
    }
  }

  private async handleCommentAdded(event: EventMessage): Promise<void> {
    const { courseId, commentId, discussionId } = event.payload;
    const isReply = event.metadata?.isReply || false;

    // This would typically notify relevant users (discussion participants)
    // For now, we'll just log it

    // In a real implementation, you'd:
    // 1. Find discussion participants
    // 2. Send notifications to interested users
    // 3. Respect notification preferences
  }

  private async handleReviewSubmitted(event: EventMessage): Promise<void> {
    const { courseId, userId, reviewId, rating } = event.payload;

    // This would typically notify the course instructor

    // In a real implementation:
    // 1. Find course instructor
    // 2. Send notification about new review
    // 3. Update course rating analytics
  }

  private async handleMaintenanceScheduled(event: EventMessage): Promise<void> {
    const { scheduledAt, duration, affectedServices } = event.payload;

    // Notify all users about scheduled maintenance
    // This would typically be sent to all active users

    // In a real implementation:
    // 1. Get all active users
    // 2. Send maintenance notification
    // 3. Respect notification preferences
  }

  /**
   * Notification Sending Methods
   */

  private async sendWelcomeEmail(userId: string, courseId: string, enrollmentType: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: `user_${userId}@example.com`, // In production, fetch from database
        subject: 'Welcome to your new course!',
        template: 'course-enrollment-welcome',
        templateData: {
          userId,
          courseId,
          enrollmentType,
          actionUrl: `/courses/${courseId}`,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send welcome email:', error);
    }
  }

  private async sendCoursePublishedEmail(instructorId: string, courseId: string, courseTitle: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: `instructor_${instructorId}@example.com`,
        subject: `Your course "${courseTitle}" is now live!`,
        template: 'course-published',
        templateData: {
          courseTitle,
          courseId,
          dashboardUrl: `/teacher/courses/${courseId}`,
          publishedAt: new Date().toISOString(),
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send course published email:', error);
    }
  }

  private async sendCourseCompletionEmail(
    userId: string, 
    courseId: string, 
    finalScore: number, 
    totalTimeSpent: number
  ): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: `user_${userId}@example.com`,
        subject: '🏆 Congratulations on completing your course!',
        template: 'course-completion',
        templateData: {
          userId,
          courseId,
          finalScore,
          totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
          certificateUrl: `/courses/${courseId}/certificate`,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send completion email:', error);
    }
  }

  private async sendCertificateReadyEmail(userId: string, courseId: string, certificateId: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: `user_${userId}@example.com`,
        subject: '📜 Your certificate is ready for download!',
        template: 'certificate-ready',
        templateData: {
          userId,
          courseId,
          certificateId,
          downloadUrl: `/certificates/${certificateId}/download`,
          viewUrl: `/certificates/${certificateId}`,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send certificate email:', error);
    }
  }

  private async sendAssessmentResultsEmail(
    userId: string,
    courseId: string,
    assessmentId: string,
    score: number,
    maxScore: number,
    scorePercentage: number
  ): Promise<void> {
    try {
      const isPassed = scorePercentage >= 70;
      const subject = isPassed 
        ? `✅ Assessment Passed - ${scorePercentage.toFixed(1)}%`
        : `📚 Assessment Results - ${scorePercentage.toFixed(1)}%`;

      await this.notificationService.sendEmail({
        to: `user_${userId}@example.com`,
        subject,
        template: isPassed ? 'assessment-passed' : 'assessment-results',
        templateData: {
          userId,
          courseId,
          assessmentId,
          score,
          maxScore,
          scorePercentage,
          isPassed,
          resultsUrl: `/courses/${courseId}/assessments/${assessmentId}/results`,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send assessment results email:', error);
    }
  }

  private async sendAssessmentEncouragementEmail(
    userId: string,
    courseId: string,
    assessmentId: string,
    scorePercentage: number,
    attempts: number
  ): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: `user_${userId}@example.com`,
        subject: '💪 Don&apos;t give up - You can do this!',
        template: 'assessment-encouragement',
        templateData: {
          userId,
          courseId,
          assessmentId,
          scorePercentage,
          attempts,
          studyUrl: `/courses/${courseId}`,
          retakeUrl: `/courses/${courseId}/assessments/${assessmentId}`,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send encouragement email:', error);
    }
  }

  private async sendPushNotification(data: PushNotificationData): Promise<void> {
    try {
      await this.notificationService.sendPushNotification(data);
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to send push notification:', error);
    }
  }

  private async createInAppNotification(data: InAppNotificationData): Promise<void> {
    try {
      await this.notificationService.createInAppNotification(data);
    } catch (error) {
      logger.error('[NOTIFICATION_SUBSCRIBER] Failed to create in-app notification:', error);
    }
  }

  /**
   * Batch notification processing
   */
  async processBatchNotifications(events: EventMessage[]): Promise<void> {
    const notifications = events.map(event => this.createNotificationFromEvent(event)).filter(Boolean);
    
    // Group by user for batching
    const notificationsByUser = new Map<string, NotificationPayload[]>();
    
    notifications.forEach(notification => {
      if (notification) {
        const userNotifications = notificationsByUser.get(notification.userId) || [];
        userNotifications.push(notification);
        notificationsByUser.set(notification.userId, userNotifications);
      }
    });

    // Send batch notifications
    for (const [userId, userNotifications] of notificationsByUser) {
      await this.sendBatchNotificationsToUser(userId, userNotifications);
    }
  }

  private createNotificationFromEvent(event: EventMessage): NotificationPayload | null {
    // Convert event to notification payload based on event type
    switch (event.type) {
      case 'course.completed':
        return {
          userId: event.payload.userId,
          type: 'push',
          title: '🏆 Course Completed!',
          message: 'Congratulations on completing your course!',
          actionUrl: `/courses/${event.payload.courseId}/certificate`,
          priority: 'high',
        };
      
      case 'course.chapter.completed':
        return {
          userId: event.payload.userId,
          type: 'in-app',
          title: '🎯 Chapter Completed!',
          message: 'You completed another chapter. Keep going!',
          actionUrl: `/courses/${event.payload.courseId}`,
          priority: 'low',
        };
      
      default:
        return null;
    }
  }

  private async sendBatchNotificationsToUser(userId: string, notifications: NotificationPayload[]): Promise<void> {
    // In a real implementation, you might:
    // 1. Check user notification preferences
    // 2. Combine similar notifications
    // 3. Respect frequency limits
    // 4. Send digest emails

    for (const notification of notifications) {
      switch (notification.type) {
        case 'email':
          // Send email notification
          break;
        case 'push':
          await this.sendPushNotification({
            userId: notification.userId,
            title: notification.title,
            body: notification.message,
            actionUrl: notification.actionUrl,
          });
          break;
        case 'in-app':
          await this.createInAppNotification({
            userId: notification.userId,
            type: 'batch',
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            read: false,
            priority: notification.priority,
          });
          break;
      }
    }
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionIds: string[];
  } {
    return {
      totalSubscriptions: this.subscriptionIds.length,
      activeSubscriptions: this.subscriptionIds.length, // All are active in this implementation
      subscriptionIds: [...this.subscriptionIds],
    };
  }

  /**
   * Shutdown subscriber
   */
  shutdown(): void {

    // Unsubscribe from all events
    this.subscriptionIds.forEach(id => {
      this.eventBus.unsubscribe(id);
    });
    
    this.subscriptionIds = [];

  }
}

export default NotificationSubscriber;