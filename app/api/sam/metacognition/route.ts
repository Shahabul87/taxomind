/**
 * Metacognition API Route
 * Handles self-reflection, study habit analysis, cognitive load assessment,
 * learning strategy recommendations, and goal monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import {
  createMetacognitionEngine,
  type MetacognitionEngineConfig,
  type ReflectionType,
  type ReflectionDepth,
  type GoalType,
  type ConfidenceLevel,
  type CognitiveLoadLevel,
  type LearningStrategy,
  type MetacognitiveSkill,
} from '@sam-ai/educational';
import { enrichFeatureResponse } from '@/lib/sam/pipeline/feature-enrichment';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let metacognitionEngine: ReturnType<typeof createMetacognitionEngine> | null = null;

async function getMetacognitionEngine() {
  if (!metacognitionEngine) {
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      name: 'metacognition-fallback',
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
        emotionDetection: true,
        learningStyleDetection: true,
        streaming: false,
        analytics: true,
      },
    });

    const config: MetacognitionEngineConfig = {
      samConfig,
      enableAIReflection: true,
      enableHabitTracking: true,
      defaultReflectionDepth: 'MODERATE',
      calibrationThreshold: 0.7,
    };

    metacognitionEngine = createMetacognitionEngine(config);
  }
  return metacognitionEngine;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ReflectionTypeEnum = z.enum([
  'PRE_LEARNING', 'DURING_LEARNING', 'POST_LEARNING',
  'WEEKLY_REVIEW', 'CHALLENGE_REFLECTION'
]);

const ReflectionDepthEnum = z.enum(['QUICK', 'MODERATE', 'DEEP']);

const GoalTypeEnum = z.enum([
  'MASTERY', 'COMPLETION', 'TIME_BASED', 'HABIT', 'PERFORMANCE'
]);

const ConfidenceLevelEnum = z.enum([
  'VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'
]);

const CognitiveLoadLevelEnum = z.enum([
  'LOW', 'MODERATE', 'HIGH', 'OVERLOADED'
]);

const LearningStrategyEnum = z.enum([
  'SPACED_REPETITION', 'ACTIVE_RECALL', 'ELABORATION', 'INTERLEAVING',
  'CONCRETE_EXAMPLES', 'DUAL_CODING', 'RETRIEVAL_PRACTICE', 'SUMMARIZATION',
  'SELF_EXPLANATION', 'PRACTICE_TESTING'
]);

const GenerateReflectionSchema = z.object({
  type: ReflectionTypeEnum,
  depth: ReflectionDepthEnum.optional().default('MODERATE'),
  context: z.object({
    courseId: z.string().optional(),
    topicId: z.string().optional(),
    sessionId: z.string().optional(),
    recentActivity: z.string().optional(),
  }).optional(),
});

const MetacognitiveSkillEnum = z.enum([
  'PLANNING', 'MONITORING', 'EVALUATING', 'SELF_REGULATION',
  'KNOWLEDGE_OF_COGNITION', 'REGULATION_OF_COGNITION'
]);

// Full engine format: response + prompt pair
const AnalyzeReflectionFullSchema = z.object({
  response: z.object({
    promptId: z.string().min(1),
    userId: z.string().min(1),
    response: z.union([z.string(), z.number(), z.array(z.string())]),
    responseTimeSeconds: z.number().min(0),
    reflectionConfidence: ConfidenceLevelEnum.optional(),
    timestamp: z.string().datetime(),
  }),
  prompt: z.object({
    id: z.string().min(1),
    type: ReflectionTypeEnum,
    depth: ReflectionDepthEnum,
    question: z.string().min(1),
    followUpQuestions: z.array(z.string()),
    targetSkill: MetacognitiveSkillEnum,
    suggestedTimeMinutes: z.number().int().min(1),
    responseType: z.enum(['TEXT', 'RATING', 'MULTIPLE_CHOICE', 'CHECKLIST']),
    context: z.object({
      courseId: z.string().optional(),
      topicId: z.string().optional(),
      sessionId: z.string().optional(),
      recentActivity: z.string().optional(),
    }).optional(),
    options: z.array(z.string()).optional(),
  }),
});

// Simplified frontend format: array of responses
const AnalyzeReflectionSimpleSchema = z.object({
  sessionId: z.string().optional(),
  reflectionType: ReflectionTypeEnum,
  responses: z.array(z.object({
    promptId: z.string().min(1),
    response: z.string().min(1),
    confidenceRating: z.number().int().min(1).max(5).optional(),
    timestamp: z.string(),
  })).min(1),
});

const RecordStudySessionSchema = z.object({
  courseId: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  topicsCovered: z.array(z.string()).min(1),
  strategiesUsed: z.array(LearningStrategyEnum).optional(),
  breaks: z.array(z.object({
    startedAt: z.string().datetime(),
    durationMinutes: z.number().int().min(1),
    type: z.enum(['SHORT', 'LONG', 'UNPLANNED']),
    activity: z.string().optional(),
  })).optional(),
  environment: z.object({
    location: z.enum(['HOME', 'LIBRARY', 'CAFE', 'CLASSROOM', 'OTHER']),
    noiseLevel: z.enum(['SILENT', 'QUIET', 'MODERATE', 'NOISY']),
    distractions: z.array(z.string()),
    deviceUsed: z.enum(['DESKTOP', 'LAPTOP', 'TABLET', 'MOBILE']),
    timeOfDay: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']),
  }).optional(),
  outcome: z.object({
    goalsAchieved: z.boolean(),
    comprehensionLevel: ConfidenceLevelEnum,
    satisfactionLevel: ConfidenceLevelEnum,
    notesOrReflection: z.string().optional(),
  }).optional(),
});

const GetHabitAnalysisSchema = z.object({
  courseId: z.string().optional(),
  periodDays: z.number().int().min(1).max(365).optional().default(30),
});

const AssessConfidenceSchema = z.object({
  items: z.array(z.object({
    concept: z.string().min(1),
    confidence: ConfidenceLevelEnum,
  })).min(1),
  courseId: z.string().optional(),
  topicId: z.string().optional(),
});

const SetGoalSchema = z.object({
  description: z.string().min(1).max(500),
  type: GoalTypeEnum,
  courseId: z.string().optional(),
  targetMetric: z.object({
    type: z.enum(['COMPLETION_PERCENTAGE', 'MASTERY_SCORE', 'STUDY_HOURS', 'STREAK_DAYS', 'CONCEPTS_MASTERED']),
    targetValue: z.number(),
    currentValue: z.number().optional(),
  }).optional(),
  deadline: z.string().datetime().optional(),
  milestones: z.array(z.object({
    description: z.string().min(1),
    targetDate: z.string().datetime().optional(),
  })).optional(),
});

const UpdateGoalProgressSchema = z.object({
  goalId: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
  milestoneId: z.string().optional(),
  reflection: z.string().optional(),
});

const RecommendStrategiesSchema = z.object({
  courseId: z.string().optional(),
  contentType: z.string().optional(),
  bloomsLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
  currentChallenges: z.array(z.string()).optional(),
});

const AssessCognitiveLoadSchema = z.object({
  sessionId: z.string().optional(),
  currentActivity: z.string().optional(),
  selfReportedLoad: CognitiveLoadLevelEnum.optional(),
  recentPerformance: z.number().min(0).max(100).optional(),
});

const GetMetacognitiveAssessmentSchema = z.object({
  courseId: z.string().optional(),
  detailed: z.boolean().optional().default(false),
});

// ============================================================================
// GET - Retrieve habit analysis or metacognitive assessment
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
    const engine = await getMetacognitionEngine();

    const endpoint = searchParams.get('endpoint') ?? 'habits';

    if (endpoint === 'habits') {
      const courseId = searchParams.get('courseId') ?? undefined;
      const periodDays = parseInt(searchParams.get('periodDays') ?? '30');

      const analysis = engine.analyzeStudyHabits({
        userId: session.user.id,
        courseId,
        periodDays,
      });

      return NextResponse.json({
        success: true,
        data: analysis,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'assessment') {
      const courseId = searchParams.get('courseId') ?? undefined;
      const detailed = searchParams.get('detailed') === 'true';

      const assessment = engine.getMetacognitiveAssessment({
        userId: session.user.id,
        courseId,
        detailed,
      });

      return NextResponse.json({
        success: true,
        data: assessment,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'self-regulation') {
      const profile = engine.getSelfRegulationProfile(session.user.id);

      return NextResponse.json({
        success: true,
        data: profile,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Metacognition] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve metacognition data' } },
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

    const engine = await getMetacognitionEngine();
    let result: unknown;

    switch (action) {
      case 'generate-reflection': {
        const validated = GenerateReflectionSchema.parse(data);
        result = await engine.generateReflection({
          userId: session.user.id,
          type: validated.type as ReflectionType,
          depth: validated.depth as ReflectionDepth,
          context: validated.context,
        });
        logger.info('[Metacognition] Reflection generated', {
          userId: session.user.id,
          type: validated.type,
          depth: validated.depth,
        });
        break;
      }

      case 'analyze-reflection': {
        // Detect frontend format (has 'responses' array) vs full engine format (has 'response' + 'prompt')
        const isSimpleFormat = Array.isArray(data?.responses);

        if (isSimpleFormat) {
          const validated = AnalyzeReflectionSimpleSchema.parse(data);

          // Map numeric confidence (1-5) to ConfidenceLevel enum
          const mapConfidence = (rating?: number): ConfidenceLevel | undefined => {
            if (rating === undefined) return undefined;
            const levels: ConfidenceLevel[] = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
            return levels[Math.min(Math.max(rating - 1, 0), 4)];
          };

          // Process each response, aggregate results
          const analyses = [];
          for (const resp of validated.responses) {
            const analysisResult = await engine.analyzeReflection({
              response: {
                promptId: resp.promptId,
                userId: session.user.id,
                response: resp.response,
                responseTimeSeconds: 0,
                reflectionConfidence: mapConfidence(resp.confidenceRating),
                timestamp: new Date(resp.timestamp),
              },
              prompt: {
                id: resp.promptId,
                type: validated.reflectionType as ReflectionType,
                depth: 'MODERATE' as ReflectionDepth,
                question: resp.response,
                followUpQuestions: [],
                targetSkill: 'MONITORING' as MetacognitiveSkill,
                suggestedTimeMinutes: 5,
                responseType: 'TEXT',
                context: validated.sessionId ? { sessionId: validated.sessionId } : undefined,
              },
            });
            analyses.push(analysisResult);
          }

          // Return aggregated analysis wrapped as frontend expects
          result = { analysis: analyses.length === 1 ? analyses[0] : analyses };
          logger.info('[Metacognition] Reflections analyzed (simple format)', {
            userId: session.user.id,
            responseCount: validated.responses.length,
            reflectionType: validated.reflectionType,
          });
        } else {
          const validated = AnalyzeReflectionFullSchema.parse(data);
          const engineResult = await engine.analyzeReflection({
            response: {
              promptId: validated.response.promptId,
              userId: validated.response.userId,
              response: validated.response.response,
              responseTimeSeconds: validated.response.responseTimeSeconds,
              reflectionConfidence: validated.response.reflectionConfidence as ConfidenceLevel | undefined,
              timestamp: new Date(validated.response.timestamp),
            },
            prompt: {
              id: validated.prompt.id,
              type: validated.prompt.type as ReflectionType,
              depth: validated.prompt.depth as ReflectionDepth,
              question: validated.prompt.question,
              followUpQuestions: validated.prompt.followUpQuestions,
              targetSkill: validated.prompt.targetSkill as MetacognitiveSkill,
              suggestedTimeMinutes: validated.prompt.suggestedTimeMinutes,
              responseType: validated.prompt.responseType,
              context: validated.prompt.context,
              options: validated.prompt.options,
            },
          });
          result = { analysis: engineResult };
          logger.info('[Metacognition] Reflection analyzed (full format)', {
            userId: session.user.id,
            promptId: validated.prompt.id,
          });
        }
        break;
      }

      case 'record-study-session': {
        const validated = RecordStudySessionSchema.parse(data);
        result = engine.recordStudySession({
          userId: session.user.id,
          courseId: validated.courseId,
          startedAt: new Date(validated.startedAt),
          endedAt: new Date(validated.endedAt),
          topicsCovered: validated.topicsCovered,
          strategiesUsed: validated.strategiesUsed as LearningStrategy[] | undefined,
          breaks: validated.breaks?.map(b => ({
            startedAt: new Date(b.startedAt),
            durationMinutes: b.durationMinutes,
            type: b.type,
            activity: b.activity,
          })),
          environment: validated.environment,
          outcome: validated.outcome ? {
            goalsAchieved: validated.outcome.goalsAchieved,
            comprehensionLevel: validated.outcome.comprehensionLevel as unknown as ConfidenceLevel,
            satisfactionLevel: validated.outcome.satisfactionLevel as unknown as ConfidenceLevel,
            notesOrReflection: validated.outcome.notesOrReflection,
          } : undefined,
        });
        logger.info('[Metacognition] Study session recorded', {
          userId: session.user.id,
          duration: new Date(validated.endedAt).getTime() - new Date(validated.startedAt).getTime(),
        });
        break;
      }

      case 'get-habit-analysis': {
        const validated = GetHabitAnalysisSchema.parse(data ?? {});
        result = engine.analyzeStudyHabits({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'assess-confidence': {
        const validated = AssessConfidenceSchema.parse(data);
        result = engine.assessConfidence({
          userId: session.user.id,
          items: validated.items.map(i => ({
            concept: i.concept,
            confidence: i.confidence as unknown as ConfidenceLevel,
          })),
          courseId: validated.courseId,
          topicId: validated.topicId,
        });
        break;
      }

      case 'set-goal': {
        const validated = SetGoalSchema.parse(data);
        result = engine.setGoal({
          userId: session.user.id,
          description: validated.description,
          type: validated.type as GoalType,
          courseId: validated.courseId,
          targetMetric: validated.targetMetric ? {
            metricType: validated.targetMetric.type,
            targetValue: validated.targetMetric.targetValue,
            currentValue: validated.targetMetric.currentValue ?? 0,
            unit: 'count',
          } : undefined,
          deadline: validated.deadline ? new Date(validated.deadline) : undefined,
          milestones: validated.milestones?.map(m => ({
            description: m.description,
            targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
          })),
        });
        logger.info('[Metacognition] Goal set', {
          userId: session.user.id,
          goalType: validated.type,
          description: validated.description,
        });
        break;
      }

      case 'update-goal-progress': {
        const validated = UpdateGoalProgressSchema.parse(data);
        result = engine.updateGoalProgress({
          userId: session.user.id,
          goalId: validated.goalId,
          progress: validated.progress,
          milestoneId: validated.milestoneId,
          reflection: validated.reflection,
        });
        logger.info('[Metacognition] Goal progress updated', {
          userId: session.user.id,
          goalId: validated.goalId,
          progress: validated.progress,
        });
        break;
      }

      case 'assess-cognitive-load': {
        const validated = AssessCognitiveLoadSchema.parse(data ?? {});
        result = engine.assessCognitiveLoad({
          userId: session.user.id,
          ...validated,
          selfReportedLoad: validated.selfReportedLoad as CognitiveLoadLevel | undefined,
        });
        break;
      }

      case 'recommend-strategies': {
        const validated = RecommendStrategiesSchema.parse(data ?? {});
        result = engine.recommendStrategies({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'get-metacognitive-assessment': {
        const validated = GetMetacognitiveAssessmentSchema.parse(data ?? {});
        result = engine.getMetacognitiveAssessment({
          userId: session.user.id,
          ...validated,
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
      featureName: 'metacognition',
      action,
      requestData: (data as Record<string, unknown>) ?? {},
      responseData: (result as Record<string, unknown>) ?? {},
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[Metacognition] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process metacognition request' } },
      { status: 500 }
    );
  }
}
