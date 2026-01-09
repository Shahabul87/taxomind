import { useState, useEffect, useCallback } from "react";
import type { StreakInfo } from "@/app/dashboard/user/_components/learning-command-center/types";

interface ActivityDay {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
}

interface StreakResponse {
  streak: {
    current: number;
    longest: number;
    status: "active" | "at_risk" | "broken";
    daysSinceActive: number;
    streakStartDate: string | null;
    lastActiveDate: string | null;
  };
  freezes: {
    available: number;
    used: number;
    lastUsed: string | null;
  };
  weeklyProgress: {
    goalMinutes: number;
    completedMinutes: number;
    goalHours: number;
    completedHours: number;
    progress: number;
    weekStart: string;
    weekEnd: string;
  };
  statistics: {
    totalActiveDays: number;
    totalMinutesAllTime: number;
    averageDailyMinutes: number;
    activeDaysLast30: number;
    totalMinutesLast30: number;
    avgMinutesPerActiveDay: number;
  };
  activityCalendar: ActivityDay[];
}

export function useLearningStreak() {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [streakStatus, setStreakStatus] = useState<
    "active" | "at_risk" | "broken"
  >("active");
  const [weeklyProgress, setWeeklyProgress] =
    useState<StreakResponse["weeklyProgress"] | null>(null);
  const [statistics, setStatistics] =
    useState<StreakResponse["statistics"] | null>(null);
  const [activityCalendar, setActivityCalendar] = useState<ActivityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreak = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/streak");

      if (!response.ok) {
        throw new Error("Failed to fetch streak data");
      }

      const result = await response.json();

      if (result.success) {
        const data: StreakResponse = result.data;

        const transformedStreakInfo: StreakInfo = {
          currentStreak: data.streak.current,
          longestStreak: data.streak.longest,
          lastActiveDate: data.streak.lastActiveDate
            ? new Date(data.streak.lastActiveDate)
            : undefined,
          streakStartDate: data.streak.streakStartDate
            ? new Date(data.streak.streakStartDate)
            : undefined,
          freezesAvailable: data.freezes.available,
          freezesUsed: data.freezes.used,
        };

        setStreakInfo(transformedStreakInfo);
        setStreakStatus(data.streak.status);
        setWeeklyProgress(data.weeklyProgress);
        setStatistics(data.statistics);
        setActivityCalendar(data.activityCalendar);
      } else {
        throw new Error(result.error?.message || "Failed to fetch streak data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const refresh = useCallback(() => {
    fetchStreak();
  }, [fetchStreak]);

  const useFreeze = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/dashboard/streak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useFreeze: true }),
      });

      if (!response.ok) throw new Error("Failed to use streak freeze");

      const result = await response.json();

      if (result.success) {
        // Refresh streak data
        await fetchStreak();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to use streak freeze:", err);
      return false;
    }
  }, [fetchStreak]);

  const updateWeeklyGoal = useCallback(
    async (goalMinutes: number): Promise<boolean> => {
      try {
        const response = await fetch("/api/dashboard/streak", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updateWeeklyGoal: goalMinutes }),
        });

        if (!response.ok) throw new Error("Failed to update weekly goal");

        const result = await response.json();

        if (result.success) {
          // Refresh streak data
          await fetchStreak();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to update weekly goal:", err);
        return false;
      }
    },
    [fetchStreak]
  );

  return {
    streakInfo,
    streakStatus,
    weeklyProgress,
    statistics,
    activityCalendar,
    isLoading,
    error,
    refresh,
    useFreeze,
    updateWeeklyGoal,
  };
}
