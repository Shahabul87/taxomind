/**
 * Streaming Adapter
 *
 * Converts PipelineContext into SSE (Server-Sent Events) output.
 * Used by the streaming route to wrap pipeline stages with SSE encoding.
 *
 * SSE Event Types:
 * - `start`           : Initial metadata (engines, subsystems, timestamp)
 * - `content`         : AI response token chunks
 * - `content-replace` : Replaces streamed content (safety/verification gating)
 * - `insights`        : Analysis results (blooms, quality, pedagogy, agentic)
 * - `suggestions`     : Follow-up suggestion chips
 * - `actions`         : Actionable items from the response
 * - `done`            : Completion metadata
 * - `error`           : Error information
 */

import { logger } from '@/lib/logger';
import { streamChat } from '@/lib/sam/integration-adapters';
import { TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { isDegraded, getDegradedResponse } from '@/lib/sam/degraded-responses';
import { SAMServiceUnavailableError } from '@/lib/sam/utils/error-handler';
import type { PipelineContext } from './types';
import type { SubsystemBundle } from './subsystem-init';

// =============================================================================
// SSE HELPERS
// =============================================================================

const encoder = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// =============================================================================
// ENGINE CONFIG → BEHAVIORAL INSTRUCTIONS
// =============================================================================

/**
 * Transforms mode engineConfig key-value pairs into natural language
 * AI behavioral instructions that shape the response style, format,
 * and pedagogical approach.
 */
function buildEngineConfigInstructions(
  engineConfig: Record<string, unknown> | undefined,
): string | null {
  if (!engineConfig || Object.keys(engineConfig).length === 0) return null;

  const instructions: string[] = [];

  // --- Response length ---
  const maxResponseLength = engineConfig.maxResponseLength as string | undefined;
  if (maxResponseLength === 'short') {
    instructions.push('Keep responses concise, under 200 words. Use bullet points where possible.');
  } else if (maxResponseLength === 'long') {
    instructions.push('Provide comprehensive, detailed responses with examples and thorough explanations.');
  }
  // 'medium' is default behavior — no instruction needed

  // --- Output format ---
  const outputFormat = engineConfig.outputFormat as string | undefined;
  if (outputFormat === 'structured') {
    instructions.push('Structure your response with clear headings and organized sections.');
  } else if (outputFormat === 'bullet-points') {
    instructions.push('Present information as concise bullet points.');
  } else if (outputFormat === 'prose') {
    instructions.push('Write in well-structured prose paragraphs.');
  }
  // 'conversational' is default behavior — no instruction needed

  // --- Content focus ---
  const contentFocus = engineConfig.contentFocus as string | undefined;
  if (contentFocus === 'explanation') {
    instructions.push('Focus on clear explanations. Break down concepts step by step.');
  } else if (contentFocus === 'examples') {
    instructions.push('Prioritize concrete examples over abstract explanations.');
  } else if (contentFocus === 'resources') {
    instructions.push('Focus on recommending useful learning resources and references.');
  } else if (contentFocus === 'relationships') {
    instructions.push('Focus on relationships between concepts, prerequisites, and dependencies.');
  } else if (contentFocus === 'multimedia-suggestions') {
    instructions.push('Suggest multimedia resources (videos, diagrams, interactive tools) alongside explanations.');
  } else if (contentFocus === 'personalized') {
    instructions.push('Tailor content to the learner\u2019s demonstrated level and preferences.');
  } else if (contentFocus === 'creation') {
    instructions.push('Focus on creating original educational content aligned with learning objectives.');
  }
  // 'general' is default behavior — no instruction needed

  // --- Questioning style ---
  const questioningStyle = engineConfig.questioningStyle as string | undefined;
  if (questioningStyle === 'guided') {
    instructions.push('Use guiding questions to lead the learner to discover answers themselves.');
  }

  // --- Direct answer limit ---
  const maxDirectAnswers = engineConfig.maxDirectAnswers;
  if (maxDirectAnswers === 0) {
    instructions.push('IMPORTANT: Do NOT give direct answers. Always respond with guiding questions that help the learner think through the problem.');
  }

  // --- Adaptation strategy ---
  const adaptationStrategy = engineConfig.adaptationStrategy as string | undefined;
  if (adaptationStrategy === 'pace') {
    instructions.push('Adapt the response pace. Check understanding before introducing new concepts.');
  } else if (adaptationStrategy === 'learner-level') {
    instructions.push('Adjust complexity to match the learner\u2019s demonstrated level.');
  } else if (adaptationStrategy === 'depth') {
    instructions.push('Adjust the depth of explanation based on the learner\u2019s responses.');
  } else if (adaptationStrategy === 'difficulty') {
    instructions.push('Adapt difficulty level based on learner performance.');
  }
  // 'auto' is default behavior — no instruction needed

  // --- Encouragement ---
  const encouragementLevel = engineConfig.encouragementLevel as string | undefined;
  if (encouragementLevel === 'high') {
    instructions.push('Be encouraging. Acknowledge effort and progress explicitly.');
  }

  // --- Reflection ---
  if (engineConfig.includeReflection === true) {
    instructions.push('Include reflection prompts that encourage the learner to think about their learning process.');
  }

  // --- Reflection prompts (metacognition) ---
  if (engineConfig.reflectionPrompts === true) {
    instructions.push('Include metacognitive reflection prompts (e.g., "What strategies worked for you?", "How confident do you feel about this concept?").');
  }

  // --- Self-assessment ---
  if (engineConfig.selfAssessment === true) {
    instructions.push('Include self-assessment opportunities so the learner can gauge their own understanding.');
  }

  // --- Rubric generation ---
  if (engineConfig.rubricGeneration === true) {
    instructions.push('Include clear rubrics with specific criteria for assessments.');
  }

  // --- Hint system ---
  if (engineConfig.hintSystem === true) {
    instructions.push('Provide graduated hints that scaffold understanding without giving away the answer directly.');
  }

  // --- Step-by-step ---
  if (engineConfig.stepByStep === true) {
    instructions.push('Include step-by-step worked examples to demonstrate problem-solving processes.');
  }

  // --- Adaptive difficulty ---
  if (engineConfig.adaptiveDifficulty === true) {
    instructions.push('Start with easier concepts and gradually increase difficulty based on demonstrated understanding.');
  }

  // --- Adjust difficulty ---
  if (engineConfig.adjustDifficulty === true) {
    instructions.push('Dynamically adjust the difficulty of content based on learner responses.');
  }

  // --- Bloom's alignment ---
  if (engineConfig.bloomsAlignment === true) {
    instructions.push('Align content with Bloom\u2019s Taxonomy levels appropriate to the learning objectives.');
  }

  // --- Multi-framework analysis ---
  if (engineConfig.multiFramework === true) {
    const frameworks = engineConfig.frameworks;
    if (Array.isArray(frameworks) && frameworks.length > 0) {
      instructions.push(`Analyze content through multiple frameworks: ${frameworks.join(', ')}.`);
    } else {
      instructions.push('Apply multiple pedagogical frameworks in your analysis.');
    }
  }

  // --- Scaffolding ---
  if (engineConfig.gradualRelease === true) {
    instructions.push('Use a gradual release model: demonstrate first, then guide, then let the learner try independently.');
  }
  if (engineConfig.evaluatePrerequisites === true) {
    instructions.push('Evaluate prerequisite knowledge before introducing new concepts.');
  }

  // --- Plan format ---
  const planFormat = engineConfig.planFormat as string | undefined;
  if (planFormat === 'weekly') {
    instructions.push('Organize study plans in a weekly format with clear daily goals.');
  }

  // --- Detailed feedback ---
  if (engineConfig.detailedFeedback === true) {
    instructions.push('Provide detailed, constructive feedback on each response or submission.');
  }

  if (instructions.length === 0) return null;
  return instructions.join('\n');
}

// =============================================================================
// BUILD STREAMING SYSTEM PROMPT
// =============================================================================

/**
 * Build a system prompt for the streaming path that mirrors the
 * ResponseEngine context awareness.
 */
function buildStreamingSystemPrompt(ctx: PipelineContext): string {
  const parts: string[] = [
    'You are SAM, an intelligent AI tutor assistant for an educational platform. Be friendly and professional.',
    '',
    '## PAGE CONTEXT \u2014 VERIFIED DATA',
    `You are currently on: ${ctx.pageContext.type} page`,
    `Path: ${ctx.pageContext.path}`,
  ];

  if (ctx.user.name) {
    parts.push(`Student name: ${ctx.user.name}`);
  }

  // Entity data
  const entitySummary = ctx.entityContext.summary;
  const hasEntityData =
    entitySummary &&
    entitySummary !== 'No specific entity context available.' &&
    entitySummary.length > 0;

  if (hasEntityData) {
    parts.push('', '### Database-Verified Information', entitySummary);
  } else if (ctx.entityContext.course?.title) {
    parts.push(`Course: ${ctx.entityContext.course.title}`);
  }

  // Snapshot context
  const snap = ctx.contextSnapshotSummary;
  const hasSnapshotContent =
    snap?.contentSummary &&
    snap.contentSummary !== 'No visible content captured.' &&
    snap.contentSummary.length > 0;

  if (hasSnapshotContent) {
    if (snap?.pageSummary) parts.push('', '### Current Page Info', snap.pageSummary);
    parts.push('', '### Visible Page Content', snap!.contentSummary);
    if (snap?.navigationSummary) parts.push('', '### Available Navigation', snap.navigationSummary);
  }

  // Form context
  const snapshotForm = snap?.formSummary;
  if (snapshotForm && snapshotForm !== 'No forms on this page.') {
    parts.push('', '### Form Fields', snapshotForm);
  } else if (ctx.formSummary && ctx.formSummary !== 'No form data available on this page.') {
    parts.push('', '### Form Fields', ctx.formSummary);
  }

  if (hasEntityData || hasSnapshotContent) {
    parts.push(
      '',
      'IMPORTANT: The information above comes from the database and the actual page content visible to the user. When the user asks about their courses, content, pages, or anything on their screen, USE THIS DATA. Do NOT say "I don\'t have access to that information" \u2014 you DO have access, the data is above.',
    );
  }

  // Learning state
  if (ctx.memorySummary || ctx.reviewSummary) {
    parts.push('', '## Learning State');
    if (ctx.memorySummary) parts.push(ctx.memorySummary);
    if (ctx.reviewSummary) parts.push('', '### Review Schedule', ctx.reviewSummary);
  }

  // Tool awareness
  if (ctx.toolsSummary) {
    parts.push('', '## Tools', ctx.toolsSummary);
  }

  // Mode behavioral instructions (from engineConfig)
  const configInstructions = buildEngineConfigInstructions(ctx.modeAnalytics?.engineConfig);
  if (configInstructions) {
    parts.push('', '## Mode Behavioral Instructions', configInstructions);
  }

  // Response guidelines
  parts.push(
    '',
    '## Response Guidelines',
    '1. **USE THE PAGE DATA ABOVE** \u2014 reference actual visible content, courses, chapters, or section details',
    '2. For GENERATION requests: create content SPECIFIC to the current context',
    '3. Be specific and actionable, use markdown formatting',
    '4. Respond concisely \u2014 the student is reading this in a chat panel',
  );

  return parts.join('\n');
}

// =============================================================================
// STREAMING PHASE 1: REAL AI TOKEN STREAMING
// =============================================================================

/**
 * Streams AI response tokens to the client via SSE.
 * Returns the accumulated response text.
 */
export async function streamAIResponse(
  ctx: PipelineContext,
  subsystems: SubsystemBundle,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<string> {
  // Check for degraded mode before attempting to stream
  if (isDegraded()) {
    logger.warn('[SAM_STREAM] Degraded mode active — emitting cached response');
    const degraded = getDegradedResponse(
      ctx.classifiedIntent.intent,
      ctx.modeId,
      ctx.entityContext.summary || undefined,
    );
    controller.enqueue(sseEvent('content', { text: degraded.message }));
    return degraded.message;
  }

  const systemPrompt = buildStreamingSystemPrompt(ctx);

  const chatMessages = [
    ...(ctx.conversationHistory ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: ctx.message },
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
      userId: ctx.user.id,
      capability: 'chat',
    })) {
      if (streamErrored) break;
      if (chunk.content) {
        responseText += chunk.content;
        controller.enqueue(sseEvent('content', { text: chunk.content }));
      }
      if (chunk.done) break;
    }

    clearTimeout(totalTimeout);
  } catch (streamError) {
    streamErrored = true;
    logger.error('[SAM_STREAM] Streaming failed, using fallback:', streamError);

    // Circuit breaker / service unavailable — return degraded response
    if (streamError instanceof SAMServiceUnavailableError) {
      logger.warn('[SAM_STREAM] Circuit breaker open — emitting degraded response');
      const degraded = getDegradedResponse(
        ctx.classifiedIntent.intent,
        ctx.modeId,
        ctx.entityContext.summary || undefined,
      );
      controller.enqueue(sseEvent('content', { text: degraded.message }));
      return degraded.message;
    }

    // Fallback: run orchestrator for full response
    if (responseText.length === 0) {
      const samContext = (ctx.orchestrationResult as Record<string, unknown> | null)
        ? undefined
        : undefined;
      const fallbackResult = await subsystems.orchestrator.orchestrate(
        // Build a minimal SAMContext for fallback — reuse the orchestration stage logic
        // by delegating to orchestrator with the engines
        {} as Parameters<typeof subsystems.orchestrator.orchestrate>[0],
        ctx.message,
        { engines: ctx.enginesToRun.length > 0 ? ctx.enginesToRun : ['context', 'response'] },
      );
      responseText = fallbackResult.response?.message ?? '';

      if (responseText) {
        controller.enqueue(sseEvent('content', { text: responseText }));
      }
    } else {
      controller.enqueue(
        sseEvent('error', {
          error: 'Stream interrupted',
          partialContent: true,
          recoverable: true,
        }),
      );
    }
  }

  return responseText;
}

// =============================================================================
// STREAMING PHASE 2: BUILD SSE INSIGHTS
// =============================================================================

/**
 * Builds and emits the insights, suggestions, actions, and done SSE events
 * from a fully-populated PipelineContext (after deferred stages).
 */
export function emitDeferredSSEEvents(
  ctx: PipelineContext,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  const orchResult = ctx.orchestrationResult as Record<string, unknown> | null;
  const results = (orchResult?.results ?? {}) as Record<
    string,
    { data?: Record<string, unknown> } | undefined
  >;
  const resultResponse = (orchResult?.response ?? {}) as Record<string, unknown>;
  const resultMetadata = (orchResult?.metadata ?? {}) as Record<string, unknown>;

  const contextData = results.context?.data as Record<string, unknown> | undefined;
  const contentData = results.content?.data as Record<string, unknown> | undefined;
  const personalizationData = results.personalization?.data as Record<string, unknown> | undefined;
  const bloomsAnalysis = ctx.bloomsAnalysis as Record<string, unknown> | null;
  const bloomsOutput = ctx.bloomsOutput as Record<string, unknown> | null;

  // Cast quality/pedagogy for field access
  const qualityResult = ctx.qualityResult as {
    passed?: boolean;
    overallScore?: number;
    failedGates?: string[];
  } | null;
  const pedagogyResult = ctx.pedagogyResult as {
    passed?: boolean;
    overallScore?: number;
  } | null;

  // If response was gated, replace streamed content
  if (ctx.responseGated) {
    controller.enqueue(sseEvent('content-replace', { text: ctx.responseText }));
  }

  // Insights
  const insights = {
    blooms: bloomsAnalysis
      ? {
          dominantLevel: bloomsAnalysis.dominantLevel,
          confidence: bloomsAnalysis.confidence,
          cognitiveDepth: bloomsAnalysis.cognitiveDepth,
          distribution: bloomsAnalysis.distribution,
          gaps: bloomsAnalysis.gaps,
          recommendations: bloomsAnalysis.recommendations,
          method: bloomsAnalysis.method,
          sectionAnalysis: bloomsOutput?.sectionAnalysis,
          actionItems: bloomsOutput?.actionItems,
        }
      : undefined,
    content: contentData
      ? {
          metrics: (contentData as { metrics?: unknown }).metrics,
          suggestions: (contentData as { suggestions?: unknown[] }).suggestions,
          overallScore: (contentData as { overallScore?: number }).overallScore,
        }
      : undefined,
    personalization: personalizationData
      ? {
          learningStyle: (personalizationData as { learningStyle?: unknown }).learningStyle,
          cognitiveLoad: (personalizationData as { cognitiveLoad?: unknown }).cognitiveLoad,
          motivation: (personalizationData as { motivation?: unknown }).motivation,
        }
      : undefined,
    context: contextData
      ? {
          intent: (contextData as { queryAnalysis?: { intent?: string } }).queryAnalysis?.intent,
          keywords: (contextData as { queryAnalysis?: { keywords?: string[] } }).queryAnalysis
            ?.keywords,
          complexity: (contextData as { queryAnalysis?: { complexity?: string } }).queryAnalysis
            ?.complexity,
        }
      : undefined,
    quality: qualityResult
      ? {
          passed: qualityResult.passed,
          score: qualityResult.overallScore,
          failedGates: qualityResult.failedGates,
        }
      : undefined,
    pedagogy: pedagogyResult
      ? {
          passed: pedagogyResult.passed,
          score: pedagogyResult.overallScore,
        }
      : undefined,
    memory: ctx.memoryUpdate,
    memoryContext:
      ctx.memorySummary || ctx.reviewSummary
        ? { summary: ctx.memorySummary, reviewSummary: ctx.reviewSummary }
        : undefined,
    safety: ctx.safetyResult
      ? { passed: ctx.safetyResult.passed, suggestions: ctx.safetyResult.suggestions }
      : undefined,
    agentic: {
      confidence: ctx.agenticConfidence
        ? {
            level: ctx.agenticConfidence.level,
            score: ctx.agenticConfidence.score,
            factors: ctx.agenticConfidence.factors,
          }
        : undefined,
      verification: ctx.verificationResult
        ? {
            status: ctx.verificationResult.status,
            accuracy: ctx.verificationResult.overallAccuracy,
            issueCount: ctx.verificationResult.issues.length,
            criticalIssues: ctx.verificationResult.issues
              .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
              .map((issue) => issue.description),
          }
        : undefined,
      responseGated: ctx.responseGated || undefined,
      sessionRecorded: ctx.sessionRecorded,
      interventions: ctx.interventions.length > 0 ? ctx.interventions : undefined,
      toolExecution: ctx.toolExecution ?? undefined,
    },
    orchestration: ctx.orchestrationData ?? undefined,
    modeSuggestion: ctx.modeClassification?.shouldSuggestSwitch
      ? {
          suggestedMode: ctx.modeClassification.suggestedMode,
          reason: ctx.modeClassification.reason,
        }
      : undefined,
  };

  controller.enqueue(sseEvent('insights', insights));

  // Suggestions
  const suggestions = resultResponse.suggestions as unknown[] | undefined;
  if (suggestions && suggestions.length > 0) {
    controller.enqueue(sseEvent('suggestions', suggestions));
  }

  // Actions
  const actions = resultResponse.actions as unknown[] | undefined;
  if (actions && actions.length > 0) {
    controller.enqueue(sseEvent('actions', actions));
  }

  // Done event
  controller.enqueue(
    sseEvent('done', {
      success: (orchResult?.success as boolean) ?? true,
      metadata: {
        enginesRun: (resultMetadata.enginesExecuted as string[]) ?? [],
        enginesFailed: (resultMetadata.enginesFailed as string[]) ?? [],
        enginesCached: (resultMetadata.enginesCached as string[]) ?? [],
        totalTime: (resultMetadata.totalExecutionTime as number) ?? 0,
        requestTime: Date.now() - ctx.startTime,
        degraded: ctx.degradedMode || undefined,
        enginePresetUsed: ctx.modeAnalytics?.enginePresetUsed,
        subsystems: {
          unifiedBlooms: !!bloomsAnalysis,
          qualityGates: !!qualityResult,
          pedagogyPipeline: !!pedagogyResult,
          memoryTracking: !!ctx.memoryUpdate,
          safetyValidation: !!ctx.safetyResult,
          agenticBridge: true,
          agenticConfidence: !!ctx.agenticConfidence,
          agenticVerification: !!ctx.verificationResult,
          agenticResponseGated: ctx.responseGated,
          agenticSession: ctx.sessionRecorded,
          agenticInterventions: ctx.interventions.length > 0,
          agenticToolExecution: !!ctx.toolExecution,
          tutoringOrchestration: !!ctx.orchestrationData,
        },
        toolExecution: ctx.toolExecution ?? undefined,
        orchestration: ctx.orchestrationData ?? undefined,
      },
    }),
  );
}
