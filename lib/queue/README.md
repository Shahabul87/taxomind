# Email Queue System - Taxomind LMS

A comprehensive background job processing system for email delivery with enterprise-grade features including retry logic, dead letter queues, circuit breakers, and comprehensive monitoring.

## Features

- 🚀 **Background Processing**: Asynchronous email sending with job queuing
- 🔄 **Retry Logic**: Exponential backoff with jitter for failed emails
- 💀 **Dead Letter Queue**: Handles permanently failed emails with reprocessing
- ⚡ **Circuit Breaker**: Prevents cascading failures when email service is down
- 🚫 **Rate Limiting**: Prevents email flooding and spam
- 🔍 **Deduplication**: Prevents sending duplicate emails
- 📊 **Monitoring**: Real-time dashboard and comprehensive metrics
- 🚨 **Alerting**: SLA monitoring with configurable thresholds
- 🏠 **Fallback**: In-memory queue when Redis is unavailable
- 🔒 **Security**: Input validation and audit logging
- 📈 **Scalability**: Horizontal scaling with Redis clustering

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Email Queue   │───▶│ Email Processor │
│   (Actions)     │    │   (BullMQ)      │    │   (Workers)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │ Email Service   │
                       │   (Primary)     │    │  (Resend/SES)   │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   In-Memory     │    │  Dead Letter    │
                       │   (Fallback)    │    │     Queue       │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Basic Usage

```typescript
import { queueVerificationEmail, queue2FAEmail } from '@/lib/queue/email-queue';

// Queue a verification email
await queueVerificationEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  verificationToken: 'abc123',
  expiresAt: new Date(Date.now() + 3600000), // 1 hour
  userId: 'user-123',
  timestamp: new Date(),
});

// Queue a 2FA email with high priority
await queue2FAEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  code: '123456',
  expiresAt: new Date(Date.now() + 300000), // 5 minutes
  userId: 'user-123',
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
});
```

### 2. Start Email Processor

```bash
# As a standalone process
node lib/queue/email-processor.js

# With custom configuration
node lib/queue/email-processor.js --concurrency=5 --max-memory=1024

# As a PM2 process
pm2 start lib/queue/email-processor.js --name "email-processor" --instances 1
```

### 3. Start Monitoring

```typescript
import { startEmailMonitoring } from '@/lib/queue/email-monitoring';

await startEmailMonitoring({
  alerting: {
    enabled: true,
    thresholds: {
      errorRate: 10, // 10%
      queueDepth: 100,
      processingTime: 30000, // 30 seconds
      dlqSize: 50,
    },
  },
});
```

## Email Job Types

### Authentication Emails

#### Verification Email
```typescript
await queueVerificationEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  verificationToken: 'verification-token-123',
  expiresAt: new Date(Date.now() + 3600000),
  userId: 'user-123',
  timestamp: new Date(),
  isResend: false, // Optional: indicates if this is a resend
});
```

#### Password Reset Email
```typescript
await queuePasswordResetEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  resetToken: 'reset-token-123',
  expiresAt: new Date(Date.now() + 3600000),
  userId: 'user-123',
  timestamp: new Date(),
  ipAddress: '192.168.1.1', // Optional: for security logging
  userAgent: 'Mozilla/5.0...', // Optional: for security logging
});
```

#### Two-Factor Authentication Email
```typescript
await queue2FAEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  code: '123456',
  expiresAt: new Date(Date.now() + 300000), // 5 minutes
  userId: 'user-123',
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
  loginAttemptId: 'attempt-123', // Optional: for tracking
});
```

#### MFA Setup Confirmation
```typescript
await queueMFASetupConfirmation({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  method: 'totp', // 'totp' | 'sms' | 'email'
  setupDate: new Date(),
  userId: 'user-123',
  timestamp: new Date(),
  backupCodes: ['code1', 'code2', 'code3'], // Optional: backup codes
});
```

#### Login Alert Email
```typescript
await queueLoginAlertEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  loginDate: new Date(),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  location: 'New York, US', // Optional: geolocation
  isNewDevice: true,
  isSuccessful: true,
  userId: 'user-123',
  timestamp: new Date(),
});
```

## Configuration

### Email Queue Configuration

```typescript
const emailQueue = EmailQueue.getInstance({
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 2,
  jitterEnabled: true,
  circuitBreakerThreshold: 10, // failures before opening circuit
  circuitBreakerTimeout: 60000, // 1 minute
  rateLimiting: {
    maxPerMinute: 100,
    maxPerHour: 1000,
    burstLimit: 20,
  },
  dlq: {
    enabled: true,
    maxAge: 72, // hours
    alertThreshold: 50,
  },
  deduplication: {
    enabled: true,
    windowMinutes: 5,
  },
});
```

### Monitoring Configuration

```typescript
const emailMonitor = EmailMonitor.getInstance({
  metricsRetention: {
    realTime: 60, // minutes
    hourly: 7, // days
    daily: 30, // days
  },
  alerting: {
    enabled: true,
    thresholds: {
      errorRate: 10, // percentage
      queueDepth: 100, // number of jobs
      processingTime: 30000, // milliseconds
      dlqSize: 50, // number of jobs
    },
    channels: ['email', 'webhook'],
  },
  sla: {
    verificationEmail: 300, // 5 minutes
    passwordReset: 180, // 3 minutes
    twoFactor: 60, // 1 minute
    notification: 600, // 10 minutes
  },
});
```

### Processor Configuration

```typescript
const emailProcessor = new EmailProcessor({
  concurrency: 3,
  maxMemory: 512, // MB
  healthCheckInterval: 30000, // 30 seconds
  statsInterval: 60000, // 1 minute
  shutdownTimeout: 30000, // 30 seconds
  restartThreshold: {
    memoryMB: 400,
    errorRate: 20,
  },
});
```

## Monitoring and Administration

### API Endpoints

All monitoring endpoints require admin authentication:

#### Get Queue Status
```bash
GET /api/admin/email-queue?action=status
```

#### Get Dashboard Data
```bash
GET /api/admin/email-queue?action=dashboard
```

#### Get SLA Report
```bash
GET /api/admin/email-queue?action=sla&period=day
```

#### Get Active Alerts
```bash
GET /api/admin/email-queue?action=alerts
```

#### Get Processor Status
```bash
GET /api/admin/email-queue?action=processor
```

#### Reprocess Failed Jobs
```bash
POST /api/admin/email-queue
Content-Type: application/json

{
  "action": "reprocess-dlq",
  "data": { "limit": 10 }
}
```

#### Send Test Email
```bash
POST /api/admin/email-queue
Content-Type: application/json

{
  "action": "test-email",
  "data": { "email": "admin@example.com" }
}
```

#### Acknowledge Alert
```bash
POST /api/admin/email-queue
Content-Type: application/json

{
  "action": "acknowledge-alert",
  "data": { "alertId": "error_rate_1234567890" }
}
```

### Dashboard Metrics

The monitoring dashboard provides:

- **Real-time Queue Status**: Active, waiting, completed, failed jobs
- **Performance Metrics**: Throughput, processing time, error rates
- **SLA Compliance**: Per-email-type SLA monitoring
- **Alert Management**: Active alerts with severity levels
- **Circuit Breaker Status**: Service health monitoring
- **Resource Usage**: Memory, CPU, Redis status

### SLA Monitoring

Default SLA targets:
- **Verification Email**: 5 minutes
- **Password Reset**: 3 minutes  
- **Two-Factor**: 1 minute
- **Notifications**: 10 minutes

Violations are automatically detected and alerted.

## Production Deployment

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Email Service Configuration
RESEND_API_KEY=your-resend-api-key

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Monitoring Configuration
LOG_LEVEL=info
```

### Docker Deployment

```dockerfile
# Dockerfile for email processor
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Start email processor
CMD ["node", "lib/queue/email-processor.js"]
```

### PM2 Process Management

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'email-processor',
      script: 'lib/queue/email-processor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: 'logs/email-processor-error.log',
      out_file: 'logs/email-processor-out.log',
      log_file: 'logs/email-processor.log',
    },
  ],
};
```

### Redis Clustering

For high availability, use Redis clustering:

```javascript
// Redis cluster configuration
const redisClusterConfig = {
  enableOfflineQueue: false,
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
  clusterRetryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};
```

## Error Handling

### Retry Strategy

1. **First Attempt**: Immediate
2. **Retry 1**: 2 seconds (base delay × 2^0)
3. **Retry 2**: 4 seconds (base delay × 2^1)
4. **Retry 3**: 8 seconds (base delay × 2^2)
5. **Retry 4**: 16 seconds (base delay × 2^3)
6. **Retry 5**: 32 seconds (base delay × 2^4)

After 5 failed attempts, the job moves to the Dead Letter Queue.

### Circuit Breaker

The circuit breaker protects against email service outages:

- **Closed**: Normal operation
- **Open**: Service unavailable (fails fast)
- **Half-Open**: Testing service recovery

### Fallback Mechanisms

1. **Redis Unavailable**: Falls back to in-memory queue
2. **Email Service Down**: Circuit breaker prevents overload
3. **High Error Rate**: Automatic alerts and throttling
4. **Memory Issues**: Automatic processor restart

## Testing

Run the test suite:

```bash
# Run all email queue tests
npm test -- lib/queue/email-queue.test.ts

# Run with coverage
npm run test:coverage -- lib/queue/

# Run integration tests
npm test -- --testNamePattern="Integration Tests"
```

### Test Coverage

The test suite covers:

- ✅ Email job queuing and validation
- ✅ Retry logic and exponential backoff
- ✅ Dead Letter Queue handling
- ✅ Circuit breaker functionality
- ✅ Rate limiting enforcement
- ✅ Email deduplication
- ✅ In-memory fallback
- ✅ Monitoring and alerting
- ✅ Graceful shutdown
- ✅ Error recovery scenarios

## Performance Considerations

### Throughput

- **Default Concurrency**: 3-5 workers
- **Rate Limits**: 100 emails/minute per user
- **Batch Processing**: Bulk operations supported
- **Memory Usage**: ~50-200MB depending on queue size

### Scaling

For high-volume deployments:

1. **Horizontal Scaling**: Run multiple processor instances
2. **Redis Clustering**: Distribute queue across multiple Redis nodes
3. **Load Balancing**: Use Redis Sentinel for failover
4. **Monitoring**: Use external monitoring (Datadog, New Relic)

### Memory Management

- **Queue Cleanup**: Automatic cleanup of completed jobs
- **Memory Monitoring**: Built-in memory leak detection
- **Restart Thresholds**: Automatic restart on high memory usage
- **Resource Limits**: Configurable memory and CPU limits

## Troubleshooting

### Common Issues

#### High Error Rate
```bash
# Check email service configuration
curl -X POST /api/admin/email-queue -d '{"action": "test-email", "data": {"email": "test@yourdomain.com"}}'

# Check circuit breaker status
curl /api/admin/email-queue?action=dashboard
```

#### Queue Backup
```bash
# Check queue depth
curl /api/admin/email-queue?action=status

# Increase concurrency
# Edit processor configuration and restart
```

#### Failed Jobs in DLQ
```bash
# Reprocess failed jobs
curl -X POST /api/admin/email-queue -d '{"action": "reprocess-dlq", "data": {"limit": 10}}'

# Check specific failure reasons in logs
```

#### Memory Issues
```bash
# Check processor metrics
curl /api/admin/email-queue?action=processor

# Monitor memory usage
ps aux | grep email-processor
```

### Debugging

Enable debug logging:

```bash
export LOG_LEVEL=debug
export DEBUG=email-queue:*
```

Check logs for:
- Job processing times
- Retry attempts
- Circuit breaker state changes
- Memory usage patterns
- Error patterns

### Support

For issues and support:

1. Check the logs in `/logs/email-processor.log`
2. Review monitoring dashboard for patterns
3. Check Redis connectivity and performance
4. Verify email service configuration
5. Test with small volumes first

## Migration Guide

### From Direct Email Sending

1. **Replace Direct Calls**:
   ```typescript
   // Before
   await sendVerificationEmail(email, token);
   
   // After
   await queueVerificationEmail({
     userEmail: email,
     userName: user.name,
     verificationToken: token,
     expiresAt: tokenExpiry,
     userId: user.id,
     timestamp: new Date(),
   });
   ```

2. **Start Background Services**:
   ```bash
   # Start email processor
   npm run start:email-processor
   
   # Start monitoring
   npm run start:email-monitoring
   ```

3. **Update Error Handling**:
   ```typescript
   // Jobs are queued, not sent immediately
   // Check job status via monitoring API
   ```

### Rollback Plan

If issues occur, you can temporarily fall back to direct email sending by:

1. Setting environment variable: `EMAIL_QUEUE_DISABLED=true`
2. The system will automatically fall back to direct sending
3. Fix issues and remove the environment variable

## Changelog

### v1.0.0 (Current)
- Initial release with comprehensive email queuing
- Retry logic with exponential backoff
- Dead Letter Queue implementation
- Circuit breaker pattern
- Real-time monitoring and alerting
- In-memory fallback for Redis unavailability
- Comprehensive test coverage
- Admin API for management

---

**Built with ❤️ for Taxomind LMS** - Ensuring reliable email delivery at scale.