/**
 * SAM Realtime Client Module (Browser-Safe)
 *
 * This module provides client-side realtime functionality WITHOUT any Prisma
 * dependencies. Use this module in React client components.
 *
 * For server-side functionality (with Prisma stores), import from './index.ts'
 */

import { logger } from '@/lib/logger';
import {
  // WebSocket Managers
  ClientWebSocketManager,
  createClientWebSocketManager,
  // Intervention Surfaces
  InterventionSurfaceManagerImpl,
  createInterventionSurfaceManager,
  DEFAULT_DISPLAY_CONFIGS,
  // Types (re-exported for convenience)
  type UserPresence,
  type SAMWebSocketEvent,
  type InterventionQueue,
  type InterventionUIState,
  type RealtimeLogger,
  type PresenceMetadata,
  type ActivityPayload,
  DeliveryChannel as DeliveryChannelConst,
  SAMEventType as SAMEventTypeConst,
} from '@sam-ai/agentic';

// Re-export types and enums from @sam-ai/agentic for convenience
export {
  type UserPresence,
  type SAMWebSocketEvent,
  type InterventionQueue,
  type InterventionUIState,
  type RealtimeLogger,
  type PresenceMetadata,
  type ActivityPayload,
  DeliveryChannelConst as DeliveryChannel,
  SAMEventTypeConst as SAMEventType,
  DEFAULT_DISPLAY_CONFIGS,
};

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SAMRealtimeConfig {
  /** WebSocket URL for client connections */
  wsUrl?: string;
  /** Enable persistence to database */
  enablePersistence?: boolean;
  /** Use Prisma-backed stores from TaxomindContext (server-only) */
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
// SAM REALTIME CLIENT (BROWSER-SAFE)
// ============================================================================

/**
 * Client-side realtime manager for browser environments
 * Manages WebSocket connection, presence, and intervention display
 *
 * NOTE: This class does NOT use Prisma stores - it's safe for client components.
 */
export class SAMRealtimeClient {
  private readonly config: Required<SAMRealtimeConfig>;
  private wsManager: ClientWebSocketManager | null = null;
  private surfaceManager: InterventionSurfaceManagerImpl;
  private userId: string | null = null;
  private isConnected = false;

  // Event handlers
  private readonly eventHandlers: Map<
    string,
    Set<(event: SAMWebSocketEvent) => void>
  > = new Map();
  private readonly presenceHandlers: Set<(presence: UserPresence) => void> =
    new Set();

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
        (this.config.wsUrl.startsWith('ws://') ||
          this.config.wsUrl.startsWith('wss://'))
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
      logger.debug(
        'WebSocket endpoint not reachable, REST polling will be used'
      );
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

    // Convert ws:// to http:// for the health check
    const httpUrl = url.replace(/^ws(s)?:\/\//, 'http$1://');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${httpUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // Not reachable - expected in development without WebSocket server
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.wsManager) return;

    // Handle specific event types that should trigger intervention display
    const interventionEventTypes = [
      SAMEventTypeConst.INTERVENTION,
      SAMEventTypeConst.CHECKIN,
      SAMEventTypeConst.RECOMMENDATION,
      SAMEventTypeConst.NUDGE,
      SAMEventTypeConst.CELEBRATION,
      SAMEventTypeConst.STEP_COMPLETED,
      SAMEventTypeConst.GOAL_PROGRESS,
    ] as const;

    for (const eventType of interventionEventTypes) {
      this.wsManager.on(eventType, (event: SAMWebSocketEvent) => {
        // Queue intervention for display
        this.surfaceManager.queue(event);

        // Dispatch to type-specific handlers
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(event));
        }
      });
    }

    // Handle presence updates
    this.wsManager.on(SAMEventTypeConst.PRESENCE_UPDATE, (event: SAMWebSocketEvent) => {
      const presence = event.payload as UserPresence;
      this.presenceHandlers.forEach((handler) => handler(presence));
    });
  }

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  on(event: string, handler: (event: SAMWebSocketEvent) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  onPresenceChange(handler: (presence: UserPresence) => void): () => void {
    this.presenceHandlers.add(handler);

    return () => {
      this.presenceHandlers.delete(handler);
    };
  }

  // ---------------------------------------------------------------------------
  // Activity Tracking
  // ---------------------------------------------------------------------------

  trackActivity(activity: ActivityPayload): void {
    if (this.wsManager && this.isConnected) {
      // Send activity via WebSocket as an event
      this.wsManager.reportActivity(activity);
    }
  }

  // ---------------------------------------------------------------------------
  // Intervention Management
  // ---------------------------------------------------------------------------

  getInterventionQueue(): InterventionQueue {
    return this.surfaceManager.getQueue();
  }

  getVisibleInterventions(): InterventionUIState[] {
    return this.surfaceManager.getVisible();
  }

  dismissIntervention(interventionId: string, reason?: string): void {
    this.surfaceManager.dismiss(interventionId, reason);
  }

  onQueueChange(callback: (queue: InterventionQueue) => void): () => void {
    return this.surfaceManager.onQueueChange(callback);
  }

  // ---------------------------------------------------------------------------
  // State Accessors
  // ---------------------------------------------------------------------------

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getCurrentUserId(): string | null {
    return this.userId;
  }

  isWebSocketAvailable(): boolean {
    return this.wsAvailable;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: SAMRealtimeClient | null = null;

/**
 * Get or create the client-side realtime manager (browser only)
 * Note: Check isWebSocketEnabled() before calling this function to avoid unnecessary client creation
 */
export function getSAMRealtimeClient(
  config?: SAMRealtimeConfig
): SAMRealtimeClient {
  if (typeof window === 'undefined') {
    throw new Error('SAMRealtimeClient can only be used in browser environment');
  }

  if (!clientInstance) {
    clientInstance = new SAMRealtimeClient(config);
  }

  return clientInstance;
}

/**
 * Create a new client instance (useful for custom configurations)
 */
export function createSAMRealtimeClient(
  config?: SAMRealtimeConfig
): SAMRealtimeClient {
  return new SAMRealtimeClient(config);
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetSAMRealtimeClientInstance(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
