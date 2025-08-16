// Analytics Dashboard Aggregation Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Type definitions
interface DateFilter {
  startDate?: Date;
  endDate?: Date;
  timeframe: string;
}

interface PerformanceData {
  engagementScore: number;
  completionRate: number;
  timeSpent: number;
}

interface OverviewData {
  totalStudents: number;
  averageProgress: number;
  completionRate: number;
}

interface ContentIssue {
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'student'; // student or teacher
    const courseId = searchParams.get('courseId');
    const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, all

    let data;

    if (view === 'student') {
      data = await getStudentDashboard(user.id, courseId, timeframe);
    } else if (view === 'teacher') {
      if (!courseId) {
        return NextResponse.json({ error: 'courseId required for teacher view' }, { status: 400 });
      }

      // Verify ownership
      const course = await db.course.findUnique({
        where: { id: courseId, userId: user.id }
      });

      if (!course) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      data = await getTeacherDashboard(courseId, timeframe);
    } else {
      return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getStudentDashboard(userId: string, courseId: string | null, timeframe: string) {
  const dateFilter = getDateFilter(timeframe);

  // Overall stats
  const overallStats = await getStudentOverallStats(userId, dateFilter);

  // Course-specific stats if courseId provided
  let courseStats = null;
  if (courseId) {
    courseStats = await getStudentCourseStats(userId, courseId, dateFilter);
  }

  // Recent activity
  const recentActivity = await getRecentActivity(userId, courseId, 10);

  // Learning patterns
  const learningPatterns = await db.pathEnrollment.findMany({
    where: { userId },
    include: {
      LearningPath: true
    },
    take: 5
  });

  // Achievements
  const achievements = await db.user_achievements.findMany({
    where: {
      userId,
      ...(courseId && { courseId })
    },
    orderBy: { unlockedAt: 'desc' },
    take: 5
  });

  // Streaks
  const streakInfo = await db.study_streaks.findFirst({
    where: { userId }
  });

  return {
    overview: {
      totalLearningTime: overallStats.totalTime,
      coursesEnrolled: overallStats.coursesCount,
      averageEngagement: overallStats.avgEngagement,
      currentStreak: streakInfo?.currentStreak || 0
    },
    courseStats,
    recentActivity,
    learningPatterns: learningPatterns.map(enrollment => ({
      pathName: enrollment.LearningPath.name,
      progress: enrollment.progressPercent,
      status: enrollment.status
    })),
    achievements: achievements.map(a => ({
      type: a.achievementType,
      title: a.title,
      earnedAt: a.unlockedAt
    })),
    recommendations: await getPersonalizedRecommendations(userId, courseId)
  };
}

async function getTeacherDashboard(courseId: string, timeframe: string) {
  const dateFilter = getDateFilter(timeframe);

  // Course overview
  const courseOverviewData = await getCourseOverview(courseId, dateFilter);
  const courseOverview = {
    ...courseOverviewData,
    totalStudents: courseOverviewData.activeStudents || 0
  };

  // Student performance
  const studentPerformanceData = await getStudentPerformance(courseId, dateFilter);
  const studentPerformance = studentPerformanceData.map((performance: any) => ({
    ...performance,
    completionRate: 0
  }));

  // Content analytics
  const contentAnalytics = await getContentAnalytics(courseId, dateFilter);

  // Engagement trends
  const engagementTrends = await getEngagementTrends(courseId, timeframe);

  // At-risk students
  const atRiskStudents = await identifyAtRiskStudents(courseId);

  // Content issues - contentFlag model not implemented yet
  const contentIssues: ContentIssue[] = []; // TODO: implement when contentFlag model is available

  return {
    overview: courseOverview,
    studentPerformance,
    contentAnalytics,
    engagementTrends,
    atRiskStudents,
    contentIssues: [],
    insights: await generateInsights(courseId, courseOverview, studentPerformance)
  };
}

function getDateFilter(timeframe: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return { gte: startDate, timeframe };
}

async function getStudentOverallStats(userId: string, dateFilter: DateFilter) {
  const metrics = await db.learning_metrics.aggregate({
    where: {
      userId: userId,
      lastActivityDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    _sum: {
      totalStudyTime: true
    },
    _avg: {
      overallProgress: true
    }
  });

  const courses = await db.enrollment.count({
    where: { userId }
  });

  return {
    totalTime: metrics._sum.totalStudyTime || 0,
    coursesCount: courses,
    avgEngagement: metrics._avg.overallProgress || 0
  };
}

async function getStudentCourseStats(userId: string, courseId: string, dateFilter: DateFilter) {
  const metrics = await db.learning_metrics.aggregate({
    where: {
      userId: userId,
      courseId,
      lastActivityDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    _sum: {
      totalStudyTime: true,
      totalSessions: true
    },
    _avg: {
      overallProgress: true
    }
  });

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  });

  const completedSections = await db.user_progress.count({
    where: {
      userId,
      Section: {
        chapter: {
          courseId
        }
      }
    }
  });

  const totalSections = await db.section.count({
    where: {
      chapter: {
        courseId
      }
    }
  });

  return {
    progress: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
    sectionsCompleted: completedSections,
    totalSections,
    timeSpent: metrics._sum.totalStudyTime || 0,
    interactions: metrics._sum.totalSessions || 0,
    videoTime: 0, // Will need to implement video watch time tracking
    quizAttempts: 0, // Will need to implement quiz attempt tracking
    engagementScore: metrics._avg.overallProgress || 0
  };
}

async function getRecentActivity(userId: string, courseId: string | null, limit: number) {
  const activities = await db.realtime_activities.findMany({
    where: {
      userId,
      ...(courseId && { courseId })
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      Course: {
        select: {
          title: true
        }
      }
    }
  });

  return activities.map(activity => ({
    type: activity.activityType,
    description: activity.action,
    courseTitle: activity.Course?.title,
    timestamp: activity.timestamp
  }));
}

async function getCourseOverview(courseId: string, dateFilter: DateFilter) {
  const enrollments = await db.enrollment.count({
    where: { courseId }
  });

  const activeStudents = await db.realtime_activities.findMany({
    where: {
      courseId,
      timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    distinct: ['userId'],
    select: { userId: true }
  });

  const completions = await db.user_progress.count({
    where: {
      courseId,
      isCompleted: true
    }
  });

  const avgProgress = await db.user_progress.aggregate({
    where: { courseId },
    _avg: { progressPercent: true }
  });

  return {
    totalEnrollments: enrollments,
    activeStudents: activeStudents.length,
    completions,
    averageProgress: avgProgress._avg.progressPercent || 0,
    completionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0
  };
}

async function getStudentPerformance(courseId: string, dateFilter: DateFilter) {
  const metrics = await db.learning_metrics.groupBy({
    by: ['userId'],
    where: {
      courseId,
      lastActivityDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    _sum: {
      totalStudyTime: true,
      totalSessions: true
    },
    _avg: {
      overallProgress: true
    },
    orderBy: {
      _avg: {
        overallProgress: 'desc'
      }
    },
    take: 10
  });

  return metrics.map(m => ({
    studentId: m.userId,
    timeSpent: m._sum.totalStudyTime || 0,
    interactions: m._sum.totalSessions || 0,
    engagementScore: m._avg.overallProgress || 0
  }));
}

async function getContentAnalytics(courseId: string, dateFilter: DateFilter) {
  const sections = await db.section.findMany({
    where: {
      chapter: {
        courseId
      }
    },
    select: { id: true, title: true }
  });

  const sectionAnalytics = await Promise.all(
    sections.map(async (section) => {
      const views = await db.realtime_activities.count({
        where: {
          sectionId: section.id,
          action: 'section_view',
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      const completions = await db.user_progress.count({
        where: {
          sectionId: section.id,
          isCompleted: true
        }
      });

      const avgTime = await db.user_progress.aggregate({
        where: {
          sectionId: section.id,
          timeSpent: { gt: 0 }
        },
        _avg: { timeSpent: true }
      });

      return {
        sectionId: section.id,
        title: section.title,
        views,
        completions,
        averageTime: avgTime._avg.timeSpent || 0,
        completionRate: views > 0 ? (completions / views) * 100 : 0
      };
    })
  );

  return sectionAnalytics.sort((a, b) => b.views - a.views);
}

async function getEngagementTrends(courseId: string, timeframe: string) {
  const points = timeframe === '1d' ? 24 : timeframe === '7d' ? 7 : 30;
  const interval = timeframe === '1d' ? 'hour' : 'day';
  
  // This is a simplified version - in production, you'd want more sophisticated time grouping
  const trends = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const startTime = new Date(now);
    const endTime = new Date(now);
    
    if (interval === 'hour') {
      startTime.setHours(now.getHours() - i - 1);
      endTime.setHours(now.getHours() - i);
    } else {
      startTime.setDate(now.getDate() - i - 1);
      endTime.setDate(now.getDate() - i);
    }
    
    const interactions = await db.realtime_activities.count({
      where: {
        courseId,
        timestamp: {
          gte: startTime,
          lt: endTime
        }
      }
    });
    
    trends.push({
      time: endTime.toISOString(),
      interactions
    });
  }
  
  return trends;
}

async function identifyAtRiskStudents(courseId: string) {
  // Students with low engagement or falling behind
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const enrolledStudents = await db.enrollment.findMany({
    where: {
      courseId
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  const atRiskList = [];

  for (const enrollment of enrolledStudents) {
    const recentActivity = await db.realtime_activities.count({
      where: {
        userId: enrollment.userId,
        courseId,
        timestamp: {
          gte: twoWeeksAgo
        }
      }
    });

    const avgEngagement = await db.learning_metrics.aggregate({
      where: {
        userId: enrollment.userId,
        courseId
      },
      _avg: {
        overallProgress: true
      }
    });

    if (recentActivity < 5 || (avgEngagement._avg.overallProgress || 0) < 30) {
      atRiskList.push({
        studentId: enrollment.userId,
        name: enrollment.User.name,
        email: enrollment.User.email,
        progress: 0, // Calculate from user_progress if needed
        lastActive: enrollment.updatedAt,
        recentInteractions: recentActivity,
        engagementScore: avgEngagement._avg.overallProgress || 0,
        riskLevel: recentActivity === 0 ? 'high' : 'medium'
      });
    }
  }

  return atRiskList.sort((a, b) => {
    if (a.riskLevel === 'high' && b.riskLevel === 'medium') return -1;
    if (a.riskLevel === 'medium' && b.riskLevel === 'high') return 1;
    return a.engagementScore - b.engagementScore;
  });
}

async function getPersonalizedRecommendations(userId: string, courseId: string | null) {
  const recommendations = [];

  // Get learning metrics (replaced learningPattern with learning_metrics)
  const metrics = await db.learning_metrics.findFirst({
    where: { userId: userId }
  });

  if (metrics) {
    // Recommend based on learning velocity
    if (metrics.learningVelocity > 0.8) {
      recommendations.push({
        type: 'learning_pace',
        message: 'You have excellent learning velocity! Consider taking on more challenging content.',
        priority: 'medium'
      });
    }

    // Struggling areas recommendations
    if (metrics.strugglingAreas.length > 0) {
      recommendations.push({
        type: 'struggling_areas',
        message: `Focus on improving in: ${metrics.strugglingAreas.join(', ')}`,
        priority: 'high'
      });
    }

    // Session duration recommendations
    if (metrics.averageSessionDuration < 30) {
      recommendations.push({
        type: 'session_duration',
        message: 'Try extending your study sessions to 30+ minutes for better retention.',
        priority: 'medium'
      });
    }
  }

  // Course-specific recommendations
  if (courseId) {
    const courseMetrics = await db.learning_metrics.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      },
      orderBy: { lastActivityDate: 'desc' }
    });

    if (courseMetrics && courseMetrics.riskScore > 0.7) {
      recommendations.push({
        type: 'engagement',
        message: 'Your engagement is below average. Try breaking study sessions into smaller chunks.',
        priority: 'high'
      });
    }
  }

  return recommendations;
}

async function generateInsights(courseId: string, overview: OverviewData, performance: PerformanceData[]) {
  const insights = [];

  // Completion rate insight
  if (overview.completionRate < 50) {
    insights.push({
      type: 'completion',
      severity: 'warning',
      message: `Course completion rate is ${overview.completionRate.toFixed(1)}%. Consider reviewing course difficulty.`
    });
  }

  // Engagement insight
  const avgEngagement = performance.reduce((sum: number, p: PerformanceData) => sum + p.engagementScore, 0) / performance.length;
  if (avgEngagement < 60) {
    insights.push({
      type: 'engagement',
      severity: 'warning',
      message: 'Average student engagement is low. Consider adding more interactive content.'
    });
  }

  // Active students insight
  const activeRate = 75; // Default rate
  if (activeRate < 70) {
    insights.push({
      type: 'activity',
      severity: 'info',
      message: `Only ${activeRate.toFixed(1)}% of enrolled students are active. Send reminder emails.`
    });
  }

  return insights;
}

async function getContentIdsForCourse(courseId: string): Promise<string[]> {
  const sections = await db.section.findMany({
    where: {
      chapter: {
        courseId
      }
    },
    select: { id: true }
  });

  return sections.map(s => s.id);
}