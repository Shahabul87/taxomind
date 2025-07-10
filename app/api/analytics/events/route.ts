// Analytics Events API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { TrackingEvent } from '@/lib/analytics/types';
import { publishInteractionEvent } from '@/lib/kafka/producers/interaction-producer';

// Validate incoming events
function validateEvent(event: any): event is TrackingEvent {
  return (
    event &&
    typeof event.eventType === 'string' &&
    typeof event.eventName === 'string' &&
    typeof event.properties === 'object' &&
    event.timestamp &&
    event.sessionId
  );
}

// Process events batch
async function processEventBatch(events: TrackingEvent[], userId?: string) {
  try {
    // Store raw events in database
    const eventRecords = events.map(event => ({
      studentId: userId || event.userId || null,
      courseId: event.courseId || null,
      chapterId: event.chapterId || null,
      sectionId: event.sectionId || null,
      sessionId: event.sessionId,
      interactionType: event.eventType,
      eventName: event.eventName,
      metadata: JSON.stringify({
        ...event.properties,
        url: event.url,
        userAgent: event.userAgent
      }),
      timestamp: new Date(event.timestamp),
    }));

    // Batch insert events
    await db.studentInteraction.createMany({
      data: eventRecords,
      skipDuplicates: true
    });

    // Update real-time metrics (async)
    updateRealtimeMetrics(events, userId);
    
    // Check for learning patterns (async)
    detectLearningPatterns(events, userId);
    
    // Send to Kafka for stream processing
    try {
      for (const record of eventRecords) {
        await publishInteractionEvent({
          studentId: record.studentId || '',
          courseId: record.courseId || '',
          sectionId: record.sectionId,
          eventName: record.eventName,
          metadata: JSON.parse(record.metadata as string),
          timestamp: record.timestamp,
          sessionId: record.sessionId
        });
      }
    } catch (kafkaError) {
      console.error('Failed to publish to Kafka:', kafkaError);
      // Continue even if Kafka fails - data is already saved to DB
    }

    return { success: true, processed: events.length };
  } catch (error) {
    console.error('Failed to process events:', error);
    throw error;
  }
}

// Update real-time metrics
async function updateRealtimeMetrics(events: TrackingEvent[], userId?: string) {
  if (!userId) return;

  try {
    // Group events by course
    const eventsByCourse = events.reduce((acc, event) => {
      if (event.courseId) {
        if (!acc[event.courseId]) {
          acc[event.courseId] = [];
        }
        acc[event.courseId].push(event);
      }
      return acc;
    }, {} as Record<string, TrackingEvent[]>);

    // Update metrics for each course
    for (const [courseId, courseEvents] of Object.entries(eventsByCourse)) {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate metrics
      const totalInteractions = courseEvents.length;
      const videoEvents = courseEvents.filter(e => e.eventType === 'video');
      const quizEvents = courseEvents.filter(e => e.eventType === 'quiz');
      
      // Update or create daily metrics
      await db.learningMetric.upsert({
        where: {
          studentId_courseId_date: {
            studentId: userId,
            courseId: courseId,
            date: new Date(today)
          }
        },
        update: {
          totalInteractions: {
            increment: totalInteractions
          },
          videoWatchTime: {
            increment: calculateVideoTime(videoEvents)
          },
          quizAttempts: {
            increment: quizEvents.filter(e => e.eventName === 'quiz_start').length
          },
          updatedAt: new Date()
        },
        create: {
          studentId: userId,
          courseId: courseId,
          date: new Date(today),
          totalInteractions: totalInteractions,
          videoWatchTime: calculateVideoTime(videoEvents),
          quizAttempts: quizEvents.filter(e => e.eventName === 'quiz_start').length,
          engagementScore: calculateEngagementScore(courseEvents)
        }
      });
    }
  } catch (error) {
    console.error('Failed to update metrics:', error);
  }
}

// Detect learning patterns
async function detectLearningPatterns(events: TrackingEvent[], userId?: string) {
  if (!userId) return;

  // Detect struggle points
  const videoPauseEvents = events.filter(
    e => e.eventType === 'video' && e.eventName === 'video_pause'
  );

  for (const event of videoPauseEvents) {
    if (event.properties.currentTime && event.properties.videoId) {
      // Check if multiple users paused at similar points
      const similarPauses = await db.studentInteraction.count({
        where: {
          eventName: 'video_pause',
          metadata: {
            path: ['videoId'],
            equals: event.properties.videoId
          },
          AND: {
            metadata: {
              path: ['currentTime'],
              gte: event.properties.currentTime - 5,
              lte: event.properties.currentTime + 5
            }
          }
        }
      });

      // If more than 5 users paused at similar point, flag it
      if (similarPauses > 5) {
        await db.contentFlag.create({
          data: {
            contentType: 'video',
            contentId: event.properties.videoId,
            flagType: 'struggle_point',
            metadata: JSON.stringify({
              timestamp: event.properties.currentTime,
              pauseCount: similarPauses
            })
          }
        });
      }
    }
  }
}

// Calculate video watch time from events
function calculateVideoTime(videoEvents: TrackingEvent[]): number {
  let totalTime = 0;
  const sessions: Record<string, { start?: number; end?: number }> = {};

  videoEvents.forEach(event => {
    const videoId = event.properties.videoId;
    if (!videoId) return;

    if (event.eventName === 'video_play') {
      sessions[videoId] = { start: event.properties.currentTime || 0 };
    } else if (event.eventName === 'video_pause' || event.eventName === 'video_complete') {
      if (sessions[videoId]?.start !== undefined) {
        const duration = (event.properties.currentTime || 0) - sessions[videoId].start;
        totalTime += duration;
        delete sessions[videoId];
      }
    }
  });

  return Math.round(totalTime);
}

// Calculate engagement score
function calculateEngagementScore(events: TrackingEvent[]): number {
  const weights = {
    click: 1,
    view: 2,
    scroll: 1.5,
    video: 3,
    quiz: 5,
    interaction: 2
  };

  let score = 0;
  events.forEach(event => {
    score += weights[event.eventType] || 1;
  });

  // Normalize to 0-100
  return Math.min(Math.round((score / events.length) * 20), 100);
}

// POST endpoint
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();
    
    // Handle both single events and batches
    const events = Array.isArray(body.events) ? body.events : [body];
    
    // Validate all events
    const validEvents = events.filter(validateEvent);
    
    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events provided' },
        { status: 400 }
      );
    }

    // Process events
    const result = await processEventBatch(validEvents, user?.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}

// GET endpoint for analytics data
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let data;
    
    switch (type) {
      case 'student':
        // Get student metrics for a course
        if (!courseId) {
          return NextResponse.json({ error: 'courseId required' }, { status: 400 });
        }
        
        data = await getStudentMetrics(user.id, courseId, startDate, endDate);
        break;
        
      case 'course':
        // Get course analytics (teachers only)
        if (!courseId) {
          return NextResponse.json({ error: 'courseId required' }, { status: 400 });
        }
        
        const course = await db.course.findUnique({
          where: { id: courseId, userId: user.id }
        });
        
        if (!course) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        data = await getCourseAnalytics(courseId, startDate, endDate);
        break;
        
      case 'patterns':
        // Get learning patterns for a student
        data = await getLearningPatterns(studentId || user.id);
        break;
        
      case 'interactions':
        // Get raw interaction data
        data = await getInteractionData(user.id, courseId, {
          startDate,
          endDate,
          limit: parseInt(searchParams.get('limit') || '100')
        });
        break;
        
      case 'content-flags':
        // Get flagged content (teachers only)
        if (!courseId) {
          return NextResponse.json({ error: 'courseId required' }, { status: 400 });
        }
        
        const courseCheck = await db.course.findUnique({
          where: { id: courseId, userId: user.id }
        });
        
        if (!courseCheck) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        data = await getContentFlags(courseId);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper functions for GET endpoint
async function getStudentMetrics(userId: string, courseId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = {
    ...(startDate && { gte: new Date(startDate) }),
    ...(endDate && { lte: new Date(endDate) })
  };
  
  // Get aggregated metrics
  const metrics = await db.learningMetric.aggregate({
    where: {
      studentId: userId,
      courseId: courseId,
      ...(startDate || endDate ? { date: dateFilter } : {})
    },
    _sum: {
      totalTimeSpent: true,
      totalInteractions: true,
      videoWatchTime: true,
      quizAttempts: true
    },
    _avg: {
      engagementScore: true,
      learningVelocity: true
    }
  });
  
  // Get course progress
  const enrollment = await db.userCourseEnrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  });
  
  // Get recent interactions
  const recentInteractions = await db.studentInteraction.findMany({
    where: {
      studentId: userId,
      courseId: courseId
    },
    orderBy: { timestamp: 'desc' },
    take: 10
  });
  
  return {
    userId,
    courseId,
    totalTimeSpent: metrics._sum.totalTimeSpent || 0,
    totalInteractions: metrics._sum.totalInteractions || 0,
    videoWatchTime: metrics._sum.videoWatchTime || 0,
    quizAttempts: metrics._sum.quizAttempts || 0,
    engagementScore: metrics._avg.engagementScore || 0,
    learningVelocity: metrics._avg.learningVelocity || 0,
    completionRate: enrollment?.progressPercentage || 0,
    lastActiveAt: recentInteractions[0]?.timestamp || null,
    averageSessionDuration: 0, // Calculate from session data
    returnFrequency: 0 // Calculate from session data
  };
}

async function getCourseAnalytics(courseId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = {
    ...(startDate && { gte: new Date(startDate) }),
    ...(endDate && { lte: new Date(endDate) })
  };
  
  // Get total interactions
  const totalInteractions = await db.studentInteraction.count({
    where: {
      courseId: courseId,
      ...(startDate || endDate ? { timestamp: dateFilter } : {})
    }
  });
  
  // Get unique students
  const uniqueStudents = await db.studentInteraction.findMany({
    where: {
      courseId: courseId,
      studentId: { not: null },
      ...(startDate || endDate ? { timestamp: dateFilter } : {})
    },
    distinct: ['studentId'],
    select: { studentId: true }
  });
  
  // Get event breakdown
  const eventBreakdown = await db.studentInteraction.groupBy({
    by: ['interactionType'],
    where: {
      courseId: courseId,
      ...(startDate || endDate ? { timestamp: dateFilter } : {})
    },
    _count: true
  });
  
  // Get struggle points (content flags)
  const contentFlags = await db.contentFlag.findMany({
    where: {
      contentId: {
        in: await getContentIdsForCourse(courseId)
      }
    },
    orderBy: { count: 'desc' },
    take: 10
  });
  
  // Get leaderboard data
  const leaderboard = await db.learningMetric.groupBy({
    by: ['studentId'],
    where: { courseId },
    _avg: { engagementScore: true },
    orderBy: { _avg: { engagementScore: 'desc' } },
    take: 10
  });
  
  return {
    totalInteractions,
    uniqueStudents: uniqueStudents.length,
    eventBreakdown: {
      clicks: eventBreakdown.find(e => e.interactionType === 'click')?._count || 0,
      views: eventBreakdown.find(e => e.interactionType === 'view')?._count || 0,
      videos: eventBreakdown.find(e => e.interactionType === 'video')?._count || 0,
      quizzes: eventBreakdown.find(e => e.interactionType === 'quiz')?._count || 0
    },
    topStruggles: contentFlags.map(flag => ({
      videoId: flag.contentId,
      timestamp: parseInt(JSON.parse(flag.metadata as string).timestamp || '0'),
      count: flag.count
    })),
    leaderboard: leaderboard.map(item => ({
      userId: item.studentId,
      score: Math.round(item._avg.engagementScore || 0)
    }))
  };
}

async function getLearningPatterns(studentId: string) {
  const pattern = await db.learningPattern.findUnique({
    where: { studentId }
  });
  
  if (!pattern) {
    return {
      optimalStudyHours: [],
      contentPreferences: { video: 25, text: 25, interactive: 25, quiz: 25 },
      learningStyle: { style: 'mixed', confidence: 0 },
      averageVelocity: 0,
      lastUpdated: new Date()
    };
  }
  
  return {
    optimalStudyHours: pattern.preferredStudyTime,
    contentPreferences: pattern.contentPreferences,
    learningStyle: { style: 'mixed', confidence: 80 }, // Calculate from patterns
    averageVelocity: pattern.learningVelocity,
    lastUpdated: pattern.lastUpdated
  };
}

async function getInteractionData(userId: string, courseId?: string | null, options: any) {
  const interactions = await db.studentInteraction.findMany({
    where: {
      studentId: userId,
      ...(courseId && { courseId }),
      ...(options.startDate && { timestamp: { gte: new Date(options.startDate) } }),
      ...(options.endDate && { timestamp: { lte: new Date(options.endDate) } })
    },
    orderBy: { timestamp: 'desc' },
    take: options.limit || 100,
    select: {
      id: true,
      interactionType: true,
      eventName: true,
      metadata: true,
      timestamp: true,
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
      },
      section: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  
  return interactions;
}

async function getContentFlags(courseId: string) {
  const contentIds = await getContentIdsForCourse(courseId);
  
  const flags = await db.contentFlag.findMany({
    where: {
      contentId: { in: contentIds }
    },
    orderBy: { count: 'desc' }
  });
  
  return flags;
}

async function getContentIdsForCourse(courseId: string): Promise<string[]> {
  const sections = await db.section.findMany({
    where: {
      chapter: {
        courseId: courseId
      }
    },
    select: { id: true }
  });
  
  const videos = await db.video.findMany({
    where: {
      sectionId: { in: sections.map(s => s.id) }
    },
    select: { id: true }
  });
  
  return [...sections.map(s => s.id), ...videos.map(v => v.id)];
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}