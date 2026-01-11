/**
 * SAM Spaced Repetition Hook
 *
 * Provides spaced repetition review scheduling functionality using the SM-2 algorithm.
 * Manages review schedules, tracks progress, and handles review submissions.
 *
 * API: /api/sam/agentic/reviews
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type ReviewPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ReviewEntry {
  id: string;
  conceptId: string;
  conceptName?: string;
  courseTitle?: string;
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastScore: number | null;
  retentionEstimate: number;
  priority: ReviewPriority;
  isOverdue: boolean;
  daysUntilReview: number;
}

export interface ReviewStats {
  totalPending: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  averageRetention: number;
  streakDays: number;
  topicsByPriority: Record<ReviewPriority, number>;
}

export interface CalendarDay {
  date: string;
  count: number;
  priority: string;
}

export interface ReviewSubmitResult {
  id: string;
  conceptId: string;
  conceptName: string;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
  message: string;
}

export interface SpacedRepetitionData {
  reviews: ReviewEntry[];
  stats: ReviewStats;
  calendar: CalendarDay[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type ReviewStatus = 'all' | 'pending' | 'overdue' | 'today' | 'week';

interface UseSpacedRepetitionOptions {
  /** Initial status filter */
  status?: ReviewStatus;
  /** Page size */
  limit?: number;
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
}

interface UseSpacedRepetitionReturn {
  data: SpacedRepetitionData | null;
  loading: boolean;
  error: string | null;
  /** Refresh the data */
  refresh: () => Promise<void>;
  /** Submit a review for a concept */
  submitReview: (conceptId: string, score: number) => Promise<ReviewSubmitResult>;
  /** Change the status filter */
  setStatus: (status: ReviewStatus) => void;
  /** Current status filter */
  status: ReviewStatus;
  /** Load more reviews (pagination) */
  loadMore: () => Promise<void>;
  /** Whether there are more reviews to load */
  hasMore: boolean;
  /** Whether currently loading more */
  loadingMore: boolean;
  /** Get reviews for a specific date */
  getReviewsForDate: (date: Date) => ReviewEntry[];
  /** Get the next due review */
  nextDueReview: ReviewEntry | null;
  /** Mark as stale */
  isStale: boolean;
}

// ============================================================================
// FETCH HELPER
// ============================================================================

async function fetchWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error ?? `HTTP ${response.status}` };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error ?? 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSpacedRepetition(
  options: UseSpacedRepetitionOptions = {}
): UseSpacedRepetitionReturn {
  const { status: initialStatus = 'pending', limit = 20, enabled = true, refreshInterval = 0 } = options;

  const [data, setData] = useState<SpacedRepetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const isFetchingRef = useRef(false);
  const offsetRef = useRef(0);
  const lastFetchTimeRef = useRef<number>(0);

  // Fetch reviews
  const fetchReviews = useCallback(
    async (reset = true, currentOffset?: number) => {
      if (!enabled || isFetchingRef.current) return;

      isFetchingRef.current = true;

      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const offset = currentOffset ?? (reset ? 0 : offsetRef.current);

      try {
        const url = `/api/sam/agentic/reviews?status=${status}&limit=${limit}&offset=${offset}`;
        const result = await fetchWithAuth<SpacedRepetitionData>(url);

        if (!result.success) {
          setError(result.error ?? 'Failed to fetch reviews');
          return;
        }

        if (result.data) {
          // Parse dates
          const reviews = result.data.reviews.map((r) => ({
            ...r,
            nextReviewDate: new Date(r.nextReviewDate),
          }));

          if (reset) {
            setData({ ...result.data, reviews });
          } else {
            // Append to existing reviews
            setData((prev) => {
              if (!prev) return { ...result.data!, reviews };
              return {
                ...result.data!,
                reviews: [...prev.reviews, ...reviews],
              };
            });
          }

          offsetRef.current = offset + reviews.length;
          lastFetchTimeRef.current = Date.now();
          setIsStale(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
        setError(message);
        logger.error('[SPACED_REPETITION] Error fetching reviews:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [enabled, status, limit]
  );

  // Initial fetch and status change
  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews, status]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const intervalId = setInterval(() => {
      fetchReviews(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchReviews]);

  // Mark as stale after 5 minutes
  useEffect(() => {
    if (lastFetchTimeRef.current === 0) return;

    const staleTimeout = setTimeout(
      () => {
        setIsStale(true);
      },
      5 * 60 * 1000
    );

    return () => clearTimeout(staleTimeout);
  }, [data]);

  // Submit a review
  const submitReview = useCallback(
    async (conceptId: string, score: number): Promise<ReviewSubmitResult> => {
      const result = await fetchWithAuth<ReviewSubmitResult>('/api/sam/agentic/reviews', {
        method: 'POST',
        body: JSON.stringify({ conceptId, score }),
      });

      if (!result.success) {
        const errorMessage = result.error ?? 'Failed to submit review';
        logger.error('[SPACED_REPETITION] Error submitting review:', errorMessage);
        throw new Error(errorMessage);
      }

      // Refresh data after submission
      await fetchReviews(true);

      return {
        ...result.data!,
        nextReviewDate: new Date(result.data!.nextReviewDate),
      };
    },
    [fetchReviews]
  );

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || !data?.pagination.hasMore) return;
    await fetchReviews(false, offsetRef.current);
  }, [loadingMore, data?.pagination.hasMore, fetchReviews]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchReviews(true);
  }, [fetchReviews]);

  // Get reviews for a specific date
  const getReviewsForDate = useCallback(
    (date: Date): ReviewEntry[] => {
      if (!data) return [];
      const dateStr = date.toISOString().split('T')[0];
      return data.reviews.filter((r) => {
        const reviewDate = new Date(r.nextReviewDate).toISOString().split('T')[0];
        return reviewDate === dateStr;
      });
    },
    [data]
  );

  // Get next due review
  const nextDueReview = data?.reviews.find((r) => !r.isOverdue || r.daysUntilReview <= 0) ?? null;

  // Has more
  const hasMore = data?.pagination.hasMore ?? false;

  return {
    data,
    loading,
    error,
    refresh,
    submitReview,
    setStatus,
    status,
    loadMore,
    hasMore,
    loadingMore,
    getReviewsForDate,
    nextDueReview,
    isStale,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for just review stats
 */
export function useReviewStats() {
  const { data, loading, refresh } = useSpacedRepetition();

  return {
    stats: data?.stats ?? null,
    loading,
    refresh,
    overdueCount: data?.stats.overdueCount ?? 0,
    dueTodayCount: data?.stats.dueTodayCount ?? 0,
    totalPending: data?.stats.totalPending ?? 0,
    averageRetention: data?.stats.averageRetention ?? 100,
  };
}

/**
 * Hook for today&apos;s reviews only
 */
export function useTodaysReviews() {
  const { data, loading, refresh, submitReview } = useSpacedRepetition({
    status: 'today',
  });

  return {
    reviews: data?.reviews ?? [],
    count: data?.stats.dueTodayCount ?? 0,
    loading,
    refresh,
    submitReview,
  };
}

/**
 * Hook for overdue reviews
 */
export function useOverdueReviews() {
  const { data, loading, refresh, submitReview } = useSpacedRepetition({
    status: 'overdue',
  });

  return {
    reviews: data?.reviews ?? [],
    count: data?.stats.overdueCount ?? 0,
    loading,
    refresh,
    submitReview,
  };
}

/**
 * Hook for calendar data
 */
export function useReviewCalendar() {
  const { data, loading, refresh, getReviewsForDate } = useSpacedRepetition({
    status: 'week',
  });

  return {
    calendar: data?.calendar ?? [],
    loading,
    refresh,
    getReviewsForDate,
  };
}

export default useSpacedRepetition;
