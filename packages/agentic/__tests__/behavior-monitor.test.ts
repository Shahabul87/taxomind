/**
 * Tests for BehaviorMonitor
 */

import {
  BehaviorMonitor,
  createBehaviorMonitor,
  InMemoryBehaviorEventStore,
  InMemoryPatternStore,
  InMemoryInterventionStore,
  BehaviorEventType,
  PatternType,
  InterventionType,
  EmotionalSignalType,
  AnomalyType,
} from '../src/proactive-intervention';

describe('BehaviorMonitor', () => {
  let monitor: BehaviorMonitor;

  beforeEach(() => {
    monitor = createBehaviorMonitor();
  });

  describe('trackEvent', () => {
    it('should track a behavior event', async () => {
      const event = await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: {
          url: '/course/1',
          courseId: 'course-1',
        },
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.userId).toBe('user-1');
      expect(event.type).toBe(BehaviorEventType.SESSION_START);
      expect(event.processed).toBe(false);
    });

    it('should process emotional signals', async () => {
      const event = await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.CONTENT_INTERACTION,
        data: {},
        pageContext: { url: '/course/1' },
        emotionalSignals: [
          {
            type: EmotionalSignalType.FRUSTRATION,
            intensity: 0.8,
            source: 'behavior',
            timestamp: new Date(),
          },
        ],
      });

      expect(event).toBeDefined();

      // Should have created an intervention for high frustration
      const interventions = await monitor.getPendingInterventions('user-1');
      expect(interventions.length).toBeGreaterThan(0);
      expect(interventions[0].type).toBe(InterventionType.BREAK_SUGGESTION);
    });

    it('should track multiple events', async () => {
      await monitor.trackEvents([
        {
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        },
        {
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(),
          type: BehaviorEventType.CONTENT_INTERACTION,
          data: {},
          pageContext: { url: '/course/1' },
        },
      ]);

      const events = await monitor.getEvents('user-1', { includeProcessed: true });
      expect(events.length).toBe(2);
    });
  });

  describe('detectPatterns', () => {
    it('should detect time preference pattern', async () => {
      // Create multiple session starts at the same time of day
      const baseTime = new Date();
      baseTime.setHours(9, 0, 0, 0); // 9 AM

      for (let i = 0; i < 5; i++) {
        const eventTime = new Date(baseTime);
        eventTime.setDate(eventTime.getDate() - i);

        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: `session-${i}`,
          timestamp: eventTime,
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        });
      }

      const patterns = await monitor.detectPatterns('user-1');
      const timePattern = patterns.find((p) => p.type === PatternType.TIME_PREFERENCE);

      expect(timePattern).toBeDefined();
      expect(timePattern?.name).toContain('Morning');
    });

    it('should detect learning habit pattern', async () => {
      const now = new Date();

      // Create session start/end pairs
      for (let i = 0; i < 5; i++) {
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - i);
        startTime.setHours(10, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: `session-${i}`,
          timestamp: startTime,
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        });

        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: `session-${i}`,
          timestamp: endTime,
          type: BehaviorEventType.SESSION_END,
          data: {},
          pageContext: { url: '/course/1' },
        });
      }

      const patterns = await monitor.detectPatterns('user-1');
      const habitPattern = patterns.find((p) => p.type === PatternType.LEARNING_HABIT);

      expect(habitPattern).toBeDefined();
    });

    it('should detect help-seeking pattern', async () => {
      const now = new Date();

      for (let i = 0; i < 6; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.HINT_REQUEST,
          data: {},
          pageContext: { url: '/course/1', chapterId: 'chapter-1' },
        });
      }

      const patterns = await monitor.detectPatterns('user-1');
      const helpPattern = patterns.find((p) => p.type === PatternType.HELP_SEEKING);

      expect(helpPattern).toBeDefined();
      expect(helpPattern?.name).toContain('Hint Seeker');
    });

    it('should detect struggle pattern from failed assessments', async () => {
      const now = new Date();

      for (let i = 0; i < 4; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.ASSESSMENT_ATTEMPT,
          data: { passed: false, score: 40 },
          pageContext: { url: '/course/1' },
        });
      }

      const patterns = await monitor.detectPatterns('user-1');
      const strugglePattern = patterns.find((p) => p.type === PatternType.STRUGGLE_PATTERN);

      expect(strugglePattern).toBeDefined();
    });

    it('should return empty array for insufficient data', async () => {
      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: { url: '/course/1' },
      });

      const patterns = await monitor.detectPatterns('user-1');
      expect(patterns).toHaveLength(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect sudden disengagement', async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Many sessions two weeks ago
      for (let i = 0; i < 10; i++) {
        const eventTime = new Date(twoWeeksAgo);
        eventTime.setDate(eventTime.getDate() + (i % 7));

        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: `old-session-${i}`,
          timestamp: eventTime,
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        });
      }

      // Fewer sessions in recent week
      for (let i = 0; i < 2; i++) {
        const eventTime = new Date(weekAgo);
        eventTime.setDate(eventTime.getDate() + i);

        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: `new-session-${i}`,
          timestamp: eventTime,
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        });
      }

      const anomalies = await monitor.detectAnomalies('user-1');
      const disengagement = anomalies.find(
        (a) => a.type === AnomalyType.SUDDEN_DISENGAGEMENT
      );

      expect(disengagement).toBeDefined();
    });

    it('should detect repeated failures', async () => {
      const now = new Date();

      for (let i = 0; i < 4; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.ASSESSMENT_ATTEMPT,
          data: { passed: false },
          pageContext: { url: '/course/1' },
        });
      }

      const anomalies = await monitor.detectAnomalies('user-1');
      const failures = anomalies.find((a) => a.type === AnomalyType.REPEATED_FAILURES);

      expect(failures).toBeDefined();
      expect(failures?.severity).toBe('medium');
    });
  });

  describe('predictChurn', () => {
    it('should predict low churn risk for active user', async () => {
      const now = new Date();

      // Create active user with many sessions
      for (let i = 0; i < 10; i++) {
        const eventTime = new Date(now);
        eventTime.setDate(eventTime.getDate() - i);

        await monitor.trackEvent({
          userId: 'active-user',
          sessionId: `session-${i}`,
          timestamp: eventTime,
          type: BehaviorEventType.SESSION_START,
          data: {},
          pageContext: { url: '/course/1' },
        });

        // Add some content interactions
        for (let j = 0; j < 3; j++) {
          await monitor.trackEvent({
            userId: 'active-user',
            sessionId: `session-${i}`,
            timestamp: new Date(eventTime.getTime() + j * 60000),
            type: BehaviorEventType.CONTENT_INTERACTION,
            data: {},
            pageContext: { url: '/course/1' },
          });
        }
      }

      const prediction = await monitor.predictChurn('active-user');

      expect(prediction).toBeDefined();
      expect(prediction.churnProbability).toBeLessThan(0.5);
      expect(['low', 'medium']).toContain(prediction.riskLevel);
      expect(prediction.factors.length).toBeGreaterThan(0);
    });

    it('should predict elevated churn risk for inactive user', async () => {
      // No events = elevated churn risk (medium or higher)
      const prediction = await monitor.predictChurn('inactive-user');

      expect(prediction).toBeDefined();
      expect(prediction.churnProbability).toBeGreaterThanOrEqual(0.4);
      expect(['medium', 'high', 'critical']).toContain(prediction.riskLevel);
    });

    it('should include recommended interventions', async () => {
      const prediction = await monitor.predictChurn('user-1');

      expect(prediction.recommendedInterventions).toBeDefined();
    });
  });

  describe('predictStruggle', () => {
    it('should predict struggle areas from failed assessments', async () => {
      const now = new Date();

      for (let i = 0; i < 5; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.ASSESSMENT_ATTEMPT,
          data: { passed: false, score: 30 },
          pageContext: { url: '/course/1', courseId: 'course-1', chapterId: 'chapter-1' },
        });
      }

      const prediction = await monitor.predictStruggle('user-1');

      expect(prediction).toBeDefined();
      expect(prediction.struggleProbability).toBeGreaterThan(0);
      expect(prediction.areas.length).toBeGreaterThan(0);
      expect(prediction.recommendedSupport.length).toBeGreaterThan(0);
    });

    it('should return low struggle probability for successful user', async () => {
      const now = new Date();

      for (let i = 0; i < 5; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.ASSESSMENT_ATTEMPT,
          data: { passed: true, score: 90 },
          pageContext: { url: '/course/1', courseId: 'course-1', chapterId: 'chapter-1' },
        });
      }

      const prediction = await monitor.predictStruggle('user-1');

      expect(prediction.struggleProbability).toBe(0);
      expect(prediction.areas).toHaveLength(0);
    });
  });

  describe('suggestInterventions', () => {
    it('should suggest interventions for patterns', async () => {
      const now = new Date();

      // Create struggle pattern
      for (let i = 0; i < 4; i++) {
        await monitor.trackEvent({
          userId: 'user-1',
          sessionId: 'session-1',
          timestamp: new Date(now.getTime() - i * 60000),
          type: BehaviorEventType.ASSESSMENT_ATTEMPT,
          data: { passed: false },
          pageContext: { url: '/course/1' },
        });
      }

      const patterns = await monitor.detectPatterns('user-1');
      const interventions = await monitor.suggestInterventions(patterns);

      expect(interventions.length).toBeGreaterThan(0);
    });
  });

  describe('getEvents', () => {
    it('should return events for user', async () => {
      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: { url: '/course/1' },
      });

      const events = await monitor.getEvents('user-1', { includeProcessed: true });
      expect(events.length).toBe(1);
    });

    it('should filter events by type', async () => {
      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: { url: '/course/1' },
      });

      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.CONTENT_INTERACTION,
        data: {},
        pageContext: { url: '/course/1' },
      });

      const events = await monitor.getEvents('user-1', {
        types: [BehaviorEventType.SESSION_START],
        includeProcessed: true,
      });

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(BehaviorEventType.SESSION_START);
    });
  });

  describe('getSessionEvents', () => {
    it('should return events for a session', async () => {
      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: { url: '/course/1' },
      });

      await monitor.trackEvent({
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_END,
        data: {},
        pageContext: { url: '/course/1' },
      });

      const events = await monitor.getSessionEvents('session-1');
      expect(events.length).toBe(2);
    });
  });

  describe('intervention lifecycle', () => {
    it('should create and execute intervention', async () => {
      const intervention = await monitor.createIntervention('user-1', {
        type: InterventionType.ENCOURAGEMENT,
        priority: 'low',
        message: 'Great job!',
        suggestedActions: [],
        timing: { type: 'immediate' },
      });

      expect(intervention.id).toBeDefined();
      expect(intervention.executedAt).toBeUndefined();

      const executed = await monitor.executeIntervention(intervention.id);
      expect(executed.executedAt).toBeDefined();
    });

    it('should record intervention result', async () => {
      const intervention = await monitor.createIntervention('user-1', {
        type: InterventionType.ENCOURAGEMENT,
        priority: 'low',
        message: 'Great job!',
        suggestedActions: [],
        timing: { type: 'immediate' },
      });

      await monitor.recordInterventionResult(intervention.id, {
        success: true,
        userResponse: 'accepted',
        impactMeasured: true,
        impactScore: 0.8,
      });

      // Intervention result should be recorded
      // (We would need to retrieve it to verify, but the method call should succeed)
    });
  });
});

describe('InMemoryBehaviorEventStore', () => {
  let store: InMemoryBehaviorEventStore;

  beforeEach(() => {
    store = new InMemoryBehaviorEventStore();
  });

  it('should add and retrieve event', async () => {
    const event = await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    const retrieved = await store.get(event.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(event.id);
  });

  it('should add batch of events', async () => {
    const events = await store.addBatch([
      {
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_START,
        data: {},
        pageContext: { url: '/course/1' },
      },
      {
        userId: 'user-1',
        sessionId: 'session-1',
        timestamp: new Date(),
        type: BehaviorEventType.SESSION_END,
        data: {},
        pageContext: { url: '/course/1' },
      },
    ]);

    expect(events.length).toBe(2);
  });

  it('should get events by user', async () => {
    await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    await store.add({
      userId: 'user-2',
      sessionId: 'session-2',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    const events = await store.getByUser('user-1');
    expect(events.length).toBe(1);
  });

  it('should get unprocessed events', async () => {
    await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    const unprocessed = await store.getUnprocessed(10);
    expect(unprocessed.length).toBe(1);
  });

  it('should mark events as processed', async () => {
    const event = await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    await store.markProcessed([event.id]);

    const retrieved = await store.get(event.id);
    expect(retrieved?.processed).toBe(true);
    expect(retrieved?.processedAt).toBeDefined();
  });

  it('should count events', async () => {
    await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    await store.add({
      userId: 'user-1',
      sessionId: 'session-1',
      timestamp: new Date(),
      type: BehaviorEventType.SESSION_START,
      data: {},
      pageContext: { url: '/course/1' },
    });

    const count = await store.count('user-1', BehaviorEventType.SESSION_START);
    expect(count).toBe(2);
  });
});

describe('InMemoryPatternStore', () => {
  let store: InMemoryPatternStore;

  beforeEach(() => {
    store = new InMemoryPatternStore();
  });

  it('should create and retrieve pattern', async () => {
    const pattern = await store.create({
      userId: 'user-1',
      type: PatternType.TIME_PREFERENCE,
      name: 'Morning Learner',
      description: 'Prefers morning study',
      frequency: 5,
      duration: 30,
      confidence: 0.8,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 5,
    });

    const retrieved = await store.get(pattern.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(pattern.id);
  });

  it('should get patterns by user', async () => {
    await store.create({
      userId: 'user-1',
      type: PatternType.TIME_PREFERENCE,
      name: 'Pattern 1',
      description: 'Test',
      frequency: 1,
      duration: 1,
      confidence: 0.5,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 1,
    });

    const patterns = await store.getByUser('user-1');
    expect(patterns.length).toBe(1);
  });

  it('should get patterns by type', async () => {
    await store.create({
      userId: 'user-1',
      type: PatternType.TIME_PREFERENCE,
      name: 'Pattern 1',
      description: 'Test',
      frequency: 1,
      duration: 1,
      confidence: 0.5,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 1,
    });

    await store.create({
      userId: 'user-1',
      type: PatternType.LEARNING_HABIT,
      name: 'Pattern 2',
      description: 'Test',
      frequency: 1,
      duration: 1,
      confidence: 0.5,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 1,
    });

    const patterns = await store.getByType('user-1', PatternType.TIME_PREFERENCE);
    expect(patterns.length).toBe(1);
  });

  it('should update pattern', async () => {
    const pattern = await store.create({
      userId: 'user-1',
      type: PatternType.TIME_PREFERENCE,
      name: 'Pattern 1',
      description: 'Test',
      frequency: 1,
      duration: 1,
      confidence: 0.5,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 1,
    });

    const updated = await store.update(pattern.id, { confidence: 0.9 });
    expect(updated.confidence).toBe(0.9);
  });

  it('should record occurrence', async () => {
    const pattern = await store.create({
      userId: 'user-1',
      type: PatternType.TIME_PREFERENCE,
      name: 'Pattern 1',
      description: 'Test',
      frequency: 1,
      duration: 1,
      confidence: 0.5,
      contexts: [],
      firstObservedAt: new Date(),
      lastObservedAt: new Date(),
      occurrences: 1,
    });

    await store.recordOccurrence(pattern.id);

    const updated = await store.get(pattern.id);
    expect(updated?.occurrences).toBe(2);
  });
});

describe('InMemoryInterventionStore', () => {
  let store: InMemoryInterventionStore;

  beforeEach(() => {
    store = new InMemoryInterventionStore();
  });

  it('should create and retrieve intervention', async () => {
    const intervention = await store.create({
      type: InterventionType.ENCOURAGEMENT,
      priority: 'low',
      message: 'Great job!',
      suggestedActions: [],
      timing: { type: 'immediate' },
    });

    const retrieved = await store.get(intervention.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(intervention.id);
  });

  it('should get interventions by user', async () => {
    const intervention = await store.create({
      type: InterventionType.ENCOURAGEMENT,
      priority: 'low',
      message: 'Great job!',
      suggestedActions: [],
      timing: { type: 'immediate' },
    });

    store.setUserIntervention('user-1', intervention.id);

    const interventions = await store.getByUser('user-1');
    expect(interventions.length).toBe(1);
  });

  it('should update intervention', async () => {
    const intervention = await store.create({
      type: InterventionType.ENCOURAGEMENT,
      priority: 'low',
      message: 'Great job!',
      suggestedActions: [],
      timing: { type: 'immediate' },
    });

    const updated = await store.update(intervention.id, { executedAt: new Date() });
    expect(updated.executedAt).toBeDefined();
  });

  it('should record result', async () => {
    const intervention = await store.create({
      type: InterventionType.ENCOURAGEMENT,
      priority: 'low',
      message: 'Great job!',
      suggestedActions: [],
      timing: { type: 'immediate' },
    });

    await store.recordResult(intervention.id, {
      success: true,
      userResponse: 'accepted',
    });

    const updated = await store.get(intervention.id);
    expect(updated?.result?.success).toBe(true);
  });
});
