/**
 * @sam-ai/agentic - WebSocket Connection Manager
 * Portable WebSocket abstraction for real-time SAM communication
 */
import type { ConnectionConfig, ConnectionState, ConnectionStats, SAMWebSocketEvent, WebSocketConnectionHandler, PresenceMetadata, RealtimeLogger, SAMEventType } from './types';
export type MessageHandler = (event: SAMWebSocketEvent) => void;
export type ConnectionHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Error) => void;
export interface WebSocketManagerInterface {
    /** Connect to WebSocket server */
    connect(userId: string, metadata?: PresenceMetadata): Promise<void>;
    /** Disconnect from server */
    disconnect(): void;
    /** Send event to server */
    send(event: SAMWebSocketEvent): Promise<void>;
    /** Subscribe to specific event types */
    on(eventType: SAMEventType, handler: MessageHandler): () => void;
    /** Subscribe to connection state changes */
    onConnectionChange(handler: ConnectionHandler): () => void;
    /** Subscribe to errors */
    onError(handler: ErrorHandler): () => void;
    /** Get current connection state */
    getState(): ConnectionState;
    /** Get connection statistics */
    getStats(): ConnectionStats;
    /** Check if connected */
    isConnected(): boolean;
}
/**
 * Client-side WebSocket manager for browser environments
 * This is the main class for UI integration
 */
export declare class ClientWebSocketManager implements WebSocketManagerInterface {
    private readonly config;
    private readonly logger;
    private socket;
    private state;
    private connectionId;
    private userId;
    private metadata;
    private reconnectAttempts;
    private reconnectTimeout?;
    private heartbeatInterval?;
    private readonly eventHandlers;
    private readonly connectionHandlers;
    private readonly errorHandlers;
    private stats;
    constructor(options?: {
        config?: Partial<ConnectionConfig>;
        logger?: RealtimeLogger;
    });
    connect(userId: string, metadata?: PresenceMetadata): Promise<void>;
    disconnect(): void;
    send(event: SAMWebSocketEvent): Promise<void>;
    on(eventType: SAMEventType, handler: MessageHandler): () => void;
    onConnectionChange(handler: ConnectionHandler): () => void;
    onError(handler: ErrorHandler): () => void;
    getState(): ConnectionState;
    getStats(): ConnectionStats;
    isConnected(): boolean;
    getConnectionId(): string | null;
    reportActivity(activity: {
        type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
        data?: Record<string, unknown>;
        pageContext?: {
            url: string;
            courseId?: string;
            sectionId?: string;
        };
    }): Promise<void>;
    acknowledgeEvent(eventId: string, action?: 'viewed' | 'clicked' | 'dismissed'): Promise<void>;
    dismissEvent(targetEventId: string, reason?: string): Promise<void>;
    private handleOpen;
    private handleClose;
    private handleError;
    private handleMessage;
    private scheduleReconnect;
    private startHeartbeat;
    private setState;
    private clearTimers;
    private buildWebSocketUrl;
    private detectDeviceType;
    private detectBrowser;
}
/**
 * Server-side connection manager for managing multiple client connections
 * This is used in API routes or WebSocket servers
 */
export declare class ServerConnectionManager {
    private readonly logger;
    private readonly connections;
    private readonly userConnections;
    private readonly handlers;
    constructor(options?: {
        logger?: RealtimeLogger;
    });
    registerConnection(connectionId: string, userId: string, socket: unknown, // WebSocket type varies by environment
    metadata: PresenceMetadata): void;
    removeConnection(connectionId: string, reason?: string): void;
    sendToConnection(connectionId: string, event: SAMWebSocketEvent): Promise<boolean>;
    sendToUser(userId: string, event: SAMWebSocketEvent): Promise<number>;
    broadcast(event: SAMWebSocketEvent, filter?: (connection: ServerConnection) => boolean): Promise<number>;
    getConnection(connectionId: string): ServerConnection | undefined;
    getUserConnections(userId: string): ServerConnection[];
    isUserConnected(userId: string): boolean;
    getConnectionCount(): number;
    getConnectedUserIds(): string[];
    addHandler(handler: WebSocketConnectionHandler): void;
    removeHandler(handler: WebSocketConnectionHandler): void;
    handleMessage(connectionId: string, rawMessage: string): Promise<void>;
}
export interface ServerConnection {
    id: string;
    userId: string;
    socket: unknown;
    metadata: PresenceMetadata;
    connectedAt: Date;
    lastActivityAt: Date;
    subscriptions: Set<string>;
}
export declare function createClientWebSocketManager(options?: {
    config?: Partial<ConnectionConfig>;
    logger?: RealtimeLogger;
}): ClientWebSocketManager;
export declare function createServerConnectionManager(options?: {
    logger?: RealtimeLogger;
}): ServerConnectionManager;
//# sourceMappingURL=websocket-manager.d.ts.map