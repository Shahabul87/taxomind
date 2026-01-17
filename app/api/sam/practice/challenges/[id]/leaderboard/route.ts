import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetLeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// GET - Get challenge leaderboard
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetLeaderboardQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    });

    const store = getStore('practiceChallenge');

    // Check if challenge exists
    const challenge = await store.getById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get leaderboard
    const leaderboard = await store.getChallengeLeaderboard(id, query.limit);

    // Get current user participation
    const currentUser = await store.getParticipant(id, session.user.id);

    // Find current user rank if not in leaderboard
    let userRank: number | null = null;
    if (currentUser) {
      const userInLeaderboard = leaderboard.find((p) => p.userId === session.user.id);
      if (userInLeaderboard) {
        userRank = userInLeaderboard.rank ?? null;
      } else {
        // User is outside top results, calculate their rank
        const allParticipants = await store.getChallengeLeaderboard(id, 1000);
        const userEntry = allParticipants.find((p) => p.userId === session.user.id);
        userRank = userEntry?.rank ?? null;
      }
    }

    // Separate podium (top 3)
    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          targetHours: challenge.targetHours,
          targetQualityHours: challenge.targetQualityHours,
          targetSessions: challenge.targetSessions,
          targetStreak: challenge.targetStreak,
        },
        podium,
        leaderboard: rest,
        totalParticipants: challenge.participantCount,
        currentUser: currentUser
          ? {
              ...currentUser,
              rank: userRank,
            }
          : null,
        isCurrentUserOnPodium:
          currentUser && podium.some((p) => p.userId === session.user.id),
      },
    });
  } catch (error) {
    logger.error('Error fetching challenge leaderboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
