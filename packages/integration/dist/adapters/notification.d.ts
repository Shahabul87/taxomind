/**
 * @sam-ai/integration - Notification Adapter Interface
 * Abstract notification operations for portability
 */
import { z } from 'zod';
/**
 * Notification channel
 */
export declare const NotificationChannel: {
    readonly EMAIL: "email";
    readonly PUSH: "push";
    readonly SMS: "sms";
    readonly IN_APP: "in_app";
    readonly WEBHOOK: "webhook";
    readonly SLACK: "slack";
    readonly DISCORD: "discord";
};
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
/**
 * Notification priority
 */
export declare const NotificationPriority: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
    readonly URGENT: "urgent";
};
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];
/**
 * Notification status
 */
export declare const NotificationStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
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
    quietHours?: {
        start: string;
        end: string;
    };
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
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
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
    sendWithTemplate(recipient: NotificationRecipient, templateId: string, data: Record<string, unknown>, options?: Partial<NotificationRequest>): Promise<NotificationResult>;
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
    /**
     * Get notification by ID
     */
    get(notificationId: string): Promise<NotificationResult | null>;
    /**
     * Get notification history for user
     */
    getHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        status?: NotificationStatus[];
        channels?: NotificationChannel[];
        dateRange?: {
            start?: Date;
            end?: Date;
        };
    }): Promise<NotificationResult[]>;
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
    /**
     * Get user notification preferences
     */
    getPreferences(userId: string): Promise<NotificationPreferences>;
    /**
     * Update user notification preferences
     */
    updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
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
    notify(userId: string, payload: NotificationPayload, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
        scheduledAt?: Date;
    }): Promise<NotificationResult>;
    /**
     * Send to multiple users
     */
    notifyMany(userIds: string[], payload: NotificationPayload, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
    }): Promise<NotificationResult[]>;
    /**
     * Send using template
     */
    notifyWithTemplate(userId: string, templateId: string, data: Record<string, unknown>, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
    }): Promise<NotificationResult>;
    /**
     * Get all unread notifications for user
     */
    getUnread(userId: string): Promise<NotificationResult[]>;
}
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
    getAll(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<InAppNotification[]>;
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
export declare const NotificationRecipientSchema: z.ZodObject<{
    userId: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    deviceTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    webhookUrl: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        channels: z.ZodArray<z.ZodNativeEnum<{
            [k: string]: string;
        }>, "many">;
        quietHours: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
        }, {
            start: string;
            end: string;
        }>>;
        timezone: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodEnum<["immediate", "hourly", "daily", "weekly"]>>;
    }, "strip", z.ZodTypeAny, {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    }, {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    email?: string | undefined;
    phone?: string | undefined;
    deviceTokens?: string[] | undefined;
    webhookUrl?: string | undefined;
    preferences?: {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    } | undefined;
}, {
    userId: string;
    email?: string | undefined;
    phone?: string | undefined;
    deviceTokens?: string[] | undefined;
    webhookUrl?: string | undefined;
    preferences?: {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    } | undefined;
}>;
export declare const NotificationPayloadSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }, {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }>, "many">>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type: string;
    title: string;
    body: string;
    id?: string | undefined;
    expiresAt?: Date | undefined;
    data?: Record<string, unknown> | undefined;
    imageUrl?: string | undefined;
    actionUrl?: string | undefined;
    actions?: {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }[] | undefined;
}, {
    type: string;
    title: string;
    body: string;
    id?: string | undefined;
    expiresAt?: Date | undefined;
    data?: Record<string, unknown> | undefined;
    imageUrl?: string | undefined;
    actionUrl?: string | undefined;
    actions?: {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }[] | undefined;
}>;
export declare const NotificationRequestSchema: z.ZodObject<{
    recipient: z.ZodObject<{
        userId: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        deviceTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        webhookUrl: z.ZodOptional<z.ZodString>;
        preferences: z.ZodOptional<z.ZodObject<{
            channels: z.ZodArray<z.ZodNativeEnum<{
                [k: string]: string;
            }>, "many">;
            quietHours: z.ZodOptional<z.ZodObject<{
                start: z.ZodString;
                end: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                start: string;
                end: string;
            }, {
                start: string;
                end: string;
            }>>;
            timezone: z.ZodOptional<z.ZodString>;
            frequency: z.ZodOptional<z.ZodEnum<["immediate", "hourly", "daily", "weekly"]>>;
        }, "strip", z.ZodTypeAny, {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        }, {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    }, {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    }>;
    payload: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        imageUrl: z.ZodOptional<z.ZodString>;
        actionUrl: z.ZodOptional<z.ZodString>;
        actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            action: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }, {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }>, "many">>;
        expiresAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    }, {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    }>;
    channels: z.ZodArray<z.ZodNativeEnum<{
        [k: string]: string;
    }>, "many">;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        [k: string]: string;
    }>>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    templateId: z.ZodOptional<z.ZodString>;
    templateData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    channels: string[];
    recipient: {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    };
    payload: {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    };
    metadata?: Record<string, unknown> | undefined;
    priority?: string | undefined;
    scheduledAt?: Date | undefined;
    templateId?: string | undefined;
    templateData?: Record<string, unknown> | undefined;
}, {
    channels: string[];
    recipient: {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    };
    payload: {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    };
    metadata?: Record<string, unknown> | undefined;
    priority?: string | undefined;
    scheduledAt?: Date | undefined;
    templateId?: string | undefined;
    templateData?: Record<string, unknown> | undefined;
}>;
//# sourceMappingURL=notification.d.ts.map