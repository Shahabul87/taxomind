/**
 * SAM Student Analytics PRISM Tool
 *
 * Conversationally collects 4 parameters and triggers the 5-stage
 * PRISM student analytics pipeline.
 *
 * Flow:
 * 1. User triggers tool (e.g., &quot;Show my analytics&quot; or &quot;How am I doing?&quot;)
 * 2. Tool asks questions one-by-one: analysisDepth, courseScope, timeRange, confirm
 * 3. Once all data collected, returns triggerAnalytics: true
 * 4. Frontend calls /api/sam/student-analytics/orchestrate with collected params
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
  StudentAnalyticsCollectionStep,
  StudentAnalyticsCollectionState,
  StudentAnalyticsParams,
  AnalysisDepth,
  CourseScope,
  TimeRange,
} from '@/lib/sam/student-analytics/agentic-types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const StudentAnalyticsInputSchema = z.object({
  // Direct mode
  analysisDepth: z
    .enum(['quick_snapshot', 'standard', 'deep_analysis'])
    .optional(),
  courseScope: z
    .enum(['all_courses', 'specific_course', 'recent_activity'])
    .optional(),
  timeRange: z
    .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
    .optional(),
  courseId: z.string().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z
    .enum(['analysisDepth', 'courseScope', 'timeRange', 'confirm', 'complete'])
    .optional(),
  collected: z
    .object({
      analysisDepth: z
        .enum(['quick_snapshot', 'standard', 'deep_analysis'])
        .optional(),
      courseScope: z
        .enum(['all_courses', 'specific_course', 'recent_activity'])
        .optional(),
      timeRange: z
        .enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time'])
        .optional(),
      courseId: z.string().optional(),
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

const DEPTH_OPTIONS: ConversationOption[] = [
  {
    value: 'standard',
    label: 'Standard (Recommended)',
    description:
      'Full PRISM analysis with AI insights, prescriptions, and report. Takes ~30 seconds.',
  },
  {
    value: 'quick_snapshot',
    label: 'Quick Snapshot',
    description:
      'Cognitive map and Bloom&apos;s profile only. No AI calls, instant results (~2-5 seconds).',
  },
  {
    value: 'deep_analysis',
    label: 'Deep Analysis',
    description:
      'Comprehensive analysis with detailed breakdowns per Bloom&apos;s level and extended prescriptions.',
  },
];

const SCOPE_OPTIONS: ConversationOption[] = [
  {
    value: 'all_courses',
    label: 'All Courses',
    description: 'Analyze performance across all enrolled courses.',
  },
  {
    value: 'recent_activity',
    label: 'Recent Activity',
    description: 'Focus on courses with recent study activity.',
  },
  {
    value: 'specific_course',
    label: 'Specific Course',
    description: 'Analyze a single course (you&apos;ll select which one).',
  },
];

const TIME_RANGE_OPTIONS: ConversationOption[] = [
  {
    value: 'last_30_days',
    label: 'Last 30 Days (Recommended)',
    description: 'Most relevant recent performance data.',
  },
  {
    value: 'last_7_days',
    label: 'Last 7 Days',
    description: 'Short-term snapshot of very recent activity.',
  },
  {
    value: 'last_90_days',
    label: 'Last 90 Days',
    description: 'Broader view including longer-term trends.',
  },
  {
    value: 'all_time',
    label: 'All Time',
    description: 'Complete history since enrollment.',
  },
];

const STEP_ORDER: StudentAnalyticsCollectionStep[] = [
  'analysisDepth',
  'courseScope',
  'timeRange',
  'confirm',
  'complete',
];

// =============================================================================
// CONVERSATION STATE STORE
// =============================================================================

const conversationStates = new Map<string, StudentAnalyticsCollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Clean up expired states every 5 minutes
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
  step: StudentAnalyticsCollectionStep
): AnalysisDepth | CourseScope | TimeRange | boolean | null {
  const normalized = response.toLowerCase().trim();

  switch (step) {
    case 'analysisDepth': {
      if (normalized.includes('quick') || normalized.includes('snapshot') || normalized === '2')
        return 'quick_snapshot';
      if (normalized.includes('deep') || normalized === '3') return 'deep_analysis';
      if (normalized.includes('standard') || normalized.includes('recommend') || normalized === '1')
        return 'standard';
      return null;
    }
    case 'courseScope': {
      if (normalized.includes('all') || normalized === '1') return 'all_courses';
      if (normalized.includes('recent') || normalized === '2') return 'recent_activity';
      if (normalized.includes('specific') || normalized === '3') return 'specific_course';
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
      return true; // Default to yes
    }
    default:
      return null;
  }
}

function getNextQuestion(state: StudentAnalyticsCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'analysisDepth':
      return {
        question: 'How detailed should the analysis be?',
        options: DEPTH_OPTIONS,
        hint: 'Choose the level of detail for your PRISM analytics report.',
      };
    case 'courseScope':
      return {
        question: 'Which courses should I analyze?',
        options: SCOPE_OPTIONS,
        hint: 'Select the scope of courses to include in your analysis.',
      };
    case 'timeRange':
      return {
        question: 'What time period should I look at?',
        options: TIME_RANGE_OPTIONS,
        hint: 'Choose how far back to analyze your performance data.',
      };
    case 'confirm':
      return {
        question: formatCollectedSummary(state.collected) + '\n\nReady to analyze?',
        hint: 'Say "yes" to start or "adjust" to change settings.',
      };
    default:
      return { question: 'Ready to analyze your learning data?' };
  }
}

function formatCollectedSummary(collected: Partial<StudentAnalyticsParams>): string {
  const depthLabel =
    DEPTH_OPTIONS.find((o) => o.value === collected.analysisDepth)?.label ??
    collected.analysisDepth ??
    'Standard';
  const scopeLabel =
    SCOPE_OPTIONS.find((o) => o.value === collected.courseScope)?.label ??
    collected.courseScope ??
    'All Courses';
  const timeLabel =
    TIME_RANGE_OPTIONS.find((o) => o.value === collected.timeRange)?.label ??
    collected.timeRange ??
    'Last 30 Days';

  return [
    '**PRISM Analytics Configuration:**',
    `- Analysis Depth: ${depthLabel}`,
    `- Course Scope: ${scopeLabel}`,
    `- Time Range: ${timeLabel}`,
  ].join('\n');
}

function advanceState(
  state: StudentAnalyticsCollectionState,
  value: unknown
): StudentAnalyticsCollectionState {
  const updated = { ...state, collected: { ...state.collected } };

  switch (state.step) {
    case 'analysisDepth':
      updated.collected.analysisDepth = value as AnalysisDepth;
      updated.step = 'courseScope';
      break;
    case 'courseScope':
      updated.collected.courseScope = value as CourseScope;
      updated.step = 'timeRange';
      break;
    case 'timeRange':
      updated.collected.timeRange = value as TimeRange;
      updated.step = 'confirm';
      break;
    case 'confirm':
      if (value === true) {
        updated.step = 'complete';
      } else {
        // Reset to first step
        updated.step = 'analysisDepth';
        updated.collected = {};
      }
      break;
  }

  return updated;
}

function hasAllParams(input: Record<string, unknown>): boolean {
  return !!(input.analysisDepth && input.courseScope && input.timeRange);
}

// =============================================================================
// HANDLER
// =============================================================================

function createStudentAnalyticsHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = StudentAnalyticsInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        output: `Invalid input: ${parsed.error.message}`,
        metadata: { error: 'validation_failed' },
      };
    }

    const data = parsed.data;

    // ---------------------------------------------------------------
    // PATH A: Direct mode — all params provided or action='analyze'
    // ---------------------------------------------------------------
    if (data.action === 'analyze' || hasAllParams(data)) {
      const params: StudentAnalyticsParams = {
        analysisDepth: data.analysisDepth ?? 'standard',
        courseScope: data.courseScope ?? 'all_courses',
        timeRange: data.timeRange ?? 'last_30_days',
        courseId: data.courseId,
      };

      return {
        success: true,
        output: formatCollectedSummary(params) + '\n\nStarting PRISM analytics pipeline...',
        metadata: {
          type: 'analyze_student',
          triggerAnalytics: true,
          params,
        },
      };
    }

    // ---------------------------------------------------------------
    // PATH B: Start new conversation
    // ---------------------------------------------------------------
    if (data.action === 'start' || !data.conversationId) {
      const conversationId = `sa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const state: StudentAnalyticsCollectionState = {
        step: 'analysisDepth',
        collected: {},
        conversationId,
        createdAt: Date.now(),
      };

      // Pre-fill any provided values
      if (data.analysisDepth) {
        state.collected.analysisDepth = data.analysisDepth;
        state.step = 'courseScope';
      }
      if (data.courseScope) {
        state.collected.courseScope = data.courseScope;
        if (state.step === 'courseScope') state.step = 'timeRange';
      }
      if (data.timeRange) {
        state.collected.timeRange = data.timeRange;
        if (state.step === 'timeRange') state.step = 'confirm';
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

    // ---------------------------------------------------------------
    // PATH C: Continue conversation
    // ---------------------------------------------------------------
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

    // Check if collection is complete
    if (newState.step === 'complete') {
      const params: StudentAnalyticsParams = {
        analysisDepth: newState.collected.analysisDepth ?? 'standard',
        courseScope: newState.collected.courseScope ?? 'all_courses',
        timeRange: newState.collected.timeRange ?? 'last_30_days',
        courseId: newState.collected.courseId,
      };

      conversationStates.delete(data.conversationId);

      return {
        success: true,
        output: formatCollectedSummary(params) + '\n\nStarting PRISM analytics pipeline...',
        metadata: {
          type: 'analyze_student',
          triggerAnalytics: true,
          params,
          conversationId: data.conversationId,
        },
      };
    }

    // Ask next question
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

export function createStudentAnalyticsTool(): ToolDefinition {
  return {
    id: 'sam-student-analytics',
    name: 'PRISM Student Analytics',
    description:
      'Analyzes student learning performance using the PRISM framework. Computes Bloom&apos;s cognitive map, identifies fragile knowledge, classifies cognitive cluster, and generates actionable prescriptions. Stages 1-2 are pure computation (no AI), stages 3-5 use AI for interpretation.',
    version: '1.0.0',
    category: ToolCategory.ASSESSMENT,
    handler: createStudentAnalyticsHandler(),
    inputSchema: StudentAnalyticsInputSchema,
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
      'student',
      'prism',
      'blooms',
      'cognitive',
      'performance',
      'prescriptions',
    ],
    rateLimit: {
      maxCalls: 20,
      windowMs: 3_600_000, // 1 hour
      scope: 'user',
    },
    timeoutMs: 120_000, // 2 minutes for full pipeline
    maxRetries: 1,
  };
}
