/**
 * @sam-ai/agentic - WebSocket Connection Manager
 * Portable WebSocket abstraction for real-time SAM communication
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ConnectionConfig,
  ConnectionState,
  ConnectionStats,
  SAMWebSocketEvent,
  WebSocketConnectionHandler,
  PresenceMetadata,
  RealtimeLogger,
  SAMEventType,
} from './types';
import {
  DEFAULT_CONNECTION_CONFIG,
  ConnectionState as ConnectionStateConst,
  SAMEventType as SAMEventTypeConst,
} from './types';

// ============================================================================
// WEBSOCKET MESSAGE HANDLER
// ============================================================================

export type MessageHandler = (event: SAMWebSocketEvent) => void;
export type ConnectionHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Error) => void;

// ============================================================================
// CONNECTION MANAGER INTERFACE
// ============================================================================

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

// ============================================================================
// CLIENT-SIDE WEBSOCKET MANAGER
// ============================================================================

/**
 * Client-side WebSocket manager for browser environments
 * This is the main class for UI integration
 */
export class ClientWebSocketManager implements WebSocketManagerInterface {
  private readonly config: ConnectionConfig;
  private readonly logger: RealtimeLogger;

  private socket: WebSocket | null = null;
  private state: ConnectionState = ConnectionStateConst.DISCONNECTED;
  private connectionId: string | null = null;
  private userId: string | null = null;
  private metadata: PresenceMetadata | null = null;

  private reconnectAttempts = 0;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  private readonly eventHandlers: Map<SAMEventType, Set<MessageHandler>> = new Map();
  private readonly connectionHandlers: Set<ConnectionHandler> = new Set();
  private readonly errorHandlers: Set<ErrorHandler> = new Set();

  private stats: ConnectionStats = {
    connectionId: '',
    connectedAt: new Date(),
    lastHeartbeatAt: new Date(),
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0,
  };

  constructor(options?: {
    config?: Partial<ConnectionConfig>;
    logger?: RealtimeLogger;
  }) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  async connect(userId: string, metadata?: PresenceMetadata): Promise<void> {
    if (this.state === ConnectionStateConst.CONNECTED) {
      this.logger.warn('Already connected');
      return;
    }

    // CRITICAL: Validate URL before attempting connection
    // Must be a valid ws:// or wss:// URL, not a relative path
    const configUrl = this.config.url;

    // Check if WebSocket is available in this environment
    if (typeof WebSocket === 'undefined') {
      throw new Error('WebSocket not available in this environment');
    }

    const isValidWsUrl = configUrl && (configUrl.startsWith('ws://') || configUrl.startsWith('wss://'));
    if (!isValidWsUrl) {
      // Use debug level logging - this is expected when WebSocket is not configured
      this.logger.debug('WebSocket not configured', { url: configUrl || 'not set' });
      throw new Error('WebSocket not configured - no valid URL provided');
    }

    this.userId = userId;
    this.metadata = metadata ?? {
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
    };

    this.setState(ConnectionStateConst.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();
        this.socket = new WebSocket(url);

        // Set a connection timeout to fail fast if server is unreachable
        const connectionTimeout = setTimeout(() => {
          if (this.state === ConnectionStateConst.CONNECTING) {
            this.socket?.close();
            const error = new Error('WebSocket connection timeout - server may not be running');
            this.handleError(error);
            reject(error);
          }
        }, 5000); // 5 second timeout

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.handleOpen();
          resolve();
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.handleClose(event);
        };

        this.socket.onerror = () => {
          clearTimeout(connectionTimeout);
          // Create a more descriptive error - native WebSocket errors often have no details
          const errorUrl = this.config.url || 'unknown URL';
          const error = new Error(`WebSocket connection failed to ${errorUrl}`);
          this.handleError(error);
          if (this.state === ConnectionStateConst.CONNECTING) {
            reject(new Error(`Failed to connect to WebSocket server at ${errorUrl}. Server may not be running.`));
          }
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error('Connection failed'));
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearTimers();

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.setState(ConnectionStateConst.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  async send(event: SAMWebSocketEvent): Promise<void> {
    if (!this.socket || this.state !== ConnectionStateConst.CONNECTED) {
      throw new Error('Not connected');
    }

    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString(),
      userId: this.userId,
      sessionId: this.connectionId,
    });

    this.socket.send(message);
    this.stats.messagesSent++;
  }

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  on(eventType: SAMEventType, handler: MessageHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  getState(): ConnectionState {
    return this.state;
  }

  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  isConnected(): boolean {
    return this.state === ConnectionStateConst.CONNECTED;
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  // ---------------------------------------------------------------------------
  // Activity Reporting
  // ---------------------------------------------------------------------------

  async reportActivity(activity: {
    type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
    data?: Record<string, unknown>;
    pageContext?: {
      url: string;
      courseId?: string;
      sectionId?: string;
    };
  }): Promise<void> {
    if (!this.isConnected()) return;

    await this.send({
      type: SAMEventTypeConst.ACTIVITY,
      payload: {
        type: activity.type,
        data: activity.data ?? {},
        pageContext: activity.pageContext,
      },
      timestamp: new Date(),
      eventId: uuidv4(),
      userId: this.userId ?? undefined,
      sessionId: this.connectionId ?? undefined,
    });
  }

  async acknowledgeEvent(eventId: string, action?: 'viewed' | 'clicked' | 'dismissed'): Promise<void> {
    if (!this.isConnected()) return;

    await this.send({
      type: SAMEventTypeConst.ACKNOWLEDGE,
      payload: {
        eventId,
        received: true,
        action,
      },
      timestamp: new Date(),
      eventId: uuidv4(),
      userId: this.userId ?? undefined,
      sessionId: this.connectionId ?? undefined,
    });
  }

  async dismissEvent(targetEventId: string, reason?: string): Promise<void> {
    if (!this.isConnected()) return;

    await this.send({
      type: SAMEventTypeConst.DISMISS,
      payload: {
        eventId: targetEventId,
        reason: (reason ?? 'user_action') as 'user_action' | 'timeout' | 'replaced' | 'navigation',
      },
      timestamp: new Date(),
      eventId: uuidv4(),
      userId: this.userId ?? undefined,
      sessionId: this.connectionId ?? undefined,
    } as SAMWebSocketEvent);
  }

  // ---------------------------------------------------------------------------
  // Internal Handlers
  // ---------------------------------------------------------------------------

  private handleOpen(): void {
    this.connectionId = uuidv4();
    this.setState(ConnectionStateConst.CONNECTED);
    this.reconnectAttempts = 0;

    this.stats = {
      connectionId: this.connectionId,
      connectedAt: new Date(),
      lastHeartbeatAt: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      reconnectCount: this.stats.reconnectCount,
      latencyMs: 0,
    };

    this.startHeartbeat();

    this.logger.info('WebSocket connected', {
      connectionId: this.connectionId,
      userId: this.userId,
    });
  }

  private handleClose(event: CloseEvent): void {
    this.clearTimers();

    const wasConnected = this.state === ConnectionStateConst.CONNECTED;

    if (event.code === 1000) {
      // Normal closure
      this.setState(ConnectionStateConst.DISCONNECTED);
    } else if (this.config.autoReconnect && wasConnected) {
      // Abnormal closure, try reconnect
      this.scheduleReconnect();
    } else {
      this.setState(ConnectionStateConst.DISCONNECTED);
    }

    this.logger.info('WebSocket closed', {
      code: event.code,
      reason: event.reason,
      wasConnected,
    });
  }

  private handleError(error: Error): void {
    // During initial connection, use debug level logging since connection failures
    // are expected when no WebSocket server is running
    // This prevents scary console errors from appearing in development
    if (this.state === ConnectionStateConst.CONNECTING) {
      this.logger.debug('WebSocket connection not available', {
        message: error.message,
        hint: 'This is expected if no WebSocket server is running. The app will fallback to REST polling.',
      });
    } else if (this.state === ConnectionStateConst.RECONNECTING) {
      // During reconnection attempts, use warn level
      this.logger.warn('WebSocket reconnection attempt failed', {
        message: error.message,
        attemptNumber: this.reconnectAttempts,
      });
    } else {
      // Only show error level for unexpected errors during established connections
      this.logger.warn('WebSocket error', {
        message: error.message,
        state: this.state,
      });
    }

    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        this.logger.warn('Error in error handler', {
          error: e instanceof Error ? e.message : 'Unknown',
        });
      }
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const samEvent: SAMWebSocketEvent = {
        ...data,
        timestamp: new Date(data.timestamp),
      };

      this.stats.messagesReceived++;

      // Handle heartbeat response
      if (samEvent.type === SAMEventTypeConst.HEARTBEAT) {
        this.stats.lastHeartbeatAt = new Date();
        return;
      }

      // Handle connected event
      if (samEvent.type === SAMEventTypeConst.CONNECTED) {
        this.connectionId = (samEvent.payload as { connectionId: string }).connectionId;
        this.stats.connectionId = this.connectionId;
      }

      // Dispatch to type-specific handlers
      const handlers = this.eventHandlers.get(samEvent.type as SAMEventType);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(samEvent);
          } catch (e) {
            this.logger.error('Error in message handler', {
              type: samEvent.type,
              error: e instanceof Error ? e.message : 'Unknown',
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to parse message', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState(ConnectionStateConst.FAILED);
      this.logger.error('Max reconnect attempts reached');
      return;
    }

    this.setState(ConnectionStateConst.RECONNECTING);
    this.reconnectAttempts++;
    this.stats.reconnectCount++;

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.info('Scheduling reconnect', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.userId && this.metadata) {
          await this.connect(this.userId, this.metadata);
        }
      } catch (error) {
        this.scheduleReconnect();
      }
    }, delay);
  }

  // ---------------------------------------------------------------------------
  // Heartbeat
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected()) return;

      try {
        await this.send({
          type: SAMEventTypeConst.HEARTBEAT,
          payload: {
            status: 'alive',
            timestamp: new Date(),
            connectionId: this.connectionId ?? '',
          },
          timestamp: new Date(),
          eventId: uuidv4(),
          userId: this.userId ?? undefined,
          sessionId: this.connectionId ?? undefined,
        });
      } catch (error) {
        this.logger.warn('Heartbeat failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }, this.config.heartbeatInterval);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private setState(state: ConnectionState): void {
    const previousState = this.state;
    this.state = state;

    if (previousState !== state) {
      for (const handler of this.connectionHandlers) {
        try {
          handler(state);
        } catch (e) {
          this.logger.error('Error in connection handler', {
            error: e instanceof Error ? e.message : 'Unknown',
          });
        }
      }
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private buildWebSocketUrl(): string {
    const configUrl = this.config.url;

    // If config.url is already a full ws:// or wss:// URL, use it directly
    if (configUrl.startsWith('ws://') || configUrl.startsWith('wss://')) {
      const url = new URL(configUrl);
      if (this.userId) {
        url.searchParams.set('userId', this.userId);
      }
      if (this.config.authToken) {
        url.searchParams.set('token', this.config.authToken);
      }
      return url.toString();
    }

    // For relative URLs or http/https URLs, construct WebSocket URL
    const url = new URL(configUrl, window.location.origin);
    url.protocol = url.protocol.replace('http', 'ws');

    if (this.userId) {
      url.searchParams.set('userId', this.userId);
    }
    if (this.config.authToken) {
      url.searchParams.set('token', this.config.authToken);
    }

    return url.toString();
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';

    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';

    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'unknown';
  }
}

// ============================================================================
// SERVER-SIDE CONNECTION MANAGER
// ============================================================================

/**
 * Server-side connection manager for managing multiple client connections
 * This is used in API routes or WebSocket servers
 */
export class ServerConnectionManager {
  private readonly logger: RealtimeLogger;
  private readonly connections: Map<string, ServerConnection> = new Map();
  private readonly userConnections: Map<string, Set<string>> = new Map();
  private readonly handlers: Set<WebSocketConnectionHandler> = new Set();

  constructor(options?: { logger?: RealtimeLogger }) {
    this.logger = options?.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  registerConnection(
    connectionId: string,
    userId: string,
    socket: unknown, // WebSocket type varies by environment
    metadata: PresenceMetadata
  ): void {
    const connection: ServerConnection = {
      id: connectionId,
      userId,
      socket,
      metadata,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      subscriptions: new Set(),
    };

    this.connections.set(connectionId, connection);

    // Track user's connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Notify handlers
    for (const handler of this.handlers) {
      handler.onConnect(connectionId, userId, metadata).catch((err) => {
        this.logger.error('Error in connection handler', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      });
    }

    this.logger.info('Connection registered', {
      connectionId,
      userId,
      totalConnections: this.connections.size,
    });
  }

  removeConnection(connectionId: string, reason?: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from user's connections
    const userConns = this.userConnections.get(connection.userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    this.connections.delete(connectionId);

    // Notify handlers
    for (const handler of this.handlers) {
      handler.onDisconnect(connectionId, reason).catch((err) => {
        this.logger.error('Error in disconnect handler', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      });
    }

    this.logger.info('Connection removed', {
      connectionId,
      userId: connection.userId,
      reason,
    });
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  async sendToConnection(connectionId: string, event: SAMWebSocketEvent): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      const message = JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString(),
      });

      // The actual send implementation depends on the WebSocket library
      const socket = connection.socket as { send?: (msg: string) => void };
      if (socket.send) {
        socket.send(message);
        connection.lastActivityAt = new Date();
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to send to connection', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  async sendToUser(userId: string, event: SAMWebSocketEvent): Promise<number> {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds || connectionIds.size === 0) return 0;

    let sent = 0;
    for (const connectionId of connectionIds) {
      const success = await this.sendToConnection(connectionId, event);
      if (success) sent++;
    }

    return sent;
  }

  async broadcast(event: SAMWebSocketEvent, filter?: (connection: ServerConnection) => boolean): Promise<number> {
    let sent = 0;

    for (const [connectionId, connection] of this.connections) {
      if (filter && !filter(connection)) continue;

      const success = await this.sendToConnection(connectionId, event);
      if (success) sent++;
    }

    return sent;
  }

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  getConnection(connectionId: string): ServerConnection | undefined {
    return this.connections.get(connectionId);
  }

  getUserConnections(userId: string): ServerConnection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map((id) => this.connections.get(id))
      .filter((c): c is ServerConnection => c !== undefined);
  }

  isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId);
    return connections !== undefined && connections.size > 0;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userConnections.keys());
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  addHandler(handler: WebSocketConnectionHandler): void {
    this.handlers.add(handler);
  }

  removeHandler(handler: WebSocketConnectionHandler): void {
    this.handlers.delete(handler);
  }

  // ---------------------------------------------------------------------------
  // Message Processing
  // ---------------------------------------------------------------------------

  async handleMessage(connectionId: string, rawMessage: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const event: SAMWebSocketEvent = JSON.parse(rawMessage);
      event.timestamp = new Date(event.timestamp);

      connection.lastActivityAt = new Date();

      for (const handler of this.handlers) {
        await handler.onMessage(connectionId, event);
      }
    } catch (error) {
      this.logger.error('Failed to handle message', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ServerConnection {
  id: string;
  userId: string;
  socket: unknown;
  metadata: PresenceMetadata;
  connectedAt: Date;
  lastActivityAt: Date;
  subscriptions: Set<string>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createClientWebSocketManager(options?: {
  config?: Partial<ConnectionConfig>;
  logger?: RealtimeLogger;
}): ClientWebSocketManager {
  return new ClientWebSocketManager(options);
}

export function createServerConnectionManager(options?: {
  logger?: RealtimeLogger;
}): ServerConnectionManager {
  return new ServerConnectionManager(options);
}
