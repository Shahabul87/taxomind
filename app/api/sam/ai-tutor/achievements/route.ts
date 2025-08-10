import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // 'unlocked' | 'locked' | 'all'

    // Get user's current achievements
    const userAchievements = await db.userAchievement.findMany({
      where: {
        userId: userId,
        ...(category && { achievement: { category } })
      },
      include: {
        achievement: true
      }
    });

    // Get all available achievements
    const allAchievements = await getAvailableAchievements(category);
    
    // Merge user achievements with all achievements
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      return {
        ...achievement,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement?.progress || 0,
        currentValue: userAchievement?.currentValue || 0
      };
    });

    // Filter by status if specified
    const filteredAchievements = status === 'unlocked' 
      ? achievementsWithProgress.filter(a => a.isUnlocked)
      : status === 'locked'
      ? achievementsWithProgress.filter(a => !a.isUnlocked)
      : achievementsWithProgress;

    return NextResponse.json({
      achievements: filteredAchievements,
      summary: {
        total: allAchievements.length,
        unlocked: achievementsWithProgress.filter(a => a.isUnlocked).length,
        locked: achievementsWithProgress.filter(a => !a.isUnlocked).length,
        categories: getAchievementCategories()
      }
    });

  } catch (error) {
    logger.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
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

    const { achievementId, progress, currentValue } = await request.json();

    // Check if achievement exists
    const achievement = await getAchievementById(achievementId);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if user already has this achievement
    const existingUserAchievement = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: user.id,
          achievementId: achievementId
        }
      }
    });

    const isUnlocked = currentValue >= achievement.targetValue;

    if (existingUserAchievement) {
      // Update existing achievement progress
      const updated = await db.userAchievement.update({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: achievementId
          }
        },
        data: {
          progress: Math.min(progress || 0, 100),
          currentValue: currentValue || 0,
          ...(isUnlocked && !existingUserAchievement.unlockedAt && {
            unlockedAt: new Date()
          })
        },
        include: {
          achievement: true
        }
      });

      return NextResponse.json({
        userAchievement: updated,
        isNewlyUnlocked: isUnlocked && !existingUserAchievement.unlockedAt,
        message: isUnlocked && !existingUserAchievement.unlockedAt 
          ? `Congratulations! You've unlocked "${achievement.name}"!`
          : 'Achievement progress updated'
      });
    } else {
      // Create new achievement progress
      const newUserAchievement = await db.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: achievementId,
          progress: Math.min(progress || 0, 100),
          currentValue: currentValue || 0,
          ...(isUnlocked && { unlockedAt: new Date() })
        },
        include: {
          achievement: true
        }
      });

      return NextResponse.json({
        userAchievement: newUserAchievement,
        isNewlyUnlocked: isUnlocked,
        message: isUnlocked 
          ? `Congratulations! You've unlocked "${achievement.name}"!`
          : 'Achievement progress started'
      });
    }

  } catch (error) {
    logger.error('Error updating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    );
  }
}

// Helper function to get all available achievements
async function getAvailableAchievements(category?: string) {
  const achievements = [
    // Learning Achievements
    {
      id: 'first_login',
      name: 'Welcome Aboard!',
      description: 'Complete your first login and explore SAM AI Tutor',
      category: 'learning',
      icon: '🎓',
      targetValue: 1,
      points: 50,
      rarity: 'common'
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      category: 'consistency',
      icon: '🔥',
      targetValue: 7,
      points: 100,
      rarity: 'uncommon'
    },
    {
      id: 'streak_30',
      name: 'Month Master',
      description: 'Maintain a 30-day learning streak',
      category: 'consistency',
      icon: '⚡',
      targetValue: 30,
      points: 500,
      rarity: 'rare'
    },
    {
      id: 'questions_asked_10',
      name: 'Curious Mind',
      description: 'Ask 10 questions to SAM AI Tutor',
      category: 'engagement',
      icon: '❓',
      targetValue: 10,
      points: 75,
      rarity: 'common'
    },
    {
      id: 'questions_asked_100',
      name: 'Question Master',
      description: 'Ask 100 questions to SAM AI Tutor',
      category: 'engagement',
      icon: '🧠',
      targetValue: 100,
      points: 300,
      rarity: 'epic'
    },
    {
      id: 'courses_completed_1',
      name: 'First Graduate',
      description: 'Complete your first course',
      category: 'achievement',
      icon: '🎖️',
      targetValue: 1,
      points: 200,
      rarity: 'uncommon'
    },
    {
      id: 'courses_completed_5',
      name: 'Scholar',
      description: 'Complete 5 courses',
      category: 'achievement',
      icon: '📚',
      targetValue: 5,
      points: 750,
      rarity: 'rare'
    },
    {
      id: 'courses_completed_10',
      name: 'Academic Champion',
      description: 'Complete 10 courses',
      category: 'achievement',
      icon: '🏆',
      targetValue: 10,
      points: 1500,
      rarity: 'legendary'
    },
    {
      id: 'perfect_quiz_score',
      name: 'Perfect Score',
      description: 'Achieve a perfect score on any quiz',
      category: 'performance',
      icon: '💯',
      targetValue: 1,
      points: 150,
      rarity: 'uncommon'
    },
    {
      id: 'study_time_10h',
      name: 'Dedicated Learner',
      description: 'Study for 10 hours total',
      category: 'time',
      icon: '⏰',
      targetValue: 600, // 10 hours in minutes
      points: 200,
      rarity: 'common'
    },
    {
      id: 'study_time_50h',
      name: 'Study Expert',
      description: 'Study for 50 hours total',
      category: 'time',
      icon: '📖',
      targetValue: 3000, // 50 hours in minutes
      points: 750,
      rarity: 'rare'
    },
    {
      id: 'ai_interactions_50',
      name: 'AI Companion',
      description: 'Have 50 meaningful conversations with SAM',
      category: 'social',
      icon: '🤖',
      targetValue: 50,
      points: 250,
      rarity: 'uncommon'
    },
    {
      id: 'help_others_10',
      name: 'Helpful Peer',
      description: 'Help 10 fellow learners',
      category: 'social',
      icon: '🤝',
      targetValue: 10,
      points: 300,
      rarity: 'rare'
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Study before 8 AM for 5 consecutive days',
      category: 'habits',
      icon: '🌅',
      targetValue: 5,
      points: 200,
      rarity: 'uncommon'
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Study after 10 PM for 5 consecutive days',
      category: 'habits',
      icon: '🦉',
      targetValue: 5,
      points: 200,
      rarity: 'uncommon'
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      description: 'Create 5 pieces of content using SAM',
      category: 'creativity',
      icon: '✨',
      targetValue: 5,
      points: 400,
      rarity: 'rare'
    },
    {
      id: 'coding_ninja',
      name: 'Coding Ninja',
      description: 'Analyze 20 code snippets with SAM',
      category: 'skills',
      icon: '💻',
      targetValue: 20,
      points: 350,
      rarity: 'rare'
    },
    {
      id: 'visual_learner',
      name: 'Visual Learner',
      description: 'Generate 10 visual learning aids',
      category: 'learning_style',
      icon: '🎨',
      targetValue: 10,
      points: 300,
      rarity: 'uncommon'
    },
    {
      id: 'speed_reader',
      name: 'Speed Reader',
      description: 'Complete reading assignments in record time',
      category: 'efficiency',
      icon: '⚡',
      targetValue: 1,
      points: 250,
      rarity: 'rare'
    },
    {
      id: 'mentor',
      name: 'Mentor',
      description: 'Guide 5 new learners through their first week',
      category: 'leadership',
      icon: '👨‍🏫',
      targetValue: 5,
      points: 500,
      rarity: 'epic'
    }
  ];

  return category ? achievements.filter(a => a.category === category) : achievements;
}

// Helper function to get achievement by ID
async function getAchievementById(id: string) {
  const achievements = await getAvailableAchievements();
  return achievements.find(a => a.id === id);
}

// Helper function to get achievement categories
function getAchievementCategories() {
  return [
    { id: 'learning', name: 'Learning', icon: '🎓' },
    { id: 'consistency', name: 'Consistency', icon: '🔥' },
    { id: 'engagement', name: 'Engagement', icon: '💬' },
    { id: 'achievement', name: 'Achievement', icon: '🏆' },
    { id: 'performance', name: 'Performance', icon: '⭐' },
    { id: 'time', name: 'Time', icon: '⏰' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'habits', name: 'Habits', icon: '🔄' },
    { id: 'creativity', name: 'Creativity', icon: '🎨' },
    { id: 'skills', name: 'Skills', icon: '🛠️' },
    { id: 'learning_style', name: 'Learning Style', icon: '📚' },
    { id: 'efficiency', name: 'Efficiency', icon: '⚡' },
    { id: 'leadership', name: 'Leadership', icon: '👑' }
  ];
}