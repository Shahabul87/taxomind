/**
 * Google Calendar Learning Activity Sync API
 * Phase 4: Google Calendar Integration
 *
 * POST /api/calendar/learning-sync - Sync learning activities to Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  getValidTokens,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  GoogleCalendarEvent,
} from '@/lib/google-calendar';

const syncRequestSchema = z.object({
  syncType: z.enum(['full', 'incremental', 'specific']).default('incremental'),
  entityTypes: z
    .array(z.enum(['STUDY_SESSION', 'QUIZ_EXAM', 'ASSIGNMENT', 'GOAL_MILESTONE', 'LIVE_CLASS', 'DAILY_TODO']))
    .optional(),
  entityIds: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
});

interface SyncStats {
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  eventsFailed: number;
  errors: Array<{ entityId: string; entityType: string; error: string }>;
}

interface IntegrationSettings {
  studySessionColor: string;
  quizColor: string;
  assignmentColor: string;
  goalColor: string;
  liveClassColor: string;
  defaultReminderMinutes: number;
  includeDescription: boolean;
  includeCourseLink: boolean;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = syncRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid sync request',
            details: parseResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { syncType, entityTypes, entityIds, dateRange } = parseResult.data;

    // Get integration and validate
    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_CONNECTED', message: 'Google Calendar not connected' },
        },
        { status: 400 }
      );
    }

    if (!integration.selectedCalendarId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_CALENDAR', message: 'No calendar selected for sync' },
        },
        { status: 400 }
      );
    }

    // Get valid tokens
    const tokens = await getValidTokens(user.id);
    if (!tokens) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Google Calendar authorization expired' },
        },
        { status: 401 }
      );
    }

    // Update integration status
    await db.googleCalendarIntegration.update({
      where: { userId: user.id },
      data: { status: 'SYNCING' },
    });

    const stats: SyncStats = {
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      eventsFailed: 0,
      errors: [],
    };

    const calendarId = integration.selectedCalendarId;

    // Build date range filter
    const now = new Date();
    const dateStart = dateRange?.start ? new Date(dateRange.start) : now;
    const dateEnd = dateRange?.end
      ? new Date(dateRange.end)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    const settings: IntegrationSettings = {
      studySessionColor: integration.studySessionColor,
      quizColor: integration.quizColor,
      assignmentColor: integration.assignmentColor,
      goalColor: integration.goalColor,
      liveClassColor: integration.liveClassColor,
      defaultReminderMinutes: integration.defaultReminderMinutes,
      includeDescription: integration.includeDescription,
      includeCourseLink: integration.includeCourseLink,
    };

    // Sync Study Sessions
    if (!entityTypes || entityTypes.includes('STUDY_SESSION')) {
      if (integration.syncStudySessions) {
        await syncStudySessions(
          user.id,
          tokens,
          calendarId,
          settings,
          dateStart,
          dateEnd,
          syncType,
          entityIds,
          stats
        );
      }
    }

    // Sync Todos (as Daily Todos)
    if (!entityTypes || entityTypes.includes('DAILY_TODO')) {
      if (integration.syncDailyTodos) {
        await syncTodos(
          user.id,
          tokens,
          calendarId,
          settings,
          dateStart,
          dateEnd,
          syncType,
          entityIds,
          stats
        );
      }
    }

    // Sync Goal Milestones
    if (!entityTypes || entityTypes.includes('GOAL_MILESTONE')) {
      if (integration.syncGoalMilestones) {
        await syncGoalMilestones(
          user.id,
          tokens,
          calendarId,
          settings,
          dateStart,
          dateEnd,
          syncType,
          entityIds,
          stats
        );
      }
    }

    // Sync Activities (Assignments, Quizzes)
    if (!entityTypes || entityTypes.includes('ASSIGNMENT') || entityTypes.includes('QUIZ_EXAM')) {
      await syncActivities(
        user.id,
        tokens,
        calendarId,
        settings,
        dateStart,
        dateEnd,
        syncType,
        entityIds,
        entityTypes,
        stats
      );
    }

    const durationMs = Date.now() - startTime;

    // Update integration status and last sync
    await db.googleCalendarIntegration.update({
      where: { userId: user.id },
      data: {
        status: stats.eventsFailed > 0 ? 'ERROR' : 'CONNECTED',
        lastSyncAt: new Date(),
        lastSyncError: stats.eventsFailed > 0 ? `${stats.eventsFailed} events failed to sync` : null,
        syncErrorCount: stats.eventsFailed > 0 ? integration.syncErrorCount + 1 : 0,
      },
    });

    // Create sync log
    await db.calendarSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType,
        direction: integration.syncDirection,
        status: stats.eventsFailed > 0 ? 'partial' : 'success',
        eventsCreated: stats.eventsCreated,
        eventsUpdated: stats.eventsUpdated,
        eventsDeleted: stats.eventsDeleted,
        eventsFailed: stats.eventsFailed,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs,
        errorMessage: stats.errors.length > 0 ? JSON.stringify(stats.errors.slice(0, 10)) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        syncType,
        stats: {
          eventsCreated: stats.eventsCreated,
          eventsUpdated: stats.eventsUpdated,
          eventsDeleted: stats.eventsDeleted,
          eventsFailed: stats.eventsFailed,
        },
        durationMs,
        errors: stats.errors.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Calendar Sync Error:', error);

    // Try to update integration status
    try {
      const user = await currentUser();
      if (user?.id) {
        await db.googleCalendarIntegration.update({
          where: { userId: user.id },
          data: {
            status: 'ERROR',
            lastSyncError: error instanceof Error ? error.message : 'Unknown sync error',
          },
        });
      }
    } catch {
      // Ignore errors when updating status
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Failed to sync calendar',
        },
      },
      { status: 500 }
    );
  }
}

// ==========================================
// Sync Functions
// ==========================================

async function syncStudySessions(
  userId: string,
  tokens: { accessToken: string; refreshToken: string },
  calendarId: string,
  settings: IntegrationSettings,
  dateStart: Date,
  dateEnd: Date,
  syncType: string,
  entityIds: string[] | undefined,
  stats: SyncStats
) {
  // Find study sessions to sync
  const whereClause: Record<string, unknown> = {
    userId,
    startTime: {
      gte: dateStart,
      lte: dateEnd,
    },
    syncToGoogleCalendar: true,
  };

  if (entityIds?.length) {
    whereClause.id = { in: entityIds };
  }

  const sessions = await db.dashboardStudySession.findMany({
    where: whereClause,
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  // Batch-load all existing mappings to avoid N+1 queries
  const sessionIds = sessions.map((s) => s.id);
  const existingMappings = sessionIds.length > 0
    ? await db.calendarEventMapping.findMany({
        where: {
          userId,
          entityId: { in: sessionIds },
          entityType: 'STUDY_SESSION',
        },
      })
    : [];
  const mappingsByEntityId = new Map(existingMappings.map((m) => [m.entityId, m]));

  for (const session of sessions) {
    try {
      const eventData = buildStudySessionEvent(session, settings);

      // Look up pre-fetched mapping
      const existingMapping = mappingsByEntityId.get(session.id) || null;

      if (existingMapping) {
        // Check if Google event still exists
        const existingEvent = await getEvent(
          tokens.accessToken,
          tokens.refreshToken,
          calendarId,
          existingMapping.googleEventId
        );

        if (existingEvent) {
          // Update existing event
          await updateEvent(
            tokens.accessToken,
            tokens.refreshToken,
            calendarId,
            existingMapping.googleEventId,
            eventData
          );

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsUpdated++;
        } else {
          // Event was deleted from Google, recreate
          const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              googleEventId: newEvent.id || existingMapping.googleEventId,
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsCreated++;
        }
      } else {
        // Create new event
        const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

        await db.calendarEventMapping.create({
          data: {
            userId,
            entityId: session.id,
            entityType: 'STUDY_SESSION',
            googleEventId: newEvent.id || '',
            googleCalendarId: calendarId,
            lastSyncedAt: new Date(),
          },
        });

        // Update session with Google event ID
        await db.dashboardStudySession.update({
          where: { id: session.id },
          data: {
            googleEventId: newEvent.id,
            calendarSynced: true,
          },
        });

        stats.eventsCreated++;
      }
    } catch (error) {
      stats.eventsFailed++;
      stats.errors.push({
        entityId: session.id,
        entityType: 'STUDY_SESSION',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function syncTodos(
  userId: string,
  tokens: { accessToken: string; refreshToken: string },
  calendarId: string,
  settings: IntegrationSettings,
  dateStart: Date,
  dateEnd: Date,
  syncType: string,
  entityIds: string[] | undefined,
  stats: SyncStats
) {
  // Find todos with due dates to sync
  const whereClause: Record<string, unknown> = {
    userId,
    dueDate: {
      gte: dateStart,
      lte: dateEnd,
    },
    completed: false,
  };

  if (entityIds?.length) {
    whereClause.id = { in: entityIds };
  }

  const todos = await db.dashboardTodo.findMany({
    where: whereClause,
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  // Batch-load all existing mappings to avoid N+1 queries
  const todoIds = todos.map((t) => t.id);
  const existingTodoMappings = todoIds.length > 0
    ? await db.calendarEventMapping.findMany({
        where: {
          userId,
          entityId: { in: todoIds },
          entityType: 'DAILY_TODO',
        },
      })
    : [];
  const todoMappingsByEntityId = new Map(existingTodoMappings.map((m) => [m.entityId, m]));

  for (const todo of todos) {
    if (!todo.dueDate) continue;

    try {
      const eventData = buildTodoEvent(todo, settings);

      // Look up pre-fetched mapping
      const existingMapping = todoMappingsByEntityId.get(todo.id) || null;

      if (existingMapping) {
        // Update existing event
        const existingEvent = await getEvent(
          tokens.accessToken,
          tokens.refreshToken,
          calendarId,
          existingMapping.googleEventId
        );

        if (existingEvent) {
          await updateEvent(
            tokens.accessToken,
            tokens.refreshToken,
            calendarId,
            existingMapping.googleEventId,
            eventData
          );

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsUpdated++;
        } else {
          // Recreate deleted event
          const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              googleEventId: newEvent.id || existingMapping.googleEventId,
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsCreated++;
        }
      } else {
        // Create new event
        const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

        await db.calendarEventMapping.create({
          data: {
            userId,
            entityId: todo.id,
            entityType: 'DAILY_TODO',
            googleEventId: newEvent.id || '',
            googleCalendarId: calendarId,
            lastSyncedAt: new Date(),
          },
        });

        stats.eventsCreated++;
      }
    } catch (error) {
      stats.eventsFailed++;
      stats.errors.push({
        entityId: todo.id,
        entityType: 'DAILY_TODO',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function syncGoalMilestones(
  userId: string,
  tokens: { accessToken: string; refreshToken: string },
  calendarId: string,
  settings: IntegrationSettings,
  dateStart: Date,
  dateEnd: Date,
  syncType: string,
  entityIds: string[] | undefined,
  stats: SyncStats
) {
  // Find milestones to sync
  const milestones = await db.dashboardMilestone.findMany({
    where: {
      goal: { userId },
      targetDate: {
        gte: dateStart,
        lte: dateEnd,
      },
      completed: false,
      ...(entityIds?.length ? { id: { in: entityIds } } : {}),
    },
    include: {
      goal: { select: { id: true, title: true } },
    },
  });

  // Batch-load all existing mappings to avoid N+1 queries
  const milestoneIds = milestones.map((m) => m.id);
  const existingMilestoneMappings = milestoneIds.length > 0
    ? await db.calendarEventMapping.findMany({
        where: {
          userId,
          entityId: { in: milestoneIds },
          entityType: 'GOAL_MILESTONE',
        },
      })
    : [];
  const milestoneMappingsByEntityId = new Map(existingMilestoneMappings.map((m) => [m.entityId, m]));

  for (const milestone of milestones) {
    try {
      const eventData = buildMilestoneEvent(milestone, settings);

      // Look up pre-fetched mapping
      const existingMapping = milestoneMappingsByEntityId.get(milestone.id) || null;

      if (existingMapping) {
        const existingEvent = await getEvent(
          tokens.accessToken,
          tokens.refreshToken,
          calendarId,
          existingMapping.googleEventId
        );

        if (existingEvent) {
          await updateEvent(
            tokens.accessToken,
            tokens.refreshToken,
            calendarId,
            existingMapping.googleEventId,
            eventData
          );

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsUpdated++;
        } else {
          const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              googleEventId: newEvent.id || existingMapping.googleEventId,
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsCreated++;
        }
      } else {
        const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

        await db.calendarEventMapping.create({
          data: {
            userId,
            entityId: milestone.id,
            entityType: 'GOAL_MILESTONE',
            googleEventId: newEvent.id || '',
            googleCalendarId: calendarId,
            lastSyncedAt: new Date(),
          },
        });

        stats.eventsCreated++;
      }
    } catch (error) {
      stats.eventsFailed++;
      stats.errors.push({
        entityId: milestone.id,
        entityType: 'GOAL_MILESTONE',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function syncActivities(
  userId: string,
  tokens: { accessToken: string; refreshToken: string },
  calendarId: string,
  settings: IntegrationSettings,
  dateStart: Date,
  dateEnd: Date,
  syncType: string,
  entityIds: string[] | undefined,
  entityTypes: string[] | undefined,
  stats: SyncStats
) {
  // Determine which activity types to sync
  const activityTypes: string[] = [];
  if (!entityTypes || entityTypes.includes('ASSIGNMENT')) {
    activityTypes.push('ASSIGNMENT');
  }
  if (!entityTypes || entityTypes.includes('QUIZ_EXAM')) {
    activityTypes.push('QUIZ', 'EXAM');
  }

  if (activityTypes.length === 0) return;

  const activities = await db.dashboardActivity.findMany({
    where: {
      userId,
      dueDate: {
        gte: dateStart,
        lte: dateEnd,
      },
      type: { in: activityTypes as never[] },
      status: { not: 'CANCELLED' },
      ...(entityIds?.length ? { id: { in: entityIds } } : {}),
    },
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  // Batch-load all existing mappings to avoid N+1 queries
  const activityIds = activities.map((a) => a.id);
  const existingActivityMappings = activityIds.length > 0
    ? await db.calendarEventMapping.findMany({
        where: {
          userId,
          entityId: { in: activityIds },
          entityType: { in: ['QUIZ_EXAM', 'ASSIGNMENT'] },
        },
      })
    : [];
  const activityMappingsByEntityId = new Map(existingActivityMappings.map((m) => [m.entityId, m]));

  for (const activity of activities) {
    if (!activity.dueDate) continue;

    try {
      const eventData = buildActivityEvent(activity, settings);

      // Look up pre-fetched mapping
      const existingMapping = activityMappingsByEntityId.get(activity.id) || null;

      if (existingMapping) {
        const existingEvent = await getEvent(
          tokens.accessToken,
          tokens.refreshToken,
          calendarId,
          existingMapping.googleEventId
        );

        if (existingEvent) {
          await updateEvent(
            tokens.accessToken,
            tokens.refreshToken,
            calendarId,
            existingMapping.googleEventId,
            eventData
          );

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              lastSyncedAt: new Date(),
            },
          });

          // Update activity with sync status
          await db.dashboardActivity.update({
            where: { id: activity.id },
            data: {
              calendarSynced: true,
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsUpdated++;
        } else {
          const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

          await db.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              googleEventId: newEvent.id || existingMapping.googleEventId,
              lastSyncedAt: new Date(),
            },
          });

          await db.dashboardActivity.update({
            where: { id: activity.id },
            data: {
              googleEventId: newEvent.id,
              calendarSynced: true,
              lastSyncedAt: new Date(),
            },
          });

          stats.eventsCreated++;
        }
      } else {
        const newEvent = await createEvent(tokens.accessToken, tokens.refreshToken, calendarId, eventData);

        await db.calendarEventMapping.create({
          data: {
            userId,
            entityId: activity.id,
            entityType: activity.type === 'QUIZ' || activity.type === 'EXAM' ? 'QUIZ_EXAM' : 'ASSIGNMENT',
            googleEventId: newEvent.id || '',
            googleCalendarId: calendarId,
            lastSyncedAt: new Date(),
          },
        });

        await db.dashboardActivity.update({
          where: { id: activity.id },
          data: {
            googleEventId: newEvent.id,
            calendarSynced: true,
            lastSyncedAt: new Date(),
          },
        });

        stats.eventsCreated++;
      }
    } catch (error) {
      stats.eventsFailed++;
      stats.errors.push({
        entityId: activity.id,
        entityType: activity.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ==========================================
// Event Builders
// ==========================================

function buildStudySessionEvent(
  session: {
    id: string;
    title: string;
    startTime: Date;
    duration: number;
    notes?: string | null;
    course?: { id: string; title: string } | null;
  },
  settings: IntegrationSettings
): GoogleCalendarEvent {
  const endTime = new Date(session.startTime.getTime() + session.duration * 60000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let description = '';
  if (settings.includeDescription && session.notes) {
    description = session.notes;
  }
  if (settings.includeCourseLink && session.course) {
    const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${session.course.id}`;
    description += `\n\n📚 Course: ${session.course.title}\n${courseUrl}`;
  }
  description += '\n\n🤖 Synced from Taxomind';

  return {
    summary: `📖 ${session.title}`,
    description: description.trim(),
    start: {
      dateTime: session.startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    colorId: settings.studySessionColor,
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: settings.defaultReminderMinutes }],
    },
    extendedProperties: {
      private: {
        entityId: session.id,
        entityType: 'STUDY_SESSION',
        taxomindSource: 'true',
      },
    },
  };
}

function buildTodoEvent(
  todo: {
    id: string;
    title: string;
    description?: string | null;
    dueDate: Date | null;
    priority: string;
    estimatedMinutes?: number | null;
    course?: { id: string; title: string } | null;
  },
  settings: IntegrationSettings
): GoogleCalendarEvent {
  if (!todo.dueDate) {
    throw new Error('Todo must have a due date');
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // For todos, create all-day events or timed events based on estimated duration
  const hasTime = todo.estimatedMinutes && todo.estimatedMinutes > 0;

  let description = '';
  if (settings.includeDescription && todo.description) {
    description = todo.description;
  }
  description += `\n\n⚡ Priority: ${todo.priority}`;
  if (settings.includeCourseLink && todo.course) {
    const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${todo.course.id}`;
    description += `\n📚 Course: ${todo.course.title}\n${courseUrl}`;
  }
  description += '\n\n🤖 Synced from Taxomind';

  // Priority to color mapping (using Google Calendar colors)
  const priorityColors: Record<string, string> = {
    URGENT: '11', // Red
    HIGH: '6', // Orange
    MEDIUM: '5', // Yellow
    LOW: '7', // Cyan
  };

  if (hasTime) {
    const endTime = new Date(todo.dueDate.getTime() + (todo.estimatedMinutes || 30) * 60000);

    return {
      summary: `✅ ${todo.title}`,
      description: description.trim(),
      start: {
        dateTime: todo.dueDate.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone,
      },
      colorId: priorityColors[todo.priority] || '5',
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: settings.defaultReminderMinutes }],
      },
      extendedProperties: {
        private: {
          entityId: todo.id,
          entityType: 'DAILY_TODO',
          taxomindSource: 'true',
        },
      },
    };
  }

  // All-day event
  const dateStr = todo.dueDate.toISOString().split('T')[0];

  return {
    summary: `✅ ${todo.title}`,
    description: description.trim(),
    start: {
      date: dateStr,
    },
    end: {
      date: dateStr,
    },
    colorId: priorityColors[todo.priority] || '5',
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: settings.defaultReminderMinutes }],
    },
    extendedProperties: {
      private: {
        entityId: todo.id,
        entityType: 'DAILY_TODO',
        taxomindSource: 'true',
      },
    },
  };
}

function buildMilestoneEvent(
  milestone: {
    id: string;
    title: string;
    targetDate: Date;
    goal: { id: string; title: string };
  },
  settings: IntegrationSettings
): GoogleCalendarEvent {
  const dateStr = milestone.targetDate.toISOString().split('T')[0];

  return {
    summary: `🎯 Milestone: ${milestone.title}`,
    description: `Part of goal: ${milestone.goal.title}\n\n🤖 Synced from Taxomind`,
    start: {
      date: dateStr,
    },
    end: {
      date: dateStr,
    },
    colorId: settings.goalColor,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: settings.defaultReminderMinutes },
        { method: 'popup', minutes: 1440 }, // 24 hours before
      ],
    },
    extendedProperties: {
      private: {
        entityId: milestone.id,
        entityType: 'GOAL_MILESTONE',
        taxomindSource: 'true',
      },
    },
  };
}

function buildActivityEvent(
  activity: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    dueDate: Date | null;
    estimatedMinutes?: number | null;
    course?: { id: string; title: string } | null;
  },
  settings: IntegrationSettings
): GoogleCalendarEvent {
  if (!activity.dueDate) {
    throw new Error('Activity must have a due date');
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const duration = activity.estimatedMinutes || 60;
  const endTime = new Date(activity.dueDate.getTime() + duration * 60000);

  // Determine emoji and color based on type
  const typeConfig: Record<string, { emoji: string; colorKey: keyof IntegrationSettings }> = {
    QUIZ: { emoji: '📝', colorKey: 'quizColor' },
    EXAM: { emoji: '📋', colorKey: 'quizColor' },
    ASSIGNMENT: { emoji: '📚', colorKey: 'assignmentColor' },
  };

  const config = typeConfig[activity.type] || { emoji: '📌', colorKey: 'assignmentColor' };

  let description = '';
  if (settings.includeDescription && activity.description) {
    description = activity.description;
  }
  if (settings.includeCourseLink && activity.course) {
    const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${activity.course.id}`;
    description += `\n\n📚 Course: ${activity.course.title}\n${courseUrl}`;
  }
  description += '\n\n🤖 Synced from Taxomind';

  return {
    summary: `${config.emoji} ${activity.type}: ${activity.title}`,
    description: description.trim(),
    start: {
      dateTime: activity.dueDate.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    colorId: settings[config.colorKey] as string,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: settings.defaultReminderMinutes },
        { method: 'popup', minutes: 1440 }, // 24 hours before
      ],
    },
    extendedProperties: {
      private: {
        entityId: activity.id,
        entityType: activity.type === 'QUIZ' || activity.type === 'EXAM' ? 'QUIZ_EXAM' : 'ASSIGNMENT',
        taxomindSource: 'true',
      },
    },
  };
}
