# Observability & Monitoring Guide

This document describes the observability stack implementation for the Taxomind LMS application, including OpenTelemetry tracing, Prometheus metrics, Grafana dashboards, and Sentry error tracking.

## Overview

The observability stack provides comprehensive monitoring and insights into:
- **Application Performance**: Response times, throughput, error rates
- **Business Metrics**: Course enrollments, user engagement, learning analytics
- **System Health**: Database performance, memory usage, CPU utilization
- **Error Tracking**: Real-time error reporting and stack traces
- **Distributed Tracing**: Request flow across services and database operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │───▶│ OTEL Collector  │───▶│     Jaeger      │
│                 │    │                 │    │   (Tracing)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         ▼              ┌─────────────────┐    ┌─────────────────┐
┌─────────────────┐    │   Prometheus    │───▶│     Grafana     │
│     Sentry      │    │   (Metrics)     │    │  (Dashboards)   │
│  (Error Track)  │    └─────────────────┘    └─────────────────┘
└─────────────────┘             │
                                ▼
                       ┌─────────────────┐
                       │  Alertmanager   │
                       │    (Alerts)     │
                       └─────────────────┘
```

## Quick Start

### 1. Environment Setup

Copy the observability environment variables to your `.env.local`:

```env
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=taxomind-lms
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
ENABLE_OTEL=true

# Sentry Error Tracking
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_public_dsn_here

# Metrics Authentication
METRICS_AUTH_TOKEN=your_secure_token_here
```

### 2. Start Observability Stack

```bash
# Start all observability services
docker-compose -f docker-compose.observability.yml up -d

# Verify services are running
docker-compose -f docker-compose.observability.yml ps
```

### 3. Initialize Tracing in Your App

Add to your `instrumentation.ts` file:

```typescript
import { initializeTracing } from '@/lib/observability/tracing';

export function register() {
  initializeTracing();
}
```

### 4. Access Dashboards

- **Grafana Dashboard**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger Tracing**: http://localhost:16686
- **Alertmanager**: http://localhost:9093

## Services Details

### OpenTelemetry (Distributed Tracing)

**Purpose**: Tracks request flows across your application and database operations.

**Key Features**:
- Automatic instrumentation for HTTP requests
- Database query tracing
- Custom span creation for business logic
- Context propagation across async operations

**Usage Example**:
```typescript
import { withObservability, trackEvent } from '@/lib/observability/middleware';

// Wrap API handlers
export const POST = createObservableHandler(async (req: NextRequest) => {
  // Track custom events
  trackEvent('course_enrolled', 'learning', { courseId: 'abc123' });
  
  // Your handler logic
  return NextResponse.json({ success: true });
});
```

### Prometheus (Metrics Collection)

**Purpose**: Collects and stores time-series metrics data.

**Key Metrics**:
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - Request latency histograms
- `course_enrollments_total` - Business metric for enrollments
- `course_purchases_total` - Business metric for purchases
- `api_errors_total` - Error rates by endpoint
- `database_query_duration_seconds` - Database performance

**Custom Metrics**:
```typescript
import { recordCourseEnrollment, recordAiGeneration } from '@/lib/observability/metrics';

// Record business events
recordCourseEnrollment('course-123', 'JavaScript Fundamentals');
recordAiGeneration('content', 'gpt-4', 2.5);
```

### Grafana (Dashboards)

**Purpose**: Visualizes metrics and provides alerting capabilities.

**Pre-configured Dashboards**:
- **LMS Overview**: Key business and performance metrics
- **System Health**: Infrastructure and resource utilization
- **Error Analysis**: Error rates and patterns
- **Learning Analytics**: Course performance and user engagement

**Dashboard Features**:
- Real-time metric visualization
- Historical trend analysis
- Customizable alerts
- Role-based access control

### Sentry (Error Tracking)

**Purpose**: Real-time error monitoring and performance tracking.

**Features**:
- Automatic error capture and reporting
- Performance monitoring with Web Vitals
- Session replay for debugging
- User context and breadcrumbs
- Release tracking

**Custom Error Reporting**:
```typescript
import * as Sentry from '@sentry/nextjs';

// Manual error reporting
Sentry.captureException(error, {
  tags: { feature: 'course-enrollment' },
  user: { id: userId, email: userEmail },
  extra: { courseId, enrollmentData }
});

// Custom breadcrumbs
Sentry.addBreadcrumb({
  message: 'User started course enrollment',
  category: 'user.action',
  data: { courseId }
});
```

## Integration with Application

### API Route Monitoring

```typescript
// app/api/courses/route.ts
import { createObservableHandler } from '@/lib/observability/middleware';

export const GET = createObservableHandler(async (req: NextRequest) => {
  // Your existing API logic
  const courses = await db.course.findMany();
  return NextResponse.json(courses);
});
```

### Database Monitoring

```typescript
// Use the observable database client
import { observableDb } from '@/lib/observability/database';

// Automatically tracked queries
const courses = await observableDb.course.findMany({
  include: { user: true }
});

// Tracked transactions
import { withDatabaseTransaction } from '@/lib/observability/database';

await withDatabaseTransaction('create-course', async (tx) => {
  const course = await tx.course.create({ data: courseData });
  const enrollment = await tx.enrollment.create({ data: enrollmentData });
  return { course, enrollment };
});
```

### User Context Tracking

```typescript
// Set user context for error tracking
import { setUserContext } from '@/lib/observability/middleware';

// After user authentication
setUserContext(user.id, user.email, user.role);
```

## Metrics Reference

### HTTP Metrics
- `http_requests_total{method, route, status_code}` - Request count
- `http_request_duration_seconds{method, route, status_code}` - Request latency

### Business Metrics
- `course_enrollments_total{course_id, course_name}` - Enrollment count
- `course_purchases_total{course_id, course_name, payment_method}` - Purchase count
- `lesson_completions_total{course_id, lesson_id}` - Completion count
- `quiz_attempts_total{course_id, quiz_id, result}` - Quiz attempts
- `active_users{user_type}` - Active user count

### System Metrics
- `api_errors_total{endpoint, error_type, status_code}` - Error count
- `database_query_duration_seconds{operation, model}` - DB performance
- `authentication_attempts_total{provider, result}` - Auth metrics
- `ai_generation_requests_total{type, model}` - AI usage

### AI/Content Metrics
- `ai_generation_duration_seconds{type, model}` - AI response time
- `ai_generation_requests_total{type, model}` - AI request count

## Alerting

### Pre-configured Alerts

1. **High Error Rate** (>10% over 2 minutes)
2. **High Response Time** (p95 >2s over 3 minutes)
3. **Application Down** (health check fails)
4. **Low Enrollment Rate** (business metric)
5. **High Memory Usage** (>1GB)
6. **Authentication Failures** (high failure rate)

### Alert Configuration

Alerts are defined in `prometheus/alert_rules.yml` and managed by Alertmanager.

**Custom Alert Example**:
```yaml
- alert: HighCourseDropoffRate
  expr: (rate(course_enrollments_total[1h]) - rate(lesson_completions_total[1h])) / rate(course_enrollments_total[1h]) > 0.8
  for: 30m
  labels:
    severity: warning
  annotations:
    summary: "High course dropout rate detected"
    description: "{{ $value }}% of enrolled users are not completing lessons"
```

## Development Commands

```bash
# Start observability stack
npm run observability:start

# Stop observability stack
npm run observability:stop

# View logs
npm run observability:logs

# Reset data (clean start)
npm run observability:reset
```

Add these to your `package.json`:

```json
{
  "scripts": {
    "observability:start": "docker-compose -f docker-compose.observability.yml up -d",
    "observability:stop": "docker-compose -f docker-compose.observability.yml down",
    "observability:logs": "docker-compose -f docker-compose.observability.yml logs -f",
    "observability:reset": "docker-compose -f docker-compose.observability.yml down -v && docker-compose -f docker-compose.observability.yml up -d"
  }
}
```

## Production Considerations

### Environment Variables

**Production Environment**:
```env
NODE_ENV=production
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector.com/v1/traces
SENTRY_DSN=https://your-production-sentry-dsn.com
METRICS_AUTH_TOKEN=your-secure-production-token
```

### Sampling Configuration

Adjust sampling rates for production:

```typescript
// lib/observability/tracing.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
```

### Security

1. **Metrics Endpoint**: Protected with `METRICS_AUTH_TOKEN`
2. **Sensitive Data**: Filtered from traces and error reports
3. **Network Security**: Configure proper firewall rules for metric ports
4. **Access Control**: Use Grafana's built-in authentication

### Performance Impact

- **OpenTelemetry**: ~1-5ms per instrumented request
- **Prometheus Metrics**: ~0.1ms per metric recording
- **Sentry**: ~2-10ms per error/performance sample
- **Memory Usage**: ~50-100MB additional for observability

### Scaling Considerations

- Use OTEL Collector for high-throughput applications
- Configure proper retention policies in Prometheus
- Use Grafana alerts judiciously to avoid alert fatigue
- Consider metric cardinality to avoid performance issues

## Troubleshooting

### Common Issues

1. **Traces Not Appearing**
   - Check OTEL_EXPORTER_OTLP_ENDPOINT configuration
   - Verify collector is running: `docker logs taxomind-otel-collector`

2. **Metrics Not Collected**
   - Ensure `/api/metrics` endpoint is accessible
   - Check Prometheus targets: http://localhost:9090/targets

3. **Grafana Dashboards Empty**
   - Verify Prometheus data source connection
   - Check if metrics are being collected

4. **High Memory Usage**
   - Reduce sampling rates in production
   - Configure metric retention policies
   - Monitor cardinality of custom metrics

### Debug Commands

```bash
# Check OTEL collector health
curl http://localhost:13133/

# Test metrics endpoint
curl http://localhost:3000/api/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# View Jaeger traces
open http://localhost:16686
```

## Contributing

When adding new observability features:

1. **Add Metrics**: Define new metrics in `lib/observability/metrics.ts`
2. **Update Dashboards**: Add panels to existing Grafana dashboards
3. **Create Alerts**: Add relevant alert rules to `prometheus/alert_rules.yml`
4. **Document**: Update this README with new metrics and features
5. **Test**: Verify metrics appear in Grafana and alerts trigger correctly

## Support

For observability-related issues:

1. Check service logs: `docker-compose -f docker-compose.observability.yml logs [service]`
2. Verify configuration files in respective directories
3. Consult service documentation for advanced configuration
4. Monitor resource usage to ensure adequate system resources

---

*This observability setup provides comprehensive monitoring for the Taxomind LMS platform. Regular review and tuning of metrics, alerts, and dashboards will help maintain optimal application performance and user experience.*