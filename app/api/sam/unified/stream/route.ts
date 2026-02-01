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
  createDefaultContext,
  type SAMContext,
  type SAMPageType,
  type SAMFormField,
  type BloomsEngineOutput,
} from '@sam-ai/core';

// Import entity context service for REAL context awareness
import { buildFormSummary } from '@/lib/sam/entity-context';
import { gatherPageContext } from '@/lib/sam/page-context-engine';

// Import context gathering for enriched snapshot summaries
import { getContextSummaryForRoute } from '@/lib/sam/context-gathering-integration';

// Import rate limiter for usage caps
import { applyRateLimit, samMessagesLimiter } from '@/lib/sam/config/sam-rate-limiter';

// Import Quality Gates Pipeline for content validation
import {
  type GeneratedContent,
  type ValidationResult as QualityValidationResult,
} from '@sam-ai/quality';

// Import Pedagogy Pipeline for educational effectiveness
import {
  type PedagogicalPipelineResult,
} from '@sam-ai/pedagogy';

// Import Memory Integration for mastery tracking
import {
  buildMemorySummary,
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
// True streaming adapter
import { streamChat } from '@/lib/sam/integration-adapters';
import { TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import {
  getSAMIntegrationProfile,
  getSAMCapabilityRegistry,
} from '@/lib/sam/integration-profile';
import {
  prepareTutoringContext,
  injectPlanContext,
  processTutoringLoop,
  formatOrchestrationResponse,
  type OrchestrationResponseData,
} from '@/lib/sam/orchestration-integration';
import type { VerificationResult } from '@sam-ai/agentic';
import {
  extractConceptsFromResponse,
  addConceptsToKnowledgeGraph,
  recordConceptInteraction,
} from '@/lib/sam/services/knowledge-graph-builder';

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
// SHARED SUBSYSTEM INITIALIZATION
// ============================================================================

import { initializeSubsystems } from '@/lib/sam/pipeline/subsystem-init';

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
    case 'course-learning':
    case 'section-learning':
    case 'chapter-learning':
      return ENGINE_PRESETS.learning;
    case 'courses-list':
    case 'teacher-dashboard':
    case 'user-dashboard':
    case 'dashboard':
      return ENGINE_PRESETS.quick;
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
      goalPlanning: true, // Goal planning enabled - users can create goals through SAM conversations
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
      enableGoalPlanning: true, // Enable goal planning for chat flow
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

    const subs = await initializeSubsystems();

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
        const memorySystem = await getAgenticMemorySystem();
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

    // Build entity context via Page Context Engine (single responsibility, fail-loud)
    const pageContextResult = await gatherPageContext({
      pageType: pageContext.type,
      entityId: pageContext.entityId,
      parentEntityId: pageContext.parentEntityId,
      grandParentEntityId: pageContext.grandParentEntityId,
      userId: user.id,
      clientEntityData: pageContext.entityData as unknown as Record<string, unknown> | undefined,
      clientEntityType: pageContext.entityType,
    });
    const entityContext = pageContextResult.entityContext;

    logger.info('[SAM_STREAM] Page context gathered:', pageContextResult.diagnostics);

    // Build form summary for context
    const formSummary = buildFormSummary(formContext?.fields);

    // Fetch enriched context snapshot summary (from context gathering engine)
    let contextSnapshotSummary: {
      pageSummary: string;
      formSummary: string;
      contentSummary: string;
      navigationSummary: string;
    } | null = null;
    try {
      contextSnapshotSummary = await getContextSummaryForRoute(user.id);
    } catch {
      // Non-critical — continue without snapshot context
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
          entitySummary: pageContextResult.entitySummary,
          entityConfidence: pageContextResult.contextConfidence,
          formSummary,
          memorySummary, // Clean: learning state only, no entity/form data mixed in
          reviewSummary,
          toolsSummary,
          // Enriched snapshot context (from context gathering engine)
          contextSnapshotPageSummary: contextSnapshotSummary?.pageSummary,
          contextSnapshotFormSummary: contextSnapshotSummary?.formSummary,
          contextSnapshotContentSummary: contextSnapshotSummary?.contentSummary,
          contextSnapshotNavigationSummary: contextSnapshotSummary?.navigationSummary,
          courseTitle: entityContext.course?.title,
          courseDescription: entityContext.course?.description,
          chapterTitle: entityContext.chapter?.title,
          sectionTitle: entityContext.section?.title,
          sectionContent: entityContext.section?.content,
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
            streaming: true,
          })}\n\n`));

          // =====================================================================
          // PHASE 1: TRUE STREAMING — pipe real AI tokens to the client
          // =====================================================================

          const systemPrompt = buildStreamingSystemPrompt({
            entityContext,
            memorySummary,
            reviewSummary,
            formSummary,
            toolsSummary,
            contextSnapshotSummary,
            planContextInjection,
            pageContext,
            userName: user.name ?? undefined,
          });

          const chatMessages = [
            ...(conversationHistory ?? []).map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: message },
          ];

          let responseText = '';
          let streamErrored = false;

          try {
            const totalTimeout = setTimeout(() => {
              if (!streamErrored) {
                streamErrored = true;
                logger.warn('[SAM_STREAM] Stream total timeout reached');
              }
            }, TIMEOUT_DEFAULTS.STREAM_TOTAL);

            for await (const chunk of streamChat({
              messages: chatMessages,
              systemPrompt,
              temperature: 0.7,
              maxTokens: 4096,
            })) {
              if (streamErrored) break;
              if (chunk.content) {
                responseText += chunk.content;
                controller.enqueue(encoder.encode(
                  `event: content\ndata: ${JSON.stringify({ text: chunk.content })}\n\n`
                ));
              }
              if (chunk.done) break;
            }

            clearTimeout(totalTimeout);
          } catch (streamError) {
            streamErrored = true;
            logger.error('[SAM_STREAM] Streaming failed, using fallback:', streamError);

            // Fallback: run orchestrator for full response
            if (responseText.length === 0) {
              const fallbackResult = await subs.orchestrator.orchestrate(samContext, message, {
                engines: enginesToRun,
              });
              responseText = fallbackResult.response?.message ?? '';

              // Send accumulated fallback as a single content event
              if (responseText) {
                controller.enqueue(encoder.encode(
                  `event: content\ndata: ${JSON.stringify({ text: responseText })}\n\n`
                ));
              }
            } else {
              // Partial content — notify client
              controller.enqueue(encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  error: 'Stream interrupted',
                  partialContent: true,
                  recoverable: true,
                })}\n\n`
              ));
            }
          }

          // =====================================================================
          // PHASE 2: DEFERRED ANALYSIS — runs after all tokens are sent
          // =====================================================================

          // Run orchestrator for analysis engines only (skip 'response')
          const analysisEngines = enginesToRun.filter(e => e !== 'response');
          const result = await subs.orchestrator.orchestrate(samContext, message, {
            engines: analysisEngines.length > 0 ? analysisEngines : ['context'],
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

          // responseText already holds the streamed AI response from Phase 1.
          // The analysis-only orchestration has no 'response' engine output.
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
          if (tutoringContext && responseText) {
            try {
              const loopResult = await processTutoringLoop(
                user.id,
                sessionId,
                message,
                responseText,
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
                responseText = 'I cannot provide that response safely. Please rephrase or ask a different question.';
                logger.warn('[SAM_STREAM] Safety check flagged issues:', { suggestionCount: suggestions.length });
              }
            } catch (safetyError) {
              logger.warn('[SAM_STREAM] Safety validation failed:', safetyError);
              safetyResult = { passed: true, suggestions: [] }; // Fail open
            }
          }

          // If response was gated (verification or safety), notify client to replace
          // the already-streamed content with the safe fallback message.
          if (responseGated) {
            controller.enqueue(encoder.encode(
              `event: content-replace\ndata: ${JSON.stringify({ text: responseText })}\n\n`
            ));
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

          // Extract concepts from response and add to knowledge graph
          let knowledgeGraphResult: { conceptsExtracted: number; entitiesCreated: number; relationshipsCreated: number } | undefined;
          if (responseText) {
            try {
              const concepts = extractConceptsFromResponse(responseText, message);
              if (concepts.length > 0) {
                const courseIdForKg = entityContext.course?.id
                  ?? entityContext.chapter?.courseId
                  ?? entityContext.section?.courseId
                  ?? (pageContext.entityType === 'course' ? pageContext.entityId : undefined);

                knowledgeGraphResult = await addConceptsToKnowledgeGraph(user.id, concepts, courseIdForKg);
                logger.debug('[SAM_STREAM] Knowledge graph updated:', {
                  conceptsExtracted: knowledgeGraphResult.conceptsExtracted,
                  entitiesCreated: knowledgeGraphResult.entitiesCreated,
                  relationshipsCreated: knowledgeGraphResult.relationshipsCreated,
                });
              }
            } catch (kgError) {
              logger.warn('[SAM_STREAM] Failed to update knowledge graph:', kgError);
              // Continue without updating - non-blocking
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
              knowledgeGraph: knowledgeGraphResult ?? undefined,
            },
            orchestration: orchestrationData ?? undefined,
          };

          controller.enqueue(encoder.encode(`event: insights\ndata: ${JSON.stringify(insights)}\n\n`));

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
 * Build a system prompt for the streaming path.
 *
 * Mirrors the ResponseEngine's `buildSystemPrompt()` so the streamed AI
 * response has the same context awareness as the orchestrated path. Sections:
 *   1. Identity & page context (entity data, breadcrumb)
 *   2. Snapshot context (auto-captured DOM content, navigation)
 *   3. Form context (inline form fields)
 *   4. Learning state (memory, review schedule, plan context)
 *   5. Tool awareness
 *   6. Response guidelines
 */
function buildStreamingSystemPrompt(opts: {
  entityContext: {
    summary?: string;
    course?: { title?: string; description?: string | null };
    chapter?: { title?: string };
    section?: { title?: string; content?: string | null };
  };
  memorySummary?: string;
  reviewSummary?: string;
  formSummary?: string;
  toolsSummary?: string;
  contextSnapshotSummary: {
    pageSummary: string;
    formSummary: string;
    contentSummary: string;
    navigationSummary: string;
  } | null;
  planContextInjection: { systemPromptAdditions?: string[] } | null;
  pageContext: { type: string; path: string; links?: Array<{ href: string; text?: string }> };
  userName?: string;
}): string {
  const {
    entityContext,
    memorySummary,
    reviewSummary,
    formSummary,
    toolsSummary,
    contextSnapshotSummary,
    pageContext,
    userName,
  } = opts;

  // ---- Section 1: Identity & page context ----
  const parts: string[] = [
    'You are SAM, an intelligent AI tutor assistant for an educational platform. Be friendly and professional.',
    '',
    '## PAGE CONTEXT \u2014 VERIFIED DATA',
    `You are currently on: ${pageContext.type} page`,
    `Path: ${pageContext.path}`,
  ];

  if (userName) {
    parts.push(`Student name: ${userName}`);
  }

  // Entity data (highest priority — placed first for maximum LLM attention)
  const entitySummary = entityContext.summary;
  const hasEntityData = entitySummary
    && entitySummary !== 'No specific entity context available.'
    && entitySummary.length > 0;

  if (hasEntityData) {
    parts.push('', '### Database-Verified Information', entitySummary);
  } else if (entityContext.course?.title) {
    parts.push(`Course: ${entityContext.course.title}`);
  }

  // ---- Section 2: Snapshot context (auto-captured page content) ----
  const hasSnapshotContent = contextSnapshotSummary?.contentSummary
    && contextSnapshotSummary.contentSummary !== 'No visible content captured.'
    && contextSnapshotSummary.contentSummary.length > 0;

  if (hasSnapshotContent) {
    if (contextSnapshotSummary?.pageSummary) {
      parts.push('', '### Current Page Info', contextSnapshotSummary.pageSummary);
    }
    parts.push('', '### Visible Page Content', contextSnapshotSummary!.contentSummary);
    if (contextSnapshotSummary?.navigationSummary) {
      parts.push('', '### Available Navigation', contextSnapshotSummary.navigationSummary);
    }
  }

  // ---- Section 3: Form context ----
  const snapshotForm = contextSnapshotSummary?.formSummary;
  if (snapshotForm && snapshotForm !== 'No forms on this page.') {
    parts.push('', '### Form Fields', snapshotForm);
  } else if (formSummary && formSummary !== 'No form data available on this page.') {
    parts.push('', '### Form Fields', formSummary);
  }

  // Critical instruction: prevent "I don't have access" responses
  if (hasEntityData || hasSnapshotContent) {
    parts.push(
      '',
      'IMPORTANT: The information above comes from the database and the actual page content visible to the user. When the user asks about their courses, content, pages, or anything on their screen, USE THIS DATA. Do NOT say "I don\'t have access to that information" \u2014 you DO have access, the data is above.',
    );
  }

  // ---- Section 4: Learning state ----
  if (memorySummary || reviewSummary) {
    parts.push('', '## Learning State');
    if (memorySummary) parts.push(memorySummary);
    if (reviewSummary) parts.push('', '### Review Schedule', reviewSummary);
  }

  // ---- Section 5: Tool awareness ----
  if (toolsSummary) {
    parts.push('', '## Tools', toolsSummary);
  }

  // ---- Section 6: Response guidelines ----
  parts.push(
    '',
    '## Response Guidelines',
    '1. **USE THE PAGE DATA ABOVE** \u2014 reference actual visible content, courses, chapters, or section details',
    '2. For GENERATION requests: create content SPECIFIC to the current context',
    '3. Be specific and actionable, use markdown formatting',
    '4. Respond concisely — the student is reading this in a chat panel',
  );

  return parts.join('\n');
}

