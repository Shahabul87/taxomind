/**
 * SAM Creator Analytics PRISM Tool
 *
 * Conversationally collects 5 parameters and triggers the 6-stage
 * PRISM creator analytics pipeline.
 *
 * Flow:
 * 1. User triggers tool (e.g., &quot;How are my students doing?&quot;)
 * 2. Tool asks questions: courseSelection, timeRange, focusArea, analysisDepth, confirm
 * 3. Once all data collected, returns triggerAnalytics: true
 * 4. Frontend calls /api/sam/creator-analytics/orchestrate with collected params
 *
 * Follows the exact pattern from exam-evaluator.ts.
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
  CreatorAnalyticsCollectionStep,
  CreatorAnalyticsCollectionState,
  CreatorAnalyticsParams,
  CreatorAnalysisDepth,
  CreatorFocusArea,
  TimeRange,
} from '@/lib/sam/creator-analytics/agentic-types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const CreatorAnalyticsInputSchema = z.object({
  // Direct mode
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  timeRange: z
    .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
    .optional(),
  focusArea: z
    .enum([
      'cognitive_health',
      'engagement',
      'content_quality',
      'predictions',
      'comprehensive',
    ])
    .optional(),
  analysisDepth: z.enum(['overview', 'standard', 'deep_dive']).optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z
    .enum([
      'courseSelection',
      'timeRange',
      'focusArea',
      'analysisDepth',
      'confirm',
      'complete',
    ])
    .optional(),
  collected: z
    .object({
      courseId: z.string().optional(),
      courseName: z.string().optional(),
      timeRange: z
        .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
        .optional(),
      focusArea: z
        .enum([
          'cognitive_health',
          'engagement',
          'content_quality',
          'predictions',
          'comprehensive',
        ])
        .optional(),
      analysisDepth: z
        .enum(['overview', 'standard', 'deep_dive'])
        .optional(),
    })
    .optional(),

  // Action
  action: z.enum(['start', 'continue', 'analyze']).default('start'),
});

// =============================================================================
// CONVERSATION OPTIONS
// =============================================================================

interface ConversationOption {
  value: string;
  label: string;
  description: string;
}

const TIME_RANGE_OPTIONS: ConversationOption[] = [
  {
    value: 'last_30_days',
    label: 'Last 30 Days (Recommended)',
    description: 'Most relevant recent cohort data.',
  },
  {
    value: 'last_7_days',
    label: 'Last 7 Days',
    description: 'Short-term snapshot.',
  },
  {
    value: 'last_90_days',
    label: 'Last 90 Days',
    description: 'Broader trends with more data.',
  },
  {
    value: 'all_time',
    label: 'All Time',
    description: 'Complete course history.',
  },
];

const FOCUS_AREA_OPTIONS: ConversationOption[] = [
  {
    value: 'comprehensive',
    label: 'Comprehensive (Recommended)',
    description: 'Full analysis across all dimensions.',
  },
  {
    value: 'cognitive_health',
    label: 'Cognitive Health',
    description: 'Bloom&apos;s distribution, fragile knowledge, velocity.',
  },
  {
    value: 'engagement',
    label: 'Engagement',
    description: 'Activity patterns, dropout risk, retention.',
  },
  {
    value: 'content_quality',
    label: 'Content Quality',
    description: 'Module effectiveness, assessment quality, alignment.',
  },
];

const DEPTH_OPTIONS: ConversationOption[] = [
  {
    value: 'standard',
    label: 'Standard (Recommended)',
    description: 'Full PRISM analysis with prescriptions. ~60 seconds.',
  },
  {
    value: 'overview',
    label: 'Overview',
    description: 'Quick cohort health check. ~30 seconds.',
  },
  {
    value: 'deep_dive',
    label: 'Deep Dive',
    description: 'Extended analysis with detailed breakdowns. ~90 seconds.',
  },
];

const STEP_ORDER: CreatorAnalyticsCollectionStep[] = [
  'courseSelection',
  'timeRange',
  'focusArea',
  'analysisDepth',
  'confirm',
  'complete',
];

// =============================================================================
// CONVERSATION STATE STORE
// =============================================================================

const conversationStates = new Map<string, CreatorAnalyticsCollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, state] of conversationStates) {
    if (now - state.createdAt > STATE_TTL_MS) {
      conversationStates.delete(key);
    }
  }
}, 5 * 60 * 1000);

// =============================================================================
// PARSING HELPERS
// =============================================================================

function parseUserResponse(
  response: string,
  step: CreatorAnalyticsCollectionStep
): string | boolean | null {
  const normalized = response.toLowerCase().trim();

  switch (step) {
    case 'courseSelection': {
      // For course selection, we accept the raw string as the course identifier
      // The frontend should provide a courseId directly
      if (normalized.length > 0) return response.trim();
      return null;
    }
    case 'timeRange': {
      if (normalized.includes('7') || normalized.includes('week')) return 'last_7_days';
      if (normalized.includes('30') || normalized.includes('month') || normalized === '1')
        return 'last_30_days';
      if (normalized.includes('90') || normalized.includes('quarter')) return 'last_90_days';
      if (normalized.includes('all')) return 'all_time';
      return null;
    }
    case 'focusArea': {
      if (normalized.includes('comprehensive') || normalized.includes('all') || normalized === '1')
        return 'comprehensive';
      if (normalized.includes('cognitive') || normalized.includes('bloom')) return 'cognitive_health';
      if (normalized.includes('engagement') || normalized.includes('dropout')) return 'engagement';
      if (normalized.includes('content') || normalized.includes('quality')) return 'content_quality';
      if (normalized.includes('predict')) return 'predictions';
      return null;
    }
    case 'analysisDepth': {
      if (normalized.includes('standard') || normalized.includes('recommend') || normalized === '1')
        return 'standard';
      if (normalized.includes('overview') || normalized.includes('quick')) return 'overview';
      if (normalized.includes('deep')) return 'deep_dive';
      return null;
    }
    case 'confirm': {
      if (
        normalized === 'yes' ||
        normalized === 'y' ||
        normalized.includes('ready') ||
        normalized.includes('go') ||
        normalized.includes('analyze')
      ) {
        return true;
      }
      if (
        normalized === 'no' ||
        normalized === 'n' ||
        normalized.includes('adjust') ||
        normalized.includes('change')
      ) {
        return false;
      }
      return true;
    }
    default:
      return null;
  }
}

function getNextQuestion(state: CreatorAnalyticsCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'courseSelection':
      return {
        question:
          'Which course would you like to analyze? Please provide the course name or ID.',
        hint: 'Type the name of one of your courses, or "all" for all courses.',
      };
    case 'timeRange':
      return {
        question: 'What time period should I analyze?',
        options: TIME_RANGE_OPTIONS,
      };
    case 'focusArea':
      return {
        question: 'What should I focus on?',
        options: FOCUS_AREA_OPTIONS,
      };
    case 'analysisDepth':
      return {
        question: 'How deep should the analysis be?',
        options: DEPTH_OPTIONS,
      };
    case 'confirm':
      return {
        question: formatCollectedSummary(state.collected) + '\n\nReady to analyze?',
        hint: 'Say "yes" to start or "adjust" to change settings.',
      };
    default:
      return { question: 'Ready to analyze your course data?' };
  }
}

function formatCollectedSummary(
  collected: Partial<CreatorAnalyticsParams>
): string {
  const courseLabel = collected.courseName ?? collected.courseId ?? 'Not selected';
  const timeLabel =
    TIME_RANGE_OPTIONS.find((o) => o.value === collected.timeRange)?.label ??
    collected.timeRange ??
    'Last 30 Days';
  const focusLabel =
    FOCUS_AREA_OPTIONS.find((o) => o.value === collected.focusArea)?.label ??
    collected.focusArea ??
    'Comprehensive';
  const depthLabel =
    DEPTH_OPTIONS.find((o) => o.value === collected.analysisDepth)?.label ??
    collected.analysisDepth ??
    'Standard';

  return [
    '**PRISM Creator Analytics Configuration:**',
    `- Course: ${courseLabel}`,
    `- Time Range: ${timeLabel}`,
    `- Focus Area: ${focusLabel}`,
    `- Analysis Depth: ${depthLabel}`,
  ].join('\n');
}

function advanceState(
  state: CreatorAnalyticsCollectionState,
  value: unknown
): CreatorAnalyticsCollectionState {
  const updated = { ...state, collected: { ...state.collected } };

  switch (state.step) {
    case 'courseSelection':
      updated.collected.courseId = value as string;
      updated.collected.courseName = value as string;
      updated.step = 'timeRange';
      break;
    case 'timeRange':
      updated.collected.timeRange = value as TimeRange;
      updated.step = 'focusArea';
      break;
    case 'focusArea':
      updated.collected.focusArea = value as CreatorFocusArea;
      updated.step = 'analysisDepth';
      break;
    case 'analysisDepth':
      updated.collected.analysisDepth = value as CreatorAnalysisDepth;
      updated.step = 'confirm';
      break;
    case 'confirm':
      if (value === true) {
        updated.step = 'complete';
      } else {
        updated.step = 'courseSelection';
        updated.collected = {};
      }
      break;
  }

  return updated;
}

function hasAllParams(input: Record<string, unknown>): boolean {
  return !!(input.courseId && input.timeRange && input.focusArea && input.analysisDepth);
}

// =============================================================================
// HANDLER
// =============================================================================

function createCreatorAnalyticsHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = CreatorAnalyticsInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        output: `Invalid input: ${parsed.error.message}`,
        metadata: { error: 'validation_failed' },
      };
    }

    const data = parsed.data;

    // PATH A: Direct mode
    if (data.action === 'analyze' || hasAllParams(data)) {
      const params: CreatorAnalyticsParams = {
        courseId: data.courseId ?? '',
        courseName: data.courseName,
        timeRange: data.timeRange ?? 'last_30_days',
        focusArea: data.focusArea ?? 'comprehensive',
        analysisDepth: data.analysisDepth ?? 'standard',
      };

      return {
        success: true,
        output: formatCollectedSummary(params) + '\n\nStarting PRISM creator analytics pipeline...',
        metadata: {
          type: 'analyze_creator',
          triggerAnalytics: true,
          params,
        },
      };
    }

    // PATH B: Start new conversation
    if (data.action === 'start' || !data.conversationId) {
      const conversationId = `ca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const state: CreatorAnalyticsCollectionState = {
        step: 'courseSelection',
        collected: {},
        conversationId,
        createdAt: Date.now(),
      };

      // Pre-fill provided values
      if (data.courseId) {
        state.collected.courseId = data.courseId;
        state.collected.courseName = data.courseName;
        state.step = 'timeRange';
      }
      if (data.timeRange) {
        state.collected.timeRange = data.timeRange;
        if (state.step === 'timeRange') state.step = 'focusArea';
      }
      if (data.focusArea) {
        state.collected.focusArea = data.focusArea;
        if (state.step === 'focusArea') state.step = 'analysisDepth';
      }
      if (data.analysisDepth) {
        state.collected.analysisDepth = data.analysisDepth;
        if (state.step === 'analysisDepth') state.step = 'confirm';
      }

      conversationStates.set(conversationId, state);

      const { question, options, hint } = getNextQuestion(state);

      return {
        success: true,
        output: question,
        metadata: {
          type: 'conversation',
          conversationId,
          currentStep: state.step,
          options,
          hint,
          collected: state.collected,
        },
      };
    }

    // PATH C: Continue conversation
    const state = conversationStates.get(data.conversationId);
    if (!state) {
      return {
        success: false,
        output: 'Conversation expired. Please start again.',
        metadata: { error: 'conversation_expired' },
      };
    }

    const userResponse = data.userResponse ?? '';
    const parsedValue = parseUserResponse(userResponse, state.step);

    if (parsedValue === null) {
      const { question, options, hint } = getNextQuestion(state);
      return {
        success: true,
        output: `I didn&apos;t understand that. ${question}`,
        metadata: {
          type: 'conversation',
          conversationId: data.conversationId,
          currentStep: state.step,
          options,
          hint,
          collected: state.collected,
        },
      };
    }

    const newState = advanceState(state, parsedValue);
    conversationStates.set(data.conversationId, newState);

    if (newState.step === 'complete') {
      const params: CreatorAnalyticsParams = {
        courseId: newState.collected.courseId ?? '',
        courseName: newState.collected.courseName,
        timeRange: newState.collected.timeRange ?? 'last_30_days',
        focusArea: newState.collected.focusArea ?? 'comprehensive',
        analysisDepth: newState.collected.analysisDepth ?? 'standard',
      };

      conversationStates.delete(data.conversationId);

      return {
        success: true,
        output: formatCollectedSummary(params) + '\n\nStarting PRISM creator analytics pipeline...',
        metadata: {
          type: 'analyze_creator',
          triggerAnalytics: true,
          params,
          conversationId: data.conversationId,
        },
      };
    }

    const { question, options, hint } = getNextQuestion(newState);

    return {
      success: true,
      output: question,
      metadata: {
        type: 'conversation',
        conversationId: data.conversationId,
        currentStep: newState.step,
        options,
        hint,
        collected: newState.collected,
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION EXPORT
// =============================================================================

export function createCreatorAnalyticsTool(): ToolDefinition {
  return {
    id: 'sam-creator-analytics',
    name: 'PRISM Creator Analytics',
    description:
      'Analyzes course-level and cohort-level performance using the PRISM framework. Computes Bloom&apos;s distribution across cohort, identifies content quality issues, root causes of student outcomes, and generates ROI-scored prescriptions for course improvement.',
    version: '1.0.0',
    category: ToolCategory.ASSESSMENT,
    handler: createCreatorAnalyticsHandler(),
    inputSchema: CreatorAnalyticsInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      output: z.string(),
      metadata: z.record(z.unknown()).optional(),
    }),
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: [
      'analytics',
      'creator',
      'course',
      'cohort',
      'prism',
      'blooms',
      'prescriptions',
      'content-quality',
    ],
    rateLimit: {
      maxCalls: 15,
      windowMs: 3_600_000,
      scope: 'user',
    },
    timeoutMs: 180_000, // 3 minutes for 6-stage pipeline
    maxRetries: 1,
  };
}
