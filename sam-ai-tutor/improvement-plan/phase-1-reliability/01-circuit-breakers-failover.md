# Circuit Breakers & Failover

**Timeline**: Weeks 1-2 (14 days)
**Priority**: 🔴 Critical
**Budget**: $18,000
**Owner**: Senior Backend Engineer + DevOps Engineer

---

## 📋 Executive Summary

Implement circuit breaker pattern around all AI provider calls (Anthropic, OpenAI) with automatic failover to backup providers. This prevents cascading failures where a single AI provider outage takes down the entire SAM platform.

### Current Problem
```
❌ If Anthropic API goes down → SAM becomes completely unavailable
❌ No automatic detection of provider health issues
❌ Manual intervention required to switch providers
❌ Users experience 500 errors with no graceful degradation
❌ Single point of failure for all 35+ SAM engines
```

### Target Solution
```
✅ Circuit breaker detects provider failures automatically
✅ Automatic failover to secondary provider (OpenAI) within 2 seconds
✅ Gradual recovery testing before restoring primary provider
✅ User-facing requests never fail due to provider issues
✅ Complete observability of provider health status
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Circuit breaker triggers in <100ms when failure threshold reached
- ✅ Automatic failover completes in <2 seconds
- ✅ Zero user-facing errors during provider outages
- ✅ 99.9% uptime maintained even with provider issues
- ✅ Provider health monitoring dashboard operational

### Business Metrics
- ✅ Zero downtime incidents attributed to AI provider failures
- ✅ User satisfaction score >4.5/5 maintained during provider issues
- ✅ Support tickets related to "SAM unavailable" reduced by 90%

---

## 🏗️ Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SAM Engine Request                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Provider Abstraction Layer               │
│  - Provider selection logic                                  │
│  - Request normalization                                     │
│  - Response transformation                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Circuit Breaker Layer                     │
│  - Health monitoring per provider                            │
│  - Failure threshold tracking (5 failures in 30 seconds)     │
│  - Half-open state testing                                   │
│  - Automatic state transitions                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
                    ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Primary Provider│  │Secondary Provider│
        │   (Anthropic)    │  │    (OpenAI)      │
        │                  │  │                  │
        │ State: CLOSED    │  │ State: CLOSED    │
        │ Health: OK       │  │ Health: OK       │
        └──────────────────┘  └──────────────────┘
```

### Circuit Breaker States

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests flow through
  OPEN = 'OPEN',         // Too many failures, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing recovery, limited requests
}

interface CircuitBreakerConfig {
  failureThreshold: 5;      // Open circuit after 5 failures
  failureWindow: 30000;     // Within 30 seconds
  resetTimeout: 60000;      // Try recovery after 60 seconds
  halfOpenRequests: 3;      // Send 3 test requests in half-open
}
```

### Provider Interface

```typescript
// sam-ai-tutor/lib/providers/ai-provider-interface.ts

export interface AIProvider {
  name: string;
  generateContent(params: GenerateContentParams): Promise<AIResponse>;
  checkHealth(): Promise<ProviderHealthStatus>;
  getRateLimit(): RateLimitInfo;
  getPriority(): number; // 1 = primary, 2 = secondary, etc.
}

export interface GenerateContentParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  latency: number;
}

export interface ProviderHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  errorRate: number;
  averageLatency: number;
}
```

### Circuit Breaker Implementation

```typescript
// sam-ai-tutor/lib/circuit-breaker/circuit-breaker.ts

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number[] = []; // Timestamps of recent failures
  private successCount = 0;
  private lastStateChange: Date = new Date();

  constructor(
    private provider: AIProvider,
    private config: CircuitBreakerConfig,
    private logger: Logger
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check current state
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      const timeSinceOpen = Date.now() - this.lastStateChange.getTime();
      if (timeSinceOpen > this.config.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(
          `Circuit breaker OPEN for ${this.provider.name}`,
          this.getNextRetryTime()
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.logger.info(`Circuit breaker half-open success count: ${this.successCount}`);

      if (this.successCount >= this.config.halfOpenRequests) {
        this.transitionTo(CircuitState.CLOSED);
        this.reset();
      }
    } else {
      // Clear old failures
      this.cleanupOldFailures();
    }
  }

  private onFailure(error: Error): void {
    this.failures.push(Date.now());
    this.cleanupOldFailures();

    this.logger.error(`Circuit breaker failure for ${this.provider.name}`, {
      error,
      failureCount: this.failures.length,
      state: this.state
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open → back to open
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    if (this.failures.length >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindow;
    this.failures = this.failures.filter(timestamp => timestamp > cutoff);
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    this.logger.warn(`Circuit breaker state transition: ${oldState} → ${newState}`, {
      provider: this.provider.name,
      failures: this.failures.length
    });

    // Emit metrics
    this.emitStateChangeMetric(oldState, newState);
  }

  private reset(): void {
    this.failures = [];
    this.successCount = 0;
  }

  private getNextRetryTime(): Date {
    return new Date(this.lastStateChange.getTime() + this.config.resetTimeout);
  }

  private emitStateChangeMetric(oldState: CircuitState, newState: CircuitState): void {
    // Integrate with Prometheus/CloudWatch metrics
    metrics.increment('circuit_breaker.state_change', {
      provider: this.provider.name,
      from: oldState,
      to: newState
    });
  }

  public getState(): CircuitState {
    return this.state;
  }

  public getHealthMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failures.length,
      lastStateChange: this.lastStateChange,
      provider: this.provider.name
    };
  }
}
```

### Provider Manager with Failover

```typescript
// sam-ai-tutor/lib/providers/provider-manager.ts

export class AIProviderManager {
  private providers: Map<string, CircuitBreaker> = new Map();
  private providerPriority: AIProvider[] = [];

  constructor(
    providers: AIProvider[],
    private config: CircuitBreakerConfig,
    private logger: Logger
  ) {
    // Sort providers by priority
    this.providerPriority = providers.sort((a, b) =>
      a.getPriority() - b.getPriority()
    );

    // Create circuit breaker for each provider
    this.providerPriority.forEach(provider => {
      const breaker = new CircuitBreaker(provider, config, logger);
      this.providers.set(provider.name, breaker);
    });
  }

  async generateContent(params: GenerateContentParams): Promise<AIResponse> {
    let lastError: Error | null = null;

    // Try providers in priority order
    for (const provider of this.providerPriority) {
      const breaker = this.providers.get(provider.name)!;

      try {
        this.logger.info(`Attempting AI generation with ${provider.name}`);

        const response = await breaker.execute(async () => {
          const startTime = Date.now();
          const result = await provider.generateContent(params);
          const latency = Date.now() - startTime;

          return {
            ...result,
            provider: provider.name,
            latency
          };
        });

        this.logger.info(`AI generation successful with ${provider.name}`, {
          latency: response.latency,
          tokens: response.usage.totalTokens
        });

        return response;

      } catch (error) {
        lastError = error as Error;

        if (error instanceof CircuitOpenError) {
          this.logger.warn(`Circuit breaker OPEN for ${provider.name}, trying next provider`);
          continue; // Try next provider
        }

        this.logger.error(`Provider ${provider.name} failed`, { error });
        continue; // Try next provider
      }
    }

    // All providers failed
    throw new AllProvidersFailedError(
      'All AI providers failed or circuits are open',
      lastError
    );
  }

  async checkAllProvidersHealth(): Promise<Map<string, ProviderHealthStatus>> {
    const healthStatuses = new Map<string, ProviderHealthStatus>();

    for (const provider of this.providerPriority) {
      try {
        const health = await provider.checkHealth();
        healthStatuses.set(provider.name, health);
      } catch (error) {
        this.logger.error(`Health check failed for ${provider.name}`, { error });
        healthStatuses.set(provider.name, {
          isHealthy: false,
          lastCheck: new Date(),
          errorRate: 1.0,
          averageLatency: -1
        });
      }
    }

    return healthStatuses;
  }

  getCircuitBreakerStatus(): Map<string, CircuitBreakerMetrics> {
    const statuses = new Map<string, CircuitBreakerMetrics>();

    this.providers.forEach((breaker, name) => {
      statuses.set(name, breaker.getHealthMetrics());
    });

    return statuses;
  }
}
```

### Concrete Provider Implementations

```typescript
// sam-ai-tutor/lib/providers/anthropic-provider.ts

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  getPriority(): number {
    return 1; // Primary provider
  }

  async generateContent(params: GenerateContentParams): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens || 4000,
      temperature: params.temperature || 0.7,
      system: params.systemPrompt,
      messages: params.messages
    });

    return {
      content: response.content[0].type === 'text'
        ? response.content[0].text
        : '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      provider: this.name,
      latency: 0 // Set by circuit breaker
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      // Simple health check: minimal API call
      await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });

      return {
        isHealthy: true,
        lastCheck: new Date(),
        errorRate: 0,
        averageLatency: 0 // Calculate from metrics
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        errorRate: 1.0,
        averageLatency: -1
      };
    }
  }

  getRateLimit(): RateLimitInfo {
    return {
      requestsPerMinute: 50,
      tokensPerMinute: 100000
    };
  }
}

// sam-ai-tutor/lib/providers/openai-provider.ts

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  getPriority(): number {
    return 2; // Secondary provider
  }

  async generateContent(params: GenerateContentParams): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model || 'gpt-4-turbo-preview',
      max_tokens: params.maxTokens || 4000,
      temperature: params.temperature || 0.7,
      messages: [
        { role: 'system', content: params.systemPrompt || '' },
        ...params.messages
      ]
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      provider: this.name,
      latency: 0 // Set by circuit breaker
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });

      return {
        isHealthy: true,
        lastCheck: new Date(),
        errorRate: 0,
        averageLatency: 0
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        errorRate: 1.0,
        averageLatency: -1
      };
    }
  }

  getRateLimit(): RateLimitInfo {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 90000
    };
  }
}
```

---

## 📝 Implementation Plan

### Week 1: Design & Infrastructure

#### Day 1-2: Design & Setup
- [x] Define `AIProvider` interface
- [x] Design circuit breaker state machine
- [x] Create error types (`CircuitOpenError`, `AllProvidersFailedError`)
- [x] Set up project structure in `sam-ai-tutor/lib/`

#### Day 3-4: Core Implementation
- [ ] Implement `CircuitBreaker` class
- [ ] Implement `AIProviderManager` class
- [ ] Add logging integration (Winston/Pino)
- [ ] Add metrics integration (Prometheus)

#### Day 5: Provider Implementations
- [ ] Implement `AnthropicProvider`
- [ ] Implement `OpenAIProvider`
- [ ] Add provider configuration via environment variables

### Week 2: Integration & Testing

#### Day 6-7: SAM Engine Integration
- [ ] Update `SAMBaseEngine` to use `AIProviderManager`
- [ ] Update all 35+ engines to use new provider abstraction
- [ ] Remove direct Anthropic SDK calls from engines
- [ ] Add provider selection configuration

#### Day 8-9: Testing
- [ ] Unit tests for `CircuitBreaker` (all state transitions)
- [ ] Integration tests for `AIProviderManager`
- [ ] Chaos testing: simulate provider failures
- [ ] Load testing with failover scenarios

#### Day 10-11: Monitoring & Deployment
- [ ] Create Grafana dashboard for circuit breaker states
- [ ] Set up alerts for circuit breaker state changes
- [ ] Deploy to staging environment
- [ ] Run 24-hour soak test

#### Day 12: Production Rollout
- [ ] Deploy to production with feature flag
- [ ] Gradual rollout: 10% → 50% → 100%
- [ ] Monitor metrics and user feedback
- [ ] Document lessons learned

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/circuit-breaker.test.ts

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    mockProvider = {
      name: 'MockProvider',
      generateContent: jest.fn(),
      checkHealth: jest.fn(),
      getRateLimit: jest.fn(),
      getPriority: jest.fn(() => 1)
    };

    breaker = new CircuitBreaker(
      mockProvider,
      {
        failureThreshold: 3,
        failureWindow: 1000,
        resetTimeout: 2000,
        halfOpenRequests: 2
      },
      logger
    );
  });

  describe('State: CLOSED', () => {
    it('should execute operations normally', async () => {
      mockProvider.generateContent.mockResolvedValue(mockResponse);

      const result = await breaker.execute(() =>
        mockProvider.generateContent(params)
      );

      expect(result).toEqual(mockResponse);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after failure threshold', async () => {
      mockProvider.generateContent.mockRejectedValue(new Error('API Error'));

      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(() => mockProvider.generateContent(params))
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('State: OPEN', () => {
    beforeEach(async () => {
      // Trip the circuit breaker
      mockProvider.generateContent.mockRejectedValue(new Error('API Error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(() => mockProvider.generateContent(params))
        ).rejects.toThrow();
      }
    });

    it('should reject requests immediately', async () => {
      await expect(
        breaker.execute(() => mockProvider.generateContent(params))
      ).rejects.toThrow(CircuitOpenError);
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      jest.advanceTimersByTime(2500); // Past resetTimeout

      mockProvider.generateContent.mockResolvedValue(mockResponse);

      await breaker.execute(() => mockProvider.generateContent(params));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('State: HALF_OPEN', () => {
    beforeEach(async () => {
      // Get to HALF_OPEN state
      // (trip circuit, wait for reset timeout)
    });

    it('should transition to CLOSED after successful requests', async () => {
      mockProvider.generateContent.mockResolvedValue(mockResponse);

      for (let i = 0; i < 2; i++) {
        await breaker.execute(() => mockProvider.generateContent(params));
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN on any failure', async () => {
      mockProvider.generateContent.mockRejectedValue(new Error('Still broken'));

      await expect(
        breaker.execute(() => mockProvider.generateContent(params))
      ).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/provider-manager.test.ts

describe('AIProviderManager', () => {
  let manager: AIProviderManager;
  let anthropicProvider: jest.Mocked<AIProvider>;
  let openaiProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    anthropicProvider = createMockProvider('Anthropic', 1);
    openaiProvider = createMockProvider('OpenAI', 2);

    manager = new AIProviderManager(
      [anthropicProvider, openaiProvider],
      defaultConfig,
      logger
    );
  });

  it('should use primary provider when healthy', async () => {
    anthropicProvider.generateContent.mockResolvedValue(mockResponse);

    const result = await manager.generateContent(params);

    expect(result.provider).toBe('Anthropic');
    expect(anthropicProvider.generateContent).toHaveBeenCalled();
    expect(openaiProvider.generateContent).not.toHaveBeenCalled();
  });

  it('should failover to secondary when primary fails', async () => {
    anthropicProvider.generateContent.mockRejectedValue(new Error('Primary down'));
    openaiProvider.generateContent.mockResolvedValue(mockResponse);

    const result = await manager.generateContent(params);

    expect(result.provider).toBe('OpenAI');
    expect(openaiProvider.generateContent).toHaveBeenCalled();
  });

  it('should throw when all providers fail', async () => {
    anthropicProvider.generateContent.mockRejectedValue(new Error('Down'));
    openaiProvider.generateContent.mockRejectedValue(new Error('Down'));

    await expect(
      manager.generateContent(params)
    ).rejects.toThrow(AllProvidersFailedError);
  });
});
```

### Chaos Testing

```typescript
// __tests__/chaos/provider-chaos.test.ts

describe('Chaos Engineering: Provider Failures', () => {
  it('should handle intermittent provider failures', async () => {
    let callCount = 0;

    mockProvider.generateContent.mockImplementation(() => {
      callCount++;
      // Fail 30% of requests randomly
      if (Math.random() < 0.3) {
        return Promise.reject(new Error('Random failure'));
      }
      return Promise.resolve(mockResponse);
    });

    // Run 100 requests
    const results = await Promise.allSettled(
      Array(100).fill(null).map(() => manager.generateContent(params))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;

    // Should have high success rate despite random failures
    expect(successful).toBeGreaterThan(95);
  });

  it('should recover from complete provider outage', async () => {
    // Simulate provider going down
    mockProvider.generateContent.mockRejectedValue(new Error('Outage'));

    // Trip the circuit breaker
    for (let i = 0; i < 5; i++) {
      await expect(manager.generateContent(params)).rejects.toThrow();
    }

    // Wait for recovery attempt
    jest.advanceTimersByTime(60000);

    // Provider comes back online
    mockProvider.generateContent.mockResolvedValue(mockResponse);

    // Should recover
    const result = await manager.generateContent(params);
    expect(result).toEqual(mockResponse);
  });
});
```

---

## 📊 Monitoring & Alerts

### Metrics to Track

```typescript
// Prometheus metrics
const metrics = {
  // Circuit breaker state changes
  'circuit_breaker.state_change': Counter({
    name: 'sam_circuit_breaker_state_changes_total',
    help: 'Total circuit breaker state transitions',
    labelNames: ['provider', 'from_state', 'to_state']
  }),

  // Provider request latency
  'provider.request_latency': Histogram({
    name: 'sam_provider_request_duration_seconds',
    help: 'Provider request latency',
    labelNames: ['provider', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  // Provider failures
  'provider.failures': Counter({
    name: 'sam_provider_failures_total',
    help: 'Total provider failures',
    labelNames: ['provider', 'error_type']
  }),

  // Failover events
  'failover.events': Counter({
    name: 'sam_failover_events_total',
    help: 'Total failover events',
    labelNames: ['from_provider', 'to_provider']
  }),

  // Active circuit breaker state
  'circuit_breaker.state': Gauge({
    name: 'sam_circuit_breaker_state',
    help: 'Current circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
    labelNames: ['provider']
  })
};
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SAM Circuit Breaker & Failover",
    "panels": [
      {
        "title": "Circuit Breaker States",
        "targets": [{
          "expr": "sam_circuit_breaker_state"
        }],
        "type": "graph"
      },
      {
        "title": "Provider Request Latency (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, sam_provider_request_duration_seconds)"
        }]
      },
      {
        "title": "Failover Events",
        "targets": [{
          "expr": "rate(sam_failover_events_total[5m])"
        }]
      },
      {
        "title": "Provider Failure Rate",
        "targets": [{
          "expr": "rate(sam_provider_failures_total[5m])"
        }]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# Prometheus alert rules
groups:
  - name: sam_circuit_breaker
    interval: 30s
    rules:
      - alert: CircuitBreakerOpen
        expr: sam_circuit_breaker_state == 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker OPEN for {{ $labels.provider }}"
          description: "Provider {{ $labels.provider }} circuit breaker has been OPEN for 2 minutes"

      - alert: HighProviderFailureRate
        expr: rate(sam_provider_failures_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High failure rate for {{ $labels.provider }}"
          description: "Provider {{ $labels.provider }} has >10% failure rate"

      - alert: FrequentFailovers
        expr: rate(sam_failover_events_total[15m]) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Frequent failover events detected"
          description: "More than 0.5 failovers per minute in last 15 minutes"

      - alert: AllProvidersUnhealthy
        expr: count(sam_circuit_breaker_state == 2) == count(sam_circuit_breaker_state)
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "All AI providers unhealthy"
          description: "All provider circuit breakers are OPEN - SAM may be unavailable"
```

---

## 🔄 Rollback Plan

### Rollback Triggers
- User-facing error rate increases by >20%
- p95 latency increases by >50%
- More than 10 customer complaints in 1 hour
- Circuit breaker causes unexpected behavior

### Rollback Procedure

```bash
# 1. Disable circuit breaker via feature flag
curl -X POST https://api.taxomind.com/admin/feature-flags \
  -d '{"flag": "circuit_breaker_enabled", "value": false}'

# 2. Verify fallback to direct Anthropic calls
curl https://api.taxomind.com/api/sam/health

# 3. Monitor for 15 minutes
# - Check error rate returns to baseline
# - Verify latency returns to normal
# - Monitor user feedback

# 4. If stable, investigate circuit breaker issue
# 5. If unstable, revert deployment entirely
```

### Data Recovery
- No data changes in this initiative
- Circuit breaker state is ephemeral (in-memory)
- No database migrations needed
- Rollback is immediate and safe

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (10 days): $8,000
- DevOps Engineer (5 days): $4,000
- QA Engineer (3 days): $2,000
- **Total Engineering**: $14,000

### Infrastructure Costs
- Monitoring tools (1 month): $200
- Load testing tools: $100
- **Total Infrastructure**: $300

### AI API Costs
- Testing API calls: ~$500
- Health check calls (ongoing): ~$50/month

### Contingency (20%): $3,000

**Total Budget**: ~$18,000

---

## ✅ Acceptance Criteria

Before marking this initiative complete, verify:

- [ ] Circuit breaker implemented with all 3 states (CLOSED, OPEN, HALF_OPEN)
- [ ] Both Anthropic and OpenAI providers integrated
- [ ] Automatic failover working in <2 seconds
- [ ] All 35+ SAM engines updated to use `AIProviderManager`
- [ ] Unit test coverage >80%
- [ ] Integration tests passing
- [ ] Chaos tests passing (simulated failures)
- [ ] Grafana dashboard deployed
- [ ] Alert rules configured in Prometheus
- [ ] PagerDuty integration working
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] Production deployment with feature flag
- [ ] 24-hour soak test passed
- [ ] User-facing error rate <1%
- [ ] Zero downtime during deployment

---

## 📚 References

- [Martin Fowler - Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Netflix Hystrix Documentation](https://github.com/Netflix/Hystrix/wiki)
- [Release It! - Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

---

**Status**: Ready for Implementation
**Next Initiative**: [Rate Limiting & Cost Controls](./02-rate-limiting-cost-controls.md)
**Related**: [Observability & Monitoring](./03-observability-monitoring.md)
