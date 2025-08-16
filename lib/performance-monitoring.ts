import { trace, metrics, context } from '@opentelemetry/api'

// Create tracer and meter
const tracer = trace.getTracer('alam-lms', '1.0.0')
const meter = metrics.getMeter('alam-lms', '1.0.0')

// Metrics
const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms',
})

const httpRequestTotal = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
})

const databaseQueryDuration = meter.createHistogram('database_query_duration_ms', {
  description: 'Duration of database queries in milliseconds',
  unit: 'ms',
})

const databaseQueryTotal = meter.createCounter('database_queries_total', {
  description: 'Total number of database queries',
})

const activeUsers = meter.createUpDownCounter('active_users', {
  description: 'Number of active users',
})

const courseEnrollments = meter.createCounter('course_enrollments_total', {
  description: 'Total number of course enrollments',
})

const videoWatchTime = meter.createHistogram('video_watch_time_seconds', {
  description: 'Video watch time in seconds',
  unit: 's',
})

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
    
    return tracer.startActiveSpan(`HTTP ${method} ${name}`, async (span) => {
      try {
        span.setAttributes({
          'http.method': method,
          'http.url': url,
          'http.route': name,
        })

        const result = await fn()
        
        const duration = Date.now() - startTime
        span.setAttributes({
          'http.status_code': 200,
          'http.response_time_ms': duration,
        })
        
        // Record metrics
        httpRequestDuration.record(duration, {
          method,
          route: name,
          status: '200',
        })
        
        httpRequestTotal.add(1, {
          method,
          route: name,
          status: '200',
        })

        return result
      } catch (error: any) {
        const duration = Date.now() - startTime
        span.recordException(error as Error)
        span.setAttributes({
          'http.status_code': 500,
          'http.response_time_ms': duration,
        })
        
        httpRequestDuration.record(duration, {
          method,
          route: name,
          status: '500',
        })
        
        httpRequestTotal.add(1, {
          method,
          route: name,
          status: '500',
        })

        throw error
      } finally {
        span.end()
      }
    })
  },

  // Trace database operations
  traceDatabaseQuery: async <T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now()
    
    return tracer.startActiveSpan(`DB ${operation} ${table}`, async (span) => {
      try {
        span.setAttributes({
          'db.operation': operation,
          'db.collection.name': table,
        })

        const result = await fn()
        
        const duration = Date.now() - startTime
        span.setAttributes({
          'db.response_time_ms': duration,
        })
        
        // Record metrics
        databaseQueryDuration.record(duration, {
          operation,
          table,
          status: 'success',
        })
        
        databaseQueryTotal.add(1, {
          operation,
          table,
          status: 'success',
        })

        return result
      } catch (error: any) {
        const duration = Date.now() - startTime
        span.recordException(error as Error)
        span.setAttributes({
          'db.response_time_ms': duration,
        })
        
        databaseQueryDuration.record(duration, {
          operation,
          table,
          status: 'error',
        })
        
        databaseQueryTotal.add(1, {
          operation,
          table,
          status: 'error',
        })

        throw error
      } finally {
        span.end()
      }
    })
  },

  // Track user sessions
  trackUserSession: (userId: string, action: 'login' | 'logout') => {
    if (action === 'login') {
      activeUsers.add(1, { userId })
    } else {
      activeUsers.add(-1, { userId })
    }
  },

  // Track course enrollments
  trackCourseEnrollment: (courseId: string, userId: string) => {
    courseEnrollments.add(1, { courseId, userId })
  },

  // Track video watch time
  trackVideoWatchTime: (videoId: string, userId: string, duration: number) => {
    videoWatchTime.record(duration, { videoId, userId })
  },

  // Create custom spans for complex operations
  createSpan: (name: string, attributes?: Record<string, string | number>) => {
    const span = tracer.startSpan(name)
    if (attributes) {
      span.setAttributes(attributes)
    }
    return span
  },

  // Get current trace context
  getCurrentContext: () => context.active(),

  // Set context for async operations
  setContext: <T>(ctx: any, fn: () => T): T => {
    return context.with(ctx, fn)
  },
}

// Error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  const span = tracer.startSpan('error')
  span.recordException(error)
  
  if (context) {
    span.setAttributes(context)
  }
  
  span.end()
}

// Performance thresholds for alerting
export const PERFORMANCE_THRESHOLDS = {
  HTTP_REQUEST_SLOW: 2000, // 2 seconds
  DATABASE_QUERY_SLOW: 1000, // 1 second
  VIDEO_LOAD_SLOW: 5000, // 5 seconds
  PAGE_LOAD_SLOW: 3000, // 3 seconds
}

// Check if operation is slow and create alert
export const checkPerformanceThreshold = (
  operation: string,
  duration: number,
  threshold: number
) => {
  if (duration > threshold) {
    const span = tracer.startSpan(`slow_${operation}`)
    span.setAttributes({
      'performance.operation': operation,
      'performance.duration_ms': duration,
      'performance.threshold_ms': threshold,
      'performance.exceeded_by_ms': duration - threshold,
    })
    span.end()
  }
}