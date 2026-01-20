/**
 * Enhanced Depth Analysis API Route
 *
 * Provides comprehensive course depth analysis including:
 * - Bloom's Taxonomy distribution analysis
 * - Webb's DOK (Depth of Knowledge) analysis
 * - Course type detection and alignment
 * - Assessment quality metrics
 * - Learning pathway generation
 * - Gap analysis and recommendations
 * - Historical trend tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  createEnhancedDepthAnalysisEngine,
  type CourseData,
  type EnhancedDepthAnalysisResponse,
} from '@sam-ai/educational/depth-analysis';
import { PrismaCourseDepthAnalysisStore } from '@/lib/adapters';
import {
  // Multi-Framework Evaluator
  createMultiFrameworkEvaluator,
  type MultiFrameworkResult,
  type FrameworkType,
  type ContentForMultiFrameworkAnalysis,
  // Alignment Engine
  createAlignmentEngine,
  type AlignmentAnalysisResult,
  type CourseForAlignment,
  // Evidence Service
  createEvidenceService,
  type EvidenceSummary,
  // Content Ingestion
  createContentIngestionPipeline,
  type IngestionResult,
  // LLM Adapter
  createDepthAnalysisLLMAdapter,
  type LLMProvider,
} from '@sam-ai/educational';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let depthAnalysisEngine: ReturnType<typeof createEnhancedDepthAnalysisEngine> | null = null;

function getDepthAnalysisEngine() {
  if (!depthAnalysisEngine) {
    depthAnalysisEngine = createEnhancedDepthAnalysisEngine({
      storage: new PrismaCourseDepthAnalysisStore(),
      logger: {
        info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
        warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
        error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
      },
      enableAIEnhancements: false, // Set to true if SAMConfig is provided
    });
  }
  return depthAnalysisEngine;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AnalysisDepthEnum = z.enum(['basic', 'detailed', 'comprehensive']);

const AnalyzeCourseSchema = z.object({
  courseId: z.string().min(1),
  forceReanalyze: z.boolean().optional().default(false),
  includeHistoricalSnapshot: z.boolean().optional().default(true),
  analysisDepth: AnalysisDepthEnum.optional().default('detailed'),
});

const GetHistoricalTrendsSchema = z.object({
  courseId: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

const GetCachedAnalysisSchema = z.object({
  courseId: z.string().min(1),
});

const CompareCoursesByDepthSchema = z.object({
  courseIds: z.array(z.string().min(1)).min(2).max(10),
});

// New schemas for enhanced depth analysis features
const MultiFrameworkAnalysisSchema = z.object({
  courseId: z.string().min(1),
  frameworks: z.array(z.enum(['blooms', 'dok', 'solo', 'fink', 'marzano'])).optional(),
  forceReanalyze: z.boolean().optional().default(false),
});

const AlignmentMatrixSchema = z.object({
  courseId: z.string().min(1),
  includeAssessments: z.boolean().optional().default(true),
  includeSections: z.boolean().optional().default(true),
});

const ContentIngestionSchema = z.object({
  courseId: z.string().min(1),
  attachmentIds: z.array(z.string()).optional(),
  forceReextract: z.boolean().optional().default(false),
});

const EvidenceSummarySchema = z.object({
  courseId: z.string().min(1),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.5),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

const LLMAnalysisSchema = z.object({
  courseId: z.string().min(1),
  analysisType: z.enum(['blooms', 'dok', 'multi-framework', 'alignment', 'recommendations']),
  provider: z.enum(['openai', 'anthropic', 'deepseek']).optional().default('openai'),
  content: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch course data from database in the format expected by the engine
 */
async function fetchCourseData(courseId: string, userId: string): Promise<CourseData | null> {
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { userId }, // Course owner
        { isPublished: true }, // Published course
        { Enrollment: { some: { userId } } }, // Enrolled user
      ],
    },
    include: {
      category: { select: { name: true } },
      chapters: {
        orderBy: { position: 'asc' },
        include: {
          sections: {
            orderBy: { position: 'asc' },
            include: {
              exams: {
                include: {
                  ExamQuestion: {
                    select: {
                      id: true,
                      question: true,
                      questionType: true,
                      bloomsLevel: true,
                      explanation: true,
                      options: true,
                    },
                  },
                },
              },
              Question: {
                select: {
                  id: true,
                  text: true,
                },
              },
            },
          },
        },
      },
      attachments: { select: { id: true, name: true } },
    },
  });

  if (!course) {
    return null;
  }

  // Transform to CourseData format
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    whatYouWillLearn: course.whatYouWillLearn ?? [],
    categoryId: course.categoryId,
    price: course.price,
    category: course.category,
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      learningOutcomes: chapter.learningOutcomes,
      position: chapter.position,
      sections: chapter.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        position: section.position,
        videoUrl: section.videoUrl,
        duration: section.duration,
        exams: section.exams.map((exam) => ({
          id: exam.id,
          title: exam.title,
          ExamQuestion: exam.ExamQuestion.map((q) => ({
            id: q.id,
            question: q.question,
            type: q.questionType,
            bloomsLevel: q.bloomsLevel ?? undefined,
            explanation: q.explanation ?? undefined,
            options: Array.isArray(q.options)
              ? (q.options as Array<{ id: string; text: string; isCorrect: boolean }>)
              : [],
          })),
        })),
        Question: section.Question.map((q) => ({
          id: q.id,
          text: q.text,
        })),
      })),
    })),
    attachments: course.attachments,
  };
}

// ============================================================================
// GET - Retrieve cached analysis or historical trends
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') ?? 'cached';
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'courseId parameter required' } },
        { status: 400 }
      );
    }

    const engine = getDepthAnalysisEngine();

    switch (endpoint) {
      case 'cached': {
        // Check if user has access to the course
        const courseData = await fetchCourseData(courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Get cached analysis from storage
        const store = new PrismaCourseDepthAnalysisStore();
        const cached = await store.getCachedAnalysis(courseId);

        return NextResponse.json({
          success: true,
          data: cached,
          metadata: {
            timestamp: new Date().toISOString(),
            cached: cached !== null,
          },
        });
      }

      case 'trends': {
        const limit = parseInt(searchParams.get('limit') ?? '10');

        // Check if user has access to the course
        const courseData = await fetchCourseData(courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        const trends = await engine.getHistoricalTrends(courseId, limit);

        return NextResponse.json({
          success: true,
          data: trends,
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'summary': {
        // Get a quick summary of a course's depth metrics
        const courseData = await fetchCourseData(courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        const store = new PrismaCourseDepthAnalysisStore();
        const cached = await store.getCachedAnalysis(courseId);

        if (!cached) {
          return NextResponse.json({
            success: true,
            data: {
              hasAnalysis: false,
              courseId,
              message: 'No analysis available. Run analyze action to generate.',
            },
            metadata: { timestamp: new Date().toISOString() },
          });
        }

        // Return summary metrics
        return NextResponse.json({
          success: true,
          data: {
            hasAnalysis: true,
            courseId: cached.courseId,
            analyzedAt: cached.analyzedAt,
            cognitiveDepth: cached.cognitiveDepth,
            bloomsDistribution: cached.bloomsDistribution,
            gapCount: cached.gapAnalysis?.length ?? 0,
            skillsCount: cached.skillsMatrix?.length ?? 0,
            recommendationCount:
              (cached.recommendations?.immediate?.length ?? 0) +
              (cached.recommendations?.shortTerm?.length ?? 0) +
              (cached.recommendations?.longTerm?.length ?? 0),
          },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[EnhancedDepthAnalysis] GET error:', error);
    console.error('[EnhancedDepthAnalysis] GET error details:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve depth analysis data',
          details: { errorMessage, errorStack }
        }
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Action-based handler for various operations
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing action parameter' } },
        { status: 400 }
      );
    }

    const engine = getDepthAnalysisEngine();
    let result: unknown;

    switch (action) {
      case 'analyze': {
        const validated = AnalyzeCourseSchema.parse(data);

        // Fetch course data
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Run enhanced depth analysis
        const analysis: EnhancedDepthAnalysisResponse = await engine.analyze(courseData, {
          forceReanalyze: validated.forceReanalyze,
          includeHistoricalSnapshot: validated.includeHistoricalSnapshot,
          analysisDepth: validated.analysisDepth,
        });

        result = analysis;

        logger.info('[EnhancedDepthAnalysis] Course analyzed', {
          userId: session.user.id,
          courseId: validated.courseId,
          cognitiveDepth: analysis.cognitiveDepth,
          balance: analysis.balance,
        });
        break;
      }

      case 'get-historical-trends': {
        const validated = GetHistoricalTrendsSchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        result = await engine.getHistoricalTrends(validated.courseId, validated.limit);
        break;
      }

      case 'get-cached-analysis': {
        const validated = GetCachedAnalysisSchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        const store = new PrismaCourseDepthAnalysisStore();
        result = await store.getCachedAnalysis(validated.courseId);
        break;
      }

      case 'compare-courses': {
        const validated = CompareCoursesByDepthSchema.parse(data);
        const comparisons: Array<{
          courseId: string;
          title: string;
          cognitiveDepth: number | null;
          bloomsDistribution: Record<string, number> | null;
          hasAnalysis: boolean;
        }> = [];

        for (const courseId of validated.courseIds) {
          const courseData = await fetchCourseData(courseId, session.user.id);
          if (!courseData) {
            comparisons.push({
              courseId,
              title: 'Access Denied',
              cognitiveDepth: null,
              bloomsDistribution: null,
              hasAnalysis: false,
            });
            continue;
          }

          const store = new PrismaCourseDepthAnalysisStore();
          const cached = await store.getCachedAnalysis(courseId);

          if (cached) {
            comparisons.push({
              courseId,
              title: courseData.title,
              cognitiveDepth: cached.cognitiveDepth,
              bloomsDistribution: cached.bloomsDistribution,
              hasAnalysis: true,
            });
          } else {
            comparisons.push({
              courseId,
              title: courseData.title,
              cognitiveDepth: null,
              bloomsDistribution: null,
              hasAnalysis: false,
            });
          }
        }

        // Calculate average metrics for courses with analysis
        const analyzed = comparisons.filter((c) => c.hasAnalysis && c.cognitiveDepth !== null);
        const avgCognitiveDepth =
          analyzed.length > 0
            ? analyzed.reduce((sum, c) => sum + (c.cognitiveDepth ?? 0), 0) / analyzed.length
            : null;

        result = {
          comparisons,
          summary: {
            totalCourses: validated.courseIds.length,
            analyzedCourses: analyzed.length,
            averageCognitiveDepth: avgCognitiveDepth,
          },
        };

        logger.info('[EnhancedDepthAnalysis] Courses compared', {
          userId: session.user.id,
          courseCount: validated.courseIds.length,
        });
        break;
      }

      case 'invalidate-cache': {
        const validated = GetCachedAnalysisSchema.parse(data);

        // Check access - only course owner can invalidate cache
        const course = await db.course.findFirst({
          where: {
            id: validated.courseId,
            userId: session.user.id,
          },
        });

        if (!course) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only course owner can invalidate cache' } },
            { status: 403 }
          );
        }

        // Delete the cached analysis
        await db.courseBloomsAnalysis.delete({
          where: { courseId: validated.courseId },
        }).catch(() => {
          // Ignore if not found
        });

        result = { invalidated: true, courseId: validated.courseId };

        logger.info('[EnhancedDepthAnalysis] Cache invalidated', {
          userId: session.user.id,
          courseId: validated.courseId,
        });
        break;
      }

      // ============================================================================
      // NEW ENHANCED DEPTH ANALYSIS ACTIONS (Phase 1-5 Integration)
      // ============================================================================

      case 'analyze-multi-framework': {
        const validated = MultiFrameworkAnalysisSchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Create multi-framework evaluator
        const evaluator = createMultiFrameworkEvaluator({
          frameworks: (validated.frameworks as FrameworkType[]) ?? ['blooms', 'dok', 'solo', 'fink', 'marzano'],
          logger: {
            info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
            warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
            error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
          },
        });

        // Prepare content for analysis
        const contentForAnalysis: ContentForMultiFrameworkAnalysis = {
          courseId: validated.courseId,
          content: courseData.chapters.flatMap((chapter) =>
            chapter.sections.flatMap((section) => [
              // Objectives
              ...(courseData.whatYouWillLearn?.map((obj, idx) => ({
                id: `obj-${idx}`,
                text: obj,
                type: 'objective' as const,
              })) ?? []),
              // Section descriptions
              {
                id: section.id,
                text: section.description ?? section.title,
                type: 'section' as const,
              },
              // Assessment questions
              ...section.exams.flatMap((exam) =>
                exam.ExamQuestion.map((q) => ({
                  id: q.id,
                  text: q.question,
                  type: 'assessment' as const,
                  bloomsLevel: q.bloomsLevel ?? undefined,
                }))
              ),
            ])
          ),
        };

        const multiFrameworkResult: MultiFrameworkResult = await evaluator.evaluate(contentForAnalysis);

        result = {
          multiFramework: multiFrameworkResult,
          courseId: validated.courseId,
          frameworksAnalyzed: multiFrameworkResult.metadata.frameworksUsed,
        };

        logger.info('[EnhancedDepthAnalysis] Multi-framework analysis completed', {
          userId: session.user.id,
          courseId: validated.courseId,
          compositeScore: multiFrameworkResult.compositeScore,
        });
        break;
      }

      case 'get-alignment-matrix': {
        const validated = AlignmentMatrixSchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Create alignment engine
        const alignmentEngine = createAlignmentEngine({
          logger: {
            info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
            warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
            error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
          },
        });

        // Prepare course for alignment analysis
        const courseForAlignment: CourseForAlignment = {
          id: courseData.id,
          title: courseData.title,
          objectives: courseData.whatYouWillLearn?.map((obj, idx) => ({
            id: `obj-${idx}`,
            text: obj,
            bloomsLevel: undefined, // Will be analyzed
          })) ?? [],
          sections: courseData.chapters.flatMap((chapter) =>
            chapter.sections.map((section) => ({
              id: section.id,
              title: section.title,
              description: section.description ?? '',
              chapterId: chapter.id,
              content: section.description ?? section.title,
            }))
          ),
          assessments: validated.includeAssessments
            ? courseData.chapters.flatMap((chapter) =>
                chapter.sections.flatMap((section) =>
                  section.exams.map((exam) => ({
                    id: exam.id,
                    title: exam.title,
                    sectionId: section.id,
                    questions: exam.ExamQuestion.map((q) => ({
                      id: q.id,
                      text: q.question,
                      bloomsLevel: q.bloomsLevel ?? undefined,
                    })),
                  }))
                )
              )
            : [],
        };

        const alignmentResult: AlignmentAnalysisResult = await alignmentEngine.analyze(courseForAlignment);

        result = {
          alignment: alignmentResult,
          courseId: validated.courseId,
          summary: {
            totalObjectives: alignmentResult.summary.objectivesCovered,
            alignedObjectives: alignmentResult.summary.objectivesCovered,
            overallScore: alignmentResult.summary.overallAlignmentScore,
            gaps: alignmentResult.gaps.length,
          },
        };

        logger.info('[EnhancedDepthAnalysis] Alignment matrix generated', {
          userId: session.user.id,
          courseId: validated.courseId,
          alignmentScore: alignmentResult.summary.overallAlignmentScore,
        });
        break;
      }

      case 'extract-content': {
        const validated = ContentIngestionSchema.parse(data);

        // Check access - only course owner can trigger extraction
        const course = await db.course.findFirst({
          where: {
            id: validated.courseId,
            userId: session.user.id,
          },
          include: {
            attachments: true,
          },
        });

        if (!course) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only course owner can trigger content extraction' } },
            { status: 403 }
          );
        }

        // Create content ingestion pipeline
        const pipeline = createContentIngestionPipeline({
          logger: {
            info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
            warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
            error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
          },
        });

        // Filter attachments if specific IDs provided
        const attachmentsToProcess = validated.attachmentIds
          ? course.attachments.filter((a) => validated.attachmentIds?.includes(a.id))
          : course.attachments;

        const ingestionResults: IngestionResult[] = [];

        for (const attachment of attachmentsToProcess) {
          try {
            const ingestionResult = await pipeline.ingest({
              id: attachment.id,
              name: attachment.name,
              url: attachment.url,
              courseId: course.id,
            });
            ingestionResults.push(ingestionResult);
          } catch (err) {
            logger.warn('[EnhancedDepthAnalysis] Failed to ingest attachment', {
              attachmentId: attachment.id,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }

        result = {
          courseId: validated.courseId,
          totalAttachments: attachmentsToProcess.length,
          successfulExtractions: ingestionResults.filter((r) => r.status === 'completed').length,
          results: ingestionResults,
        };

        logger.info('[EnhancedDepthAnalysis] Content extraction completed', {
          userId: session.user.id,
          courseId: validated.courseId,
          attachmentsProcessed: attachmentsToProcess.length,
        });
        break;
      }

      case 'get-evidence-summary': {
        const validated = EvidenceSummarySchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Create evidence service
        const evidenceService = createEvidenceService({
          logger: {
            info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
            warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
            error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
          },
        });

        // Get evidence summary
        const evidenceSummary: EvidenceSummary = await evidenceService.getSummary({
          courseId: validated.courseId,
          minConfidence: validated.confidenceThreshold,
          limit: validated.limit,
        });

        result = {
          evidence: evidenceSummary,
          courseId: validated.courseId,
          summary: {
            totalEvidence: evidenceSummary.totalCount,
            avgConfidence: evidenceSummary.averageConfidence,
            highConfidenceCount: evidenceSummary.confidenceDistribution.high,
            mediumConfidenceCount: evidenceSummary.confidenceDistribution.medium,
            lowConfidenceCount: evidenceSummary.confidenceDistribution.low,
          },
        };

        logger.info('[EnhancedDepthAnalysis] Evidence summary retrieved', {
          userId: session.user.id,
          courseId: validated.courseId,
          totalEvidence: evidenceSummary.totalCount,
        });
        break;
      }

      case 'analyze-with-llm': {
        const validated = LLMAnalysisSchema.parse(data);

        // Check access
        const courseData = await fetchCourseData(validated.courseId, session.user.id);
        if (!courseData) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
            { status: 404 }
          );
        }

        // Get API key based on provider
        const providerKeyMap: Record<string, string | undefined> = {
          openai: process.env.OPENAI_API_KEY,
          anthropic: process.env.ANTHROPIC_API_KEY,
          deepseek: process.env.DEEPSEEK_API_KEY,
        };

        const apiKey = providerKeyMap[validated.provider];
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: { code: 'CONFIG_ERROR', message: `${validated.provider} API key not configured` } },
            { status: 500 }
          );
        }

        // Create LLM adapter
        const llmAdapter = createDepthAnalysisLLMAdapter({
          provider: validated.provider as LLMProvider,
          apiKey,
          logger: {
            info: (msg: string, ...args: unknown[]) => logger.info(msg, { data: args }),
            warn: (msg: string, ...args: unknown[]) => logger.warn(msg, { data: args }),
            error: (msg: string, ...args: unknown[]) => logger.error(msg, { data: args }),
          },
        });

        // Prepare content for analysis
        const contentToAnalyze = validated.content ?? courseData.chapters
          .flatMap((ch) => ch.sections.map((s) => s.description ?? s.title))
          .join('\n');

        let llmResult: unknown;

        switch (validated.analysisType) {
          case 'blooms':
            llmResult = await llmAdapter.classifyBlooms({
              text: contentToAnalyze,
              context: 'course_content',
            });
            break;
          case 'dok':
            llmResult = await llmAdapter.classifyDOK({
              text: contentToAnalyze,
              context: 'course_content',
            });
            break;
          case 'multi-framework':
            llmResult = await llmAdapter.classifyMultiFramework({
              text: contentToAnalyze,
              frameworks: ['blooms', 'dok', 'solo', 'fink', 'marzano'],
            });
            break;
          case 'alignment':
            llmResult = await llmAdapter.analyzeAlignment({
              objectives: courseData.whatYouWillLearn?.map((obj, idx) => ({
                id: `obj-${idx}`,
                text: obj,
              })) ?? [],
              sections: courseData.chapters.flatMap((ch) =>
                ch.sections.map((s) => ({
                  id: s.id,
                  title: s.title,
                  content: s.description ?? s.title,
                }))
              ),
              assessments: [],
            });
            break;
          case 'recommendations':
            llmResult = await llmAdapter.generateRecommendations({
              courseId: validated.courseId,
              courseTitle: courseData.title,
              currentDistribution: {}, // Would need existing analysis
              focusAreas: ['content_gaps', 'cognitive_balance'],
            });
            break;
        }

        result = {
          llmAnalysis: llmResult,
          courseId: validated.courseId,
          analysisType: validated.analysisType,
          provider: validated.provider,
        };

        logger.info('[EnhancedDepthAnalysis] LLM analysis completed', {
          userId: session.user.id,
          courseId: validated.courseId,
          analysisType: validated.analysisType,
          provider: validated.provider,
        });
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[EnhancedDepthAnalysis] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process depth analysis request' } },
      { status: 500 }
    );
  }
}
