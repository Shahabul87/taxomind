import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = getAchievementEngine();

    // Get user's challenge data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        samActiveChallenges: true,
        samCompletedChallenges: true,
        samChallengeStartDate: true,
      },
    });

    const activeChallengeIds = (user?.samActiveChallenges as string[]) ?? [];
    const completedChallengeIds = (user?.samCompletedChallenges as string[]) ?? [];

    // Get available challenges
    const availableChallenges = await engine.getAvailableChallenges(session.user.id);
    const allChallenges = engine.getChallenges();

    // Format all challenges with status
    const formattedChallenges = allChallenges
      .map(challenge => {
        let status: 'active' | 'available' | 'completed' = 'available';
        let progress = 0;
        let timeLeft = challenge.duration * 24; // hours

        if (completedChallengeIds.includes(challenge.id)) {
          status = 'completed';
          progress = challenge.requirements.target;
          timeLeft = 0;
        } else if (activeChallengeIds.includes(challenge.id)) {
          status = 'active';
          // Calculate time left based on start date
          if (user?.samChallengeStartDate) {
            const startDate = new Date(user.samChallengeStartDate);
            const now = new Date();
            const hoursElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            timeLeft = Math.max(0, challenge.duration * 24 - hoursElapsed);
          }
          // TODO: Calculate actual progress from interactions
          progress = Math.floor(Math.random() * challenge.requirements.target); // Placeholder
        } else if (!availableChallenges.find(ac => ac.id === challenge.id)) {
          return null; // Not available for this user level
        }

        return {
          id: challenge.id,
          name: challenge.name,
          description: challenge.description,
          icon: challenge.icon,
          difficulty: challenge.difficulty,
          progress,
          target: challenge.requirements.target,
          timeLeft: Math.round(timeLeft),
          points: challenge.points,
          status,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: formattedChallenges,
    });
  } catch (error) {
    logger.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
