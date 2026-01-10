'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LearningAnalyticsData {
  overview: {
    totalCourses: number;
    activeCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageProgress: number;
    currentStreak: number;
    totalExamsCompleted: number;
    averageScore: number;
  };
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    mostActiveDay: string;
    learningVelocity: number;
    retentionRate: number;
  };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    activityType: 'exam' | 'section' | 'chapter';
    activityTitle: string;
    score?: number;
    completedAt: string;
    timeSpent: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastActivity: string;
    totalSections: number;
    completedSections: number;
    averageScore: number;
    estimatedTimeToComplete: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  aiRecommendations: Array<{
    type: 'study_schedule' | 'weak_areas' | 'course_recommendation' | 'learning_strategy';
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    iconType: 'streak' | 'completion' | 'score' | 'time' | 'cognitive';
    unlockedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

interface UseLearningAnalyticsReturn {
  data: LearningAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLearningAnalytics(
  timeframe: 'week' | 'month' | 'semester' | 'all' = 'month'
): UseLearningAnalyticsReturn {
  const [data, setData] = useState<LearningAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchAnalytics = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/learning-analytics/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeframe }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();

      if (result.success && result.analytics) {
        setData(result.analytics);
      } else {
        throw new Error(result.error || 'Invalid response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

// Helper to format study time
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`;
}

// Helper to get status from progress
export function getProgressStatus(
  currentProgress: number,
  targetProgress: number
): 'ahead' | 'on_track' | 'behind' | 'at_risk' {
  const diff = currentProgress - targetProgress;
  if (diff >= 10) return 'ahead';
  if (diff >= -5) return 'on_track';
  if (diff >= -20) return 'behind';
  return 'at_risk';
}
