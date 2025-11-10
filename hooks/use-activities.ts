import { useState, useEffect, useCallback } from "react";
import { addDays, subDays } from "date-fns";

export interface Activity {
  id: string;
  type:
    | "ASSIGNMENT"
    | "QUIZ"
    | "EXAM"
    | "READING"
    | "VIDEO"
    | "DISCUSSION"
    | "STUDY_SESSION"
    | "PROJECT"
    | "PRESENTATION"
    | "CUSTOM";
  title: string;
  description?: string;
  course?: {
    id: string;
    title: string;
    description?: string;
  };
  dueDate?: Date;
  completedAt?: Date;
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "GRADED"
    | "OVERDUE"
    | "CANCELLED";
  points: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  googleEventId?: string;
  calendarSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseActivitiesOptions {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  courseId?: string;
  priority?: string;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [metadata, setMetadata] = useState({
    completedCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
  });

  // Destructure options to avoid object reference issues
  const { startDate, endDate, status, type, courseId, priority } = options;

  const fetchActivities = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "20",
          ...(status && { status }),
          ...(type && { type }),
          ...(courseId && { courseId }),
          ...(priority && { priority }),
          ...(startDate && {
            startDate: startDate.toISOString(),
          }),
          ...(endDate && { endDate: endDate.toISOString() }),
        });

        const response = await fetch(
          `/api/dashboard/activities?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const result = await response.json();

        if (result.success) {
          const newActivities = result.data.map((activity: Activity) => ({
            ...activity,
            dueDate: activity.dueDate ? new Date(activity.dueDate) : undefined,
            completedAt: activity.completedAt
              ? new Date(activity.completedAt)
              : undefined,
            createdAt: new Date(activity.createdAt),
            updatedAt: new Date(activity.updatedAt),
          }));

          setActivities((prev) =>
            append ? [...prev, ...newActivities] : newActivities
          );
          setHasMore(
            result.pagination.page * result.pagination.limit <
              result.pagination.total
          );

          if (result.metadata) {
            setMetadata({
              completedCount: result.metadata.completedCount || 0,
              overdueCount: result.metadata.overdueCount || 0,
              upcomingCount: result.metadata.upcomingCount || 0,
            });
          }
        } else {
          throw new Error(result.error?.message || "Failed to fetch activities");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, status, type, courseId, priority]
  );

  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchActivities(nextPage, true);
    }
  }, [page, isLoading, hasMore, fetchActivities]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchActivities(1, false);
  }, [fetchActivities]);

  const updateActivity = useCallback(
    async (id: string, data: Partial<Activity>) => {
      try {
        const response = await fetch(`/api/dashboard/activities/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update activity");

        const result = await response.json();

        if (result.success) {
          setActivities((prev) =>
            prev.map((activity) =>
              activity.id === id
                ? {
                    ...activity,
                    ...result.data,
                    dueDate: result.data.dueDate
                      ? new Date(result.data.dueDate)
                      : undefined,
                    completedAt: result.data.completedAt
                      ? new Date(result.data.completedAt)
                      : undefined,
                  }
                : activity
            )
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to update activity:", err);
        return false;
      }
    },
    []
  );

  const deleteActivity = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/activities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete activity");

      setActivities((prev) => prev.filter((activity) => activity.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete activity:", err);
      return false;
    }
  }, []);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    metadata,
    loadMore,
    refresh,
    updateActivity,
    deleteActivity,
  };
}
