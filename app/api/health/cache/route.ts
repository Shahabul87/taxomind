import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/cache/redis-cache';
import { getQueryPerformanceMetrics } from '@/lib/db/query-optimizer';
import { logger } from '@/lib/logger';
import { withAdminAuth } from '@/lib/api/with-api-auth';

export const runtime = 'nodejs';

/**
 * Health check endpoint for Redis cache and query optimization
 * GET /api/health/cache
 */
export const GET = withAdminAuth(async (request, context) => {
  try {
    // Get Redis cache health
    const cacheHealth = await redisCache.healthCheck();
    
    // Get cache metrics
    const cacheMetrics = redisCache.getMetrics();
    
    // Get query performance metrics
    const queryMetrics = getQueryPerformanceMetrics();
    
    // Calculate cache effectiveness
    const cacheEffectiveness = (cacheMetrics as any).totalRequests > 0
      ? Math.round(((cacheMetrics as any).hits / (cacheMetrics as any).totalRequests) * 100)
      : 0;
    
    // Calculate average latency
    const avgLatency = (cacheMetrics as any).latency?.length > 0
      ? Math.round(
          (cacheMetrics as any).latency.reduce((sum: number, lat: number) => sum + lat, 0) / 
          (cacheMetrics as any).latency.length
        )
      : 0;
    
    const response = {
      status: cacheHealth.status,
      timestamp: new Date().toISOString(),
      cache: {
        connected: cacheHealth.details.connected,
        status: cacheHealth.status,
        metrics: {
          hitRate: `${Math.round((cacheMetrics as any).hitRate || 0)}%`,
          missRate: `${Math.round((cacheMetrics as any).missRate || 0)}%`,
          totalRequests: (cacheMetrics as any).totalRequests || 0,
          totalHits: (cacheMetrics as any).hits || 0,
          totalMisses: (cacheMetrics as any).misses || 0,
          totalErrors: (cacheMetrics as any).errors || 0,
          cacheEffectiveness: `${cacheEffectiveness}%`,
          averageLatency: `${avgLatency}ms`,
          memoryUsage: `${Math.round(((cacheMetrics as any).memoryUsage || 0) / 1024 / 1024)}MB`,
          keyCount: (cacheMetrics as any).keyCount || 0,
          connectionStatus: (cacheMetrics as any).connectionStatus || 'unknown',
        },
        lastError: (cacheMetrics as any).lastError,
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
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        cache: {
          connected: false,
          status: 'error',
          metrics: null,
        },
        queryOptimization: {
          metrics: null,
          summary: null,
        },
      },
      { status: 503 }
    );
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
    
    let result: any = {};
    
    switch (action) {
      case 'set':
        // Test cache set operation
        const setSuccess = await redisCache.set(key || 'test:key', value || { test: true }, {
          ttl: ttl || 60,
        });
        result = { action: 'set', success: setSuccess, key, value };
        break;
        
      case 'get':
        // Test cache get operation
        const getResult = await redisCache.get(key || 'test:key');
        result = { action: 'get', ...getResult, key };
        break;
        
      case 'delete':
        // Test cache delete operation
        const deleteSuccess = await redisCache.delete(key || 'test:key');
        result = { action: 'delete', success: deleteSuccess, key };
        break;
        
      case 'flush':
        // Flush cache (use with caution)
        if (process.env.NODE_ENV === 'development') {
          const flushSuccess = await redisCache.flush();
          result = { action: 'flush', success: flushSuccess };
        } else {
          result = { action: 'flush', error: 'Flush only allowed in development' };
        }
        break;
        
      case 'benchmark':
        // Run a simple benchmark
        const benchmarkResults = await runCacheBenchmark();
        result = { action: 'benchmark', results: benchmarkResults };
        break;
        
      default:
        result = { error: 'Invalid action. Use: set, get, delete, flush, or benchmark' };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Cache test operation failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });

// Helper function to calculate average performance
function calculateAveragePerformance(queryMetrics: any): any {
  const queries = Object.values(queryMetrics).filter(Boolean) as any[];
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
function generateRecommendations(cacheMetrics: any, queryMetrics: any): string[] {
  const recommendations = [];
  
  // Cache hit rate recommendations
  if ((cacheMetrics as any).hitRate < 50) {
    recommendations.push('Low cache hit rate detected. Consider increasing TTL for stable data.');
  }
  
  if ((cacheMetrics as any).hitRate > 90) {
    recommendations.push('Excellent cache hit rate! Cache is performing optimally.');
  }
  
  // Error rate recommendations
  if ((cacheMetrics as any).errors > 10) {
    recommendations.push('High error count detected. Check Redis connection and logs.');
  }
  
  // Memory usage recommendations
  const memoryMB = ((cacheMetrics as any).memoryUsage || 0) / 1024 / 1024;
  if (memoryMB > 500) {
    recommendations.push('High memory usage. Consider implementing cache eviction policies.');
  }
  
  // Query performance recommendations
  const queryList = Object.entries(queryMetrics);
  for (const [queryName, metrics] of queryList) {
    if (metrics && (metrics as any).avgQueryTime > 1000) {
      recommendations.push(`Query "${queryName}" is slow. Consider adding database indexes.`);
    }
    if (metrics && (metrics as any).cacheHitRate < 30) {
      recommendations.push(`Query "${queryName}" has low cache hit rate. Review cache strategy.`);
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All systems operating within normal parameters.');
  }
  
  return recommendations;
}

// Helper function to run cache benchmark
async function runCacheBenchmark(): Promise<any> {
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