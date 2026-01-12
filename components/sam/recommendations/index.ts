/**
 * SAM Recommendations Components
 *
 * Enhanced UI components for learning recommendations.
 *
 * Components:
 * - RecommendationCard: Enhanced card with snooze, feedback, actions
 * - RecommendationTimeline: Historical view of recommendations
 * - RecommendationReasonDisplay: Explains why items are recommended
 */

export { RecommendationCard } from './RecommendationCard';
export { RecommendationTimeline } from './RecommendationTimeline';
export { RecommendationReasonDisplay } from './RecommendationReasonDisplay';

// Re-export types from react for convenience
export type {
  LearningRecommendation,
  RecommendationType,
  RecommendationPriority,
  RecommendationContext,
} from '@sam-ai/react';
