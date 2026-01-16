/**
 * SAM Presence Components
 *
 * UI components and providers for user presence and activity tracking.
 *
 * Components:
 * - PresenceIndicator: Status dot/badge with tooltip
 * - ActiveLearnersWidget: Shows currently active learners
 * - StudyStatusBadge: Current study session indicator
 *
 * Providers:
 * - PresenceTrackingProvider: Wraps usePresence hook for automatic tracking
 */

export { PresenceIndicator } from './PresenceIndicator';
export { ActiveLearnersWidget } from './ActiveLearnersWidget';
export { StudyStatusBadge } from './StudyStatusBadge';
export { ConnectedStudyStatusBadge } from './ConnectedStudyStatusBadge';
export {
  PresenceTrackingProvider,
  usePresenceTracking,
  usePresenceTrackingOptional,
} from './PresenceTrackingProvider';

// Re-export types from agentic for convenience
export type { PresenceStatus, UserPresence, PresenceMetadata } from '@sam-ai/agentic';
