import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Force Node.js runtime
export const runtime = 'nodejs';

// Enhanced analytics event schema for learning events
const LearningAnalyticsEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
});

const TrackAnalyticsSchema = z.object({
  events: z.array(LearningAnalyticsEventSchema),
  courseId: z.string(),
  chapterId: z.string(),
  sectionId: z.string(),
});

// Legacy analytics event interface (for backward compatibility)
interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

/**
 * POST /api/analytics/track
 *
 * Track analytics events from the blog
 *
 * Features:
 * - Rate limiting (100 events/minute per IP)
 * - Event validation
 * - Async processing (doesn't block client)
 * - Development logging
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Rate limiting: 100 events per minute per IP
    const clientId = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(clientId, 100, 60000);

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      logger.warn('[ANALYTICS] Rate limit exceeded', {
        identifier: clientId,
        remaining: rateLimitResult.remaining,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many analytics events',
          },
        },
        {
          status: 429,
          headers: rateLimitHeaders as HeadersInit,
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const user = await currentUser();

    // Check if this is a learning analytics request (batch events)
    if (body.events && Array.isArray(body.events)) {
      try {
        const validatedData = TrackAnalyticsSchema.parse(body);

        // Process learning events in batch
        const analyticsPromises = validatedData.events.map(async (event) => {
          // Store in database (check if table exists first)
          try {
            // For now, log to console in development
            if (process.env.NODE_ENV === 'development') {
              logger.info('[LEARNING_ANALYTICS] Event tracked', {
                eventType: event.eventType,
                courseId: validatedData.courseId,
                sectionId: validatedData.sectionId,
                userId: event.userId || user?.id,
                eventData: event.eventData,
              });
            }

            // TODO: Uncomment when analyticsEvent table is created
            // return db.analyticsEvent.create({
            //   data: {
            //     userId: event.userId || user?.id || null,
            //     courseId: validatedData.courseId,
            //     chapterId: validatedData.chapterId,
            //     sectionId: validatedData.sectionId,
            //     eventType: event.eventType,
            //     eventData: event.eventData || {},
            //     sessionId: event.sessionId,
            //     timestamp: new Date(event.timestamp),
            //   },
            // });
          } catch (dbError) {
            logger.warn('[LEARNING_ANALYTICS] Database write failed, continuing', dbError);
          }
        });

        await Promise.allSettled(analyticsPromises);

        // Update aggregated metrics if user is authenticated
        if (user?.id) {
          await updateLearningMetrics(
            user.id,
            validatedData.courseId,
            validatedData.events
          );
        }

        return NextResponse.json(
          {
            success: true,
            message: 'Learning analytics tracked',
          },
          {
            headers: rateLimitHeaders as HeadersInit,
          }
        );
      } catch (validationError) {
        // Fall through to legacy event handling
      }
    }

    // Legacy single event handling
    if (!body.event || !body.properties || !body.timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EVENT',
            message: 'Event must have event, properties, and timestamp fields',
          },
        },
        { status: 400, headers: rateLimitHeaders as HeadersInit }
      );
    }

    const event: AnalyticsEvent = {
      event: body.event,
      properties: body.properties,
      timestamp: body.timestamp,
    };

    // Log event in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('[ANALYTICS] Event tracked', {
        event: event.event,
        properties: event.properties,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Event tracked',
      },
      {
        headers: rateLimitHeaders as HeadersInit,
      }
    );
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking event:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: 'Failed to track event',
          details:
            process.env.NODE_ENV === 'development'
              ? { message: errorMessage }
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(req: Request): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

/**
 * Update aggregated learning metrics
 */
async function updateLearningMetrics(
  userId: string,
  courseId: string,
  events: Array<any>
) {
  try {
    // Calculate total time spent from TIME_SPENT events
    const timeSpentEvents = events.filter(
      (e) => e.eventType === 'time_spent'
    );
    const totalTimeSpent = timeSpentEvents.reduce(
      (sum, e) => sum + (e.eventData?.timeSpent || 0),
      0
    );

    // Check if UserProgress exists for this user and course
    const existingProgress = await db.user_progress.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existingProgress) {
      // Update existing progress with time spent
      await db.user_progress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    // Track video completion events
    const videoCompletedEvents = events.filter(
      (e) => e.eventType === 'video_completed'
    );

    // Track quiz submission events
    const quizSubmittedEvents = events.filter(
      (e) => e.eventType === 'quiz_submitted'
    );

    // Log aggregated metrics in development
    if (process.env.NODE_ENV === 'development' && (totalTimeSpent > 0 || videoCompletedEvents.length > 0 || quizSubmittedEvents.length > 0)) {
      logger.info('[LEARNING_METRICS] Updated metrics', {
        userId,
        courseId,
        totalTimeSpent,
        videosCompleted: videoCompletedEvents.length,
        quizzesSubmitted: quizSubmittedEvents.length,
      });
    }
  } catch (error) {
    logger.error('[LEARNING_METRICS] Failed to update metrics:', error);
  }
}
