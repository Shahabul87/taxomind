/**
 * Retry Quality Gate — Runtime Behavior Tests
 *
 * Tests the generic retry loop: retryWithQualityGate()
 * Pure async function, fully controllable via callbacks — no AI mocking needed.
 */

import { retryWithQualityGate, type RetryConfig, type AttemptResult } from '../retry-quality-gate';

// ============================================================================
// Helpers
// ============================================================================

type TestResult = { content: string };
type TestFeedback = { criticalIssues: string[]; previousScore: number; attemptNumber: number };

function makeConfig(
  overrides: Partial<RetryConfig<TestResult, TestFeedback>> = {},
): RetryConfig<TestResult, TestFeedback> {
  return {
    strategy: { maxRetries: 3, retryThreshold: 75 },
    buildFallback: () => ({ content: 'fallback' }),
    executeAttempt: jest.fn(async () => ({ result: { content: 'ok' }, score: 80 })),
    extractFeedback: jest.fn((result, score, nextAttempt) => ({
      criticalIssues: ['Below threshold'],
      previousScore: score,
      attemptNumber: nextAttempt,
    })),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('retryWithQualityGate', () => {
  it('returns on first attempt when score meets threshold', async () => {
    const config = makeConfig({
      executeAttempt: jest.fn(async () => ({ result: { content: 'great' }, score: 85 })),
    });

    const { bestResult, bestScore, attemptsUsed } = await retryWithQualityGate(config);

    expect(bestResult.content).toBe('great');
    expect(bestScore).toBe(85);
    expect(attemptsUsed).toBe(1);
    expect(config.executeAttempt).toHaveBeenCalledTimes(1);
  });

  it('retries when score is below threshold', async () => {
    const scores = [60, 65, 78];
    let callIndex = 0;

    const config = makeConfig({
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 78;
        callIndex++;
        return { result: { content: `attempt-${callIndex}` }, score };
      }),
    });

    const { bestScore, attemptsUsed } = await retryWithQualityGate(config);

    expect(bestScore).toBe(78);
    expect(attemptsUsed).toBe(3);
  });

  it('stops after maxConsecutiveDeclines non-improvements', async () => {
    // Score goes: 60, 55, 50 → 2 consecutive declines → stop
    const scores = [60, 55, 50, 80];
    let callIndex = 0;

    const config = makeConfig({
      strategy: { maxRetries: 5, retryThreshold: 75 },
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 80;
        callIndex++;
        return { result: { content: `attempt-${callIndex}` }, score };
      }),
      maxConsecutiveDeclines: 2,
    });

    const { bestScore, attemptsUsed } = await retryWithQualityGate(config);

    expect(bestScore).toBe(60); // Best was the first attempt
    expect(attemptsUsed).toBe(3); // Stopped after 3 attempts (2 consecutive declines)
    // Should NOT have reached the 4th attempt that would score 80
    expect(callIndex).toBe(3);
  });

  it('keeps best score from earlier attempt when later attempts score lower', async () => {
    // Score goes: 70, 65 → best is still 70 from attempt 1
    const scores = [70, 65];
    let callIndex = 0;

    const config = makeConfig({
      strategy: { maxRetries: 2, retryThreshold: 75 },
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 65;
        callIndex++;
        return { result: { content: `attempt-${callIndex}` }, score };
      }),
      maxConsecutiveDeclines: 3,
    });

    const { bestResult, bestScore } = await retryWithQualityGate(config);

    expect(bestScore).toBe(70);
    expect(bestResult.content).toBe('attempt-1');
  });

  it('calls extractFeedback with correct args on retry', async () => {
    const scores = [60, 80];
    let callIndex = 0;

    const extractFeedback = jest.fn((result: TestResult, score: number, nextAttempt: number) => ({
      criticalIssues: ['Issue'],
      previousScore: score,
      attemptNumber: nextAttempt,
    }));

    const config = makeConfig({
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 80;
        callIndex++;
        return { result: { content: `v${callIndex}` }, score };
      }),
      extractFeedback,
    });

    await retryWithQualityGate(config);

    expect(extractFeedback).toHaveBeenCalledTimes(1);
    expect(extractFeedback).toHaveBeenCalledWith(
      { content: 'v1' }, // result from attempt 0
      60, // score from attempt 0
      2, // nextAttempt (0-based attempt 0 → next is attempt 1 → display as 2)
    );
  });

  it('enriches feedback via selfCritique callback', async () => {
    const scores = [60, 80];
    let callIndex = 0;

    const selfCritique = jest.fn((result: TestResult, score: number, feedback: TestFeedback) => ({
      ...feedback,
      criticalIssues: [...feedback.criticalIssues, 'Self-critique addition'],
    }));

    const config = makeConfig({
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 80;
        callIndex++;
        return { result: { content: `v${callIndex}` }, score };
      }),
      selfCritique,
    });

    await retryWithQualityGate(config);

    expect(selfCritique).toHaveBeenCalledTimes(1);
    expect(selfCritique).toHaveBeenCalledWith(
      { content: 'v1' },
      60,
      expect.objectContaining({ criticalIssues: expect.any(Array) }),
    );
  });

  it('calls onRetry callback with attempt info', async () => {
    const scores = [60, 80];
    let callIndex = 0;

    const onRetry = jest.fn();

    const config = makeConfig({
      executeAttempt: jest.fn(async (): Promise<AttemptResult<TestResult>> => {
        const score = scores[callIndex] ?? 80;
        callIndex++;
        return { result: { content: `v${callIndex}` }, score };
      }),
      onRetry,
    });

    await retryWithQualityGate(config);

    expect(onRetry).toHaveBeenCalledTimes(1);
    // onRetry is called with (attempt+1, score, topIssue)
    expect(onRetry).toHaveBeenCalledWith(1, 60, 'Below threshold');
  });
});
