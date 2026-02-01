/**
 * SAM Page Context Engine
 * Single-responsibility module for gathering, validating, and formatting page context.
 * Replaces scattered context-building logic with a unified pipeline.
 *
 * Design principles:
 * - Fail-loud: DB failures logged explicitly with diagnostics
 * - Priority injection: Entity context formatted for top-of-prompt placement
 * - Observable: Every decision is logged with structured data
 * - Client-first: Uses client data when available (faster, no DB call)
 */

import { logger } from '@/lib/logger';
import {
  buildEntityContext,
  type EntityContext,
  type CourseContext,
  type ChapterContext,
  type SectionContext,
} from './entity-context';

// ============================================================================
// TYPES
// ============================================================================

export interface PageContextResult {
  entityContext: EntityContext;
  entitySummary: string;
  contextConfidence: 'high' | 'medium' | 'low' | 'none';
  source: 'client' | 'database' | 'fallback';
  diagnostics: {
    pageType: string;
    entityId?: string;
    dbQueryAttempted: boolean;
    dbQuerySucceeded: boolean;
    clientDataAvailable: boolean;
    summaryLength: number;
  };
}

interface GatherPageContextParams {
  pageType: string;
  entityId?: string;
  parentEntityId?: string;
  grandParentEntityId?: string;
  userId: string;
  clientEntityData?: Record<string, unknown>;
  clientEntityType?: string;
}

/** Page types that have entity context available via DB */
const ENTITY_PAGE_TYPES = new Set([
  'courses-list',
  'course-detail',
  'course-create',
  'chapter-detail',
  'section-detail',
  'course-learning',
  'chapter-learning',
  'section-learning',
]);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Gathers page context using a fallback chain:
 * 1. Client-provided entity data (fastest, no DB call)
 * 2. Database query via buildEntityContext
 * 3. Page-type-only context with low confidence
 *
 * Never returns silently. Always logs diagnostics at info level.
 */
export async function gatherPageContext(
  params: GatherPageContextParams
): Promise<PageContextResult> {
  const {
    pageType,
    entityId,
    parentEntityId,
    grandParentEntityId,
    userId,
    clientEntityData,
    clientEntityType,
  } = params;

  const diagnostics = {
    pageType,
    entityId,
    dbQueryAttempted: false,
    dbQuerySucceeded: false,
    clientDataAvailable: false,
    summaryLength: 0,
  };

  // ---- Step 1: Try client-provided entity data (fastest) ----
  const hasClientData = !!clientEntityData && hasEntityTitle(clientEntityData);
  diagnostics.clientDataAvailable = hasClientData;

  if (hasClientData && clientEntityData) {
    const entityType = clientEntityType || 'course';
    const entityContext = buildEntityFromClientData(
      clientEntityData,
      entityType,
      entityId
    );

    if (entityContext.type !== 'none') {
      diagnostics.summaryLength = entityContext.summary.length;

      logger.info('[PageContextEngine] Context gathered from client data:', {
        ...diagnostics,
        source: 'client',
        confidence: 'high',
        entityType: entityContext.type,
      });

      return {
        entityContext,
        entitySummary: entityContext.summary,
        contextConfidence: 'high',
        source: 'client',
        diagnostics,
      };
    }
  }

  // ---- Step 2: Try database query ----
  if (ENTITY_PAGE_TYPES.has(pageType) || entityId) {
    diagnostics.dbQueryAttempted = true;

    const entityContext = await buildEntityContext(
      pageType,
      entityId,
      parentEntityId,
      grandParentEntityId,
      userId
    );

    if (entityContext.type !== 'none') {
      diagnostics.dbQuerySucceeded = true;
      diagnostics.summaryLength = entityContext.summary.length;

      logger.info('[PageContextEngine] Context gathered from database:', {
        ...diagnostics,
        source: 'database',
        confidence: 'high',
        entityType: entityContext.type,
      });

      return {
        entityContext,
        entitySummary: entityContext.summary,
        contextConfidence: 'high',
        source: 'database',
        diagnostics,
      };
    }

    // DB returned type:'none' - query ran but found no entity data
    diagnostics.dbQuerySucceeded = false;

    logger.warn('[PageContextEngine] DB query returned no entity data:', {
      ...diagnostics,
      hint: 'buildEntityContext returned type:none - possible DB error or missing data',
    });
  }

  // ---- Step 3: Fallback - page-type-only context ----
  const fallbackSummary = buildPageTypeFallback(pageType);
  diagnostics.summaryLength = fallbackSummary.length;
  const confidence = fallbackSummary.length > 0 ? 'low' as const : 'none' as const;

  logger.info('[PageContextEngine] Using fallback context:', {
    ...diagnostics,
    source: 'fallback',
    confidence,
  });

  return {
    entityContext: {
      type: 'none',
      summary: fallbackSummary,
    },
    entitySummary: fallbackSummary,
    contextConfidence: confidence,
    source: 'fallback',
    diagnostics,
  };
}

// ============================================================================
// CLIENT DATA BUILDERS
// ============================================================================

function hasEntityTitle(data: Record<string, unknown>): boolean {
  return typeof data.title === 'string' && data.title.trim().length > 0;
}

/**
 * Build EntityContext from client-provided data.
 * Returns type:'none' if the data is insufficient.
 */
function buildEntityFromClientData(
  data: Record<string, unknown>,
  entityType: string,
  entityId?: string
): EntityContext {
  const title = data.title as string | undefined;
  if (!title) {
    return { type: 'none', summary: 'No specific entity context available.' };
  }

  switch (entityType) {
    case 'course':
      return buildCourseFromClient(data, entityId);
    case 'chapter':
      return buildChapterFromClient(data, entityId);
    case 'section':
      return buildSectionFromClient(data, entityId);
    default:
      return { type: 'none', summary: 'No specific entity context available.' };
  }
}

function buildCourseFromClient(
  data: Record<string, unknown>,
  entityId?: string
): EntityContext {
  const title = data.title as string;
  const description = (data.description as string | null) ?? null;
  const whatYouWillLearn = (data.whatYouWillLearn || data.learningObjectives) as string[] | undefined;
  const isPublished = (data.isPublished as boolean | undefined) ?? false;
  const chapters = data.chapters as Array<{
    id: string;
    title: string;
    position?: number;
    sectionCount?: number;
    sections?: Array<{ id: string; title: string }>;
  }> | undefined;
  const chapterCount = (data.chapterCount as number | undefined) ?? chapters?.length ?? 0;

  const courseContext: CourseContext = {
    id: entityId || '',
    title,
    description,
    subtitle: null,
    courseGoals: null,
    whatYouWillLearn: whatYouWillLearn ?? [],
    prerequisites: null,
    difficulty: null,
    categoryName: null,
    isPublished,
    chapterCount,
    chapters: chapters?.map(ch => ({
      id: ch.id,
      title: ch.title,
      position: ch.position ?? 0,
      sectionCount: ch.sectionCount ?? ch.sections?.length ?? 0,
    })) ?? [],
  };

  const parts: string[] = [`Course: "${title}"`];
  if (description) parts.push(`Description: ${truncate(description, 300)}`);
  if (whatYouWillLearn?.length) {
    parts.push(
      `Learning objectives: ${whatYouWillLearn.slice(0, 3).join('; ')}${whatYouWillLearn.length > 3 ? '...' : ''}`
    );
  }
  parts.push(`Chapters: ${chapterCount}`);
  if (chapters?.length) {
    const names = chapters.slice(0, 5).map(ch => ch.title).join(', ');
    parts.push(`Chapter titles: ${names}${chapters.length > 5 ? '...' : ''}`);
  }
  parts.push(`Status: ${isPublished ? 'Published' : 'Draft'}`);

  return {
    type: 'course',
    course: courseContext,
    summary: parts.join('\n'),
  };
}

function buildChapterFromClient(
  data: Record<string, unknown>,
  entityId?: string
): EntityContext {
  const title = data.title as string;
  const description = (data.description as string | null) ?? null;
  const courseTitle = data.courseTitle as string | undefined;
  const courseId = data.courseId as string | undefined;
  const sections = data.sections as Array<{
    id: string;
    title: string;
    position?: number;
    contentType?: string | null;
  }> | undefined;
  const sectionCount = (data.sectionCount as number | undefined) ?? sections?.length ?? 0;

  const chapterContext: ChapterContext = {
    id: entityId || '',
    title,
    description,
    position: 0,
    courseTitle: courseTitle || '',
    courseId: courseId || '',
    sections: sections?.map(s => ({
      id: s.id,
      title: s.title,
      position: s.position ?? 0,
      contentType: s.contentType ?? null,
    })) ?? [],
  };

  const parts: string[] = [`Chapter: "${title}"`];
  if (courseTitle) parts.push(`Part of course: "${courseTitle}"`);
  if (description) parts.push(`Description: ${truncate(description, 200)}`);
  parts.push(`Sections: ${sectionCount}`);
  if (sections?.length) {
    const names = sections.slice(0, 5).map(s => s.title).join(', ');
    parts.push(`Section titles: ${names}${sections.length > 5 ? '...' : ''}`);
  }

  return {
    type: 'chapter',
    chapter: chapterContext,
    course: courseTitle ? {
      id: courseId || '',
      title: courseTitle,
      description: null,
      subtitle: null,
      courseGoals: null,
      whatYouWillLearn: [],
      prerequisites: null,
      difficulty: null,
      categoryName: null,
      isPublished: false,
      chapterCount: 0,
      chapters: [],
    } : undefined,
    summary: parts.join('\n'),
  };
}

function buildSectionFromClient(
  data: Record<string, unknown>,
  entityId?: string
): EntityContext {
  const title = data.title as string;
  const description = (data.description as string | null) ?? null;
  const content = (data.content as string | null) ?? null;
  const chapterTitle = data.chapterTitle as string | undefined;
  const chapterId = data.chapterId as string | undefined;
  const courseTitle = data.courseTitle as string | undefined;
  const courseId = data.courseId as string | undefined;
  const videoUrl = (data.videoUrl as string | null) ?? null;
  const contentType = (data.contentType as string | null) ?? null;

  const sectionContext: SectionContext = {
    id: entityId || '',
    title,
    description,
    content: content ? truncate(stripHtml(content), 2000) : null,
    position: 0,
    chapterTitle: chapterTitle || '',
    chapterId: chapterId || '',
    courseTitle: courseTitle || '',
    courseId: courseId || '',
    videoUrl,
    contentType,
  };

  const parts: string[] = [`Section: "${title}"`];
  if (chapterTitle) parts.push(`Part of chapter: "${chapterTitle}"`);
  if (courseTitle) parts.push(`Part of course: "${courseTitle}"`);
  if (description) parts.push(`Description: ${truncate(description, 200)}`);
  if (contentType) parts.push(`Content type: ${contentType}`);
  if (content) {
    parts.push(`Content preview: ${truncate(stripHtml(content), 300)}`);
  }
  if (videoUrl) parts.push('Has video: Yes');

  return {
    type: 'section',
    section: sectionContext,
    summary: parts.join('\n'),
  };
}

// ============================================================================
// FALLBACK
// ============================================================================

/**
 * Generate a page-type-only fallback when no entity data is available.
 * Provides minimal context so the LLM at least knows what page the user is on.
 */
function buildPageTypeFallback(pageType: string): string {
  switch (pageType) {
    case 'courses-list':
      return 'User is viewing their courses list page.';
    case 'course-detail':
    case 'course-create':
      return 'User is on a course page.';
    case 'chapter-detail':
      return 'User is on a chapter page.';
    case 'section-detail':
      return 'User is on a section page.';
    case 'learning':
    case 'course-learning':
    case 'chapter-learning':
    case 'section-learning':
      return 'User is in a learning session.';
    case 'dashboard':
    case 'teacher-dashboard':
    case 'user-dashboard':
      return 'User is on their dashboard.';
    default:
      return '';
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function truncate(text: string, maxLength: number): string {
  const stripped = text.replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + '...';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
