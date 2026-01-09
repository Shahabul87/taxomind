/**
 * @sam-ai/agentic - Email Delivery Channel
 * Delivers notifications via email for offline users
 */

import type { SAMWebSocketEvent, DeliveryChannel, RealtimeLogger } from '../types';
import type { DeliveryHandler } from '../push-dispatcher';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailChannelConfig {
  /** Email service adapter */
  emailService: EmailServiceAdapter;
  /** User email lookup function */
  getUserEmail: (userId: string) => Promise<string | null>;
  /** User notification preferences lookup */
  getUserPreferences?: (userId: string) => Promise<EmailPreferences | null>;
  /** From email address */
  fromEmail: string;
  /** From name */
  fromName?: string;
  /** Enable email notifications (default: true) */
  enabled?: boolean;
  /** Throttle settings */
  throttle?: {
    /** Max emails per user per hour */
    maxPerHour?: number;
    /** Max emails per user per day */
    maxPerDay?: number;
  };
  /** Logger */
  logger?: RealtimeLogger;
}

export interface EmailPreferences {
  /** Email notifications enabled */
  enabled: boolean;
  /** Types of notifications to receive */
  types: string[];
  /** Quiet hours (24h format) */
  quietHours?: {
    start: number; // 0-23
    end: number; // 0-23
    timezone: string;
  };
  /** Digest preferences */
  digest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM
  };
}

export interface EmailServiceAdapter {
  send(options: {
    to: string;
    from: string;
    fromName?: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<boolean>;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getEmailTemplate(event: SAMWebSocketEvent): EmailTemplate {
  const eventType = event.type;
  const payload = event.payload as unknown as Record<string, unknown>;

  switch (eventType) {
    case 'intervention':
      return {
        subject: 'SAM AI: Important Learning Update',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🎓 SAM has an important message for you</h2>
            <p style="font-size: 16px; color: #374151;">${(payload as { message?: string }).message || 'You have a new learning update'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Open SAM
            </a>
          </div>
        `,
        text: `SAM has an important message for you: ${(payload as { message?: string }).message || 'You have a new learning update'}`,
      };

    case 'checkin':
      return {
        subject: 'SAM AI: Time for a Quick Check-In',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">👋 SAM wants to check in with you</h2>
            <p style="font-size: 16px; color: #374151;">${(payload as { message?: string }).message || 'How is your learning going?'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Respond to SAM
            </a>
          </div>
        `,
        text: `SAM wants to check in with you: ${(payload as { message?: string }).message || 'How is your learning going?'}`,
      };

    case 'nudge':
      const nudgePayload = payload as { type?: string; message?: string };
      return {
        subject: `SAM AI: ${getNudgeSubject(nudgePayload.type || 'reminder')}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">💡 ${getNudgeTitle(nudgePayload.type || 'reminder')}</h2>
            <p style="font-size: 16px; color: #374151;">${nudgePayload.message || 'SAM has a suggestion for you'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Learn More
            </a>
          </div>
        `,
        text: `${getNudgeTitle(nudgePayload.type || 'reminder')}: ${nudgePayload.message || 'SAM has a suggestion for you'}`,
      };

    case 'goal_progress':
      const goalPayload = payload as { goalTitle?: string; progress?: number };
      return {
        subject: `SAM AI: Progress Update - ${goalPayload.goalTitle || 'Your Goal'}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">📈 Goal Progress Update</h2>
            <p style="font-size: 16px; color: #374151;">Great news! You&apos;ve made progress on: <strong>${goalPayload.goalTitle || 'Your Goal'}</strong></p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <div style="background: #e5e7eb; border-radius: 4px; height: 8px;">
                <div style="background: #4f46e5; border-radius: 4px; height: 8px; width: ${goalPayload.progress || 0}%;"></div>
              </div>
              <p style="text-align: center; margin-top: 8px; font-weight: 600; color: #4f46e5;">${goalPayload.progress || 0}% Complete</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Details
            </a>
          </div>
        `,
        text: `Goal Progress Update: You&apos;ve made ${goalPayload.progress || 0}% progress on ${goalPayload.goalTitle || 'Your Goal'}`,
      };

    case 'celebration':
      const celebrationPayload = payload as { title?: string; message?: string };
      return {
        subject: `🎉 SAM AI: ${celebrationPayload.title || 'Congratulations!'}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🎉 ${celebrationPayload.title || 'Congratulations!'}</h2>
            <p style="font-size: 16px; color: #374151;">${celebrationPayload.message || 'You achieved something great!'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Celebrate with SAM
            </a>
          </div>
        `,
        text: `${celebrationPayload.title || 'Congratulations!'}: ${celebrationPayload.message || 'You achieved something great!'}`,
      };

    default:
      return {
        subject: 'SAM AI: New Notification',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🔔 New Notification from SAM</h2>
            <p style="font-size: 16px; color: #374151;">You have a new notification waiting for you.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Open SAM
            </a>
          </div>
        `,
        text: 'You have a new notification from SAM AI.',
      };
  }
}

function getNudgeSubject(type: string): string {
  const subjects: Record<string, string> = {
    reminder: 'Learning Reminder',
    encouragement: 'Keep Going!',
    tip: 'Learning Tip',
    streak_alert: 'Streak Alert!',
    break_suggestion: 'Time for a Break',
    study_prompt: 'Time to Study',
    achievement: 'Achievement Unlocked!',
  };
  return subjects[type] || 'Learning Update';
}

function getNudgeTitle(type: string): string {
  const titles: Record<string, string> = {
    reminder: 'A quick reminder',
    encouragement: 'You&apos;re doing great!',
    tip: 'Pro tip for you',
    streak_alert: 'Don&apos;t lose your streak!',
    break_suggestion: 'Take a breather',
    study_prompt: 'Ready to learn?',
    achievement: 'Achievement unlocked!',
  };
  return titles[type] || 'SAM has a message';
}

// ============================================================================
// EMAIL CHANNEL IMPLEMENTATION
// ============================================================================

export class EmailChannel implements DeliveryHandler {
  readonly channel: DeliveryChannel = 'email';

  private readonly config: EmailChannelConfig;
  private readonly logger: RealtimeLogger;
  private readonly throttleMap: Map<string, { hourly: number; daily: number; lastReset: Date }> = new Map();

  constructor(config: EmailChannelConfig) {
    this.config = config;
    this.logger = config.logger ?? console;
  }

  async canDeliver(userId: string): Promise<boolean> {
    // Check if email channel is enabled
    if (this.config.enabled === false) {
      return false;
    }

    // Check if user has email
    const email = await this.config.getUserEmail(userId);
    if (!email) {
      return false;
    }

    // Check user preferences
    if (this.config.getUserPreferences) {
      const prefs = await this.config.getUserPreferences(userId);
      if (prefs && !prefs.enabled) {
        return false;
      }

      // Check quiet hours
      if (prefs?.quietHours) {
        const now = new Date();
        const hour = now.getHours();
        const { start, end } = prefs.quietHours;

        if (start < end) {
          // Normal range (e.g., 22:00 to 08:00)
          if (hour >= start && hour < end) {
            return false;
          }
        } else {
          // Overnight range (e.g., 22:00 to 08:00 next day)
          if (hour >= start || hour < end) {
            return false;
          }
        }
      }
    }

    // Check throttle limits
    if (!this.checkThrottle(userId)) {
      this.logger.debug('Email throttled for user', { userId });
      return false;
    }

    return true;
  }

  async deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean> {
    const email = await this.config.getUserEmail(userId);
    if (!email) {
      return false;
    }

    // Check event type preferences
    if (this.config.getUserPreferences) {
      const prefs = await this.config.getUserPreferences(userId);
      if (prefs && prefs.types.length > 0 && !prefs.types.includes(event.type)) {
        this.logger.debug('Event type not in user preferences', { userId, type: event.type });
        return false;
      }
    }

    const template = getEmailTemplate(event);

    try {
      const sent = await this.config.emailService.send({
        to: email,
        from: this.config.fromEmail,
        fromName: this.config.fromName ?? 'SAM AI',
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: ['sam-notification', event.type],
        metadata: {
          userId,
          eventType: event.type,
          eventId: event.eventId,
        },
      });

      if (sent) {
        this.incrementThrottle(userId);
        this.logger.info('Email notification sent', {
          userId,
          eventType: event.type,
          eventId: event.eventId,
        });
      }

      return sent;
    } catch (error) {
      this.logger.error('Failed to send email notification', {
        userId,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private checkThrottle(userId: string): boolean {
    const throttle = this.config.throttle;
    if (!throttle) return true;

    const now = new Date();
    let userData = this.throttleMap.get(userId);

    // Reset if new day
    if (userData && userData.lastReset.getDate() !== now.getDate()) {
      userData = { hourly: 0, daily: 0, lastReset: now };
      this.throttleMap.set(userId, userData);
    }

    // Reset hourly count if hour changed
    if (userData && userData.lastReset.getHours() !== now.getHours()) {
      userData.hourly = 0;
    }

    if (!userData) {
      userData = { hourly: 0, daily: 0, lastReset: now };
      this.throttleMap.set(userId, userData);
    }

    // Check limits
    if (throttle.maxPerHour && userData.hourly >= throttle.maxPerHour) {
      return false;
    }
    if (throttle.maxPerDay && userData.daily >= throttle.maxPerDay) {
      return false;
    }

    return true;
  }

  private incrementThrottle(userId: string): void {
    const userData = this.throttleMap.get(userId);
    if (userData) {
      userData.hourly++;
      userData.daily++;
      userData.lastReset = new Date();
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createEmailChannel(config: EmailChannelConfig): EmailChannel {
  return new EmailChannel(config);
}
