// Learning Command Center - Main exports

export { LearningCommandCenter } from './LearningCommandCenter';
export { DailyHeroSection } from './DailyHeroSection';
export { TodaySchedule } from './TodaySchedule';
export { TodayTasks } from './TodayTasks';
export { ActiveGoals } from './ActiveGoals';
export { WeeklyTimeline } from './WeeklyTimeline';
export { QuickInsights } from './QuickInsights';
export { LearningGantt } from './LearningGantt';

// Notification Components (Phase 3)
export {
  NotificationPreferences,
  NotificationsList,
  LearningNotificationBell,
} from './notifications';

// Learning Analytics Components (Phase 5)
export {
  StudyHeatmap,
  CourseProgressAnalytics,
  SAMInsights,
  LearningAnalyticsDashboard,
  // Analytics Hooks
  useStudyHeatmap,
  useCourseProgress,
  useSAMInsights,
  useLearningAnalytics,
  useStudyTimer,
  useStreakInfo,
  // Analytics Display Configs
  HEATMAP_LEVELS,
  PROGRESS_STATUS_CONFIG,
  INSIGHT_TYPE_CONFIG,
  ATTENTION_SEVERITY_CONFIG,
  // Analytics Utility Functions
  calculateHeatmapLevel,
  calculateProgressStatus,
  formatStudyTime,
  getTrendConfig,
} from './analytics';

// Types
export type {
  ActivityStatus,
  ActivityType,
  TaskPriority,
  LearningActivity,
  LearningTask,
  LearningGoal,
  GoalMilestone,
  DailyStats,
  StreakInfo,
  WeeklyProgress,
  DailyAgenda,
  WeeklyTimelineDay,
  // Gantt types (Phase 2)
  GanttItemType,
  GanttItemStatus,
  GanttMilestone,
  LearningGanttItem,
  GanttViewConfig,
  PlannedVsAccomplished,
  GanttCourseInfo,
  GanttResponse,
  CourseGanttResponse,
} from './types';

// Analytics Types (Phase 5)
export type {
  // Heatmap Types
  HeatmapDay,
  HeatmapWeek,
  HeatmapMonth,
  HeatmapStats,
  HeatmapResponse,
  HeatmapQueryParams,
  StudyHeatmapProps,
  // Course Progress Types
  CourseProgressData,
  VelocityMetrics,
  CourseProgressSummary,
  CourseProgressAnalyticsResponse,
  CourseProgressQueryParams,
  CourseProgressAnalyticsProps,
  // SAM Insights Types
  LearningInsight,
  LearningPattern,
  AttentionItem,
  SuggestedAction,
  SAMInsightsResponse,
  SAMInsightsProps,
  // Display Config Types
  ProgressStatus,
  ProgressStatusConfig,
  InsightType,
  InsightTypeConfig,
  AttentionSeverity,
  AttentionSeverityConfig,
} from '@/types/learning-analytics';

// Demo data generators
export {
  generateDailyAgenda,
  generateWeeklyTimeline,
  getGreeting,
  getDemoActivities,
  getDemoTasks,
  getDemoGoals,
  // Backward compatible exports (use getter functions instead)
  demoActivities,
  demoTasks,
  demoGoals,
  // Gantt demo data generators (Phase 2)
  getDemoGanttItems,
  getDemoGanttCourses,
  getDemoGanttSummary,
  getDemoGanttResponse,
} from './demo-data';
