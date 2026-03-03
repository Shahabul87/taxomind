import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'DAILY';
    const courseId = searchParams.get('courseId');
    
    // Get user's learning metrics
    const learning_metrics = await db.learning_metrics.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Get performance metrics
    const performance_metrics = await db.performance_metrics.findMany({
      where: {
        userId: user.id,
        period: period as any
      },
      orderBy: {
        date: 'desc'
      },
      take: 30
    });

    // Get recent learning sessions
    const learning_sessions = await db.learning_sessions.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true
          }
        },
        Chapter: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 20
    });

    // Get study streaks
    const study_streakss = await db.study_streaks.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastStudyDate: 'desc'
      },
      take: 200,
    });

    // Get user progress
    const user_progress = await db.user_progress.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        Chapter: {
          select: {
            id: true,
            title: true
          }
        },
        Section: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
      take: 500,
    });

    // Get achievements
    const achievements = await db.user_achievements.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        unlockedAt: 'desc'
      },
      take: 10
    });

    // Calculate aggregate statistics
    const totalLearningTime = learning_sessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0
    );

    const averageEngagementScore = learning_metrics.length > 0 
      ? learning_metrics.reduce((sum, metric) => sum + metric.averageEngagementScore, 0) / learning_metrics.length
      : 0;

    const overallProgress = user_progress.length > 0
      ? user_progress.reduce((sum, progress) => sum + progress.progressPercent, 0) / user_progress.length
      : 0;

    const currentStreak = study_streakss.length > 0
      ? Math.max(...study_streakss.map(streak => streak.currentStreak))
      : 0;

    // Get recent activity trends
    const recentSessions = learning_sessions.slice(0, 7);
    const weeklyActivity = recentSessions.map(session => ({
      date: session.startTime.toISOString().split('T')[0],
      duration: session.duration || 0,
      engagementScore: session.engagementScore
    }));

    // Performance trend analysis
    const recentMetrics = performance_metrics.slice(0, 7);
    const learningVelocityTrend = recentMetrics.length >= 2
      ? recentMetrics[0].learningVelocity > recentMetrics[recentMetrics.length - 1].learningVelocity
        ? 'IMPROVING' : 'DECLINING'
      : 'STABLE';

    return NextResponse.json({
      summary: {
        totalLearningTime,
        averageEngagementScore: Math.round(averageEngagementScore),
        overallProgress: Math.round(overallProgress),
        currentStreak,
        totalAchievements: achievements.length,
        activeCourses: new Set(user_progress.map(p => p.courseId)).size
      },
      learning_metrics,
      performance_metrics,
      learning_sessions: learning_sessions.slice(0, 10),
      study_streakss,
      user_progress,
      achievements,
      trends: {
        weeklyActivity,
        learningVelocityTrend,
        engagementTrend: recentMetrics.length > 0 ? recentMetrics[0].engagementTrend : 'STABLE',
        performanceTrend: recentMetrics.length > 0 ? recentMetrics[0].performanceTrend : 'STABLE'
      },
      insights: {
        strongestSubjects: learning_metrics
          .filter(m => m.averageEngagementScore > 80)
          .map(m => m.Course?.title)
          .filter(Boolean)
          .slice(0, 3),
        areasForImprovement: learning_metrics
          .filter(m => m.riskScore > 50)
          .map(m => m.Course?.title)
          .filter(Boolean)
          .slice(0, 3),
        recommendedStudyTime: Math.max(
          30, 
          Math.round(totalLearningTime / Math.max(learning_sessions.length, 1))
        )
      }
    });

  } catch (error) {
    logger.error('Dashboard analytics API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}