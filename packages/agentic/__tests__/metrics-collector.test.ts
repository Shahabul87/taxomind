/**
 * @sam-ai/agentic - Metrics Collector Tests
 * Tests for plan lifecycle store, proactive event store, and agentic metrics collector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AgenticMetricsCollector,
  InMemoryPlanLifecycleStore,
  InMemoryProactiveEventStore,
  createAgenticMetricsCollector,
  createInMemoryPlanLifecycleStore,
  createInMemoryProactiveEventStore,
} from '../src/observability/metrics-collector';
import {
  PlanEventType,
  ProactiveEventType,
  AlertSeverity,
  type PlanLifecycleEvent,
  type ProactiveEvent,
  type AlertRule,
} from '../src/observability/types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockPlanEvent(overrides: Partial<PlanLifecycleEvent> = {}): PlanLifecycleEvent {
  return {
    eventId: 'event-1',
    planId: 'plan-1',
    userId: 'user-1',
    eventType: PlanEventType.CREATED,
    timestamp: new Date(),
    ...overrides,
  };
}

function createMockProactiveEvent(overrides: Partial<ProactiveEvent> = {}): ProactiveEvent {
  return {
    eventId: 'event-1',
    userId: 'user-1',
    eventType: ProactiveEventType.CHECKIN_DELIVERED,
    itemId: 'checkin-1',
    delivered: true,
    timestamp: new Date(),
    ...overrides,
  };
}

// ============================================================================
// IN-MEMORY PLAN LIFECYCLE STORE TESTS
// ============================================================================

describe('InMemoryPlanLifecycleStore', () => {
  let store: InMemoryPlanLifecycleStore;

  beforeEach(() => {
    store = createInMemoryPlanLifecycleStore();
  });

  describe('record and getByPlanId', () => {
    it('should record and retrieve events by plan ID', async () => {
      const event = createMockPlanEvent();
      await store.record(event);

      const events = await store.getByPlanId(event.planId);
      expect(events).toHaveLength(1);
      expect(events[0].eventId).toBe(event.eventId);
    });

    it('should store multiple events for same plan', async () => {
      const planId = 'plan-1';
      await store.record(createMockPlanEvent({ planId, eventId: 'e1', eventType: PlanEventType.CREATED }));
      await store.record(createMockPlanEvent({ planId, eventId: 'e2', eventType: PlanEventType.ACTIVATED }));
      await store.record(createMockPlanEvent({ planId, eventId: 'e3', eventType: PlanEventType.COMPLETED }));

      const events = await store.getByPlanId(planId);
      expect(events).toHaveLength(3);
    });

    it('should return empty array for unknown plan', async () => {
      const events = await store.getByPlanId('unknown-plan');
      expect(events).toHaveLength(0);
    });

    it('should enforce max events per plan (FIFO eviction)', async () => {
      const maxEventsPerPlan = 3;
      const storeWithLimit = createInMemoryPlanLifecycleStore(maxEventsPerPlan);

      for (let i = 0; i < 5; i++) {
        await storeWithLimit.record(
          createMockPlanEvent({
            planId: 'plan-1',
            eventId: `event-${i}`,
          })
        );
      }

      const events = await storeWithLimit.getByPlanId('plan-1');
      expect(events).toHaveLength(maxEventsPerPlan);
      expect(events[0].eventId).toBe('event-2'); // First 2 evicted
    });
  });

  describe('getMetrics', () => {
    it('should calculate plan metrics for period', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Create complete plan lifecycle
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.CREATED,
          timestamp: hourAgo,
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.STEP_STARTED,
          timestamp: new Date(hourAgo.getTime() + 1000),
          metadata: { stepPosition: 0 },
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.STEP_COMPLETED,
          timestamp: new Date(hourAgo.getTime() + 2000),
          metadata: { stepPosition: 0 },
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.COMPLETED,
          newState: 'completed',
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(hourAgo.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.totalCreated).toBe(1);
      expect(metrics.completionRate).toBe(1);
      expect(metrics.abandonmentRate).toBe(0);
    });

    it('should calculate abandonment rate', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      // Create 2 plans - 1 completed, 1 abandoned
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.CREATED,
          timestamp: periodStart,
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.COMPLETED,
          timestamp: now,
        })
      );

      await store.record(
        createMockPlanEvent({
          planId: 'plan-2',
          eventType: PlanEventType.CREATED,
          timestamp: periodStart,
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-2',
          eventType: PlanEventType.ABANDONED,
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.totalCreated).toBe(2);
      expect(metrics.completionRate).toBe(0.5);
      expect(metrics.abandonmentRate).toBe(0.5);
    });

    it('should handle empty period', async () => {
      const now = new Date();
      const metrics = await store.getMetrics(
        new Date(now.getTime() - 1000),
        now
      );

      expect(metrics.totalCreated).toBe(0);
      expect(metrics.completionRate).toBe(0);
      expect(metrics.abandonmentRate).toBe(0);
    });

    it('should track step completion by position', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Record step completions at different positions
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.CREATED,
          timestamp: hourAgo,
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.STEP_COMPLETED,
          timestamp: now,
          metadata: { stepPosition: 0 },
        })
      );
      await store.record(
        createMockPlanEvent({
          planId: 'plan-1',
          eventType: PlanEventType.STEP_COMPLETED,
          timestamp: now,
          metadata: { stepPosition: 1 },
        })
      );

      const metrics = await store.getMetrics(
        new Date(hourAgo.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.stepCompletionByPosition[0]).toBe(1);
      expect(metrics.stepCompletionByPosition[1]).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all events', async () => {
      await store.record(createMockPlanEvent({ planId: 'plan-1' }));
      await store.record(createMockPlanEvent({ planId: 'plan-2' }));

      store.clear();

      const events1 = await store.getByPlanId('plan-1');
      const events2 = await store.getByPlanId('plan-2');
      expect(events1).toHaveLength(0);
      expect(events2).toHaveLength(0);
    });
  });
});

// ============================================================================
// IN-MEMORY PROACTIVE EVENT STORE TESTS
// ============================================================================

describe('InMemoryProactiveEventStore', () => {
  let store: InMemoryProactiveEventStore;

  beforeEach(() => {
    store = createInMemoryProactiveEventStore();
  });

  describe('record and getByUserId', () => {
    it('should record and retrieve events by user ID', async () => {
      const event = createMockProactiveEvent();
      await store.record(event);

      const events = await store.getByUserId(event.userId);
      expect(events).toHaveLength(1);
      expect(events[0].eventId).toBe(event.eventId);
    });

    it('should filter by user ID', async () => {
      await store.record(createMockProactiveEvent({ userId: 'user-1', eventId: 'e1' }));
      await store.record(createMockProactiveEvent({ userId: 'user-2', eventId: 'e2' }));
      await store.record(createMockProactiveEvent({ userId: 'user-1', eventId: 'e3' }));

      const events = await store.getByUserId('user-1');
      expect(events).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await store.record(createMockProactiveEvent({ eventId: `event-${i}` }));
      }

      const events = await store.getByUserId('user-1', 5);
      expect(events).toHaveLength(5);
    });

    it('should enforce max events (FIFO eviction)', async () => {
      const maxEvents = 5;
      const storeWithLimit = createInMemoryProactiveEventStore(maxEvents);

      for (let i = 0; i < 10; i++) {
        await storeWithLimit.record(createMockProactiveEvent({ eventId: `event-${i}` }));
      }

      const events = await storeWithLimit.getByUserId('user-1');
      expect(events).toHaveLength(maxEvents);
      expect(events[0].eventId).toBe('event-5'); // First 5 evicted
    });
  });

  describe('getMetrics', () => {
    it('should calculate proactive metrics for period', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      // Record check-in events
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.CHECKIN_DELIVERED,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.CHECKIN_RESPONDED,
          timestamp: now,
          response: { action: 'accepted', responseTimeMs: 5000 },
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.checkInsSent).toBe(1);
      expect(metrics.checkInResponseRate).toBe(1);
    });

    it('should calculate intervention metrics', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      // Record intervention events
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.INTERVENTION_TRIGGERED,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.INTERVENTION_TRIGGERED,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.INTERVENTION_ACCEPTED,
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.interventionsTriggered).toBe(2);
      expect(metrics.interventionAcceptRate).toBe(0.5);
    });

    it('should calculate nudge metrics', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.NUDGE_SENT,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.NUDGE_SENT,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.NUDGE_CLICKED,
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.nudgesSent).toBe(2);
      expect(metrics.nudgeClickRate).toBe(0.5);
    });

    it('should calculate recommendation metrics', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.RECOMMENDATION_SHOWN,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          eventType: ProactiveEventType.RECOMMENDATION_CLICKED,
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.recommendationsShown).toBe(1);
      expect(metrics.recommendationClickRate).toBe(1);
    });

    it('should track by channel', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockProactiveEvent({
          channel: 'websocket',
          delivered: true,
          timestamp: now,
        })
      );
      await store.record(
        createMockProactiveEvent({
          channel: 'email',
          delivered: false,
          timestamp: now,
        })
      );

      const metrics = await store.getMetrics(
        new Date(periodStart.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(metrics.byChannel['websocket'].sent).toBe(1);
      expect(metrics.byChannel['websocket'].delivered).toBe(1);
      expect(metrics.byChannel['email'].sent).toBe(1);
      expect(metrics.byChannel['email'].delivered).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all events', async () => {
      await store.record(createMockProactiveEvent());
      store.clear();

      const events = await store.getByUserId('user-1');
      expect(events).toHaveLength(0);
    });
  });
});

// ============================================================================
// AGENTIC METRICS COLLECTOR TESTS
// ============================================================================

describe('AgenticMetricsCollector', () => {
  let collector: AgenticMetricsCollector;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    collector = createAgenticMetricsCollector({
      config: {
        healthCheckIntervalMs: 100000, // Long interval to prevent auto-runs
        alertsEnabled: true,
      },
      logger: mockLogger,
    });
  });

  afterEach(() => {
    collector.stop();
  });

  describe('lifecycle', () => {
    it('should start and stop without errors', () => {
      collector.start();
      expect(mockLogger.info).toHaveBeenCalledWith('Agentic metrics collector started');

      collector.stop();
      expect(mockLogger.info).toHaveBeenCalledWith('Agentic metrics collector stopped');
    });

    it('should handle multiple start calls gracefully', () => {
      collector.start();
      collector.start(); // Should not throw
      collector.stop();
    });
  });

  describe('sub-collector access', () => {
    it('should provide access to tool telemetry', () => {
      const telemetry = collector.getToolTelemetry();
      expect(telemetry).toBeDefined();
    });

    it('should provide access to memory quality tracker', () => {
      const tracker = collector.getMemoryQualityTracker();
      expect(tracker).toBeDefined();
    });

    it('should provide access to confidence calibration', () => {
      const calibration = collector.getConfidenceCalibration();
      expect(calibration).toBeDefined();
    });

    it('should provide access to plan lifecycle store', () => {
      const store = collector.getPlanLifecycleStore();
      expect(store).toBeDefined();
    });

    it('should provide access to proactive event store', () => {
      const store = collector.getProactiveEventStore();
      expect(store).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return unified metrics snapshot', async () => {
      const metrics = await collector.getMetrics();

      expect(metrics).toHaveProperty('tools');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('confidence');
      expect(metrics).toHaveProperty('plans');
      expect(metrics).toHaveProperty('proactive');
      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('generatedAt');
      expect(metrics).toHaveProperty('periodStart');
      expect(metrics).toHaveProperty('periodEnd');
    });

    it('should respect custom period', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const metrics = await collector.getMetrics(hourAgo, now);

      expect(metrics.periodStart.getTime()).toBe(hourAgo.getTime());
      expect(metrics.periodEnd.getTime()).toBe(now.getTime());
    });
  });

  describe('getQuickSummary', () => {
    it('should return quick summary metrics', async () => {
      const summary = await collector.getQuickSummary();

      expect(summary).toHaveProperty('toolSuccessRate');
      expect(summary).toHaveProperty('avgToolLatencyMs');
      expect(summary).toHaveProperty('memoryRelevanceScore');
      expect(summary).toHaveProperty('memoryCacheHitRate');
      expect(summary).toHaveProperty('confidenceCalibrationError');
      expect(summary).toHaveProperty('activeToolExecutions');
      expect(summary).toHaveProperty('healthScore');
      expect(summary).toHaveProperty('activeAlerts');
      expect(summary).toHaveProperty('timestamp');
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health metrics', async () => {
      const health = await collector.getSystemHealth();

      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('memoryUsageMb');
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(1);
    });

    it('should include component health', async () => {
      const health = await collector.getSystemHealth();

      expect(health.components).toHaveProperty('tool_telemetry');
      expect(health.components).toHaveProperty('memory_quality');
      expect(health.components).toHaveProperty('confidence_calibration');
    });
  });

  describe('alerts', () => {
    it('should add alert rule', () => {
      const rule: AlertRule = {
        id: 'rule-1',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        metric: 'errorRate',
        operator: 'gt',
        threshold: 0.5,
        windowMinutes: 5,
        severity: AlertSeverity.CRITICAL,
        enabled: true,
      };

      collector.addAlertRule(rule);
      // No error means success
    });

    it('should remove alert rule', () => {
      const rule: AlertRule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test',
        metric: 'errorRate',
        operator: 'gt',
        threshold: 0.5,
        windowMinutes: 5,
        severity: AlertSeverity.WARNING,
        enabled: true,
      };

      collector.addAlertRule(rule);
      collector.removeAlertRule('rule-1');
      // No error means success
    });

    it('should return active alerts', () => {
      const alerts = collector.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should acknowledge alert', () => {
      // First we need to trigger an alert
      collector.acknowledgeAlert('non-existent');
      // Should not throw for non-existent alert
    });

    it('should support alert subscriptions', () => {
      const callback = vi.fn();
      const unsubscribe = collector.onAlert(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      // Callback should no longer be called after unsubscribe
    });
  });

  describe('recordPlanEvent', () => {
    it('should record plan lifecycle event', async () => {
      await collector.recordPlanEvent({
        planId: 'plan-1',
        userId: 'user-1',
        eventType: PlanEventType.CREATED,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Plan lifecycle event recorded',
        expect.objectContaining({
          planId: 'plan-1',
          eventType: PlanEventType.CREATED,
        })
      );
    });

    it('should auto-generate eventId and timestamp', async () => {
      await collector.recordPlanEvent({
        planId: 'plan-1',
        userId: 'user-1',
        eventType: PlanEventType.ACTIVATED,
      });

      const store = collector.getPlanLifecycleStore();
      const events = await store.getByPlanId('plan-1');
      expect(events[0].eventId).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });
  });

  describe('recordProactiveEvent', () => {
    it('should record proactive event', async () => {
      await collector.recordProactiveEvent({
        userId: 'user-1',
        eventType: ProactiveEventType.CHECKIN_DELIVERED,
        itemId: 'checkin-1',
        delivered: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Proactive event recorded',
        expect.objectContaining({
          userId: 'user-1',
          eventType: ProactiveEventType.CHECKIN_DELIVERED,
        })
      );
    });

    it('should auto-generate eventId and timestamp', async () => {
      await collector.recordProactiveEvent({
        userId: 'user-1',
        eventType: ProactiveEventType.NUDGE_SENT,
        itemId: 'nudge-1',
        delivered: true,
      });

      const store = collector.getProactiveEventStore();
      const events = await store.getByUserId('user-1');
      expect(events[0].eventId).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });
  });
});
