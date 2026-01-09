import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  LearningGanttItem,
  PlannedVsAccomplished,
  GanttCourseInfo,
  GanttResponse,
  CourseGanttResponse,
} from "@/app/dashboard/user/_components/learning-command-center/types";
import {
  getDemoGanttItems,
  getDemoGanttCourses,
  getDemoGanttSummary,
} from "@/app/dashboard/user/_components/learning-command-center/demo-data";

interface UseGanttTimelineOptions {
  startDate?: Date;
  weeks?: number;
  courseId?: string;
  useDemoData?: boolean;
}

interface GanttTimelineState {
  items: LearningGanttItem[];
  courses: GanttCourseInfo[];
  summary: PlannedVsAccomplished | null;
  isLoading: boolean;
  error: string | null;
}

export function useGanttTimeline(options: UseGanttTimelineOptions = {}) {
  const { startDate, weeks = 2, courseId, useDemoData = false } = options;

  const [state, setState] = useState<GanttTimelineState>({
    items: [],
    courses: [],
    summary: null,
    isLoading: true,
    error: null,
  });

  // Get demo data for fallback
  const demoData = useMemo(
    () => ({
      items: getDemoGanttItems(),
      courses: getDemoGanttCourses(),
      summary: getDemoGanttSummary(),
    }),
    []
  );

  const fetchGanttData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // If using demo data, skip API call
      if (useDemoData) {
        setState({
          items: demoData.items,
          courses: demoData.courses,
          summary: demoData.summary,
          isLoading: false,
          error: null,
        });
        return;
      }

      const params = new URLSearchParams({
        weeks: weeks.toString(),
        ...(startDate && { startDate: startDate.toISOString() }),
      });

      // Fetch from the appropriate endpoint
      const endpoint = courseId
        ? `/api/dashboard/gantt/course/${courseId}?${params.toString()}`
        : `/api/dashboard/gantt?${params.toString()}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch gantt data");
      }

      const result = await response.json();

      if (result.success) {
        if (courseId) {
          // Course-specific response
          const data: CourseGanttResponse = result.data;

          // Transform course data to LearningGanttItem format
          const transformedItems: LearningGanttItem[] = data.chapters.map(
            (chapter) => ({
              ...chapter,
              plannedStart: new Date(chapter.plannedStart),
              plannedEnd: new Date(chapter.plannedEnd),
              actualStart: chapter.actualStart
                ? new Date(chapter.actualStart)
                : undefined,
              actualEnd: chapter.actualEnd
                ? new Date(chapter.actualEnd)
                : undefined,
              milestones: chapter.milestones.map((m) => ({
                ...m,
                date: new Date(m.date),
              })),
              children: chapter.children?.map((child) => ({
                ...child,
                plannedStart: new Date(child.plannedStart),
                plannedEnd: new Date(child.plannedEnd),
                actualStart: child.actualStart
                  ? new Date(child.actualStart)
                  : undefined,
                actualEnd: child.actualEnd
                  ? new Date(child.actualEnd)
                  : undefined,
              })),
            })
          );

          // Build summary from course data
          const summary: PlannedVsAccomplished = {
            period: {
              start: new Date(data.timeline.start),
              end: new Date(data.timeline.end),
              label: `${data.course.title} Progress`,
            },
            planned: {
              totalHours: data.course.totalHours,
              activities: data.course.lessonsCount,
              courses: 1,
            },
            accomplished: {
              totalHours: data.course.completedHours,
              activities: Math.round(
                (data.course.lessonsCount * data.course.totalProgress) / 100
              ),
              courses: data.course.totalProgress === 100 ? 1 : 0,
            },
            variance: {
              hours: data.course.completedHours - data.course.totalHours,
              percentage: data.course.totalProgress - 100,
              status:
                data.course.totalProgress >= 100
                  ? "AHEAD"
                  : data.course.totalProgress >= 80
                    ? "ON_TRACK"
                    : "BEHIND",
            },
            dailyBreakdown: [],
          };

          setState({
            items: transformedItems,
            courses: [data.course],
            summary,
            isLoading: false,
            error: null,
          });
        } else {
          // General gantt response - transform timeline data
          const data = result.data;

          // Transform timeline data into LearningGanttItem format
          // Group activities by course
          const courseMap = new Map<string, LearningGanttItem>();
          const coursesInfo: GanttCourseInfo[] = [];

          // Process weekly data and build items
          if (data.weeks && data.weeks.length > 0) {
            data.weeks.forEach(
              (week: {
                days: Array<{
                  activities: Array<{
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
                  }>;
                  date: string;
                  metrics: {
                    plannedHours: number;
                    actualHours: number;
                  };
                }>;
              }) => {
                week.days.forEach((day) => {
                  day.activities.forEach((activity) => {
                    const courseKey = activity.courseName || "General";

                    if (!courseMap.has(courseKey)) {
                      const color =
                        "#" + Math.floor(Math.random() * 16777215).toString(16);
                      courseMap.set(courseKey, {
                        id: `course-${courseKey}`,
                        type: "COURSE",
                        title: courseKey,
                        plannedStart: new Date(day.date),
                        plannedEnd: new Date(day.date),
                        plannedHours: 0,
                        actualHours: 0,
                        plannedProgress: 0,
                        actualProgress: 0,
                        color,
                        status: "ON_TRACK",
                        milestones: [],
                        children: [],
                      });
                      coursesInfo.push({
                        id: `course-${courseKey}`,
                        title: courseKey,
                        color,
                        totalProgress: 0,
                        totalHours: 0,
                        completedHours: 0,
                        chaptersCount: 0,
                        lessonsCount: 0,
                      });
                    }

                    const courseItem = courseMap.get(courseKey)!;
                    courseItem.plannedHours += activity.estimatedDuration / 60;
                    courseItem.actualHours +=
                      (activity.actualDuration || 0) / 60;

                    // Update end date if later
                    const activityDate = new Date(day.date);
                    if (activityDate > courseItem.plannedEnd) {
                      courseItem.plannedEnd = activityDate;
                    }
                  });
                });
              }
            );
          }

          // Calculate progress for each course
          courseMap.forEach((item) => {
            item.actualProgress =
              item.plannedHours > 0
                ? Math.round((item.actualHours / item.plannedHours) * 100)
                : 0;
            item.plannedProgress = 100;
            item.status =
              item.actualProgress >= 100
                ? "COMPLETED"
                : item.actualProgress >= 70
                  ? "ON_TRACK"
                  : item.actualProgress >= 40
                    ? "BEHIND"
                    : "NOT_STARTED";
          });

          // Build summary
          const summary: PlannedVsAccomplished = {
            period: {
              start: new Date(data.range.start),
              end: new Date(data.range.end),
              label: `${data.range.weeks} Week Timeline`,
            },
            planned: {
              totalHours: data.summary.totalPlannedHours,
              activities: data.summary.totalActivities,
              courses: courseMap.size,
            },
            accomplished: {
              totalHours: data.summary.totalActualHours,
              activities: data.summary.completedActivities,
              courses: Array.from(courseMap.values()).filter(
                (c) => c.status === "COMPLETED"
              ).length,
            },
            variance: {
              hours:
                data.summary.totalActualHours - data.summary.totalPlannedHours,
              percentage:
                data.summary.totalPlannedHours > 0
                  ? Math.round(
                      ((data.summary.totalActualHours -
                        data.summary.totalPlannedHours) /
                        data.summary.totalPlannedHours) *
                        100
                    )
                  : 0,
              status:
                data.summary.totalActualHours >= data.summary.totalPlannedHours
                  ? "AHEAD"
                  : data.summary.overallCompletionRate >= 70
                    ? "ON_TRACK"
                    : "BEHIND",
            },
            dailyBreakdown:
              data.timeline?.map(
                (day: {
                  date: string;
                  dayName: string;
                  metrics: {
                    plannedHours: number;
                    actualHours: number;
                    totalActivities: number;
                  };
                }) => ({
                  date: day.date,
                  dayName: day.dayName,
                  plannedHours: day.metrics.plannedHours,
                  actualHours: day.metrics.actualHours,
                  activities: day.metrics.totalActivities,
                })
              ) || [],
          };

          // If no courses found from API, use demo data
          const items = Array.from(courseMap.values());
          if (items.length === 0) {
            setState({
              items: demoData.items,
              courses: demoData.courses,
              summary: demoData.summary,
              isLoading: false,
              error: null,
            });
          } else {
            setState({
              items,
              courses: coursesInfo,
              summary,
              isLoading: false,
              error: null,
            });
          }
        }
      } else {
        throw new Error(result.error?.message || "Failed to fetch gantt data");
      }
    } catch (err) {
      console.error("[useGanttTimeline]", err);
      // Fallback to demo data on error
      setState({
        items: demoData.items,
        courses: demoData.courses,
        summary: demoData.summary,
        isLoading: false,
        error: err instanceof Error ? err.message : "An error occurred",
      });
    }
  }, [startDate, weeks, courseId, useDemoData, demoData]);

  useEffect(() => {
    fetchGanttData();
  }, [fetchGanttData]);

  const refresh = useCallback(() => {
    fetchGanttData();
  }, [fetchGanttData]);

  return {
    items: state.items,
    courses: state.courses,
    summary: state.summary,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}

// Hook for course-specific Gantt data
export function useCourseGantt(courseId: string) {
  return useGanttTimeline({ courseId, weeks: 4 });
}
