/**
 * Memory Persistence Stage
 *
 * Queues user messages, assistant responses, and entity content
 * for asynchronous memory ingestion (vector embeddings).
 */

import { logger } from '@/lib/logger';
import { queueMemoryIngestion } from '@/lib/sam/memory-ingestion';
import type { PipelineContext } from './types';

export async function runMemoryPersistenceStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  try {
    if (!ctx.user.id) return ctx;

    const courseIdForMemory =
      ctx.entityContext.course?.id ??
      ctx.entityContext.chapter?.courseId ??
      ctx.entityContext.section?.courseId ??
      (ctx.pageContext.entityType === 'course' ? ctx.pageContext.entityId : undefined);

    // Queue user message
    if (ctx.message.trim().length > 0) {
      queueMemoryIngestion({
        content: ctx.message,
        sourceId: `conversation_${ctx.user.id}_${ctx.startTime}`,
        sourceType: 'CONVERSATION',
        userId: ctx.user.id,
        courseId: courseIdForMemory,
        tags: ['sam', 'user-message'],
        enableSummary: false,
      });
    }

    // Queue assistant response with quality metadata
    if (ctx.responseText.trim().length > 0) {
      const qualityMeta = ctx.qualityResult as Record<string, unknown> | null;
      const bloomsMeta = ctx.bloomsAnalysis as Record<string, unknown> | null;

      queueMemoryIngestion({
        content: ctx.responseText,
        sourceId: `answer_${ctx.user.id}_${ctx.startTime}`,
        sourceType: 'ANSWER',
        userId: ctx.user.id,
        courseId: courseIdForMemory,
        tags: ['sam', 'assistant-response'],
        enableSummary: false,
        customMetadata: {
          qualityScore: (qualityMeta?.overallScore as number) ?? null,
          qualityPassed: (qualityMeta?.passed as boolean) ?? null,
          bloomsLevel: (bloomsMeta?.dominantLevel as string) ?? null,
          bloomsConfidence: (bloomsMeta?.confidence as number) ?? null,
          modeId: ctx.modeId,
        },
      });
    }

    // Queue course content
    if (ctx.entityContext.course?.description) {
      queueMemoryIngestion({
        content: ctx.entityContext.course.description,
        sourceId: `course_${ctx.entityContext.course.id}`,
        sourceType: 'COURSE_CONTENT',
        userId: ctx.user.id,
        courseId: ctx.entityContext.course.id,
        tags: ['course'],
        enableSummary: true,
        enableKnowledgeGraph: true,
      });
    }

    // Queue chapter content
    if (ctx.entityContext.chapter?.description) {
      queueMemoryIngestion({
        content: ctx.entityContext.chapter.description,
        sourceId: `chapter_${ctx.entityContext.chapter.id}`,
        sourceType: 'CHAPTER_CONTENT',
        userId: ctx.user.id,
        courseId: ctx.entityContext.chapter.courseId,
        chapterId: ctx.entityContext.chapter.id,
        tags: ['chapter'],
        enableSummary: true,
        enableKnowledgeGraph: true,
      });
    }

    // Queue section content
    if (ctx.entityContext.section?.content) {
      queueMemoryIngestion({
        content: ctx.entityContext.section.content,
        sourceId: `section_${ctx.entityContext.section.id}`,
        sourceType: 'SECTION_CONTENT',
        userId: ctx.user.id,
        courseId: ctx.entityContext.section.courseId,
        chapterId: ctx.entityContext.section.chapterId,
        sectionId: ctx.entityContext.section.id,
        tags: ['section'],
        enableSummary: true,
        enableKnowledgeGraph: true,
      });
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Agentic memory persistence failed:', error);
  }

  return ctx;
}
