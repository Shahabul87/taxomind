// Enhanced Analytics Events API with Redis

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { TrackingEvent } from '@/lib/analytics/types';
import { RealTimeMetrics } from '@/lib/redis/real-time-metrics';
import { LearningPatternDetector } from '@/lib/redis/learning-patterns';
import { RateLimiter } from '@/lib/redis/rate-limiter';
import { AICache } from '@/lib/redis/ai-cache';

// Process events with Redis
async function processEventBatch(events: TrackingEvent[], userId?: string) {
  // Store in database (batch insert)
  const dbPromise = storeEventsInDatabase(events, userId);
  
  // Process in Redis (real-time)
  const redisPromises = events.map(async (event) => {
    const eventUserId = userId || event.userId;
    
    if (eventUserId && event.courseId) {
      // Update real-time metrics
      await RealTimeMetrics.updateStudentMetrics(
        eventUserId,
        event.courseId,
        event
      );
      
      // Track learning patterns
      await LearningPatternDetector.trackStudySession(eventUserId, event);
      
      // Track content preferences
      if (event.eventType === 'video') {
        await updateContentPreference(eventUserId, 'video');
      } else if (event.eventType === 'quiz') {
        await updateContentPreference(eventUserId, 'quiz');
      }
      
      // Track struggles
      if (event.sectionId && isStruggleEvent(event)) {
        await LearningPatternDetector.trackTopicStruggle(
          eventUserId,
          event.courseId,
          event.sectionId,
          event
        );
      }
    }
    
    // Track session
    if (event.sessionId) {
      await RealTimeMetrics.trackSession(
        event.sessionId,
        eventUserId || 'anonymous'
      );
    }
  });
  
  // Wait for all operations
  await Promise.all([dbPromise, ...redisPromises]);
  
  return { success: true, processed: events.length };
}

// Store events in database
async function storeEventsInDatabase(events: TrackingEvent[], userId?: string) {
  try {
    const eventRecords = events.map(event => ({
      id: `${userId || event.userId}-${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || event.userId || 'anonymous',
      activityType: 'INTERACTION' as any, // Assuming INTERACTION is a valid ActivityType
      action: event.eventName,
      entityType: event.eventType || null,
      entityId: event.sessionId || null,
      courseId: event.courseId || null,
      chapterId: event.chapterId || null,
      sectionId: event.sectionId || null,
      duration: null,
      metadata: event.properties,
      timestamp: new Date(event.timestamp),
    }));

    await db.realtime_activities.createMany({
      data: eventRecords,
      skipDuplicates: true
    });
  } catch (error) {
    console.error('Database storage error:', error);
  }
}

// Update content preferences in Redis
async function updateContentPreference(userId: string, contentType: string) {
  const key = `patterns:${userId}:content_prefs`;
  await redis?.hincrby(key, contentType, 1);
}

// Check if event indicates struggle
function isStruggleEvent(event: TrackingEvent): boolean {
  return (
    (event.eventType === 'video' && event.eventName === 'video_pause') ||
    (event.eventType === 'video' && event.eventName === 'video_seek' && 
     Math.abs(event.properties.seekDistance || 0) > 10) ||
    (event.eventType === 'quiz' && event.properties.score < 70) ||
    event.eventName === 'content_revisit'
  );
}

// Validate event
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

// POST endpoint with rate limiting
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id || req.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check rate limit
    const rateLimitResult = await RateLimiter.checkLimit(
      userId,
      'analytics_events',
      1000, // 1000 events per minute
      60
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString()
          }
        }
      );
    }
    
    const body = await req.json();
    const events = Array.isArray(body.events) ? body.events : [body];
    
    // Validate events
    const validEvents = events.filter(validateEvent);
    
    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events provided' },
        { status: 400 }
      );
    }
    
    // Process events
    const result = await processEventBatch(validEvents, user?.id);
    
    return NextResponse.json({
      ...result,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}

// GET endpoint for real-time metrics
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const courseIdParam = searchParams.get('courseId');
    const type = searchParams.get('type') || 'student';
    
    let data;
    
    if (type === 'student' && courseIdParam) {
      // Get student metrics for a course
      const courseId: string = courseIdParam as string;
      data = { message: 'Student metrics temporarily disabled' };
    } else if (type === 'course' && courseIdParam) {
      // Get course analytics (teachers only)
      const courseId: string = courseIdParam as string;
      const course = await db.course.findUnique({
        where: { id: courseId, userId: user.id }
      });
      
      if (!course) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      data = { message: 'Course analytics temporarily disabled' };
    } else if (type === 'patterns') {
      // Get learning patterns
      data = { message: 'Learning patterns temporarily disabled' };
    } else if (type === 'cache-stats') {
      // Get cache statistics
      data = { message: 'AI cache stats temporarily disabled' };
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