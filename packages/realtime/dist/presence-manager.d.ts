/**
 * @sam-ai/realtime - Presence Manager
 * Manages user presence state and broadcasts presence updates
 */
import type { PresenceManagerConfig, UserPresence, PresenceStatus, PresenceChangeReason, PresenceHistoryEntry } from './types';
export declare class PresenceManager {
    private store;
    private logger;
    private staleTimeout;
    private cleanupInterval;
    private cleanupTimer?;
    private listeners;
    private globalListeners;
    constructor(config?: PresenceManagerConfig);
    /**
     * Register a user as online
     */
    connect(userId: string, connectionId: string, options?: {
        deviceType?: 'desktop' | 'mobile' | 'tablet';
        browser?: string;
        os?: string;
        pageUrl?: string;
        courseId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<UserPresence>;
    /**
     * Mark a user as disconnected
     */
    disconnect(userId: string, reason?: PresenceChangeReason): Promise<void>;
    /**
     * Update user presence status
     */
    updateStatus(userId: string, status: PresenceStatus): Promise<UserPresence | null>;
    /**
     * Update user activity (heartbeat)
     */
    heartbeat(userId: string): Promise<boolean>;
    /**
     * Update user location (page navigation)
     */
    updateLocation(userId: string, location: {
        pageUrl?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        planId?: string;
        stepId?: string;
        goalId?: string;
    }): Promise<UserPresence | null>;
    /**
     * Get user presence
     */
    getPresence(userId: string): Promise<UserPresence | null>;
    /**
     * Get all online users
     */
    getOnlineUsers(options?: {
        courseId?: string;
        limit?: number;
    }): Promise<UserPresence[]>;
    /**
     * Get online user count
     */
    getOnlineCount(courseId?: string): Promise<number>;
    /**
     * Get user presence history
     */
    getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]>;
    /**
     * Subscribe user to a channel
     */
    subscribe(userId: string, channel: string): Promise<boolean>;
    /**
     * Unsubscribe user from a channel
     */
    unsubscribe(userId: string, channel: string): Promise<boolean>;
    /**
     * Get users subscribed to a channel
     */
    getSubscribers(channel: string): Promise<UserPresence[]>;
    /**
     * Listen for presence changes for a specific user
     */
    onUserPresenceChange(userId: string, callback: (presence: UserPresence) => void): () => void;
    /**
     * Listen for all presence changes
     */
    onPresenceChange(callback: (presence: UserPresence, event: string) => void): () => void;
    private recordChange;
    private notifyListeners;
    private startCleanupJob;
    /**
     * Stop the presence manager
     */
    stop(): void;
}
export declare function createPresenceManager(config?: PresenceManagerConfig): PresenceManager;
//# sourceMappingURL=presence-manager.d.ts.map