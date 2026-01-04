/**
 * SAM Unified API Route
 * Uses @sam-ai/core orchestrator with all 6 engines
 * Now with FULL context awareness - fetches actual entity data!
 *
 * UPDATED: Now integrates:
 * - Unified Blooms Engine (AI-powered, not keyword-only)
 * - Quality Gates Pipeline (content validation)
 * - Pedagogy Checks (Bloom&apos;s alignment, scaffolding, ZPD)
 * - Memory Integration (mastery tracking, spaced repetition)
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
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

// Import entity context service for REAL context awareness
import { buildEntityContext, buildFormSummary } from '@/lib/sam/entity-context';

// Import rate limiter for usage caps
import { applyRateLimit, samMessagesLimiter } from '@/lib/sam/config/sam-rate-limiter';

// Import Prisma database adapter for SAM
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';

// Import Quality Gates Pipeline for content validation
import {
  createQualityGatePipeline,
  type ContentQualityGatePipeline,
  type GeneratedContent,
  type ValidationResult as QualityValidationResult,
} from '@sam-ai/quality';

// Import Pedagogy Pipeline for educational effectiveness
import {
  createPedagogicalPipeline,
  type PedagogicalPipeline,
  type PedagogicalPipelineResult,
} from '@sam-ai/pedagogy';

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
} from '@sam-ai/memory';

// Import Safety validation for response checking
import {
  isFeedbackTextSafe,
  getFeedbackSuggestions,
  type SafetyResult,
} from '@sam-ai/safety';
import { dispatchInterventionNotifications } from '@/lib/sam/agentic-notifications';

// Import SAM Agentic Bridge for autonomous capabilities
import {
  createSAMAgenticBridge,
  type SAMAgenticBridge,
  type AgenticAnalysisResult,
  ConfidenceLevel,
  type Intervention,
} from '@/lib/sam/agentic-bridge';
import type { VerificationResult } from '@sam-ai/agentic';
import {
  ensureToolingInitialized,
  ensureDefaultToolPermissions,
  mapUserToToolRole,
} from '@/lib/sam/agentic-tooling';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import { planToolInvocation } from '@/lib/sam/tool-planner';
import { queueMemoryIngestion } from '@/lib/sam/memory-ingestion';

// Import Orchestration Integration for plan-driven tutoring
import {
  initializeOrchestration,
  prepareTutoringContext,
  injectPlanContext,
  evaluateStepProgress,
  advanceStepIfReady,
  processTutoringLoop,
  formatOrchestrationResponse,
  type OrchestrationSubsystems,
  type OrchestrationResponseData,
} from '@/lib/sam/orchestration-integration';
import {
  createPrismaGoalStore,
  createPrismaPlanStore,
  createPrismaToolStore,
} from '@/lib/sam/stores';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const UnifiedRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
    // Client-provided entity data from window context (SimpleCourseContext, etc.)
    entityData: z.object({
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      whatYouWillLearn: z.array(z.string()).optional(),
      learningObjectives: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      categoryId: z.string().nullable().optional(),
      price: z.number().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      chapterCount: z.number().optional(),
      publishedChapters: z.number().optional(),
      chapters: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        isPublished: z.boolean().optional(),
        isFree: z.boolean().optional(),
        position: z.number().optional(),
        sectionCount: z.number().optional(),
        sections: z.array(z.object({
          id: z.string(),
          title: z.string(),
          isPublished: z.boolean().optional(),
        })).optional(),
      })).optional(),
      // Chapter-specific
      position: z.number().optional(),
      courseId: z.string().optional(),
      courseTitle: z.string().optional(),
      sectionCount: z.number().optional(),
      fullChapterData: z.any().optional(),
      sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        isPublished: z.boolean().optional(),
        position: z.number().optional(),
        contentType: z.string().nullable().optional(),
      })).optional(),
      // Section-specific
      chapterId: z.string().optional(),
      chapterTitle: z.string().optional(),
      content: z.string().nullable().optional(),
      contentType: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
    }).optional(),
    entityType: z.enum(['course', 'chapter', 'section']).optional(),
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
    stream: z.boolean().optional(),
  }).optional()
});

// ============================================================================
// ORCHESTRATOR SINGLETON & SUBSYSTEMS
// ============================================================================

let orchestrator: SAMAgentOrchestrator | null = null;
let samConfig: SAMConfig | null = null;
let qualityPipeline: ContentQualityGatePipeline | null = null;
let pedagogyPipeline: PedagogicalPipeline | null = null;
let masteryTracker: MasteryTracker | null = null;
let spacedRepScheduler: SpacedRepetitionScheduler | null = null;
let tutoringOrchestration: OrchestrationSubsystems | null = null;

/**
 * Initialize all subsystems (orchestrator, quality gates, pedagogy, memory, tutoring)
 */
function initializeSubsystems(): {
  orchestrator: SAMAgentOrchestrator;
  config: SAMConfig;
  quality: ContentQualityGatePipeline;
  pedagogy: PedagogicalPipeline;
  mastery: MasteryTracker;
  spacedRep: SpacedRepetitionScheduler;
  tutoring: OrchestrationSubsystems | null;
} {
  if (orchestrator && samConfig && qualityPipeline && pedagogyPipeline && masteryTracker && spacedRepScheduler) {
    return {
      orchestrator,
      config: samConfig,
      quality: qualityPipeline,
      pedagogy: pedagogyPipeline,
      mastery: masteryTracker,
      spacedRep: spacedRepScheduler,
      tutoring: tutoringOrchestration,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Create AI adapter
  const aiAdapter = createAnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    timeout: 60000,
    maxRetries: 2,
  });

  // Create cache adapter
  const cacheAdapter = createMemoryCache({
    maxSize: 1000,
    defaultTTL: 300,
  });

  // Create database adapter for Prisma
  const databaseAdapter = createPrismaSAMAdapter({ prisma: db });

  // Create SAM configuration
  samConfig = createSAMConfig({
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
      gamification: false,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: false,
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
      greeting: 'Hello! I&apos;m SAM, your intelligent learning assistant.',
      tone: 'friendly and professional',
    },
  });

  // Create orchestrator
  orchestrator = new SAMAgentOrchestrator(samConfig);

  // Register core engines (context, content, personalization, assessment, response)
  orchestrator.registerEngine(createContextEngine(samConfig));
  orchestrator.registerEngine(createContentEngine(samConfig));
  orchestrator.registerEngine(createPersonalizationEngine(samConfig));
  orchestrator.registerEngine(createAssessmentEngine(samConfig));
  orchestrator.registerEngine(createResponseEngine(samConfig));

  // Register Unified Blooms Adapter Engine (AI-powered analysis)
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
    samConfig,
    database: databaseAdapter,
    defaultMode: 'standard', // Keyword first, AI escalation if confidence low
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600,
  }));

  // Initialize Quality Gates Pipeline for content validation
  qualityPipeline = createQualityGatePipeline({
    threshold: 70,
    parallel: true,
    enableEnhancement: true,
    maxIterations: 2,
    timeoutMs: 30000,
  });

  // Initialize Pedagogy Pipeline for educational effectiveness
  // Use default config - all evaluators enabled by default
  pedagogyPipeline = createPedagogicalPipeline({});

  // Initialize Memory Tracking for mastery and spaced repetition
  const profileStore = getDefaultStudentProfileStore();
  const reviewStore = getDefaultReviewScheduleStore();
  masteryTracker = createMasteryTracker(profileStore);
  spacedRepScheduler = createSpacedRepetitionScheduler(reviewStore);

  // Initialize Tutoring Orchestration for plan-driven tutoring
  try {
    const goalStore = createPrismaGoalStore();
    const planStore = createPrismaPlanStore();
    const toolStore = createPrismaToolStore();

    tutoringOrchestration = initializeOrchestration({
      goalStore,
      planStore,
      toolStore,
    });

    logger.info('[SAM_UNIFIED] Tutoring orchestration initialized');
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Failed to initialize tutoring orchestration:', error);
    tutoringOrchestration = null;
  }

  logger.info('[SAM_UNIFIED] All subsystems initialized:', {
    engines: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
    qualityGates: true,
    pedagogyPipeline: true,
    memoryTracking: true,
    tutoringOrchestration: !!tutoringOrchestration,
  });

  return {
    orchestrator,
    config: samConfig,
    quality: qualityPipeline,
    pedagogy: pedagogyPipeline,
    mastery: masteryTracker,
    spacedRep: spacedRepScheduler,
    tutoring: tutoringOrchestration,
  };
}

// Keep backward compatible function
function getOrchestrator(): SAMAgentOrchestrator {
  return initializeSubsystems().orchestrator;
}

// ============================================================================
// ENGINE PRESETS
// ============================================================================

const ENGINE_PRESETS: Record<string, string[]> = {
  // Quick chat - minimal engines for fast response
  quick: ['context', 'response'],

  // Standard chat - with Bloom&apos;s analysis
  standard: ['context', 'blooms', 'response'],

  // Full analysis - all 6 engines
  full: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],

  // Content focused
  content: ['context', 'blooms', 'content', 'response'],

  // Learning focused
  learning: ['context', 'blooms', 'personalization', 'response'],

  // Assessment focused - for quiz/exam generation
  assessment: ['context', 'blooms', 'assessment', 'response'],

  // Exam/quiz mode - includes assessment engine
  exam: ['context', 'blooms', 'assessment', 'personalization', 'response'],
};

function getEnginePreset(pageType: string, hasForm: boolean, message?: string): string[] {
  const lowerMessage = (message || '').toLowerCase();

  // Use quick preset for simple queries (faster response)
  const isSimpleQuery = lowerMessage.length < 50 &&
    !lowerMessage.includes('generate') &&
    !lowerMessage.includes('create') &&
    !lowerMessage.includes('analyze') &&
    !lowerMessage.includes('improve') &&
    !lowerMessage.includes('quiz') &&
    !lowerMessage.includes('question') &&
    !lowerMessage.includes('exam') &&
    !lowerMessage.includes('test');

  if (isSimpleQuery) {
    return ENGINE_PRESETS.quick;
  }

  // Use assessment preset for quiz/exam/question generation
  const isAssessmentRequest = lowerMessage.includes('quiz') ||
    lowerMessage.includes('question') ||
    lowerMessage.includes('exam') ||
    lowerMessage.includes('test me') ||
    lowerMessage.includes('assessment') ||
    lowerMessage.includes('evaluate');

  if (isAssessmentRequest) {
    return ENGINE_PRESETS.assessment;
  }

  // Use content preset only for content generation/creation requests
  const isGenerationRequest = lowerMessage.includes('generate') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('write') ||
    lowerMessage.includes('draft');

  if (isGenerationRequest) {
    return ENGINE_PRESETS.content;
  }

  // Use standard for analysis requests
  const isAnalysisRequest = lowerMessage.includes('analyze') ||
    lowerMessage.includes('review') ||
    lowerMessage.includes('check') ||
    lowerMessage.includes('improve');

  if (isAnalysisRequest) {
    return ENGINE_PRESETS.standard;
  }

  // Default to quick for faster response
  return ENGINE_PRESETS.quick;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to use SAM' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, samMessagesLimiter, user.id);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Parse and validate request
    const body = await request.json();
    const validation = UnifiedRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[SAM_UNIFIED] Invalid request:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { message, pageContext, formContext, conversationHistory, options } = validation.data;

    const hasClientEntityData = !!pageContext.entityData?.title;

    // Initialize SAM Agentic Bridge for autonomous capabilities
    const agenticBridge = createSAMAgenticBridge({
      userId: user.id,
      courseId: pageContext.entityId,
      enableGoalPlanning: false, // Not needed for basic response flow
      enableToolExecution: true,
      enableProactiveInterventions: true,
      enableSelfEvaluation: true,
      enableLearningAnalytics: true,
    });

    logger.debug('[SAM_UNIFIED] Agentic bridge initialized:', {
      userId: user.id,
      capabilities: agenticBridge.getEnabledCapabilities(),
    });

    // =========================================================================
    // TUTORING ORCHESTRATION - Plan-Driven Context Preparation
    // =========================================================================

    // Prepare tutoring context for plan-driven tutoring (if active plan exists)
    let tutoringContext: Awaited<ReturnType<typeof prepareTutoringContext>> = null;
    let planContextInjection: ReturnType<typeof injectPlanContext> = null;

    try {
      const subsystems = initializeSubsystems();
      if (subsystems.tutoring) {
        // Generate a session ID for this conversation
        const sessionId = `session_${user.id}_${Date.now()}`;

        tutoringContext = await prepareTutoringContext(
          user.id,
          sessionId,
          message,
          {
            planId: pageContext.entityId, // Use entity ID as potential plan ID
            goalId: undefined, // Could be extracted from request if provided
          }
        );

        if (tutoringContext) {
          planContextInjection = injectPlanContext(tutoringContext);

          logger.debug('[SAM_UNIFIED] Tutoring context prepared:', {
            hasActivePlan: !!tutoringContext.activePlan,
            currentStepId: tutoringContext.currentStep?.id,
            stepObjectivesCount: tutoringContext.stepObjectives?.length || 0,
            hasInjection: !!planContextInjection,
          });
        }
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Failed to prepare tutoring context:', error);
      // Continue without tutoring context - non-blocking
    }

    logger.info('[SAM_UNIFIED] Processing request:', {
      userId: user.id,
      pageType: pageContext.type,
      hasForm: !!formContext,
      messageLength: message.length,
      entityId: pageContext.entityId,
      hasClientEntityData,
      clientEntityTitle: pageContext.entityData?.title,
    });

    // Use client-provided entity data if available, otherwise fetch from database
    // Client data comes from SimpleCourseContext which has already loaded the data
    let entityContext: Awaited<ReturnType<typeof buildEntityContext>>;

    if (hasClientEntityData && pageContext.entityData) {
      // Client provided entity data - use it directly (faster, no DB call needed)
      const clientData = pageContext.entityData;
      const entityType = pageContext.entityType || 'course';

      logger.debug('[SAM_UNIFIED] Using client-provided entity data:', {
        type: entityType,
        title: clientData.title,
        hasChapters: !!clientData.chapters?.length,
      });

      // Build entity context from client data
      entityContext = {
        type: entityType as 'course' | 'chapter' | 'section' | 'none',
        course: entityType === 'course' || clientData.courseTitle ? {
          id: pageContext.entityId || '',
          title: clientData.title || clientData.courseTitle || '',
          description: clientData.description || null,
          subtitle: null,
          courseGoals: null,
          whatYouWillLearn: clientData.whatYouWillLearn || clientData.learningObjectives || [],
          prerequisites: null,
          difficulty: null,
          categoryName: null,
          isPublished: clientData.isPublished ?? false,
          chapterCount: clientData.chapterCount || clientData.chapters?.length || 0,
          chapters: clientData.chapters?.map(ch => ({
            id: ch.id,
            title: ch.title,
            position: ch.position || 0,
            sectionCount: ch.sectionCount || ch.sections?.length || 0,
          })) || [],
        } : undefined,
        chapter: entityType === 'chapter' ? {
          id: pageContext.entityId || '',
          title: clientData.title || '',
          description: clientData.description || null,
          position: 0,
          courseTitle: clientData.courseTitle || '',
          courseId: clientData.courseId || '',
          sections: clientData.sections?.map(s => ({
            id: s.id,
            title: s.title,
            position: 0,
            contentType: null,
          })) || [],
        } : undefined,
        section: entityType === 'section' ? {
          id: pageContext.entityId || '',
          title: clientData.title || '',
          description: clientData.description || null,
          content: clientData.content || null,
          position: 0,
          chapterTitle: clientData.chapterTitle || '',
          chapterId: clientData.chapterId || '',
          courseTitle: clientData.courseTitle || '',
          courseId: clientData.courseId || '',
          videoUrl: clientData.videoUrl || null,
          contentType: clientData.contentType || null,
        } : undefined,
        summary: buildClientEntitySummary(clientData, entityType),
      };
    } else {
      // No client data - fetch from database (fallback)
      entityContext = await buildEntityContext(
        pageContext.type,
        pageContext.entityId,
        pageContext.parentEntityId,
        pageContext.grandParentEntityId
      );
    }

    logger.debug('[SAM_UNIFIED] Entity context ready:', {
      type: entityContext.type,
      hasEntity: entityContext.type !== 'none',
      summaryLength: entityContext.summary.length,
      source: hasClientEntityData ? 'client' : 'database',
    });

    // Build form summary for context
    const formSummary = buildFormSummary(formContext?.fields);

    // Initialize all subsystems early for memory context
    const subsystems = initializeSubsystems();

    // Build memory summary for prompt injection
    let memorySummary: string | undefined;
    let reviewSummary: string | undefined;
    let agenticMemorySnippets: string[] = [];
    if (user.id) {
      try {
        const memoryResult = await buildMemorySummary({
          studentId: user.id,
          masteryTracker: subsystems.mastery,
          spacedRepScheduler: subsystems.spacedRep,
        });
        memorySummary = memoryResult.memorySummary;
        reviewSummary = memoryResult.reviewSummary;
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Failed to build memory summary:', error);
      }

      try {
        const memorySystem = getAgenticMemorySystem();
        const courseIdForMemory = entityContext.course?.id
          ?? entityContext.chapter?.courseId
          ?? entityContext.section?.courseId
          ?? (pageContext.entityType === 'course' ? pageContext.entityId : undefined);

        await memorySystem.sessionContext.getOrCreateContext(user.id, courseIdForMemory);
        await memorySystem.sessionContext.recordQuestion(user.id, message, courseIdForMemory);

        agenticMemorySnippets = await memorySystem.memoryRetriever.retrieveForContext(
          message,
          user.id,
          courseIdForMemory,
          5
        );

        if (agenticMemorySnippets.length > 0) {
          const agenticSummary = [
            'Agentic Memory Context:',
            ...agenticMemorySnippets.map((snippet) => `- ${snippet}`),
          ].join('\n');
          memorySummary = memorySummary
            ? `${memorySummary}\n\n${agenticSummary}`
            : agenticSummary;
        }
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Failed to retrieve agentic memory:', error);
      }

      // Inject plan context into memory summary for plan-driven tutoring
      if (planContextInjection?.systemPromptAdditions?.length) {
        const planContextSummary = [
          'Learning Plan Context:',
          ...planContextInjection.systemPromptAdditions,
        ].join('\n');
        memorySummary = memorySummary
          ? `${memorySummary}\n\n${planContextSummary}`
          : planContextSummary;

        logger.debug('[SAM_UNIFIED] Plan context injected into prompt:', {
          additionsCount: planContextInjection.systemPromptAdditions.length,
        });
      }
    }

    // Build SAMContext with REAL entity data
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
        // CRITICAL: Pass actual entity data in metadata for context awareness
        metadata: {
          entityContext,
          entitySummary: entityContext.summary,
          formSummary,
          memorySummary,
          reviewSummary,
          // Include specific entity data for easy access
          courseTitle: entityContext.course?.title,
          courseDescription: entityContext.course?.description,
          chapterTitle: entityContext.chapter?.title,
          sectionTitle: entityContext.section?.title,
          sectionContent: entityContext.section?.content,
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
        isStreaming: false,
        lastMessageAt: new Date(),
        totalMessages: conversationHistory?.length || 0,
      },
    });

    // Determine which engines to run based on message intent
    const hasForm = !!formContext && Object.keys(formContext.fields || {}).length > 0;
    const defaultEngines = getEnginePreset(pageContext.type, hasForm, message);
    const enginesToRun = options?.engines || defaultEngines;

    logger.debug('[SAM_UNIFIED] Running engines:', { engines: enginesToRun, messageLength: message.length });

    // Run orchestrator for core engines
    const result = await subsystems.orchestrator.orchestrate(samContext, message, {
      engines: enginesToRun,
    });

    const bloomsOutput = result.results.blooms?.data as unknown as BloomsEngineOutput | undefined;
    const bloomsAnalysis = bloomsOutput?.analysis;
    if (bloomsAnalysis) {
      logger.debug('[SAM_UNIFIED] Unified Blooms analysis:', {
        dominantLevel: bloomsAnalysis.dominantLevel,
        confidence: bloomsAnalysis.confidence,
        method: bloomsAnalysis.method,
      });
    }

    // =========================================================================
    // TUTORING ORCHESTRATION - Step Progress Evaluation
    // =========================================================================

    // Evaluate step progress if we have an active tutoring context
    let stepEvaluation: Awaited<ReturnType<typeof evaluateStepProgress>> = null;
    let stepTransition: Awaited<ReturnType<typeof advanceStepIfReady>> = null;
    let orchestrationData: OrchestrationResponseData | null = null;

    if (tutoringContext && result.response?.message) {
      try {
        // Evaluate step progress based on the LLM response
        stepEvaluation = await evaluateStepProgress(
          tutoringContext,
          result.response.message,
          message
        );

        if (stepEvaluation) {
          logger.debug('[SAM_UNIFIED] Step progress evaluated:', {
            progressPercent: stepEvaluation.progressPercent,
            stepComplete: stepEvaluation.stepComplete,
            shouldAdvance: stepEvaluation.shouldAdvance,
            confidence: stepEvaluation.confidence,
          });

          // Advance to next step if evaluation indicates completion
          if (stepEvaluation.shouldAdvance && tutoringContext.activePlan?.id) {
            stepTransition = await advanceStepIfReady(
              tutoringContext.activePlan.id,
              stepEvaluation
            );

            if (stepTransition) {
              logger.info('[SAM_UNIFIED] Step transition occurred:', {
                transitionType: stepTransition.transitionType,
                planComplete: stepTransition.planComplete,
                hasNextStep: !!stepTransition.currentStep,
              });
            }
          }
        }

        // Format orchestration data for response
        if (tutoringContext) {
          orchestrationData = formatOrchestrationResponse({
            response: result.response?.message || '',
            modifiedResponse: null,
            context: tutoringContext,
            evaluation: stepEvaluation,
            toolPlan: null, // Tool plan handled separately below
            transition: stepTransition,
            pendingConfirmations: [],
            metadata: {
              processingTime: Date.now() - startTime,
              contextPrepTime: 0,
              evaluationTime: 0,
              toolPlanningTime: 0,
              stepAdvanced: !!stepTransition,
              planCompleted: stepTransition?.planComplete || false,
              interventionsTriggered: 0,
            },
          });
        }
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Failed to evaluate step progress:', error);
        // Continue without step evaluation - non-blocking
      }
    }

    // Run Quality Gates Pipeline for content generation requests
    let qualityResult: QualityValidationResult | null = null;
    const isContentGeneration = enginesToRun.includes('content') ||
      message.toLowerCase().includes('generate') ||
      message.toLowerCase().includes('create');

    if (isContentGeneration && result.response?.message) {
      const generatedContent: GeneratedContent = {
        type: 'explanation',
        content: result.response.message,
        targetBloomsLevel: bloomsAnalysis?.dominantLevel || 'UNDERSTAND',
      };

      qualityResult = await subsystems.quality.validate(generatedContent);

      logger.debug('[SAM_UNIFIED] Quality validation:', {
        passed: qualityResult.passed,
        score: qualityResult.overallScore,
        failedGates: qualityResult.failedGates,
      });
    }

    // Run Pedagogy Pipeline for educational effectiveness
    const shouldRunPedagogy =
      !!bloomsAnalysis &&
      (enginesToRun.includes('personalization') || enginesToRun.includes('content'));
    let pedagogyResult: PedagogicalPipelineResult | null = null;
    if (shouldRunPedagogy) {
      try {
        pedagogyResult = await subsystems.pedagogy.evaluate({
          type: 'explanation',
          content: result.response?.message || message,
          targetBloomsLevel: bloomsAnalysis?.dominantLevel ?? 'UNDERSTAND',
          targetDifficulty: 'intermediate',
        });

        logger.debug('[SAM_UNIFIED] Pedagogy evaluation:', {
          passed: pedagogyResult.passed,
          score: pedagogyResult.overallScore,
        });
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Pedagogy evaluation failed:', error);
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
        // Create evaluation outcome for memory systems
        const evaluationOutcome: EvaluationOutcome = {
          evaluationId: `unified_${user.id}_${pageContext.entityId}_${Date.now()}`,
          studentId: user.id,
          topicId: pageContext.entityId,
          sectionId: pageContext.entityId,
          score: confidence * 100,
          maxScore: 100,
          bloomsLevel: bloomsAnalysis.dominantLevel,
          assessmentType: 'practice',
          timeSpentMinutes: 0, // Not tracked in unified chat
          strengths: confidence > 0.7 ? [bloomsAnalysis.dominantLevel] : [],
          areasForImprovement: bloomsAnalysis.gaps ?? [],
          feedback: `Analyzed at ${bloomsAnalysis.dominantLevel} level with ${(confidence * 100).toFixed(0)}% confidence`,
          evaluatedAt: new Date(),
        };

        // Update mastery based on evaluation outcome
        const masteryResult = await subsystems.mastery.processEvaluation(evaluationOutcome);

        // Schedule spaced repetition based on evaluation outcome
        const scheduleResult = await subsystems.spacedRep.scheduleFromEvaluation(evaluationOutcome);

        memoryUpdate = { masteryUpdated: true, spacedRepScheduled: true };

        logger.debug('[SAM_UNIFIED] Memory updated:', {
          userId: user.id,
          sectionId: pageContext.entityId,
          masteryLevel: masteryResult.currentMastery.score,
          nextReview: scheduleResult.entry.scheduledFor,
        });
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Memory update failed:', error);
        memoryUpdate = { masteryUpdated: false, spacedRepScheduled: false };
      }
    }

    // =========================================================================
    // AGENTIC TOOL CALLING - LLM-DRIVEN EXECUTION
    // =========================================================================

    let responseText = result.response?.message || '';
    let toolExecution: {
      toolId: string;
      toolName: string;
      status: string;
      awaitingConfirmation: boolean;
      confirmationId?: string;
      result?: unknown;
      reasoning?: string;
      confidence?: number;
    } | null = null;

    try {
      const tooling = await ensureToolingInitialized();
      const role = mapUserToToolRole(user as { role?: string; isTeacher?: boolean });
      await ensureDefaultToolPermissions(user.id, role, user.id);

      const availableTools = await tooling.toolRegistry.listTools({
        enabled: true,
        deprecated: false,
      });

      const plan = await planToolInvocation({
        ai: subsystems.config.ai,
        message,
        tools: availableTools,
        context: {
          pageType: pageContext.type,
          pagePath: pageContext.path,
          entitySummary: entityContext.summary,
          memorySummary,
          // Pass tutoring context for plan-driven tool planning
          tutoringContext: tutoringContext ? {
            activePlanTitle: tutoringContext.activeGoal?.title ?? `Plan ${tutoringContext.activePlan?.id ?? 'Unknown'}`,
            currentStepTitle: tutoringContext.currentStep?.title,
            currentStepType: tutoringContext.currentStep?.type,
            stepObjectives: tutoringContext.stepObjectives,
            stepProgress: stepEvaluation?.progressPercent !== undefined
              ? stepEvaluation.progressPercent / 100
              : undefined,
            planContextAdditions: planContextInjection?.systemPromptAdditions,
          } : undefined,
        },
      });

      if (plan) {
        const execution = await tooling.toolExecutor.execute(
          plan.tool.id,
          user.id,
          plan.input,
          {
            sessionId: samContext.metadata.sessionId,
            metadata: {
              planner: {
                reasoning: plan.reasoning,
                confidence: plan.confidence,
              },
              pageContext: {
                type: pageContext.type,
                path: pageContext.path,
                entityId: pageContext.entityId,
              },
            },
          }
        );

        toolExecution = {
          toolId: plan.tool.id,
          toolName: plan.tool.name,
          status: execution.status,
          awaitingConfirmation: execution.awaitingConfirmation,
          confirmationId: execution.confirmationId,
          result: execution.result,
          reasoning: plan.reasoning,
          confidence: plan.confidence,
        };

        if (execution.awaitingConfirmation) {
          responseText = [
            responseText,
            `\n\nI can run ${plan.tool.name}, but it requires your confirmation.`,
            'Open the Mentor Tools panel to review and approve.',
          ].join('');
        } else if (execution.status === 'success') {
          responseText = [
            responseText,
            `\n\nTool result (${plan.tool.name}):`,
            JSON.stringify(execution.result ?? {}, null, 2),
          ].join('\n');
        } else {
          responseText = [
            responseText,
            `\n\nI tried running ${plan.tool.name}, but it did not complete successfully.`,
          ].join('');
        }
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Tool execution planning failed:', error);
    }

    // =========================================================================
    // AGENTIC INTEGRATION - Confidence Scoring & Session Recording
    // =========================================================================

    // Score confidence on the response using agentic self-evaluation
    let agenticConfidence: {
      level: string;
      score: number;
      factors: Array<{ name: string; score: number; weight: number }>;
    } | null = null;

    if (responseText.length > 0) {
      try {
        const confidenceResult = await agenticBridge.scoreConfidence(responseText, {
          topic: entityContext.course?.title || entityContext.chapter?.title || entityContext.section?.title,
          responseType: 'explanation',
        });

        agenticConfidence = {
          level: confidenceResult.level,
          score: confidenceResult.overallScore,
          factors: confidenceResult.factors.map(f => ({
            name: f.type,
            score: f.score,
            weight: f.weight,
          })),
        };

        logger.debug('[SAM_UNIFIED] Agentic confidence scored:', {
          level: confidenceResult.level,
          score: confidenceResult.overallScore,
          factorCount: confidenceResult.factors.length,
        });
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Agentic confidence scoring failed:', error);
        // Continue without confidence - non-blocking
      }
    }

    // Verify response accuracy when confidence is not high
    let verificationResult: VerificationResult | null = null;
    let responseGated = false;
    if (responseText.length > 0) {
      try {
        const strictMode = agenticConfidence?.level === ConfidenceLevel.LOW;
        verificationResult = await agenticBridge.verifyResponse(responseText, {
          strictMode,
        });

        const hasCriticalIssues = verificationResult.issues.some((issue) =>
          issue.severity === 'critical' || issue.severity === 'high'
        );

        if (
          hasCriticalIssues ||
          verificationResult.status === 'contradicted' ||
          (verificationResult.status === 'unverified' && (agenticConfidence?.score ?? 0) < 0.6)
        ) {
          responseGated = true;
          responseText = [
            'I want to be careful here because I could not verify parts of that response.',
            'If you can share source material or clarify the exact goal, I can provide a verified answer.',
          ].join(' ');
        }
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Response verification failed:', error);
      }
    }

    // Run Safety Validation on response text
    let safetyResult: { passed: boolean; suggestions: string[] } | null = null;
    if (responseText.length > 0) {
      try {
        const isSafe = await isFeedbackTextSafe(responseText);
        const suggestions = isSafe ? [] : getFeedbackSuggestions(responseText);

        safetyResult = {
          passed: isSafe,
          suggestions,
        };

        if (!isSafe) {
          responseGated = true;
          responseText = "I can't provide that response safely. Please rephrase or ask a different question.";
          logger.warn('[SAM_UNIFIED] Safety check flagged issues:', {
            suggestionCount: suggestions.length,
          });
        }
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Safety validation failed:', error);
        safetyResult = { passed: true, suggestions: [] }; // Fail open for availability
      }
    }

    // Record session for learning analytics
    let sessionRecorded = false;
    const topicId = pageContext.entityId || 'unknown';
    const sessionDuration = (Date.now() - startTime) / 1000; // Convert to seconds

    try {
      await agenticBridge.recordSession({
        topicId,
        duration: Math.max(1, Math.round(sessionDuration)), // Minimum 1 second
        questionsAnswered: 1,
        correctAnswers: agenticConfidence?.level === 'HIGH' ? 1 : 0,
        conceptsCovered: [
          entityContext.course?.title,
          entityContext.chapter?.title,
          entityContext.section?.title,
        ].filter((t): t is string => !!t),
      });

      sessionRecorded = true;
      logger.debug('[SAM_UNIFIED] Agentic session recorded:', {
        topicId,
        duration: sessionDuration,
      });
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Agentic session recording failed:', error);
      // Continue without recording - non-blocking
    }

    // Check for proactive interventions
    let interventions: Array<{ type: string; reason: string; priority: string }> = [];
    let interventionResults: Intervention[] = [];
    try {
      interventionResults = await agenticBridge.checkForInterventions({
        userId: user.id,
        courseId: pageContext.entityId,
        currentTopic: entityContext.section?.title || entityContext.chapter?.title,
        sessionStartTime: new Date(startTime),
      });

      interventions = interventionResults.map(i => ({
        type: i.type,
        reason: i.message,
        priority: i.priority,
      }));

      if (interventions.length > 0) {
        logger.info('[SAM_UNIFIED] Agentic interventions triggered:', {
          count: interventions.length,
          types: interventions.map(i => i.type),
        });
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Agentic intervention check failed:', error);
      // Continue without interventions - non-blocking
    }

    // Dispatch intervention notifications (presence-aware)
    if (interventions.length > 0) {
      try {
        const recentThreshold = Date.now() - 2 * 60 * 1000;
        const recentInterventions = interventionResults.filter(
          (intervention) => intervention.createdAt?.getTime() >= recentThreshold
        );

        if (recentInterventions.length > 0) {
          await dispatchInterventionNotifications(user.id, recentInterventions, {
            channels: ['auto'],
          });
        }
      } catch (error) {
        logger.warn('[SAM_UNIFIED] Failed to dispatch intervention notifications:', error);
      }
    }

    // Persist agentic memory embeddings for retrieval
    try {
      if (user.id) {
        const courseIdForMemory = entityContext.course?.id
          ?? entityContext.chapter?.courseId
          ?? entityContext.section?.courseId
          ?? (pageContext.entityType === 'course' ? pageContext.entityId : undefined);

        if (message.trim().length > 0) {
          queueMemoryIngestion({
            content: message,
            sourceId: `conversation_${user.id}_${startTime}`,
            sourceType: 'CONVERSATION',
            userId: user.id,
            courseId: courseIdForMemory,
            tags: ['sam', 'user-message'],
            enableSummary: false,
          });
        }

        if (responseText.trim().length > 0) {
          queueMemoryIngestion({
            content: responseText,
            sourceId: `answer_${user.id}_${startTime}`,
            sourceType: 'ANSWER',
            userId: user.id,
            courseId: courseIdForMemory,
            tags: ['sam', 'assistant-response'],
            enableSummary: false,
          });
        }

        if (entityContext.course?.description) {
          queueMemoryIngestion({
            content: entityContext.course.description,
            sourceId: `course_${entityContext.course.id}`,
            sourceType: 'COURSE_CONTENT',
            userId: user.id,
            courseId: entityContext.course.id,
            tags: ['course'],
            enableSummary: true,
            enableKnowledgeGraph: true,
          });
        }

        if (entityContext.chapter?.description) {
          queueMemoryIngestion({
            content: entityContext.chapter.description,
            sourceId: `chapter_${entityContext.chapter.id}`,
            sourceType: 'CHAPTER_CONTENT',
            userId: user.id,
            courseId: entityContext.chapter.courseId,
            chapterId: entityContext.chapter.id,
            tags: ['chapter'],
            enableSummary: true,
            enableKnowledgeGraph: true,
          });
        }

        if (entityContext.section?.content) {
          queueMemoryIngestion({
            content: entityContext.section.content,
            sourceId: `section_${entityContext.section.id}`,
            sourceType: 'SECTION_CONTENT',
            userId: user.id,
            courseId: entityContext.section.courseId,
            chapterId: entityContext.section.chapterId,
            sectionId: entityContext.section.id,
            tags: ['section'],
            enableSummary: true,
            enableKnowledgeGraph: true,
          });
        }
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Agentic memory persistence failed:', error);
    }

    // Extract data from results
    const contextData = result.results.context?.data as Record<string, unknown> | undefined;
    const contentData = result.results.content?.data as Record<string, unknown> | undefined;
    const personalizationData = result.results.personalization?.data as Record<string, unknown> | undefined;

    // Build response with all integrated data
    const response = {
      success: result.success,
      response: responseText,
      suggestions: result.response.suggestions || [],
      actions: result.response.actions || [],
      insights: {
        // Use Unified Blooms data (AI-powered, not keyword-only)
        blooms: bloomsAnalysis ? {
          distribution: bloomsAnalysis.distribution,
          dominantLevel: bloomsAnalysis.dominantLevel,
          confidence: bloomsAnalysis.confidence,
          cognitiveDepth: bloomsAnalysis.cognitiveDepth,
          balance: bloomsAnalysis.balance,
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
        // NEW: Quality validation results
        quality: qualityResult ? {
          passed: qualityResult.passed,
          score: qualityResult.overallScore,
          failedGates: qualityResult.failedGates,
          suggestions: qualityResult.allSuggestions,
          criticalIssues: qualityResult.criticalIssues?.map(i => i.description),
        } : undefined,
        // NEW: Pedagogy evaluation results
        pedagogy: pedagogyResult ? {
          passed: pedagogyResult.passed,
          score: pedagogyResult.overallScore,
          evaluators: {
            blooms: pedagogyResult.evaluatorResults.blooms ? {
              passed: pedagogyResult.evaluatorResults.blooms.passed,
              score: pedagogyResult.evaluatorResults.blooms.score,
            } : undefined,
            scaffolding: pedagogyResult.evaluatorResults.scaffolding ? {
              passed: pedagogyResult.evaluatorResults.scaffolding.passed,
              score: pedagogyResult.evaluatorResults.scaffolding.score,
            } : undefined,
            zpd: pedagogyResult.evaluatorResults.zpd ? {
              passed: pedagogyResult.evaluatorResults.zpd.passed,
              score: pedagogyResult.evaluatorResults.zpd.score,
            } : undefined,
          },
        } : undefined,
        // NEW: Memory tracking results
        memory: memoryUpdate,
        memoryContext: memorySummary || reviewSummary ? {
          summary: memorySummary,
          reviewSummary,
        } : undefined,
        // NEW: Safety validation results
        safety: safetyResult ? {
          passed: safetyResult.passed,
          suggestions: safetyResult.suggestions,
        } : undefined,
        // NEW: Agentic AI capabilities
        agentic: {
          confidence: agenticConfidence ? {
            level: agenticConfidence.level,
            score: agenticConfidence.score,
            factors: agenticConfidence.factors,
          } : undefined,
          verification: verificationResult ? {
            status: verificationResult.status,
            accuracy: verificationResult.overallAccuracy,
            issueCount: verificationResult.issues.length,
            criticalIssues: verificationResult.issues
              .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
              .map((issue) => issue.description),
          } : undefined,
          responseGated: responseGated || undefined,
          sessionRecorded,
          interventions: interventions.length > 0 ? interventions : undefined,
          toolExecution: toolExecution ?? undefined,
        },
        // NEW: Tutoring Orchestration (Plan-Driven Learning)
        orchestration: orchestrationData ? {
          hasActivePlan: orchestrationData.hasActivePlan,
          currentStep: orchestrationData.currentStep,
          stepProgress: orchestrationData.stepProgress,
          transition: orchestrationData.transition,
          pendingConfirmations: orchestrationData.pendingConfirmations,
          metadata: orchestrationData.metadata,
        } : undefined,
      },
      metadata: {
        enginesRun: result.metadata.enginesExecuted,
        enginesFailed: result.metadata.enginesFailed,
        enginesCached: result.metadata.enginesCached,
        totalTime: result.metadata.totalExecutionTime,
        requestTime: Date.now() - startTime,
        // NEW: Subsystem usage flags
        subsystems: {
          unifiedBlooms: !!bloomsAnalysis,
          qualityGates: !!qualityResult,
          pedagogyPipeline: !!pedagogyResult,
          memoryTracking: !!memoryUpdate,
          safetyValidation: !!safetyResult,
          agenticBridge: true, // Always enabled now
          agenticConfidence: !!agenticConfidence,
          agenticVerification: !!verificationResult,
          agenticResponseGated: responseGated,
          agenticSession: sessionRecorded,
          agenticInterventions: interventions.length > 0,
          agenticToolExecution: !!toolExecution,
          // NEW: Tutoring Orchestration subsystems
          tutoringOrchestration: !!orchestrationData,
          tutoringContext: !!tutoringContext,
          stepEvaluation: !!stepEvaluation,
          stepTransition: !!stepTransition,
          planContextInjection: !!planContextInjection,
        },
        toolExecution: toolExecution ?? undefined,
      },
    };

    logger.info('[SAM_UNIFIED] Request completed:', {
      success: result.success,
      enginesRun: result.metadata.enginesExecuted.length,
      totalTime: result.metadata.totalExecutionTime,
      qualityPassed: qualityResult?.passed,
      pedagogyPassed: pedagogyResult?.passed,
      safetyPassed: safetyResult?.passed,
      agenticConfidence: agenticConfidence?.level,
      agenticVerification: verificationResult?.status,
      agenticResponseGated: responseGated,
      agenticSessionRecorded: sessionRecorded,
      agenticInterventions: interventions.length,
      agenticToolExecution: toolExecution?.toolId,
    });

    return NextResponse.json(response, {
      headers: rateLimitResult.headers,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_UNIFIED] Error:', errorMessage);

    // Return graceful error response
    return NextResponse.json({
      success: false,
      response: 'I apologize, but I encountered an issue processing your request. Please try again.',
      suggestions: [
        { id: 'retry', label: 'Try again', text: 'Please try my request again', type: 'quick-reply' as const },
        { id: 'help', label: 'Get help', text: 'What can you help me with?', type: 'quick-reply' as const },
      ],
      actions: [],
      insights: {},
      metadata: {
        enginesRun: [],
        enginesFailed: ['orchestrator'],
        enginesCached: [],
        totalTime: Date.now() - startTime,
        requestTime: Date.now() - startTime,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
    }, { status: 500 });
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

/**
 * Build a human-readable summary from client-provided entity data
 */
function buildClientEntitySummary(
  entityData: NonNullable<(typeof UnifiedRequestSchema)['_output']['pageContext']['entityData']>,
  entityType: string
): string {
  const parts: string[] = [];

  if (entityType === 'course') {
    if (entityData.title) {
      parts.push(`Course: "${entityData.title}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 300)}${entityData.description.length > 300 ? '...' : ''}`);
    }
    if (entityData.whatYouWillLearn?.length) {
      parts.push(`Learning objectives: ${entityData.whatYouWillLearn.slice(0, 3).join('; ')}${entityData.whatYouWillLearn.length > 3 ? '...' : ''}`);
    }
    if (entityData.chapterCount !== undefined) {
      parts.push(`Chapters: ${entityData.chapterCount}`);
    }
    if (entityData.chapters?.length) {
      const chapterTitles = entityData.chapters.slice(0, 5).map(ch => ch.title).join(', ');
      parts.push(`Chapter titles: ${chapterTitles}${entityData.chapters.length > 5 ? '...' : ''}`);
    }
    parts.push(`Status: ${entityData.isPublished ? 'Published' : 'Draft'}`);
  } else if (entityType === 'chapter') {
    if (entityData.title) {
      parts.push(`Chapter: "${entityData.title}"`);
    }
    if (entityData.courseTitle) {
      parts.push(`Part of course: "${entityData.courseTitle}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 200)}${entityData.description.length > 200 ? '...' : ''}`);
    }
    if (entityData.sectionCount !== undefined) {
      parts.push(`Sections: ${entityData.sectionCount}`);
    }
    if (entityData.sections?.length) {
      const sectionTitles = entityData.sections.slice(0, 5).map(s => s.title).join(', ');
      parts.push(`Section titles: ${sectionTitles}${entityData.sections.length > 5 ? '...' : ''}`);
    }
  } else if (entityType === 'section') {
    if (entityData.title) {
      parts.push(`Section: "${entityData.title}"`);
    }
    if (entityData.chapterTitle) {
      parts.push(`Part of chapter: "${entityData.chapterTitle}"`);
    }
    if (entityData.courseTitle) {
      parts.push(`Part of course: "${entityData.courseTitle}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 200)}${entityData.description.length > 200 ? '...' : ''}`);
    }
    if (entityData.contentType) {
      parts.push(`Content type: ${entityData.contentType}`);
    }
    if (entityData.content) {
      // Strip HTML and truncate
      const stripped = entityData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      parts.push(`Content preview: ${stripped.substring(0, 300)}${stripped.length > 300 ? '...' : ''}`);
    }
    if (entityData.videoUrl) {
      parts.push('Has video: Yes');
    }
  }

  return parts.length > 0 ? parts.join('\n') : 'No specific entity context available.';
}
