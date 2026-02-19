/**
 * Distributed Lock using Redis SET NX EX
 *
 * Prevents multiple instances of cron jobs from running simultaneously.
 * Uses Redis atomic SET with NX (not exists) and EX (expiry) for safety.
 */

import { logger } from '@/lib/logger';

interface RedisClient {
  set(key: string, value: string, ...args: string[]): Promise<string | null>;
  del(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
}

let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient | null> {
  if (redisClient) return redisClient;

  if (!process.env.REDIS_URL) {
    return null;
  }

  try {
    // @ts-expect-error - redis types may not be installed
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    redisClient = client as unknown as RedisClient;
    return redisClient;
  } catch (error) {
    logger.warn('[DISTRIBUTED_LOCK] Failed to connect to Redis:', error);
    return null;
  }
}

/**
 * Acquire a distributed lock.
 * Returns true if the lock was acquired, false if already held.
 *
 * @param name - Lock name (e.g., 'cron:practice-streaks')
 * @param ttlSeconds - Lock TTL in seconds (auto-releases after this time)
 */
export async function acquireLock(name: string, ttlSeconds: number = 300): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) {
    // No Redis available — allow execution (single-instance fallback)
    logger.debug(`[DISTRIBUTED_LOCK] No Redis — allowing ${name} (single-instance mode)`);
    return true;
  }

  const lockKey = `lock:${name}`;
  const lockValue = `${process.pid}:${Date.now()}`;

  try {
    const result = await redis.set(lockKey, lockValue, 'NX', 'EX', String(ttlSeconds));
    const acquired = result === 'OK';

    if (!acquired) {
      logger.info(`[DISTRIBUTED_LOCK] Lock ${name} already held — skipping`);
    }

    return acquired;
  } catch (error) {
    logger.warn(`[DISTRIBUTED_LOCK] Failed to acquire lock ${name}:`, error);
    // On Redis error, allow execution (fail-open for cron availability)
    return true;
  }
}

/**
 * Release a distributed lock.
 *
 * @param name - Lock name to release
 */
export async function releaseLock(name: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;

  const lockKey = `lock:${name}`;

  try {
    await redis.del(lockKey);
  } catch (error) {
    logger.warn(`[DISTRIBUTED_LOCK] Failed to release lock ${name}:`, error);
    // Lock will auto-expire via TTL
  }
}
