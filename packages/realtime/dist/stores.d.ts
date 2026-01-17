/**
 * @sam-ai/realtime - In-Memory Stores
 * Default in-memory implementations for presence and notifications
 */
import type { PresenceStore, UserPresence, PresenceHistoryEntry, NotificationStore, Notification } from './types';
export declare class InMemoryPresenceStore implements PresenceStore {
    private presenceMap;
    private connectionMap;
    private historyMap;
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    getOnlineUsers(options?: {
        courseId?: string;
        limit?: number;
    }): Promise<UserPresence[]>;
    getOnlineCount(courseId?: string): Promise<number>;
    recordHistory(entry: Omit<PresenceHistoryEntry, 'id'>): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]>;
    cleanupStale(maxAge: number): Promise<number>;
}
export declare class InMemoryNotificationStore implements NotificationStore {
    private notifications;
    private userNotifications;
    create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
    get(id: string): Promise<Notification | null>;
    getByUser(userId: string, options?: {
        unreadOnly?: boolean;
        limit?: number;
    }): Promise<Notification[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<number>;
    delete(id: string): Promise<boolean>;
    deleteExpired(): Promise<number>;
}
export declare function createInMemoryPresenceStore(): InMemoryPresenceStore;
export declare function createInMemoryNotificationStore(): InMemoryNotificationStore;
//# sourceMappingURL=stores.d.ts.map