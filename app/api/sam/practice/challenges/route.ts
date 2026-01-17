import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetChallengesQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'COMPETITION', 'COMMUNITY']).optional(),
  skillId: z.string().optional(),
  courseId: z.string().optional(),
  userChallenges: z.enum(['true', 'false']).optional(),
  createdByMe: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const CreateChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  challengeType: z.enum(['INDIVIDUAL', 'GROUP', 'COMPETITION', 'COMMUNITY']).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  targetHours: z.number().positive().optional(),
  targetSessions: z.number().int().positive().optional(),
  targetStreak: z.number().int().positive().optional(),
  targetQualityHours: z.number().positive().optional(),
  skillId: z.string().optional(),
  skillName: z.string().optional(),
  courseId: z.string().optional(),
  xpReward: z.number().int().min(0).optional(),
  badgeReward: z.string().optional(),
  rewardDescription: z.string().max(500).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isPublic: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  organizationId: z.string().optional(),
});

// ============================================================================
// GET - List challenges
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetChallengesQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      skillId: searchParams.get('skillId') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      userChallenges: searchParams.get('userChallenges') ?? undefined,
      createdByMe: searchParams.get('createdByMe') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    const store = getStore('practiceChallenge');
    let challenges;

    if (query.userChallenges === 'true') {
      // Get challenges user has joined
      challenges = await store.getUserChallenges(session.user.id);
    } else if (query.createdByMe === 'true') {
      // Get challenges user created
      challenges = await store.getCreatedChallenges(session.user.id);
    } else {
      // Get active/available challenges
      challenges = await store.getActiveChallenges({
        status: query.status ? [query.status] : ['ACTIVE', 'SCHEDULED'],
        challengeType: query.type,
        skillId: query.skillId,
        courseId: query.courseId,
        isPublic: true,
      });
    }

    // Apply pagination
    const total = challenges.length;
    const paginated = challenges.slice(query.offset, query.offset + query.limit);

    // Enrich with user participation status
    const enrichedChallenges = await Promise.all(
      paginated.map(async (challenge) => {
        const participant = await store.getParticipant(challenge.id, session.user.id);
        return {
          ...challenge,
          isJoined: !!participant,
          userProgress: participant
            ? {
                hoursCompleted: participant.hoursCompleted,
                qualityHoursCompleted: participant.qualityHoursCompleted,
                sessionsCompleted: participant.sessionsCompleted,
                currentStreak: participant.currentStreak,
                rank: participant.rank,
                completedAt: participant.completedAt,
                rewardClaimed: participant.rewardClaimed,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        challenges: enrichedChallenges,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching challenges:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create a new challenge
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = CreateChallengeSchema.parse(body);

    // Validate dates
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate at least one target is set
    if (
      !data.targetHours &&
      !data.targetSessions &&
      !data.targetStreak &&
      !data.targetQualityHours
    ) {
      return NextResponse.json(
        { error: 'At least one target (hours, sessions, streak, or quality hours) must be set' },
        { status: 400 }
      );
    }

    const store = getStore('practiceChallenge');

    const challenge = await store.create({
      ...data,
      startsAt,
      endsAt,
      createdById: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    logger.error('Error creating challenge:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
