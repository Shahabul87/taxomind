/**
 * @sam-ai/agentic - Presence Tracker
 * Tracks user online/offline status and activity for proactive interventions
 */

import type {
  PresenceTrackerInterface,
  PresenceStore,
  UserPresence,
  PresenceStatus,
  PresenceStateChange,
  PresenceChangeReason,
  PresenceMetadata,
  ActivityPayload,
  RealtimeLogger,
} from './types';
import { PresenceStatus as PresenceStatusConst, PresenceChangeReason as PresenceChangeReasonConst } from './types';

// ============================================================================
// IN-MEMORY PRESENCE STORE
// ============================================================================

export class InMemoryPresenceStore implements PresenceStore {
  private presences: Map<string, UserPresence> = new Map();
  private connectionIndex: Map<string, string> = new Map(); // connectionId -> userId

  async get(userId: string): Promise<UserPresence | null> {
    return this.presences.get(userId) ?? null;
  }

  async getByConnection(connectionId: string): Promise<UserPresence | null> {
    const userId = this.connectionIndex.get(connectionId);
    if (!userId) return null;
    return this.presences.get(userId) ?? null;
  }

  async set(presence: UserPresence): Promise<void> {
    this.presences.set(presence.userId, presence);
    this.connectionIndex.set(presence.connectionId, presence.userId);
  }

  async update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null> {
    const existing = this.presences.get(userId);
    if (!existing) return null;

    const updated: UserPresence = { ...existing, ...updates };
    this.presences.set(userId, updated);
    return updated;
  }

  async delete(userId: string): Promise<boolean> {
    const presence = this.presences.get(userId);
    if (presence) {
      this.connectionIndex.delete(presence.connectionId);
    }
    return this.presences.delete(userId);
  }

  async deleteByConnection(connectionId: string): Promise<boolean> {
    const userId = this.connectionIndex.get(connectionId);
    if (!userId) return false;
    this.connectionIndex.delete(connectionId);
    return this.presences.delete(userId);
  }

  async getOnline(): Promise<UserPresence[]> {
    return Array.from(this.presences.values()).filter(
      (p) => p.status === PresenceStatusConst.ONLINE || p.status === PresenceStatusConst.STUDYING
    );
  }

  async getByStatus(status: PresenceStatus): Promise<UserPresence[]> {
    return Array.from(this.presences.values()).filter((p) => p.status === status);
  }

  async cleanup(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [userId, presence] of this.presences) {
      if (presence.lastActivityAt < olderThan && presence.status === PresenceStatusConst.OFFLINE) {
        this.connectionIndex.delete(presence.connectionId);
        this.presences.delete(userId);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.presences.clear();
    this.connectionIndex.clear();
  }
}

// ============================================================================
// PRESENCE TRACKER CONFIG
// ============================================================================

export interface PresenceTrackerConfig {
  /** Time in ms before user is considered idle (default: 60000 = 1 min) */
  idleTimeoutMs: number;
  /** Time in ms before idle user is considered away (default: 300000 = 5 min) */
  awayTimeoutMs: number;
  /** Time in ms before away user is considered offline (default: 1800000 = 30 min) */
  offlineTimeoutMs: number;
  /** Interval for checking timeouts (default: 10000 = 10 sec) */
  checkIntervalMs: number;
  /** Enable automatic timeout checking */
  autoCheckTimeouts: boolean;
}

export const DEFAULT_PRESENCE_CONFIG: PresenceTrackerConfig = {
  idleTimeoutMs: 60000,
  awayTimeoutMs: 300000,
  offlineTimeoutMs: 1800000,
  checkIntervalMs: 10000,
  autoCheckTimeouts: true,
};

// ============================================================================
// PRESENCE TRACKER
// ============================================================================

export class PresenceTracker implements PresenceTrackerInterface {
  private readonly store: PresenceStore;
  private readonly config: PresenceTrackerConfig;
  private readonly logger: RealtimeLogger;
  private readonly listeners: Set<(change: PresenceStateChange) => void> = new Set();
  private checkInterval?: ReturnType<typeof setInterval>;
  private isRunning = false;

  constructor(options: {
    store?: PresenceStore;
    config?: Partial<PresenceTrackerConfig>;
    logger?: RealtimeLogger;
  }) {
    this.store = options.store ?? new InMemoryPresenceStore();
    this.config = { ...DEFAULT_PRESENCE_CONFIG, ...options.config };
    this.logger = options.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    if (this.config.autoCheckTimeouts) {
      this.checkInterval = setInterval(() => {
        this.checkTimeouts().catch((err) => {
          this.logger.error('Error checking presence timeouts', {
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        });
      }, this.config.checkIntervalMs);
    }

    this.logger.info('Presence tracker started', {
      idleTimeoutMs: this.config.idleTimeoutMs,
      awayTimeoutMs: this.config.awayTimeoutMs,
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.logger.info('Presence tracker stopped');
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  async connect(
    userId: string,
    connectionId: string,
    metadata: PresenceMetadata
  ): Promise<UserPresence> {
    const now = new Date();

    const presence: UserPresence = {
      userId,
      connectionId,
      status: PresenceStatusConst.ONLINE,
      lastActivityAt: now,
      connectedAt: now,
      metadata,
      subscriptions: [],
    };

    await this.store.set(presence);

    this.emitChange({
      userId,
      previousStatus: PresenceStatusConst.OFFLINE,
      newStatus: PresenceStatusConst.ONLINE,
      changedAt: now,
      reason: PresenceChangeReasonConst.CONNECTED,
    });

    this.logger.info('User connected', {
      userId,
      connectionId,
      deviceType: metadata.deviceType,
    });

    return presence;
  }

  async disconnect(connectionId: string, reason?: string): Promise<void> {
    const presence = await this.store.getByConnection(connectionId);
    if (!presence) return;

    const previousStatus = presence.status;

    await this.store.update(presence.userId, {
      status: PresenceStatusConst.OFFLINE,
      lastActivityAt: new Date(),
    });

    this.emitChange({
      userId: presence.userId,
      previousStatus,
      newStatus: PresenceStatusConst.OFFLINE,
      changedAt: new Date(),
      reason: PresenceChangeReasonConst.DISCONNECTED,
    });

    this.logger.info('User disconnected', {
      userId: presence.userId,
      connectionId,
      reason,
    });
  }

  // ---------------------------------------------------------------------------
  // Activity Recording
  // ---------------------------------------------------------------------------

  async recordActivity(userId: string, activity: ActivityPayload): Promise<void> {
    const presence = await this.store.get(userId);
    if (!presence) {
      this.logger.warn('Activity recorded for unknown user', { userId, type: activity.type });
      return;
    }

    const now = new Date();
    const previousStatus = presence.status;
    let newStatus = presence.status;

    // Determine if status should change based on activity
    if (
      activity.type === 'interaction' ||
      activity.type === 'typing' ||
      activity.type === 'scroll'
    ) {
      // Active interaction -> STUDYING or ONLINE
      if (activity.pageContext?.courseId) {
        newStatus = PresenceStatusConst.STUDYING;
      } else if (previousStatus !== PresenceStatusConst.ONLINE) {
        newStatus = PresenceStatusConst.ONLINE;
      }
    } else if (activity.type === 'focus') {
      // Window regained focus -> restore to online
      if (previousStatus === PresenceStatusConst.IDLE || previousStatus === PresenceStatusConst.AWAY) {
        newStatus = PresenceStatusConst.ONLINE;
      }
    } else if (activity.type === 'blur') {
      // Window lost focus -> consider for idle soon
      // Don't change immediately, let timeout handle it
    }

    // Update presence
    await this.store.update(userId, {
      lastActivityAt: now,
      status: newStatus,
      metadata: {
        ...presence.metadata,
        location: activity.pageContext
          ? {
              pageUrl: activity.pageContext.url,
              courseId: activity.pageContext.courseId,
              sectionId: activity.pageContext.sectionId,
            }
          : presence.metadata.location,
      },
    });

    // Emit change if status changed
    if (previousStatus !== newStatus) {
      this.emitChange({
        userId,
        previousStatus,
        newStatus,
        changedAt: now,
        reason: PresenceChangeReasonConst.ACTIVITY,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Status Management
  // ---------------------------------------------------------------------------

  async getPresence(userId: string): Promise<UserPresence | null> {
    return this.store.get(userId);
  }

  async updateStatus(userId: string, status: PresenceStatus): Promise<void> {
    const presence = await this.store.get(userId);
    if (!presence) {
      this.logger.warn('Status update for unknown user', { userId, status });
      return;
    }

    const previousStatus = presence.status;
    if (previousStatus === status) return;

    await this.store.update(userId, {
      status,
      lastActivityAt: new Date(),
    });

    this.emitChange({
      userId,
      previousStatus,
      newStatus: status,
      changedAt: new Date(),
      reason: PresenceChangeReasonConst.USER_SET,
    });

    this.logger.info('User status updated', { userId, previousStatus, newStatus: status });
  }

  // ---------------------------------------------------------------------------
  // Timeout Checking
  // ---------------------------------------------------------------------------

  async checkTimeouts(): Promise<PresenceStateChange[]> {
    const changes: PresenceStateChange[] = [];
    const now = Date.now();

    const onlineUsers = await this.store.getOnline();
    const idleUsers = await this.store.getByStatus(PresenceStatusConst.IDLE);
    const awayUsers = await this.store.getByStatus(PresenceStatusConst.AWAY);

    // Check online users for idle
    for (const presence of onlineUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();

      if (inactiveMs >= this.config.awayTimeoutMs) {
        // Directly to away if past both thresholds
        const change = await this.transitionStatus(
          presence,
          PresenceStatusConst.AWAY,
          PresenceChangeReasonConst.AWAY_TIMEOUT
        );
        if (change) changes.push(change);
      } else if (inactiveMs >= this.config.idleTimeoutMs) {
        // Transition to idle
        const change = await this.transitionStatus(
          presence,
          PresenceStatusConst.IDLE,
          PresenceChangeReasonConst.IDLE_TIMEOUT
        );
        if (change) changes.push(change);
      }
    }

    // Check idle users for away
    for (const presence of idleUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();

      if (inactiveMs >= this.config.awayTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatusConst.AWAY,
          PresenceChangeReasonConst.AWAY_TIMEOUT
        );
        if (change) changes.push(change);
      }
    }

    // Check away users for offline
    for (const presence of awayUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();

      if (inactiveMs >= this.config.offlineTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatusConst.OFFLINE,
          PresenceChangeReasonConst.SESSION_END
        );
        if (change) changes.push(change);
      }
    }

    if (changes.length > 0) {
      this.logger.debug('Presence timeout changes', { count: changes.length });
    }

    return changes;
  }

  private async transitionStatus(
    presence: UserPresence,
    newStatus: PresenceStatus,
    reason: PresenceChangeReason
  ): Promise<PresenceStateChange | null> {
    const previousStatus = presence.status;
    if (previousStatus === newStatus) return null;

    await this.store.update(presence.userId, { status: newStatus });

    const change: PresenceStateChange = {
      userId: presence.userId,
      previousStatus,
      newStatus,
      changedAt: new Date(),
      reason,
    };

    this.emitChange(change);

    return change;
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  async getOnlineUsers(): Promise<UserPresence[]> {
    return this.store.getOnline();
  }

  async getStudyingUsers(): Promise<UserPresence[]> {
    return this.store.getByStatus(PresenceStatusConst.STUDYING);
  }

  async getIdleUsers(): Promise<UserPresence[]> {
    return this.store.getByStatus(PresenceStatusConst.IDLE);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.store.get(userId);
    if (!presence) return false;

    return (
      presence.status === PresenceStatusConst.ONLINE ||
      presence.status === PresenceStatusConst.STUDYING ||
      presence.status === PresenceStatusConst.IDLE
    );
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  async subscribe(userId: string, channels: string[]): Promise<void> {
    const presence = await this.store.get(userId);
    if (!presence) return;

    const currentSubs = new Set(presence.subscriptions);
    channels.forEach((ch) => currentSubs.add(ch));

    await this.store.update(userId, {
      subscriptions: Array.from(currentSubs),
    });
  }

  async unsubscribe(userId: string, channels: string[]): Promise<void> {
    const presence = await this.store.get(userId);
    if (!presence) return;

    const currentSubs = new Set(presence.subscriptions);
    channels.forEach((ch) => currentSubs.delete(ch));

    await this.store.update(userId, {
      subscriptions: Array.from(currentSubs),
    });
  }

  async getSubscribedUsers(channel: string): Promise<string[]> {
    const online = await this.store.getOnline();
    return online.filter((p) => p.subscriptions.includes(channel)).map((p) => p.userId);
  }

  // ---------------------------------------------------------------------------
  // Event Emitting
  // ---------------------------------------------------------------------------

  onPresenceChange(callback: (change: PresenceStateChange) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private emitChange(change: PresenceStateChange): void {
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (err) {
        this.logger.error('Error in presence change listener', {
          error: err instanceof Error ? err.message : 'Unknown error',
          userId: change.userId,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  async cleanup(olderThanMs: number = 86400000): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    return this.store.cleanup(cutoff);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPresenceTracker(options?: {
  store?: PresenceStore;
  config?: Partial<PresenceTrackerConfig>;
  logger?: RealtimeLogger;
}): PresenceTracker {
  return new PresenceTracker(options ?? {});
}

export function createInMemoryPresenceStore(): InMemoryPresenceStore {
  return new InMemoryPresenceStore();
}
