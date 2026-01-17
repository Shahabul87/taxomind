/**
 * @sam-ai/react - useRealtime Hook
 * React hook for real-time WebSocket communication with SAM AI
 */
import type { ConnectionState, ConnectionStats, SAMWebSocketEvent, SAMEventType, ActivityPayload } from '@sam-ai/agentic';
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
export declare function useRealtime(options?: UseRealtimeOptions): UseRealtimeReturn;
export default useRealtime;
//# sourceMappingURL=useRealtime.d.ts.map