import { useState, useEffect, useCallback } from "react";
import type { LearningActivity } from "@/app/dashboard/user/_components/learning-command-center/types";

interface UseLearningActivitiesOptions {
  startDate?: Date;
  endDate?: Date;
  status?: LearningActivity["status"];
  type?: LearningActivity["type"];
  courseId?: string;
}

interface CreateActivityData {
  type: LearningActivity["type"];
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  priority?: LearningActivity["priority"];
  tags?: string[];
}

interface UpdateActivityData {
  type?: LearningActivity["type"];
  title?: string;
  description?: string;
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  status?: LearningActivity["status"];
  progress?: number;
  priority?: LearningActivity["priority"];
  tags?: string[];
  notes?: string;
}

export function useLearningActivities(
  options: UseLearningActivitiesOptions = {}
) {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    plannedMinutes: 0,
    completedMinutes: 0,
  });

  const { startDate, endDate, status, type, courseId } = options;

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
          ...(startDate && { startDate: startDate.toISOString() }),
          ...(endDate && { endDate: endDate.toISOString() }),
        });

        const response = await fetch(
          `/api/dashboard/learning-activities?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch learning activities");
        }

        const result = await response.json();

        if (result.success) {
          const newActivities: LearningActivity[] = result.data.map(
            (activity: Record<string, unknown>) => ({
              id: activity.id,
              type: activity.type,
              title: activity.title,
              description: activity.description,
              startTime: activity.startTime,
              endTime: activity.endTime,
              estimatedDuration: activity.estimatedDuration,
              actualDuration: activity.actualDuration,
              status: activity.status,
              progress: activity.progress,
              priority: activity.priority,
              tags: activity.tags,
              courseName: (activity.course as { title?: string })?.title,
              chapterName: (activity.chapter as { title?: string })?.title,
              courseId: activity.courseId,
              chapterId: activity.chapterId,
              scheduledDate: new Date(activity.scheduledDate as string),
            })
          );

          setActivities((prev) =>
            append ? [...prev, ...newActivities] : newActivities
          );
          setHasMore(
            result.pagination.page * result.pagination.limit <
              result.pagination.total
          );

          if (result.metadata?.todayStats) {
            setTodayStats(result.metadata.todayStats);
          }
        } else {
          throw new Error(
            result.error?.message || "Failed to fetch learning activities"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, status, type, courseId]
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

  const createActivity = useCallback(
    async (data: CreateActivityData): Promise<LearningActivity | null> => {
      try {
        const response = await fetch("/api/dashboard/learning-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            scheduledDate: data.scheduledDate.toISOString(),
          }),
        });

        if (!response.ok) throw new Error("Failed to create activity");

        const result = await response.json();

        if (result.success) {
          const newActivity: LearningActivity = {
            id: result.data.id,
            type: result.data.type,
            title: result.data.title,
            description: result.data.description,
            startTime: result.data.startTime,
            endTime: result.data.endTime,
            estimatedDuration: result.data.estimatedDuration,
            actualDuration: result.data.actualDuration,
            status: result.data.status,
            progress: result.data.progress,
            priority: result.data.priority,
            tags: result.data.tags,
            courseName: result.data.course?.title,
            chapterName: result.data.chapter?.title,
          };

          setActivities((prev) => [...prev, newActivity]);
          return newActivity;
        }
        return null;
      } catch (err) {
        console.error("Failed to create activity:", err);
        return null;
      }
    },
    []
  );

  const updateActivity = useCallback(
    async (id: string, data: UpdateActivityData): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/dashboard/learning-activities/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              ...(data.scheduledDate && {
                scheduledDate: data.scheduledDate.toISOString(),
              }),
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update activity");

        const result = await response.json();

        if (result.success) {
          setActivities((prev) =>
            prev.map((activity) =>
              activity.id === id
                ? {
                    ...activity,
                    ...result.data,
                    courseName: result.data.course?.title || activity.courseName,
                    chapterName:
                      result.data.chapter?.title || activity.chapterName,
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

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/dashboard/learning-activities/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete activity");

      setActivities((prev) => prev.filter((activity) => activity.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete activity:", err);
      return false;
    }
  }, []);

  const toggleComplete = useCallback(
    async (id: string): Promise<boolean> => {
      const activity = activities.find((a) => a.id === id);
      if (!activity) return false;

      const newStatus =
        activity.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
      return updateActivity(id, { status: newStatus });
    },
    [activities, updateActivity]
  );

  return {
    activities,
    isLoading,
    error,
    hasMore,
    todayStats,
    loadMore,
    refresh,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleComplete,
  };
}
