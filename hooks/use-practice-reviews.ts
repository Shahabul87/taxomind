/**
 * Practice Reviews Hook
 *
 * Combines practice session tracking with spaced repetition reviews.
 * Links skill practice to concept reviews for optimal learning.
 *
 * This hook integrates the 10,000 hour practice system with the SM-2
 * spaced repetition algorithm for a comprehensive learning experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PracticeReviewEntry {
  id: string;
  conceptId: string;
  conceptName: string;
  skillId?: string;
  skillName?: string;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
  retentionEstimate: number;
  isOverdue: boolean;
  daysUntilReview: number;
  practiceHours: number;
  lastPracticeDate?: Date;
}

export interface PracticeReviewStats {
  // Review stats
  totalPendingReviews: number;
  overdueReviews: number;
  dueTodayReviews: number;
  averageRetention: number;

  // Practice stats
  totalPracticeHours: number;
  sessionsThisWeek: number;
  currentStreak: number;

  // Combined stats
  conceptsMastered: number;
  skillsTracked: number;
  nextOptimalReviewTime: Date | null;
}

export interface PracticeReviewData {
  reviews: PracticeReviewEntry[];
  stats: PracticeReviewStats;
  recommendedPractice: {
    skillId: string;
    skillName: string;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  }[];
}

interface UsePracticeReviewsOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

interface UsePracticeReviewsReturn {
  data: PracticeReviewData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitReview: (conceptId: string, score: number) => Promise<void>;
  recordPracticeSession: (skillId: string, minutes: number) => Promise<void>;
  getReviewsForSkill: (skillId: string) => PracticeReviewEntry[];
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

export function usePracticeReviews(
  options: UsePracticeReviewsOptions = {}
): UsePracticeReviewsReturn {
  const { enabled = true, refreshInterval = 0 } = options;

  const [data, setData] = useState<PracticeReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  // Fetch combined data
  const fetchData = useCallback(async () => {
    if (!enabled || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch both reviews and practice stats in parallel
      const [reviewsResult, practiceResult, masteryResult] = await Promise.all([
        fetchWithAuth<{
          reviews: PracticeReviewEntry[];
          stats: { totalPending: number; overdueCount: number; dueTodayCount: number; averageRetention: number };
        }>('/api/sam/agentic/reviews?status=pending&limit=50'),
        fetchWithAuth<{
          totalSessions: number;
          totalQualityHours: number;
          sessionsThisWeek: number;
        }>('/api/sam/practice/sessions?stats=true'),
        fetchWithAuth<{
          totalSkillsTracking: number;
          currentStreak: number;
          totalQualityHours: number;
        }>('/api/sam/practice/mastery/overview'),
      ]);

      // Combine and process data
      const reviews: PracticeReviewEntry[] = reviewsResult.data?.reviews.map((r) => ({
        ...r,
        nextReviewDate: new Date(r.nextReviewDate),
        practiceHours: 0, // Will be filled from mastery data
      })) ?? [];

      // Build stats
      const stats: PracticeReviewStats = {
        totalPendingReviews: reviewsResult.data?.stats.totalPending ?? 0,
        overdueReviews: reviewsResult.data?.stats.overdueCount ?? 0,
        dueTodayReviews: reviewsResult.data?.stats.dueTodayCount ?? 0,
        averageRetention: reviewsResult.data?.stats.averageRetention ?? 100,
        totalPracticeHours: masteryResult.data?.totalQualityHours ?? practiceResult.data?.totalQualityHours ?? 0,
        sessionsThisWeek: practiceResult.data?.sessionsThisWeek ?? 0,
        currentStreak: masteryResult.data?.currentStreak ?? 0,
        conceptsMastered: reviews.filter((r) => r.retentionEstimate >= 90).length,
        skillsTracked: masteryResult.data?.totalSkillsTracking ?? 0,
        nextOptimalReviewTime: reviews.length > 0
          ? new Date(Math.min(...reviews.map((r) => r.nextReviewDate.getTime())))
          : null,
      };

      // Generate practice recommendations based on reviews and practice patterns
      const recommendedPractice = generateRecommendations(reviews, stats);

      setData({
        reviews,
        stats,
        recommendedPractice,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      logger.error('[PRACTICE_REVIEWS] Error fetching data:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchData]);

  // Submit a review
  const submitReview = useCallback(
    async (conceptId: string, score: number): Promise<void> => {
      const result = await fetchWithAuth('/api/sam/agentic/reviews', {
        method: 'POST',
        body: JSON.stringify({ conceptId, score }),
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to submit review');
      }

      // Refresh data after submission
      await fetchData();
    },
    [fetchData]
  );

  // Record a practice session (quick helper)
  const recordPracticeSession = useCallback(
    async (skillId: string, minutes: number): Promise<void> => {
      // Start a session
      const startResult = await fetchWithAuth<{ id: string }>('/api/sam/practice/sessions', {
        method: 'POST',
        body: JSON.stringify({
          skillId,
          sessionType: 'CASUAL',
        }),
      });

      if (!startResult.success || !startResult.data?.id) {
        throw new Error(startResult.error ?? 'Failed to start session');
      }

      // Wait simulated time and end session
      // In real use, the session would be ended separately
      const endResult = await fetchWithAuth(`/api/sam/practice/sessions/${startResult.data.id}/end`, {
        method: 'POST',
        body: JSON.stringify({
          focusLevel: 'MEDIUM',
        }),
      });

      if (!endResult.success) {
        throw new Error(endResult.error ?? 'Failed to end session');
      }

      // Refresh data
      await fetchData();
    },
    [fetchData]
  );

  // Get reviews for a specific skill
  const getReviewsForSkill = useCallback(
    (skillId: string): PracticeReviewEntry[] => {
      if (!data) return [];
      return data.reviews.filter((r) => r.skillId === skillId);
    },
    [data]
  );

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    submitReview,
    recordPracticeSession,
    getReviewsForSkill,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRecommendations(
  reviews: PracticeReviewEntry[],
  stats: PracticeReviewStats
): { skillId: string; skillName: string; reason: string; urgency: 'low' | 'medium' | 'high' }[] {
  const recommendations: { skillId: string; skillName: string; reason: string; urgency: 'low' | 'medium' | 'high' }[] = [];

  // Group reviews by skill
  const skillMap = new Map<string, PracticeReviewEntry[]>();
  for (const review of reviews) {
    if (review.skillId) {
      const existing = skillMap.get(review.skillId) ?? [];
      existing.push(review);
      skillMap.set(review.skillId, existing);
    }
  }

  // Generate recommendations based on patterns
  for (const [skillId, skillReviews] of skillMap.entries()) {
    const overdueCount = skillReviews.filter((r) => r.isOverdue).length;
    const lowRetentionCount = skillReviews.filter((r) => r.retentionEstimate < 70).length;
    const skillName = skillReviews[0]?.skillName ?? 'Unknown Skill';

    if (overdueCount > 3) {
      recommendations.push({
        skillId,
        skillName,
        reason: `${overdueCount} overdue reviews need attention`,
        urgency: 'high',
      });
    } else if (lowRetentionCount > 2) {
      recommendations.push({
        skillId,
        skillName,
        reason: `${lowRetentionCount} concepts have low retention`,
        urgency: 'medium',
      });
    } else if (skillReviews.length > 0) {
      recommendations.push({
        skillId,
        skillName,
        reason: 'Regular practice recommended',
        urgency: 'low',
      });
    }
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return recommendations.slice(0, 5);
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for getting practice recommendations
 */
export function usePracticeRecommendations() {
  const { data, loading, refresh } = usePracticeReviews();

  return {
    recommendations: data?.recommendedPractice ?? [],
    loading,
    refresh,
    hasHighPriority: data?.recommendedPractice.some((r) => r.urgency === 'high') ?? false,
  };
}

/**
 * Hook for combined stats dashboard
 */
export function usePracticeDashboardStats() {
  const { data, loading, refresh } = usePracticeReviews();

  return {
    stats: data?.stats ?? null,
    loading,
    refresh,
    needsAttention:
      (data?.stats.overdueReviews ?? 0) > 0 || (data?.stats.averageRetention ?? 100) < 80,
  };
}

export default usePracticeReviews;
