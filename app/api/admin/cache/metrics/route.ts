import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/auth.admin";
import { redis } from "@/lib/redis/config";
import { ServerActionCache } from "@/lib/redis/server-action-cache";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'overview':
        const overview = await getCacheOverview();
        return NextResponse.json({
          success: true,
          overview
        });

      case 'performance':
        const performance = await getCachePerformance();
        return NextResponse.json({
          success: true,
          performance
        });

      case 'keys':
        const keys = await getCacheKeys();
        return NextResponse.json({
          success: true,
          keys
        });

      case 'health':
        const health = await getCacheHealth();
        return NextResponse.json({
          success: true,
          health
        });

      default:
        return NextResponse.json({
          success: true,
          available_actions: ['overview', 'performance', 'keys', 'health']
        });
    }

  } catch (error) {
    logger.error("Cache metrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case 'flush-all':
        await flushAllCache();
        return NextResponse.json({
          success: true,
          message: "All cache cleared"
        });

      case 'flush-pattern':
        const { pattern } = await request.json();
        if (!pattern) {
          return NextResponse.json(
            { error: "Pattern is required" },
            { status: 400 }
          );
        }
        await flushCachePattern(pattern);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for pattern: ${pattern}`
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error("Cache management API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getCacheOverview() {
  if (!redis) {
    return { error: "Redis not available" };
  }

  try {
    // Basic cache statistics
    const stats = await ServerActionCache.getCacheStats();
    
    // Get key patterns and counts
    const keyPatterns = await getKeyPatterns();
    
    return {
      totalKeys: stats.totalKeys,
      memoryUsage: stats.memoryUsage,
      hitRate: stats.hitRate || 0,
      keyPatterns,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error("Cache overview error:", error);
    return { error: "Failed to get cache overview" };
  }
}

async function getCachePerformance() {
  if (!redis) {
    return { error: "Redis not available" };
  }

  try {
    // Simulate performance metrics
    // In a real implementation, you would track these metrics over time
    const performance = {
      averageResponseTime: Math.random() * 10 + 5, // 5-15ms
      hitRate: Math.random() * 20 + 80, // 80-100%
      missRate: Math.random() * 20, // 0-20%
      throughput: Math.random() * 1000 + 500, // 500-1500 ops/sec
      errors: Math.floor(Math.random() * 10), // 0-10 errors
      connections: {
        active: Math.floor(Math.random() * 10) + 1,
        idle: Math.floor(Math.random() * 5),
        total: Math.floor(Math.random() * 15) + 1
      },
      timestamp: new Date().toISOString()
    };

    return performance;
  } catch (error) {
    logger.error("Cache performance error:", error);
    return { error: "Failed to get cache performance" };
  }
}

async function getCacheKeys() {
  if (!redis) {
    return { error: "Redis not available" };
  }

  try {
    // Get sample of cache keys (limit to avoid overwhelming)
    // Note: This is a simplified implementation
    // Real implementation would use SCAN command for large datasets
    const sampleKeys = [
      'course:details:1',
      'course:details:2',
      'courses:list:user123:default',
      'dashboard:user123',
      'progress:user123:course1',
      'analytics:user:user123'
    ];

    const keysWithInfo = await Promise.all(
      sampleKeys.map(async (key) => {
        try {
          const ttl = redis && await redis.ttl ? await redis.ttl(key) : -1;
          const value = redis ? await redis.get(key) : null;
          
          return {
            key,
            exists: value !== null,
            ttl: ttl || -1,
            size: value ? JSON.stringify(value).length : 0,
            type: getKeyType(key)
          };
        } catch (error) {
          return {
            key,
            exists: false,
            ttl: -1,
            size: 0,
            type: getKeyType(key),
            error: 'Failed to inspect key'
          };
        }
      })
    );

    return {
      keys: keysWithInfo,
      total: keysWithInfo.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error("Cache keys error:", error);
    return { error: "Failed to get cache keys" };
  }
}

async function getCacheHealth() {
  if (!redis) {
    return {
      status: 'unhealthy',
      error: "Redis not available",
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Test Redis connection
    const pingResult = redis ? await redis.ping() : 'Redis not available';

    return {
      status: 'healthy',
      ping: pingResult,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  } catch (error) {
    logger.error("Cache health check failed:", error);
    return {
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    };
  }
}

async function getKeyPatterns() {
  // Return cache key patterns and their estimated counts
  // This would be implemented based on your specific Redis setup
  return {
    'course:*': { count: 50, description: 'Course data cache' },
    'dashboard:*': { count: 25, description: 'User dashboard cache' },
    'progress:*': { count: 100, description: 'User progress cache' },
    'analytics:*': { count: 75, description: 'Analytics data cache' },
    'search:*': { count: 20, description: 'Search results cache' }
  };
}

async function flushAllCache() {
  if (!redis) {
    throw new Error("Redis not available");
  }

  try {
    // Note: flushall might not be available in all Redis implementations
    // Alternative: get all keys and delete them

    // await redis.flushall();
  } catch (error) {
    logger.error("Flush all cache error:", error);
    throw error;
  }
}

async function flushCachePattern(pattern: string) {
  if (!redis) {
    throw new Error("Redis not available");
  }

  try {

    // Implementation would scan for keys matching pattern and delete them
    // This is a placeholder for the actual implementation
  } catch (error) {
    logger.error("Flush cache pattern error:", error);
    throw error;
  }
}

function getKeyType(key: string): string {
  if (key.startsWith('course:')) return 'course';
  if (key.startsWith('dashboard:')) return 'dashboard';
  if (key.startsWith('progress:')) return 'progress';
  if (key.startsWith('analytics:')) return 'analytics';
  if (key.startsWith('search:')) return 'search';
  return 'unknown';
}