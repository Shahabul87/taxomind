/**
 * Unified Dashboard Hooks
 *
 * These hooks provide access to the unified dashboard state and actions.
 * They are designed to work with the UnifiedDashboardContext provider.
 *
 * @example
 * ```tsx
 * // In your app layout or dashboard wrapper
 * import { UnifiedDashboardProvider } from '@/lib/contexts/unified-dashboard-context';
 *
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <UnifiedDashboardProvider>
 *       {children}
 *     </UnifiedDashboardProvider>
 *   );
 * }
 *
 * // In your components
 * import {
 *   useUnifiedDashboard,
 *   useUnifiedGoals,
 *   useUnifiedAnalytics,
 *   useUnifiedNotifications,
 * } from '@/hooks/dashboard';
 * ```
 */

// Main dashboard hook
export {
  useUnifiedDashboard,
  useAutoRefreshDashboard,
  useDashboardQuickStats,
} from './use-unified-dashboard';

// Goals hooks
export {
  useUnifiedGoals,
  useGoal,
  useActiveGoals,
  useCourseGoals,
  type GoalStatus,
  type GoalPriority,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalFilters,
} from './use-unified-goals';

// Analytics hooks
export {
  useUnifiedAnalytics,
  useStudyTimeMetrics,
  useCourseProgressMetrics,
  useActivityHeatmap,
  usePerformanceMetrics,
  type TimeRange,
} from './use-unified-analytics';

// Notifications hooks
export {
  useUnifiedNotifications,
  useNotificationBadge,
  useRecentNotifications,
  useNotificationsByType,
  useNotificationPolling,
} from './use-unified-notifications';

// Re-export context and types
export {
  UnifiedDashboardProvider,
  useUnifiedDashboardContext,
  type Goal,
  type Notification,
  type DashboardOverview,
  type AnalyticsData,
  type AnalyticsSubTab,
} from '@/lib/contexts/unified-dashboard-context';
