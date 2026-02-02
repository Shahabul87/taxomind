/**
 * Progress Exporter Tool
 *
 * Exports a structured learning progress report for a user's course.
 * Queries existing analytics stores — no AI calls needed.
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
// TYPES
// =============================================================================

export interface ProgressReport {
  userId: string;
  courseId: string;
  courseTitle: string;
  format: 'json' | 'csv';
  generatedAt: string;
  summary: {
    totalSessions: number;
    totalStudyMinutes: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracyPercent: number;
    conceptsCovered: string[];
    bloomsDistribution: Record<string, number>;
    masteryLevel: string;
  };
  sessions: Array<{
    id: string;
    startTime: string;
    duration: number;
    questionsAnswered: number;
    correctAnswers: number;
    conceptsCovered: string[];
  }>;
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const ProgressExporterInputSchema = z.object({
  userId: z.string().min(1).describe('The user ID to export progress for'),
  courseId: z.string().min(1).optional().describe('Optional course ID filter'),
  format: z.enum(['json', 'csv']).optional().default('json'),
  limit: z.number().min(1).max(100).optional().default(50),
});

// =============================================================================
// HELPERS
// =============================================================================

function determineMasteryLevel(accuracyPercent: number, totalSessions: number): string {
  if (totalSessions < 3) return 'beginner';
  if (accuracyPercent >= 90 && totalSessions >= 10) return 'mastery';
  if (accuracyPercent >= 75) return 'proficient';
  if (accuracyPercent >= 60) return 'developing';
  return 'novice';
}

function formatCSV(report: ProgressReport): string {
  const headers = ['Session ID', 'Start Time', 'Duration (min)', 'Questions', 'Correct', 'Concepts'];
  const rows = report.sessions.map((s) =>
    [s.id, s.startTime, s.duration, s.questionsAnswered, s.correctAnswers, s.conceptsCovered.join('; ')].join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

// =============================================================================
// HANDLER
// =============================================================================

function createProgressExporterHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = ProgressExporterInputSchema.safeParse(input);
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

    const { userId, courseId, format, limit } = parsed.data;

    logger.info('[ProgressExporter] Exporting progress', { userId, courseId, format });

    try {
      // Query sessions
      const sessions = await db.sAMAgenticSession.findMany({
        where: {
          userId,
          ...(courseId ? { topicId: courseId } : {}),
        },
        orderBy: { startTime: 'desc' },
        take: limit,
      });

      // Query course title if courseId provided
      let courseTitle = 'All Courses';
      if (courseId) {
        const course = await db.course.findUnique({
          where: { id: courseId },
          select: { title: true },
        });
        courseTitle = course?.title ?? courseId;
      }

      // Aggregate metrics
      let totalStudyMinutes = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;
      const allConcepts = new Set<string>();

      const sessionData = sessions.map((s) => {
        totalStudyMinutes += Math.round(s.duration / 60);
        totalQuestions += s.questionsAnswered;
        totalCorrect += s.correctAnswers;
        s.conceptsCovered.forEach((c) => allConcepts.add(c));

        return {
          id: s.id,
          startTime: s.startTime.toISOString(),
          duration: Math.round(s.duration / 60),
          questionsAnswered: s.questionsAnswered,
          correctAnswers: s.correctAnswers,
          conceptsCovered: s.conceptsCovered,
        };
      });

      const accuracyPercent = totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

      // Query mastery level distribution from topic progress
      const topicProgress = await db.sAMTopicProgress.findMany({
        where: { userId },
        select: { masteryLevel: true },
        take: 200,
      });

      const bloomsDistribution: Record<string, number> = {};
      for (const tp of topicProgress) {
        if (tp.masteryLevel) {
          bloomsDistribution[tp.masteryLevel] = (bloomsDistribution[tp.masteryLevel] ?? 0) + 1;
        }
      }

      const report: ProgressReport = {
        userId,
        courseId: courseId ?? 'all',
        courseTitle,
        format,
        generatedAt: new Date().toISOString(),
        summary: {
          totalSessions: sessions.length,
          totalStudyMinutes,
          questionsAnswered: totalQuestions,
          correctAnswers: totalCorrect,
          accuracyPercent,
          conceptsCovered: [...allConcepts],
          bloomsDistribution,
          masteryLevel: determineMasteryLevel(accuracyPercent, sessions.length),
        },
        sessions: sessionData,
      };

      if (format === 'csv') {
        return {
          success: true,
          output: {
            format: 'csv',
            csv: formatCSV(report),
            summary: report.summary,
          },
        };
      }

      return {
        success: true,
        output: report,
      };
    } catch (error) {
      logger.error('[ProgressExporter] Export failed', { error, userId });
      return {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Progress export failed',
          recoverable: true,
        },
      };
    }
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createProgressExporterTool(): ToolDefinition {
  return {
    id: 'sam-progress-exporter',
    name: 'Progress Exporter',
    description: 'Exports a structured learning progress report with session history, accuracy metrics, and Bloom\'s distribution.',
    version: '1.0.0',
    category: ToolCategory.ANALYTICS,
    handler: createProgressExporterHandler(),
    inputSchema: ProgressExporterInputSchema,
    outputSchema: z.object({
      userId: z.string(),
      courseId: z.string(),
      courseTitle: z.string(),
      format: z.string(),
      generatedAt: z.string(),
      summary: z.object({
        totalSessions: z.number(),
        totalStudyMinutes: z.number(),
        questionsAnswered: z.number(),
        correctAnswers: z.number(),
        accuracyPercent: z.number(),
        conceptsCovered: z.array(z.string()),
        bloomsDistribution: z.record(z.number()),
        masteryLevel: z.string(),
      }),
      sessions: z.array(z.object({
        id: z.string(),
        startTime: z.string(),
        duration: z.number(),
        questionsAnswered: z.number(),
        correctAnswers: z.number(),
        conceptsCovered: z.array(z.string()),
      })),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['analytics', 'progress', 'export', 'report'],
    rateLimit: { maxCalls: 10, windowMs: 60_000, scope: 'user' },
    timeoutMs: 10_000,
    maxRetries: 1,
  };
}
