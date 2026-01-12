/**
 * SAM Notification Components
 *
 * UI components for push notification management.
 *
 * Components:
 * - PushNotificationOptIn: Permission request modal/banner
 * - NotificationPreferences: Settings panel for notification preferences
 */

export { PushNotificationOptIn } from './PushNotificationOptIn';
export { NotificationPreferences } from './NotificationPreferences';

// Re-export types from hook for convenience
export type {
  PushPermissionState,
  PushSubscription,
  PushNotificationOptions,
} from '@sam-ai/react';
