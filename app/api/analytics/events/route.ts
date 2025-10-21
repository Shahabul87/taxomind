import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for batch events
const BatchEventSchema = z.object({
  events: z.array(z.object({
    eventType: z.string(),
    eventName: z.string(),
    properties: z.record(z.any()).optional(),
    timestamp: z.string().or(z.date()),
    sessionId: z.string(),
    url: z.string().optional(),
    userAgent: z.string().optional(),
  })),
  sessionId: z.string(),
  timestamp: z.string(),
});

// Validation schema for single event (backward compatibility)
const SingleEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()).optional(),
  page: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Try to parse as batch events first
    const batchResult = BatchEventSchema.safeParse(body);
    if (batchResult.success) {
      const { events, sessionId, timestamp } = batchResult.data;

      logger.info('[ANALYTICS_BATCH_EVENTS]', {
        eventCount: events.length,
        sessionId,
        timestamp,
        events: events.map(e => ({
          type: e.eventType,
          name: e.eventName,
          timestamp: e.timestamp,
        })),
      });

      return NextResponse.json({
        success: true,
        processed: events.length
      });
    }

    // Fall back to single event format for backward compatibility
    const singleResult = SingleEventSchema.safeParse(body);
    if (singleResult.success) {
      const { event, properties, page } = singleResult.data;

      logger.info('[ANALYTICS_EVENT]', {
        event,
        properties,
        page,
        at: new Date().toISOString()
      });

      return NextResponse.json({ success: true });
    }

    // Invalid format
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Request body must match either batch events or single event format',
        }
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[ANALYTICS_EVENT_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred processing analytics events',
        }
      },
      { status: 500 }
    );
  }
}

