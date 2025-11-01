import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

// Force Node.js runtime
export const runtime = 'nodejs';

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

    // Validate event structure
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

    // TODO: Store events in database or send to analytics service
    // Example implementations:

    // Option 1: Store in database
    // await db.analyticsEvent.create({
    //   data: {
    //     event: event.event,
    //     properties: event.properties,
    //     timestamp: new Date(event.timestamp),
    //     userId: session?.user?.id,
    //     ip: clientId,
    //   },
    // });

    // Option 2: Send to external analytics service
    // await sendToAnalyticsService(event);

    // Option 3: Queue for batch processing
    // await queueEvent(event);

    // For now, just acknowledge receipt
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
