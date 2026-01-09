/**
 * Google Calendar Settings
 * Phase 4: Google Calendar Integration
 *
 * GET /api/calendar/settings - Get current settings
 * PUT /api/calendar/settings - Update calendar sync settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  getValidTokens,
  listCalendars,
  createTaxomindCalendar,
} from '@/lib/google-calendar';

const updateSettingsSchema = z.object({
  selectedCalendarId: z.string().optional(),
  createDedicatedCalendar: z.boolean().optional(),
  syncDirection: z.enum(['TAXOMIND_TO_GOOGLE', 'GOOGLE_TO_TAXOMIND', 'TWO_WAY']).optional(),
  autoSyncEnabled: z.boolean().optional(),
  autoSyncIntervalMinutes: z.number().min(5).max(1440).optional(),
  syncStudySessions: z.boolean().optional(),
  syncQuizzes: z.boolean().optional(),
  syncAssignments: z.boolean().optional(),
  syncGoalMilestones: z.boolean().optional(),
  syncLiveClasses: z.boolean().optional(),
  syncDailyTodos: z.boolean().optional(),
  studySessionColor: z.string().optional(),
  quizColor: z.string().optional(),
  assignmentColor: z.string().optional(),
  goalColor: z.string().optional(),
  liveClassColor: z.string().optional(),
  defaultReminderMinutes: z.number().min(0).max(10080).optional(),
  includeDescription: z.boolean().optional(),
  includeCourseLink: z.boolean().optional(),
});

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
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: integration.id,
        selectedCalendarId: integration.selectedCalendarId,
        selectedCalendarName: integration.selectedCalendarName,
        createDedicatedCalendar: integration.createDedicatedCalendar,
        syncDirection: integration.syncDirection,
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
      },
    });
  } catch (error) {
    console.error('Calendar Settings Get Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch calendar settings',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = updateSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid settings data',
            details: parseResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const settings = parseResult.data;

    // Get existing integration
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

    // Handle dedicated calendar creation
    let selectedCalendarId = settings.selectedCalendarId ?? integration.selectedCalendarId;
    let selectedCalendarName = integration.selectedCalendarName;

    if (settings.createDedicatedCalendar && !integration.createDedicatedCalendar) {
      // User wants to create a dedicated calendar
      const tokens = await getValidTokens(user.id);

      if (tokens) {
        try {
          const newCalendar = await createTaxomindCalendar(
            tokens.accessToken,
            tokens.refreshToken
          );
          selectedCalendarId = newCalendar.id;
          selectedCalendarName = newCalendar.summary;
        } catch (error) {
          console.error('Failed to create dedicated calendar:', error);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CALENDAR_CREATE_FAILED',
                message: 'Failed to create dedicated Taxomind calendar',
              },
            },
            { status: 500 }
          );
        }
      }
    } else if (settings.selectedCalendarId && settings.selectedCalendarId !== integration.selectedCalendarId) {
      // User selected a different calendar
      const tokens = await getValidTokens(user.id);

      if (tokens) {
        try {
          const calendars = await listCalendars(tokens.accessToken, tokens.refreshToken);
          const selectedCalendar = calendars.find((c) => c.id === settings.selectedCalendarId);

          if (selectedCalendar) {
            selectedCalendarName = selectedCalendar.summary;
          }
        } catch (error) {
          console.error('Failed to fetch calendar details:', error);
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Calendar selection
    if (selectedCalendarId !== undefined) {
      updateData.selectedCalendarId = selectedCalendarId;
      updateData.selectedCalendarName = selectedCalendarName;
    }

    if (settings.createDedicatedCalendar !== undefined) {
      updateData.createDedicatedCalendar = settings.createDedicatedCalendar;
    }

    // Sync settings
    if (settings.syncDirection !== undefined) {
      updateData.syncDirection = settings.syncDirection;
    }

    if (settings.autoSyncEnabled !== undefined) {
      updateData.autoSyncEnabled = settings.autoSyncEnabled;
    }

    if (settings.autoSyncIntervalMinutes !== undefined) {
      updateData.autoSyncIntervalMinutes = settings.autoSyncIntervalMinutes;
    }

    // What to sync
    if (settings.syncStudySessions !== undefined) {
      updateData.syncStudySessions = settings.syncStudySessions;
    }

    if (settings.syncQuizzes !== undefined) {
      updateData.syncQuizzes = settings.syncQuizzes;
    }

    if (settings.syncAssignments !== undefined) {
      updateData.syncAssignments = settings.syncAssignments;
    }

    if (settings.syncGoalMilestones !== undefined) {
      updateData.syncGoalMilestones = settings.syncGoalMilestones;
    }

    if (settings.syncLiveClasses !== undefined) {
      updateData.syncLiveClasses = settings.syncLiveClasses;
    }

    if (settings.syncDailyTodos !== undefined) {
      updateData.syncDailyTodos = settings.syncDailyTodos;
    }

    // Event colors
    if (settings.studySessionColor !== undefined) {
      updateData.studySessionColor = settings.studySessionColor;
    }

    if (settings.quizColor !== undefined) {
      updateData.quizColor = settings.quizColor;
    }

    if (settings.assignmentColor !== undefined) {
      updateData.assignmentColor = settings.assignmentColor;
    }

    if (settings.goalColor !== undefined) {
      updateData.goalColor = settings.goalColor;
    }

    if (settings.liveClassColor !== undefined) {
      updateData.liveClassColor = settings.liveClassColor;
    }

    // Event preferences
    if (settings.defaultReminderMinutes !== undefined) {
      updateData.defaultReminderMinutes = settings.defaultReminderMinutes;
    }

    if (settings.includeDescription !== undefined) {
      updateData.includeDescription = settings.includeDescription;
    }

    if (settings.includeCourseLink !== undefined) {
      updateData.includeCourseLink = settings.includeCourseLink;
    }

    // Update integration
    const updatedIntegration = await db.googleCalendarIntegration.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedIntegration.id,
        selectedCalendarId: updatedIntegration.selectedCalendarId,
        selectedCalendarName: updatedIntegration.selectedCalendarName,
        createDedicatedCalendar: updatedIntegration.createDedicatedCalendar,
        syncDirection: updatedIntegration.syncDirection,
        autoSyncEnabled: updatedIntegration.autoSyncEnabled,
        autoSyncIntervalMinutes: updatedIntegration.autoSyncIntervalMinutes,
        syncStudySessions: updatedIntegration.syncStudySessions,
        syncQuizzes: updatedIntegration.syncQuizzes,
        syncAssignments: updatedIntegration.syncAssignments,
        syncGoalMilestones: updatedIntegration.syncGoalMilestones,
        syncLiveClasses: updatedIntegration.syncLiveClasses,
        syncDailyTodos: updatedIntegration.syncDailyTodos,
        studySessionColor: updatedIntegration.studySessionColor,
        quizColor: updatedIntegration.quizColor,
        assignmentColor: updatedIntegration.assignmentColor,
        goalColor: updatedIntegration.goalColor,
        liveClassColor: updatedIntegration.liveClassColor,
        defaultReminderMinutes: updatedIntegration.defaultReminderMinutes,
        includeDescription: updatedIntegration.includeDescription,
        includeCourseLink: updatedIntegration.includeCourseLink,
        updatedAt: updatedIntegration.updatedAt,
      },
    });
  } catch (error) {
    console.error('Calendar Settings Update Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update calendar settings',
        },
      },
      { status: 500 }
    );
  }
}
