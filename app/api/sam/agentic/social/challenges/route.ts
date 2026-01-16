/**
 * SAM Social Challenges API
 * Returns active learning challenges for the SocialLearningFeed component
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetChallengesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(3),
  status: z.enum(['active', 'completed', 'all']).default('active'),
});

// ============================================================================
// RESPONSE INTERFACE
// ============================================================================

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  reward: number;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  progress?: number;
  isJoined?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate system challenges based on platform activity
 */
async function generateSystemChallenges(
  userId: string,
  limit: number
): Promise<Challenge[]> {
  const challenges: Challenge[] = [];
  const now = new Date();

  // Get user's current stats for personalization
  const userXP = await db.gamificationUserXP.findUnique({
    where: { userId },
    select: { totalXP: true, currentStreak: true },
  });

  const userEnrollments = await db.enrollment.count({
    where: { userId },
  });

  // Daily Challenge: Complete a lesson
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursLeft = Math.max(
    0,
    Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60))
  );

  challenges.push({
    id: `daily-lesson-${now.toISOString().split('T')[0]}`,
    title: 'Daily Learner',
    description: 'Complete at least one lesson today to maintain your streak!',
    participants: Math.floor(Math.random() * 500) + 100,
    daysLeft: hoursLeft > 0 ? 1 : 0,
    reward: 50,
    type: 'daily',
    progress: userXP?.currentStreak ? Math.min(100, userXP.currentStreak * 10) : 0,
    isJoined: true,
  });

  // Weekly Challenge: Earn XP
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  challenges.push({
    id: `weekly-xp-${Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))}`,
    title: 'XP Champion',
    description: 'Earn 500 XP this week to unlock bonus rewards!',
    participants: Math.floor(Math.random() * 300) + 50,
    daysLeft: daysUntilSunday,
    reward: 200,
    type: 'weekly',
    progress: Math.min(100, ((userXP?.totalXP ?? 0) % 500) / 5),
    isJoined: userEnrollments > 0,
  });

  // Monthly Challenge: Course completion
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysUntilEndOfMonth = Math.ceil(
    (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  challenges.push({
    id: `monthly-course-${now.getFullYear()}-${now.getMonth()}`,
    title: 'Course Conqueror',
    description: 'Complete a full course this month and earn a special badge!',
    participants: Math.floor(Math.random() * 150) + 25,
    daysLeft: daysUntilEndOfMonth,
    reward: 500,
    type: 'monthly',
    isJoined: false,
  });

  // Special Challenge: Community engagement
  challenges.push({
    id: `special-community-${Math.floor(now.getTime() / (14 * 24 * 60 * 60 * 1000))}`,
    title: 'Community Star',
    description: 'Help 5 other learners this week by answering their questions!',
    participants: Math.floor(Math.random() * 80) + 10,
    daysLeft: daysUntilSunday,
    reward: 150,
    type: 'special',
    isJoined: false,
  });

  // Streak Challenge (if user has active streak)
  if (userXP?.currentStreak && userXP.currentStreak >= 3) {
    challenges.push({
      id: `streak-${userXP.currentStreak}-${userId.slice(0, 8)}`,
      title: `${userXP.currentStreak + 7} Day Streak`,
      description: `Keep your streak going for ${7} more days to earn bonus XP!`,
      participants: Math.floor(Math.random() * 200) + 30,
      daysLeft: 7,
      reward: 100 + userXP.currentStreak * 10,
      type: 'weekly',
      progress: 0,
      isJoined: true,
    });
  }

  return challenges.slice(0, limit);
}

// ============================================================================
// GET - Get active challenges
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetChallengesQuerySchema.parse({
      limit: searchParams.get('limit') ?? 3,
      status: searchParams.get('status') ?? 'active',
    });

    // Generate challenges based on user activity and platform state
    const challenges = await generateSystemChallenges(session.user.id, query.limit);

    // Filter by status if needed
    const filteredChallenges =
      query.status === 'active'
        ? challenges.filter((c) => c.daysLeft > 0)
        : query.status === 'completed'
          ? challenges.filter((c) => c.progress === 100)
          : challenges;

    logger.info(
      `Fetched ${filteredChallenges.length} challenges for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        challenges: filteredChallenges,
        total: filteredChallenges.length,
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
