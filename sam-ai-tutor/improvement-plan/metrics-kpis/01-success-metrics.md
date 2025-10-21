# Success Metrics & KPIs - SAM AI Tutor

## Purpose
This document defines the comprehensive metrics and key performance indicators (KPIs) used to measure the success of the SAM AI Tutor transformation across all 4 phases over 18 months.

---

## Metric Categories

### 1. Technical Performance Metrics
### 2. Educational Effectiveness Metrics
### 3. Business Impact Metrics
### 4. User Experience Metrics
### 5. Cost Efficiency Metrics

---

## 1. Technical Performance Metrics

### System Reliability

#### Uptime (Target: 99.9%)
```typescript
interface UptimeMetric {
  metric: 'system_uptime';
  value: number; // 0.0 - 1.0 (99.9% = 0.999)
  target: 0.999;
  measurement_period: '30_days' | '7_days' | '24_hours';
}

// Calculation
const uptime = (totalMinutes - downMinutes) / totalMinutes;

// Monitoring
Prometheus query: (sum(up{job="sam-api"}) / count(up{job="sam-api"})) * 100
```

**Thresholds**:
- ✅ **Excellent**: ≥99.9% (< 43 minutes downtime/month)
- ⚠️ **Acceptable**: 99.5% - 99.9% (< 3.6 hours downtime/month)
- ❌ **Critical**: <99.5% (> 3.6 hours downtime/month)

#### API Response Time (Target: P95 < 500ms for simple queries)
```typescript
interface LatencyMetric {
  metric: 'api_latency';
  p50: number; // median
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  max: number;
  query_type: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
}

// Targets by query type
const latencyTargets = {
  SIMPLE: { p95: 500, p99: 1000 },    // Single engine
  MODERATE: { p95: 1500, p99: 2500 },  // 2-3 engines
  COMPLEX: { p95: 2500, p99: 5000 },   // 4+ engines, planning
};

// Prometheus query
histogram_quantile(0.95, rate(sam_api_duration_seconds_bucket[5m]))
```

**Phase-Specific Targets**:
- **Phase 1**: P95 < 800ms (baseline)
- **Phase 2**: P95 < 600ms (caching improvements)
- **Phase 3**: P95 < 500ms (optimization)
- **Phase 4**: P95 < 500ms (maintained with complex queries)

#### Error Rate (Target: < 0.1%)
```typescript
interface ErrorRateMetric {
  metric: 'error_rate';
  total_requests: number;
  failed_requests: number;
  error_rate: number; // 0.0 - 1.0
  error_types: {
    code: string;
    count: number;
    percentage: number;
  }[];
}

// Calculation
const errorRate = failedRequests / totalRequests;

// Prometheus query
rate(sam_api_errors_total[5m]) / rate(sam_api_requests_total[5m])
```

**Error Categorization**:
- **Client Errors (4xx)**: Invalid input, auth failures (excluded from SLA)
- **Server Errors (5xx)**: System failures (included in SLA)
- **Timeout Errors**: Requests exceeding 10s timeout
- **AI Provider Errors**: Claude/GPT API failures

### Caching Performance

#### Cache Hit Rate (Target: > 60%)
```typescript
interface CacheMetric {
  metric: 'cache_hit_rate';
  l1_hits: number;      // Memory cache hits
  l2_hits: number;      // Redis cache hits
  misses: number;       // Cache misses
  total_requests: number;
  hit_rate: number;     // (l1_hits + l2_hits) / total_requests
}

// Targets
const cacheTargets = {
  Phase1: 0.40,  // 40% hit rate (baseline)
  Phase2: 0.60,  // 60% hit rate (improved)
  Phase3: 0.70,  // 70% hit rate (optimized)
  Phase4: 0.65,  // 65% hit rate (complex queries lower cache)
};
```

#### Cache Latency
```typescript
interface CacheLatencyMetric {
  l1_latency_p95: number;  // Target: < 1ms
  l2_latency_p95: number;  // Target: < 10ms
  cache_promotion_rate: number; // L2 → L1 promotion rate
}
```

### AI Provider Performance

#### Multi-Provider Failover Rate
```typescript
interface FailoverMetric {
  metric: 'ai_provider_failover';
  primary_requests: number;      // Requests to Claude
  failover_requests: number;     // Requests that failed over to GPT
  failover_rate: number;         // failover / total
  avg_failover_latency: number;  // Time to detect and switch
}

// Target: < 5% failover rate
// Target: < 100ms failover detection time
```

#### Circuit Breaker Metrics
```typescript
interface CircuitBreakerMetric {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failure_count: number;
  last_failure_time: Date;
  successful_requests_since_reset: number;
  time_in_open_state: number; // milliseconds
}

// Alerts
// - Circuit OPEN for > 5 minutes → Critical
// - Circuit opening > 5 times/hour → Warning
```

---

## 2. Educational Effectiveness Metrics

### Learning Outcomes

#### Concept Mastery Improvement Rate
```typescript
interface MasteryImprovementMetric {
  metric: 'mastery_improvement';
  user_id: string;
  concept_name: string;
  initial_mastery: number;    // 0.0 - 1.0
  current_mastery: number;    // 0.0 - 1.0
  improvement_rate: number;   // % improvement per week
  weeks_active: number;
}

// Target: Average 15% improvement per week
// Calculation: (current - initial) / initial / weeks
```

**Cohort Analysis**:
```typescript
interface CohortMasteryMetric {
  cohort: 'all' | 'struggling' | 'advanced';
  avg_initial_mastery: number;
  avg_current_mastery: number;
  avg_improvement_rate: number;
  students_count: number;
}

// Target: 80% of students show positive improvement
```

#### Knowledge Graph Completeness
```typescript
interface KnowledgeGraphMetric {
  user_id: string;
  total_concepts: number;
  mastered_concepts: number;    // mastery ≥ 0.8
  learning_concepts: number;    // mastery 0.4 - 0.79
  weak_concepts: number;        // mastery < 0.4
  completeness_score: number;   // mastered / total
}

// Target: 60% completeness for active learners (6+ months)
```

### Adaptive Learning Effectiveness

#### IRT Accuracy (Phase 3+)
```typescript
interface IRTAccuracyMetric {
  metric: 'irt_accuracy';
  predicted_difficulty: number;   // 0.0 - 1.0
  actual_difficulty: number;      // Based on success rate
  accuracy: number;               // 1 - abs(predicted - actual)
  sample_size: number;
}

// Target: > 75% accuracy in difficulty prediction
```

#### Spaced Repetition Compliance
```typescript
interface SpacedRepetitionMetric {
  due_reviews: number;
  completed_reviews: number;
  compliance_rate: number;         // completed / due
  avg_recall_quality: number;      // 0-5 scale
  optimal_interval_hit_rate: number; // % reviews at optimal timing
}

// Target: > 70% compliance rate
// Target: Average recall quality > 3.5
```

### Engagement Metrics

#### Daily Active Users (DAU)
```typescript
interface EngagementMetric {
  dau: number;                    // Daily active users
  wau: number;                    // Weekly active users
  mau: number;                    // Monthly active users
  dau_mau_ratio: number;          // Stickiness: DAU / MAU
  avg_session_duration: number;   // minutes
  avg_sessions_per_user: number;
}

// Target: DAU/MAU > 0.2 (20% daily stickiness)
// Target: Avg session duration > 15 minutes
```

#### Question Response Rate
```typescript
interface ResponseMetric {
  questions_asked: number;
  questions_answered: number;
  avg_response_time: number;      // seconds
  satisfaction_score: number;     // 1-5 from user feedback
}

// Target: 100% questions answered (no failures)
// Target: Avg satisfaction > 4.0
```

---

## 3. Business Impact Metrics

### Cost Metrics

#### AI API Cost Per Student Per Day
```typescript
interface CostMetric {
  total_api_cost: number;          // USD
  total_students: number;
  active_students: number;         // Used SAM in period
  cost_per_student_day: number;    // total / active / days
  cost_per_query: number;

  breakdown: {
    claude_cost: number;
    gpt_cost: number;
    embedding_cost: number;
    other_cost: number;
  };
}

// Targets
const costTargets = {
  Phase1: 0.15,   // $0.15/student/day (baseline)
  Phase2: 0.12,   // $0.12 (caching reduces costs)
  Phase3: 0.10,   // $0.10 (optimized)
  Phase4: 0.10,   // $0.10 (maintained despite complexity)
};

// Alert: Cost > $0.20/student/day → Investigation needed
```

#### Infrastructure Cost
```typescript
interface InfrastructureCostMetric {
  hosting: number;            // Vercel/server costs
  database: number;           // Supabase/PostgreSQL
  redis: number;              // Upstash Redis
  vector_db: number;          // Pinecone
  monitoring: number;         // Prometheus/Grafana
  total: number;
  cost_per_active_user: number;
}

// Target: < $2/student/month infrastructure cost
```

### Revenue Impact (If Applicable)

#### Conversion Rate
```typescript
interface ConversionMetric {
  free_users: number;
  paid_users: number;
  conversion_rate: number;     // paid / (paid + free)
  avg_time_to_conversion: number; // days
}

// Target: Conversion rate improvement of 10% after Phase 2
```

#### Student Retention
```typescript
interface RetentionMetric {
  cohort_month: string;
  initial_students: number;
  retained_1_month: number;
  retained_3_months: number;
  retained_6_months: number;
  retention_1m: number;        // retained_1m / initial
  retention_3m: number;
  retention_6m: number;
}

// Targets
// - 1-month retention: > 60%
// - 3-month retention: > 40%
// - 6-month retention: > 25%
```

---

## 4. User Experience Metrics

### Satisfaction Metrics

#### Net Promoter Score (NPS)
```typescript
interface NPSMetric {
  promoters: number;           // Score 9-10
  passives: number;            // Score 7-8
  detractors: number;          // Score 0-6
  nps: number;                 // (promoters - detractors) / total * 100
}

// Target NPS progression
// Phase 1: NPS 30 (baseline)
// Phase 2: NPS 40 (personalization improves UX)
// Phase 3: NPS 50 (adaptive learning)
// Phase 4: NPS 60 (Socratic teaching)
```

#### Customer Satisfaction (CSAT)
```typescript
interface CSATMetric {
  total_surveys: number;
  satisfied: number;           // Rating 4-5 on 5-point scale
  csat_score: number;          // satisfied / total * 100

  dimensions: {
    response_quality: number;
    response_speed: number;
    personalization: number;
    ease_of_use: number;
  };
}

// Target: CSAT > 85%
```

### Usability Metrics

#### Task Success Rate
```typescript
interface TaskSuccessMetric {
  task: string;                // e.g., "Get answer to math question"
  attempts: number;
  successes: number;
  success_rate: number;        // successes / attempts
  avg_time_to_success: number; // seconds
  abandonment_rate: number;    // % users who gave up
}

// Targets
// - Success rate > 95% for core tasks
// - Abandonment rate < 5%
```

#### Error Recovery Rate
```typescript
interface ErrorRecoveryMetric {
  total_errors: number;
  user_recovered: number;      // User successfully retried
  system_recovered: number;    // System auto-recovered (failover)
  recovery_rate: number;       // recovered / total
  avg_recovery_time: number;   // seconds
}

// Target: > 90% recovery rate
// Target: < 5 seconds average recovery time
```

---

## 5. Cost Efficiency Metrics

### Query Optimization

#### Smart Routing Effectiveness (Phase 4)
```typescript
interface SmartRoutingMetric {
  total_queries: number;
  routed_to_small_model: number;   // Simple critique queries
  routed_to_large_model: number;   // Complex queries
  cost_savings: number;            // USD saved vs. all large model
  quality_maintained: number;      // % queries meeting quality threshold
}

// Target: 30% of queries routed to smaller model
// Target: 95% quality maintained
```

#### Embedding Cache Hit Rate (Phase 3+)
```typescript
interface EmbeddingCacheMetric {
  total_embedding_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  cost_saved: number;            // USD saved by caching
}

// Target: > 80% cache hit rate for embeddings
// Rationale: Concept embeddings rarely change
```

---

## Phase-Specific Success Criteria

### Phase 1: Foundation (Months 1-3)
**Must-Have Metrics**:
- ✅ System uptime ≥ 99.5%
- ✅ P95 latency < 800ms for simple queries
- ✅ Error rate < 0.5%
- ✅ Cache hit rate > 40%
- ✅ Cost < $0.15/student/day

**Success Criteria**:
- All 5 metrics met for 2 consecutive weeks
- Zero critical production incidents
- 90% of queries successfully answered

### Phase 2: Intelligence (Months 4-6)
**Must-Have Metrics**:
- ✅ All Phase 1 metrics maintained
- ✅ Knowledge graph completeness > 30% for active users
- ✅ Learning style detection accuracy > 70%
- ✅ Cost reduced to < $0.12/student/day (caching)
- ✅ NPS improved by 10 points

**Success Criteria**:
- 80% of students show mastery improvement
- Personalization satisfaction > 80%
- Cache hit rate improved to 60%

### Phase 3: Advanced Intelligence (Months 7-12)
**Must-Have Metrics**:
- ✅ All Phase 1-2 metrics maintained
- ✅ IRT difficulty prediction accuracy > 75%
- ✅ Spaced repetition compliance > 70%
- ✅ At-risk student detection recall > 80%
- ✅ Cost optimized to < $0.10/student/day

**Success Criteria**:
- 15% average mastery improvement per week
- Adaptive difficulty working for 90% of students
- Multi-modal understanding accuracy > 85%

### Phase 4: Thinking Machine (Months 13-18)
**Must-Have Metrics**:
- ✅ All Phase 1-3 metrics maintained
- ✅ Learning plan completion rate > 60%
- ✅ Socratic dialogue satisfaction > 85%
- ✅ Multi-agent consensus reached > 90%
- ✅ Cost maintained at < $0.10/student/day

**Success Criteria**:
- Complex queries answered successfully 95% of time
- Planning accuracy > 80% (plans don't need replanning)
- Socratic teaching NPS > 60

---

## Monitoring Dashboard

### Real-Time Dashboard (Grafana)
```yaml
Dashboard: SAM AI Tutor - Real-Time Metrics

Row 1: System Health
- Panel: Uptime (last 24h, 7d, 30d)
- Panel: Error Rate (5m, 1h, 24h)
- Panel: API Latency (P50, P95, P99)

Row 2: AI Performance
- Panel: Claude vs GPT Usage
- Panel: Circuit Breaker States
- Panel: Failover Events

Row 3: Caching
- Panel: L1 Cache Hit Rate
- Panel: L2 Cache Hit Rate
- Panel: Cache Latency

Row 4: Cost
- Panel: API Cost (real-time)
- Panel: Cost per Student per Day
- Panel: Monthly Cost Projection

Row 5: Learning
- Panel: Active Students (DAU/WAU/MAU)
- Panel: Questions Answered
- Panel: Avg Mastery Improvement
```

### Weekly Report (Automated)
```typescript
interface WeeklyReport {
  period: { start: Date; end: Date };

  summary: {
    uptime: number;
    total_queries: number;
    total_students: number;
    total_cost: number;
    cost_per_student_day: number;
  };

  highlights: {
    metric: string;
    current: number;
    previous: number;
    change_pct: number;
    status: 'improved' | 'declined' | 'stable';
  }[];

  alerts: {
    severity: 'critical' | 'warning' | 'info';
    metric: string;
    message: string;
    action_required: string;
  }[];

  recommendations: string[];
}
```

---

## Alert Thresholds

### Critical Alerts (Page On-Call)
- 🚨 Uptime < 99% for 1 hour
- 🚨 Error rate > 1% for 10 minutes
- 🚨 P95 latency > 5000ms for 5 minutes
- 🚨 Circuit breaker OPEN for all providers > 5 minutes
- 🚨 Database connection failures
- 🚨 Cost spike > 200% of daily average

### Warning Alerts (Slack Notification)
- ⚠️ Uptime < 99.5% for 24 hours
- ⚠️ Error rate > 0.5% for 1 hour
- ⚠️ P95 latency > 1000ms for simple queries
- ⚠️ Cache hit rate < 50% for 1 hour
- ⚠️ Cost > $0.15/student/day
- ⚠️ Circuit breaker opening > 5 times/hour

### Info Alerts (Email Digest)
- ℹ️ Daily metrics summary
- ℹ️ Weekly trends report
- ℹ️ Monthly cost breakdown
- ℹ️ Quarterly OKR progress

---

## OKRs (Objectives and Key Results)

### Q1 2025 (Phase 1)
**Objective**: Establish reliable, performant SAM foundation

**Key Results**:
1. Achieve 99.5% uptime for 2 consecutive months
2. P95 latency < 800ms for 95% of queries
3. Implement multi-provider failover with < 5% failover rate
4. Reduce cost to < $0.15/student/day

### Q2 2025 (Phase 2)
**Objective**: Make SAM intelligently adaptive to each student

**Key Results**:
1. 80% of students show measurable mastery improvement
2. Learning style detected with > 70% accuracy
3. Knowledge graph completeness > 30% for active users
4. NPS improved to 40+ (from 30 baseline)

### Q3-Q4 2025 (Phase 3)
**Objective**: Achieve evidence-based adaptive teaching

**Key Results**:
1. IRT difficulty prediction accuracy > 75%
2. At-risk student detection with 80% recall
3. Spaced repetition compliance > 70%
4. Multi-modal understanding accuracy > 85%

### Q1-Q2 2026 (Phase 4)
**Objective**: Enable autonomous Socratic teaching

**Key Results**:
1. 60% learning plan completion rate
2. Socratic dialogue satisfaction > 85%
3. Multi-agent consensus > 90% of time
4. Complex query success rate > 95%

---

## Metric Collection Implementation

### Prometheus Metrics
```typescript
// lib/monitoring/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const apiRequestCounter = new Counter({
  name: 'sam_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status'],
});

export const apiDurationHistogram = new Histogram({
  name: 'sam_api_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'route', 'query_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const cacheHitCounter = new Counter({
  name: 'sam_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_layer'], // L1 or L2
});

export const activeStudentsGauge = new Gauge({
  name: 'sam_active_students',
  help: 'Current number of active students',
  labelNames: ['time_period'], // DAU, WAU, MAU
});
```

### Usage in Code
```typescript
// API route middleware
export async function metricsMiddleware(req: Request) {
  const startTime = Date.now();

  try {
    const response = await processRequest(req);

    // Record success
    apiRequestCounter.inc({
      method: req.method,
      route: req.url,
      status: response.status,
    });

    const duration = (Date.now() - startTime) / 1000;
    apiDurationHistogram.observe({
      method: req.method,
      route: req.url,
      query_type: determineQueryType(req),
    }, duration);

    return response;
  } catch (error) {
    // Record failure
    apiRequestCounter.inc({
      method: req.method,
      route: req.url,
      status: 500,
    });
    throw error;
  }
}
```

---

## Summary

Success of the SAM AI Tutor transformation is measured through:

1. **Technical Excellence**: 99.9% uptime, <500ms latency, <0.1% errors
2. **Educational Impact**: 15% mastery improvement/week, 80% student success rate
3. **Business Viability**: <$0.10/student/day cost, 60+ NPS
4. **User Satisfaction**: 85%+ CSAT, 95%+ task success rate
5. **Cost Efficiency**: 30% queries on smaller models, 80% embedding cache hits

**Next Steps**: Review deployment guide and monitoring setup documentation.
