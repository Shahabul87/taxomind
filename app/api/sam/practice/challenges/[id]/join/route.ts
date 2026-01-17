import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// POST - Join a challenge
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

    // Check if challenge exists
    const challenge = await store.getById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge is joinable
    if (challenge.status !== 'ACTIVE' && challenge.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'This challenge is not accepting participants' },
        { status: 400 }
      );
    }

    // Check if challenge has ended
    if (new Date(challenge.endsAt) <= new Date()) {
      return NextResponse.json(
        { error: 'This challenge has already ended' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await store.getParticipant(id, session.user.id);

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this challenge' },
        { status: 400 }
      );
    }

    // Check max participants
    if (challenge.maxParticipants && challenge.participantCount >= challenge.maxParticipants) {
      return NextResponse.json(
        { error: 'This challenge is full' },
        { status: 400 }
      );
    }

    // Join the challenge
    const participant = await store.joinChallenge(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        participant,
        message: 'Successfully joined the challenge!',
      },
    });
  } catch (error) {
    logger.error('Error joining challenge:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to join challenge';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
