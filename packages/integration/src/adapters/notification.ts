/**
 * @sam-ai/integration - Notification Adapter Interface
 * Abstract notification operations for portability
 */

import { z } from 'zod';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification channel
 */
export const NotificationChannel = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
  SLACK: 'slack',
  DISCORD: 'discord',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

/**
 * Notification priority
 */
export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

/**
 * Notification status
 */
export const NotificationStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

/**
 * Notification recipient
 */
export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  deviceTokens?: string[];
  webhookUrl?: string;
  preferences?: NotificationPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  channels: NotificationChannel[];
  quietHours?: { start: string; end: string };
  timezone?: string;
  frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  id?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  actions?: NotificationAction[];
  expiresAt?: Date;
}

/**
 * Notification action button
 */
export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: string;
  primary?: boolean;
}

/**
 * Notification request
 */
export interface NotificationRequest {
  recipient: NotificationRecipient;
  payload: NotificationPayload;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
  templateId?: string;
  templateData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Notification result
 */
export interface NotificationResult {
  id: string;
  status: NotificationStatus;
  channels: Array<{
    channel: NotificationChannel;
    status: NotificationStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    error?: string;
  }>;
  createdAt: Date;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  channels: NotificationChannel[];
  subject?: string;
  titleTemplate: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  variables: string[];
  defaultData?: Record<string, unknown>;
}

// ============================================================================
// NOTIFICATION ADAPTER INTERFACE
// ============================================================================

/**
 * Notification adapter interface
 * Abstracts away the specific notification provider implementation
 */
export interface NotificationAdapter {
  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Get supported channels
   */
  getSupportedChannels(): NotificationChannel[];

  /**
   * Check if channel is supported
   */
  supportsChannel(channel: NotificationChannel): boolean;

  /**
   * Check if adapter is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;

  // -------------------------------------------------------------------------
  // Send Operations
  // -------------------------------------------------------------------------

  /**
   * Send a single notification
   */
  send(request: NotificationRequest): Promise<NotificationResult>;

  /**
   * Send multiple notifications
   */
  sendBatch(requests: NotificationRequest[]): Promise<NotificationResult[]>;

  /**
   * Send using template
   */
  sendWithTemplate(
    recipient: NotificationRecipient,
    templateId: string,
    data: Record<string, unknown>,
    options?: Partial<NotificationRequest>
  ): Promise<NotificationResult>;

  // -------------------------------------------------------------------------
  // Scheduling
  // -------------------------------------------------------------------------

  /**
   * Schedule a notification for later
   */
  schedule(request: NotificationRequest, scheduledAt: Date): Promise<NotificationResult>;

  /**
   * Cancel a scheduled notification
   */
  cancel(notificationId: string): Promise<boolean>;

  /**
   * Get scheduled notifications
   */
  getScheduled(userId: string): Promise<NotificationResult[]>;

  // -------------------------------------------------------------------------
  // Status & History
  // -------------------------------------------------------------------------

  /**
   * Get notification by ID
   */
  get(notificationId: string): Promise<NotificationResult | null>;

  /**
   * Get notification history for user
   */
  getHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: NotificationStatus[];
      channels?: NotificationChannel[];
      dateRange?: { start?: Date; end?: Date };
    }
  ): Promise<NotificationResult[]>;

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Promise<boolean>;

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): Promise<number>;

  // -------------------------------------------------------------------------
  // Preferences
  // -------------------------------------------------------------------------

  /**
   * Get user notification preferences
   */
  getPreferences(userId: string): Promise<NotificationPreferences>;

  /**
   * Update user notification preferences
   */
  updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences>;

  // -------------------------------------------------------------------------
  // Templates
  // -------------------------------------------------------------------------

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Promise<NotificationTemplate | null>;

  /**
   * List all templates
   */
  listTemplates(): Promise<NotificationTemplate[]>;

  /**
   * Render template with data
   */
  renderTemplate(templateId: string, data: Record<string, unknown>): Promise<{
    title: string;
    body: string;
    html?: string;
  }>;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

/**
 * Multi-channel notification service
 */
export interface NotificationService {
  /**
   * Get adapter for channel
   */
  getAdapter(channel: NotificationChannel): NotificationAdapter | null;

  /**
   * Register adapter
   */
  registerAdapter(channel: NotificationChannel, adapter: NotificationAdapter): void;

  /**
   * Send notification (auto-selects channels based on preferences)
   */
  notify(
    userId: string,
    payload: NotificationPayload,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      scheduledAt?: Date;
    }
  ): Promise<NotificationResult>;

  /**
   * Send to multiple users
   */
  notifyMany(
    userIds: string[],
    payload: NotificationPayload,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
    }
  ): Promise<NotificationResult[]>;

  /**
   * Send using template
   */
  notifyWithTemplate(
    userId: string,
    templateId: string,
    data: Record<string, unknown>,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
    }
  ): Promise<NotificationResult>;

  /**
   * Get all unread notifications for user
   */
  getUnread(userId: string): Promise<NotificationResult[]>;
}

// ============================================================================
// IN-APP NOTIFICATION TYPES
// ============================================================================

/**
 * In-app notification for real-time display
 */
export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  actions?: NotificationAction[];
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * In-app notification store
 */
export interface InAppNotificationStore {
  /**
   * Create notification
   */
  create(notification: Omit<InAppNotification, 'id' | 'createdAt'>): Promise<InAppNotification>;

  /**
   * Get by ID
   */
  get(id: string): Promise<InAppNotification | null>;

  /**
   * Get all for user
   */
  getAll(userId: string, options?: { limit?: number; offset?: number }): Promise<InAppNotification[]>;

  /**
   * Get unread for user
   */
  getUnread(userId: string): Promise<InAppNotification[]>;

  /**
   * Mark as read
   */
  markAsRead(id: string): Promise<boolean>;

  /**
   * Mark all as read for user
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Delete notification
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete expired notifications
   */
  deleteExpired(): Promise<number>;

  /**
   * Count unread for user
   */
  countUnread(userId: string): Promise<number>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const NotificationRecipientSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  deviceTokens: z.array(z.string()).optional(),
  webhookUrl: z.string().url().optional(),
  preferences: z
    .object({
      channels: z.array(z.nativeEnum(NotificationChannel as unknown as { [k: string]: string })),
      quietHours: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      timezone: z.string().optional(),
      frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
    })
    .optional(),
});

export const NotificationPayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  actionUrl: z.string().url().optional(),
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        url: z.string().url().optional(),
        action: z.string().optional(),
        primary: z.boolean().optional(),
      })
    )
    .optional(),
  expiresAt: z.date().optional(),
});

export const NotificationRequestSchema = z.object({
  recipient: NotificationRecipientSchema,
  payload: NotificationPayloadSchema,
  channels: z.array(z.nativeEnum(NotificationChannel as unknown as { [k: string]: string })),
  priority: z.nativeEnum(NotificationPriority as unknown as { [k: string]: string }).optional(),
  scheduledAt: z.date().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
