# ADR-0010: Choose Monitoring and Observability Stack

## Status
Accepted

## Context
The Taxomind LMS requires comprehensive monitoring and observability to:
- Track application performance and user experience
- Detect and diagnose issues before they impact users
- Monitor business metrics and KPIs
- Ensure SLA compliance
- Support capacity planning and scaling decisions
- Enable data-driven decision making
- Provide audit trails for compliance
- Track AI model performance and costs

Key requirements include:
- Real-time monitoring with minimal performance impact
- Distributed tracing across services
- Log aggregation and analysis
- Custom metrics and dashboards
- Alerting and incident management
- Cost tracking for cloud resources
- User behavior analytics
- Error tracking and debugging

## Decision
We will implement a comprehensive observability stack using:
- **Application Monitoring**: Vercel Analytics + Custom Metrics
- **Error Tracking**: Sentry for error monitoring
- **Logging**: Structured logging with correlation IDs
- **Tracing**: OpenTelemetry for distributed tracing
- **Metrics**: Prometheus-compatible metrics
- **Synthetic Monitoring**: Checkly for uptime monitoring
- **Real User Monitoring**: Web Vitals tracking
- **Custom Analytics**: In-house analytics for learning metrics

## Consequences

### Positive
- **Full Stack Visibility**: Complete view from frontend to database
- **Proactive Detection**: Issues identified before user reports
- **Performance Optimization**: Data-driven performance improvements
- **Debugging Efficiency**: Faster root cause analysis
- **Business Intelligence**: Insights into user behavior and platform usage
- **Compliance**: Audit trails and security monitoring
- **Cost Control**: Resource usage tracking and optimization
- **Scalability**: Metrics inform scaling decisions

### Negative
- **Complexity**: Multiple tools to integrate and maintain
- **Cost**: Monitoring infrastructure adds operational costs
- **Performance Overhead**: Monitoring adds latency
- **Data Volume**: Large amounts of telemetry data to manage
- **Learning Curve**: Team needs to learn multiple tools
- **Privacy Concerns**: Need to handle sensitive data carefully

## Alternatives Considered

### 1. All-in-One APM (DataDog/New Relic)
- **Pros**: Single vendor, comprehensive features, unified dashboard
- **Cons**: Expensive at scale, vendor lock-in, data sovereignty
- **Reason for rejection**: Cost prohibitive for our scale

### 2. Open Source Stack (Prometheus + Grafana + ELK)
- **Pros**: No vendor lock-in, customizable, cost-effective
- **Cons**: High maintenance, complex setup, no support
- **Reason for rejection**: Too much operational overhead

### 3. Cloud Provider Native (AWS CloudWatch/Azure Monitor)
- **Pros**: Deep integration, managed service, unified billing
- **Cons**: Vendor lock-in, limited features, poor UX
- **Reason for rejection**: Not cloud-agnostic enough

### 4. Minimal Monitoring (Logs only)
- **Pros**: Simple, low cost, minimal overhead
- **Cons**: Limited visibility, reactive only, poor debugging
- **Reason for rejection**: Insufficient for enterprise requirements

## Implementation Notes

### 1. Application Performance Monitoring
```typescript
// lib/monitoring/performance.ts
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals'

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  initialize() {
    // Track Core Web Vitals
    onCLS(this.sendMetric)
    onFCP(this.sendMetric)
    onFID(this.sendMetric)
    onLCP(this.sendMetric)
    onTTFB(this.sendMetric)
    
    // Track custom metrics
    this.trackNavigationTiming()
    this.trackResourceTiming()
    this.trackLongTasks()
  }
  
  private sendMetric(metric: any) {
    // Send to analytics endpoint
    fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    })
  }
  
  trackCustomMetric(name: string, value: number, tags?: Record<string, any>) {
    this.sendMetric({
      name: `custom.${name}`,
      value,
      tags,
      timestamp: Date.now(),
    })
  }
  
  private trackNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      this.trackCustomMetric('navigation.dns', navigation.domainLookupEnd - navigation.domainLookupStart)
      this.trackCustomMetric('navigation.tcp', navigation.connectEnd - navigation.connectStart)
      this.trackCustomMetric('navigation.request', navigation.responseStart - navigation.requestStart)
      this.trackCustomMetric('navigation.response', navigation.responseEnd - navigation.responseStart)
      this.trackCustomMetric('navigation.dom', navigation.domComplete - navigation.domInteractive)
      this.trackCustomMetric('navigation.load', navigation.loadEventEnd - navigation.loadEventStart)
    }
  }
  
  private trackResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const metrics = {
      images: { count: 0, totalSize: 0, totalDuration: 0 },
      scripts: { count: 0, totalSize: 0, totalDuration: 0 },
      stylesheets: { count: 0, totalSize: 0, totalDuration: 0 },
      apis: { count: 0, totalDuration: 0 },
    }
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime
      const size = resource.transferSize || 0
      
      if (resource.initiatorType === 'img') {
        metrics.images.count++
        metrics.images.totalSize += size
        metrics.images.totalDuration += duration
      } else if (resource.initiatorType === 'script') {
        metrics.scripts.count++
        metrics.scripts.totalSize += size
        metrics.scripts.totalDuration += duration
      } else if (resource.initiatorType === 'css') {
        metrics.stylesheets.count++
        metrics.stylesheets.totalSize += size
        metrics.stylesheets.totalDuration += duration
      } else if (resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest') {
        metrics.apis.count++
        metrics.apis.totalDuration += duration
      }
    })
    
    Object.entries(metrics).forEach(([type, data]) => {
      this.trackCustomMetric(`resources.${type}.count`, data.count)
      if ('totalSize' in data) {
        this.trackCustomMetric(`resources.${type}.size`, data.totalSize)
      }
      this.trackCustomMetric(`resources.${type}.duration`, data.totalDuration)
    })
  }
  
  private trackLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.trackCustomMetric('long_task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            })
          }
        }
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    }
  }
}
```

### 2. Error Tracking with Sentry
```typescript
// lib/monitoring/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null
      }
      
      // Add user context
      if (event.user) {
        event.user = {
          ...event.user,
          id: event.user.id,
          // Don't send PII
          email: undefined,
          username: undefined,
        }
      }
      
      return event
    },
    
    // Custom error boundaries
    errorBoundaryOptions: {
      fallback: ({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      ),
      showDialog: false,
    },
  })
}

// Custom error boundary
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={ErrorFallback}
      showDialog={false}
      beforeCapture={(scope, error) => {
        scope.setTag('component', 'ErrorBoundary')
        scope.setContext('error_boundary', {
          timestamp: new Date().toISOString(),
          url: window.location.href,
        })
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
```

### 3. Structured Logging
```typescript
// lib/monitoring/logger.ts
import winston from 'winston'
import { trace, context } from '@opentelemetry/api'

export class Logger {
  private winston: winston.Logger
  
  constructor(service: string) {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service,
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    })
  }
  
  private enrichWithContext(meta: any = {}) {
    const span = trace.getActiveSpan()
    const spanContext = span?.spanContext()
    
    return {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      timestamp: new Date().toISOString(),
      correlationId: context.active().getValue('correlationId'),
    }
  }
  
  info(message: string, meta?: any) {
    this.winston.info(message, this.enrichWithContext(meta))
  }
  
  error(message: string, error?: Error, meta?: any) {
    this.winston.error(message, this.enrichWithContext({
      ...meta,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
    }))
  }
  
  warn(message: string, meta?: any) {
    this.winston.warn(message, this.enrichWithContext(meta))
  }
  
  debug(message: string, meta?: any) {
    this.winston.debug(message, this.enrichWithContext(meta))
  }
  
  // Audit logging
  audit(action: string, userId: string, details: any) {
    this.winston.info('AUDIT', this.enrichWithContext({
      audit: true,
      action,
      userId,
      details,
      ip: context.active().getValue('userIp'),
      userAgent: context.active().getValue('userAgent'),
    }))
  }
}

export const logger = new Logger('taxomind')
```

### 4. Distributed Tracing
```typescript
// lib/monitoring/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function initializeTracing() {
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: {
      'api-key': process.env.OTEL_API_KEY,
    },
  })
  
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'taxomind',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Too noisy
        },
      }),
    ],
  })
  
  sdk.start()
}

// Custom span creation
import { trace, SpanStatusCode } from '@opentelemetry/api'

export function createSpan(name: string, fn: () => Promise<any>) {
  const tracer = trace.getTracer('taxomind')
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      })
      span.recordException(error)
      throw error
    } finally {
      span.end()
    }
  })
}
```

### 5. Custom Metrics Collection
```typescript
// lib/monitoring/metrics.ts
export class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, any[]> = new Map()
  private flushInterval = 60000 // 1 minute
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }
  
  constructor() {
    setInterval(() => this.flush(), this.flushInterval)
  }
  
  // Counter metric
  increment(name: string, value = 1, tags?: Record<string, any>) {
    this.record('counter', name, value, tags)
  }
  
  // Gauge metric
  gauge(name: string, value: number, tags?: Record<string, any>) {
    this.record('gauge', name, value, tags)
  }
  
  // Histogram metric
  histogram(name: string, value: number, tags?: Record<string, any>) {
    this.record('histogram', name, value, tags)
  }
  
  // Timer metric
  timer(name: string, duration: number, tags?: Record<string, any>) {
    this.record('timer', name, duration, tags)
  }
  
  private record(type: string, name: string, value: number, tags?: Record<string, any>) {
    const key = `${type}.${name}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    this.metrics.get(key)!.push({
      type,
      name,
      value,
      tags,
      timestamp: Date.now(),
    })
  }
  
  private async flush() {
    if (this.metrics.size === 0) return
    
    const batch = Array.from(this.metrics.entries()).map(([key, values]) => ({
      key,
      values,
    }))
    
    this.metrics.clear()
    
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch }),
      })
    } catch (error) {
      console.error('Failed to flush metrics:', error)
    }
  }
}

// Usage helpers
export const metrics = MetricsCollector.getInstance()

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, any>
): Promise<T> {
  const start = performance.now()
  
  return fn()
    .then(result => {
      metrics.timer(name, performance.now() - start, { ...tags, status: 'success' })
      return result
    })
    .catch(error => {
      metrics.timer(name, performance.now() - start, { ...tags, status: 'error' })
      throw error
    })
}
```

### 6. Learning Analytics
```typescript
// lib/monitoring/learning-analytics.ts
export class LearningAnalytics {
  // Track course engagement
  async trackCourseEngagement(event: {
    userId: string
    courseId: string
    action: 'view' | 'enroll' | 'complete' | 'drop'
    metadata?: any
  }) {
    await db.learningEvent.create({
      data: {
        userId: event.userId,
        courseId: event.courseId,
        eventType: `course.${event.action}`,
        metadata: event.metadata,
        timestamp: new Date(),
      },
    })
    
    metrics.increment(`learning.course.${event.action}`, 1, {
      courseId: event.courseId,
    })
  }
  
  // Track learning progress
  async trackProgress(event: {
    userId: string
    courseId: string
    chapterId: string
    progress: number
    timeSpent: number
  }) {
    await db.progressEvent.create({
      data: event,
    })
    
    metrics.histogram('learning.progress', event.progress)
    metrics.timer('learning.time_spent', event.timeSpent)
  }
  
  // Track assessment performance
  async trackAssessment(event: {
    userId: string
    assessmentId: string
    score: number
    duration: number
    attempts: number
  }) {
    metrics.histogram('learning.assessment.score', event.score)
    metrics.histogram('learning.assessment.duration', event.duration)
    metrics.gauge('learning.assessment.attempts', event.attempts)
  }
  
  // Generate learning insights
  async generateInsights(userId: string) {
    const events = await db.learningEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    })
    
    // Analyze patterns
    const insights = {
      totalTimeSpent: 0,
      coursesCompleted: 0,
      averageScore: 0,
      learningStreak: 0,
      preferredLearningTime: '',
      strongestSubjects: [],
      improvementAreas: [],
    }
    
    // Process events to generate insights
    // ...
    
    return insights
  }
}
```

### 7. Dashboard Configuration
```typescript
// lib/monitoring/dashboards.ts
export const dashboards = {
  system: {
    name: 'System Health',
    widgets: [
      {
        type: 'metric',
        title: 'API Response Time',
        query: 'avg(api.response_time)',
        visualization: 'line',
      },
      {
        type: 'metric',
        title: 'Error Rate',
        query: 'rate(errors.count)',
        visualization: 'gauge',
        thresholds: { warning: 0.01, critical: 0.05 },
      },
      {
        type: 'metric',
        title: 'Active Users',
        query: 'count(distinct(user.id))',
        visualization: 'number',
      },
    ],
  },
  
  learning: {
    name: 'Learning Analytics',
    widgets: [
      {
        type: 'metric',
        title: 'Course Completions',
        query: 'sum(learning.course.complete)',
        visualization: 'bar',
      },
      {
        type: 'metric',
        title: 'Average Progress',
        query: 'avg(learning.progress)',
        visualization: 'gauge',
      },
      {
        type: 'metric',
        title: 'Time Spent Learning',
        query: 'sum(learning.time_spent)',
        visualization: 'area',
      },
    ],
  },
  
  business: {
    name: 'Business Metrics',
    widgets: [
      {
        type: 'metric',
        title: 'Revenue',
        query: 'sum(payment.amount)',
        visualization: 'number',
        format: 'currency',
      },
      {
        type: 'metric',
        title: 'New Enrollments',
        query: 'count(enrollment.created)',
        visualization: 'line',
      },
      {
        type: 'metric',
        title: 'Churn Rate',
        query: 'rate(user.churned)',
        visualization: 'percentage',
      },
    ],
  },
}
```

### 8. Alerting Rules
```typescript
// lib/monitoring/alerts.ts
export const alertRules = [
  {
    name: 'High Error Rate',
    condition: 'rate(errors.count) > 0.05',
    severity: 'critical',
    channels: ['pagerduty', 'slack'],
  },
  {
    name: 'Slow API Response',
    condition: 'avg(api.response_time) > 1000',
    severity: 'warning',
    channels: ['slack'],
  },
  {
    name: 'Database Connection Pool Exhausted',
    condition: 'db.connections.available == 0',
    severity: 'critical',
    channels: ['pagerduty'],
  },
  {
    name: 'AI API Rate Limit',
    condition: 'ai.rate_limit.remaining < 100',
    severity: 'warning',
    channels: ['email'],
  },
  {
    name: 'Payment Failure Spike',
    condition: 'rate(payment.failed) > 0.1',
    severity: 'critical',
    channels: ['pagerduty', 'slack', 'email'],
  },
]
```

## Implementation Phases
1. **Phase 1**: Basic monitoring (logs, errors, uptime)
2. **Phase 2**: Performance monitoring (APM, Web Vitals)
3. **Phase 3**: Custom metrics and dashboards
4. **Phase 4**: Distributed tracing
5. **Phase 5**: Advanced analytics and ML-based anomaly detection

## Cost Management
- Use sampling for high-volume metrics
- Implement data retention policies
- Archive old data to cold storage
- Monitor monitoring costs monthly
- Optimize query patterns for efficiency

## References
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Web Vitals](https://web.dev/vitals/)

## Date
2024-01-24

## Authors
- Taxomind Architecture Team