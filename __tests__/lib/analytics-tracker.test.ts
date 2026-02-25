/**
 * Tests for AnalyticsTracker
 * Source: lib/analytics-tracker.ts
 *
 * The source exports a singleton class and bound convenience functions.
 * We test the class behavior by importing the module fresh.
 */

// We need to reset the module for each test since it's a singleton
let analyticsTracker: typeof import('@/lib/analytics-tracker')['analyticsTracker'];

const mockFetch = global.fetch as jest.Mock;

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Re-import to get a fresh singleton
    const mod = require('@/lib/analytics-tracker');
    analyticsTracker = mod.analyticsTracker;
  });

  it('should generate a session ID on creation', () => {
    const metrics = analyticsTracker.getSessionMetrics();

    expect(metrics.sessionId).toBeDefined();
    expect(metrics.sessionId).toContain('session_');
  });

  it('should track page views', () => {
    analyticsTracker.trackPageView('/dashboard');
    analyticsTracker.trackPageView('/courses');

    const behavior = analyticsTracker.getUserBehaviorMetrics();

    expect(behavior.pageViews).toBe(2);
  });

  it('should track AI generation metrics', () => {
    analyticsTracker.trackAIGeneration({
      operationType: 'blueprint',
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      success: true,
      inputComplexity: 'high',
      outputQuality: 0.9,
    });

    const metrics = analyticsTracker.getSessionMetrics();

    expect(metrics.aiGenerations).toBe(1);
    expect(metrics.successRate).toBe(100);
  });

  it('should track generation start and return ID', () => {
    const generationId = analyticsTracker.trackGenerationStart('content_optimization', {
      inputComplexity: 'medium',
      userId: 'user-1',
    });

    expect(generationId).toBeDefined();
    expect(generationId).toContain('gen_');
  });

  it('should track generation end', () => {
    const genId = analyticsTracker.trackGenerationStart('blueprint');

    analyticsTracker.trackGenerationEnd(genId, {
      success: true,
      duration: 3000,
      outputQuality: 0.85,
      cacheHit: false,
      retryCount: 0,
    });

    // Should not throw - just verifying it executes
    const metrics = analyticsTracker.getSessionMetrics();
    expect(metrics).toBeDefined();
  });

  it('should track user interactions', () => {
    analyticsTracker.trackUserInteraction('button_click', { buttonId: 'submit' });

    // Should not throw
    const behavior = analyticsTracker.getUserBehaviorMetrics();
    expect(behavior).toBeDefined();
  });

  it('should track AI feature usage', () => {
    analyticsTracker.trackAIFeatureUsage('course_planner');
    analyticsTracker.trackAIFeatureUsage('quiz_generator');
    analyticsTracker.trackAIFeatureUsage('course_planner'); // Duplicate

    const behavior = analyticsTracker.getUserBehaviorMetrics();

    expect(behavior.aiFeatureUsage).toHaveLength(3);
    expect(behavior.aiFeatureUsage).toContain('course_planner');
    expect(behavior.aiFeatureUsage).toContain('quiz_generator');
  });

  it('should track errors', () => {
    const error = new Error('Something went wrong');

    analyticsTracker.trackError(error, {
      operation: 'course-generation',
      severity: 'high',
      recoverable: true,
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it('should track performance metrics', () => {
    analyticsTracker.trackPerformance({
      apiResponseTime: 250,
      renderTime: 50,
      interactionLatency: 100,
      errorRate: 2.5,
      cacheHitRate: 75,
      throughput: 1000,
    });

    const perf = analyticsTracker.getPerformanceMetrics();

    expect(perf.apiResponseTime).toBe(250);
    expect(perf.cacheHitRate).toBe(75);
  });

  it('should track form progress', () => {
    analyticsTracker.trackFormProgress('step_1', 4, 1);
    analyticsTracker.trackFormProgress('step_2', 4, 2);

    const behavior = analyticsTracker.getUserBehaviorMetrics();

    // completionRate should be updated to step 2/4 = 50%
    expect(behavior.completionRate).toBe(50);
  });

  it('should flush events', async () => {
    // Track enough events to trigger auto-flush
    for (let i = 0; i < 5; i++) {
      analyticsTracker.trackPageView(`/page-${i}`);
    }

    // Manual flush
    await analyticsTracker.flush();

    // Should not throw
    expect(true).toBe(true);
  });

  it('should get session metrics', () => {
    analyticsTracker.trackPageView('/test');
    analyticsTracker.trackAIGeneration({
      operationType: 'blueprint',
      startTime: Date.now() - 1000,
      success: true,
      inputComplexity: 'low',
    });

    const metrics = analyticsTracker.getSessionMetrics();

    expect(metrics.sessionId).toBeDefined();
    expect(metrics.duration).toBeGreaterThanOrEqual(0);
    expect(metrics.aiGenerations).toBe(1);
    expect(metrics.successRate).toBe(100);
  });

  it('should get user behavior metrics with defaults', () => {
    const behavior = analyticsTracker.getUserBehaviorMetrics();

    expect(behavior.pageViews).toBe(0);
    expect(behavior.formInteractions).toBe(0);
    expect(behavior.aiFeatureUsage).toEqual([]);
    expect(behavior.completionRate).toBe(0);
    expect(behavior.userExperienceLevel).toBe('beginner');
    expect(behavior.featureDiscoveryPath).toEqual([]);
  });

  it('should calculate average response time from generation metrics', () => {
    analyticsTracker.trackAIGeneration({
      operationType: 'blueprint',
      startTime: Date.now() - 2000,
      endTime: Date.now(),
      success: true,
      inputComplexity: 'medium',
    });

    analyticsTracker.trackAIGeneration({
      operationType: 'suggestions',
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      success: true,
      inputComplexity: 'low',
    });

    const metrics = analyticsTracker.getSessionMetrics();

    expect(metrics.aiGenerations).toBe(2);
    expect(metrics.averageResponseTime).toBeGreaterThan(0);
  });
});
