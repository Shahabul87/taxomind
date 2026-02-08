/**
 * Validation Stage
 *
 * Parses and validates the incoming request body using Zod,
 * classifies user intent, initializes the agentic bridge,
 * and produces the initial PipelineContext.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { buildSAMSessionId } from '@/lib/sam/session-utils';
import { classifyIntent } from '@/lib/sam/agentic-chat/types';
import {
  createSAMAgenticBridge,
} from '@/lib/sam/agentic-bridge';
import {
  getSAMIntegrationProfile,
  getSAMCapabilityRegistry,
} from '@/lib/sam/integration-profile';
import { SAM_MODE_IDS } from '@/lib/sam/modes';
import { classifyModeRelevanceAsync } from '@/lib/sam/modes/intent-classifier-async';
import type { PipelineContext, StageResult } from './types';
import type { AuthStageResult } from './auth-stage';

// =============================================================================
// REQUEST SCHEMA
// =============================================================================

export const UnifiedRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  mode: z.enum(SAM_MODE_IDS).optional().default('general-assistant'),
  orchestrationContext: z.object({
    planId: z.string().optional(),
    goalId: z.string().optional(),
    autoDetectPlan: z.boolean().optional().default(true),
  }).optional(),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
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
      chapterId: z.string().optional(),
      chapterTitle: z.string().optional(),
      content: z.string().nullable().optional(),
      contentType: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
    }).optional(),
    entityType: z.enum(['course', 'chapter', 'section']).optional(),
  }).optional(),
  formContext: z.object({
    formId: z.string().optional(),
    formName: z.string().optional(),
    fields: z.record(z.any()).optional(),
    isDirty: z.boolean().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  options: z.object({
    engines: z.array(z.string()).optional(),
    stream: z.boolean().optional(),
  }).optional(),
  // Tool conversation context for continuing conversational tool interactions
  toolConversation: z.object({
    conversationId: z.string(),
    toolId: z.string(),
    // Stateless continuation data (serverless-friendly)
    currentStep: z.string().optional(),
    collected: z.record(z.unknown()).optional(),
  }).optional(),
});

// =============================================================================
// VALIDATION STAGE
// =============================================================================

export async function runValidationStage(
  body: unknown,
  auth: AuthStageResult,
  startTime: number,
): Promise<StageResult<PipelineContext>> {
  const validation = UnifiedRequestSchema.safeParse(body);

  if (!validation.success) {
    logger.warn('[SAM_UNIFIED] Invalid request:', validation.error.errors);
    return {
      response: NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 },
      ),
    };
  }

  const {
    message,
    sessionId: requestedSessionId,
    orchestrationContext,
    pageContext: rawPageContext,
    formContext,
    conversationHistory,
    options,
    toolConversation,
  } = validation.data;

  const pageContext = rawPageContext ?? { type: 'general' as const, path: '/unknown' };

  const sessionId =
    requestedSessionId ??
    buildSAMSessionId({
      userId: auth.user.id,
      entityId: pageContext.entityId,
      pagePath: pageContext.path,
    });

  const modeId = validation.data.mode ?? 'general-assistant';

  // Classify intent (lightweight, no LLM call)
  const classifiedIntent = classifyIntent(message);
  logger.debug('[SAM_UNIFIED] Intent classified:', {
    intent: classifiedIntent.intent,
    confidence: classifiedIntent.confidence,
    shouldUseTool: classifiedIntent.shouldUseTool,
    shouldCheckGoals: classifiedIntent.shouldCheckGoals,
  });

  // Classify mode relevance (Tier 1 heuristic + Tier 2 AI fallback for ambiguous scores)
  // sessionId enables per-session budget limiting for Tier 2 AI calls
  const modeClassification = await classifyModeRelevanceAsync(
    message,
    modeId,
    pageContext.type,
    {
      conversationHistory: conversationHistory as Array<{ role: string; content: string }>,
      enableAIFallback: true,
      sessionId,
    },
  );
  if (modeClassification.shouldSuggestSwitch) {
    logger.info('[SAM_UNIFIED] Mode switch suggested:', {
      currentMode: modeId,
      suggestedMode: modeClassification.suggestedMode,
      currentScore: modeClassification.currentModeScore,
      suggestedScore: modeClassification.suggestedModeScore,
    });
  }

  // Initialize agentic bridge once — it flows through the whole pipeline
  const integrationProfile = getSAMIntegrationProfile({
    goalPlanning: true,
    toolExecution: true,
    proactiveInterventions: true,
    selfEvaluation: true,
    learningAnalytics: true,
  });
  const capabilityRegistry = getSAMCapabilityRegistry(integrationProfile);

  const agenticBridge = createSAMAgenticBridge({
    userId: auth.user.id,
    courseId: pageContext.entityId,
    enableGoalPlanning: true,
    enableToolExecution: true,
    enableProactiveInterventions: true,
    enableSelfEvaluation: true,
    enableLearningAnalytics: true,
    integrationProfile,
    capabilityRegistry,
  });

  logger.debug('[SAM_UNIFIED] Agentic bridge initialized:', {
    userId: auth.user.id,
    capabilities: agenticBridge.getEnabledCapabilities(),
  });

  // Build the initial PipelineContext with default/empty values
  const ctx: PipelineContext = {
    // Auth
    user: auth.user,
    rateLimitHeaders: auth.rateLimitHeaders,

    // Request
    message,
    sessionId,
    outputMode: 'json',
    pageContext: pageContext as PipelineContext['pageContext'],
    formContext: formContext as PipelineContext['formContext'],
    conversationHistory,
    orchestrationContext,
    options,
    modeId,

    // Tool conversation for continuation
    toolConversation,

    // Gathered context (populated by later stages)
    entityContext: { type: 'none', summary: '' },
    entitySummary: '',
    contextConfidence: 0,
    classifiedIntent,
    modeClassification,

    // Agentic bridge
    agenticBridge,

    // Orchestration (populated by later stages)
    orchestrationResult: null,
    bloomsAnalysis: null,
    bloomsOutput: null,
    qualityResult: null,
    pedagogyResult: null,
    memoryUpdate: null,
    enginesToRun: [],

    // Tutoring (populated by later stages)
    tutoringContext: null,
    planContextInjection: null,
    orchestrationData: null,
    memorySessionContext: null,
    sessionResumptionContext: null,

    // Tool execution (populated by later stages)
    toolExecution: null,

    // Agentic outputs (populated by later stages)
    responseText: '',
    agenticConfidence: null,
    verificationResult: null,
    safetyResult: null,
    responseGated: false,
    sessionRecorded: false,
    agenticGoalContext: null,
    agenticSkillUpdate: null,
    agenticRecommendations: null,

    // Interventions (populated by later stages)
    interventions: [],
    interventionResults: [],
    proactiveData: null,

    // Timing
    startTime,
  };

  return { ctx };
}
