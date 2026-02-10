import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// CHALLENGE PROGRESS CALCULATION
// ============================================================================

interface ChallengeRequirements {
  type: string;
  target: number;
}

/**
 * Calculate actual progress for a challenge based on user interactions
 */
async function calculateChallengeProgress(
  userId: string,
  requirements: ChallengeRequirements,
  startDate: Date
): Promise<number> {
  const { type, target } = requirements;

  try {
    switch (type) {
      case 'form_completion': {
        // Count completed lessons/sections since challenge start
        const completedSections = await db.user_progress.count({
          where: {
            userId,
            isCompleted: true,
            updatedAt: { gte: startDate },
          },
        });
        return Math.min(completedSections, target);
      }

      case 'create_content': {
        // Count content created (courses, chapters, sections, blog posts)
        const [courses, chapters, sections, blogPosts] = await Promise.all([
          db.course.count({
            where: { userId, createdAt: { gte: startDate } },
          }),
          db.chapter.count({
            where: {
              course: { userId },
              createdAt: { gte: startDate },
            },
          }),
          db.section.count({
            where: {
              chapter: { course: { userId } },
              createdAt: { gte: startDate },
            },
          }),
          db.post.count({
            where: { userId, createdAt: { gte: startDate } },
          }),
        ]);
        const totalContent = courses + chapters + sections + blogPosts;
        return Math.min(totalContent, target);
      }

      case 'use_ai': {
        // Count SAM AI interactions
        const aiInteractions = await db.sAMInteraction.count({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
        });
        return Math.min(aiInteractions, target);
      }

      case 'collaboration': {
        // Count group activities (discussions, events, resource sharing)
        const [discussions, events] = await Promise.all([
          db.groupDiscussion.count({
            where: { authorId: userId, createdAt: { gte: startDate } },
          }),
          db.groupEvent.count({
            where: { creatorId: userId, createdAt: { gte: startDate } },
          }),
        ]);
        const totalCollaboration = discussions + events;
        return Math.min(totalCollaboration, target);
      }

      default:
        logger.warn(`Unknown challenge type: ${type}`);
        return 0;
    }
  } catch (error) {
    logger.error(`Error calculating progress for ${type}:`, error);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = await getAchievementEngine();

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

    // Format all challenges with status and calculate real progress
    const challengeStartDate = user?.samChallengeStartDate
      ? new Date(user.samChallengeStartDate)
      : new Date();

    const formattedChallenges = await Promise.all(
      allChallenges.map(async (challenge) => {
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
          // Calculate actual progress from user interactions
          progress = await calculateChallengeProgress(
            session.user.id,
            challenge.requirements,
            challengeStartDate
          );
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
    );

    // Filter out null values
    const filteredChallenges = formattedChallenges.filter(Boolean);

    return NextResponse.json({
      success: true,
      data: filteredChallenges,
    });
  } catch (error) {
    logger.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
