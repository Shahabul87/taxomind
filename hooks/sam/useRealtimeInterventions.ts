'use client';

/**
 * useRealtimeInterventions Hook
 *
 * Connects to the SAM SSE endpoint for real-time intervention delivery.
 * Provides auto-reconnect with exponential backoff, event parsing,
 * and connection status tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface RealtimeIntervention {
  id: string;
  type: 'intervention' | 'check-in' | 'suggestion' | 'presence_update';
  priority: string;
  message: string;
  suggestedActions: string[];
  timestamp: Date;
  dismissed: boolean;
}

interface SSEEvent {
  type: string;
  eventId?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

interface UseRealtimeInterventionsOptions {
  enabled?: boolean;
  maxReconnectAttempts?: number;
}

interface UseRealtimeInterventionsReturn {
  interventions: RealtimeIntervention[];
  connectionStatus: ConnectionStatus;
  dismiss: (interventionId: string) => void;
  clearAll: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SSE_ENDPOINT = '/api/sam/realtime/events';
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

// =============================================================================
// HOOK
// =============================================================================

export function useRealtimeInterventions(
  options: UseRealtimeInterventionsOptions = {}
): UseRealtimeInterventionsReturn {
  const { enabled = true, maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS } = options;

  const [interventions, setInterventions] = useState<RealtimeIntervention[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Parse an SSE event into a RealtimeIntervention
   */
  const parseEvent = useCallback((event: SSEEvent): RealtimeIntervention | null => {
    if (event.type === 'heartbeat' || event.type === 'connected') {
      return null;
    }

    const payload = event.payload ?? {};

    return {
      id: event.eventId ?? `evt-${Date.now()}`,
      type: event.type as RealtimeIntervention['type'],
      priority: (payload.priority as string) ?? 'medium',
      message: (payload.message as string) ?? (payload.content as string) ?? '',
      suggestedActions: (payload.suggestedActions as string[]) ?? [],
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      dismissed: false,
    };
  }, []);

  /**
   * Connect to the SSE endpoint
   */
  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

    const eventSource = new EventSource(SSE_ENDPOINT);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        const intervention = parseEvent(data);

        if (intervention && intervention.message) {
          setInterventions((prev) => {
            // Deduplicate by id
            if (prev.some((i) => i.id === intervention.id)) return prev;
            // Keep last 20 interventions
            const updated = [...prev, intervention];
            return updated.slice(-20);
          });
        }
      } catch {
        console.warn('[SAM_REALTIME] Malformed SSE event', event.data?.slice?.(0, 100));
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      setConnectionStatus('disconnected');

      // Exponential backoff reconnect
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        const baseDelay = Math.min(
          BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
          MAX_RECONNECT_DELAY
        );
        // Add jitter (±30%) to prevent thundering herd on recovery
        const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1);
        const delay = Math.max(0, baseDelay + jitter);
        reconnectAttemptRef.current++;

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [enabled, maxReconnectAttempts, parseEvent]);

  /**
   * Dismiss an intervention
   */
  const dismiss = useCallback((interventionId: string) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === interventionId ? { ...i, dismissed: true } : i))
    );
  }, []);

  /**
   * Clear all interventions
   */
  const clearAll = useCallback(() => {
    setInterventions([]);
  }, []);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [enabled, connect]);

  // Filter out dismissed interventions for the return value
  const activeInterventions = interventions.filter((i) => !i.dismissed);

  return {
    interventions: activeInterventions,
    connectionStatus,
    dismiss,
    clearAll,
  };
}
