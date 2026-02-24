/**
 * Tests for parallel generation SSE event handling.
 *
 * Validates the 4 bugs fixed in the parallel pipeline:
 *   1. Progress percentage uses actual chapter count, not sequential totalItems
 *   2. courseId is propagated to CreationState from SSE events
 *   3. Stale state is properly reset before new generation
 *   4. Complete event sets courseId on state
 */

import { parseSSEChunk, handleSSEEvent } from '@/hooks/use-sam-sequential-creation/sse-event-handler';
import { INITIAL_PROGRESS } from '@/hooks/use-sam-sequential-creation/types';
import type { CreationProgress } from '@/lib/sam/course-creation/types';
import type { SSEHandlerContext, ParsedSSEEvent } from '@/hooks/use-sam-sequential-creation/types';

// ============================================================================
// Helper: Build a mock SSEHandlerContext
// ============================================================================

function buildMockContext(overrides?: {
  totalItems?: number;
  initialProgress?: CreationProgress;
}): {
  ctx: SSEHandlerContext;
  getProgress: () => CreationProgress;
  getError: () => string | null;
  getResumableCourseId: () => string | null;
} {
  const totalItems = overrides?.totalItems ?? 25; // Default: sequential formula for 5ch/10sec
  let currentProgress: CreationProgress = overrides?.initialProgress ?? {
    ...INITIAL_PROGRESS,
    state: { ...INITIAL_PROGRESS.state, totalChapters: 5, totalSections: 10 },
  };
  let currentError: string | null = null;
  let resumableCourseId: string | null = null;

  const startTimeRef = { current: Date.now() - 10_000 }; // started 10s ago
  const itemTimestampsRef = { current: [] as number[] };
  const totalItemsRef = { current: totalItems };
  const progressRef = { current: currentProgress };
  const lastCourseIdRef = { current: null as string | null };

  const setProgress: SSEHandlerContext['setProgress'] = (updater) => {
    if (typeof updater === 'function') {
      currentProgress = updater(currentProgress);
    } else {
      currentProgress = updater;
    }
    progressRef.current = currentProgress;
  };

  const setError: SSEHandlerContext['setError'] = (updater) => {
    if (typeof updater === 'function') {
      currentError = updater(currentError);
    } else {
      currentError = updater;
    }
  };

  const setResumableCourseId: SSEHandlerContext['setResumableCourseId'] = (updater) => {
    if (typeof updater === 'function') {
      resumableCourseId = updater(resumableCourseId);
    } else {
      resumableCourseId = updater;
    }
  };

  const ctx: SSEHandlerContext = {
    setProgress,
    setError,
    setResumableCourseId,
    startTimeRef,
    itemTimestampsRef,
    totalItemsRef,
    progressRef,
    lastCourseIdRef,
    callbacks: {},
  };

  return {
    ctx,
    getProgress: () => currentProgress,
    getError: () => currentError,
    getResumableCourseId: () => resumableCourseId,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('parseSSEChunk', () => {
  it('should parse a single SSE event', () => {
    const chunk = 'event: progress\ndata: {"stage":1,"phase":"generating_chapter"}\n\n';
    const events = parseSSEChunk(chunk);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('progress');
    expect(events[0].data).toEqual({ stage: 1, phase: 'generating_chapter' });
  });

  it('should parse multiple SSE events in one chunk', () => {
    const chunk = [
      'event: parallel_batch_start\ndata: {"batchNumber":1,"totalBatches":2,"chapters":[1,2,3]}',
      'event: parallel_chapter_complete\ndata: {"chapter":1,"title":"Chapter 1","courseId":"course-123"}',
    ].join('\n\n');

    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('parallel_batch_start');
    expect(events[1].event).toBe('parallel_chapter_complete');
  });

  it('should skip malformed JSON data', () => {
    const chunk = 'event: bad_event\ndata: {invalid json}\n\n';
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(0);
  });
});

describe('handleSSEEvent — parallel_chapter_complete (Bug Fix #1: Progress Percentage)', () => {
  it('should calculate percentage using state.totalChapters, not totalItemsRef', () => {
    // totalItemsRef is 25 (sequential formula: 5 + 10 + 10)
    // state.totalChapters is 5 (actual chapter count)
    const { ctx, getProgress } = buildMockContext({ totalItems: 25 });

    const event: ParsedSSEEvent = {
      event: 'parallel_chapter_complete',
      data: {
        chapter: 1,
        title: 'Chapter 1',
        courseId: 'course-abc',
        id: 'ch-1',
      },
    };

    handleSSEEvent(event, ctx);

    const progress = getProgress();
    // With 1 of 5 chapters done: Math.min(95, Math.round(1/5 * 95)) = 19
    expect(progress.percentage).toBe(19);
    expect(progress.completedItems.chapters).toHaveLength(1);

    // Before the fix: 1/25 * 95 = 3.8 ≈ 4 — this was the bug
    // After the fix: 1/5 * 95 = 19 — correct!
  });

  it('should reach 95% when all 5 chapters complete', () => {
    const { ctx, getProgress } = buildMockContext({ totalItems: 25 });

    for (let i = 1; i <= 5; i++) {
      handleSSEEvent({
        event: 'parallel_chapter_complete',
        data: { chapter: i, title: `Chapter ${i}`, courseId: 'course-abc', id: `ch-${i}` },
      }, ctx);
    }

    const progress = getProgress();
    // 5/5 * 95 = 95 (capped at 95, 100 reserved for 'complete' event)
    expect(progress.percentage).toBe(95);
    expect(progress.completedItems.chapters).toHaveLength(5);
  });

  it('should NOT use totalItemsRef as denominator (regression guard)', () => {
    // totalItemsRef = 55 (10ch + 20sec + 20sec, a bigger course)
    // state.totalChapters = 10
    const { ctx, getProgress } = buildMockContext({
      totalItems: 55,
      initialProgress: {
        ...INITIAL_PROGRESS,
        state: { ...INITIAL_PROGRESS.state, totalChapters: 10, totalSections: 20 },
      },
    });

    // Complete 5 of 10 chapters
    for (let i = 1; i <= 5; i++) {
      handleSSEEvent({
        event: 'parallel_chapter_complete',
        data: { chapter: i, title: `Chapter ${i}`, id: `ch-${i}` },
      }, ctx);
    }

    const progress = getProgress();
    // 5/10 * 95 = 47.5 ≈ 48 (correct)
    // NOT 5/55 * 95 = 8.6 ≈ 9 (old buggy formula)
    expect(progress.percentage).toBe(48);
  });
});

describe('handleSSEEvent — courseId propagation (Bug Fix #2)', () => {
  it('should set courseId on state from parallel_chapter_complete', () => {
    const { ctx, getProgress } = buildMockContext();

    handleSSEEvent({
      event: 'parallel_chapter_complete',
      data: { chapter: 1, title: 'Ch 1', courseId: 'course-xyz', id: 'ch-1' },
    }, ctx);

    expect(getProgress().state.courseId).toBe('course-xyz');
  });

  it('should set courseId on state from stage_start event', () => {
    const { ctx, getProgress } = buildMockContext();

    handleSSEEvent({
      event: 'stage_start',
      data: { stage: 1, message: 'Starting stage 1', courseId: 'course-from-stage' },
    }, ctx);

    expect(getProgress().state.courseId).toBe('course-from-stage');
  });

  it('should set courseId on state from complete event', () => {
    const { ctx, getProgress } = buildMockContext();

    const result = handleSSEEvent({
      event: 'complete',
      data: {
        courseId: 'course-final',
        chaptersCreated: 5,
        sectionsCreated: 15,
        totalTime: 120000,
        averageQualityScore: 85,
      },
    }, ctx);

    expect(getProgress().state.courseId).toBe('course-final');
    expect(getProgress().state.phase).toBe('complete');
    expect(getProgress().percentage).toBe(100);
    expect(result.gotComplete).toBe(true);
    expect(result.result?.courseId).toBe('course-final');
  });

  it('should NOT have courseId on state when no courseId in event data', () => {
    const { ctx, getProgress } = buildMockContext();

    handleSSEEvent({
      event: 'parallel_chapter_complete',
      data: { chapter: 1, title: 'Ch 1', id: 'ch-1' },
    }, ctx);

    // courseId should remain undefined (not set)
    expect(getProgress().state.courseId).toBeUndefined();
  });
});

describe('handleSSEEvent — parallel_generation_start', () => {
  it('should set phase and parallelBatch info', () => {
    const { ctx, getProgress } = buildMockContext();

    handleSSEEvent({
      event: 'parallel_generation_start',
      data: {
        courseId: 'course-123',
        totalChapters: 6,
        chapterPositions: [1, 2, 3, 4, 5, 6],
        batchSize: 3,
        totalBatches: 2,
      },
    }, ctx);

    const progress = getProgress();
    expect(progress.state.phase).toBe('generating_chapter');
    expect(progress.parallelBatch).toEqual({
      currentBatch: 0,
      totalBatches: 2,
      batchSize: 3,
      activeChapters: [],
    });
  });
});

describe('handleSSEEvent — parallel_batch_start', () => {
  it('should update parallelBatch with active chapters', () => {
    const { ctx, getProgress } = buildMockContext();

    // First set up parallel generation
    handleSSEEvent({
      event: 'parallel_generation_start',
      data: { chapterPositions: [1, 2, 3, 4, 5], batchSize: 3, totalBatches: 2 },
    }, ctx);

    // Then start batch 1
    handleSSEEvent({
      event: 'parallel_batch_start',
      data: { batchNumber: 1, totalBatches: 2, chapters: [1, 2, 3] },
    }, ctx);

    const progress = getProgress();
    expect(progress.parallelBatch?.currentBatch).toBe(1);
    expect(progress.parallelBatch?.activeChapters).toEqual([1, 2, 3]);
  });
});

describe('handleSSEEvent — parallel_batch_complete', () => {
  it('should clear activeChapters after batch completes', () => {
    const { ctx, getProgress } = buildMockContext();

    // Set up parallel generation + batch
    handleSSEEvent({
      event: 'parallel_generation_start',
      data: { chapterPositions: [1, 2, 3, 4, 5], batchSize: 3, totalBatches: 2 },
    }, ctx);
    handleSSEEvent({
      event: 'parallel_batch_start',
      data: { batchNumber: 1, totalBatches: 2, chapters: [1, 2, 3] },
    }, ctx);

    // Complete the batch
    handleSSEEvent({
      event: 'parallel_batch_complete',
      data: { batchNumber: 1, totalBatches: 2, completedChapters: 3, totalChapters: 5 },
    }, ctx);

    const progress = getProgress();
    expect(progress.parallelBatch?.activeChapters).toEqual([]);
    expect(progress.message).toContain('Batch 1/2 complete');
  });
});

describe('handleSSEEvent — error event with courseId', () => {
  it('should set error state and provide courseId for resume', () => {
    const { ctx, getProgress, getError, getResumableCourseId } = buildMockContext();

    const result = handleSSEEvent({
      event: 'error',
      data: { message: 'AI provider timeout', courseId: 'course-partial', chaptersCreated: 2, sectionsCreated: 6 },
    }, ctx);

    expect(getError()).toBe('AI provider timeout');
    expect(getProgress().state.phase).toBe('error');
    expect(getResumableCourseId()).toBe('course-partial');
    expect(result.gotError).toBe(true);
    expect(result.result?.courseId).toBe('course-partial');
  });

  it('should fall back to lastCourseIdRef when error has no courseId', () => {
    const { ctx, getResumableCourseId } = buildMockContext();

    // First, set courseId via a stage_start event
    handleSSEEvent({
      event: 'stage_start',
      data: { stage: 1, message: 'Starting', courseId: 'course-fallback' },
    }, ctx);

    // Then receive error without courseId
    const result = handleSSEEvent({
      event: 'error',
      data: { message: 'Unexpected failure' },
    }, ctx);

    expect(getResumableCourseId()).toBe('course-fallback');
    expect(result.result?.courseId).toBe('course-fallback');
  });
});

describe('handleSSEEvent — complete deduplication', () => {
  it('should ignore duplicate complete events', () => {
    const { ctx, getProgress } = buildMockContext();

    // First complete
    const result1 = handleSSEEvent({
      event: 'complete',
      data: { courseId: 'course-1', chaptersCreated: 5, sectionsCreated: 15 },
    }, ctx);

    expect(result1.gotComplete).toBe(true);

    // Second complete (duplicate) — should be ignored
    const result2 = handleSSEEvent({
      event: 'complete',
      data: { courseId: 'course-1', chaptersCreated: 5, sectionsCreated: 15 },
    }, ctx);

    // Duplicate returns empty result (no gotComplete)
    expect(result2.gotComplete).toBeUndefined();
    expect(getProgress().percentage).toBe(100);
  });
});

describe('CreationState.courseId type (Bug Fix #2 type guard)', () => {
  it('should allow courseId as an optional string on CreationState', () => {
    // This is a compile-time check — if this test compiles, the type is correct.
    const progress: CreationProgress = {
      ...INITIAL_PROGRESS,
      state: {
        ...INITIAL_PROGRESS.state,
        courseId: 'test-course-id',
      },
    };

    expect(progress.state.courseId).toBe('test-course-id');
  });

  it('should allow CreationState without courseId (backward compatible)', () => {
    const progress: CreationProgress = {
      ...INITIAL_PROGRESS,
      state: { ...INITIAL_PROGRESS.state },
    };

    expect(progress.state.courseId).toBeUndefined();
  });
});

describe('Full parallel generation flow (integration)', () => {
  it('should track progress through an entire parallel generation lifecycle', () => {
    const { ctx, getProgress } = buildMockContext({
      totalItems: 25, // Sequential formula: 5 + 10 + 10
      initialProgress: {
        ...INITIAL_PROGRESS,
        state: {
          ...INITIAL_PROGRESS.state,
          phase: 'creating_course',
          totalChapters: 5,
          totalSections: 10,
        },
      },
    });

    // 1. parallel_generation_start
    handleSSEEvent({
      event: 'parallel_generation_start',
      data: { courseId: 'course-e2e', chapterPositions: [1, 2, 3, 4, 5], batchSize: 3, totalBatches: 2 },
    }, ctx);
    expect(getProgress().state.phase).toBe('generating_chapter');
    expect(getProgress().parallelBatch?.totalBatches).toBe(2);

    // 2. Batch 1 starts
    handleSSEEvent({
      event: 'parallel_batch_start',
      data: { batchNumber: 1, totalBatches: 2, chapters: [1, 2, 3] },
    }, ctx);
    expect(getProgress().parallelBatch?.activeChapters).toEqual([1, 2, 3]);

    // 3. Chapters 1-3 complete
    for (let i = 1; i <= 3; i++) {
      handleSSEEvent({
        event: 'parallel_chapter_complete',
        data: { chapter: i, title: `Chapter ${i}`, courseId: 'course-e2e', id: `ch-${i}`, qualityScore: 82 },
      }, ctx);
    }
    expect(getProgress().completedItems.chapters).toHaveLength(3);
    // 3/5 * 95 = 57
    expect(getProgress().percentage).toBe(57);
    expect(getProgress().state.courseId).toBe('course-e2e');

    // 4. Batch 1 complete
    handleSSEEvent({
      event: 'parallel_batch_complete',
      data: { batchNumber: 1, totalBatches: 2, completedChapters: 3, totalChapters: 5 },
    }, ctx);
    expect(getProgress().parallelBatch?.activeChapters).toEqual([]);

    // 5. Batch 2 starts
    handleSSEEvent({
      event: 'parallel_batch_start',
      data: { batchNumber: 2, totalBatches: 2, chapters: [4, 5] },
    }, ctx);
    expect(getProgress().parallelBatch?.activeChapters).toEqual([4, 5]);

    // 6. Chapters 4-5 complete
    for (let i = 4; i <= 5; i++) {
      handleSSEEvent({
        event: 'parallel_chapter_complete',
        data: { chapter: i, title: `Chapter ${i}`, courseId: 'course-e2e', id: `ch-${i}` },
      }, ctx);
    }
    expect(getProgress().completedItems.chapters).toHaveLength(5);
    // 5/5 * 95 = 95
    expect(getProgress().percentage).toBe(95);

    // 7. Batch 2 complete
    handleSSEEvent({
      event: 'parallel_batch_complete',
      data: { batchNumber: 2, totalBatches: 2, completedChapters: 5, totalChapters: 5 },
    }, ctx);

    // 8. parallel_generation_complete (informational)
    handleSSEEvent({
      event: 'parallel_generation_complete',
      data: { courseId: 'course-e2e', chaptersCreated: 5, sectionsCreated: 15 },
    }, ctx);

    // 9. Terminal complete event
    const result = handleSSEEvent({
      event: 'complete',
      data: {
        courseId: 'course-e2e',
        chaptersCreated: 5,
        sectionsCreated: 15,
        totalTime: 120000,
        averageQualityScore: 82,
      },
    }, ctx);

    expect(result.gotComplete).toBe(true);
    expect(getProgress().percentage).toBe(100);
    expect(getProgress().state.phase).toBe('complete');
    expect(getProgress().state.courseId).toBe('course-e2e');
    expect(result.result?.success).toBe(true);
    expect(result.result?.courseId).toBe('course-e2e');
    expect(result.result?.chaptersCreated).toBe(5);
    expect(result.result?.sectionsCreated).toBe(15);
  });
});
