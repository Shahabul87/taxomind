/**
 * SAM Behavior Monitoring API
 * Tracks user behavior events, detects patterns, and predicts struggles/churn
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getProactiveStores } from '@/lib/sam/taxomind-context';
import { createBehaviorMonitor } from '@sam-ai/agentic';

// Lazy initialize behavior monitor using TaxomindContext stores
let behaviorMonitorInstance: ReturnType<typeof createBehaviorMonitor> | null = null;

function getBehaviorMonitor() {
  if (!behaviorMonitorInstance) {
    const { behaviorEvent, pattern, intervention } = getProactiveStores();
    behaviorMonitorInstance = createBehaviorMonitor({
      eventStore: behaviorEvent,
      patternStore: pattern,
      interventionStore: intervention,
      logger: console,
    });
  }
  return behaviorMonitorInstance;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BehaviorEventSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum([
    'page_view',
    'content_interaction',
    'assessment_attempt',
    'hint_request',
    'question_asked',
    'frustration_signal',
    'success_signal',
    'session_start',
    'session_end',
    'goal_set',
    'goal_abandoned',
    'content_skipped',
    'help_requested',
    'break_taken',
  ]),
  data: z.record(z.unknown()).optional().default({}),
  pageContext: z.object({
    url: z.string(),
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    contentType: z.string().optional(),
    timeOnPage: z.number().optional(),
    scrollDepth: z.number().optional(),
  }),
  emotionalSignals: z
    .array(
      z.object({
        type: z.enum([
          'frustration',
          'confusion',
          'excitement',
          'boredom',
          'engagement',
          'fatigue',
          'confidence',
          'anxiety',
        ]),
        intensity: z.number().min(0).max(1),
        source: z.enum(['text', 'behavior', 'timing', 'pattern']),
      })
    )
    .optional(),
});

const BatchEventsSchema = z.object({
  events: z.array(BehaviorEventSchema).min(1).max(100),
});

const GetEventsQuerySchema = z.object({
  types: z.string().optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  includeProcessed: z.coerce.boolean().optional().default(false),
});

// ============================================================================
// GET - Get user behavior events
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetEventsQuerySchema.parse({
      types: searchParams.get('types') ?? undefined,
      since: searchParams.get('since') ?? undefined,
      until: searchParams.get('until') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      includeProcessed: searchParams.get('includeProcessed') ?? undefined,
    });

    const behaviorMonitor = getBehaviorMonitor();

    const events = await behaviorMonitor.getEvents(session.user.id, {
      since: query.since ? new Date(query.since) : undefined,
      until: query.until ? new Date(query.until) : undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          count: events.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching behavior events:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch behavior events' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Track a behavior event
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Check if batch or single event
    if (body.events) {
      // Batch events
      const validated = BatchEventsSchema.parse(body);
      const behaviorMonitor = getBehaviorMonitor();

      const events = await behaviorMonitor.trackEvents(
        validated.events.map((e) => ({
          userId: session.user.id,
          sessionId: e.sessionId,
          timestamp: new Date(),
          type: e.type,
          data: e.data,
          pageContext: e.pageContext,
          emotionalSignals: e.emotionalSignals?.map((s) => ({
            ...s,
            timestamp: new Date(),
          })),
        }))
      );

      logger.info(
        `Tracked ${events.length} behavior events for user ${session.user.id}`
      );

      return NextResponse.json({
        success: true,
        data: { events, count: events.length },
      });
    } else {
      // Single event
      const validated = BehaviorEventSchema.parse(body);
      const behaviorMonitor = getBehaviorMonitor();

      const event = await behaviorMonitor.trackEvent({
        userId: session.user.id,
        sessionId: validated.sessionId,
        timestamp: new Date(),
        type: validated.type,
        data: validated.data,
        pageContext: validated.pageContext,
        emotionalSignals: validated.emotionalSignals?.map((s) => ({
          ...s,
          timestamp: new Date(),
        })),
      });

      logger.info(
        `Tracked behavior event ${event.type} for user ${session.user.id}`
      );

      return NextResponse.json({
        success: true,
        data: { event },
      });
    }
  } catch (error) {
    logger.error('Error tracking behavior event:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track behavior event' },
      { status: 500 }
    );
  }
}
