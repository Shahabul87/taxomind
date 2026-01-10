/**
 * SAM Agentic Events API
 * Captures frontend behavior events for the BehaviorMonitor
 *
 * Phase 4: Proactive Features
 * - Tracks user interactions for behavior analysis
 * - Powers intervention triggers and pattern detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getProactiveStores } from '@/lib/sam/taxomind-context';
import {
  createBehaviorMonitor,
  BehaviorEventType,
  type Intervention,
  type InterventionCheckResult,
  type BehaviorEvent,
} from '@sam-ai/agentic';

// Lazy initialize behavior monitor using TaxomindContext stores
let behaviorMonitorInstance: ReturnType<typeof createBehaviorMonitor> | null = null;

function getBehaviorMonitor() {
  if (!behaviorMonitorInstance) {
    const stores = getProactiveStores();
    behaviorMonitorInstance = createBehaviorMonitor({
      eventStore: stores.behaviorEvent,
      patternStore: stores.pattern,
      interventionStore: stores.intervention,
      logger: console,
    });
  }
  return behaviorMonitorInstance;
}

// Get behavior event store from context for direct queries
function getBehaviorEventStore() {
  return getProactiveStores().behaviorEvent;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EventTypeEnum = z.enum([
  'session_start',
  'session_end',
  'page_view',
  'content_interaction',
  'assessment_start',
  'assessment_complete',
  'hint_requested',
  'frustration_signal',
  'long_pause',
  'rapid_navigation',
  'help_requested',
  'goal_set',
  'goal_updated',
  'milestone_reached',
]);

const CreateEventSchema = z.object({
  type: EventTypeEnum,
  data: z.record(z.unknown()).optional().default({}),
  timestamp: z.string().datetime().optional(),
  pageContext: z.object({
    type: z.string().optional(),
    path: z.string().optional(),
    entityId: z.string().optional(),
    entityType: z.enum(['course', 'chapter', 'section']).optional(),
  }).optional(),
});

const BatchEventsSchema = z.object({
  events: z.array(CreateEventSchema).min(1).max(100),
});

const GetEventsQuerySchema = z.object({
  type: EventTypeEnum.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// GET - Get user&apos;s recent events
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetEventsQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    // Get events from store using interface-compliant getByUser with options
    const since = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const until = query.to ? new Date(query.to) : new Date();

    const events = await getBehaviorEventStore().getByUser(
      session.user.id,
      {
        types: query.type ? [query.type as BehaviorEventType] : undefined,
        since,
        until,
        limit: query.limit,
      }
    );

    // Results already limited by store query
    const limitedEvents = events;

    return NextResponse.json({
      success: true,
      data: {
        events: limitedEvents,
        count: limitedEvents.length,
        totalInRange: events.length,
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
// POST - Record behavior event(s)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Support both single event and batch events
    const isBatch = 'events' in body;
    let eventsToRecord: z.infer<typeof CreateEventSchema>[];

    if (isBatch) {
      const validated = BatchEventsSchema.parse(body);
      eventsToRecord = validated.events;
    } else {
      const validated = CreateEventSchema.parse(body);
      eventsToRecord = [validated];
    }

    const behaviorMonitor = getBehaviorMonitor();
    const recordedEvents: Array<{ id: string; type: string }> = [];

    for (const eventData of eventsToRecord) {
      try {
        // Use BehaviorMonitor.trackEvent() to properly process events
        // This handles emotional signals and creates interventions for high frustration
        const event = await behaviorMonitor.trackEvent({
          userId: session.user.id,
          sessionId: `session-${session.user.id}-${Date.now()}`,
          type: eventData.type as BehaviorEventType,
          timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
          data: {
            pageType: eventData.pageContext?.type,
            path: eventData.pageContext?.path,
            entityId: eventData.pageContext?.entityId,
            entityType: eventData.pageContext?.entityType,
            ...eventData.data,
          },
          pageContext: {
            url: eventData.pageContext?.path ?? '/',
            courseId: eventData.pageContext?.entityType === 'course' ? eventData.pageContext?.entityId : undefined,
            chapterId: eventData.pageContext?.entityType === 'chapter' ? eventData.pageContext?.entityId : undefined,
            sectionId: eventData.pageContext?.entityType === 'section' ? eventData.pageContext?.entityId : undefined,
            contentType: eventData.pageContext?.type,
          },
        });

        recordedEvents.push({ id: event.id, type: event.type });
      } catch (eventError) {
        logger.warn('Failed to record individual event:', { error: eventError, type: eventData.type });
        // Continue with other events
      }
    }

    // Check for interventions after recording events
    // This evaluates anomalies, patterns, and creates interventions as needed
    let interventionCheckResult: InterventionCheckResult | null = null;
    const triggeredInterventions: Array<{ type: string; reason: string; id: string }> = [];

    try {
      interventionCheckResult = await behaviorMonitor.checkInterventions(session.user.id);

      // Map created interventions to response format
      for (const intervention of interventionCheckResult.interventionsCreated) {
        triggeredInterventions.push({
          id: intervention.id,
          type: intervention.type,
          reason: intervention.message,
        });
      }

      logger.info('Intervention check completed', {
        userId: session.user.id,
        anomaliesDetected: interventionCheckResult.anomaliesDetected.length,
        patternsDetected: interventionCheckResult.patternsDetected.length,
        interventionsCreated: interventionCheckResult.interventionsCreated.length,
        pendingInterventions: interventionCheckResult.existingPendingInterventions.length,
      });
    } catch (checkError) {
      logger.warn('Failed to check interventions:', { error: checkError });
      // Continue without failing the request
    }

    logger.info(`Recorded ${recordedEvents.length} behavior events for user ${session.user.id}`, {
      eventTypes: recordedEvents.map(e => e.type),
      interventionsTriggered: triggeredInterventions.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        recorded: recordedEvents.length,
        events: recordedEvents,
        interventions: triggeredInterventions.length > 0 ? triggeredInterventions : undefined,
        interventionCheck: interventionCheckResult ? {
          anomaliesDetected: interventionCheckResult.anomaliesDetected.length,
          patternsDetected: interventionCheckResult.patternsDetected.length,
          interventionsCreated: interventionCheckResult.interventionsCreated.length,
          pendingInterventions: interventionCheckResult.existingPendingInterventions.length,
        } : undefined,
      },
    });
  } catch (error) {
    logger.error('Error recording behavior events:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record behavior events' },
      { status: 500 }
    );
  }
}
