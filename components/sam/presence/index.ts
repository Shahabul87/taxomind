/**
 * SAM Presence Components
 *
 * UI components for user presence and activity tracking.
 *
 * Components:
 * - PresenceIndicator: Status dot/badge with tooltip
 * - ActiveLearnersWidget: Shows currently active learners
 * - StudyStatusBadge: Current study session indicator
 */

export { PresenceIndicator } from './PresenceIndicator';
export { ActiveLearnersWidget } from './ActiveLearnersWidget';
export { StudyStatusBadge } from './StudyStatusBadge';

// Re-export types from agentic for convenience
export type { PresenceStatus, UserPresence, PresenceMetadata } from '@sam-ai/agentic';
