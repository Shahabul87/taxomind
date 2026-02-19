'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUnifiedDashboardContext, type AnalyticsSubTab } from '@/lib/contexts/unified-dashboard-context';

export type TimeRange = '7d' | '30d' | '90d' | '1y';

/**
 * Hook for accessing unified analytics data
 *
 * This hook provides:
 * - Study time metrics
 * - Course progress tracking
 * - Activity heatmap data
 * - Performance metrics
 * - Time range filtering
 *
 * @example
 * ```tsx
 * const { analytics, timeRange, setTimeRange, isLoading } = useUnifiedAnalytics();
 *
 * return (
 *   <div>
 *     <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
 *       <option value="7d">Last 7 days</option>
 *       <option value="30d">Last 30 days</option>
 *     </select>
 *     <p>Total study hours: {analytics?.studyTime.totalHours}</p>
 *   </div>
 * );
 * ```
 */
export function useUnifiedAnalytics(initialTimeRange: TimeRange = '30d') {
  const context = useUnifiedDashboardContext();
  const { state, fetchAnalytics, setAnalyticsSubTab } = context;

  const timeRangeRef = useRef(initialTimeRange);
  const initialFetchRef = useRef(false);

  // Fetch analytics on mount
  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchAnalytics(initialTimeRange);
    }
  }, [fetchAnalytics, initialTimeRange]);

  // Change time range
  const setTimeRange = useCallback(
    (range: TimeRange) => {
      timeRangeRef.current = range;
      fetchAnalytics(range);
    },
    [fetchAnalytics]
  );

  // Refresh analytics
  const refresh = useCallback(() => {
    fetchAnalytics(timeRangeRef.current);
  }, [fetchAnalytics]);

  return {
    // Analytics data
    analytics: state.analytics,
    timeRange: state.analytics?.timeRange ?? initialTimeRange,

    // Sub-tab navigation
    activeSubTab: state.activeAnalyticsSubTab,
    setActiveSubTab: setAnalyticsSubTab,

    // Loading and errors
    isLoading: state.loadingStates.analytics,
    error: state.errors.analytics,

    // Actions
    setTimeRange,
    refresh,
  };
}

/**
 * Hook for study time metrics
 */
export function useStudyTimeMetrics(timeRange: TimeRange = '30d') {
  const { analytics, isLoading, setTimeRange, refresh } = useUnifiedAnalytics(timeRange);

  const studyTime = useMemo(() => {
    if (!analytics?.studyTime) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        avgMinutesPerDay: 0,
        dailyBreakdown: [],
      };
    }
    return analytics.studyTime;
  }, [analytics]);

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    const { dailyBreakdown } = studyTime;
    if (dailyBreakdown.length === 0) {
      return {
        maxDayMinutes: 0,
        minDayMinutes: 0,
        activeDays: 0,
        totalDays: 0,
        consistencyScore: 0,
      };
    }

    const minutes = dailyBreakdown.map((d) => d.minutes);
    const activeDays = minutes.filter((m) => m > 0).length;

    return {
      maxDayMinutes: Math.max(...minutes),
      minDayMinutes: Math.min(...minutes.filter((m) => m > 0)),
      activeDays,
      totalDays: dailyBreakdown.length,
      consistencyScore: Math.round((activeDays / dailyBreakdown.length) * 100),
    };
  }, [studyTime]);

  return {
    ...studyTime,
    ...additionalMetrics,
    isLoading,
    setTimeRange,
    refresh,
  };
}

/**
 * Hook for course progress metrics
 */
export function useCourseProgressMetrics() {
  const { analytics, isLoading, refresh } = useUnifiedAnalytics();

  const courseProgress = useMemo(() => {
    return analytics?.courseProgress ?? [];
  }, [analytics]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    if (courseProgress.length === 0) {
      return {
        totalCourses: 0,
        avgProgress: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        notStartedCourses: 0,
      };
    }

    const avgProgress = Math.round(
      courseProgress.reduce((sum, c) => sum + c.progress, 0) / courseProgress.length
    );

    return {
      totalCourses: courseProgress.length,
      avgProgress,
      completedCourses: courseProgress.filter((c) => c.progress === 100).length,
      inProgressCourses: courseProgress.filter((c) => c.progress > 0 && c.progress < 100).length,
      notStartedCourses: courseProgress.filter((c) => c.progress === 0).length,
    };
  }, [courseProgress]);

  return {
    courses: courseProgress,
    ...aggregateMetrics,
    isLoading,
    refresh,
  };
}

/**
 * Hook for activity heatmap data (GitHub-style contribution graph)
 */
export function useActivityHeatmap(timeRange: TimeRange = '90d') {
  const { analytics, isLoading, setTimeRange, refresh } = useUnifiedAnalytics(timeRange);

  const heatmapData = useMemo(() => {
    return analytics?.heatmap ?? [];
  }, [analytics]);

  // Calculate heatmap stats
  const stats = useMemo(() => {
    if (heatmapData.length === 0) {
      return {
        totalActivities: 0,
        activeDays: 0,
        maxIntensity: 0,
        currentStreak: 0,
      };
    }

    return {
      totalActivities: heatmapData.reduce((sum, d) => sum + d.count, 0),
      activeDays: heatmapData.filter((d) => d.count > 0).length,
      maxIntensity: Math.max(...heatmapData.map((d) => d.intensity)),
      currentStreak: calculateCurrentStreak(heatmapData),
    };
  }, [heatmapData]);

  return {
    data: heatmapData,
    ...stats,
    isLoading,
    setTimeRange,
    refresh,
  };
}

/**
 * Hook for performance metrics
 */
export function usePerformanceMetrics() {
  const { analytics, isLoading, refresh } = useUnifiedAnalytics();

  const performance = useMemo(() => {
    if (!analytics?.performance) {
      return {
        examAttempts: 0,
        avgScore: 0,
        accuracy: 0,
        currentStreak: 0,
        recentScores: [] as Array<{ score: number }>,
      };
    }
    return {
      ...analytics.performance,
      recentScores: (analytics.performance as { recentScores?: Array<{ score: number }> }).recentScores ?? [],
    };
  }, [analytics]);

  // Calculate trend
  const scoreTrend = useMemo(() => {
    const scores = performance.recentScores ?? [];
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(0, 3);
    const older = scores.slice(3, 6);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum: number, s: { score: number }) => sum + (s.score ?? 0), 0) / recent.length;
    const olderAvg = older.reduce((sum: number, s: { score: number }) => sum + (s.score ?? 0), 0) / older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }, [performance.recentScores]);

  return {
    ...performance,
    scoreTrend,
    isLoading,
    refresh,
  };
}

// Helper function to calculate current streak from heatmap data
function calculateCurrentStreak(
  heatmapData: Array<{ date: string; count: number }>
): number {
  if (heatmapData.length === 0) return 0;

  // Sort by date descending
  const sorted = [...heatmapData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const entryDate = new Date(sorted[i].date);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (entryDate.getTime() !== expectedDate.getTime()) {
      break;
    }

    if (sorted[i].count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
