/**
 * SAM Course Creator Tool
 *
 * Conversationally collects parameters and generates AI-powered courses
 * with chapters, sections, and learning objectives aligned to Bloom's taxonomy.
 *
 * Flow:
 * 1. User triggers tool (e.g., "Create a course about React")
 * 2. Tool asks questions one-by-one to collect: courseName, subject,
 *    targetAudience, difficulty, bloomsFocus, chapterCount, contentTypes
 * 3. Once all data collected, returns triggerGeneration: true
 * 4. Frontend/SAM calls orchestrateCourseCreation() with collected params
 *
 * Follows the exact pattern from skill-roadmap-generator.ts.
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
import type { BloomsLevel, ContentType } from '@/lib/sam/course-creation/types';
import { BLOOMS_LEVELS, CONTENT_TYPES } from '@/lib/sam/course-creation/types';

// =============================================================================
// TYPES
// =============================================================================

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CourseCreatorParams {
  courseName: string;
  subject: string;
  targetAudience: string;
  difficulty: Difficulty;
  bloomsFocus: BloomsLevel[];
  chapterCount: number;
  contentTypes: ContentType[];
}

export type CourseCollectionStep =
  | 'courseName'
  | 'subject'
  | 'targetAudience'
  | 'difficulty'
  | 'bloomsFocus'
  | 'chapterCount'
  | 'contentTypes'
  | 'complete';

export interface CourseCollectionState {
  step: CourseCollectionStep;
  collected: Partial<CourseCreatorParams>;
  conversationId: string;
  createdAt: number;
}

interface ConversationOption {
  value: string;
  label: string;
  description?: string;
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const CourseCreatorInputSchema = z.object({
  // Direct generation (all params provided)
  courseName: z.string().min(2).max(200).optional(),
  subject: z.string().min(2).max(200).optional(),
  targetAudience: z.string().min(2).max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  bloomsFocus: z.array(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])).optional(),
  chapterCount: z.number().min(3).max(15).optional(),
  contentTypes: z.array(z.enum(['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'])).optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z.enum([
    'courseName', 'subject', 'targetAudience', 'difficulty',
    'bloomsFocus', 'chapterCount', 'contentTypes', 'complete',
  ]).optional(),
  collected: z.object({
    courseName: z.string().optional(),
    subject: z.string().optional(),
    targetAudience: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    bloomsFocus: z.array(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])).optional(),
    chapterCount: z.number().optional(),
    contentTypes: z.array(z.enum(['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'])).optional(),
  }).optional(),

  // Action
  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: 'No prior knowledge required',
  intermediate: 'Some foundational knowledge expected',
  advanced: 'Solid understanding of fundamentals needed',
  expert: 'Deep expertise in the domain required',
};

const AUDIENCE_PRESETS: ConversationOption[] = [
  { value: 'beginners', label: 'Beginners', description: 'People new to the topic' },
  { value: 'professionals', label: 'Professionals', description: 'Working professionals upskilling' },
  { value: 'students', label: 'Students', description: 'University or college students' },
  { value: 'career changers', label: 'Career Changers', description: 'People transitioning to a new field' },
];

const BLOOMS_DESCRIPTIONS: Record<BloomsLevel, string> = {
  REMEMBER: 'Recall facts and basic concepts',
  UNDERSTAND: 'Explain ideas and concepts',
  APPLY: 'Use information in new situations',
  ANALYZE: 'Draw connections among ideas',
  EVALUATE: 'Justify decisions and judgments',
  CREATE: 'Produce original work',
};

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, CourseCollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
  return `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseUserResponse(
  response: string,
  step: CourseCollectionStep,
  _state: CourseCollectionState
): unknown {
  const trimmed = response.trim();
  const lowerResponse = trimmed.toLowerCase();

  switch (step) {
    case 'courseName':
    case 'subject':
      if (trimmed.length >= 2 && trimmed.length <= 200) {
        return trimmed;
      }
      return null;

    case 'targetAudience': {
      // Match presets
      for (const preset of AUDIENCE_PRESETS) {
        if (lowerResponse.includes(preset.value) || lowerResponse.includes(preset.label.toLowerCase())) {
          return preset.value;
        }
      }
      // Accept any string 2-200 chars
      if (trimmed.length >= 2 && trimmed.length <= 200) {
        return trimmed;
      }
      return null;
    }

    case 'difficulty': {
      const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
      for (const d of difficulties) {
        if (lowerResponse.includes(d)) return d;
      }
      // Common aliases
      if (lowerResponse.includes('easy') || lowerResponse.includes('intro')) return 'beginner';
      if (lowerResponse.includes('medium') || lowerResponse.includes('mid')) return 'intermediate';
      if (lowerResponse.includes('hard') || lowerResponse.includes('senior')) return 'advanced';
      if (lowerResponse.includes('master')) return 'expert';
      return null;
    }

    case 'bloomsFocus': {
      const selected: BloomsLevel[] = [];
      for (const level of BLOOMS_LEVELS) {
        if (lowerResponse.includes(level.toLowerCase())) {
          selected.push(level);
        }
      }
      // If user says "all", include all levels
      if (lowerResponse.includes('all')) {
        return [...BLOOMS_LEVELS];
      }
      // Default sensible selection if none matched
      if (selected.length === 0) {
        // Try to parse comma-separated numbers (1-6)
        const numbers = response.match(/[1-6]/g);
        if (numbers) {
          for (const n of numbers) {
            const idx = parseInt(n, 10) - 1;
            if (idx >= 0 && idx < BLOOMS_LEVELS.length) {
              selected.push(BLOOMS_LEVELS[idx]);
            }
          }
        }
      }
      return selected.length > 0 ? selected : null;
    }

    case 'chapterCount': {
      const match = response.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count >= 3 && count <= 15) return count;
      }
      return null;
    }

    case 'contentTypes': {
      const selected: ContentType[] = [];
      for (const ct of CONTENT_TYPES) {
        if (lowerResponse.includes(ct)) {
          selected.push(ct);
        }
      }
      // Common aliases
      if (lowerResponse.includes('watch') && !selected.includes('video')) selected.push('video');
      if (lowerResponse.includes('read') && !selected.includes('reading')) selected.push('reading');
      if (lowerResponse.includes('exercise') && !selected.includes('assignment')) selected.push('assignment');
      if (lowerResponse.includes('test') && !selected.includes('quiz')) selected.push('quiz');
      if (lowerResponse.includes('build') && !selected.includes('project')) selected.push('project');
      if (lowerResponse.includes('discuss') && !selected.includes('discussion')) selected.push('discussion');
      // "all" shortcut
      if (lowerResponse.includes('all')) {
        return [...CONTENT_TYPES];
      }
      return selected.length > 0 ? selected : null;
    }

    default:
      return trimmed;
  }
}

function getNextQuestion(state: CourseCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'courseName':
      return {
        question: 'What would you like to name your course?',
        hint: 'For example: "Advanced React Patterns", "Python for Data Science", etc.',
      };

    case 'subject':
      return {
        question: `What subject area does "${state.collected.courseName}" cover?`,
        hint: 'For example: Web Development, Machine Learning, Business Analytics, etc.',
      };

    case 'targetAudience':
      return {
        question: 'Who is this course for?',
        options: AUDIENCE_PRESETS,
        hint: 'You can also type a custom audience description',
      };

    case 'difficulty':
      return {
        question: 'What difficulty level should this course be?',
        options: (['beginner', 'intermediate', 'advanced', 'expert'] as Difficulty[]).map(d => ({
          value: d,
          label: d.charAt(0).toUpperCase() + d.slice(1),
          description: DIFFICULTY_DESCRIPTIONS[d],
        })),
      };

    case 'bloomsFocus':
      return {
        question: 'Which cognitive levels should this course target? (select multiple)',
        options: BLOOMS_LEVELS.map((level, idx) => ({
          value: level,
          label: `${idx + 1}. ${level.charAt(0) + level.slice(1).toLowerCase()}`,
          description: BLOOMS_DESCRIPTIONS[level],
        })),
        hint: 'You can list multiple levels (e.g., "UNDERSTAND, APPLY, ANALYZE") or say "all"',
      };

    case 'chapterCount':
      return {
        question: 'How many chapters should the course have? (3-15)',
        options: [
          { value: '5', label: '5 chapters', description: 'Compact course' },
          { value: '8', label: '8 chapters', description: 'Standard course' },
          { value: '10', label: '10 chapters', description: 'Comprehensive course' },
          { value: '12', label: '12 chapters', description: 'In-depth course' },
        ],
        hint: 'You can also type a specific number between 3 and 15',
      };

    case 'contentTypes':
      return {
        question: 'What content types should be included? (select multiple)',
        options: CONTENT_TYPES.map(ct => ({
          value: ct,
          label: ct.charAt(0).toUpperCase() + ct.slice(1),
          description: getContentTypeDescription(ct),
        })),
        hint: 'You can list multiple types (e.g., "video, reading, quiz") or say "all"',
      };

    default:
      return { question: '' };
  }
}

function getContentTypeDescription(ct: ContentType): string {
  const descriptions: Record<ContentType, string> = {
    video: 'Video lectures and demonstrations',
    reading: 'Text-based learning materials',
    assignment: 'Hands-on exercises and homework',
    quiz: 'Knowledge check assessments',
    project: 'Real-world project work',
    discussion: 'Collaborative peer discussions',
  };
  return descriptions[ct];
}

function advanceState(state: CourseCollectionState, value: unknown): CourseCollectionState {
  const stepOrder: CourseCollectionStep[] = [
    'courseName', 'subject', 'targetAudience', 'difficulty',
    'bloomsFocus', 'chapterCount', 'contentTypes', 'complete',
  ];

  const currentIdx = stepOrder.indexOf(state.step);
  const nextStep = stepOrder[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'courseName':
      newCollected.courseName = value as string;
      break;
    case 'subject':
      newCollected.subject = value as string;
      break;
    case 'targetAudience':
      newCollected.targetAudience = value as string;
      break;
    case 'difficulty':
      newCollected.difficulty = value as Difficulty;
      break;
    case 'bloomsFocus':
      newCollected.bloomsFocus = value as BloomsLevel[];
      break;
    case 'chapterCount':
      newCollected.chapterCount = value as number;
      break;
    case 'contentTypes':
      newCollected.contentTypes = value as ContentType[];
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<CourseCreatorParams>): string {
  const parts: string[] = [];
  if (collected.courseName) parts.push(`Course: ${collected.courseName}`);
  if (collected.subject) parts.push(`Subject: ${collected.subject}`);
  if (collected.targetAudience) parts.push(`Audience: ${collected.targetAudience}`);
  if (collected.difficulty) parts.push(`Difficulty: ${collected.difficulty}`);
  if (collected.bloomsFocus) parts.push(`Bloom&apos;s: ${collected.bloomsFocus.join(', ')}`);
  if (collected.chapterCount) parts.push(`Chapters: ${collected.chapterCount}`);
  if (collected.contentTypes) parts.push(`Content: ${collected.contentTypes.join(', ')}`);
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createCourseCreatorHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = CourseCreatorInputSchema.safeParse(input);
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

    logger.info('[CourseCreator] Tool invoked', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      currentStep,
      hasInputCollected: !!inputCollected,
    });

    // -------------------------------------------------------------------------
    // Direct generation (all params provided)
    // -------------------------------------------------------------------------
    const hasAllParams =
      directParams.courseName &&
      directParams.subject &&
      directParams.targetAudience &&
      directParams.difficulty &&
      directParams.bloomsFocus &&
      directParams.bloomsFocus.length > 0 &&
      directParams.chapterCount &&
      directParams.contentTypes &&
      directParams.contentTypes.length > 0;

    if (action === 'generate' || hasAllParams) {
      const params: CourseCreatorParams = {
        courseName: directParams.courseName ?? '',
        subject: directParams.subject ?? '',
        targetAudience: directParams.targetAudience ?? 'general learners',
        difficulty: directParams.difficulty ?? 'intermediate',
        bloomsFocus: (directParams.bloomsFocus ?? ['UNDERSTAND', 'APPLY']) as BloomsLevel[],
        chapterCount: directParams.chapterCount ?? 8,
        contentTypes: (directParams.contentTypes ?? ['video', 'reading', 'assignment']) as ContentType[],
      };

      logger.info('[CourseCreator] Direct generation requested', {
        courseName: params.courseName,
        chapterCount: params.chapterCount,
      });

      return {
        success: true,
        output: {
          type: 'generate_course',
          params,
          message:
            `Ready to create your course "${params.courseName}"! ` +
            `${params.chapterCount} chapters at ${params.difficulty} level ` +
            `targeting ${params.targetAudience}.`,
          apiEndpoint: '/api/sam/course-creation/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      // If courseName was provided in the initial message, skip that step
      const initialStep: CourseCollectionStep = directParams.courseName
        ? 'subject'
        : 'courseName';
      const initialCollected: Partial<CourseCreatorParams> = directParams.courseName
        ? { courseName: directParams.courseName }
        : {};

      const initialState: CourseCollectionState = {
        step: initialStep,
        collected: initialCollected,
        conversationId: newConversationId,
        createdAt: Date.now(),
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options, hint } = getNextQuestion(initialState);

      logger.info('[CourseCreator] Started new conversation', {
        conversationId: newConversationId,
        initialStep,
        courseName: directParams.courseName,
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
          message: directParams.courseName
            ? `I&apos;ll help you create a course called "${directParams.courseName}"! ${question}`
            : `I&apos;d love to help you create a new course! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    let state = conversationStates.get(conversationId);

    // Stateless fallback: reconstruct state from input if Map lookup fails (serverless)
    if (!state && currentStep && inputCollected) {
      logger.info('[CourseCreator] Reconstructing state from input (stateless mode)', {
        conversationId,
        currentStep,
      });
      state = {
        step: currentStep,
        collected: inputCollected as Partial<CourseCreatorParams>,
        conversationId: conversationId ?? generateConversationId(),
        createdAt: Date.now(),
      };
      conversationStates.set(state.conversationId, state);
    }

    if (!state) {
      logger.warn('[CourseCreator] Conversation not found', { conversationId });
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message:
            'Conversation not found or expired. Let me start fresh - what course would you like to create?',
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
          message: `I didn&apos;t quite catch that. ${question}`,
          retryReason: 'Could not parse response',
        },
      };
    }

    // Advance to next step
    const newState = advanceState(state, parsedValue);
    conversationStates.set(conversationId, newState);

    logger.info('[CourseCreator] Advanced conversation state', {
      conversationId,
      previousStep: state.step,
      newStep: newState.step,
    });

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as CourseCreatorParams;
      conversationStates.delete(conversationId);

      logger.info('[CourseCreator] Conversation complete, triggering generation', {
        conversationId,
        params: formatCollectedSummary(params),
      });

      return {
        success: true,
        output: {
          type: 'generate_course',
          params,
          message:
            `I have all the information I need. Creating your ` +
            `${params.chapterCount}-chapter course "${params.courseName}" ` +
            `at ${params.difficulty} level...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/course-creation/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    // Friendly acknowledgment
    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'courseName':
        acknowledgment = `"${parsedValue}" - great course name!`;
        break;
      case 'subject':
        acknowledgment = `${parsedValue} - excellent subject area.`;
        break;
      case 'targetAudience':
        acknowledgment = `Targeting ${parsedValue}, perfect.`;
        break;
      case 'difficulty':
        acknowledgment = `${String(parsedValue).charAt(0).toUpperCase() + String(parsedValue).slice(1)} level, noted.`;
        break;
      case 'bloomsFocus':
        acknowledgment = `Focusing on ${(parsedValue as BloomsLevel[]).join(', ')} cognitive levels.`;
        break;
      case 'chapterCount':
        acknowledgment = `${parsedValue} chapters works well.`;
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

export function createCourseCreatorTool(): ToolDefinition {
  return {
    id: 'sam-course-creator',
    name: 'Course Creator',
    description:
      'Create a new course with AI-generated chapters, sections, and learning objectives ' +
      'aligned to Bloom&apos;s taxonomy. Collects course name, subject, target audience, ' +
      'difficulty, cognitive levels, chapter count, and content types through conversation, ' +
      'then generates a complete course structure with quality scoring.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createCourseCreatorHandler(),
    inputSchema: CourseCreatorInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_course']),
      conversationId: z.string().optional(),
      step: z.string().optional(),
      question: z.string().optional(),
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          description: z.string().optional(),
        })
      ).optional(),
      hint: z.string().optional(),
      collected: z.record(z.unknown()).optional(),
      message: z.string().optional(),
      retryReason: z.string().optional(),
      progress: z.object({
        current: z.number(),
        total: z.number(),
      }).optional(),
      params: z.record(z.unknown()).optional(),
      summary: z.string().optional(),
      apiEndpoint: z.string().optional(),
      triggerGeneration: z.boolean().optional(),
    }),
    requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: ['content', 'course', 'creation', 'ai', 'bloom', 'curriculum'],
    rateLimit: { maxCalls: 5, windowMs: 3_600_000, scope: 'user' },
    timeoutMs: 180_000,
    maxRetries: 1,
  };
}
