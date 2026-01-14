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
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import {
  createMicrolearningEngine,
  type MicrolearningEngineConfig,
  type MicroModuleType,
  type DeviceType,
  type MicroModuleStatus,
} from '@sam-ai/educational';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let microlearningEngine: ReturnType<typeof createMicrolearningEngine> | null = null;

async function getMicrolearningEngine() {
  if (!microlearningEngine) {
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      name: 'microlearning-fallback',
      version: '1.0.0',
      chat: async () => ({
        content: '',
        model: 'fallback',
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop' as const,
      }),
      isConfigured: () => false,
      getModel: () => 'fallback',
    };

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

    microlearningEngine = createMicrolearningEngine(config);
  }
  return microlearningEngine;
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

const ModuleStatusEnum = z.enum([
  'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REVIEW_NEEDED'
]);

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

// Schema for generateModules method
const GenerateModulesSchema = z.object({
  content: z.string().min(10),
  contentType: ContentTypeEnum,
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

// Schema for createSession method
const CreateSessionSchema = z.object({
  courseId: z.string().optional(),
  maxDuration: z.number().int().min(1).max(120).optional(),
  moduleTypes: z.array(ModuleTypeEnum).optional(),
  includeReview: z.boolean().optional().default(false),
  deviceType: DeviceTypeEnum.optional(),
  focusConcepts: z.array(z.string()).optional(),
});

// Schema for updateProgress method
const UpdateProgressSchema = z.object({
  moduleId: z.string().min(1),
  status: ModuleStatusEnum,
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
    const engine = await getMicrolearningEngine();

    // Get user analytics
    const timeRange = searchParams.get('timeRange') ?? 'WEEK';
    const courseId = searchParams.get('courseId') ?? undefined;
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

    // Calculate date range based on timeRange
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
  } catch (error) {
    logger.error('[Microlearning] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve analytics' } },
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

    const engine = await getMicrolearningEngine();
    let result: unknown;

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

      case 'generate-modules': {
        const validated = GenerateModulesSchema.parse(data);
        result = await engine.generateModules({
          content: validated.content,
          contentType: validated.contentType,
          targetModules: validated.targetModules,
          moduleTypes: validated.moduleTypes as MicroModuleType[] | undefined,
          includePractice: validated.includePractice,
          includeSummaries: validated.includeSummaries,
          sourceContext: validated.sourceContext,
        });
        logger.info('[Microlearning] Modules generated', {
          userId: session.user.id,
          contentType: validated.contentType,
          targetModules: validated.targetModules,
        });
        break;
      }

      case 'create-session': {
        const validated = CreateSessionSchema.parse(data);
        result = await engine.createSession({
          userId: session.user.id,
          courseId: validated.courseId,
          maxDuration: validated.maxDuration,
          moduleTypes: validated.moduleTypes as MicroModuleType[] | undefined,
          includeReview: validated.includeReview,
          deviceType: validated.deviceType as DeviceType | undefined,
          focusConcepts: validated.focusConcepts,
        });
        logger.info('[Microlearning] Session created', {
          userId: session.user.id,
          courseId: validated.courseId,
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

    return NextResponse.json({
      success: true,
      action,
      data: result,
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
