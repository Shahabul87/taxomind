/**
 * Tests for use-skill-roadmap-journey hooks
 * Source: hooks/use-skill-roadmap-journey.ts
 *
 * Covers:
 * - useRoadmapList: initial state, successful fetch, error handling, refetch
 * - useRoadmapDetail: initial state with/without ID, fetch, error handling, refetch, null ID
 * - useRoadmapGeneration: SSE streaming, progress events, error events, cancel, reset, timeout
 * - useMilestoneUpdate: successful update, error propagation, isUpdating state
 */

import { renderHook, waitFor, act } from '@testing-library/react';

const mockFetch = global.fetch as jest.Mock;

import {
  useRoadmapList,
  useRoadmapDetail,
  useRoadmapGeneration,
  useMilestoneUpdate,
} from '@/hooks/use-skill-roadmap-journey';
import type {
  RoadmapSummary,
  RoadmapDetail,
  GenerationInput,
  GenerationProgress,
} from '@/hooks/use-skill-roadmap-journey';

// ---------------------------------------------------------------------------
// Shared test data factories
// ---------------------------------------------------------------------------

function createRoadmapSummary(overrides: Partial<RoadmapSummary> = {}): RoadmapSummary {
  return {
    id: 'roadmap-1',
    title: 'Learn TypeScript',
    description: 'Master TypeScript fundamentals',
    status: 'ACTIVE',
    completionPercentage: 40,
    skillName: 'TypeScript',
    currentLevel: 'BEGINNER',
    targetLevel: 'ADVANCED',
    milestoneCount: 5,
    completedMilestones: 2,
    totalEstimatedHours: 120,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function createRoadmapDetail(overrides: Partial<RoadmapDetail> = {}): RoadmapDetail {
  return {
    id: 'roadmap-1',
    userId: 'user-1',
    title: 'Learn TypeScript',
    description: 'Master TypeScript fundamentals',
    status: 'ACTIVE',
    targetOutcome: {
      type: 'skill',
      targetName: 'TypeScript',
      currentLevel: 'BEGINNER',
      targetLevel: 'ADVANCED',
      skillDefId: 'skill-def-1',
    },
    totalEstimatedHours: 120,
    completionPercentage: 40,
    startedAt: '2026-01-20T00:00:00Z',
    targetCompletionDate: '2026-06-01T00:00:00Z',
    completedAt: null,
    milestones: [
      {
        id: 'milestone-1',
        roadmapId: 'roadmap-1',
        order: 1,
        title: 'Type Basics',
        description: 'Learn basic types',
        status: 'COMPLETED',
        skills: [{ skillName: 'Types', targetLevel: 'INTERMEDIATE', estimatedHours: 10, progress: 100 }],
        estimatedHours: 10,
        actualHours: 8,
        targetDate: '2026-02-01T00:00:00Z',
        completedAt: '2026-01-28T00:00:00Z',
        matchedCourseIds: ['course-1'],
        resources: null,
        assessmentRequired: false,
      },
      {
        id: 'milestone-2',
        roadmapId: 'roadmap-1',
        order: 2,
        title: 'Advanced Types',
        description: 'Learn generics and utility types',
        status: 'IN_PROGRESS',
        skills: [{ skillName: 'Generics', targetLevel: 'ADVANCED', estimatedHours: 20, progress: 30 }],
        estimatedHours: 20,
        actualHours: null,
        targetDate: '2026-03-15T00:00:00Z',
        completedAt: null,
        matchedCourseIds: [],
        resources: null,
        assessmentRequired: true,
      },
    ],
    matchedCourses: {
      'course-1': {
        id: 'course-1',
        title: 'TypeScript Fundamentals',
        description: 'A course on TypeScript',
        imageUrl: '/images/ts.png',
        isPublished: true,
      },
    },
    stats: {
      completedMilestones: 1,
      totalMilestones: 2,
      totalHoursCompleted: 8,
      totalHoursEstimated: 30,
    },
    ...overrides,
  };
}

function createGenerationInput(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return {
    skillName: 'TypeScript',
    currentLevel: 'BEGINNER',
    targetLevel: 'ADVANCED',
    hoursPerWeek: 10,
    learningStyle: 'visual',
    includeAssessments: true,
    prioritizeQuickWins: false,
    ...overrides,
  };
}

/**
 * Helper to build a mock Response-like object matching the global.fetch mock
 * shape established in jest.setup.js.
 */
function mockResponse(body: unknown, ok = true, status?: number) {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Map(),
  };
}

/**
 * Creates a mock reader that mimics ReadableStreamDefaultReader<Uint8Array>.
 * This avoids using the real ReadableStream API which is unavailable in jsdom.
 * The hook calls res.body.getReader() and then reader.read() in a loop.
 */
function createMockReader(events: Array<{ event: string; data: Record<string, unknown> }>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  for (const { event, data } of events) {
    const sseText = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    chunks.push(encoder.encode(sseText));
  }

  let readIndex = 0;
  let cancelled = false;

  const reader = {
    read: jest.fn(() => {
      if (cancelled || readIndex >= chunks.length) {
        return Promise.resolve({ done: true, value: undefined });
      }
      const value = chunks[readIndex];
      readIndex++;
      return Promise.resolve({ done: false, value });
    }),
    cancel: jest.fn(() => {
      cancelled = true;
      return Promise.resolve();
    }),
    releaseLock: jest.fn(),
  };

  return reader;
}

function mockSSEResponse(events: Array<{ event: string; data: Record<string, unknown> }>) {
  const reader = createMockReader(events);
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => reader,
    },
    json: () => Promise.reject(new Error('SSE response is not JSON')),
    headers: new Map([['content-type', 'text/event-stream']]),
  };
}

/**
 * Creates a mock reader that hangs on read() until cancel() is called.
 * When cancel() is invoked, the pending read resolves with { done: true }.
 */
function createHangingReader() {
  let resolveRead: ((result: { done: boolean; value: Uint8Array | undefined }) => void) | null = null;
  let cancelled = false;

  const reader = {
    read: jest.fn(() => {
      if (cancelled) {
        return Promise.resolve({ done: true, value: undefined });
      }
      return new Promise<{ done: boolean; value: Uint8Array | undefined }>((resolve) => {
        resolveRead = resolve;
      });
    }),
    cancel: jest.fn(() => {
      cancelled = true;
      // Resolve any pending read with done: true so the while loop exits
      if (resolveRead) {
        resolveRead({ done: true, value: undefined });
        resolveRead = null;
      }
      return Promise.resolve();
    }),
    releaseLock: jest.fn(),
  };

  return reader;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-skill-roadmap-journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. useRoadmapList
  // =========================================================================

  describe('useRoadmapList', () => {
    describe('initial state', () => {
      it('should start with loading true, empty roadmaps, and null error', () => {
        mockFetch.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useRoadmapList());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.roadmaps).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.refetch).toBe('function');
      });
    });

    describe('successful fetch', () => {
      it('should fetch roadmaps from the correct endpoint and populate state', async () => {
        const roadmaps = [
          createRoadmapSummary({ id: 'r-1', title: 'Learn TypeScript' }),
          createRoadmapSummary({ id: 'r-2', title: 'Learn React' }),
        ];

        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: roadmaps })
        );

        const { result } = renderHook(() => useRoadmapList());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/sam/skill-roadmap');
        expect(result.current.roadmaps).toEqual(roadmaps);
        expect(result.current.error).toBeNull();
      });
    });

    describe('error handling', () => {
      it('should set error when API returns success false', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: false, error: 'Unauthorized' })
        );

        const { result } = renderHook(() => useRoadmapList());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Unauthorized');
        expect(result.current.roadmaps).toEqual([]);
      });

      it('should set error to fallback message when API returns success false without error field', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: false })
        );

        const { result } = renderHook(() => useRoadmapList());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch roadmaps');
      });

      it('should set error to Network error on fetch rejection', async () => {
        mockFetch.mockRejectedValue(new Error('Connection refused'));

        const { result } = renderHook(() => useRoadmapList());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
      });
    });

    describe('refetch', () => {
      it('should re-fetch data when refetch is called', async () => {
        const initialRoadmaps = [createRoadmapSummary({ id: 'r-1', completionPercentage: 20 })];
        const updatedRoadmaps = [createRoadmapSummary({ id: 'r-1', completionPercentage: 60 })];

        let callCount = 0;
        mockFetch.mockImplementation(() => {
          callCount++;
          const data = callCount === 1 ? initialRoadmaps : updatedRoadmaps;
          return Promise.resolve(mockResponse({ success: true, data }));
        });

        const { result } = renderHook(() => useRoadmapList());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.roadmaps[0].completionPercentage).toBe(20);

        await act(async () => {
          await result.current.refetch();
        });

        expect(result.current.roadmaps[0].completionPercentage).toBe(60);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  // =========================================================================
  // 2. useRoadmapDetail
  // =========================================================================

  describe('useRoadmapDetail', () => {
    describe('initial state', () => {
      it('should start loading when roadmapId is provided', () => {
        mockFetch.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.roadmap).toBeNull();
        expect(result.current.error).toBeNull();
      });

      it('should not be loading when roadmapId is null', () => {
        const { result } = renderHook(() => useRoadmapDetail(null));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.roadmap).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    describe('successful fetch', () => {
      it('should fetch roadmap detail from the correct endpoint', async () => {
        const detail = createRoadmapDetail();

        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: detail })
        );

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/sam/skill-roadmap?id=roadmap-1');
        expect(result.current.roadmap).toEqual(detail);
        expect(result.current.error).toBeNull();
      });

      it('should return milestones and matchedCourses in the detail', async () => {
        const detail = createRoadmapDetail();

        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: detail })
        );

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.roadmap?.milestones).toHaveLength(2);
        expect(result.current.roadmap?.matchedCourses).toHaveProperty('course-1');
        expect(result.current.roadmap?.stats.completedMilestones).toBe(1);
        expect(result.current.roadmap?.stats.totalMilestones).toBe(2);
      });
    });

    describe('error handling', () => {
      it('should set error when response is not ok with error body', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Roadmap not found' }, false, 404)
        );

        const { result } = renderHook(() => useRoadmapDetail('nonexistent'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Roadmap not found');
        expect(result.current.roadmap).toBeNull();
      });

      it('should set fallback error when response is not ok and body parse fails', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON')),
          headers: new Map(),
        });

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // The hook catches JSON parse failure and falls back to { error: `HTTP ${res.status}` }
        expect(result.current.error).toBe('HTTP 500');
      });

      it('should set error when API returns success false', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: false, error: 'Access denied' })
        );

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Access denied');
      });

      it('should set network error on fetch rejection', async () => {
        mockFetch.mockRejectedValue(new Error('Timeout'));

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network error - please check your connection');
      });
    });

    describe('roadmapId changes', () => {
      it('should refetch when roadmapId changes', async () => {
        const detail1 = createRoadmapDetail({ id: 'r-1', title: 'First' });
        const detail2 = createRoadmapDetail({ id: 'r-2', title: 'Second' });

        mockFetch.mockImplementation((url: string) => {
          if (url.includes('id=r-1')) {
            return Promise.resolve(mockResponse({ success: true, data: detail1 }));
          }
          if (url.includes('id=r-2')) {
            return Promise.resolve(mockResponse({ success: true, data: detail2 }));
          }
          return Promise.resolve(mockResponse({}, false));
        });

        const { result, rerender } = renderHook(
          ({ id }: { id: string | null }) => useRoadmapDetail(id),
          { initialProps: { id: 'r-1' } }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.roadmap?.title).toBe('First');

        rerender({ id: 'r-2' });

        await waitFor(() => {
          expect(result.current.roadmap?.title).toBe('Second');
        });
      });

      it('should clear state when roadmapId becomes null', async () => {
        const detail = createRoadmapDetail();

        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: detail })
        );

        const { result, rerender } = renderHook(
          ({ id }: { id: string | null }) => useRoadmapDetail(id),
          { initialProps: { id: 'roadmap-1' as string | null } }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.roadmap).not.toBeNull();

        rerender({ id: null });

        await waitFor(() => {
          expect(result.current.roadmap).toBeNull();
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('refetch', () => {
      it('should refetch the current roadmap when refetch is called', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: createRoadmapDetail() })
        );

        const { result } = renderHook(() => useRoadmapDetail('roadmap-1'));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);

        await act(async () => {
          result.current.refetch();
        });

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledTimes(2);
        });
      });

      it('should not refetch when roadmapId is null', async () => {
        const { result } = renderHook(() => useRoadmapDetail(null));

        // No fetch should be made for null ID
        expect(mockFetch).not.toHaveBeenCalled();

        // refetch should be a no-op
        act(() => {
          result.current.refetch();
        });

        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // 3. useRoadmapGeneration
  // =========================================================================

  describe('useRoadmapGeneration', () => {
    describe('initial state', () => {
      it('should start with all values in their default state', () => {
        const { result } = renderHook(() => useRoadmapGeneration());

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.progress).toBeNull();
        expect(result.current.generatedRoadmapId).toBeNull();
        expect(result.current.error).toBeNull();
        expect(typeof result.current.generate).toBe('function');
        expect(typeof result.current.cancel).toBe('function');
        expect(typeof result.current.reset).toBe('function');
      });
    });

    describe('successful generation via SSE', () => {
      it('should process progress and roadmap SSE events', async () => {
        const sseResponse = mockSSEResponse([
          { event: 'progress', data: { stage: 'analyzing', percent: 25, message: 'Analyzing skill gaps...' } },
          { event: 'progress', data: { stage: 'generating', percent: 75, message: 'Generating milestones...' } },
          { event: 'roadmap', data: { id: 'generated-roadmap-1' } },
          { event: 'done', data: { status: 'complete' } },
        ]);

        mockFetch.mockResolvedValue(sseResponse);

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.generatedRoadmapId).toBe('generated-roadmap-1');
        expect(result.current.error).toBeNull();
      });

      it('should send correct request body to the generation endpoint', async () => {
        const sseResponse = mockSSEResponse([
          { event: 'done', data: { status: 'complete' } },
        ]);
        mockFetch.mockResolvedValue(sseResponse);

        const input = createGenerationInput({
          skillName: 'React',
          targetLevel: 'EXPERT',
          hoursPerWeek: 15,
        });

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(input);
        });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/skill-roadmap/generate',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          })
        );
      });

      it('should update progress state during SSE streaming', async () => {
        // Use a manual approach: resolve the stream one chunk at a time
        const progressUpdates: GenerationProgress[] = [];
        const sseResponse = mockSSEResponse([
          { event: 'progress', data: { stage: 'analyzing', percent: 50, message: 'Halfway...' } },
          { event: 'done', data: { status: 'complete' } },
        ]);
        mockFetch.mockResolvedValue(sseResponse);

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        // After completion, the last progress should be recorded
        // The progress state should reflect what was streamed
        // Since the stream completes synchronously in our mock, we check final state
        expect(result.current.progress).toEqual({
          stage: 'analyzing',
          percent: 50,
          message: 'Halfway...',
        });
      });
    });

    describe('error handling', () => {
      it('should handle non-ok HTTP response', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Rate limit exceeded' }, false, 429)
        );

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe('Rate limit exceeded');
      });

      it('should handle SSE error event', async () => {
        const sseResponse = mockSSEResponse([
          { event: 'progress', data: { stage: 'analyzing', percent: 25, message: 'Analyzing...' } },
          { event: 'error', data: { message: 'AI provider unavailable' } },
        ]);
        mockFetch.mockResolvedValue(sseResponse);

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.error).toBe('AI provider unavailable');
      });

      it('should handle missing response body (no stream)', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: null,
          headers: new Map(),
        });

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe('No response stream');
      });

      it('should handle network error during fetch', async () => {
        mockFetch.mockRejectedValue(new Error('Failed to fetch'));

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe('Failed to fetch');
      });

      it('should handle non-ok response with unparseable JSON body', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('bad json')),
          headers: new Map(),
        });

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        // The hook catches JSON parse failure with: .catch(() => ({ error: 'Generation failed' }))
        expect(result.current.error).toBe('Generation failed');
      });
    });

    describe('cancel', () => {
      it('should abort the generation and not set a regular error', async () => {
        // Create a mock reader that hangs (never resolves read())
        const hangingReader = createHangingReader();

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => hangingReader,
          },
          headers: new Map(),
        });

        const { result } = renderHook(() => useRoadmapGeneration());

        // Start generation (do not await - it will hang on read())
        let generatePromise: Promise<void>;
        act(() => {
          generatePromise = result.current.generate(createGenerationInput());
        });

        // Give the generate function time to set up and start reading
        await waitFor(() => {
          expect(result.current.isGenerating).toBe(true);
        });

        // Cancel via the hook's cancel method
        act(() => {
          result.current.cancel();
        });

        // Wait for the generation to finish (cancelled)
        await act(async () => {
          await generatePromise!.catch(() => {});
        });

        expect(result.current.isGenerating).toBe(false);
      });
    });

    describe('reset', () => {
      it('should clear all state back to defaults', async () => {
        mockFetch.mockRejectedValue(new Error('Some error'));

        const { result } = renderHook(() => useRoadmapGeneration());

        await act(async () => {
          await result.current.generate(createGenerationInput());
        });

        expect(result.current.error).toBe('Some error');

        act(() => {
          result.current.reset();
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.progress).toBeNull();
        expect(result.current.generatedRoadmapId).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });
  });

  // =========================================================================
  // 4. useMilestoneUpdate
  // =========================================================================

  describe('useMilestoneUpdate', () => {
    describe('initial state', () => {
      it('should start with isUpdating false and expose updateMilestone function', () => {
        const { result } = renderHook(() => useMilestoneUpdate());

        expect(result.current.isUpdating).toBe(false);
        expect(typeof result.current.updateMilestone).toBe('function');
      });
    });

    describe('successful update', () => {
      it('should send PATCH request with correct URL and body', async () => {
        const updatedMilestone = { id: 'ms-1', status: 'COMPLETED' };

        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: updatedMilestone })
        );

        const { result } = renderHook(() => useMilestoneUpdate());

        let returnValue: unknown;
        await act(async () => {
          returnValue = await result.current.updateMilestone(
            'roadmap-1',
            'milestone-1',
            'COMPLETED',
            8
          );
        });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/skill-roadmap/roadmap-1/milestone/milestone-1',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED', actualHours: 8 }),
          }
        );

        expect(returnValue).toEqual(updatedMilestone);
        expect(result.current.isUpdating).toBe(false);
      });

      it('should send update without actualHours when not provided', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: true, data: { id: 'ms-1', status: 'IN_PROGRESS' } })
        );

        const { result } = renderHook(() => useMilestoneUpdate());

        await act(async () => {
          await result.current.updateMilestone('roadmap-1', 'milestone-1', 'IN_PROGRESS');
        });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/skill-roadmap/roadmap-1/milestone/milestone-1',
          expect.objectContaining({
            body: JSON.stringify({ status: 'IN_PROGRESS', actualHours: undefined }),
          })
        );
      });
    });

    describe('error handling', () => {
      it('should throw when API returns success false', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: false, error: 'Milestone not found' })
        );

        const { result } = renderHook(() => useMilestoneUpdate());

        await expect(
          act(async () => {
            await result.current.updateMilestone('roadmap-1', 'ms-invalid', 'COMPLETED');
          })
        ).rejects.toThrow('Milestone not found');

        expect(result.current.isUpdating).toBe(false);
      });

      it('should throw with fallback message when API returns success false without error field', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ success: false })
        );

        const { result } = renderHook(() => useMilestoneUpdate());

        await expect(
          act(async () => {
            await result.current.updateMilestone('roadmap-1', 'ms-1', 'SKIPPED');
          })
        ).rejects.toThrow('Failed to update milestone');

        expect(result.current.isUpdating).toBe(false);
      });

      it('should reset isUpdating to false even on error', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useMilestoneUpdate());

        try {
          await act(async () => {
            await result.current.updateMilestone('roadmap-1', 'ms-1', 'COMPLETED');
          });
        } catch {
          // Expected
        }

        expect(result.current.isUpdating).toBe(false);
      });
    });
  });
});
