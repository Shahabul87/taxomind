import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

// ============================================================================
// CRON: Spaced Repetition Review Reminders
// Schedule: Twice daily (9 AM and 6 PM)
// Purpose: Send reminders for overdue and due-today reviews
// ============================================================================

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('[CRON] Starting spaced repetition review reminders...');

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Get users with pending reviews (overdue or due today)
    const usersWithPendingReviews = await db.spacedRepetitionSchedule.groupBy({
      by: ['userId'],
      where: {
        nextReviewDate: { lte: endOfDay },
      },
      _count: {
        id: true,
      },
    });

    logger.info(
      `[CRON] Found ${usersWithPendingReviews.length} users with pending reviews`
    );

    let interventionsCreated = 0;
    let notificationsCreated = 0;

    for (const userGroup of usersWithPendingReviews) {
      const userId = userGroup.userId;
      const totalPending = userGroup._count.id;

      // Get detailed breakdown
      const overdueCount = await db.spacedRepetitionSchedule.count({
        where: {
          userId,
          nextReviewDate: { lt: startOfDay },
        },
      });

      const dueTodayCount = await db.spacedRepetitionSchedule.count({
        where: {
          userId,
          nextReviewDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Only create reminders if there are actually pending reviews
      if (totalPending === 0) continue;

      // Check if we already sent a reminder today
      const existingReminder = await db.sAMIntervention.findFirst({
        where: {
          userId,
          type: 'REVIEW_REMINDER',
          createdAt: {
            gte: startOfDay,
          },
        },
      });

      if (existingReminder) {
        logger.info(`[CRON] Skipping user ${userId} - already reminded today`);
        continue;
      }

      // Create intervention message
      const message = buildReminderMessage(overdueCount, dueTodayCount);
      const priority = overdueCount > 5 ? 'HIGH' : overdueCount > 0 ? 'MEDIUM' : 'LOW';

      // Create SAM intervention
      try {
        await db.sAMIntervention.create({
          data: {
            userId,
            type: 'REVIEW_REMINDER',
            priority,
            message,
            suggestedActions: {
              overdueCount,
              dueTodayCount,
              totalPending,
              actionType: 'SPACED_REPETITION_REVIEW',
              route: '/practice/reviews',
            },
          },
        });
        interventionsCreated++;
      } catch (error) {
        logger.warn(`[CRON] Failed to create intervention for user ${userId}:`, error);
      }

      // Create push notification if user has push enabled
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { id: true, notificationPrefs: true },
        });

        const notificationPrefs = user?.notificationPrefs as Record<string, boolean> | null;
        const pushEnabled = notificationPrefs?.pushEnabled ?? false;

        if (pushEnabled && (overdueCount > 0 || dueTodayCount > 0)) {
          await db.pushNotificationQueue.create({
            data: {
              userId,
              type: 'REVIEW_REMINDER',
              title: 'Review Reminder',
              body: buildShortMessage(overdueCount, dueTodayCount),
              data: {
                route: '/practice/reviews',
                overdueCount,
                dueTodayCount,
              },
            },
          });
          notificationsCreated++;
        }
      } catch (error) {
        logger.warn(`[CRON] Failed to create push notification for user ${userId}:`, error);
      }
    }

    // Also update retention estimates for all users with schedules
    const updateRetentionResult = await updateAllRetentionEstimates();

    logger.info('[CRON] Spaced repetition review reminders complete');
    logger.info(`[CRON] - Users processed: ${usersWithPendingReviews.length}`);
    logger.info(`[CRON] - Interventions created: ${interventionsCreated}`);
    logger.info(`[CRON] - Push notifications created: ${notificationsCreated}`);
    logger.info(`[CRON] - Retention estimates updated: ${updateRetentionResult.updated}`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Review reminders sent',
        stats: {
          usersProcessed: usersWithPendingReviews.length,
          interventionsCreated,
          notificationsCreated,
          retentionEstimatesUpdated: updateRetentionResult.updated,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[CRON] Error sending review reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send review reminders' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildReminderMessage(overdueCount: number, dueTodayCount: number): string {
  const parts: string[] = [];

  if (overdueCount > 0) {
    parts.push(
      `${overdueCount} overdue review${overdueCount > 1 ? 's' : ''} waiting for you`
    );
  }

  if (dueTodayCount > 0) {
    parts.push(
      `${dueTodayCount} review${dueTodayCount > 1 ? 's' : ''} due today`
    );
  }

  if (parts.length === 0) {
    return 'You have reviews scheduled for soon. Stay ahead of your learning!';
  }

  const main = parts.join(' and ');
  const urgency =
    overdueCount > 5
      ? 'Complete them soon to maintain your retention!'
      : 'A quick review session will help reinforce your learning.';

  return `📚 ${main}. ${urgency}`;
}

function buildShortMessage(overdueCount: number, dueTodayCount: number): string {
  const total = overdueCount + dueTodayCount;
  if (overdueCount > 0) {
    return `You have ${total} review${total > 1 ? 's' : ''} waiting (${overdueCount} overdue)`;
  }
  return `You have ${total} review${total > 1 ? 's' : ''} due today`;
}

async function updateAllRetentionEstimates(): Promise<{ updated: number }> {
  // Update retention estimates using the forgetting curve formula
  // R = e^(-t/S) where S is stability (interval * easeFactor)

  const schedules = await db.spacedRepetitionSchedule.findMany({
    select: {
      id: true,
      updatedAt: true,
      interval: true,
      easeFactor: true,
      retentionEstimate: true,
    },
  });

  let updated = 0;

  for (const schedule of schedules) {
    const daysSinceReview = Math.floor(
      (Date.now() - schedule.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReview <= 0) continue;

    const stability = schedule.interval * schedule.easeFactor;
    const newRetention = Math.round(Math.exp(-daysSinceReview / stability) * 100);

    // Only update if changed significantly (> 1% difference)
    if (Math.abs(newRetention - schedule.retentionEstimate) > 1) {
      await db.spacedRepetitionSchedule.update({
        where: { id: schedule.id },
        data: { retentionEstimate: Math.max(0, Math.min(100, newRetention)) },
      });
      updated++;
    }
  }

  return { updated };
}
