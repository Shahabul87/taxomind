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
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get or create performance metrics
    const performanceMetrics = await getOrCreatePerformanceMetrics(
      user.id, 
      startDate, 
      endDate, 
      period as any
    );

    // Get current learning metrics
    const currentMetrics = await db.learningMetrics.findMany({
      where: {
        userId: user.id
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
      }
    });

    // Calculate summary statistics
    const summary = calculateSummaryStats(performanceMetrics, currentMetrics);
    
    // Get trend analysis
    const trends = calculateTrends(performanceMetrics);
    
    // Get comparative analysis
    const comparative = await getComparativeAnalysis(user.id, period as any);

    return NextResponse.json({
      summary,
      trends,
      comparative,
      performanceMetrics: performanceMetrics.map(metric => ({
        date: metric.date,
        learningVelocity: metric.learningVelocity,
        retentionRate: metric.retentionRate,
        engagementScore: metric.engagementScore,
        quizPerformance: metric.quizPerformance,
        totalLearningTime: metric.totalLearningTime,
        activeTime: metric.activeTime,
        sessionsCount: metric.sessionsCount,
        averageSessionLength: metric.averageSessionLength,
        velocityTrend: metric.velocityTrend,
        engagementTrend: metric.engagementTrend,
        performanceTrend: metric.performanceTrend,
        improvementRate: metric.improvementRate
      })),
      currentMetrics: currentMetrics.map(metric => ({
        id: metric.id,
        courseId: metric.courseId,
        course: metric.course,
        overallProgress: metric.overallProgress,
        learningVelocity: metric.learningVelocity,
        engagementTrend: metric.engagementTrend,
        riskScore: metric.riskScore,
        averageEngagementScore: metric.averageEngagementScore,
        totalStudyTime: metric.totalStudyTime,
        lastActivityDate: metric.lastActivityDate
      })),
      insights: generateInsights(performanceMetrics, currentMetrics, trends)
    });

  } catch (error) {
    console.error('Performance metrics API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function getOrCreatePerformanceMetrics(
  userId: string,
  startDate: Date,
  endDate: Date,
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
) {
  const existingMetrics = await db.performanceMetrics.findMany({
    where: {
      userId,
      period,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Generate missing metrics
  const dates = generateDateRange(startDate, endDate, period);
  const existingDates = new Set(existingMetrics.map(m => m.date.toISOString().split('T')[0]));
  
  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    if (!existingDates.has(dateStr)) {
      await calculateAndCreatePerformanceMetric(userId, date, period);
    }
  }

  // Return updated metrics
  return await db.performanceMetrics.findMany({
    where: {
      userId,
      period,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
}

async function calculateAndCreatePerformanceMetric(
  userId: string,
  date: Date,
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  
  // Adjust date range based on period
  if (period === 'WEEKLY') {
    startDate.setDate(date.getDate() - 6);
  } else if (period === 'MONTHLY') {
    startDate.setDate(1);
    endDate.setMonth(date.getMonth() + 1, 0);
  } else {
    endDate.setDate(date.getDate() + 1);
  }

  // Get learning sessions for the period
  const sessions = await db.learningSession.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lt: endDate
      }
    }
  });

  // Get activities for the period
  const activities = await db.realtimeActivity.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lt: endDate
      }
    }
  });

  // Calculate metrics
  const totalLearningTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const activeTime = sessions.reduce((sum, s) => sum + (s.activeDuration || s.duration || 0), 0);
  const sessionsCount = sessions.length;
  const averageSessionLength = sessionsCount > 0 ? totalLearningTime / sessionsCount : 0;
  
  const quizActivities = activities.filter(a => a.activityType.includes('QUIZ'));
  const quizPerformance = quizActivities.length > 0
    ? quizActivities.reduce((sum, a) => sum + (a.score || 0), 0) / quizActivities.length
    : 0;

  const engagementScore = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.engagementScore, 0) / sessions.length
    : 0;

  // Get previous metric for trend calculation
  const previousDate = new Date(date);
  previousDate.setDate(date.getDate() - (period === 'DAILY' ? 1 : period === 'WEEKLY' ? 7 : 30));
  
  const previousMetric = await db.performanceMetrics.findFirst({
    where: {
      userId,
      period,
      date: previousDate
    }
  });

  // Calculate trends
  const velocityTrend = previousMetric
    ? (totalLearningTime > previousMetric.totalLearningTime ? 'IMPROVING' : 
       totalLearningTime < previousMetric.totalLearningTime ? 'DECLINING' : 'STABLE')
    : 'STABLE';

  const engagementTrend = previousMetric
    ? (engagementScore > previousMetric.engagementScore ? 'IMPROVING' : 
       engagementScore < previousMetric.engagementScore ? 'DECLINING' : 'STABLE')
    : 'STABLE';

  const performanceTrend = previousMetric
    ? (quizPerformance > previousMetric.quizPerformance ? 'IMPROVING' : 
       quizPerformance < previousMetric.quizPerformance ? 'DECLINING' : 'STABLE')
    : 'STABLE';

  const improvementRate = previousMetric && previousMetric.quizPerformance > 0
    ? ((quizPerformance - previousMetric.quizPerformance) / previousMetric.quizPerformance) * 100
    : 0;

  // Create performance metric
  await db.performanceMetrics.create({
    data: {
      userId,
      date,
      period,
      learningVelocity: totalLearningTime / Math.max(1, sessionsCount), // minutes per session
      retentionRate: Math.min(100, engagementScore), // simplified calculation
      engagementScore,
      quizPerformance,
      totalLearningTime,
      activeTime,
      sessionsCount,
      averageSessionLength,
      velocityTrend: velocityTrend as any,
      engagementTrend: engagementTrend as any,
      performanceTrend: performanceTrend as any,
      improvementRate
    }
  });
}

function generateDateRange(
  startDate: Date, 
  endDate: Date, 
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    
    if (period === 'DAILY') {
      current.setDate(current.getDate() + 1);
    } else if (period === 'WEEKLY') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return dates;
}

function calculateSummaryStats(performanceMetrics: any[], currentMetrics: any[]) {
  const totalTime = performanceMetrics.reduce((sum, m) => sum + m.totalLearningTime, 0);
  const avgEngagement = performanceMetrics.length > 0
    ? performanceMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / performanceMetrics.length
    : 0;
  const avgQuizScore = performanceMetrics.length > 0
    ? performanceMetrics.reduce((sum, m) => sum + m.quizPerformance, 0) / performanceMetrics.length
    : 0;
  const totalSessions = performanceMetrics.reduce((sum, m) => sum + m.sessionsCount, 0);

  return {
    totalLearningTime: Math.round(totalTime),
    averageEngagementScore: Math.round(avgEngagement),
    averageQuizPerformance: Math.round(avgQuizScore),
    totalSessions,
    activeCourses: currentMetrics.length,
    overallProgress: currentMetrics.length > 0
      ? Math.round(currentMetrics.reduce((sum, m) => sum + m.overallProgress, 0) / currentMetrics.length)
      : 0
  };
}

function calculateTrends(performanceMetrics: any[]) {
  if (performanceMetrics.length < 2) {
    return {
      learningVelocity: 'STABLE',
      engagement: 'STABLE',
      performance: 'STABLE',
      improvementRate: 0
    };
  }

  const recent = performanceMetrics.slice(-7); // Last 7 data points
  const older = performanceMetrics.slice(-14, -7); // Previous 7 data points

  const recentAvgVelocity = recent.reduce((sum, m) => sum + m.learningVelocity, 0) / recent.length;
  const olderAvgVelocity = older.length > 0 
    ? older.reduce((sum, m) => sum + m.learningVelocity, 0) / older.length 
    : recentAvgVelocity;

  const recentAvgEngagement = recent.reduce((sum, m) => sum + m.engagementScore, 0) / recent.length;
  const olderAvgEngagement = older.length > 0
    ? older.reduce((sum, m) => sum + m.engagementScore, 0) / older.length
    : recentAvgEngagement;

  const recentAvgPerformance = recent.reduce((sum, m) => sum + m.quizPerformance, 0) / recent.length;
  const olderAvgPerformance = older.length > 0
    ? older.reduce((sum, m) => sum + m.quizPerformance, 0) / older.length
    : recentAvgPerformance;

  return {
    learningVelocity: recentAvgVelocity > olderAvgVelocity * 1.1 ? 'IMPROVING' :
                     recentAvgVelocity < olderAvgVelocity * 0.9 ? 'DECLINING' : 'STABLE',
    engagement: recentAvgEngagement > olderAvgEngagement * 1.05 ? 'IMPROVING' :
               recentAvgEngagement < olderAvgEngagement * 0.95 ? 'DECLINING' : 'STABLE',
    performance: recentAvgPerformance > olderAvgPerformance * 1.05 ? 'IMPROVING' :
                recentAvgPerformance < olderAvgPerformance * 0.95 ? 'DECLINING' : 'STABLE',
    improvementRate: olderAvgPerformance > 0 
      ? ((recentAvgPerformance - olderAvgPerformance) / olderAvgPerformance) * 100
      : 0
  };
}

async function getComparativeAnalysis(userId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
  // Get user's recent performance
  const userMetrics = await db.performanceMetrics.findFirst({
    where: {
      userId,
      period
    },
    orderBy: {
      date: 'desc'
    }
  });

  if (!userMetrics) {
    return {
      peerComparison: 50,
      rankingPercentile: 50,
      message: 'Not enough data for comparison'
    };
  }

  // Get average metrics for comparison (this would be more sophisticated in production)
  const avgMetrics = await db.performanceMetrics.aggregate({
    where: {
      period,
      date: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    _avg: {
      engagementScore: true,
      quizPerformance: true,
      learningVelocity: true
    }
  });

  const peerComparison = Math.min(100, Math.max(0,
    ((userMetrics.engagementScore / (avgMetrics._avg.engagementScore || 50)) * 50) +
    ((userMetrics.quizPerformance / (avgMetrics._avg.quizPerformance || 50)) * 30) +
    ((userMetrics.learningVelocity / (avgMetrics._avg.learningVelocity || 20)) * 20)
  ));

  return {
    peerComparison: Math.round(peerComparison),
    rankingPercentile: Math.round(peerComparison),
    averageEngagement: Math.round(avgMetrics._avg.engagementScore || 0),
    averageQuizScore: Math.round(avgMetrics._avg.quizPerformance || 0),
    message: peerComparison > 70 ? 'Above average performance' :
             peerComparison > 50 ? 'Average performance' : 'Below average - room for improvement'
  };
}

function generateInsights(performanceMetrics: any[], currentMetrics: any[], trends: any) {
  const insights = [];

  // Performance insights
  if (trends.performance === 'IMPROVING') {
    insights.push({
      type: 'success',
      title: 'Performance Improving',
      message: 'Your quiz scores are trending upward. Keep up the great work!',
      priority: 'high'
    });
  } else if (trends.performance === 'DECLINING') {
    insights.push({
      type: 'warning',
      title: 'Performance Needs Attention',
      message: 'Consider reviewing previous material or adjusting your study approach.',
      priority: 'high'
    });
  }

  // Engagement insights
  if (trends.engagement === 'DECLINING') {
    insights.push({
      type: 'info',
      title: 'Engagement Opportunity',
      message: 'Try mixing up your learning with different content types or study times.',
      priority: 'medium'
    });
  }

  // Learning velocity insights
  if (trends.learningVelocity === 'IMPROVING') {
    insights.push({
      type: 'success',
      title: 'Learning Accelerating',
      message: 'You\'re learning more efficiently. Your study methods are working!',
      priority: 'medium'
    });
  }

  // Time-based insights
  const recentMetrics = performanceMetrics.slice(-7);
  const avgSessionLength = recentMetrics.reduce((sum, m) => sum + m.averageSessionLength, 0) / recentMetrics.length;
  
  if (avgSessionLength < 15) {
    insights.push({
      type: 'tip',
      title: 'Optimize Session Length',
      message: 'Consider longer study sessions (20-30 minutes) for better retention.',
      priority: 'low'
    });
  } else if (avgSessionLength > 120) {
    insights.push({
      type: 'tip',
      title: 'Break Up Long Sessions',
      message: 'Shorter, more frequent sessions often improve learning effectiveness.',
      priority: 'low'
    });
  }

  return insights;
}