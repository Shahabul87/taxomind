import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/cache/redis-cache';
import { type CacheMetrics } from '@/lib/cache/redis-cache';
import { getQueryPerformanceMetrics } from '@/lib/db/query-optimizer';
import { logger } from '@/lib/logger';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const runtime = 'nodejs';

/**
 * Extended cache metrics with computed fields used in this health check endpoint.
 * The base CacheMetrics has hits/misses but not hitRate/missRate/totalRequests.
 * We compute those locally from the base metrics.
 */
interface ComputedCacheMetrics extends CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
}

/** Shape returned by getQueryPerformanceMetrics() per-query entry */
interface QueryPerformanceEntry {
  avgQueryTime: number;
  cacheHitRate: number;
  avgRowCount: number;
}

/** Performance metrics keyed by query name */
type QueryPerformanceMap = Record<string, QueryPerformanceEntry | null>;

/** Result shape of the cache benchmark */
interface BenchmarkResult {
  iterations: number;
  averageWriteLatency: string;
  averageReadLatency: string;
  averageDeleteLatency: string;
  p95WriteLatency: string;
  p95ReadLatency: string;
  p95DeleteLatency: string;
}

/** Average performance summary */
interface AveragePerformanceSummary {
  averageQueryTime: string;
  averageCacheHitRate: string;
  totalQueriesTracked: number;
}

/** Possible result shapes for the POST action test */
interface CacheSetResult { action: 'set'; success: boolean; key: string; value: unknown }
interface CacheGetResult { action: 'get'; key: string; hit?: boolean; value?: unknown; latency?: number; error?: string }
interface CacheDeleteResult { action: 'delete'; success: boolean; key: string }
interface CacheFlushResult { action: 'flush'; success?: boolean; error?: string }
interface CacheBenchmarkResult { action: 'benchmark'; results: BenchmarkResult }
interface CacheErrorResult { error: string }

type CacheTestResult =
  | CacheSetResult
  | CacheGetResult
  | CacheDeleteResult
  | CacheFlushResult
  | CacheBenchmarkResult
  | CacheErrorResult;

/**
 * Augment raw CacheMetrics with computed hitRate, missRate, totalRequests.
 */
function computeExtendedMetrics(raw: CacheMetrics): ComputedCacheMetrics {
  const totalRequests = raw.hits + raw.misses;
  const hitRate = totalRequests > 0 ? (raw.hits / totalRequests) * 100 : 0;
  const missRate = totalRequests > 0 ? (raw.misses / totalRequests) * 100 : 0;
  return {
    ...raw,
    totalRequests,
    hitRate,
    missRate,
  };
}

/**
 * Health check endpoint for Redis cache and query optimization
 * GET /api/health/cache
 */
export const GET = withAdminAuth(async (request, context) => {
  try {
    // Get Redis cache health
    const cacheHealth = await redisCache.healthCheck();

    // Get cache metrics and compute derived fields
    const rawCacheMetrics = redisCache.getMetrics();
    const cacheMetrics = computeExtendedMetrics(rawCacheMetrics);

    // Get query performance metrics
    const queryMetrics = getQueryPerformanceMetrics() as QueryPerformanceMap;

    // Calculate cache effectiveness
    const cacheEffectiveness = cacheMetrics.totalRequests > 0
      ? Math.round((cacheMetrics.hits / cacheMetrics.totalRequests) * 100)
      : 0;

    // Calculate average latency
    const avgLatency = cacheMetrics.latency.length > 0
      ? Math.round(
          cacheMetrics.latency.reduce((sum: number, lat: number) => sum + lat, 0) /
          cacheMetrics.latency.length
        )
      : 0;

    const response = {
      status: cacheHealth.status,
      timestamp: new Date().toISOString(),
      cache: {
        connected: cacheHealth.details.connected,
        status: cacheHealth.status,
        metrics: {
          hitRate: `${Math.round(cacheMetrics.hitRate)}%`,
          missRate: `${Math.round(cacheMetrics.missRate)}%`,
          totalRequests: cacheMetrics.totalRequests,
          totalHits: cacheMetrics.hits,
          totalMisses: cacheMetrics.misses,
          totalErrors: cacheMetrics.errors,
          cacheEffectiveness: `${cacheEffectiveness}%`,
          averageLatency: `${avgLatency}ms`,
          memoryUsage: `${Math.round((cacheMetrics.memoryUsage || 0) / 1024 / 1024)}MB`,
          keyCount: cacheMetrics.keyCount,
          connectionStatus: cacheMetrics.connectionStatus,
        },
        lastError: cacheMetrics.lastError,
      },
      queryOptimization: {
        metrics: queryMetrics,
        summary: {
          totalQueries: Object.keys(queryMetrics).length,
          averagePerformance: calculateAveragePerformance(queryMetrics),
        },
      },
      recommendations: generateRecommendations(cacheMetrics, queryMetrics),
    };

    // Log health check
    logger.info('Cache health check completed', {
      status: response.status,
      cacheEffectiveness: response.cache.metrics.cacheEffectiveness,
      averageLatency: response.cache.metrics.averageLatency,
    });

    return NextResponse.json(response, {
      status: cacheHealth.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    logger.error('Cache health check failed:', error);
    return safeErrorResponse(error, 503, 'HEALTH_CACHE_GET');
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });

/**
 * Test cache functionality
 * POST /api/health/cache
 */
export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const { action, key, value, ttl } = body;

    let result: CacheTestResult;

    switch (action) {
      case 'set': {
        // Test cache set operation
        const setSuccess = await redisCache.set(key || 'test:key', value || { test: true }, {
          ttl: ttl || 60,
        });
        result = { action: 'set', success: setSuccess, key, value };
        break;
      }

      case 'get': {
        // Test cache get operation
        const getResult = await redisCache.get(key || 'test:key');
        result = { action: 'get', ...getResult, key };
        break;
      }

      case 'delete': {
        // Test cache delete operation
        const deleteSuccess = await redisCache.delete(key || 'test:key');
        result = { action: 'delete', success: deleteSuccess, key };
        break;
      }

      case 'flush': {
        // Flush cache (use with caution)
        if (process.env.NODE_ENV === 'development') {
          const flushSuccess = await redisCache.flush();
          result = { action: 'flush', success: flushSuccess };
        } else {
          result = { action: 'flush', error: 'Flush only allowed in development' };
        }
        break;
      }

      case 'benchmark': {
        // Run a simple benchmark
        const benchmarkResults = await runCacheBenchmark();
        result = { action: 'benchmark', results: benchmarkResults };
        break;
      }

      default:
        result = { error: 'Invalid action. Use: set, get, delete, flush, or benchmark' };
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Cache test operation failed:', error);
    return safeErrorResponse(error, 500, 'HEALTH_CACHE_POST');
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });

// Helper function to calculate average performance
function calculateAveragePerformance(queryMetrics: QueryPerformanceMap): AveragePerformanceSummary | null {
  const queries = Object.values(queryMetrics).filter(
    (m): m is QueryPerformanceEntry => m !== null && m !== undefined
  );
  if (queries.length === 0) return null;

  const avgQueryTime = queries.reduce((sum, m) => sum + (m.avgQueryTime || 0), 0) / queries.length;
  const avgCacheHitRate = queries.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / queries.length;

  return {
    averageQueryTime: `${Math.round(avgQueryTime)}ms`,
    averageCacheHitRate: `${Math.round(avgCacheHitRate)}%`,
    totalQueriesTracked: queries.length,
  };
}

// Helper function to generate recommendations
function generateRecommendations(cacheMetrics: ComputedCacheMetrics, queryMetrics: QueryPerformanceMap): string[] {
  const recommendations: string[] = [];

  // Cache hit rate recommendations
  if (cacheMetrics.hitRate < 50) {
    recommendations.push('Low cache hit rate detected. Consider increasing TTL for stable data.');
  }

  if (cacheMetrics.hitRate > 90) {
    recommendations.push('Excellent cache hit rate! Cache is performing optimally.');
  }

  // Error rate recommendations
  if (cacheMetrics.errors > 10) {
    recommendations.push('High error count detected. Check Redis connection and logs.');
  }

  // Memory usage recommendations
  const memoryMB = (cacheMetrics.memoryUsage || 0) / 1024 / 1024;
  if (memoryMB > 500) {
    recommendations.push('High memory usage. Consider implementing cache eviction policies.');
  }

  // Query performance recommendations
  const queryList = Object.entries(queryMetrics);
  for (const [queryName, metrics] of queryList) {
    if (metrics && metrics.avgQueryTime > 1000) {
      recommendations.push(`Query "${queryName}" is slow. Consider adding database indexes.`);
    }
    if (metrics && metrics.cacheHitRate < 30) {
      recommendations.push(`Query "${queryName}" has low cache hit rate. Review cache strategy.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operating within normal parameters.');
  }

  return recommendations;
}

// Helper function to run cache benchmark
async function runCacheBenchmark(): Promise<BenchmarkResult> {
  const iterations = 100;
  const results = {
    writeLatency: [] as number[],
    readLatency: [] as number[],
    deleteLatency: [] as number[],
  };

  for (let i = 0; i < iterations; i++) {
    const key = `benchmark:${i}`;
    const value = {
      test: true,
      index: i,
      timestamp: Date.now(),
      data: 'x'.repeat(1000), // 1KB of data
    };

    // Benchmark write
    const writeStart = Date.now();
    await redisCache.set(key, value, { ttl: 60 });
    results.writeLatency.push(Date.now() - writeStart);

    // Benchmark read
    const readStart = Date.now();
    await redisCache.get(key);
    results.readLatency.push(Date.now() - readStart);

    // Benchmark delete
    const deleteStart = Date.now();
    await redisCache.delete(key);
    results.deleteLatency.push(Date.now() - deleteStart);
  }

  return {
    iterations,
    averageWriteLatency: `${Math.round(results.writeLatency.reduce((a, b) => a + b, 0) / iterations)}ms`,
    averageReadLatency: `${Math.round(results.readLatency.reduce((a, b) => a + b, 0) / iterations)}ms`,
    averageDeleteLatency: `${Math.round(results.deleteLatency.reduce((a, b) => a + b, 0) / iterations)}ms`,
    p95WriteLatency: `${results.writeLatency.sort((a, b) => a - b)[Math.floor(iterations * 0.95)]}ms`,
    p95ReadLatency: `${results.readLatency.sort((a, b) => a - b)[Math.floor(iterations * 0.95)]}ms`,
    p95DeleteLatency: `${results.deleteLatency.sort((a, b) => a - b)[Math.floor(iterations * 0.95)]}ms`,
  };
}
