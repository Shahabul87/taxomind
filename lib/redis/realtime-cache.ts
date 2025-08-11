// Real-time Data Caching System for Live Features

import { cacheManager, CacheLayer } from './cache-manager';
import { redis, REDIS_KEYS } from './config';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

// Real-time data types
interface RealTimeEvent {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  courseId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface LiveSession {
  sessionId: string;
  userId: string;
  courseId?: string;
  startTime: number;
  lastActivity: number;
  status: 'active' | 'idle' | 'offline';
  metadata: Record<string, any>;
}

interface RealTimeNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: number;
}

interface LiveChatMessage {
  id: string;
  chatId: string;
  userId: string;
  message: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

// Real-time cache configuration
const REALTIME_CACHE_CONFIG = {
  EVENTS: {
    ttl: 60, // 1 minute
    layer: CacheLayer.REALTIME,
    tags: ['realtime', 'events']
  },
  SESSIONS: {
    ttl: 300, // 5 minutes
    layer: CacheLayer.REALTIME,
    tags: ['realtime', 'sessions']
  },
  NOTIFICATIONS: {
    ttl: 3600, // 1 hour
    layer: CacheLayer.REALTIME,
    tags: ['realtime', 'notifications']
  },
  CHAT_MESSAGES: {
    ttl: 1800, // 30 minutes
    layer: CacheLayer.REALTIME,
    tags: ['realtime', 'chat']
  },
  PRESENCE: {
    ttl: 30, // 30 seconds
    layer: CacheLayer.REALTIME,
    tags: ['realtime', 'presence']
  }
} as const;

export class RealTimeCacheManager extends EventEmitter {
  private static instance: RealTimeCacheManager;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.startHeartbeat();
    this.startCleanup();
  }

  static getInstance(): RealTimeCacheManager {
    if (!RealTimeCacheManager.instance) {
      RealTimeCacheManager.instance = new RealTimeCacheManager();
    }
    return RealTimeCacheManager.instance;
  }

  // Cache real-time event
  async cacheRealTimeEvent(event: RealTimeEvent): Promise<void> {
    try {
      const eventKey = `event:${event.id}`;
      
      await cacheManager.set(eventKey, event, REALTIME_CACHE_CONFIG.EVENTS);
      
      // Add to event stream
      await this.addToEventStream(event);
      
      // Emit event for subscribers
      this.emit('event', event);
    } catch (error: any) {
      logger.error('Error caching real-time event:', error);
    }
  }

  // Get recent events
  async getRecentEvents(
    limit: number = 50,
    filters?: {
      type?: string;
      userId?: string;
      courseId?: string;
      since?: number;
    }
  ): Promise<RealTimeEvent[]> {
    try {
      const streamKey = 'events:stream';
      const since = filters?.since || (Date.now() - 60000); // Last minute
      
      const events = await redis.zrangebyscore(
        streamKey,
        since,
        Date.now(),
        { limit: { offset: 0, count: limit }, withScores: true }
      );
      
      const parsedEvents: RealTimeEvent[] = [];
      
      for (const item of events) {
        try {
          const event = JSON.parse(item.member);
          
          // Apply filters
          if (filters?.type && event.type !== filters.type) continue;
          if (filters?.userId && event.userId !== filters.userId) continue;
          if (filters?.courseId && event.courseId !== filters.courseId) continue;
          
          parsedEvents.push(event);
        } catch (parseError) {
          logger.error('Error parsing event:', parseError);
        }
      }
      
      return parsedEvents.reverse(); // Most recent first
    } catch (error: any) {
      logger.error('Error getting recent events:', error);
      return [];
    }
  }

  // Manage live sessions
  async updateLiveSession(session: LiveSession): Promise<void> {
    try {
      const sessionKey = `session:${session.sessionId}`;
      
      await cacheManager.set(sessionKey, session, REALTIME_CACHE_CONFIG.SESSIONS);
      
      // Update user's active session
      await this.updateUserActiveSession(session.userId, session.sessionId);
      
      // Update course participants if courseId exists
      if (session.courseId) {
        await this.updateCourseParticipants(session.courseId, session.userId, session.status);
      }
      
      // Emit session update event
      this.emit('sessionUpdate', session);
    } catch (error: any) {
      logger.error('Error updating live session:', error);
    }
  }

  // Get live session
  async getLiveSession(sessionId: string): Promise<LiveSession | null> {
    try {
      const sessionKey = `session:${sessionId}`;
      
      return await cacheManager.get<LiveSession>(sessionKey, REALTIME_CACHE_CONFIG.SESSIONS);
    } catch (error: any) {
      logger.error('Error getting live session:', error);
      return null;
    }
  }

  // Get user's active sessions
  async getUserActiveSessions(userId: string): Promise<LiveSession[]> {
    try {
      const userSessionsKey = `user:${userId}:sessions`;
      const sessionIds = await redis.smembers(userSessionsKey) || [];
      
      const sessions: LiveSession[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getLiveSession(sessionId);
        if (session && session.status === 'active') {
          sessions.push(session);
        }
      }
      
      return sessions;
    } catch (error: any) {
      logger.error('Error getting user active sessions:', error);
      return [];
    }
  }

  // Get course participants
  async getCourseParticipants(courseId: string): Promise<{
    online: string[];
    idle: string[];
    total: number;
  }> {
    try {
      const courseKey = `Course:${courseId}:participants`;
      const participants = await redis.hgetall(courseKey) || {};
      
      const online: string[] = [];
      const idle: string[] = [];
      
      for (const [userId, status] of Object.entries(participants)) {
        if (status === 'active') {
          online.push(userId);
        } else if (status === 'idle') {
          idle.push(userId);
        }
      }
      
      return {
        online,
        idle,
        total: online.length + idle.length
      };
    } catch (error: any) {
      logger.error('Error getting course participants:', error);
      return { online: [], idle: [], total: 0 };
    }
  }

  // Cache real-time notification
  async cacheNotification(notification: RealTimeNotification): Promise<void> {
    try {
      const notificationKey = `notification:${notification.id}`;
      
      await cacheManager.set(notificationKey, notification, REALTIME_CACHE_CONFIG.NOTIFICATIONS);
      
      // Add to user's notification list
      await this.addToUserNotifications(notification.userId, notification.id);
      
      // Emit notification event
      this.emit('notification', notification);
    } catch (error: any) {
      logger.error('Error caching notification:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<RealTimeNotification[]> {
    try {
      const userNotificationsKey = `user:${userId}:notifications`;
      const notificationIds = await redis.zrevrange(userNotificationsKey, 0, limit - 1);
      
      const notifications: RealTimeNotification[] = [];
      
      for (const notificationId of notificationIds) {
        const notificationKey = `notification:${notificationId}`;
        const notification = await cacheManager.get<RealTimeNotification>(
          notificationKey,
          REALTIME_CACHE_CONFIG.NOTIFICATIONS
        );
        
        if (notification) {
          if (unreadOnly && notification.read) continue;
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error: any) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationKey = `notification:${notificationId}`;
      const notification = await cacheManager.get<RealTimeNotification>(
        notificationKey,
        REALTIME_CACHE_CONFIG.NOTIFICATIONS
      );
      
      if (notification) {
        notification.read = true;
        await cacheManager.set(notificationKey, notification, REALTIME_CACHE_CONFIG.NOTIFICATIONS);
        
        // Emit read event
        this.emit('notificationRead', notification);
      }
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Cache chat message
  async cacheChatMessage(message: LiveChatMessage): Promise<void> {
    try {
      const messageKey = `chat:message:${message.id}`;
      
      await cacheManager.set(messageKey, message, REALTIME_CACHE_CONFIG.CHAT_MESSAGES);
      
      // Add to chat message stream
      await this.addToChatStream(message.chatId, message);
      
      // Emit chat message event
      this.emit('chatMessage', message);
    } catch (error: any) {
      logger.error('Error caching chat message:', error);
    }
  }

  // Get chat messages
  async getChatMessages(
    chatId: string,
    limit: number = 50,
    before?: number
  ): Promise<LiveChatMessage[]> {
    try {
      const chatStreamKey = `chat:${chatId}:stream`;
      const maxScore = before || Date.now();
      
      const messages = await redis.zrevrangebyscore(
        chatStreamKey,
        maxScore,
        0,
        { limit: { offset: 0, count: limit }, withScores: true }
      );
      
      const parsedMessages: LiveChatMessage[] = [];
      
      for (const item of messages) {
        try {
          const message = JSON.parse(item.member);
          parsedMessages.push(message);
        } catch (parseError) {
          logger.error('Error parsing chat message:', parseError);
        }
      }
      
      return parsedMessages;
    } catch (error: any) {
      logger.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Update user presence
  async updateUserPresence(
    userId: string,
    status: 'online' | 'away' | 'busy' | 'offline',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const presenceKey = `presence:${userId}`;
      
      const presenceData = {
        userId,
        status,
        lastSeen: Date.now(),
        metadata: metadata || {
}
      };
      
      await cacheManager.set(presenceKey, presenceData, REALTIME_CACHE_CONFIG.PRESENCE);
      
      // Update global presence list
      await this.updateGlobalPresence(userId, status);
      
      // Emit presence update event
      this.emit('presenceUpdate', presenceData);
    } catch (error: any) {
      logger.error('Error updating user presence:', error);
    }
  }

  // Get user presence
  async getUserPresence(userId: string): Promise<{
    status: string;
    lastSeen: number;
    metadata?: Record<string, any>;
  } | null> {
    try {
      const presenceKey = `presence:${userId}`;
      
      return await cacheManager.get<{
        status: string;
        lastSeen: number;
        metadata?: Record<string, any>;
      }>(presenceKey, REALTIME_CACHE_CONFIG.PRESENCE);
    } catch (error: any) {
      logger.error('Error getting user presence:', error);
      return null;
    }
  }

  // Get online users
  async getOnlineUsers(): Promise<string[]> {
    try {
      const onlineUsersKey = 'presence:online';
      return await redis.smembers(onlineUsersKey) || [];
    } catch (error: any) {
      logger.error('Error getting online users:', error);
      return [];
    }
  }

  // Private helper methods
  private async addToEventStream(event: RealTimeEvent): Promise<void> {
    const streamKey = 'events:stream';
    
    await redis.zadd(streamKey, {
      score: event.timestamp,
      member: JSON.stringify(event)
    });
    
    // Keep only last 1000 events
    await redis.zremrangebyrank(streamKey, 0, -1001);
  }

  private async updateUserActiveSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = `user:${userId}:sessions`;
    
    await redis.sadd(userSessionsKey, sessionId);
    await redis.expire(userSessionsKey, 300); // 5 minutes
  }

  private async updateCourseParticipants(
    courseId: string,
    userId: string,
    status: string
  ): Promise<void> {
    const courseKey = `Course:${courseId}:participants`;
    
    if (status === 'offline') {
      await redis.hdel(courseKey, userId);
    } else {
      await redis.hset(courseKey, userId, status);
    }
    
    await redis.expire(courseKey, 300); // 5 minutes
  }

  private async addToUserNotifications(userId: string, notificationId: string): Promise<void> {
    const userNotificationsKey = `user:${userId}:notifications`;
    
    await redis.zadd(userNotificationsKey, {
      score: Date.now(),
      member: notificationId
    });
    
    // Keep only last 100 notifications
    await redis.zremrangebyrank(userNotificationsKey, 0, -101);
  }

  private async addToChatStream(chatId: string, message: LiveChatMessage): Promise<void> {
    const chatStreamKey = `chat:${chatId}:stream`;
    
    await redis.zadd(chatStreamKey, {
      score: message.timestamp,
      member: JSON.stringify(message)
    });
    
    // Keep only last 1000 messages
    await redis.zremrangebyrank(chatStreamKey, 0, -1001);
  }

  private async updateGlobalPresence(userId: string, status: string): Promise<void> {
    const onlineUsersKey = 'presence:online';
    
    if (status === 'online') {
      await redis.sadd(onlineUsersKey, userId);
    } else {
      await redis.srem(onlineUsersKey, userId);
    }
    
    await redis.expire(onlineUsersKey, 60); // 1 minute
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.performHeartbeat();
      } catch (error: any) {
        logger.error('Heartbeat error:', error);
      }
    }, 30000); // 30 seconds
  }

  private async performHeartbeat(): Promise<void> {
    // Update system heartbeat
    await redis.set('system:heartbeat', Date.now(), 'EX', 60);
    
    // Clean up stale sessions
    await this.cleanupStaleSessions();
  }

  private async cleanupStaleSessions(): Promise<void> {
    const activeSessionsKey = REDIS_KEYS.ACTIVE_SESSIONS;
    const sessionIds = await redis.smembers(activeSessionsKey) || [];
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const sessionId of sessionIds) {
      const session = await this.getLiveSession(sessionId);
      
      if (!session || (now - session.lastActivity) > staleThreshold) {
        // Remove stale session
        await redis.srem(activeSessionsKey, sessionId);
        
        if (session) {
          // Update user presence to offline
          await this.updateUserPresence(session.userId, 'offline');
          
          // Remove from course participants
          if (session.courseId) {
            await this.updateCourseParticipants(session.courseId, session.userId, 'offline');
          }
        }
      }
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error: any) {
        logger.error('Cleanup error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async performCleanup(): Promise<void> {
    // Clean up expired events
    const streamKey = 'events:stream';
    const expiredThreshold = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    await redis.zremrangebyscore(streamKey, 0, expiredThreshold);
    
    // Clean up expired notifications
    const notificationKeys = await redis.keys('notification:*');
    
    for (const key of notificationKeys) {
      const notification = await cacheManager.get<RealTimeNotification>(
        key,
        REALTIME_CACHE_CONFIG.NOTIFICATIONS
      );
      
      if (notification?.expiresAt && Date.now() > notification.expiresAt) {
        await redis.del(key);
      }
    }
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const realTimeCacheManager = RealTimeCacheManager.getInstance();

// Helper functions for real-time caching
export class RealTimeCacheUtils {
  // Generate unique event ID
  static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create real-time event
  static createEvent(
    type: string,
    data: any,
    userId?: string,
    courseId?: string,
    metadata?: Record<string, any>
  ): RealTimeEvent {
    return {
      id: this.generateEventId(),
      type,
      data,
      timestamp: Date.now(),
      userId,
      courseId,
      metadata
    };
  }

  // Create notification
  static createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    expiresAt?: number
  ): RealTimeNotification {
    return {
      id: this.generateEventId(),
      userId,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      priority,
      expiresAt
    };
  }

  // Create chat message
  static createChatMessage(
    chatId: string,
    userId: string,
    message: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
    metadata?: Record<string, any>
  ): LiveChatMessage {
    return {
      id: this.generateEventId(),
      chatId,
      userId,
      message,
      timestamp: Date.now(),
      type,
      metadata
    };
  }

  // Check if event is recent
  static isRecentEvent(event: RealTimeEvent, maxAge: number = 60000): boolean {
    return Date.now() - event.timestamp < maxAge;
  }
}