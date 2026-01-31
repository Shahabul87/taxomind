/**
 * SAM Realtime Events API Route
 *
 * Provides Server-Sent Events (SSE) endpoint for real-time intervention delivery.
 * This serves as the primary push channel when WebSocket is not available.
 *
 * Features:
 * - SSE-based real-time event delivery
 * - Presence tracking integration
 * - Intervention queue management
 * - Fallback for WebSocket-less environments
 *
 * @see lib/sam/realtime/index.ts for the underlying SAMRealtimeServer
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getSAMRealtimeServer } from '@/lib/sam/realtime';
import { v4 as uuidv4 } from 'uuid';
import type { SAMWebSocketEvent } from '@sam-ai/agentic';

/**
 * GET /api/sam/realtime/events
 *
 * SSE endpoint for real-time event streaming.
 * Client connects and receives events as they occur.
 *
 * Usage:
 * ```javascript
 * const eventSource = new EventSource('/api/sam/realtime/events');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Received event:', data);
 * };
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;
    const connectionId = uuidv4();

    logger.info('[SAM_REALTIME_SSE] New connection', { userId, connectionId });

    // Get the realtime server instance
    const realtimeServer = getSAMRealtimeServer();

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection event
        const connectEvent: SAMWebSocketEvent = {
          type: 'connected',
          eventId: uuidv4(),
          userId,
          sessionId: connectionId,
          timestamp: new Date(),
          payload: {
            connectionId,
            userId,
            sessionId: connectionId,
            serverTime: new Date(),
            capabilities: ['sse', 'presence', 'interventions'],
          },
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`)
        );

        // Register presence
        try {
          const userAgent = request.headers.get('user-agent') ?? '';
          // Detect device type from user-agent
          const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
          const isTablet = /tablet|ipad/i.test(userAgent);
          const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

          await realtimeServer.handleConnection(
            connectionId,
            userId,
            null, // No actual socket for SSE
            {
              deviceType,
              browser: userAgent.split('/')[0] ?? 'Unknown',
            }
          );
        } catch (error) {
          logger.warn('[SAM_REALTIME_SSE] Failed to register presence', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown',
          });
        }

        // Subscribe to user-targeted events (interventions, check-ins, etc.)
        const unsubscribeUserEvents = realtimeServer.onUserEvent(userId, (event) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch {
            logger.debug('[SAM_REALTIME_SSE] Stream closed during user event enqueue', { connectionId });
          }
        });

        // Subscribe to presence changes for this user
        const unsubscribePresence = realtimeServer.onPresenceChange(async (change) => {
          if (change.userId === userId) {
            const presenceEvent: SAMWebSocketEvent = {
              type: 'presence_update',
              eventId: uuidv4(),
              userId,
              sessionId: connectionId,
              timestamp: new Date(),
              payload: {
                userId: change.userId,
                status: change.newStatus,
                lastActivityAt: change.changedAt,
              },
            };

            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(presenceEvent)}\n\n`)
              );
            } catch {
              logger.debug('[SAM_REALTIME_SSE] Stream closed during presence event enqueue', { connectionId });
            }
          }
        });

        // Heartbeat interval to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = {
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
            );
          } catch {
            // Stream closed, cleanup will happen
            clearInterval(heartbeatInterval);
          }
        }, 30000); // 30 seconds

        // Handle stream close
        request.signal.addEventListener('abort', async () => {
          clearInterval(heartbeatInterval);
          unsubscribeUserEvents();
          unsubscribePresence();

          try {
            await realtimeServer.handleDisconnection(connectionId, 'client_disconnect');
          } catch (error) {
            logger.warn('[SAM_REALTIME_SSE] Error during disconnection', {
              connectionId,
              error: error instanceof Error ? error.message : 'Unknown',
            });
          }

          logger.info('[SAM_REALTIME_SSE] Connection closed', { userId, connectionId });
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    logger.error('[SAM_REALTIME_SSE] Error establishing connection', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Disable body parsing for SSE
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
