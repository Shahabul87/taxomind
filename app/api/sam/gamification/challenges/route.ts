import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAvailableChallengesForUser, getActiveChallenges } from '@/lib/sam-achievement-engine';
import { CHALLENGES } from '@/lib/sam-achievements';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's challenge data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        samActiveChallenges: true,
        samCompletedChallenges: true,
        samChallengeStartDate: true,
      }
    });

    const activeChallengeIds = (user?.samActiveChallenges as string[]) || [];
    const completedChallengeIds = (user?.samCompletedChallenges as string[]) || [];
    
    // Get available challenges
    const availableChallenges = await getAvailableChallengesForUser(session.user.id);
    
    // Format all challenges with status
    const allChallenges = CHALLENGES.map(challenge => {
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
          timeLeft = Math.max(0, (challenge.duration * 24) - hoursElapsed);
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
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: allChallenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}