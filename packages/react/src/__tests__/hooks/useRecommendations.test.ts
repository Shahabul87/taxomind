/**
 * Tests for useRecommendations hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock React hooks
// ---------------------------------------------------------------------------

const mockSetState = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((init) => [init, mockSetState]),
    useCallback: vi.fn((fn) => fn),
    useEffect: vi.fn((fn) => { fn(); }),
    useRef: vi.fn((val) => ({ current: val })),
  };
});

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  useRecommendations,
  type LearningRecommendation,
  type UseRecommendationsReturn,
} from '../../hooks/useRecommendations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRecommendation(
  overrides: Partial<LearningRecommendation> = {},
): LearningRecommendation {
  return {
    id: 'rec-1',
    type: 'content',
    title: 'Learn TypeScript Generics',
    description: 'Deep dive into generic types',
    reason: 'Based on your recent study patterns',
    priority: 'high',
    estimatedMinutes: 30,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should return initial empty state', () => {
    const result = useRecommendations({ autoFetch: false });

    expect(result.recommendations).toEqual([]);
    expect(result.totalEstimatedTime).toBe(0);
    expect(result.generatedAt).toBeNull();
    expect(result.context).toBeNull();
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('should expose fetchRecommendations that builds correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            recommendations: [makeRecommendation()],
            totalEstimatedTime: 30,
            generatedAt: '2025-01-01T00:00:00Z',
            context: { availableTime: 120, currentGoals: [], recentTopics: [] },
          },
        }),
    });

    const result = useRecommendations({ autoFetch: false });

    await result.fetchRecommendations({ time: 120, limit: 10, types: ['content', 'practice'] });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sam/agentic/recommendations');
    expect(calledUrl).toContain('time=120');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('types=content%2Cpractice');
  });

  it('should filter recommendations by type via URL params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            recommendations: [makeRecommendation({ type: 'review' })],
            totalEstimatedTime: 15,
            generatedAt: '2025-01-01T00:00:00Z',
            context: null,
          },
        }),
    });

    const result = useRecommendations({ autoFetch: false });
    await result.fetchRecommendations({ types: ['review'] });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('types=review');
  });

  it('should reflect initial loading state as false', () => {
    const result = useRecommendations({ autoFetch: false });
    expect(result.isLoading).toBe(false);
  });

  it('should handle fetch errors by not throwing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const result = useRecommendations({ autoFetch: false });

    // Should not throw -- errors are caught internally
    await expect(result.fetchRecommendations()).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should expose refresh function that calls fetchRecommendations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            recommendations: [makeRecommendation()],
            totalEstimatedTime: 30,
            generatedAt: '2025-01-01T00:00:00Z',
            context: null,
          },
        }),
    });

    const result = useRecommendations({ autoFetch: false });

    await result.refresh();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/sam/agentic/recommendations');
  });
});
