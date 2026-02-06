/**
 * Learning Analytics Tool
 *
 * Conversationally collects parameters and generates comprehensive learning analytics
 * using the /api/sam/learning-analytics/generate endpoint.
 *
 * Flow:
 * 1. User triggers tool (e.g., "show my analytics")
 * 2. Tool asks questions one-by-one to collect: scope, courseId (if applicable),
 *    timeRange, metricFocus, includeRecommendations
 * 3. Once all data collected, returns triggerGeneration: true
 * 4. Frontend calls /api/sam/learning-analytics/generate with collected params
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

// =============================================================================
// TYPES
// =============================================================================

export type AnalyticsScope = 'course' | 'skills' | 'goals' | 'comprehensive';
export type TimeRange = '7d' | '30d' | '90d' | 'all';
export type MetricFocus = 'progress' | 'time' | 'mastery' | 'engagement' | 'all';

export interface LearningAnalyticsParams {
  scope: AnalyticsScope;
  courseId?: string;
  timeRange: TimeRange;
  metricFocus: MetricFocus;
  includeRecommendations: boolean;
}

export type CollectionStep =
  | 'scope'
  | 'course'
  | 'timeRange'
  | 'metricFocus'
  | 'includeRecommendations'
  | 'complete';

export interface CollectionState {
  step: CollectionStep;
  collected: Partial<LearningAnalyticsParams>;
  conversationId: string;
  createdAt: number;
  availableCourses?: Array<{ id: string; title: string }>;
}

export interface ConversationOption {
  value: string;
  label: string;
  description?: string;
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const LearningAnalyticsInputSchema = z.object({
  // Direct generation (all params provided)
  scope: z.enum(['course', 'skills', 'goals', 'comprehensive']).optional(),
  courseId: z.string().optional(),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional(),
  metricFocus: z.enum(['progress', 'time', 'mastery', 'engagement', 'all']).optional(),
  includeRecommendations: z.boolean().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  // Current step for stateless continuation (serverless-friendly)
  currentStep: z
    .enum(['scope', 'course', 'timeRange', 'metricFocus', 'includeRecommendations', 'complete'])
    .optional(),
  // Previously collected data for stateless continuation
  collected: z
    .object({
      scope: z.enum(['course', 'skills', 'goals', 'comprehensive']).optional(),
      courseId: z.string().optional(),
      timeRange: z.enum(['7d', '30d', '90d', 'all']).optional(),
      metricFocus: z.enum(['progress', 'time', 'mastery', 'engagement', 'all']).optional(),
      includeRecommendations: z.boolean().optional(),
    })
    .optional(),
  // Available courses for selection
  availableCourses: z
    .array(z.object({ id: z.string(), title: z.string() }))
    .optional(),

  // Action
  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const SCOPE_DESCRIPTIONS: Record<AnalyticsScope, string> = {
  course: 'Detailed progress and performance for a specific course',
  skills: 'Skill development and mastery levels across all learning',
  goals: 'Progress toward your learning goals and milestones',
  comprehensive: 'Complete overview of all your learning metrics',
};

const TIME_RANGE_DESCRIPTIONS: Record<TimeRange, string> = {
  '7d': 'Last 7 days - Recent activity snapshot',
  '30d': 'Last 30 days - Monthly overview',
  '90d': 'Last 90 days - Quarterly progress',
  all: 'All time - Complete learning history',
};

const METRIC_FOCUS_DESCRIPTIONS: Record<MetricFocus, string> = {
  progress: 'Course completion rates and chapter progress',
  time: 'Study time distribution and session patterns',
  mastery: 'Skill mastery levels and cognitive development',
  engagement: 'Learning frequency, streaks, and consistency',
  all: 'All metrics combined for full insights',
};

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, CollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Cleanup old states periodically
function cleanupOldStates(): void {
  const now = Date.now();
  const entries = Array.from(conversationStates.entries());
  for (const [id, state] of entries) {
    if (now - state.createdAt > STATE_TTL_MS) {
      conversationStates.delete(id);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldStates, 5 * 60 * 1000);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateConversationId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseUserResponse(
  response: string,
  step: CollectionStep,
  state: CollectionState
): unknown {
  const lowerResponse = response.trim().toLowerCase();

  switch (step) {
    case 'scope':
      if (
        lowerResponse.includes('course') ||
        lowerResponse.includes('specific') ||
        lowerResponse.includes('enrolled')
      )
        return 'course';
      if (lowerResponse.includes('skill') || lowerResponse.includes('mastery'))
        return 'skills';
      if (lowerResponse.includes('goal') || lowerResponse.includes('milestone'))
        return 'goals';
      if (
        lowerResponse.includes('comprehensive') ||
        lowerResponse.includes('all') ||
        lowerResponse.includes('everything') ||
        lowerResponse.includes('complete') ||
        lowerResponse.includes('full')
      )
        return 'comprehensive';
      // Try exact match
      const scopes: AnalyticsScope[] = ['course', 'skills', 'goals', 'comprehensive'];
      for (const scope of scopes) {
        if (lowerResponse === scope) return scope;
      }
      return null;

    case 'course':
      // Match course ID from available courses
      if (state.availableCourses) {
        // Try exact ID match first
        const exactMatch = state.availableCourses.find(
          (c) => c.id === response.trim()
        );
        if (exactMatch) return exactMatch.id;

        // Try title match
        const titleMatch = state.availableCourses.find(
          (c) =>
            c.title.toLowerCase().includes(lowerResponse) ||
            lowerResponse.includes(c.title.toLowerCase())
        );
        if (titleMatch) return titleMatch.id;

        // Try index match (1-based)
        const indexMatch = response.match(/^(\d+)$/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1], 10) - 1;
          if (index >= 0 && index < state.availableCourses.length) {
            return state.availableCourses[index].id;
          }
        }
      }
      return null;

    case 'timeRange':
      if (
        lowerResponse.includes('7') ||
        lowerResponse.includes('week') ||
        lowerResponse.includes('recent')
      )
        return '7d';
      if (
        lowerResponse.includes('30') ||
        lowerResponse.includes('month') ||
        lowerResponse.includes('monthly')
      )
        return '30d';
      if (
        lowerResponse.includes('90') ||
        lowerResponse.includes('quarter') ||
        lowerResponse.includes('quarterly')
      )
        return '90d';
      if (
        lowerResponse.includes('all') ||
        lowerResponse.includes('everything') ||
        lowerResponse.includes('complete') ||
        lowerResponse.includes('history')
      )
        return 'all';
      // Try exact match
      const ranges: TimeRange[] = ['7d', '30d', '90d', 'all'];
      for (const range of ranges) {
        if (lowerResponse === range) return range;
      }
      return null;

    case 'metricFocus':
      if (
        lowerResponse.includes('progress') ||
        lowerResponse.includes('completion')
      )
        return 'progress';
      if (
        lowerResponse.includes('time') ||
        lowerResponse.includes('hours') ||
        lowerResponse.includes('session')
      )
        return 'time';
      if (
        lowerResponse.includes('mastery') ||
        lowerResponse.includes('skill') ||
        lowerResponse.includes('cognitive')
      )
        return 'mastery';
      if (
        lowerResponse.includes('engagement') ||
        lowerResponse.includes('streak') ||
        lowerResponse.includes('consistency')
      )
        return 'engagement';
      if (
        lowerResponse.includes('all') ||
        lowerResponse.includes('everything') ||
        lowerResponse.includes('full')
      )
        return 'all';
      // Try exact match
      const focuses: MetricFocus[] = ['progress', 'time', 'mastery', 'engagement', 'all'];
      for (const focus of focuses) {
        if (lowerResponse === focus) return focus;
      }
      return null;

    case 'includeRecommendations':
      if (
        lowerResponse.includes('yes') ||
        lowerResponse.includes('sure') ||
        lowerResponse.includes('please') ||
        lowerResponse.includes('definitely') ||
        lowerResponse.includes('absolutely') ||
        lowerResponse === 'y'
      )
        return true;
      if (
        lowerResponse.includes('no') ||
        lowerResponse.includes('skip') ||
        lowerResponse.includes('nope') ||
        lowerResponse === 'n'
      )
        return false;
      return null;

    default:
      return response.trim();
  }
}

function getNextQuestion(state: CollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'scope':
      return {
        question: 'What would you like to analyze?',
        options: [
          {
            value: 'comprehensive',
            label: 'Comprehensive Overview',
            description: SCOPE_DESCRIPTIONS.comprehensive,
          },
          {
            value: 'course',
            label: 'Course Progress',
            description: SCOPE_DESCRIPTIONS.course,
          },
          {
            value: 'skills',
            label: 'Skill Development',
            description: SCOPE_DESCRIPTIONS.skills,
          },
          {
            value: 'goals',
            label: 'Learning Goals',
            description: SCOPE_DESCRIPTIONS.goals,
          },
        ],
      };

    case 'course':
      if (state.availableCourses && state.availableCourses.length > 0) {
        return {
          question: 'Which course would you like to analyze?',
          options: state.availableCourses.map((course, index) => ({
            value: course.id,
            label: course.title,
            description: `Course ${index + 1}`,
          })),
        };
      }
      return {
        question: "You don't have any enrolled courses yet. Would you like to see your overall analytics instead?",
        options: [
          {
            value: 'comprehensive',
            label: 'Yes, show overall analytics',
            description: 'View comprehensive learning overview',
          },
        ],
        hint: 'Enroll in a course to track course-specific progress',
      };

    case 'timeRange':
      return {
        question: 'What time period should I analyze?',
        options: [
          { value: '30d', label: 'Last 30 Days', description: TIME_RANGE_DESCRIPTIONS['30d'] },
          { value: '7d', label: 'Last 7 Days', description: TIME_RANGE_DESCRIPTIONS['7d'] },
          { value: '90d', label: 'Last 90 Days', description: TIME_RANGE_DESCRIPTIONS['90d'] },
          { value: 'all', label: 'All Time', description: TIME_RANGE_DESCRIPTIONS.all },
        ],
      };

    case 'metricFocus':
      return {
        question: 'What metrics interest you most?',
        options: [
          { value: 'all', label: 'All Metrics', description: METRIC_FOCUS_DESCRIPTIONS.all },
          { value: 'progress', label: 'Progress', description: METRIC_FOCUS_DESCRIPTIONS.progress },
          { value: 'time', label: 'Time Investment', description: METRIC_FOCUS_DESCRIPTIONS.time },
          { value: 'mastery', label: 'Mastery Levels', description: METRIC_FOCUS_DESCRIPTIONS.mastery },
          { value: 'engagement', label: 'Engagement', description: METRIC_FOCUS_DESCRIPTIONS.engagement },
        ],
      };

    case 'includeRecommendations':
      return {
        question: 'Would you like AI-powered recommendations based on your analytics?',
        options: [
          {
            value: 'yes',
            label: 'Yes',
            description: 'Include personalized learning suggestions',
          },
          { value: 'no', label: 'No', description: 'Just show the data' },
        ],
      };

    default:
      return { question: '' };
  }
}

function getNextStep(currentStep: CollectionStep, collected: Partial<LearningAnalyticsParams>): CollectionStep {
  const stepOrder: CollectionStep[] = [
    'scope',
    'course', // Only if scope === 'course'
    'timeRange',
    'metricFocus',
    'includeRecommendations',
    'complete',
  ];

  const currentIdx = stepOrder.indexOf(currentStep);
  let nextStep = stepOrder[currentIdx + 1];

  // Skip course step if scope is not 'course'
  if (nextStep === 'course' && collected.scope !== 'course') {
    nextStep = 'timeRange';
  }

  return nextStep;
}

function advanceState(state: CollectionState, value: unknown): CollectionState {
  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'scope':
      newCollected.scope = value as AnalyticsScope;
      break;
    case 'course':
      // If user chose comprehensive when no courses available
      if (value === 'comprehensive') {
        newCollected.scope = 'comprehensive';
        newCollected.courseId = undefined;
      } else {
        newCollected.courseId = value as string;
      }
      break;
    case 'timeRange':
      newCollected.timeRange = value as TimeRange;
      break;
    case 'metricFocus':
      newCollected.metricFocus = value as MetricFocus;
      break;
    case 'includeRecommendations':
      newCollected.includeRecommendations = value as boolean;
      break;
  }

  const nextStep = getNextStep(state.step, newCollected);

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<LearningAnalyticsParams>): string {
  const parts: string[] = [];
  if (collected.scope) parts.push(`Scope: ${collected.scope}`);
  if (collected.courseId) parts.push(`Course: ${collected.courseId.slice(0, 8)}...`);
  if (collected.timeRange) parts.push(`Range: ${collected.timeRange}`);
  if (collected.metricFocus) parts.push(`Focus: ${collected.metricFocus}`);
  if (collected.includeRecommendations !== undefined)
    parts.push(`Recommendations: ${collected.includeRecommendations ? 'Yes' : 'No'}`);
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createLearningAnalyticsHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = LearningAnalyticsInputSchema.safeParse(input);
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
      availableCourses,
      ...directParams
    } = parsed.data;

    logger.info('[LearningAnalyticsTool] Tool invoked with full input', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      userResponse: userResponse?.slice(0, 50),
      currentStep,
      hasInputCollected: !!inputCollected,
      inputCollected,
      directParams: Object.keys(directParams).filter(
        (k) => directParams[k as keyof typeof directParams] !== undefined
      ),
    });

    // -------------------------------------------------------------------------
    // Direct generation (all params provided)
    // -------------------------------------------------------------------------
    const hasAllParams =
      directParams.scope &&
      directParams.timeRange &&
      directParams.metricFocus &&
      directParams.includeRecommendations !== undefined;

    if (action === 'generate' || hasAllParams) {
      const params = directParams as LearningAnalyticsParams;

      logger.info('[LearningAnalyticsTool] Direct generation requested', {
        scope: params.scope,
        timeRange: params.timeRange,
        metricFocus: params.metricFocus,
      });

      return {
        success: true,
        output: {
          type: 'generate_analytics',
          params,
          message:
            `Generating your ${params.scope} learning analytics for the ${params.timeRange === 'all' ? 'complete history' : `last ${params.timeRange.replace('d', ' days')}`}...`,
          apiEndpoint: '/api/sam/learning-analytics/generate',
          triggerGeneration: true,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      const initialState: CollectionState = {
        step: 'scope',
        collected: {},
        conversationId: newConversationId,
        createdAt: Date.now(),
        availableCourses: availableCourses,
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options, hint } = getNextQuestion(initialState);

      logger.info('[LearningAnalyticsTool] Started new conversation', {
        conversationId: newConversationId,
        initialStep: 'scope',
      });

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
          message: `Let me help you explore your learning analytics! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    let state = conversationStates.get(conversationId);

    logger.info('[LearningAnalyticsTool] State lookup', {
      conversationId,
      foundInMap: !!state,
      mapSize: conversationStates.size,
      hasCurrentStep: !!currentStep,
      hasInputCollected: !!inputCollected,
    });

    // Stateless fallback: Reconstruct state from input if Map lookup fails
    if (!state && currentStep && inputCollected) {
      logger.info('[LearningAnalyticsTool] Reconstructing state from input (stateless mode)', {
        conversationId,
        currentStep,
        collected: inputCollected,
      });
      state = {
        step: currentStep,
        collected: inputCollected as Partial<LearningAnalyticsParams>,
        conversationId: conversationId ?? generateConversationId(),
        createdAt: Date.now(),
        availableCourses: availableCourses,
      };
      conversationStates.set(state.conversationId, state);
    }

    if (!state) {
      logger.warn('[LearningAnalyticsTool] Conversation not found and no stateless data provided', {
        conversationId,
        hasCurrentStep: !!currentStep,
        hasInputCollected: !!inputCollected,
      });
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message:
            'Conversation not found or expired. Let me start fresh - what analytics would you like to see?',
          recoverable: true,
        },
      };
    }

    // If no user response, just return the current question
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
    const parsedValue = parseUserResponse(userResponse, state.step, state);
    logger.info('[LearningAnalyticsTool] Parsed user response', {
      userResponse,
      step: state.step,
      parsedValue,
      isNull: parsedValue === null,
    });

    if (parsedValue === null) {
      const { question, options, hint } = getNextQuestion(state);
      logger.debug('[LearningAnalyticsTool] Failed to parse user response', {
        step: state.step,
        userResponse,
      });
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
          message: `I didn't quite catch that. ${question}`,
          retryReason: 'Could not parse response',
        },
      };
    }

    // Advance to next step
    const newState = advanceState(state, parsedValue);
    conversationStates.set(conversationId, newState);

    logger.info('[LearningAnalyticsTool] Advanced conversation state', {
      conversationId,
      previousStep: state.step,
      newStep: newState.step,
      parsedValue,
      newCollected: newState.collected,
    });

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as LearningAnalyticsParams;
      conversationStates.delete(conversationId);

      logger.info('[LearningAnalyticsTool] Conversation complete, triggering generation', {
        conversationId,
        params: formatCollectedSummary(params),
      });

      const timeRangeText = params.timeRange === 'all'
        ? 'complete learning history'
        : `last ${params.timeRange.replace('d', ' days')}`;

      return {
        success: true,
        output: {
          type: 'generate_analytics',
          params,
          message:
            `I have all the information I need. Generating your ${params.scope} analytics ` +
            `for the ${timeRangeText}${params.includeRecommendations ? ' with personalized recommendations' : ''}...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/learning-analytics/generate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    // Create a friendly acknowledgment based on what was just collected
    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'scope':
        acknowledgment = `${(parsedValue as string).charAt(0).toUpperCase() + (parsedValue as string).slice(1)} analytics - great choice!`;
        break;
      case 'course':
        acknowledgment = 'Course selected, perfect.';
        break;
      case 'timeRange':
        acknowledgment = `Looking at ${parsedValue === 'all' ? 'all time' : `the last ${(parsedValue as string).replace('d', ' days')}`}.`;
        break;
      case 'metricFocus':
        acknowledgment = `Focusing on ${parsedValue === 'all' ? 'all metrics' : parsedValue} - noted.`;
        break;
    }

    // Calculate progress
    const totalSteps = newState.collected.scope === 'course' ? 5 : 4;
    const currentStepNum = Object.keys(newState.collected).length;

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
          current: currentStepNum,
          total: totalSteps,
        },
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createLearningAnalyticsTool(): ToolDefinition {
  return {
    id: 'sam-learning-analytics',
    name: 'Learning Analytics',
    description:
      'Generates comprehensive learning analytics through conversational data collection. ' +
      'Gathers scope, time range, and metric preferences, then displays detailed analytics ' +
      'with visualizations and optional AI recommendations. ' +
      'Use this when a user wants to see their learning progress, statistics, or performance data.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createLearningAnalyticsHandler(),
    inputSchema: LearningAnalyticsInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_analytics']),
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
      triggerGeneration: z.boolean().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['analytics', 'progress', 'learning', 'statistics', 'metrics', 'insights', 'performance'],
    rateLimit: { maxCalls: 20, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30000,
    maxRetries: 2,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { SCOPE_DESCRIPTIONS, TIME_RANGE_DESCRIPTIONS, METRIC_FOCUS_DESCRIPTIONS };
