import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import {
  type PracticeSessionType,
  type PracticeFocusLevel,
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
  skillName: z.string().optional(),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  sessionType: SessionTypeEnum.default('CASUAL'),
  focusLevel: FocusLevelEnum.default('MEDIUM'),
  bloomsLevel: BloomsLevelEnum.optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
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
    const allSessions = await practiceSessionStore.getUserSessions(session.user.id, {
      skillId: query.skillId,
      courseId: query.courseId,
      status: query.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | undefined,
      sessionType: query.sessionType as PracticeSessionType | undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    // Apply pagination manually since store returns all matching
    const sessions = allSessions.slice(query.offset, query.offset + query.limit);

    // Get statistics for completed sessions (no filters in store method)
    const stats = await practiceSessionStore.getSessionStats(session.user.id);

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
        // Include multiplier info for UI with descriptions
        multipliers: {
          sessionType: SESSION_TYPE_MULTIPLIERS,
          focusLevel: FOCUS_LEVEL_MULTIPLIERS,
          blooms: BLOOMS_MULTIPLIERS,
        },
        // Bloom's Taxonomy level info for UI selection
        bloomsLevelInfo: [
          {
            level: 'CREATE',
            multiplier: BLOOMS_MULTIPLIERS.CREATE,
            label: 'Create',
            description: 'Producing new work, designing solutions, constructing arguments',
            examples: ['Building a project', 'Designing a system', 'Creating original content'],
            cognitiveEffort: 'highest',
          },
          {
            level: 'EVALUATE',
            multiplier: BLOOMS_MULTIPLIERS.EVALUATE,
            label: 'Evaluate',
            description: 'Judging, critiquing, defending, making decisions based on criteria',
            examples: ['Code review', 'Comparing approaches', 'Assessing quality'],
            cognitiveEffort: 'very high',
          },
          {
            level: 'ANALYZE',
            multiplier: BLOOMS_MULTIPLIERS.ANALYZE,
            label: 'Analyze',
            description: 'Breaking down, examining relationships, organizing information',
            examples: ['Debugging code', 'Understanding patterns', 'Comparing concepts'],
            cognitiveEffort: 'high',
          },
          {
            level: 'APPLY',
            multiplier: BLOOMS_MULTIPLIERS.APPLY,
            label: 'Apply',
            description: 'Using knowledge in new situations, implementing, executing',
            examples: ['Solving practice problems', 'Writing code', 'Following tutorials'],
            cognitiveEffort: 'moderate',
          },
          {
            level: 'UNDERSTAND',
            multiplier: BLOOMS_MULTIPLIERS.UNDERSTAND,
            label: 'Understand',
            description: 'Explaining, summarizing, interpreting concepts',
            examples: ['Reading documentation', 'Watching lectures', 'Discussing concepts'],
            cognitiveEffort: 'basic',
          },
          {
            level: 'REMEMBER',
            multiplier: BLOOMS_MULTIPLIERS.REMEMBER,
            label: 'Remember',
            description: 'Recalling facts and basic concepts, memorizing',
            examples: ['Flashcard review', 'Memorizing syntax', 'Quick reference lookup'],
            cognitiveEffort: 'minimal',
          },
        ],
        // Session type info for UI selection
        sessionTypeInfo: [
          {
            type: 'DELIBERATE',
            multiplier: SESSION_TYPE_MULTIPLIERS.DELIBERATE,
            label: 'Deliberate Practice',
            description: 'Focused, intentional practice with specific improvement goals',
            bestFor: 'Targeting weak areas, skill development',
          },
          {
            type: 'POMODORO',
            multiplier: SESSION_TYPE_MULTIPLIERS.POMODORO,
            label: 'Pomodoro',
            description: 'Time-boxed deep work sessions (typically 25 minutes)',
            bestFor: 'Focused work, avoiding burnout',
          },
          {
            type: 'GUIDED',
            multiplier: SESSION_TYPE_MULTIPLIERS.GUIDED,
            label: 'Guided Learning',
            description: 'Following structured tutorials or course materials',
            bestFor: 'Learning new concepts, following curriculum',
          },
          {
            type: 'ASSESSMENT',
            multiplier: SESSION_TYPE_MULTIPLIERS.ASSESSMENT,
            label: 'Assessment',
            description: 'Testing knowledge through quizzes or exercises',
            bestFor: 'Measuring progress, identifying gaps',
          },
          {
            type: 'CASUAL',
            multiplier: SESSION_TYPE_MULTIPLIERS.CASUAL,
            label: 'Casual',
            description: 'Light, relaxed practice without specific goals',
            bestFor: 'Exploration, maintaining habit',
          },
          {
            type: 'REVIEW',
            multiplier: SESSION_TYPE_MULTIPLIERS.REVIEW,
            label: 'Review',
            description: 'Reviewing previously learned material',
            bestFor: 'Spaced repetition, reinforcement',
          },
        ],
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
      skillName: validated.skillName,
      courseId: validated.courseId,
      courseName: validated.courseName,
      chapterId: validated.chapterId,
      sectionId: validated.sectionId,
      sessionType: validated.sessionType as PracticeSessionType,
      focusLevel: validated.focusLevel as PracticeFocusLevel,
      bloomsLevel: validated.bloomsLevel,
      notes: validated.notes,
      metadata: validated.metadata,
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
