import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get real-time learning pulse data
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Current active session
    const activeSession = await db.learningSession.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        startTime: {
          gte: oneHourAgo
        }
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
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Recent activities (last hour)
    const recentActivities = await db.realtimeActivity.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: oneHourAgo
        }
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
      take: 10
    });

    // Today's learning stats
    const todayStats = await getTodayStats(user.id, todayStart);
    
    // Weekly momentum
    const weeklyMomentum = await getWeeklyMomentum(user.id, weekStart);
    
    // Live metrics
    const liveMetrics = await getLiveMetrics(user.id);
    
    // Current learning state
    const learningState = determineLearningState(activeSession, recentActivities, todayStats);
    
    // AI insights
    const aiInsights = await generateAIInsights(user.id, learningState, todayStats, weeklyMomentum);

    return NextResponse.json({
      timestamp: now.toISOString(),
      activeSession: activeSession ? {
        id: activeSession.id,
        course: activeSession.course,
        chapter: activeSession.chapter,
        duration: activeSession.duration,
        startTime: activeSession.startTime,
        engagementScore: activeSession.engagementScore,
        completionPercentage: activeSession.completionPercentage
      } : null,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        action: activity.action,
        timestamp: activity.timestamp,
        course: activity.course,
        chapter: activity.chapter,
        section: activity.section,
        progress: activity.progress,
        score: activity.score
      })),
      todayStats,
      weeklyMomentum,
      liveMetrics,
      learningState,
      aiInsights,
      recommendations: await getPersonalizedRecommendations(user.id, learningState)
    });

  } catch (error) {
    console.error('Real-time pulse API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function getTodayStats(userId: string, todayStart: Date) {
  const todayActivities = await db.realtimeActivity.findMany({
    where: {
      userId,
      timestamp: {
        gte: todayStart
      }
    }
  });

  const todaySessions = await db.learningSession.findMany({
    where: {
      userId,
      startTime: {
        gte: todayStart
      }
    }
  });

  const coursesStarted = new Set(
    todayActivities
      .filter(a => a.activityType === 'COURSE_START')
      .map(a => a.courseId)
  ).size;

  const chaptersCompleted = todayActivities.filter(
    a => a.activityType === 'CHAPTER_COMPLETE'
  ).length;

  const sectionsCompleted = todayActivities.filter(
    a => a.activityType === 'SECTION_COMPLETE'
  ).length;

  const totalStudyTime = todaySessions.reduce(
    (sum, session) => sum + (session.duration || 0), 
    0
  );

  const avgEngagement = todaySessions.length > 0
    ? todaySessions.reduce((sum, s) => sum + s.engagementScore, 0) / todaySessions.length
    : 0;

  const quizAttempts = todayActivities.filter(
    a => a.activityType.includes('QUIZ')
  ).length;

  const avgQuizScore = todayActivities
    .filter(a => a.activityType.includes('QUIZ') && a.score)
    .reduce((sum, a, _, arr) => sum + (a.score || 0) / arr.length, 0);

  return {
    coursesStarted,
    chaptersCompleted,
    sectionsCompleted,
    totalStudyTime,
    sessionCount: todaySessions.length,
    averageEngagement: Math.round(avgEngagement),
    quizAttempts,
    averageQuizScore: Math.round(avgQuizScore || 0),
    activitiesCount: todayActivities.length
  };
}

async function getWeeklyMomentum(userId: string, weekStart: Date) {
  const weeklyActivities = await db.realtimeActivity.findMany({
    where: {
      userId,
      timestamp: {
        gte: weekStart
      }
    }
  });

  const dailyBreakdown = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayActivities = weeklyActivities.filter(
      a => a.timestamp >= dayStart && a.timestamp < dayEnd
    );

    dailyBreakdown.push({
      date: dayStart.toISOString().split('T')[0],
      activityCount: dayActivities.length,
      studyTime: dayActivities
        .filter(a => a.duration)
        .reduce((sum, a) => sum + (a.duration || 0), 0),
      completions: dayActivities.filter(
        a => a.activityType.includes('COMPLETE')
      ).length
    });
  }

  const totalActivities = weeklyActivities.length;
  const coursesActive = new Set(weeklyActivities.map(a => a.courseId)).size;
  const streak = calculateCurrentStreak(dailyBreakdown);
  
  const momentum = dailyBreakdown.slice(-3).reduce((sum, day) => sum + day.activityCount, 0) / 3;
  const previousMomentum = dailyBreakdown.slice(-6, -3).reduce((sum, day) => sum + day.activityCount, 0) / 3;
  
  const momentumTrend = momentum > previousMomentum * 1.1 ? 'increasing' :
                      momentum < previousMomentum * 0.9 ? 'decreasing' : 'stable';

  return {
    totalActivities,
    coursesActive,
    streak,
    momentum: Math.round(momentum),
    momentumTrend,
    dailyBreakdown,
    weeklyGoalProgress: Math.min(100, (totalActivities / 50) * 100) // Assuming 50 activities per week goal
  };
}

async function getLiveMetrics(userId: string) {
  const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
  const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
  const last30Minutes = new Date(Date.now() - 30 * 60 * 1000);

  const recentActivity = await db.realtimeActivity.findFirst({
    where: {
      userId,
      timestamp: {
        gte: last5Minutes
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  const activitiesLast15Min = await db.realtimeActivity.count({
    where: {
      userId,
      timestamp: {
        gte: last15Minutes
      }
    }
  });

  const activitiesLast30Min = await db.realtimeActivity.count({
    where: {
      userId,
      timestamp: {
        gte: last30Minutes
      }
    }
  });

  const activityRate = activitiesLast30Min / 30; // activities per minute

  return {
    isOnline: !!recentActivity,
    lastActivity: recentActivity?.timestamp,
    activityRate,
    activitiesLast15Min,
    activitiesLast30Min,
    status: recentActivity ? 'active' : 'idle'
  };
}

function determineLearningState(activeSession: any, recentActivities: any[], todayStats: any) {
  if (activeSession) {
    const sessionDuration = activeSession.duration || 0;
    const engagementScore = activeSession.engagementScore;
    
    if (engagementScore < 50) {
      return {
        state: 'struggling',
        description: 'May need assistance with current content',
        color: 'orange',
        priority: 'high'
      };
    } else if (sessionDuration > 60 && engagementScore > 80) {
      return {
        state: 'focused',
        description: 'Deep learning session in progress',
        color: 'green',
        priority: 'low'
      };
    } else {
      return {
        state: 'learning',
        description: 'Active learning session',
        color: 'blue',
        priority: 'medium'
      };
    }
  }

  const recentActivity = recentActivities[0];
  if (recentActivity) {
    const timeSinceLastActivity = Date.now() - new Date(recentActivity.timestamp).getTime();
    
    if (timeSinceLastActivity < 10 * 60 * 1000) { // 10 minutes
      return {
        state: 'recently_active',
        description: 'Recently engaged with content',
        color: 'blue',
        priority: 'low'
      };
    }
  }

  if (todayStats.totalStudyTime > 0) {
    return {
      state: 'resting',
      description: 'Taking a break from learning',
      color: 'gray',
      priority: 'low'
    };
  }

  return {
    state: 'inactive',
    description: 'No recent learning activity',
    color: 'gray',
    priority: 'medium'
  };
}

function calculateCurrentStreak(dailyBreakdown: any[]) {
  let streak = 0;
  for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
    if (dailyBreakdown[i].activityCount > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function generateAIInsights(userId: string, learningState: any, todayStats: any, weeklyMomentum: any) {
  const insights = [];

  // Performance insights
  if (learningState.state === 'struggling') {
    insights.push({
      type: 'urgent',
      icon: '⚠️',
      title: 'Need Help?',
      message: 'Your engagement score is low. Consider reaching out for help or taking a break.',
      action: 'Get AI Tutor Help'
    });
  }

  // Momentum insights
  if (weeklyMomentum.momentumTrend === 'increasing') {
    insights.push({
      type: 'positive',
      icon: '🚀',
      title: 'Building Momentum!',
      message: 'Your learning activity is increasing. Keep up the great work!',
      action: 'View Progress'
    });
  } else if (weeklyMomentum.momentumTrend === 'decreasing') {
    insights.push({
      type: 'motivational',
      icon: '💪',
      title: 'Stay Consistent',
      message: 'Your activity has decreased. Even 15 minutes of study helps maintain momentum.',
      action: 'Quick Study Session'
    });
  }

  // Daily goal insights
  if (todayStats.totalStudyTime === 0) {
    insights.push({
      type: 'encouraging',
      icon: '🎯',
      title: 'Start Your Day',
      message: 'Ready to begin learning? Even a short session makes a difference.',
      action: 'Start Learning'
    });
  } else if (todayStats.totalStudyTime > 60) {
    insights.push({
      type: 'congratulatory',
      icon: '🎉',
      title: 'Great Progress!',
      message: `You've studied for ${Math.round(todayStats.totalStudyTime)} minutes today.`,
      action: 'View Achievements'
    });
  }

  // Streak insights
  if (weeklyMomentum.streak >= 7) {
    insights.push({
      type: 'achievement',
      icon: '🔥',
      title: `${weeklyMomentum.streak} Day Streak!`,
      message: 'Amazing consistency! You\'re building a strong learning habit.',
      action: 'Share Achievement'
    });
  } else if (weeklyMomentum.streak === 0) {
    insights.push({
      type: 'restart',
      icon: '🌟',
      title: 'Fresh Start',
      message: 'Start a new learning streak today. Consistency is key to success.',
      action: 'Begin Streak'
    });
  }

  return insights.slice(0, 3); // Return top 3 insights
}

async function getPersonalizedRecommendations(userId: string, learningState: any) {
  const recommendations = [];

  if (learningState.state === 'inactive') {
    recommendations.push({
      type: 'course',
      title: 'Resume Learning',
      description: 'Continue where you left off',
      action: 'resume',
      priority: 'high'
    });
  }

  if (learningState.state === 'struggling') {
    recommendations.push({
      type: 'help',
      title: 'Get AI Assistance',
      description: 'Ask questions about current topics',
      action: 'ai_tutor',
      priority: 'high'
    });
  }

  if (learningState.state === 'focused') {
    recommendations.push({
      type: 'challenge',
      title: 'Take a Quiz',
      description: 'Test your knowledge with practice questions',
      action: 'quiz',
      priority: 'medium'
    });
  }

  // Always include a motivational recommendation
  recommendations.push({
    type: 'motivational',
    title: 'Daily Goal',
    description: 'Aim for 30 minutes of focused learning',
    action: 'set_goal',
    priority: 'low'
  });

  return recommendations;
}