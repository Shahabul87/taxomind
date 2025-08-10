// Event Tracking Service - Core analytics event tracking functionality

import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class EventTrackingService {
  private static instance: EventTrackingService;

  constructor() {
}
  static getInstance(): EventTrackingService {
    if (!EventTrackingService.instance) {
      EventTrackingService.instance = new EventTrackingService();
    }
    return EventTrackingService.instance;
  }

  // Track a user event
  async trackEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    options: {
      sessionId?: string;
      metadata?: Record<string, any>;
    } = {
}
  ): Promise<void> {
    try {
      const timestamp = new Date();
      const dayKey = timestamp.toISOString().split('T')[0];

      // Create event object
      const event: AnalyticsEvent = {
        eventType,
        eventData,
        userId,
        sessionId: options.sessionId || `session_${Date.now()}`,
        timestamp,
        metadata: options.metadata || {
}
      };

      // Store in database for persistent analytics
      await this.storeInDatabase(event);

      // Update Redis counters for real-time analytics
      await this.updateRealTimeMetrics(event, dayKey);

      // Track user activity
      await this.trackUserActivity(userId, dayKey);

    } catch (error) {
      logger.error('Failed to track event:', error);
      // Don't throw to avoid breaking user experience
    }
  }

  // Store event in database
  private async storeInDatabase(event: AnalyticsEvent): Promise<void> {
    try {
      await db.studentInteraction.create({
        data: {
          studentId: event.userId!,
          interactionType: event.eventType,
          interactionData: event.eventData,
          sessionId: event.sessionId!,
          timestamp: event.timestamp!,
          metadata: event.metadata
        }
      });
    } catch (error) {
      logger.error('Failed to store event in database:', error);
      // Continue with Redis tracking even if DB fails
    }
  }

  // Update real-time metrics in Redis
  private async updateRealTimeMetrics(event: AnalyticsEvent, dayKey: string): Promise<void> {
    try {
      // Increment daily event counter
      await redis.hincrby(`analytics:daily:${dayKey}`, event.eventType, 1);

      // Update events per second
      const currentSecond = Math.floor(Date.now() / 1000);
      const secondKey = `analytics:events:second:${currentSecond}`;
      await redis.incr(secondKey);
      await redis.expire(secondKey, 60);

      // Track event type frequency
      await redis.hincrby('analytics:event_types', event.eventType, 1);

      // Store recent events for analysis
      const eventJson = JSON.stringify({
        type: event.eventType,
        userId: event.userId,
        timestamp: event.timestamp,
        data: event.eventData
      });
      
      await redis.lpush('analytics:recent_events', eventJson);
      await redis.ltrim('analytics:recent_events', 0, 999); // Keep last 1000 events
    } catch (error) {
      logger.error('Failed to update Redis metrics:', error);
    }
  }

  // Track user activity
  private async trackUserActivity(userId: string, dayKey: string): Promise<void> {
    try {
      // Add user to active users set
      await redis.sadd(`analytics:active_users:${dayKey}`, userId);
      await redis.expire(`analytics:active_users:${dayKey}`, 86400 * 7); // Keep for 7 days

      // Update user's last activity
      await redis.hset('analytics:user_activity', userId, Date.now().toString());
    } catch (error) {
      logger.error('Failed to track user activity:', error);
    }
  }

  // Get event statistics
  async getEventStats(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    totalEvents: number;
    eventTypes: Record<string, number>;
    activeUsers: number;
  }> {
    try {
      const dayKey = new Date().toISOString().split('T')[0];
      
      // Get daily events
      const dailyEvents = await redis.hgetall(`analytics:daily:${dayKey}`);
      const totalEvents = Object.values(dailyEvents).reduce(
        (sum, count) => sum + (parseInt(count as string) || 0), 
        0
      );

      // Get event types
      const eventTypes = await redis.hgetall('analytics:event_types');
      const eventTypesConverted: Record<string, number> = {};
      Object.entries(eventTypes).forEach(([type, count]) => {
        eventTypesConverted[type] = parseInt(count as string) || 0;
      });

      // Get active users
      const activeUsers = await redis.scard(`analytics:active_users:${dayKey}`);

      return {
        totalEvents,
        eventTypes: eventTypesConverted,
        activeUsers
      };
    } catch (error) {
      logger.error('Failed to get event stats:', error);
      return {
        totalEvents: 0,
        eventTypes: {},
        activeUsers: 0
      };
    }
  }

  // Get recent events
  async getRecentEvents(limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      const events = await redis.lrange('analytics:recent_events', 0, limit - 1);
      return events.map(eventJson => {
        try {
          return JSON.parse(eventJson as string);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      logger.error('Failed to get recent events:', error);
      return [];
    }
  }

  // Track learning events specifically
  async trackLearningEvent(
    userId: string,
    courseId: string,
    chapterId?: string,
    eventType: 'course_start' | 'chapter_complete' | 'quiz_complete' | 'course_complete' | 'interaction',
    eventData: Record<string, any> = {
}
  ): Promise<void> {
    await this.trackEvent(userId, `learning_${eventType}`, {
      courseId,
      chapterId,
      ...eventData
    }, {
      metadata: {
        category: 'learning',
        course: courseId
      }
    });
  }

  // Track ML events
  async trackMLEvent(
    userId: string,
    mlEventType: 'prediction' | 'recommendation' | 'model_update' | 'insight_generated',
    eventData: Record<string, any> = {
}
  ): Promise<void> {
    await this.trackEvent(userId, `ml_${mlEventType}`, eventData, {
      metadata: {
        category: 'machine_learning'
      }
    });
  }

  // Track job market events
  async trackJobMarketEvent(
    userId: string,
    jobEventType: 'skill_assessment' | 'career_analysis' | 'job_match' | 'salary_projection',
    eventData: Record<string, any> = {
}
  ): Promise<void> {
    await this.trackEvent(userId, `job_market_${jobEventType}`, eventData, {
      metadata: {
        category: 'career'
      }
    });
  }

  // Clean up old data
  async cleanup(): Promise<void> {
    try {
      // Clean up old daily data (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (let i = 30; i < 60; i++) {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - i);
        const oldDateKey = oldDate.toISOString().split('T')[0];
        
        await redis.del(`analytics:daily:${oldDateKey}`);
        await redis.del(`analytics:active_users:${oldDateKey}`);
      }

    } catch (error) {
      logger.error('Failed to cleanup analytics data:', error);
    }
  }
}

// Export the class - singleton instance can be created as needed