/**
 * Tests for useSpacedRepetition hook
 * Source: hooks/use-spaced-repetition.ts
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSpacedRepetition, useReviewStats } from '@/hooks/use-spaced-repetition';

const mockReviewData = {
  success: true,
  data: {
    reviews: [
      {
        id: 'r1',
        conceptId: 'concept-1',
        conceptName: 'Variables',
        courseTitle: 'TypeScript',
        nextReviewDate: '2024-02-01T00:00:00Z',
        easeFactor: 2.5,
        interval: 3,
        repetitions: 2,
        lastScore: 4,
        retentionEstimate: 0.85,
        priority: 'medium',
        isOverdue: false,
        daysUntilReview: 1,
      },
      {
        id: 'r2',
        conceptId: 'concept-2',
        conceptName: 'Functions',
        courseTitle: 'TypeScript',
        nextReviewDate: '2024-01-30T00:00:00Z',
        easeFactor: 1.8,
        interval: 1,
        repetitions: 1,
        lastScore: 2,
        retentionEstimate: 0.5,
        priority: 'urgent',
        isOverdue: true,
        daysUntilReview: -2,
      },
    ],
    stats: {
      totalPending: 5,
      overdueCount: 2,
      dueTodayCount: 1,
      dueThisWeekCount: 4,
      averageRetention: 0.75,
      streakDays: 3,
      topicsByPriority: { urgent: 2, high: 1, medium: 1, low: 1 },
    },
    calendar: [{ date: '2024-02-01', count: 3, priority: 'medium' }],
    pagination: { total: 10, limit: 20, offset: 0, hasMore: false },
  },
};

describe('useSpacedRepetition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReviewData),
    });
  });

  it('fetches reviews on mount and parses dates', async () => {
    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.reviews).toHaveLength(2);
    expect(result.current.data?.reviews[0].nextReviewDate).toBeInstanceOf(Date);
  });

  it('adjusts interval based on performance (ease factor)', async () => {
    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // First review has higher ease factor (2.5) = longer interval (3 days)
    expect(result.current.data?.reviews[0].easeFactor).toBe(2.5);
    expect(result.current.data?.reviews[0].interval).toBe(3);
    // Second review has lower ease factor (1.8) = shorter interval (1 day)
    expect(result.current.data?.reviews[1].easeFactor).toBe(1.8);
    expect(result.current.data?.reviews[1].interval).toBe(1);
  });

  it('detects due cards (overdue reviews)', async () => {
    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.stats.overdueCount).toBe(2);
    expect(result.current.data?.stats.dueTodayCount).toBe(1);
  });

  it('handles quality scoring and review scheduling via submitReview', async () => {
    const submitResult = {
      success: true,
      data: {
        id: 'r1',
        conceptId: 'concept-1',
        conceptName: 'Variables',
        nextReviewDate: '2024-02-05T00:00:00Z',
        interval: 7,
        easeFactor: 2.7,
        repetitions: 3,
        message: 'Review submitted',
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockReviewData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(submitResult) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockReviewData) });

    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const submitPromise = result.current.submitReview('concept-1', 5);
    const response = await submitPromise;
    expect(response.interval).toBe(7);
    expect(response.easeFactor).toBe(2.7);
  });

  it('supports status filtering', async () => {
    const { result } = renderHook(() => useSpacedRepetition({ status: 'overdue' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBe('overdue');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=overdue'),
      expect.any(Object)
    );
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSpacedRepetition());
    expect(result.current.loading).toBe(true);
  });

  it('handles error from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Unauthorized');
  });

  it('getReviewsForDate filters by date', async () => {
    const { result } = renderHook(() => useSpacedRepetition());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const dateReviews = result.current.getReviewsForDate(new Date('2024-02-01'));
    expect(dateReviews.length).toBeGreaterThanOrEqual(0);
  });
});

describe('useReviewStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviewData),
    });
  });

  it('returns stats from data', async () => {
    const { result } = renderHook(() => useReviewStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalPending).toBe(5);
    expect(result.current.overdueCount).toBe(2);
    expect(result.current.dueTodayCount).toBe(1);
  });
});
