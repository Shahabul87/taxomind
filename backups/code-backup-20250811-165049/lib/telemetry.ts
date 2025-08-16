import { logger } from '@/lib/logger';

// Simplified telemetry without OpenTelemetry dependencies
// This provides basic performance monitoring without external packages

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class SimpleTelemetry {
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.ENABLE_TELEMETRY === 'true'
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return

    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log performance issues
    if (this.isPerformanceIssue(name, value)) {
      logger.warn(`Performance issue detected: ${name} = ${value}ms`, metadata)
    }
  }

  // Check if metric indicates a performance issue
  private isPerformanceIssue(name: string, value: number): boolean {
    const thresholds = {
      'http_request_duration': 2000,
      'database_query_duration': 1000,
      'page_load_duration': 3000,
      'video_load_duration': 5000,
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    return threshold ? value > threshold : false
  }

  // Get recent metrics
  getMetrics(limit = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit)
  }

  // Get metrics by name
  getMetricsByName(name: string, limit = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit)
  }

  // Clear metrics
  clear() {
    this.metrics = []
  }

  // Get summary statistics
  getSummary() {
    const now = Date.now()
    const last24h = this.metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000)
    
    const metricsByName = last24h.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    const summary = Object.entries(metricsByName).map(([name, values]) => {
      values.sort((a, b) => a - b)
      return {
        name,
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.floor(values.length * 0.95)],
      }
    })

    return summary
  }
}

// Global telemetry instance
export const telemetry = new SimpleTelemetry()

// Performance monitoring utilities
export const performanceMonitoring = {
  // Trace HTTP requests
  traceHttpRequest: async <T>(
    name: string,
    method: string,
    url: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      
      telemetry.recordMetric('http_request_duration', duration, {
        method,
        url,
        name,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      telemetry.recordMetric('http_request_duration', duration, {
        method,
        url,
        name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  },

  // Trace database operations
  traceDatabaseQuery: async <T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      
      telemetry.recordMetric('database_query_duration', duration, {
        operation,
        table,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      telemetry.recordMetric('database_query_duration', duration, {
        operation,
        table,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  },

  // Track user sessions
  trackUserSession: (userId: string, action: 'login' | 'logout') => {
    telemetry.recordMetric('user_session', action === 'login' ? 1 : -1, {
      userId,
      action
    })
  },

  // Track course enrollments
  trackCourseEnrollment: (courseId: string, userId: string) => {
    telemetry.recordMetric('course_enrollment', 1, {
      courseId,
      userId
    })
  },

  // Track video watch time
  trackVideoWatchTime: (videoId: string, userId: string, duration: number) => {
    telemetry.recordMetric('video_watch_time', duration, {
      videoId,
      userId
    })
  },

  // Get performance summary
  getPerformanceSummary: () => {
    return telemetry.getSummary()
  },

  // Record custom metric
  recordCustomMetric: (name: string, value: number, metadata?: Record<string, any>) => {
    telemetry.recordMetric(name, value, metadata)
  }
}

// Initialize telemetry
export const initTelemetry = () => {
  if (process.env.ENABLE_TELEMETRY === 'true') {
}
}

// Export for backward compatibility
export { telemetry as default }