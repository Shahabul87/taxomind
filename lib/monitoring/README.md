# Enterprise Monitoring and Observability System

## Overview

The Taxomind monitoring system provides comprehensive observability into application performance, health, and business metrics. It includes distributed tracing, real-time alerting, automated incident response, and customizable dashboards.

## Features

### 1. **Application Performance Monitoring (APM)**
- Real-time performance metrics collection
- Request/response time tracking
- Database query monitoring
- Cache performance analysis
- Memory and CPU usage monitoring
- Error rate tracking with automatic alerting

### 2. **Distributed Tracing**
- End-to-end request tracing
- Database query tracing
- Cache operation tracing
- External API call tracing
- AI/LLM operation tracing
- Transaction flow visualization

### 3. **Custom Metrics & Dashboards**
- Business metrics (revenue, engagement, conversion)
- Technical metrics (latency, throughput, errors)
- Role-based dashboards (admin, teacher, student)
- Real-time data visualization
- Custom dashboard creation

### 4. **Alerting System**
- Configurable alert rules
- Multiple severity levels
- Multi-channel notifications (email, SMS, Slack, PagerDuty)
- Alert aggregation and correlation
- Cooldown periods to prevent alert fatigue

### 5. **Health Monitoring**
- Application health checks
- Database connectivity monitoring
- Cache health monitoring
- External service dependency checks
- Resource utilization monitoring
- Liveness and readiness probes

### 6. **Automated Incident Response**
- Automatic remediation actions
- Service restart capabilities
- Cache clearing
- Connection pool reset
- Rate limiting activation
- Rollback capabilities
- Incident correlation and escalation

## Quick Start

### Installation

The monitoring system is automatically initialized when the application starts in production mode or when `ENABLE_MONITORING=true` is set.

### Environment Variables

```env
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=taxomind-app
OTEL_SERVICE_VERSION=1.0.0
OTEL_PROMETHEUS_PORT=9464

# Alert Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@taxomind.com
SMTP_PASS=your-password
SMTP_FROM=alerts@taxomind.com

# Twilio (SMS Alerts)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Enable Monitoring
ENABLE_MONITORING=true
```

## Usage Examples

### Basic Database Query Monitoring

```typescript
import { monitorDatabaseQuery } from '@/lib/monitoring/init';

const user = await monitorDatabaseQuery(
  'findUnique',
  'User',
  async () => {
    return await db.user.findUnique({
      where: { id: userId }
    });
  }
);
```

### Cache Operation Monitoring

```typescript
import { monitorCacheOperation } from '@/lib/monitoring/init';

const cached = await monitorCacheOperation(
  'get',
  cacheKey,
  async () => {
    return await redis.get(cacheKey);
  }
);
```

### Using the @Trace Decorator

```typescript
import { Trace } from '@/lib/monitoring/init';

class UserService {
  @Trace('UserService.getProfile')
  async getProfile(userId: string) {
    // Method is automatically traced
    return await db.user.findUnique({ where: { id: userId } });
  }
}
```

### Recording Custom Metrics

```typescript
import { monitoring } from '@/lib/monitoring/init';

const metrics = monitoring.getComponents().metrics;

metrics.recordCustomMetric(
  'course_completion',
  1,
  'counter',
  { courseId, userId }
);
```

### Manual Health Check

```typescript
import { monitoring } from '@/lib/monitoring/init';

const health = monitoring.getComponents().health;

health.registerCheck({
  name: 'payment_gateway',
  checkFn: async () => {
    // Your health check logic
    const isHealthy = await checkPaymentGateway();
    return {
      name: 'payment_gateway',
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'Payment gateway operational' : 'Payment gateway down',
      responseTime: 100,
      timestamp: new Date(),
    };
  },
  critical: true,
  timeout: 5000,
  retries: 3,
  interval: 30000,
});
```

## API Endpoints

### Health Check
```
GET /api/monitoring/health
GET /api/monitoring/health?detailed=true
GET /api/monitoring/health?type=liveness
GET /api/monitoring/health?type=readiness
```

### Metrics
```
GET /api/monitoring/metrics?role=admin
GET /api/monitoring/metrics?role=teacher
GET /api/monitoring/metrics?role=student
```

### Alerts
```
GET /api/monitoring/alerts?status=active
GET /api/monitoring/alerts?status=history
POST /api/monitoring/alerts
  Body: { action: 'acknowledge' | 'resolve', alertId: string }
```

### Dashboards
```
GET /api/monitoring/dashboards
GET /api/monitoring/dashboards?id=overview
POST /api/monitoring/dashboards
  Body: { name: string, widgets: Widget[] }
```

### Incidents
```
GET /api/monitoring/incidents?status=active
GET /api/monitoring/incidents?id=INC-123456
```

## Dashboard Types

### 1. Overview Dashboard
- System health gauge
- Active users count
- Response time trends
- Error rate graph
- Active alerts list

### 2. Performance Dashboard
- Request throughput
- Latency distribution heatmap
- Database performance metrics
- Cache hit/miss rates
- Memory and CPU usage

### 3. Business Dashboard
- Revenue metrics
- Conversion rates
- User growth trends
- Course performance
- Engagement metrics

### 4. Infrastructure Dashboard
- CPU usage trends
- Memory breakdown
- Disk usage
- Network I/O
- Service health status

## Alert Severity Levels

- **INFO**: Informational alerts, no action required
- **WARNING**: Potential issues that should be investigated
- **ERROR**: Errors that need attention but service is operational
- **CRITICAL**: Service impacting issues requiring immediate action

## Incident Severity Levels

- **SEV1**: Critical - Service is down or severely degraded
- **SEV2**: Major - Significant functionality impacted
- **SEV3**: Minor - Non-critical functionality affected
- **SEV4**: Low - Informational or cosmetic issues

## Automated Remediation Actions

The system can automatically perform the following remediation actions:

1. **RESTART_SERVICE**: Restart the application service
2. **SCALE_UP**: Increase the number of instances
3. **SCALE_DOWN**: Decrease the number of instances
4. **CLEAR_CACHE**: Clear Redis cache
5. **RESET_CONNECTION_POOL**: Reset database connections
6. **ROTATE_LOGS**: Rotate application logs
7. **ENABLE_RATE_LIMITING**: Enable stricter rate limits
8. **DISABLE_FEATURE**: Disable problematic features
9. **FAILOVER**: Switch to backup systems
10. **ROLLBACK**: Rollback to previous deployment

## Performance Impact

The monitoring system is designed to have minimal performance impact:

- Asynchronous metric collection
- Sampling for high-volume operations
- Efficient data structures
- Configurable collection intervals
- Automatic backpressure handling

## Data Retention

- **Metrics**: 30 days (configurable)
- **Traces**: 7 days
- **Alerts**: 30 days
- **Incidents**: 90 days
- **Health checks**: 24 hours

## Security Considerations

- All sensitive data is sanitized in traces and logs
- Authentication required for all monitoring endpoints
- Role-based access control for dashboards
- Encrypted storage for alert configurations
- Audit logging for all administrative actions

## Troubleshooting

### Monitoring Not Starting
1. Check `ENABLE_MONITORING` environment variable
2. Verify OpenTelemetry endpoint is accessible
3. Check application logs for initialization errors

### Missing Metrics
1. Verify metric collection intervals
2. Check database and Redis connectivity
3. Review metric aggregation configuration

### Alerts Not Firing
1. Verify alert rules are enabled
2. Check notification channel configuration
3. Review cooldown periods
4. Check alert thresholds

### Dashboard Not Loading
1. Verify user permissions
2. Check widget data collection
3. Review dashboard configuration

## Best Practices

1. **Use structured logging** for better correlation with traces
2. **Set appropriate alert thresholds** to avoid alert fatigue
3. **Regularly review and update dashboards** based on needs
4. **Document custom metrics** for team understanding
5. **Test remediation actions** in staging before production
6. **Review incident postmortems** for continuous improvement
7. **Monitor the monitors** - ensure monitoring system health

## Support

For issues or questions about the monitoring system, please contact the platform team or create an issue in the repository.

## License

This monitoring system is part of the Taxomind platform and follows the same licensing terms.