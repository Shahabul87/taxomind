import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// POST - Claim challenge reward
// ============================================================================

export async function POST(
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

    // Check if user is a participant
    const participant = await store.getParticipant(id, session.user.id);

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this challenge' },
        { status: 400 }
      );
    }

    // Check if already claimed
    if (participant.rewardClaimed) {
      return NextResponse.json(
        { error: 'Reward already claimed' },
        { status: 400 }
      );
    }

    // Check if challenge is completed by user
    if (!participant.completedAt) {
      // Double check completion status
      const isComplete = await store.checkCompletion(id, session.user.id);

      if (!isComplete) {
        return NextResponse.json(
          { error: 'Challenge not yet completed' },
          { status: 400 }
        );
      }
    }

    // Get challenge details for reward info
    const challenge = await store.getById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Claim the reward
    const updatedParticipant = await store.claimReward(id, session.user.id);

    // TODO: Actually award XP and badges to user
    // This would integrate with your gamification system

    return NextResponse.json({
      success: true,
      data: {
        participant: updatedParticipant,
        rewards: {
          xp: challenge.xpReward,
          badge: challenge.badgeReward,
          description: challenge.rewardDescription,
        },
        message: `Congratulations! You&apos;ve earned ${challenge.xpReward} XP${challenge.badgeReward ? ` and the "${challenge.badgeReward}" badge` : ''}!`,
      },
    });
  } catch (error) {
    return safeErrorResponse(error, 500, 'SAM_PRACTICE_CHALLENGE_CLAIM');
  }
}
