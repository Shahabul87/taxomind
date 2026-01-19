'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type {
  MasteryOverviewResponse,
  HeatmapResponse,
  MilestonesResponse,
  GoalsResponse,
  SessionsResponse,
  SkillMastery,
} from '@/components/sam/practice-dashboard/types';

// ============================================================================
// HOOK TYPES
// ============================================================================

interface UsePracticeDashboardOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePracticeDashboardReturn {
  // Data
  overview: MasteryOverviewResponse | null;
  heatmap: HeatmapResponse | null;
  milestones: MilestonesResponse | null;
  goals: GoalsResponse | null;
  sessions: SessionsResponse | null;
  masteries: SkillMastery[];

  // Loading states
  isLoading: boolean;
  isLoadingOverview: boolean;
  isLoadingHeatmap: boolean;
  isLoadingMilestones: boolean;
  isLoadingGoals: boolean;
  isLoadingSessions: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  refreshOverview: () => Promise<void>;
  refreshHeatmap: (year?: number) => Promise<void>;
  refreshMilestones: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  claimMilestone: (milestoneId: string) => Promise<boolean>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function usePracticeDashboard(
  options: UsePracticeDashboardOptions = {}
): UsePracticeDashboardReturn {
  const { enabled = true, autoRefresh = false, refreshInterval = 60000 } = options;
  const { toast } = useToast();

  // Data state
  const [overview, setOverview] = useState<MasteryOverviewResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [milestones, setMilestones] = useState<MilestonesResponse | null>(null);
  const [goals, setGoals] = useState<GoalsResponse | null>(null);
  const [sessions, setSessions] = useState<SessionsResponse | null>(null);

  // Loading states
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refs for stable callbacks
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived loading state
  const isLoading =
    isLoadingOverview ||
    isLoadingHeatmap ||
    isLoadingMilestones ||
    isLoadingGoals ||
    isLoadingSessions;

  // Derived masteries list
  const masteries = overview?.topSkills ?? [];

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    setError(null);
    try {
      const response = await fetch('/api/sam/practice/mastery/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch mastery overview');
      }
      const result = await response.json();
      if (result.success) {
        setOverview(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch overview';
      setError(message);
      console.error('[usePracticeDashboard] fetchOverview error:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  const fetchHeatmap = useCallback(async (year?: number) => {
    setIsLoadingHeatmap(true);
    try {
      const yearParam = year ?? new Date().getFullYear();
      const response = await fetch(`/api/sam/practice/heatmap?year=${yearParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }
      const result = await response.json();
      if (result.success) {
        setHeatmap(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[usePracticeDashboard] fetchHeatmap error:', err);
    } finally {
      setIsLoadingHeatmap(false);
    }
  }, []);

  const fetchMilestones = useCallback(async () => {
    setIsLoadingMilestones(true);
    try {
      const response = await fetch('/api/sam/practice/milestones?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }
      const result = await response.json();
      if (result.success) {
        setMilestones(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[usePracticeDashboard] fetchMilestones error:', err);
    } finally {
      setIsLoadingMilestones(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setIsLoadingGoals(true);
    try {
      const response = await fetch('/api/sam/practice/goals?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const result = await response.json();
      if (result.success) {
        setGoals(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[usePracticeDashboard] fetchGoals error:', err);
    } finally {
      setIsLoadingGoals(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch('/api/sam/practice/sessions?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[usePracticeDashboard] fetchSessions error:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // ============================================================================
  // REFRESH FUNCTIONS
  // ============================================================================

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchOverview(),
      fetchHeatmap(),
      fetchMilestones(),
      fetchGoals(),
      fetchSessions(),
    ]);
  }, [fetchOverview, fetchHeatmap, fetchMilestones, fetchGoals, fetchSessions]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const claimMilestone = useCallback(
    async (milestoneId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/sam/practice/milestones/${milestoneId}/claim`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to claim milestone');
        }

        const result = await response.json();

        if (result.success) {
          toast({
            title: 'Milestone Claimed!',
            description: `You earned ${result.data.xpAwarded} XP!`,
          });

          // Refresh milestones to update the list
          await fetchMilestones();
          return true;
        }

        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to claim milestone';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return false;
      }
    },
    [fetchMilestones, toast]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && enabled) {
      refreshIntervalRef.current = setInterval(() => {
        fetchOverview();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, enabled, refreshInterval, fetchOverview]);

  return {
    // Data
    overview,
    heatmap,
    milestones,
    goals,
    sessions,
    masteries,

    // Loading states
    isLoading,
    isLoadingOverview,
    isLoadingHeatmap,
    isLoadingMilestones,
    isLoadingGoals,
    isLoadingSessions,

    // Error states
    error,

    // Actions
    refresh,
    refreshOverview: fetchOverview,
    refreshHeatmap: fetchHeatmap,
    refreshMilestones: fetchMilestones,
    refreshGoals: fetchGoals,
    refreshSessions: fetchSessions,
    claimMilestone,
  };
}

export default usePracticeDashboard;
