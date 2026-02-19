/**
 * SAM Tool: Memory Recall for Course Creation
 *
 * Direct-mode tool that recalls prior learning concepts from the
 * knowledge graph and quality patterns from prior course creations
 * to inform chapter generation context.
 *
 * Layer 1: Tool Definition
 * @see codebase-memory/architecture/SAM_SKILL_TOOL_PATTERN.md
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
import {
  recallCourseCreationMemory,
  recallChapterContext,
  buildMemoryRecallBlock,
} from '../course-creation/memory-recall';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const MemoryRecallInputSchema = z.object({
  userId: z.string().min(1),
  courseCategory: z.string().min(1).max(100),
  courseTitle: z.string().min(1).max(200),
  /** Optional: for between-chapter context recall */
  courseId: z.string().optional(),
  /** Optional: chapter topics for related concept lookup */
  chapterTopics: z.array(z.string()).max(20).optional(),
  action: z.enum(['recall_memory', 'recall_chapter_context']).default('recall_memory'),
});

// =============================================================================
// HANDLER
// =============================================================================

function createMemoryRecallHandler(): ToolHandler {
  return async (input, _context): Promise<ToolExecutionResult> => {
    const parsed = MemoryRecallInputSchema.parse(input);

    try {
      if (parsed.action === 'recall_chapter_context' && parsed.courseId && parsed.chapterTopics) {
        const relatedConcepts = await recallChapterContext(
          parsed.userId,
          parsed.courseId,
          parsed.chapterTopics,
        );
        return {
          success: true,
          output: {
            type: 'chapter_context',
            relatedConcepts,
            count: relatedConcepts.length,
          },
        };
      }

      // Default: full memory recall
      const memory = await recallCourseCreationMemory(
        parsed.userId,
        parsed.courseCategory,
        parsed.courseTitle,
      );

      const promptBlock = buildMemoryRecallBlock(memory);

      return {
        success: true,
        output: {
          type: 'memory_recall',
          priorConceptCount: memory.priorConcepts.length,
          hasQualityPatterns: !!memory.qualityPatterns,
          relatedConceptCount: memory.relatedConcepts.length,
          priorConcepts: memory.priorConcepts.slice(0, 10),
          qualityPatterns: memory.qualityPatterns,
          promptBlockLength: promptBlock.length,
        },
      };
    } catch (error) {
      logger.error('[MemoryRecallTool] Failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        output: { error: 'Memory recall failed' },
      };
    }
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createMemoryRecallTool(): ToolDefinition {
  return {
    id: 'sam-memory-recall',
    name: 'Memory Recall',
    description:
      'Recall prior learning concepts from the knowledge graph and quality patterns ' +
      'from prior course creations to inform chapter generation context. ' +
      'Use when starting a new course or between chapters to enrich generation.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createMemoryRecallHandler(),
    inputSchema: MemoryRecallInputSchema,
    outputSchema: z.object({
      type: z.enum(['memory_recall', 'chapter_context']),
      priorConceptCount: z.number().optional(),
      hasQualityPatterns: z.boolean().optional(),
      relatedConceptCount: z.number().optional(),
      priorConcepts: z.array(z.object({
        concept: z.string(),
        bloomsLevel: z.string(),
        courseTitle: z.string(),
      })).optional(),
      qualityPatterns: z.object({
        averageScore: z.number(),
        weakDimensions: z.array(z.string()),
      }).nullable().optional(),
      promptBlockLength: z.number().optional(),
      relatedConcepts: z.array(z.object({
        name: z.string(),
        relationship: z.string(),
      })).optional(),
      count: z.number().optional(),
      error: z.string().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['memory', 'course-creation', 'context', 'knowledge-graph'],
    rateLimit: { maxCalls: 30, windowMs: 60_000, scope: 'user' },
    timeoutMs: 10_000,
    maxRetries: 1,
  };
}
