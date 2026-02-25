/**
 * Tests for useUnifiedAnalytics hook
 * Source: hooks/dashboard/use-unified-analytics.ts
 */

import { renderHook, act } from '@testing-library/react';

const mockFetchAnalytics = jest.fn();
const mockSetAnalyticsSubTab = jest.fn();

const defaultState = {
  analytics: null as Record<string, unknown> | null,
  activeAnalyticsSubTab: 'study-time' as string,
  loadingStates: { overview: false, analytics: false, goals: false, notifications: false },
  errors: { overview: null, analytics: null as string | null, goals: null, notifications: null },
};

jest.mock('@/lib/contexts/unified-dashboard-context', () => ({
  useUnifiedDashboardContext: jest.fn(() => ({
    state: defaultState,
    fetchAnalytics: mockFetchAnalytics,
    setAnalyticsSubTab: mockSetAnalyticsSubTab,
  })),
}));

import {
  useUnifiedAnalytics,
  useStudyTimeMetrics,
  useCourseProgressMetrics,
  usePerformanceMetrics,
} from '@/hooks/dashboard/use-unified-analytics';

describe('useUnifiedAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.analytics = null;
    defaultState.loadingStates.analytics = false;
    defaultState.errors.analytics = null;
  });

  it('returns initial state with null analytics', () => {
    const { result } = renderHook(() => useUnifiedAnalytics());
    expect(result.current.analytics).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches analytics on mount with default time range', () => {
    renderHook(() => useUnifiedAnalytics());
    expect(mockFetchAnalytics).toHaveBeenCalledWith('30d');
  });

  it('fetches analytics with custom initial time range', () => {
    renderHook(() => useUnifiedAnalytics('7d'));
    expect(mockFetchAnalytics).toHaveBeenCalledWith('7d');
  });

  it('allows changing the time range', () => {
    const { result } = renderHook(() => useUnifiedAnalytics());
    act(() => {
      result.current.setTimeRange('90d');
    });
    expect(mockFetchAnalytics).toHaveBeenCalledWith('90d');
  });

  it('allows refreshing analytics', () => {
    const { result } = renderHook(() => useUnifiedAnalytics('7d'));
    mockFetchAnalytics.mockClear();
    act(() => {
      result.current.refresh();
    });
    expect(mockFetchAnalytics).toHaveBeenCalledWith('7d');
  });

  it('returns loading state from context', () => {
    defaultState.loadingStates.analytics = true;
    const { result } = renderHook(() => useUnifiedAnalytics());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error from context', () => {
    defaultState.errors.analytics = 'Failed to fetch analytics';
    const { result } = renderHook(() => useUnifiedAnalytics());
    expect(result.current.error).toBe('Failed to fetch analytics');
  });

  it('exposes sub-tab navigation', () => {
    const { result } = renderHook(() => useUnifiedAnalytics());
    expect(result.current.activeSubTab).toBe('study-time');
    act(() => {
      result.current.setActiveSubTab('performance' as never);
    });
    expect(mockSetAnalyticsSubTab).toHaveBeenCalledWith('performance');
  });
});

describe('useStudyTimeMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.analytics = null;
  });

  it('returns zero metrics when no analytics', () => {
    const { result } = renderHook(() => useStudyTimeMetrics());
    expect(result.current.totalMinutes).toBe(0);
    expect(result.current.totalHours).toBe(0);
  });

  it('returns study time from analytics data', () => {
    defaultState.analytics = {
      studyTime: {
        totalMinutes: 300,
        totalHours: 5,
        avgMinutesPerDay: 42,
        dailyBreakdown: [
          { date: '2024-01-01', minutes: 60 },
          { date: '2024-01-02', minutes: 0 },
          { date: '2024-01-03', minutes: 45 },
        ],
      },
      timeRange: '7d',
    };
    const { result } = renderHook(() => useStudyTimeMetrics());
    expect(result.current.totalMinutes).toBe(300);
    expect(result.current.activeDays).toBe(2);
  });
});

describe('useCourseProgressMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.analytics = null;
  });

  it('returns zero metrics when no analytics', () => {
    const { result } = renderHook(() => useCourseProgressMetrics());
    expect(result.current.totalCourses).toBe(0);
    expect(result.current.avgProgress).toBe(0);
  });

  it('computes aggregate metrics from course progress', () => {
    defaultState.analytics = {
      courseProgress: [
        { courseId: 'c1', title: 'A', progress: 100 },
        { courseId: 'c2', title: 'B', progress: 50 },
        { courseId: 'c3', title: 'C', progress: 0 },
      ],
      timeRange: '30d',
    };
    const { result } = renderHook(() => useCourseProgressMetrics());
    expect(result.current.totalCourses).toBe(3);
    expect(result.current.completedCourses).toBe(1);
    expect(result.current.inProgressCourses).toBe(1);
    expect(result.current.notStartedCourses).toBe(1);
    expect(result.current.avgProgress).toBe(50);
  });
});

describe('usePerformanceMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultState.analytics = null;
  });

  it('returns default performance when no analytics', () => {
    const { result } = renderHook(() => usePerformanceMetrics());
    expect(result.current.examAttempts).toBe(0);
    expect(result.current.avgScore).toBe(0);
    expect(result.current.scoreTrend).toBe('stable');
  });
});
