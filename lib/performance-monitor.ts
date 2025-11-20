/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for tracking and logging performance metrics
 * across the application with minimal overhead.
 */

import { logger } from '@/lib/logger';

/**
 * Performance metric data structure
 */
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance thresholds for alerting
 */
const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 2000,      // 2 seconds
  COMPONENT_RENDER_TIME: 100,   // 100ms
  DATA_FETCH_TIME: 1000,        // 1 second
} as const;

/**
 * Simple in-memory metrics store for recent performance data
 * Limited to last 100 metrics to prevent memory leaks
 */
const metricsStore: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Record a performance metric
 *
 * @param metric - The performance metric to record
 *
 * @example
 * ```tsx
 * recordMetric({
 *   name: 'api.analytics.fetch',
 *   value: 450,
 *   unit: 'ms',
 *   timestamp: Date.now(),
 *   metadata: { endpoint: '/api/analytics/student' }
 * });
 * ```
 */
export function recordMetric(metric: PerformanceMetric): void {
  // Add to store
  metricsStore.push(metric);

  // Limit store size
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }

  // Log if exceeds threshold
  const threshold = getThresholdForMetric(metric.name);
  if (threshold && metric.value > threshold) {
    logger.warn('[PERFORMANCE] Metric exceeded threshold', {
      metric: metric.name,
      value: `${metric.value}${metric.unit}`,
      threshold: `${threshold}${metric.unit}`,
      metadata: metric.metadata,
    });
  }
}

/**
 * Get performance threshold for a metric name
 */
function getThresholdForMetric(name: string): number | null {
  if (name.includes('api')) return PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME;
  if (name.includes('render')) return PERFORMANCE_THRESHOLDS.COMPONENT_RENDER_TIME;
  if (name.includes('fetch')) return PERFORMANCE_THRESHOLDS.DATA_FETCH_TIME;
  return null;
}

/**
 * Measure the execution time of an async function
 *
 * @param name - Name of the operation being measured
 * @param fn - Async function to measure
 * @param metadata - Optional metadata to include in the metric
 * @returns The result of the async function
 *
 * @example
 * ```tsx
 * const data = await measureAsync(
 *   'analytics.fetch',
 *   () => fetch('/api/analytics'),
 *   { userId: 'user-123' }
 * );
 * ```
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: true },
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: false, error: String(error) },
    });

    throw error;
  }
}

/**
 * Measure synchronous function execution time
 *
 * @param name - Name of the operation being measured
 * @param fn - Function to measure
 * @param metadata - Optional metadata to include in the metric
 * @returns The result of the function
 *
 * @example
 * ```tsx
 * const result = measureSync('data.transform', () => {
 *   return transformData(rawData);
 * });
 * ```
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;

    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: true },
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { ...metadata, success: false, error: String(error) },
    });

    throw error;
  }
}

/**
 * Get performance metrics for analysis
 *
 * @param filter - Optional filter function
 * @returns Array of metrics matching the filter
 *
 * @example
 * ```tsx
 * const apiMetrics = getMetrics(m => m.name.includes('api'));
 * const slowMetrics = getMetrics(m => m.value > 1000);
 * ```
 */
export function getMetrics(
  filter?: (metric: PerformanceMetric) => boolean
): PerformanceMetric[] {
  if (!filter) return [...metricsStore];
  return metricsStore.filter(filter);
}

/**
 * Calculate average metric value for a given metric name
 *
 * @param name - Metric name to calculate average for
 * @returns Average value or null if no metrics found
 *
 * @example
 * ```tsx
 * const avgApiTime = getAverageMetric('api.analytics.fetch');
 * ```
 */
export function getAverageMetric(name: string): number | null {
  const metrics = getMetrics(m => m.name === name);
  if (metrics.length === 0) return null;

  const sum = metrics.reduce((acc, m) => acc + m.value, 0);
  return sum / metrics.length;
}

/**
 * Clear all stored metrics (useful for testing or reset)
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Get performance summary for logging/debugging
 *
 * @returns Summary object with metric statistics
 */
export function getPerformanceSummary(): {
  totalMetrics: number;
  averages: Record<string, number>;
  slowestOperations: Array<{ name: string; value: number; unit: string }>;
} {
  const uniqueNames = [...new Set(metricsStore.map(m => m.name))];
  const averages: Record<string, number> = {};

  uniqueNames.forEach(name => {
    const avg = getAverageMetric(name);
    if (avg !== null) {
      averages[name] = Math.round(avg * 100) / 100;
    }
  });

  const slowestOperations = [...metricsStore]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(m => ({ name: m.name, value: m.value, unit: m.unit }));

  return {
    totalMetrics: metricsStore.length,
    averages,
    slowestOperations,
  };
}

/**
 * Mark a performance milestone (for React component rendering)
 *
 * @param component - Component name
 * @param phase - Render phase ('mount' | 'update' | 'unmount')
 * @param actualDuration - Actual time spent rendering
 * @param metadata - Additional metadata
 *
 * @example
 * ```tsx
 * markRenderTime('AnalyticsDashboard', 'mount', 45.2, { itemCount: 100 });
 * ```
 */
export function markRenderTime(
  component: string,
  phase: 'mount' | 'update' | 'unmount',
  actualDuration: number,
  metadata?: Record<string, unknown>
): void {
  recordMetric({
    name: `component.${component}.${phase}`,
    value: actualDuration,
    unit: 'ms',
    timestamp: Date.now(),
    metadata,
  });
}
