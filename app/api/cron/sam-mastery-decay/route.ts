/**
 * SAM Mastery Decay Alerts Cron Job
 *
 * Runs daily to identify skills at risk of decay and sends
 * notifications to users encouraging them to review.
 *
 * Schedule: Runs daily at 8:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getStore, getPracticeStores } from '@/lib/sam/taxomind-context';

const CRON_SECRET = process.env.CRON_SECRET;

const querySchema = z.object({
  dryRun: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(10).max(1000).optional().default(100),
  retentionThreshold: z.coerce.number().min(0).max(100).optional().default(70),
});

// ============================================================================
// TYPES
// ============================================================================

interface DecayAlert {
  userId: string;
  skillId: string;
  skillName: string;
  currentRetention: number;
  daysUntilLevelDrop?: number;
  riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedReviewDate?: Date;
}

interface CronResult {
  usersProcessed: number;
  alertsSent: number;
  skillsAtRisk: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  durationMs: number;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron authentication
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('[SAM_MASTERY_DECAY] Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      dryRun: searchParams.get('dryRun') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      retentionThreshold: searchParams.get('retentionThreshold') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { dryRun, limit, retentionThreshold } = parsed.data;

    logger.info('[SAM_MASTERY_DECAY] Starting mastery decay check', {
      dryRun,
      limit,
      retentionThreshold,
    });

    // Get all active users with skill profiles
    const activeUsers = await getActiveUsersWithSkills(limit);

    const allAlerts: DecayAlert[] = [];
    let usersProcessed = 0;

    const skillBuildTrackStore = getStore('skillBuildTrack');
    const { spacedRepetition } = getPracticeStores();

    // Process each user
    for (const userId of activeUsers) {
      try {
        // Get user&apos;s skill profiles
        const profiles = await skillBuildTrackStore.getUserSkillProfiles(userId);

        // Get spaced repetition stats
        const reviewStats = await spacedRepetition.getStats(userId);

        // Identify skills at risk
        for (const profile of profiles) {
          const isAtRisk =
            profile.decay.riskLevel === 'HIGH' ||
            profile.decay.riskLevel === 'CRITICAL' ||
            (profile.decay.riskLevel === 'MEDIUM' && profile.dimensions.retention < retentionThreshold);

          if (isAtRisk) {
            allAlerts.push({
              userId,
              skillId: profile.skillId,
              skillName: profile.skill?.name ?? profile.skillId,
              currentRetention: profile.dimensions.retention,
              daysUntilLevelDrop: profile.decay.daysUntilLevelDrop,
              riskLevel: profile.decay.riskLevel as 'MEDIUM' | 'HIGH' | 'CRITICAL',
              recommendedReviewDate: profile.decay.recommendedReviewDate,
            });
          }
        }

        // Also check spaced repetition overdue items
        if (reviewStats.overdueCount > 0) {
          const overdueReviews = await spacedRepetition.getOverdueReviews(userId, 5);
          for (const review of overdueReviews) {
            // Only add if not already in alerts
            const exists = allAlerts.some(
              (a) => a.userId === userId && a.skillId === review.conceptId
            );
            if (!exists) {
              allAlerts.push({
                userId,
                skillId: review.conceptId,
                skillName: review.conceptName || review.conceptId,
                currentRetention: review.retentionEstimate,
                riskLevel: review.priority === 'urgent' ? 'CRITICAL' : review.priority === 'high' ? 'HIGH' : 'MEDIUM',
              });
            }
          }
        }

        usersProcessed++;
      } catch (error) {
        logger.warn('[SAM_MASTERY_DECAY] Error processing user', { userId, error });
      }
    }

    // Group alerts by user
    const alertsByUser = groupAlertsByUser(allAlerts);

    // Send notifications (unless dry run)
    let alertsSent = 0;
    if (!dryRun) {
      alertsSent = await sendDecayNotifications(alertsByUser);
    }

    // Calculate statistics
    const criticalCount = allAlerts.filter((a) => a.riskLevel === 'CRITICAL').length;
    const highCount = allAlerts.filter((a) => a.riskLevel === 'HIGH').length;
    const mediumCount = allAlerts.filter((a) => a.riskLevel === 'MEDIUM').length;

    // Store metrics
    await storeDecayMetrics({
      usersProcessed,
      alertsSent,
      skillsAtRisk: allAlerts.length,
      criticalCount,
      highCount,
      mediumCount,
    });

    const result: CronResult = {
      usersProcessed,
      alertsSent,
      skillsAtRisk: allAlerts.length,
      criticalCount,
      highCount,
      mediumCount,
      durationMs: Date.now() - startTime,
    };

    logger.info('[SAM_MASTERY_DECAY] Mastery decay check complete', result);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        dryRun,
        usersWithAlerts: Object.keys(alertsByUser).length,
        topAtRiskSkills: getTopAtRiskSkills(allAlerts, 10),
      },
    });
  } catch (error) {
    logger.error('[SAM_MASTERY_DECAY] Error running mastery decay check:', error);
    return NextResponse.json(
      { error: 'Failed to run mastery decay check' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get active users with skill profiles
 */
async function getActiveUsersWithSkills(limit: number): Promise<string[]> {
  // Get users who have been active in the last 30 days and have skill profiles
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const profiles = await db.skillBuildProfile.findMany({
    where: {
      lastPracticedAt: { gte: thirtyDaysAgo },
    },
    select: { userId: true },
    distinct: ['userId'],
    take: limit,
  });

  return profiles.map((p) => p.userId);
}

/**
 * Group alerts by user
 */
function groupAlertsByUser(alerts: DecayAlert[]): Record<string, DecayAlert[]> {
  return alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.userId]) {
        acc[alert.userId] = [];
      }
      acc[alert.userId].push(alert);
      return acc;
    },
    {} as Record<string, DecayAlert[]>
  );
}

/**
 * Send decay notifications to users
 */
async function sendDecayNotifications(
  alertsByUser: Record<string, DecayAlert[]>
): Promise<number> {
  let notificationsSent = 0;

  for (const [userId, alerts] of Object.entries(alertsByUser)) {
    try {
      // Sort by risk level
      const sortedAlerts = alerts.sort((a, b) => {
        const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });

      const criticalAlerts = sortedAlerts.filter((a) => a.riskLevel === 'CRITICAL');
      const highAlerts = sortedAlerts.filter((a) => a.riskLevel === 'HIGH');

      // Build notification message
      let title = 'Skill Review Reminder';
      let message = '';

      if (criticalAlerts.length > 0) {
        title = `${criticalAlerts.length} Skill${criticalAlerts.length > 1 ? 's' : ''} Need Urgent Review`;
        message = `Your ${criticalAlerts.map((a) => a.skillName).slice(0, 3).join(', ')} skill${criticalAlerts.length > 1 ? 's are' : ' is'} at critical retention levels. Review now to prevent skill decay.`;
      } else if (highAlerts.length > 0) {
        title = 'Time to Review Your Skills';
        message = `${highAlerts.length} skill${highAlerts.length > 1 ? 's are' : ' is'} approaching decay. A quick review session would help maintain your progress.`;
      } else {
        title = 'Skill Maintenance Reminder';
        message = `${alerts.length} skill${alerts.length > 1 ? 's could' : ' could'} use some practice to maintain optimal retention.`;
      }

      // Create notification
      await db.notification.create({
        data: {
          userId,
          type: 'reminder',
          title,
          message,
          data: {
            type: 'mastery_decay',
            skillCount: alerts.length,
            criticalCount: criticalAlerts.length,
            highCount: highAlerts.length,
            topSkills: sortedAlerts.slice(0, 5).map((a) => ({
              id: a.skillId,
              name: a.skillName,
              retention: a.currentRetention,
              riskLevel: a.riskLevel,
            })),
          },
        },
      });

      notificationsSent++;

      // For critical alerts, also try to send push notification if available
      if (criticalAlerts.length > 0) {
        try {
          // Check if user has push tokens
          const pushTokens = await db.pushSubscription.findMany({
            where: { userId },
            take: 3,
          });

          if (pushTokens.length > 0) {
            // Queue push notification
            await db.sAMPushQueueItem.create({
              data: {
                userId,
                type: 'MASTERY_DECAY_CRITICAL',
                payload: {
                  title,
                  body: message.slice(0, 150),
                  data: {
                    type: 'mastery_decay',
                    action: 'open_review',
                  },
                },
                priority: 'HIGH',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              },
            });
          }
        } catch (pushError) {
          // Push notification is optional, don&apos;t fail the whole process
          logger.warn('[SAM_MASTERY_DECAY] Failed to queue push notification', { userId, error: pushError });
        }
      }
    } catch (error) {
      logger.warn('[SAM_MASTERY_DECAY] Failed to send notification to user', { userId, error });
    }
  }

  return notificationsSent;
}

/**
 * Store decay metrics for monitoring
 */
async function storeDecayMetrics(metrics: Omit<CronResult, 'durationMs'>): Promise<void> {
  try {
    await db.sAMObservabilityMetrics.create({
      data: {
        component: 'mastery-decay-alerts',
        metricName: 'skills_at_risk',
        metricValue: metrics.skillsAtRisk,
        sampleCount: metrics.usersProcessed,
        tags: {
          alertsSent: metrics.alertsSent,
          criticalCount: metrics.criticalCount,
          highCount: metrics.highCount,
          mediumCount: metrics.mediumCount,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.warn('[SAM_MASTERY_DECAY] Failed to store metrics:', error);
  }
}

/**
 * Get top at-risk skills across all users
 */
function getTopAtRiskSkills(
  alerts: DecayAlert[],
  limit: number
): Array<{ skillName: string; atRiskCount: number; avgRetention: number }> {
  const skillStats = new Map<string, { count: number; totalRetention: number }>();

  for (const alert of alerts) {
    const existing = skillStats.get(alert.skillName) || { count: 0, totalRetention: 0 };
    existing.count++;
    existing.totalRetention += alert.currentRetention;
    skillStats.set(alert.skillName, existing);
  }

  return Array.from(skillStats.entries())
    .map(([skillName, stats]) => ({
      skillName,
      atRiskCount: stats.count,
      avgRetention: Math.round(stats.totalRetention / stats.count),
    }))
    .sort((a, b) => b.atRiskCount - a.atRiskCount)
    .slice(0, limit);
}
