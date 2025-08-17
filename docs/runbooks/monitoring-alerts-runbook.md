# Monitoring Alerts Runbook

## Overview
This runbook provides procedures for responding to various monitoring alerts in the Taxomind application.

## Quick Reference
- **Monitoring Stack**: Prometheus, Grafana, CloudWatch, Vercel Analytics
- **Log Aggregation**: CloudWatch Logs, Vercel Logs
- **APM**: Application Performance Monitoring
- **Alerting**: PagerDuty, Slack, Email
- **SLOs**: 99.9% uptime, <3s response time

## Alert Response Procedures

### 1. High Error Rate Alert (>1% of requests)

#### Alert Details
- **Threshold**: Error rate > 1% for 5 minutes
- **Severity**: P2 - High
- **Team**: Backend/API Team

#### Quick Diagnostics
```bash
# Check recent error logs
vercel logs --since 10m | grep -E "ERROR|FATAL"

# Check API error rates
curl http://monitoring.taxomind.com/api/metrics/errors

# Check specific endpoint errors
grep "500\|502\|503" /var/log/nginx/access.log | tail -100

# Database connection errors
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle in transaction';"
```

#### Resolution Steps

1. **Identify Error Pattern**
```bash
# Group errors by type
vercel logs --since 1h | grep ERROR | awk '{print $5}' | sort | uniq -c | sort -rn

# Check for specific error messages
tail -f logs/application.log | grep -E "timeout|connection|memory"

# Analyze error distribution
curl http://monitoring.taxomind.com/api/errors/distribution
```

2. **Common Error Fixes**

**Database Connection Errors:**
```typescript
// Check connection pool
const poolStatus = await db.$queryRaw`
  SELECT count(*) as connections,
         state,
         wait_event_type
  FROM pg_stat_activity
  GROUP BY state, wait_event_type
`;

// Reset connection pool if needed
await db.$disconnect();
await db.$connect();
```

**Rate Limiting Errors:**
```typescript
// Temporarily increase limits
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"), // Increased from 10
});

// Clear rate limit for specific user
await redis.del(`ratelimit:user:${userId}`);
```

**Memory Errors:**
```bash
# Check memory usage
ps aux | grep node | head -5

# Restart with increased memory
NODE_OPTIONS="--max-old-space-size=4096" pm2 restart taxomind

# Force garbage collection (if enabled)
node --expose-gc -e "global.gc()"
```

3. **Mitigation Actions**
```typescript
// Enable circuit breaker
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const breaker = new CircuitBreaker(callExternalAPI, options);
breaker.on('open', () => console.log('Circuit breaker is open'));
breaker.fallback(() => 'Service temporarily unavailable');
```

### 2. High Response Time Alert (P95 > 3s)

#### Alert Details
- **Threshold**: P95 latency > 3 seconds for 5 minutes
- **Severity**: P2 - High
- **Team**: Performance Team

#### Quick Diagnostics
```bash
# Check slow queries
psql $DATABASE_URL -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Check Node.js event loop lag
curl http://localhost:3000/api/health/metrics | jq .eventLoopLag

# Monitor real-time performance
npm install -g clinic
clinic doctor -- node server.js
```

#### Resolution Steps

1. **Identify Slow Operations**
```typescript
// Add performance monitoring
import { performance } from 'perf_hooks';

export async function measurePerformance(operation: string, fn: Function) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    if (duration > 1000) {
      console.warn(`Slow operation ${operation}: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Failed operation ${operation} after ${duration}ms:`, error);
    throw error;
  }
}
```

2. **Optimize Database Queries**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_courses_published_created 
ON courses(is_published, created_at DESC) 
WHERE is_published = true;

-- Analyze query plan
EXPLAIN ANALYZE 
SELECT * FROM courses 
WHERE is_published = true 
ORDER BY created_at DESC 
LIMIT 20;

-- Update statistics
ANALYZE courses;
```

3. **Implement Caching**
```typescript
// Add response caching
const cacheKey = `api:courses:${JSON.stringify(params)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return NextResponse.json(JSON.parse(cached), {
    headers: { 'X-Cache': 'HIT' }
  });
}

const data = await expensive_operation();
await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);

return NextResponse.json(data, {
  headers: { 'X-Cache': 'MISS' }
});
```

### 3. High Memory Usage Alert (>85%)

#### Alert Details
- **Threshold**: Memory usage > 85% for 10 minutes
- **Severity**: P2 - High
- **Team**: Infrastructure Team

#### Quick Diagnostics
```bash
# Check memory usage
free -m
ps aux --sort=-%mem | head

# Node.js heap statistics
node -e "console.log(process.memoryUsage())"

# Check for memory leaks
npm install heapdump
kill -USR2 <pid>  # Generate heap dump
```

#### Resolution Steps

1. **Immediate Mitigation**
```bash
# Restart application
pm2 restart taxomind

# Scale horizontally
kubectl scale deployment taxomind --replicas=5

# Clear caches
redis-cli FLUSHDB
rm -rf .next/cache
```

2. **Find Memory Leaks**
```typescript
// Common leak patterns to check
// 1. Event listeners not removed
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler); // Must cleanup!
}, []);

// 2. Timers not cleared
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // Must cleanup!
}, []);

// 3. Large objects in closure
const processData = (() => {
  let cache = {}; // This grows indefinitely
  return (data) => {
    cache[data.id] = data; // Memory leak!
    // Fix: Implement LRU cache or clear periodically
  };
})();
```

3. **Optimize Memory Usage**
```typescript
// Stream large responses
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const cursor = db.course.findMany({ cursor: null, take: 100 });
      
      for await (const batch of cursor) {
        controller.enqueue(JSON.stringify(batch));
      }
      
      controller.close();
    },
  });
  
  return new Response(stream);
}

// Use pagination
const PAGE_SIZE = 20;
const results = await db.course.findMany({
  skip: page * PAGE_SIZE,
  take: PAGE_SIZE,
});
```

### 4. Database Connection Pool Exhausted

#### Alert Details
- **Threshold**: Available connections < 10%
- **Severity**: P1 - Critical
- **Team**: Database Team

#### Quick Diagnostics
```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

#### Resolution Steps

1. **Immediate Relief**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';

-- Kill specific long-running query
SELECT pg_terminate_backend(12345); -- Use PID from diagnostics
```

2. **Fix Connection Leaks**
```typescript
// Ensure proper connection handling
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Always use try-finally for transactions
try {
  await db.$transaction(async (tx) => {
    // Transaction operations
  });
} finally {
  await db.$disconnect();
}
```

### 5. High CPU Usage Alert (>80%)

#### Alert Details
- **Threshold**: CPU usage > 80% for 5 minutes
- **Severity**: P2 - High
- **Team**: Infrastructure Team

#### Quick Diagnostics
```bash
# Check CPU usage
top -c
htop

# Node.js profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Check for infinite loops
strace -p <pid> -c
```

#### Resolution Steps

1. **Identify CPU-Intensive Operations**
```typescript
// Profile specific functions
console.time('expensive-operation');
await expensiveOperation();
console.timeEnd('expensive-operation');

// Use Web Workers for CPU-intensive tasks
const worker = new Worker('/worker.js');
worker.postMessage({ cmd: 'process', data: largeDataset });
worker.onmessage = (e) => {
  console.log('Processing complete:', e.data);
};
```

2. **Optimize Algorithms**
```typescript
// Before: O(n²) complexity
const findDuplicates = (arr) => {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) duplicates.push(arr[i]);
    }
  }
  return duplicates;
};

// After: O(n) complexity
const findDuplicates = (arr) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of arr) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return Array.from(duplicates);
};
```

### 6. SSL Certificate Expiry Warning

#### Alert Details
- **Threshold**: Certificate expires in < 7 days
- **Severity**: P2 - High
- **Team**: Infrastructure Team

#### Quick Diagnostics
```bash
# Check certificate expiry
echo | openssl s_client -servername taxomind.com -connect taxomind.com:443 2>/dev/null | openssl x509 -noout -dates

# Check all certificates
certbot certificates

# Verify auto-renewal
systemctl status certbot.timer
```

#### Resolution Steps

1. **Manual Renewal**
```bash
# Renew with Certbot
certbot renew --force-renewal

# Renew with Vercel
vercel certs

# Verify renewal
curl -I https://taxomind.com | grep -i "ssl"
```

2. **Setup Auto-Renewal**
```bash
# Crontab entry
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"

# Or systemd timer
systemctl enable certbot.timer
systemctl start certbot.timer
```

### 7. Disk Space Alert (>90% usage)

#### Alert Details
- **Threshold**: Disk usage > 90%
- **Severity**: P1 - Critical
- **Team**: Infrastructure Team

#### Quick Diagnostics
```bash
# Check disk usage
df -h
du -sh /* | sort -rh | head -10

# Find large files
find / -type f -size +1G 2>/dev/null

# Check Docker space
docker system df
```

#### Resolution Steps

1. **Immediate Cleanup**
```bash
# Clean Docker
docker system prune -a -f

# Clean npm cache
npm cache clean --force

# Remove old logs
find /var/log -name "*.log" -mtime +30 -delete

# Clean Next.js cache
rm -rf .next/cache

# Remove old backups
find /backups -name "*.sql" -mtime +7 -delete
```

2. **Setup Log Rotation**
```bash
# /etc/logrotate.d/taxomind
/var/log/taxomind/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload taxomind
    endscript
}
```

## Alert Configuration

### Prometheus Alert Rules
```yaml
# prometheus/alerts.yml
groups:
  - name: taxomind
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: high
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: HighMemoryUsage
        expr: node_memory_Active_bytes / node_memory_MemTotal_bytes > 0.85
        for: 10m
        labels:
          severity: high
          team: infrastructure
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

### Grafana Dashboard Queries
```sql
-- Error rate
rate(http_requests_total{status=~"5.."}[5m])

-- P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

-- Active connections
pg_stat_activity_count

-- Memory usage
node_memory_Active_bytes / node_memory_MemTotal_bytes
```

## Alert Routing

### PagerDuty Integration
```typescript
// lib/alerting.ts
export async function sendAlert(alert: Alert) {
  if (alert.severity === 'critical') {
    await pagerduty.trigger({
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: alert.summary,
        severity: alert.severity,
        source: 'taxomind-monitoring',
        custom_details: alert.details,
      },
    });
  }
}
```

### Slack Notifications
```typescript
// lib/slack-alerts.ts
export async function notifySlack(alert: Alert) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  const color = alert.severity === 'critical' ? 'danger' : 'warning';
  
  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({
      attachments: [{
        color,
        title: alert.title,
        text: alert.description,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Team', value: alert.team, short: true },
        ],
        footer: 'Taxomind Monitoring',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}
```

## SLA/SLO Monitoring

### Key Metrics
- **Availability SLO**: 99.9% uptime (43.2 minutes downtime/month)
- **Latency SLO**: P95 < 3 seconds
- **Error Rate SLO**: < 0.1% of requests

### SLO Tracking
```typescript
// lib/slo-tracking.ts
export async function checkSLOs() {
  const metrics = await getMetrics();
  
  const sloStatus = {
    availability: metrics.uptime >= 0.999,
    latency: metrics.p95Latency <= 3000,
    errorRate: metrics.errorRate <= 0.001,
  };
  
  if (!sloStatus.availability || !sloStatus.latency || !sloStatus.errorRate) {
    await sendSLOAlert(sloStatus);
  }
  
  return sloStatus;
}
```

## Escalation Matrix

| Alert Type | L1 Response (15 min) | L2 Response (30 min) | L3 Response (1 hr) |
|------------|---------------------|---------------------|-------------------|
| High Error Rate | Dev Team | Backend Lead | CTO |
| High Response Time | Dev Team | Performance Lead | Infrastructure Lead |
| Database Issues | Backend Team | DBA | Infrastructure Lead |
| Security Alerts | Security Team | Security Lead | CISO |
| Disk Space Critical | DevOps | Infrastructure Lead | CTO |

## Post-Incident Procedures

1. **Incident Documentation**
```markdown
# Incident Report Template
## Incident ID: INC-2024-001
## Date: YYYY-MM-DD
## Duration: XX minutes
## Severity: P1/P2/P3

### Summary
Brief description of the incident

### Timeline
- HH:MM - Alert triggered
- HH:MM - Engineer acknowledged
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

### Root Cause
Detailed explanation

### Resolution
Steps taken to resolve

### Impact
- Users affected: XX
- Revenue impact: $XX
- SLA impact: XX%

### Action Items
- [ ] Fix item 1
- [ ] Fix item 2
- [ ] Update monitoring
```

2. **Post-Mortem Process**
- Schedule within 48 hours
- Blameless culture
- Document lessons learned
- Update runbooks
- Implement preventive measures

## Monitoring Dashboards

- **Main Dashboard**: http://monitoring.taxomind.com
- **API Metrics**: http://monitoring.taxomind.com/api
- **Database Metrics**: http://monitoring.taxomind.com/database
- **Infrastructure**: http://monitoring.taxomind.com/infrastructure
- **Business Metrics**: http://monitoring.taxomind.com/business

## Emergency Contacts

- **On-Call Engineer**: Via PagerDuty
- **Infrastructure Lead**: +1-xxx-xxx-xxxx
- **Database Admin**: +1-xxx-xxx-xxxx
- **Security Team**: security@taxomind.com
- **Executive Escalation**: +1-xxx-xxx-xxxx

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*