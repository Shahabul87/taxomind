import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client if credentials are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache TTL values (in seconds)
const CACHE_TTL = {
  posts: 60 * 5, // 5 minutes
  comments: 60 * 2, // 2 minutes
  replies: 60 * 2, // 2 minutes
};

/**
 * Get data from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    logger.error(`Cache retrieval error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setInCache(key: string, data: any, ttlOverride?: number): Promise<boolean> {
  if (!redis) return false;
  
  try {
    const ttl = ttlOverride || CACHE_TTL.comments;
    await redis.set(key, data, { ex: ttl });
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate specific cache entries
 */
export async function invalidateCache(pattern: string): Promise<boolean> {
  if (!redis) return false;
  
  try {
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return true;
    
    // Delete all matched keys
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.del(key));
    await pipeline.exec();
    
    return true;
  } catch (error) {
    logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    return false;
  }
}

/**
 * Generate cache key for comments
 */
export function getCommentsKey(postId: string, page = 1, sortBy = 'newest'): string {
  return `comments:${postId}:${page}:${sortBy}`;
}

/**
 * Generate cache key for a single comment
 */
export function getCommentKey(commentId: string): string {
  return `comment:${commentId}`;
}

/**
 * Generate cache key for a comment's replies
 */
export function getRepliesKey(commentId: string, page = 1): string {
  return `replies:${commentId}:${page}`;
}

/**
 * Check if a post should be cached based on comment count
 */
export function shouldCachePost(commentCount: number): boolean {
  // Cache posts with more than 10 comments
  return commentCount > 10;
} 