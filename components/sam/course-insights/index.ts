/**
 * Course Insights Components
 *
 * AI-powered course analytics and personalized learning insights.
 * Shows per-course progress, mastery levels, and recommendations.
 *
 * @module components/sam/course-insights
 */

export { CourseInsights } from './CourseInsights';
export type { CourseInsightsProps } from './CourseInsights';

export { CourseInsightCard } from './CourseInsightCard';
export type {
  CourseInsightCardProps,
  CourseInsightData,
  CourseInsight,
  CourseInsightMetric,
} from './CourseInsightCard';

// Default export for convenience
export { CourseInsights as default } from './CourseInsights';
