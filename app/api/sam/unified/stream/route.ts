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
import { currentUserOrAdmin } from '@/lib/auth';
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

// Import Prisma database adapter for SAM
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';

// Import entity context service for REAL context awareness
import { buildEntityContext, buildFormSummary } from '@/lib/sam/entity-context';

// Import rate limiter for usage caps
import { applyRateLimit, samMessagesLimiter } from '@/lib/sam/config/sam-rate-limiter';

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
} from '@sam-ai/safety';
import { dispatchInterventionNotifications } from '@/lib/sam/agentic-notifications';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import {
  ensureToolingInitialized,
  ensureDefaultToolPermissions,
  mapUserToToolRole,
} from '@/lib/sam/agentic-tooling';
import { planToolInvocation } from '@/lib/sam/tool-planner';
import { queueMemoryIngestion } from '@/lib/sam/memory-ingestion';
import { buildSAMSessionId } from '@/lib/sam/session-utils';

// Import SAM Agentic Bridge for autonomous capabilities
import {
  createSAMAgenticBridge,
  ConfidenceLevel,
  type Intervention,
} from '@/lib/sam/agentic-bridge';
import {
  getSAMIntegrationProfile,
  getSAMCapabilityRegistry,
} from '@/lib/sam/integration-profile';
import {
  initializeOrchestration,
  prepareTutoringContext,
  injectPlanContext,
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
import type { VerificationResult } from '@sam-ai/agentic';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const StreamRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
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
    // Page navigation links for context awareness
    links: z.array(z.object({
      href: z.string(),
      text: z.string().optional(),
      ariaLabel: z.string().optional(),
    })).optional(),
    linkCount: z.number().optional(),
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
  tutoring: OrchestrationSubsystems | null;
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
  const databaseAdapter = createPrismaSAMAdapter({ prisma: db });

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

  let tutoringOrchestration: OrchestrationSubsystems | null = null;
  try {
    const goalStore = createPrismaGoalStore();
    const planStore = createPrismaPlanStore();
    const toolStore = createPrismaToolStore();

    tutoringOrchestration = initializeOrchestration({
      goalStore,
      planStore,
      toolStore,
    });

    logger.info('[SAM_STREAM] Tutoring orchestration initialized');
  } catch (error) {
    logger.warn('[SAM_STREAM] Failed to initialize tutoring orchestration:', error);
    tutoringOrchestration = null;
  }

  logger.info('[SAM_STREAM] All subsystems initialized:', {
    engines: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
    qualityGates: true,
    pedagogyPipeline: true,
    memoryTracking: true,
    tutoringOrchestration: !!tutoringOrchestration,
  });

  subsystems = {
    orchestrator,
    config: samConfig,
    quality: qualityPipeline,
    pedagogy: pedagogyPipeline,
    mastery: masteryTracker,
    spacedRep: spacedRepScheduler,
    tutoring: tutoringOrchestration,
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
    // Authentication check - supports both regular users AND admin users
    const user = await currentUserOrAdmin();
    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Please sign in to use SAM' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, samMessagesLimiter, user.id);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
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

    const {
      message,
      sessionId: requestedSessionId,
      pageContext,
      formContext,
      conversationHistory,
      options,
    } = validation.data;

    const sessionId = requestedSessionId
      ?? buildSAMSessionId({
        userId: user.id,
        entityId: pageContext.entityId,
        pagePath: pageContext.path,
      });

    const integrationProfile = getSAMIntegrationProfile({
      goalPlanning: false, // Keep goal planning disabled for standard chat flow
      toolExecution: true,
      proactiveInterventions: true,
      selfEvaluation: true,
      learningAnalytics: true,
    });
    const capabilityRegistry = getSAMCapabilityRegistry(integrationProfile);

    // Initialize SAM Agentic Bridge for autonomous capabilities
    const agenticBridge = createSAMAgenticBridge({
      userId: user.id,
      courseId: pageContext.entityId,
      enableGoalPlanning: false, // Not needed for streaming response flow
      enableToolExecution: true,
      enableProactiveInterventions: true,
      enableSelfEvaluation: true,
      enableLearningAnalytics: true,
      integrationProfile,
      capabilityRegistry,
    });

    logger.info('[SAM_STREAM] Processing streaming request:', {
      userId: user.id,
      pageType: pageContext.type,
      hasForm: !!formContext,
      messageLength: message.length,
      agenticCapabilities: agenticBridge.getEnabledCapabilities(),
    });

    const subs = initializeSubsystems();

    // =========================================================================
    // TUTORING ORCHESTRATION - Plan-Driven Context Preparation
    // =========================================================================

    let tutoringContext: Awaited<ReturnType<typeof prepareTutoringContext>> = null;
    let planContextInjection: ReturnType<typeof injectPlanContext> = null;

    try {
      if (subs.tutoring) {
        tutoringContext = await prepareTutoringContext(
          user.id,
          sessionId,
          message,
          {
            planId: pageContext.entityId,
            goalId: undefined,
          }
        );

        if (tutoringContext) {
          planContextInjection = injectPlanContext(tutoringContext);

          logger.debug('[SAM_STREAM] Tutoring context prepared:', {
            hasActivePlan: !!tutoringContext.activePlan,
            currentStepId: tutoringContext.currentStep?.id,
            stepObjectivesCount: tutoringContext.stepObjectives?.length || 0,
            hasInjection: !!planContextInjection,
          });
        }
      }
    } catch (error) {
      logger.warn('[SAM_STREAM] Failed to prepare tutoring context:', error);
    }

    // Build tool awareness summary for prompt injection
    let toolsSummary: string | undefined;
    try {
      const tooling = await ensureToolingInitialized();
      const allTools = await tooling.toolRegistry.listTools({
        enabled: true,
        deprecated: false,
      });

      if (allTools.length > 0) {
        const toolCategories = new Map<string, string[]>();
        for (const tool of allTools) {
          const category = tool.category || 'other';
          if (!toolCategories.has(category)) {
            toolCategories.set(category, []);
          }
          toolCategories.get(category)!.push(tool.name);
        }

        const categoryLines: string[] = [];
        for (const [category, tools] of toolCategories) {
          categoryLines.push(`- ${category}: ${tools.join(', ')}`);
        }

        toolsSummary = [
          `Available Mentor Tools (${allTools.length} total):`,
          ...categoryLines,
          '',
          'You have access to these tools and can use them when appropriate to help the learner.',
        ].join('\n');
      }
    } catch (error) {
      logger.warn('[SAM_STREAM] Failed to build tools summary:', error);
    }

    // Build memory summary for prompt injection
    let memorySummary: string | undefined;
    let reviewSummary: string | undefined;
    let agenticMemorySnippets: string[] = [];
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

      try {
        const memorySystem = getAgenticMemorySystem();
        const courseIdForMemory = pageContext.entityType === 'course'
          ? pageContext.entityId
          : pageContext.parentEntityId;

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
        logger.warn('[SAM_STREAM] Failed to retrieve agentic memory:', error);
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

        logger.debug('[SAM_STREAM] Plan context injected into prompt:', {
          additionsCount: planContextInjection.systemPromptAdditions.length,
        });
      }
    }

    // Inject tools summary into memory summary so SAM knows its available tools
    if (toolsSummary) {
      memorySummary = memorySummary
        ? `${memorySummary}\n\n${toolsSummary}`
        : toolsSummary;

      logger.debug('[SAM_STREAM] Tools summary injected into prompt:', {
        summary: toolsSummary.substring(0, 100) + '...',
      });
    }

    // Build entity context - use client data if available, otherwise fetch from database
    const hasClientEntityData = !!pageContext.entityData?.title;
    let entityContext: Awaited<ReturnType<typeof buildEntityContext>>;

    if (hasClientEntityData && pageContext.entityData) {
      // Client provided entity data - use it directly (faster, no DB call needed)
      const clientData = pageContext.entityData;
      const entityType = pageContext.entityType || 'course';

      logger.debug('[SAM_STREAM] Using client-provided entity data:', {
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

    logger.debug('[SAM_STREAM] Entity context ready:', {
      type: entityContext.type,
      hasEntity: entityContext.type !== 'none',
      summaryLength: entityContext.summary.length,
      source: hasClientEntityData ? 'client' : 'database',
    });

    // Build form summary for context
    const formSummary = buildFormSummary(formContext?.fields);

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
          toolsSummary, // Available mentor tools
          // Include specific entity data for easy access
          courseTitle: entityContext.course?.title,
          courseDescription: entityContext.course?.description,
          chapterTitle: entityContext.chapter?.title,
          sectionTitle: entityContext.section?.title,
          sectionContent: entityContext.section?.content,
          // Include page links for navigation context
          pageLinks: pageContext.links?.slice(0, 20),
          pageLinkCount: pageContext.linkCount,
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
      metadata: {
        sessionId,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        version: '1.0.0',
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
            subsystems: ['unifiedBlooms', 'qualityGates', 'pedagogy', 'memory', 'tutoring'],
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

          // =========================================================================
          // AGENTIC TOOL CALLING - LLM-DRIVEN EXECUTION
          // =========================================================================

          const baseResponse = result.response?.message || '';
          let responseText = baseResponse;
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
              ai: subs.config.ai,
              message,
              tools: availableTools,
              context: {
                pageType: pageContext.type,
                pagePath: pageContext.path,
                entitySummary: entityContext.summary,
                memorySummary,
                tutoringContext: tutoringContext ? {
                  activePlanTitle: tutoringContext.activeGoal?.title
                    ?? `Plan ${tutoringContext.activePlan?.id ?? 'Unknown'}`,
                  currentStepTitle: tutoringContext.currentStep?.title,
                  currentStepType: tutoringContext.currentStep?.type,
                  stepObjectives: tutoringContext.stepObjectives,
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
            logger.warn('[SAM_STREAM] Tool execution planning failed:', error);
          }

          // =========================================================================
          // TUTORING ORCHESTRATION - Full Loop Processing
          // =========================================================================

          let orchestrationData: OrchestrationResponseData | null = null;
          if (tutoringContext && baseResponse) {
            try {
              const loopResult = await processTutoringLoop(
                user.id,
                sessionId,
                message,
                baseResponse,
                {
                  planId: pageContext.entityId,
                  goalId: undefined,
                }
              );

              orchestrationData = formatOrchestrationResponse(loopResult);

              if (loopResult?.transition) {
                logger.info('[SAM_STREAM] Step transition occurred:', {
                  transitionType: loopResult.transition.transitionType,
                  planComplete: loopResult.transition.planComplete,
                  hasNextStep: !!loopResult.transition.currentStep,
                });
              }
            } catch (error) {
              logger.warn('[SAM_STREAM] Failed to process tutoring loop:', error);
            }
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

              logger.debug('[SAM_STREAM] Agentic confidence scored:', {
                level: confidenceResult.level,
                score: confidenceResult.overallScore,
              });
            } catch (confidenceError) {
              logger.warn('[SAM_STREAM] Agentic confidence scoring failed:', confidenceError);
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
              logger.warn('[SAM_STREAM] Response verification failed:', error);
            }
          }

          // Run Safety Validation on response text
          let safetyResult: { passed: boolean; suggestions: string[] } | null = null;
          if (responseText.length > 0) {
            try {
              const isSafe = await isFeedbackTextSafe(responseText);
              const suggestions = isSafe ? [] : getFeedbackSuggestions(responseText);
              safetyResult = { passed: isSafe, suggestions };
              if (!isSafe) {
                responseGated = true;
                responseText = "I can't provide that response safely. Please rephrase or ask a different question.";
                logger.warn('[SAM_STREAM] Safety check flagged issues:', { suggestionCount: suggestions.length });
              }
            } catch (safetyError) {
              logger.warn('[SAM_STREAM] Safety validation failed:', safetyError);
              safetyResult = { passed: true, suggestions: [] }; // Fail open
            }
          }

          // Record session for learning analytics
          let sessionRecorded = false;
          const topicId = pageContext.entityId || 'unknown';
          const sessionDuration = (Date.now() - startTime) / 1000;

          try {
            await agenticBridge.recordSession({
              topicId,
              duration: Math.max(1, Math.round(sessionDuration)),
              questionsAnswered: 1,
              correctAnswers: agenticConfidence?.level === 'HIGH' ? 1 : 0,
              conceptsCovered: [
                entityContext.course?.title,
                entityContext.chapter?.title,
                entityContext.section?.title,
              ].filter((t): t is string => !!t),
            });

            sessionRecorded = true;
            logger.debug('[SAM_STREAM] Agentic session recorded:', {
              topicId,
              duration: sessionDuration,
            });
          } catch (sessionError) {
            logger.warn('[SAM_STREAM] Agentic session recording failed:', sessionError);
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
              logger.info('[SAM_STREAM] Agentic interventions triggered:', {
                count: interventions.length,
                types: interventions.map(i => i.type),
              });
            }
          } catch (interventionError) {
            logger.warn('[SAM_STREAM] Agentic intervention check failed:', interventionError);
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
              logger.warn('[SAM_STREAM] Failed to dispatch intervention notifications:', error);
            }
          }

          // Persist agentic memory embeddings for retrieval
          try {
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
          } catch (error) {
            logger.warn('[SAM_STREAM] Agentic memory persistence failed:', error);
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
            orchestration: orchestrationData ?? undefined,
          };

          controller.enqueue(encoder.encode(`event: insights\ndata: ${JSON.stringify(insights)}\n\n`));

          // Stream the response content in chunks
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
                safetyValidation: !!safetyResult,
                agenticBridge: true, // Always enabled now
                agenticConfidence: !!agenticConfidence,
                agenticVerification: !!verificationResult,
                agenticResponseGated: responseGated,
                agenticSession: sessionRecorded,
                agenticInterventions: interventions.length > 0,
                agenticToolExecution: !!toolExecution,
                tutoringOrchestration: !!orchestrationData,
              },
              toolExecution: toolExecution ?? undefined,
              orchestration: orchestrationData ?? undefined,
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
        ...rateLimitResult.headers,
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

/**
 * Build a human-readable summary from client-provided entity data
 */
function buildClientEntitySummary(
  entityData: NonNullable<(typeof StreamRequestSchema)['_output']['pageContext']['entityData']>,
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
