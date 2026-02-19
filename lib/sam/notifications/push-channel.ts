/**
 * Push Notification Channel (Firebase Cloud Messaging)
 *
 * Implements push notifications for SAM AI using Firebase Cloud Messaging.
 * Supports web push, iOS (via APNs through FCM), and Android.
 *
 * Requirements:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
  clickAction?: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  failedTokens?: string[];
}

interface FirebaseMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  webpush?: {
    notification?: {
      icon?: string;
      badge?: string;
    };
    fcmOptions?: {
      link?: string;
    };
  };
  data?: Record<string, string>;
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Firebase Admin type - using generic interface to avoid requiring firebase-admin at build time
interface FirebaseAdminLike {
  apps: unknown[];
  initializeApp: (options: unknown) => void;
  credential: {
    cert: (config: { projectId: string; privateKey: string; clientEmail: string }) => unknown;
  };
  messaging: () => {
    send: (message: FirebaseMessage) => Promise<string>;
  };
}

let firebaseAdmin: FirebaseAdminLike | null = null;
let isFirebaseInitialized = false;

async function getFirebaseAdmin(): Promise<FirebaseAdminLike | null> {
  if (firebaseAdmin && isFirebaseInitialized) {
    return firebaseAdmin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    logger.debug('[PushChannel] Firebase not configured - missing credentials');
    return null;
  }

  try {
    // Dynamic import to avoid build errors when firebase-admin is not installed
    const admin = await import('firebase-admin').catch(() => null);

    if (!admin) {
      logger.debug('[PushChannel] firebase-admin module not installed');
      return null;
    }

    firebaseAdmin = admin as unknown as FirebaseAdminLike;

    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });
    }

    isFirebaseInitialized = true;
    logger.info('[PushChannel] Firebase Admin initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    logger.error('[PushChannel] Failed to initialize Firebase Admin', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// ============================================================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Check if push notifications are available
 */
export function isPushAvailable(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  );
}

/**
 * Send push notification to a single device token
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const admin = await getFirebaseAdmin();

  if (!admin) {
    return {
      success: false,
      error: 'Firebase not configured',
    };
  }

  try {
    const message: FirebaseMessage = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          icon: payload.icon ?? '/icons/sam-icon-192.png',
          badge: payload.badge ?? '/icons/badge-72.png',
        },
        fcmOptions: payload.clickAction
          ? { link: payload.clickAction }
          : undefined,
      },
      data: payload.data,
    };

    const result = await admin.messaging().send(message);

    logger.info('[PushChannel] Push notification sent successfully', {
      messageId: result,
      token: deviceToken.slice(0, 20) + '...',
    });

    return {
      success: true,
      messageId: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle invalid token errors
    if (
      errorMessage.includes('not registered') ||
      errorMessage.includes('invalid token') ||
      errorMessage.includes('Requested entity was not found')
    ) {
      logger.warn('[PushChannel] Invalid device token, marking as inactive', {
        token: deviceToken.slice(0, 20) + '...',
      });

      // Mark token as inactive in database
      await markTokenInactive(deviceToken);

      return {
        success: false,
        error: 'Invalid device token',
        failedTokens: [deviceToken],
      };
    }

    logger.error('[PushChannel] Failed to send push notification', {
      error: errorMessage,
      token: deviceToken.slice(0, 20) + '...',
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send push notification to a user (all their active devices)
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  // Get all active device tokens for the user
  const deviceTokens = await db.userDeviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      token: true,
    },
  });

  if (deviceTokens.length === 0) {
    logger.debug('[PushChannel] No active device tokens for user', { userId });
    return {
      success: false,
      error: 'No active device tokens',
    };
  }

  const results = await Promise.allSettled(
    deviceTokens.map((dt) => sendPushNotification(dt.token, payload))
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  const failedTokens = results
    .filter(
      (r): r is PromiseFulfilledResult<PushNotificationResult> =>
        r.status === 'fulfilled' && !r.value.success
    )
    .flatMap((r) => r.value.failedTokens ?? []);

  logger.info('[PushChannel] Push notifications sent to user', {
    userId,
    totalDevices: deviceTokens.length,
    successCount,
    failedCount: deviceTokens.length - successCount,
  });

  return {
    success: successCount > 0,
    failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
    error:
      successCount === 0
        ? 'All notifications failed'
        : failedTokens.length > 0
          ? `${failedTokens.length} notifications failed`
          : undefined,
  };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  return {
    sent,
    failed: userIds.length - sent,
  };
}

// ============================================================================
// DEVICE TOKEN MANAGEMENT
// ============================================================================

/**
 * Register a new device token for a user
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'IOS' | 'ANDROID' | 'WEB' = 'WEB',
  metadata?: { deviceName?: string; userAgent?: string }
): Promise<{ success: boolean; tokenId?: string; error?: string }> {
  try {
    const deviceToken = await db.userDeviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        deviceName: metadata?.deviceName,
        userAgent: metadata?.userAgent,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        isActive: true,
        lastUsedAt: new Date(),
        deviceName: metadata?.deviceName,
        userAgent: metadata?.userAgent,
      },
    });

    logger.info('[PushChannel] Device token registered', {
      userId,
      platform,
      tokenId: deviceToken.id,
    });

    return {
      success: true,
      tokenId: deviceToken.id,
    };
  } catch (error) {
    logger.error('[PushChannel] Failed to register device token', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unregister a device token
 */
export async function unregisterDeviceToken(
  token: string
): Promise<{ success: boolean }> {
  try {
    await db.userDeviceToken.update({
      where: { token },
      data: { isActive: false },
    });

    logger.info('[PushChannel] Device token unregistered', {
      token: token.slice(0, 20) + '...',
    });

    return { success: true };
  } catch (error) {
    logger.error('[PushChannel] Failed to unregister device token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false };
  }
}

/**
 * Mark a token as inactive (called when FCM reports token as invalid)
 */
async function markTokenInactive(token: string): Promise<void> {
  try {
    await db.userDeviceToken.update({
      where: { token },
      data: { isActive: false },
    });
  } catch {
    // Token might not exist, which is fine
  }
}

/**
 * Get user's active device count
 */
export async function getUserDeviceCount(userId: string): Promise<number> {
  return db.userDeviceToken.count({
    where: {
      userId,
      isActive: true,
    },
  });
}

/**
 * Cleanup old inactive tokens
 */
export async function cleanupInactiveTokens(
  olderThanDays: number = 90
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await db.userDeviceToken.deleteMany({
    where: {
      isActive: false,
      lastUsedAt: { lt: cutoff },
    },
  });

  logger.info('[PushChannel] Cleaned up inactive tokens', {
    count: result.count,
    olderThanDays,
  });

  return result.count;
}
