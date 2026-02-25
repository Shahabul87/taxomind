/**
 * Tests for useGamification and related hooks
 * Source: hooks/use-gamification.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';

jest.mock('@/types/gamification', () => ({
  LeaderboardPeriod: { WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY', ALL_TIME: 'ALL_TIME' },
  XPSource: { COURSE_COMPLETION: 'COURSE_COMPLETION' },
  AchievementCategory: { LEARNING: 'LEARNING' },
}));

const mockFetch = global.fetch as jest.Mock;

import { useGamification, useXP, useAchievements, useLeaderboard } from '@/hooks/use-gamification';

describe('useGamification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDashboardData = {
    xp: { totalXP: 500, level: 5, xpInCurrentLevel: 100, xpToNextLevel: 200 },
    recentAchievements: [{ id: 'ach-1', name: 'First Steps' }],
    leaderboard: [{ userId: 'user-1', rank: 1, xp: 500 }],
    streak: { current: 7, longest: 14, todayActive: true, freezesAvailable: 2 },
  };

  it('should fetch gamification dashboard on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    const { result } = renderHook(() => useGamification());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.xp).toEqual(mockDashboardData.xp);
    expect(result.current.achievements).toEqual(mockDashboardData.recentAchievements);
    expect(result.current.streak.current).toBe(7);
    expect(result.current.streak.todayActive).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Failed to fetch gamification data' },
      }),
    });

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch gamification data');
  });

  it('should award XP and detect level up', async () => {
    // First call: initial dashboard fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second call: award XP
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          levelUp: true,
          newLevel: 6,
          achievementsUnlocked: [{ id: 'ach-new', name: 'Level 6!' }],
        },
      }),
    });

    // Third call: refreshDashboard after XP award
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    let awardResult: { success: boolean; levelUp: boolean; newLevel?: number } | undefined;
    await act(async () => {
      awardResult = await result.current.awardXP(
        100,
        'COURSE_COMPLETION',
        'Completed TypeScript course',
        'course-1'
      );
    });

    expect(awardResult?.success).toBe(true);
    expect(awardResult?.levelUp).toBe(true);
    expect(awardResult?.newLevel).toBe(6);
  });

  it('should handle XP award failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Failed to award XP' },
      }),
    });

    let awardResult: { success: boolean; levelUp: boolean } | undefined;
    await act(async () => {
      awardResult = await result.current.awardXP(100, 'COURSE_COMPLETION', 'Test');
    });

    expect(awardResult?.success).toBe(false);
    expect(awardResult?.levelUp).toBe(false);
  });

  it('should support refreshData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshData();
    });

    // Should have been called twice (initial + refresh)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should track streak data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    });

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streak.current).toBe(7);
    expect(result.current.streak.longest).toBe(14);
    expect(result.current.streak.freezesAvailable).toBe(2);
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGamification());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });
});

describe('useXP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch XP data and calculate level progress', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          xp: { totalXP: 500, level: 5, xpInCurrentLevel: 100, xpToNextLevel: 200 },
          streak: { current: 3, longest: 10, maintained: true, freezeUsed: false },
        },
      }),
    });

    const { result } = renderHook(() => useXP());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.xp?.level).toBe(5);
    expect(result.current.levelProgress).toBe(50); // 100/200 * 100
    expect(result.current.streak?.current).toBe(3);
  });
});

describe('useAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch achievements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          achievements: [{ id: 'ua-1' }],
          allAchievements: [{ id: 'a-1' }, { id: 'a-2' }],
          stats: { totalUnlocked: 1, totalAvailable: 2, byCategory: {}, byRarity: {} },
        },
      }),
    });

    const { result } = renderHook(() => useAchievements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.achievements).toHaveLength(1);
    expect(result.current.allAchievements).toHaveLength(2);
    expect(result.current.stats?.totalUnlocked).toBe(1);
  });
});

describe('useLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch leaderboard entries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          entries: [{ userId: 'u1', rank: 1, xp: 1000 }],
          currentUserEntry: { userId: 'u1', rank: 1, xp: 1000 },
          totalParticipants: 50,
        },
      }),
    });

    const { result } = renderHook(() => useLeaderboard({ period: 'WEEKLY' as never }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.currentUserEntry?.rank).toBe(1);
    expect(result.current.totalParticipants).toBe(50);
  });
});
