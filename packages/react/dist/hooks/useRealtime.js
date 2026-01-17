/**
 * @sam-ai/react - useRealtime Hook
 * React hook for real-time WebSocket communication with SAM AI
 */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
const DEFAULT_OPTIONS = {
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
export function useRealtime(options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    // State
    const [connectionState, setConnectionState] = useState('disconnected');
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    // Refs
    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const subscribersRef = useRef(new Map());
    const statsRef = useRef({
        connectionId: '',
        connectedAt: new Date(),
        lastHeartbeatAt: new Date(),
        messagesSent: 0,
        messagesReceived: 0,
        reconnectCount: 0,
        latencyMs: 0,
    });
    // Generate unique IDs
    const generateEventId = useCallback(() => {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }, []);
    // Notify subscribers
    const notifySubscribers = useCallback((event) => {
        const subscribers = subscribersRef.current.get(event.type);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(event);
                }
                catch (e) {
                    console.error('[useRealtime] Subscriber error:', e);
                }
            });
        }
    }, []);
    // Send message through WebSocket
    const sendMessage = useCallback((message) => {
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
                    sendHeartbeat();
                }, opts.heartbeatInterval);
            };
            ws.onclose = (event) => {
                setConnectionState('disconnected');
                // Clear heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }
                // Notify callback
                opts.onDisconnect?.(event.reason || 'Connection closed');
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
                opts.onError?.(err);
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    statsRef.current.messagesReceived++;
                    statsRef.current.lastHeartbeatAt = new Date();
                    setStats({ ...statsRef.current });
                    // Handle connected event
                    if (data.type === 'connected') {
                        statsRef.current.connectionId = data.payload.connectionId;
                        opts.onConnect?.(data);
                    }
                    // Notify general message handler
                    opts.onMessage?.(data);
                    // Notify type-specific subscribers
                    notifySubscribers(data);
                }
                catch (e) {
                    console.error('[useRealtime] Failed to parse message:', e);
                }
            };
        }
        catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to connect'));
            setConnectionState('failed');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sendHeartbeat is defined after connect
    }, [opts, generateEventId, notifySubscribers]);
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
    // Send event
    const send = useCallback((type, payload) => {
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
    const subscribe = useCallback((eventType, callback) => {
        if (!subscribersRef.current.has(eventType)) {
            subscribersRef.current.set(eventType, new Set());
        }
        subscribersRef.current.get(eventType).add(callback);
        // Return unsubscribe function
        return () => {
            subscribersRef.current.get(eventType)?.delete(callback);
        };
    }, []);
    // Send activity
    const sendActivity = useCallback((activity) => {
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
    // Acknowledge event
    const acknowledge = useCallback((eventId, action) => {
        send('acknowledge', {
            eventId,
            received: true,
            action,
        });
    }, [send]);
    // Dismiss event
    const dismiss = useCallback((eventId, reason) => {
        send('dismiss', {
            eventId,
            reason: reason || 'user_action',
        });
    }, [send]);
    // Auto-connect on mount
    useEffect(() => {
        if (opts.autoConnect) {
            connect();
        }
        return () => {
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Only depend on autoConnect to avoid reconnection loops
    }, [opts.autoConnect]);
    // Update connection when auth changes
    useEffect(() => {
        if (connectionState === 'connected' && (opts.authToken || opts.userId)) {
            // Reconnect with new auth
            disconnect();
            connect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on auth changes, not connection state
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
