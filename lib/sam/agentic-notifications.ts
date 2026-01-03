import { Resend } from 'resend';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { realTimeCacheManager, RealTimeCacheUtils } from '@/lib/redis/realtime-cache';
import type { Intervention } from '@sam-ai/agentic';

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

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

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
    return fixedChannels.length > 0 ? fixedChannels : ['in_app'];
  }

  const presence = await realTimeCacheManager.getUserPresence(payload.userId);
  const isOnline = presence?.status === 'online' || presence?.status === 'busy';

  const channels = new Set<AgenticNotificationChannel>(fixedChannels);
  channels.add('in_app');

  if (!isOnline) {
    channels.add('email');
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

  if (channels.includes('push')) {
    logger.info('[SAM_NOTIFICATIONS] Push channel requested', {
      userId: payload.userId,
      type: payload.type,
    });
    channelsSent.push('push');
  }

  if (channels.includes('sms')) {
    logger.info('[SAM_NOTIFICATIONS] SMS channel requested', {
      userId: payload.userId,
      type: payload.type,
    });
    channelsSent.push('sms');
  }

  return { channelsSent, inAppId, emailId };
}

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
