/**
 * SAM Analytics Components
 *
 * Comprehensive analytics visualizations for the SAM AI Mentor system.
 * These components provide insights into learning progress, efficiency,
 * retention, and recommendation effectiveness.
 *
 * @module components/sam/analytics
 */

// Retention and Memory
export { RetentionCurveChart } from './retention-curve-chart';
export type {
  RetentionDataPoint,
  TopicRetention,
  RetentionCurveChartProps,
} from './retention-curve-chart';

// Weekly Trends
export { WeeklyTrendsChart } from './weekly-trends-chart';
export type {
  DailyData,
  WeeklyComparison,
  HourlyActivity,
  WeeklyTrendsChartProps,
} from './weekly-trends-chart';

// Gamification / Level Progression
export { LevelProgressionChart } from './level-progression-chart';
export type {
  XPDataPoint,
  LevelMilestone,
  Achievement,
  LevelProgressionChartProps,
} from './level-progression-chart';

// Skill Development
export { SkillTrajectoryChart } from './skill-trajectory-chart';
export type {
  SkillDataPoint,
  Skill,
  SkillCategory,
  SkillTrajectoryChartProps,
} from './skill-trajectory-chart';

// Learning Efficiency
export { EfficiencyDashboard } from './efficiency-dashboard';
export type {
  EfficiencyMetric,
  TopicEfficiency,
  StudySession,
  EfficiencyDashboardProps,
} from './efficiency-dashboard';

// Mastery Tracking
export { MasteryProgressChart } from './mastery-progress-chart';
export type {
  MasteryDataPoint,
  CourseMastery,
  TopicMastery,
  MasteryMilestone,
  MasteryProgressChartProps,
} from './mastery-progress-chart';

// Recommendation Insights
export { RecommendationInsightsWidget } from './recommendation-insights-widget';
export type {
  RecommendationInsight,
  RecentRecommendation,
  RecommendationInsightsWidgetProps,
} from './recommendation-insights-widget';
