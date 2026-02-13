/**
 * SAM DIAGNOSE Exam Evaluator Tool
 *
 * Conversationally collects 4 parameters and triggers the 5-stage
 * DIAGNOSE evaluation pipeline. Every answer is evaluated through
 * 7 cognitive diagnostic layers.
 *
 * Flow:
 * 1. User triggers tool (e.g., "Evaluate my exam" or "Diagnose my exam performance")
 * 2. Tool asks questions one-by-one to collect: attemptId, evaluationMode,
 *    options, confirm
 * 3. Once all data collected, returns triggerEvaluation: true
 * 4. Frontend calls /api/sam/exam-evaluator/orchestrate with collected params
 *
 * Follows the exact pattern from exam-builder.ts.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';
import type {
  EvalCollectionStep,
  EvalCollectionState,
  ExamEvaluatorParams,
  EvaluationMode,
} from '@/lib/sam/exam-evaluation/agentic-types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const ExamEvaluatorInputSchema = z.object({
  // Direct mode
  attemptId: z.string().optional(),
  evaluationMode: z
    .enum(['quick_grade', 'standard', 'deep_diagnostic'])
    .optional(),
  enableGapMapping: z.boolean().optional(),
  enableEchoBack: z.boolean().optional(),
  enableMisconceptionId: z.boolean().optional(),

  // Context
  examId: z.string().optional(),
  courseId: z.string().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z
    .enum(['attemptId', 'evaluationMode', 'options', 'confirm', 'complete'])
    .optional(),
  collected: z
    .object({
      attemptId: z.string().optional(),
      evaluationMode: z
        .enum(['quick_grade', 'standard', 'deep_diagnostic'])
        .optional(),
      enableGapMapping: z.boolean().optional(),
      enableEchoBack: z.boolean().optional(),
      enableMisconceptionId: z.boolean().optional(),
    })
    .optional(),

  // Action
  action: z.enum(['start', 'continue', 'evaluate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

interface ConversationOption {
  value: string;
  label: string;
  description?: string;
}

const EVALUATION_MODE_OPTIONS: ConversationOption[] = [
  { value: 'deep_diagnostic', label: 'Deep Diagnostic (Recommended)', description: 'Full 7-layer DIAGNOSE framework with echo-back teaching and improvement roadmap' },
  { value: 'standard', label: 'Standard', description: 'Full 7-layer analysis with moderate detail' },
  { value: 'quick_grade', label: 'Quick Grade', description: 'Fast scoring with brief feedback, skip echo-back and roadmap' },
];

const OPTION_CHOICES: ConversationOption[] = [
  { value: 'all', label: 'All Features (Recommended)', description: 'Gap mapping + echo-back teaching + misconception identification' },
  { value: 'gap_mapping', label: 'Gap Mapping Only', description: 'Identify exact breakdown points in understanding' },
  { value: 'echo_back', label: 'Echo-Back Only', description: 'Mirror thinking and teach through reflection' },
  { value: 'misconception_id', label: 'Misconception ID Only', description: 'Name specific misconceptions from taxonomy' },
];

const STEP_ORDER: EvalCollectionStep[] = [
  'attemptId',
  'evaluationMode',
  'options',
  'confirm',
  'complete',
];

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, EvalCollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000;

function cleanupOldStates(): void {
  const now = Date.now();
  const entries = Array.from(conversationStates.entries());
  for (const [id, state] of entries) {
    if (now - state.createdAt > STATE_TTL_MS) {
      conversationStates.delete(id);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldStates, 5 * 60 * 1000);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateConversationId(): string {
  return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseUserResponse(
  response: string,
  step: EvalCollectionStep
): unknown {
  const trimmed = response.trim();
  const lower = trimmed.toLowerCase();

  switch (step) {
    case 'attemptId': {
      // Accept any non-empty string as attempt ID
      if (trimmed.length >= 1) return trimmed;
      return null;
    }

    case 'evaluationMode': {
      const modes: EvaluationMode[] = ['quick_grade', 'standard', 'deep_diagnostic'];
      for (const m of modes) {
        if (lower.includes(m.replace('_', ' ')) || lower.includes(m)) return m;
      }
      if (lower.includes('deep') || lower.includes('diagnostic') || lower.includes('full')) return 'deep_diagnostic';
      if (lower.includes('standard') || lower.includes('normal')) return 'standard';
      if (lower.includes('quick') || lower.includes('fast') || lower.includes('brief')) return 'quick_grade';
      return null;
    }

    case 'options': {
      if (lower.includes('all') || lower.includes('everything') || lower.includes('default')) {
        return { gap: true, echo: true, misconception: true };
      }
      const result = { gap: false, echo: false, misconception: false };
      if (lower.includes('gap') || lower.includes('breakdown')) result.gap = true;
      if (lower.includes('echo') || lower.includes('teach') || lower.includes('mirror')) result.echo = true;
      if (lower.includes('misconception') || lower.includes('name')) result.misconception = true;

      // If nothing specific was selected, default to all
      if (!result.gap && !result.echo && !result.misconception) {
        return { gap: true, echo: true, misconception: true };
      }
      return result;
    }

    case 'confirm': {
      if (lower.includes('yes') || lower.includes('go') || lower.includes('start') ||
          lower.includes('evaluate') || lower.includes('proceed') || lower.includes('ok')) {
        return 'yes';
      }
      if (lower.includes('no') || lower.includes('cancel') || lower.includes('adjust') ||
          lower.includes('change')) {
        return 'no';
      }
      // Default to yes for any affirmative-sounding response
      return 'yes';
    }

    default:
      return trimmed;
  }
}

function getNextQuestion(state: EvalCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'attemptId':
      return {
        question: 'Which exam attempt should I evaluate?',
        hint: 'You can provide the attempt ID, or I can evaluate your most recent submitted exam.',
      };

    case 'evaluationMode':
      return {
        question: 'How deep should the evaluation be?',
        options: EVALUATION_MODE_OPTIONS,
        hint: 'Deep Diagnostic gives the most detailed cognitive analysis',
      };

    case 'options':
      return {
        question: 'Which diagnostic features do you want enabled?',
        options: OPTION_CHOICES,
        hint: 'All features give you the most comprehensive evaluation',
      };

    case 'confirm': {
      const summary = formatCollectedSummary(state.collected);
      return {
        question: `Here&apos;s what I&apos;ll evaluate:\n\n${summary}\n\nReady to start the evaluation?`,
        options: [
          { value: 'yes', label: 'Yes, evaluate!', description: 'Start the DIAGNOSE evaluation now' },
          { value: 'no', label: 'Adjust settings', description: 'Go back and change options' },
        ],
      };
    }

    default:
      return { question: '' };
  }
}

function advanceState(
  state: EvalCollectionState,
  value: unknown
): EvalCollectionState {
  const currentIdx = STEP_ORDER.indexOf(state.step);
  const nextStep = STEP_ORDER[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'attemptId':
      newCollected.attemptId = value as string;
      break;
    case 'evaluationMode':
      newCollected.evaluationMode = value as EvaluationMode;
      break;
    case 'options': {
      const opts = value as { gap: boolean; echo: boolean; misconception: boolean };
      newCollected.enableGapMapping = opts.gap;
      newCollected.enableEchoBack = opts.echo;
      newCollected.enableMisconceptionId = opts.misconception;
      break;
    }
    case 'confirm':
      // If 'no', restart from evaluationMode
      if (value === 'no') {
        return {
          ...state,
          step: 'evaluationMode',
        };
      }
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<ExamEvaluatorParams>): string {
  const parts: string[] = [];
  if (collected.attemptId) parts.push(`Attempt: ${collected.attemptId}`);
  if (collected.evaluationMode) parts.push(`Mode: ${collected.evaluationMode}`);
  if (collected.enableGapMapping !== undefined) {
    const features: string[] = [];
    if (collected.enableGapMapping) features.push('Gap Mapping');
    if (collected.enableEchoBack) features.push('Echo-Back Teaching');
    if (collected.enableMisconceptionId) features.push('Misconception ID');
    parts.push(`Features: ${features.join(', ') || 'None'}`);
  }
  return parts.join('\n');
}

// =============================================================================
// HANDLER
// =============================================================================

function createExamEvaluatorHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = ExamEvaluatorInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const {
      action,
      conversationId,
      userResponse,
      currentStep,
      collected: inputCollected,
      ...directParams
    } = parsed.data;

    logger.info('[ExamEvaluator] Tool invoked', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      currentStep,
    });

    // ----- Direct evaluation (all params provided) -----
    const hasAllParams =
      directParams.attemptId &&
      directParams.evaluationMode;

    if (action === 'evaluate' || hasAllParams) {
      const params: ExamEvaluatorParams = {
        attemptId: directParams.attemptId ?? '',
        evaluationMode: directParams.evaluationMode ?? 'deep_diagnostic',
        enableGapMapping: directParams.enableGapMapping ?? true,
        enableEchoBack: directParams.enableEchoBack ?? true,
        enableMisconceptionId: directParams.enableMisconceptionId ?? true,
        examId: directParams.examId,
        courseId: directParams.courseId,
      };

      return {
        success: true,
        output: {
          type: 'evaluate_exam',
          params,
          message:
            `Ready to evaluate your exam using the DIAGNOSE framework! ` +
            `Mode: ${params.evaluationMode}.`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/exam-evaluator/orchestrate',
          triggerEvaluation: true,
        },
      };
    }

    // ----- Start new conversation -----
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      const initialStep: EvalCollectionStep = directParams.attemptId
        ? 'evaluationMode'
        : 'attemptId';
      const initialCollected: Partial<ExamEvaluatorParams> = directParams.attemptId
        ? { attemptId: directParams.attemptId }
        : {};

      const initialState: EvalCollectionState = {
        step: initialStep,
        collected: initialCollected,
        conversationId: newConversationId,
        createdAt: Date.now(),
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options, hint } = getNextQuestion(initialState);

      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId: newConversationId,
          step: initialState.step,
          question,
          options,
          hint,
          collected: initialState.collected,
          message: directParams.attemptId
            ? `I&apos;ll evaluate your exam attempt using the DIAGNOSE framework! ${question}`
            : `I&apos;d love to help you understand your exam performance with a deep diagnostic evaluation! ${question}`,
        },
      };
    }

    // ----- Continue conversation -----
    let state = conversationStates.get(conversationId);

    // Stateless fallback
    if (!state && currentStep && inputCollected) {
      state = {
        step: currentStep,
        collected: inputCollected as Partial<ExamEvaluatorParams>,
        conversationId: conversationId ?? generateConversationId(),
        createdAt: Date.now(),
      };
      conversationStates.set(state.conversationId, state);
    }

    if (!state) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message:
            'Conversation not found or expired. Let me start fresh — which exam attempt should I evaluate?',
          recoverable: true,
        },
      };
    }

    // If no user response, return the current question
    if (!userResponse) {
      const { question, options, hint } = getNextQuestion(state);
      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId,
          step: state.step,
          question,
          options,
          hint,
          collected: state.collected,
        },
      };
    }

    // Parse user response
    const parsedValue = parseUserResponse(userResponse, state.step);
    if (parsedValue === null) {
      const { question, options, hint } = getNextQuestion(state);
      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId,
          step: state.step,
          question,
          options,
          hint,
          collected: state.collected,
          message: `I didn&apos;t quite catch that. ${question}`,
          retryReason: 'Could not parse response',
        },
      };
    }

    // Advance to next step
    const newState = advanceState(state, parsedValue);
    conversationStates.set(conversationId, newState);

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as ExamEvaluatorParams;
      conversationStates.delete(conversationId);

      return {
        success: true,
        output: {
          type: 'evaluate_exam',
          params,
          message:
            `Starting your DIAGNOSE evaluation on attempt "${params.attemptId}" ` +
            `with ${params.evaluationMode} mode. This will analyze each answer through ` +
            `7 cognitive diagnostic layers...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/exam-evaluator/orchestrate',
          triggerEvaluation: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    // Friendly acknowledgment
    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'attemptId':
        acknowledgment = `I&apos;ll evaluate attempt "${parsedValue}".`;
        break;
      case 'evaluationMode':
        acknowledgment = `${String(parsedValue).replace('_', ' ')} mode selected.`;
        break;
      case 'options':
        acknowledgment = 'Diagnostic features configured.';
        break;
    }

    return {
      success: true,
      output: {
        type: 'conversation',
        conversationId,
        step: newState.step,
        question,
        options,
        hint,
        collected: newState.collected,
        message: `${acknowledgment} ${question}`,
        progress: {
          current: Object.keys(newState.collected).length,
          total: 4,
        },
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createExamEvaluatorTool(): ToolDefinition {
  return {
    id: 'sam-exam-evaluator',
    name: 'DIAGNOSE Exam Evaluator',
    description:
      'Deep diagnostic evaluation using the 7-layer DIAGNOSE framework. ' +
      'Reverse-engineers the student&apos;s THINKING PROCESS to diagnose cognitive gaps at ' +
      'specific Bloom&apos;s Taxonomy levels. Includes: reasoning path tracing, triple accuracy ' +
      'assessment, gap-mapping, misconception taxonomy, echo-back teaching, cognitive profile ' +
      'generation, and improvement roadmap with ARROW phase prescriptions.',
    version: '1.0.0',
    category: ToolCategory.ASSESSMENT,
    handler: createExamEvaluatorHandler(),
    inputSchema: ExamEvaluatorInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'evaluate_exam']),
      conversationId: z.string().optional(),
      step: z.string().optional(),
      question: z.string().optional(),
      options: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
      hint: z.string().optional(),
      collected: z.record(z.unknown()).optional(),
      message: z.string().optional(),
      retryReason: z.string().optional(),
      progress: z
        .object({
          current: z.number(),
          total: z.number(),
        })
        .optional(),
      params: z.record(z.unknown()).optional(),
      summary: z.string().optional(),
      apiEndpoint: z.string().optional(),
      triggerEvaluation: z.boolean().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: [
      'evaluation',
      'assessment',
      'diagnose',
      'blooms',
      'cognitive-profile',
      'grading',
      'feedback',
      'exam',
    ],
    rateLimit: { maxCalls: 10, windowMs: 3_600_000, scope: 'user' },
    timeoutMs: 60_000,
    maxRetries: 1,
  };
}
