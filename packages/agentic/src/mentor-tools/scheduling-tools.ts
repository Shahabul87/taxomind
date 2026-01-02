/**
 * @sam-ai/agentic - Scheduling Tools
 * Tools for study session scheduling and time management
 */

import type { ToolDefinition, ToolHandler } from '../tool-registry/types';
import {
  ToolCategory,
  ConfirmationType,
  PermissionLevel,
} from '../tool-registry/types';
import {
  StudySessionRequestSchema,
  ReminderRequestSchema,
  type StudySessionRequest,
  type StudySession,
  type StudyBlock,
  type ReminderRequest,
  type Reminder,
  type ScheduleOptimizationRequest,
  type OptimizedSchedule,
} from './types';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dependencies for scheduling tools
 */
export interface SchedulingToolsDependencies {
  sessionRepository?: {
    create: (session: Omit<StudySession, 'id'>) => Promise<StudySession>;
    get: (sessionId: string) => Promise<StudySession | null>;
    update: (sessionId: string, updates: Partial<StudySession>) => Promise<StudySession>;
    getByUser: (userId: string, options?: { from?: Date; to?: Date }) => Promise<StudySession[]>;
  };
  reminderRepository?: {
    create: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<Reminder>;
    get: (reminderId: string) => Promise<Reminder | null>;
    update: (reminderId: string, updates: Partial<Reminder>) => Promise<Reminder>;
    getByUser: (userId: string, status?: string) => Promise<Reminder[]>;
    delete: (reminderId: string) => Promise<void>;
  };
  notificationService?: {
    schedule: (userId: string, message: string, scheduledFor: Date, channels: string[]) => Promise<void>;
  };
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * Create study session handler
 */
function createScheduleSessionHandler(deps: SchedulingToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: StudySession; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as StudySessionRequest;

    try {
      // Calculate session structure
      const blocks = generateStudyBlocks(request);
      const startTime = calculateStartTime(request);
      const endTime = new Date(startTime.getTime() + request.duration * 60000);

      const session: Omit<StudySession, 'id'> = {
        userId: request.userId,
        goalId: request.goalId,
        startTime,
        endTime,
        blocks,
        totalStudyTime: blocks
          .filter((b) => b.type === 'study')
          .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0),
        totalBreakTime: blocks
          .filter((b) => b.type === 'break')
          .reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0),
        status: 'scheduled',
      };

      // Save if repository available
      let savedSession: StudySession;
      if (deps.sessionRepository) {
        savedSession = await deps.sessionRepository.create(session);
      } else {
        savedSession = {
          ...session,
          id: `session-${Date.now()}`,
        };
      }

      deps.logger?.info('Study session created', {
        sessionId: savedSession.id,
        userId: request.userId,
        duration: request.duration,
      });

      return {
        success: true,
        output: savedSession,
      };
    } catch (error) {
      deps.logger?.error('Failed to create study session', { error, request });
      return {
        success: false,
        error: {
          code: 'SESSION_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create study session',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create reminder handler
 */
function createSetReminderHandler(deps: SchedulingToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: Reminder; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as ReminderRequest;

    try {
      const reminder: Omit<Reminder, 'id' | 'createdAt'> = {
        userId: request.userId,
        type: request.type,
        message: request.message,
        scheduledFor: request.scheduledFor,
        recurring: !!request.recurring,
        channels: request.channels ?? ['in_app'],
        status: 'pending',
      };

      // Save if repository available
      let savedReminder: Reminder;
      if (deps.reminderRepository) {
        savedReminder = await deps.reminderRepository.create(reminder);
      } else {
        savedReminder = {
          ...reminder,
          id: `reminder-${Date.now()}`,
          createdAt: new Date(),
        };
      }

      // Schedule notification if service available
      if (deps.notificationService) {
        await deps.notificationService.schedule(
          request.userId,
          request.message,
          request.scheduledFor,
          reminder.channels
        );
      }

      deps.logger?.info('Reminder created', {
        reminderId: savedReminder.id,
        userId: request.userId,
        scheduledFor: request.scheduledFor,
      });

      return {
        success: true,
        output: savedReminder,
      };
    } catch (error) {
      deps.logger?.error('Failed to create reminder', { error, request });
      return {
        success: false,
        error: {
          code: 'REMINDER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create reminder',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Optimize schedule handler
 */
function createOptimizeScheduleHandler(deps: SchedulingToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: OptimizedSchedule; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as ScheduleOptimizationRequest;

    try {
      // Get existing sessions for the week
      let existingSessions: StudySession[] = [];
      if (deps.sessionRepository) {
        const weekEnd = new Date(request.weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        existingSessions = await deps.sessionRepository.getByUser(request.userId, {
          from: request.weekStart,
          to: weekEnd,
        });
      }

      // Generate optimized schedule
      const schedule = generateOptimizedSchedule(request, existingSessions);

      deps.logger?.info('Schedule optimized', {
        userId: request.userId,
        totalHours: schedule.totalHours,
        sessions: schedule.sessions.length,
      });

      return {
        success: true,
        output: schedule,
      };
    } catch (error) {
      deps.logger?.error('Failed to optimize schedule', { error, request });
      return {
        success: false,
        error: {
          code: 'OPTIMIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to optimize schedule',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Get user schedule handler
 */
function createGetScheduleHandler(deps: SchedulingToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: { sessions: StudySession[]; reminders: Reminder[] }; error?: { code: string; message: string; recoverable: boolean } }> => {
    const { userId, from, to } = input as { userId: string; from?: Date; to?: Date };

    try {
      let sessions: StudySession[] = [];
      let reminders: Reminder[] = [];

      if (deps.sessionRepository) {
        sessions = await deps.sessionRepository.getByUser(userId, { from, to });
      }

      if (deps.reminderRepository) {
        reminders = await deps.reminderRepository.getByUser(userId, 'pending');
      }

      return {
        success: true,
        output: {
          sessions,
          reminders,
        },
      };
    } catch (error) {
      deps.logger?.error('Failed to get schedule', { error, userId });
      return {
        success: false,
        error: {
          code: 'SCHEDULE_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get schedule',
          recoverable: true,
        },
      };
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate study blocks for a session
 */
function generateStudyBlocks(request: StudySessionRequest): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  const breakInterval = request.breakInterval ?? 45;
  const breakDuration = request.breakDuration ?? 10;
  const startTime = calculateStartTime(request);

  let currentTime = startTime.getTime();
  const endTime = currentTime + request.duration * 60000;
  let blockIndex = 0;
  let topicIndex = 0;

  while (currentTime < endTime) {
    // Calculate study block duration
    const remainingTime = (endTime - currentTime) / 60000;
    const studyDuration = Math.min(breakInterval, remainingTime);

    if (studyDuration > 0) {
      // Add study block
      const topic = request.topics?.[topicIndex % (request.topics.length || 1)];
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'study',
        startTime: new Date(currentTime),
        endTime: new Date(currentTime + studyDuration * 60000),
        topic,
        activity: topic ? `Study: ${topic}` : 'Focused study',
        completed: false,
      });

      currentTime += studyDuration * 60000;
      topicIndex++;

      // Add break if there's time remaining
      const remainingAfterStudy = (endTime - currentTime) / 60000;
      if (remainingAfterStudy > breakDuration) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'break',
          startTime: new Date(currentTime),
          endTime: new Date(currentTime + breakDuration * 60000),
          activity: 'Take a break',
          completed: false,
        });
        currentTime += breakDuration * 60000;
      }
    } else {
      break;
    }
  }

  return blocks;
}

/**
 * Calculate start time for session
 */
function calculateStartTime(request: StudySessionRequest): Date {
  const now = new Date();

  if (request.preferredTime) {
    const [startHour, startMinute] = request.preferredTime.start.split(':').map(Number);
    const preferredStart = new Date(now);
    preferredStart.setHours(startHour, startMinute, 0, 0);

    // If preferred time has passed, schedule for tomorrow
    if (preferredStart <= now) {
      preferredStart.setDate(preferredStart.getDate() + 1);
    }

    return preferredStart;
  }

  // Default to 30 minutes from now, rounded to nearest 15 minutes
  const defaultStart = new Date(now.getTime() + 30 * 60000);
  const minutes = defaultStart.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  defaultStart.setMinutes(roundedMinutes, 0, 0);

  return defaultStart;
}

/**
 * Generate an optimized schedule
 */
function generateOptimizedSchedule(
  request: ScheduleOptimizationRequest,
  _existingSessions: StudySession[]
): OptimizedSchedule {
  const schedule: OptimizedSchedule = {
    sessions: [],
    totalHours: 0,
    coveragePercentage: 0,
    recommendations: [],
  };

  // Sort goals by priority and deadline
  const sortedGoals = [...request.goals].sort((a, b) => {
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.priority - a.priority;
  });

  // Allocate time across the week
  let totalAllocatedMinutes = 0;
  const totalNeededMinutes = sortedGoals.reduce((sum, g) => sum + g.estimatedMinutes, 0);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayNumber = (request.weekStart.getDay() + dayOffset) % 7;

    // Skip non-preferred days
    if (!request.preferences.preferredDays.includes(dayNumber)) {
      continue;
    }

    const date = new Date(request.weekStart);
    date.setDate(date.getDate() + dayOffset);

    const daySessions: StudySession[] = [];
    let dailyMinutes = 0;

    // Create sessions for goals
    for (const goal of sortedGoals) {
      if (dailyMinutes >= request.preferences.dailyStudyLimit) {
        break;
      }

      const sessionDuration = Math.min(
        goal.estimatedMinutes,
        request.preferences.dailyStudyLimit - dailyMinutes,
        90 // Max 90 minutes per session
      );

      if (sessionDuration >= 15) {
        const startTime = new Date(date);
        startTime.setHours(request.preferences.preferredHours.start, 0, 0, 0);
        startTime.setMinutes(startTime.getMinutes() + dailyMinutes);

        const endTime = new Date(startTime.getTime() + sessionDuration * 60000);

        daySessions.push({
          id: `opt-session-${dayOffset}-${daySessions.length}`,
          userId: request.userId,
          goalId: goal.id,
          startTime,
          endTime,
          blocks: [],
          totalStudyTime: sessionDuration,
          totalBreakTime: 0,
          status: 'scheduled',
        });

        dailyMinutes += sessionDuration;
        totalAllocatedMinutes += sessionDuration;
      }
    }

    if (daySessions.length > 0) {
      schedule.sessions.push({
        date,
        sessions: daySessions,
      });
    }
  }

  schedule.totalHours = totalAllocatedMinutes / 60;
  schedule.coveragePercentage = totalNeededMinutes > 0
    ? Math.min(100, (totalAllocatedMinutes / totalNeededMinutes) * 100)
    : 100;

  // Generate recommendations
  if (schedule.coveragePercentage < 100) {
    schedule.recommendations.push(
      `Current schedule covers ${schedule.coveragePercentage.toFixed(0)}% of your goals. Consider extending study time or adding more days.`
    );
  }

  if (sortedGoals.some((g) => g.deadline)) {
    schedule.recommendations.push(
      'You have goals with deadlines. Prioritize these in your daily schedule.'
    );
  }

  return schedule;
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Create scheduling tools with dependencies
 */
export function createSchedulingTools(deps: SchedulingToolsDependencies): ToolDefinition[] {
  return [
    {
      id: 'schedule-session',
      name: 'Schedule Study Session',
      description: 'Create a structured study session with breaks and focused time blocks',
      category: ToolCategory.SYSTEM,
      version: '1.0.0',
      inputSchema: StudySessionRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createScheduleSessionHandler(deps),
      timeoutMs: 10000,
      maxRetries: 2,
      tags: ['scheduling', 'study', 'session'],
      enabled: true,
      examples: [
        {
          name: 'Create 2-hour session',
          description: 'Schedule a 2-hour study session with breaks',
          input: {
            userId: 'user-123',
            duration: 120,
            topics: ['React Hooks', 'State Management'],
            breakInterval: 45,
            breakDuration: 10,
          },
        },
      ],
    },
    {
      id: 'schedule-reminder',
      name: 'Set Reminder',
      description: 'Create a reminder for study sessions, deadlines, or check-ins',
      category: ToolCategory.COMMUNICATION,
      version: '1.0.0',
      inputSchema: ReminderRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createSetReminderHandler(deps),
      timeoutMs: 5000,
      maxRetries: 2,
      tags: ['scheduling', 'reminder', 'notification'],
      enabled: true,
      examples: [
        {
          name: 'Study reminder',
          description: 'Set a reminder for tomorrow morning',
          input: {
            userId: 'user-123',
            type: 'study',
            message: 'Time for your React Hooks study session!',
            scheduledFor: new Date(Date.now() + 86400000),
            channels: ['push', 'in_app'],
          },
        },
      ],
    },
    {
      id: 'schedule-optimize',
      name: 'Optimize Schedule',
      description: 'Generate an optimized weekly study schedule based on goals and preferences',
      category: ToolCategory.ANALYTICS,
      version: '1.0.0',
      inputSchema: z.object({
        userId: z.string().min(1),
        weekStart: z.coerce.date(),
        goals: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            estimatedMinutes: z.number().int().min(15),
            deadline: z.coerce.date().optional(),
            priority: z.number().int().min(1).max(5),
          })
        ),
        preferences: z.object({
          dailyStudyLimit: z.number().int().min(30).max(480),
          preferredDays: z.array(z.number().int().min(0).max(6)),
          preferredHours: z.object({
            start: z.number().int().min(0).max(23),
            end: z.number().int().min(0).max(23),
          }),
          breakFrequency: z.number().int().min(15).max(120),
        }),
      }),
      requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createOptimizeScheduleHandler(deps),
      timeoutMs: 15000,
      maxRetries: 2,
      tags: ['scheduling', 'optimization', 'planning'],
      enabled: true,
      examples: [
        {
          name: 'Weekly optimization',
          description: 'Optimize schedule for the week',
          input: {
            userId: 'user-123',
            weekStart: new Date(),
            goals: [
              { id: 'goal-1', title: 'Learn React', estimatedMinutes: 180, priority: 5 },
            ],
            preferences: {
              dailyStudyLimit: 120,
              preferredDays: [1, 2, 3, 4, 5],
              preferredHours: { start: 9, end: 18 },
              breakFrequency: 45,
            },
          },
        },
      ],
    },
    {
      id: 'schedule-get',
      name: 'Get Schedule',
      description: 'Retrieve user study sessions and reminders',
      category: ToolCategory.SYSTEM,
      version: '1.0.0',
      inputSchema: z.object({
        userId: z.string().min(1),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGetScheduleHandler(deps),
      timeoutMs: 10000,
      maxRetries: 2,
      tags: ['scheduling', 'query'],
      enabled: true,
      examples: [
        {
          name: 'Get this week',
          description: 'Get schedule for current week',
          input: {
            userId: 'user-123',
          },
        },
      ],
    },
  ];
}
