/**
 * @sam-ai/agentic - Presence Tracker
 * Tracks user online/offline status and activity for proactive interventions
 */
import type { PresenceTrackerInterface, PresenceStore, UserPresence, PresenceStatus, PresenceStateChange, PresenceMetadata, ActivityPayload, RealtimeLogger } from './types';
export declare class InMemoryPresenceStore implements PresenceStore {
    private presences;
    private connectionIndex;
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    deleteByConnection(connectionId: string): Promise<boolean>;
    getOnline(): Promise<UserPresence[]>;
    getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
    cleanup(olderThan: Date): Promise<number>;
    clear(): void;
}
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
export declare const DEFAULT_PRESENCE_CONFIG: PresenceTrackerConfig;
export declare class PresenceTracker implements PresenceTrackerInterface {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly listeners;
    private checkInterval?;
    private isRunning;
    constructor(options: {
        store?: PresenceStore;
        config?: Partial<PresenceTrackerConfig>;
        logger?: RealtimeLogger;
    });
    start(): void;
    stop(): void;
    connect(userId: string, connectionId: string, metadata: PresenceMetadata): Promise<UserPresence>;
    disconnect(connectionId: string, reason?: string): Promise<void>;
    recordActivity(userId: string, activity: ActivityPayload): Promise<void>;
    getPresence(userId: string): Promise<UserPresence | null>;
    updateStatus(userId: string, status: PresenceStatus): Promise<void>;
    checkTimeouts(): Promise<PresenceStateChange[]>;
    private transitionStatus;
    getOnlineUsers(): Promise<UserPresence[]>;
    getStudyingUsers(): Promise<UserPresence[]>;
    getIdleUsers(): Promise<UserPresence[]>;
    isUserOnline(userId: string): Promise<boolean>;
    subscribe(userId: string, channels: string[]): Promise<void>;
    unsubscribe(userId: string, channels: string[]): Promise<void>;
    getSubscribedUsers(channel: string): Promise<string[]>;
    onPresenceChange(callback: (change: PresenceStateChange) => void): () => void;
    private emitChange;
    cleanup(olderThanMs?: number): Promise<number>;
}
export declare function createPresenceTracker(options?: {
    store?: PresenceStore;
    config?: Partial<PresenceTrackerConfig>;
    logger?: RealtimeLogger;
}): PresenceTracker;
export declare function createInMemoryPresenceStore(): InMemoryPresenceStore;
//# sourceMappingURL=presence-tracker.d.ts.map