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
};
/**
 * Notification priority
 */
export const NotificationPriority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
};
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
};
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
        channels: z.array(z.nativeEnum(NotificationChannel)),
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
        .array(z.object({
        id: z.string(),
        label: z.string(),
        url: z.string().url().optional(),
        action: z.string().optional(),
        primary: z.boolean().optional(),
    }))
        .optional(),
    expiresAt: z.date().optional(),
});
export const NotificationRequestSchema = z.object({
    recipient: NotificationRecipientSchema,
    payload: NotificationPayloadSchema,
    channels: z.array(z.nativeEnum(NotificationChannel)),
    priority: z.nativeEnum(NotificationPriority).optional(),
    scheduledAt: z.date().optional(),
    templateId: z.string().optional(),
    templateData: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=notification.js.map