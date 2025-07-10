import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const activityType = searchParams.get('type');
    const courseId = searchParams.get('courseId');
    
    // Get recent activities
    const activities = await db.realtimeActivity.findMany({
      where: {
        userId: user.id,
        ...(activityType && { activityType: activityType as any }),
        ...(courseId && { courseId })
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        chapter: {
          select: {
            id: true,
            title: true
          }
        },
        section: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    // Get activity statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = await db.realtimeActivity.count({
      where: {
        userId: user.id,
        timestamp: {
          gte: today
        }
      }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyActivities = await db.realtimeActivity.count({
      where: {
        userId: user.id,
        timestamp: {
          gte: weekAgo
        }
      }
    });

    // Get activity distribution by type
    const activityDistribution = await db.realtimeActivity.groupBy({
      by: ['activityType'],
      where: {
        userId: user.id,
        timestamp: {
          gte: weekAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Get hourly activity pattern
    const hourlyPattern = await db.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM realtime_activities 
      WHERE user_id = ${user.id}
        AND timestamp >= ${weekAgo}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    ` as Array<{ hour: number; count: number }>;

    // Calculate learning momentum
    const recentSessions = activities.filter(a => 
      ['COURSE_START', 'CHAPTER_START', 'SECTION_START'].includes(a.activityType)
    );
    
    const completions = activities.filter(a => 
      ['COURSE_COMPLETE', 'CHAPTER_COMPLETE', 'SECTION_COMPLETE'].includes(a.activityType)
    );

    const momentum = recentSessions.length > 0 
      ? (completions.length / recentSessions.length) * 100 
      : 0;

    return NextResponse.json({
      activities: activities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        action: activity.action,
        timestamp: activity.timestamp,
        duration: activity.duration,
        progress: activity.progress,
        score: activity.score,
        course: activity.course,
        chapter: activity.chapter,
        section: activity.section,
        metadata: activity.metadata
      })),
      statistics: {
        todayCount: todayActivities,
        weeklyCount: weeklyActivities,
        learningMomentum: Math.round(momentum),
        averageSessionLength: activities
          .filter(a => a.duration)
          .reduce((sum, a) => sum + (a.duration || 0), 0) / 
          Math.max(activities.filter(a => a.duration).length, 1)
      },
      patterns: {
        activityDistribution: activityDistribution.map(item => ({
          type: item.activityType,
          count: item._count.id
        })),
        hourlyPattern: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: hourlyPattern.find(p => p.hour === hour)?.count || 0
        }))
      },
      insights: {
        mostActiveHour: hourlyPattern.reduce((max, current) => 
          current.count > max.count ? current : max, 
          { hour: 0, count: 0 }
        ).hour,
        streakDays: await calculateStreakDays(user.id),
        favoriteActivityType: activityDistribution.reduce((max, current) => 
          current._count.id > max._count.id ? current : max,
          { activityType: 'COURSE_START', _count: { id: 0 } }
        ).activityType
      }
    });

  } catch (error) {
    console.error('Activity tracking API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const {
      activityType,
      action,
      entityType,
      entityId,
      courseId,
      chapterId,
      sectionId,
      duration,
      progress,
      score,
      metadata,
      sessionId
    } = body;

    // Create new activity record
    const activity = await db.realtimeActivity.create({
      data: {
        userId: user.id,
        activityType,
        action,
        entityType,
        entityId,
        courseId,
        chapterId,
        sectionId,
        duration,
        progress,
        score,
        metadata,
        sessionId,
        timestamp: new Date()
      }
    });

    // Update or create learning session if applicable
    if (sessionId && ['COURSE_START', 'CHAPTER_START', 'SECTION_START'].includes(activityType)) {
      await updateLearningSession(user.id, sessionId, {
        courseId,
        chapterId,
        activityType,
        duration,
        progress
      });
    }

    // Update user progress if applicable
    if (progress !== undefined) {
      await updateUserProgress(user.id, {
        courseId,
        chapterId,
        sectionId,
        progress,
        timeSpent: duration
      });
    }

    // Check for achievements
    await checkAchievements(user.id, activityType, { courseId, chapterId, sectionId });

    return NextResponse.json({ 
      success: true, 
      activityId: activity.id,
      message: 'Activity tracked successfully'
    });

  } catch (error) {
    console.error('Activity creation API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function calculateStreakDays(userId: string): Promise<number> {
  const activities = await db.realtimeActivity.findMany({
    where: {
      userId,
      activityType: {
        in: ['COURSE_START', 'CHAPTER_START', 'SECTION_START']
      }
    },
    select: {
      timestamp: true
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  if (activities.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDates = new Set(
    activities.map(a => a.timestamp.toISOString().split('T')[0])
  );

  while (activityDates.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

async function updateLearningSession(
  userId: string, 
  sessionId: string, 
  data: {
    courseId?: string;
    chapterId?: string;
    activityType: string;
    duration?: number;
    progress?: number;
  }
) {
  const existingSession = await db.learningSession.findFirst({
    where: {
      userId,
      id: sessionId
    }
  });

  if (existingSession) {
    await db.learningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        duration: (existingSession.duration || 0) + (data.duration || 0),
        completionPercentage: data.progress || existingSession.completionPercentage,
        interactionCount: existingSession.interactionCount + 1,
        status: data.activityType.includes('COMPLETE') ? 'COMPLETED' : 'ACTIVE'
      }
    });
  } else {
    await db.learningSession.create({
      data: {
        id: sessionId,
        userId,
        courseId: data.courseId,
        chapterId: data.chapterId,
        startTime: new Date(),
        duration: data.duration || 0,
        completionPercentage: data.progress || 0,
        interactionCount: 1,
        status: 'ACTIVE'
      }
    });
  }
}

async function updateUserProgress(
  userId: string,
  data: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    progress: number;
    timeSpent?: number;
  }
) {
  const existing = await db.userProgress.findFirst({
    where: {
      userId,
      courseId: data.courseId,
      chapterId: data.chapterId,
      sectionId: data.sectionId
    }
  });

  if (existing) {
    await db.userProgress.update({
      where: { id: existing.id },
      data: {
        progressPercent: Math.max(existing.progressPercent, data.progress),
        timeSpent: existing.timeSpent + (data.timeSpent || 0),
        lastAccessedAt: new Date(),
        isCompleted: data.progress >= 100,
        completedAt: data.progress >= 100 ? new Date() : existing.completedAt
      }
    });
  } else {
    await db.userProgress.create({
      data: {
        userId,
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
        progressPercent: data.progress,
        timeSpent: data.timeSpent || 0,
        isCompleted: data.progress >= 100,
        completedAt: data.progress >= 100 ? new Date() : null,
        lastAccessedAt: new Date()
      }
    });
  }
}

async function checkAchievements(
  userId: string,
  activityType: string,
  context: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
) {
  // First course achievement
  if (activityType === 'COURSE_START') {
    const existingAchievement = await db.userAchievement.findFirst({
      where: {
        userId,
        achievementType: 'FIRST_COURSE'
      }
    });

    if (!existingAchievement) {
      await db.userAchievement.create({
        data: {
          userId,
          achievementType: 'FIRST_COURSE',
          title: 'First Steps',
          description: 'Started your first course!',
          pointsEarned: 10,
          badgeLevel: 'BRONZE',
          courseId: context.courseId
        }
      });
    }
  }

  // Course completion achievement
  if (activityType === 'COURSE_COMPLETE') {
    await db.userAchievement.create({
      data: {
        userId,
        achievementType: 'COURSE_COMPLETION',
        title: 'Course Complete',
        description: 'Completed a full course!',
        pointsEarned: 100,
        badgeLevel: 'GOLD',
        courseId: context.courseId
      }
    });
  }

  // Add more achievement logic as needed
}