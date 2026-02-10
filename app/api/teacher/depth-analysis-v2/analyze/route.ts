/**
 * Depth Analysis V2 - Start Analysis API
 *
 * Starts the 8-step course depth analysis and streams progress via SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { type IssueType } from '@prisma/client';
import { AIAccessDeniedError } from '@/lib/sam/ai-provider';
import {
  createEnhancedAnalyzerV2,
  generateContentHash,
  runAIAnalysis,
  determineAnalysisMode,
  type CourseInput,
  type AnalysisProgress,
  type AIAnalysisProgress,
  type AIAnalysisResult,
} from '@/lib/sam/depth-analysis-v2';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const AnalyzeSchema = z.object({
  courseId: z.string().min(1),
  forceReanalyze: z.boolean().optional().default(false),
  aiEnabled: z.boolean().optional().default(true),
});

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_ISSUE_TYPES = new Set([
  'STRUCTURE', 'CONTENT', 'FLOW', 'DUPLICATE', 'CONSISTENCY',
  'DEPTH', 'OBJECTIVE', 'ASSESSMENT', 'TIME', 'PREREQUISITE', 'GAP',
]);

function sanitizeIssueType(type: string): string {
  return VALID_ISSUE_TYPES.has(type) ? type : 'CONTENT';
}

const VALID_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

function sanitizeIssueSeverity(severity: string): string {
  const upper = severity?.toUpperCase?.() || 'MEDIUM';
  return VALID_SEVERITIES.has(upper) ? upper : 'MEDIUM';
}

/**
 * Calculate chapter depth score using weighted Bloom's distribution.
 * Uses the same approach as the overall depthScore but normalized to 0-100.
 *
 * Weighting: Higher-order thinking levels contribute more.
 * A course appropriately matched to its difficulty level should score 70+.
 */
function calculateChapterDepthScore(bloomsDist: Record<string, number>): number {
  const weighted =
    (bloomsDist.REMEMBER || 0) * 0.05 +
    (bloomsDist.UNDERSTAND || 0) * 0.10 +
    (bloomsDist.APPLY || 0) * 0.20 +
    (bloomsDist.ANALYZE || 0) * 0.25 +
    (bloomsDist.EVALUATE || 0) * 0.20 +
    (bloomsDist.CREATE || 0) * 0.20;

  // The weighted sum produces values roughly in the 5-25 range for typical distributions.
  // Normalize: a perfect Create-heavy distribution scores ~20, a beginner one ~8-12.
  // Scale to 0-100 using min 0, max ~20 as anchors, then clamp.
  const normalized = Math.round(Math.min(100, Math.max(0, weighted * 4)));
  return normalized;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Aggregate content from all section-related content models into a single string.
 * The Section model has NO `content` field — content lives in Article, Note,
 * CodeExplanation, Blog, and AIGeneratedContent relations.
 */
function aggregateSectionContent(section: {
  description: string | null;
  articles: Array<{ title: string; content: string }>;
  notes: Array<{ title: string; content: string }>;
  codeExplanations: Array<{ title: string; code: string; explanation: string | null; language: string }>;
  blogs: Array<{ title: string; description: string | null }>;
  AIGeneratedContent: Array<{ title: string; content: string }>;
}): string | null {
  const parts: string[] = [];

  for (const article of section.articles) {
    if (article.content) {
      parts.push(`[Article: ${article.title}]\n${article.content}`);
    }
  }

  for (const note of section.notes) {
    if (note.content) {
      parts.push(`[Note: ${note.title}]\n${note.content}`);
    }
  }

  for (const code of section.codeExplanations) {
    const codeBlock = `[Code (${code.language}): ${code.title}]\n\`\`\`${code.language}\n${code.code}\n\`\`\`${code.explanation ? `\nExplanation: ${code.explanation}` : ''}`;
    parts.push(codeBlock);
  }

  for (const ai of section.AIGeneratedContent) {
    if (ai.content) {
      parts.push(`[Content: ${ai.title}]\n${ai.content}`);
    }
  }

  for (const blog of section.blogs) {
    if (blog.description) {
      parts.push(`[Blog Reference: ${blog.title}]\n${blog.description}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * Extract learning objectives from Section model fields.
 * Checks both the `learningObjectives` string and `learningObjectiveItems` relation.
 */
function extractObjectives(section: {
  learningObjectives: string | null;
  learningObjectiveItems: Array<{ objective: string; bloomsLevel: string; order: number }>;
}): string[] {
  // Structured objectives from LearningObjectiveItem relation (preferred)
  if (section.learningObjectiveItems.length > 0) {
    const sorted = [...section.learningObjectiveItems].sort((a, b) => a.order - b.order);
    return sorted.map((item) => `[${item.bloomsLevel}] ${item.objective}`);
  }

  // Fallback: parse learningObjectives string field
  if (section.learningObjectives) {
    const text = section.learningObjectives.trim();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // Not JSON — split by newlines or semicolons
    }
    return text.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);
  }

  return [];
}

/**
 * Fetch complete course data for analysis, including all content from related models
 */
async function fetchCourseData(
  courseId: string,
  userId: string
): Promise<CourseInput | null> {
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      userId, // Only course owner can run depth analysis
    },
    include: {
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
                      options: true,
                      correctAnswer: true,
                    },
                  },
                },
              },
              // Content lives in these related models, not on Section itself
              articles: {
                select: { title: true, content: true },
              },
              notes: {
                select: { title: true, content: true },
              },
              codeExplanations: {
                select: { title: true, code: true, explanation: true, language: true },
              },
              blogs: {
                select: { title: true, description: true },
              },
              AIGeneratedContent: {
                where: { isApproved: true },
                select: { title: true, content: true },
              },
              learningObjectiveItems: {
                select: { objective: true, bloomsLevel: true, order: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  // Transform to CourseInput format
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    courseGoals: course.courseGoals,
    whatYouWillLearn: course.whatYouWillLearn ?? [],
    prerequisites: course.prerequisites,
    difficulty: course.difficulty,
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      isPublished: chapter.isPublished,
      sections: chapter.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        content: aggregateSectionContent(section),
        position: section.position,
        isPublished: section.isPublished,
        videoUrl: section.videoUrl,
        objectives: extractObjectives(section),
        exams: section.exams.map((exam) => ({
          id: exam.id,
          title: exam.title,
          questions: exam.ExamQuestion.map((q) => ({
            id: q.id,
            question: q.question,
            type: q.questionType,
            bloomsLevel: q.bloomsLevel as
              | 'REMEMBER'
              | 'UNDERSTAND'
              | 'APPLY'
              | 'ANALYZE'
              | 'EVALUATE'
              | 'CREATE'
              | undefined,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        })),
      })),
    })),
  };
}

/**
 * Check if analysis is stale (content changed since last analysis)
 */
async function checkAnalysisStatus(
  courseId: string,
  course: CourseInput
): Promise<{ exists: boolean; isStale: boolean; previousVersion?: number }> {
  const currentHash = generateContentHash(course);

  const latestAnalysis = await db.courseDepthAnalysisV2.findFirst({
    where: { courseId },
    orderBy: { version: 'desc' },
    select: { id: true, version: true, contentHash: true },
  });

  if (!latestAnalysis) {
    return { exists: false, isStale: false };
  }

  return {
    exists: true,
    isStale: latestAnalysis.contentHash !== currentHash,
    previousVersion: latestAnalysis.version,
  };
}

/**
 * Convert AI analysis result to database-compatible format
 */
function convertAIResultToDbFormat(
  aiResult: AIAnalysisResult,
  course: CourseInput,
  courseId: string
): Awaited<ReturnType<ReturnType<typeof createEnhancedAnalyzerV2>['analyze']>> {
  const contentHash = generateContentHash(course);

  // Calculate issue counts
  const issueCount = {
    critical: aiResult.allIssues.filter((i) => i.severity === 'CRITICAL').length,
    high: aiResult.allIssues.filter((i) => i.severity === 'HIGH').length,
    medium: aiResult.allIssues.filter((i) => i.severity === 'MEDIUM').length,
    low: aiResult.allIssues.filter((i) => i.severity === 'LOW').length,
    total: aiResult.allIssues.length,
  };

  // Convert chapter analysis — no artificial floors, use honest scores
  const chapterAnalysis = aiResult.chapters.map((ch, index) => {
    return {
      chapterId: course.chapters[index]?.id || '',
      chapterTitle: ch.chapterTitle,
      position: ch.chapterIndex,
      scores: {
        depth: calculateChapterDepthScore(ch.bloomsDistribution),
        consistency: ch.consistencyScore,
        flow: ch.flowScore,
        quality: ch.qualityScore,
      },
      issueCount: ch.issues.length,
      primaryBloomsLevel: ch.primaryBloomsLevel,
    };
  });

  // Build flow analysis from cross-chapter results
  const flowAnalysis = {
    overallFlowScore: aiResult.crossChapter.flowScore,
    progressionIssues: aiResult.crossChapter.issues
      .filter((i) => i.type === 'FLOW')
      .map((issue) => ({
        fromChapter: {
          id: course.chapters[issue.affectedChapterIndices[0]]?.id || '',
          title: issue.affectedChapterTitles[0] || '',
          position: issue.affectedChapterIndices[0] || 0,
        },
        toChapter: {
          id: course.chapters[issue.affectedChapterIndices[1]]?.id || '',
          title: issue.affectedChapterTitles[1] || '',
          position: issue.affectedChapterIndices[1] || 0,
        },
        issue: issue.title,
        severity: issue.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        suggestion: issue.fix.how,
      })),
    cognitiveJumps: aiResult.crossChapter.progressionIssues
      .filter((pi) => pi.severity === 'HIGH' || pi.severity === 'CRITICAL')
      .map((pi) => ({
        fromChapter: {
          id: course.chapters[pi.fromChapter]?.id || '',
          title: course.chapters[pi.fromChapter]?.title || '',
          position: pi.fromChapter,
        },
        toChapter: {
          id: course.chapters[pi.toChapter]?.id || '',
          title: course.chapters[pi.toChapter]?.title || '',
          position: pi.toChapter,
        },
        issue: pi.issue,
        severity: pi.severity,
      })),
    prerequisiteMap: aiResult.chapters.flatMap((ch, idx) =>
      (ch.prerequisiteConcepts || []).map((pc) => ({
        concept: pc.concept,
        requiredBy: {
          chapterId: course.chapters[idx]?.id || '',
          chapterTitle: ch.chapterTitle,
        },
        introducedIn: pc.introducedIn,
        status: pc.status,
      }))
    ),
  };

  // Build outcomes analysis from overview
  const outcomesAnalysis = {
    learningOutcomes: aiResult.overview.strengths.map((s) => ({
      category: 'skill' as const,
      title: s,
      description: s,
      bloomsLevel: 'UNDERSTAND' as const,
      confidence: 0.8,
    })),
    skillsGained: [],
    knowledgeGaps: aiResult.overview.missingTopics.map((topic) => ({
      gap: topic,
      impact: 'May leave learners unprepared',
      suggestion: `Add content covering ${topic}`,
    })),
    careerAlignment: [],
  };

  // Build content analysis
  const contentAnalysis = {
    qualityScore: aiResult.scores.quality,
    duplicates: [],
    thinSections: [],
    contentGaps: aiResult.overview.missingTopics.map((topic) => ({
      topic,
      expectedIn: 'Course content',
      description: `Topic "${topic}" mentioned in goals but not covered`,
      suggestedContent: '',
    })),
  };

  // Use NEEDS_REANALYSIS if course has critical issues, else COMPLETED
  const hasCriticalFailures = aiResult.allIssues.filter((i) => i.severity === 'CRITICAL').length > 0;
  const analysisStatus = hasCriticalFailures ? 'NEEDS_REANALYSIS' : 'COMPLETED';

  return {
    courseId,
    version: 1, // Will be set by saveAnalysisResults
    status: analysisStatus,
    analysisMethod: 'ai',
    contentHash,
    overallScore: aiResult.scores.overall,
    depthScore: aiResult.scores.depth,
    consistencyScore: aiResult.scores.consistency,
    flowScore: aiResult.scores.flow,
    qualityScore: aiResult.scores.quality,
    bloomsDistribution: aiResult.bloomsDistribution,
    bloomsBalance: aiResult.bloomsBalance,
    structureAnalysis: {
      totalChapters: course.chapters.length,
      totalSections: course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      totalAssessments: course.chapters.reduce(
        (sum, ch) =>
          sum + ch.sections.reduce((s, sec) => s + sec.exams.length, 0),
        0
      ),
      emptyChapters: [],
      emptySections: [],
      unpublishedChapters: [],
      unpublishedSections: [],
      averageSectionsPerChapter:
        course.chapters.length > 0
          ? course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0) /
            course.chapters.length
          : 0,
      contentDepth: {
        hasObjectives: course.chapters.reduce(
          (sum, ch) =>
            sum +
            ch.sections.filter((s) => s.objectives && s.objectives.length > 0)
              .length,
          0
        ),
        hasContent: course.chapters.reduce(
          (sum, ch) =>
            sum + ch.sections.filter((s) => s.content && s.content.length > 0).length,
          0
        ),
        hasVideo: course.chapters.reduce(
          (sum, ch) => sum + ch.sections.filter((s) => s.videoUrl).length,
          0
        ),
        hasAssessment: course.chapters.reduce(
          (sum, ch) =>
            sum + ch.sections.filter((s) => s.exams && s.exams.length > 0).length,
          0
        ),
      },
    },
    bloomsAnalysis: {
      courseDistribution: aiResult.bloomsDistribution,
      courseBalance: aiResult.bloomsBalance,
      chapters: aiResult.chapters.map((ch, idx) => ({
        chapterId: course.chapters[idx]?.id || '',
        chapterTitle: ch.chapterTitle,
        position: ch.chapterIndex,
        primaryLevel: ch.primaryBloomsLevel,
        distribution: ch.bloomsDistribution,
        sectionResults: (ch.sectionBloomsLevels || []).map((sl) => ({
          sectionId: course.chapters[idx]?.sections[sl.sectionIndex]?.id || '',
          sectionTitle: sl.sectionTitle,
          primaryLevel: sl.primaryLevel,
          reasoning: sl.reasoning,
        })),
        balance: aiResult.bloomsBalance,
      })),
      cognitiveDepthScore: aiResult.scores.depth,
    },
    flowAnalysis,
    consistencyAnalysis: {
      overallConsistencyScore: aiResult.scores.consistency,
      chapterGoalAlignment: (aiResult.crossChapter.goalToChapterMapping || []).map((g) => ({
        goal: g.goal,
        coveredByChapters: g.coveredByChapters.map((ci) => ({
          chapterId: course.chapters[ci]?.id || '',
          chapterTitle: course.chapters[ci]?.title || '',
        })),
        coverageLevel: g.coverageLevel,
      })),
      sectionConsistency: aiResult.chapters.map((ch, idx) => ({
        chapterId: course.chapters[idx]?.id || '',
        chapterTitle: ch.chapterTitle,
        consistencyScore: ch.consistencyScore,
        flowScore: ch.flowScore,
      })),
      crossChapterConsistency: {
        styleConsistencyScore: aiResult.crossChapter.styleConsistency,
        depthConsistencyScore: aiResult.scores.consistency,
        lengthConsistencyScore: aiResult.crossChapter.styleConsistency,
        issues: aiResult.crossChapter.issues
          .filter((i) => i.type === 'CONSISTENCY')
          .map((i) => i.description),
      },
    },
    contentAnalysis,
    outcomesAnalysis,
    issues: aiResult.allIssues,
    issueCount,
    chapterAnalysis,
    analyzedAt: new Date(),
  };
}

/**
 * Save analysis results to database using a transaction
 * to prevent orphaned records when issue creation fails.
 */
async function saveAnalysisResults(
  result: Awaited<ReturnType<ReturnType<typeof createEnhancedAnalyzerV2>['analyze']>>,
  previousVersion?: number
): Promise<string> {
  // Look up previous version ID outside the transaction
  let previousVersionId: string | null = null;
  if (previousVersion) {
    const prev = await db.courseDepthAnalysisV2.findFirst({
      where: {
        courseId: result.courseId,
        version: previousVersion,
      },
      select: { id: true },
    });
    previousVersionId = prev?.id ?? null;
  }

  // Use a transaction so analysis + issues are saved atomically
  const analysisId = await db.$transaction(async (tx) => {
    const analysis = await tx.courseDepthAnalysisV2.create({
      data: {
        courseId: result.courseId,
        version: (previousVersion ?? 0) + 1,
        overallScore: result.overallScore,
        depthScore: result.depthScore,
        consistencyScore: result.consistencyScore,
        flowScore: result.flowScore,
        qualityScore: result.qualityScore,
        bloomsDistribution: result.bloomsDistribution,
        bloomsBalance: result.bloomsBalance,
        chapterAnalysis: result.chapterAnalysis,
        issueCountCritical: result.issueCount.critical,
        issueCountHigh: result.issueCount.high,
        issueCountMedium: result.issueCount.medium,
        issueCountLow: result.issueCount.low,
        totalIssues: result.issueCount.total,
        learningOutcomes: result.outcomesAnalysis.learningOutcomes,
        skillsGained: result.outcomesAnalysis.skillsGained,
        knowledgeGaps: result.outcomesAnalysis.knowledgeGaps,
        duplicateContent: result.contentAnalysis.duplicates,
        thinSections: result.contentAnalysis.thinSections,
        contentFlowAnalysis: result.flowAnalysis,
        contentHash: result.contentHash,
        status: (result.status === 'NEEDS_REANALYSIS' ? 'NEEDS_REANALYSIS' : 'COMPLETED') as 'COMPLETED' | 'NEEDS_REANALYSIS',
        analysisMethod: result.analysisMethod,
        previousVersionId,
      },
    });

    // Save individual issues with sanitized types
    logger.info('[DepthAnalysisV2] Saving issues', {
      issueCount: result.issues.length,
      analysisId: analysis.id,
    });

    if (result.issues.length > 0) {
      const createResult = await tx.depthAnalysisIssue.createMany({
        data: result.issues.map((issue) => ({
          id: issue.id,
          analysisId: analysis.id,
          type: sanitizeIssueType(issue.type) as IssueType,
          severity: sanitizeIssueSeverity(issue.severity) as typeof issue.severity,
          status: issue.status,
          chapterId: issue.location.chapterId,
          chapterTitle: issue.location.chapterTitle,
          chapterPosition: issue.location.chapterPosition,
          sectionId: issue.location.sectionId,
          sectionTitle: issue.location.sectionTitle,
          sectionPosition: issue.location.sectionPosition,
          contentType: issue.location.contentType,
          title: issue.title,
          description: issue.description,
          evidence: issue.evidence,
          impactArea: issue.impact.area,
          impactDescription: issue.impact.description,
          fixAction: issue.fix.action,
          fixWhat: issue.fix.what,
          fixWhy: issue.fix.why,
          fixHow: issue.fix.how,
          suggestedContent: issue.fix.suggestedContent,
          fixExamples: issue.fix.examples,
          relatedIssueIds: issue.relatedIssueIds ?? [],
        })),
      });
      logger.info('[DepthAnalysisV2] Issues saved successfully', {
        count: createResult.count,
      });
    }

    return analysis.id;
  });

  return analysisId;
}

// ============================================================================
// POST - Start Analysis with SSE Streaming
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
    const validated = AnalyzeSchema.parse(body);

    // Fetch course data
    const course = await fetchCourseData(validated.courseId, session.user.id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or you do not have access' } },
        { status: 404 }
      );
    }

    // Check if analysis exists and if it's stale
    const status = await checkAnalysisStatus(validated.courseId, course);

    // Skip if not stale and not forcing reanalyze
    if (status.exists && !status.isStale && !validated.forceReanalyze) {
      const existingAnalysis = await db.courseDepthAnalysisV2.findFirst({
        where: { courseId: validated.courseId },
        orderBy: { version: 'desc' },
        include: {
          issues: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          analysisId: existingAnalysis?.id,
          status: 'ALREADY_EXISTS',
          message: 'Analysis already exists and content has not changed.',
          version: existingAnalysis?.version,
        },
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    // Clean up orphaned analysis records: analyses that saved with FAILED status
    // or analyses with 0 issues AND 0 overall score (clear failures)
    const orphanCleanup = await db.courseDepthAnalysisV2.deleteMany({
      where: {
        courseId: validated.courseId,
        OR: [
          { status: 'FAILED' },
          { totalIssues: 0, overallScore: 0 },
        ],
      },
    });
    if (orphanCleanup.count > 0) {
      logger.info('[DepthAnalysisV2] Cleaned up orphaned analyses', {
        count: orphanCleanup.count,
        courseId: validated.courseId,
      });
    }

    // Check for streaming support
    const acceptHeader = req.headers.get('accept') || '';
    const useSSE = acceptHeader.includes('text/event-stream');

    // Determine if we should use AI analysis
    const useAI = validated.aiEnabled;

    // Get analysis mode info for logging
    const analysisInfo = determineAnalysisMode(course);
    logger.info('[DepthAnalysisV2] Starting analysis', {
      courseId: validated.courseId,
      useAI,
      analysisMode: analysisInfo.mode,
      estimatedTime: analysisInfo.estimatedTime,
      totalTokens: analysisInfo.totalTokens,
    });

    if (useSSE) {
      // Return SSE stream for progress updates
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            let result: Awaited<ReturnType<ReturnType<typeof createEnhancedAnalyzerV2>['analyze']>>;

            if (useAI) {
              // Use AI-powered analysis
              sendEvent('analysis_start', {
                mode: 'ai',
                analysisMode: analysisInfo.mode,
                estimatedTime: analysisInfo.estimatedTime,
                courseTitle: course.title,
                chaptersCount: course.chapters.length,
              });

              const aiResult = await runAIAnalysis({
                courseId: validated.courseId,
                course,
                userId: session.user.id,
                onProgress: (progress: AIAnalysisProgress) => {
                  // Skip analysis_start from AI analyzer - we already sent one with mode: 'ai'
                  if (progress.type === 'analysis_start') return;
                  // Forward other AI progress events
                  sendEvent(progress.type, progress.data);
                },
              });

              // Convert AI result to database format
              result = convertAIResultToDbFormat(aiResult, course, validated.courseId);
            } else {
              // Use rule-based analysis
              sendEvent('analysis_start', {
                mode: 'rule-based',
                courseTitle: course.title,
                chaptersCount: course.chapters.length,
              });

              const analyzer = createEnhancedAnalyzerV2({
                courseId: validated.courseId,
                course,
                aiEnabled: false,
                previousAnalysisId: status.exists
                  ? (
                      await db.courseDepthAnalysisV2.findFirst({
                        where: {
                          courseId: validated.courseId,
                          version: status.previousVersion,
                        },
                        select: { id: true },
                      })
                    )?.id
                  : undefined,
                onProgress: (progress: AnalysisProgress) => {
                  sendEvent('progress', progress);
                },
              });

              result = await analyzer.analyze();
            }

            // Save results
            const analysisId = await saveAnalysisResults(result, status.previousVersion);

            // Send completion event
            sendEvent('complete', {
              analysisId,
              overallScore: result.overallScore,
              issueCount: result.issueCount,
              version: (status.previousVersion ?? 0) + 1,
              analysisMethod: result.analysisMethod,
            });

            controller.close();
          } catch (error) {
            logger.error('[DepthAnalysisV2] Analysis failed', { error });

            if (error instanceof AIAccessDeniedError) {
              sendEvent('error', {
                code: 'SUBSCRIPTION_REQUIRED',
                message: 'AI-powered analysis requires a Professional subscription or higher.',
                upgradeRequired: true,
                suggestedTier: error.enforcement.suggestedTier,
              });
            } else {
              sendEvent('error', {
                message: error instanceof Error ? error.message : 'Analysis failed',
              });
            }
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming mode - run analysis synchronously
      let result: Awaited<ReturnType<ReturnType<typeof createEnhancedAnalyzerV2>['analyze']>>;

      if (useAI) {
        // Use AI-powered analysis
        const aiResult = await runAIAnalysis({
          courseId: validated.courseId,
          course,
          userId: session.user.id,
        });

        // Convert AI result to database format
        result = convertAIResultToDbFormat(aiResult, course, validated.courseId);
      } else {
        // Use rule-based analysis
        const analyzer = createEnhancedAnalyzerV2({
          courseId: validated.courseId,
          course,
          aiEnabled: false,
          previousAnalysisId: status.exists
            ? (
                await db.courseDepthAnalysisV2.findFirst({
                  where: {
                    courseId: validated.courseId,
                    version: status.previousVersion,
                  },
                  select: { id: true },
                })
              )?.id
            : undefined,
        });

        result = await analyzer.analyze();
      }

      const analysisId = await saveAnalysisResults(result, status.previousVersion);

      logger.info('[DepthAnalysisV2] Analysis completed', {
        courseId: validated.courseId,
        analysisId,
        overallScore: result.overallScore,
        issueCount: result.issueCount.total,
        analysisMethod: result.analysisMethod,
      });

      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          overallScore: result.overallScore,
          depthScore: result.depthScore,
          consistencyScore: result.consistencyScore,
          flowScore: result.flowScore,
          qualityScore: result.qualityScore,
          bloomsDistribution: result.bloomsDistribution,
          bloomsBalance: result.bloomsBalance,
          issueCount: result.issueCount,
          version: (status.previousVersion ?? 0) + 1,
          analysisMethod: result.analysisMethod,
        },
        metadata: { timestamp: new Date().toISOString() },
      });
    }
  } catch (error) {
    logger.error('[DepthAnalysisV2] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors } },
        { status: 400 }
      );
    }

    if (error instanceof AIAccessDeniedError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'AI-powered analysis requires a Professional subscription or higher.',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Analysis failed' } },
      { status: 500 }
    );
  }
}
