/**
 * @sam-ai/realtime - Presence Manager
 * Manages user presence state and broadcasts presence updates
 */
import { InMemoryPresenceStore } from './stores';
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
// ============================================================================
// PRESENCE MANAGER
// ============================================================================
export class PresenceManager {
    store;
    logger;
    staleTimeout;
    cleanupInterval;
    cleanupTimer;
    listeners = new Map();
    globalListeners = new Set();
    constructor(config = {}) {
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
    async connect(userId, connectionId, options) {
        const now = new Date();
        const existing = await this.store.get(userId);
        const presence = {
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
        }
        else {
            await this.recordChange(userId, 'offline', 'online', 'connect');
        }
        this.logger.info('[PresenceManager] User connected', { userId, connectionId });
        this.notifyListeners(presence, 'connect');
        return presence;
    }
    /**
     * Mark a user as disconnected
     */
    async disconnect(userId, reason = 'disconnect') {
        const presence = await this.store.get(userId);
        if (!presence)
            return;
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
    async updateStatus(userId, status) {
        const presence = await this.store.get(userId);
        if (!presence)
            return null;
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
    async heartbeat(userId) {
        const presence = await this.store.get(userId);
        if (!presence)
            return false;
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
    async updateLocation(userId, location) {
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
    async getPresence(userId) {
        return this.store.get(userId);
    }
    /**
     * Get all online users
     */
    async getOnlineUsers(options) {
        return this.store.getOnlineUsers(options);
    }
    /**
     * Get online user count
     */
    async getOnlineCount(courseId) {
        return this.store.getOnlineCount(courseId);
    }
    /**
     * Get user presence history
     */
    async getHistory(userId, limit) {
        return this.store.getHistory(userId, limit);
    }
    // ============================================================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================================================
    /**
     * Subscribe user to a channel
     */
    async subscribe(userId, channel) {
        const presence = await this.store.get(userId);
        if (!presence)
            return false;
        if (!presence.subscriptions.includes(channel)) {
            presence.subscriptions.push(channel);
            await this.store.update(userId, { subscriptions: presence.subscriptions });
        }
        return true;
    }
    /**
     * Unsubscribe user from a channel
     */
    async unsubscribe(userId, channel) {
        const presence = await this.store.get(userId);
        if (!presence)
            return false;
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
    async getSubscribers(channel) {
        const onlineUsers = await this.store.getOnlineUsers();
        return onlineUsers.filter((p) => p.subscriptions.includes(channel));
    }
    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================
    /**
     * Listen for presence changes for a specific user
     */
    onUserPresenceChange(userId, callback) {
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
    onPresenceChange(callback) {
        this.globalListeners.add(callback);
        return () => {
            this.globalListeners.delete(callback);
        };
    }
    // ============================================================================
    // INTERNAL METHODS
    // ============================================================================
    async recordChange(userId, previousStatus, newStatus, reason) {
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
    notifyListeners(presence, event) {
        // Notify user-specific listeners
        const userListeners = this.listeners.get(presence.userId);
        if (userListeners) {
            for (const listener of userListeners) {
                try {
                    listener(presence);
                }
                catch (error) {
                    this.logger.error('[PresenceManager] Listener error', { error, userId: presence.userId });
                }
            }
        }
        // Notify global listeners
        for (const listener of this.globalListeners) {
            try {
                listener(presence, event);
            }
            catch (error) {
                this.logger.error('[PresenceManager] Global listener error', { error });
            }
        }
    }
    startCleanupJob() {
        this.cleanupTimer = setInterval(async () => {
            try {
                // Mark stale users as away
                const onlineUsers = await this.store.getOnlineUsers();
                const cutoff = Date.now() - this.staleTimeout / 2;
                for (const presence of onlineUsers) {
                    if (presence.status === 'online' &&
                        presence.lastActivityAt.getTime() < cutoff) {
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
            }
            catch (error) {
                this.logger.error('[PresenceManager] Cleanup job error', { error });
            }
        }, this.cleanupInterval);
    }
    /**
     * Stop the presence manager
     */
    stop() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createPresenceManager(config) {
    return new PresenceManager(config);
}
//# sourceMappingURL=presence-manager.js.map