'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { DashboardView } from '@/components/dashboard/unified-header';

// ============================================================================
// TYPES
// ============================================================================

export type AnalyticsSubTab =
  | 'overview'
  | 'exams'
  | 'progress'
  | 'insights'
  | 'quality'
  | 'conversations'
  | 'knowledge'
  | 'heatmap';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate?: string;
  courseId?: string;
  course?: { id: string; title: string; imageUrl?: string } | null;
  subGoals?: Array<{
    id: string;
    title: string;
    status: string;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DashboardOverview {
  goals: {
    total: number;
    byStatus: Record<string, number>;
    recentActive: Array<{
      id: string;
      title: string;
      priority: string;
      progress: number;
    }>;
  };
  notifications: {
    unreadCount: number;
    recent: Notification[];
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  };
  activity: {
    last7Days: {
      activitiesCount: number;
      studyMinutes: number;
    };
    recentCourses: Array<{ title: string; progress: number }>;
  };
  todos: {
    pending: number;
    completedToday: number;
    overdue: number;
  };
  lastUpdated: string;
}

export interface AnalyticsData {
  timeRange: string;
  studyTime: {
    totalMinutes: number;
    totalHours: number;
    avgMinutesPerDay: number;
    dailyBreakdown: Array<{ date: string; minutes: number; hours: number }>;
  };
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    completedSections: number;
    totalSections: number;
  }>;
  heatmap: Array<{
    date: string;
    count: number;
    intensity: number;
  }>;
  performance: {
    examAttempts: number;
    avgScore: number;
    accuracy: number;
    currentStreak: number;
  };
}

// ============================================================================
// STATE & ACTIONS
// ============================================================================

interface UnifiedDashboardState {
  // Navigation
  activeTab: DashboardView;
  activeAnalyticsSubTab: AnalyticsSubTab;

  // Data
  overview: DashboardOverview | null;
  goals: Goal[];
  notifications: Notification[];
  analytics: AnalyticsData | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  loadingStates: {
    overview: boolean;
    goals: boolean;
    notifications: boolean;
    analytics: boolean;
  };

  // Error states
  errors: {
    overview: string | null;
    goals: string | null;
    notifications: string | null;
    analytics: string | null;
  };

  // Pagination
  goalsPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  notificationsPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type Action =
  | { type: 'SET_ACTIVE_TAB'; payload: DashboardView }
  | { type: 'SET_ANALYTICS_SUB_TAB'; payload: AnalyticsSubTab }
  | { type: 'SET_OVERVIEW'; payload: DashboardOverview }
  | { type: 'SET_GOALS'; payload: { goals: Goal[]; pagination: UnifiedDashboardState['goalsPagination'] } }
  | { type: 'APPEND_GOALS'; payload: { goals: Goal[]; pagination: UnifiedDashboardState['goalsPagination'] } }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; pagination: UnifiedDashboardState['notificationsPagination'] } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'SET_ANALYTICS'; payload: AnalyticsData }
  | { type: 'SET_LOADING'; payload: { key: keyof UnifiedDashboardState['loadingStates']; value: boolean } }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { key: keyof UnifiedDashboardState['errors']; value: string | null } }
  | { type: 'RESET_STATE' };

const initialState: UnifiedDashboardState = {
  activeTab: 'todos',
  activeAnalyticsSubTab: 'overview',
  overview: null,
  goals: [],
  notifications: [],
  analytics: null,
  isLoading: false,
  isRefreshing: false,
  loadingStates: {
    overview: false,
    goals: false,
    notifications: false,
    analytics: false,
  },
  errors: {
    overview: null,
    goals: null,
    notifications: null,
    analytics: null,
  },
  goalsPagination: { page: 1, limit: 20, total: 0, hasMore: false },
  notificationsPagination: { page: 1, limit: 20, total: 0, hasMore: false },
};

function reducer(state: UnifiedDashboardState, action: Action): UnifiedDashboardState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_ANALYTICS_SUB_TAB':
      return { ...state, activeAnalyticsSubTab: action.payload };

    case 'SET_OVERVIEW':
      return { ...state, overview: action.payload };

    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload.goals,
        goalsPagination: action.payload.pagination,
      };

    case 'APPEND_GOALS':
      return {
        ...state,
        goals: [...state.goals, ...action.payload.goals],
        goalsPagination: action.payload.pagination,
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
        goalsPagination: {
          ...state.goalsPagination,
          total: state.goalsPagination.total - 1,
        },
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        notificationsPagination: action.payload.pagination,
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };

    case 'SET_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.value,
        },
        isLoading: Object.values({
          ...state.loadingStates,
          [action.payload.key]: action.payload.value,
        }).some(Boolean),
      };

    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface UnifiedDashboardContextValue {
  state: UnifiedDashboardState;
  // Navigation actions
  setActiveTab: (tab: DashboardView) => void;
  setAnalyticsSubTab: (subTab: AnalyticsSubTab) => void;
  // Data fetching actions
  fetchOverview: () => Promise<void>;
  fetchGoals: (options?: { page?: number; status?: string; reset?: boolean }) => Promise<void>;
  fetchNotifications: (options?: { page?: number; reset?: boolean }) => Promise<void>;
  fetchAnalytics: (timeRange?: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  // Goal actions
  createGoal: (data: Partial<Goal>) => Promise<Goal | null>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  // Notification actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const UnifiedDashboardContext = createContext<UnifiedDashboardContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface UnifiedDashboardProviderProps {
  children: React.ReactNode;
  initialTab?: DashboardView;
}

export function UnifiedDashboardProvider({
  children,
  initialTab = 'todos',
}: UnifiedDashboardProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    activeTab: initialTab,
  });

  // Use refs to track if initial fetch has been done
  const initialFetchDone = useRef(false);

  // Navigation actions
  const setActiveTab = useCallback((tab: DashboardView) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setAnalyticsSubTab = useCallback((subTab: AnalyticsSubTab) => {
    dispatch({ type: 'SET_ANALYTICS_SUB_TAB', payload: subTab });
  }, []);

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'overview', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'overview', value: null } });

    try {
      const response = await fetch('/api/v2/dashboard/unified/overview');
      const result = await response.json();

      if (result.success) {
        dispatch({ type: 'SET_OVERVIEW', payload: result.data });
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'overview', value: result.error || 'Failed to fetch overview' },
        });
      }
    } catch (error) {
      console.error('[fetchOverview]', error);
      dispatch({
        type: 'SET_ERROR',
        payload: { key: 'overview', value: 'Network error fetching overview' },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'overview', value: false } });
    }
  }, []);

  // Fetch goals
  const fetchGoals = useCallback(
    async (options?: { page?: number; status?: string; reset?: boolean }) => {
      const { page = 1, status, reset = false } = options ?? {};

      dispatch({ type: 'SET_LOADING', payload: { key: 'goals', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'goals', value: null } });

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        });
        if (status) params.set('status', status);

        const response = await fetch(`/api/v2/dashboard/goals?${params}`);
        const result = await response.json();

        if (result.success) {
          const actionType = reset || page === 1 ? 'SET_GOALS' : 'APPEND_GOALS';
          dispatch({
            type: actionType,
            payload: {
              goals: result.data,
              pagination: result.metadata.pagination,
            },
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: { key: 'goals', value: result.error || 'Failed to fetch goals' },
          });
        }
      } catch (error) {
        console.error('[fetchGoals]', error);
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'goals', value: 'Network error fetching goals' },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'goals', value: false } });
      }
    },
    []
  );

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (options?: { page?: number; reset?: boolean }) => {
      const { page = 1, reset = false } = options ?? {};

      dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'notifications', value: null } });

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        });

        const response = await fetch(`/api/v2/dashboard/notifications?${params}`);
        const result = await response.json();

        if (result.success) {
          dispatch({
            type: 'SET_NOTIFICATIONS',
            payload: {
              notifications: result.data,
              pagination: result.metadata.pagination,
            },
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: { key: 'notifications', value: result.error || 'Failed to fetch notifications' },
          });
        }
      } catch (error) {
        console.error('[fetchNotifications]', error);
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'notifications', value: 'Network error fetching notifications' },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: false } });
      }
    },
    []
  );

  // Fetch analytics
  const fetchAnalytics = useCallback(async (timeRange = '30d') => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'analytics', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'analytics', value: null } });

    try {
      const response = await fetch(
        `/api/v2/dashboard/analytics/overview?timeRange=${timeRange}`
      );
      const result = await response.json();

      if (result.success) {
        dispatch({ type: 'SET_ANALYTICS', payload: result.data });
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'analytics', value: result.error || 'Failed to fetch analytics' },
        });
      }
    } catch (error) {
      console.error('[fetchAnalytics]', error);
      dispatch({
        type: 'SET_ERROR',
        payload: { key: 'analytics', value: 'Network error fetching analytics' },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'analytics', value: false } });
    }
  }, []);

  // Refresh all dashboard data
  const refreshDashboard = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });

    try {
      await Promise.all([
        fetchOverview(),
        fetchGoals({ reset: true }),
        fetchNotifications({ reset: true }),
      ]);
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [fetchOverview, fetchGoals, fetchNotifications]);

  // Create goal
  const createGoal = useCallback(async (data: Partial<Goal>): Promise<Goal | null> => {
    try {
      const response = await fetch('/api/v2/dashboard/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        // Refresh goals list
        await fetchGoals({ reset: true });
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('[createGoal]', error);
      return null;
    }
  }, [fetchGoals]);

  // Update goal
  const updateGoal = useCallback(
    async (id: string, data: Partial<Goal>): Promise<Goal | null> => {
      try {
        const response = await fetch(`/api/v2/dashboard/goals/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
          dispatch({ type: 'UPDATE_GOAL', payload: result.data });
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('[updateGoal]', error);
        return null;
      }
    },
    []
  );

  // Delete goal
  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v2/dashboard/goals/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        dispatch({ type: 'DELETE_GOAL', payload: id });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[deleteGoal]', error);
      return false;
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await fetch('/api/v2/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    } catch (error) {
      console.error('[markNotificationRead]', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      const unreadIds = state.notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      await fetch('/api/v2/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
    } catch (error) {
      console.error('[markAllNotificationsRead]', error);
    }
  }, [state.notifications]);

  // Initial data fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchOverview();
    }
  }, [fetchOverview]);

  // Memoize context value
  const value = useMemo<UnifiedDashboardContextValue>(
    () => ({
      state,
      setActiveTab,
      setAnalyticsSubTab,
      fetchOverview,
      fetchGoals,
      fetchNotifications,
      fetchAnalytics,
      refreshDashboard,
      createGoal,
      updateGoal,
      deleteGoal,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      state,
      setActiveTab,
      setAnalyticsSubTab,
      fetchOverview,
      fetchGoals,
      fetchNotifications,
      fetchAnalytics,
      refreshDashboard,
      createGoal,
      updateGoal,
      deleteGoal,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  );

  return (
    <UnifiedDashboardContext.Provider value={value}>
      {children}
    </UnifiedDashboardContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnifiedDashboardContext() {
  const context = useContext(UnifiedDashboardContext);
  if (!context) {
    throw new Error(
      'useUnifiedDashboardContext must be used within a UnifiedDashboardProvider'
    );
  }
  return context;
}
