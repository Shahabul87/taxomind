/**
 * Google Calendar Integration Library
 * Phase 4: Google Calendar Integration
 *
 * Core utilities for Google Calendar OAuth and API operations.
 */

import { google, calendar_v3 } from 'googleapis';
import { db } from '@/lib/db';
import {
  GoogleOAuthTokens,
  GoogleUserInfo,
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleEventList,
  SyncResult,
  SyncError,
  CalendarEventType,
  DEFAULT_SYNC_SETTINGS,
} from '@/types/google-calendar';

// ==========================================
// OAuth Configuration
// ==========================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Create an OAuth2 client instance
 */
function createOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar credentials not configured');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || refreshToken,
    scope: credentials.scope || SCOPES.join(' '),
    token_type: credentials.token_type || 'Bearer',
    expiry_date: credentials.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    id: data.id || '',
    email: data.email || '',
    name: data.name ?? undefined,
    picture: data.picture ?? undefined,
  };
}

/**
 * Revoke access (disconnect)
 */
export async function revokeAccess(accessToken: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  await oauth2Client.revokeToken(accessToken);
}

// ==========================================
// Calendar API Client
// ==========================================

/**
 * Create an authenticated Calendar API client
 */
export function createCalendarClient(accessToken: string, refreshToken: string): calendar_v3.Calendar {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Get list of user's calendars
 */
export async function listCalendars(
  accessToken: string,
  refreshToken: string
): Promise<GoogleCalendar[]> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const { data } = await calendar.calendarList.list({
    minAccessRole: 'writer',
  });

  return (data.items || []).map((item) => ({
    id: item.id || '',
    summary: item.summary || '',
    description: item.description ?? undefined,
    timeZone: item.timeZone ?? undefined,
    colorId: item.colorId ?? undefined,
    backgroundColor: item.backgroundColor ?? undefined,
    foregroundColor: item.foregroundColor ?? undefined,
    selected: item.selected ?? undefined,
    primary: item.primary ?? undefined,
    accessRole: item.accessRole as GoogleCalendar['accessRole'],
  }));
}

/**
 * Create a dedicated Taxomind calendar
 */
export async function createTaxomindCalendar(
  accessToken: string,
  refreshToken: string
): Promise<GoogleCalendar> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const { data } = await calendar.calendars.insert({
    requestBody: {
      summary: 'Taxomind Learning',
      description: 'Learning activities synced from Taxomind LMS',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  return {
    id: data.id || '',
    summary: data.summary || 'Taxomind Learning',
    description: data.description ?? undefined,
    timeZone: data.timeZone ?? undefined,
  };
}

// ==========================================
// Event Operations
// ==========================================

/**
 * Create a calendar event
 */
export async function createEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<GoogleCalendarEvent> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return mapGoogleEventToType(data);
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const { data } = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
  });

  return mapGoogleEventToType(data);
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * Get a single event
 */
export async function getEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<GoogleCalendarEvent | null> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  try {
    const { data } = await calendar.events.get({
      calendarId,
      eventId,
    });

    return mapGoogleEventToType(data);
  } catch (error) {
    // Event not found
    return null;
  }
}

/**
 * List events in a date range
 */
export async function listEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
    syncToken?: string;
  } = {}
): Promise<GoogleEventList> {
  const calendar = createCalendarClient(accessToken, refreshToken);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    maxResults: options.maxResults || 250,
    pageToken: options.pageToken,
    syncToken: options.syncToken,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return {
    items: (data.items || []).map(mapGoogleEventToType),
    nextPageToken: data.nextPageToken ?? undefined,
    nextSyncToken: data.nextSyncToken ?? undefined,
  };
}

// ==========================================
// Helper Functions
// ==========================================

function mapGoogleEventToType(event: calendar_v3.Schema$Event): GoogleCalendarEvent {
  return {
    id: event.id ?? undefined,
    summary: event.summary || '',
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: event.start?.dateTime ?? undefined,
      date: event.start?.date ?? undefined,
      timeZone: event.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? undefined,
      date: event.end?.date ?? undefined,
      timeZone: event.end?.timeZone ?? undefined,
    },
    colorId: event.colorId ?? undefined,
    status: event.status as GoogleCalendarEvent['status'],
    recurrence: event.recurrence ?? undefined,
    etag: event.etag ?? undefined,
    htmlLink: event.htmlLink ?? undefined,
    created: event.created ?? undefined,
    updated: event.updated ?? undefined,
    extendedProperties: event.extendedProperties as GoogleCalendarEvent['extendedProperties'],
  };
}

// ==========================================
// Token Management
// ==========================================

/**
 * Get valid tokens for a user, refreshing if necessary
 */
export async function getValidTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const integration = await db.googleCalendarIntegration.findUnique({
    where: { userId },
  });

  if (!integration) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = integration.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    try {
      const newTokens = await refreshAccessToken(integration.refreshToken);

      // Update tokens in database
      await db.googleCalendarIntegration.update({
        where: { userId },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          tokenExpiresAt: new Date(newTokens.expiry_date),
          status: 'CONNECTED',
          syncErrorCount: 0,
        },
      });

      return {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
      };
    } catch (error) {
      // Mark integration as expired
      await db.googleCalendarIntegration.update({
        where: { userId },
        data: {
          status: 'EXPIRED',
          lastSyncError: 'Token refresh failed',
        },
      });

      return null;
    }
  }

  return {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
  };
}

// ==========================================
// Event Builder Helpers
// ==========================================

/**
 * Build a Google Calendar event from a Taxomind learning activity
 */
export function buildEventFromActivity(
  activity: {
    id: string;
    title: string;
    description?: string | null;
    scheduledDate: Date;
    startTime?: string | null;
    endTime?: string | null;
    estimatedDuration: number;
    courseId?: string | null;
    type: string;
  },
  settings: {
    colorId: string;
    includeDescription: boolean;
    includeCourseLink: boolean;
    defaultReminderMinutes: number;
  },
  courseTitle?: string
): GoogleCalendarEvent {
  const startDateTime = activity.startTime
    ? new Date(`${activity.scheduledDate.toISOString().split('T')[0]}T${activity.startTime}:00`)
    : activity.scheduledDate;

  const endDateTime = activity.endTime
    ? new Date(`${activity.scheduledDate.toISOString().split('T')[0]}T${activity.endTime}:00`)
    : new Date(startDateTime.getTime() + activity.estimatedDuration * 60000);

  let description = '';
  if (settings.includeDescription && activity.description) {
    description = activity.description;
  }
  if (settings.includeCourseLink && activity.courseId) {
    const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${activity.courseId}`;
    description += `\n\n📚 Course: ${courseTitle || 'View Course'}\n${courseUrl}`;
  }
  description += '\n\n🤖 Synced from Taxomind';

  return {
    summary: `📖 ${activity.title}`,
    description: description.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: settings.colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: settings.defaultReminderMinutes },
      ],
    },
    extendedProperties: {
      private: {
        taxomindEntityId: activity.id,
        taxomindEntityType: activity.type,
        taxomindSource: 'true',
      },
    },
  };
}

/**
 * Build event from a quiz/exam deadline
 */
export function buildEventFromQuiz(
  quiz: {
    id: string;
    title: string;
    dueDate: Date;
    courseId: string;
    duration?: number;
  },
  settings: {
    colorId: string;
    defaultReminderMinutes: number;
    includeCourseLink: boolean;
  },
  courseTitle?: string
): GoogleCalendarEvent {
  const startDateTime = quiz.dueDate;
  const endDateTime = new Date(startDateTime.getTime() + (quiz.duration || 60) * 60000);

  let description = `⏰ Deadline for ${quiz.title}`;
  if (settings.includeCourseLink) {
    const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${quiz.courseId}/quiz/${quiz.id}`;
    description += `\n\n📝 Take Quiz: ${quizUrl}`;
    if (courseTitle) {
      description += `\n📚 Course: ${courseTitle}`;
    }
  }
  description += '\n\n🤖 Synced from Taxomind';

  return {
    summary: `📝 Quiz: ${quiz.title}`,
    description: description.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: settings.colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: settings.defaultReminderMinutes },
        { method: 'popup', minutes: 1440 }, // 24 hours before
      ],
    },
    extendedProperties: {
      private: {
        taxomindEntityId: quiz.id,
        taxomindEntityType: 'QUIZ_EXAM',
        taxomindSource: 'true',
      },
    },
  };
}

/**
 * Build event from a goal milestone
 */
export function buildEventFromGoalMilestone(
  milestone: {
    id: string;
    title: string;
    targetDate: Date;
    goalTitle: string;
  },
  settings: {
    colorId: string;
    defaultReminderMinutes: number;
  }
): GoogleCalendarEvent {
  return {
    summary: `🎯 Goal Milestone: ${milestone.title}`,
    description: `Part of goal: ${milestone.goalTitle}\n\n🤖 Synced from Taxomind`,
    start: {
      date: milestone.targetDate.toISOString().split('T')[0],
    },
    end: {
      date: milestone.targetDate.toISOString().split('T')[0],
    },
    colorId: settings.colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: settings.defaultReminderMinutes },
      ],
    },
    extendedProperties: {
      private: {
        taxomindEntityId: milestone.id,
        taxomindEntityType: 'GOAL_MILESTONE',
        taxomindSource: 'true',
      },
    },
  };
}

// Export everything
export * from '@/types/google-calendar';
