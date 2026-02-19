import {
  createSAMAgenticBridge,
  type SAMAgenticBridge,
} from '@/lib/sam/agentic-bridge';
import { ensureToolingInitialized, ensureDefaultToolPermissions, mapUserToToolRole } from '@/lib/sam/agentic-tooling';
import { planToolInvocation } from '@/lib/sam/tool-planner';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import { getCoordinatorBridge } from './coordinator-bridge';
import { logger } from '@/lib/logger';
import {
  type ClassifiedIntent,
  type AgenticChatData,
  type AgenticToolResult,
  type GoalContext,
  type InterventionContext,
  type ConfidenceContext,
  type AgenticOptions,
  toGoalContext,
  toInterventionContext,
  toToolResult,
  toConfidenceContext,
} from './types';

// =============================================================================
// AGENTIC CHAT PROCESSOR
// =============================================================================

/**
 * Integration-layer processor that delegates to SAMAgenticBridge
 * for all portable agentic capabilities (goals, tools, interventions,
 * self-evaluation). Creates a per-request bridge instance.
 */
export class AgenticChatProcessor {
  private bridge: SAMAgenticBridge;
  private userId: string;
  private courseId: string | undefined;

  constructor(userId: string, courseId?: string) {
    this.userId = userId;
    this.courseId = courseId;

    // Per-request bridge instance - delegates to @sam-ai/agentic
    this.bridge = createSAMAgenticBridge({
      userId,
      courseId,
      enableGoalPlanning: true,
      enableToolExecution: true,
      enableProactiveInterventions: true,
      enableSelfEvaluation: true,
      enableLearningAnalytics: false, // Not needed per-chat
    });
  }

  /**
   * Run agentic processing in parallel based on classified intent.
   * Each operation is independent and wrapped in try-catch via Promise.allSettled.
   *
   * When MULTI_AGENT_COORDINATION is enabled and the query is complex,
   * delegates to MultiAgentCoordinator for collaborative multi-agent processing.
   * Falls back to standard parallel processing on coordinator failure.
   */
  async process(
    message: string,
    intent: ClassifiedIntent,
    options?: AgenticOptions
  ): Promise<AgenticChatData> {
    const startTime = Date.now();

    // Multi-agent coordination gate (feature-flagged)
    if (SAM_FEATURES.MULTI_AGENT_COORDINATION) {
      const bridge = getCoordinatorBridge();
      const decision = bridge.shouldDelegate(intent, message);

      if (decision.shouldDelegate) {
        logger.info('[AgenticChat] Delegating to multi-agent coordinator', {
          reason: decision.reason,
          intent: intent.intent,
        });

        try {
          const coordResult = await bridge.delegateToCoordinator(message, {
            userId: this.userId,
            courseId: this.courseId,
            intent,
          });

          if (coordResult.success && coordResult.content) {
            // Return coordinator result as agentic data
            return {
              intent,
              toolResults: [],
              goalContext: null,
              interventionContext: null,
              confidence: {
                level: coordResult.confidence >= 0.8 ? 'high' : coordResult.confidence >= 0.5 ? 'medium' : 'low',
                score: coordResult.confidence,
                shouldVerify: coordResult.confidence < 0.5,
                verificationStatus: 'verified',
              },
              recommendations: null,
              skillUpdate: null,
              orchestration: null,
              processingTimeMs: coordResult.executionTimeMs,
              coordinatorContent: coordResult.content,
              coordinatorSuggestions: coordResult.suggestions,
              coordinatorWarnings: coordResult.warnings,
            };
          }

          // Coordinator returned no content — fall through to standard processing
          logger.debug('[AgenticChat] Coordinator returned no content, falling back to standard processing');
        } catch (error) {
          logger.debug('[AgenticChat] Coordinator delegation failed, falling back', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const enableGoals = options?.enableGoals !== false;
    const enableTools = options?.enableTools !== false;
    const enableInterventions = options?.enableInterventions !== false;

    // Run enabled operations in parallel
    const [goalResult, toolResult, interventionResult] = await Promise.allSettled([
      enableGoals && intent.shouldCheckGoals
        ? this.fetchGoalContext(message)
        : Promise.resolve(null),
      enableTools && intent.shouldUseTool
        ? this.planAndExecuteTool(message, intent.toolHints)
        : Promise.resolve(null),
      enableInterventions && intent.shouldCheckInterventions
        ? this.checkInterventions()
        : Promise.resolve(null),
    ]);

    const goalContext = goalResult.status === 'fulfilled' ? goalResult.value : null;
    const toolResults = toolResult.status === 'fulfilled' && toolResult.value
      ? [toolResult.value]
      : [];
    const interventionContext = interventionResult.status === 'fulfilled'
      ? interventionResult.value
      : null;

    // Log any failures for debugging (non-blocking)
    if (goalResult.status === 'rejected') {
      logger.debug('[AgenticChat] Goal fetch failed', {
        error: goalResult.reason instanceof Error ? goalResult.reason.message : String(goalResult.reason),
      });
    }
    if (toolResult.status === 'rejected') {
      logger.debug('[AgenticChat] Tool execution failed', {
        error: toolResult.reason instanceof Error ? toolResult.reason.message : String(toolResult.reason),
      });
    }
    if (interventionResult.status === 'rejected') {
      logger.debug('[AgenticChat] Intervention check failed', {
        error: interventionResult.reason instanceof Error ? interventionResult.reason.message : String(interventionResult.reason),
      });
    }

    return {
      intent,
      toolResults,
      goalContext,
      interventionContext,
      confidence: null, // Populated by evaluateResponse (fire-and-forget)
      recommendations: null,
      skillUpdate: null,
      orchestration: null,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Self-evaluate a response via the bridge.
   * Intended to be called fire-and-forget after sending the response.
   */
  async evaluateResponse(responseText: string): Promise<ConfidenceContext | null> {
    try {
      const score = await withRetryableTimeout(
        () => this.bridge.scoreConfidence(responseText),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'selfEvaluation',
        0 // no retries for self-eval
      );

      let verificationStatus: 'verified' | 'unverified' | 'failed' | null = null;

      // Verify if confidence is not high
      if (score.level !== 'high') {
        try {
          const verification = await withRetryableTimeout(
            () => this.bridge.verifyResponse(responseText),
            TIMEOUT_DEFAULTS.AI_ANALYSIS,
            'responseVerification',
            0
          );
          verificationStatus = verification.status === 'verified' ? 'verified' : 'failed';
        } catch {
          verificationStatus = 'unverified';
        }
      } else {
        verificationStatus = 'verified';
      }

      return toConfidenceContext(score, verificationStatus);
    } catch (error) {
      logger.debug('[AgenticChat] Self-evaluation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // ===========================================================================
  // PRIVATE: Delegated operations
  // ===========================================================================

  private async fetchGoalContext(message: string): Promise<GoalContext | null> {
    const goals = await withRetryableTimeout(
      () => this.bridge.getActiveGoals(),
      5000,
      'fetchGoals',
      0
    );

    if (goals.length === 0) return null;

    return toGoalContext(goals, message);
  }

  private async planAndExecuteTool(
    message: string,
    toolHints: string[]
  ): Promise<AgenticToolResult | null> {
    // Ensure tooling is initialized and user has permissions
    await ensureToolingInitialized(this.userId);
    await ensureDefaultToolPermissions(
      this.userId,
      mapUserToToolRole(null) // Default student role
    );

    const aiAdapter = await createUserScopedAdapter(this.userId, 'chat');

    const tools = await this.bridge.getAvailableTools();
    if (tools.length === 0) return null;

    // Use existing tool planner from lib/sam/tool-planner.ts
    const planned = await withRetryableTimeout(
      () =>
        planToolInvocation({
          ai: aiAdapter,
          message,
          tools,
          minConfidence: 0.55,
        }),
      10000,
      'toolPlanning',
      0
    );

    if (!planned) return null;

    // Execute via bridge
    const toolStart = Date.now();
    const outcome = await withRetryableTimeout(
      () =>
        this.bridge.executeTool(planned.tool.id, planned.input, {
          skipConfirmation: true,
          metadata: {
            source: 'agentic-chat',
            reasoning: planned.reasoning,
            toolHints,
          },
        }),
      20000,
      'toolExecution',
      0
    );

    return toToolResult(outcome, Date.now() - toolStart);
  }

  private async checkInterventions(): Promise<InterventionContext | null> {
    const interventions = await withRetryableTimeout(
      () =>
        this.bridge.checkForInterventions({
          userId: this.userId,
          courseId: this.courseId,
        }),
      5000,
      'interventionCheck',
      0
    );

    if (interventions.length === 0) return null;

    return toInterventionContext(interventions);
  }
}
