// Enterprise Settings Types
import { LearningStyle } from '@prisma/client';

/**
 * Comprehensive Settings User Interface
 * Includes all user fields accessible in settings page
 */
export interface SettingsUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  isOAuth: boolean;
  isTwoFactorEnabled: boolean;
  totpEnabled: boolean;
  totpVerified: boolean;
  isTeacher: boolean;
  isAffiliate: boolean;
  learningStyle: LearningStyle | null;
  walletBalance: number;
  affiliateEarnings: number;
  affiliateCode: string | null;
  samTotalPoints: number;
  samLevel: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  isAccountLocked: boolean;
  emailVerified: Date | null;
}

/**
 * Active Session Interface
 * For session management tab
 */
export interface ActiveUserSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  lastActivity: Date;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Login History Interface
 * For security tab
 */
export interface LoginHistoryEntry {
  id: string;
  userId: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  failureReason: string | null;
  createdAt: Date;
}

/**
 * Notification Preferences Interface
 */
export interface NotificationPreferences {
  emailNotifications: boolean;
  emailCourseUpdates: boolean;
  emailNewMessages: boolean;
  emailMarketingEmails: boolean;
  emailWeeklyDigest: boolean;
  pushNotifications: boolean;
  pushCourseReminders: boolean;
  pushNewMessages: boolean;
  pushAchievements: boolean;
}

/**
 * Privacy Settings Interface
 */
export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  showLearningProgress: boolean;
  allowDataCollection: boolean;
  allowPersonalization: boolean;
  cookiePreferences: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

/**
 * Settings Tab Type
 */
export type SettingsTab =
  | 'account'
  | 'security'
  | 'privacy'
  | 'profile'
  | 'notifications'
  | 'financial';

/**
 * Data Export Request Status
 */
export type DataExportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Data Export Request Interface
 */
export interface DataExportRequest {
  id: string;
  userId: string;
  status: DataExportStatus;
  format: 'json' | 'csv';
  downloadUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Account Deletion Request Interface
 */
export interface AccountDeletionRequest {
  id: string;
  userId: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  scheduledFor: Date;
  createdAt: Date;
}
