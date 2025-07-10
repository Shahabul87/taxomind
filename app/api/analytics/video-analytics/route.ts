// Video Analytics API Endpoint

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
    const timeRange = searchParams.get('timeRange') || '7d';
    const videoId = searchParams.get('videoId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    // Verify user owns the course
    const course = await db.course.findUnique({
      where: { id: courseId, userId: user.id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const dateFilter = getDateFilter(timeRange);

    if (videoId) {
      // Get analytics for a specific video
      const analytics = await getVideoAnalytics(videoId, dateFilter);
      return NextResponse.json(analytics);
    } else {
      // Get analytics for all videos in the course
      const videoAnalytics = await getCourseVideoAnalytics(courseId, dateFilter);
      return NextResponse.json({ videos: videoAnalytics });
    }
  } catch (error) {
    console.error('Video analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video analytics' },
      { status: 500 }
    );
  }
}

function getDateFilter(timeRange: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
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
      startDate = new Date(0);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return { gte: startDate };
}

async function getCourseVideoAnalytics(courseId: string, dateFilter: any) {
  // Get all videos in the course
  const videos = await db.video.findMany({
    where: {
      section: {
        chapter: {
          courseId
        }
      }
    },
    select: {
      id: true,
      title: true,
      duration: true,
      url: true
    }
  });

  const videoAnalytics = await Promise.all(
    videos.map(async (video) => {
      const analytics = await getVideoAnalytics(video.id, dateFilter);
      return {
        ...analytics,
        title: video.title,
        duration: video.duration
      };
    })
  );

  return videoAnalytics.sort((a, b) => b.totalViews - a.totalViews);
}

async function getVideoAnalytics(videoId: string, dateFilter: any) {
  // Get all video interactions
  const interactions = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      timestamp: dateFilter
    },
    orderBy: { timestamp: 'asc' }
  });

  // Calculate basic metrics
  const totalViews = await db.studentInteraction.count({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: 'video_session_start',
      timestamp: dateFilter
    }
  });

  const uniqueViewers = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      timestamp: dateFilter,
      studentId: { not: null }
    },
    distinct: ['studentId'],
    select: { studentId: true }
  });

  // Calculate watch time and completion rate
  const completionData = await calculateCompletionMetrics(videoId, dateFilter);
  
  // Calculate engagement score
  const engagementData = await calculateEngagementMetrics(videoId, dateFilter);

  // Get drop-off points
  const dropOffPoints = await calculateDropOffPoints(videoId, dateFilter);

  // Get heatmap data
  const heatmapData = await calculateHeatmapData(videoId, dateFilter);

  // Get interaction statistics
  const interactionStats = await calculateInteractionStats(videoId, dateFilter);

  // Get struggling segments
  const strugglingSegments = await calculateStrugglingSegments(videoId, dateFilter);

  // Calculate viewer segments
  const viewerSegments = await calculateViewerSegments(videoId, dateFilter);

  return {
    videoId,
    totalViews,
    uniqueViewers: uniqueViewers.length,
    averageWatchTime: completionData.averageWatchTime,
    completionRate: completionData.completionRate,
    averageEngagementScore: engagementData.averageScore,
    dropOffPoints,
    heatmapData,
    interactionStats,
    strugglingSegments,
    viewerSegments
  };
}

async function calculateCompletionMetrics(videoId: string, dateFilter: any) {
  const completionEvents = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_complete', 'video_progress']
      },
      timestamp: dateFilter
    }
  });

  if (completionEvents.length === 0) {
    return { averageWatchTime: 0, completionRate: 0 };
  }

  // Calculate average watch time
  const watchTimes = completionEvents
    .map(event => {
      const metadata = event.metadata as any;
      return metadata?.watchTime || metadata?.currentTime || 0;
    })
    .filter(time => time > 0);

  const averageWatchTime = watchTimes.length > 0 
    ? watchTimes.reduce((sum, time) => sum + time, 0) / watchTimes.length 
    : 0;

  // Calculate completion rate
  const completedViews = completionEvents.filter(event => {
    const metadata = event.metadata as any;
    return metadata?.completionRate >= 90 || event.eventName === 'video_complete';
  }).length;

  const totalViews = await db.studentInteraction.count({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: 'video_session_start',
      timestamp: dateFilter
    }
  });

  const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

  return { averageWatchTime, completionRate };
}

async function calculateEngagementMetrics(videoId: string, dateFilter: any) {
  const engagementEvents = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_progress', 'video_complete']
      },
      timestamp: dateFilter
    }
  });

  const scores = engagementEvents
    .map(event => {
      const metadata = event.metadata as any;
      return metadata?.engagementScore || 0;
    })
    .filter(score => score > 0);

  const averageScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0;

  return { averageScore };
}

async function calculateDropOffPoints(videoId: string, dateFilter: any) {
  // Get all progress events
  const progressEvents = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: 'video_progress',
      timestamp: dateFilter
    },
    orderBy: { timestamp: 'asc' }
  });

  // Group by time intervals (every 30 seconds)
  const timeIntervals = new Map<number, Set<string>>();
  
  progressEvents.forEach(event => {
    const metadata = event.metadata as any;
    const currentTime = metadata?.currentTime || 0;
    const interval = Math.floor(currentTime / 30) * 30; // 30-second intervals
    
    if (!timeIntervals.has(interval)) {
      timeIntervals.set(interval, new Set());
    }
    
    if (event.studentId) {
      timeIntervals.get(interval)!.add(event.studentId);
    }
  });

  // Calculate drop-off percentages
  const totalViewers = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: 'video_session_start',
      timestamp: dateFilter,
      studentId: { not: null }
    },
    distinct: ['studentId']
  });

  const totalViewerCount = totalViewers.length;
  
  return Array.from(timeIntervals.entries())
    .map(([time, viewers]) => ({
      time,
      percentage: totalViewerCount > 0 ? (viewers.size / totalViewerCount) * 100 : 0,
      viewers: viewers.size
    }))
    .sort((a, b) => a.time - b.time);
}

async function calculateHeatmapData(videoId: string, dateFilter: any) {
  // Get seek and rewatch events
  const seekEvents = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_seek', 'video_progress']
      },
      timestamp: dateFilter
    }
  });

  // Create heatmap segments (10-second intervals)
  const heatmapSegments = new Map<number, { intensity: number; rewatches: number }>();

  seekEvents.forEach(event => {
    const metadata = event.metadata as any;
    const currentTime = metadata?.currentTime || metadata?.toTime || 0;
    const segment = Math.floor(currentTime / 10) * 10;

    if (!heatmapSegments.has(segment)) {
      heatmapSegments.set(segment, { intensity: 0, rewatches: 0 });
    }

    const segmentData = heatmapSegments.get(segment)!;
    
    if (event.eventName === 'video_seek') {
      const isRewatch = metadata?.isRewatch || false;
      if (isRewatch) {
        segmentData.rewatches++;
      }
      segmentData.intensity += 0.1;
    } else if (event.eventName === 'video_progress') {
      segmentData.intensity += 0.05;
    }
  });

  // Normalize intensity values
  const maxIntensity = Math.max(...Array.from(heatmapSegments.values()).map(s => s.intensity));
  
  return Array.from(heatmapSegments.entries())
    .map(([time, data]) => ({
      time,
      intensity: maxIntensity > 0 ? data.intensity / maxIntensity : 0,
      rewatches: data.rewatches
    }))
    .sort((a, b) => a.time - b.time);
}

async function calculateInteractionStats(videoId: string, dateFilter: any) {
  const interactions = await db.studentInteraction.groupBy({
    by: ['eventName'],
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_pause', 'video_seek', 'video_speed_change', 'video_quality_change']
      },
      timestamp: dateFilter
    },
    _count: true
  });

  return {
    totalPauses: interactions.find(i => i.eventName === 'video_pause')?._count || 0,
    totalSeeks: interactions.find(i => i.eventName === 'video_seek')?._count || 0,
    speedChanges: interactions.find(i => i.eventName === 'video_speed_change')?._count || 0,
    qualityChanges: interactions.find(i => i.eventName === 'video_quality_change')?._count || 0
  };
}

async function calculateStrugglingSegments(videoId: string, dateFilter: any) {
  // Get struggle indicators
  const struggleEvents = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_seek', 'video_pause']
      },
      timestamp: dateFilter
    }
  });

  // Group by time segments and identify struggling patterns
  const segmentStruggles = new Map<number, Set<string>>();

  struggleEvents.forEach(event => {
    const metadata = event.metadata as any;
    let isStruggling = false;

    if (event.eventName === 'video_seek') {
      const seekDistance = metadata?.seekDistance || 0;
      const isRewatch = metadata?.isRewatch || false;
      isStruggling = seekDistance < 30 && isRewatch; // Short backward seeks
    } else if (event.eventName === 'video_pause') {
      const consecutiveTime = metadata?.consecutiveWatchTime || 0;
      isStruggling = consecutiveTime < 30; // Short watch times before pausing
    }

    if (isStruggling && event.studentId) {
      const currentTime = metadata?.currentTime || metadata?.fromTime || 0;
      const segment = Math.floor(currentTime / 60) * 60; // 1-minute segments

      if (!segmentStruggles.has(segment)) {
        segmentStruggles.set(segment, new Set());
      }
      segmentStruggles.get(segment)!.add(event.studentId);
    }
  });

  return Array.from(segmentStruggles.entries())
    .filter(([_, students]) => students.size >= 3) // At least 3 students struggling
    .map(([startTime, students]) => ({
      startTime,
      endTime: startTime + 60,
      studentCount: students.size,
      avgStruggles: students.size / 10 // Normalized struggle score
    }))
    .sort((a, b) => b.studentCount - a.studentCount);
}

async function calculateViewerSegments(videoId: string, dateFilter: any) {
  // Get completion data for all viewers
  const completionData = await db.studentInteraction.findMany({
    where: {
      metadata: {
        path: ['videoId'],
        equals: videoId
      },
      eventName: {
        in: ['video_complete', 'video_progress']
      },
      timestamp: dateFilter,
      studentId: { not: null }
    },
    distinct: ['studentId']
  });

  let completed = 0;
  let partial = 0;
  let early = 0;

  completionData.forEach(event => {
    const metadata = event.metadata as any;
    const completionRate = metadata?.completionRate || 0;

    if (completionRate >= 90 || event.eventName === 'video_complete') {
      completed++;
    } else if (completionRate >= 25) {
      partial++;
    } else {
      early++;
    }
  });

  const total = completed + partial + early;

  if (total === 0) {
    return [
      { name: 'No data', value: 100, color: '#e5e7eb' }
    ];
  }

  return [
    { name: 'Completed (90%+)', value: Math.round((completed / total) * 100), color: '#10b981' },
    { name: 'Partial (25-90%)', value: Math.round((partial / total) * 100), color: '#f59e0b' },
    { name: 'Early Exit (<25%)', value: Math.round((early / total) * 100), color: '#ef4444' }
  ].filter(segment => segment.value > 0);
}