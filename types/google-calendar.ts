/**
 * Google Calendar Integration Types
 * Phase 4: Google Calendar Integration
 *
 * Type definitions for Google Calendar OAuth, sync settings, and event management.
 */

// ==========================================
// OAuth Types
// ==========================================

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  tokens?: GoogleOAuthTokens;
  userInfo?: GoogleUserInfo;
  error?: string;
}

// ==========================================
// Calendar Types
// ==========================================

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
}

export interface GoogleCalendarList {
  items: GoogleCalendar[];
  nextPageToken?: string;
}

// ==========================================
// Event Types
// ==========================================

export interface GoogleEventDateTime {
  dateTime?: string; // RFC3339 timestamp
  date?: string; // YYYY-MM-DD for all-day events
  timeZone?: string;
}

export interface GoogleEventReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface GoogleEventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  colorId?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  recurrence?: string[];
  attendees?: GoogleEventAttendee[];
  reminders?: {
    useDefault: boolean;
    overrides?: GoogleEventReminder[];
  };
  // Extended properties for Taxomind metadata
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  // Read-only fields
  etag?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  creator?: { email: string; displayName?: string };
  organizer?: { email: string; displayName?: string };
}

export interface GoogleEventList {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// ==========================================
// Sync Types
// ==========================================

export type SyncDirection = 'TAXOMIND_TO_GOOGLE' | 'GOOGLE_TO_TAXOMIND' | 'TWO_WAY';

export type SyncStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'EXPIRED';

export type CalendarEventType =
  | 'STUDY_SESSION'
  | 'QUIZ_EXAM'
  | 'ASSIGNMENT'
  | 'GOAL_MILESTONE'
  | 'LIVE_CLASS'
  | 'DAILY_TODO';

export interface SyncSettings {
  syncDirection: SyncDirection;
  autoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number;
  // What to sync
  syncStudySessions: boolean;
  syncQuizzes: boolean;
  syncAssignments: boolean;
  syncGoalMilestones: boolean;
  syncLiveClasses: boolean;
  syncDailyTodos: boolean;
  // Event colors (Google Calendar color IDs: 1-11)
  studySessionColor: string;
  quizColor: string;
  assignmentColor: string;
  goalColor: string;
  liveClassColor: string;
  // Event preferences
  defaultReminderMinutes: number;
  includeDescription: boolean;
  includeCourseLink: boolean;
}

export interface CalendarIntegration {
  id: string;
  userId: string;
  googleEmail: string;
  googleAccountId?: string;
  selectedCalendarId?: string;
  selectedCalendarName?: string;
  createDedicatedCalendar: boolean;
  status: SyncStatus;
  lastSyncAt?: Date;
  lastSyncError?: string;
  syncErrorCount: number;
  settings: SyncSettings;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Sync Result Types
// ==========================================

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  eventsFailed: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface SyncError {
  entityType: CalendarEventType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  errorCode: string;
  errorMessage: string;
}

export interface EventMapping {
  id: string;
  userId: string;
  entityType: CalendarEventType;
  entityId: string;
  googleEventId: string;
  googleCalendarId: string;
  lastSyncedAt: Date;
  googleEtag?: string;
  taxomindVersion: number;
  isDeleted: boolean;
}

// ==========================================
// API Request/Response Types
// ==========================================

export interface ConnectCalendarRequest {
  authorizationCode: string;
  redirectUri: string;
}

export interface ConnectCalendarResponse {
  success: boolean;
  integration?: CalendarIntegration;
  calendars?: GoogleCalendar[];
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdateSettingsRequest {
  selectedCalendarId?: string;
  createDedicatedCalendar?: boolean;
  settings?: Partial<SyncSettings>;
}

export interface UpdateSettingsResponse {
  success: boolean;
  integration?: CalendarIntegration;
  error?: {
    code: string;
    message: string;
  };
}

export interface TriggerSyncRequest {
  syncType: 'full' | 'incremental';
  eventTypes?: CalendarEventType[];
}

export interface TriggerSyncResponse {
  success: boolean;
  syncId?: string;
  result?: SyncResult;
  error?: {
    code: string;
    message: string;
  };
}

export interface DisconnectResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// ==========================================
// UI Component Props
// ==========================================

export interface CalendarSyncSettingsProps {
  integration?: CalendarIntegration;
  calendars?: GoogleCalendar[];
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onUpdateSettings: (settings: UpdateSettingsRequest) => Promise<void>;
  onTriggerSync: (request: TriggerSyncRequest) => Promise<SyncResult>;
  isLoading?: boolean;
}

export interface CalendarConnectionStatusProps {
  status: SyncStatus;
  lastSyncAt?: Date;
  lastSyncError?: string;
  googleEmail?: string;
  onRefresh?: () => void;
}

// ==========================================
// Google Calendar Color Reference
// ==========================================

export const GOOGLE_CALENDAR_COLORS: Record<string, { name: string; hex: string }> = {
  '1': { name: 'Lavender', hex: '#7986cb' },
  '2': { name: 'Sage', hex: '#33b679' },
  '3': { name: 'Grape', hex: '#8e24aa' },
  '4': { name: 'Flamingo', hex: '#e67c73' },
  '5': { name: 'Banana', hex: '#f6bf26' },
  '6': { name: 'Tangerine', hex: '#f4511e' },
  '7': { name: 'Peacock', hex: '#039be5' },
  '8': { name: 'Graphite', hex: '#616161' },
  '9': { name: 'Blueberry', hex: '#3f51b5' },
  '10': { name: 'Basil', hex: '#0b8043' },
  '11': { name: 'Tomato', hex: '#d50000' },
};

// ==========================================
// Default Settings
// ==========================================

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  syncDirection: 'TAXOMIND_TO_GOOGLE',
  autoSyncEnabled: true,
  autoSyncIntervalMinutes: 15,
  syncStudySessions: true,
  syncQuizzes: true,
  syncAssignments: true,
  syncGoalMilestones: true,
  syncLiveClasses: true,
  syncDailyTodos: false,
  studySessionColor: '1', // Lavender
  quizColor: '11', // Tomato
  assignmentColor: '5', // Banana
  goalColor: '10', // Basil
  liveClassColor: '3', // Grape
  defaultReminderMinutes: 15,
  includeDescription: true,
  includeCourseLink: true,
};

// ==========================================
// Sync Interval Options
// ==========================================

export const SYNC_INTERVAL_OPTIONS = [
  { value: 5, label: 'Every 5 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Once a day' },
] as const;

// ==========================================
// Status Display Config
// ==========================================

export const SYNC_STATUS_CONFIG: Record<SyncStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  CONNECTED: {
    label: 'Connected',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'CheckCircle',
  },
  DISCONNECTED: {
    label: 'Disconnected',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: 'XCircle',
  },
  SYNCING: {
    label: 'Syncing...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'RefreshCw',
  },
  ERROR: {
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'AlertCircle',
  },
  EXPIRED: {
    label: 'Session Expired',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'Clock',
  },
};
