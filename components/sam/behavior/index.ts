/**
 * SAM Behavior Components
 *
 * UI components for displaying and interacting with behavior patterns.
 *
 * Components:
 * - BehaviorPatternsWidget: Dashboard widget showing detected patterns
 * - StruggleDetectionAlert: Alert when struggle patterns are detected
 * - LearningStyleIndicator: Shows user's detected learning style
 */

export { BehaviorPatternsWidget } from './BehaviorPatternsWidget';
export { StruggleDetectionAlert } from './StruggleDetectionAlert';
export { LearningStyleIndicator } from './LearningStyleIndicator';

// Re-export types from hook for convenience
export type { BehaviorPattern, PatternType } from '@sam-ai/react';
