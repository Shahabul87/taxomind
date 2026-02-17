/**
 * SAM Tool: Course Replanner
 *
 * Direct-mode tool that re-plans remaining chapters based on
 * quality feedback and completed chapter context. Loads course
 * and chapter data from DB, builds the required context objects,
 * and calls the replanning engine.
 *
 * Layer 1: Tool Definition
 * @see codebase-memory/architecture/SAM_SKILL_TOOL_PATTERN.md
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';
import { replanRemainingChapters } from '../course-creation/course-planner';
import type {
  CourseContext,
  CompletedChapter,
  CompletedSection,
  ConceptTracker,
  CourseBlueprintPlan,
  BloomsLevel,
  GeneratedChapter,
} from '../course-creation/types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const CourseReplannerInputSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  /** Reason for replanning (e.g., quality feedback, topic drift) */
  reason: z.string().min(1).max(500),
});

// =============================================================================
// HANDLER
// =============================================================================

function createCourseReplannerHandler(): ToolHandler {
  return async (input: Record<string, unknown>): Promise<ToolExecutionResult> => {
    const parsed = CourseReplannerInputSchema.parse(input);

    try {
      // Load course with completed chapters
      const course = await db.course.findUnique({
        where: { id: parsed.courseId },
        select: {
          title: true,
          description: true,
          category: true,
          subcategory: true,
          targetAudience: true,
          difficulty: true,
          totalChapters: true,
          chapters: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            include: {
              sections: { orderBy: { position: 'asc' } },
            },
          },
        },
      });

      if (!course) {
        return {
          success: false,
          output: { error: 'Course not found' },
        };
      }

      // Build CourseContext from DB
      const courseContext: CourseContext = {
        courseTitle: course.title ?? '',
        courseDescription: course.description ?? '',
        courseCategory: course.category ?? 'General',
        courseSubcategory: course.subcategory ?? undefined,
        targetAudience: course.targetAudience ?? '',
        difficulty: (course.difficulty ?? 'intermediate') as CourseContext['difficulty'],
        courseLearningObjectives: [],
        totalChapters: course.totalChapters ?? 1,
        sectionsPerChapter: 3,
        bloomsFocus: [],
        learningObjectivesPerChapter: 5,
        learningObjectivesPerSection: 3,
        preferredContentTypes: [],
      };

      // Build CompletedChapter[] from DB chapters
      const completedChapters: CompletedChapter[] = course.chapters.map((ch) => {
        const sections: CompletedSection[] = ch.sections.map((sec) => ({
          position: sec.position,
          title: sec.title ?? '',
          description: sec.description ?? '',
          bloomsLevel: 'UNDERSTAND' as BloomsLevel,
          learningObjectives: [],
          keyTopics: [],
          contentType: 'explanatory' as const,
          // CompletedSection fields
          content: sec.description ?? '',
          detailedContent: sec.description ?? '',
          examples: [],
          exercises: [],
          summaryPoints: [],
          prerequisiteCheck: '',
          nextStepTeaser: '',
        }));

        const generated: GeneratedChapter = {
          position: ch.position,
          title: ch.title,
          description: ch.description ?? '',
          bloomsLevel: (ch.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
          learningObjectives: (ch.courseGoals ?? '').split('\n').filter(Boolean),
          keyTopics: (ch.courseGoals ?? '').split('\n').filter(Boolean).slice(0, 5),
          prerequisites: ch.prerequisites ?? '',
          estimatedTime: ch.estimatedTime ?? '1-2 hours',
          topicsToExpand: [],
        };

        return {
          ...generated,
          id: ch.id,
          sections,
        };
      });

      // Build minimal ConceptTracker
      const conceptTracker: ConceptTracker = {
        concepts: new Map(),
        vocabulary: [],
        skillsBuilt: [],
      };

      // Populate concept tracker from completed chapters
      for (const ch of completedChapters) {
        for (const topic of ch.keyTopics) {
          conceptTracker.concepts.set(topic.toLowerCase(), {
            firstIntroduced: ch.position,
            lastReferenced: ch.position,
            depth: 1,
            bloomsLevel: ch.bloomsLevel,
            relatedConcepts: [],
          });
          if (!conceptTracker.vocabulary.includes(topic)) {
            conceptTracker.vocabulary.push(topic);
          }
        }
      }

      // Load existing blueprint from execution plan if available
      let currentBlueprint: CourseBlueprintPlan | null = null;
      const executionPlan = await db.sAMExecutionPlan.findFirst({
        where: {
          courseId: parsed.courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { schedule: true },
      });

      if (executionPlan?.schedule) {
        const schedule = executionPlan.schedule as Record<string, unknown>;
        if (schedule.blueprintPlan) {
          currentBlueprint = schedule.blueprintPlan as CourseBlueprintPlan;
        }
      }

      // Run replanning
      const newBlueprint = await replanRemainingChapters(
        parsed.userId,
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      return {
        success: true,
        output: {
          courseId: parsed.courseId,
          courseTitle: course.title,
          reason: parsed.reason,
          completedChaptersCount: completedChapters.length,
          totalChapters: course.totalChapters,
          newPlan: {
            chapterCount: newBlueprint.chapterPlan.length,
            planConfidence: newBlueprint.planConfidence,
            riskAreas: newBlueprint.riskAreas,
            recommendedChapterCount: newBlueprint.recommendedChapterCount,
            chapters: newBlueprint.chapterPlan.map((entry) => ({
              position: entry.position,
              title: entry.suggestedTitle,
              bloomsLevel: entry.suggestedBloomsLevel,
            })),
          },
        },
      };
    } catch (error) {
      logger.error('[CourseReplannerTool] Failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        output: { error: 'Course replanning failed' },
      };
    }
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createCourseReplannerTool(): ToolDefinition {
  return {
    id: 'sam-course-replanner',
    name: 'Course Replanner',
    description:
      'Re-plan remaining course chapters based on quality feedback and agentic decisions. ' +
      'Loads course data from database, builds context from completed chapters, ' +
      'and generates an updated blueprint plan.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createCourseReplannerHandler(),
    inputSchema: CourseReplannerInputSchema,
    outputSchema: z.object({
      courseId: z.string().optional(),
      courseTitle: z.string().optional(),
      reason: z.string().optional(),
      completedChaptersCount: z.number().optional(),
      totalChapters: z.number().optional(),
      newPlan: z.object({
        chapterCount: z.number(),
        planConfidence: z.number(),
        riskAreas: z.array(z.string()),
        recommendedChapterCount: z.number().optional(),
        chapters: z.array(z.object({
          position: z.number(),
          title: z.string(),
          bloomsLevel: z.string(),
        })),
      }).optional(),
      error: z.string().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.WRITE],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['planning', 'course-creation', 'replan', 'blueprint'],
    rateLimit: { maxCalls: 10, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30_000,
    maxRetries: 1,
  };
}
