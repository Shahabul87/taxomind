import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export type NotificationType = 
  | 'COURSE_ENROLLMENT' 
  | 'COURSE_COMPLETION' 
  | 'ASSIGNMENT_DUE' 
  | 'GRADE_RECEIVED' 
  | 'MESSAGE_RECEIVED' 
  | 'SYSTEM_ANNOUNCEMENT' 
  | 'ACHIEVEMENT_UNLOCKED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'COURSE_PUBLISHED'
  | 'REVIEW_RECEIVED'
  | 'CHAPTER_COMPLETED'
  | 'EXAM_COMPLETED'
  | 'REMINDER'
  | 'WARNING'
  | 'ERROR';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  metadata?: Record<string, any>;
}

export interface BulkNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userIds: string[];
  metadata?: Record<string, any>;
}

/**
 * Service class for managing notifications
 */
export class NotificationService {
  /**
   * Create a single notification for a user
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await db.notification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.title,
          message: data.message,
          type: data.type,
          userId: data.userId,
          read: false,
        },
      });

      return { success: true, notification };
    } catch (error) {
      logger.error('Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(data: BulkNotificationData) {
    try {
      const notifications = data.userIds.map(userId => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${userId}`,
        title: data.title,
        message: data.message,
        type: data.type,
        userId,
        read: false,
      }));

      const result = await db.notification.createMany({
        data: notifications,
      });

      return { success: true, count: result.count };
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      return { success: false, error: 'Failed to create bulk notifications' };
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
        },
      });

      return { success: true, notification };
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await db.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return { success: true, count: result.count };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      await db.notification.delete({
        where: {
          id: notificationId,
          userId, // Ensure user can only delete their own notifications
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: string) {
    try {
      const result = await db.notification.deleteMany({
        where: {
          userId,
        },
      });

      return { success: true, count: result.count };
    } catch (error) {
      logger.error('Error deleting all notifications:', error);
      return { success: false, error: 'Failed to delete all notifications' };
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getUserNotifications(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {
}
  ) {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (unreadOnly) where.read = false;
      if (type) where.type = type;

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.notification.count({ where }),
      ]);

      const unreadCount = await db.notification.count({
        where: { userId, read: false },
      });

      return {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await db.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return { success: true, count };
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }
}

/**
 * Predefined notification templates for common scenarios
 */
export class NotificationTemplates {
  static courseEnrollment(userId: string, courseName: string): NotificationData {
    return {
      title: 'Course Enrollment Successful',
      message: `You have successfully enrolled in "${courseName}". Start learning now!`,
      type: 'COURSE_ENROLLMENT',
      userId,
      metadata: { courseName },
    };
  }

  static courseCompletion(userId: string, courseName: string): NotificationData {
    return {
      title: 'Course Completed!',
      message: `Congratulations! You have completed "${courseName}". Check out your certificate.`,
      type: 'COURSE_COMPLETION',
      userId,
      metadata: { courseName },
    };
  }

  static assignmentDue(userId: string, assignmentName: string, dueDate: Date): NotificationData {
    return {
      title: 'Assignment Due Soon',
      message: `"${assignmentName}" is due on ${dueDate.toLocaleDateString()}. Don't forget to submit!`,
      type: 'ASSIGNMENT_DUE',
      userId,
      metadata: { assignmentName, dueDate: dueDate.toISOString() },
    };
  }

  static gradeReceived(userId: string, courseName: string, grade: string): NotificationData {
    return {
      title: 'Grade Received',
      message: `You received a grade of ${grade} for "${courseName}".`,
      type: 'GRADE_RECEIVED',
      userId,
      metadata: { courseName, grade },
    };
  }

  static messageReceived(userId: string, senderName: string): NotificationData {
    return {
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      type: 'MESSAGE_RECEIVED',
      userId,
      metadata: { senderName },
    };
  }

  static achievementUnlocked(userId: string, achievementName: string): NotificationData {
    return {
      title: 'Achievement Unlocked!',
      message: `Congratulations! You've unlocked the "${achievementName}" achievement.`,
      type: 'ACHIEVEMENT_UNLOCKED',
      userId,
      metadata: { achievementName },
    };
  }

  static paymentSuccess(userId: string, amount: string, courseName: string): NotificationData {
    return {
      title: 'Payment Successful',
      message: `Your payment of ${amount} for "${courseName}" has been processed successfully.`,
      type: 'PAYMENT_SUCCESS',
      userId,
      metadata: { amount, courseName },
    };
  }

  static paymentFailed(userId: string, amount: string, courseName: string): NotificationData {
    return {
      title: 'Payment Failed',
      message: `Your payment of ${amount} for "${courseName}" could not be processed. Please try again.`,
      type: 'PAYMENT_FAILED',
      userId,
      metadata: { amount, courseName },
    };
  }

  static coursePublished(userId: string, courseName: string): NotificationData {
    return {
      title: 'Course Published',
      message: `Your course "${courseName}" has been successfully published and is now live!`,
      type: 'COURSE_PUBLISHED',
      userId,
      metadata: { courseName },
    };
  }

  static reviewReceived(userId: string, courseName: string, rating: number): NotificationData {
    return {
      title: 'New Course Review',
      message: `Someone left a ${rating}-star review for your course "${courseName}".`,
      type: 'REVIEW_RECEIVED',
      userId,
      metadata: { courseName, rating },
    };
  }

  static systemAnnouncement(userIds: string[], title: string, message: string): BulkNotificationData {
    return {
      title,
      message,
      type: 'SYSTEM_ANNOUNCEMENT',
      userIds,
    };
  }
}