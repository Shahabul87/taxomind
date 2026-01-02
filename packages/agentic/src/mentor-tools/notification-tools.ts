/**
 * @sam-ai/agentic - Notification Tools
 * Tools for notifications, progress tracking, and user communication
 */

import type { ToolDefinition, ToolHandler } from '../tool-registry/types';
import {
  ToolCategory,
  ConfirmationType,
  PermissionLevel,
} from '../tool-registry/types';
import {
  NotificationRequestSchema,
  ProgressReportRequestSchema,
  type NotificationRequest,
  type Notification,
  type ProgressReportRequest,
  type ProgressReport,
} from './types';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dependencies for notification tools
 */
export interface NotificationToolsDependencies {
  notificationRepository?: {
    create: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<Notification>;
    get: (notificationId: string) => Promise<Notification | null>;
    update: (notificationId: string, updates: Partial<Notification>) => Promise<Notification>;
    getByUser: (userId: string, options?: { status?: string; limit?: number }) => Promise<Notification[]>;
    markRead: (notificationId: string) => Promise<Notification>;
    markAllRead: (userId: string) => Promise<number>;
  };
  progressRepository?: {
    getStudyMetrics: (
      userId: string,
      startDate: Date,
      endDate: Date
    ) => Promise<{
      studyTime: number;
      lessonsCompleted: number;
      assessmentsTaken: number;
      averageScore: number;
      streakDays: number;
      masteryProgress: number;
    }>;
    getGoalProgress: (
      userId: string
    ) => Promise<Array<{ id: string; title: string; progress: number; status: string }>>;
  };
  deliveryService?: {
    sendPush: (userId: string, title: string, body: string) => Promise<boolean>;
    sendEmail: (userId: string, title: string, body: string) => Promise<boolean>;
    sendSMS: (userId: string, message: string) => Promise<boolean>;
  };
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * Create send notification handler
 */
function createSendNotificationHandler(deps: NotificationToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: Notification; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as NotificationRequest;

    try {
      const channels = request.channels ?? ['in_app'];

      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId: request.userId,
        type: request.type,
        title: request.title,
        body: request.body,
        priority: request.priority,
        channels,
        data: request.data,
        status: 'pending',
        expiresAt: request.expiresAt,
        actionUrl: request.actionUrl,
        actionLabel: request.actionLabel,
      };

      // Save notification
      let savedNotification: Notification;
      if (deps.notificationRepository) {
        savedNotification = await deps.notificationRepository.create(notification);
      } else {
        savedNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date(),
        };
      }

      // Deliver through channels
      const deliveryResults: Record<string, boolean> = {};

      if (deps.deliveryService) {
        for (const channel of channels) {
          try {
            switch (channel) {
              case 'push':
                deliveryResults.push = await deps.deliveryService.sendPush(
                  request.userId,
                  request.title,
                  request.body
                );
                break;
              case 'email':
                deliveryResults.email = await deps.deliveryService.sendEmail(
                  request.userId,
                  request.title,
                  request.body
                );
                break;
              case 'sms':
                deliveryResults.sms = await deps.deliveryService.sendSMS(
                  request.userId,
                  `${request.title}: ${request.body}`
                );
                break;
              case 'in_app':
                deliveryResults.in_app = true; // Already saved
                break;
            }
          } catch (error) {
            deps.logger?.warn(`Failed to deliver via ${channel}`, { error });
            deliveryResults[channel] = false;
          }
        }
      }

      // Update status based on delivery
      const anyDelivered = Object.values(deliveryResults).some((v) => v);
      if (anyDelivered && deps.notificationRepository) {
        await deps.notificationRepository.update(savedNotification.id, {
          status: 'sent',
          sentAt: new Date(),
        });
        savedNotification.status = 'sent';
        savedNotification.sentAt = new Date();
      }

      deps.logger?.info('Notification sent', {
        notificationId: savedNotification.id,
        userId: request.userId,
        channels,
        deliveryResults,
      });

      return {
        success: true,
        output: savedNotification,
      };
    } catch (error) {
      deps.logger?.error('Failed to send notification', { error, request });
      return {
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send notification',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create get notifications handler
 */
function createGetNotificationsHandler(deps: NotificationToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: { notifications: Notification[]; unreadCount: number }; error?: { code: string; message: string; recoverable: boolean } }> => {
    const { userId, status, limit } = input as {
      userId: string;
      status?: string;
      limit?: number;
    };

    try {
      let notifications: Notification[] = [];

      if (deps.notificationRepository) {
        notifications = await deps.notificationRepository.getByUser(userId, {
          status,
          limit: limit ?? 50,
        });
      }

      const unreadCount = notifications.filter(
        (n) => n.status !== 'read' && n.status !== 'dismissed'
      ).length;

      return {
        success: true,
        output: {
          notifications,
          unreadCount,
        },
      };
    } catch (error) {
      deps.logger?.error('Failed to get notifications', { error, userId });
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get notifications',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create mark notification read handler
 */
function createMarkReadHandler(deps: NotificationToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: { updated: number }; error?: { code: string; message: string; recoverable: boolean } }> => {
    const { userId, notificationId, markAll } = input as {
      userId: string;
      notificationId?: string;
      markAll?: boolean;
    };

    try {
      let updated = 0;

      if (deps.notificationRepository) {
        if (markAll) {
          updated = await deps.notificationRepository.markAllRead(userId);
        } else if (notificationId) {
          await deps.notificationRepository.markRead(notificationId);
          updated = 1;
        }
      }

      return {
        success: true,
        output: { updated },
      };
    } catch (error) {
      deps.logger?.error('Failed to mark notifications read', { error, userId });
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to mark notifications read',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create generate progress report handler
 */
function createGenerateProgressReportHandler(deps: NotificationToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: ProgressReport; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as ProgressReportRequest;

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (request.period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Get metrics
      let metrics = {
        studyTime: 0,
        lessonsCompleted: 0,
        assessmentsTaken: 0,
        averageScore: 0,
        streakDays: 0,
        masteryProgress: 0,
      };

      if (deps.progressRepository) {
        metrics = await deps.progressRepository.getStudyMetrics(
          request.userId,
          startDate,
          endDate
        );
      }

      // Build report
      const report: ProgressReport = {
        userId: request.userId,
        period: request.period,
        startDate,
        endDate,
        metrics,
        generatedAt: new Date(),
      };

      // Add comparison if requested
      if (request.includeComparison) {
        const previousEndDate = startDate;
        const previousStartDate = new Date(startDate);

        switch (request.period) {
          case 'daily':
            previousStartDate.setDate(previousStartDate.getDate() - 1);
            break;
          case 'weekly':
            previousStartDate.setDate(previousStartDate.getDate() - 7);
            break;
          case 'monthly':
            previousStartDate.setMonth(previousStartDate.getMonth() - 1);
            break;
        }

        if (deps.progressRepository) {
          const previousMetrics = await deps.progressRepository.getStudyMetrics(
            request.userId,
            previousStartDate,
            previousEndDate
          );

          const studyTimeChange = previousMetrics.studyTime > 0
            ? ((metrics.studyTime - previousMetrics.studyTime) / previousMetrics.studyTime) * 100
            : metrics.studyTime > 0 ? 100 : 0;

          const performanceChange = previousMetrics.averageScore > 0
            ? ((metrics.averageScore - previousMetrics.averageScore) / previousMetrics.averageScore) * 100
            : metrics.averageScore > 0 ? 100 : 0;

          let trend: 'improving' | 'stable' | 'declining' = 'stable';
          if (studyTimeChange > 10 && performanceChange >= 0) {
            trend = 'improving';
          } else if (studyTimeChange < -10 || performanceChange < -10) {
            trend = 'declining';
          }

          report.comparison = {
            studyTimeChange,
            performanceChange,
            trend,
          };
        }
      }

      // Add goals if requested
      if (request.includeGoals && deps.progressRepository) {
        report.goals = await deps.progressRepository.getGoalProgress(request.userId);
      }

      // Add recommendations if requested
      if (request.includeRecommendations) {
        report.recommendations = generateRecommendations(metrics, report.comparison);
      }

      deps.logger?.info('Progress report generated', {
        userId: request.userId,
        period: request.period,
      });

      return {
        success: true,
        output: report,
      };
    } catch (error) {
      deps.logger?.error('Failed to generate progress report', { error, request });
      return {
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate progress report',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create send achievement notification handler
 */
function createSendAchievementHandler(deps: NotificationToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: Notification; error?: { code: string; message: string; recoverable: boolean } }> => {
    const { userId, achievement, details } = input as {
      userId: string;
      achievement: {
        id: string;
        name: string;
        description: string;
        icon?: string;
        rarity?: string;
      };
      details?: Record<string, unknown>;
    };

    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'achievement',
        title: `Achievement Unlocked: ${achievement.name}`,
        body: achievement.description,
        priority: 'high',
        channels: ['push', 'in_app'],
        data: {
          achievementId: achievement.id,
          icon: achievement.icon,
          rarity: achievement.rarity,
          ...details,
        },
        status: 'pending',
      };

      let savedNotification: Notification;
      if (deps.notificationRepository) {
        savedNotification = await deps.notificationRepository.create(notification);
      } else {
        savedNotification = {
          ...notification,
          id: `notif-achievement-${Date.now()}`,
          createdAt: new Date(),
        };
      }

      // Deliver push notification
      if (deps.deliveryService) {
        await deps.deliveryService.sendPush(
          userId,
          notification.title,
          notification.body
        );
        savedNotification.status = 'sent';
        savedNotification.sentAt = new Date();
      }

      deps.logger?.info('Achievement notification sent', {
        userId,
        achievementId: achievement.id,
      });

      return {
        success: true,
        output: savedNotification,
      };
    } catch (error) {
      deps.logger?.error('Failed to send achievement notification', { error, userId });
      return {
        success: false,
        error: {
          code: 'ACHIEVEMENT_NOTIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send achievement notification',
          recoverable: true,
        },
      };
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(
  metrics: ProgressReport['metrics'],
  comparison?: ProgressReport['comparison']
): string[] {
  const recommendations: string[] = [];

  // Study time recommendations
  if (metrics.studyTime < 30) {
    recommendations.push(
      'Try to increase your daily study time. Even 15 more minutes can make a big difference.'
    );
  } else if (metrics.studyTime > 180) {
    recommendations.push(
      'Great dedication! Remember to take breaks to maintain focus and prevent burnout.'
    );
  }

  // Score recommendations
  if (metrics.averageScore < 70) {
    recommendations.push(
      'Consider reviewing the material before assessments. Practice exercises can help improve your scores.'
    );
  } else if (metrics.averageScore >= 90) {
    recommendations.push(
      'Excellent performance! You might be ready to tackle more advanced topics.'
    );
  }

  // Streak recommendations
  if (metrics.streakDays >= 7) {
    recommendations.push(
      `Amazing ${metrics.streakDays}-day streak! Keep it up to maintain your learning momentum.`
    );
  } else if (metrics.streakDays === 0) {
    recommendations.push(
      'Start a study streak today! Consistent daily practice leads to better retention.'
    );
  }

  // Trend-based recommendations
  if (comparison) {
    if (comparison.trend === 'declining') {
      recommendations.push(
        'Your study activity has decreased recently. Consider setting reminders to get back on track.'
      );
    } else if (comparison.trend === 'improving') {
      recommendations.push(
        'Your progress is trending upward! Keep up the excellent work.'
      );
    }
  }

  return recommendations;
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Create notification tools with dependencies
 */
export function createNotificationTools(deps: NotificationToolsDependencies): ToolDefinition[] {
  return [
    {
      id: 'notification-send',
      name: 'Send Notification',
      description: 'Send a notification to a user through specified channels',
      category: ToolCategory.COMMUNICATION,
      version: '1.0.0',
      inputSchema: NotificationRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createSendNotificationHandler(deps),
      timeoutMs: 15000,
      maxRetries: 3,
      rateLimit: {
        maxCalls: 100,
        windowMs: 60000,
        scope: 'user',
      },
      tags: ['notification', 'communication'],
      enabled: true,
      examples: [
        {
          name: 'Send progress update',
          description: 'Notify user of their weekly progress',
          input: {
            userId: 'user-123',
            type: 'progress_update',
            title: 'Weekly Progress Update',
            body: 'Great job this week! You studied for 5 hours and completed 3 lessons.',
            priority: 'normal',
            channels: ['push', 'in_app'],
          },
        },
      ],
    },
    {
      id: 'notification-get',
      name: 'Get Notifications',
      description: 'Retrieve notifications for a user',
      category: ToolCategory.COMMUNICATION,
      version: '1.0.0',
      inputSchema: z.object({
        userId: z.string().min(1),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGetNotificationsHandler(deps),
      timeoutMs: 5000,
      maxRetries: 2,
      tags: ['notification', 'query'],
      enabled: true,
    },
    {
      id: 'notification-mark-read',
      name: 'Mark Notifications Read',
      description: 'Mark notifications as read',
      category: ToolCategory.COMMUNICATION,
      version: '1.0.0',
      inputSchema: z.object({
        userId: z.string().min(1),
        notificationId: z.string().optional(),
        markAll: z.boolean().optional(),
      }),
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.NONE,
      handler: createMarkReadHandler(deps),
      timeoutMs: 5000,
      maxRetries: 2,
      tags: ['notification', 'update'],
      enabled: true,
    },
    {
      id: 'notification-progress-report',
      name: 'Generate Progress Report',
      description: 'Generate a progress report for a user',
      category: ToolCategory.ANALYTICS,
      version: '1.0.0',
      inputSchema: ProgressReportRequestSchema,
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGenerateProgressReportHandler(deps),
      timeoutMs: 30000,
      maxRetries: 2,
      tags: ['notification', 'analytics', 'report'],
      enabled: true,
      examples: [
        {
          name: 'Weekly progress',
          description: 'Generate weekly progress report',
          input: {
            userId: 'user-123',
            period: 'weekly',
            includeComparison: true,
            includeGoals: true,
            includeRecommendations: true,
          },
        },
      ],
    },
    {
      id: 'notification-achievement',
      name: 'Send Achievement Notification',
      description: 'Notify user of an unlocked achievement',
      category: ToolCategory.COMMUNICATION,
      version: '1.0.0',
      inputSchema: z.object({
        userId: z.string().min(1),
        achievement: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          icon: z.string().optional(),
          rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
        }),
        details: z.record(z.unknown()).optional(),
      }),
      requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createSendAchievementHandler(deps),
      timeoutMs: 10000,
      maxRetries: 3,
      tags: ['notification', 'achievement', 'gamification'],
      enabled: true,
      examples: [
        {
          name: 'First lesson badge',
          description: 'Award first lesson completion badge',
          input: {
            userId: 'user-123',
            achievement: {
              id: 'first-lesson',
              name: 'First Steps',
              description: 'Completed your first lesson!',
              icon: 'trophy',
              rarity: 'common',
            },
          },
        },
      ],
    },
  ];
}
