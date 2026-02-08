/**
 * Enrolled Course Analytics Hook
 *
 * Fetches consolidated analytics data for all enrolled courses (student perspective).
 * Provides a clean interface for the redesigned analytics dashboard.
 *
 * NOTE: This is different from use-course-analytics.ts which is for teacher analytics.
 *
 * @example
 * ```tsx
 * const { courses, summary, isLoading, error, refetch } = useEnrolledCourseAnalytics();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     <Summary data={summary} />
 *     <CourseGrid courses={courses} />
 *   </div>
 * );
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TopicProgress {
  id: string;
  name: string;
  masteryLevel: number;
  timeSpentMinutes: number;
  lastStudiedAt: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface CourseAssessments {
  examAttempts: number;
  averageScore: number;
  passedExams: number;
  practiceSessionsCount: number;
  totalPracticeMinutes: number;
  bloomsBreakdown: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
}

export interface CourseMilestone {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  targetDate?: string;
  completedAt?: string;
  progress: number;
}

export interface EnrolledCourseAnalytics {
  courseId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  enrolledAt: string;
  lastActivityAt?: string;
  progress: {
    overall: number;
    sectionsCompleted: number;
    totalSections: number;
    chaptersCompleted: number;
    totalChapters: number;
  };
  topics: TopicProgress[];
  timeSpent: {
    totalMinutes: number;
    thisWeekMinutes: number;
    averageSessionMinutes: number;
    sessionsCount: number;
  };
  assessments: CourseAssessments;
  milestones: CourseMilestone[];
  status: 'on_track' | 'needs_attention' | 'ahead' | 'behind' | 'completed';
  aiInsights: {
    recommendation?: string;
    riskLevel: 'low' | 'medium' | 'high';
    strengths: string[];
    weaknesses: string[];
  };
}

export interface CourseAnalyticsSummary {
  totalCourses: number;
  completedCourses: number;
  totalStudyTimeMinutes: number;
  averageProgress: number;
  overallHealthScore: number;
  currentStreak: number;
}

export type TimeRange = 'week' | 'month' | 'quarter' | 'all';

export interface UseEnrolledCourseAnalyticsOptions {
  /** Filter by specific course ID */
  courseId?: string;
  /** Time range for analytics data */
  timeRange?: TimeRange;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Enable/disable fetching */
  enabled?: boolean;
}

export interface UseEnrolledCourseAnalyticsReturn {
  /** List of course analytics */
  courses: EnrolledCourseAnalytics[];
  /** Summary statistics */
  summary: CourseAnalyticsSummary;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch data */
  refetch: () => Promise<void>;
  /** Selected course for detail view */
  selectedCourse: EnrolledCourseAnalytics | null;
  /** Select a course for detail view */
  selectCourse: (courseId: string | null) => void;
  /** Data is stale (older than 5 minutes) */
  isStale: boolean;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultSummary: CourseAnalyticsSummary = {
  totalCourses: 0,
  completedCourses: 0,
  totalStudyTimeMinutes: 0,
  averageProgress: 0,
  overallHealthScore: 100,
  currentStreak: 0,
};

// ============================================================================
// HOOK
// ============================================================================

export function useEnrolledCourseAnalytics(
  options: UseEnrolledCourseAnalyticsOptions = {}
): UseEnrolledCourseAnalyticsReturn {
  const {
    courseId,
    timeRange = 'month',
    refreshInterval = 0,
    enabled = true,
  } = options;

  const [courses, setCourses] = useState<EnrolledCourseAnalytics[]>([]);
  const [summary, setSummary] = useState<CourseAnalyticsSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Memoize selected course
  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find(c => c.courseId === selectedCourseId) ?? null;
  }, [courses, selectedCourseId]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!enabled || isFetchingRef.current) return;

    isFetchingRef.current = true;
    if (!isRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      params.set('timeRange', timeRange);

      const response = await fetch(`/api/sam/analytics/course-overview?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view analytics');
        }
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message ?? 'Failed to fetch analytics');
      }

      setCourses(result.data.courses ?? []);
      setSummary(result.data.summary ?? defaultSummary);
      lastFetchTimeRef.current = Date.now();
      setIsStale(false);

      logger.info('[ENROLLED_COURSE_ANALYTICS] Data fetched', {
        courseCount: result.data.courses?.length ?? 0,
        timeRange,
        isRefresh,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      logger.error('[ENROLLED_COURSE_ANALYTICS] Error:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled, courseId, timeRange]);

  // Initial fetch
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const intervalId = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchData]);

  // Mark as stale after 5 minutes
  useEffect(() => {
    if (lastFetchTimeRef.current === 0) return;

    const staleTimeout = setTimeout(() => {
      setIsStale(true);
    }, 5 * 60 * 1000);

    return () => clearTimeout(staleTimeout);
  }, [courses]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const selectCourse = useCallback((id: string | null) => {
    setSelectedCourseId(id);
  }, []);

  return {
    courses,
    summary,
    isLoading,
    error,
    refetch,
    selectedCourse,
    selectCourse,
    isStale,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format minutes to human-readable string
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get status color classes
 */
export function getStatusColor(status: EnrolledCourseAnalytics['status']): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    case 'ahead':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
    case 'on_track':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
    case 'behind':
      return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    case 'needs_attention':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    default:
      return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: EnrolledCourseAnalytics['status']): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'ahead':
      return '🚀';
    case 'on_track':
      return '✓';
    case 'behind':
      return '⚠️';
    case 'needs_attention':
      return '🔔';
    default:
      return '•';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: EnrolledCourseAnalytics['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'ahead':
      return 'Ahead';
    case 'on_track':
      return 'On Track';
    case 'behind':
      return 'Behind';
    case 'needs_attention':
      return 'Needs Attention';
    default:
      return 'Unknown';
  }
}

/**
 * Get risk level color
 */
export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-amber-600 dark:text-amber-400';
    case 'high':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

/**
 * Get mastery level label
 */
export function getMasteryLabel(level: number): string {
  if (level >= 90) return 'Expert';
  if (level >= 70) return 'Proficient';
  if (level >= 50) return 'Intermediate';
  if (level >= 25) return 'Beginner';
  return 'Not Started';
}

/**
 * Get mastery color classes
 */
export function getMasteryColor(level: number): string {
  if (level >= 80) return 'text-emerald-600 bg-emerald-500';
  if (level >= 60) return 'text-blue-600 bg-blue-500';
  if (level >= 40) return 'text-amber-600 bg-amber-500';
  if (level >= 20) return 'text-orange-600 bg-orange-500';
  return 'text-slate-400 bg-slate-300';
}

/**
 * Get progress bar color
 */
export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-amber-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-slate-300';
}

/**
 * Calculate days since date
 */
export function daysSince(dateString: string | null | undefined): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  const days = daysSince(dateString);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default useEnrolledCourseAnalytics;
