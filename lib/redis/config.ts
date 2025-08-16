// Redis Configuration and Client Setup

import { Redis } from '@upstash/redis';
import { Redis as IORedis } from 'ioredis';
import { logger } from '@/lib/logger';

// For Upstash Redis (Serverless - Recommended for Vercel)
export const upstashRedis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    logger.warn('Upstash Redis credentials not found, using fallback');
    return null;
  }
  
  try {
    return new Redis({ url, token });
  } catch (error: any) {
    logger.warn('Failed to initialize Upstash Redis:', error);
    return null;
  }
})();

// For Self-hosted Redis (Optional - for local development)
export const ioRedis = (process.env.REDIS_URL && !process.env.DISABLE_REDIS)
  ? (() => {
      try {
        return new IORedis(process.env.REDIS_URL);
      } catch (error: any) {
        logger.warn('Failed to initialize IORedis:', error);
        return null;
      }
    })()
  : null;

// Use Upstash for production, IORedis for local development
export const redis = (() => {
  if (process.env.DISABLE_REDIS) {

    return null;
  }
  
  if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
    return upstashRedis;
  }
  return ioRedis;
})();

// Redis key prefixes for organization
export const REDIS_KEYS = {
  // Real-time metrics
  STUDENT_METRICS: (userId: string, courseId: string) => `metrics:${userId}:${courseId}`,
  COURSE_METRICS: (courseId: string) => `course:metrics:${courseId}`,
  ENGAGEMENT_SCORE: (userId: string) => `engagement:${userId}`,
  
  // Learning patterns
  LEARNING_VELOCITY: (userId: string) => `velocity:${userId}`,
  STRUGGLE_POINTS: (courseId: string) => `struggles:${courseId}`,
  CONTENT_FLAGS: (contentId: string) => `flags:${contentId}`,
  
  // Session tracking
  ACTIVE_SESSIONS: 'sessions:active',
  SESSION_DATA: (sessionId: string) => `session:${sessionId}`,
  
  // Real-time leaderboards
  COURSE_LEADERBOARD: (courseId: string) => `leaderboard:${courseId}`,
  GLOBAL_LEADERBOARD: 'leaderboard:global',
  
  // Caching
  AI_RESPONSE_CACHE: (key: string) => `ai:cache:${key}`,
  ANALYTICS_CACHE: (key: string) => `analytics:cache:${key}`,
  
  // Course data caching
  COURSE_DETAILS: (courseId: string) => `course:details:${courseId}`,
  COURSE_LIST: (userId?: string, filters?: string) => `courses:list:${userId || 'public'}:${filters || 'default'}`,
  COURSE_PROGRESS: (userId: string, courseId: string) => `progress:${userId}:${courseId}`,
  USER_COURSES: (userId: string) => `user:courses:${userId}`,
  
  // Dashboard data caching
  DASHBOARD_DATA: (userId: string) => `dashboard:${userId}`,
  USER_ANALYTICS: (userId: string) => `analytics:user:${userId}`,
  TEACHER_ANALYTICS: (userId: string) => `analytics:teacher:${userId}`,
  
  // Search results caching
  SEARCH_RESULTS: (query: string, filters?: string) => `search:${query}:${filters || 'default'}`,
  
  // Rate limiting
  RATE_LIMIT: (userId: string, action: string) => `ratelimit:${userId}:${action}`,
} as const;

// TTL values (in seconds)
export const REDIS_TTL = {
  METRICS: 24 * 60 * 60, // 24 hours
  SESSION: 30 * 60, // 30 minutes
  AI_CACHE: 60 * 60, // 1 hour
  ANALYTICS_CACHE: 5 * 60, // 5 minutes
  RATE_LIMIT: 60, // 1 minute
  
  // Course data TTL
  COURSE_DETAILS: 30 * 60, // 30 minutes - courses don't change often
  COURSE_LIST: 10 * 60, // 10 minutes - list can change with new courses
  COURSE_PROGRESS: 5 * 60, // 5 minutes - progress updates frequently
  USER_COURSES: 15 * 60, // 15 minutes - enrollment changes less frequently
  
  // Dashboard and analytics TTL
  DASHBOARD_DATA: 5 * 60, // 5 minutes - recent activity matters
  USER_ANALYTICS: 10 * 60, // 10 minutes - analytics can be slightly stale
  TEACHER_ANALYTICS: 15 * 60, // 15 minutes - teacher data changes less frequently
  
  // Search results TTL
  SEARCH_RESULTS: 3 * 60, // 3 minutes - search results should be relatively fresh
  
  // Cache warming intervals
  WARM_POPULAR_COURSES: 60 * 60, // 1 hour - refresh popular course cache
  WARM_USER_DATA: 30 * 60, // 30 minutes - refresh active user data
} as const;