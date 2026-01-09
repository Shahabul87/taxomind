/**
 * Learning Analytics Module
 * Phase 5: Learning Analytics & Insights
 *
 * This module provides comprehensive learning analytics features including:
 * - Study Activity Heatmap (GitHub-style contribution graph)
 * - Course Progress Analytics with velocity metrics
 * - AI-Powered SAM Insights with personalized recommendations
 * - Combined Learning Analytics Dashboard
 */

// Components
export { StudyHeatmap } from './StudyHeatmap';
export { CourseProgressAnalytics } from './CourseProgressAnalytics';
export { SAMInsights } from './SAMInsights';
export { LearningAnalyticsDashboard } from './LearningAnalyticsDashboard';

// Hooks
export {
  useStudyHeatmap,
  useCourseProgress,
  useSAMInsights,
  useLearningAnalytics,
  useStudyTimer,
  useStreakInfo,
} from './use-learning-analytics';

// Types (re-exported from central types file)
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

// Display Configurations (re-exported)
export {
  HEATMAP_LEVELS,
  PROGRESS_STATUS_CONFIG,
  INSIGHT_TYPE_CONFIG,
  ATTENTION_SEVERITY_CONFIG,
} from '@/types/learning-analytics';

// Utility Functions (re-exported)
export {
  calculateHeatmapLevel,
  calculateProgressStatus,
  formatStudyTime,
  getTrendConfig,
} from '@/types/learning-analytics';
