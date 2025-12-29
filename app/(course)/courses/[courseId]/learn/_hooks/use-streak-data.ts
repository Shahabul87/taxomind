"use client";

import { useState, useEffect, useCallback } from "react";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  streakStart: string;
  weeklyActivity: boolean[];
  weeklyGoalMinutes: number;
  weeklyActualMinutes: number;
  todayStudied: boolean;
}

interface UseStreakDataResult {
  streak: StreakData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  recordActivity: (minutesStudied?: number) => Promise<void>;
}

/**
 * Custom hook for fetching and managing streak data
 */
export function useStreakData(courseId: string): UseStreakDataResult {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreakData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/courses/${courseId}/streak`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch streak data");
      }

      setStreak(data.data);
    } catch (err) {
      console.error("Error fetching streak data:", err);
      setError(err instanceof Error ? err.message : "Failed to load streak data");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const recordActivity = useCallback(async (minutesStudied: number = 0) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/streak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ minutesStudied }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to record activity");
      }

      setStreak(data.data);
    } catch (err) {
      console.error("Error recording activity:", err);
    }
  }, [courseId]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return {
    streak,
    isLoading,
    error,
    refetch: fetchStreakData,
    recordActivity,
  };
}

/**
 * Lightweight hook for just getting the current streak count
 * Useful for components that only need the streak number
 */
export function useCurrentStreak(courseId: string): {
  currentStreak: number;
  isLoading: boolean;
} {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const response = await fetch(`/api/courses/${courseId}/streak`);
        const data = await response.json();

        if (response.ok && data.success) {
          setCurrentStreak(data.data.currentStreak);
        }
      } catch (err) {
        console.error("Error fetching streak:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreak();
  }, [courseId]);

  return { currentStreak, isLoading };
}
