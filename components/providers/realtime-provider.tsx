'use client';

/**
 * Real-time WebSocket Provider for SAM AI Interventions
 * Manages WebSocket connection for authenticated users and delivers
 * real-time interventions, nudges, and notifications.
 *
 * WebSocket Server Configuration:
 * - The WebSocket server runs separately from Next.js on port 3001 (default)
 * - Start the socket server with: `npm run socket:dev`
 * - Set NEXT_PUBLIC_WS_URL to the full WebSocket URL (e.g., ws://localhost:3001/ws/sam)
 * - The socket server listens on /ws/sam path
 *
 * Environment Variables:
 * - NEXT_PUBLIC_WS_URL: Full WebSocket URL (e.g., ws://localhost:3001/ws/sam)
 * - SOCKET_PORT: Port for socket server (default: 3001)
 * - SAM_WEBSOCKET_ENABLED: Enable WebSocket feature flag
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { useInterventionContextOptional } from '@/components/sam/interventions';
import type {
  InterventionPayload,
  InterventionType,
} from '@/components/sam/interventions/types';

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export interface ConnectionStats {
  connectionId: string;
  connectedAt: Date | null;
  lastHeartbeatAt: Date | null;
  messagesSent: number;
  messagesReceived: number;
  reconnectCount: number;
  latencyMs: number;
}

export interface RealtimeContextValue {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Whether connected to WebSocket */
  isConnected: boolean;
  /** Connection statistics */
  stats: ConnectionStats;
  /** Last connection error */
  error: Error | null;
  /** Manually connect (normally auto-connects when authenticated) */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Send a custom event through WebSocket */
  sendEvent: (type: string, payload: unknown) => void;
  /** Send user activity */
  sendActivity: (activityType: string, data?: Record<string, unknown>) => void;
}

export interface RealtimeProviderProps {
  children: React.ReactNode;
  /** Custom WebSocket URL (defaults to NEXT_PUBLIC_WS_URL or /api/sam/ws) */
  wsUrl?: string;
  /** Enable auto-connect when authenticated (default: true) */
  autoConnect?: boolean;
  /** Reconnection settings */
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    baseDelay?: number;
  };
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Connection timeout in ms (default: 10000) */
  connectionTimeout?: number;
  /** Event handlers */
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

interface WSEvent {
  type: string;
  eventId?: string;
  payload?: unknown;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

interface InterventionWSPayload {
  type: InterventionType;
  title: string;
  message: string;
  surface?: 'banner' | 'toast' | 'modal' | 'inline';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  theme?: 'default' | 'success' | 'warning' | 'celebration' | 'info';
  icon?: string;
  actions?: Array<{
    id: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    href?: string;
  }>;
  metadata?: Record<string, unknown>;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  requireInteraction?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useRealtimeContext(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not inside RealtimeProvider
 * Useful for components that may or may not be in a realtime context
 */
export function useRealtimeContextOptional(): RealtimeContextValue | null {
  return useContext(RealtimeContext);
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_RECONNECT_CONFIG = {
  enabled: true,
  maxAttempts: 5,
  baseDelay: 1000,
};

const DEFAULT_HEARTBEAT_INTERVAL = 30000;
const DEFAULT_CONNECTION_TIMEOUT = 10000;

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export function RealtimeProvider({
  children,
  wsUrl,
  autoConnect = true,
  reconnect = DEFAULT_RECONNECT_CONFIG,
  heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
  connectionTimeout = DEFAULT_CONNECTION_TIMEOUT,
  onConnect,
  onDisconnect,
  onError,
}: RealtimeProviderProps) {
  // Get auth session
  const { data: session, status: authStatus } = useSession();

  // Get intervention context (may be null if InterventionProvider is not wrapped)
  // Using the optional version that returns null instead of throwing
  const interventionContext = useInterventionContextOptional();

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<ConnectionStats>({
    connectionId: '',
    connectedAt: null,
    lastHeartbeatAt: null,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0,
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef(stats);

  // Keep stats ref in sync
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Get the WebSocket URL
  const getWsUrl = useCallback((): string => {
    // Use provided URL, env variable, or construct default pointing to socket server
    // The socket server runs on port 3001 by default and listens on /ws/sam
    const baseUrl = wsUrl
      || process.env.NEXT_PUBLIC_WS_URL
      || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001/ws/sam`;

    const url = new URL(baseUrl);

    // Add auth params if available
    if (session?.user?.id) {
      url.searchParams.set('userId', session.user.id);
    }

    return url.toString();
  }, [wsUrl, session?.user?.id]);

  // Generate unique event ID
  const generateEventId = useCallback(() => {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Handle incoming WebSocket message
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WSEvent;

      // Update stats
      setStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastHeartbeatAt: new Date(),
      }));

      // Handle different event types
      switch (data.type) {
        case 'connected':
          // Connection confirmed by server
          if (data.payload && typeof data.payload === 'object' && 'connectionId' in data.payload) {
            setStats(prev => ({
              ...prev,
              connectionId: (data.payload as { connectionId: string }).connectionId,
            }));
          }
          break;

        case 'heartbeat':
          // Server heartbeat response - update latency if available
          if (data.payload && typeof data.payload === 'object' && 'latencyMs' in data.payload) {
            setStats(prev => ({
              ...prev,
              latencyMs: (data.payload as { latencyMs: number }).latencyMs,
            }));
          }
          break;

        case 'nudge':
        case 'celebration':
        case 'recommendation':
        case 'goal_progress':
        case 'step_completed':
        case 'checkin':
        case 'intervention':
        case 'streak_alert':
        case 'break_suggestion':
          // Handle intervention events
          if (interventionContext && data.payload) {
            const payload = data.payload as InterventionWSPayload;
            const interventionPayload: InterventionPayload = {
              type: payload.type || (data.type as InterventionType),
              title: payload.title,
              message: payload.message,
              surface: payload.surface,
              priority: payload.priority,
              theme: payload.theme,
              icon: payload.icon,
              actions: payload.actions,
              metadata: payload.metadata,
              autoDismiss: payload.autoDismiss,
              autoDismissDelay: payload.autoDismissDelay,
              requireInteraction: payload.requireInteraction,
            };
            interventionContext.showIntervention(interventionPayload, data.eventId);
          }
          break;

        case 'error':
          // Server-side error
          const errorMessage = data.payload && typeof data.payload === 'object' && 'message' in data.payload
            ? (data.payload as { message: string }).message
            : 'Unknown server error';
          console.error('[RealtimeProvider] Server error:', errorMessage);
          break;

        default:
          // Unknown event type - log for debugging
          console.debug('[RealtimeProvider] Unhandled event type:', data.type);
      }
    } catch (parseError) {
      console.error('[RealtimeProvider] Failed to parse message:', parseError);
    }
  }, [interventionContext]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WSEvent = {
        type: 'heartbeat',
        eventId: generateEventId(),
        payload: {
          status: 'alive',
          timestamp: new Date().toISOString(),
          connectionId: statsRef.current.connectionId,
        },
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
      setStats(prev => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
      }));
    }
  }, [generateEventId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Do not connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Do not connect if not authenticated
    if (authStatus !== 'authenticated' || !session?.user?.id) {
      console.debug('[RealtimeProvider] Not connecting - user not authenticated');
      return;
    }

    // Check if WebSocket is configured (skip if using fallback URL which likely doesn't exist)
    const hasConfiguredWsUrl = Boolean(process.env.NEXT_PUBLIC_WS_URL);
    if (!hasConfiguredWsUrl) {
      console.debug('[RealtimeProvider] WebSocket URL not configured - skipping real-time connection');
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const url = getWsUrl();
      console.debug('[RealtimeProvider] Connecting to:', url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setError(new Error('Connection timeout'));
          setConnectionState('failed');
          onError?.(new Error('Connection timeout'));
        }
      }, connectionTimeout);

      ws.onopen = () => {
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        setStats(prev => ({
          ...prev,
          connectionId: generateEventId(),
          connectedAt: new Date(),
          lastHeartbeatAt: new Date(),
        }));

        // Start heartbeat interval
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);

        // Notify callback
        onConnect?.();

        console.debug('[RealtimeProvider] Connected successfully');
      };

      ws.onclose = (event) => {
        clearTimers();
        setConnectionState('disconnected');

        const reason = event.reason || `Code: ${event.code}`;
        console.debug('[RealtimeProvider] Disconnected:', reason);

        onDisconnect?.(reason);

        // Attempt reconnection if enabled and not a clean close
        if (
          reconnect?.enabled !== false &&
          event.code !== 1000 && // Normal closure
          event.code !== 1001 && // Going away
          reconnectAttemptsRef.current < (reconnect?.maxAttempts ?? DEFAULT_RECONNECT_CONFIG.maxAttempts)
        ) {
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;

          setStats(prev => ({
            ...prev,
            reconnectCount: prev.reconnectCount + 1,
          }));

          // Exponential backoff
          const baseDelay = reconnect?.baseDelay ?? DEFAULT_RECONNECT_CONFIG.baseDelay;
          const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000 // Cap at 30 seconds
          );

          console.debug(`[RealtimeProvider] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // WebSocket errors are expected when server isn't running - use debug level
        const err = new Error('WebSocket connection error');
        setError(err);
        onError?.(err);
        console.debug('[RealtimeProvider] Connection error (WebSocket server may not be running)');
      };

      ws.onmessage = handleMessage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error);
      setConnectionState('failed');
      onError?.(error);
      // Use debug level - connection failures are expected when server isn't available
      console.debug('[RealtimeProvider] Failed to create connection:', error.message);
    }
  }, [
    authStatus,
    session?.user?.id,
    getWsUrl,
    connectionTimeout,
    heartbeatInterval,
    reconnect,
    generateEventId,
    sendHeartbeat,
    handleMessage,
    clearTimers,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;

    console.debug('[RealtimeProvider] Disconnected by user');
  }, [clearTimers]);

  // Send event through WebSocket
  const sendEvent = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[RealtimeProvider] Cannot send event - not connected');
      return;
    }

    const message: WSEvent = {
      type,
      eventId: generateEventId(),
      payload,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id,
    };

    wsRef.current.send(JSON.stringify(message));

    setStats(prev => ({
      ...prev,
      messagesSent: prev.messagesSent + 1,
    }));
  }, [generateEventId, session?.user?.id]);

  // Send activity event
  const sendActivity = useCallback((activityType: string, data?: Record<string, unknown>) => {
    sendEvent('activity', {
      type: activityType,
      data,
      pageContext: typeof window !== 'undefined' ? {
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
      } : undefined,
    });
  }, [sendEvent]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && authStatus === 'authenticated' && session?.user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only connect on auth change
  }, [autoConnect, authStatus, session?.user?.id]);

  // Disconnect when user logs out
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      disconnect();
    }
  }, [authStatus, disconnect]);

  // Context value
  const contextValue = useMemo<RealtimeContextValue>(() => ({
    connectionState,
    isConnected: connectionState === 'connected',
    stats,
    error,
    connect,
    disconnect,
    sendEvent,
    sendActivity,
  }), [
    connectionState,
    stats,
    error,
    connect,
    disconnect,
    sendEvent,
    sendActivity,
  ]);

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export default RealtimeProvider;
