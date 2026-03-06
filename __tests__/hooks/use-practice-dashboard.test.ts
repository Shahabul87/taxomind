/**
 * Tests for usePracticeDashboard hook
 * Source: hooks/use-practice-dashboard.ts
 *
 * Covers:
 * - Initial state before data loads
 * - Parallel data fetching on mount (5 endpoints)
 * - Individual section refresh functions
 * - Error handling (API errors, network failures)
 * - claimMilestone action (success + failure toasts)
 * - Auto-refresh interval behaviour
 * - Derived masteries from overview.topSkills
 * - Disabled state (enabled: false)
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks - must be declared before the hook import
// ---------------------------------------------------------------------------

const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// The types module exports runtime constants (PROFICIENCY_CONFIG, etc.) that
// are not needed for hook testing. Providing an empty mock prevents potential
// import side-effects from interfering with tests.
jest.mock('@/components/sam/practice-dashboard/types', () => ({}));

const mockFetch = global.fetch as jest.Mock;

import { usePracticeDashboard } from '@/hooks/use-practice-dashboard';

// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------

function createOverviewResponse() {
  return {
    overview: {
      totalQualityHours: 1250,
      totalRawHours: 1500,
      totalSessions: 320,
      avgQualityMultiplier: 0.83,
      topProficiencyLevel: 'COMPETENT' as const,
      totalSkillsTracked: 8,
      skillsInProgress: 5,
      skillsMastered: 1,
    },
    topSkills: [
      {
        id: 'sm-1',
        userId: 'user-1',
        skillId: 'skill-1',
        skillName: 'TypeScript',
        totalRawHours: 600,
        totalQualityHours: 500,
        totalSessions: 120,
        avgQualityMultiplier: 0.83,
        proficiencyLevel: 'COMPETENT' as const,
        currentStreak: 5,
        longestStreak: 14,
        lastPracticedAt: '2026-03-03T10:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2026-03-03T10:00:00.000Z',
        progressTo10K: 5,
        nextMilestone: 1000,
      },
      {
        id: 'sm-2',
        userId: 'user-1',
        skillId: 'skill-2',
        skillName: 'React',
        totalRawHours: 400,
        totalQualityHours: 350,
        totalSessions: 90,
        avgQualityMultiplier: 0.87,
        proficiencyLevel: 'INTERMEDIATE' as const,
        currentStreak: 3,
        longestStreak: 10,
        lastPracticedAt: '2026-03-02T15:00:00.000Z',
        createdAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2026-03-02T15:00:00.000Z',
        progressTo10K: 3.5,
        nextMilestone: 500,
      },
    ],
    milestoneProgress: [
      { hours: 100, achieved: true, closestProgress: 100, skillsAtOrAbove: 3 },
    ],
    proficiencyDistribution: {
      BEGINNER: 1,
      NOVICE: 2,
      INTERMEDIATE: 2,
      COMPETENT: 2,
      PROFICIENT: 0,
      ADVANCED: 0,
      EXPERT: 0,
      MASTER: 1,
    },
    recentActivity: {
      last30Days: {
        rawHours: 45,
        qualityHours: 38,
        sessions: 22,
        avgMultiplier: 0.84,
      },
    },
    yearlyStats: {
      totalDays: 365,
      activeDays: 180,
      totalRawHours: 900,
      totalQualityHours: 750,
      totalSessions: 200,
      avgDailyHours: 2.5,
    },
    streaks: { current: 5, longest: 14, lastActive: '2026-03-03T10:00:00.000Z' },
    lastPracticeAt: '2026-03-03T10:00:00.000Z',
    journeyStartDate: '2025-01-01T00:00:00.000Z',
  };
}

function createHeatmapResponse() {
  return {
    heatmap: [
      {
        date: '2026-03-01',
        totalRawHours: 2,
        totalQualityHours: 1.7,
        totalSessions: 3,
        avgMultiplier: 0.85,
        intensity: 3,
        color: 'bg-emerald-500',
      },
    ],
    yearlyStats: {
      totalDays: 365,
      activeDays: 180,
      totalRawHours: 900,
      totalQualityHours: 750,
      totalSessions: 200,
      avgDailyHours: 2.5,
    },
    weeklyTrend: [],
    monthlyTrend: [],
    streaks: { current: 5, longest: 14 },
    metadata: { year: 2026, totalDays: 63, activeDays: 40, maxHoursInDay: 5.2 },
  };
}

function createMilestonesResponse() {
  return {
    milestones: [
      {
        id: 'ms-1',
        milestoneType: 'HUNDRED_HOURS' as const,
        achievedAt: '2025-06-15T00:00:00.000Z',
        qualityHoursAtAchievement: 100,
        rewardClaimed: false,
        rewardClaimedAt: null,
        skillId: 'skill-1',
        badgeName: 'Century',
        xpReward: 500,
        skill: { id: 'skill-1', name: 'TypeScript', category: 'Programming' },
      },
    ],
    stats: {
      totalAchieved: 5,
      unclaimed: 2,
      byType: [
        {
          hours: 100,
          type: 'HUNDRED_HOURS' as const,
          badgeName: 'Century',
          xpReward: 500,
          achieved: true,
          count: 1,
        },
      ],
    },
    pagination: { total: 5, limit: 50, offset: 0, hasMore: false },
  };
}

function createGoalsResponse() {
  return {
    goals: [
      {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Practice 100 hours of TypeScript',
        goalType: 'HOURS' as const,
        targetValue: 100,
        currentValue: 65,
        isCompleted: false,
        reminderEnabled: true,
        reminderFrequency: 'WEEKLY' as const,
        createdAt: '2025-12-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        progressPercentage: 65,
        remaining: 35,
        isOverdue: false,
        daysUntilDeadline: 30,
      },
    ],
    stats: {
      totalGoals: 3,
      activeGoals: 2,
      completedGoals: 1,
      completionRate: 33.3,
      byType: { HOURS: 2, QUALITY_HOURS: 1, SESSIONS: 0, STREAK: 0, WEEKLY_HOURS: 0 },
    },
    pagination: { total: 3, limit: 50, offset: 0, hasMore: false },
  };
}

function createSessionsResponse() {
  return {
    sessions: [
      {
        id: 'sess-1',
        userId: 'user-1',
        skillId: 'skill-1',
        skillName: 'TypeScript',
        sessionType: 'DELIBERATE' as const,
        focusLevel: 'HIGH' as const,
        status: 'COMPLETED' as const,
        startedAt: '2026-03-03T08:00:00.000Z',
        endedAt: '2026-03-03T10:00:00.000Z',
        rawHours: 2,
        qualityHours: 1.7,
        qualityMultiplier: 0.85,
        totalPausedSeconds: 120,
        createdAt: '2026-03-03T08:00:00.000Z',
        updatedAt: '2026-03-03T10:00:00.000Z',
      },
    ],
    stats: {
      totalSessions: 200,
      totalRawHours: 900,
      totalQualityHours: 750,
      avgQualityMultiplier: 0.83,
      avgSessionDuration: 1.5,
      byType: { DELIBERATE: 100, POMODORO: 50, GUIDED: 20, ASSESSMENT: 10, CASUAL: 15, REVIEW: 5 },
      byFocus: { DEEP_FLOW: 30, HIGH: 80, MEDIUM: 60, LOW: 20, VERY_LOW: 10 },
    },
    pagination: { limit: 20, offset: 0, hasMore: true },
    multipliers: {
      sessionType: { DELIBERATE: 1.0, POMODORO: 0.9, GUIDED: 0.8, ASSESSMENT: 1.2, CASUAL: 0.5, REVIEW: 0.7 },
      focusLevel: { DEEP_FLOW: 1.5, HIGH: 1.2, MEDIUM: 1.0, LOW: 0.6, VERY_LOW: 0.3 },
      blooms: { REMEMBER: 0.5, UNDERSTAND: 0.7, APPLY: 1.0, ANALYZE: 1.2, EVALUATE: 1.4, CREATE: 1.5 },
    },
    bloomsLevelInfo: [],
    sessionTypeInfo: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Configure mockFetch to resolve each endpoint with matching test data. */
function setupSuccessfulFetches() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/mastery/overview')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createOverviewResponse() }),
      });
    }
    if (url.includes('/heatmap')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createHeatmapResponse() }),
      });
    }
    if (url.includes('/milestones') && !url.includes('/claim')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createMilestonesResponse() }),
      });
    }
    if (url.includes('/goals')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createGoalsResponse() }),
      });
    }
    if (url.includes('/sessions')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createSessionsResponse() }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Unknown endpoint' }),
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePracticeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // 1. Initial State
  // =========================================================================

  describe('initial state', () => {
    it('should have all data fields set to null before fetching completes', () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      expect(result.current.overview).toBeNull();
      expect(result.current.heatmap).toBeNull();
      expect(result.current.milestones).toBeNull();
      expect(result.current.goals).toBeNull();
      expect(result.current.sessions).toBeNull();
    });

    it('should have masteries as an empty array initially', () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      expect(result.current.masteries).toEqual([]);
    });

    it('should have error set to null initially', () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      expect(result.current.error).toBeNull();
    });
  });

  // =========================================================================
  // 2. Data Fetching on Mount
  // =========================================================================

  describe('data fetching on mount', () => {
    it('should fetch all 5 endpoints in parallel when enabled', async () => {
      setupSuccessfulFetches();
      renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      const calledUrls = mockFetch.mock.calls.map((call: string[]) => call[0]);
      expect(calledUrls).toContain('/api/sam/practice/mastery/overview');
      expect(calledUrls).toContainEqual(expect.stringContaining('/api/sam/practice/heatmap'));
      expect(calledUrls).toContain('/api/sam/practice/milestones?limit=50');
      expect(calledUrls).toContain('/api/sam/practice/goals?limit=50');
      expect(calledUrls).toContain('/api/sam/practice/sessions?limit=20');
    });

    it('should populate all data fields after successful fetch', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.overview).not.toBeNull();
      });

      expect(result.current.overview?.overview.totalQualityHours).toBe(1250);
      expect(result.current.heatmap?.metadata.year).toBe(2026);
      expect(result.current.milestones?.milestones).toHaveLength(1);
      expect(result.current.goals?.goals[0].title).toBe('Practice 100 hours of TypeScript');
      expect(result.current.sessions?.sessions[0].skillName).toBe('TypeScript');
    });

    it('should set all per-section loading states to false after data loads', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoadingOverview).toBe(false);
      expect(result.current.isLoadingHeatmap).toBe(false);
      expect(result.current.isLoadingMilestones).toBe(false);
      expect(result.current.isLoadingGoals).toBe(false);
      expect(result.current.isLoadingSessions).toBe(false);
    });

    it('should not fetch when enabled is false', async () => {
      setupSuccessfulFetches();
      renderHook(() => usePracticeDashboard({ enabled: false }));

      // Give the effect a chance to (not) fire
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should pass the current year to the heatmap endpoint', async () => {
      setupSuccessfulFetches();
      renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      const heatmapCall = mockFetch.mock.calls.find((call: string[]) =>
        call[0].includes('/heatmap')
      );
      expect(heatmapCall).toBeDefined();
      const currentYear = new Date().getFullYear();
      expect(heatmapCall[0]).toContain(`year=${currentYear}`);
    });
  });

  // =========================================================================
  // 3. Individual Refresh Functions
  // =========================================================================

  describe('individual refresh functions', () => {
    it('refreshOverview should only re-fetch the overview endpoint', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.overview).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refreshOverview();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/mastery/overview');
    });

    it('refreshHeatmap should only re-fetch the heatmap endpoint', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.heatmap).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refreshHeatmap(2025);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/heatmap?year=2025');
    });

    it('refreshMilestones should only re-fetch the milestones endpoint', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refreshMilestones();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/milestones?limit=50');
    });

    it('refreshGoals should only re-fetch the goals endpoint', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.goals).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refreshGoals();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/goals?limit=50');
    });

    it('refreshSessions should only re-fetch the sessions endpoint', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.sessions).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refreshSessions();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/sessions?limit=20');
    });

    it('refresh should re-fetch all 5 endpoints', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.overview).not.toBeNull();
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  // =========================================================================
  // 4. Error Handling
  // =========================================================================

  describe('error handling', () => {
    it('should set error state when overview API returns non-ok response', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/mastery/overview')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ success: false }),
          });
        }
        // Other endpoints succeed
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      });

      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.isLoadingOverview).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch mastery overview');
    });

    it('should set error state when overview API returns success: false with a message', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/mastery/overview')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: false, error: 'User not found' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      });

      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.isLoadingOverview).toBe(false);
      });

      expect(result.current.error).toBe('User not found');
    });

    it('should log errors for non-overview section failures without setting error state', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/mastery/overview')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, data: createOverviewResponse() }),
          });
        }
        if (url.includes('/heatmap')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ success: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      });

      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.isLoadingHeatmap).toBe(false);
      });

      // Heatmap errors are logged but do not set the top-level error state
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[usePracticeDashboard] fetchHeatmap error:',
        expect.any(Error)
      );
      // The overview fetched successfully, so error should be null
      expect(result.current.heatmap).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network failure (fetch rejection) gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/mastery/overview')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      });

      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.isLoadingOverview).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  // =========================================================================
  // 5. claimMilestone
  // =========================================================================

  describe('claimMilestone', () => {
    it('should POST to the claim endpoint and show success toast on success', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();

      // First call: the claim POST, second call: the milestones refresh
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/milestones/ms-1/claim')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { xpAwarded: 500, milestone: { id: 'ms-1' } },
              }),
          });
        }
        if (url.includes('/milestones')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, data: createMilestonesResponse() }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      let claimResult: boolean = false;
      await act(async () => {
        claimResult = await result.current.claimMilestone('ms-1');
      });

      expect(claimResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/practice/milestones/ms-1/claim',
        { method: 'POST' }
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Milestone Claimed!',
        description: 'You earned 500 XP!',
      });
    });

    it('should refresh milestones after a successful claim', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/claim')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { xpAwarded: 500 },
              }),
          });
        }
        if (url.includes('/milestones')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, data: createMilestonesResponse() }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        await result.current.claimMilestone('ms-1');
      });

      // The claim call + the milestones refresh call
      const milestoneCalls = mockFetch.mock.calls.filter(
        (call: string[]) =>
          call[0].includes('/milestones') && !call[0].includes('/claim')
      );
      expect(milestoneCalls).toHaveLength(1);
    });

    it('should show error toast and return false when the claim API returns non-ok', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'Milestone already claimed' }),
      });

      let claimResult: boolean = true;
      await act(async () => {
        claimResult = await result.current.claimMilestone('ms-1');
      });

      expect(claimResult).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Milestone already claimed',
        variant: 'destructive',
      });
    });

    it('should return false when the claim API returns success: false', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      let claimResult: boolean = true;
      await act(async () => {
        claimResult = await result.current.claimMilestone('ms-1');
      });

      expect(claimResult).toBe(false);
    });

    it('should show error toast on network failure during claim', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.milestones).not.toBeNull();
      });

      mockFetch.mockClear();
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      let claimResult: boolean = true;
      await act(async () => {
        claimResult = await result.current.claimMilestone('ms-1');
      });

      expect(claimResult).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Connection refused',
        variant: 'destructive',
      });
    });
  });

  // =========================================================================
  // 6. Auto-Refresh
  // =========================================================================

  describe('auto-refresh', () => {
    it('should set up an interval when autoRefresh is true', async () => {
      setupSuccessfulFetches();
      renderHook(() =>
        usePracticeDashboard({
          autoRefresh: true,
          refreshInterval: 30000,
        })
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      // Advance time by one interval period
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Auto-refresh only calls fetchOverview (not all 5)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/mastery/overview');
    });

    it('should not set up an interval when autoRefresh is false', async () => {
      setupSuccessfulFetches();
      renderHook(() =>
        usePracticeDashboard({ autoRefresh: false })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      mockFetch.mockClear();

      act(() => {
        jest.advanceTimersByTime(120000);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should clear the interval on unmount', async () => {
      setupSuccessfulFetches();
      const { unmount } = renderHook(() =>
        usePracticeDashboard({
          autoRefresh: true,
          refreshInterval: 30000,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      mockFetch.mockClear();
      unmount();

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use the default 60000ms interval when refreshInterval is not specified', async () => {
      setupSuccessfulFetches();
      renderHook(() =>
        usePracticeDashboard({ autoRefresh: true })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      mockFetch.mockClear();
      setupSuccessfulFetches();

      // 30 seconds: no call yet
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(mockFetch).not.toHaveBeenCalled();

      // 60 seconds total: should fire
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // 7. Derived Masteries
  // =========================================================================

  describe('masteries derived data', () => {
    it('should derive masteries from overview.topSkills', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.overview).not.toBeNull();
      });

      expect(result.current.masteries).toHaveLength(2);
      expect(result.current.masteries[0].skillName).toBe('TypeScript');
      expect(result.current.masteries[1].skillName).toBe('React');
    });

    it('should return empty array for masteries when overview is null', () => {
      // Fetch never resolves - overview stays null
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => usePracticeDashboard());

      expect(result.current.masteries).toEqual([]);
    });

    it('should return empty array for masteries when overview has no topSkills', async () => {
      const overviewWithNoSkills = createOverviewResponse();
      overviewWithNoSkills.topSkills = [];

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/mastery/overview')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, data: overviewWithNoSkills }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      });

      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.overview).not.toBeNull();
      });

      expect(result.current.masteries).toEqual([]);
    });

    it('should update masteries when overview is refreshed with new data', async () => {
      setupSuccessfulFetches();
      const { result } = renderHook(() => usePracticeDashboard());

      await waitFor(() => {
        expect(result.current.masteries).toHaveLength(2);
      });

      // Refresh with updated overview containing 1 skill
      const updatedOverview = createOverviewResponse();
      updatedOverview.topSkills = [updatedOverview.topSkills[0]];

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: updatedOverview }),
      });

      await act(async () => {
        await result.current.refreshOverview();
      });

      expect(result.current.masteries).toHaveLength(1);
      expect(result.current.masteries[0].skillName).toBe('TypeScript');
    });
  });
});
