/**
 * Gamification Hooks
 * React hooks for the enhanced gamification system
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type UserXP,
  type UserAchievement,
  type Achievement,
  type LeaderboardEntry,
  type GamificationPreferences,
  type GamificationDashboardData,
  LeaderboardPeriod,
  XPSource,
  AchievementCategory,
} from '@/types/gamification';

// ==========================================
// Types
// ==========================================

interface GamificationState {
  xp: UserXP | null;
  achievements: UserAchievement[];
  leaderboard: LeaderboardEntry[];
  preferences: GamificationPreferences | null;
  streak: {
    current: number;
    longest: number;
    todayActive: boolean;
    freezesAvailable: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface AwardXPResult {
  success: boolean;
  levelUp: boolean;
  newLevel?: number;
  achievementsUnlocked?: Achievement[];
}

// ==========================================
// useGamification - Main Hook
// ==========================================

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    xp: null,
    achievements: [],
    leaderboard: [],
    preferences: null,
    streak: {
      current: 0,
      longest: 0,
      todayActive: false,
      freezesAvailable: 0,
    },
    isLoading: true,
    error: null,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/gamification', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch gamification data');
      }

      const data: GamificationDashboardData = result.data;

      setState((prev) => ({
        ...prev,
        xp: data.xp,
        achievements: data.recentAchievements,
        leaderboard: data.leaderboard,
        streak: data.streak,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const awardXP = useCallback(
    async (
      amount: number,
      source: XPSource,
      description: string,
      sourceId?: string
    ): Promise<AwardXPResult> => {
      try {
        const response = await fetch('/api/gamification/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount, source, description, sourceId }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to award XP');
        }

        // Refresh dashboard data
        await fetchDashboard();

        return {
          success: true,
          levelUp: result.data.levelUp,
          newLevel: result.data.newLevel,
          achievementsUnlocked: result.data.achievementsUnlocked,
        };
      } catch (err) {
        console.error('Failed to award XP:', err);
        return { success: false, levelUp: false };
      }
    },
    [fetchDashboard]
  );

  const refreshData = useCallback(() => {
    return fetchDashboard();
  }, [fetchDashboard]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...state,
    awardXP,
    refreshData,
  };
}

// ==========================================
// useXP - XP specific hook
// ==========================================

export function useXP() {
  const [xp, setXP] = useState<UserXP | null>(null);
  const [streak, setStreak] = useState<{
    current: number;
    longest: number;
    maintained: boolean;
    freezeUsed: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchXP = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/gamification/xp', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch XP data');
      }

      setXP(result.data.xp);
      setStreak(result.data.streak);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchXP();
  }, [fetchXP]);

  // Calculate level progress percentage
  const levelProgress = xp
    ? Math.min((xp.xpInCurrentLevel / xp.xpToNextLevel) * 100, 100)
    : 0;

  return {
    xp,
    streak,
    levelProgress,
    isLoading,
    error,
    refetch: fetchXP,
  };
}

// ==========================================
// useAchievements - Achievements specific hook
// ==========================================

interface UseAchievementsOptions {
  unlockedOnly?: boolean;
  category?: AchievementCategory;
}

export function useAchievements(options: UseAchievementsOptions = {}) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<{
    totalUnlocked: number;
    totalAvailable: number;
    byCategory: Record<string, { unlocked: number; total: number }>;
    byRarity: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.unlockedOnly) params.set('unlockedOnly', 'true');
      if (options.category) params.set('category', options.category);

      const response = await fetch(`/api/gamification/achievements?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch achievements');
      }

      setAchievements(result.data.achievements);
      setAllAchievements(result.data.allAchievements);
      setStats(result.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options.unlockedOnly, options.category]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    allAchievements,
    stats,
    isLoading,
    error,
    refetch: fetchAchievements,
  };
}

// ==========================================
// useLeaderboard - Leaderboard specific hook
// ==========================================

interface UseLeaderboardOptions {
  period?: LeaderboardPeriod;
  limit?: number;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { period = LeaderboardPeriod.WEEKLY, limit = 100 } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/gamification/leaderboard?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch leaderboard');
      }

      setEntries(result.data.entries);
      setCurrentUserEntry(result.data.currentUserEntry || null);
      setTotalParticipants(result.data.totalParticipants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    currentUserEntry,
    totalParticipants,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  };
}

// ==========================================
// useGamificationPreferences - Preferences hook
// ==========================================

export function useGamificationPreferences() {
  const [preferences, setPreferences] = useState<GamificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/gamification/preferences', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch preferences');
      }

      setPreferences(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<GamificationPreferences>) => {
      try {
        setIsSaving(true);
        setError(null);

        const response = await fetch('/api/gamification/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to update preferences');
        }

        setPreferences(result.data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
