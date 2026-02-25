import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withCronAuth } from '@/lib/api/cron-auth';

// ============================================================================
// CRON: Spaced Repetition Review Reminders
// Schedule: Twice daily (9 AM and 6 PM)
// Purpose: Send reminders for overdue and due-today reviews
// ============================================================================

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(request);
    if (authResponse) return authResponse;

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

    const pendingUserIds = usersWithPendingReviews
      .filter(u => u._count.id > 0)
      .map(u => u.userId);

    // Batch-fetch overdue counts per user (eliminates N+1)
    const overdueByUser = pendingUserIds.length > 0
      ? await db.spacedRepetitionSchedule.groupBy({
          by: ['userId'],
          where: {
            userId: { in: pendingUserIds },
            nextReviewDate: { lt: startOfDay },
          },
          _count: { id: true },
        })
      : [];
    const overdueMap = new Map(overdueByUser.map(g => [g.userId, g._count.id]));

    // Batch-fetch dueToday counts per user (eliminates N+1)
    const dueTodayByUser = pendingUserIds.length > 0
      ? await db.spacedRepetitionSchedule.groupBy({
          by: ['userId'],
          where: {
            userId: { in: pendingUserIds },
            nextReviewDate: { gte: startOfDay, lte: endOfDay },
          },
          _count: { id: true },
        })
      : [];
    const dueTodayMap = new Map(dueTodayByUser.map(g => [g.userId, g._count.id]));

    // Batch-fetch existing reminders sent today (eliminates N+1)
    const existingReminders = pendingUserIds.length > 0
      ? await db.sAMIntervention.findMany({
          where: {
            userId: { in: pendingUserIds },
            type: 'STREAK_REMINDER',
            createdAt: { gte: startOfDay },
          },
          select: { userId: true },
          distinct: ['userId'],
          take: 1000,
        })
      : [];
    const alreadyRemindedSet = new Set(existingReminders.map(r => r.userId));

    // Batch-fetch notification preferences for all pending users (eliminates N+1)
    const allUserPrefs = pendingUserIds.length > 0
      ? await db.userNotificationPreferences.findMany({
          where: { userId: { in: pendingUserIds } },
          select: { userId: true, pushNotifications: true, pushCourseReminders: true },
        })
      : [];
    const prefsMap = new Map(allUserPrefs.map(p => [p.userId, p]));

    for (const userGroup of usersWithPendingReviews) {
      const userId = userGroup.userId;
      const totalPending = userGroup._count.id;

      // Only create reminders if there are actually pending reviews
      if (totalPending === 0) continue;

      // Check if we already sent a reminder today (from batch-fetched set)
      if (alreadyRemindedSet.has(userId)) {
        logger.info(`[CRON] Skipping user ${userId} - already reminded today`);
        continue;
      }

      const overdueCount = overdueMap.get(userId) ?? 0;
      const dueTodayCount = dueTodayMap.get(userId) ?? 0;

      // Create intervention message
      const message = buildReminderMessage(overdueCount, dueTodayCount);
      const priority = overdueCount > 5 ? 'HIGH' : overdueCount > 0 ? 'MEDIUM' : 'LOW';

      // Create SAM intervention
      try {
        await db.sAMIntervention.create({
          data: {
            userId,
            type: 'STREAK_REMINDER',
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
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`[CRON] Failed to create intervention for user ${userId}: ${errMsg}`);
      }

      // Create in-app notification if user has notifications enabled (from batch-fetched prefs)
      try {
        const userPrefs = prefsMap.get(userId);
        const pushEnabled = userPrefs?.pushNotifications ?? false;
        const remindersEnabled = userPrefs?.pushCourseReminders ?? false;

        if (pushEnabled && remindersEnabled && (overdueCount > 0 || dueTodayCount > 0)) {
          await db.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              type: 'system',
              title: 'Review Reminder',
              message: buildShortMessage(overdueCount, dueTodayCount),
            },
          });
          notificationsCreated++;
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`[CRON] Failed to create notification for user ${userId}: ${errMsg}`);
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
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[CRON] Error sending review reminders: ${errMsg}`);
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
    take: 2000,
  });

  // Calculate new retention values and collect updates for batch processing
  const updates: Array<{ id: string; retentionEstimate: number }> = [];

  for (const schedule of schedules) {
    const daysSinceReview = Math.floor(
      (Date.now() - schedule.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReview <= 0) continue;

    const stability = schedule.interval * schedule.easeFactor;
    const newRetention = Math.round(Math.exp(-daysSinceReview / stability) * 100);

    // Only update if changed significantly (> 1% difference)
    if (Math.abs(newRetention - schedule.retentionEstimate) > 1) {
      updates.push({
        id: schedule.id,
        retentionEstimate: Math.max(0, Math.min(100, newRetention)),
      });
    }
  }

  // Batch updates using $transaction to reduce round-trips (eliminates N+1)
  if (updates.length > 0) {
    // Group by retention value to use updateMany where possible
    const byRetention = new Map<number, string[]>();
    for (const u of updates) {
      const ids = byRetention.get(u.retentionEstimate) ?? [];
      ids.push(u.id);
      byRetention.set(u.retentionEstimate, ids);
    }

    await db.$transaction(
      Array.from(byRetention.entries()).map(([retentionEstimate, ids]) =>
        db.spacedRepetitionSchedule.updateMany({
          where: { id: { in: ids } },
          data: { retentionEstimate },
        })
      )
    );
  }

  return { updated: updates.length };
}
