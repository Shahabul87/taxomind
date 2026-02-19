/**
 * SAM Course Chapter Generator Tool
 *
 * Direct-mode tool that generates a single chapter with all sections and details.
 * Used by the AgentStateMachine to invoke chapter generation as a tool step.
 *
 * When metadata.chapterStepContext is provided, calls generateSingleChapter()
 * directly. Otherwise, falls back to the trigger pattern for backward compatibility.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
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

const ChapterGeneratorInputSchema = z.object({
  courseId: z.string().min(1),
  chapterNumber: z.number().min(1).max(20),
  action: z.enum(['generate']).default('generate'),
});

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createCourseChapterGeneratorTool(): ToolDefinition {
  const handler: ToolHandler = async (input, context) => {
    const parsed = ChapterGeneratorInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        output: {
          message: 'Invalid input for chapter generation',
          errors: parsed.error.flatten().fieldErrors,
        },
      };
    }

    const { courseId, chapterNumber } = parsed.data;
    const userId = context?.userId ?? '';

    if (!userId) {
      return {
        success: false,
        output: { message: 'User ID is required for chapter generation' },
      };
    }

    logger.info('[ChapterGeneratorTool] Invoked', { courseId, chapterNumber, userId });

    // When chapterStepContext is provided by the state machine, call
    // generateSingleChapter() directly for a functional tool.
    const chapterStepContext = context?.metadata?.chapterStepContext as
      import('@/lib/sam/course-creation/types').ChapterStepContext | undefined;
    if (chapterStepContext) {
      try {
        const { generateSingleChapter } = await import('@/lib/sam/course-creation/orchestrator');
        const onSSEEvent = context?.metadata?.onSSEEvent as
          ((event: { type: string; data: Record<string, unknown> }) => void) | undefined;
        const chapterResult = await generateSingleChapter(
          userId,
          chapterStepContext,
          {
            onSSEEvent,
            enableStreamingThinking: context?.metadata?.enableStreamingThinking as boolean | undefined,
          },
        );

        return {
          success: true,
          output: {
            message: `Chapter ${chapterNumber} generated successfully`,
            chapterId: chapterResult.completedChapter.id,
            chapterTitle: chapterResult.completedChapter.title,
            sectionsCreated: chapterResult.sectionsCreated,
            qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
            agenticDecision: chapterResult.agenticDecision?.action ?? 'continue',
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[ChapterGeneratorTool] Generation failed', { courseId, chapterNumber, error: errorMsg });
        return {
          success: false,
          output: { message: `Chapter generation failed: ${errorMsg}` },
        };
      }
    }

    // Fallback: return trigger object for backward compatibility
    const result: ToolExecutionResult = {
      success: true,
      output: {
        message: `Chapter ${chapterNumber} generation triggered for course ${courseId}`,
        triggerGeneration: true,
        generationParams: {
          courseId,
          chapterNumber,
          userId,
        },
      },
    };

    return result;
  };

  return {
    id: 'sam-course-chapter-generator',
    name: 'Course Chapter Generator',
    description: 'Generates a single chapter with all sections and details using the AI course creation pipeline. Direct-mode tool for AgentStateMachine integration.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler,
    inputSchema: ChapterGeneratorInputSchema,
    requiredPermissions: [PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.NONE,
    timeoutMs: 120_000,
    maxRetries: 2,
    rateLimit: { maxCalls: 5, windowMs: 60_000, scope: 'user' as const },
    tags: ['course-creation', 'content-generation', 'direct-mode'],
    examples: [
      {
        name: 'Generate chapter',
        description: 'Generate chapter 3 of a course',
        input: { courseId: 'course-abc123', chapterNumber: 3, action: 'generate' },
      },
    ],
    metadata: {
      isConversational: false,
      isDirect: true,
      agenticIntegration: true,
    },
    enabled: true,
    deprecated: false,
  };
}

// =============================================================================
// COURSE HEALER TOOL
// =============================================================================

const CourseHealerInputSchema = z.object({
  courseId: z.string().min(1),
  chapterId: z.string().min(1),
  chapterPosition: z.number().min(1),
  reason: z.string().optional(),
});

/**
 * Direct-mode tool that regenerates a flagged chapter.
 * Calls regenerateChapter() directly when invoked.
 */
export function createCourseHealerTool(): ToolDefinition {
  const handler: ToolHandler = async (input, context) => {
    const parsed = CourseHealerInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        output: {
          message: 'Invalid input for chapter healing',
          errors: parsed.error.flatten().fieldErrors,
        },
      };
    }

    const { courseId, chapterId, chapterPosition, reason } = parsed.data;
    const userId = context?.userId ?? '';

    logger.info('[CourseHealerTool] Invoked', { courseId, chapterId, chapterPosition, userId });

    // Call regenerateChapter() directly for a functional tool
    try {
      const { regenerateChapter } = await import('@/lib/sam/course-creation/chapter-regenerator');
      const onSSEEvent = context?.metadata?.onSSEEvent as
        ((event: { type: string; data: Record<string, unknown> }) => void) | undefined;
      const healResult = await regenerateChapter({
        userId,
        courseId,
        chapterId,
        chapterPosition,
        onSSEEvent,
      });

      return {
        success: healResult.success,
        output: {
          message: healResult.success
            ? `Chapter ${chapterPosition} healed successfully`
            : `Chapter ${chapterPosition} healing failed: ${healResult.error}`,
          chapterId: healResult.chapterId,
          chapterTitle: healResult.chapterTitle,
          sectionsRegenerated: healResult.sectionsRegenerated,
          qualityScore: healResult.qualityScore,
          reason: reason ?? 'Quality below threshold',
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[CourseHealerTool] Healing failed', { courseId, chapterId, chapterPosition, error: errorMsg });
      return {
        success: false,
        output: { message: `Chapter healing failed: ${errorMsg}` },
      };
    }
  };

  return {
    id: 'sam-course-healer',
    name: 'Course Chapter Healer',
    description: 'Regenerates a flagged chapter to improve quality. Used by the autonomous healing loop.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler,
    inputSchema: CourseHealerInputSchema,
    requiredPermissions: [PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.NONE,
    timeoutMs: 120_000,
    maxRetries: 1,
    rateLimit: { maxCalls: 3, windowMs: 60_000, scope: 'user' as const },
    tags: ['course-creation', 'healing', 'quality', 'direct-mode'],
    examples: [
      {
        name: 'Heal chapter',
        description: 'Heal a chapter with low quality score',
        input: { courseId: 'course-abc', chapterId: 'ch-123', chapterPosition: 2, reason: 'Quality score below 40' },
      },
    ],
    metadata: {
      isConversational: false,
      isDirect: true,
      agenticIntegration: true,
    },
    enabled: true,
    deprecated: false,
  };
}
