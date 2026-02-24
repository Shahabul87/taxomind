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
import { EnhancedCourseAnalyzerV2, generateContentHash } from '@/lib/sam/depth-analysis-v2/enhanced-analyzer';
import type { CourseInput } from '@/lib/sam/depth-analysis-v2/types';

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
// Background Depth Analysis (Auto-Trigger Bridge)
// ============================================================================

interface DepthAnalysisTriggerInput {
  courseId: string;
  userId: string;
}

/**
 * Auto-trigger rule-based depth analysis after course creation completes.
 * Fire-and-forget with 10s delay to let DB writes settle.
 * Uses aiEnabled: false — zero AI cost.
 */
export function triggerBackgroundDepthAnalysis(input: DepthAnalysisTriggerInput): void {
  const { courseId, userId } = input;

  setTimeout(async () => {
    try {
      logger.info('[POST_ENRICHMENT] Starting background depth analysis', { courseId });

      // Fetch course with chapters/sections
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          courseGoals: true,
          whatYouWillLearn: true,
          prerequisites: true,
          difficulty: true,
          chapters: {
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              isPublished: true,
              sections: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  position: true,
                  isPublished: true,
                  videoUrl: true,
                  learningObjectives: true,
                  exams: {
                    select: {
                      id: true,
                      title: true,
                      questions: {
                        select: { id: true, question: true, type: true },
                        take: 50,
                      },
                    },
                    take: 10,
                  },
                },
                orderBy: { position: 'asc' as const },
              },
            },
            orderBy: { position: 'asc' as const },
          },
        },
      });

      if (!course) {
        logger.warn('[POST_ENRICHMENT] Course not found for depth analysis', { courseId });
        return;
      }

      // Transform to CourseInput format
      const courseInput: CourseInput = {
        id: course.id,
        title: course.title,
        description: course.description,
        courseGoals: course.courseGoals,
        whatYouWillLearn: course.whatYouWillLearn,
        prerequisites: course.prerequisites,
        difficulty: course.difficulty,
        chapters: course.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          description: ch.description,
          position: ch.position,
          isPublished: ch.isPublished,
          sections: ch.sections.map((sec) => ({
            id: sec.id,
            title: sec.title,
            description: sec.description,
            content: null, // Section content is stored in related models
            position: sec.position,
            isPublished: sec.isPublished,
            videoUrl: sec.videoUrl,
            objectives: sec.learningObjectives
              ? sec.learningObjectives.split('\n').filter(Boolean)
              : [],
            exams: sec.exams.map((ex) => ({
              id: ex.id,
              title: ex.title,
              questions: ex.questions.map((q) => ({
                id: q.id,
                question: q.question,
                type: q.type,
              })),
            })),
          })),
        })),
      };

      // Run rule-based analysis only (zero AI cost)
      const analyzer = new EnhancedCourseAnalyzerV2({
        courseId,
        course: courseInput,
        aiEnabled: false,
      });

      const result = await analyzer.analyze();
      const contentHash = generateContentHash(courseInput);

      // Persist results to CourseDepthAnalysisV2 table
      await db.courseDepthAnalysisV2.create({
        data: {
          courseId,
          version: 1,
          status: 'COMPLETED',
          analysisMethod: 'rule-based',
          contentHash,
          overallScore: result.overallScore,
          depthScore: result.depthScore,
          consistencyScore: result.consistencyScore,
          flowScore: result.flowScore,
          qualityScore: result.qualityScore,
          bloomsDistribution: result.bloomsDistribution as Record<string, number>,
          bloomsBalance: result.bloomsBalance,
          structureAnalysis: result.structureAnalysis as Record<string, unknown>,
          bloomsAnalysis: result.bloomsAnalysis as Record<string, unknown>,
          flowAnalysis: result.flowAnalysis as Record<string, unknown>,
          consistencyAnalysis: result.consistencyAnalysis as Record<string, unknown>,
          contentAnalysis: result.contentAnalysis as Record<string, unknown>,
          outcomesAnalysis: result.outcomesAnalysis as Record<string, unknown>,
          chapterAnalysis: result.chapterAnalysis as unknown[],
          issues: {
            create: result.issues.slice(0, 100).map((issue) => ({
              type: issue.type,
              severity: issue.severity,
              status: 'OPEN',
              title: issue.title,
              description: issue.description,
              location: issue.location as Record<string, unknown>,
              evidence: issue.evidence,
              impact: issue.impact as Record<string, unknown>,
              fix: issue.fix as Record<string, unknown>,
            })),
          },
        },
      });

      logger.info('[POST_ENRICHMENT] Background depth analysis complete', {
        courseId,
        overallScore: result.overallScore,
        issueCount: result.issues.length,
      });
    } catch (error) {
      // Never throw — fire-and-forget
      logger.error('[POST_ENRICHMENT] Background depth analysis failed', {
        courseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, 10_000); // 10s delay to let DB writes settle
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
