/**
 * SAM Agentic Notifications
 * Multi-channel notification system for SAM AI interventions
 *
 * Phase 4: Advanced Features - Notification delivery system
 *
 * Channel Status:
 * ✅ in_app  - Stored in Notification table + realtime cache (FULLY IMPLEMENTED)
 * ✅ email   - Via Resend API (IMPLEMENTED - requires RESEND_API_KEY)
 * ✅ push    - Via Firebase Cloud Messaging (IMPLEMENTED - requires FIREBASE_* credentials)
 * ✅ sms     - Via Twilio (IMPLEMENTED - requires TWILIO_* credentials)
 *
 * Auto Channel Selection:
 * - Online users: in_app only (realtime)
 * - Offline users: in_app + email (ensures delivery)
 * - Critical priority: all available channels
 */

import { Resend } from 'resend';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { realTimeCacheManager, RealTimeCacheUtils } from '@/lib/redis/realtime-cache';
import type { Intervention } from '@sam-ai/agentic';
import {
  isPushAvailable,
  sendPushToUser,
  isSMSAvailable,
  sendRateLimitedSMS,
} from './notifications';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notification channels for SAM AI interventions
 * - 'in_app': In-app notifications (IMPLEMENTED - stored in Notification table)
 * - 'email': Email via Resend (IMPLEMENTED - requires RESEND_API_KEY)
 * - 'push': Push notifications (NOT IMPLEMENTED - requires FCM/APNs integration)
 * - 'sms': SMS notifications (NOT IMPLEMENTED - requires Twilio integration)
 */
export type AgenticNotificationChannel = 'in_app' | 'email' | 'push' | 'sms';
export type AgenticNotificationPreference = AgenticNotificationChannel | 'auto';

export interface AgenticNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  channels?: AgenticNotificationPreference[];
  metadata?: Record<string, unknown>;
}

interface AgenticNotificationResult {
  channelsSent: AgenticNotificationChannel[];
  inAppId?: string;
  emailId?: string;
}

export interface NotificationCapabilities {
  in_app: { enabled: true };
  email: { enabled: boolean; reason?: string };
  push: { enabled: boolean; reason?: string };
  sms: { enabled: boolean; reason?: string };
}

// ============================================================================
// CAPABILITIES CHECK
// ============================================================================

/**
 * Get the current notification capabilities
 * Useful for UI to show which channels are available
 */
export function getNotificationCapabilities(): NotificationCapabilities {
  const pushAvailable = isPushAvailable();
  const smsAvailable = isSMSAvailable();

  return {
    in_app: { enabled: true },
    email: {
      enabled: Boolean(process.env.RESEND_API_KEY),
      reason: process.env.RESEND_API_KEY
        ? undefined
        : 'RESEND_API_KEY not configured',
    },
    push: {
      enabled: pushAvailable,
      reason: pushAvailable
        ? undefined
        : 'Firebase credentials not configured (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)',
    } as NotificationCapabilities['push'],
    sms: {
      enabled: smsAvailable,
      reason: smsAvailable
        ? undefined
        : 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)',
    } as NotificationCapabilities['sms'],
  };
}

/**
 * Check if a specific notification channel is available
 */
export function isChannelAvailable(channel: AgenticNotificationChannel): boolean {
  const capabilities = getNotificationCapabilities();
  return capabilities[channel].enabled;
}

/**
 * Get list of all available notification channels
 */
export function getAvailableChannels(): AgenticNotificationChannel[] {
  const capabilities = getNotificationCapabilities();
  return (Object.keys(capabilities) as AgenticNotificationChannel[]).filter(
    (channel) => capabilities[channel].enabled
  );
}

// ============================================================================
// SINGLETON CLIENTS
// ============================================================================

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// ============================================================================
// CHANNEL RESOLUTION
// ============================================================================

/**
 * Resolve which channels to use for a notification
 * Auto mode uses presence detection to determine optimal channels:
 * - Online users: in_app only
 * - Offline users: in_app + email
 * - Critical priority: all available channels
 */
const resolveChannels = async (
  payload: AgenticNotificationPayload
): Promise<AgenticNotificationChannel[]> => {
  const requested = payload.channels?.length
    ? payload.channels
    : ['auto'];

  const hasAuto = requested.includes('auto');
  const fixedChannels = requested.filter(
    (channel): channel is AgenticNotificationChannel => channel !== 'auto'
  );

  if (!hasAuto) {
    // Filter to only available channels
    const available = getAvailableChannels();
    const validChannels = fixedChannels.filter(c => available.includes(c));
    return validChannels.length > 0 ? validChannels : ['in_app'];
  }

  const presence = await realTimeCacheManager.getUserPresence(payload.userId);
  const isOnline = presence?.status === 'online' || presence?.status === 'busy';

  const channels = new Set<AgenticNotificationChannel>(fixedChannels);
  channels.add('in_app');

  // Offline users get email too
  if (!isOnline && isChannelAvailable('email')) {
    channels.add('email');
  }

  // Critical priority: use all available channels
  if (payload.priority === 'critical') {
    for (const channel of getAvailableChannels()) {
      channels.add(channel);
    }
    logger.info('[SAM_NOTIFICATIONS] Critical priority - using all available channels', {
      userId: payload.userId,
      channels: Array.from(channels),
    });
  }

  return Array.from(channels);
};

const formatMessage = (message: string, actionUrl?: string) => {
  if (!actionUrl) return message;
  return `${message}\n\nAction: ${actionUrl}`;
};

const mapRealtimePriority = (
  priority: AgenticNotificationPayload['priority']
): 'low' | 'medium' | 'high' | 'urgent' => {
  switch (priority) {
    case 'critical':
      return 'urgent';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
};

// ============================================================================
// SEND NOTIFICATION
// ============================================================================

export async function sendAgenticNotification(
  payload: AgenticNotificationPayload
): Promise<AgenticNotificationResult> {
  const channels = await resolveChannels(payload);
  const channelsSent: AgenticNotificationChannel[] = [];
  const message = formatMessage(payload.message, payload.actionUrl);

  let inAppId: string | undefined;
  let emailId: string | undefined;

  if (channels.includes('in_app')) {
    try {
      const notification = await db.notification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          userId: payload.userId,
          title: payload.title,
          message,
          type: payload.type,
          read: false,
        },
      });
      inAppId = notification.id;
      channelsSent.push('in_app');

      const realtimeNotification = RealTimeCacheUtils.createNotification(
        payload.userId,
        payload.type,
        payload.title,
        message,
        mapRealtimePriority(payload.priority)
      );
      await realTimeCacheManager.cacheNotification(realtimeNotification);
    } catch (error) {
      logger.warn('[SAM_NOTIFICATIONS] Failed to create in-app notification', {
        error,
        userId: payload.userId,
      });
    }
  }

  if (channels.includes('email')) {
    try {
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      });

      if (user?.email) {
        const resend = getResendClient();
        if (resend) {
          const result = await resend.emails.send({
            from: 'notifications@taxomind.com',
            to: user.email,
            subject: payload.title,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>${payload.title}</h2>
                <p>${payload.message}</p>
                ${payload.actionUrl ? `<p><a href="${payload.actionUrl}">Open in Taxomind</a></p>` : ''}
              </div>
            `,
          });
          emailId = result.data?.id;
          channelsSent.push('email');
        } else {
          logger.info('[SAM_NOTIFICATIONS] Email channel skipped (RESEND_API_KEY not set)', {
            userId: payload.userId,
          });
        }
      }
    } catch (error) {
      logger.warn('[SAM_NOTIFICATIONS] Failed to send email notification', {
        error,
        userId: payload.userId,
      });
    }
  }

  // Push notifications via Firebase Cloud Messaging
  if (channels.includes('push')) {
    if (isPushAvailable()) {
      try {
        const pushResult = await sendPushToUser(payload.userId, {
          title: payload.title,
          body: message,
          clickAction: payload.actionUrl,
          data: {
            type: payload.type,
            priority: payload.priority,
            ...(payload.metadata as Record<string, string> | undefined),
          },
        });

        if (pushResult.success) {
          channelsSent.push('push');
          logger.info('[SAM_NOTIFICATIONS] Push notification sent', {
            userId: payload.userId,
            type: payload.type,
          });
        } else {
          logger.warn('[SAM_NOTIFICATIONS] Push notification failed', {
            userId: payload.userId,
            error: pushResult.error,
          });
        }
      } catch (error) {
        logger.error('[SAM_NOTIFICATIONS] Push notification error', {
          userId: payload.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      logger.debug('[SAM_NOTIFICATIONS] Push channel requested but not configured', {
        userId: payload.userId,
        type: payload.type,
      });
    }
  }

  // SMS notifications via Twilio
  if (channels.includes('sms')) {
    if (isSMSAvailable()) {
      try {
        // Only send SMS for critical or high priority notifications
        if (payload.priority === 'critical' || payload.priority === 'high') {
          const smsResult = await sendRateLimitedSMS(payload.userId, {
            message: `[SAM] ${payload.title}: ${payload.message}`,
          });

          if (smsResult.success) {
            channelsSent.push('sms');
            logger.info('[SAM_NOTIFICATIONS] SMS notification sent', {
              userId: payload.userId,
              type: payload.type,
              messageId: smsResult.messageId,
            });
          } else {
            logger.warn('[SAM_NOTIFICATIONS] SMS notification failed', {
              userId: payload.userId,
              error: smsResult.error,
              errorCode: smsResult.errorCode,
            });
          }
        } else {
          logger.debug('[SAM_NOTIFICATIONS] SMS skipped - not high priority', {
            userId: payload.userId,
            priority: payload.priority,
          });
        }
      } catch (error) {
        logger.error('[SAM_NOTIFICATIONS] SMS notification error', {
          userId: payload.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      logger.debug('[SAM_NOTIFICATIONS] SMS channel requested but not configured', {
        userId: payload.userId,
        type: payload.type,
      });
    }
  }

  return { channelsSent, inAppId, emailId };
}

// ============================================================================
// INTERVENTION DISPATCH
// ============================================================================

const interventionTitles: Record<string, string> = {
  encouragement: 'SAM Encouragement',
  difficulty_adjustment: 'SAM Difficulty Update',
  content_recommendation: 'SAM Recommendation',
  break_suggestion: 'SAM Break Reminder',
  goal_revision: 'SAM Goal Update',
  peer_connection: 'SAM Peer Suggestion',
  mentor_escalation: 'SAM Mentor Alert',
  progress_celebration: 'SAM Progress Celebration',
  streak_reminder: 'SAM Streak Reminder',
};

export async function dispatchInterventionNotifications(
  userId: string,
  interventions: Intervention[],
  options?: {
    baseUrl?: string;
    channels?: AgenticNotificationPreference[];
  }
): Promise<{ dispatched: number }> {
  if (interventions.length === 0) return { dispatched: 0 };

  const baseUrl = options?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  let dispatched = 0;

  for (const intervention of interventions) {
    const actionUrl = baseUrl
      ? `${baseUrl}/dashboard/learning?intervention=${intervention.id}`
      : `/dashboard/learning?intervention=${intervention.id}`;

    const title = interventionTitles[intervention.type] ?? 'SAM Intervention';

    const result = await sendAgenticNotification({
      userId,
      title,
      message: intervention.message,
      type: `SAM_INTERVENTION:${intervention.type}`,
      priority: intervention.priority,
      actionUrl,
      channels: options?.channels,
    });

    if (result.channelsSent.length > 0) {
      dispatched += 1;
    }
  }

  return { dispatched };
}
