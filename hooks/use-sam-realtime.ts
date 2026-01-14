'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  getSAMRealtimeClient,
  isWebSocketEnabled,
  type SAMWebSocketEvent,
  type InterventionUIState,
  type InterventionQueue,
  type UserPresence,
} from '@/lib/sam/realtime/client';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SAMRealtimeState {
  /** Whether connected to realtime server (WebSocket or SSE) */
  isConnected: boolean;
  /** Connection method being used */
  connectionType: 'websocket' | 'sse' | 'none';
  /** Current user presence status */
  presence: UserPresence | null;
  /** Active intervention queue */
  interventionQueue: InterventionQueue | null;
  /** Currently visible interventions */
  visibleInterventions: InterventionUIState[];
  /** Any connection error */
  error: Error | null;
  /** Whether currently attempting to connect */
  isConnecting: boolean;
}

export type ActivityType = 'interaction' | 'page_view' | 'focus' | 'blur' | 'scroll' | 'typing';

export interface SAMRealtimeActions {
  /** Dismiss an intervention */
  dismissIntervention: (interventionId: string, reason?: string) => void;
  /** Track user activity */
  trackActivity: (activity: {
    type: ActivityType;
    data?: Record<string, unknown>;
  }) => void;
  /** Manually reconnect */
  reconnect: () => Promise<void>;
  /** Subscribe to specific event types */
  onEvent: (
    eventType: string,
    handler: (event: SAMWebSocketEvent) => void
  ) => () => void;
}

export interface UseSAMRealtimeReturn extends SAMRealtimeState, SAMRealtimeActions {}

// ============================================================================
// HOOK
// ============================================================================

/**
 * React hook for SAM realtime features (WebSocket with SSE fallback)
 *
 * Features:
 * - Automatic WebSocket connection when available
 * - Fallback to Server-Sent Events when WebSocket unavailable
 * - Intervention queue management
 * - Presence tracking
 * - Activity tracking
 *
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   connectionType,
 *   visibleInterventions,
 *   dismissIntervention,
 *   onEvent,
 * } = useSAMRealtime();
 * ```
 */
export function useSAMRealtime(): UseSAMRealtimeReturn {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // State
  const [state, setState] = useState<SAMRealtimeState>({
    isConnected: false,
    connectionType: 'none',
    presence: null,
    interventionQueue: null,
    visibleInterventions: [],
    error: null,
    isConnecting: false,
  });

  // Refs for stable callbacks
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(event: SAMWebSocketEvent) => void>>>(
    new Map()
  );
  const isConnectedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // WebSocket Connection
  // ---------------------------------------------------------------------------

  const connectWebSocket = useCallback(async (uid: string): Promise<boolean> => {
    if (!isWebSocketEnabled()) {
      return false;
    }

    try {
      const client = getSAMRealtimeClient();
      await client.connect(uid);

      // Subscribe to queue changes
      client.onQueueChange((queue) => {
        setState((prev) => ({
          ...prev,
          interventionQueue: queue,
          visibleInterventions: client.getVisibleInterventions(),
        }));
      });

      // Subscribe to presence changes
      client.onPresenceChange((presence) => {
        setState((prev) => ({
          ...prev,
          presence,
        }));
      });

      setState((prev) => ({
        ...prev,
        isConnected: true,
        connectionType: 'websocket',
        error: null,
        isConnecting: false,
      }));

      isConnectedRef.current = true;
      logger.info('[SAM_REALTIME_HOOK] WebSocket connected');
      return true;
    } catch (error) {
      logger.debug('[SAM_REALTIME_HOOK] WebSocket connection failed, will try SSE', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // SSE Fallback Connection
  // ---------------------------------------------------------------------------

  const connectSSE = useCallback((uid: string): void => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const eventSource = new EventSource('/api/sam/realtime/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionType: 'sse',
          error: null,
          isConnecting: false,
        }));
        isConnectedRef.current = true;
        logger.info('[SAM_REALTIME_HOOK] SSE connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SAMWebSocketEvent;

          // Skip heartbeats
          if (data.type === 'heartbeat') {
            return;
          }

          // Handle presence updates
          if (data.type === 'presence_update') {
            setState((prev) => ({
              ...prev,
              presence: data.payload as UserPresence,
            }));
          }

          // Dispatch to event handlers
          const handlers = eventHandlersRef.current.get(data.type);
          if (handlers) {
            handlers.forEach((handler) => handler(data));
          }

          // Also dispatch to wildcard handlers
          const wildcardHandlers = eventHandlersRef.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(data));
          }
        } catch (parseError) {
          logger.warn('[SAM_REALTIME_HOOK] Failed to parse SSE event', {
            error: parseError instanceof Error ? parseError.message : 'Unknown',
          });
        }
      };

      eventSource.onerror = () => {
        // SSE will auto-reconnect, but we track the error state
        if (eventSource.readyState === EventSource.CLOSED) {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            connectionType: 'none',
            error: new Error('SSE connection closed'),
          }));
          isConnectedRef.current = false;
        }
      };
    } catch (error) {
      logger.error('[SAM_REALTIME_HOOK] Failed to establish SSE connection', {
        error: error instanceof Error ? error.message : 'Unknown',
      });

      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectionType: 'none',
        error: error instanceof Error ? error : new Error('SSE connection failed'),
        isConnecting: false,
      }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  const connect = useCallback(async () => {
    if (!userId || isConnectedRef.current) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    // Try WebSocket first
    const wsConnected = await connectWebSocket(userId);
    if (wsConnected) {
      return;
    }

    // Fall back to SSE
    connectSSE(userId);
  }, [userId, connectWebSocket, connectSSE]);

  const reconnect = useCallback(async () => {
    // Disconnect first
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (isWebSocketEnabled()) {
      const client = getSAMRealtimeClient();
      client.disconnect();
    }

    isConnectedRef.current = false;
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionType: 'none',
    }));

    // Reconnect
    await connect();
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Event Management
  // ---------------------------------------------------------------------------

  const onEvent = useCallback(
    (
      eventType: string,
      handler: (event: SAMWebSocketEvent) => void
    ): (() => void) => {
      if (!eventHandlersRef.current.has(eventType)) {
        eventHandlersRef.current.set(eventType, new Set());
      }

      eventHandlersRef.current.get(eventType)!.add(handler);

      // If using WebSocket, also subscribe there
      if (state.connectionType === 'websocket' && isWebSocketEnabled()) {
        const client = getSAMRealtimeClient();
        const unsubscribe = client.on(eventType, handler);

        return () => {
          eventHandlersRef.current.get(eventType)?.delete(handler);
          unsubscribe();
        };
      }

      return () => {
        eventHandlersRef.current.get(eventType)?.delete(handler);
      };
    },
    [state.connectionType]
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const dismissIntervention = useCallback(
    (interventionId: string, reason?: string) => {
      if (state.connectionType === 'websocket' && isWebSocketEnabled()) {
        const client = getSAMRealtimeClient();
        client.dismissIntervention(interventionId, reason);
      } else {
        // For SSE, make a REST call to dismiss
        fetch(`/api/sam/agentic/behavior/interventions/${interventionId}/dismiss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: reason }),
        }).catch((error) => {
          logger.error('[SAM_REALTIME_HOOK] Failed to dismiss intervention', {
            interventionId,
            error: error instanceof Error ? error.message : 'Unknown',
          });
        });
      }
    },
    [state.connectionType]
  );

  const trackActivity = useCallback(
    (activity: { type: ActivityType; data?: Record<string, unknown> }) => {
      if (state.connectionType === 'websocket' && isWebSocketEnabled()) {
        const client = getSAMRealtimeClient();
        client.trackActivity({
          type: activity.type,
          data: activity.data ?? {},
        });
      }
      // SSE is receive-only, activity tracking would require separate REST call
    },
    [state.connectionType]
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Connect when user is authenticated
  useEffect(() => {
    if (status === 'loading' || !userId) {
      return;
    }

    connect();

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (isWebSocketEnabled()) {
        try {
          const client = getSAMRealtimeClient();
          client.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }

      isConnectedRef.current = false;
    };
  }, [status, userId, connect]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    ...state,
    dismissIntervention,
    trackActivity,
    reconnect,
    onEvent,
  };
}

/**
 * Lightweight hook that just checks if realtime is available
 * Use this when you only need to know if realtime features are supported
 */
export function useSAMRealtimeAvailable(): {
  isAvailable: boolean;
  preferredMethod: 'websocket' | 'sse' | 'none';
} {
  const [isAvailable, setIsAvailable] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<'websocket' | 'sse' | 'none'>('none');

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // WebSocket is preferred if available
    if (isWebSocketEnabled()) {
      setIsAvailable(true);
      setPreferredMethod('websocket');
      return;
    }

    // SSE is always available in modern browsers
    if (typeof EventSource !== 'undefined') {
      setIsAvailable(true);
      setPreferredMethod('sse');
      return;
    }

    setIsAvailable(false);
    setPreferredMethod('none');
  }, []);

  return { isAvailable, preferredMethod };
}

export default useSAMRealtime;
