// Real-time Metrics Management with Redis

import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { TrackingEvent, EngagementMetrics } from '@/lib/analytics/types';

export class RealTimeMetrics {
  // Update student engagement metrics in real-time
  static async updateStudentMetrics(
    userId: string, 
    courseId: string, 
    event: TrackingEvent
  ): Promise<void> {
    if (!redis) return;

    const key = REDIS_KEYS.STUDENT_METRICS(userId, courseId);
    
    try {
      // Increment counters
      await redis.hincrby(key, 'totalEvents', 1);
      await redis.hincrby(key, event.eventType, 1);
      await redis.hset(key, 'lastActiveAt', Date.now());
      
      // Update engagement score
      const engagementScore = await this.calculateEngagementScore(userId, courseId, event);
      await redis.hset(key, 'engagementScore', engagementScore);
      
      // Set expiry
      await redis.expire(key, REDIS_TTL.METRICS);
      
      // Update course-level metrics
      await this.updateCourseMetrics(courseId, event);
      
      // Update real-time leaderboard
      await this.updateLeaderboard(userId, courseId, engagementScore);
    } catch (error) {
      console.error('Failed to update real-time metrics:', error);
    }
  }

  // Calculate engagement score based on recent activity
  static async calculateEngagementScore(
    userId: string,
    courseId: string,
    event: TrackingEvent
  ): Promise<number> {
    const weights = {
      click: 1,
      view: 2,
      scroll: 1.5,
      video: 3,
      quiz: 5,
      interaction: 2,
      custom: 1
    };

    const key = REDIS_KEYS.STUDENT_METRICS(userId, courseId);
    const metrics = await redis?.hgetall(key) || {};
    
    let score = 0;
    let totalWeight = 0;
    
    // Calculate weighted score
    Object.entries(weights).forEach(([eventType, weight]) => {
      const count = parseInt(metrics[eventType] || '0');
      score += count * weight;
      totalWeight += count;
    });
    
    // Consider recency
    const lastActive = parseInt(metrics.lastActiveAt || '0');
    const recencyBonus = this.calculateRecencyBonus(lastActive);
    
    // Normalize to 0-100 scale
    const normalizedScore = totalWeight > 0 
      ? Math.min(100, (score / totalWeight) * 10 * recencyBonus)
      : 0;
    
    return Math.round(normalizedScore);
  }

  // Calculate bonus based on how recent the activity is
  private static calculateRecencyBonus(lastActiveTimestamp: number): number {
    const now = Date.now();
    const hoursSinceActive = (now - lastActiveTimestamp) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) return 1.5; // Very recent
    if (hoursSinceActive < 24) return 1.2; // Today
    if (hoursSinceActive < 72) return 1.0; // This week
    return 0.8; // Older
  }

  // Update course-level aggregate metrics
  static async updateCourseMetrics(courseId: string, event: TrackingEvent): Promise<void> {
    if (!redis) return;

    const key = REDIS_KEYS.COURSE_METRICS(courseId);
    
    await redis.hincrby(key, 'totalInteractions', 1);
    await redis.hincrby(key, `event:${event.eventType}`, 1);
    
    // Track unique students
    if (event.userId) {
      await redis.sadd(`${key}:students`, event.userId);
    }
    
    // Track struggle points for videos
    if (event.eventType === 'video' && event.eventName === 'video_pause') {
      const videoId = event.properties.videoId;
      const timestamp = Math.floor(event.properties.currentTime || 0);
      
      await redis.hincrby(
        REDIS_KEYS.STRUGGLE_POINTS(courseId),
        `${videoId}:${timestamp}`,
        1
      );
    }
    
    await redis.expire(key, REDIS_TTL.METRICS);
  }

  // Update real-time leaderboard
  static async updateLeaderboard(
    userId: string,
    courseId: string,
    score: number
  ): Promise<void> {
    if (!redis) return;

    // Course-specific leaderboard
    await redis.zadd(
      REDIS_KEYS.COURSE_LEADERBOARD(courseId),
      { score, member: userId }
    );
    
    // Global leaderboard
    await redis.zadd(
      REDIS_KEYS.GLOBAL_LEADERBOARD,
      { score, member: userId }
    );
  }

  // Get real-time student metrics
  static async getStudentMetrics(
    userId: string,
    courseId: string
  ): Promise<EngagementMetrics | null> {
    if (!redis) return null;

    const key = REDIS_KEYS.STUDENT_METRICS(userId, courseId);
    const data = await redis.hgetall(key);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      totalTimeSpent: parseInt(data.totalTimeSpent || '0'),
      totalInteractions: parseInt(data.totalEvents || '0'),
      lastActiveAt: new Date(parseInt(data.lastActiveAt || '0')),
      engagementScore: parseFloat(data.engagementScore || '0'),
      completionRate: parseFloat(data.completionRate || '0'),
      averageSessionDuration: parseInt(data.avgSessionDuration || '0'),
      returnFrequency: parseInt(data.returnFrequency || '0')
    };
  }

  // Get course analytics in real-time
  static async getCourseAnalytics(courseId: string): Promise<any> {
    if (!redis) return null;

    const metricsKey = REDIS_KEYS.COURSE_METRICS(courseId);
    const metrics = await redis.hgetall(metricsKey);
    
    // Get unique student count
    const studentCount = await redis.scard(`${metricsKey}:students`);
    
    // Get top struggle points
    const strugglePoints = await redis.hgetall(REDIS_KEYS.STRUGGLE_POINTS(courseId));
    const topStruggles = Object.entries(strugglePoints || {})
      .map(([key, count]) => {
        const [videoId, timestamp] = key.split(':');
        return { videoId, timestamp: parseInt(timestamp), count: parseInt(count as string) };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Get leaderboard
    const leaderboard = await redis.zrange(
      REDIS_KEYS.COURSE_LEADERBOARD(courseId),
      0,
      9,
      { rev: true, withScores: true }
    );
    
    return {
      totalInteractions: parseInt(metrics?.totalInteractions || '0'),
      uniqueStudents: studentCount,
      eventBreakdown: {
        clicks: parseInt(metrics?.['event:click'] || '0'),
        views: parseInt(metrics?.['event:view'] || '0'),
        videos: parseInt(metrics?.['event:video'] || '0'),
        quizzes: parseInt(metrics?.['event:quiz'] || '0'),
      },
      topStruggles,
      leaderboard: leaderboard?.map((item: any) => ({
        userId: item.value,
        score: item.score
      })) || []
    };
  }

  // Track active sessions
  static async trackSession(sessionId: string, userId: string): Promise<void> {
    if (!redis) return;

    const sessionData = {
      userId,
      startTime: Date.now(),
      lastActive: Date.now(),
      pageViews: 1
    };
    
    await redis.hset(
      REDIS_KEYS.SESSION_DATA(sessionId),
      sessionData
    );
    
    await redis.sadd(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
    await redis.expire(REDIS_KEYS.SESSION_DATA(sessionId), REDIS_TTL.SESSION);
  }

  // Get active session count
  static async getActiveSessions(): Promise<number> {
    if (!redis) return 0;
    return await redis.scard(REDIS_KEYS.ACTIVE_SESSIONS) || 0;
  }

  // Clean up expired sessions
  static async cleanupSessions(): Promise<void> {
    if (!redis) return;

    const sessions = await redis.smembers(REDIS_KEYS.ACTIVE_SESSIONS) || [];
    
    for (const sessionId of sessions) {
      const exists = await redis.exists(REDIS_KEYS.SESSION_DATA(sessionId));
      if (!exists) {
        await redis.srem(REDIS_KEYS.ACTIVE_SESSIONS, sessionId);
      }
    }
  }
}