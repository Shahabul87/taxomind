// Analytics Dashboard Aggregation Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
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
    console.error('Dashboard error:', error);
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
  const learningPatterns = await db.learningPattern.findUnique({
    where: { studentId: userId }
  });

  // Achievements
  const achievements = await db.userAchievement.findMany({
    where: {
      userId,
      ...(courseId && { courseId })
    },
    orderBy: { earnedAt: 'desc' },
    take: 5
  });

  // Streaks
  const streakInfo = await db.streakInfo.findUnique({
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
    learningPatterns: learningPatterns ? {
      preferredTimes: learningPatterns.preferredStudyTime,
      contentPreferences: learningPatterns.contentPreferences,
      learningVelocity: learningPatterns.learningVelocity
    } : null,
    achievements: achievements.map(a => ({
      type: a.achievementType,
      title: a.title,
      earnedAt: a.earnedAt
    })),
    recommendations: await getPersonalizedRecommendations(userId, courseId)
  };
}

async function getTeacherDashboard(courseId: string, timeframe: string) {
  const dateFilter = getDateFilter(timeframe);

  // Course overview
  const courseOverview = await getCourseOverview(courseId, dateFilter);

  // Student performance
  const studentPerformance = await getStudentPerformance(courseId, dateFilter);

  // Content analytics
  const contentAnalytics = await getContentAnalytics(courseId, dateFilter);

  // Engagement trends
  const engagementTrends = await getEngagementTrends(courseId, timeframe);

  // At-risk students
  const atRiskStudents = await identifyAtRiskStudents(courseId);

  // Content issues
  const contentIssues = await db.contentFlag.findMany({
    where: {
      contentId: {
        in: await getContentIdsForCourse(courseId)
      }
    },
    orderBy: { count: 'desc' },
    take: 10
  });

  return {
    overview: courseOverview,
    studentPerformance,
    contentAnalytics,
    engagementTrends,
    atRiskStudents,
    contentIssues: contentIssues.map(issue => ({
      type: issue.flagType,
      contentId: issue.contentId,
      count: issue.count,
      metadata: issue.metadata
    })),
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

  return { gte: startDate };
}

async function getStudentOverallStats(userId: string, dateFilter: any) {
  const metrics = await db.learningMetric.aggregate({
    where: {
      studentId: userId,
      date: dateFilter
    },
    _sum: {
      totalTimeSpent: true
    },
    _avg: {
      engagementScore: true
    }
  });

  const courses = await db.userCourseEnrollment.count({
    where: { userId }
  });

  return {
    totalTime: metrics._sum.totalTimeSpent || 0,
    coursesCount: courses,
    avgEngagement: metrics._avg.engagementScore || 0
  };
}

async function getStudentCourseStats(userId: string, courseId: string, dateFilter: any) {
  const metrics = await db.learningMetric.aggregate({
    where: {
      studentId: userId,
      courseId,
      date: dateFilter
    },
    _sum: {
      totalTimeSpent: true,
      totalInteractions: true,
      videoWatchTime: true,
      quizAttempts: true
    },
    _avg: {
      engagementScore: true
    }
  });

  const enrollment = await db.userCourseEnrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  });

  const completedSections = await db.userSectionCompletion.count({
    where: {
      userId,
      section: {
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
    progress: enrollment?.progressPercentage || 0,
    sectionsCompleted: completedSections,
    totalSections,
    timeSpent: metrics._sum.totalTimeSpent || 0,
    interactions: metrics._sum.totalInteractions || 0,
    videoTime: metrics._sum.videoWatchTime || 0,
    quizAttempts: metrics._sum.quizAttempts || 0,
    engagementScore: metrics._avg.engagementScore || 0
  };
}

async function getRecentActivity(userId: string, courseId: string | null, limit: number) {
  const activities = await db.recentActivity.findMany({
    where: {
      userId,
      ...(courseId && { courseId })
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      course: {
        select: {
          title: true
        }
      }
    }
  });

  return activities.map(activity => ({
    type: activity.activityType,
    description: activity.description,
    courseTitle: activity.course?.title,
    timestamp: activity.createdAt
  }));
}

async function getCourseOverview(courseId: string, dateFilter: any) {
  const enrollments = await db.userCourseEnrollment.count({
    where: { courseId }
  });

  const activeStudents = await db.studentInteraction.findMany({
    where: {
      courseId,
      timestamp: dateFilter
    },
    distinct: ['studentId'],
    select: { studentId: true }
  });

  const completions = await db.userCourseEnrollment.count({
    where: {
      courseId,
      completedAt: { not: null }
    }
  });

  const avgProgress = await db.userCourseEnrollment.aggregate({
    where: { courseId },
    _avg: { progressPercentage: true }
  });

  return {
    totalEnrollments: enrollments,
    activeStudents: activeStudents.length,
    completions,
    averageProgress: avgProgress._avg.progressPercentage || 0,
    completionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0
  };
}

async function getStudentPerformance(courseId: string, dateFilter: any) {
  const metrics = await db.learningMetric.groupBy({
    by: ['studentId'],
    where: {
      courseId,
      date: dateFilter
    },
    _sum: {
      totalTimeSpent: true,
      totalInteractions: true
    },
    _avg: {
      engagementScore: true
    },
    orderBy: {
      _avg: {
        engagementScore: 'desc'
      }
    },
    take: 10
  });

  return metrics.map(m => ({
    studentId: m.studentId,
    timeSpent: m._sum.totalTimeSpent || 0,
    interactions: m._sum.totalInteractions || 0,
    engagementScore: m._avg.engagementScore || 0
  }));
}

async function getContentAnalytics(courseId: string, dateFilter: any) {
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
      const views = await db.studentInteraction.count({
        where: {
          sectionId: section.id,
          eventName: 'section_view',
          timestamp: dateFilter
        }
      });

      const completions = await db.userSectionCompletion.count({
        where: {
          sectionId: section.id,
          completedAt: dateFilter
        }
      });

      const avgTime = await db.userSectionCompletion.aggregate({
        where: {
          sectionId: section.id,
          timeSpent: { not: null }
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
    
    const interactions = await db.studentInteraction.count({
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

  const enrolledStudents = await db.userCourseEnrollment.findMany({
    where: {
      courseId,
      completedAt: null
    },
    include: {
      user: {
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
    const recentActivity = await db.studentInteraction.count({
      where: {
        studentId: enrollment.userId,
        courseId,
        timestamp: {
          gte: twoWeeksAgo
        }
      }
    });

    const avgEngagement = await db.learningMetric.aggregate({
      where: {
        studentId: enrollment.userId,
        courseId
      },
      _avg: {
        engagementScore: true
      }
    });

    if (recentActivity < 5 || (avgEngagement._avg.engagementScore || 0) < 30) {
      atRiskList.push({
        studentId: enrollment.userId,
        name: enrollment.user.name,
        email: enrollment.user.email,
        progress: enrollment.progressPercentage,
        lastActive: enrollment.lastAccessedAt,
        recentInteractions: recentActivity,
        engagementScore: avgEngagement._avg.engagementScore || 0,
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

  // Get learning patterns
  const pattern = await db.learningPattern.findUnique({
    where: { studentId: userId }
  });

  if (pattern) {
    // Recommend optimal study times
    if (pattern.preferredStudyTime.length > 0) {
      recommendations.push({
        type: 'study_time',
        message: `Your optimal study times are ${pattern.preferredStudyTime.join(', ')}:00`,
        priority: 'high'
      });
    }

    // Content preference recommendations
    const prefs = pattern.contentPreferences as any;
    if (prefs?.video > 60) {
      recommendations.push({
        type: 'content_preference',
        message: 'You learn best with video content. Focus on video lessons for better retention.',
        priority: 'medium'
      });
    }
  }

  // Course-specific recommendations
  if (courseId) {
    const metrics = await db.learningMetric.findFirst({
      where: {
        studentId: userId,
        courseId
      },
      orderBy: { date: 'desc' }
    });

    if (metrics && metrics.engagementScore < 50) {
      recommendations.push({
        type: 'engagement',
        message: 'Your engagement is below average. Try breaking study sessions into smaller chunks.',
        priority: 'high'
      });
    }
  }

  return recommendations;
}

async function generateInsights(courseId: string, overview: any, performance: any) {
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
  const avgEngagement = performance.reduce((sum: number, p: any) => sum + p.engagementScore, 0) / performance.length;
  if (avgEngagement < 60) {
    insights.push({
      type: 'engagement',
      severity: 'warning',
      message: 'Average student engagement is low. Consider adding more interactive content.'
    });
  }

  // Active students insight
  const activeRate = (overview.activeStudents / overview.totalEnrollments) * 100;
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