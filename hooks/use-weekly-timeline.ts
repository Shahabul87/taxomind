import { useState, useEffect, useCallback } from "react";
import type { WeeklyTimelineDay } from "@/app/dashboard/user/_components/learning-command-center/types";

interface TimelineActivity {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  progress: number;
  courseName?: string;
}

interface TimelineDay {
  date: string;
  dayName: string;
  dayLabel: string;
  isToday: boolean;
  isPast: boolean;
  metrics: {
    plannedHours: number;
    actualHours: number;
    plannedMinutes: number;
    actualMinutes: number;
    completedActivities: number;
    totalActivities: number;
    completionRate: number;
    focusScore: number | null;
    productivityScore: number | null;
  };
  activities: TimelineActivity[];
}

interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  totalPlannedHours: number;
  totalActualHours: number;
  totalActivities: number;
  completedActivities: number;
  averageCompletionRate: number;
  days: TimelineDay[];
}

interface TimelineResponse {
  range: {
    start: string;
    end: string;
    weeks: number;
    totalDays: number;
  };
  summary: {
    totalPlannedHours: number;
    totalActualHours: number;
    totalActivities: number;
    completedActivities: number;
    overallCompletionRate: number;
    efficiency: number;
  };
  weeks: WeekSummary[];
  timeline: TimelineDay[];
}

interface UseWeeklyTimelineOptions {
  startDate?: Date;
  weeks?: number;
}

export function useWeeklyTimeline(options: UseWeeklyTimelineOptions = {}) {
  const [timeline, setTimeline] = useState<WeeklyTimelineDay[]>([]);
  const [summary, setSummary] = useState<TimelineResponse["summary"] | null>(
    null
  );
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, weeks: numWeeks = 1 } = options;

  const fetchTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        weeks: numWeeks.toString(),
        ...(startDate && { startDate: startDate.toISOString() }),
      });

      const response = await fetch(`/api/dashboard/gantt?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch timeline data");
      }

      const result = await response.json();

      if (result.success) {
        const data: TimelineResponse = result.data;

        // Transform to frontend WeeklyTimelineDay format
        const transformedTimeline: WeeklyTimelineDay[] = data.timeline.map(
          (day) => ({
            date: new Date(day.date),
            dayName: day.dayName,
            plannedHours: day.metrics.plannedHours,
            actualHours: day.metrics.actualHours,
            completionRate: day.metrics.completionRate,
            isToday: day.isToday,
          })
        );

        setTimeline(transformedTimeline);
        setSummary(data.summary);
        setWeeks(data.weeks);
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch timeline data"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, numWeeks]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const refresh = useCallback(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    timeline,
    summary,
    weeks,
    isLoading,
    error,
    refresh,
  };
}
