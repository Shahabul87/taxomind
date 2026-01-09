import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import type {
  LearningActivity,
  LearningTask,
  LearningGoal,
  DailyAgenda,
  StreakInfo,
} from "@/app/dashboard/user/_components/learning-command-center/types";

interface DailyAgendaResponse {
  date: string;
  greeting: string;
  userName: string;
  stats: {
    streak: number;
    plannedHours: number;
    completedHours: number;
    completionRate: number;
    weeklyProgress: number;
    weeklyGoalHours: number;
    weeklyCompletedHours: number;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    estimatedDuration: number;
    actualDuration?: number;
    status: string;
    progress: number;
    priority: string;
    tags: string[];
    courseName?: string;
    chapterName?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: string;
    dueDate?: string;
    tags: string[];
  }>;
  goals: Array<{
    id: string;
    title: string;
    description?: string;
    progress: number;
    status: string;
    targetDate: string;
    courseName?: string;
    milestones: Array<{
      id: string;
      title: string;
      completed: boolean;
      targetDate?: string;
    }>;
  }>;
  dailyLog: {
    id: string;
    plannedMinutes: number;
    actualMinutes: number;
    plannedActivities: number;
    completedActivities: number;
    focusScore?: number;
    productivityScore?: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActiveDate?: string;
    freezesAvailable: number;
  };
}

export function useDailyAgenda(date?: Date) {
  const [agenda, setAgenda] = useState<DailyAgenda | null>(null);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the date string to prevent unnecessary re-renders
  const dateParam = useMemo(() => {
    const selectedDate = date || new Date();
    return format(selectedDate, "yyyy-MM-dd");
  }, [date]);

  const fetchDailyAgenda = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/daily?date=${dateParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch daily agenda");
      }

      const result = await response.json();

      if (result.success) {
        const data: DailyAgendaResponse = result.data;

        // Transform to frontend types
        const transformedAgenda: DailyAgenda = {
          date: new Date(data.date),
          greeting: data.greeting,
          userName: data.userName,
          stats: {
            streak: data.stats.streak,
            plannedHours: data.stats.plannedHours,
            completedHours: data.stats.completedHours,
            completionRate: data.stats.completionRate,
            weeklyProgress: {
              current: data.stats.weeklyCompletedHours,
              target: data.stats.weeklyGoalHours,
              percentage: data.stats.weeklyProgress,
            },
          },
          motivationalQuote: getMotivationalQuote(),
        };

        const transformedActivities: LearningActivity[] = data.activities.map(
          (a) => ({
            id: a.id,
            type: a.type as LearningActivity["type"],
            title: a.title,
            description: a.description,
            startTime: a.startTime,
            endTime: a.endTime,
            estimatedDuration: a.estimatedDuration,
            actualDuration: a.actualDuration,
            status: a.status as LearningActivity["status"],
            progress: a.progress,
            priority: a.priority as LearningActivity["priority"],
            tags: a.tags,
            courseName: a.courseName,
            chapterName: a.chapterName,
          })
        );

        const transformedTasks: LearningTask[] = data.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          priority: t.priority as LearningTask["priority"],
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          tags: t.tags,
        }));

        const transformedGoals: LearningGoal[] = data.goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          progress: g.progress,
          status: g.status as LearningGoal["status"],
          targetDate: new Date(g.targetDate),
          courseName: g.courseName,
          milestones: g.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            completed: m.completed,
            targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
          })),
        }));

        const transformedStreak: StreakInfo = {
          currentStreak: data.streak.current,
          longestStreak: data.streak.longest,
          lastActiveDate: data.streak.lastActiveDate
            ? new Date(data.streak.lastActiveDate)
            : undefined,
          freezesAvailable: data.streak.freezesAvailable,
        };

        setAgenda(transformedAgenda);
        setActivities(transformedActivities);
        setTasks(transformedTasks);
        setGoals(transformedGoals);
        setStreak(transformedStreak);
      } else {
        throw new Error(result.error?.message || "Failed to fetch daily agenda");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [dateParam]);

  useEffect(() => {
    fetchDailyAgenda();
  }, [fetchDailyAgenda]);

  const refresh = useCallback(() => {
    fetchDailyAgenda();
  }, [fetchDailyAgenda]);

  return {
    agenda,
    activities,
    tasks,
    goals,
    streak,
    isLoading,
    error,
    refresh,
  };
}

function getMotivationalQuote(): string {
  const quotes = [
    "The expert in anything was once a beginner.",
    "Learning is not attained by chance, it must be sought for with ardor and diligence.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "The more that you read, the more things you will know. The more that you learn, the more places you will go.",
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}
