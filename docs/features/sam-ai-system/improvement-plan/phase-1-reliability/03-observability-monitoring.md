# Observability & Monitoring

**Timeline**: Weeks 5-6 (14 days)
**Priority**: 🔴 Critical
**Budget**: $25,000
**Owner**: DevOps Engineer + Senior Backend Engineer

---

## 📋 Executive Summary

Implement comprehensive observability stack (metrics, logs, traces) to gain complete visibility into SAM's health, performance, and user behavior. This enables proactive issue detection, rapid troubleshooting, and data-driven optimization.

### Current Problem
```
❌ No centralized logging → Debugging requires SSH to servers
❌ No metrics collection → Can't measure performance trends
❌ No distributed tracing → Can't trace requests across services
❌ No real-time dashboards → Flying blind in production
❌ No automated alerts → Issues discovered by users, not us
❌ No performance baselining → Can't detect degradation
```

### Target Solution
```
✅ Centralized logging with ELK or Loki
✅ Prometheus metrics collection across all services
✅ Distributed tracing with Jaeger or Tempo
✅ Real-time Grafana dashboards for all key metrics
✅ PagerDuty integration for critical alerts
✅ Automated anomaly detection
✅ Performance budgets and SLO tracking
✅ User journey observability
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ 100% of requests have trace IDs
- ✅ Log aggregation latency <30 seconds
- ✅ Metrics collection overhead <1% CPU
- ✅ Alert delivery time <2 minutes
- ✅ Dashboard load time <2 seconds

### Operational Metrics
- ✅ Mean time to detection (MTTD) <5 minutes
- ✅ Mean time to resolution (MTTR) <30 minutes
- ✅ False positive alert rate <10%
- ✅ 100% critical alerts actionable
- ✅ Incident post-mortem completion rate 100%

### Business Metrics
- ✅ Unplanned downtime reduced by 80%
- ✅ Customer-reported issues reduced by 70%
- ✅ Debug time reduced by 60%

---

## 🏗️ Technical Design

### Observability Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  - Next.js API Routes                                        │
│  - SAM Engines (35+)                                         │
│  - Database Operations                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
                ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   OpenTelemetry  │   │  Custom Metrics  │
    │   Instrumentation│   │   Collection     │
    │                  │   │                  │
    │  - Auto traces   │   │  - Custom gauges │
    │  - Span creation │   │  - Histograms    │
    │  - Context prop  │   │  - Counters      │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             └─────────┬────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│   Metrics   │ │    Logs     │ │   Traces     │
│ (Prometheus)│ │   (Loki)    │ │  (Tempo)     │
│             │ │             │ │              │
│ - Counters  │ │ - Structured│ │ - Spans      │
│ - Gauges    │ │ - Levels    │ │ - Parent IDs │
│ - Histogram │ │ - JSON      │ │ - Baggage    │
└──────┬──────┘ └──────┬──────┘ └──────┬───────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Grafana      │
              │   Dashboards    │
              │                 │
              │ - Metrics viz   │
              │ - Log explorer  │
              │ - Trace viewer  │
              │ - Alerting      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   PagerDuty     │
              │  Alert Manager  │
              │                 │
              │ - Escalation    │
              │ - On-call       │
              │ - Incidents     │
              └─────────────────┘
```

### The Three Pillars Implementation

#### 1. Metrics (Prometheus)

```typescript
// sam-ai-tutor/lib/observability/metrics.ts

import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom SAM metrics
export const samMetrics = {
  // HTTP request duration
  httpRequestDuration: new client.Histogram({
    name: 'sam_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
  }),

  // AI provider requests
  aiProviderRequests: new client.Counter({
    name: 'sam_ai_provider_requests_total',
    help: 'Total AI provider requests',
    labelNames: ['provider', 'model', 'status'],
    registers: [register]
  }),

  // AI provider latency
  aiProviderLatency: new client.Histogram({
    name: 'sam_ai_provider_latency_seconds',
    help: 'AI provider request latency',
    labelNames: ['provider', 'model'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60],
    registers: [register]
  }),

  // AI provider tokens
  aiProviderTokens: new client.Counter({
    name: 'sam_ai_provider_tokens_total',
    help: 'Total tokens consumed',
    labelNames: ['provider', 'model', 'type'], // type: input|output
    registers: [register]
  }),

  // AI provider costs
  aiProviderCost: new client.Counter({
    name: 'sam_ai_provider_cost_usd_total',
    help: 'Total AI provider cost in USD',
    labelNames: ['provider', 'model'],
    registers: [register]
  }),

  // Database query duration
  dbQueryDuration: new client.Histogram({
    name: 'sam_db_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register]
  }),

  // Cache operations
  cacheOperations: new client.Counter({
    name: 'sam_cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['operation', 'result'], // operation: get|set, result: hit|miss
    registers: [register]
  }),

  // Active SAM sessions
  activeSessions: new client.Gauge({
    name: 'sam_active_sessions',
    help: 'Number of active SAM sessions',
    labelNames: ['engine_type'],
    registers: [register]
  }),

  // Engine execution duration
  engineDuration: new client.Histogram({
    name: 'sam_engine_duration_seconds',
    help: 'SAM engine execution duration',
    labelNames: ['engine_name', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
  }),

  // Circuit breaker state
  circuitBreakerState: new client.Gauge({
    name: 'sam_circuit_breaker_state',
    help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
    labelNames: ['provider'],
    registers: [register]
  }),

  // Rate limit violations
  rateLimitViolations: new client.Counter({
    name: 'sam_rate_limit_violations_total',
    help: 'Total rate limit violations',
    labelNames: ['tier', 'limit_type'],
    registers: [register]
  })
};

// Metrics endpoint for Prometheus scraping
export async function metricsHandler(req: Request): Promise<Response> {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: {
      'Content-Type': register.contentType
    }
  });
}
```

#### 2. Logging (Structured Logging with Pino)

```typescript
// sam-ai-tutor/lib/observability/logger.ts

import pino from 'pino';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  // In production, send to Loki
  ...(process.env.NODE_ENV === 'production' && {
    transport: {
      target: 'pino-loki',
      options: {
        batching: true,
        interval: 5,
        host: process.env.LOKI_HOST,
        basicAuth: {
          username: process.env.LOKI_USER,
          password: process.env.LOKI_PASSWORD
        },
        labels: {
          application: 'sam-ai-tutor',
          environment: process.env.NODE_ENV
        }
      }
    }
  })
});

// Create child loggers with context
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

// Request logger middleware
export function requestLogger(req: Request) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const startTime = Date.now();

  const log = createLogger({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent')
  });

  log.info('Request started');

  return {
    requestId,
    log,
    end: (status: number) => {
      const duration = Date.now() - startTime;
      log.info({
        status,
        duration,
        msg: 'Request completed'
      });
    }
  };
}

// Usage in API routes
export async function POST(request: Request) {
  const { requestId, log, end } = requestLogger(request);

  try {
    log.info('Processing SAM generation request');

    const result = await generateContent(params);

    log.info({
      provider: result.provider,
      tokens: result.usage.totalTokens,
      latency: result.latency,
      msg: 'Generation successful'
    });

    end(200);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    log.error({
      err: error,
      msg: 'Generation failed'
    });

    end(500);
    throw error;
  }
}
```

#### 3. Distributed Tracing (OpenTelemetry)

```typescript
// sam-ai-tutor/lib/observability/tracing.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Initialize OpenTelemetry SDK
export function initializeTracing() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'sam-ai-tutor',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false // Disable to reduce noise
        }
      })
    ]
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}

// Create custom spans
export const tracer = trace.getTracer('sam-ai-tutor');

// Helper to create spans with error handling
export async function withSpan<T>(
  spanName: string,
  attributes: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(spanName, {
    attributes: {
      ...attributes,
      timestamp: new Date().toISOString()
    }
  });

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      fn
    );

    span.setStatus({ code: SpanStatusCode.OK });
    return result;

  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    throw error;

  } finally {
    span.end();
  }
}

// Usage example: Tracing AI provider calls
export async function generateWithTracing(params: GenerateParams) {
  return withSpan(
    'ai.provider.generate',
    {
      provider: params.provider,
      model: params.model,
      input_tokens: params.messages.join(' ').length / 4 // Rough estimate
    },
    async () => {
      const result = await aiProvider.generate(params);

      // Add result attributes to span
      const span = trace.getActiveSpan();
      span?.setAttributes({
        'ai.response.tokens.input': result.usage.promptTokens,
        'ai.response.tokens.output': result.usage.completionTokens,
        'ai.response.latency_ms': result.latency,
        'ai.response.cost_usd': calculateCost(result.usage)
      });

      return result;
    }
  );
}
```

---

## 📝 Implementation Plan

### Week 5: Metrics & Logging

#### Day 1-2: Infrastructure Setup
- [ ] Set up Prometheus server (self-hosted or managed)
- [ ] Set up Grafana instance
- [ ] Set up Loki for log aggregation
- [ ] Configure data retention policies (30 days metrics, 7 days logs)

#### Day 3-4: Metrics Implementation
- [ ] Add Prometheus client to project
- [ ] Implement custom metrics (samMetrics)
- [ ] Create `/metrics` endpoint for scraping
- [ ] Configure Prometheus to scrape endpoint
- [ ] Test metrics collection

#### Day 5-6: Logging Implementation
- [ ] Add Pino logger to project
- [ ] Implement structured logging throughout codebase
- [ ] Add request ID propagation
- [ ] Configure Loki transport
- [ ] Test log aggregation

### Week 6: Tracing & Dashboards

#### Day 7-8: Distributed Tracing
- [ ] Set up Tempo instance
- [ ] Add OpenTelemetry SDK
- [ ] Instrument HTTP requests automatically
- [ ] Add custom spans for SAM engines
- [ ] Add custom spans for AI provider calls
- [ ] Test trace collection and visualization

#### Day 9-10: Dashboards & Visualization
- [ ] Create "System Health" dashboard
- [ ] Create "AI Provider Performance" dashboard
- [ ] Create "Cost & Usage" dashboard
- [ ] Create "User Journey" dashboard
- [ ] Create "SLO Tracking" dashboard

#### Day 11-12: Alerting
- [ ] Set up PagerDuty account
- [ ] Define alert rules in Prometheus
- [ ] Configure Grafana alerting
- [ ] Set up PagerDuty integration
- [ ] Test alert delivery
- [ ] Create runbooks for common alerts

#### Day 13-14: Testing & Deployment
- [ ] Load testing to verify overhead <1%
- [ ] Verify alert accuracy (no false positives)
- [ ] Deploy to staging
- [ ] 48-hour soak test
- [ ] Production deployment
- [ ] Team training on dashboards

---

## 📊 Grafana Dashboards

### 1. System Health Dashboard

```json
{
  "dashboard": {
    "title": "SAM System Health",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(sam_http_request_duration_seconds_count[5m])"
        }],
        "type": "graph"
      },
      {
        "title": "Request Latency (p50, p95, p99)",
        "targets": [
          { "expr": "histogram_quantile(0.50, sam_http_request_duration_seconds)", "legendFormat": "p50" },
          { "expr": "histogram_quantile(0.95, sam_http_request_duration_seconds)", "legendFormat": "p95" },
          { "expr": "histogram_quantile(0.99, sam_http_request_duration_seconds)", "legendFormat": "p99" }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(sam_http_request_duration_seconds_count{status=~\"5..\"}[5m])"
        }]
      },
      {
        "title": "Circuit Breaker States",
        "targets": [{
          "expr": "sam_circuit_breaker_state"
        }],
        "type": "stat"
      },
      {
        "title": "Active Sessions",
        "targets": [{
          "expr": "sam_active_sessions"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "rate(sam_cache_operations_total{result=\"hit\"}[5m]) / rate(sam_cache_operations_total[5m])"
        }]
      }
    ]
  }
}
```

### 2. AI Provider Performance Dashboard

```json
{
  "dashboard": {
    "title": "AI Provider Performance",
    "panels": [
      {
        "title": "Provider Request Rate by Model",
        "targets": [{
          "expr": "rate(sam_ai_provider_requests_total[5m])"
        }],
        "type": "graph"
      },
      {
        "title": "Provider Latency (p95) by Provider",
        "targets": [{
          "expr": "histogram_quantile(0.95, sam_ai_provider_latency_seconds)"
        }]
      },
      {
        "title": "Provider Error Rate",
        "targets": [{
          "expr": "rate(sam_ai_provider_requests_total{status!=\"success\"}[5m])"
        }]
      },
      {
        "title": "Tokens Consumed (Input vs Output)",
        "targets": [
          { "expr": "rate(sam_ai_provider_tokens_total{type=\"input\"}[5m])", "legendFormat": "Input" },
          { "expr": "rate(sam_ai_provider_tokens_total{type=\"output\"}[5m])", "legendFormat": "Output" }
        ]
      },
      {
        "title": "Cost per Provider",
        "targets": [{
          "expr": "sum by (provider) (rate(sam_ai_provider_cost_usd_total[1h]) * 3600)"
        }],
        "type": "stat"
      },
      {
        "title": "Failover Events",
        "targets": [{
          "expr": "rate(sam_failover_events_total[5m])"
        }]
      }
    ]
  }
}
```

### 3. Cost & Usage Dashboard

```json
{
  "dashboard": {
    "title": "Cost & Usage Analytics",
    "panels": [
      {
        "title": "Total Cost Today",
        "targets": [{
          "expr": "sum(increase(sam_ai_provider_cost_usd_total[24h]))"
        }],
        "type": "stat"
      },
      {
        "title": "Cost Trend (Last 30 Days)",
        "targets": [{
          "expr": "sum(increase(sam_ai_provider_cost_usd_total[1d]))"
        }],
        "type": "graph"
      },
      {
        "title": "Cost per User (Top 10)",
        "targets": [{
          "expr": "topk(10, sam_cost_daily_user_dollars)"
        }],
        "type": "table"
      },
      {
        "title": "Rate Limit Violations by Tier",
        "targets": [{
          "expr": "rate(sam_rate_limit_violations_total[5m])"
        }]
      },
      {
        "title": "Budget Alerts",
        "targets": [{
          "expr": "rate(sam_budget_alerts_total[1h])"
        }]
      }
    ]
  }
}
```

---

## 🚨 Alert Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: sam_slo_alerts
    interval: 30s
    rules:
      # SLO: 99.9% uptime
      - alert: SLOAvailabilityBreach
        expr: (1 - rate(sam_http_request_duration_seconds_count{status=~\"5..\"}[5m]) / rate(sam_http_request_duration_seconds_count[5m])) < 0.999
        for: 5m
        labels:
          severity: critical
          slo: availability
        annotations:
          summary: "Availability SLO breach"
          description: "Error rate is {{ $value | humanizePercentage }}, SLO is 99.9%"
          runbook: "https://docs.taxomind.com/runbooks/slo-availability"

      # SLO: p95 latency < 500ms
      - alert: SLOLatencyBreach
        expr: histogram_quantile(0.95, sam_http_request_duration_seconds) > 0.5
        for: 5m
        labels:
          severity: warning
          slo: latency
        annotations:
          summary: "Latency SLO breach"
          description: "p95 latency is {{ $value }}s, SLO is 0.5s"

  - name: sam_circuit_breaker_alerts
    rules:
      - alert: CircuitBreakerOpen
        expr: sam_circuit_breaker_state == 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker OPEN for {{ $labels.provider }}"
          description: "Provider {{ $labels.provider }} circuit breaker has been OPEN for 2 minutes"
          runbook: "https://docs.taxomind.com/runbooks/circuit-breaker"

  - name: sam_cost_alerts
    rules:
      - alert: DailyCostExceeded
        expr: increase(sam_ai_provider_cost_usd_total[24h]) > 1000
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Daily cost exceeded $1000"
          description: "Total cost in last 24h: ${{ $value | humanize }}"

  - name: sam_performance_alerts
    rules:
      - alert: HighDatabaseLatency
        expr: histogram_quantile(0.95, sam_db_query_duration_seconds) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database latency detected"
          description: "p95 DB query latency is {{ $value }}s"

      - alert: LowCacheHitRate
        expr: rate(sam_cache_operations_total{result=\"hit\"}[5m]) / rate(sam_cache_operations_total[5m]) < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 80%"
          description: "Current hit rate: {{ $value | humanizePercentage }}"
```

---

## 🧪 Testing Strategy

### Metrics Testing

```typescript
// __tests__/observability/metrics.test.ts

describe('Metrics Collection', () => {
  it('should record HTTP request duration', async () => {
    const before = await register.getSingleMetricAsString('sam_http_request_duration_seconds_count');

    await fetch('http://localhost:3000/api/sam/test');

    const after = await register.getSingleMetricAsString('sam_http_request_duration_seconds_count');

    expect(after).not.toBe(before);
  });

  it('should track AI provider requests', async () => {
    const before = await register.getSingleMetricAsString('sam_ai_provider_requests_total');

    await generateContent(params);

    const after = await register.getSingleMetricAsString('sam_ai_provider_requests_total');

    expect(after).toContain('provider="Anthropic"');
  });

  it('should have low overhead (<1% CPU)', async () => {
    const iterations = 10000;
    const startCPU = process.cpuUsage();
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      samMetrics.httpRequestDuration.observe(
        { method: 'POST', route: '/test', status: '200' },
        Math.random()
      );
    }

    const cpuUsed = process.cpuUsage(startCPU);
    const duration = Date.now() - startTime;

    const cpuPercent = ((cpuUsed.user + cpuUsed.system) / 1000 / duration) * 100;

    expect(cpuPercent).toBeLessThan(1);
  });
});
```

### Tracing Testing

```typescript
// __tests__/observability/tracing.test.ts

describe('Distributed Tracing', () => {
  it('should create spans for SAM engine calls', async () => {
    const spans: any[] = [];
    const spanProcessor = {
      onStart: () => {},
      onEnd: (span: any) => spans.push(span),
      shutdown: async () => {},
      forceFlush: async () => {}
    };

    // Add test span processor
    const tracer = trace.getTracer('test');

    await withSpan('test.operation', { foo: 'bar' }, async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].name).toBe('test.operation');
    expect(spans[0].attributes.foo).toBe('bar');
  });

  it('should propagate trace context across async operations', async () => {
    const parentSpan = tracer.startSpan('parent');

    await context.with(
      trace.setSpan(context.active(), parentSpan),
      async () => {
        const childSpan = tracer.startSpan('child');
        const childContext = trace.setSpan(context.active(), childSpan);

        expect(childSpan.spanContext().traceId).toBe(
          parentSpan.spanContext().traceId
        );

        childSpan.end();
      }
    );

    parentSpan.end();
  });
});
```

---

## 💰 Cost Analysis

### Engineering Costs
- DevOps Engineer (10 days): $8,000
- Senior Backend Engineer (5 days): $4,000
- QA Engineer (2 days): $1,300
- **Total Engineering**: $13,300

### Infrastructure Costs (Monthly)
- Grafana Cloud (Pro): $300/month
- Prometheus storage: $200/month
- Loki storage: $100/month
- Tempo storage: $100/month
- PagerDuty (Professional): $50/month
- **Total Infrastructure**: $750/month

### First Year Costs
- Engineering: $13,300
- Infrastructure (12 months): $9,000
- Training & documentation: $1,000
- **Total First Year**: $23,300

### ROI
- Reduce MTTR from 2 hours to 30 minutes: ~$5,000/month saved in engineering time
- Prevent 2 major incidents per year: ~$20,000/incident = $40,000 saved
- **Annual ROI**: $100,000+ savings vs $23,300 investment

**Total Budget**: ~$25,000

---

## ✅ Acceptance Criteria

- [ ] Prometheus metrics collecting from all services
- [ ] Grafana dashboards deployed (4 dashboards minimum)
- [ ] Loki log aggregation working
- [ ] OpenTelemetry tracing implemented
- [ ] PagerDuty integration configured
- [ ] Alert rules defined and tested (0 false positives in 24h test)
- [ ] Runbooks created for all critical alerts
- [ ] Team trained on dashboards and alerting
- [ ] Metrics overhead <1% CPU verified
- [ ] Log aggregation latency <30 seconds verified
- [ ] MTTD <5 minutes demonstrated in drill
- [ ] Documentation complete
- [ ] Staging deployment successful
- [ ] Production rollout complete

---

## 📚 References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [The Three Pillars of Observability](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)

---

**Status**: Ready for Implementation
**Previous**: [Rate Limiting & Cost Controls](./02-rate-limiting-cost-controls.md)
**Next**: [Error Handling Standardization](./04-error-handling-standardization.md)
