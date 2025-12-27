/**
 * SAM Unified Streaming API Route
 * Real-time streaming responses with Server-Sent Events
 *
 * UPDATED: Now integrates:
 * - Unified Blooms Engine (AI-powered, not keyword-only)
 * - Quality Gates Pipeline (content validation)
 * - Pedagogy Checks (Bloom&apos;s alignment, scaffolding, ZPD)
 * - Memory Integration (mastery tracking, spaced repetition)
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Import from @sam-ai/core package
import {
  SAMAgentOrchestrator,
  createSAMConfig,
  createDefaultContext,
  createAnthropicAdapter,
  createMemoryCache,
  createContextEngine,
  createContentEngine,
  createPersonalizationEngine,
  createAssessmentEngine,
  createResponseEngine,
  type SAMConfig,
  type SAMContext,
  type SAMPageType,
  type SAMFormField,
  type BloomsEngineOutput,
} from '@sam-ai/core';

// Import Unified Blooms Engine from @sam-ai/educational (replaces core keyword-only engine)
import {
  createUnifiedBloomsAdapterEngine,
} from '@sam-ai/educational';

// Import Prisma database adapter for SAM
import { createPrismaSAMAdapter } from '@/lib/sam/adapters';

// Import Quality Gates Pipeline for content validation
import {
  createQualityGatePipeline,
  type ContentQualityGatePipeline,
  type GeneratedContent,
  type ValidationResult as QualityValidationResult,
} from '@/lib/sam/quality-gates';

// Import Pedagogy Pipeline for educational effectiveness
import {
  createPedagogicalPipeline,
  type PedagogicalPipeline,
  type PedagogicalPipelineResult,
} from '@/lib/sam/pedagogical';

// Import Memory Integration for mastery tracking
import {
  createSpacedRepetitionScheduler,
  createMasteryTracker,
  getDefaultStudentProfileStore,
  getDefaultReviewScheduleStore,
  buildMemorySummary,
  type SpacedRepetitionScheduler,
  type MasteryTracker,
  type EvaluationOutcome,
} from '@/lib/sam/memory';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const StreamRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
  }),
  formContext: z.object({
    formId: z.string().optional(),
    formName: z.string().optional(),
    fields: z.record(z.any()).optional(),
    isDirty: z.boolean().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  options: z.object({
    engines: z.array(z.string()).optional(),
  }).optional()
});

// ============================================================================
// SUBSYSTEM TYPES
// ============================================================================

interface StreamingSubsystems {
  orchestrator: SAMAgentOrchestrator;
  config: SAMConfig;
  quality: ContentQualityGatePipeline;
  pedagogy: PedagogicalPipeline;
  mastery: MasteryTracker;
  spacedRep: SpacedRepetitionScheduler;
}

// ============================================================================
// ORCHESTRATOR SINGLETON
// ============================================================================

let subsystems: StreamingSubsystems | null = null;

function initializeSubsystems(): StreamingSubsystems {
  if (subsystems) {
    return subsystems;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const aiAdapter = createAnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    timeout: 60000,
    maxRetries: 2,
  });

  const cacheAdapter = createMemoryCache({
    maxSize: 1000,
    defaultTTL: 300,
  });

  // Create database adapter for Prisma
  const databaseAdapter = createPrismaSAMAdapter();

  const samConfig = createSAMConfig({
    ai: aiAdapter,
    cache: cacheAdapter,
    database: databaseAdapter,
    logger: {
      debug: (msg, ...args) => logger.debug(msg, ...args),
      info: (msg, ...args) => logger.info(msg, ...args),
      warn: (msg, ...args) => logger.warn(msg, ...args),
      error: (msg, ...args) => logger.error(msg, ...args),
    },
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
    },
    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4096,
    },
    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300,
    },
    maxConversationHistory: 20,
    personality: {
      name: 'SAM',
      greeting: 'Hello! I\'m SAM, your intelligent learning assistant.',
      tone: 'friendly and professional',
    },
  });

  const orchestrator = new SAMAgentOrchestrator(samConfig);

  // Register core engines + Unified Blooms Adapter (AI-powered analysis)
  orchestrator.registerEngine(createContextEngine(samConfig));
  orchestrator.registerEngine(createContentEngine(samConfig));
  orchestrator.registerEngine(createPersonalizationEngine(samConfig));
  orchestrator.registerEngine(createAssessmentEngine(samConfig));
  orchestrator.registerEngine(createResponseEngine(samConfig));
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
    samConfig,
    database: databaseAdapter,
    defaultMode: 'standard',
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600,
  }));

  // Initialize Quality Gates Pipeline for content validation
  const qualityPipeline = createQualityGatePipeline({
    threshold: 70,
    parallel: true,
    enableEnhancement: true,
    maxIterations: 2,
    timeoutMs: 30000,
  });

  // Initialize Pedagogy Pipeline for educational effectiveness
  const pedagogyPipeline = createPedagogicalPipeline({});

  // Initialize Memory Tracking for mastery and spaced repetition
  const profileStore = getDefaultStudentProfileStore();
  const reviewStore = getDefaultReviewScheduleStore();
  const masteryTracker = createMasteryTracker(profileStore);
  const spacedRepScheduler = createSpacedRepetitionScheduler(reviewStore);

  logger.info('[SAM_STREAM] All subsystems initialized:', {
    engines: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
    qualityGates: true,
    pedagogyPipeline: true,
    memoryTracking: true,
  });

  subsystems = {
    orchestrator,
    config: samConfig,
    quality: qualityPipeline,
    pedagogy: pedagogyPipeline,
    mastery: masteryTracker,
    spacedRep: spacedRepScheduler,
  };

  return subsystems;
}

// Keep backward compatible function
function getOrchestrator(): SAMAgentOrchestrator {
  return initializeSubsystems().orchestrator;
}

// ============================================================================
// ENGINE PRESETS
// ============================================================================

const ENGINE_PRESETS: Record<string, string[]> = {
  quick: ['context', 'response'],
  standard: ['context', 'blooms', 'response'],
  full: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
  content: ['context', 'blooms', 'content', 'response'],
  learning: ['context', 'blooms', 'personalization', 'response'],
  assessment: ['context', 'blooms', 'assessment', 'response'],
  exam: ['context', 'blooms', 'assessment', 'personalization', 'response'],
};

function getEnginePreset(pageType: string, hasForm: boolean): string[] {
  if (hasForm && ['section-detail', 'chapter-detail', 'course-detail'].includes(pageType)) {
    return ENGINE_PRESETS.full;
  }

  switch (pageType) {
    case 'section-detail':
    case 'chapter-detail':
      return ENGINE_PRESETS.standard;
    case 'course-detail':
    case 'course-create':
      return ENGINE_PRESETS.content;
    case 'learning':
    case 'exam':
      return ENGINE_PRESETS.learning;
    default:
      return ENGINE_PRESETS.quick;
  }
}

// ============================================================================
// STREAMING API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const user = await currentUser();
    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Please sign in to use SAM' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = StreamRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[SAM_STREAM] Invalid request:', validation.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, pageContext, formContext, conversationHistory, options } = validation.data;

    logger.info('[SAM_STREAM] Processing streaming request:', {
      userId: user.id,
      pageType: pageContext.type,
      hasForm: !!formContext,
      messageLength: message.length,
    });

    const subs = initializeSubsystems();

    // Build memory summary for prompt injection
    let memorySummary: string | undefined;
    let reviewSummary: string | undefined;
    if (user.id) {
      try {
        const memoryResult = await buildMemorySummary({
          studentId: user.id,
          masteryTracker: subs.mastery,
          spacedRepScheduler: subs.spacedRep,
        });
        memorySummary = memoryResult.memorySummary;
        reviewSummary = memoryResult.reviewSummary;
      } catch (error) {
        logger.warn('[SAM_STREAM] Failed to build memory summary:', error);
      }
    }

    // Build SAMContext
    const samContext: SAMContext = createDefaultContext({
      user: {
        id: user.id,
        role: (user as { isTeacher?: boolean }).isTeacher ? 'teacher' : 'student',
        name: user.name || undefined,
        email: user.email || undefined,
        preferences: {},
        capabilities: pageContext.capabilities || [],
      },
      page: {
        type: pageContext.type as SAMPageType,
        path: pageContext.path,
        entityId: pageContext.entityId,
        parentEntityId: pageContext.parentEntityId,
        grandParentEntityId: pageContext.grandParentEntityId,
        capabilities: pageContext.capabilities || [],
        breadcrumb: pageContext.breadcrumb || [],
        metadata: {
          memorySummary,
          reviewSummary,
        },
      },
      form: formContext ? {
        formId: formContext.formId || 'detected-form',
        formName: formContext.formName || 'Page Form',
        fields: transformFormFields(formContext.fields || {}),
        isDirty: formContext.isDirty || false,
        isSubmitting: false,
        isValid: true,
        errors: {},
        touchedFields: new Set(),
        lastUpdated: new Date(),
      } : null,
      conversation: {
        id: null,
        messages: (conversationHistory || []).map((m, i) => ({
          id: `msg-${i}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(),
        })),
        isStreaming: true,
        lastMessageAt: new Date(),
        totalMessages: conversationHistory?.length || 0,
      },
    });

    // Determine which engines to run
    const hasForm = !!formContext && Object.keys(formContext.fields || {}).length > 0;
    const defaultEngines = getEnginePreset(pageContext.type, hasForm);
    const enginesToRun = options?.engines || defaultEngines;

    logger.debug('[SAM_STREAM] Running engines:', enginesToRun);

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event with metadata
          controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({
            engines: enginesToRun,
            subsystems: ['unifiedBlooms', 'qualityGates', 'pedagogy', 'memory'],
            timestamp: new Date().toISOString(),
          })}\n\n`));

          // Run orchestrator (non-streaming for engine analysis first)
          const result = await subs.orchestrator.orchestrate(samContext, message, {
            engines: enginesToRun,
          });

          const bloomsOutput = result.results.blooms?.data as unknown as BloomsEngineOutput | undefined;
          const bloomsAnalysis = bloomsOutput?.analysis;

          // Run Quality Gates if content was generated
          let qualityResult: QualityValidationResult | null = null;
          if (result.response?.message && enginesToRun.includes('content')) {
            try {
              const generatedContent: GeneratedContent = {
                type: 'explanation',
                content: result.response.message,
                targetBloomsLevel: bloomsAnalysis?.dominantLevel || 'UNDERSTAND',
              };
              qualityResult = await subs.quality.validate(generatedContent);
            } catch (qualityError) {
              logger.warn('[SAM_STREAM] Quality validation failed:', qualityError);
            }
          }

          // Run Pedagogy Pipeline
          const shouldRunPedagogy =
            !!bloomsAnalysis &&
            (enginesToRun.includes('personalization') || enginesToRun.includes('content'));
          let pedagogyResult: PedagogicalPipelineResult | null = null;
          if (shouldRunPedagogy) {
            try {
              pedagogyResult = await subs.pedagogy.evaluate({
                type: 'explanation',
                content: result.response?.message || message,
                targetBloomsLevel: bloomsAnalysis?.dominantLevel ?? 'UNDERSTAND',
                targetDifficulty: 'intermediate',
              });
            } catch (pedError) {
              logger.warn('[SAM_STREAM] Pedagogy evaluation failed:', pedError);
            }
          }

          // Update Memory Tracking if we have user and section context
          let memoryUpdate: { masteryUpdated: boolean; spacedRepScheduled: boolean } | null = null;
          const memoryEligiblePages = new Set(['section-detail', 'section-view', 'section-edit', 'learning']);
          if (
            user.id &&
            pageContext.entityId &&
            bloomsAnalysis &&
            memoryEligiblePages.has(pageContext.type)
          ) {
            try {
              const confidence = bloomsAnalysis.confidence ?? 0.5;
              const evaluationOutcome: EvaluationOutcome = {
                evaluationId: `stream_${user.id}_${pageContext.entityId}_${Date.now()}`,
                studentId: user.id,
                topicId: pageContext.entityId,
                sectionId: pageContext.entityId,
                score: confidence * 100,
                maxScore: 100,
                bloomsLevel: bloomsAnalysis.dominantLevel,
                assessmentType: 'practice',
                timeSpentMinutes: 0,
                strengths: confidence > 0.7 ? [bloomsAnalysis.dominantLevel] : [],
                areasForImprovement: bloomsAnalysis.gaps ?? [],
                feedback: `Streamed at ${bloomsAnalysis.dominantLevel} level`,
                evaluatedAt: new Date(),
              };

              await subs.mastery.processEvaluation(evaluationOutcome);
              await subs.spacedRep.scheduleFromEvaluation(evaluationOutcome);
              memoryUpdate = { masteryUpdated: true, spacedRepScheduled: true };
            } catch (memError) {
              logger.warn('[SAM_STREAM] Memory update failed:', memError);
              memoryUpdate = { masteryUpdated: false, spacedRepScheduled: false };
            }
          }

          // Send insights event with unified analysis
          const contextData = result.results.context?.data as Record<string, unknown> | undefined;
          const contentData = result.results.content?.data as Record<string, unknown> | undefined;
          const personalizationData = result.results.personalization?.data as Record<string, unknown> | undefined;

          const insights = {
            // Use unified blooms instead of core blooms
            blooms: bloomsAnalysis ? {
              dominantLevel: bloomsAnalysis.dominantLevel,
              confidence: bloomsAnalysis.confidence,
              cognitiveDepth: bloomsAnalysis.cognitiveDepth,
              distribution: bloomsAnalysis.distribution,
              gaps: bloomsAnalysis.gaps,
              recommendations: bloomsAnalysis.recommendations,
              method: bloomsAnalysis.method,
              sectionAnalysis: bloomsOutput?.sectionAnalysis,
              actionItems: bloomsOutput?.actionItems,
            } : undefined,
            content: contentData ? {
              metrics: (contentData as { metrics?: unknown }).metrics,
              suggestions: (contentData as { suggestions?: unknown[] }).suggestions,
              overallScore: (contentData as { overallScore?: number }).overallScore,
            } : undefined,
            personalization: personalizationData ? {
              learningStyle: (personalizationData as { learningStyle?: unknown }).learningStyle,
              cognitiveLoad: (personalizationData as { cognitiveLoad?: unknown }).cognitiveLoad,
              motivation: (personalizationData as { motivation?: unknown }).motivation,
            } : undefined,
            context: contextData ? {
              intent: (contextData as { queryAnalysis?: { intent?: string } }).queryAnalysis?.intent,
              keywords: (contextData as { queryAnalysis?: { keywords?: string[] } }).queryAnalysis?.keywords,
              complexity: (contextData as { queryAnalysis?: { complexity?: string } }).queryAnalysis?.complexity,
            } : undefined,
            // NEW: Quality gates results
            quality: qualityResult ? {
              passed: qualityResult.passed,
              score: qualityResult.overallScore,
              failedGates: qualityResult.failedGates,
            } : undefined,
            // NEW: Pedagogy results
            pedagogy: pedagogyResult ? {
              passed: pedagogyResult.passed,
              score: pedagogyResult.overallScore,
            } : undefined,
            // NEW: Memory tracking results
            memory: memoryUpdate,
            memoryContext: memorySummary || reviewSummary ? {
              summary: memorySummary,
              reviewSummary,
            } : undefined,
          };

          controller.enqueue(encoder.encode(`event: insights\ndata: ${JSON.stringify(insights)}\n\n`));

          // Stream the response content in chunks
          const responseText = result.response.message;
          const chunkSize = 20; // Characters per chunk for smooth streaming effect

          for (let i = 0; i < responseText.length; i += chunkSize) {
            const chunk = responseText.slice(i, i + chunkSize);
            controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          // Send suggestions
          if (result.response.suggestions && result.response.suggestions.length > 0) {
            controller.enqueue(encoder.encode(`event: suggestions\ndata: ${JSON.stringify(result.response.suggestions)}\n\n`));
          }

          // Send actions
          if (result.response.actions && result.response.actions.length > 0) {
            controller.enqueue(encoder.encode(`event: actions\ndata: ${JSON.stringify(result.response.actions)}\n\n`));
          }

          // Send completion event with all subsystem info
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            success: result.success,
            metadata: {
              enginesRun: result.metadata.enginesExecuted,
              enginesFailed: result.metadata.enginesFailed,
              enginesCached: result.metadata.enginesCached,
              totalTime: result.metadata.totalExecutionTime,
              requestTime: Date.now() - startTime,
              subsystems: {
                unifiedBlooms: !!bloomsAnalysis,
                qualityGates: !!qualityResult,
                pedagogyPipeline: !!pedagogyResult,
                memoryTracking: !!memoryUpdate,
              },
            },
          })}\n\n`));

          controller.close();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[SAM_STREAM] Error:', errorMessage);

          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
            error: errorMessage,
            recoverable: true,
          })}\n\n`));

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_STREAM] Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to initialize streaming',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformFormFields(fields: Record<string, unknown>): Record<string, SAMFormField> {
  const result: Record<string, SAMFormField> = {};

  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'object' && value !== null) {
      const field = value as Record<string, unknown>;
      result[name] = {
        name,
        value: field.value,
        type: (field.type as string) || 'text',
        label: field.label as string | undefined,
        placeholder: field.placeholder as string | undefined,
        required: field.required as boolean | undefined,
      };
    } else {
      result[name] = {
        name,
        value,
        type: 'text',
      };
    }
  }

  return result;
}
