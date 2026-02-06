/**
 * Skill Roadmap Generator Tool
 *
 * Conversationally collects parameters and generates personalized
 * skill development roadmaps using the /api/sam/skill-roadmap/generate endpoint.
 *
 * Flow:
 * 1. User triggers tool (e.g., "I want to learn Python")
 * 2. Tool asks questions one-by-one to collect: skillName, currentLevel,
 *    targetLevel, hoursPerWeek, learningStyle, includeAssessments, prioritizeQuickWins
 * 3. Once all data collected, returns triggerGeneration: true
 * 4. Frontend calls /api/sam/skill-roadmap/generate with collected params
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

export type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

export type LearningStyle = 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';

export interface SkillRoadmapParams {
  skillName: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  hoursPerWeek: number;
  targetCompletionDate?: string;
  learningStyle: LearningStyle;
  includeAssessments: boolean;
  prioritizeQuickWins: boolean;
}

export type CollectionStep =
  | 'skillName'
  | 'currentLevel'
  | 'targetLevel'
  | 'hoursPerWeek'
  | 'learningStyle'
  | 'includeAssessments'
  | 'prioritizeQuickWins'
  | 'complete';

export interface CollectionState {
  step: CollectionStep;
  collected: Partial<SkillRoadmapParams>;
  conversationId: string;
  createdAt: number;
}

export interface ConversationOption {
  value: string;
  label: string;
  description?: string;
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const SkillRoadmapInputSchema = z.object({
  // Direct generation (all params provided)
  skillName: z.string().min(2).max(200).optional(),
  currentLevel: z
    .enum([
      'NOVICE',
      'BEGINNER',
      'COMPETENT',
      'PROFICIENT',
      'ADVANCED',
      'EXPERT',
      'STRATEGIST',
    ])
    .optional(),
  targetLevel: z
    .enum([
      'NOVICE',
      'BEGINNER',
      'COMPETENT',
      'PROFICIENT',
      'ADVANCED',
      'EXPERT',
      'STRATEGIST',
    ])
    .optional(),
  hoursPerWeek: z.number().min(1).max(40).optional(),
  learningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).optional(),
  includeAssessments: z.boolean().optional(),
  prioritizeQuickWins: z.boolean().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  // Current step for stateless continuation (serverless-friendly)
  currentStep: z.enum([
    'skillName',
    'currentLevel',
    'targetLevel',
    'hoursPerWeek',
    'learningStyle',
    'includeAssessments',
    'prioritizeQuickWins',
    'complete',
  ]).optional(),
  // Previously collected data for stateless continuation
  collected: z.object({
    skillName: z.string().optional(),
    currentLevel: z.enum([
      'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
    ]).optional(),
    targetLevel: z.enum([
      'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
    ]).optional(),
    hoursPerWeek: z.number().optional(),
    learningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).optional(),
    includeAssessments: z.boolean().optional(),
    prioritizeQuickWins: z.boolean().optional(),
  }).optional(),

  // Action
  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const LEVEL_ORDER: ProficiencyLevel[] = [
  'NOVICE',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'ADVANCED',
  'EXPERT',
  'STRATEGIST',
];

const LEVEL_DESCRIPTIONS: Record<ProficiencyLevel, string> = {
  NOVICE: 'No prior experience',
  BEGINNER: 'Basic familiarity with concepts',
  COMPETENT: 'Can work independently on simple tasks',
  PROFICIENT: 'Handles complex tasks with confidence',
  ADVANCED: 'Deep expertise, can mentor others',
  EXPERT: 'Industry-recognized authority',
  STRATEGIST: 'Shapes industry direction',
};

const LEARNING_STYLE_DESCRIPTIONS: Record<LearningStyle, string> = {
  STRUCTURED: 'Step-by-step courses with clear progression',
  PROJECT_BASED: 'Learning through hands-on projects',
  MIXED: 'Combination of structured learning and projects',
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
  return `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getValidTargetLevels(currentLevel: ProficiencyLevel): ProficiencyLevel[] {
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);
  return LEVEL_ORDER.slice(currentIdx + 1);
}

function parseUserResponse(
  response: string,
  step: CollectionStep,
  state: CollectionState
): unknown {
  const normalized = response.trim().toUpperCase();
  const lowerResponse = response.trim().toLowerCase();

  switch (step) {
    case 'skillName':
      // Accept any non-empty string as skill name
      const skillName = response.trim();
      if (skillName.length >= 2 && skillName.length <= 200) {
        return skillName;
      }
      return null;

    case 'currentLevel':
    case 'targetLevel':
      // Match exact level names
      for (const level of LEVEL_ORDER) {
        if (normalized === level || normalized.includes(level)) {
          // For target level, validate it's above current
          if (step === 'targetLevel' && state.collected.currentLevel) {
            const currentIdx = LEVEL_ORDER.indexOf(state.collected.currentLevel);
            const targetIdx = LEVEL_ORDER.indexOf(level);
            if (targetIdx <= currentIdx) continue;
          }
          return level;
        }
      }
      // Match common descriptions
      if (lowerResponse.includes('no') && lowerResponse.includes('experience'))
        return 'NOVICE';
      if (lowerResponse.includes('basic') || lowerResponse.includes('just started'))
        return 'BEGINNER';
      if (lowerResponse.includes('independent') || lowerResponse.includes('simple'))
        return 'COMPETENT';
      if (
        lowerResponse.includes('complex') ||
        lowerResponse.includes('confident')
      )
        return 'PROFICIENT';
      if (lowerResponse.includes('mentor') || lowerResponse.includes('deep'))
        return 'ADVANCED';
      if (lowerResponse.includes('authority') || lowerResponse.includes('recognized'))
        return 'EXPERT';
      if (lowerResponse.includes('industry') || lowerResponse.includes('direction'))
        return 'STRATEGIST';
      return null;

    case 'hoursPerWeek':
      // Extract number from response
      const hourMatches = response.match(/(\d+)/);
      if (hourMatches) {
        const hours = parseInt(hourMatches[1], 10);
        if (hours >= 1 && hours <= 40) {
          return hours;
        }
      }
      // Handle word numbers
      const wordNumbers: Record<string, number> = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        fifteen: 15,
        twenty: 20,
      };
      for (const [word, num] of Object.entries(wordNumbers)) {
        if (lowerResponse.includes(word)) {
          return num;
        }
      }
      return null;

    case 'learningStyle':
      if (
        normalized.includes('STRUCTURED') ||
        lowerResponse.includes('course') ||
        lowerResponse.includes('step by step') ||
        lowerResponse.includes('step-by-step')
      )
        return 'STRUCTURED';
      if (
        normalized.includes('PROJECT') ||
        lowerResponse.includes('hands-on') ||
        lowerResponse.includes('hands on') ||
        lowerResponse.includes('build')
      )
        return 'PROJECT_BASED';
      if (
        normalized.includes('MIX') ||
        lowerResponse.includes('both') ||
        lowerResponse.includes('combination') ||
        lowerResponse.includes('balance')
      )
        return 'MIXED';
      return null;

    case 'includeAssessments':
    case 'prioritizeQuickWins':
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
    case 'skillName':
      return {
        question: 'What skill would you like to build a learning roadmap for?',
        hint: 'For example: Python, React, Machine Learning, Data Analysis, etc.',
      };

    case 'currentLevel':
      return {
        question: `What's your current ${state.collected.skillName} proficiency level?`,
        options: LEVEL_ORDER.map((level) => ({
          value: level,
          label: level.charAt(0) + level.slice(1).toLowerCase(),
          description: LEVEL_DESCRIPTIONS[level],
        })),
      };

    case 'targetLevel':
      const validTargets = getValidTargetLevels(state.collected.currentLevel!);
      return {
        question: 'What level would you like to reach?',
        options: validTargets.map((level) => ({
          value: level,
          label: level.charAt(0) + level.slice(1).toLowerCase(),
          description: LEVEL_DESCRIPTIONS[level],
        })),
      };

    case 'hoursPerWeek':
      return {
        question: 'How many hours per week can you dedicate to learning?',
        options: [
          { value: '5', label: '5 hours/week', description: 'Casual pace' },
          { value: '10', label: '10 hours/week', description: 'Steady progress' },
          {
            value: '15',
            label: '15 hours/week',
            description: 'Accelerated learning',
          },
          { value: '20', label: '20+ hours/week', description: 'Intensive study' },
        ],
        hint: 'You can also type a specific number (1-40)',
      };

    case 'learningStyle':
      return {
        question: "What's your preferred learning style?",
        options: Object.entries(LEARNING_STYLE_DESCRIPTIONS).map(
          ([value, description]) => ({
            value,
            label: value
              .charAt(0)
              .toUpperCase()
              .concat(value.slice(1).toLowerCase().replace('_', '-')),
            description,
          })
        ),
      };

    case 'includeAssessments':
      return {
        question: 'Would you like assessments to track your progress?',
        options: [
          {
            value: 'yes',
            label: 'Yes',
            description: 'Include quizzes and checkpoints',
          },
          { value: 'no', label: 'No', description: 'Skip assessments' },
        ],
      };

    case 'prioritizeQuickWins':
      return {
        question: 'Should I prioritize quick wins to keep you motivated?',
        options: [
          {
            value: 'yes',
            label: 'Yes',
            description: 'Include early achievable milestones',
          },
          {
            value: 'no',
            label: 'No',
            description: 'Focus on efficient progression',
          },
        ],
      };

    default:
      return { question: '' };
  }
}

function advanceState(state: CollectionState, value: unknown): CollectionState {
  const stepOrder: CollectionStep[] = [
    'skillName',
    'currentLevel',
    'targetLevel',
    'hoursPerWeek',
    'learningStyle',
    'includeAssessments',
    'prioritizeQuickWins',
    'complete',
  ];

  const currentIdx = stepOrder.indexOf(state.step);
  const nextStep = stepOrder[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'skillName':
      newCollected.skillName = value as string;
      break;
    case 'currentLevel':
      newCollected.currentLevel = value as ProficiencyLevel;
      break;
    case 'targetLevel':
      newCollected.targetLevel = value as ProficiencyLevel;
      break;
    case 'hoursPerWeek':
      newCollected.hoursPerWeek = value as number;
      break;
    case 'learningStyle':
      newCollected.learningStyle = value as LearningStyle;
      break;
    case 'includeAssessments':
      newCollected.includeAssessments = value as boolean;
      break;
    case 'prioritizeQuickWins':
      newCollected.prioritizeQuickWins = value as boolean;
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<SkillRoadmapParams>): string {
  const parts: string[] = [];
  if (collected.skillName) parts.push(`Skill: ${collected.skillName}`);
  if (collected.currentLevel)
    parts.push(`Current Level: ${collected.currentLevel}`);
  if (collected.targetLevel) parts.push(`Target Level: ${collected.targetLevel}`);
  if (collected.hoursPerWeek)
    parts.push(`Hours/Week: ${collected.hoursPerWeek}`);
  if (collected.learningStyle)
    parts.push(`Style: ${collected.learningStyle}`);
  if (collected.includeAssessments !== undefined)
    parts.push(`Assessments: ${collected.includeAssessments ? 'Yes' : 'No'}`);
  if (collected.prioritizeQuickWins !== undefined)
    parts.push(`Quick Wins: ${collected.prioritizeQuickWins ? 'Yes' : 'No'}`);
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createSkillRoadmapHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = SkillRoadmapInputSchema.safeParse(input);
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

    const { action, conversationId, userResponse, currentStep, collected: inputCollected, ...directParams } = parsed.data;

    // DEBUG: Log ALL input data to trace the issue
    logger.info('[SkillRoadmapGenerator] Tool invoked with full input', {
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
      rawInput: JSON.stringify(input).slice(0, 500),
    });

    // -------------------------------------------------------------------------
    // Direct generation (all params provided)
    // -------------------------------------------------------------------------
    const hasAllParams =
      directParams.skillName &&
      directParams.currentLevel &&
      directParams.targetLevel &&
      directParams.hoursPerWeek &&
      directParams.learningStyle &&
      directParams.includeAssessments !== undefined &&
      directParams.prioritizeQuickWins !== undefined;

    if (action === 'generate' || hasAllParams) {
      const params = directParams as SkillRoadmapParams;

      // Validate target > current
      const currentIdx = LEVEL_ORDER.indexOf(params.currentLevel);
      const targetIdx = LEVEL_ORDER.indexOf(params.targetLevel);
      if (targetIdx <= currentIdx) {
        return {
          success: false,
          error: {
            code: 'INVALID_LEVELS',
            message: 'Target level must be higher than current level',
            recoverable: true,
          },
        };
      }

      logger.info('[SkillRoadmapGenerator] Direct generation requested', {
        skill: params.skillName,
        currentLevel: params.currentLevel,
        targetLevel: params.targetLevel,
      });

      return {
        success: true,
        output: {
          type: 'generate_roadmap',
          params,
          message:
            `Ready to generate your ${params.skillName} learning roadmap! ` +
            `From ${params.currentLevel} to ${params.targetLevel} with ${params.hoursPerWeek} hours/week.`,
          apiEndpoint: '/api/sam/skill-roadmap/generate',
          triggerGeneration: true,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      // If skillName was provided in the initial message, skip that step
      const initialStep: CollectionStep = directParams.skillName
        ? 'currentLevel'
        : 'skillName';
      const initialCollected: Partial<SkillRoadmapParams> = directParams.skillName
        ? { skillName: directParams.skillName }
        : {};

      const initialState: CollectionState = {
        step: initialStep,
        collected: initialCollected,
        conversationId: newConversationId,
        createdAt: Date.now(),
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options, hint } = getNextQuestion(initialState);

      logger.info('[SkillRoadmapGenerator] Started new conversation', {
        conversationId: newConversationId,
        initialStep,
        skillName: directParams.skillName,
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
          message: directParams.skillName
            ? `I'll help you create a learning roadmap for ${directParams.skillName}! ${question}`
            : `I'd love to help you build a personalized learning roadmap! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    let state = conversationStates.get(conversationId);

    // DEBUG: Log state lookup result
    logger.info('[SkillRoadmapGenerator] State lookup', {
      conversationId,
      foundInMap: !!state,
      mapSize: conversationStates.size,
      hasCurrentStep: !!currentStep,
      hasInputCollected: !!inputCollected,
    });

    // Stateless fallback: Reconstruct state from input if Map lookup fails (serverless-friendly)
    if (!state && currentStep && inputCollected) {
      logger.info('[SkillRoadmapGenerator] Reconstructing state from input (stateless mode)', {
        conversationId,
        currentStep,
        collected: inputCollected,
      });
      state = {
        step: currentStep,
        collected: inputCollected as Partial<SkillRoadmapParams>,
        conversationId: conversationId ?? generateConversationId(),
        createdAt: Date.now(),
      };
      // Store it for this request's duration
      conversationStates.set(state.conversationId, state);
    }

    if (!state) {
      logger.warn('[SkillRoadmapGenerator] Conversation not found and no stateless data provided', {
        conversationId,
        hasCurrentStep: !!currentStep,
        hasInputCollected: !!inputCollected,
      });
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message:
            'Conversation not found or expired. Let me start fresh - what skill would you like to learn?',
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
    logger.info('[SkillRoadmapGenerator] Parsed user response', {
      userResponse,
      step: state.step,
      parsedValue,
      isNull: parsedValue === null,
    });
    if (parsedValue === null) {
      const { question, options, hint } = getNextQuestion(state);
      logger.debug('[SkillRoadmapGenerator] Failed to parse user response', {
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

    logger.info('[SkillRoadmapGenerator] Advanced conversation state', {
      conversationId,
      previousStep: state.step,
      newStep: newState.step,
      parsedValue,
      newCollected: newState.collected,
    });

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as SkillRoadmapParams;
      conversationStates.delete(conversationId);

      logger.info('[SkillRoadmapGenerator] Conversation complete, triggering generation', {
        conversationId,
        params: formatCollectedSummary(params),
      });

      return {
        success: true,
        output: {
          type: 'generate_roadmap',
          params,
          message:
            `I have all the information I need. Generating your personalized ` +
            `${params.skillName} learning roadmap from ${params.currentLevel} to ${params.targetLevel}...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/skill-roadmap/generate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    // Create a friendly acknowledgment based on what was just collected
    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'skillName':
        acknowledgment = `${parsedValue} - great choice!`;
        break;
      case 'currentLevel':
        acknowledgment = `Starting from ${(parsedValue as string).toLowerCase()}, perfect.`;
        break;
      case 'targetLevel':
        acknowledgment = `Aiming for ${(parsedValue as string).toLowerCase()} - ambitious!`;
        break;
      case 'hoursPerWeek':
        acknowledgment = `${parsedValue} hours per week works well.`;
        break;
      case 'learningStyle':
        acknowledgment = `${(parsedValue as string).replace('_', '-').toLowerCase()} approach, noted.`;
        break;
      case 'includeAssessments':
        acknowledgment = parsedValue
          ? 'Assessments included for progress tracking.'
          : 'No problem, skipping assessments.';
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
          total: 7,
        },
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createSkillRoadmapGeneratorTool(): ToolDefinition {
  return {
    id: 'sam-skill-roadmap-generator',
    name: 'Skill Roadmap Generator',
    description:
      'Creates personalized skill development roadmaps through conversational data collection. ' +
      'Gathers skill name, current/target proficiency levels, time commitment, and learning preferences, ' +
      'then generates a comprehensive roadmap with phases, courses, and projects. ' +
      'Use this when a user wants to create a learning path or skill development plan.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createSkillRoadmapHandler(),
    inputSchema: SkillRoadmapInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_roadmap']),
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
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.WRITE],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['content', 'roadmap', 'skill', 'learning', 'career', 'planning', 'personalization'],
    rateLimit: { maxCalls: 10, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30000,
    maxRetries: 2,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { LEVEL_ORDER, LEVEL_DESCRIPTIONS, LEARNING_STYLE_DESCRIPTIONS };
