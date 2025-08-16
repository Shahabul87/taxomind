// User Session and Authentication Caching System

import { cacheManager, CacheLayer, CACHE_CONFIGS } from './cache-manager';
import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// Session data interface
interface SessionData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: number;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceId: string;
  };
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Authentication cache interface
interface AuthCache {
  userId: string;
  hashedToken: string;
  expiresAt: number;
  refreshToken?: string;
  permissions: string[];
  role: string;
}

// Session configuration
interface SessionConfig {
  ttl: number;
  slidingExpiration: boolean;
  maxIdleTime: number;
  cleanupInterval: number;
}

export class SessionCacheManager {
  private static instance: SessionCacheManager;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): SessionCacheManager {
    if (!SessionCacheManager.instance) {
      SessionCacheManager.instance = new SessionCacheManager();
    }
    return SessionCacheManager.instance;
  }

  // Create new session
  async createSession(
    sessionId: string,
    sessionData: SessionData,
    config: SessionConfig = this.getDefaultSessionConfig()
  ): Promise<boolean> {
    try {
      const cacheKey = this.getSessionKey(sessionId);
      
      const extendedData = {
        ...sessionData,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (config.ttl * 1000)
      };

      // Store session data
      await cacheManager.set(cacheKey, extendedData, {
        ttl: config.ttl,
        layer: CacheLayer.SESSION,
        tags: ['session', `user:${sessionData.userId}`],
        prefix: 'session'
      });

      // Add to active sessions set
      await redis.sadd(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
      await redis.expire(REDIS_KEYS.ACTIVE_SESSIONS, config.ttl);

      // Store user session mapping
      await this.addUserSession(sessionData.userId, sessionId, config.ttl);

      return true;
    } catch (error) {
      logger.error('Error creating session:', error);
      return false;
    }
  }

  // Get session data
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const cacheKey = this.getSessionKey(sessionId);
      
      const session = await cacheManager.get<SessionData & {
        createdAt: number;
        expiresAt: number;
      }>(cacheKey, {
        ttl: REDIS_TTL.SESSION,
        layer: CacheLayer.SESSION,
        prefix: 'session'
      });

      if (!session) return null;

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        await this.destroySession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  // Update session activity
  async updateSessionActivity(
    sessionId: string,
    config: SessionConfig = this.getDefaultSessionConfig()
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      const cacheKey = this.getSessionKey(sessionId);
      const now = Date.now();

      // Update last activity
      const updatedSession = {
        ...session,
        lastActivity: now
      };

      // Extend expiration if sliding expiration is enabled
      if (config.slidingExpiration) {
        updatedSession.expiresAt = now + (config.ttl * 1000);
      }

      await cacheManager.set(cacheKey, updatedSession, {
        ttl: config.ttl,
        layer: CacheLayer.SESSION,
        tags: ['session', `user:${session.userId}`],
        prefix: 'session'
      });

      return true;
    } catch (error) {
      logger.error('Error updating session activity:', error);
      return false;
    }
  }

  // Destroy session
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return true;

      const cacheKey = this.getSessionKey(sessionId);
      
      // Remove from cache
      await cacheManager.invalidatePattern(cacheKey, CacheLayer.SESSION);
      
      // Remove from active sessions
      await redis.srem(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
      
      // Remove from user session mapping
      await this.removeUserSession(session.userId, sessionId);

      return true;
    } catch (error) {
      logger.error('Error destroying session:', error);
      return false;
    }
  }

  // Get all user sessions
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const userSessionsKey = `user:sessions:${userId}`;
      return await redis.smembers(userSessionsKey) || [];
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Destroy all user sessions
  async destroyAllUserSessions(userId: string): Promise<boolean> {
    try {
      const sessionIds = await this.getUserSessions(userId);
      
      await Promise.all(
        sessionIds.map(sessionId => this.destroySession(sessionId))
      );

      return true;
    } catch (error) {
      logger.error('Error destroying all user sessions:', error);
      return false;
    }
  }

  // Cache authentication token
  async cacheAuthToken(
    tokenHash: string,
    authData: AuthCache,
    ttl: number = 3600
  ): Promise<boolean> {
    try {
      const cacheKey = `auth:token:${tokenHash}`;
      
      await cacheManager.set(cacheKey, authData, {
        ttl,
        layer: CacheLayer.AUTHENTICATION,
        tags: ['auth', `user:${authData.userId}`],
        prefix: 'auth'
      });

      return true;
    } catch (error) {
      logger.error('Error caching auth token:', error);
      return false;
    }
  }

  // Get cached authentication data
  async getCachedAuthToken(tokenHash: string): Promise<AuthCache | null> {
    try {
      const cacheKey = `auth:token:${tokenHash}`;
      
      return await cacheManager.get<AuthCache>(cacheKey, {
        ttl: 3600,
        layer: CacheLayer.AUTHENTICATION,
        prefix: 'auth'
      });
    } catch (error) {
      logger.error('Error getting cached auth token:', error);
      return null;
    }
  }

  // Cache user permissions
  async cacheUserPermissions(
    userId: string,
    permissions: string[],
    role: string,
    ttl: number = 1800
  ): Promise<boolean> {
    try {
      const cacheKey = `user:permissions:${userId}`;
      
      const permissionData = {
        permissions,
        role,
        cachedAt: Date.now()
      };

      await cacheManager.set(cacheKey, permissionData, {
        ttl,
        layer: CacheLayer.AUTHENTICATION,
        tags: ['permissions', `user:${userId}`],
        prefix: 'permissions'
      });

      return true;
    } catch (error) {
      logger.error('Error caching user permissions:', error);
      return false;
    }
  }

  // Get cached user permissions
  async getCachedUserPermissions(userId: string): Promise<{
    permissions: string[];
    role: string;
    cachedAt: number;
  } | null> {
    try {
      const cacheKey = `user:permissions:${userId}`;
      
      return await cacheManager.get<{
        permissions: string[];
        role: string;
        cachedAt: number;
      }>(cacheKey, {
        ttl: 1800,
        layer: CacheLayer.AUTHENTICATION,
        prefix: 'permissions'
      });
    } catch (error) {
      logger.error('Error getting cached user permissions:', error);
      return null;
    }
  }

  // Cache user profile data
  async cacheUserProfile(
    userId: string,
    profileData: Record<string, any>,
    ttl: number = 600
  ): Promise<boolean> {
    try {
      const cacheKey = `user:profile:${userId}`;
      
      const cachedProfile = {
        ...profileData,
        cachedAt: Date.now()
      };

      await cacheManager.set(cacheKey, cachedProfile, {
        ttl,
        layer: CacheLayer.USER_DATA,
        tags: ['profile', `user:${userId}`],
        prefix: 'profile'
      });

      return true;
    } catch (error) {
      logger.error('Error caching user profile:', error);
      return false;
    }
  }

  // Get cached user profile
  async getCachedUserProfile(userId: string): Promise<Record<string, any> | null> {
    try {
      const cacheKey = `user:profile:${userId}`;
      
      return await cacheManager.get<Record<string, any>>(cacheKey, {
        ttl: 600,
        layer: CacheLayer.USER_DATA,
        prefix: 'profile'
      });
    } catch (error) {
      logger.error('Error getting cached user profile:', error);
      return null;
    }
  }

  // Invalidate user cache
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        cacheManager.invalidateByTags([`user:${userId}`], CacheLayer.SESSION),
        cacheManager.invalidateByTags([`user:${userId}`], CacheLayer.AUTHENTICATION),
        cacheManager.invalidateByTags([`user:${userId}`], CacheLayer.USER_DATA)
      ]);
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
    }
  }

  // Get active sessions count
  async getActiveSessionsCount(): Promise<number> {
    try {
      return await redis.scard(REDIS_KEYS.ACTIVE_SESSIONS) || 0;
    } catch (error) {
      logger.error('Error getting active sessions count:', error);
      return 0;
    }
  }

  // Get session statistics
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    userSessionCounts: Record<string, number>;
    avgSessionDuration: number;
  }> {
    try {
      const activeSessions = await redis.smembers(REDIS_KEYS.ACTIVE_SESSIONS) || [];
      const userSessionCounts: Record<string, number> = {};
      let totalDuration = 0;

      for (const sessionId of activeSessions) {
        const session = await this.getSession(sessionId);
        if (session) {
          userSessionCounts[session.userId] = (userSessionCounts[session.userId] || 0) + 1;
          totalDuration += Date.now() - session.lastActivity;
        }
      }

      return {
        totalActiveSessions: activeSessions.length,
        userSessionCounts,
        avgSessionDuration: activeSessions.length > 0 ? totalDuration / activeSessions.length : 0
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        totalActiveSessions: 0,
        userSessionCounts: {},
        avgSessionDuration: 0
      };
    }
  }

  // Private helper methods
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private async addUserSession(userId: string, sessionId: string, ttl: number): Promise<void> {
    const userSessionsKey = `user:sessions:${userId}`;
    await redis.sadd(userSessionsKey, sessionId);
    await redis.expire(userSessionsKey, ttl);
  }

  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = `user:sessions:${userId}`;
    await redis.srem(userSessionsKey, sessionId);
  }

  private getDefaultSessionConfig(): SessionConfig {
    return {
      ttl: REDIS_TTL.SESSION,
      slidingExpiration: true,
      maxIdleTime: 15 * 60, // 15 minutes
      cleanupInterval: 60 * 60 // 1 hour
    };
  }

  private startCleanupTimer(): void {
    const config = this.getDefaultSessionConfig();
    
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, config.cleanupInterval * 1000);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const activeSessions = await redis.smembers(REDIS_KEYS.ACTIVE_SESSIONS) || [];
      const now = Date.now();

      for (const sessionId of activeSessions) {
        const session = await this.getSession(sessionId);
        
        if (!session || now > session.expiresAt) {
          await this.destroySession(sessionId);
        }
      }
    } catch (error) {
      logger.error('Error during session cleanup:', error);
    }
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export singleton instance
export const sessionCacheManager = SessionCacheManager.getInstance();

// Helper functions for session management
export class SessionUtils {
  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash token for secure storage
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Validate session data
  static validateSessionData(data: any): data is SessionData {
    return (
      typeof data.userId === 'string' &&
      typeof data.email === 'string' &&
      typeof data.role === 'string' &&
      Array.isArray(data.permissions) &&
      typeof data.lastActivity === 'number'
    );
  }

  // Create session from user data
  static createSessionFromUser(user: any, deviceInfo?: any): SessionData {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      lastActivity: Date.now(),
      deviceInfo,
      preferences: user.preferences || {},
      metadata: {
}
    };
  }

  // Check if session is expired
  static isSessionExpired(session: SessionData & { expiresAt: number }): boolean {
    return Date.now() > session.expiresAt;
  }

  // Check if session is idle
  static isSessionIdle(session: SessionData, maxIdleTime: number): boolean {
    return Date.now() - session.lastActivity > maxIdleTime * 1000;
  }
}