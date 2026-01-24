/**
 * SAM Agentic Analytics Hook
 *
 * Unified hook that combines data from multiple SAM agentic APIs
 * for the analytics dashboard. This replaces the legacy
 * useLearningAnalytics hook with real SAM AI-powered data.
 *
 * APIs consumed:
 * - /api/sam/agentic/analytics/progress
 * - /api/sam/agentic/behavior/predictions
 * - /api/sam/agentic/behavior/patterns
 * - /api/sam/agentic/goals
 * - /api/sam/agentic/journey
 * - /api/sam/agentic/recommendations
 * - /api/sam/agentic/behavior/interventions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SAMProgressReport {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalStudyTime: number;
  sessionsCompleted: number;
  topicsStudied: string[];
  skillsImproved: string[];
  goalsProgress: Array<{
    goalId: string;
    title: string;
    progress: number;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  streak: number;
  generatedAt: string;
}

export interface SAMBehaviorPrediction {
  churn?: {
    probability: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    timeToChurn?: number;
    recommendedInterventions: string[];
  };
  struggle?: {
    probability: number;
    areas: Array<{
      area: string;
      severity: 'low' | 'medium' | 'high';
      suggestedSupport: string;
    }>;
    recommendedSupport: string[];
  };
  anomalies?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: string;
  }>;
}

export interface SAMBehaviorPattern {
  id: string;
  type: string;
  name: string;
  description: string;
  confidence: number;
  detectedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SAMSubGoal {
  id: string;
  title: string;
  status: string;
  order: number;
  type?: string;
  estimatedMinutes?: number;
  completedAt?: string | null;
  metadata?: {
    weekNumber?: number;
    weekTitle?: string;
    dayNumber?: number;
    scheduledDate?: string;
    taskType?: string;
  };
}

export interface SAMGoalMetadata {
  planType?: string;
  totalWeeks?: number;
  totalTasks?: number;
  estimatedHours?: number;
  milestones?: Array<{
    afterWeek: number;
    title: string;
    description?: string;
  }>;
  preferences?: {
    learningStyles?: string[];
    motivation?: string;
    startDate?: string;
    targetEndDate?: string;
  };
}

export interface SAMGoal {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate?: string;
  createdAt: string;
  subGoals: SAMSubGoal[];
  metadata?: SAMGoalMetadata;
}

export interface SAMJourneySummary {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalMilestones: number;
  completedMilestones: number;
}

export interface SAMRecommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  targetUrl?: string;
  metadata?: {
    resourceId?: string;
    difficulty?: string;
    confidence?: number;
  };
}

export interface SAMIntervention {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'pending' | 'executed' | 'dismissed' | 'expired';
  suggestedActions: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    targetUrl?: string;
  }>;
  createdAt: string;
  expiresAt?: string;
}

export interface SAMAgenticAnalytics {
  // Progress data
  progress: SAMProgressReport | null;

  // Behavior predictions
  predictions: SAMBehaviorPrediction | null;

  // Detected patterns
  patterns: SAMBehaviorPattern[];

  // Goals summary
  goals: {
    items: SAMGoal[];
    total: number;
    active: number;
    completed: number;
  };

  // Learning journey
  journey: {
    summary: SAMJourneySummary;
    overallProgress: number;
  } | null;

  // AI recommendations
  recommendations: {
    items: SAMRecommendation[];
    totalEstimatedTime: number;
    generatedAt: string;
  } | null;

  // Pending interventions
  interventions: SAMIntervention[];

  // Computed metrics
  computed: {
    learningScore: number;
    healthStatus: 'excellent' | 'good' | 'needs_attention' | 'at_risk';
    primaryStrengths: string[];
    areasForGrowth: string[];
    nextActions: string[];
  };

  // Metadata
  lastUpdated: Date;
  isStale: boolean;
}

interface UseSAMAgenticAnalyticsOptions {
  /** Time period for progress data */
  period?: 'daily' | 'weekly' | 'monthly';
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Available time for recommendations (minutes) */
  availableTime?: number;
}

interface UseSAMAgenticAnalyticsReturn {
  data: SAMAgenticAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isStale: boolean;
  /** Individual loading states */
  loadingStates: {
    progress: boolean;
    predictions: boolean;
    patterns: boolean;
    goals: boolean;
    journey: boolean;
    recommendations: boolean;
    interventions: boolean;
  };
}

// ============================================================================
// FETCH HELPERS
// ============================================================================

async function fetchWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      cache: 'no-store', // Ensure fresh data on each fetch
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// ============================================================================
// COMPUTE HELPERS
// ============================================================================

function computeLearningScore(
  progress: SAMProgressReport | null,
  predictions: SAMBehaviorPrediction | null,
  journey: { summary: SAMJourneySummary } | null
): number {
  let score = 50; // Base score

  if (progress) {
    // Study time contribution (max +15)
    const studyHours = progress.totalStudyTime / 60;
    score += Math.min(studyHours * 2, 15);

    // Streak contribution (max +10)
    score += Math.min(progress.streak * 2, 10);

    // Topics studied contribution (max +10)
    score += Math.min(progress.topicsStudied.length * 2, 10);
  }

  if (predictions?.churn) {
    // Lower churn risk = higher score (max +10)
    score += (1 - predictions.churn.probability) * 10;
  }

  if (journey?.summary) {
    // Goals completion contribution (max +5)
    const goalCompletion = journey.summary.totalGoals > 0
      ? journey.summary.completedGoals / journey.summary.totalGoals
      : 0;
    score += goalCompletion * 5;
  }

  return Math.round(Math.min(Math.max(score, 0), 100));
}

function computeHealthStatus(
  predictions: SAMBehaviorPrediction | null,
  progress: SAMProgressReport | null
): 'excellent' | 'good' | 'needs_attention' | 'at_risk' {
  if (predictions?.churn?.riskLevel === 'high') {
    return 'at_risk';
  }

  if (predictions?.struggle?.probability && predictions.struggle.probability > 0.7) {
    return 'needs_attention';
  }

  if (!progress || progress.streak === 0) {
    return 'needs_attention';
  }

  if (progress.streak >= 7 && progress.sessionsCompleted >= 5) {
    return 'excellent';
  }

  return 'good';
}

function computeNextActions(
  recommendations: SAMRecommendation[],
  interventions: SAMIntervention[],
  predictions: SAMBehaviorPrediction | null
): string[] {
  const actions: string[] = [];

  // Add high-priority interventions first
  interventions
    .filter(i => i.status === 'pending' && i.priority === 'high')
    .slice(0, 2)
    .forEach(i => actions.push(i.message));

  // Add top recommendations
  recommendations
    .filter(r => r.priority === 'high')
    .slice(0, 2)
    .forEach(r => actions.push(r.title));

  // Add prediction-based actions
  if (predictions?.churn?.recommendedInterventions) {
    predictions.churn.recommendedInterventions
      .slice(0, 1)
      .forEach(action => actions.push(action));
  }

  return actions.slice(0, 5);
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSAMAgenticAnalytics(
  options: UseSAMAgenticAnalyticsOptions = {}
): UseSAMAgenticAnalyticsReturn {
  const {
    period = 'weekly',
    refreshInterval = 0,
    enabled = true,
    availableTime = 60,
  } = options;

  const [data, setData] = useState<SAMAgenticAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    progress: false,
    predictions: false,
    patterns: false,
    goals: false,
    journey: false,
    recommendations: false,
    interventions: false,
  });

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (!enabled || isFetchingRef.current) return;

    isFetchingRef.current = true;

    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    // Set all loading states to true
    setLoadingStates({
      progress: true,
      predictions: true,
      patterns: true,
      goals: true,
      journey: true,
      recommendations: true,
      interventions: true,
    });

    try {
      const startTime = performance.now();

      // Fetch all APIs in parallel
      const [
        progressResult,
        predictionsResult,
        patternsResult,
        goalsResult,
        journeyResult,
        recommendationsResult,
        interventionsResult,
      ] = await Promise.all([
        fetchWithAuth<SAMProgressReport>(`/api/sam/agentic/analytics/progress?period=${period}`),
        fetchWithAuth<{ predictions: SAMBehaviorPrediction }>('/api/sam/agentic/behavior/predictions?type=all'),
        fetchWithAuth<{ patterns: SAMBehaviorPattern[] }>('/api/sam/agentic/behavior/patterns'),
        fetchWithAuth<{ goals: SAMGoal[]; pagination: { total: number } }>('/api/sam/agentic/goals?status=active&limit=20'),
        fetchWithAuth<{ summary: SAMJourneySummary; overallProgress?: number }>('/api/sam/agentic/journey?include=summary'),
        fetchWithAuth<{ recommendations: SAMRecommendation[]; totalEstimatedTime: number; generatedAt: string }>(
          `/api/sam/agentic/recommendations?time=${availableTime}&limit=10`
        ),
        fetchWithAuth<{ interventions: SAMIntervention[] }>('/api/sam/agentic/behavior/interventions?pending=true&limit=10'),
      ]);

      // Extract data with fallbacks
      const progress = progressResult.data ?? null;
      const predictions = predictionsResult.data?.predictions ?? null;
      const patterns = patternsResult.data?.patterns ?? [];
      const goals = goalsResult.data?.goals ?? [];
      const goalsPagination = goalsResult.data?.pagination ?? { total: 0 };
      const journey = journeyResult.data ?? null;
      const recommendations = recommendationsResult.data ?? null;
      const interventions = interventionsResult.data?.interventions ?? [];

      // Compute derived metrics
      const learningScore = computeLearningScore(progress, predictions, journey);
      const healthStatus = computeHealthStatus(predictions, progress);
      const nextActions = computeNextActions(
        recommendations?.recommendations ?? [],
        interventions,
        predictions
      );

      const primaryStrengths = progress?.strengths ?? [];
      const areasForGrowth = progress?.areasForImprovement ?? [];

      // Calculate goals stats
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;

      // Build the unified analytics object
      const analytics: SAMAgenticAnalytics = {
        progress,
        predictions,
        patterns,
        goals: {
          items: goals,
          total: goalsPagination.total,
          active: activeGoals,
          completed: completedGoals,
        },
        journey: journey ? {
          summary: journey.summary,
          overallProgress: journey.overallProgress ?? 0,
        } : null,
        recommendations: recommendations ? {
          items: recommendations.recommendations,
          totalEstimatedTime: recommendations.totalEstimatedTime,
          generatedAt: recommendations.generatedAt,
        } : null,
        interventions,
        computed: {
          learningScore,
          healthStatus,
          primaryStrengths,
          areasForGrowth,
          nextActions,
        },
        lastUpdated: new Date(),
        isStale: false,
      };

      setData(analytics);
      lastFetchTimeRef.current = Date.now();
      setIsStale(false);

      const duration = performance.now() - startTime;

      logger.info('[SAM_AGENTIC_ANALYTICS] Data fetched', {
        duration: `${duration.toFixed(2)}ms`,
        isRefresh,
        hasProgress: !!progress,
        hasPredictions: !!predictions,
        patternsCount: patterns.length,
        goalsCount: goals.length,
        recommendationsCount: recommendations?.recommendations?.length ?? 0,
        interventionsCount: interventions.length,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      logger.error('[SAM_AGENTIC_ANALYTICS] Error:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      setLoadingStates({
        progress: false,
        predictions: false,
        patterns: false,
        goals: false,
        journey: false,
        recommendations: false,
        interventions: false,
      });
    }
  }, [enabled, period, availableTime]);

  // Initial fetch
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const intervalId = setInterval(() => {
      fetchAllData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchAllData]);

  // Mark as stale after 5 minutes
  useEffect(() => {
    if (lastFetchTimeRef.current === 0) return;

    const staleTimeout = setTimeout(() => {
      setIsStale(true);
      setData(prev => prev ? { ...prev, isStale: true } : null);
    }, 5 * 60 * 1000);

    return () => clearTimeout(staleTimeout);
  }, [data?.lastUpdated]);

  const refresh = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale,
    loadingStates,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for just behavior predictions
 */
export function useSAMPredictions() {
  const { data, loading, error, refresh } = useSAMAgenticAnalytics();
  return {
    predictions: data?.predictions ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for just goals data
 */
export function useSAMGoals() {
  const { data, loading, error, refresh } = useSAMAgenticAnalytics();
  const goalsData = data?.goals ?? { items: [], total: 0, active: 0, completed: 0 };

  // Ensure items is always an array (defensive programming)
  const items = Array.isArray(goalsData.items) ? goalsData.items : [];

  return {
    goals: items,
    totalGoals: goalsData.total ?? 0,
    activeGoals: goalsData.active ?? 0,
    completedGoals: goalsData.completed ?? 0,
    avgProgress: items.length > 0
      ? Math.round(items.reduce((sum, g) => sum + (g.progress ?? 0), 0) / items.length)
      : 0,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for learning health score
 */
export function useSAMLearningHealth() {
  const { data, loading } = useSAMAgenticAnalytics();
  return {
    healthStatus: data?.computed.healthStatus ?? 'needs_attention',
    learningScore: data?.computed.learningScore ?? 0,
    churnRisk: data?.predictions?.churn?.probability ?? 0,
    struggleRisk: data?.predictions?.struggle?.probability ?? 0,
    score: data?.computed.learningScore ?? 0,
    status: data?.computed.healthStatus ?? 'needs_attention',
    loading,
  };
}

/**
 * Hook for interventions with actions
 */
export function useSAMInterventions() {
  const { data, loading, error, refresh } = useSAMAgenticAnalytics();

  // Dismiss an intervention
  const dismissIntervention = useCallback(async (interventionId: string) => {
    try {
      const response = await fetch(`/api/sam/agentic/behavior/interventions/${interventionId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss intervention');
      }

      // Refresh data to get updated list
      await refresh();
    } catch (err) {
      logger.error('Error dismissing intervention:', err);
      throw err;
    }
  }, [refresh]);

  // Submit a check-in response
  const submitCheckIn = useCallback(async (response: 'good' | 'struggling' | 'need_help') => {
    try {
      const res = await fetch('/api/sam/agentic/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mood',
          response,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit check-in');
      }

      // Refresh data to get any new interventions based on response
      await refresh();
    } catch (err) {
      logger.error('Error submitting check-in:', err);
      throw err;
    }
  }, [refresh]);

  return {
    interventions: data?.interventions ?? [],
    pendingCount: data?.interventions?.filter(i => i.status === 'pending').length ?? 0,
    loading,
    error,
    refresh,
    dismissIntervention,
    submitCheckIn,
  };
}

export default useSAMAgenticAnalytics;
