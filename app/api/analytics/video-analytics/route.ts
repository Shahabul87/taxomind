// Video Analytics API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

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
    logger.error('Video analytics error:', error);
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
  // Mock video analytics since studentInteraction model doesn't exist
  return {
    totalViews: 0,
    averageWatchTime: 0,
    completionRate: 0,
    dropoffPoints: [],
    engagementData: []
  };
}
