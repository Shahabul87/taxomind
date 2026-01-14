/**
 * SMS Notification Channel (Twilio)
 *
 * Implements SMS notifications for SAM AI using Twilio.
 * Used for urgent alerts and streak reminders when enabled by user.
 *
 * Requirements:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SMSNotificationPayload {
  message: string;
  mediaUrls?: string[];
}

export interface SMSNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

interface TwilioMessage {
  body: string;
  from: string;
  to: string;
  mediaUrl?: string[];
}

interface TwilioClient {
  messages: {
    create: (message: TwilioMessage) => Promise<{ sid: string; status: string }>;
  };
}

// ============================================================================
// TWILIO CLIENT INITIALIZATION
// ============================================================================

let twilioClient: TwilioClient | null = null;

async function getTwilioClient(): Promise<TwilioClient | null> {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    logger.debug('[SMSChannel] Twilio not configured - missing credentials');
    return null;
  }

  try {
    // Dynamic import to avoid build errors when twilio is not installed
    const twilio = await import('twilio');
    twilioClient = twilio.default(accountSid, authToken) as TwilioClient;
    logger.info('[SMSChannel] Twilio client initialized successfully');
    return twilioClient;
  } catch (error) {
    logger.error('[SMSChannel] Failed to initialize Twilio client', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// ============================================================================
// SMS NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Check if SMS notifications are available
 */
export function isSMSAvailable(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Validate phone number format (basic E.164 validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number], 10-15 digits total
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(phone);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If already E.164 format
  if (isValidPhoneNumber(cleaned)) {
    return cleaned;
  }

  // If US number without country code (10 digits)
  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  // If has country code but missing +
  if (/^1\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Send SMS notification to a phone number
 */
export async function sendSMSNotification(
  phoneNumber: string,
  payload: SMSNotificationPayload
): Promise<SMSNotificationResult> {
  const client = await getTwilioClient();

  if (!client) {
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    return {
      success: false,
      error: 'Twilio phone number not configured',
    };
  }

  // Validate and format phone number
  const formattedNumber = formatPhoneNumber(phoneNumber);
  if (!formattedNumber) {
    return {
      success: false,
      error: 'Invalid phone number format',
      errorCode: 'INVALID_PHONE',
    };
  }

  try {
    const messageOptions: TwilioMessage = {
      body: payload.message,
      from: fromNumber,
      to: formattedNumber,
    };

    if (payload.mediaUrls && payload.mediaUrls.length > 0) {
      messageOptions.mediaUrl = payload.mediaUrls;
    }

    const result = await client.messages.create(messageOptions);

    logger.info('[SMSChannel] SMS sent successfully', {
      messageId: result.sid,
      status: result.status,
      to: formattedNumber.slice(0, 5) + '****',
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code;

    logger.error('[SMSChannel] Failed to send SMS', {
      error: errorMessage,
      code: errorCode,
      to: formattedNumber.slice(0, 5) + '****',
    });

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Send SMS notification to a user
 */
export async function sendSMSToUser(
  userId: string,
  payload: SMSNotificationPayload
): Promise<SMSNotificationResult> {
  // Get user's phone number
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    logger.debug('[SMSChannel] No phone number for user', { userId });
    return {
      success: false,
      error: 'No phone number on file',
      errorCode: 'NO_PHONE',
    };
  }

  // Check if user has SMS notifications enabled
  const preferences = await db.userNotificationPreferences.findUnique({
    where: { userId },
    select: { smsNotifications: true },
  });

  if (preferences && !preferences.smsNotifications) {
    logger.debug('[SMSChannel] SMS notifications disabled for user', { userId });
    return {
      success: false,
      error: 'SMS notifications disabled by user',
      errorCode: 'SMS_DISABLED',
    };
  }

  return sendSMSNotification(user.phone, payload);
}

/**
 * Send urgent alert SMS to a user
 * Only sends if user has smsUrgentAlerts enabled
 */
export async function sendUrgentAlertSMS(
  userId: string,
  message: string
): Promise<SMSNotificationResult> {
  const preferences = await db.userNotificationPreferences.findUnique({
    where: { userId },
    select: { smsNotifications: true, smsUrgentAlerts: true },
  });

  if (!preferences?.smsNotifications || !preferences?.smsUrgentAlerts) {
    logger.debug('[SMSChannel] Urgent SMS alerts disabled for user', { userId });
    return {
      success: false,
      error: 'Urgent SMS alerts disabled by user',
      errorCode: 'URGENT_SMS_DISABLED',
    };
  }

  return sendSMSToUser(userId, {
    message: `[URGENT] ${message}`,
  });
}

/**
 * Send streak reminder SMS to a user
 * Only sends if user has smsStreakReminders enabled
 */
export async function sendStreakReminderSMS(
  userId: string,
  currentStreak: number,
  message: string
): Promise<SMSNotificationResult> {
  const preferences = await db.userNotificationPreferences.findUnique({
    where: { userId },
    select: { smsNotifications: true, smsStreakReminders: true },
  });

  if (!preferences?.smsNotifications || !preferences?.smsStreakReminders) {
    logger.debug('[SMSChannel] Streak SMS reminders disabled for user', { userId });
    return {
      success: false,
      error: 'Streak SMS reminders disabled by user',
      errorCode: 'STREAK_SMS_DISABLED',
    };
  }

  return sendSMSToUser(userId, {
    message: `[SAM] ${message} Your ${currentStreak}-day streak is at risk!`,
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const smsRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_SMS_PER_HOUR = 5;

/**
 * Check if user is within SMS rate limits
 */
export function checkSMSRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
} {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  const userLimit = smsRateLimit.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    // No existing limit or expired
    return {
      allowed: true,
      remaining: MAX_SMS_PER_HOUR,
    };
  }

  if (userLimit.count >= MAX_SMS_PER_HOUR) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(userLimit.resetAt),
    };
  }

  return {
    allowed: true,
    remaining: MAX_SMS_PER_HOUR - userLimit.count,
    resetAt: new Date(userLimit.resetAt),
  };
}

/**
 * Record SMS send for rate limiting
 */
export function recordSMSSend(userId: string): void {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  const existing = smsRateLimit.get(userId);

  if (!existing || existing.resetAt < now) {
    smsRateLimit.set(userId, {
      count: 1,
      resetAt: now + hourInMs,
    });
  } else {
    smsRateLimit.set(userId, {
      ...existing,
      count: existing.count + 1,
    });
  }
}

/**
 * Send SMS with rate limiting
 */
export async function sendRateLimitedSMS(
  userId: string,
  payload: SMSNotificationPayload
): Promise<SMSNotificationResult> {
  const rateCheck = checkSMSRateLimit(userId);

  if (!rateCheck.allowed) {
    logger.warn('[SMSChannel] SMS rate limit exceeded', {
      userId,
      resetAt: rateCheck.resetAt,
    });

    return {
      success: false,
      error: 'Rate limit exceeded',
      errorCode: 'RATE_LIMITED',
    };
  }

  const result = await sendSMSToUser(userId, payload);

  if (result.success) {
    recordSMSSend(userId);
  }

  return result;
}
