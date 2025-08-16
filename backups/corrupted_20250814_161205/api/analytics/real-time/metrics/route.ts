// Real-time Metrics API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const timeRange = searchParams.get('timeRange') || '1h';

    // Calculate time filter
    const timeFilter = getTimeFilter(timeRange);

    // Get real-time metrics
    const metrics = await getRealTimeMetrics(courseId, timeFilter, user.id);

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Real-time metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time metrics' },
      { status: 500 }
    );
  }
}

function getTimeFilter(timeRange: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '15m':
      startDate.setMinutes(now.getMinutes() - 15);
      break;
    case '1h':
      startDate.setHours(now.getHours() - 1);
      break;
    case '6h':
      startDate.setHours(now.getHours() - 6);
      break;
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    default:
      startDate.setHours(now.getHours() - 1);
  }

  return { gte: startDate };
}

async function getRealTimeMetrics(courseId: string | null, timeFilter: any, userId: string) {
  // Base filter for interactions
  const baseFilter = {
    timestamp: timeFilter,
    ...(courseId && { courseId })
  };

  // Active users (users with interactions in the last 5 minutes)
  const recentFilter = {
    timestamp: {
      gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    },
    ...(courseId && { courseId })
  };

  // Use exam attempts as proxy for active users
  const activeUsers = await db.userExamAttempt.findMany({
    where: {
      createdAt: recentFilter.timestamp,
      ...(courseId && {
        exam: {
          section: {
            chapter: {
              courseId
            }
          }
        }
      })
    },
    distinct: ['userId'],
    select: { userId: true }
  });

  // Total exam attempts in time range
  const totalInteractions = await db.userExamAttempt.count({
    where: {
      createdAt: baseFilter.timestamp,
      ...(courseId && {
        exam: {
          section: {
            chapter: {
              courseId
            }
          }
        }
      })
    }
  });

  // Current active exam takers (in progress status)
  const currentVideosWatching = await db.userExamAttempt.count({
    where: {
      createdAt: recentFilter.timestamp,
      status: 'IN_PROGRESS',
      ...(courseId && {
        exam: {
          section: {
            chapter: {
              courseId
            }
          }
        }
      })
    }
  });

  // Get engagement scores
  const engagementData = await getEngagementMetrics(courseId, timeFilter);
  
  // Get completion rates
  const completionData = await getCompletionMetrics(courseId, timeFilter);

  // Get struggling students count
  const strugglingStudents = await getStrugglingStudentsCount(courseId, timeFilter);

  // Get top performers count
  const topPerformers = await getTopPerformersCount(courseId, timeFilter);

  // Calculate system load (simplified)
  const systemLoad = await calculateSystemLoad();

  return {
    activeUsers: activeUsers.length,
    totalInteractions,
    avgEngagementScore: engagementData.averageScore,
    completionRate: completionData.averageCompletion,
    currentVideosWatching,
    strugglingStudents,
    topPerformers,
    systemLoad,
    timestamp: new Date()
  };
}

async function getEngagementMetrics(courseId: string | null, timeFilter: any) {
  const metrics = await db.learning_metrics.aggregate({
    where: {
      ...(courseId && { courseId }),
      lastActivityDate: timeFilter
    },
    _avg: {
      riskScore: true
    }
  });

  // Convert risk score to engagement score (inverted)
  const avgRiskScore = metrics._avg.riskScore || 0;
  const engagementScore = Math.max(0, (1 - avgRiskScore) * 100);

  return {
    averageScore: engagementScore
  };
}

async function getCompletionMetrics(courseId: string | null, timeFilter: any) {
  // Get enrollments and completions
  const enrollments = await db.enrollment.findMany({
    where: {
      ...(courseId && { courseId }),
      createdAt: timeFilter
    }
  });

  if (enrollments.length === 0) {
    return { averageCompletion: 0 };
  }

  // Calculate completion rate based on exam attempts
  let totalCompletedExams = 0;
  let totalExamAttempts = 0;

  for (const enrollment of enrollments) {
    const examAttempts = await db.userExamAttempt.count({
      where: {
        userId: enrollment.userId,
        Exam: {
          section: {
            chapter: {
              courseId: enrollment.courseId
            }
          }
        }
      }
    });

    const completedExams = await db.userExamAttempt.count({
      where: {
        userId: enrollment.userId,
        status: 'GRADED',
        Exam: {
          section: {
            chapter: {
              courseId: enrollment.courseId
            }
          }
        }
      }
    });

    totalExamAttempts += examAttempts;
    totalCompletedExams += completedExams;
  }

  const completionRate = totalExamAttempts > 0 ? (totalCompletedExams / totalExamAttempts) * 100 : 0;

  return {
    averageCompletion: completionRate
  };
}

async function getStrugglingStudentsCount(courseId: string | null, timeFilter: any) {
  // Students with low engagement scores or many struggle indicators
  const strugglingFromMetrics = await db.learning_metrics.count({
    where: {
      ...(courseId && { courseId }),
      lastActivityDate: timeFilter,
      riskScore: { gte: 0.7 } // High risk score indicates struggling
    }
  });

  // Students with low exam scores (struggle indicators)
  const lowScoreAttempts = await db.userExamAttempt.groupBy({
    by: ['userId'],
    where: {
      createdAt: timeFilter,
      scorePercentage: { lt: 40 }, // Low scores
      ...(courseId && {
        Exam: {
          section: {
            chapter: {
              courseId
            }
          }
        }
      })
    },
    _count: true
  });

  // Filter users with at least 2 low-score attempts
  const strugglingUsers = lowScoreAttempts.filter(attempt => attempt._count >= 2);

  return Math.max(strugglingFromMetrics, strugglingUsers.length);
}

async function getTopPerformersCount(courseId: string | null, timeFilter: any) {
  const topPerformers = await db.learning_metrics.count({
    where: {
      ...(courseId && { courseId }),
      lastActivityDate: timeFilter,
      riskScore: { lte: 0.2 } // Low risk score indicates top performers
    }
  });

  return topPerformers;
}

async function calculateSystemLoad(): Promise<number> {
  // Calculate system load based on recent exam activity
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const recentExamAttempts = await db.userExamAttempt.count({
    where: {
      createdAt: {
        gte: oneMinuteAgo
      }
    }
  });

  // Normalize to 0-100 scale (assuming 50 exam attempts per minute = 100% load)
  const maxAttemptsPerMinute = 50;
  const load = Math.min((recentExamAttempts / maxAttemptsPerMinute) * 100, 100);

  return Math.round(load);
}

// WebSocket-like endpoint for real-time updates
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'subscribe':
        // In a real implementation, this would set up WebSocket subscription
        return NextResponse.json({ 
          success: true, 
          message: 'Subscribed to real-time updates' 
        });

      case 'unsubscribe':
        // Clean up subscription
        return NextResponse.json({ 
          success: true, 
          message: 'Unsubscribed from real-time updates' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Real-time subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to handle subscription' },
      { status: 500 }
    );
  }
}