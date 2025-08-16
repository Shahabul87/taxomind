import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AchievementType, BadgeLevel } from '@prisma/client';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const category = searchParams.get('category');

    // Get user's achievements from the database
    const userAchievements = await db.user_achievements.findMany({
      where: {
        userId: userId,
        ...(category && { achievementType: category as AchievementType })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true
          }
        },
        User: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    });

    // Calculate summary stats
    const summary = {
      total: userAchievements.length,
      totalPoints: userAchievements.reduce((sum, a) => sum + a.pointsEarned, 0),
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>
    };

    // Group achievements by type and level
    userAchievements.forEach(achievement => {
      // Count by type
      if (!summary.byType[achievement.achievementType]) {
        summary.byType[achievement.achievementType] = 0;
      }
      summary.byType[achievement.achievementType]++;

      // Count by level
      if (!summary.byLevel[achievement.badgeLevel]) {
        summary.byLevel[achievement.badgeLevel] = 0;
      }
      summary.byLevel[achievement.badgeLevel]++;
    });

    return NextResponse.json({
      achievements: userAchievements,
      summary
    });

  } catch (error) {
    logger.error('Failed to fetch achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      achievementType,
      title,
      description,
      iconUrl,
      pointsEarned = 100,
      badgeLevel = BadgeLevel.BRONZE,
      courseId,
      metadata
    } = body;

    // Validate required fields
    if (!achievementType || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure we have a valid user ID
    if (!user.id) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Check if user already has this achievement (based on type and course)
    const existingAchievement = await db.user_achievements.findFirst({
      where: {
        userId: user.id,
        achievementType: achievementType as AchievementType,
        ...(courseId && { courseId })
      }
    });

    if (existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement already unlocked' },
        { status: 409 }
      );
    }

    // Create new achievement
    const newAchievement = await db.user_achievements.create({
      data: {
        id: `${achievementType}_${user.id}_${Date.now()}`,
        userId: user.id,
        achievementType: achievementType as AchievementType,
        title,
        description,
        iconUrl,
        pointsEarned,
        badgeLevel: badgeLevel as BadgeLevel,
        courseId,
        metadata
      },
      include: {
        Course: true,
        User: true
      }
    });

    return NextResponse.json({
      achievement: newAchievement,
      message: 'Achievement unlocked!'
    });

  } catch (error) {
    logger.error('Failed to create achievement:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}