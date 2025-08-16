import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

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

export async function POST(req: Request) {
  try {
    const event: AnalyticsEvent = await req.json();
    
    // Validate event structure
    if (!event.eventType || !event.eventCategory || !event.sessionId) {
      return new NextResponse("Invalid event structure", { status: 400 });
    }

    // Get current user if available (analytics can work without authentication)
    const user = await currentUser();
    if (user?.id && !event.userId) {
      event.userId = user.id;
    }

    // Store analytics event
    await storeAnalyticsEvent(event);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[ANALYTICS] Error storing event:', error);
    // Don't return error - analytics should never break the app
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

async function storeAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  // Log for development
  if (process.env.NODE_ENV === 'development') {
}
  // In production, implement your preferred analytics storage
  // Examples: database storage, external service, etc.
}