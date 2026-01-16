import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import {
  type PracticeSessionType,
  type PracticeFocusLevel,
  type BloomsLevel,
  SESSION_TYPE_MULTIPLIERS,
  FOCUS_LEVEL_MULTIPLIERS,
  BLOOMS_MULTIPLIERS,
} from '@/lib/sam/stores/prisma-practice-session-store';

// Get practice stores from TaxomindContext singleton
const { practiceSession: practiceSessionStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SessionTypeEnum = z.enum([
  'DELIBERATE',
  'POMODORO',
  'GUIDED',
  'ASSESSMENT',
  'CASUAL',
  'REVIEW',
]);

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

const CreateSessionSchema = z.object({
  skillId: z.string().min(1),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  sessionType: SessionTypeEnum.default('CASUAL'),
  focusLevel: FocusLevelEnum.default('MEDIUM'),
  bloomsLevel: BloomsLevelEnum.optional(),
  difficultyRating: z.number().min(1).max(10).optional(),
  plannedDurationMinutes: z.number().min(1).max(480).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional().default([]),
});

const GetSessionsQuerySchema = z.object({
  skillId: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED']).optional(),
  sessionType: SessionTypeEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - List user practice sessions
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetSessionsQuerySchema.parse({
      skillId: searchParams.get('skillId') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sessionType: searchParams.get('sessionType') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Use the PracticeSessionStore to query sessions
    const sessions = await practiceSessionStore.getByUser(session.user.id, {
      skillId: query.skillId,
      courseId: query.courseId,
      status: query.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | undefined,
      sessionType: query.sessionType as PracticeSessionType | undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      offset: query.offset,
    });

    // Get statistics for completed sessions
    const stats = await practiceSessionStore.getSessionStats(session.user.id, {
      skillId: query.skillId,
      courseId: query.courseId,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          hasMore: sessions.length === query.limit,
        },
        // Include multiplier info for UI
        multipliers: {
          sessionType: SESSION_TYPE_MULTIPLIERS,
          focusLevel: FOCUS_LEVEL_MULTIPLIERS,
          blooms: BLOOMS_MULTIPLIERS,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching practice sessions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch practice sessions' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create and start a new practice session
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateSessionSchema.parse(body);

    // Check for an active session - users can only have one active session at a time
    const activeSession = await practiceSessionStore.getActiveSession(session.user.id);
    if (activeSession) {
      return NextResponse.json(
        {
          error: 'Active session exists',
          message: 'You already have an active practice session. Please end or abandon it first.',
          activeSession,
        },
        { status: 409 }
      );
    }

    // Create and start the practice session
    const practiceSession = await practiceSessionStore.create({
      userId: session.user.id,
      skillId: validated.skillId,
      courseId: validated.courseId,
      chapterId: validated.chapterId,
      sectionId: validated.sectionId,
      sessionType: validated.sessionType as PracticeSessionType,
      focusLevel: validated.focusLevel as PracticeFocusLevel,
      bloomsLevel: validated.bloomsLevel as BloomsLevel | undefined,
      difficultyRating: validated.difficultyRating,
      plannedDurationMinutes: validated.plannedDurationMinutes,
      notes: validated.notes,
      tags: validated.tags,
    });

    logger.info(
      `Started practice session: ${practiceSession.id} for user: ${session.user.id}, skill: ${validated.skillId}`
    );

    return NextResponse.json({
      success: true,
      data: practiceSession,
    });
  } catch (error) {
    logger.error('Error creating practice session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create practice session' },
      { status: 500 }
    );
  }
}
