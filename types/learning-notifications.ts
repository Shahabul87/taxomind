/**
 * Learning Notifications Types
 * Type definitions for the Smart Learning Notifications system
 */

import type { LearningAlertType, AlertChannel } from "@prisma/client";

// Re-export Prisma enums for convenience
export { LearningAlertType, AlertChannel } from "@prisma/client";

// ==========================================
// Core Notification Types
// ==========================================

export interface LearningNotification {
  id: string;
  userId: string;
  type: LearningAlertType;
  title: string;
  message: string;
  icon?: string | null;
  color?: string | null;
  activityId?: string | null;
  goalId?: string | null;
  courseId?: string | null;
  read: boolean;
  readAt?: Date | null;
  dismissed: boolean;
  dismissedAt?: Date | null;
  channels: AlertChannel[];
  deliveredAt?: Date | null;
  deliveryStatus?: string | null;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningNotificationPreference {
  id: string;
  userId: string;
  enabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone: string;
  remindersBefore: number;
  streakReminders: boolean;
  goalUpdates: boolean;
  weeklySummary: boolean;
  dailyDigest: boolean;
  breakReminders: boolean;
  studySuggestions: boolean;
  breakIntervalMinutes: number;
  breakDurationMinutes: number;
  channelPreferences?: Record<string, string[]> | null;
  digestTime: string;
  weeklyDigestDay: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// API Request/Response Types
// ==========================================

export interface CreateNotificationInput {
  type: LearningAlertType;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  activityId?: string;
  goalId?: string;
  courseId?: string;
  channels?: AlertChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateNotificationInput {
  read?: boolean;
  dismissed?: boolean;
}

export interface UpdatePreferencesInput {
  enabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string;
  remindersBefore?: number;
  streakReminders?: boolean;
  goalUpdates?: boolean;
  weeklySummary?: boolean;
  dailyDigest?: boolean;
  breakReminders?: boolean;
  studySuggestions?: boolean;
  breakIntervalMinutes?: number;
  breakDurationMinutes?: number;
  channelPreferences?: Record<string, string[]> | null;
  digestTime?: string;
  weeklyDigestDay?: number;
}

export interface NotificationFilters {
  type?: LearningAlertType;
  read?: boolean;
  dismissed?: boolean;
  timeRange?: "1h" | "24h" | "7d" | "30d" | "all";
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byType: Record<LearningAlertType, number>;
}

export interface NotificationsResponse {
  notifications: LearningNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  counts: NotificationCounts;
}

// ==========================================
// Notification Templates
// ==========================================

export interface NotificationTemplate {
  type: LearningAlertType;
  icon: string;
  color: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultChannels: AlertChannel[];
  expiresAfterHours?: number;
}

export const NOTIFICATION_TEMPLATES: Record<LearningAlertType, NotificationTemplate> = {
  REMINDER: {
    type: "REMINDER",
    icon: "Bell",
    color: "#3B82F6",
    titleTemplate: "Upcoming: {{activityTitle}}",
    messageTemplate: "Your {{activityType}} \"{{activityTitle}}\" starts in {{minutesBefore}} minutes.",
    defaultChannels: ["IN_APP", "PUSH"],
    expiresAfterHours: 1,
  },
  DEADLINE: {
    type: "DEADLINE",
    icon: "Clock",
    color: "#EF4444",
    titleTemplate: "Deadline Approaching",
    messageTemplate: "{{itemTitle}} is due {{timeUntilDeadline}}.",
    defaultChannels: ["IN_APP", "PUSH", "EMAIL"],
    expiresAfterHours: 24,
  },
  STREAK_WARNING: {
    type: "STREAK_WARNING",
    icon: "Flame",
    color: "#F59E0B",
    titleTemplate: "Don&apos;t lose your streak!",
    messageTemplate: "Complete a learning activity today to maintain your {{streakDays}}-day streak!",
    defaultChannels: ["IN_APP", "PUSH"],
    expiresAfterHours: 24,
  },
  STREAK_ACHIEVEMENT: {
    type: "STREAK_ACHIEVEMENT",
    icon: "Trophy",
    color: "#10B981",
    titleTemplate: "Streak Milestone! 🎉",
    messageTemplate: "Amazing! You&apos;ve reached a {{streakDays}}-day learning streak!",
    defaultChannels: ["IN_APP"],
  },
  GOAL_PROGRESS: {
    type: "GOAL_PROGRESS",
    icon: "Target",
    color: "#8B5CF6",
    titleTemplate: "Goal Progress Update",
    messageTemplate: "You&apos;re {{progress}}% towards your goal: {{goalTitle}}",
    defaultChannels: ["IN_APP"],
  },
  GOAL_COMPLETED: {
    type: "GOAL_COMPLETED",
    icon: "CheckCircle",
    color: "#10B981",
    titleTemplate: "Goal Completed! 🎯",
    messageTemplate: "Congratulations! You&apos;ve completed your goal: {{goalTitle}}",
    defaultChannels: ["IN_APP", "EMAIL"],
  },
  WEEKLY_SUMMARY: {
    type: "WEEKLY_SUMMARY",
    icon: "BarChart",
    color: "#6366F1",
    titleTemplate: "Your Weekly Learning Summary",
    messageTemplate: "This week: {{hoursLearned}} hours learned, {{activitiesCompleted}} activities completed.",
    defaultChannels: ["EMAIL", "IN_APP"],
  },
  STUDY_SUGGESTION: {
    type: "STUDY_SUGGESTION",
    icon: "Lightbulb",
    color: "#F59E0B",
    titleTemplate: "Learning Suggestion",
    messageTemplate: "{{suggestion}}",
    defaultChannels: ["IN_APP"],
    expiresAfterHours: 48,
  },
  BREAK_REMINDER: {
    type: "BREAK_REMINDER",
    icon: "Coffee",
    color: "#14B8A6",
    titleTemplate: "Time for a Break",
    messageTemplate: "You&apos;ve been learning for {{minutesStudied}} minutes. Take a {{breakDuration}}-minute break to recharge!",
    defaultChannels: ["IN_APP"],
    expiresAfterHours: 1,
  },
};

// ==========================================
// Notification Display Helpers
// ==========================================

export interface NotificationDisplayConfig {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

export const getNotificationDisplayConfig = (
  type: LearningAlertType
): NotificationDisplayConfig => {
  const configs: Record<LearningAlertType, NotificationDisplayConfig> = {
    REMINDER: {
      icon: "Bell",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
      badgeVariant: "default",
    },
    DEADLINE: {
      icon: "Clock",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      textColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
      badgeVariant: "destructive",
    },
    STREAK_WARNING: {
      icon: "Flame",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      badgeVariant: "secondary",
    },
    STREAK_ACHIEVEMENT: {
      icon: "Trophy",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      badgeVariant: "default",
    },
    GOAL_PROGRESS: {
      icon: "Target",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
      textColor: "text-violet-600 dark:text-violet-400",
      borderColor: "border-violet-200 dark:border-violet-800",
      badgeVariant: "secondary",
    },
    GOAL_COMPLETED: {
      icon: "CheckCircle",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      badgeVariant: "default",
    },
    WEEKLY_SUMMARY: {
      icon: "BarChart",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
      textColor: "text-indigo-600 dark:text-indigo-400",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      badgeVariant: "outline",
    },
    STUDY_SUGGESTION: {
      icon: "Lightbulb",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      badgeVariant: "secondary",
    },
    BREAK_REMINDER: {
      icon: "Coffee",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      textColor: "text-teal-600 dark:text-teal-400",
      borderColor: "border-teal-200 dark:border-teal-800",
      badgeVariant: "outline",
    },
  };

  return configs[type];
};

// ==========================================
// Type Guards
// ==========================================

export const isLearningAlertType = (value: string): value is LearningAlertType => {
  const validTypes: LearningAlertType[] = [
    "REMINDER",
    "DEADLINE",
    "STREAK_WARNING",
    "STREAK_ACHIEVEMENT",
    "GOAL_PROGRESS",
    "GOAL_COMPLETED",
    "WEEKLY_SUMMARY",
    "STUDY_SUGGESTION",
    "BREAK_REMINDER",
  ];
  return validTypes.includes(value as LearningAlertType);
};

export const isAlertChannel = (value: string): value is AlertChannel => {
  const validChannels: AlertChannel[] = ["IN_APP", "EMAIL", "PUSH", "SMS"];
  return validChannels.includes(value as AlertChannel);
};

// ==========================================
// Time-based Notification Helpers
// ==========================================

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const REMINDER_INTERVALS = [
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
] as const;

export const BREAK_INTERVALS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 45, label: "Every 45 minutes" },
  { value: 60, label: "Every hour" },
  { value: 90, label: "Every 1.5 hours" },
  { value: 120, label: "Every 2 hours" },
] as const;

export const BREAK_DURATIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
] as const;
