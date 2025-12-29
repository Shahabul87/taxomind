"use client";

import { useState, useEffect, useCallback } from "react";

export interface WeeklyActivity {
  day: string;
  date: string;
  minutesStudied: number;
  sectionsCompleted: number;
  isActive: boolean;
}

export interface DailyActivity {
  date: string;
  minutesStudied: number;
  sectionsCompleted: number;
  isActive: boolean;
}

export interface LearningStats {
  totalTimeSpent: number;
  averageSessionLength: number;
  totalSessions: number;
  longestSession: number;
  currentWeekMinutes: number;
  lastWeekMinutes: number;
  weekOverWeekChange: number;
}

export interface CompletionVelocity {
  sectionsThisWeek: number;
  sectionsLastWeek: number;
  averageSectionsPerDay: number;
  estimatedCompletionDays: number | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  todayStudied: boolean;
}

export interface ProgressAnalyticsData {
  weeklyActivity: WeeklyActivity[];
  recentActivity: DailyActivity[];
  learningStats: LearningStats;
  completionVelocity: CompletionVelocity;
  streakInfo: StreakInfo;
}

interface UseProgressAnalyticsResult {
  data: ProgressAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching learner analytics data
 */
export function useProgressAnalytics(
  courseId: string
): UseProgressAnalyticsResult {
  const [data, setData] = useState<ProgressAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/courses/${courseId}/learner-analytics`
      );
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to fetch analytics"
        );
      }

      setData(responseData.data);
    } catch (err) {
      console.error("Error fetching progress analytics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * Lightweight hook for just getting weekly activity
 */
export function useWeeklyActivity(courseId: string): {
  weeklyActivity: WeeklyActivity[];
  isLoading: boolean;
} {
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/learner-analytics`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setWeeklyActivity(data.data.weeklyActivity);
        }
      } catch (err) {
        console.error("Error fetching weekly activity:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [courseId]);

  return { weeklyActivity, isLoading };
}

/**
 * Lightweight hook for just getting learning stats
 */
export function useLearningStats(courseId: string): {
  stats: LearningStats | null;
  isLoading: boolean;
} {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/learner-analytics`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setStats(data.data.learningStats);
        }
      } catch (err) {
        console.error("Error fetching learning stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [courseId]);

  return { stats, isLoading };
}
