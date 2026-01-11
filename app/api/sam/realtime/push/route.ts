/**
 * SAM Realtime Push API Route
 *
 * Internal endpoint for pushing real-time events to users.
 * Used by server-side code (cron jobs, webhooks) to deliver interventions.
 *
 * Security: Requires admin role or internal CRON_SECRET for access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getSAMRealtimeServer, pushProactiveIntervention } from '@/lib/sam/realtime';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { SAMWebSocketEvent } from '@sam-ai/agentic';

// Request validation schema
const PushEventSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    'intervention',
    'checkin',
    'recommendation',
    'nudge',
    'celebration',
    'notification',
  ]),
  payload: z.record(z.unknown()),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
  channels: z.array(z.enum(['websocket', 'in_app', 'sse'])).optional(),
});

// Broadcast schema
const BroadcastEventSchema = z.object({
  type: z.enum(['announcement', 'maintenance', 'update']),
  payload: z.record(z.unknown()),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
});

/**
 * Verify internal API access (admin or cron secret)
 */
async function verifyInternalAccess(request: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  // Check for CRON_SECRET header (for cron jobs)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  // Check for admin session
  const session = await auth();
  if (session?.user?.role === 'ADMIN') {
    return { authorized: true };
  }

  return { authorized: false, reason: 'Admin access or CRON_SECRET required' };
}

/**
 * POST /api/sam/realtime/push
 *
 * Push an event to a specific user.
 *
 * Body:
 * {
 *   "userId": "user-123",
 *   "type": "intervention",
 *   "payload": { "message": "Time for a break!" },
 *   "priority": "normal"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify access
    const { authorized, reason } = await verifyInternalAccess(request);
    if (!authorized) {
      return NextResponse.json({ error: reason ?? 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = PushEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      }, { status: 400 });
    }

    const { userId, type, payload, priority, channels } = parseResult.data;

    logger.info('[SAM_REALTIME_PUSH] Pushing event', { userId, type, priority });

    const realtimeServer = getSAMRealtimeServer();

    // Check if user is online
    const isOnline = await realtimeServer.isUserOnline(userId);

    if (!isOnline) {
      logger.debug('[SAM_REALTIME_PUSH] User is offline, queuing for later', { userId });
    }

    // Push the event
    if (type === 'intervention' || type === 'checkin' || type === 'recommendation' ||
        type === 'nudge' || type === 'celebration') {
      await pushProactiveIntervention(realtimeServer, userId, {
        type,
        id: uuidv4(),
        data: payload,
        priority,
      });
    } else {
      // Generic notification - use nudge type with custom payload
      const nudgeId = uuidv4();
      const event: SAMWebSocketEvent = {
        type: 'nudge',
        eventId: uuidv4(),
        userId,
        timestamp: new Date(),
        payload: {
          id: nudgeId,
          type: 'reminder',
          message: (payload as Record<string, unknown>).message as string ?? 'Notification',
          ...(payload as Record<string, unknown>),
        },
      };

      await realtimeServer.pushToUser(userId, event, {
        priority,
        channels: channels as Array<'websocket' | 'in_app' | 'email' | 'push_notification' | 'sse'>,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        type,
        delivered: isOnline,
        queued: !isOnline,
      },
    });
  } catch (error) {
    logger.error('[SAM_REALTIME_PUSH] Error pushing event', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to push event',
      },
    }, { status: 500 });
  }
}

/**
 * PUT /api/sam/realtime/push
 *
 * Broadcast an event to all online users.
 *
 * Body:
 * {
 *   "type": "announcement",
 *   "payload": { "message": "System maintenance in 5 minutes" },
 *   "priority": "high"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access only for broadcasts
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required for broadcasts' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = BroadcastEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      }, { status: 400 });
    }

    const { type, payload, priority } = parseResult.data;

    logger.info('[SAM_REALTIME_PUSH] Broadcasting event', { type, priority });

    const realtimeServer = getSAMRealtimeServer();

    // Broadcasts use nudge type for system-wide announcements
    const broadcastId = uuidv4();
    const event: SAMWebSocketEvent = {
      type: 'nudge',
      eventId: uuidv4(),
      timestamp: new Date(),
      payload: {
        id: broadcastId,
        type: 'reminder',
        message: (payload as Record<string, unknown>).message as string ?? `System ${type}`,
        ...(payload as Record<string, unknown>),
      },
    };

    const deliveredCount = await realtimeServer.broadcast(event);

    return NextResponse.json({
      success: true,
      data: {
        type,
        deliveredCount,
      },
    });
  } catch (error) {
    logger.error('[SAM_REALTIME_PUSH] Error broadcasting event', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to broadcast event',
      },
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
