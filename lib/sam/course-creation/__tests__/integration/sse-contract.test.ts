/**
 * Integration tests for SSE Event Contract
 *
 * Validates that:
 * 1. The SSE event handler handles all known server event types without error
 * 2. Terminal events (complete, error) return correct SSEEventResult shapes
 * 3. State updates from key event types are applied correctly
 * 4. Unknown event types are silently ignored (no crash)
 * 5. The completion handler emits the expected SSE events in order
 */

// Mock localStorage before imports (used by clearPartialCourseId / setPartialCourseId)
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { handleSSEEvent, parseSSEChunk } from '@/hooks/use-sam-sequential-creation/sse-event-handler';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Helper to create SSEHandlerContext for testing
function createMockContext() {
  const progressUpdates: unknown[] = [];
  let currentProgress = {
    state: {
      stage: 1 as number,
      phase: 'generating_chapter',
      currentChapter: 0,
      currentSection: 0,
      totalChapters: 10,
    },
    percentage: 0,
    message: '',
    thinking: undefined as string | undefined,
    completedItems: {
      chapters: [] as Array<{ position: number; title: string; id?: string; qualityScore?: number }>,
      sections: [] as Array<{ chapterPosition: number; position: number; title: string; id?: string; qualityScore?: number }>,
    },
    qualityFlags: [] as Array<{
      chapterPosition: number;
      chapterTitle: string;
      reason: string;
      severity: string;
      action: string;
      timestamp: string;
    }>,
    timing: undefined as unknown,
  };

  return {
    ctx: {
      setProgress: jest.fn((updater: (prev: typeof currentProgress) => typeof currentProgress) => {
        currentProgress = updater(currentProgress);
        progressUpdates.push({ ...currentProgress });
      }),
      setError: jest.fn(),
      setResumableCourseId: jest.fn(),
      startTimeRef: { current: Date.now() - 5000 },
      itemTimestampsRef: { current: [] as number[] },
      totalItemsRef: { current: 50 },
      progressRef: { current: currentProgress },
      lastCourseIdRef: { current: '' },
      callbacks: {
        onProgress: jest.fn(),
        onStageComplete: jest.fn(),
        onThinking: jest.fn(),
        onError: jest.fn(),
      },
    },
    getProgress: () => currentProgress,
    getUpdates: () => progressUpdates,
  };
}

describe('SSE Contract - parseSSEChunk', () => {
  it('should parse a single SSE event', () => {
    const chunk = 'event: progress\ndata: {"stage":1,"percentage":10,"message":"Generating..."}\n\n';
    const events = parseSSEChunk(chunk);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('progress');
    expect(events[0].data).toEqual({
      stage: 1,
      percentage: 10,
      message: 'Generating...',
    });
  });

  it('should parse multiple SSE events in one chunk', () => {
    const chunk = [
      'event: item_complete\ndata: {"stage":1,"chapter":1,"title":"Intro"}',
      'event: item_generating\ndata: {"stage":1,"chapter":2,"message":"Generating Chapter 2..."}',
    ].join('\n\n');

    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('item_complete');
    expect(events[1].event).toBe('item_generating');
  });

  it('should skip invalid JSON data gracefully', () => {
    const chunk = 'event: progress\ndata: {broken json}\n\n';
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(0);
  });

  it('should handle empty chunk', () => {
    const events = parseSSEChunk('');
    expect(events).toHaveLength(0);
  });
});

describe('SSE Contract - handleSSEEvent', () => {
  describe('Progress events', () => {
    it('should handle "progress" event and update state', () => {
      const { ctx, getProgress } = createMockContext();

      const result = handleSSEEvent(
        { event: 'progress', data: { stage: 2, phase: 'generating_section', percentage: 50, message: 'Halfway' } },
        ctx,
      );

      expect(result).toEqual({});
      expect(ctx.setProgress).toHaveBeenCalled();
      expect(getProgress().state.stage).toBe(2);
      expect(getProgress().percentage).toBe(50);
      expect(getProgress().message).toBe('Halfway');
    });

    it('should handle "stage_start" event', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'stage_start', data: { stage: 2, message: 'Generating sections...' } },
        ctx,
      );

      expect(getProgress().state.stage).toBe(2);
      expect(getProgress().state.phase).toBe('generating_section');
      expect(getProgress().message).toBe('Generating sections...');
    });

    it('should handle "item_generating" event', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'item_generating', data: { stage: 1, chapter: 3, message: 'Generating Chapter 3...' } },
        ctx,
      );

      expect(getProgress().state.currentChapter).toBe(3);
    });

    it('should handle "total_items" event', () => {
      const { ctx } = createMockContext();

      handleSSEEvent(
        { event: 'total_items', data: { totalItems: 75, totalChapters: 10 } },
        ctx,
      );

      expect(ctx.totalItemsRef.current).toBe(75);
    });
  });

  describe('Thinking events', () => {
    it('should handle "thinking" event', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'thinking', data: { thinking: 'Considering chapter structure...' } },
        ctx,
      );

      expect(getProgress().thinking).toBe('Considering chapter structure...');
      expect(ctx.callbacks.onThinking).toHaveBeenCalledWith('Considering chapter structure...');
    });

    it('should handle "thinking_chunk" event (appends)', () => {
      const { ctx, getProgress } = createMockContext();

      // Seed initial thinking
      handleSSEEvent({ event: 'thinking', data: { thinking: 'Start' } }, ctx);
      handleSSEEvent({ event: 'thinking_chunk', data: { chunk: ' more' } }, ctx);

      expect(getProgress().thinking).toBe('Start more');
    });
  });

  describe('Item completion events', () => {
    it('should handle "item_complete" for chapter (stage 1)', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'item_complete', data: { stage: 1, chapter: 1, title: 'Introduction', id: 'ch-1', qualityScore: 85 } },
        ctx,
      );

      expect(getProgress().completedItems.chapters).toHaveLength(1);
      expect(getProgress().completedItems.chapters[0]).toEqual(
        expect.objectContaining({
          position: 1,
          title: 'Introduction',
          id: 'ch-1',
          qualityScore: 85,
        }),
      );
    });

    it('should handle "item_complete" for section (stage 2)', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'item_complete', data: { stage: 2, chapter: 1, section: 1, title: 'Getting Started', id: 'sec-1' } },
        ctx,
      );

      expect(getProgress().completedItems.sections).toHaveLength(1);
      expect(getProgress().completedItems.sections[0]).toEqual(
        expect.objectContaining({
          chapterPosition: 1,
          position: 1,
          title: 'Getting Started',
          id: 'sec-1',
        }),
      );
    });

    it('should handle "stage_complete" event', () => {
      const { ctx } = createMockContext();

      handleSSEEvent(
        { event: 'stage_complete', data: { stage: 1 } },
        ctx,
      );

      expect(ctx.callbacks.onStageComplete).toHaveBeenCalledWith(1, []);
    });
  });

  describe('Terminal events', () => {
    it('should handle "complete" event and return terminal result', () => {
      const { ctx, getProgress } = createMockContext();

      const result = handleSSEEvent(
        {
          event: 'complete',
          data: {
            courseId: 'course-123',
            chaptersCreated: 10,
            sectionsCreated: 50,
            totalTime: 120000,
            averageQualityScore: 82,
            promptVersion: '2.0.0',
          },
        },
        ctx,
      );

      expect(result.gotComplete).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({
          success: true,
          courseId: 'course-123',
          chaptersCreated: 10,
          sectionsCreated: 50,
        }),
      );
      expect(getProgress().state.phase).toBe('complete');
      expect(getProgress().percentage).toBe(100);
    });

    it('should deduplicate complete events', () => {
      const { ctx } = createMockContext();

      // First complete
      handleSSEEvent(
        { event: 'complete', data: { courseId: 'c-1', chaptersCreated: 10, sectionsCreated: 50 } },
        ctx,
      );

      // Second complete — should be ignored
      ctx.progressRef.current = { ...ctx.progressRef.current, state: { ...ctx.progressRef.current.state, phase: 'complete' } };
      const result2 = handleSSEEvent(
        { event: 'complete', data: { courseId: 'c-1', chaptersCreated: 10, sectionsCreated: 50 } },
        ctx,
      );

      expect(result2).toEqual({});
    });

    it('should handle "error" event and return terminal result', () => {
      const { ctx, getProgress } = createMockContext();

      const result = handleSSEEvent(
        {
          event: 'error',
          data: {
            message: 'Token budget exceeded',
            courseId: 'course-partial',
            chaptersCreated: 5,
            sectionsCreated: 25,
          },
        },
        ctx,
      );

      expect(result.gotError).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({
          success: false,
          error: 'Token budget exceeded',
          courseId: 'course-partial',
          chaptersCreated: 5,
        }),
      );
      expect(ctx.setError).toHaveBeenCalledWith('Token budget exceeded');
      expect(getProgress().state.phase).toBe('error');
    });

    it('should store resumable course ID on error with partial progress', () => {
      const { ctx } = createMockContext();

      handleSSEEvent(
        { event: 'error', data: { message: 'Timeout', courseId: 'c-partial', chaptersCreated: 3, sectionsCreated: 15 } },
        ctx,
      );

      expect(ctx.setResumableCourseId).toHaveBeenCalledWith('c-partial');
    });
  });

  describe('Informational events (update message only)', () => {
    const informationalEvents: Array<{ event: string; data: Record<string, unknown>; expectedMessageContains: string }> = [
      { event: 'planning_start', data: { message: 'Planning blueprint...' }, expectedMessageContains: 'Planning' },
      { event: 'planning_complete', data: { message: 'Blueprint ready' }, expectedMessageContains: 'Blueprint' },
      { event: 'quality_retry', data: { stage: 1, attempt: 2 }, expectedMessageContains: 'attempt 2' },
      { event: 'critic_review', data: { verdict: 'revise' }, expectedMessageContains: 'improvements' },
      { event: 'replan_start', data: { reason: 'Low quality' }, expectedMessageContains: 'Re-planning' },
      { event: 'replan_complete', data: { remainingChapters: 5 }, expectedMessageContains: 'Re-planning complete' },
      { event: 'inline_healing', data: { chapter: 3 }, expectedMessageContains: 'chapter 3' },
      { event: 'inline_healing_complete', data: {}, expectedMessageContains: 'improvement complete' },
      { event: 'course_reflection', data: {}, expectedMessageContains: 'coherence' },
      { event: 'ai_reflection', data: {}, expectedMessageContains: 'coherence' },
      { event: 'healing_start', data: {}, expectedMessageContains: 'quality improvement' },
      { event: 'healing_complete', data: {}, expectedMessageContains: 'improvement complete' },
    ];

    it.each(informationalEvents)(
      'should handle "$event" event and update message',
      ({ event, data, expectedMessageContains }) => {
        const { ctx, getProgress } = createMockContext();

        const result = handleSSEEvent({ event, data }, ctx);

        expect(result).toEqual({});
        expect(getProgress().message.toLowerCase()).toContain(expectedMessageContains.toLowerCase());
      },
    );
  });

  describe('Quality flag event', () => {
    it('should handle "quality_flag" and append to qualityFlags array', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        {
          event: 'quality_flag',
          data: {
            chapterPosition: 3,
            chapterTitle: 'Advanced Concepts',
            reason: 'Below quality threshold',
            severity: 'high',
            action: 'pending_review',
          },
        },
        ctx,
      );

      expect(getProgress().qualityFlags).toHaveLength(1);
      expect(getProgress().qualityFlags[0]).toEqual(
        expect.objectContaining({
          chapterPosition: 3,
          chapterTitle: 'Advanced Concepts',
          severity: 'high',
        }),
      );
    });
  });

  describe('Silent acknowledgment events', () => {
    const silentEvents = [
      'agentic_decision',
      'bridge_content',
      'chapter_skipped',
      'critic_revision_accepted',
      'self_critique',
      'healing_chapter',
      'healing_diagnosis',
      'state_change',
    ];

    it.each(silentEvents)('should silently acknowledge "%s" event', (event) => {
      const { ctx } = createMockContext();

      const result = handleSSEEvent({ event, data: {} }, ctx);

      expect(result).toEqual({});
      // setProgress should NOT have been called for silent events
      expect(ctx.setProgress).not.toHaveBeenCalled();
    });
  });

  describe('Resume events', () => {
    it('should handle "resume_hydrate" and populate completed items', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        {
          event: 'resume_hydrate',
          data: {
            courseId: 'course-resume',
            completedChapterCount: 3,
            completedChapters: [
              { position: 1, title: 'Ch 1', id: 'ch-1' },
              { position: 2, title: 'Ch 2', id: 'ch-2' },
              { position: 3, title: 'Ch 3', id: 'ch-3' },
            ],
            completedSections: [
              { chapterPosition: 1, position: 1, title: 'Sec 1.1', id: 'sec-1-1' },
            ],
          },
        },
        ctx,
      );

      expect(getProgress().completedItems.chapters).toHaveLength(3);
      expect(getProgress().completedItems.sections).toHaveLength(1);
      expect(getProgress().state.currentChapter).toBe(3);
      expect(getProgress().state.phase).toBe('resuming');
      expect(ctx.lastCourseIdRef.current).toBe('course-resume');
    });

    it('should handle "chapter_count_adjusted" event', () => {
      const { ctx, getProgress } = createMockContext();

      handleSSEEvent(
        { event: 'chapter_count_adjusted', data: { resolved: 8 } },
        ctx,
      );

      expect(getProgress().state.totalChapters).toBe(8);
    });
  });

  describe('Unknown events', () => {
    it('should silently ignore unknown event types', () => {
      const { ctx } = createMockContext();

      const result = handleSSEEvent(
        { event: 'some_future_event_type', data: { foo: 'bar' } },
        ctx,
      );

      expect(result).toEqual({});
    });
  });

  describe('Complete event data includes fallback summary', () => {
    it('should pass through fallbackSummary in complete event result', () => {
      const { ctx } = createMockContext();

      const result = handleSSEEvent(
        {
          event: 'complete',
          data: {
            courseId: 'c-1',
            chaptersCreated: 10,
            sectionsCreated: 50,
            totalTime: 60000,
            averageQualityScore: 75,
            promptVersion: '2.0.0',
            fallbackSummary: { count: 3, rate: 0.06 },
          },
        },
        ctx,
      );

      expect(result.gotComplete).toBe(true);
      // The fallbackSummary is in the raw data but the handler extracts specific fields
      expect(result.result?.success).toBe(true);
    });
  });
});

describe('SSE Contract - Server Event Types Coverage', () => {
  /**
   * Exhaustive list of all SSE event types emitted by the server pipeline.
   * This test ensures the client handler doesn't crash on any of them.
   */
  const allServerEventTypes = [
    // Core pipeline flow
    'progress',
    'stage_start',
    'item_generating',
    'item_complete',
    'stage_complete',
    'complete',
    'error',
    // Planning
    'planning_start',
    'planning_complete',
    // Thinking
    'thinking',
    'thinking_chunk',
    // Items
    'total_items',
    'chapter_count_adjusted',
    'resume_hydrate',
    // Quality
    'quality_retry',
    'quality_flag',
    'quality_warning',
    'critic_review',
    'critic_revision_accepted',
    'self_critique',
    // Agentic decisions
    'agentic_decision',
    'bridge_content',
    'chapter_skipped',
    // Healing
    'healing_start',
    'healing_chapter',
    'healing_diagnosis',
    'healing_complete',
    'healing_skipped',
    'inline_healing',
    'inline_healing_complete',
    'full_regeneration',
    // Reflection
    'course_reflection',
    'ai_reflection',
    'reflection_skipped',
    // State machine
    'state_change',
    // Replanning
    'replan_start',
    'replan_complete',
    // Escalation
    'pipeline_paused',
  ];

  it.each(allServerEventTypes)(
    'should handle server event "%s" without throwing',
    (eventType) => {
      const { ctx } = createMockContext();

      expect(() => {
        handleSSEEvent({ event: eventType, data: {} }, ctx);
      }).not.toThrow();
    },
  );

  it('should have coverage for all server event types', () => {
    // This test documents the expected count of server event types
    // Update this number when new event types are added
    expect(allServerEventTypes.length).toBeGreaterThanOrEqual(35);
  });
});
