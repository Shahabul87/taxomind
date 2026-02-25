/**
 * Tests for useLearningStreak hook
 * Source: hooks/use-learning-streak.ts
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLearningStreak } from '@/hooks/use-learning-streak';

const mockStreakResponse = {
  success: true,
  data: {
    streak: {
      current: 5,
      longest: 12,
      status: 'active' as const,
      daysSinceActive: 0,
      streakStartDate: '2024-01-01T00:00:00Z',
      lastActiveDate: '2024-01-10T00:00:00Z',
    },
    freezes: { available: 2, used: 1, lastUsed: null },
    weeklyProgress: {
      goalMinutes: 300,
      completedMinutes: 180,
      goalHours: 5,
      completedHours: 3,
      progress: 60,
      weekStart: '2024-01-08',
      weekEnd: '2024-01-14',
    },
    statistics: {
      totalActiveDays: 50,
      totalMinutesAllTime: 3000,
      averageDailyMinutes: 60,
      activeDaysLast30: 20,
      totalMinutesLast30: 1200,
      avgMinutesPerActiveDay: 60,
    },
    activityCalendar: [
      { date: '2024-01-10', minutes: 45, level: 2 as const, isToday: true },
    ],
  },
};

describe('useLearningStreak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockStreakResponse),
    });
  });

  it('returns current streak count', async () => {
    const { result } = renderHook(() => useLearningStreak());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streakInfo?.currentStreak).toBe(5);
    expect(result.current.streakInfo?.longestStreak).toBe(12);
  });

  it('detects active streak', async () => {
    const { result } = renderHook(() => useLearningStreak());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streakStatus).toBe('active');
  });

  it('detects broken streak', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...mockStreakResponse.data,
            streak: { ...mockStreakResponse.data.streak, status: 'broken', current: 0 },
          },
        }),
    });

    const { result } = renderHook(() => useLearningStreak());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streakStatus).toBe('broken');
    expect(result.current.streakInfo?.currentStreak).toBe(0);
  });

  it('calculates longest streak', async () => {
    const { result } = renderHook(() => useLearningStreak());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.streakInfo?.longestStreak).toBe(12);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useLearningStreak());
    expect(result.current.isLoading).toBe(true);
  });

  it('handles API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useLearningStreak());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch streak data');
    expect(result.current.streakInfo).toBeNull();
  });
});
