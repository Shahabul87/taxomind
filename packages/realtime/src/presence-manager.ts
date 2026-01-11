/**
 * @sam-ai/realtime - Presence Manager
 * Manages user presence state and broadcasts presence updates
 */

import type {
  PresenceManagerConfig,
  PresenceStore,
  UserPresence,
  PresenceStatus,
  PresenceChangeReason,
  PresenceHistoryEntry,
  RealtimeLogger,
} from './types';
import { InMemoryPresenceStore } from './stores';

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: RealtimeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// PRESENCE MANAGER
// ============================================================================

export class PresenceManager {
  private store: PresenceStore;
  private logger: RealtimeLogger;
  private staleTimeout: number;
  private cleanupInterval: number;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private listeners = new Map<string, Set<(presence: UserPresence) => void>>();
  private globalListeners = new Set<(presence: UserPresence, event: string) => void>();

  constructor(config: PresenceManagerConfig = {}) {
    this.store = config.store ?? new InMemoryPresenceStore();
    this.logger = config.logger ?? defaultLogger;
    this.staleTimeout = config.staleTimeout ?? 5 * 60 * 1000; // 5 minutes
    this.cleanupInterval = config.cleanupInterval ?? 60 * 1000; // 1 minute

    this.startCleanupJob();
  }

  // ============================================================================
  // PRESENCE OPERATIONS
  // ============================================================================

  /**
   * Register a user as online
   */
  async connect(
    userId: string,
    connectionId: string,
    options?: {
      deviceType?: 'desktop' | 'mobile' | 'tablet';
      browser?: string;
      os?: string;
      pageUrl?: string;
      courseId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<UserPresence> {
    const now = new Date();
    const existing = await this.store.get(userId);

    const presence: UserPresence = {
      userId,
      connectionId,
      status: 'online',
      lastActivityAt: now,
      connectedAt: existing?.connectedAt ?? now,
      deviceType: options?.deviceType,
      browser: options?.browser,
      os: options?.os,
      pageUrl: options?.pageUrl,
      courseId: options?.courseId,
      subscriptions: existing?.subscriptions ?? [],
      metadata: options?.metadata,
    };

    await this.store.set(presence);

    // Record history
    if (existing) {
      await this.recordChange(userId, existing.status, 'online', 'connect');
    } else {
      await this.recordChange(userId, 'offline', 'online', 'connect');
    }

    this.logger.info('[PresenceManager] User connected', { userId, connectionId });
    this.notifyListeners(presence, 'connect');

    return presence;
  }

  /**
   * Mark a user as disconnected
   */
  async disconnect(
    userId: string,
    reason: PresenceChangeReason = 'disconnect'
  ): Promise<void> {
    const presence = await this.store.get(userId);
    if (!presence) return;

    const previousStatus = presence.status;
    await this.store.update(userId, {
      status: 'offline',
      disconnectedAt: new Date(),
    });

    await this.recordChange(userId, previousStatus, 'offline', reason);

    this.logger.info('[PresenceManager] User disconnected', { userId, reason });
    const updated = await this.store.get(userId);
    if (updated) {
      this.notifyListeners(updated, 'disconnect');
    }
  }

  /**
   * Update user presence status
   */
  async updateStatus(userId: string, status: PresenceStatus): Promise<UserPresence | null> {
    const presence = await this.store.get(userId);
    if (!presence) return null;

    const previousStatus = presence.status;
    const updated = await this.store.update(userId, {
      status,
      lastActivityAt: new Date(),
    });

    if (updated && previousStatus !== status) {
      await this.recordChange(userId, previousStatus, status, 'manual');
      this.notifyListeners(updated, 'status_change');
    }

    return updated;
  }

  /**
   * Update user activity (heartbeat)
   */
  async heartbeat(userId: string): Promise<boolean> {
    const presence = await this.store.get(userId);
    if (!presence) return false;

    const wasAway = presence.status === 'away';
    await this.store.update(userId, {
      lastActivityAt: new Date(),
      status: wasAway ? 'online' : presence.status,
    });

    if (wasAway) {
      await this.recordChange(userId, 'away', 'online', 'activity');
      const updated = await this.store.get(userId);
      if (updated) {
        this.notifyListeners(updated, 'activity');
      }
    }

    return true;
  }

  /**
   * Update user location (page navigation)
   */
  async updateLocation(
    userId: string,
    location: {
      pageUrl?: string;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
      planId?: string;
      stepId?: string;
      goalId?: string;
    }
  ): Promise<UserPresence | null> {
    const updated = await this.store.update(userId, {
      ...location,
      lastActivityAt: new Date(),
    });

    if (updated) {
      this.notifyListeners(updated, 'navigation');
    }

    return updated;
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<UserPresence | null> {
    return this.store.get(userId);
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(options?: {
    courseId?: string;
    limit?: number;
  }): Promise<UserPresence[]> {
    return this.store.getOnlineUsers(options);
  }

  /**
   * Get online user count
   */
  async getOnlineCount(courseId?: string): Promise<number> {
    return this.store.getOnlineCount(courseId);
  }

  /**
   * Get user presence history
   */
  async getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]> {
    return this.store.getHistory(userId, limit);
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  /**
   * Subscribe user to a channel
   */
  async subscribe(userId: string, channel: string): Promise<boolean> {
    const presence = await this.store.get(userId);
    if (!presence) return false;

    if (!presence.subscriptions.includes(channel)) {
      presence.subscriptions.push(channel);
      await this.store.update(userId, { subscriptions: presence.subscriptions });
    }

    return true;
  }

  /**
   * Unsubscribe user from a channel
   */
  async unsubscribe(userId: string, channel: string): Promise<boolean> {
    const presence = await this.store.get(userId);
    if (!presence) return false;

    const index = presence.subscriptions.indexOf(channel);
    if (index > -1) {
      presence.subscriptions.splice(index, 1);
      await this.store.update(userId, { subscriptions: presence.subscriptions });
    }

    return true;
  }

  /**
   * Get users subscribed to a channel
   */
  async getSubscribers(channel: string): Promise<UserPresence[]> {
    const onlineUsers = await this.store.getOnlineUsers();
    return onlineUsers.filter((p) => p.subscriptions.includes(channel));
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Listen for presence changes for a specific user
   */
  onUserPresenceChange(
    userId: string,
    callback: (presence: UserPresence) => void
  ): () => void {
    const listeners = this.listeners.get(userId) ?? new Set();
    listeners.add(callback);
    this.listeners.set(userId, listeners);

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  /**
   * Listen for all presence changes
   */
  onPresenceChange(
    callback: (presence: UserPresence, event: string) => void
  ): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  // ============================================================================
  // INTERNAL METHODS
  // ============================================================================

  private async recordChange(
    userId: string,
    previousStatus: PresenceStatus,
    newStatus: PresenceStatus,
    reason: PresenceChangeReason
  ): Promise<void> {
    const presence = await this.store.get(userId);
    await this.store.recordHistory({
      userId,
      previousStatus,
      newStatus,
      reason,
      changedAt: new Date(),
      courseId: presence?.courseId,
      pageUrl: presence?.pageUrl,
      sessionDuration: presence?.connectedAt
        ? Math.floor((Date.now() - presence.connectedAt.getTime()) / 1000)
        : undefined,
    });
  }

  private notifyListeners(presence: UserPresence, event: string): void {
    // Notify user-specific listeners
    const userListeners = this.listeners.get(presence.userId);
    if (userListeners) {
      for (const listener of userListeners) {
        try {
          listener(presence);
        } catch (error) {
          this.logger.error('[PresenceManager] Listener error', { error, userId: presence.userId });
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(presence, event);
      } catch (error) {
        this.logger.error('[PresenceManager] Global listener error', { error });
      }
    }
  }

  private startCleanupJob(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        // Mark stale users as away
        const onlineUsers = await this.store.getOnlineUsers();
        const cutoff = Date.now() - this.staleTimeout / 2;

        for (const presence of onlineUsers) {
          if (
            presence.status === 'online' &&
            presence.lastActivityAt.getTime() < cutoff
          ) {
            await this.store.update(presence.userId, { status: 'away' });
            await this.recordChange(presence.userId, 'online', 'away', 'timeout');
            const updated = await this.store.get(presence.userId);
            if (updated) {
              this.notifyListeners(updated, 'timeout');
            }
          }
        }

        // Cleanup very stale users
        const cleaned = await this.store.cleanupStale(this.staleTimeout);
        if (cleaned > 0) {
          this.logger.debug('[PresenceManager] Cleaned up stale presences', { count: cleaned });
        }
      } catch (error) {
        this.logger.error('[PresenceManager] Cleanup job error', { error });
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop the presence manager
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPresenceManager(config?: PresenceManagerConfig): PresenceManager {
  return new PresenceManager(config);
}
