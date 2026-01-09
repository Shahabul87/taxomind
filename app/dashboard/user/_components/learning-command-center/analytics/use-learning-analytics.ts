'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HeatmapResponse,
  CourseProgressAnalyticsResponse,
  SAMInsightsResponse,
  HeatmapDay,
} from '@/types/learning-analytics';

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook State Types
interface UseHeatmapState {
  data: HeatmapResponse | null;
  isLoading: boolean;
  error: string | null;
  year: number;
}

interface UseCourseProgressState {
  data: CourseProgressAnalyticsResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSAMInsightsState {
  data: SAMInsightsResponse | null;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// Study Heatmap Hook
// ==========================================

export interface UseStudyHeatmapOptions {
  year?: number;
  autoFetch?: boolean;
}

export interface UseStudyHeatmapReturn extends UseHeatmapState {
  setYear: (year: number) => void;
  refetch: () => Promise<void>;
  getDayData: (date: string) => HeatmapDay | undefined;
}

export function useStudyHeatmap(options: UseStudyHeatmapOptions = {}): UseStudyHeatmapReturn {
  const { year: initialYear = new Date().getFullYear(), autoFetch = true } = options;

  const [state, setState] = useState<UseHeatmapState>({
    data: null,
    isLoading: false,
    error: null,
    year: initialYear,
  });

  const fetchHeatmapData = useCallback(async (targetYear: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/dashboard/heatmap?year=${targetYear}`);
      const result: ApiResponse<HeatmapResponse> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch heatmap data');
      }

      setState((prev) => ({
        ...prev,
        data: result.data ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
    }
  }, []);

  const setYear = useCallback(
    (newYear: number) => {
      setState((prev) => ({ ...prev, year: newYear }));
      fetchHeatmapData(newYear);
    },
    [fetchHeatmapData]
  );

  const refetch = useCallback(async () => {
    await fetchHeatmapData(state.year);
  }, [fetchHeatmapData, state.year]);

  const getDayData = useCallback(
    (date: string): HeatmapDay | undefined => {
      if (!state.data) return undefined;

      for (const month of state.data.months) {
        for (const week of month.weeks) {
          const day = week.days.find((d) => d.date === date);
          if (day) return day;
        }
      }
      return undefined;
    },
    [state.data]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchHeatmapData(initialYear);
    }
  }, [autoFetch, fetchHeatmapData, initialYear]);

  return {
    ...state,
    setYear,
    refetch,
    getDayData,
  };
}

// ==========================================
// Course Progress Analytics Hook
// ==========================================

export interface UseCourseProgressOptions {
  courseId?: string;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseCourseProgressReturn extends UseCourseProgressState {
  refetch: () => Promise<void>;
  getCourseById: (courseId: string) => CourseProgressAnalyticsResponse['courses'][0] | undefined;
}

export function useCourseProgress(options: UseCourseProgressOptions = {}): UseCourseProgressReturn {
  const { courseId, limit = 10, autoFetch = true } = options;

  const [state, setState] = useState<UseCourseProgressState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchProgressData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (limit) params.set('limit', limit.toString());

      const response = await fetch(`/api/dashboard/analytics/course-progress?${params}`);
      const result: ApiResponse<CourseProgressAnalyticsResponse> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch course progress');
      }

      setState((prev) => ({
        ...prev,
        data: result.data ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
    }
  }, [courseId, limit]);

  const getCourseById = useCallback(
    (id: string) => {
      return state.data?.courses.find((c) => c.courseId === id);
    },
    [state.data]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchProgressData();
    }
  }, [autoFetch, fetchProgressData]);

  return {
    ...state,
    refetch: fetchProgressData,
    getCourseById,
  };
}

// ==========================================
// SAM Insights Hook
// ==========================================

export interface UseSAMInsightsOptions {
  autoFetch?: boolean;
  dismissedInsights?: string[];
}

export interface UseSAMInsightsReturn extends UseSAMInsightsState {
  refetch: () => Promise<void>;
  dismissInsight: (insightId: string) => void;
  dismissedIds: string[];
  filteredInsights: SAMInsightsResponse['insights'];
}

export function useSAMInsights(options: UseSAMInsightsOptions = {}): UseSAMInsightsReturn {
  const { autoFetch = true, dismissedInsights = [] } = options;

  const [state, setState] = useState<UseSAMInsightsState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(dismissedInsights);

  const fetchInsightsData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/dashboard/analytics/sam-insights');
      const result: ApiResponse<SAMInsightsResponse> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch SAM insights');
      }

      setState((prev) => ({
        ...prev,
        data: result.data ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
    }
  }, []);

  const dismissInsight = useCallback((insightId: string) => {
    setDismissedIds((prev) => [...prev, insightId]);
    // Optionally persist to localStorage or API
    try {
      const stored = localStorage.getItem('sam_dismissed_insights');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem(
        'sam_dismissed_insights',
        JSON.stringify([...existing, insightId])
      );
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const filteredInsights = useMemo(() => {
    if (!state.data?.insights) return [];
    return state.data.insights.filter((i) => !dismissedIds.includes(i.id));
  }, [state.data?.insights, dismissedIds]);

  // Load dismissed insights from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sam_dismissed_insights');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissedIds((prev) => [...new Set([...prev, ...parsed])]);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchInsightsData();
    }
  }, [autoFetch, fetchInsightsData]);

  return {
    ...state,
    refetch: fetchInsightsData,
    dismissInsight,
    dismissedIds,
    filteredInsights,
  };
}

// ==========================================
// Combined Analytics Hook
// ==========================================

export interface UseLearningAnalyticsOptions {
  autoFetch?: boolean;
  heatmapYear?: number;
  courseLimit?: number;
}

export interface UseLearningAnalyticsReturn {
  heatmap: UseStudyHeatmapReturn;
  progress: UseCourseProgressReturn;
  insights: UseSAMInsightsReturn;
  isLoading: boolean;
  hasError: boolean;
  refetchAll: () => Promise<void>;
}

export function useLearningAnalytics(
  options: UseLearningAnalyticsOptions = {}
): UseLearningAnalyticsReturn {
  const { autoFetch = true, heatmapYear, courseLimit } = options;

  const heatmap = useStudyHeatmap({ year: heatmapYear, autoFetch });
  const progress = useCourseProgress({ limit: courseLimit, autoFetch });
  const insights = useSAMInsights({ autoFetch });

  const isLoading = heatmap.isLoading || progress.isLoading || insights.isLoading;
  const hasError = !!(heatmap.error || progress.error || insights.error);

  const refetchAll = useCallback(async () => {
    await Promise.all([heatmap.refetch(), progress.refetch(), insights.refetch()]);
  }, [heatmap, progress, insights]);

  return {
    heatmap,
    progress,
    insights,
    isLoading,
    hasError,
    refetchAll,
  };
}

// ==========================================
// Utility Hooks
// ==========================================

/**
 * Hook to track learning time for the current session
 */
export function useStudyTimer() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const start = useCallback(() => {
    setStartTime(new Date());
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (startTime) {
      // Adjust start time to account for pause
      const now = new Date();
      const adjustedStart = new Date(now.getTime() - elapsedSeconds * 1000);
      setStartTime(adjustedStart);
      setIsRunning(true);
    }
  }, [startTime, elapsedSeconds]);

  const reset = useCallback(() => {
    setStartTime(null);
    setElapsedSeconds(0);
    setIsRunning(false);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning,
    start,
    pause,
    resume,
    reset,
  };
}

/**
 * Hook to calculate and format streak information
 */
export function useStreakInfo(currentStreak: number, longestStreak: number) {
  const streakPercentage = useMemo(() => {
    if (longestStreak === 0) return 0;
    return Math.round((currentStreak / longestStreak) * 100);
  }, [currentStreak, longestStreak]);

  const streakStatus = useMemo(() => {
    if (currentStreak === 0) return 'inactive';
    if (currentStreak >= longestStreak) return 'record';
    if (currentStreak >= 7) return 'strong';
    if (currentStreak >= 3) return 'building';
    return 'starting';
  }, [currentStreak, longestStreak]);

  const streakMessage = useMemo(() => {
    switch (streakStatus) {
      case 'record':
        return 'New record! Keep it going!';
      case 'strong':
        return 'Amazing consistency!';
      case 'building':
        return 'Building momentum!';
      case 'starting':
        return 'Great start!';
      default:
        return 'Start your streak today!';
    }
  }, [streakStatus]);

  return {
    streakPercentage,
    streakStatus,
    streakMessage,
    isAtRecord: currentStreak >= longestStreak && currentStreak > 0,
    daysToRecord: Math.max(0, longestStreak - currentStreak + 1),
  };
}
