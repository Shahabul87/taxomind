/**
 * Microlearning API Route
 * Handles bite-sized learning modules generation, session management,
 * content chunking, and analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getSAMAdapter } from '@/lib/sam/ai-provider';
import {
  createMicrolearningEngine,
  type MicrolearningEngineConfig,
  type MicroModuleType,
  type DeviceType,
  type MicroModuleStatus,
} from '@sam-ai/educational';
import { enrichFeatureResponse } from '@/lib/sam/pipeline/feature-enrichment';

// ============================================================================
// PER-REQUEST ENGINE FACTORY
// ============================================================================

async function getMicrolearningEngine(userId: string) {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'analysis' });

  const samConfig = createSAMConfig({
    ai: aiAdapter,
    logger: {
      debug: (msg: string, data?: unknown) => logger.debug(msg, data),
      info: (msg: string, data?: unknown) => logger.info(msg, data),
      warn: (msg: string, data?: unknown) => logger.warn(msg, data),
      error: (msg: string, data?: unknown) => logger.error(msg, data),
    },
    features: {
      gamification: true,
      formSync: false,
      autoContext: true,
      emotionDetection: false,
      learningStyleDetection: true,
      streaming: false,
      analytics: true,
    },
  });

  const config: MicrolearningEngineConfig = {
    samConfig,
    targetDurationMinutes: 5,
    maxDurationMinutes: 10,
    enableAIChunking: true,
  };

  return createMicrolearningEngine(config);
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ModuleTypeEnum = z.enum([
  'CONCEPT', 'PRACTICE', 'QUIZ', 'REVIEW', 'SUMMARY',
  'FLASHCARD', 'VIDEO', 'AUDIO', 'INTERACTIVE'
]);

const ContentTypeEnum = z.enum([
  'COURSE', 'CHAPTER', 'SECTION', 'ARTICLE', 'DOCUMENT'
]);

const DeviceTypeEnum = z.enum(['MOBILE', 'TABLET', 'DESKTOP', 'WATCH']);

// Case-insensitive device type: accept 'desktop' → normalize to 'DESKTOP'
const DeviceTypeLenient = z.string().transform((val) => val.toUpperCase()).pipe(DeviceTypeEnum);

const ModuleStatusEnum = z.enum([
  'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REVIEW_NEEDED'
]);

// Case-insensitive module status: accept 'in_progress' → normalize to 'IN_PROGRESS'
const ModuleStatusLenient = z.string().transform((val) => val.toUpperCase()).pipe(ModuleStatusEnum);

// Schema for chunkContent method
const ChunkContentSchema = z.object({
  content: z.string().min(10),
  contentType: ContentTypeEnum,
  targetDuration: z.number().int().min(1).max(30).default(5),
  maxDuration: z.number().int().min(1).max(60).default(10),
  preserveParagraphs: z.boolean().optional().default(true),
  includeContext: z.boolean().optional().default(true),
  sourceContext: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
});

// Schema for generateModules method — relaxed to accept frontend's fields
const GenerateModulesSchema = z.object({
  content: z.string().min(10).optional(),
  contentType: ContentTypeEnum.optional().default('COURSE'),
  topicId: z.string().optional(),
  courseId: z.string().optional(),
  targetDuration: z.number().int().min(1).max(30).optional(),
  deviceType: DeviceTypeLenient.optional(),
  targetModules: z.number().int().min(1).max(20).optional(),
  moduleTypes: z.array(ModuleTypeEnum).optional(),
  includePractice: z.boolean().optional().default(true),
  includeSummaries: z.boolean().optional().default(true),
  sourceContext: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
});

// Schema for createSession method — accepts moduleId as alternative to courseId
const CreateSessionSchema = z.object({
  moduleId: z.string().optional(),
  courseId: z.string().optional(),
  maxDuration: z.number().int().min(1).max(120).optional(),
  moduleTypes: z.array(ModuleTypeEnum).optional(),
  includeReview: z.boolean().optional().default(false),
  deviceType: DeviceTypeLenient.optional(),
  focusConcepts: z.array(z.string()).optional(),
});

// Schema for updateProgress method — accepts case-insensitive status
const UpdateProgressSchema = z.object({
  moduleId: z.string().min(1),
  status: ModuleStatusLenient,
  score: z.number().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  selfAssessment: z.number().int().min(1).max(5).optional(),
});

// Schema for getAnalytics method
const GetAnalyticsSchema = z.object({
  courseId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeRecommendations: z.boolean().optional().default(true),
});

// ============================================================================
// GET - Retrieve analytics
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
    const engine = await getMicrolearningEngine(session.user.id);

    // Support both 'action' (frontend) and 'endpoint' param names, default to analytics
    const action = searchParams.get('action') ?? searchParams.get('endpoint') ?? 'analytics';

    switch (action) {
      case 'list-modules': {
        const topicId = searchParams.get('topicId') ?? undefined;
        const courseId = searchParams.get('courseId') ?? undefined;

        // Use analytics as a proxy to get module/session data for the user
        const analytics = await engine.getAnalytics({
          userId: session.user.id,
          courseId,
          includeRecommendations: false,
        });

        return NextResponse.json({
          success: true,
          data: {
            modules: (analytics as Record<string, unknown>)?.modules ?? [],
            sessions: (analytics as Record<string, unknown>)?.sessions ?? {},
            topicId,
          },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'learner-profile': {
        const analytics = await engine.getAnalytics({
          userId: session.user.id,
          includeRecommendations: false,
        });

        // Build a learner profile from analytics data
        const analyticsData = analytics as Record<string, unknown>;
        const profile = {
          totalXp: analyticsData?.totalXp ?? 0,
          currentStreak: analyticsData?.currentStreak ?? 0,
          longestStreak: analyticsData?.longestStreak ?? 0,
          modulesCompleted: analyticsData?.modulesCompleted ?? 0,
          totalLearningMinutes: analyticsData?.totalLearningMinutes ?? 0,
          preferredDuration: analyticsData?.preferredDuration ?? 5,
          preferredDevice: analyticsData?.preferredDevice ?? 'DESKTOP',
          preferredTypes: analyticsData?.preferredTypes ?? [],
          lastSessionAt: analyticsData?.lastSessionAt ?? null,
        };

        return NextResponse.json({
          success: true,
          data: { profile },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'analytics':
      default: {
        const timeRange = searchParams.get('timeRange') ?? 'WEEK';
        const courseId = searchParams.get('courseId') ?? undefined;
        const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

        const now = new Date();
        let startDate: Date | undefined;
        switch (timeRange) {
          case 'DAY':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'WEEK':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'MONTH':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'ALL':
          default:
            startDate = undefined;
        }

        const analytics = await engine.getAnalytics({
          userId: session.user.id,
          courseId,
          startDate,
          endDate: now,
          includeRecommendations,
        });

        return NextResponse.json({
          success: true,
          data: analytics,
          metadata: { timestamp: new Date().toISOString() },
        });
      }
    }
  } catch (error) {
    logger.error('[Microlearning] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve microlearning data' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Action-based handler for various operations
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
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

    const engine = await getMicrolearningEngine(session.user.id);
    let result: unknown;
    let responseWrapper: ((r: unknown) => unknown) | null = null;

    switch (action) {
      case 'chunk-content': {
        const validated = ChunkContentSchema.parse(data);
        result = await engine.chunkContent({
          content: validated.content,
          contentType: validated.contentType,
          targetDuration: validated.targetDuration,
          maxDuration: validated.maxDuration,
          preserveParagraphs: validated.preserveParagraphs,
          includeContext: validated.includeContext,
          sourceContext: validated.sourceContext,
        });
        logger.info('[Microlearning] Content chunked', {
          userId: session.user.id,
          contentType: validated.contentType,
        });
        break;
      }

      // 'generate-module' alias for frontend compatibility
      case 'generate-module':
      case 'generate-modules': {
        const validated = GenerateModulesSchema.parse(data);
        // Build content from topicId/courseId when content is not provided
        const content = validated.content ?? `Topic: ${validated.topicId ?? 'general'}`;
        result = await engine.generateModules({
          content,
          contentType: validated.contentType,
          targetModules: validated.targetModules,
          moduleTypes: validated.moduleTypes as MicroModuleType[] | undefined,
          includePractice: validated.includePractice,
          includeSummaries: validated.includeSummaries,
          sourceContext: validated.sourceContext ?? {
            courseId: validated.courseId,
          },
        });
        // Frontend expects { module: result } for 'generate-module'
        if (action === 'generate-module') {
          responseWrapper = (r) => ({ module: r });
        }
        logger.info('[Microlearning] Modules generated', {
          userId: session.user.id,
          contentType: validated.contentType,
          topicId: validated.topicId,
        });
        break;
      }

      // 'start-session' alias for frontend compatibility
      case 'start-session':
      case 'create-session': {
        const validated = CreateSessionSchema.parse(data);
        result = await engine.createSession({
          userId: session.user.id,
          courseId: validated.courseId ?? validated.moduleId,
          maxDuration: validated.maxDuration,
          moduleTypes: validated.moduleTypes as MicroModuleType[] | undefined,
          includeReview: validated.includeReview,
          deviceType: validated.deviceType as DeviceType | undefined,
          focusConcepts: validated.focusConcepts,
        });
        // Frontend expects { session: result } for 'start-session'
        if (action === 'start-session') {
          responseWrapper = (r) => ({ session: r });
        }
        logger.info('[Microlearning] Session created', {
          userId: session.user.id,
          courseId: validated.courseId,
          moduleId: validated.moduleId,
        });
        break;
      }

      case 'update-progress': {
        const validated = UpdateProgressSchema.parse(data);
        result = await engine.updateProgress({
          userId: session.user.id,
          moduleId: validated.moduleId,
          status: validated.status as MicroModuleStatus,
          score: validated.score,
          timeSpentSeconds: validated.timeSpentSeconds,
          selfAssessment: validated.selfAssessment as 1 | 2 | 3 | 4 | 5 | undefined,
        });
        logger.info('[Microlearning] Progress updated', {
          userId: session.user.id,
          moduleId: validated.moduleId,
          status: validated.status,
        });
        break;
      }

      case 'get-analytics': {
        const validated = GetAnalyticsSchema.parse(data || {});
        result = await engine.getAnalytics({
          userId: session.user.id,
          courseId: validated.courseId,
          startDate: validated.startDate ? new Date(validated.startDate) : undefined,
          endDate: validated.endDate ? new Date(validated.endDate) : undefined,
          includeRecommendations: validated.includeRecommendations,
        });
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

    // Fire-and-forget enrichment
    void enrichFeatureResponse({
      userId: session.user.id,
      featureName: 'microlearning',
      action,
      requestData: (data as Record<string, unknown>) ?? {},
      responseData: (result as Record<string, unknown>) ?? {},
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      action,
      data: responseWrapper ? responseWrapper(result) : result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[Microlearning] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process microlearning request' } },
      { status: 500 }
    );
  }
}
