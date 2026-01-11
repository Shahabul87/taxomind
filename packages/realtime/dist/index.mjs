// src/types.ts
import { z } from "zod";
var PresenceStatusSchema = z.enum(["online", "away", "busy", "offline"]);
var UserPresenceSchema = z.object({
  userId: z.string(),
  connectionId: z.string(),
  status: PresenceStatusSchema,
  lastActivityAt: z.date(),
  connectedAt: z.date(),
  disconnectedAt: z.date().optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  pageUrl: z.string().optional(),
  planId: z.string().optional(),
  stepId: z.string().optional(),
  goalId: z.string().optional(),
  subscriptions: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional()
});
var PresenceChangeReasonSchema = z.enum([
  "connect",
  "disconnect",
  "timeout",
  "activity",
  "manual",
  "navigation"
]);
var RealtimeEventTypeSchema = z.enum([
  // Presence events
  "presence:connect",
  "presence:disconnect",
  "presence:update",
  "presence:heartbeat",
  // Notification events
  "notification:intervention",
  "notification:checkin",
  "notification:achievement",
  "notification:reminder",
  "notification:custom",
  // Learning events
  "learning:goal_progress",
  "learning:plan_update",
  "learning:step_complete",
  "learning:recommendation",
  // Sync events
  "sync:form_data",
  "sync:state_update",
  // System events
  "system:error",
  "system:reconnect",
  "system:maintenance"
]);
var RealtimeEventSchema = z.object({
  id: z.string(),
  type: RealtimeEventTypeSchema,
  userId: z.string(),
  timestamp: z.date(),
  payload: z.record(z.unknown()),
  channel: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  ttl: z.number().optional(),
  // Time-to-live in seconds
  requiresAck: z.boolean().default(false)
});
var ChannelTypeSchema = z.enum([
  "user",
  // Private channel for a specific user
  "course",
  // Channel for a course
  "broadcast",
  // Broadcast to all connected users
  "admin"
  // Admin-only channel
]);
var MessageTypeSchema = z.enum([
  "event",
  // Real-time event
  "ack",
  // Acknowledgment
  "ping",
  // Heartbeat ping
  "pong",
  // Heartbeat pong
  "subscribe",
  // Subscribe to channel
  "unsubscribe",
  // Unsubscribe from channel
  "error"
  // Error message
]);
var WebSocketMessageSchema = z.object({
  type: MessageTypeSchema,
  id: z.string(),
  timestamp: z.number(),
  payload: z.unknown()
});
var NotificationPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
var NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    "intervention",
    "checkin",
    "achievement",
    "reminder",
    "goal_update",
    "recommendation",
    "system"
  ]),
  title: z.string(),
  message: z.string(),
  priority: NotificationPrioritySchema.default("normal"),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  iconType: z.string().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  readAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});

// src/stores.ts
var InMemoryPresenceStore = class {
  presenceMap = /* @__PURE__ */ new Map();
  connectionMap = /* @__PURE__ */ new Map();
  // connectionId -> userId
  historyMap = /* @__PURE__ */ new Map();
  async get(userId) {
    return this.presenceMap.get(userId) ?? null;
  }
  async getByConnection(connectionId) {
    const userId = this.connectionMap.get(connectionId);
    if (!userId) return null;
    return this.presenceMap.get(userId) ?? null;
  }
  async set(presence) {
    this.presenceMap.set(presence.userId, presence);
    this.connectionMap.set(presence.connectionId, presence.userId);
  }
  async update(userId, updates) {
    const existing = this.presenceMap.get(userId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.presenceMap.set(userId, updated);
    if (updates.connectionId && updates.connectionId !== existing.connectionId) {
      this.connectionMap.delete(existing.connectionId);
      this.connectionMap.set(updates.connectionId, userId);
    }
    return updated;
  }
  async delete(userId) {
    const presence = this.presenceMap.get(userId);
    if (!presence) return false;
    this.connectionMap.delete(presence.connectionId);
    this.presenceMap.delete(userId);
    return true;
  }
  async getOnlineUsers(options) {
    let users = Array.from(this.presenceMap.values()).filter(
      (p) => p.status !== "offline"
    );
    if (options?.courseId) {
      users = users.filter((p) => p.courseId === options.courseId);
    }
    if (options?.limit) {
      users = users.slice(0, options.limit);
    }
    return users;
  }
  async getOnlineCount(courseId) {
    let count = 0;
    for (const presence of this.presenceMap.values()) {
      if (presence.status === "offline") continue;
      if (courseId && presence.courseId !== courseId) continue;
      count++;
    }
    return count;
  }
  async recordHistory(entry) {
    const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullEntry = { id, ...entry };
    const userHistory = this.historyMap.get(entry.userId) ?? [];
    userHistory.push(fullEntry);
    if (userHistory.length > 100) {
      userHistory.shift();
    }
    this.historyMap.set(entry.userId, userHistory);
  }
  async getHistory(userId, limit) {
    const history = this.historyMap.get(userId) ?? [];
    const sorted = history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }
  async cleanupStale(maxAge) {
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
};
var InMemoryNotificationStore = class {
  notifications = /* @__PURE__ */ new Map();
  userNotifications = /* @__PURE__ */ new Map();
  // userId -> Set<notificationId>
  async create(notification) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullNotification = {
      id,
      createdAt: /* @__PURE__ */ new Date(),
      ...notification
    };
    this.notifications.set(id, fullNotification);
    const userNotifs = this.userNotifications.get(notification.userId) ?? /* @__PURE__ */ new Set();
    userNotifs.add(id);
    this.userNotifications.set(notification.userId, userNotifs);
    return fullNotification;
  }
  async get(id) {
    return this.notifications.get(id) ?? null;
  }
  async getByUser(userId, options) {
    const userNotifIds = this.userNotifications.get(userId);
    if (!userNotifIds) return [];
    let notifications = Array.from(userNotifIds).map((id) => this.notifications.get(id)).filter((n) => n !== void 0);
    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.readAt);
    }
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }
    return notifications;
  }
  async markAsRead(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.readAt = /* @__PURE__ */ new Date();
      this.notifications.set(id, notification);
    }
  }
  async markAllAsRead(userId) {
    const userNotifIds = this.userNotifications.get(userId);
    if (!userNotifIds) return 0;
    let count = 0;
    const now = /* @__PURE__ */ new Date();
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
  async delete(id) {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    const userNotifs = this.userNotifications.get(notification.userId);
    if (userNotifs) {
      userNotifs.delete(id);
    }
    this.notifications.delete(id);
    return true;
  }
  async deleteExpired() {
    const now = /* @__PURE__ */ new Date();
    let deleted = 0;
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
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
};
function createInMemoryPresenceStore() {
  return new InMemoryPresenceStore();
}
function createInMemoryNotificationStore() {
  return new InMemoryNotificationStore();
}

// src/presence-manager.ts
var defaultLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var PresenceManager = class {
  store;
  logger;
  staleTimeout;
  cleanupInterval;
  cleanupTimer;
  listeners = /* @__PURE__ */ new Map();
  globalListeners = /* @__PURE__ */ new Set();
  constructor(config = {}) {
    this.store = config.store ?? new InMemoryPresenceStore();
    this.logger = config.logger ?? defaultLogger;
    this.staleTimeout = config.staleTimeout ?? 5 * 60 * 1e3;
    this.cleanupInterval = config.cleanupInterval ?? 60 * 1e3;
    this.startCleanupJob();
  }
  // ============================================================================
  // PRESENCE OPERATIONS
  // ============================================================================
  /**
   * Register a user as online
   */
  async connect(userId, connectionId, options) {
    const now = /* @__PURE__ */ new Date();
    const existing = await this.store.get(userId);
    const presence = {
      userId,
      connectionId,
      status: "online",
      lastActivityAt: now,
      connectedAt: existing?.connectedAt ?? now,
      deviceType: options?.deviceType,
      browser: options?.browser,
      os: options?.os,
      pageUrl: options?.pageUrl,
      courseId: options?.courseId,
      subscriptions: existing?.subscriptions ?? [],
      metadata: options?.metadata
    };
    await this.store.set(presence);
    if (existing) {
      await this.recordChange(userId, existing.status, "online", "connect");
    } else {
      await this.recordChange(userId, "offline", "online", "connect");
    }
    this.logger.info("[PresenceManager] User connected", { userId, connectionId });
    this.notifyListeners(presence, "connect");
    return presence;
  }
  /**
   * Mark a user as disconnected
   */
  async disconnect(userId, reason = "disconnect") {
    const presence = await this.store.get(userId);
    if (!presence) return;
    const previousStatus = presence.status;
    await this.store.update(userId, {
      status: "offline",
      disconnectedAt: /* @__PURE__ */ new Date()
    });
    await this.recordChange(userId, previousStatus, "offline", reason);
    this.logger.info("[PresenceManager] User disconnected", { userId, reason });
    const updated = await this.store.get(userId);
    if (updated) {
      this.notifyListeners(updated, "disconnect");
    }
  }
  /**
   * Update user presence status
   */
  async updateStatus(userId, status) {
    const presence = await this.store.get(userId);
    if (!presence) return null;
    const previousStatus = presence.status;
    const updated = await this.store.update(userId, {
      status,
      lastActivityAt: /* @__PURE__ */ new Date()
    });
    if (updated && previousStatus !== status) {
      await this.recordChange(userId, previousStatus, status, "manual");
      this.notifyListeners(updated, "status_change");
    }
    return updated;
  }
  /**
   * Update user activity (heartbeat)
   */
  async heartbeat(userId) {
    const presence = await this.store.get(userId);
    if (!presence) return false;
    const wasAway = presence.status === "away";
    await this.store.update(userId, {
      lastActivityAt: /* @__PURE__ */ new Date(),
      status: wasAway ? "online" : presence.status
    });
    if (wasAway) {
      await this.recordChange(userId, "away", "online", "activity");
      const updated = await this.store.get(userId);
      if (updated) {
        this.notifyListeners(updated, "activity");
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
      lastActivityAt: /* @__PURE__ */ new Date()
    });
    if (updated) {
      this.notifyListeners(updated, "navigation");
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
  async unsubscribe(userId, channel) {
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
    const listeners = this.listeners.get(userId) ?? /* @__PURE__ */ new Set();
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
      changedAt: /* @__PURE__ */ new Date(),
      courseId: presence?.courseId,
      pageUrl: presence?.pageUrl,
      sessionDuration: presence?.connectedAt ? Math.floor((Date.now() - presence.connectedAt.getTime()) / 1e3) : void 0
    });
  }
  notifyListeners(presence, event) {
    const userListeners = this.listeners.get(presence.userId);
    if (userListeners) {
      for (const listener of userListeners) {
        try {
          listener(presence);
        } catch (error) {
          this.logger.error("[PresenceManager] Listener error", { error, userId: presence.userId });
        }
      }
    }
    for (const listener of this.globalListeners) {
      try {
        listener(presence, event);
      } catch (error) {
        this.logger.error("[PresenceManager] Global listener error", { error });
      }
    }
  }
  startCleanupJob() {
    this.cleanupTimer = setInterval(async () => {
      try {
        const onlineUsers = await this.store.getOnlineUsers();
        const cutoff = Date.now() - this.staleTimeout / 2;
        for (const presence of onlineUsers) {
          if (presence.status === "online" && presence.lastActivityAt.getTime() < cutoff) {
            await this.store.update(presence.userId, { status: "away" });
            await this.recordChange(presence.userId, "online", "away", "timeout");
            const updated = await this.store.get(presence.userId);
            if (updated) {
              this.notifyListeners(updated, "timeout");
            }
          }
        }
        const cleaned = await this.store.cleanupStale(this.staleTimeout);
        if (cleaned > 0) {
          this.logger.debug("[PresenceManager] Cleaned up stale presences", { count: cleaned });
        }
      } catch (error) {
        this.logger.error("[PresenceManager] Cleanup job error", { error });
      }
    }, this.cleanupInterval);
  }
  /**
   * Stop the presence manager
   */
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
  }
};
function createPresenceManager(config) {
  return new PresenceManager(config);
}

// src/event-dispatcher.ts
var defaultLogger2 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var EventDispatcher = class {
  logger;
  notificationStore;
  maxRetries;
  retryDelay;
  batchSize;
  // Event handlers by type
  handlers = /* @__PURE__ */ new Map();
  // User-specific handlers
  userHandlers = /* @__PURE__ */ new Map();
  // Channel subscribers
  channelSubscribers = /* @__PURE__ */ new Map();
  // channelId -> Set<userId>
  // Event queue for retry
  eventQueue = [];
  // Stats
  stats = {
    totalDispatched: 0,
    totalDelivered: 0,
    totalFailed: 0,
    pendingQueue: 0,
    subscriberCount: 0
  };
  constructor(config = {}) {
    this.notificationStore = config.store ?? new InMemoryNotificationStore();
    this.logger = config.logger ?? defaultLogger2;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1e3;
    this.batchSize = config.batchSize ?? 100;
  }
  // ============================================================================
  // EVENT SUBSCRIPTION
  // ============================================================================
  /**
   * Subscribe to events of a specific type
   */
  on(eventType, handler) {
    const handlers = this.handlers.get(eventType) ?? /* @__PURE__ */ new Set();
    handlers.add(handler);
    this.handlers.set(eventType, handlers);
    this.updateStats();
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
      this.updateStats();
    };
  }
  /**
   * Subscribe to events for a specific user
   */
  onUser(userId, handler) {
    const handlers = this.userHandlers.get(userId) ?? /* @__PURE__ */ new Set();
    handlers.add(handler);
    this.userHandlers.set(userId, handlers);
    this.updateStats();
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.userHandlers.delete(userId);
      }
      this.updateStats();
    };
  }
  /**
   * Subscribe a user to a channel
   */
  subscribeToChannel(userId, channelId) {
    const subscribers = this.channelSubscribers.get(channelId) ?? /* @__PURE__ */ new Set();
    subscribers.add(userId);
    this.channelSubscribers.set(channelId, subscribers);
  }
  /**
   * Unsubscribe a user from a channel
   */
  unsubscribeFromChannel(userId, channelId) {
    const subscribers = this.channelSubscribers.get(channelId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channelId);
      }
    }
  }
  /**
   * Get channel subscribers
   */
  getChannelSubscribers(channelId) {
    const subscribers = this.channelSubscribers.get(channelId);
    return subscribers ? Array.from(subscribers) : [];
  }
  // ============================================================================
  // EVENT DISPATCH
  // ============================================================================
  /**
   * Dispatch an event to subscribers
   */
  async dispatch(event) {
    this.stats.totalDispatched++;
    try {
      const handlers = [];
      const typeHandlers = this.handlers.get(event.type);
      if (typeHandlers) {
        handlers.push(...typeHandlers);
      }
      const wildcardHandlers = this.handlers.get("*");
      if (wildcardHandlers) {
        handlers.push(...wildcardHandlers);
      }
      const userHandlers = this.userHandlers.get(event.userId);
      if (userHandlers) {
        handlers.push(...userHandlers);
      }
      if (event.channel) {
        const channelUsers = this.channelSubscribers.get(event.channel);
        if (channelUsers) {
          for (const userId of channelUsers) {
            const userHandler = this.userHandlers.get(userId);
            if (userHandler) {
              handlers.push(...userHandler);
            }
          }
        }
      }
      const results = await Promise.allSettled(
        handlers.map((handler) => handler(event))
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        this.logger.warn("[EventDispatcher] Some handlers failed", {
          eventId: event.id,
          totalHandlers: handlers.length,
          failedCount: failed.length
        });
      }
      this.stats.totalDelivered++;
      this.logger.debug("[EventDispatcher] Event dispatched", {
        eventId: event.id,
        type: event.type,
        handlerCount: handlers.length
      });
      return {
        eventId: event.id,
        delivered: true,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      this.stats.totalFailed++;
      if (this.eventQueue.length < 1e3) {
        this.eventQueue.push({ event, retries: 0 });
        this.stats.pendingQueue = this.eventQueue.length;
      }
      this.logger.error("[EventDispatcher] Dispatch failed", {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        eventId: event.id,
        delivered: false,
        timestamp: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Dispatch event to a specific user
   */
  async dispatchToUser(userId, eventType, payload, options) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: eventType,
      userId,
      timestamp: /* @__PURE__ */ new Date(),
      payload,
      channel: options?.channel,
      priority: options?.priority ?? "normal",
      requiresAck: false
    };
    return this.dispatch(event);
  }
  /**
   * Dispatch event to a channel
   */
  async dispatchToChannel(channelId, eventType, payload, options) {
    const subscribers = this.getChannelSubscribers(channelId);
    const excludeSet = new Set(options?.excludeUsers ?? []);
    const results = [];
    for (const userId of subscribers) {
      if (excludeSet.has(userId)) continue;
      const result = await this.dispatchToUser(userId, eventType, payload, {
        priority: options?.priority,
        channel: channelId
      });
      results.push(result);
    }
    return results;
  }
  /**
   * Broadcast to all connected users
   */
  async broadcast(eventType, payload, options) {
    const excludeSet = new Set(options?.excludeUsers ?? []);
    let dispatched = 0;
    for (const userId of this.userHandlers.keys()) {
      if (excludeSet.has(userId)) continue;
      await this.dispatchToUser(userId, eventType, payload, {
        priority: options?.priority
      });
      dispatched++;
    }
    return dispatched;
  }
  // ============================================================================
  // NOTIFICATION HELPERS
  // ============================================================================
  /**
   * Send a notification to a user
   */
  async sendNotification(notification) {
    const stored = await this.notificationStore.create(notification);
    await this.dispatchToUser(notification.userId, `notification:${notification.type}`, {
      notification: stored
    }, {
      priority: notification.priority
    });
    this.logger.info("[EventDispatcher] Notification sent", {
      id: stored.id,
      userId: notification.userId,
      type: notification.type
    });
    return stored;
  }
  /**
   * Send an intervention notification
   */
  async sendIntervention(userId, intervention) {
    return this.sendNotification({
      userId,
      type: "intervention",
      title: intervention.title,
      message: intervention.message,
      actionUrl: intervention.actionUrl,
      actionLabel: intervention.actionLabel,
      priority: intervention.priority ?? "high",
      metadata: intervention.metadata
    });
  }
  /**
   * Send a check-in notification
   */
  async sendCheckIn(userId, checkIn) {
    return this.sendNotification({
      userId,
      type: "checkin",
      title: checkIn.title,
      message: checkIn.message,
      actionUrl: checkIn.actionUrl,
      actionLabel: checkIn.actionLabel,
      priority: "normal",
      expiresAt: checkIn.expiresAt,
      metadata: checkIn.metadata
    });
  }
  /**
   * Send an achievement notification
   */
  async sendAchievement(userId, achievement) {
    return this.sendNotification({
      userId,
      type: "achievement",
      title: achievement.title,
      message: achievement.message,
      iconType: achievement.iconType ?? "trophy",
      priority: "normal",
      metadata: achievement.metadata
    });
  }
  // ============================================================================
  // RETRY LOGIC
  // ============================================================================
  /**
   * Process retry queue
   */
  async processRetryQueue() {
    const batch = this.eventQueue.splice(0, this.batchSize);
    this.stats.pendingQueue = this.eventQueue.length;
    for (const item of batch) {
      if (item.retries >= this.maxRetries) {
        this.logger.warn("[EventDispatcher] Event exceeded max retries", {
          eventId: item.event.id,
          retries: item.retries
        });
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      const result = await this.dispatch(item.event);
      if (!result.delivered) {
        this.eventQueue.push({ event: item.event, retries: item.retries + 1 });
        this.stats.pendingQueue = this.eventQueue.length;
      }
    }
  }
  // ============================================================================
  // STATS & UTILITIES
  // ============================================================================
  /**
   * Get dispatcher stats
   */
  getStats() {
    return { ...this.stats };
  }
  updateStats() {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    for (const handlers of this.userHandlers.values()) {
      count += handlers.size;
    }
    this.stats.subscriberCount = count;
  }
  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
    this.userHandlers.clear();
    this.channelSubscribers.clear();
    this.eventQueue = [];
    this.stats = {
      totalDispatched: 0,
      totalDelivered: 0,
      totalFailed: 0,
      pendingQueue: 0,
      subscriberCount: 0
    };
  }
};
function createEventDispatcher(config) {
  return new EventDispatcher(config);
}

// src/index.ts
var PACKAGE_NAME = "@sam-ai/realtime";
var PACKAGE_VERSION = "0.1.0";
var REALTIME_CAPABILITIES = {
  PRESENCE: "realtime:presence",
  EVENTS: "realtime:events",
  NOTIFICATIONS: "realtime:notifications",
  CHANNELS: "realtime:channels"
};
function hasCapability(capability) {
  switch (capability) {
    case REALTIME_CAPABILITIES.PRESENCE:
    case REALTIME_CAPABILITIES.EVENTS:
    case REALTIME_CAPABILITIES.NOTIFICATIONS:
    case REALTIME_CAPABILITIES.CHANNELS:
      return true;
    default:
      return false;
  }
}
function createRealtimeSystem(config = {}) {
  const logger = config.logger;
  const presence = new PresenceManager({
    store: config.presenceStore,
    logger,
    ...config.presence
  });
  const dispatcher = new EventDispatcher({
    store: config.notificationStore,
    logger,
    ...config.dispatcher
  });
  presence.onPresenceChange((presenceData, event) => {
    void dispatcher.dispatch({
      id: `presence_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: `presence:${event}`,
      userId: presenceData.userId,
      timestamp: /* @__PURE__ */ new Date(),
      payload: { presence: presenceData },
      priority: "low",
      requiresAck: false
    });
  });
  return {
    presence,
    dispatcher
  };
}
export {
  ChannelTypeSchema,
  EventDispatcher,
  InMemoryNotificationStore,
  InMemoryPresenceStore,
  MessageTypeSchema,
  NotificationPrioritySchema,
  NotificationSchema,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  PresenceChangeReasonSchema,
  PresenceManager,
  PresenceStatusSchema,
  REALTIME_CAPABILITIES,
  RealtimeEventSchema,
  RealtimeEventTypeSchema,
  UserPresenceSchema,
  WebSocketMessageSchema,
  createEventDispatcher,
  createInMemoryNotificationStore,
  createInMemoryPresenceStore,
  createPresenceManager,
  createRealtimeSystem,
  hasCapability
};
