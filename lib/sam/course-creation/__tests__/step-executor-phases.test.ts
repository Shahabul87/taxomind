/**
 * Step Executor Phases — Runtime Behavior Tests
 *
 * Tests phaseSkipCheck() — the lightweight skip detection phase.
 * Requires mocking the deep import chain from step-executor-phases.
 */

// Mock server-only before any imports
jest.mock('server-only', () => ({}));

// Mock the heavy dependencies that step-executor-phases imports transitively
jest.mock('@/lib/db', () => ({ db: {} }));
jest.mock('@/lib/sam/ai-provider', () => ({}));
jest.mock('@/lib/ai/enterprise-client', () => ({}));
jest.mock('@/lib/ai/subscription-enforcement', () => ({}));
jest.mock('@/lib/admin/check-admin', () => ({}));
jest.mock('@/config/auth/auth.admin', () => ({}));
jest.mock('@/auth.config.admin', () => ({ default: {} }));
jest.mock('../chapter-generator', () => ({
  generateSingleChapter: jest.fn(),
}));
jest.mock('../agentic-decisions', () => ({
  evaluateChapterOutcomeWithAI: jest.fn(),
  applyAgenticDecision: jest.fn(),
  persistQualityFlag: jest.fn(),
  buildAdaptiveGuidance: jest.fn(() => ''),
  generateBridgeContent: jest.fn(async () => ''),
}));
jest.mock('../chapter-regenerator', () => ({
  regenerateChapter: jest.fn(),
}));
jest.mock('../checkpoint-manager', () => ({
  saveCheckpointWithRetry: jest.fn(),
}));
jest.mock('../quality-integration', () => ({}));
jest.mock('../quality-feedback', () => ({}));
jest.mock('../safety-integration', () => ({}));
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { phaseSkipCheck } from '../step-executor-phases';
import type { StepExecutorContext } from '../step-executor-phases';

// ============================================================================
// Fixtures
// ============================================================================

function makeContext(overrides: Partial<StepExecutorContext> = {}): StepExecutorContext {
  return {
    config: {
      userId: 'user-1',
      courseId: 'course-1',
      runId: 'run-1',
      totalChapters: 5,
      onSSEEvent: jest.fn(),
      onProgress: jest.fn(),
    },
    state: {
      skipNextChapter: false,
      hasSkipped: false,
      qualityScores: [],
      completedChapters: [],
      conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
      healingQueue: [],
    },
    chapterNumber: 3,
    buildContext: jest.fn(),
    ...overrides,
  } as unknown as StepExecutorContext;
}

// ============================================================================
// Tests
// ============================================================================

describe('phaseSkipCheck', () => {
  it('returns null when skipNextChapter is false (continue to next phase)', () => {
    const ctx = makeContext({
      state: {
        skipNextChapter: false,
        hasSkipped: false,
        qualityScores: [],
        completedChapters: [],
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        healingQueue: [],
      } as StepExecutorContext['state'],
    });

    const result = phaseSkipCheck(ctx);
    expect(result).toBeNull();
  });

  it('returns skip StepResult when skipNextChapter flag is set', () => {
    const onSSEEvent = jest.fn();
    const ctx = makeContext({
      config: {
        userId: 'user-1',
        courseId: 'course-1',
        runId: 'run-1',
        totalChapters: 5,
        onSSEEvent,
        onProgress: jest.fn(),
      } as StepExecutorContext['config'],
      state: {
        skipNextChapter: true,
        hasSkipped: false,
        qualityScores: [],
        completedChapters: [],
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        healingQueue: [],
      } as StepExecutorContext['state'],
    });

    const result = phaseSkipCheck(ctx);

    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect((result?.output as { skipped?: boolean })?.skipped).toBe(true);
  });

  it('emits chapter_skipped SSE event when skipping', () => {
    const onSSEEvent = jest.fn();
    const ctx = makeContext({
      config: {
        userId: 'user-1',
        courseId: 'course-1',
        runId: 'run-1',
        totalChapters: 5,
        onSSEEvent,
        onProgress: jest.fn(),
      } as StepExecutorContext['config'],
      state: {
        skipNextChapter: true,
        hasSkipped: false,
        qualityScores: [],
        completedChapters: [],
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        healingQueue: [],
      } as StepExecutorContext['state'],
      chapterNumber: 4,
    });

    phaseSkipCheck(ctx);

    expect(onSSEEvent).toHaveBeenCalledWith({
      type: 'chapter_skipped',
      data: expect.objectContaining({ chapter: 4 }),
    });
  });

  it('resets skipNextChapter to false after skip', () => {
    const state = {
      skipNextChapter: true,
      hasSkipped: false,
      qualityScores: [],
      completedChapters: [],
      conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
      healingQueue: [],
    } as StepExecutorContext['state'];

    const ctx = makeContext({ state });
    phaseSkipCheck(ctx);

    expect(state.skipNextChapter).toBe(false);
  });

  it('sets hasSkipped to true after skip', () => {
    const state = {
      skipNextChapter: true,
      hasSkipped: false,
      qualityScores: [],
      completedChapters: [],
      conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
      healingQueue: [],
    } as StepExecutorContext['state'];

    const ctx = makeContext({ state });
    phaseSkipCheck(ctx);

    expect(state.hasSkipped).toBe(true);
  });
});
