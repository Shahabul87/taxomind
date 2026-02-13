/**
 * Skill Navigator Tool
 *
 * Enhanced conversational tool that collects 7 parameters via the NAVIGATOR
 * framework and triggers a 6-stage AI pipeline for strategic roadmap generation.
 *
 * Flow:
 * 1. User triggers tool (e.g., "I want to learn Python for a career switch")
 * 2. Tool asks 7 questions: skillName, goalOutcome, goalType, currentLevel,
 *    hoursPerWeek, deadline, confirm
 * 3. Smart defaults: targetLevel inferred from goalType, learningStyle from prefs
 * 4. Once confirmed, returns triggerGeneration: true with apiEndpoint
 * 5. Frontend calls /api/sam/skill-navigator/orchestrate with collected params
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
  NavigatorCollectionStep,
  NavigatorCollectionState,
  NavigatorCollectedParams,
  NavigatorGoalType,
  ProficiencyLevel,
  NavigatorConversationOption,
} from '@/lib/sam/skill-navigator/agentic-types';
import {
  GOAL_TYPE_TARGET_LEVEL,
  GOAL_TYPE_LABELS,
  DEADLINE_LABELS,
} from '@/lib/sam/skill-navigator/agentic-types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const SkillNavigatorInputSchema = z.object({
  skillName: z.string().min(2).max(200).optional(),
  goalOutcome: z.string().min(2).max(500).optional(),
  goalType: z.enum([
    'career_switch', 'job_interview', 'research', 'build_product', 'hobby', 'job_requirement', 'teaching',
  ]).optional(),
  currentLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
  ]).optional(),
  hoursPerWeek: z.number().min(1).max(40).optional(),
  deadline: z.string().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z.enum([
    'skillName', 'goalOutcome', 'goalType', 'currentLevel', 'hoursPerWeek', 'deadline', 'confirm', 'complete',
  ]).optional(),
  collected: z.object({
    skillName: z.string().optional(),
    goalOutcome: z.string().optional(),
    goalType: z.enum([
      'career_switch', 'job_interview', 'research', 'build_product', 'hobby', 'job_requirement', 'teaching',
    ]).optional(),
    currentLevel: z.enum([
      'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
    ]).optional(),
    targetLevel: z.enum([
      'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
    ]).optional(),
    hoursPerWeek: z.number().optional(),
    deadline: z.string().optional(),
    learningStyle: z.string().optional(),
  }).optional(),

  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const LEVEL_ORDER: ProficiencyLevel[] = [
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
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

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, NavigatorCollectionState>();
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

function generateConversationId(): string {
  return `navigator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// PARSING
// =============================================================================

function parseUserResponse(
  response: string,
  step: NavigatorCollectionStep,
  state: NavigatorCollectionState,
): unknown {
  const lowerResponse = response.trim().toLowerCase();
  const normalized = response.trim().toUpperCase();

  switch (step) {
    case 'skillName': {
      const skill = response.trim();
      return skill.length >= 2 && skill.length <= 200 ? skill : null;
    }

    case 'goalOutcome': {
      const goal = response.trim();
      return goal.length >= 2 && goal.length <= 500 ? goal : null;
    }

    case 'goalType': {
      const goalTypes: Array<{ key: NavigatorGoalType; patterns: string[] }> = [
        { key: 'career_switch', patterns: ['career', 'switch', 'change', 'transition', 'new job', 'new career'] },
        { key: 'job_interview', patterns: ['interview', 'job interview', 'prepare', 'hired'] },
        { key: 'research', patterns: ['research', 'academic', 'deep dive', 'phd', 'thesis'] },
        { key: 'build_product', patterns: ['build', 'product', 'app', 'project', 'startup', 'create'] },
        { key: 'hobby', patterns: ['hobby', 'fun', 'personal', 'interest', 'curious'] },
        { key: 'job_requirement', patterns: ['job requirement', 'work needs', 'employer', 'required', 'job needs'] },
        { key: 'teaching', patterns: ['teach', 'mentor', 'train', 'instruct', 'educate'] },
      ];

      // Check exact match first
      for (const gt of goalTypes) {
        if (lowerResponse === gt.key || lowerResponse === gt.key.replace('_', ' ')) {
          return gt.key;
        }
      }
      // Check pattern match
      for (const gt of goalTypes) {
        if (gt.patterns.some((p) => lowerResponse.includes(p))) {
          return gt.key;
        }
      }
      return null;
    }

    case 'currentLevel': {
      for (const level of LEVEL_ORDER) {
        if (normalized === level || normalized.includes(level)) {
          return level;
        }
      }
      if (lowerResponse.includes('no') && lowerResponse.includes('experience')) return 'NOVICE';
      if (lowerResponse.includes('basic') || lowerResponse.includes('just started')) return 'BEGINNER';
      if (lowerResponse.includes('independent') || lowerResponse.includes('simple')) return 'COMPETENT';
      if (lowerResponse.includes('complex') || lowerResponse.includes('confident')) return 'PROFICIENT';
      if (lowerResponse.includes('mentor') || lowerResponse.includes('deep')) return 'ADVANCED';
      if (lowerResponse.includes('authority') || lowerResponse.includes('recognized')) return 'EXPERT';
      if (lowerResponse.includes('industry') || lowerResponse.includes('direction')) return 'STRATEGIST';
      return null;
    }

    case 'hoursPerWeek': {
      const hourMatches = response.match(/(\d+)/);
      if (hourMatches) {
        const hours = parseInt(hourMatches[1], 10);
        if (hours >= 1 && hours <= 40) return hours;
      }
      const wordNumbers: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        fifteen: 15, twenty: 20,
      };
      for (const [word, num] of Object.entries(wordNumbers)) {
        if (lowerResponse.includes(word)) return num;
      }
      return null;
    }

    case 'deadline': {
      const deadlineMap: Record<string, string> = {
        '1 month': '1_month', 'one month': '1_month', '1_month': '1_month', '30 days': '1_month',
        '3 months': '3_months', 'three months': '3_months', '3_months': '3_months', '90 days': '3_months',
        '6 months': '6_months', 'six months': '6_months', '6_months': '6_months',
        '1 year': '1_year', 'one year': '1_year', '1_year': '1_year', '12 months': '1_year',
        'flexible': 'flexible', 'no deadline': 'flexible', 'none': 'flexible', 'no': 'flexible',
      };
      for (const [pattern, value] of Object.entries(deadlineMap)) {
        if (lowerResponse.includes(pattern)) return value;
      }
      return null;
    }

    case 'confirm': {
      if (
        lowerResponse.includes('yes') || lowerResponse.includes('sure') ||
        lowerResponse.includes('go') || lowerResponse.includes('ready') ||
        lowerResponse.includes('confirm') || lowerResponse === 'y'
      ) return 'yes';
      if (
        lowerResponse.includes('adjust') || lowerResponse.includes('change') ||
        lowerResponse.includes('no') || lowerResponse === 'n'
      ) return 'adjust';
      return null;
    }

    default:
      return response.trim();
  }
}

// =============================================================================
// QUESTION BUILDER
// =============================================================================

function getNextQuestion(state: NavigatorCollectionState): {
  question: string;
  options?: NavigatorConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'skillName':
      return {
        question: 'What skill do you want to build?',
        hint: 'For example: Python, React, Machine Learning, Data Science, etc.',
      };

    case 'goalOutcome':
      return {
        question: `What do you want to BE ABLE TO DO after mastering ${state.collected.skillName}?`,
        hint: 'Be specific: "Build full-stack web apps" or "Pass a coding interview at FAANG"',
      };

    case 'goalType':
      return {
        question: 'Why do you need this skill?',
        options: Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => ({
          value,
          label,
          description: getGoalTypeDescription(value as NavigatorGoalType),
        })),
      };

    case 'currentLevel':
      return {
        question: `What&apos;s your current ${state.collected.skillName} level?`,
        options: LEVEL_ORDER.map((level) => ({
          value: level,
          label: level.charAt(0) + level.slice(1).toLowerCase(),
          description: LEVEL_DESCRIPTIONS[level],
        })),
      };

    case 'hoursPerWeek':
      return {
        question: 'How many hours per week can you dedicate?',
        options: [
          { value: '5', label: '5 hrs/week', description: 'Casual pace' },
          { value: '10', label: '10 hrs/week', description: 'Steady progress' },
          { value: '15', label: '15 hrs/week', description: 'Accelerated learning' },
          { value: '20', label: '20+ hrs/week', description: 'Intensive study' },
        ],
        hint: 'You can also type a specific number (1-40)',
      };

    case 'deadline':
      return {
        question: 'Do you have a deadline?',
        options: Object.entries(DEADLINE_LABELS).map(([value, label]) => ({
          value,
          label,
          description: getDeadlineDescription(value),
        })),
      };

    case 'confirm': {
      const c = state.collected;
      const targetLevel = c.goalType ? GOAL_TYPE_TARGET_LEVEL[c.goalType] : 'PROFICIENT';
      return {
        question: 'Ready to build your NAVIGATOR roadmap?',
        options: [
          { value: 'yes', label: 'Build it!', description: 'Start the 6-stage NAVIGATOR analysis' },
          { value: 'adjust', label: 'Adjust', description: 'Go back and change something' },
        ],
        hint: `Summary: ${c.skillName} | ${c.goalType ? GOAL_TYPE_LABELS[c.goalType] : ''} | ${c.currentLevel} -> ${targetLevel} | ${c.hoursPerWeek}h/week | ${c.deadline ? DEADLINE_LABELS[c.deadline] ?? c.deadline : 'Flexible'}`,
      };
    }

    default:
      return { question: '' };
  }
}

function getGoalTypeDescription(type: NavigatorGoalType): string {
  const descriptions: Record<NavigatorGoalType, string> = {
    career_switch: 'Moving to a new career that requires this skill',
    job_interview: 'Preparing for a job interview',
    research: 'Deep expertise for academic or research purposes',
    build_product: 'Building an app, product, or project',
    hobby: 'Personal interest and exploration',
    job_requirement: 'Required skill for current or upcoming role',
    teaching: 'Learning to teach or mentor others',
  };
  return descriptions[type];
}

function getDeadlineDescription(deadline: string): string {
  const descriptions: Record<string, string> = {
    '1_month': 'Urgent - aggressive pace needed',
    '3_months': 'Short-term - focused and efficient',
    '6_months': 'Medium-term - balanced approach',
    '1_year': 'Long-term - thorough and comprehensive',
    flexible: 'No time pressure - learn at your own pace',
  };
  return descriptions[deadline] ?? '';
}

// =============================================================================
// STATE ADVANCEMENT
// =============================================================================

function advanceState(state: NavigatorCollectionState, value: unknown): NavigatorCollectionState {
  const stepOrder: NavigatorCollectionStep[] = [
    'skillName', 'goalOutcome', 'goalType', 'currentLevel', 'hoursPerWeek', 'deadline', 'confirm', 'complete',
  ];

  const currentIdx = stepOrder.indexOf(state.step);
  const nextStep = stepOrder[currentIdx + 1];
  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'skillName':
      newCollected.skillName = value as string;
      break;
    case 'goalOutcome':
      newCollected.goalOutcome = value as string;
      break;
    case 'goalType': {
      const goalType = value as NavigatorGoalType;
      newCollected.goalType = goalType;
      // Smart default: set targetLevel based on goalType
      newCollected.targetLevel = GOAL_TYPE_TARGET_LEVEL[goalType];
      // Smart default: set learningStyle
      newCollected.learningStyle = goalType === 'build_product' ? 'PROJECT_BASED' : 'MIXED';
      break;
    }
    case 'currentLevel':
      newCollected.currentLevel = value as ProficiencyLevel;
      break;
    case 'hoursPerWeek':
      newCollected.hoursPerWeek = value as number;
      break;
    case 'deadline':
      newCollected.deadline = value as string;
      break;
    case 'confirm':
      // If 'adjust', reset to skillName
      if (value === 'adjust') {
        return { ...state, step: 'skillName', collected: {} };
      }
      break;
  }

  return { ...state, step: nextStep, collected: newCollected };
}

function formatCollectedSummary(collected: Partial<NavigatorCollectedParams>): string {
  const parts: string[] = [];
  if (collected.skillName) parts.push(`Skill: ${collected.skillName}`);
  if (collected.goalOutcome) parts.push(`Goal: ${collected.goalOutcome.slice(0, 50)}...`);
  if (collected.goalType) parts.push(`Type: ${GOAL_TYPE_LABELS[collected.goalType]}`);
  if (collected.currentLevel) parts.push(`From: ${collected.currentLevel}`);
  if (collected.targetLevel) parts.push(`To: ${collected.targetLevel}`);
  if (collected.hoursPerWeek) parts.push(`${collected.hoursPerWeek}h/week`);
  if (collected.deadline) parts.push(`Deadline: ${DEADLINE_LABELS[collected.deadline] ?? collected.deadline}`);
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createSkillNavigatorHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = SkillNavigatorInputSchema.safeParse(input);
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

    logger.info('[SkillNavigator] Tool invoked', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      currentStep,
      rawInput: JSON.stringify(input).slice(0, 300),
    });

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();
      const initialStep: NavigatorCollectionStep = directParams.skillName ? 'goalOutcome' : 'skillName';
      const initialCollected: Partial<NavigatorCollectedParams> = directParams.skillName
        ? { skillName: directParams.skillName }
        : {};

      const initialState: NavigatorCollectionState = {
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
          message: directParams.skillName
            ? `I'll build a NAVIGATOR roadmap for ${directParams.skillName}! ${question}`
            : `Let's build a strategic learning roadmap with the NAVIGATOR framework! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    let state = conversationStates.get(conversationId);

    // Stateless fallback
    if (!state && currentStep && inputCollected) {
      state = {
        step: currentStep,
        collected: inputCollected as Partial<NavigatorCollectedParams>,
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
          message: 'Conversation not found. Let me start fresh - what skill would you like to master?',
          recoverable: true,
        },
      };
    }

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

    // Parse response
    const parsedValue = parseUserResponse(userResponse, state.step, state);
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
          message: `I didn't quite catch that. ${question}`,
          retryReason: 'Could not parse response',
        },
      };
    }

    // Advance state
    const newState = advanceState(state, parsedValue);
    conversationStates.set(conversationId, newState);

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as NavigatorCollectedParams;
      conversationStates.delete(conversationId);

      return {
        success: true,
        output: {
          type: 'generate_roadmap',
          params,
          message:
            `Launching the NAVIGATOR pipeline! I'll analyze your data, build a skill graph, ` +
            `map gaps, and create your strategic ${params.skillName} roadmap...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/skill-navigator/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'skillName':
        acknowledgment = `${parsedValue} - excellent choice!`;
        break;
      case 'goalOutcome':
        acknowledgment = 'Great goal! That helps me design the right path.';
        break;
      case 'goalType': {
        const gt = parsedValue as NavigatorGoalType;
        const targetLevel = GOAL_TYPE_TARGET_LEVEL[gt];
        acknowledgment = `${GOAL_TYPE_LABELS[gt]} - I'll target ${targetLevel} level for you.`;
        break;
      }
      case 'currentLevel':
        acknowledgment = `Starting from ${(parsedValue as string).toLowerCase()}, noted.`;
        break;
      case 'hoursPerWeek':
        acknowledgment = `${parsedValue} hours per week - I'll plan around that.`;
        break;
      case 'deadline':
        acknowledgment = `${DEADLINE_LABELS[parsedValue as string] ?? parsedValue} - timeline locked in.`;
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
          current: Object.keys(newState.collected).filter((k) => k !== 'targetLevel' && k !== 'learningStyle').length,
          total: 7,
        },
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createSkillNavigatorTool(): ToolDefinition {
  return {
    id: 'sam-skill-navigator',
    name: 'Skill Navigator',
    description:
      'Strategic skill development roadmap builder using the NAVIGATOR framework. ' +
      'Performs 6-stage analysis: data collection, need analysis, skill graph construction, ' +
      'gap analysis, path architecture, and resource optimization. ' +
      'Creates personalized roadmaps with dependency-aware skill trees, exit ramps, ' +
      'contingency plans, and checkpoint verification. ' +
      'Use this when a user wants to build a comprehensive learning path, plan a career switch, ' +
      'or create a strategic skill development plan.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createSkillNavigatorHandler(),
    inputSchema: SkillNavigatorInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_roadmap']),
      conversationId: z.string().optional(),
      step: z.string().optional(),
      question: z.string().optional(),
      options: z.array(z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })).optional(),
      hint: z.string().optional(),
      collected: z.record(z.unknown()).optional(),
      message: z.string().optional(),
      retryReason: z.string().optional(),
      progress: z.object({ current: z.number(), total: z.number() }).optional(),
      params: z.record(z.unknown()).optional(),
      summary: z.string().optional(),
      apiEndpoint: z.string().optional(),
      triggerGeneration: z.boolean().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.WRITE],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: [
      'content', 'roadmap', 'skill', 'learning', 'career', 'planning',
      'navigator', 'strategic', 'gap-analysis', 'skill-graph',
    ],
    rateLimit: { maxCalls: 10, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30000,
    maxRetries: 2,
  };
}
