import { logger } from '@/lib/logger';

/**
 * Simple performance monitoring for identifying bottlenecks
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private readonly maxMetrics = 1000;
  
  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }
  
  /**
   * End timing and record metric
   */
  endTimer(name: string, metadata?: any): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(name);
    
    // Record metric
    this.recordMetric({
      name,
      duration,
      timestamp: new Date(),
      metadata,
    });
    
    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration}ms`, metadata);
    }
    
    return duration;
  }
  
  /**
   * Wrap an async function with timing
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name, metadata);
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, error: true });
      throw error;
    }
  }
  
  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Limit memory usage
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats(name?: string): any {
    const relevantMetrics = name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;
    
    if (relevantMetrics.length === 0) {
      return null;
    }
    
    const durations = relevantMetrics.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);
    
    return {
      count: relevantMetrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  
  /**
   * Get slow operations
   */
  getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware for API routes
 */
export function withPerformanceMonitoring(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;
    
    return await perfMonitor.measure(
      `api:${path}`,
      () => handler(req),
      { method: req.method, path }
    );
  };
}