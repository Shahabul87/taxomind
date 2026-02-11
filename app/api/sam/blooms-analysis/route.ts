import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';
import type {
  UnifiedCourseInput,
  UnifiedCourseOptions,
  UnifiedCourseResult,
  ChapterAnalysis,
} from '@sam-ai/educational';
import {
  createCognitiveLoadAnalyzer,
  type CognitiveLoadResult,
} from '@sam-ai/pedagogy';
import { getUserScopedSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { normalizeToUppercaseSafe } from '@/lib/sam/utils/blooms-normalizer';
import { BloomsLevel } from '@prisma/client';
import crypto from 'crypto';

// Create Cognitive Load Analyzer singleton (Phase 3: Cognitive Load Integration)
let cognitiveLoadAnalyzer: ReturnType<typeof createCognitiveLoadAnalyzer> | null = null;

function getCognitiveLoadAnalyzer() {
  if (!cognitiveLoadAnalyzer) {
    cognitiveLoadAnalyzer = createCognitiveLoadAnalyzer();
  }
  return cognitiveLoadAnalyzer;
}

// Create user-scoped Blooms engine (Priority 1: Unified Bloom's Engine)
async function createBloomsEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createUnifiedBloomsEngine({
    samConfig,
    database: getDatabaseAdapter(),
    defaultMode: 'standard', // Keyword + AI validation when confidence low
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600, // 1 hour cache
  });
}

export async function POST(request: NextRequest) {
  // Rate limit AI analysis requests
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Subscription gate: analysis with enrollment bypass for enrolled users
    const gateResult = await withSubscriptionGate(user.id, { category: 'analysis', courseId: body.courseId });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const {
      courseId,
      depth = 'detailed',
      includeRecommendations = true,
      // Phase 1: Sub-level granularity options
      includeSubLevel = false,
      // Phase 3: Cognitive load analysis options
      includeCognitiveLoad = false,
    } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch full course data for portable engine
    // Enriched query includes learning objectives, outcomes, and assessment questions
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        courseGoals: true, // Course-level learning goals
        userId: true,
        organizationId: true,
        chapters: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
            learningOutcomes: true, // Chapter-level learning outcomes
            courseGoals: true, // Chapter-level goals
            sections: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                learningObjectives: true, // Section-level objectives (string)
                learningObjectiveItems: {
                  select: {
                    id: true,
                    objective: true,
                  },
                },
                exams: {
                  select: {
                    id: true,
                    enhancedQuestions: {
                      select: {
                        id: true,
                        question: true,
                        bloomsLevel: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = course.userId === user.id ||
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build UnifiedCourseInput for unified Blooms engine
    // Enriched with learning objectives, outcomes, and assessment question data
    const courseData: UnifiedCourseInput = {
      id: course.id,
      title: course.title || 'Untitled Course',
      description: course.description || undefined,
      // Course-level learning goals parsed into objectives array
      objectives: parseLearningGoals(course.courseGoals),
      chapters: course.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
        // Chapter-level learning data
        learningOutcomes: chapter.learningOutcomes || undefined,
        courseGoals: chapter.courseGoals || undefined,
        sections: chapter.sections.map((section) => ({
          id: section.id,
          title: section.title,
          content: section.description || undefined,
          description: section.description || undefined,
          // Combine string-based objectives with item-based objectives
          learningObjectives: combineLearningObjectives(
            section.learningObjectives,
            section.learningObjectiveItems
          ),
          // Include assessment questions with their Bloom's levels
          questions: extractQuestionsFromExams(section.exams),
        })),
      })),
    };

    // Configure analysis options
    const options: UnifiedCourseOptions = {
      depth: depth as 'basic' | 'detailed' | 'comprehensive',
      includeRecommendations,
      mode: depth === 'comprehensive' ? 'comprehensive' : 'standard',
      // Phase 1: Sub-level granularity
      includeSubLevel,
    };

    // Perform Bloom's Taxonomy analysis using unified engine (with timeout)
    const engine = await createBloomsEngineForUser(user.id);
    const analysis = await withRetryableTimeout(
      () => engine.analyzeCourse(courseData, options),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'analyzeCourse'
    );

    // Generate content hash for change detection
    const contentHash = generateContentHash(courseData);

    // Persist the analysis to database
    const persistedAnalysis = await persistBloomsAnalysis(
      courseId,
      analysis,
      contentHash
    );

    // Persist section-level mappings
    await persistSectionMappings(analysis.chapters);

    // Persist chapter-level analysis (Task 6)
    await persistChapterAnalysis(analysis.chapters);

    // Phase 3: Cognitive Load Analysis
    let cognitiveLoad: CognitiveLoadResult | null = null;
    if (includeCognitiveLoad) {
      try {
        const loadAnalyzer = getCognitiveLoadAnalyzer();
        // Build course content text for cognitive load analysis
        const courseContentText = buildCourseContentForCognitiveLoad(courseData);
        cognitiveLoad = loadAnalyzer.analyze(courseContentText, {
          bloomsLevel: analysis.chapters[0]?.primaryLevel ?? 'REMEMBER',
        });
      } catch (error) {
        logger.warn('Cognitive load analysis failed:', error);
        // Non-critical - continue without cognitive load data
      }
    }

    // Record the analysis as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'BLOOMS_ANALYSIS', {
      depth,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      balance: analysis.courseLevel.balance,
      persisted: true,
      analysisId: persistedAnalysis.id,
      includeSubLevel,
      includeCognitiveLoad,
    });

    // Build enhanced response with sub-level and cognitive load data
    return NextResponse.json({
      success: true,
      data: {
        courseLevel: analysis.courseLevel,
        chapters: analysis.chapters,
        learningPathway: analysis.learningPathway,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt,
        // Phase 3: Cognitive load data (if requested)
        ...(cognitiveLoad && {
          cognitiveLoad: {
            totalLoad: cognitiveLoad.totalLoad,
            loadCategory: cognitiveLoad.loadCategory,
            intrinsicLoad: cognitiveLoad.measurements.intrinsic.score,
            extraneousLoad: cognitiveLoad.measurements.extraneous.score,
            germaneLoad: cognitiveLoad.measurements.germane.score,
            balance: cognitiveLoad.balance,
            bloomsCompatibility: cognitiveLoad.bloomsCompatibility,
            recommendations: cognitiveLoad.recommendations,
          },
        }),
      },
      metadata: {
        courseId,
        courseTitle: course.title,
        analysisDepth: depth,
        timestamp: new Date().toISOString(),
        userId: user.id,
        engine: '@sam-ai/educational (unified)',
        processingTimeMs: analysis.metadata.processingTimeMs,
        fromCache: analysis.metadata.fromCache,
        persisted: true,
        analysisId: persistedAnalysis.id,
        contentHash,
        // Phase 1 & 3: Enhanced options metadata
        includeSubLevel,
        includeCognitiveLoad,
        cognitiveLoadIncluded: !!cognitiveLoad,
      },
    });

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    if (error instanceof OperationTimeoutError) {
      logger.error('Blooms analysis timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Analysis timed out. Please try again or use a smaller course.' },
        { status: 504 }
      );
    }
    logger.error('Blooms analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform Blooms analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, organizationId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get stored analysis
    const analysis = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) {
      return NextResponse.json({
        success: false,
        error: 'No analysis found for this course',
        hint: 'Run a POST request to /api/sam/blooms-analysis with { courseId } to generate and persist an analysis',
      }, { status: 404 });
    }

    // Get section mappings
    const sectionMappings = await db.sectionBloomsMapping.findMany({
      where: {
        section: {
          chapter: {
            courseId,
          },
        },
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapterId: true,
          },
        },
      },
    });

    // Get chapter-level analysis (Task 6)
    const chapterAnalyses = await db.chapterBloomsAnalysis.findMany({
      where: {
        chapter: {
          courseId,
        },
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            position: true,
            targetBloomsLevel: true,
            actualBloomsLevel: true,
          },
        },
      },
      orderBy: {
        chapter: {
          position: 'asc',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        bloomsDistribution: analysis.bloomsDistribution,
        cognitiveDepth: analysis.cognitiveDepth,
        learningPathway: analysis.learningPathway,
        skillsMatrix: analysis.skillsMatrix,
        gapAnalysis: analysis.gapAnalysis,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt,
        // Chapter-level analysis (Task 6)
        chapterAnalyses: chapterAnalyses.map(chapterAnalysis => ({
          chapterId: chapterAnalysis.chapterId,
          chapterTitle: chapterAnalysis.chapter.title,
          position: chapterAnalysis.chapter.position,
          targetBloomsLevel: chapterAnalysis.chapter.targetBloomsLevel,
          actualBloomsLevel: chapterAnalysis.chapter.actualBloomsLevel,
          primaryLevel: chapterAnalysis.primaryLevel,
          distribution: chapterAnalysis.distribution,
          confidence: chapterAnalysis.confidence,
          sectionCount: chapterAnalysis.sectionCount,
          recommendations: chapterAnalysis.recommendations,
          analyzedAt: chapterAnalysis.analyzedAt,
        })),
        sectionMappings: sectionMappings.map(mapping => ({
          sectionId: mapping.sectionId,
          sectionTitle: mapping.section.title,
          chapterId: mapping.section.chapterId,
          bloomsLevel: mapping.bloomsLevel,
          primaryLevel: mapping.primaryLevel,
          activities: mapping.activities,
          learningObjectives: mapping.learningObjectives,
        })),
      },
    });

  } catch (error) {
    logger.error('Get Blooms analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Blooms analysis' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });
  
  return !!membership;
}

async function recordSAMInteraction(
  userId: string,
  courseId: string,
  interactionType: string,
  result: Record<string, unknown>
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATE', // Using existing enum value
        context: { type: interactionType, result },
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
  }
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Generate a content hash for change detection
 * Used to determine if course content has changed since last analysis
 */
function generateContentHash(courseData: UnifiedCourseInput): string {
  const contentString = JSON.stringify({
    title: courseData.title,
    description: courseData.description,
    chapters: courseData.chapters.map((ch) => ({
      title: ch.title,
      sections: ch.sections.map((s) => ({
        title: s.title,
        content: s.content,
        description: s.description,
        learningObjectives: s.learningObjectives,
      })),
    })),
  });

  return crypto.createHash('sha256').update(contentString).digest('hex').slice(0, 16);
}

/**
 * Persist course-level Bloom's analysis to database
 */
async function persistBloomsAnalysis(
  courseId: string,
  analysis: UnifiedCourseResult,
  contentHash: string
): Promise<{ id: string }> {
  try {
    // Build skills matrix from chapter analysis
    const skillsMatrix = buildSkillsMatrix(analysis.chapters);

    // Build gap analysis from recommendations
    const gapAnalysis = buildGapAnalysis(analysis);

    // Upsert the course analysis
    const result = await db.courseBloomsAnalysis.upsert({
      where: { courseId },
      create: {
        courseId,
        bloomsDistribution: analysis.courseLevel.distribution,
        cognitiveDepth: analysis.courseLevel.cognitiveDepth,
        learningPathway: analysis.learningPathway ?? {},
        skillsMatrix,
        gapAnalysis,
        recommendations: analysis.recommendations,
        contentHash,
        analyzedAt: new Date(analysis.analyzedAt),
      },
      update: {
        bloomsDistribution: analysis.courseLevel.distribution,
        cognitiveDepth: analysis.courseLevel.cognitiveDepth,
        learningPathway: analysis.learningPathway ?? {},
        skillsMatrix,
        gapAnalysis,
        recommendations: analysis.recommendations,
        contentHash,
        analyzedAt: new Date(analysis.analyzedAt),
      },
      select: { id: true },
    });

    logger.info(`Persisted Bloom's analysis for course ${courseId}`, {
      analysisId: result.id,
      contentHash,
    });

    return result;
  } catch (error) {
    logger.error(`Failed to persist Bloom's analysis for course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Build skills matrix from chapter analysis
 * Aggregates Bloom's distribution by chapter
 */
function buildSkillsMatrix(chapters: ChapterAnalysis[]): Record<string, unknown> {
  return {
    byChapter: chapters.map((ch) => ({
      chapterId: ch.chapterId,
      chapterTitle: ch.chapterTitle,
      distribution: ch.distribution,
      primaryLevel: ch.primaryLevel,
      cognitiveDepth: ch.cognitiveDepth,
      sectionCount: ch.sections.length,
    })),
    summary: {
      totalChapters: chapters.length,
      totalSections: chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      averageCognitiveDepth:
        chapters.length > 0
          ? chapters.reduce((sum, ch) => sum + ch.cognitiveDepth, 0) / chapters.length
          : 0,
    },
  };
}

/**
 * Build gap analysis from course analysis
 */
function buildGapAnalysis(analysis: UnifiedCourseResult): Record<string, unknown> {
  // Identify underrepresented levels (<10%)
  const distribution = analysis.courseLevel.distribution;
  const gaps: string[] = [];
  const lowCoverage: Array<{ level: string; percentage: number }> = [];

  for (const [level, percentage] of Object.entries(distribution)) {
    if (typeof percentage === 'number' && percentage < 10) {
      gaps.push(level);
      lowCoverage.push({ level, percentage });
    }
  }

  // Extract gap-related recommendations
  const gapRecommendations = analysis.recommendations.filter(
    (rec) => rec.priority === 'high' || gaps.includes(rec.targetLevel)
  );

  return {
    identifiedGaps: gaps,
    lowCoverage,
    balance: analysis.courseLevel.balance,
    recommendations: gapRecommendations.map((rec) => ({
      targetLevel: rec.targetLevel,
      priority: rec.priority,
      description: rec.description,
      expectedImpact: rec.expectedImpact,
    })),
    analyzedAt: analysis.analyzedAt,
  };
}

/**
 * Persist section-level Bloom's mappings to database
 */
async function persistSectionMappings(chapters: ChapterAnalysis[]): Promise<void> {
  try {
    // Collect all section mappings
    const sectionMappings: Array<{
      sectionId: string;
      bloomsLevel: BloomsLevel;
      primaryLevel: BloomsLevel;
      confidence: number;
      learningObjectives: string[];
    }> = [];

    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.id) {
          const normalizedLevel = normalizeToUppercaseSafe(section.level) as BloomsLevel;
          sectionMappings.push({
            sectionId: section.id,
            bloomsLevel: normalizedLevel,
            primaryLevel: normalizedLevel,
            confidence: section.confidence,
            learningObjectives: [],
          });
        }
      }
    }

    // Batch upsert section mappings
    // Using a transaction for atomicity
    await db.$transaction(
      sectionMappings.map((mapping) =>
        db.sectionBloomsMapping.upsert({
          where: { sectionId: mapping.sectionId },
          create: {
            sectionId: mapping.sectionId,
            bloomsLevel: mapping.bloomsLevel,
            primaryLevel: mapping.primaryLevel,
            secondaryLevels: [],
            activities: [],
            assessments: [],
            learningObjectives: mapping.learningObjectives,
          },
          update: {
            bloomsLevel: mapping.bloomsLevel,
            primaryLevel: mapping.primaryLevel,
            // Don't overwrite existing secondary levels, activities, etc.
          },
        })
      )
    );

    logger.info(`Persisted ${sectionMappings.length} section Bloom's mappings`);
  } catch (error) {
    logger.error('Failed to persist section Bloom\'s mappings:', error);
    // Don't throw - section mappings are non-critical
    // The course-level analysis is the primary data
  }
}

/**
 * Persist chapter-level Bloom's analysis to database
 * Task 6: Add bloomsLevel field to Chapter model
 */
async function persistChapterAnalysis(chapters: ChapterAnalysis[]): Promise<void> {
  try {
    // Prepare chapter analysis data
    const chapterAnalysisData = chapters.map((chapter) => {
      const normalizedLevel = normalizeToUppercaseSafe(chapter.primaryLevel) as BloomsLevel;

      return {
        chapterId: chapter.chapterId,
        primaryLevel: normalizedLevel,
        distribution: chapter.distribution,
        cognitiveDepth: chapter.cognitiveDepth,
        sectionCount: chapter.sections.length,
        recommendations: chapter.recommendations ?? [],
      };
    });

    // Batch upsert chapter analysis records and update Chapter.actualBloomsLevel
    await db.$transaction(async (tx) => {
      for (const data of chapterAnalysisData) {
        // Upsert ChapterBloomsAnalysis
        await tx.chapterBloomsAnalysis.upsert({
          where: { chapterId: data.chapterId },
          create: {
            chapterId: data.chapterId,
            primaryLevel: data.primaryLevel,
            distribution: data.distribution,
            confidence: data.cognitiveDepth, // Use cognitive depth as confidence
            sectionCount: data.sectionCount,
            recommendations: data.recommendations,
          },
          update: {
            primaryLevel: data.primaryLevel,
            distribution: data.distribution,
            confidence: data.cognitiveDepth,
            sectionCount: data.sectionCount,
            recommendations: data.recommendations,
            analyzedAt: new Date(),
          },
        });

        // Update Chapter.actualBloomsLevel
        await tx.chapter.update({
          where: { id: data.chapterId },
          data: {
            actualBloomsLevel: data.primaryLevel,
          },
        });
      }
    });

    logger.info(`Persisted ${chapterAnalysisData.length} chapter Bloom's analyses`);
  } catch (error) {
    logger.error('Failed to persist chapter Bloom\'s analyses:', error);
    // Don't throw - chapter analysis is non-critical
  }
}

// ============================================================================
// DATA ENRICHMENT HELPER FUNCTIONS
// ============================================================================

/**
 * Parse course goals string into an array of objectives
 * Handles multiple formats: newline-separated, semicolon-separated, numbered lists
 */
function parseLearningGoals(goalsString: string | null | undefined): string[] {
  if (!goalsString || goalsString.trim() === '') {
    return [];
  }

  // Try to split by common delimiters
  let goals: string[] = [];

  // Check for numbered list format (1. Goal, 2. Goal, etc.)
  if (/^\d+\.\s/.test(goalsString.trim())) {
    goals = goalsString
      .split(/\d+\.\s+/)
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for bullet points (- or •)
  else if (/^[-•]\s/.test(goalsString.trim())) {
    goals = goalsString
      .split(/[-•]\s+/)
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for newlines
  else if (goalsString.includes('\n')) {
    goals = goalsString
      .split('\n')
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for semicolons
  else if (goalsString.includes(';')) {
    goals = goalsString
      .split(';')
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Single goal
  else {
    goals = [goalsString.trim()];
  }

  return goals;
}

/**
 * Combine string-based objectives with structured objective items
 * Removes duplicates and handles null/undefined values
 */
function combineLearningObjectives(
  objectivesString: string | null | undefined,
  objectiveItems: Array<{ id: string; objective: string }> | null | undefined
): string[] {
  const combined = new Set<string>();

  // Add objectives from items
  if (objectiveItems && objectiveItems.length > 0) {
    for (const item of objectiveItems) {
      if (item.objective && item.objective.trim() !== '') {
        combined.add(item.objective.trim());
      }
    }
  }

  // Parse and add string-based objectives
  const parsedObjectives = parseLearningGoals(objectivesString);
  for (const objective of parsedObjectives) {
    combined.add(objective);
  }

  return Array.from(combined);
}

/**
 * Extract questions with Bloom's levels from exam data
 * Normalizes Bloom's levels to uppercase format
 */
function extractQuestionsFromExams(
  exams: Array<{
    id: string;
    enhancedQuestions: Array<{
      id: string;
      question: string;
      bloomsLevel: BloomsLevel | null;
    }>;
  }> | null | undefined
): Array<{ id: string; text: string; bloomsLevel?: BloomsLevel }> {
  if (!exams || exams.length === 0) {
    return [];
  }

  const questions: Array<{ id: string; text: string; bloomsLevel?: BloomsLevel }> = [];

  for (const exam of exams) {
    if (exam.enhancedQuestions && exam.enhancedQuestions.length > 0) {
      for (const q of exam.enhancedQuestions) {
        questions.push({
          id: q.id,
          text: q.question,
          // Bloom's level is already uppercase from Prisma enum
          bloomsLevel: q.bloomsLevel || undefined,
        });
      }
    }
  }

  return questions;
}

/**
 * Build course content text for cognitive load analysis
 * Extracts key content from course structure for analysis
 */
function buildCourseContentForCognitiveLoad(courseData: UnifiedCourseInput): string {
  const contentParts: string[] = [];

  // Add course-level info
  contentParts.push(courseData.title);
  if (courseData.description) {
    contentParts.push(courseData.description);
  }
  if (courseData.objectives && courseData.objectives.length > 0) {
    contentParts.push(...courseData.objectives);
  }

  // Add chapter and section content
  for (const chapter of courseData.chapters) {
    contentParts.push(chapter.title);
    if (chapter.learningOutcomes) {
      contentParts.push(chapter.learningOutcomes);
    }
    if (chapter.courseGoals) {
      contentParts.push(chapter.courseGoals);
    }

    for (const section of chapter.sections) {
      contentParts.push(section.title);
      if (section.content) {
        contentParts.push(section.content);
      }
      if (section.description) {
        contentParts.push(section.description);
      }
      if (section.learningObjectives && section.learningObjectives.length > 0) {
        contentParts.push(...section.learningObjectives);
      }
    }
  }

  return contentParts.join('\n\n');
}