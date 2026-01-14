/**
 * SAM Multi-Channel Notification System
 *
 * Exports all notification channel implementations:
 * - Push notifications (Firebase FCM)
 * - SMS notifications (Twilio)
 *
 * Channel Status:
 * ✅ in_app  - Stored in Notification table + realtime cache (main module)
 * ✅ email   - Via Resend API (main module)
 * ✅ push    - Via Firebase Cloud Messaging (this module)
 * ✅ sms     - Via Twilio (this module)
 */

// Push Notifications (Firebase)
export {
  isPushAvailable,
  sendPushNotification,
  sendPushToUser,
  sendPushToUsers,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDeviceCount,
  cleanupInactiveTokens,
  type PushNotificationPayload,
  type PushNotificationResult,
} from './push-channel';

// SMS Notifications (Twilio)
export {
  isSMSAvailable,
  isValidPhoneNumber,
  formatPhoneNumber,
  sendSMSNotification,
  sendSMSToUser,
  sendUrgentAlertSMS,
  sendStreakReminderSMS,
  checkSMSRateLimit,
  sendRateLimitedSMS,
  type SMSNotificationPayload,
  type SMSNotificationResult,
} from './sms-channel';
