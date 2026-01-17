import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateChallengeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  challengeType: z.enum(['INDIVIDUAL', 'GROUP', 'COMPETITION', 'COMMUNITY']).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  targetHours: z.number().positive().optional(),
  targetSessions: z.number().int().positive().optional(),
  targetStreak: z.number().int().positive().optional(),
  targetQualityHours: z.number().positive().optional(),
  xpReward: z.number().int().min(0).optional(),
  badgeReward: z.string().optional(),
  rewardDescription: z.string().max(500).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isPublic: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

// ============================================================================
// GET - Get single challenge details
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const store = getStore('practiceChallenge');

    const challenge = await store.getById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get user participation
    const participant = await store.getParticipant(id, session.user.id);

    // Get leaderboard (top 10)
    const leaderboard = await store.getChallengeLeaderboard(id, 10);

    // Calculate remaining time
    const now = new Date();
    const endsAt = new Date(challenge.endsAt);
    const startsAt = new Date(challenge.startsAt);
    const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const hasStarted = startsAt <= now;
    const hasEnded = endsAt <= now;

    // Calculate progress percentage based on targets
    let progressPercentage = 0;
    if (participant) {
      const progressValues: number[] = [];

      if (challenge.targetHours) {
        progressValues.push(Math.min(100, (participant.hoursCompleted / challenge.targetHours) * 100));
      }
      if (challenge.targetQualityHours) {
        progressValues.push(Math.min(100, (participant.qualityHoursCompleted / challenge.targetQualityHours) * 100));
      }
      if (challenge.targetSessions) {
        progressValues.push(Math.min(100, (participant.sessionsCompleted / challenge.targetSessions) * 100));
      }
      if (challenge.targetStreak) {
        progressValues.push(Math.min(100, (participant.currentStreak / challenge.targetStreak) * 100));
      }

      if (progressValues.length > 0) {
        progressPercentage = Math.max(...progressValues);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        challenge,
        userParticipation: participant
          ? {
              ...participant,
              progressPercentage,
            }
          : null,
        leaderboard,
        status: {
          hasStarted,
          hasEnded,
          daysRemaining,
          isJoinable: !hasEnded && challenge.status === 'ACTIVE',
        },
        isCreator: challenge.createdById === session.user.id,
      },
    });
  } catch (error) {
    logger.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Update challenge (creator only)
// ============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const store = getStore('practiceChallenge');

    // Check ownership
    const existing = await store.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Only the creator can update this challenge' }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateChallengeSchema.parse(body);

    // Convert dates if provided
    const updateData: Parameters<typeof store.update>[1] = {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    };

    // Validate dates if both provided
    if (updateData.startsAt && updateData.endsAt) {
      if (updateData.endsAt <= updateData.startsAt) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const challenge = await store.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    logger.error('Error updating challenge:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Delete challenge (creator only, if no participants)
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const store = getStore('practiceChallenge');

    // Check ownership and participant count
    const existing = await store.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Only the creator can delete this challenge' }, { status: 403 });
    }

    if (existing.participantCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete challenge with participants. Cancel it instead.' },
        { status: 400 }
      );
    }

    await store.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
  }
}
