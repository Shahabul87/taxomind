import 'server-only';

// Redis Configuration - Fallback implementation for development and production

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

declare global {
  var redis: Redis | undefined;
}

// Mock Redis implementation for development/testing
class MockRedis {
  private store: Map<string, any> = new Map();
  private hashStore: Map<string, Map<string, any>> = new Map();
  private setStore: Map<string, Set<string>> = new Map();
  private expireStore: Map<string, NodeJS.Timeout> = new Map();

  // Basic string operations
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, value);
    this.expire(key, seconds);
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.store.delete(key)) deleted++;
      this.hashStore.delete(key);
      this.setStore.delete(key);
      const timeout = this.expireStore.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.expireStore.delete(key);
      }
    });
    return deleted;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const timeout = setTimeout(() => {
      this.store.delete(key);
      this.hashStore.delete(key);
      this.setStore.delete(key);
      this.expireStore.delete(key);
    }, seconds * 1000);
    
    this.expireStore.set(key, timeout);
    return 1;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = current + 1;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = current + increment;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashStore.get(key);
    return hash ? hash.get(field) || null : null;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    let hash = this.hashStore.get(key);
    if (!hash) {
      hash = new Map();
      this.hashStore.set(key, hash);
    }
    const isNew = !hash.has(field);
    hash.set(field, value);
    return isNew ? 1 : 0;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashStore.get(key);
    if (!hash) return {};
    
    const result: Record<string, string> = {};
    hash.forEach((value, field) => {
      result[field] = value;
    });
    return result;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    let hash = this.hashStore.get(key);
    if (!hash) {
      hash = new Map();
      this.hashStore.set(key, hash);
    }
    const current = parseInt(hash.get(field) || '0');
    const newValue = current + increment;
    hash.set(field, newValue.toString());
    return newValue;
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.setStore.get(key);
    if (!set) {
      set = new Set();
      this.setStore.set(key, set);
    }
    let added = 0;
    members.forEach(member => {
      if (!set!.has(member)) {
        set!.add(member);
        added++;
      }
    });
    return added;
  }

  async scard(key: string): Promise<number> {
    const set = this.setStore.get(key);
    return set ? set.size : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.setStore.get(key);
    return set ? Array.from(set) : [];
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    let list = this.store.get(key);
    if (!list) {
      list = [];
    } else if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        list = [];
      }
    }
    
    if (!Array.isArray(list)) {
      list = [];
    }
    
    values.reverse().forEach(value => {
      list.unshift(value);
    });
    
    this.store.set(key, JSON.stringify(list));
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    let list = this.store.get(key);
    if (!list) return [];
    
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        return [];
      }
    }
    
    if (!Array.isArray(list)) return [];
    
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    let list = this.store.get(key);
    if (!list) return 'OK';
    
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        return 'OK';
      }
    }
    
    if (!Array.isArray(list)) return 'OK';
    
    const trimmed = list.slice(start, stop + 1);
    this.store.set(key, JSON.stringify(trimmed));
    return 'OK';
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    if (pattern === '*') return keys;
    
    // Simple pattern matching for cache:*
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return keys.filter(key => key.startsWith(prefix));
    }
    
    return keys.filter(key => key === pattern);
  }

  // Connection operations
  async ping(): Promise<string> {
    return 'PONG';
  }

  // Pub/Sub operations (simplified for development)
  async publish(_channel: string, _message: string): Promise<number> {
    return 1;
  }

  async subscribe(_channel: string): Promise<void> {
    return;
  }

  on(_event: string, _callback: (channel: string, message: string) => void): void {
    return;
  }
  // Additional methods for compatibility
  async info(section?: string): Promise<string> {
    return 'redis_version:6.0.0-mock\nused_memory_human:1.0M\nconnected_clients:1';
  }
}

// Create Redis client or fallback to in-memory implementation
export const redis = (() => {
  // Check if Redis URL is available
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // Production Redis implementation
      if (globalThis.redis) {
        return globalThis.redis;
      }

      const redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
          if (times > 5) return null; // Stop retrying after 5 attempts
          return Math.min(times * 200, 3000);
        },
      });

      redisClient.on('error', (err) => {
        logger.error('Redis connection error:', { error: err.message });
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      redisClient.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
      });

      globalThis.redis = redisClient;
      return redisClient;
    } catch (error) {
      logger.warn('Redis connection failed, using fallback:', error);
    }
  }

  // Fallback implementation for development
  return new MockRedis();
})();

export { MockRedis };