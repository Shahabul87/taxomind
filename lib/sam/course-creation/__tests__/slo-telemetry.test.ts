/**
 * Tests for Course Creation SLO Telemetry
 *
 * Covers: latency percentile computation, SLO breach detection,
 * snapshot building, and event observation.
 */

import {
  CourseCreationSLOTracker,
  CourseCreationSLOSnapshot,
  BuildSLOSnapshotInput,
} from '../slo-telemetry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseInput(overrides: Partial<BuildSLOSnapshotInput> = {}): BuildSLOSnapshotInput {
  return {
    status: 'completed',
    totalTimeMs: 60_000,
    chaptersCreated: 5,
    sectionsCreated: 15,
    averageQualityScore: 75,
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<CourseCreationSLOSnapshot> = {}): CourseCreationSLOSnapshot {
  return {
    version: 1,
    status: 'completed',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    totalTimeMs: 60_000,
    chaptersCreated: 5,
    sectionsCreated: 15,
    averageQualityScore: 75,
    fallbackCount: 0,
    fallbackRate: 0,
    retryCount: 0,
    retryRate: 0,
    duplicateTopicIncidents: 0,
    criticRevisionRequested: 0,
    criticRevisionAccepted: 0,
    criticRevisionAcceptanceRate: 0,
    promptBudgetAlertCount: 0,
    promptBudgetHighPriorityDropCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CourseCreationSLOTracker', () => {
  describe('constructor & basic snapshot', () => {
    it('builds a snapshot with default zero counters when no events observed', () => {
      const tracker = new CourseCreationSLOTracker('run-1');
      const snap = tracker.buildSnapshot(makeBaseInput());

      expect(snap.version).toBe(1);
      expect(snap.runId).toBe('run-1');
      expect(snap.status).toBe('completed');
      expect(snap.retryCount).toBe(0);
      expect(snap.retryRate).toBe(0);
      expect(snap.duplicateTopicIncidents).toBe(0);
      expect(snap.criticRevisionRequested).toBe(0);
      expect(snap.criticRevisionAccepted).toBe(0);
      expect(snap.criticRevisionAcceptanceRate).toBe(0);
      expect(snap.promptBudgetAlertCount).toBe(0);
      expect(snap.promptBudgetHighPriorityDropCount).toBe(0);
      expect(snap.stageLatencies).toBeUndefined();
    });

    it('builds a snapshot without runId when not provided', () => {
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.runId).toBeUndefined();
    });

    it('records startedAt at construction time and endedAt at snapshot time', () => {
      const before = Date.now();
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput());
      const after = Date.now();

      expect(new Date(snap.startedAt).getTime()).toBeGreaterThanOrEqual(before);
      expect(new Date(snap.endedAt).getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('observeEvent', () => {
    it('counts quality_retry events', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'quality_retry', data: {} });
      tracker.observeEvent({ type: 'quality_retry', data: {} });
      tracker.observeEvent({ type: 'quality_retry', data: {} });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.retryCount).toBe(3);
    });

    it('computes retryRate as retries / (chapters + sections*2)', () => {
      const tracker = new CourseCreationSLOTracker();
      // 7 retries / (5 chapters + 15 sections * 2) = 7/35 = 0.2
      for (let i = 0; i < 7; i++) {
        tracker.observeEvent({ type: 'quality_retry', data: {} });
      }
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.retryRate).toBe(0.2);
    });

    it('returns retryRate 0 when totalParsedItems is 0', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'quality_retry', data: {} });
      const snap = tracker.buildSnapshot(makeBaseInput({ chaptersCreated: 0, sectionsCreated: 0 }));
      expect(snap.retryRate).toBe(0);
    });

    it('counts critic_review revise events', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      // "accept" verdict should NOT increment
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'accept' } });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.criticRevisionRequested).toBe(2);
    });

    it('counts critic_revision_accepted events and computes acceptance rate', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      tracker.observeEvent({ type: 'critic_review', data: { verdict: 'revise' } });
      tracker.observeEvent({ type: 'critic_revision_accepted', data: {} });
      tracker.observeEvent({ type: 'critic_revision_accepted', data: {} });
      tracker.observeEvent({ type: 'critic_revision_accepted', data: {} });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.criticRevisionRequested).toBe(4);
      expect(snap.criticRevisionAccepted).toBe(3);
      expect(snap.criticRevisionAcceptanceRate).toBe(0.75);
    });

    it('returns criticRevisionAcceptanceRate 0 when no revisions requested', () => {
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.criticRevisionAcceptanceRate).toBe(0);
    });

    it('counts semantic_duplicate_detected events', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'semantic_duplicate_detected', data: {} });
      tracker.observeEvent({ type: 'semantic_duplicate_detected', data: {} });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.duplicateTopicIncidents).toBe(2);
    });

    it('counts prompt_budget_alert events and accumulates droppedHighPriorityCount', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'prompt_budget_alert', data: { droppedHighPriorityCount: 3 } });
      tracker.observeEvent({ type: 'prompt_budget_alert', data: { droppedHighPriorityCount: 2 } });
      tracker.observeEvent({ type: 'prompt_budget_alert', data: {} });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.promptBudgetAlertCount).toBe(3);
      expect(snap.promptBudgetHighPriorityDropCount).toBe(5);
    });

    it('ignores droppedHighPriorityCount when zero or negative', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'prompt_budget_alert', data: { droppedHighPriorityCount: 0 } });
      tracker.observeEvent({ type: 'prompt_budget_alert', data: { droppedHighPriorityCount: -1 } });

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.promptBudgetAlertCount).toBe(2);
      expect(snap.promptBudgetHighPriorityDropCount).toBe(0);
    });

    it('ignores unknown event types', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.observeEvent({ type: 'unknown_event', data: {} });
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.retryCount).toBe(0);
      expect(snap.duplicateTopicIncidents).toBe(0);
    });
  });

  describe('fallback summary passthrough', () => {
    it('uses fallbackSummary from input when provided', () => {
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput({ fallbackSummary: { count: 4, rate: 0.27 } }));
      expect(snap.fallbackCount).toBe(4);
      expect(snap.fallbackRate).toBe(0.27);
    });

    it('defaults fallback to 0 when no summary provided', () => {
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.fallbackCount).toBe(0);
      expect(snap.fallbackRate).toBe(0);
    });
  });

  describe('stage latency percentiles', () => {
    it('computes p50 and p95 for a single-element array', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.recordStageLatency(1, 500);

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies).toBeDefined();
      expect(snap.stageLatencies!.stage1).toEqual({ p50Ms: 500, p95Ms: 500, count: 1 });
    });

    it('computes p50 for an even-length sorted array', () => {
      const tracker = new CourseCreationSLOTracker();
      // [100, 200, 300, 400] → p50 index = floor(4*0.5) = 2 → sorted[2] = 300
      tracker.recordStageLatency(2, 300);
      tracker.recordStageLatency(2, 100);
      tracker.recordStageLatency(2, 400);
      tracker.recordStageLatency(2, 200);

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies!.stage2!.p50Ms).toBe(300);
      expect(snap.stageLatencies!.stage2!.count).toBe(4);
    });

    it('computes p95 for a 20-element array', () => {
      const tracker = new CourseCreationSLOTracker();
      // Values: 1..20 → sorted: [1,2,...,20]
      // p95 index = min(ceil(20*0.95)-1, 19) = min(18, 19) = 18 → sorted[18] = 19
      for (let i = 1; i <= 20; i++) {
        tracker.recordStageLatency(3, i);
      }

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies!.stage3!.p95Ms).toBe(19);
      expect(snap.stageLatencies!.stage3!.count).toBe(20);
    });

    it('computes p50 correctly for an odd-length array', () => {
      const tracker = new CourseCreationSLOTracker();
      // [10, 20, 30, 40, 50] → p50 index = floor(5*0.5) = 2 → sorted[2] = 30
      tracker.recordStageLatency(1, 50);
      tracker.recordStageLatency(1, 30);
      tracker.recordStageLatency(1, 10);
      tracker.recordStageLatency(1, 40);
      tracker.recordStageLatency(1, 20);

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies!.stage1!.p50Ms).toBe(30);
    });

    it('does not include stageLatencies when no latencies recorded', () => {
      const tracker = new CourseCreationSLOTracker();
      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies).toBeUndefined();
    });

    it('only includes stages that have latencies', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.recordStageLatency(2, 100);

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies!.stage1).toBeUndefined();
      expect(snap.stageLatencies!.stage2).toBeDefined();
      expect(snap.stageLatencies!.stage3).toBeUndefined();
    });

    it('handles all three stages independently', () => {
      const tracker = new CourseCreationSLOTracker();
      tracker.recordStageLatency(1, 100);
      tracker.recordStageLatency(2, 200);
      tracker.recordStageLatency(3, 300);

      const snap = tracker.buildSnapshot(makeBaseInput());
      expect(snap.stageLatencies!.stage1!.p50Ms).toBe(100);
      expect(snap.stageLatencies!.stage2!.p50Ms).toBe(200);
      expect(snap.stageLatencies!.stage3!.p50Ms).toBe(300);
    });
  });

  describe('checkSLOBreaches', () => {
    it('returns no breaches for a healthy snapshot', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot());
      expect(result.breached).toBe(false);
      expect(result.breaches).toHaveLength(0);
    });

    // ---- Fallback rate ----
    it('detects warning-level fallback rate breach (>0.3)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ fallbackRate: 0.35 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'fallbackRate', threshold: 0.3, actual: 0.35, severity: 'warning' },
      ]);
    });

    it('detects critical-level fallback rate breach (>0.5)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ fallbackRate: 0.6 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'fallbackRate', threshold: 0.5, actual: 0.6, severity: 'critical' },
      ]);
    });

    it('does not breach fallbackRate at exactly 0.3', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ fallbackRate: 0.3 }));
      expect(result.breaches.find(b => b.metric === 'fallbackRate')).toBeUndefined();
    });

    // ---- Retry rate ----
    it('detects warning-level retry rate breach (>0.4)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ retryRate: 0.45 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'retryRate', threshold: 0.4, actual: 0.45, severity: 'warning' },
      ]);
    });

    it('detects critical-level retry rate breach (>0.6)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ retryRate: 0.7 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'retryRate', threshold: 0.6, actual: 0.7, severity: 'critical' },
      ]);
    });

    // ---- Average quality ----
    it('detects warning-level quality breach (<60)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ averageQualityScore: 55 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'averageQuality', threshold: 60, actual: 55, severity: 'warning' },
      ]);
    });

    it('detects critical-level quality breach (<45)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ averageQualityScore: 40 }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'averageQuality', threshold: 45, actual: 40, severity: 'critical' },
      ]);
    });

    it('does not breach quality at exactly 60', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({ averageQualityScore: 60 }));
      expect(result.breaches.find(b => b.metric === 'averageQuality')).toBeUndefined();
    });

    // ---- Stage latency ----
    it('detects warning-level stage p95 latency breach (>120s)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({
        stageLatencies: {
          stage1: { p50Ms: 50_000, p95Ms: 150_000, count: 10 },
        },
      }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'stage1.p95Latency', threshold: 120, actual: 150, severity: 'warning' },
      ]);
    });

    it('detects critical-level stage p95 latency breach (>300s)', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({
        stageLatencies: {
          stage2: { p50Ms: 100_000, p95Ms: 400_000, count: 10 },
        },
      }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toEqual([
        { metric: 'stage2.p95Latency', threshold: 300, actual: 400, severity: 'critical' },
      ]);
    });

    it('checks all stages in stageLatencies', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({
        stageLatencies: {
          stage1: { p50Ms: 50_000, p95Ms: 150_000, count: 5 },
          stage2: { p50Ms: 50_000, p95Ms: 90_000, count: 5 },
          stage3: { p50Ms: 100_000, p95Ms: 350_000, count: 5 },
        },
      }));
      expect(result.breaches).toHaveLength(2);
      expect(result.breaches[0].metric).toBe('stage1.p95Latency');
      expect(result.breaches[0].severity).toBe('warning');
      expect(result.breaches[1].metric).toBe('stage3.p95Latency');
      expect(result.breaches[1].severity).toBe('critical');
    });

    it('skips undefined stage entries in stageLatencies', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({
        stageLatencies: {
          stage1: undefined,
          stage2: { p50Ms: 50_000, p95Ms: 90_000, count: 5 },
        },
      }));
      expect(result.breached).toBe(false);
      expect(result.breaches).toHaveLength(0);
    });

    // ---- Multiple breaches ----
    it('accumulates multiple breaches from different metrics', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot({
        fallbackRate: 0.6,
        retryRate: 0.7,
        averageQualityScore: 40,
        stageLatencies: {
          stage1: { p50Ms: 50_000, p95Ms: 400_000, count: 10 },
        },
      }));
      expect(result.breached).toBe(true);
      expect(result.breaches).toHaveLength(4);
      const metrics = result.breaches.map(b => b.metric);
      expect(metrics).toContain('fallbackRate');
      expect(metrics).toContain('retryRate');
      expect(metrics).toContain('averageQuality');
      expect(metrics).toContain('stage1.p95Latency');
    });

    it('handles snapshot with no stageLatencies', () => {
      const tracker = new CourseCreationSLOTracker();
      const result = tracker.checkSLOBreaches(makeSnapshot());
      expect(result.breached).toBe(false);
    });
  });
});
