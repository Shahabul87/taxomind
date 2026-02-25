/**
 * Tests for useUnifiedDashboard hook
 * Source: hooks/dashboard/use-unified-dashboard.ts
 */

import { renderHook, act } from '@testing-library/react';

// Mock the context
const mockFetchOverview = jest.fn();
const mockRefreshDashboard = jest.fn();
const mockSetActiveTab = jest.fn();
const mockSetAnalyticsSubTab = jest.fn();

const defaultState = {
  overview: null as ReturnType<typeof createMockOverview> | null,
  activeTab: 'overview' as string,
  activeAnalyticsSubTab: 'study-time' as string,
  loadingStates: { overview: false, analytics: false, goals: false, notifications: false },
  isRefreshing: false,
  errors: { overview: null as string | null, analytics: null, goals: null, notifications: null },
};

jest.mock('@/lib/contexts/unified-dashboard-context', () => ({
  useUnifiedDashboardContext: jest.fn(() => ({
    state: defaultState,
    fetchOverview: mockFetchOverview,
    refreshDashboard: mockRefreshDashboard,
    setActiveTab: mockSetActiveTab,
    setAnalyticsSubTab: mockSetAnalyticsSubTab,
  })),
}));

import {
  useUnifiedDashboard,
  useAutoRefreshDashboard,
  useDashboardQuickStats,
} from '@/hooks/dashboard/use-unified-dashboard';
import { useUnifiedDashboardContext } from '@/lib/contexts/unified-dashboard-context';

function createMockOverview() {
  return {
    streak: { currentStreak: 5, longestStreak: 10, lastActivityDate: new Date().toISOString() },
    goals: { total: 3, byStatus: { active: 2, completed: 1, paused: 0, abandoned: 0 } },
    todos: { pending: 4, overdue: 1, completedToday: 2 },
    notifications: { unreadCount: 7 },
    activity: { last7Days: { studyMinutes: 180, activitiesCount: 12 } },
  };
}

describe('useUnifiedDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.overview = null;
    defaultState.loadingStates.overview = false;
    defaultState.isRefreshing = false;
    defaultState.errors.overview = null;
  });

  it('returns initial loading state when overview is null', () => {
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.overview).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes fetchOverview from context', () => {
    const { result } = renderHook(() => useUnifiedDashboard());
    result.current.fetchOverview();
    expect(mockFetchOverview).toHaveBeenCalled();
  });

  it('exposes refreshDashboard from context', () => {
    const { result } = renderHook(() => useUnifiedDashboard());
    result.current.refreshDashboard();
    expect(mockRefreshDashboard).toHaveBeenCalled();
  });

  it('returns overview data when loaded', () => {
    defaultState.overview = createMockOverview();
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.overview).not.toBeNull();
    expect(result.current.streak?.currentStreak).toBe(5);
    expect(result.current.goalsCount).toBe(3);
    expect(result.current.unreadNotifications).toBe(7);
  });

  it('returns correct loading state', () => {
    defaultState.loadingStates.overview = true;
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error when present', () => {
    defaultState.errors.overview = 'Network error';
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.error).toBe('Network error');
  });

  it('exposes tab navigation', () => {
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.activeTab).toBe('overview');
    result.current.setActiveTab('analytics');
    expect(mockSetActiveTab).toHaveBeenCalledWith('analytics');
  });

  it('provides recent activity shortcut', () => {
    defaultState.overview = createMockOverview();
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.recentActivity).toEqual(
      expect.objectContaining({
        last7Days: expect.objectContaining({ studyMinutes: 180 }),
      })
    );
  });

  it('provides todos shortcut', () => {
    defaultState.overview = createMockOverview();
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.todos?.pending).toBe(4);
    expect(result.current.todos?.overdue).toBe(1);
  });

  it('returns isRefreshing state', () => {
    defaultState.isRefreshing = true;
    const { result } = renderHook(() => useUnifiedDashboard());
    expect(result.current.isRefreshing).toBe(true);
  });
});

describe('useDashboardQuickStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.overview = null;
    defaultState.loadingStates.overview = false;
  });

  it('returns zero stats when overview is null', () => {
    const { result } = renderHook(() => useDashboardQuickStats());
    expect(result.current.stats.currentStreak).toBe(0);
    expect(result.current.stats.totalGoals).toBe(0);
    expect(result.current.stats.pendingTodos).toBe(0);
  });

  it('computes stats from overview data', () => {
    defaultState.overview = createMockOverview();
    const { result } = renderHook(() => useDashboardQuickStats());
    expect(result.current.stats.currentStreak).toBe(5);
    expect(result.current.stats.longestStreak).toBe(10);
    expect(result.current.stats.activeGoals).toBe(2);
    expect(result.current.stats.studyMinutes).toBe(180);
  });
});
