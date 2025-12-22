"use client";

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// ==========================================
// Unified Analytics Hook
// ==========================================
// Provides both learner and creator analytics in a single hook
// for the unified user model

export interface LearnerOverview {
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  overallProgress: number;
  totalTimeSpent: number;
  studyStreak: number;
  averageScore: number | null;
}

export interface CognitiveProgress {
  bloomsLevel: string;
  cognitiveScore: number;
  skillsAcquired: string[];
  growthTrend: Array<{ date: string; score: number }>;
}

export interface ExamPerformance {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  recentExams: Array<{
    examId: string;
    examTitle: string;
    score: number;
    passed: boolean;
    date: string;
  }>;
}

export interface WeeklyActivity {
  date: string;
  timeSpent: number;
  sectionsCompleted: number;
}

export interface RecentProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  lastAccessed: string;
}

export interface LearnerAnalytics {
  overview: LearnerOverview;
  cognitiveProgress: CognitiveProgress;
  examPerformance: ExamPerformance;
  weeklyActivity: WeeklyActivity[];
  recentProgress: RecentProgress[];
}

export interface CreatorOverview {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  overallCompletionRate: number;
  averageRating: number;
  totalReviews: number;
}

export interface CoursePerformance {
  courseId: string;
  courseTitle: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageRating: number;
  reviews: number;
  lastEnrollment: string | null;
}

export interface EnrollmentTrend {
  date: string;
  enrollments: number;
  completions: number;
}

export interface LearnerInsights {
  activelearners: number;
  averageTimeSpent: number;
  dropoffPoints: Array<{
    courseId: string;
    sectionTitle: string;
    dropoffRate: number;
  }>;
}

export interface TopPerformingCourse {
  courseId: string;
  courseTitle: string;
  score: number;
  metric: string;
}

export interface CreatorAnalytics {
  overview: CreatorOverview;
  coursePerformance: CoursePerformance[];
  enrollmentTrend: EnrollmentTrend[];
  learnerInsights: LearnerInsights;
  topPerformingCourses: TopPerformingCourse[];
}

export interface UnifiedAnalytics {
  learner?: LearnerAnalytics;
  creator?: CreatorAnalytics;
  summary: {
    isLearner: boolean;
    isCreator: boolean;
    lastUpdated: string;
  };
}

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';
export type AnalyticsView = 'all' | 'learner' | 'creator';

interface UseUnifiedAnalyticsOptions {
  view?: AnalyticsView;
  timeRange?: TimeRange;
  courseId?: string;
  autoFetch?: boolean;
}

interface UseUnifiedAnalyticsReturn {
  data: UnifiedAnalytics | null;
  learnerData: LearnerAnalytics | null;
  creatorData: CreatorAnalytics | null;
  isLearner: boolean;
  isCreator: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  setView: (view: AnalyticsView) => void;
}

export function useUnifiedAnalytics(
  options: UseUnifiedAnalyticsOptions = {}
): UseUnifiedAnalyticsReturn {
  const {
    view: initialView = 'all',
    timeRange: initialTimeRange = 'month',
    courseId,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<UnifiedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRangeState] = useState<TimeRange>(initialTimeRange);
  const [view, setViewState] = useState<AnalyticsView>(initialView);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        view,
        timeRange,
      });

      if (courseId) {
        params.append('courseId', courseId);
      }

      const response = await fetch(`/api/analytics/unified?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.analytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      logger.error('[UNIFIED_ANALYTICS] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [view, timeRange, courseId]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, autoFetch]);

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState(range);
  }, []);

  const setView = useCallback((newView: AnalyticsView) => {
    setViewState(newView);
  }, []);

  return {
    data,
    learnerData: data?.learner || null,
    creatorData: data?.creator || null,
    isLearner: data?.summary.isLearner || false,
    isCreator: data?.summary.isCreator || false,
    loading,
    error,
    refetch: fetchAnalytics,
    setTimeRange,
    setView,
  };
}

/**
 * Hook specifically for learner analytics
 */
export function useLearnerAnalytics(timeRange: TimeRange = 'month') {
  const result = useUnifiedAnalytics({
    view: 'learner',
    timeRange,
  });

  return {
    data: result.learnerData,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook specifically for creator analytics
 */
export function useCreatorAnalytics(timeRange: TimeRange = 'month') {
  const result = useUnifiedAnalytics({
    view: 'creator',
    timeRange,
  });

  return {
    data: result.creatorData,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
