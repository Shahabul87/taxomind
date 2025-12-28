import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { awardSAMPoints } from '@/lib/sam/utils/sam-database';
import { SAMPointsCategory } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'daily' | 'weekly' | 'monthly' | 'special' | 'all'
    const status = searchParams.get('status') || 'all'; // 'active' | 'completed' | 'missed' | 'all'
    const category = searchParams.get('category'); // 'learning' | 'social' | 'streak' | 'performance'

    // Get available challenges
    const challenges = await getAvailableChallenges(type, category || undefined);
    
    // Get user's challenge progress
    const userChallenges = await getUserChallengeProgress(user.id, status);
    
    // Merge challenges with user progress
    const challengesWithProgress = challenges.map(challenge => {
      const userProgress = userChallenges.find(uc => uc.challengeId === challenge.id);
      return {
        ...challenge,
        userProgress: userProgress ? {
          progress: userProgress.progress,
          completed: userProgress.completed,
          startedAt: userProgress.startedAt,
          completedAt: userProgress.completedAt,
          currentValue: userProgress.currentValue,
          reward: userProgress.reward
        } : null,
        isActive: challenge.isActive && (!userProgress || !userProgress.completed),
        canStart: challenge.isActive && !userProgress,
        timeRemaining: challenge.isActive ? getTimeRemaining(challenge.endDate) : null
      };
    });

    // Filter by status if specified
    const filteredChallenges = status === 'active' 
      ? challengesWithProgress.filter(c => c.isActive && c.userProgress && !c.userProgress.completed)
      : status === 'completed'
      ? challengesWithProgress.filter(c => c.userProgress?.completed)
      : status === 'missed'
      ? challengesWithProgress.filter(c => !c.isActive && (!c.userProgress || !c.userProgress.completed))
      : challengesWithProgress;

    return NextResponse.json({
      challenges: filteredChallenges,
      summary: {
        total: challenges.length,
        active: challengesWithProgress.filter(c => c.isActive).length,
        completed: challengesWithProgress.filter(c => c.userProgress?.completed).length,
        available: challengesWithProgress.filter(c => c.canStart).length
      }
    });

  } catch (error) {
    logger.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, challengeId, progress, currentValue } = await request.json();

    switch (action) {
      case 'start_challenge':
        return await startChallenge(user.id, challengeId);
      case 'update_progress':
        return await updateChallengeProgress(user.id, challengeId, progress, currentValue);
      case 'complete_challenge':
        return await completeChallenge(user.id, challengeId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error handling challenge action:', error);
    return NextResponse.json(
      { error: 'Failed to process challenge action' },
      { status: 500 }
    );
  }
}

async function getAvailableChallenges(type: string, category?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const challenges = [
    // Daily Challenges
    {
      id: 'daily_questions_5',
      name: 'Question Quest',
      description: 'Ask 5 questions to SAM today',
      type: 'daily',
      category: 'learning',
      difficulty: 'easy',
      icon: '❓',
      targetValue: 5,
      reward: {
        points: 50,
        badge: null,
        title: null
      },
      startDate: today,
      endDate: tomorrow,
      isActive: true,
      requirements: []
    },
    {
      id: 'daily_study_30min',
      name: 'Study Sprint',
      description: 'Study for 30 minutes today',
      type: 'daily',
      category: 'learning',
      difficulty: 'easy',
      icon: '📚',
      targetValue: 30,
      reward: {
        points: 75,
        badge: null,
        title: null
      },
      startDate: today,
      endDate: tomorrow,
      isActive: true,
      requirements: []
    },
    {
      id: 'daily_perfect_quiz',
      name: 'Perfect Performance',
      description: 'Score 100% on any quiz today',
      type: 'daily',
      category: 'performance',
      difficulty: 'medium',
      icon: '💯',
      targetValue: 1,
      reward: {
        points: 100,
        badge: 'perfectionist',
        title: null
      },
      startDate: today,
      endDate: tomorrow,
      isActive: true,
      requirements: []
    },
    {
      id: 'daily_early_bird',
      name: 'Early Bird Special',
      description: 'Start learning before 8 AM',
      type: 'daily',
      category: 'habits',
      difficulty: 'medium',
      icon: '🌅',
      targetValue: 1,
      reward: {
        points: 80,
        badge: null,
        title: 'Early Bird'
      },
      startDate: today,
      endDate: tomorrow,
      isActive: true,
      requirements: []
    },

    // Weekly Challenges
    {
      id: 'weekly_streak_7',
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day learning streak',
      type: 'weekly',
      category: 'streak',
      difficulty: 'medium',
      icon: '🔥',
      targetValue: 7,
      reward: {
        points: 300,
        badge: 'weekly_warrior',
        title: 'Streak Master'
      },
      startDate: getStartOfWeek(today),
      endDate: endOfWeek,
      isActive: true,
      requirements: []
    },
    {
      id: 'weekly_courses_2',
      name: 'Course Crusher',
      description: 'Complete 2 courses this week',
      type: 'weekly',
      category: 'learning',
      difficulty: 'hard',
      icon: '🎓',
      targetValue: 2,
      reward: {
        points: 500,
        badge: 'course_crusher',
        title: 'Academic Star'
      },
      startDate: getStartOfWeek(today),
      endDate: endOfWeek,
      isActive: true,
      requirements: []
    },
    {
      id: 'weekly_help_others_3',
      name: 'Helping Hand',
      description: 'Help 3 fellow learners this week',
      type: 'weekly',
      category: 'social',
      difficulty: 'medium',
      icon: '🤝',
      targetValue: 3,
      reward: {
        points: 200,
        badge: 'helper',
        title: 'Community Hero'
      },
      startDate: getStartOfWeek(today),
      endDate: endOfWeek,
      isActive: true,
      requirements: []
    },
    {
      id: 'weekly_ai_master',
      name: 'AI Master',
      description: 'Use 5 different SAM AI features this week',
      type: 'weekly',
      category: 'learning',
      difficulty: 'medium',
      icon: '🤖',
      targetValue: 5,
      reward: {
        points: 250,
        badge: 'ai_master',
        title: 'AI Expert'
      },
      startDate: getStartOfWeek(today),
      endDate: endOfWeek,
      isActive: true,
      requirements: []
    },

    // Monthly Challenges
    {
      id: 'monthly_achievement_10',
      name: 'Achievement Hunter',
      description: 'Unlock 10 achievements this month',
      type: 'monthly',
      category: 'achievement',
      difficulty: 'hard',
      icon: '🏆',
      targetValue: 10,
      reward: {
        points: 1000,
        badge: 'achievement_hunter',
        title: 'Champion'
      },
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: endOfMonth,
      isActive: true,
      requirements: []
    },
    {
      id: 'monthly_study_time_40h',
      name: 'Study Marathon',
      description: 'Study for 40 hours this month',
      type: 'monthly',
      category: 'time',
      difficulty: 'hard',
      icon: '⏰',
      targetValue: 2400, // 40 hours in minutes
      reward: {
        points: 800,
        badge: 'marathon_runner',
        title: 'Study Champion'
      },
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: endOfMonth,
      isActive: true,
      requirements: []
    },

    // Special Challenges
    {
      id: 'special_weekend_warrior',
      name: 'Weekend Warrior',
      description: 'Complete 5 learning sessions this weekend',
      type: 'special',
      category: 'learning',
      difficulty: 'medium',
      icon: '🏃‍♂️',
      targetValue: 5,
      reward: {
        points: 300,
        badge: 'weekend_warrior',
        title: 'Weekend Champion'
      },
      startDate: getNextWeekend(),
      endDate: getEndOfWeekend(),
      isActive: isWeekend(),
      requirements: []
    },
    {
      id: 'special_content_creator',
      name: 'Content Creator Challenge',
      description: 'Create 3 pieces of content using SAM AI',
      type: 'special',
      category: 'creativity',
      difficulty: 'medium',
      icon: '✨',
      targetValue: 3,
      reward: {
        points: 400,
        badge: 'content_creator',
        title: 'Creative Genius'
      },
      startDate: today,
      endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      requirements: []
    }
  ];

  // Filter by type and category
  let filteredChallenges = challenges;
  
  if (type !== 'all') {
    filteredChallenges = filteredChallenges.filter(c => c.type === type);
  }
  
  if (category) {
    filteredChallenges = filteredChallenges.filter(c => c.category === category);
  }

  return filteredChallenges;
}

async function getUserChallengeProgress(userId: string, status: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      samActiveChallenges: true,
      samCompletedChallenges: true,
    },
  });

  if (!user) return [];

  const active = normalizeChallengeList(user.samActiveChallenges);
  const completed = normalizeChallengeList(user.samCompletedChallenges);

  if (status === 'active') {
    return active.filter((item) => !item.completed);
  }
  if (status === 'completed') {
    return completed.filter((item) => item.completed);
  }
  if (status === 'missed') {
    return active.filter((item) => item.completed === false && item.expired === true);
  }

  return [...active, ...completed];
}

async function startChallenge(userId: string, challengeId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      samActiveChallenges: true,
      samCompletedChallenges: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const active = normalizeChallengeList(user.samActiveChallenges);
  const completed = normalizeChallengeList(user.samCompletedChallenges);
  const existing = [...active, ...completed].find((item) => item.challengeId === challengeId);

  if (existing) {
    return NextResponse.json({
      success: true,
      message: 'Challenge already started',
      userChallenge: existing,
    });
  }

  const available = await getAvailableChallenges('all');
  const definition = available.find((challenge) => challenge.id === challengeId);

  const userChallenge = {
    id: randomUUID(),
    userId,
    challengeId,
    startedAt: new Date().toISOString(),
    progress: 0,
    currentValue: 0,
    completed: false,
    completedAt: null,
    reward: definition?.reward ?? null,
  };

  active.push(userChallenge);

  await db.user.update({
    where: { id: userId },
    data: {
      samActiveChallenges: active,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Challenge started successfully!',
    userChallenge,
  });
}

async function updateChallengeProgress(userId: string, challengeId: string, progress: number, currentValue: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { samActiveChallenges: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const active = normalizeChallengeList(user.samActiveChallenges);
  const updated = active.map((item) => {
    if (item.challengeId !== challengeId) return item;
    return {
      ...item,
      progress: Math.min(progress, 100),
      currentValue,
      updatedAt: new Date().toISOString(),
    };
  });

  await db.user.update({
    where: { id: userId },
    data: { samActiveChallenges: updated },
  });

  const updatedChallenge = updated.find((item) => item.challengeId === challengeId);

  return NextResponse.json({
    success: true,
    message: 'Challenge progress updated!',
    userChallenge: updatedChallenge ?? {
      userId,
      challengeId,
      progress: Math.min(progress, 100),
      currentValue,
    },
  });
}

async function completeChallenge(userId: string, challengeId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      samActiveChallenges: true,
      samCompletedChallenges: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const active = normalizeChallengeList(user.samActiveChallenges);
  const completed = normalizeChallengeList(user.samCompletedChallenges);

  const challenge = active.find((item) => item.challengeId === challengeId);
  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or not active' }, { status: 404 });
  }

  const available = await getAvailableChallenges('all');
  const definition = available.find((challenge) => challenge.id === challengeId);

  const completedChallenge = {
    ...challenge,
    completed: true,
    progress: 100,
    completedAt: new Date().toISOString(),
    reward: challenge.reward ?? definition?.reward ?? null,
  };

  const updatedActive = active.filter((item) => item.challengeId !== challengeId);
  completed.push(completedChallenge);

  await db.user.update({
    where: { id: userId },
    data: {
      samActiveChallenges: updatedActive,
      samCompletedChallenges: completed,
    },
  });

  const rewardPoints = typeof completedChallenge.reward?.points === 'number' ? completedChallenge.reward.points : 0;
  if (rewardPoints > 0) {
    await awardSAMPoints(userId, {
      points: rewardPoints,
      reason: `Challenge completed: ${challengeId}`,
      source: SAMPointsCategory.ACHIEVEMENT_UNLOCK,
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Congratulations! Challenge completed!',
    userChallenge: completedChallenge,
  });
}

// Helper functions
function normalizeChallengeList(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function getTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(date.getDate() - date.getDay());
  return result;
}

function getNextWeekend(): Date {
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay()) % 7;
  return new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
}

function getEndOfWeekend(): Date {
  const weekend = getNextWeekend();
  return new Date(weekend.getTime() + 2 * 24 * 60 * 60 * 1000);
}

function isWeekend(): boolean {
  const now = new Date();
  return now.getDay() === 0 || now.getDay() === 6;
}
