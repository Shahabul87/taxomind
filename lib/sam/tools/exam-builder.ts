/**
 * SAM Exam Builder Tool
 *
 * Conversationally collects 8 parameters and triggers the 5-stage
 * agentic exam creation pipeline. Every exam is a diagnostic tool
 * aligned to Bloom&apos;s Taxonomy.
 *
 * Flow:
 * 1. User triggers tool (e.g., "Create an exam about Neural Networks")
 * 2. Tool asks questions one-by-one to collect: topic, subtopics,
 *    studentLevel, examPurpose, bloomsDistribution, questionCount,
 *    timeLimit, questionFormats
 * 3. Once all data collected, returns triggerGeneration: true
 * 4. Frontend calls /api/sam/exam-builder/orchestrate with collected params
 *
 * Follows the exact pattern from course-creator.ts.
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
  ExamCollectionStep,
  ExamCollectionState,
  ExamBuilderParams,
  StudentLevel,
  ExamPurpose,
  QuestionFormat,
} from '@/lib/sam/exam-generation/agentic-types';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const ExamBuilderInputSchema = z.object({
  // Direct mode
  topic: z.string().min(2).max(200).optional(),
  subtopics: z
    .union([z.array(z.string()), z.literal('auto')])
    .optional(),
  studentLevel: z
    .enum(['novice', 'intermediate', 'advanced', 'research'])
    .optional(),
  examPurpose: z
    .enum(['diagnostic', 'mastery', 'placement', 'research-readiness'])
    .optional(),
  bloomsDistribution: z
    .union([
      z.object({
        REMEMBER: z.number(),
        UNDERSTAND: z.number(),
        APPLY: z.number(),
        ANALYZE: z.number(),
        EVALUATE: z.number(),
        CREATE: z.number(),
      }),
      z.literal('auto'),
    ])
    .optional(),
  questionCount: z.number().min(5).max(50).optional(),
  timeLimit: z.number().min(15).max(180).nullable().optional(),
  questionFormats: z
    .array(
      z.enum([
        'mcq',
        'short_answer',
        'long_answer',
        'design_problem',
        'code_challenge',
      ])
    )
    .optional(),

  // Context
  sectionId: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z
    .enum([
      'topic',
      'subtopics',
      'studentLevel',
      'examPurpose',
      'bloomsDistribution',
      'questionCount',
      'timeLimit',
      'questionFormats',
      'complete',
    ])
    .optional(),
  collected: z
    .object({
      topic: z.string().optional(),
      subtopics: z
        .union([z.array(z.string()), z.literal('auto')])
        .optional(),
      studentLevel: z
        .enum(['novice', 'intermediate', 'advanced', 'research'])
        .optional(),
      examPurpose: z
        .enum(['diagnostic', 'mastery', 'placement', 'research-readiness'])
        .optional(),
      bloomsDistribution: z
        .union([z.record(z.number()), z.literal('auto')])
        .optional(),
      questionCount: z.number().optional(),
      timeLimit: z.number().nullable().optional(),
      questionFormats: z.array(z.string()).optional(),
    })
    .optional(),

  // Action
  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

interface ConversationOption {
  value: string;
  label: string;
  description?: string;
}

const STUDENT_LEVEL_OPTIONS: ConversationOption[] = [
  { value: 'novice', label: 'Novice', description: 'Little to no prior knowledge' },
  { value: 'intermediate', label: 'Intermediate', description: 'Solid foundational understanding' },
  { value: 'advanced', label: 'Advanced', description: 'Deep knowledge, ready for complex analysis' },
  { value: 'research', label: 'Research', description: 'Expert-level, pushing boundaries of knowledge' },
];

const EXAM_PURPOSE_OPTIONS: ConversationOption[] = [
  { value: 'diagnostic', label: 'Diagnostic', description: 'Find WHERE understanding breaks down' },
  { value: 'mastery', label: 'Mastery', description: 'Verify deep competency (higher-order focus)' },
  { value: 'placement', label: 'Placement', description: 'Determine student level (balanced)' },
  { value: 'research-readiness', label: 'Research Readiness', description: 'Assess creative and evaluative thinking' },
];

const FORMAT_OPTIONS: ConversationOption[] = [
  { value: 'mcq', label: 'Multiple Choice', description: 'MCQ with diagnostic distractors' },
  { value: 'short_answer', label: 'Short Answer', description: '1-3 sentence responses' },
  { value: 'long_answer', label: 'Long Answer', description: 'Multi-paragraph essay responses' },
  { value: 'design_problem', label: 'Design Problem', description: 'Real-world design challenges' },
  { value: 'code_challenge', label: 'Code Challenge', description: 'Programming problems' },
];

const STEP_ORDER: ExamCollectionStep[] = [
  'topic',
  'subtopics',
  'studentLevel',
  'examPurpose',
  'bloomsDistribution',
  'questionCount',
  'timeLimit',
  'questionFormats',
  'complete',
];

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, ExamCollectionState>();
const STATE_TTL_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupOldStates(): void {
  const now = Date.now();
  const entries = Array.from(conversationStates.entries());
  for (const [id, state] of entries) {
    if (now - state.createdAt > STATE_TTL_MS) {
      conversationStates.delete(id);
    }
  }
}

// Store interval reference for cleanup (e.g., in tests or graceful shutdown)
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

if (typeof setInterval !== 'undefined' && !cleanupIntervalId) {
  cleanupIntervalId = setInterval(cleanupOldStates, CLEANUP_INTERVAL_MS);
  // Prevent the interval from keeping the process alive during shutdown
  if (cleanupIntervalId && typeof cleanupIntervalId === 'object' && 'unref' in cleanupIntervalId) {
    cleanupIntervalId.unref();
  }
}

/** Stop the cleanup interval (useful for tests and graceful shutdown) */
export function stopExamBuilderCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateConversationId(): string {
  return `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseUserResponse(
  response: string,
  step: ExamCollectionStep
): unknown {
  const trimmed = response.trim();
  const lower = trimmed.toLowerCase();

  switch (step) {
    case 'topic':
      return trimmed.length >= 2 && trimmed.length <= 200 ? trimmed : null;

    case 'subtopics': {
      if (lower === 'auto' || lower.includes('auto')) return 'auto';
      const parts = trimmed.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0);
      return parts.length > 0 ? parts : null;
    }

    case 'studentLevel': {
      const levels: StudentLevel[] = ['novice', 'intermediate', 'advanced', 'research'];
      for (const l of levels) {
        if (lower.includes(l)) return l;
      }
      if (lower.includes('beginner') || lower.includes('new')) return 'novice';
      if (lower.includes('mid') || lower.includes('medium')) return 'intermediate';
      if (lower.includes('expert') || lower.includes('senior')) return 'advanced';
      return null;
    }

    case 'examPurpose': {
      const purposes: ExamPurpose[] = ['diagnostic', 'mastery', 'placement', 'research-readiness'];
      for (const p of purposes) {
        if (lower.includes(p.replace('-', ' ')) || lower.includes(p)) return p;
      }
      if (lower.includes('research')) return 'research-readiness';
      if (lower.includes('assess') || lower.includes('level')) return 'placement';
      if (lower.includes('master')) return 'mastery';
      if (lower.includes('diagnos') || lower.includes('find')) return 'diagnostic';
      return null;
    }

    case 'bloomsDistribution': {
      if (lower === 'auto' || lower.includes('auto') || lower.includes('default')) {
        return 'auto';
      }
      // Try to parse custom percentages
      return 'auto'; // Default to auto for conversational simplicity
    }

    case 'questionCount': {
      const match = response.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count >= 5 && count <= 50) return count;
      }
      return null;
    }

    case 'timeLimit': {
      if (lower.includes('unlimited') || lower.includes('none') || lower.includes('no limit')) {
        return null;
      }
      const match = response.match(/(\d+)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        if (minutes >= 15 && minutes <= 180) return minutes;
      }
      return null;
    }

    case 'questionFormats': {
      const selected: QuestionFormat[] = [];
      if (lower.includes('mcq') || lower.includes('multiple choice') || lower.includes('mc')) {
        selected.push('mcq');
      }
      if (lower.includes('short') || lower.includes('brief')) selected.push('short_answer');
      if (lower.includes('long') || lower.includes('essay')) selected.push('long_answer');
      if (lower.includes('design')) selected.push('design_problem');
      if (lower.includes('code') || lower.includes('programming')) selected.push('code_challenge');
      if (lower.includes('all')) {
        return ['mcq', 'short_answer', 'long_answer', 'design_problem', 'code_challenge'];
      }
      return selected.length > 0 ? selected : null;
    }

    default:
      return trimmed;
  }
}

function getNextQuestion(state: ExamCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'topic':
      return {
        question: 'What topic should this exam cover?',
        hint: 'For example: "Neural Networks", "Organic Chemistry", "Constitutional Law", etc.',
      };

    case 'subtopics':
      return {
        question: `What specific subtopics of "${state.collected.topic}" should the exam focus on?`,
        options: [
          { value: 'auto', label: 'Auto-decompose', description: 'Let AI identify the key subtopics' },
        ],
        hint: 'You can list subtopics separated by commas, or say "auto" to let AI decide',
      };

    case 'studentLevel':
      return {
        question: 'What is the student level?',
        options: STUDENT_LEVEL_OPTIONS,
      };

    case 'examPurpose':
      return {
        question: 'What is the purpose of this exam?',
        options: EXAM_PURPOSE_OPTIONS,
        hint: 'This determines the Bloom&apos;s Taxonomy distribution',
      };

    case 'bloomsDistribution':
      return {
        question: 'How should Bloom&apos;s Taxonomy levels be distributed?',
        options: [
          { value: 'auto', label: 'Auto (Recommended)', description: `Optimized for ${state.collected.examPurpose ?? 'diagnostic'} exams` },
          { value: 'custom', label: 'Custom', description: 'Specify percentages per level' },
        ],
        hint: 'Auto distribution is recommended for most exams',
      };

    case 'questionCount':
      return {
        question: 'How many questions should the exam have? (5-50)',
        options: [
          { value: '10', label: '10 questions', description: 'Quick assessment' },
          { value: '15', label: '15 questions', description: 'Standard exam' },
          { value: '25', label: '25 questions', description: 'Comprehensive exam' },
          { value: '40', label: '40 questions', description: 'In-depth exam' },
        ],
        hint: 'You can type any number between 5 and 50',
      };

    case 'timeLimit':
      return {
        question: 'What is the time limit in minutes?',
        options: [
          { value: '30', label: '30 minutes', description: 'Short quiz' },
          { value: '60', label: '60 minutes', description: 'Standard exam' },
          { value: '90', label: '90 minutes', description: 'Extended exam' },
          { value: 'unlimited', label: 'Unlimited', description: 'No time constraint' },
        ],
      };

    case 'questionFormats':
      return {
        question: 'What question formats should be included? (select multiple)',
        options: FORMAT_OPTIONS,
        hint: 'You can list multiple formats (e.g., "MCQ, short answer") or say "all"',
      };

    default:
      return { question: '' };
  }
}

function advanceState(
  state: ExamCollectionState,
  value: unknown
): ExamCollectionState {
  const currentIdx = STEP_ORDER.indexOf(state.step);
  const nextStep = STEP_ORDER[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'topic':
      newCollected.topic = value as string;
      break;
    case 'subtopics':
      newCollected.subtopics = value as string[] | 'auto';
      break;
    case 'studentLevel':
      newCollected.studentLevel = value as StudentLevel;
      break;
    case 'examPurpose':
      newCollected.examPurpose = value as ExamPurpose;
      break;
    case 'bloomsDistribution':
      newCollected.bloomsDistribution = value as ExamBuilderParams['bloomsDistribution'];
      break;
    case 'questionCount':
      newCollected.questionCount = value as number;
      break;
    case 'timeLimit':
      newCollected.timeLimit = value as number | null;
      break;
    case 'questionFormats':
      newCollected.questionFormats = value as QuestionFormat[];
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<ExamBuilderParams>): string {
  const parts: string[] = [];
  if (collected.topic) parts.push(`Topic: ${collected.topic}`);
  if (collected.subtopics) {
    parts.push(
      `Subtopics: ${collected.subtopics === 'auto' ? 'auto' : collected.subtopics.join(', ')}`
    );
  }
  if (collected.studentLevel) parts.push(`Level: ${collected.studentLevel}`);
  if (collected.examPurpose) parts.push(`Purpose: ${collected.examPurpose}`);
  if (collected.questionCount) parts.push(`Questions: ${collected.questionCount}`);
  if (collected.timeLimit !== undefined) {
    parts.push(`Time: ${collected.timeLimit ? `${collected.timeLimit}min` : 'unlimited'}`);
  }
  if (collected.questionFormats) {
    parts.push(`Formats: ${collected.questionFormats.join(', ')}`);
  }
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createExamBuilderHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = ExamBuilderInputSchema.safeParse(input);
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

    logger.info('[ExamBuilder] Tool invoked', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      currentStep,
    });

    // ----- Direct generation (all params provided) -----
    const hasAllParams =
      directParams.topic &&
      directParams.studentLevel &&
      directParams.examPurpose &&
      directParams.questionCount &&
      directParams.questionFormats &&
      directParams.questionFormats.length > 0;

    if (action === 'generate' || hasAllParams) {
      const params: ExamBuilderParams = {
        topic: directParams.topic ?? '',
        subtopics: directParams.subtopics ?? 'auto',
        studentLevel: directParams.studentLevel ?? 'intermediate',
        examPurpose: directParams.examPurpose ?? 'diagnostic',
        bloomsDistribution: directParams.bloomsDistribution ?? 'auto',
        questionCount: directParams.questionCount ?? 15,
        timeLimit: directParams.timeLimit ?? 60,
        questionFormats: directParams.questionFormats ?? ['mcq', 'short_answer'],
        sectionId: directParams.sectionId,
        courseId: directParams.courseId,
        chapterId: directParams.chapterId,
      };

      return {
        success: true,
        output: {
          type: 'generate_exam',
          params,
          message:
            `Ready to create your ${params.examPurpose} exam on "${params.topic}"! ` +
            `${params.questionCount} questions at ${params.studentLevel} level.`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/exam-builder/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // ----- Start new conversation -----
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      const initialStep: ExamCollectionStep = directParams.topic
        ? 'subtopics'
        : 'topic';
      const initialCollected: Partial<ExamBuilderParams> = directParams.topic
        ? { topic: directParams.topic }
        : {};

      // Carry entity context IDs through the collection flow
      if (directParams.sectionId) initialCollected.sectionId = directParams.sectionId;
      if (directParams.courseId) initialCollected.courseId = directParams.courseId;
      if (directParams.chapterId) initialCollected.chapterId = directParams.chapterId;

      const initialState: ExamCollectionState = {
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
          message: directParams.topic
            ? `I&apos;ll help you create an exam on "${directParams.topic}"! ${question}`
            : `I&apos;d love to help you create a Bloom&apos;s Taxonomy exam! ${question}`,
        },
      };
    }

    // ----- Continue conversation -----
    let state = conversationStates.get(conversationId);

    // Stateless fallback
    if (!state && currentStep && inputCollected) {
      state = {
        step: currentStep,
        collected: inputCollected as Partial<ExamBuilderParams>,
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
            'Conversation not found or expired. Let me start fresh — what topic should the exam cover?',
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
      const params = newState.collected as ExamBuilderParams;
      conversationStates.delete(conversationId);

      return {
        success: true,
        output: {
          type: 'generate_exam',
          params,
          message:
            `I have all the information I need. Creating your ` +
            `${params.questionCount}-question ${params.examPurpose} exam on ` +
            `"${params.topic}" at ${params.studentLevel} level...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/exam-builder/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options, hint } = getNextQuestion(newState);

    // Friendly acknowledgment
    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'topic':
        acknowledgment = `"${parsedValue}" — great exam topic!`;
        break;
      case 'subtopics':
        acknowledgment =
          parsedValue === 'auto'
            ? 'I&apos;ll identify the key subtopics automatically.'
            : `Focusing on ${(parsedValue as string[]).length} subtopics, perfect.`;
        break;
      case 'studentLevel':
        acknowledgment = `${String(parsedValue).charAt(0).toUpperCase() + String(parsedValue).slice(1)} level, noted.`;
        break;
      case 'examPurpose':
        acknowledgment = `${String(parsedValue).charAt(0).toUpperCase() + String(parsedValue).slice(1)} exam — great choice.`;
        break;
      case 'bloomsDistribution':
        acknowledgment = parsedValue === 'auto'
          ? 'Using auto distribution optimized for your exam purpose.'
          : 'Custom distribution set.';
        break;
      case 'questionCount':
        acknowledgment = `${parsedValue} questions works well.`;
        break;
      case 'timeLimit':
        acknowledgment = parsedValue === null
          ? 'No time limit — students can take their time.'
          : `${parsedValue} minutes, noted.`;
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
          total: 8,
        },
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createExamBuilderTool(): ToolDefinition {
  return {
    id: 'sam-exam-builder',
    name: 'Bloom&apos;s Exam Builder',
    description:
      'Design exams targeting specific cognitive levels using Bloom&apos;s Taxonomy. ' +
      'Every question is a diagnostic tool that reveals WHERE and at WHICH COGNITIVE LEVEL ' +
      'a student&apos;s understanding breaks down. Supports 4 exam purposes (diagnostic, mastery, ' +
      'placement, research-readiness), 6 Bloom&apos;s levels, and 5 question formats.',
    version: '1.0.0',
    category: ToolCategory.ASSESSMENT,
    handler: createExamBuilderHandler(),
    inputSchema: ExamBuilderInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_exam']),
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
    requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: [
      'exam',
      'assessment',
      'blooms',
      'diagnostic',
      'quiz',
      'test',
      'taxonomy',
    ],
    rateLimit: { maxCalls: 10, windowMs: 3_600_000, scope: 'user' },
    timeoutMs: 60_000,
    maxRetries: 1,
  };
}
