import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface AnalyticsEvent {
  eventType: string;
  eventCategory: 'ai_generation' | 'user_interaction' | 'performance' | 'error' | 'success';
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: {
    userAgent?: string;
    pathname?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
  };
}

interface BatchRequest {
  events: AnalyticsEvent[];
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const { events }: BatchRequest = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return new NextResponse("Invalid batch request", { status: 400 });
    }

    // Cap events array to prevent abuse
    if (events.length > 100) {
      return new NextResponse("Too many events in batch (max 100)", { status: 400 });
    }

    // Get current user if available
    const user = await currentUser();
    
    // Process all events in batch
    const results = await Promise.allSettled(
      events.map(event => processBatchEvent(event, user?.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ 
      success: true, 
      processed: events.length,
      successful,
      failed 
    });
  } catch (error) {
    logger.error('[ANALYTICS] Error processing batch:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Batch processing failed' } }, { status: 500 });
  }
}

async function processBatchEvent(event: AnalyticsEvent, userId?: string): Promise<void> {
  // Validate event
  if (!event.eventType || !event.eventCategory || !event.sessionId) {
    throw new Error('Invalid event structure');
  }

  // Add user ID if available and not already set
  if (userId && !event.userId) {
    event.userId = userId;
  }

  // Store the event
  await storeBatchEvent(event);
}

async function storeBatchEvent(event: AnalyticsEvent): Promise<void> {
  // Log for development
  if (process.env.NODE_ENV === 'development') {
}
  // In production, implement batch storage optimization
  // Examples: bulk database insert, batch external API calls, etc.
}