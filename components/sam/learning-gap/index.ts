/**
 * Learning Gap Dashboard Components
 *
 * Comprehensive learning gap analysis with skill decay tracking,
 * trend visualization, AI recommendations, and peer comparison.
 */

// Main Dashboard Container
export { LearningGapDashboard } from './LearningGapDashboard';
export { default as LearningGapDashboardDefault } from './LearningGapDashboard';

// Individual Widgets
export { GapOverviewWidget } from './GapOverviewWidget';
export { default as GapOverviewWidgetDefault } from './GapOverviewWidget';

export { SkillDecayTracker } from './SkillDecayTracker';
export { default as SkillDecayTrackerDefault } from './SkillDecayTracker';

export { TrendAnalysisChart } from './TrendAnalysisChart';
export { default as TrendAnalysisChartDefault } from './TrendAnalysisChart';

export { PersonalizedRecommendations } from './PersonalizedRecommendations';
export { default as PersonalizedRecommendationsDefault } from './PersonalizedRecommendations';

export { ComparisonView } from './ComparisonView';
export { default as ComparisonViewDefault } from './ComparisonView';

// Custom Hook
export { useLearningGaps } from './use-learning-gaps';
export { default as useLearningGapsDefault } from './use-learning-gaps';

// Types
export type {
  // Severity & Status Types
  GapSeverity,
  GapStatus,
  DecayRiskLevel,
  TrendDirection,
  // Learning Gap Data
  LearningGapEvidence,
  GapAction,
  LearningGapData,
  // Skill Decay Data
  DecayPrediction,
  SkillDecayData,
  // Trend Analysis Data
  TrendMetricPoint,
  TrendMetric,
  TrendInsight,
  TrendAnalysisData,
  // Recommendation Data
  GapRecommendation,
  // Comparison Data
  ComparisonMetric,
  ComparisonInsight,
  ComparisonData,
  // Dashboard Data
  GapSummary,
  LearningGapDashboardData,
  // Component Props
  LearningGapDashboardProps,
  GapOverviewWidgetProps,
  SkillDecayTrackerProps,
  TrendAnalysisChartProps,
  PersonalizedRecommendationsProps,
  ComparisonViewProps,
} from './types';
