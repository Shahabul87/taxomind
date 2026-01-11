/**
 * @sam-ai/realtime - In-Memory Stores
 * Default in-memory implementations for presence and notifications
 */

import type {
  PresenceStore,
  UserPresence,
  PresenceHistoryEntry,
  NotificationStore,
  Notification,
} from './types';

// ============================================================================
// IN-MEMORY PRESENCE STORE
// ============================================================================

export class InMemoryPresenceStore implements PresenceStore {
  private presenceMap = new Map<string, UserPresence>();
  private connectionMap = new Map<string, string>(); // connectionId -> userId
  private historyMap = new Map<string, PresenceHistoryEntry[]>();

  async get(userId: string): Promise<UserPresence | null> {
    return this.presenceMap.get(userId) ?? null;
  }

  async getByConnection(connectionId: string): Promise<UserPresence | null> {
    const userId = this.connectionMap.get(connectionId);
    if (!userId) return null;
    return this.presenceMap.get(userId) ?? null;
  }

  async set(presence: UserPresence): Promise<void> {
    this.presenceMap.set(presence.userId, presence);
    this.connectionMap.set(presence.connectionId, presence.userId);
  }

  async update(
    userId: string,
    updates: Partial<UserPresence>
  ): Promise<UserPresence | null> {
    const existing = this.presenceMap.get(userId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.presenceMap.set(userId, updated);

    // Update connection map if connectionId changed
    if (updates.connectionId && updates.connectionId !== existing.connectionId) {
      this.connectionMap.delete(existing.connectionId);
      this.connectionMap.set(updates.connectionId, userId);
    }

    return updated;
  }

  async delete(userId: string): Promise<boolean> {
    const presence = this.presenceMap.get(userId);
    if (!presence) return false;

    this.connectionMap.delete(presence.connectionId);
    this.presenceMap.delete(userId);
    return true;
  }

  async getOnlineUsers(options?: {
    courseId?: string;
    limit?: number;
  }): Promise<UserPresence[]> {
    let users = Array.from(this.presenceMap.values()).filter(
      (p) => p.status !== 'offline'
    );

    if (options?.courseId) {
      users = users.filter((p) => p.courseId === options.courseId);
    }

    if (options?.limit) {
      users = users.slice(0, options.limit);
    }

    return users;
  }

  async getOnlineCount(courseId?: string): Promise<number> {
    let count = 0;
    for (const presence of this.presenceMap.values()) {
      if (presence.status === 'offline') continue;
      if (courseId && presence.courseId !== courseId) continue;
      count++;
    }
    return count;
  }

  async recordHistory(entry: Omit<PresenceHistoryEntry, 'id'>): Promise<void> {
    const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullEntry: PresenceHistoryEntry = { id, ...entry };

    const userHistory = this.historyMap.get(entry.userId) ?? [];
    userHistory.push(fullEntry);

    // Keep only last 100 entries per user
    if (userHistory.length > 100) {
      userHistory.shift();
    }

    this.historyMap.set(entry.userId, userHistory);
  }

  async getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]> {
    const history = this.historyMap.get(userId) ?? [];
    const sorted = history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async cleanupStale(maxAge: number): Promise<number> {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [userId, presence] of this.presenceMap.entries()) {
      if (presence.lastActivityAt.getTime() < cutoff) {
        this.connectionMap.delete(presence.connectionId);
        this.presenceMap.delete(userId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// IN-MEMORY NOTIFICATION STORE
// ============================================================================

export class InMemoryNotificationStore implements NotificationStore {
  private notifications = new Map<string, Notification>();
  private userNotifications = new Map<string, Set<string>>(); // userId -> Set<notificationId>

  async create(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullNotification: Notification = {
      id,
      createdAt: new Date(),
      ...notification,
    };

    this.notifications.set(id, fullNotification);

    // Index by user
    const userNotifs = this.userNotifications.get(notification.userId) ?? new Set();
    userNotifs.add(id);
    this.userNotifications.set(notification.userId, userNotifs);

    return fullNotification;
  }

  async get(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async getByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<Notification[]> {
    const userNotifIds = this.userNotifications.get(userId);
    if (!userNotifIds) return [];

    let notifications = Array.from(userNotifIds)
      .map((id) => this.notifications.get(id))
      .filter((n): n is Notification => n !== undefined);

    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.readAt);
    }

    // Sort by createdAt desc
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.readAt = new Date();
      this.notifications.set(id, notification);
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    const userNotifIds = this.userNotifications.get(userId);
    if (!userNotifIds) return 0;

    let count = 0;
    const now = new Date();

    for (const id of userNotifIds) {
      const notification = this.notifications.get(id);
      if (notification && !notification.readAt) {
        notification.readAt = now;
        this.notifications.set(id, notification);
        count++;
      }
    }

    return count;
  }

  async delete(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    // Remove from user index
    const userNotifs = this.userNotifications.get(notification.userId);
    if (userNotifs) {
      userNotifs.delete(id);
    }

    this.notifications.delete(id);
    return true;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    let deleted = 0;

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        // Remove from user index
        const userNotifs = this.userNotifications.get(notification.userId);
        if (userNotifs) {
          userNotifs.delete(id);
        }

        this.notifications.delete(id);
        deleted++;
      }
    }

    return deleted;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createInMemoryPresenceStore(): InMemoryPresenceStore {
  return new InMemoryPresenceStore();
}

export function createInMemoryNotificationStore(): InMemoryNotificationStore {
  return new InMemoryNotificationStore();
}
