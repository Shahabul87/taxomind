/**
 * SAM Real-Time Integration Module (SERVER-ONLY)
 * Integrates @sam-ai/agentic realtime infrastructure with Taxomind
 *
 * This module provides:
 * 1. WebSocket connection management for real-time communication
 * 2. Presence tracking with Prisma persistence
 * 3. Push delivery with proactive intervention integration
 * 4. UI surface management for intervention display
 *
 * Phase 3: Infrastructure - Wire presence to Prisma store via TaxomindContext
 *
 * NOTE: This module uses Prisma stores and MUST only be imported in server contexts.
 * For client-side realtime functionality, use './client.ts' instead.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  // Presence
  PresenceTracker,
  createPresenceTracker,
  InMemoryPresenceStore,
  // Push Dispatcher
  ProactivePushDispatcher,
  createPushDispatcher,
  InMemoryPushQueueStore,
  // WebSocket Managers
  ClientWebSocketManager,
  ServerConnectionManager,
  createClientWebSocketManager,
  createServerConnectionManager,
  // Intervention Surfaces
  InterventionSurfaceManagerImpl,
  createInterventionSurfaceManager,
  DEFAULT_DISPLAY_CONFIGS,
  // Types
  type UserPresence,
  type PresenceStateChange,
  type SAMWebSocketEvent,
  type InterventionQueue,
  type InterventionUIState,
  type RealtimeLogger,
  type PresenceMetadata,
  type ActivityPayload,
  type PresenceStore,
  type PushQueueStore,
  DeliveryChannel as DeliveryChannelConst,
  SAMEventType as SAMEventTypeConst,
} from '@sam-ai/agentic';
import { getPresenceStore, getPushQueueStore } from '../taxomind-context';

// Re-export all types from @sam-ai/agentic realtime module
export * from '@sam-ai/agentic';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SAMRealtimeConfig {
  /** WebSocket URL for client connections */
  wsUrl?: string;
  /** Enable persistence to database */
  enablePersistence?: boolean;
  /** Use Prisma-backed stores from TaxomindContext (recommended for production) */
  usePrismaStores?: boolean;
  /** Enable sound effects for interventions */
  enableSound?: boolean;
  /** Enable haptic feedback on mobile */
  enableHaptics?: boolean;
  /** Maximum visible interventions */
  maxVisibleInterventions?: number;
  /** Idle timeout in milliseconds */
  idleTimeoutMs?: number;
  /** Away timeout in milliseconds */
  awayTimeoutMs?: number;
  /** Offline timeout in milliseconds */
  offlineTimeoutMs?: number;
  /** Heartbeat interval in milliseconds */
  heartbeatIntervalMs?: number;
}

const DEFAULT_REALTIME_CONFIG: Required<SAMRealtimeConfig> = {
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? '',
  enablePersistence: true,
  usePrismaStores: true,
  enableSound: true,
  enableHaptics: true,
  maxVisibleInterventions: 3,
  idleTimeoutMs: 5 * 60 * 1000, // 5 minutes
  awayTimeoutMs: 15 * 60 * 1000, // 15 minutes
  offlineTimeoutMs: 30 * 60 * 1000, // 30 minutes
  heartbeatIntervalMs: 30000, // 30 seconds
};

/**
 * Check if WebSocket is enabled (NEXT_PUBLIC_WS_URL is set with a valid ws:// or wss:// URL)
 * Returns false if not in browser environment or URL is not a valid WebSocket URL
 */
export function isWebSocketEnabled(): boolean {
  // Only enable WebSocket in browser environment with explicit URL configuration
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if WebSocket API is available
  if (typeof WebSocket === 'undefined') {
    return false;
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  // Must have a valid WebSocket URL (ws:// or wss://)
  const isEnabled = Boolean(
    wsUrl &&
      wsUrl.trim().length > 0 &&
      (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://'))
  );

  return isEnabled;
}

// ============================================================================
// SAM REALTIME MANAGER (CLIENT-SIDE)
// ============================================================================

/**
 * Client-side realtime manager for browser environments
 * Manages WebSocket connection, presence, and intervention display
 */
export class SAMRealtimeClient {
  private readonly config: Required<SAMRealtimeConfig>;
  private wsManager: ClientWebSocketManager | null = null;
  private surfaceManager: InterventionSurfaceManagerImpl;
  private userId: string | null = null;
  private isConnected = false;

  // Event handlers
  private readonly eventHandlers: Map<string, Set<(event: SAMWebSocketEvent) => void>> = new Map();
  private readonly presenceHandlers: Set<(presence: UserPresence) => void> = new Set();

  // Flag to track if WebSocket is actually available
  private readonly wsAvailable: boolean;

  constructor(config: SAMRealtimeConfig = {}) {
    this.config = { ...DEFAULT_REALTIME_CONFIG, ...config };

    // Check if WebSocket is actually available:
    // 1. Must be in browser environment
    // 2. WebSocket API must be available
    // 3. Must have a valid ws:// or wss:// URL configured
    const isBrowser = typeof window !== 'undefined';
    const hasWebSocketAPI = typeof WebSocket !== 'undefined';
    const hasValidUrl = Boolean(
      this.config.wsUrl &&
        this.config.wsUrl.trim().length > 0 &&
        (this.config.wsUrl.startsWith('ws://') || this.config.wsUrl.startsWith('wss://'))
    );

    this.wsAvailable = isBrowser && hasWebSocketAPI && hasValidUrl;

    // Initialize intervention surface manager
    this.surfaceManager = createInterventionSurfaceManager({
      config: {
        maxVisible: this.config.maxVisibleInterventions,
        enableSound: this.config.enableSound,
        enableHaptics: this.config.enableHaptics,
      },
      logger,
    });
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  async connect(userId: string, metadata?: PresenceMetadata): Promise<void> {
    // CRITICAL: Check wsAvailable flag FIRST - prevents any WebSocket attempt
    if (!this.wsAvailable) {
      // Use debug level - this is expected behavior when WebSocket is not configured
      logger.debug('WebSocket not configured, REST polling will be used');
      throw new Error('WebSocket not configured - using REST polling fallback');
    }

    if (this.isConnected && this.userId === userId) {
      logger.debug('Already connected with same user');
      return;
    }

    this.userId = userId;

    // Check if WebSocket server is reachable before attempting connection
    const isReachable = await this.isWebSocketReachable(this.config.wsUrl);
    if (!isReachable) {
      logger.debug('WebSocket endpoint not reachable, REST polling will be used');
      throw new Error('WebSocket server unreachable - using REST polling fallback');
    }

    // Create WebSocket manager with custom logger that downgrades WebSocket errors to debug/warn
    const realtimeLogger: RealtimeLogger = {
      debug: (message, meta) => logger.debug(message, meta),
      info: (message, meta) => logger.info(message, meta),
      warn: (message, meta) => logger.warn(message, meta),
      error: (message, meta) => {
        // Downgrade WebSocket-related errors to warnings since they're expected
        // when no WebSocket server is running
        if (message.toLowerCase().includes('websocket')) {
          logger.debug(message, meta);
          return;
        }
        logger.error(message, meta);
      },
    };

    this.wsManager = createClientWebSocketManager({
      config: {
        url: this.config.wsUrl,
        maxReconnectAttempts: 3, // Reduced from 5 to fail faster
        reconnectDelay: 1000,
        heartbeatInterval: this.config.heartbeatIntervalMs,
        idleTimeout: this.config.idleTimeoutMs,
        awayTimeout: this.config.awayTimeoutMs,
        autoReconnect: false, // Disable auto-reconnect - let caller handle fallback
      },
      logger: realtimeLogger,
    });

    // Set up event handlers
    this.setupEventHandlers();

    // Connect
    await this.wsManager.connect(userId, metadata);
    this.isConnected = true;

    logger.info('SAM realtime client connected', { userId });
  }

  disconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect();
      this.wsManager = null;
    }

    this.isConnected = false;
    this.userId = null;

    logger.info('SAM realtime client disconnected');
  }

  private async isWebSocketReachable(url: string): Promise<boolean> {
    if (!url || typeof window === 'undefined') {
      return false;
    }

    const httpUrl = url.replace(/^ws/, 'http');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      await fetch(httpUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private setupEventHandlers(): void {
    if (!this.wsManager) return;

    // Handle all proactive event types
    const proactiveEvents = [
      SAMEventTypeConst.INTERVENTION,
      SAMEventTypeConst.CHECKIN,
      SAMEventTypeConst.RECOMMENDATION,
      SAMEventTypeConst.STEP_COMPLETED,
      SAMEventTypeConst.GOAL_PROGRESS,
      SAMEventTypeConst.NUDGE,
      SAMEventTypeConst.CELEBRATION,
    ] as const;

    for (const eventType of proactiveEvents) {
      this.wsManager.on(eventType, (event) => {
        // Queue for display
        this.surfaceManager.queue(event);

        // Notify registered handlers
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              logger.error('Error in event handler', {
                eventType,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          });
        }
      });
    }

    // Handle presence updates
    this.wsManager.on(SAMEventTypeConst.PRESENCE_UPDATE, (event) => {
      const presence = event.payload as UserPresence;
      this.presenceHandlers.forEach((handler) => {
        try {
          handler(presence);
        } catch (error) {
          logger.error('Error in presence handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    });

    // Handle system events
    this.wsManager.on(SAMEventTypeConst.SESSION_SYNC, (event) => {
      this.surfaceManager.queue(event);
    });

    this.wsManager.on(SAMEventTypeConst.DISCONNECTED, (event) => {
      this.surfaceManager.queue(event);
    });

    this.wsManager.on(SAMEventTypeConst.RECONNECTING, (event) => {
      this.surfaceManager.queue(event);
    });
  }

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  on(eventType: string, handler: (event: SAMWebSocketEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  onPresenceChange(handler: (presence: UserPresence) => void): () => void {
    this.presenceHandlers.add(handler);
    return () => {
      this.presenceHandlers.delete(handler);
    };
  }

  // ---------------------------------------------------------------------------
  // Intervention Surface Management
  // ---------------------------------------------------------------------------

  getInterventionQueue(): InterventionQueue {
    return this.surfaceManager.getQueue();
  }

  getVisibleInterventions(): InterventionUIState[] {
    return this.surfaceManager.getVisible();
  }

  dismissIntervention(eventId: string, reason?: string): void {
    this.surfaceManager.dismiss(eventId, reason);
  }

  onQueueChange(callback: (queue: InterventionQueue) => void): () => void {
    return this.surfaceManager.onQueueChange(callback);
  }

  // ---------------------------------------------------------------------------
  // Activity Reporting
  // ---------------------------------------------------------------------------

  async reportActivity(activity: {
    type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
    data?: Record<string, unknown>;
    page?: string;
  }): Promise<void> {
    if (this.wsManager) {
      await this.wsManager.reportActivity({
        type: activity.type,
        data: activity.data,
        pageContext: activity.page ? { url: activity.page } : undefined,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  getConnectionStatus(): {
    isConnected: boolean;
    userId: string | null;
    wsState: string;
  } {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      wsState: this.wsManager?.getState() ?? 'disconnected',
    };
  }
}

// ============================================================================
// SAM REALTIME SERVER (SERVER-SIDE)
// ============================================================================

/**
 * Server-side realtime manager for API routes and WebSocket server
 * Manages presence tracking, push delivery, and connection management
 */
export class SAMRealtimeServer {
  private readonly config: Required<SAMRealtimeConfig>;
  private readonly presenceTracker: PresenceTracker;
  private readonly pushDispatcher: ProactivePushDispatcher;
  private readonly connectionManager: ServerConnectionManager;
  private isRunning = false;

  constructor(config: SAMRealtimeConfig = {}) {
    this.config = { ...DEFAULT_REALTIME_CONFIG, ...config };

    // Get presence store - use Prisma-backed store from TaxomindContext if enabled
    let presenceStore: PresenceStore;
    if (this.config.usePrismaStores) {
      try {
        presenceStore = getPresenceStore();
        logger.info('SAM Realtime using Prisma-backed presence store for persistence');
      } catch (error) {
        logger.warn('Failed to initialize Prisma presence store, falling back to in-memory', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        presenceStore = new InMemoryPresenceStore();
      }
    } else {
      presenceStore = new InMemoryPresenceStore();
    }

    // Initialize presence tracker
    this.presenceTracker = createPresenceTracker({
      store: presenceStore,
      config: {
        idleTimeoutMs: this.config.idleTimeoutMs,
        awayTimeoutMs: this.config.awayTimeoutMs,
        offlineTimeoutMs: this.config.offlineTimeoutMs,
      },
      logger,
    });

    // Get push queue store - use Prisma-backed store from TaxomindContext if enabled
    let pushQueueStore: PushQueueStore;
    if (this.config.usePrismaStores) {
      try {
        pushQueueStore = getPushQueueStore();
        logger.info('SAM Realtime using Prisma-backed push queue store for persistence');
      } catch (error) {
        logger.warn('Failed to initialize Prisma push queue store, falling back to in-memory', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        pushQueueStore = new InMemoryPushQueueStore();
      }
    } else {
      pushQueueStore = new InMemoryPushQueueStore();
    }

    // Initialize push dispatcher with Prisma-backed store
    this.pushDispatcher = createPushDispatcher({
      store: pushQueueStore,
      presenceTracker: this.presenceTracker,
      logger,
    });

    // Initialize connection manager
    this.connectionManager = createServerConnectionManager({
      logger,
    });

    // Set up default delivery handlers
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    // WebSocket delivery handler
    this.pushDispatcher.registerHandler({
      channel: DeliveryChannelConst.WEBSOCKET,
      canDeliver: async (userId: string) => {
        const presence = await this.presenceTracker.getPresence(userId);
        return presence !== null && presence.status !== 'offline';
      },
      deliver: async (userId: string, event: SAMWebSocketEvent) => {
        const sent = await this.connectionManager.sendToUser(userId, event);
        return sent > 0;
      },
    });

    // In-app delivery handler
    this.pushDispatcher.registerHandler({
      channel: DeliveryChannelConst.IN_APP,
      canDeliver: async (userId: string) => {
        const presence = await this.presenceTracker.getPresence(userId);
        return presence !== null && presence.status !== 'offline';
      },
      deliver: async (userId: string, event: SAMWebSocketEvent) => {
        const sent = await this.connectionManager.sendToUser(userId, event);
        return sent > 0;
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.isRunning) {
      logger.warn('SAM realtime server already running');
      return;
    }

    this.pushDispatcher.start();
    this.isRunning = true;

    logger.info('SAM realtime server started');
  }

  stop(): void {
    if (!this.isRunning) return;

    this.pushDispatcher.stop();
    this.isRunning = false;

    logger.info('SAM realtime server stopped');
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  async handleConnection(
    connectionId: string,
    userId: string,
    socket: unknown,
    metadata: PresenceMetadata
  ): Promise<void> {
    this.connectionManager.registerConnection(connectionId, userId, socket, metadata);
    await this.presenceTracker.connect(userId, connectionId, metadata);
    await this.sendConnectedEvent(connectionId, userId);

    logger.info('User connected', { userId, connectionId });
  }

  async handleDisconnection(connectionId: string, reason?: string): Promise<void> {
    this.connectionManager.removeConnection(connectionId, reason);
    await this.presenceTracker.disconnect(connectionId, reason);
  }

  async handleMessage(connectionId: string, message: string): Promise<void> {
    // Parse and handle WebSocket messages
    try {
      const event = JSON.parse(message) as SAMWebSocketEvent;
      if (typeof event.timestamp === 'string') {
        event.timestamp = new Date(event.timestamp);
      }

      if (event.type === SAMEventTypeConst.HEARTBEAT) {
        await this.connectionManager.sendToConnection(connectionId, {
          type: SAMEventTypeConst.HEARTBEAT,
          payload: {
            status: 'alive',
            timestamp: new Date(),
            connectionId,
          },
          timestamp: new Date(),
          eventId: uuidv4(),
          userId: event.userId,
          sessionId: connectionId,
        } as SAMWebSocketEvent);
        return;
      }

      // Record activity for presence tracking
      if (event.userId) {
        const activityPayload =
          event.type === SAMEventTypeConst.ACTIVITY && event.payload
            ? event.payload
            : {
                type: 'interaction',
                data: { eventType: event.type },
              };
        await this.presenceTracker.recordActivity(event.userId, activityPayload as ActivityPayload);
      }
    } catch (error) {
      logger.warn('Failed to parse WebSocket message', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendConnectedEvent(connectionId: string, userId: string): Promise<void> {
    const event: SAMWebSocketEvent = {
      type: SAMEventTypeConst.CONNECTED,
      payload: {
        connectionId,
        userId,
        sessionId: connectionId,
        serverTime: new Date(),
        capabilities: ['presence', 'proactive', 'notifications'],
      },
      timestamp: new Date(),
      eventId: uuidv4(),
      userId,
      sessionId: connectionId,
    } as SAMWebSocketEvent;

    await this.connectionManager.sendToConnection(connectionId, event);
  }

  // ---------------------------------------------------------------------------
  // Push Delivery
  // ---------------------------------------------------------------------------

  async pushToUser(
    userId: string,
    event: SAMWebSocketEvent,
    options?: {
      priority?: 'critical' | 'high' | 'normal' | 'low';
      channels?: Array<'websocket' | 'in_app' | 'email' | 'push_notification' | 'sse'>;
    }
  ): Promise<void> {
    await this.pushDispatcher.dispatchEvent(userId, event, {
      priority: options?.priority,
      channels: options?.channels as Array<'websocket' | 'sse' | 'push_notification' | 'email' | 'in_app'>,
    });
  }

  async broadcast(
    event: SAMWebSocketEvent,
    filter?: (userId: string) => boolean
  ): Promise<number> {
    // Use the ServerConnectionManager's built-in broadcast method
    return this.connectionManager.broadcast(event, filter ? (conn) => filter(conn.userId) : undefined);
  }

  // ---------------------------------------------------------------------------
  // Presence
  // ---------------------------------------------------------------------------

  async getPresence(userId: string): Promise<UserPresence | null> {
    return this.presenceTracker.getPresence(userId);
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    return this.presenceTracker.getOnlineUsers();
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.presenceTracker.getPresence(userId);
    return presence !== null && presence.status !== 'offline';
  }

  onPresenceChange(callback: (change: PresenceStateChange) => void): () => void {
    return this.presenceTracker.onPresenceChange(callback);
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async getStats(): Promise<{
    isRunning: boolean;
    onlineUsers: number;
    dispatcherStats: {
      queueSize: number;
      deliveredCount: number;
      failedCount: number;
    };
  }> {
    const onlineUsers = await this.presenceTracker.getOnlineUsers();
    const dispatcherStats = await this.pushDispatcher.getStats();

    return {
      isRunning: this.isRunning,
      onlineUsers: onlineUsers.length,
      dispatcherStats: {
        queueSize: dispatcherStats.queueSize,
        deliveredCount: dispatcherStats.deliveredCount,
        failedCount: dispatcherStats.failedCount,
      },
    };
  }
}

// ============================================================================
// INTEGRATION WITH PROACTIVE SCHEDULER
// ============================================================================

/**
 * Bridge between ProactiveScheduler and real-time delivery
 * Call this after generating interventions to push them in real-time
 */
export async function pushProactiveIntervention(
  server: SAMRealtimeServer,
  userId: string,
  intervention: {
    type: 'intervention' | 'checkin' | 'recommendation' | 'nudge' | 'celebration';
    id: string;
    data: Record<string, unknown>;
    priority?: 'critical' | 'high' | 'normal' | 'low';
  }
): Promise<void> {
  const { v4: uuidv4 } = await import('uuid');

  // Create event with proper type - cast through unknown since payload is dynamic
  const event = {
    eventId: uuidv4(),
    type: intervention.type,
    userId,
    timestamp: new Date(),
    payload: intervention.data,
  } as unknown as SAMWebSocketEvent;

  await server.pushToUser(userId, event, {
    priority: intervention.priority ?? 'normal',
    channels: [DeliveryChannelConst.WEBSOCKET, DeliveryChannelConst.IN_APP],
  });
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let clientInstance: SAMRealtimeClient | null = null;
let serverInstance: SAMRealtimeServer | null = null;

/**
 * Get or create the client-side realtime manager (browser only)
 * Note: Check isWebSocketEnabled() before calling this function to avoid unnecessary client creation
 */
export function getSAMRealtimeClient(config?: SAMRealtimeConfig): SAMRealtimeClient {
  if (typeof window === 'undefined') {
    throw new Error('SAMRealtimeClient can only be used in browser environment');
  }

  if (!clientInstance) {
    clientInstance = new SAMRealtimeClient(config);
  }

  return clientInstance;
}

/**
 * Get or create the server-side realtime manager
 */
export function getSAMRealtimeServer(config?: SAMRealtimeConfig): SAMRealtimeServer {
  if (!serverInstance) {
    serverInstance = new SAMRealtimeServer(config);
  }

  return serverInstance;
}

/**
 * Reset singleton instances (useful for testing)
 */
export function resetSAMRealtimeInstances(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }

  if (serverInstance) {
    serverInstance.stop();
    serverInstance = null;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createSAMRealtimeClient(config?: SAMRealtimeConfig): SAMRealtimeClient {
  return new SAMRealtimeClient(config);
}

export function createSAMRealtimeServer(config?: SAMRealtimeConfig): SAMRealtimeServer {
  return new SAMRealtimeServer(config);
}

// Re-export display configs for convenience
export { DEFAULT_DISPLAY_CONFIGS };
