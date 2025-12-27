/**
 * Taxomind Entity Context Service
 *
 * Fetches actual entity data (courses, chapters, sections) for context awareness.
 * Uses direct Prisma queries for Taxomind-specific data structures.
 */

import { db } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

export interface CourseContext {
  id: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  courseGoals: string | null;
  whatYouWillLearn: string[];
  prerequisites: string | null;
  difficulty: string | null;
  categoryName: string | null;
  isPublished: boolean;
  chapterCount: number;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    sectionCount: number;
  }>;
}

export interface ChapterContext {
  id: string;
  title: string;
  description: string | null;
  position: number;
  courseTitle: string;
  courseId: string;
  sections: Array<{
    id: string;
    title: string;
    position: number;
    contentType: string | null;
  }>;
}

export interface SectionContext {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  position: number;
  chapterTitle: string;
  chapterId: string;
  courseTitle: string;
  courseId: string;
  videoUrl: string | null;
  contentType: string | null;
}

export interface EntityContext {
  type: 'course' | 'chapter' | 'section' | 'none';
  course?: CourseContext;
  chapter?: ChapterContext;
  section?: SectionContext;
  summary: string;
}

export interface PageFormData {
  formId: string;
  formType: string;
  fields: Record<
    string,
    {
      name: string;
      value: string;
      type: string;
      label?: string;
    }
  >;
  summary: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function truncateContent(content: string, maxLength: number): string {
  const stripped = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (stripped.length <= maxLength) return stripped;

  return stripped.substring(0, maxLength) + '...';
}

// ============================================================================
// ENTITY FETCHERS
// ============================================================================

/**
 * Fetch course context with chapters
 */
export async function fetchCourseContext(
  courseId: string
): Promise<CourseContext | null> {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { name: true } },
        chapters: {
          select: {
            id: true,
            title: true,
            position: true,
            _count: { select: { sections: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      subtitle: course.subtitle,
      courseGoals: course.courseGoals,
      whatYouWillLearn: course.whatYouWillLearn,
      prerequisites: course.prerequisites,
      difficulty: course.difficulty,
      categoryName: course.category?.name ?? null,
      isPublished: course.isPublished,
      chapterCount: course.chapters.length,
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        position: ch.position,
        sectionCount: ch._count.sections,
      })),
    };
  } catch (error) {
    console.error('[EntityContext] Error fetching course:', error);
    return null;
  }
}

/**
 * Fetch chapter context with sections
 */
export async function fetchChapterContext(
  chapterId: string
): Promise<ChapterContext | null> {
  try {
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: { select: { id: true, title: true } },
        sections: {
          select: {
            id: true,
            title: true,
            position: true,
            type: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!chapter) return null;

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      courseTitle: chapter.course.title,
      courseId: chapter.course.id,
      sections: chapter.sections.map((s) => ({
        id: s.id,
        title: s.title,
        position: s.position,
        contentType: s.type,
      })),
    };
  } catch (error) {
    console.error('[EntityContext] Error fetching chapter:', error);
    return null;
  }
}

/**
 * Fetch section context with content
 */
export async function fetchSectionContext(
  sectionId: string
): Promise<SectionContext | null> {
  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!section) return null;

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: section.description
        ? truncateContent(section.description, 2000)
        : null,
      position: section.position,
      chapterTitle: section.chapter.title,
      chapterId: section.chapter.id,
      courseTitle: section.chapter.course.title,
      courseId: section.chapter.course.id,
      videoUrl: section.videoUrl,
      contentType: section.type,
    };
  } catch (error) {
    console.error('[EntityContext] Error fetching section:', error);
    return null;
  }
}

// ============================================================================
// SUMMARY BUILDERS
// ============================================================================

function buildCourseSummary(course: CourseContext): string {
  const parts: string[] = [`Course: "${course.title}"`];

  if (course.subtitle) {
    parts.push(`Subtitle: ${course.subtitle}`);
  }

  if (course.description) {
    parts.push(`Description: ${truncateContent(course.description, 300)}`);
  }

  if (course.courseGoals) {
    parts.push(`Goals: ${truncateContent(course.courseGoals, 200)}`);
  }

  if (course.whatYouWillLearn.length > 0) {
    parts.push(
      `Learning outcomes: ${course.whatYouWillLearn.slice(0, 5).join('; ')}`
    );
  }

  if (course.categoryName) {
    parts.push(`Category: ${course.categoryName}`);
  }

  if (course.difficulty) {
    parts.push(`Difficulty: ${course.difficulty}`);
  }

  parts.push(`Chapters: ${course.chapterCount}`);

  if (course.chapters.length > 0) {
    const chapterList = course.chapters
      .slice(0, 5)
      .map((ch) => ch.title)
      .join(', ');
    parts.push(
      `Chapter titles: ${chapterList}${course.chapters.length > 5 ? '...' : ''}`
    );
  }

  parts.push(`Status: ${course.isPublished ? 'Published' : 'Draft'}`);

  return parts.join('\n');
}

function buildChapterSummary(
  chapter: ChapterContext,
  course: CourseContext | null
): string {
  const parts: string[] = [
    `Chapter: "${chapter.title}" (Position ${chapter.position})`,
    `Part of course: "${course?.title ?? 'Unknown'}"`,
  ];

  if (chapter.description) {
    parts.push(`Description: ${truncateContent(chapter.description, 200)}`);
  }

  parts.push(`Sections: ${chapter.sections.length}`);

  if (chapter.sections.length > 0) {
    const sectionList = chapter.sections
      .slice(0, 5)
      .map((s) => s.title)
      .join(', ');
    parts.push(
      `Section titles: ${sectionList}${chapter.sections.length > 5 ? '...' : ''}`
    );
  }

  return parts.join('\n');
}

function buildSectionSummary(
  section: SectionContext,
  chapter: ChapterContext | null,
  course: CourseContext | null
): string {
  const parts: string[] = [
    `Section: "${section.title}" (Position ${section.position})`,
    `Part of chapter: "${chapter?.title ?? section.chapterTitle}"`,
    `Part of course: "${course?.title ?? section.courseTitle}"`,
  ];

  if (section.description) {
    parts.push(`Description: ${truncateContent(section.description, 200)}`);
  }

  if (section.contentType) {
    parts.push(`Content type: ${section.contentType}`);
  }

  if (section.content) {
    parts.push(`Content preview: ${truncateContent(section.content, 500)}`);
  }

  if (section.videoUrl) {
    parts.push(`Has video: Yes`);
  }

  return parts.join('\n');
}

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

/**
 * Build entity context based on page type and IDs
 */
export async function buildTaxomindEntityContext(
  pageType: string,
  entityId?: string
): Promise<EntityContext> {
  let context: EntityContext = {
    type: 'none',
    summary: 'No specific entity context available.',
  };

  try {
    // Section detail page
    if (pageType === 'section-detail' && entityId) {
      const section = await fetchSectionContext(entityId);
      if (section) {
        const chapter = await fetchChapterContext(section.chapterId);
        const course = await fetchCourseContext(section.courseId);

        context = {
          type: 'section',
          section,
          chapter: chapter ?? undefined,
          course: course ?? undefined,
          summary: buildSectionSummary(section, chapter, course),
        };
      }
    }
    // Chapter detail page
    else if (pageType === 'chapter-detail' && entityId) {
      const chapter = await fetchChapterContext(entityId);
      if (chapter) {
        const course = await fetchCourseContext(chapter.courseId);

        context = {
          type: 'chapter',
          chapter,
          course: course ?? undefined,
          summary: buildChapterSummary(chapter, course),
        };
      }
    }
    // Course detail or create page
    else if (
      (pageType === 'course-detail' || pageType === 'course-create') &&
      entityId
    ) {
      const course = await fetchCourseContext(entityId);
      if (course) {
        context = {
          type: 'course',
          course,
          summary: buildCourseSummary(course),
        };
      }
    }
  } catch (error) {
    console.error('[EntityContext] Error building context:', error);
  }

  return context;
}

/**
 * Extract form data summary for context
 */
export function buildFormSummary(
  formData: Record<string, unknown> | undefined
): string {
  if (!formData || Object.keys(formData).length === 0) {
    return 'No form data available on this page.';
  }

  const parts: string[] = ['Form fields on this page:'];

  for (const [fieldName, fieldInfo] of Object.entries(formData)) {
    const info = fieldInfo as { value?: unknown; type?: string; label?: string };
    const value = info.value;
    const label = info.label || fieldName;

    if (value && String(value).trim()) {
      const displayValue = truncateContent(String(value), 200);
      parts.push(`- ${label}: "${displayValue}"`);
    } else {
      parts.push(`- ${label}: (empty)`);
    }
  }

  return parts.join('\n');
}
