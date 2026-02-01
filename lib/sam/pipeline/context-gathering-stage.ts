/**
 * Context Gathering Stage
 *
 * Builds entity context (from client-provided data or database fallback),
 * form summary, enriched DOM snapshot summary, and tool awareness summary.
 */

import { logger } from '@/lib/logger';
import {
  buildEntityContext,
  buildFormSummary,
  type EntityContext,
} from '@/lib/sam/entity-context';
import { getContextSummaryForRoute } from '@/lib/sam/context-gathering-integration';
import {
  ensureToolingInitialized,
} from '@/lib/sam/agentic-tooling';
import type { SAMFormField } from '@sam-ai/core';
import type { PipelineContext } from './types';

// =============================================================================
// HELPER: Transform raw form fields into SAMFormField records
// =============================================================================

export function transformFormFields(
  fields: Record<string, unknown>,
): Record<string, SAMFormField> {
  const result: Record<string, SAMFormField> = {};

  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'object' && value !== null) {
      const field = value as Record<string, unknown>;
      result[name] = {
        name,
        value: field.value,
        type: (field.type as string) || 'text',
        label: field.label as string | undefined,
        placeholder: field.placeholder as string | undefined,
        required: field.required as boolean | undefined,
      };
    } else {
      result[name] = {
        name,
        value,
        type: 'text',
      };
    }
  }

  return result;
}

// =============================================================================
// HELPER: Build a human-readable summary from client-provided entity data
// =============================================================================

export function buildClientEntitySummary(
  entityData: Record<string, unknown>,
  entityType: string,
): string {
  const parts: string[] = [];

  const title = entityData.title as string | undefined;
  const description = entityData.description as string | undefined;
  const courseTitle = entityData.courseTitle as string | undefined;
  const chapterTitle = entityData.chapterTitle as string | undefined;
  const content = entityData.content as string | undefined;
  const contentType = entityData.contentType as string | undefined;
  const videoUrl = entityData.videoUrl as string | undefined;
  const isPublished = entityData.isPublished as boolean | undefined;
  const chapterCount = entityData.chapterCount as number | undefined;
  const sectionCount = entityData.sectionCount as number | undefined;
  const whatYouWillLearn = entityData.whatYouWillLearn as string[] | undefined;
  const chapters = entityData.chapters as Array<{ title: string }> | undefined;
  const sections = entityData.sections as Array<{ title: string }> | undefined;

  if (entityType === 'course') {
    if (title) parts.push(`Course: "${title}"`);
    if (description) {
      parts.push(
        `Description: ${description.substring(0, 300)}${description.length > 300 ? '...' : ''}`,
      );
    }
    if (whatYouWillLearn?.length) {
      parts.push(
        `Learning objectives: ${whatYouWillLearn.slice(0, 3).join('; ')}${whatYouWillLearn.length > 3 ? '...' : ''}`,
      );
    }
    if (chapterCount !== undefined) parts.push(`Chapters: ${chapterCount}`);
    if (chapters?.length) {
      const chapterTitles = chapters.slice(0, 5).map((ch) => ch.title).join(', ');
      parts.push(`Chapter titles: ${chapterTitles}${chapters.length > 5 ? '...' : ''}`);
    }
    parts.push(`Status: ${isPublished ? 'Published' : 'Draft'}`);
  } else if (entityType === 'chapter') {
    if (title) parts.push(`Chapter: "${title}"`);
    if (courseTitle) parts.push(`Part of course: "${courseTitle}"`);
    if (description) {
      parts.push(
        `Description: ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}`,
      );
    }
    if (sectionCount !== undefined) parts.push(`Sections: ${sectionCount}`);
    if (sections?.length) {
      const sectionTitles = sections.slice(0, 5).map((s) => s.title).join(', ');
      parts.push(`Section titles: ${sectionTitles}${sections.length > 5 ? '...' : ''}`);
    }
  } else if (entityType === 'section') {
    if (title) parts.push(`Section: "${title}"`);
    if (chapterTitle) parts.push(`Part of chapter: "${chapterTitle}"`);
    if (courseTitle) parts.push(`Part of course: "${courseTitle}"`);
    if (description) {
      parts.push(
        `Description: ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}`,
      );
    }
    if (contentType) parts.push(`Content type: ${contentType}`);
    if (content) {
      const stripped = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      parts.push(
        `Content preview: ${stripped.substring(0, 300)}${stripped.length > 300 ? '...' : ''}`,
      );
    }
    if (videoUrl) parts.push('Has video: Yes');
  }

  return parts.length > 0 ? parts.join('\n') : 'No specific entity context available.';
}

// =============================================================================
// CONTEXT GATHERING STAGE
// =============================================================================

export async function runContextGatheringStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const hasClientEntityData = !!(ctx.pageContext.entityData as Record<string, unknown> | undefined)
    && !!(ctx.pageContext.entityData as Record<string, unknown>).title;

  // ----- 1. Build entity context -----
  let entityContext: EntityContext;

  try {
    if (hasClientEntityData && ctx.pageContext.entityData) {
      const clientData = ctx.pageContext.entityData as Record<string, unknown>;
      const entityType = (ctx.pageContext.entityType as string) || 'course';

      logger.debug('[SAM_UNIFIED] Using client-provided entity data:', {
        type: entityType,
        title: clientData.title,
        hasChapters: !!(clientData.chapters as unknown[])?.length,
      });

      const chapters = clientData.chapters as Array<{
        id: string; title: string; position?: number; sectionCount?: number;
        sections?: Array<{ id: string; title: string; isPublished?: boolean }>;
      }> | undefined;

      const sections = clientData.sections as Array<{
        id: string; title: string; position?: number; contentType?: string | null;
      }> | undefined;

      entityContext = {
        type: entityType as EntityContext['type'],
        course:
          entityType === 'course' || clientData.courseTitle
            ? {
                id: ctx.pageContext.entityId || '',
                title: (clientData.title as string) || (clientData.courseTitle as string) || '',
                description: (clientData.description as string) || null,
                subtitle: null,
                courseGoals: null,
                whatYouWillLearn:
                  (clientData.whatYouWillLearn as string[]) ||
                  (clientData.learningObjectives as string[]) ||
                  [],
                prerequisites: null,
                difficulty: null,
                categoryName: null,
                isPublished: (clientData.isPublished as boolean) ?? false,
                chapterCount:
                  (clientData.chapterCount as number) || chapters?.length || 0,
                chapters:
                  chapters?.map((ch) => ({
                    id: ch.id,
                    title: ch.title,
                    position: ch.position || 0,
                    sectionCount: ch.sectionCount || ch.sections?.length || 0,
                  })) || [],
              }
            : undefined,
        chapter:
          entityType === 'chapter'
            ? {
                id: ctx.pageContext.entityId || '',
                title: (clientData.title as string) || '',
                description: (clientData.description as string) || null,
                position: 0,
                courseTitle: (clientData.courseTitle as string) || '',
                courseId: (clientData.courseId as string) || '',
                sections:
                  sections?.map((s) => ({
                    id: s.id,
                    title: s.title,
                    position: 0,
                    contentType: null,
                  })) || [],
              }
            : undefined,
        section:
          entityType === 'section'
            ? {
                id: ctx.pageContext.entityId || '',
                title: (clientData.title as string) || '',
                description: (clientData.description as string) || null,
                content: (clientData.content as string) || null,
                position: 0,
                chapterTitle: (clientData.chapterTitle as string) || '',
                chapterId: (clientData.chapterId as string) || '',
                courseTitle: (clientData.courseTitle as string) || '',
                courseId: (clientData.courseId as string) || '',
                videoUrl: (clientData.videoUrl as string) || null,
                contentType: (clientData.contentType as string) || null,
              }
            : undefined,
        summary: buildClientEntitySummary(clientData, entityType),
      };
    } else {
      entityContext = await buildEntityContext(
        ctx.pageContext.type,
        ctx.pageContext.entityId,
        ctx.pageContext.parentEntityId,
        ctx.pageContext.grandParentEntityId,
        ctx.user.id,
      );
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Entity context gathering failed:', error);
    entityContext = { type: 'none', summary: '' };
  }

  logger.debug('[SAM_UNIFIED] Entity context ready:', {
    type: entityContext.type,
    hasEntity: entityContext.type !== 'none',
    summaryLength: entityContext.summary.length,
    source: hasClientEntityData ? 'client' : 'database',
  });

  // ----- 2. Build form summary -----
  const formFields = (ctx.formContext as { fields?: Record<string, unknown> } | undefined)?.fields;
  const formSummary = buildFormSummary(formFields);

  // ----- 3. Enriched snapshot from context gathering engine -----
  let contextSnapshotSummary: PipelineContext['contextSnapshotSummary'] = null;
  try {
    contextSnapshotSummary = await getContextSummaryForRoute(ctx.user.id);
  } catch {
    // Non-critical — continue without snapshot context
  }

  // ----- 4. Tools awareness summary -----
  let toolsSummary: string | undefined;
  try {
    const tooling = await ensureToolingInitialized();
    const allTools = await tooling.toolRegistry.listTools({
      enabled: true,
      deprecated: false,
    });

    if (allTools.length > 0) {
      const toolCategories = new Map<string, string[]>();
      for (const tool of allTools) {
        const category = tool.category || 'other';
        if (!toolCategories.has(category)) {
          toolCategories.set(category, []);
        }
        toolCategories.get(category)!.push(tool.name);
      }

      const categoryLines: string[] = [];
      for (const [category, tools] of toolCategories) {
        categoryLines.push(`- ${category}: ${tools.join(', ')}`);
      }

      toolsSummary = [
        `Available Mentor Tools (${allTools.length} total):`,
        ...categoryLines,
        '',
        'You can use these tools when appropriate to help the learner.',
      ].join('\n');
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Failed to build tools summary:', error);
  }

  logger.info('[SAM_UNIFIED] Processing request:', {
    userId: ctx.user.id,
    pageType: ctx.pageContext.type,
    hasForm: !!ctx.formContext,
    messageLength: ctx.message.length,
    entityId: ctx.pageContext.entityId,
    hasClientEntityData,
    clientEntityTitle: hasClientEntityData
      ? (ctx.pageContext.entityData as Record<string, unknown>)?.title
      : undefined,
  });

  return {
    ...ctx,
    entityContext,
    entitySummary: entityContext.summary,
    formSummary,
    contextSnapshotSummary,
    toolsSummary,
  };
}
