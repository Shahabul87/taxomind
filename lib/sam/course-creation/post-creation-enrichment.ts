/**
 * Post-Creation Enrichment Pipeline
 *
 * After a course is fully created (all chapters, sections, details generated),
 * this module runs SAM educational engines in the background to enrich the course:
 *
 * 1. KnowledgeGraphEngine.extractConcepts() — build concept graph with prerequisites
 * 2. BloomsAnalysisEngine.analyzeCourse() — full cognitive profile across all chapters
 *
 * These are fire-and-forget operations that don't block the user.
 * Results are stored in SAM memory stores for adaptive learning features.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getUserScopedSAMConfig } from '@/lib/adapters';
import { createKnowledgeGraphEngine, createBloomsAnalysisEngine } from '@sam-ai/educational';
import { db } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

interface EnrichmentInput {
  userId: string;
  courseId: string;
  courseTitle: string;
}

interface EnrichmentResult {
  knowledgeGraphCompleted: boolean;
  bloomsAnalysisCompleted: boolean;
  errors: string[];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Run background enrichment on a completed course.
 *
 * Fire-and-forget: catches all errors internally, never throws.
 * Returns a promise that resolves when enrichment finishes (or fails gracefully).
 */
export async function runPostCreationEnrichment(
  input: EnrichmentInput,
): Promise<EnrichmentResult> {
  const { userId, courseId, courseTitle } = input;
  const result: EnrichmentResult = {
    knowledgeGraphCompleted: false,
    bloomsAnalysisCompleted: false,
    errors: [],
  };

  logger.info('[POST_ENRICHMENT] Starting background enrichment', {
    courseId,
    courseTitle,
  });

  try {
    // Load course data for enrichment
    const courseData = await loadCourseContent(courseId);
    if (!courseData) {
      result.errors.push('Failed to load course content for enrichment');
      return result;
    }

    // Get SAM config for AI-powered analysis
    const samConfig = await getUserScopedSAMConfig(userId, 'analysis');

    // Run enrichment tasks concurrently
    const [kgResult, bloomsResult] = await Promise.allSettled([
      enrichKnowledgeGraph(samConfig, courseData, courseId),
      enrichBloomsAnalysis(samConfig, courseData, courseId, courseTitle),
    ]);

    if (kgResult.status === 'fulfilled') {
      result.knowledgeGraphCompleted = kgResult.value;
    } else {
      result.errors.push(`KnowledgeGraph: ${kgResult.reason}`);
    }

    if (bloomsResult.status === 'fulfilled') {
      result.bloomsAnalysisCompleted = bloomsResult.value;
    } else {
      result.errors.push(`BloomsAnalysis: ${bloomsResult.reason}`);
    }

    logger.info('[POST_ENRICHMENT] Enrichment complete', {
      courseId,
      knowledgeGraph: result.knowledgeGraphCompleted,
      bloomsAnalysis: result.bloomsAnalysisCompleted,
      errorCount: result.errors.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Enrichment pipeline error: ${msg}`);
    logger.error('[POST_ENRICHMENT] Pipeline error', { courseId, error: msg });
  }

  return result;
}

/**
 * Fire-and-forget wrapper — starts enrichment without awaiting.
 * Logs results when done.
 */
export function runPostCreationEnrichmentBackground(input: EnrichmentInput): void {
  runPostCreationEnrichment(input).catch((error) => {
    logger.error('[POST_ENRICHMENT] Background enrichment failed', {
      courseId: input.courseId,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

// ============================================================================
// Internal: Load Course Content
// ============================================================================

interface CourseContentForEnrichment {
  title: string;
  description: string;
  chapters: Array<{
    id: string;
    title: string;
    description: string;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
    }>;
  }>;
}

async function loadCourseContent(courseId: string): Promise<CourseContentForEnrichment | null> {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        chapters: {
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            sections: {
              select: {
                id: true,
                title: true,
                description: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!course) return null;

    return {
      title: course.title,
      description: course.description ?? '',
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        description: ch.description ?? '',
        position: ch.position,
        sections: ch.sections.map((sec) => ({
          id: sec.id,
          title: sec.title,
          description: sec.description,
          position: sec.position,
        })),
      })),
    };
  } catch (error) {
    logger.error('[POST_ENRICHMENT] Failed to load course', {
      courseId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ============================================================================
// Internal: Knowledge Graph Enrichment
// ============================================================================

async function enrichKnowledgeGraph(
  samConfig: Awaited<ReturnType<typeof getUserScopedSAMConfig>>,
  courseData: CourseContentForEnrichment,
  courseId: string,
): Promise<boolean> {
  try {
    const engine = createKnowledgeGraphEngine({
      samConfig,
      enableAIExtraction: true,
      confidenceThreshold: 0.6,
    });

    // Extract concepts from each chapter
    for (const chapter of courseData.chapters) {
      const chapterContent = [
        `# ${chapter.title}`,
        chapter.description,
        ...chapter.sections.map(
          (sec) => `## ${sec.title}\n${sec.description ?? ''}`,
        ),
      ].join('\n\n');

      await engine.extractConcepts({
        content: chapterContent,
        contentType: 'CHAPTER',
        context: {
          courseId,
          chapterId: chapter.id,
        },
      });
    }

    logger.info('[POST_ENRICHMENT] Knowledge graph extraction complete', {
      courseId,
      chaptersProcessed: courseData.chapters.length,
    });

    return true;
  } catch (error) {
    logger.warn('[POST_ENRICHMENT] Knowledge graph enrichment failed', {
      courseId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ============================================================================
// Internal: Bloom's Analysis Enrichment
// ============================================================================

async function enrichBloomsAnalysis(
  samConfig: Awaited<ReturnType<typeof getUserScopedSAMConfig>>,
  courseData: CourseContentForEnrichment,
  courseId: string,
  courseTitle: string,
): Promise<boolean> {
  try {
    const engine = createBloomsAnalysisEngine({
      samConfig,
      analysisDepth: 'standard',
    });

    // Build course analysis input
    const courseAnalysisInput = {
      id: courseId,
      title: courseTitle,
      description: courseData.description,
      chapters: courseData.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        position: ch.position,
        sections: ch.sections.map((sec) => ({
          id: sec.id,
          title: sec.title,
          description: sec.description ?? '',
        })),
      })),
    };

    const analysisResult = await engine.analyzeCourse(courseAnalysisInput);

    logger.info('[POST_ENRICHMENT] Bloom\'s analysis complete', {
      courseId,
      balance: analysisResult.courseLevel?.balance ?? 'unknown',
      chapterCount: courseData.chapters.length,
    });

    return true;
  } catch (error) {
    logger.warn('[POST_ENRICHMENT] Bloom\'s analysis enrichment failed', {
      courseId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
