/**
 * @sam-ai/react - useRealtime Hook
 * React hook for real-time WebSocket communication with SAM AI
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  ConnectionState,
  ConnectionStats,
  SAMWebSocketEvent,
  SAMEventType,
  ActivityPayload,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface UseRealtimeOptions {
  /** WebSocket URL (defaults to /api/sam/ws) */
  url?: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Auth token for connection */
  authToken?: string;
  /** User ID for presence */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Reconnection settings */
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    delay?: number;
  };
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Event handlers */
  onConnect?: (event: SAMWebSocketEvent) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (event: SAMWebSocketEvent) => void;
}

export interface UseRealtimeReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Whether connected */
  isConnected: boolean;
  /** Connection statistics */
  stats: ConnectionStats | null;
  /** Last error */
  error: Error | null;
  /** Connect to WebSocket */
  connect: () => void;
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** Send an event */
  send: <T extends SAMEventType>(type: T, payload: unknown) => void;
  /** Subscribe to event type */
  subscribe: (eventType: SAMEventType, callback: (event: SAMWebSocketEvent) => void) => () => void;
  /** Send activity event */
  sendActivity: (activity: ActivityPayload) => void;
  /** Send heartbeat */
  sendHeartbeat: () => void;
  /** Acknowledge event */
  acknowledge: (eventId: string, action?: 'viewed' | 'clicked' | 'dismissed') => void;
  /** Dismiss event */
  dismiss: (eventId: string, reason?: string) => void;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<UseRealtimeOptions, 'authToken' | 'userId' | 'sessionId' | 'onConnect' | 'onDisconnect' | 'onError' | 'onMessage'>> = {
  url: '/api/sam/ws',
  autoConnect: true,
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000,
  },
  heartbeatInterval: 30000,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  // Destructure primitives for stable useMemo deps; store callbacks in refs
  const { url, autoConnect, authToken, userId, sessionId, reconnect, heartbeatInterval } = options;
  const onConnectRef = useRef(options.onConnect);
  onConnectRef.current = options.onConnect;
  const onDisconnectRef = useRef(options.onDisconnect);
  onDisconnectRef.current = options.onDisconnect;
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;

  const reconnectEnabled = reconnect?.enabled;
  const reconnectMaxAttempts = reconnect?.maxAttempts;
  const reconnectDelay = reconnect?.delay;

  const opts = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    url: url ?? DEFAULT_OPTIONS.url,
    autoConnect: autoConnect ?? DEFAULT_OPTIONS.autoConnect,
    authToken,
    userId,
    sessionId,
    reconnect: {
      ...DEFAULT_OPTIONS.reconnect,
      enabled: reconnectEnabled ?? DEFAULT_OPTIONS.reconnect.enabled,
      maxAttempts: reconnectMaxAttempts ?? DEFAULT_OPTIONS.reconnect.maxAttempts,
      delay: reconnectDelay ?? DEFAULT_OPTIONS.reconnect.delay,
    },
    heartbeatInterval: heartbeatInterval ?? DEFAULT_OPTIONS.heartbeatInterval,
    onConnect: onConnectRef.current,
    onDisconnect: onDisconnectRef.current,
    onError: onErrorRef.current,
    onMessage: onMessageRef.current,
  }), [url, autoConnect, authToken, userId, sessionId, reconnectEnabled, reconnectMaxAttempts, reconnectDelay, heartbeatInterval]);

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<SAMEventType, Set<(event: SAMWebSocketEvent) => void>>>(new Map());
  const statsRef = useRef<ConnectionStats>({
    connectionId: '',
    connectedAt: new Date(),
    lastHeartbeatAt: new Date(),
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0,
  });

  // Refs for stable access to callbacks and state inside effects.
  // These break circular dependencies and prevent reconnection loops.
  const sendHeartbeatRef = useRef<() => void>(() => {});
  const connectRef = useRef<() => void>(() => {});
  const disconnectRef = useRef<() => void>(() => {});
  const connectionStateRef = useRef<ConnectionState>(connectionState);
  connectionStateRef.current = connectionState;

  // Generate unique IDs
  const generateEventId = useCallback(() => {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Notify subscribers
  const notifySubscribers = useCallback((event: SAMWebSocketEvent) => {
    const subscribers = subscribersRef.current.get(event.type as SAMEventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (e) {
          console.error('[useRealtime] Subscriber error:', e);
        }
      });
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      statsRef.current.messagesSent++;
      setStats({ ...statsRef.current });
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionState('connecting');
    setError(null);

    try {
      // Build WebSocket URL with auth
      const wsUrl = new URL(opts.url, window.location.origin);
      wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');

      if (opts.authToken) {
        wsUrl.searchParams.set('token', opts.authToken);
      }
      if (opts.userId) {
        wsUrl.searchParams.set('userId', opts.userId);
      }
      if (opts.sessionId) {
        wsUrl.searchParams.set('sessionId', opts.sessionId);
      }

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        statsRef.current = {
          ...statsRef.current,
          connectionId: generateEventId(),
          connectedAt: new Date(),
        };
        setStats({ ...statsRef.current });

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          sendHeartbeatRef.current();
        }, opts.heartbeatInterval);
      };

      ws.onclose = (event) => {
        setConnectionState('disconnected');

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Notify callback via ref (latest value)
        onDisconnectRef.current?.(event.reason || 'Connection closed');

        // Attempt reconnection
        if (opts.reconnect?.enabled && reconnectAttemptsRef.current < (opts.reconnect?.maxAttempts || 5)) {
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;
          statsRef.current.reconnectCount++;

          const delay = (opts.reconnect?.delay || 1000) * Math.pow(2, reconnectAttemptsRef.current - 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(delay, 30000)); // Cap at 30 seconds
        }
      };

      ws.onerror = () => {
        const err = new Error('WebSocket error');
        setError(err);
        onErrorRef.current?.(err);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SAMWebSocketEvent;
          statsRef.current.messagesReceived++;
          statsRef.current.lastHeartbeatAt = new Date();
          setStats({ ...statsRef.current });

          // Handle connected event
          if (data.type === 'connected') {
            statsRef.current.connectionId = (data.payload as { connectionId: string }).connectionId;
            onConnectRef.current?.(data);
          }

          // Notify general message handler
          onMessageRef.current?.(data);

          // Notify type-specific subscribers
          notifySubscribers(data);
        } catch (e) {
          console.error('[useRealtime] Failed to parse message:', e);
        }
      };
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to connect'));
      setConnectionState('failed');
    }
  }, [opts, generateEventId, notifySubscribers]);
  connectRef.current = connect;

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);
  disconnectRef.current = disconnect;

  // Send event
  const send = useCallback(<T extends SAMEventType>(type: T, payload: unknown) => {
    sendMessage({
      type,
      payload,
      timestamp: new Date().toISOString(),
      eventId: generateEventId(),
      userId: opts.userId,
      sessionId: opts.sessionId,
    });
  }, [sendMessage, generateEventId, opts.userId, opts.sessionId]);

  // Subscribe to event type
  const subscribe = useCallback((eventType: SAMEventType, callback: (event: SAMWebSocketEvent) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);

  // Send activity
  const sendActivity = useCallback((activity: ActivityPayload) => {
    send('activity', activity);
  }, [send]);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    send('heartbeat', {
      status: 'alive',
      timestamp: new Date().toISOString(),
      connectionId: statsRef.current.connectionId,
    });
  }, [send]);
  sendHeartbeatRef.current = sendHeartbeat;

  // Acknowledge event
  const acknowledge = useCallback((eventId: string, action?: 'viewed' | 'clicked' | 'dismissed') => {
    send('acknowledge', {
      eventId,
      received: true,
      action,
    });
  }, [send]);

  // Dismiss event
  const dismiss = useCallback((eventId: string, reason?: string) => {
    send('dismiss', {
      eventId,
      reason: reason || 'user_action',
    });
  }, [send]);

  // Auto-connect on mount.
  // Uses refs to avoid reconnection loops when connect/disconnect change identity.
  useEffect(() => {
    if (opts.autoConnect) {
      connectRef.current();
    }

    return () => {
      disconnectRef.current();
    };
  }, [opts.autoConnect]);

  // Update connection when auth changes.
  // Uses refs so this effect only fires when authToken or userId change,
  // not when connect/disconnect/connectionState change identity.
  useEffect(() => {
    if (connectionStateRef.current === 'connected' && (opts.authToken || opts.userId)) {
      // Reconnect with new auth
      disconnectRef.current();
      connectRef.current();
    }
  }, [opts.authToken, opts.userId]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    stats,
    error,
    connect,
    disconnect,
    send,
    subscribe,
    sendActivity,
    sendHeartbeat,
    acknowledge,
    dismiss,
  };
}

export default useRealtime;
