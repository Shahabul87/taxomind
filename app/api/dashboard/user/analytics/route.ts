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
    const period = searchParams.get('period') || 'DAILY';
    const courseId = searchParams.get('courseId');
    
    // Get user's learning metrics
    const learningMetrics = await db.learningMetrics.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        course: {
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
    const performanceMetrics = await db.performanceMetrics.findMany({
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
    const learningSessions = await db.learningSession.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
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
      },
      take: 20
    });

    // Get study streaks
    const studyStreaks = await db.studyStreak.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastStudyDate: 'desc'
      }
    });

    // Get user progress
    const userProgress = await db.userProgress.findMany({
      where: {
        userId: user.id,
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
        lastAccessedAt: 'desc'
      }
    });

    // Get achievements
    const achievements = await db.userAchievement.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId })
      },
      include: {
        course: {
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
    const totalLearningTime = learningSessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0
    );

    const averageEngagementScore = learningMetrics.length > 0 
      ? learningMetrics.reduce((sum, metric) => sum + metric.averageEngagementScore, 0) / learningMetrics.length
      : 0;

    const overallProgress = userProgress.length > 0
      ? userProgress.reduce((sum, progress) => sum + progress.progressPercent, 0) / userProgress.length
      : 0;

    const currentStreak = studyStreaks.length > 0
      ? Math.max(...studyStreaks.map(streak => streak.currentStreak))
      : 0;

    // Get recent activity trends
    const recentSessions = learningSessions.slice(0, 7);
    const weeklyActivity = recentSessions.map(session => ({
      date: session.startTime.toISOString().split('T')[0],
      duration: session.duration || 0,
      engagementScore: session.engagementScore
    }));

    // Performance trend analysis
    const recentMetrics = performanceMetrics.slice(0, 7);
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
        activeCourses: new Set(userProgress.map(p => p.courseId)).size
      },
      learningMetrics,
      performanceMetrics,
      learningSessions: learningSessions.slice(0, 10),
      studyStreaks,
      userProgress,
      achievements,
      trends: {
        weeklyActivity,
        learningVelocityTrend,
        engagementTrend: recentMetrics.length > 0 ? recentMetrics[0].engagementTrend : 'STABLE',
        performanceTrend: recentMetrics.length > 0 ? recentMetrics[0].performanceTrend : 'STABLE'
      },
      insights: {
        strongestSubjects: learningMetrics
          .filter(m => m.averageEngagementScore > 80)
          .map(m => m.course?.title)
          .filter(Boolean)
          .slice(0, 3),
        areasForImprovement: learningMetrics
          .filter(m => m.riskScore > 50)
          .map(m => m.course?.title)
          .filter(Boolean)
          .slice(0, 3),
        recommendedStudyTime: Math.max(
          30, 
          Math.round(totalLearningTime / Math.max(learningSessions.length, 1))
        )
      }
    });

  } catch (error) {
    console.error('Dashboard analytics API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}