/**
 * SAM Check-In Scheduler API
 * Manages proactive check-ins for user engagement
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaCheckInStore } from '@/lib/sam/stores';
import {
  createCheckInScheduler,
  CheckInType,
  CheckInStatus,
  NotificationChannel,
  TriggerType,
} from '@sam-ai/agentic';

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

const GetCheckInsQuerySchema = z.object({
  status: z
    .enum(['scheduled', 'pending', 'sent', 'responded', 'expired', 'cancelled'])
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const CreateCheckInSchema = z.object({
  type: z.enum([
    'daily_reminder',
    'progress_check',
    'struggle_detection',
    'milestone_celebration',
    'inactivity_reengagement',
    'goal_review',
    'weekly_summary',
    'streak_risk',
    'encouragement',
  ]),
  scheduledTime: z.string().datetime(),
  message: z.string().min(1).max(500),
  triggerConditions: z
    .array(
      z.object({
        type: z.enum([
          'days_inactive',
          'streak_at_risk',
          'mastery_plateau',
          'frustration_detected',
          'goal_behind_schedule',
          'assessment_failed',
          'time_since_last_session',
          'milestone_approaching',
          'weekly_review_due',
        ]),
        threshold: z.number(),
        comparison: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
      })
    )
    .optional()
    .default([]),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        type: z.enum(['text', 'single_choice', 'multiple_choice', 'scale', 'yes_no', 'emoji']),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  suggestedActions: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        type: z.enum([
          'start_activity',
          'review_content',
          'take_break',
          'adjust_goal',
          'contact_mentor',
          'view_progress',
          'complete_review',
        ]),
        priority: z.enum(['high', 'medium', 'low']),
      })
    )
    .optional()
    .default([]),
  channel: z.enum(['in_app', 'push', 'email', 'sms']).optional().default('in_app'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  planId: z.string().optional(),
  courseId: z.string().optional(),
});

const CheckInResponseSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
    })
  ),
  selectedActions: z.array(z.string()),
  feedback: z.string().max(500).optional(),
  emotionalState: z.string().optional(),
});

// ============================================================================
// GET - Get check-ins for the user
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetCheckInsQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });

    const checkInScheduler = getCheckInScheduler();

    let checkIns;
    if (query.from && query.to) {
      checkIns = await checkInStore.getScheduled(
        session.user.id,
        new Date(query.from),
        new Date(query.to)
      );
    } else {
      checkIns = await checkInScheduler.getUserCheckIns(
        session.user.id,
        query.status as CheckInStatus | undefined
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        checkIns,
        count: checkIns.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching check-ins:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new check-in
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateCheckInSchema.parse(body);

    const checkInScheduler = getCheckInScheduler();

    const checkIn = await checkInScheduler.scheduleCheckIn({
      userId: session.user.id,
      type: validated.type as CheckInType,
      scheduledTime: new Date(validated.scheduledTime),
      triggerConditions: validated.triggerConditions.map((tc, index) => ({
        type: tc.type as TriggerType,
        threshold: tc.threshold,
        comparison: tc.comparison,
        met: false,
      })),
      message: validated.message,
      questions: validated.questions.map((q, index) => ({
        id: `q-${index}`,
        question: q.question,
        type: q.type as 'text' | 'single_choice' | 'multiple_choice' | 'scale' | 'yes_no' | 'emoji',
        options: q.options,
        required: q.required,
        order: index + 1,
      })),
      suggestedActions: validated.suggestedActions.map((a, index) => ({
        id: `a-${index}`,
        title: a.title,
        description: a.description,
        type: a.type as 'start_activity' | 'review_content' | 'take_break' | 'adjust_goal' | 'contact_mentor' | 'view_progress' | 'complete_review',
        priority: a.priority,
      })),
      channel: validated.channel as NotificationChannel,
      planId: validated.planId,
      courseId: validated.courseId,
      priority: validated.priority,
    });

    logger.info(`Created check-in ${checkIn.id} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: { checkIn },
    });
  } catch (error) {
    logger.error('Error creating check-in:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid check-in data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
