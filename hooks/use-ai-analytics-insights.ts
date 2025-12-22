"use client";

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// ==========================================
// AI Analytics Insights Hook
// ==========================================
// Fetches AI-powered personalized learning insights

export interface AIInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    href: string;
  };
  metric?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
}

export interface AIInsightsMetadata {
  userId: string;
  generatedAt: string;
  view: string;
  focusArea?: string;
  hasLearningData: boolean;
  hasCreatorData: boolean;
}

export type InsightsView = 'all' | 'learner' | 'creator';
export type FocusArea = 'progress' | 'performance' | 'engagement' | 'cognitive' | 'recommendations';

interface UseAIInsightsOptions {
  view?: InsightsView;
  focusArea?: FocusArea;
  autoFetch?: boolean;
}

interface UseAIInsightsReturn {
  insights: AIInsight[];
  metadata: AIInsightsMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getInsightsByType: (type: AIInsight['type']) => AIInsight[];
  getHighPriorityInsights: () => AIInsight[];
}

export function useAIAnalyticsInsights(
  options: UseAIInsightsOptions = {}
): UseAIInsightsReturn {
  const {
    view = 'all',
    focusArea,
    autoFetch = true,
  } = options;

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metadata, setMetadata] = useState<AIInsightsMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ view });
      if (focusArea) {
        params.append('focusArea', focusArea);
      }

      const response = await fetch(`/api/analytics/ai-insights?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch insights');
      }

      setInsights(result.insights || []);
      setMetadata(result.metadata || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights';
      setError(errorMessage);
      logger.error('[AI_INSIGHTS] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [view, focusArea]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchInsights();
    }
  }, [fetchInsights, autoFetch]);

  // Get insights filtered by type
  const getInsightsByType = useCallback(
    (type: AIInsight['type']) => {
      return insights.filter((insight) => insight.type === type);
    },
    [insights]
  );

  // Get high priority insights
  const getHighPriorityInsights = useCallback(() => {
    return insights.filter((insight) => insight.priority === 'high');
  }, [insights]);

  return {
    insights,
    metadata,
    loading,
    error,
    refetch: fetchInsights,
    getInsightsByType,
    getHighPriorityInsights,
  };
}

/**
 * Helper hook to get only learner insights
 */
export function useLearnerInsights(focusArea?: FocusArea) {
  return useAIAnalyticsInsights({
    view: 'learner',
    focusArea,
  });
}

/**
 * Helper hook to get only creator insights
 */
export function useCreatorInsights(focusArea?: FocusArea) {
  return useAIAnalyticsInsights({
    view: 'creator',
    focusArea,
  });
}
