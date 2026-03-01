import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sendPushToUser, isPushAvailable } from '@/lib/sam/notifications';
import { logger } from '@/lib/logger';
import { withCronAuth } from '@/lib/api/cron-auth';

/**
 * Cron job to send push notifications for upcoming study sessions
 * Should be called every minute by a cron scheduler (e.g., Vercel Cron, Railway Cron)
 *
 * Add to vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron/session-notifications", "schedule": "* * * * *" }
 *   ]
 * }
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;

    if (!isPushAvailable()) {
      return Response.json({
        success: false,
        message: 'Push notifications not configured',
      });
    }

    const now = new Date();

    // Find sessions that need notifications:
    // - notifyEnabled is true
    // - notificationSentAt is null (not sent yet)
    // - startTime is within the notification window
    const sessionsToNotify = await db.dashboardStudySession.findMany({
      where: {
        notifyEnabled: true,
        notificationSentAt: null,
        status: 'ACTIVE',
        startTime: {
          // Session starts within the next hour (we'll filter more precisely below)
          lte: new Date(now.getTime() + 60 * 60 * 1000),
          gt: now,
        },
      },
      take: 500,
      include: {
        user: {
          select: { id: true, name: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    const results = {
      checked: sessionsToNotify.length,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    const sentSessionIds: string[] = [];

    for (const session of sessionsToNotify) {
      const sessionStart = new Date(session.startTime);
      const notifyAt = new Date(
        sessionStart.getTime() - session.notifyMinutesBefore * 60 * 1000
      );

      // Check if it's time to send the notification
      if (now >= notifyAt) {
        try {
          const minutesUntil = Math.round(
            (sessionStart.getTime() - now.getTime()) / 60000
          );

          const result = await sendPushToUser(session.userId, {
            title: `Study Session Starting ${minutesUntil <= 1 ? 'Now' : `in ${minutesUntil} min`}`,
            body: session.title,
            icon: '/icons/sam-icon-192.png',
            data: {
              type: 'study_session',
              sessionId: session.id,
              courseId: session.courseId ?? '',
              action: 'start_session',
            },
            clickAction: `/dashboard/user?tab=goals&session=${session.id}`,
          });

          if (result.success) {
            sentSessionIds.push(session.id);
            results.sent++;

            logger.info('[SessionNotificationCron] Notification sent', {
              sessionId: session.id,
              userId: session.userId,
              minutesUntil,
            });
          } else {
            results.failed++;
            logger.error('[SessionNotificationCron] Failed to send notification', {
              sessionId: session.id,
              error: result.error,
            });
          }
        } catch (error) {
          results.failed++;
          logger.error('[SessionNotificationCron] Error sending notification', {
            sessionId: session.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        results.skipped++;
      }
    }

    // Batch-update all successfully sent notifications in a single query
    if (sentSessionIds.length > 0) {
      await db.dashboardStudySession.updateMany({
        where: { id: { in: sentSessionIds } },
        data: { notificationSentAt: now },
      });
    }

    logger.info('[SessionNotificationCron] Completed', results);

    return Response.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[SessionNotificationCron] Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
