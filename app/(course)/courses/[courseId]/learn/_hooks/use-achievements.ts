"use client";

import { useState, useEffect, useCallback } from "react";

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  requirement: number;
  type: "progress" | "streak" | "time" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  isUnlocked: boolean;
  currentValue: number;
  unlockedAt: string | null;
  points: number;
}

export interface AchievementsData {
  achievements: AchievementData[];
  totalPoints: number;
  level: number;
  unlockedCount: number;
  totalCount: number;
}

interface UseAchievementsResult {
  data: AchievementsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing achievements data
 */
export function useAchievements(courseId: string): UseAchievementsResult {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/courses/${courseId}/achievements`);
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to fetch achievements"
        );
      }

      setData(responseData.data);
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load achievements"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAchievements,
  };
}

/**
 * Lightweight hook for just getting achievement stats
 * Useful for components that only need summary info
 */
export function useAchievementStats(courseId: string): {
  totalPoints: number;
  level: number;
  unlockedCount: number;
  isLoading: boolean;
} {
  const [stats, setStats] = useState({
    totalPoints: 0,
    level: 1,
    unlockedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/courses/${courseId}/achievements`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStats({
            totalPoints: data.data.totalPoints,
            level: data.data.level,
            unlockedCount: data.data.unlockedCount,
          });
        }
      } catch (err) {
        console.error("Error fetching achievement stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [courseId]);

  return { ...stats, isLoading };
}
