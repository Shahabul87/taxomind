// Real-time Metrics API Endpoint

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
    const courseId = searchParams.get('courseId');
    const timeRange = searchParams.get('timeRange') || '1h';

    // Calculate time filter
    const timeFilter = getTimeFilter(timeRange);

    // Get real-time metrics
    const metrics = await getRealTimeMetrics(courseId, timeFilter, user.id);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Real-time metrics error:', error);
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

  const activeUsers = await db.studentInteraction.findMany({
    where: {
      ...recentFilter,
      studentId: { not: null }
    },
    distinct: ['studentId'],
    select: { studentId: true }
  });

  // Total interactions in time range
  const totalInteractions = await db.studentInteraction.count({
    where: baseFilter
  });

  // Current video watchers
  const currentVideosWatching = await db.studentInteraction.count({
    where: {
      ...recentFilter,
      eventName: {
        in: ['video_play', 'video_progress']
      }
    },
    distinct: ['sessionId']
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
  const metrics = await db.learningMetric.aggregate({
    where: {
      ...(courseId && { courseId }),
      updatedAt: timeFilter,
      engagementScore: { not: null }
    },
    _avg: {
      engagementScore: true
    }
  });

  return {
    averageScore: metrics._avg.engagementScore || 0
  };
}

async function getCompletionMetrics(courseId: string | null, timeFilter: any) {
  // Get enrollments and completions
  const enrollments = await db.userCourseEnrollment.findMany({
    where: {
      ...(courseId && { courseId }),
      enrolledAt: timeFilter
    }
  });

  if (enrollments.length === 0) {
    return { averageCompletion: 0 };
  }

  const totalProgress = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.progressPercentage || 0), 
    0
  );

  return {
    averageCompletion: totalProgress / enrollments.length
  };
}

async function getStrugglingStudentsCount(courseId: string | null, timeFilter: any) {
  // Students with low engagement scores or many struggle indicators
  const strugglingFromMetrics = await db.learningMetric.count({
    where: {
      ...(courseId && { courseId }),
      updatedAt: timeFilter,
      engagementScore: { lt: 50 }
    }
  });

  // Students with many recent seeks/pauses (struggle indicators)
  const recentStruggles = await db.studentInteraction.groupBy({
    by: ['studentId'],
    where: {
      ...(courseId && { courseId }),
      timestamp: timeFilter,
      eventName: {
        in: ['video_seek', 'video_pause']
      },
      studentId: { not: null }
    },
    _count: true,
    having: {
      _count: {
        _gte: 10 // More than 10 struggles in time period
      }
    }
  });

  return Math.max(strugglingFromMetrics, recentStruggles.length);
}

async function getTopPerformersCount(courseId: string | null, timeFilter: any) {
  const topPerformers = await db.learningMetric.count({
    where: {
      ...(courseId && { courseId }),
      updatedAt: timeFilter,
      engagementScore: { gte: 80 }
    }
  });

  return topPerformers;
}

async function calculateSystemLoad(): Promise<number> {
  // Calculate system load based on recent activity
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const recentInteractions = await db.studentInteraction.count({
    where: {
      timestamp: {
        gte: oneMinuteAgo
      }
    }
  });

  // Normalize to 0-100 scale (assuming 1000 interactions per minute = 100% load)
  const maxInteractionsPerMinute = 1000;
  const load = Math.min((recentInteractions / maxInteractionsPerMinute) * 100, 100);

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
    console.error('Real-time subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to handle subscription' },
      { status: 500 }
    );
  }
}