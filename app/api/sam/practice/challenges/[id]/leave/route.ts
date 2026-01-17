import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// POST - Leave a challenge
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

    // Check if challenge has ended
    const challenge = await store.getById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot leave a completed challenge' },
        { status: 400 }
      );
    }

    // Check if user has claimed reward
    if (participant.rewardClaimed) {
      return NextResponse.json(
        { error: 'Cannot leave a challenge after claiming reward' },
        { status: 400 }
      );
    }

    // Leave the challenge
    await store.leaveChallenge(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully left the challenge',
    });
  } catch (error) {
    logger.error('Error leaving challenge:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to leave challenge';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
