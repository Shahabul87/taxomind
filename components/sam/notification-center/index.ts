/**
 * Notification Center Components
 *
 * Comprehensive notification management system with inbox, preferences,
 * channel settings, and history views.
 *
 * @module components/sam/notification-center
 */

export {
  NotificationCenter,
  NotificationCenterTrigger,
  NotificationCenterDrawer,
} from './NotificationCenter';

export { NotificationInbox } from './NotificationInbox';
export { ChannelSettings } from './ChannelSettings';
export { NotificationHistory } from './NotificationHistory';

// Default export for convenience
export { NotificationCenter as default } from './NotificationCenter';
