/**
 * SAM Tool: Quality Evaluator for Course Content
 *
 * Direct-mode tool that runs quality scoring and SAM validation on
 * a chapter from an existing course. Loads chapter data from DB,
 * runs the quality pipeline, and returns detailed scores.
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
import {
  validateChapterWithSAM,
  blendScores,
} from '../course-creation/quality-integration';
import { scoreChapter, buildDefaultQualityScore } from '../course-creation/helpers';
import type { GeneratedChapter, CourseContext, BloomsLevel } from '../course-creation/types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const QualityEvaluatorInputSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  chapterId: z.string().min(1),
});

// =============================================================================
// HANDLER
// =============================================================================

function createQualityEvaluatorHandler(): ToolHandler {
  return async (input, _context): Promise<ToolExecutionResult> => {
    const parsed = QualityEvaluatorInputSchema.parse(input);

    try {
      // Load chapter and course from DB
      const chapter = await db.chapter.findUnique({
        where: { id: parsed.chapterId },
        include: {
          sections: { orderBy: { position: 'asc' } },
          course: {
            select: {
              title: true,
              description: true,
              category: { select: { name: true } },
              subcategory: { select: { name: true } },
              difficulty: true,
            },
          },
        },
      });

      if (!chapter || chapter.course?.title === undefined) {
        return {
          success: false,
          output: { error: 'Chapter or course not found' },
        };
      }

      // Build GeneratedChapter from DB data
      const generatedChapter: GeneratedChapter = {
        position: chapter.position,
        title: chapter.title,
        description: chapter.description ?? '',
        bloomsLevel: (chapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
        learningObjectives: (chapter.courseGoals ?? '').split('\n').filter(Boolean),
        keyTopics: (chapter.courseGoals ?? '').split('\n').filter(Boolean).slice(0, 5),
        prerequisites: chapter.prerequisites ?? '',
        estimatedTime: chapter.estimatedTime ?? '1-2 hours',
        topicsToExpand: [],
      };

      // Build minimal CourseContext
      const courseContext: CourseContext = {
        courseTitle: chapter.course.title ?? '',
        courseDescription: chapter.course.description ?? '',
        courseCategory: chapter.course.category?.name ?? 'General',
        courseSubcategory: chapter.course.subcategory?.name ?? undefined,
        targetAudience: '',
        difficulty: (chapter.course.difficulty ?? 'intermediate') as CourseContext['difficulty'],
        courseLearningObjectives: [],
        totalChapters: 1,
        sectionsPerChapter: chapter.sections.length || 3,
        bloomsFocus: [],
        learningObjectivesPerChapter: 5,
        learningObjectivesPerSection: 3,
        preferredContentTypes: [],
      };

      // Run rule-based scoring
      const customScore = scoreChapter(generatedChapter, courseContext, []);

      // Run SAM validation
      const samResult = await validateChapterWithSAM(generatedChapter, customScore, courseContext);
      const blended = blendScores(customScore, samResult);

      return {
        success: true,
        output: {
          chapterId: parsed.chapterId,
          chapterTitle: chapter.title,
          position: chapter.position,
          overallScore: blended.overall,
          dimensions: {
            uniqueness: blended.uniqueness,
            specificity: blended.specificity,
            bloomsAlignment: blended.bloomsAlignment,
            completeness: blended.completeness,
            depth: blended.depth,
          },
          samValidation: {
            combinedScore: samResult.combinedScore,
            qualityGateScore: samResult.qualityGateScore,
          },
          sectionCount: chapter.sections.length,
        },
      };
    } catch (error) {
      logger.error('[QualityEvaluatorTool] Failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        output: { error: 'Quality evaluation failed' },
      };
    }
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createQualityEvaluatorTool(): ToolDefinition {
  return {
    id: 'sam-quality-evaluator',
    name: 'Quality Evaluator',
    description:
      'Evaluate chapter quality using SAM quality gates and pedagogy scoring. ' +
      'Loads chapter from database, runs rule-based and AI-driven quality checks, ' +
      'and returns detailed dimension scores.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createQualityEvaluatorHandler(),
    inputSchema: QualityEvaluatorInputSchema,
    outputSchema: z.object({
      chapterId: z.string().optional(),
      chapterTitle: z.string().optional(),
      position: z.number().optional(),
      overallScore: z.number().optional(),
      dimensions: z.object({
        uniqueness: z.number(),
        specificity: z.number(),
        bloomsAlignment: z.number(),
        completeness: z.number(),
        depth: z.number(),
      }).optional(),
      samValidation: z.object({
        provider: z.string(),
        passed: z.boolean(),
      }).optional(),
      sectionCount: z.number().optional(),
      error: z.string().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['quality', 'course-creation', 'evaluation', 'pedagogy'],
    rateLimit: { maxCalls: 20, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30_000,
    maxRetries: 1,
  };
}
