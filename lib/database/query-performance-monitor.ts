/**
 * Database Query Performance Monitor
 * Phase 3.1: Query performance monitoring and optimization
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

// Use performance API conditionally based on environment
const getPerformance = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return window.performance;
  } else {
    // Node.js environment
    try {
      const { performance } = require('perf_hooks');
      return performance;
    } catch {
      // Fallback if perf_hooks is not available
      return {
        now: () => Date.now()
      };
    }
  }
};

const performance = getPerformance();

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  operation: string;
  model: string;
  slow: boolean;
}

interface QueryStats {
  totalQueries: number;
  averageDuration: number;
  slowQueries: number;
  slowQueryThreshold: number;
}

class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxMetricsSize = 1000;
  private isEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUERY_MONITORING === 'true';

  private constructor() {}

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  /**
   * Wrap Prisma client to monitor query performance
   */
  wrapPrismaClient(prisma: PrismaClient): PrismaClient {
    if (!this.isEnabled) return prisma;

    const monitor = this;
    // Extend Prisma client with query monitoring
    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const startTime = performance.now();
            const result = await query(args);
            const duration = performance.now() - startTime;

            monitor.recordQuery({
              query: `${model}.${operation}`,
              duration,
              timestamp: new Date(),
              operation,
              model,
              slow: duration > monitor.slowQueryThreshold,
            });

            // Log slow queries immediately
            if (duration > monitor.slowQueryThreshold) {
              logger.warn(`[SLOW_QUERY] ${model}.${operation} took ${duration.toFixed(2)}ms`, {
                args: JSON.stringify(args, null, 2),
                duration,
              });
            }

            return result;
          },
        },
      },
    });
  }

  /**
   * Record query metrics
   */
  private recordQuery(metric: QueryMetrics): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get query statistics
   */
  getStats(): QueryStats {
    const totalQueries = this.metrics.length;
    const averageDuration = totalQueries > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    const slowQueries = this.metrics.filter(m => m.slow).length;

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      slowQueryThreshold: this.slowQueryThreshold,
    };
  }

  /**
   * Get slow queries for analysis
   */
  getSlowQueries(limit = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => m.slow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get queries by model
   */
  getQueriesByModel(model: string): QueryMetrics[] {
    return this.metrics.filter(m => m.model.toLowerCase() === model.toLowerCase());
  }

  /**
   * Get query frequency analysis
   */
  getQueryFrequency(): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      const key = metric.query;
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return Object.fromEntries(
      Object.entries(frequency).sort(([,a], [,b]) => b - a)
    );
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): {
    recommendations: string[];
    topSlowQueries: QueryMetrics[];
    mostFrequentQueries: Array<{ query: string; count: number; avgDuration: number }>;
  } {
    const stats = this.getStats();
    const slowQueries = this.getSlowQueries(5);
    const frequency = this.getQueryFrequency();
    const recommendations: string[] = [];

    // Generate recommendations
    if (stats.slowQueries > stats.totalQueries * 0.1) {
      recommendations.push(`High slow query rate: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%. Consider adding indexes or optimizing queries.`);
    }

    if (stats.averageDuration > 500) {
      recommendations.push(`Average query duration is high: ${stats.averageDuration.toFixed(2)}ms. Review query patterns and database indexes.`);
    }

    // Analyze most frequent queries
    const mostFrequentQueries = Object.entries(frequency)
      .slice(0, 10)
      .map(([query, count]) => {
        const queryMetrics = this.metrics.filter(m => m.query === query);
        const avgDuration = queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length;
        
        return { query, count, avgDuration };
      });

    // Check for N+1 query patterns
    const potentialN1Queries = mostFrequentQueries.filter(q => 
      q.count > 10 && q.query.includes('.findMany')
    );

    if (potentialN1Queries.length > 0) {
      recommendations.push(`Potential N+1 query patterns detected. Consider using batch loading or include statements.`);
    }

    return {
      recommendations,
      topSlowQueries: slowQueries,
      mostFrequentQueries,
    };
  }

  /**
   * Clear metrics (useful for testing or periodic cleanup)
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const insights = this.getPerformanceInsights();
    const frequency = this.getQueryFrequency();

    let report = `
=== Database Query Performance Report ===
Generated: ${new Date().toISOString()}

OVERVIEW:
- Total Queries: ${stats.totalQueries}
- Average Duration: ${stats.averageDuration.toFixed(2)}ms
- Slow Queries: ${stats.slowQueries} (${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%)
- Slow Query Threshold: ${stats.slowQueryThreshold}ms

TOP SLOW QUERIES:
${insights.topSlowQueries.map((q, i) => 
  `${i + 1}. ${q.query} - ${q.duration.toFixed(2)}ms (${q.timestamp.toISOString()})`
).join('\n')}

MOST FREQUENT QUERIES:
${insights.mostFrequentQueries.map((q, i) => 
  `${i + 1}. ${q.query} - ${q.count} times, avg ${q.avgDuration.toFixed(2)}ms`
).join('\n')}

RECOMMENDATIONS:
${insights.recommendations.map(r => `- ${r}`).join('\n')}

=== End of Report ===
    `;

    return report.trim();
  }
}

// Singleton instance
export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance();

// Helper function to create monitored Prisma client
export function createMonitoredPrismaClient(prisma: PrismaClient): PrismaClient {
  return queryPerformanceMonitor.wrapPrismaClient(prisma);
}

// Export for API endpoints
export { QueryPerformanceMonitor, type QueryMetrics, type QueryStats };