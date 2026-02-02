/**
 * Study Timer Tool
 *
 * Creates tracked practice sessions linked to goals for the 10,000-hour mastery system.
 * Queries existing stores — no AI calls needed.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const StudyTimerInputSchema = z.object({
  userId: z.string().min(1).describe('The user ID'),
  goalId: z.string().optional().describe('Optional goal ID to link the session to'),
  topicId: z.string().optional().describe('Optional topic/course ID'),
  topicName: z.string().optional().describe('Human-readable topic name'),
  duration: z.number().min(1).max(480).describe('Session duration in minutes'),
});

// =============================================================================
// HANDLER
// =============================================================================

function createStudyTimerHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = StudyTimerInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { userId, goalId, topicId, topicName, duration } = parsed.data;

    logger.info('[StudyTimer] Creating study session', {
      userId,
      goalId,
      topicId,
      duration,
    });

    try {
      const now = new Date();
      const estimatedEnd = new Date(now.getTime() + duration * 60 * 1000);

      // Create tracked session
      const session = await db.sAMAgenticSession.create({
        data: {
          userId,
          topicId: topicId ?? goalId ?? null,
          topicName: topicName ?? null,
          startTime: now,
          duration: duration * 60, // Store in seconds
        },
      });

      // Fetch related topics from existing progress data
      const relatedTopics: string[] = [];
      if (topicId || goalId) {
        const topicProgress = await db.sAMTopicProgress.findMany({
          where: { userId },
          select: { topicName: true },
          take: 5,
          orderBy: { lastAccessedAt: 'desc' },
        });
        for (const tp of topicProgress) {
          if (tp.topicName && !relatedTopics.includes(tp.topicName)) {
            relatedTopics.push(tp.topicName);
          }
        }
      }

      // Check total study time for mastery tracking
      const totalSessions = await db.sAMAgenticSession.aggregate({
        where: { userId },
        _sum: { duration: true },
        _count: true,
      });

      const totalStudyHours = Math.round(((totalSessions._sum.duration ?? 0) / 3600) * 10) / 10;

      return {
        success: true,
        output: {
          sessionId: session.id,
          startTime: now.toISOString(),
          estimatedEndTime: estimatedEnd.toISOString(),
          durationMinutes: duration,
          topicName: topicName ?? topicId ?? 'General Study',
          relatedTopics,
          masteryTracking: {
            totalStudyHours,
            totalSessions: totalSessions._count,
            masteryProgressPercent: Math.min(100, Math.round((totalStudyHours / 10000) * 100 * 100) / 100),
          },
        },
      };
    } catch (error) {
      logger.error('[StudyTimer] Failed to create session', { error, userId });
      return {
        success: false,
        error: {
          code: 'SESSION_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create study session',
          recoverable: true,
        },
      };
    }
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createStudyTimerTool(): ToolDefinition {
  return {
    id: 'sam-study-timer',
    name: 'Study Timer',
    description: 'Creates a tracked study session linked to goals for mastery tracking and the 10,000-hour system.',
    version: '1.0.0',
    category: ToolCategory.SYSTEM,
    handler: createStudyTimerHandler(),
    inputSchema: StudyTimerInputSchema,
    outputSchema: z.object({
      sessionId: z.string(),
      startTime: z.string(),
      estimatedEndTime: z.string(),
      durationMinutes: z.number(),
      topicName: z.string(),
      relatedTopics: z.array(z.string()),
      masteryTracking: z.object({
        totalStudyHours: z.number(),
        totalSessions: z.number(),
        masteryProgressPercent: z.number(),
      }),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['learning', 'timer', 'session', 'mastery', '10k-hours'],
    rateLimit: { maxCalls: 15, windowMs: 60_000, scope: 'user' },
    timeoutMs: 5000,
    maxRetries: 1,
  };
}
