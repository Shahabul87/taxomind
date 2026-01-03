/**
 * SAM Check-In Scheduler Cron Job
 * Processes pending check-ins and sends notifications
 *
 * Phase 4: Proactive Features
 * - Runs every hour via Vercel/Railway cron
 * - Triggers scheduled check-ins
 * - Sends notifications through configured channels
 *
 * Cron configuration (add to vercel.json or cron provider):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sam-checkins",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { PrismaCheckInStore } from '@/lib/sam/stores';
import { sendAgenticNotification } from '@/lib/sam/agentic-notifications';
import {
  createCheckInScheduler,
  CheckInStatus,
  NotificationChannel,
  type ScheduledCheckIn,
  type TriggerCondition,
} from '@sam-ai/agentic';

// Cron secret for authorization (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

// Initialize stores
const checkInStore = new PrismaCheckInStore();

// Lazy initialize check-in scheduler
let checkInSchedulerInstance: ReturnType<typeof createCheckInScheduler> | null = null;

function getCheckInScheduler() {
  if (!checkInSchedulerInstance) {
    checkInSchedulerInstance = createCheckInScheduler({
      store: checkInStore,
      logger: console,
      defaultChannel: NotificationChannel.IN_APP,
    });
  }
  return checkInSchedulerInstance;
}

// ============================================================================
// Notification Sending
// ============================================================================

interface NotificationPayload {
  userId: string;
  checkInId: string;
  message: string;
  channel: string;
  priority: string;
  actionUrl?: string;
}

async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { userId, checkInId, message, channel, priority } = payload;

  try {
    const actionUrl = payload.actionUrl ?? `/dashboard/learning?checkin=${checkInId}`;
    const channels: Array<'auto' | 'in_app' | 'push' | 'email' | 'sms'> = channel === 'in_app'
      ? ['auto']
      : ['in_app', channel as 'push' | 'email' | 'sms'];

    await sendAgenticNotification({
      userId,
      title: 'SAM Learning Check-In',
      message,
      type: `SAM_CHECK_IN:${priority}:${checkInId}`,
      priority: priority as 'low' | 'medium' | 'high' | 'critical',
      actionUrl,
      channels,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send notification:', { error, userId, checkInId });
    return false;
  }
}

// ============================================================================
// GET - Process pending check-ins (cron endpoint)
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron authorization
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkInScheduler = getCheckInScheduler();

    // Get all pending check-ins that are due
    const now = new Date();
    const pendingCheckIns = await checkInStore.getAllScheduled(
      new Date(0), // From beginning
      now // Up to now
    );

    // Filter to only scheduled (not yet sent) check-ins
    const dueCheckIns = pendingCheckIns.filter(
      (checkIn) => checkIn.status === 'scheduled' && new Date(checkIn.scheduledTime) <= now
    );

    logger.info(`[SAM_CHECKINS_CRON] Processing ${dueCheckIns.length} due check-ins`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const checkIn of dueCheckIns) {
      try {
        results.processed++;

        // Evaluate trigger conditions if any
        let shouldSend = true;
        if (checkIn.triggerConditions && checkIn.triggerConditions.length > 0) {
          // Simple evaluation: check if all conditions are marked as met
          shouldSend = checkIn.triggerConditions.every((tc) => tc.met);
        }

        if (!shouldSend) {
          results.skipped++;
          logger.debug(`Skipped check-in ${checkIn.id} - conditions not met`);
          continue;
        }

        // Send notification
        const notificationSent = await sendNotification({
          userId: checkIn.userId,
          checkInId: checkIn.id,
          message: checkIn.message,
          channel: checkIn.channel,
          priority: checkIn.priority,
        });

        if (notificationSent) {
          // Mark as sent using the store
          await checkInStore.updateStatus(checkIn.id, CheckInStatus.SENT);
          results.sent++;
          logger.info(`Sent check-in ${checkIn.id} to user ${checkIn.userId}`);
        } else {
          results.failed++;
          logger.warn(`Failed to send check-in ${checkIn.id}`);
        }
      } catch (checkInError) {
        results.failed++;
        logger.error(`Error processing check-in ${checkIn.id}:`, checkInError);
      }
    }

    // Expire old unresponded check-ins (older than 48 hours)
    const expirationThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    let expired = 0;

    try {
      const oldPendingCheckIns = await checkInStore.getAllScheduled(
        new Date(0),
        expirationThreshold
      );

      const toExpire = oldPendingCheckIns.filter(
        (checkIn) => checkIn.status === 'sent' || checkIn.status === 'pending'
      );

      for (const checkIn of toExpire) {
        await checkInStore.updateStatus(checkIn.id, CheckInStatus.EXPIRED);
        expired++;
      }

      if (expired > 0) {
        logger.info(`Expired ${expired} old unresponded check-ins`);
      }
    } catch (expireError) {
      logger.error('Error expiring old check-ins:', expireError);
    }

    const duration = Date.now() - startTime;

    logger.info('[SAM_CHECKINS_CRON] Completed', {
      duration,
      ...results,
      expired,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        expired,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[SAM_CHECKINS_CRON] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process check-ins',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Manually trigger check-in processing (for testing)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('Unauthorized manual cron trigger attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the GET handler
    return GET(req);
  } catch (error) {
    logger.error('[SAM_CHECKINS_CRON] Manual trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger check-in processing' },
      { status: 500 }
    );
  }
}
