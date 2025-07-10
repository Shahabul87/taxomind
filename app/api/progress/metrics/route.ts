import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Get user's learning metrics
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    if (courseId) {
      // Get metrics for specific course
      const metrics = await db.learningMetrics.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true
            }
          }
        }
      });

      if (!metrics) {
        return NextResponse.json({
          success: true,
          metrics: null,
          message: "No metrics found for this course"
        });
      }

      // Get recent sessions for trend analysis
      const recentSessions = await db.learningSession.findMany({
        where: {
          userId: session.user.id,
          courseId,
          startTime: {
            gte: new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Calculate trend data
      const trendData = calculateTrendData(recentSessions, parseInt(timeframe));

      return NextResponse.json({
        success: true,
        metrics,
        trends: trendData,
        sessionCount: recentSessions.length
      });

    } else {
      // Get metrics for all courses
      const allMetrics = await db.learningMetrics.findMany({
        where: {
          userId: session.user.id
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
          lastActivityDate: 'desc'
        }
      });

      // Calculate overall statistics
      const overallStats = calculateOverallStats(allMetrics);

      // Get recent alerts summary
      const recentAlerts = await db.progressAlert.findMany({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
          }
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
          createdAt: 'desc'
        },
        take: 10
      });

      return NextResponse.json({
        success: true,
        metrics: allMetrics,
        overallStats,
        recentAlerts: recentAlerts.length,
        criticalAlerts: recentAlerts.filter(a => a.severity === 'CRITICAL').length
      });
    }

  } catch (error) {
    console.error("Get learning metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning metrics" },
      { status: 500 }
    );
  }
}

// Update or recalculate metrics for a specific course
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Recalculate metrics
    const updatedMetrics = await recalculateMetrics(session.user.id, courseId);

    return NextResponse.json({
      success: true,
      metrics: updatedMetrics
    });

  } catch (error) {
    console.error("Update learning metrics error:", error);
    return NextResponse.json(
      { error: "Failed to update learning metrics" },
      { status: 500 }
    );
  }
}

function calculateTrendData(sessions: any[], timeframeDays: number) {
  const trendData = {
    dailyEngagement: [] as Array<{date: string, engagement: number, duration: number}>,
    weeklyProgress: [] as Array<{week: string, chaptersCompleted: number, totalTime: number}>,
    strugglingPatterns: [] as Array<{area: string, frequency: number}>,
    improvementAreas: [] as Array<{skill: string, improvement: number}>
  };

  // Group sessions by day
  const sessionsByDay = sessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate daily engagement
  Object.entries(sessionsByDay).forEach(([date, daySessions]) => {
    const avgEngagement = daySessions.reduce((sum, s) => sum + s.engagementScore, 0) / daySessions.length;
    const totalDuration = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    trendData.dailyEngagement.push({
      date,
      engagement: Math.round(avgEngagement),
      duration: totalDuration
    });
  });

  // Sort by date
  trendData.dailyEngagement.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate weekly progress
  const weeklyData = sessions.reduce((acc, session) => {
    const week = getWeekKey(new Date(session.startTime));
    if (!acc[week]) {
      acc[week] = { chapters: new Set(), totalTime: 0 };
    }
    if (session.chapterId) {
      acc[week].chapters.add(session.chapterId);
    }
    acc[week].totalTime += session.duration || 0;
    return acc;
  }, {} as Record<string, {chapters: Set<string>, totalTime: number}>);

  Object.entries(weeklyData).forEach(([week, data]) => {
    trendData.weeklyProgress.push({
      week,
      chaptersCompleted: data.chapters.size,
      totalTime: data.totalTime
    });
  });

  // Identify struggling patterns
  const strugglingAreas = sessions
    .filter(s => s.engagementScore < 50)
    .reduce((acc, session) => {
      const area = session.chapterId || 'unknown';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  Object.entries(strugglingAreas).forEach(([area, frequency]) => {
    trendData.strugglingPatterns.push({ area, frequency });
  });

  return trendData;
}

function calculateOverallStats(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalCourses: 0,
      averageProgress: 0,
      totalStudyTime: 0,
      averageRiskScore: 0,
      activeCourses: 0,
      completedCourses: 0
    };
  }

  const totalProgress = metrics.reduce((sum, m) => sum + m.overallProgress, 0);
  const totalStudyTime = metrics.reduce((sum, m) => sum + m.totalStudyTime, 0);
  const totalRiskScore = metrics.reduce((sum, m) => sum + m.riskScore, 0);
  const activeCourses = metrics.filter(m => m.overallProgress > 0 && m.overallProgress < 100).length;
  const completedCourses = metrics.filter(m => m.overallProgress >= 100).length;

  return {
    totalCourses: metrics.length,
    averageProgress: Math.round(totalProgress / metrics.length),
    totalStudyTime: Math.round(totalStudyTime),
    averageRiskScore: Math.round(totalRiskScore / metrics.length),
    activeCourses,
    completedCourses,
    averageEngagement: Math.round(
      metrics.reduce((sum, m) => sum + m.averageEngagementScore, 0) / metrics.length
    ),
    learningVelocity: Math.round(
      metrics.reduce((sum, m) => sum + m.learningVelocity, 0) / metrics.length * 10
    ) / 10
  };
}

async function recalculateMetrics(userId: string, courseId: string) {
  // Get all sessions for this user and course
  const sessions = await db.learningSession.findMany({
    where: {
      userId,
      courseId
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  if (sessions.length === 0) {
    return null;
  }

  // Calculate metrics (similar to the logic in session update)
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;
  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const averageSessionDuration = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
  const averageEngagementScore = totalSessions > 0 
    ? sessions.reduce((sum, s) => sum + s.engagementScore, 0) / totalSessions 
    : 0;

  // Calculate learning velocity
  const recentSessions = sessions.filter(s => 
    new Date(s.startTime).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
  );
  const uniqueChapters = new Set(recentSessions.map(s => s.chapterId).filter(Boolean));
  const learningVelocity = uniqueChapters.size;

  // Mock progress calculation (replace with actual logic)
  const overallProgress = Math.min(100, (completedSessions / Math.max(totalSessions, 10)) * 100);

  // Check if metrics already exist
  const existingMetrics = await db.learningMetrics.findFirst({
    where: { userId, courseId }
  });

  // Update or create metrics in database
  const updatedMetrics = existingMetrics 
    ? await db.learningMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          overallProgress,
          learningVelocity,
          lastActivityDate: new Date(),
          averageSessionDuration,
          totalStudyTime,
          totalSessions,
          completedSessions,
          averageEngagementScore
        }
      })
    : await db.learningMetrics.create({
        data: {
          userId,
          courseId,
          overallProgress,
          learningVelocity,
          engagementTrend: "STABLE",
          strugglingAreas: [],
          strengths: [],
          riskScore: 0,
          lastActivityDate: new Date(),
          averageSessionDuration,
          totalStudyTime,
          totalSessions,
          completedSessions,
          averageEngagementScore
        }
      });

  return updatedMetrics;
}

function getWeekKey(date: Date): string {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toISOString().split('T')[0];
}