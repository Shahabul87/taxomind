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
    
    // Log to help debug frequent calls
    console.log('[Progress Metrics API] Called at:', new Date().toISOString());

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    // Return mock data since learningMetrics and learningSession models don't exist in schema
    const mockMetrics = [
      {
        id: '1',
        userId: session.user.id,
        courseId: 'react-101',
        overallProgress: 68,
        learningVelocity: 3.2,
        engagementTrend: 'STABLE',
        strugglingAreas: ['State Management', 'Hooks'],
        strengths: ['Components', 'Props'],
        riskScore: 25,
        lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        averageSessionDuration: 45,
        totalStudyTime: 1250,
        totalSessions: 28,
        completedSessions: 19,
        averageEngagementScore: 78,
        course: {
          id: 'react-101',
          title: 'React Fundamentals',
          imageUrl: '/courses/react.jpg'
        }
      },
      {
        id: '2',
        userId: session.user.id,
        courseId: 'js-advanced',
        overallProgress: 45,
        learningVelocity: 2.1,
        engagementTrend: 'DECLINING',
        strugglingAreas: ['Async Programming', 'Promises'],
        strengths: ['Functions', 'ES6 Syntax'],
        riskScore: 60,
        lastActivityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        averageSessionDuration: 38,
        totalStudyTime: 890,
        totalSessions: 23,
        completedSessions: 10,
        averageEngagementScore: 65,
        course: {
          id: 'js-advanced',
          title: 'Advanced JavaScript',
          imageUrl: '/courses/javascript.jpg'
        }
      }
    ];

    if (courseId) {
      // Get metrics for specific course
      const metrics = mockMetrics.find(m => m.courseId === courseId) || null;

      if (!metrics) {
        return NextResponse.json({
          success: true,
          metrics: null,
          message: "No metrics found for this course"
        });
      }

      // Mock trend data
      const trendData = {
        dailyEngagement: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          engagement: Math.floor(Math.random() * 20) + 70,
          duration: Math.floor(Math.random() * 30) + 30
        })),
        weeklyProgress: [
          { week: '2025-01-07', chaptersCompleted: 3, totalTime: 180 },
          { week: '2025-01-14', chaptersCompleted: 2, totalTime: 140 },
        ],
        strugglingPatterns: metrics.strugglingAreas.map(area => ({
          area,
          frequency: Math.floor(Math.random() * 5) + 1
        })),
        improvementAreas: metrics.strengths.map(skill => ({
          skill,
          improvement: Math.floor(Math.random() * 20) + 10
        }))
      };

      return NextResponse.json({
        success: true,
        metrics,
        trends: trendData,
        sessionCount: metrics.totalSessions
      });

    } else {
      // Get metrics for all courses
      const allMetrics = mockMetrics;

      // Calculate overall statistics
      const overallStats = calculateOverallStats(allMetrics);

      return NextResponse.json({
        success: true,
        metrics: allMetrics,
        overallStats,
        recentAlerts: 2,
        criticalAlerts: 1
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

    // Return mock response since learningMetrics model doesn't exist
    const mockUpdatedMetrics = {
      id: Date.now().toString(),
      userId: session.user.id,
      courseId,
      overallProgress: Math.floor(Math.random() * 30) + 50,
      learningVelocity: Math.random() * 3 + 1,
      engagementTrend: 'STABLE',
      strugglingAreas: ['New Topic'],
      strengths: ['Previous Topic'],
      riskScore: Math.floor(Math.random() * 50),
      lastActivityDate: new Date(),
      averageSessionDuration: 45,
      totalStudyTime: 1000,
      totalSessions: 20,
      completedSessions: 12,
      averageEngagementScore: 75
    };

    return NextResponse.json({
      success: true,
      metrics: mockUpdatedMetrics
    });

    /* Original code - commented out until models are added to schema
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
    */

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

// Commented out until learningSession and learningMetrics models are added to schema
/*
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
*/

function getWeekKey(date: Date): string {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toISOString().split('T')[0];
}