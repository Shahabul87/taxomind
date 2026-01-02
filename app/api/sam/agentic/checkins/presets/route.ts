/**
 * SAM Check-In Presets API
 * Quick creation of common check-in types
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaCheckInStore } from '@/lib/sam/stores';
import { createCheckInScheduler, NotificationChannel } from '@sam-ai/agentic';

// Initialize stores
const checkInStore = createPrismaCheckInStore();

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
// VALIDATION SCHEMAS
// ============================================================================

const PresetCheckInSchema = z.object({
  preset: z.enum([
    'daily_reminder',
    'progress_check',
    'weekly_summary',
    'streak_risk',
    'inactivity',
    'milestone',
    'struggle',
  ]),
  scheduledTime: z.string().datetime().optional(),
  planId: z.string().optional(),
  milestoneName: z.string().optional(),
  daysSinceLastActivity: z.number().int().min(1).optional(),
  currentStreak: z.number().int().min(0).optional(),
});

// ============================================================================
// POST - Create a preset check-in
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = PresetCheckInSchema.parse(body);

    const checkInScheduler = getCheckInScheduler();
    const scheduledTime = validated.scheduledTime
      ? new Date(validated.scheduledTime)
      : new Date();

    let checkIn;

    switch (validated.preset) {
      case 'daily_reminder':
        checkIn = await checkInScheduler.createDailyReminder(
          session.user.id,
          scheduledTime,
          validated.planId
        );
        break;

      case 'progress_check':
        checkIn = await checkInScheduler.createProgressCheck(
          session.user.id,
          scheduledTime,
          validated.planId
        );
        break;

      case 'weekly_summary':
        checkIn = await checkInScheduler.createWeeklySummary(
          session.user.id,
          scheduledTime,
          validated.planId
        );
        break;

      case 'streak_risk':
        if (validated.currentStreak === undefined) {
          // Get current streak from database
          const streak = await db.sAMStreak.findFirst({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
          });
          validated.currentStreak = streak?.currentStreak ?? 0;
        }
        checkIn = await checkInScheduler.createStreakRiskCheckIn(
          session.user.id,
          validated.currentStreak
        );
        break;

      case 'inactivity':
        if (validated.daysSinceLastActivity === undefined) {
          // Calculate days since last activity
          const lastSession = await db.sAMInteraction.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
          });
          validated.daysSinceLastActivity = lastSession
            ? Math.floor(
                (Date.now() - lastSession.createdAt.getTime()) / (24 * 60 * 60 * 1000)
              )
            : 7;
        }
        checkIn = await checkInScheduler.createInactivityCheckIn(
          session.user.id,
          validated.daysSinceLastActivity
        );
        break;

      case 'milestone':
        if (!validated.milestoneName) {
          return NextResponse.json(
            { error: 'milestoneName is required for milestone preset' },
            { status: 400 }
          );
        }
        checkIn = await checkInScheduler.createMilestoneCelebration(
          session.user.id,
          validated.milestoneName,
          validated.planId
        );
        break;

      case 'struggle':
        checkIn = await checkInScheduler.createStruggleCheckIn(
          session.user.id,
          [] // No specific trigger conditions, triggered manually
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown preset type' },
          { status: 400 }
        );
    }

    logger.info(
      `Created ${validated.preset} check-in ${checkIn.id} for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: { checkIn },
    });
  } catch (error) {
    logger.error('Error creating preset check-in:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preset data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create preset check-in' },
      { status: 500 }
    );
  }
}
