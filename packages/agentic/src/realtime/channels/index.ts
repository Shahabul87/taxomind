/**
 * @sam-ai/agentic - Notification Delivery Channels
 * Channel implementations for different notification delivery methods
 */

export {
  EmailChannel,
  createEmailChannel,
  type EmailChannelConfig,
  type EmailPreferences,
  type EmailServiceAdapter,
} from './email-channel';

export {
  BrowserPushChannel,
  createBrowserPushChannel,
  type BrowserPushChannelConfig,
  type PushSubscriptionData,
  type WebPushServiceAdapter,
  type PushNotificationPayload,
} from './browser-push-channel';
