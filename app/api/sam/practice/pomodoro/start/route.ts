import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import type {
  PracticeFocusLevel,
  BloomsLevel,
} from '@/lib/sam/stores/prisma-practice-session-store';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// Constants
// ============================================================================

const POMODORO_DURATION_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const POMODOROS_BEFORE_LONG_BREAK = 4;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const FocusLevelEnum = z.enum([
  'DEEP_FLOW',
  'HIGH',
  'MEDIUM',
  'LOW',
  'VERY_LOW',
]);

const BloomsLevelEnum = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

const StartPomodoroSchema = z.object({
  skillId: z.string().min(1),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  focusLevel: FocusLevelEnum.optional().default('HIGH'),
  bloomsLevel: BloomsLevelEnum.optional(),
  difficultyRating: z.number().min(1).max(10).optional(),
  pomodoroNumber: z.number().int().min(1).max(20).optional().default(1),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional().default([]),
});

// ============================================================================
// POST - Start a Pomodoro practice session
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = StartPomodoroSchema.parse(body);

    // Check for an active session
    const activeSession = await practiceSessionStore.getActiveSession(session.user.id);
    if (activeSession) {
      return NextResponse.json(
        {
          error: 'Active session exists',
          message: 'You already have an active practice session. Please complete or abandon it first.',
          activeSession,
        },
        { status: 409 }
      );
    }

    // Create a Pomodoro session
    const pomodoroSession = await practiceSessionStore.create({
      userId: session.user.id,
      skillId: validated.skillId,
      courseId: validated.courseId,
      chapterId: validated.chapterId,
      sectionId: validated.sectionId,
      sessionType: 'POMODORO', // Pomodoro sessions get 1.4x multiplier
      focusLevel: validated.focusLevel as PracticeFocusLevel,
      bloomsLevel: validated.bloomsLevel as BloomsLevel | undefined,
      difficultyRating: validated.difficultyRating,
      plannedDurationMinutes: POMODORO_DURATION_MINUTES,
      notes: validated.notes,
      tags: [...validated.tags, `pomodoro-${validated.pomodoroNumber}`],
    });

    // Calculate next break type
    const isLongBreak = validated.pomodoroNumber % POMODOROS_BEFORE_LONG_BREAK === 0;
    const breakDuration = isLongBreak ? LONG_BREAK_MINUTES : SHORT_BREAK_MINUTES;

    logger.info(
      `Started Pomodoro #${validated.pomodoroNumber} for user: ${session.user.id}, skill: ${validated.skillId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        session: pomodoroSession,
        pomodoro: {
          number: validated.pomodoroNumber,
          duration: POMODORO_DURATION_MINUTES,
          endTime: new Date(Date.now() + POMODORO_DURATION_MINUTES * 60 * 1000),
          nextBreak: {
            type: isLongBreak ? 'long' : 'short',
            duration: breakDuration,
          },
        },
        settings: {
          pomodoroDuration: POMODORO_DURATION_MINUTES,
          shortBreak: SHORT_BREAK_MINUTES,
          longBreak: LONG_BREAK_MINUTES,
          pomodorosBeforeLongBreak: POMODOROS_BEFORE_LONG_BREAK,
        },
      },
      message: `Pomodoro #${validated.pomodoroNumber} started! Focus for ${POMODORO_DURATION_MINUTES} minutes.`,
    });
  } catch (error) {
    logger.error('Error starting Pomodoro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start Pomodoro' },
      { status: 500 }
    );
  }
}
