/**
 * SAM Unified Analytics Hook
 *
 * Fetches comprehensive analytics from all SAM AI engines
 * for display in the user analytics dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { BloomsLevel } from '@sam-ai/core';

// Types matching the API response
export interface SAMUnifiedAnalytics {
  userId: string;
  generatedAt: Date;
  practiceProblems: PracticeAnalytics;
  learningStyle: LearningStyleAnalytics;
  socraticDialogue: SocraticAnalytics;
  predictions: PredictiveAnalytics;
  retention: RetentionAnalytics;
  achievements: AchievementAnalytics;
  cognitiveProgress: CognitiveAnalytics;
  overallHealth: OverallHealthScore;
}

export interface PracticeAnalytics {
  totalAttempts: number;
  correctAnswers: number;
  averageScore: number;
  totalPoints: number;
  totalTimeMinutes: number;
  hintsUsed: number;
  currentStreak: number;
  bestStreak: number;
  byDifficulty: Record<string, { attempts: number; correct: number }>;
  byBloomsLevel: Record<BloomsLevel, { attempts: number; correct: number }>;
  masteredConcepts: string[];
  conceptsNeedingReview: string[];
  difficultyProgression: { date: string; difficulty: string }[];
  recentProblems: { id: string; title: string; isCorrect: boolean; timestamp: Date }[];
}

export interface LearningStyleAnalytics {
  primaryStyle: string;
  secondaryStyle: string | null;
  styleScores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  preferredFormats: string[];
  preferredComplexity: string;
  readingPace: string;
  bestLearningTime: number | null;
  confidence: number;
  recommendations: string[];
  formatEngagement: { format: string; engagementScore: number }[];
}

export interface SocraticAnalytics {
  totalDialogues: number;
  averageExchanges: number;
  insightsDiscovered: number;
  averageQuality: number;
  averageThinkingDepth: number;
  highestBloomsAchieved: BloomsLevel;
  completionRate: number;
  hintsUsed: number;
  growthAreas: string[];
  improvementAreas: string[];
  recentDialogues: {
    id: string;
    topic: string;
    insightsDiscovered: number;
    quality: number;
    completedAt: Date;
  }[];
}

export interface PredictiveAnalytics {
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: { factor: string; severity: string; description: string }[];
  successFactors: { factor: string; strength: string; description: string }[];
  recommendedActions: {
    type: string;
    priority: string;
    action: string;
    expectedImpact: number;
  }[];
  learningVelocity: {
    current: number;
    optimal: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  predictedCompletionDate: Date | null;
}

export interface RetentionAnalytics {
  overallRetention: number;
  spacedRepetitionSchedule: {
    conceptId: string;
    concept: string;
    nextReviewDate: Date;
    masteryLevel: number;
    reviewCount: number;
  }[];
  topicsNeedingReview: string[];
  masteryLevels: { topic: string; mastery: number }[];
  forgettingCurve: { daysAgo: number; retentionPercent: number }[];
  studyPatterns: {
    preferredTime: string;
    averageSessionLength: number;
    consistencyScore: number;
  };
}

export interface AchievementAnalytics {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  totalAchievements: number;
  unlockedAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedAt: Date;
  }[];
  activeChallenges: {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    expiresAt: Date | null;
  }[];
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  badges: { type: string; level: number; description: string }[];
  recommendations: { id: string; name: string; description: string }[];
}

export interface CognitiveAnalytics {
  bloomsDistribution: Record<BloomsLevel, number>;
  currentLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  progressByLevel: {
    level: BloomsLevel;
    score: number;
    attempts: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  strengthAreas: BloomsLevel[];
  growthOpportunities: BloomsLevel[];
  recentAssessments: {
    id: string;
    bloomsLevel: BloomsLevel;
    score: number;
    date: Date;
  }[];
}

export interface OverallHealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    practice: number;
    engagement: number;
    retention: number;
    progress: number;
    consistency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  nextSteps: string[];
}

interface UseSAMUnifiedAnalyticsReturn {
  data: SAMUnifiedAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isStale: boolean;
}

/**
 * Hook for fetching SAM unified analytics data
 *
 * @param options - Configuration options
 * @returns Analytics data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useSAMUnifiedAnalytics();
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error} />;
 *
 * return <Dashboard data={data} />;
 * ```
 */
export function useSAMUnifiedAnalytics(options?: {
  refreshInterval?: number;
  enabled?: boolean;
}): UseSAMUnifiedAnalyticsReturn {
  const { refreshInterval = 0, enabled = true } = options || {};

  const [data, setData] = useState<SAMUnifiedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      const startTime = performance.now();

      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/sam/unified-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your analytics');
        }
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch analytics');
      }

      setData(result.data);
      setLastFetchTime(Date.now());
      setIsStale(false);

      const duration = performance.now() - startTime;
      logger.info('[SAM_ANALYTICS_HOOK] Data fetched', {
        duration: `${duration.toFixed(2)}ms`,
        isRefresh,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      logger.error('[SAM_ANALYTICS_HOOK] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

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
    if (lastFetchTime === 0) return;

    const staleTimeout = setTimeout(() => {
      setIsStale(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(staleTimeout);
  }, [lastFetchTime]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale,
  };
}

/**
 * Hook for fetching specific sections of SAM analytics
 */
export function useSAMAnalyticsSection<K extends keyof SAMUnifiedAnalytics>(
  section: K,
  options?: { enabled?: boolean }
): {
  data: SAMUnifiedAnalytics[K] | null;
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useSAMUnifiedAnalytics(options);

  return {
    data: data ? data[section] : null,
    loading,
    error,
  };
}

/**
 * Hook for getting overall health score
 */
export function useSAMHealthScore(): {
  score: number;
  grade: string;
  trend: string;
  loading: boolean;
} {
  const { data, loading } = useSAMUnifiedAnalytics();

  return {
    score: data?.overallHealth.score ?? 0,
    grade: data?.overallHealth.grade ?? 'N/A',
    trend: data?.overallHealth.trend ?? 'stable',
    loading,
  };
}
