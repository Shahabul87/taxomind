/**
 * Google Calendar OAuth Callback
 * Phase 4: Google Calendar Integration
 *
 * GET /api/calendar/callback - Handle OAuth callback from Google
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  exchangeCodeForTokens,
  getUserInfo,
  listCalendars,
  DEFAULT_SYNC_SETTINGS,
} from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorUrl = new URL('/dashboard/user/settings', process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('calendar_error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      const errorUrl = new URL('/dashboard/user/settings', process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('calendar_error', 'no_code');
      return NextResponse.redirect(errorUrl);
    }

    // Verify state parameter
    let stateData: { userId: string; timestamp: number } | null = null;
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch {
        // Invalid state
      }
    }

    // Get current user
    const user = await currentUser();
    if (!user?.id) {
      const errorUrl = new URL('/auth/signin', process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('callbackUrl', '/dashboard/user/settings?tab=calendar');
      return NextResponse.redirect(errorUrl);
    }

    // Verify state matches user (optional security check)
    if (stateData && stateData.userId !== user.id) {
      const errorUrl = new URL('/dashboard/user/settings', process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set('calendar_error', 'state_mismatch');
      return NextResponse.redirect(errorUrl);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info from Google
    const googleUserInfo = await getUserInfo(tokens.access_token);

    // Get list of calendars
    const calendars = await listCalendars(tokens.access_token, tokens.refresh_token);

    // Find primary calendar
    const primaryCalendar = calendars.find((c) => c.primary) || calendars[0];

    // Check if integration already exists
    const existingIntegration = await db.googleCalendarIntegration.findUnique({
      where: { userId: user.id },
    });

    if (existingIntegration) {
      // Update existing integration
      await db.googleCalendarIntegration.update({
        where: { userId: user.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope,
          googleEmail: googleUserInfo.email,
          googleAccountId: googleUserInfo.id,
          selectedCalendarId: primaryCalendar?.id ?? null,
          selectedCalendarName: primaryCalendar?.summary ?? null,
          status: 'CONNECTED',
          lastSyncError: null,
          syncErrorCount: 0,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new integration with default settings
      await db.googleCalendarIntegration.create({
        data: {
          userId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope,
          googleEmail: googleUserInfo.email,
          googleAccountId: googleUserInfo.id,
          selectedCalendarId: primaryCalendar?.id ?? null,
          selectedCalendarName: primaryCalendar?.summary ?? null,
          status: 'CONNECTED',
          // Default sync settings
          syncDirection: DEFAULT_SYNC_SETTINGS.syncDirection,
          autoSyncEnabled: DEFAULT_SYNC_SETTINGS.autoSyncEnabled,
          autoSyncIntervalMinutes: DEFAULT_SYNC_SETTINGS.autoSyncIntervalMinutes,
          syncStudySessions: DEFAULT_SYNC_SETTINGS.syncStudySessions,
          syncQuizzes: DEFAULT_SYNC_SETTINGS.syncQuizzes,
          syncAssignments: DEFAULT_SYNC_SETTINGS.syncAssignments,
          syncGoalMilestones: DEFAULT_SYNC_SETTINGS.syncGoalMilestones,
          syncLiveClasses: DEFAULT_SYNC_SETTINGS.syncLiveClasses,
          syncDailyTodos: DEFAULT_SYNC_SETTINGS.syncDailyTodos,
          studySessionColor: DEFAULT_SYNC_SETTINGS.studySessionColor,
          quizColor: DEFAULT_SYNC_SETTINGS.quizColor,
          assignmentColor: DEFAULT_SYNC_SETTINGS.assignmentColor,
          goalColor: DEFAULT_SYNC_SETTINGS.goalColor,
          liveClassColor: DEFAULT_SYNC_SETTINGS.liveClassColor,
          defaultReminderMinutes: DEFAULT_SYNC_SETTINGS.defaultReminderMinutes,
          includeDescription: DEFAULT_SYNC_SETTINGS.includeDescription,
          includeCourseLink: DEFAULT_SYNC_SETTINGS.includeCourseLink,
        },
      });
    }

    // Create sync log for initial connection
    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId: user.id },
    });

    if (integration) {
      await db.calendarSyncLog.create({
        data: {
          integrationId: integration.id,
          syncType: 'initial',
          direction: 'TAXOMIND_TO_GOOGLE',
          status: 'success',
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 0,
        },
      });
    }

    // Redirect to settings page with success
    const successUrl = new URL('/dashboard/user/settings', process.env.NEXT_PUBLIC_APP_URL);
    successUrl.searchParams.set('tab', 'calendar');
    successUrl.searchParams.set('calendar_connected', 'true');
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Calendar Callback Error:', error);

    const errorUrl = new URL('/dashboard/user/settings', process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set('tab', 'calendar');
    errorUrl.searchParams.set('calendar_error', 'connection_failed');
    return NextResponse.redirect(errorUrl);
  }
}
