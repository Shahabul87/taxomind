/**
 * Application Performance Monitoring (APM) System
 * Real-time performance metrics collection and monitoring
 */

import { metrics, ValueType } from '@opentelemetry/api';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as v8 from 'v8';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

// Metric meter
const meter = metrics.getMeter('taxomind-apm', '1.0.0');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_WARNING: 1000, // 1 second
  RESPONSE_TIME_CRITICAL: 3000, // 3 seconds
  ERROR_RATE_WARNING: 0.01, // 1%
  ERROR_RATE_CRITICAL: 0.05, // 5%
  MEMORY_USAGE_WARNING: 0.8, // 80%
  MEMORY_USAGE_CRITICAL: 0.9, // 90%
  CPU_USAGE_WARNING: 0.7, // 70%
  CPU_USAGE_CRITICAL: 0.85, // 85%
  DB_QUERY_TIME_WARNING: 100, // 100ms
  DB_QUERY_TIME_CRITICAL: 500, // 500ms
  CACHE_HIT_RATE_WARNING: 0.7, // 70%
  CACHE_HIT_RATE_CRITICAL: 0.5, // 50%
};

// Event emitter for alerts
const alertEmitter = new EventEmitter();

/**
 * Performance metrics collector
 */
export class APMCollector {
  private static instance: APMCollector;
  
  // Histograms
  private requestDurationHistogram = meter.createHistogram('http_request_duration', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });
  
  private dbQueryDurationHistogram = meter.createHistogram('db_query_duration', {
    description: 'Database query duration in milliseconds',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });
  
  private cacheOperationDurationHistogram = meter.createHistogram('cache_operation_duration', {
    description: 'Cache operation duration in milliseconds',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });
  
  // Counters
  private requestCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });
  
  private errorCounter = meter.createCounter('errors_total', {
    description: 'Total number of errors',
  });
  
  private dbQueryCounter = meter.createCounter('db_queries_total', {
    description: 'Total number of database queries',
  });
  
  private cacheHitCounter = meter.createCounter('cache_hits_total', {
    description: 'Total number of cache hits',
  });
  
  private cacheMissCounter = meter.createCounter('cache_misses_total', {
    description: 'Total number of cache misses',
  });
  
  // Gauges
  private memoryUsageGauge = meter.createUpDownCounter('memory_usage_bytes', {
    description: 'Current memory usage in bytes',
    unit: 'bytes',
  });
  
  private cpuUsageGauge = meter.createUpDownCounter('cpu_usage_percent', {
    description: 'Current CPU usage percentage',
    unit: '%',
  });
  
  private activeConnectionsGauge = meter.createUpDownCounter('active_connections', {
    description: 'Number of active connections',
  });
  
  private constructor() {
    this.startSystemMetricsCollection();
  }
  
  public static getInstance(): APMCollector {
    if (!APMCollector.instance) {
      APMCollector.instance = new APMCollector();
    }
    return APMCollector.instance;
  }
  
  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    error?: Error
  ): void {
    const labels = {
      method,
      path: this.normalizePath(path),
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`,
    };
    
    this.requestCounter.add(1, labels);
    this.requestDurationHistogram.record(duration, labels);
    
    if (error || statusCode >= 500) {
      this.errorCounter.add(1, {
        ...labels,
        error_type: error?.name || 'ServerError',
      });
      
      // Check error rate threshold
      this.checkErrorRateThreshold();
    }
    
    // Check response time threshold
    if (duration > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      alertEmitter.emit('alert', {
        type: 'RESPONSE_TIME_CRITICAL',
        message: `Critical response time: ${duration}ms for ${method} ${path}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.RESPONSE_TIME_CRITICAL,
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING) {
      alertEmitter.emit('alert', {
        type: 'RESPONSE_TIME_WARNING',
        message: `High response time: ${duration}ms for ${method} ${path}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING,
      });
    }
  }
  
  /**
   * Record database query metrics
   */
  public recordDatabaseQuery(
    operation: string,
    model: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    const labels = {
      operation,
      model,
      success: success.toString(),
    };
    
    this.dbQueryCounter.add(1, labels);
    this.dbQueryDurationHistogram.record(duration, labels);
    
    if (error) {
      this.errorCounter.add(1, {
        error_type: 'DatabaseError',
        operation,
        model,
      });
    }
    
    // Check query time threshold
    if (duration > PERFORMANCE_THRESHOLDS.DB_QUERY_TIME_CRITICAL) {
      alertEmitter.emit('alert', {
        type: 'DB_QUERY_TIME_CRITICAL',
        message: `Critical database query time: ${duration}ms for ${operation} on ${model}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.DB_QUERY_TIME_CRITICAL,
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.DB_QUERY_TIME_WARNING) {
      alertEmitter.emit('alert', {
        type: 'DB_QUERY_TIME_WARNING',
        message: `Slow database query: ${duration}ms for ${operation} on ${model}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.DB_QUERY_TIME_WARNING,
      });
    }
  }
  
  /**
   * Record cache operation metrics
   */
  public recordCacheOperation(
    operation: 'get' | 'set' | 'delete',
    key: string,
    duration: number,
    hit: boolean,
    error?: Error
  ): void {
    const labels = {
      operation,
      key_pattern: this.extractKeyPattern(key),
    };
    
    this.cacheOperationDurationHistogram.record(duration, labels);
    
    if (operation === 'get') {
      if (hit) {
        this.cacheHitCounter.add(1, labels);
      } else {
        this.cacheMissCounter.add(1, labels);
      }
    }
    
    if (error) {
      this.errorCounter.add(1, {
        error_type: 'CacheError',
        operation,
      });
    }
  }
  
  /**
   * Record custom business metrics
   */
  public recordBusinessMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    const customMetric = meter.createHistogram(`business_${name}`, {
      description: `Business metric: ${name}`,
      valueType: ValueType.DOUBLE,
    });
    
    customMetric.record(value, labels);
  }
  
  /**
   * Start collecting system metrics
   */
  private startSystemMetricsCollection(): void {
    setInterval(() => {
      // Memory metrics
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = usedMemory / totalMemory;
      
      this.memoryUsageGauge.add(memUsage.heapUsed);
      
      // Check memory threshold
      if (memoryUsagePercent > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_CRITICAL) {
        alertEmitter.emit('alert', {
          type: 'MEMORY_USAGE_CRITICAL',
          message: `Critical memory usage: ${(memoryUsagePercent * 100).toFixed(2)}%`,
          value: memoryUsagePercent,
          threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE_CRITICAL,
        });
      } else if (memoryUsagePercent > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING) {
        alertEmitter.emit('alert', {
          type: 'MEMORY_USAGE_WARNING',
          message: `High memory usage: ${(memoryUsagePercent * 100).toFixed(2)}%`,
          value: memoryUsagePercent,
          threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING,
        });
      }
      
      // CPU metrics
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      this.cpuUsageGauge.add(cpuPercent);
      
      // V8 heap statistics
      const heapStats = v8.getHeapStatistics();
      meter.createUpDownCounter('v8_heap_size_bytes', {
        description: 'V8 heap size in bytes',
        unit: 'bytes',
      }).add(heapStats.total_heap_size);
      
      meter.createUpDownCounter('v8_heap_used_bytes', {
        description: 'V8 heap used in bytes',
        unit: 'bytes',
      }).add(heapStats.used_heap_size);
      
    }, 10000); // Collect every 10 seconds
  }
  
  /**
   * Check error rate threshold
   */
  private async checkErrorRateThreshold(): Promise<void> {
    // Implementation would check error rate over time window
    // This is a simplified version
    const errorRate = await this.calculateErrorRate();
    
    if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL) {
      alertEmitter.emit('alert', {
        type: 'ERROR_RATE_CRITICAL',
        message: `Critical error rate: ${(errorRate * 100).toFixed(2)}%`,
        value: errorRate,
        threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL,
      });
    } else if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING) {
      alertEmitter.emit('alert', {
        type: 'ERROR_RATE_WARNING',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        value: errorRate,
        threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING,
      });
    }
  }
  
  /**
   * Calculate error rate
   */
  private async calculateErrorRate(): Promise<number> {
    // Simplified implementation
    // In production, this would query metrics storage
    return 0.01; // Placeholder
  }
  
  /**
   * Normalize URL path for metrics
   */
  private normalizePath(path: string): string {
    // Replace dynamic segments with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
      .replace(/\?.*$/, '');
  }
  
  /**
   * Extract cache key pattern
   */
  private extractKeyPattern(key: string): string {
    // Extract pattern from cache key
    const parts = key.split(': ');
    if (parts.length > 1) {
      return `${parts[0]}:*`;
    }
    return 'unknown';
  }
}

/**
 * APM middleware for Express/Next.js
 */
export const apmMiddleware = (req: any, res: any, next: any) => {
  const startTime = performance.now();
  const apm = APMCollector.getInstance();
  
  // Intercept response end
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = performance.now() - startTime;
    
    // Record metrics
    apm.recordHttpRequest(
      req.method,
      req.path || req.url,
      res.statusCode,
      duration,
      res.locals.error
    );
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

/**
 * Database query monitoring wrapper
 */
export const monitorDatabaseQuery = async <T>(
  operation: string,
  model: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  const apm = APMCollector.getInstance();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;
    
    apm.recordDatabaseQuery(operation, model, duration, true);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    apm.recordDatabaseQuery(operation, model, duration, false, error as Error);
    
    throw error;
  }
};

/**
 * Cache operation monitoring wrapper
 */
export const monitorCacheOperation = async <T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  operationFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  const apm = APMCollector.getInstance();
  
  try {
    const result = await operationFn();
    const duration = performance.now() - startTime;
    
    const hit = operation === 'get' && result !== null && result !== undefined;
    
    apm.recordCacheOperation(operation, key, duration, hit);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    apm.recordCacheOperation(operation, key, duration, false, error as Error);
    
    throw error;
  }
};

// Export alert emitter for external listeners
export { alertEmitter };