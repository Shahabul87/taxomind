/**
 * Google Calendar Connection Status
 * Phase 4: Google Calendar Integration
 *
 * GET /api/calendar/status - Get connection status and settings
 * DELETE /api/calendar/status - Disconnect from Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { revokeAccess, listCalendars, getValidTokens } from '@/lib/google-calendar';
import type { CalendarIntegration, SyncSettings, GoogleCalendar } from '@/types/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId: user.id },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          integration: null,
          calendars: [],
        },
      });
    }

    // Get valid tokens and fetch calendars
    let calendars: GoogleCalendar[] = [];
    const tokens = await getValidTokens(user.id);

    if (tokens) {
      try {
        calendars = await listCalendars(tokens.accessToken, tokens.refreshToken);
      } catch (error) {
        console.error('Failed to fetch calendars:', error);
      }
    }

    // Build response
    const settings: SyncSettings = {
      syncDirection: integration.syncDirection as SyncSettings['syncDirection'],
      autoSyncEnabled: integration.autoSyncEnabled,
      autoSyncIntervalMinutes: integration.autoSyncIntervalMinutes,
      syncStudySessions: integration.syncStudySessions,
      syncQuizzes: integration.syncQuizzes,
      syncAssignments: integration.syncAssignments,
      syncGoalMilestones: integration.syncGoalMilestones,
      syncLiveClasses: integration.syncLiveClasses,
      syncDailyTodos: integration.syncDailyTodos,
      studySessionColor: integration.studySessionColor,
      quizColor: integration.quizColor,
      assignmentColor: integration.assignmentColor,
      goalColor: integration.goalColor,
      liveClassColor: integration.liveClassColor,
      defaultReminderMinutes: integration.defaultReminderMinutes,
      includeDescription: integration.includeDescription,
      includeCourseLink: integration.includeCourseLink,
    };

    const integrationData: CalendarIntegration = {
      id: integration.id,
      userId: integration.userId,
      googleEmail: integration.googleEmail,
      googleAccountId: integration.googleAccountId ?? undefined,
      selectedCalendarId: integration.selectedCalendarId ?? undefined,
      selectedCalendarName: integration.selectedCalendarName ?? undefined,
      createDedicatedCalendar: integration.createDedicatedCalendar,
      status: integration.status as CalendarIntegration['status'],
      lastSyncAt: integration.lastSyncAt ?? undefined,
      lastSyncError: integration.lastSyncError ?? undefined,
      syncErrorCount: integration.syncErrorCount,
      settings,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: {
        connected: integration.status === 'CONNECTED',
        integration: integrationData,
        calendars,
        recentSyncs: integration.syncLogs.map((log) => ({
          id: log.id,
          syncType: log.syncType,
          status: log.status,
          eventsCreated: log.eventsCreated,
          eventsUpdated: log.eventsUpdated,
          eventsDeleted: log.eventsDeleted,
          eventsFailed: log.eventsFailed,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
          durationMs: log.durationMs,
          errorMessage: log.errorMessage,
        })),
      },
    });
  } catch (error) {
    console.error('Calendar Status Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch calendar status',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'No calendar integration found' },
        },
        { status: 404 }
      );
    }

    // Try to revoke Google access
    try {
      await revokeAccess(integration.accessToken);
    } catch (error) {
      // Continue even if revoke fails (token might already be invalid)
      console.error('Failed to revoke Google access:', error);
    }

    // Delete event mappings
    await db.calendarEventMapping.deleteMany({
      where: { userId: user.id },
    });

    // Delete sync logs
    await db.calendarSyncLog.deleteMany({
      where: { integrationId: integration.id },
    });

    // Delete integration
    await db.googleCalendarIntegration.delete({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: { disconnected: true },
    });
  } catch (error) {
    console.error('Calendar Disconnect Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to disconnect calendar',
        },
      },
      { status: 500 }
    );
  }
}
