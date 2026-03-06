/**
 * SAM Depth Analyzer Tool
 *
 * Analyzes course content quality using multi-framework cognitive depth evaluation.
 * Supports both direct invocation (courseId provided) and conversational collection.
 *
 * Flow:
 * 1. User triggers tool (e.g., "Analyze my React course for quality")
 * 2. Tool collects: courseId, analysisMode, frameworks, focusAreas
 * 3. Once all data collected, returns triggerGeneration: true
 * 4. Frontend/SAM calls orchestrateDepthAnalysis() with collected params
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

// =============================================================================
// TYPES
// =============================================================================

export type AnalysisMode = 'quick' | 'standard' | 'deep' | 'comprehensive';

export type AnalysisFramework =
  | 'blooms'
  | 'dok'
  | 'solo'
  | 'fink'
  | 'marzano'
  | 'gagne'
  | 'qm'
  | 'olc';

export interface DepthAnalyzerParams {
  courseId: string;
  analysisMode: AnalysisMode;
  frameworks: AnalysisFramework[];
  focusAreas: string[];
}

export type AnalysisCollectionStep =
  | 'courseSelection'
  | 'analysisMode'
  | 'frameworks'
  | 'focusAreas'
  | 'complete';

export interface AnalysisCollectionState {
  step: AnalysisCollectionStep;
  collected: Partial<DepthAnalyzerParams>;
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

const DepthAnalyzerInputSchema = z.object({
  // Direct mode (all params provided)
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  analysisMode: z.enum(['quick', 'standard', 'deep', 'comprehensive']).optional(),
  frameworks: z.array(z.enum([
    'blooms', 'dok', 'solo', 'fink', 'marzano', 'gagne', 'qm', 'olc',
  ])).optional(),
  focusAreas: z.array(z.string()).optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),
  currentStep: z.enum([
    'courseSelection', 'analysisMode', 'frameworks', 'focusAreas', 'complete',
  ]).optional(),
  collected: z.object({
    courseId: z.string().optional(),
    analysisMode: z.enum(['quick', 'standard', 'deep', 'comprehensive']).optional(),
    frameworks: z.array(z.enum([
      'blooms', 'dok', 'solo', 'fink', 'marzano', 'gagne', 'qm', 'olc',
    ])).optional(),
    focusAreas: z.array(z.string()).optional(),
  }).optional(),

  // Action
  action: z.enum(['start', 'continue', 'analyze']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const MODE_DESCRIPTIONS: Record<AnalysisMode, string> = {
  quick: 'Structure + Bloom&apos;s only (~30 seconds)',
  standard: 'Structure + Bloom&apos;s + Pedagogy (~2 minutes)',
  deep: 'All 5 analysis stages per chapter (~5 minutes)',
  comprehensive: 'All stages + healing loop + cross-chapter (~10 minutes)',
};

const FRAMEWORK_OPTIONS: ConversationOption[] = [
  { value: 'blooms', label: 'Bloom&apos;s Taxonomy', description: 'Cognitive depth levels (Remember through Create)' },
  { value: 'dok', label: 'Webb&apos;s DOK', description: 'Depth of Knowledge (Recall through Extended Thinking)' },
  { value: 'solo', label: 'SOLO Taxonomy', description: 'Structure of Observed Learning Outcomes' },
  { value: 'fink', label: 'Fink&apos;s Taxonomy', description: 'Significant Learning (Foundational through Learning How to Learn)' },
  { value: 'marzano', label: 'Marzano&apos;s Taxonomy', description: 'New Taxonomy (Retrieval through Utilization)' },
  { value: 'gagne', label: 'Gagn&eacute;&apos;s 9 Events', description: 'Instructional design event coverage' },
  { value: 'qm', label: 'Quality Matters', description: 'QM rubric compliance check' },
  { value: 'olc', label: 'OLC Scorecard', description: 'Online Learning Consortium quality standards' },
];

const FOCUS_AREA_OPTIONS: ConversationOption[] = [
  { value: 'cognitive-depth', label: 'Cognitive Depth', description: 'Are higher-order thinking skills addressed?' },
  { value: 'content-flow', label: 'Content Flow', description: 'Do concepts build logically across chapters?' },
  { value: 'assessment-alignment', label: 'Assessment Alignment', description: 'Do assessments match learning objectives?' },
  { value: 'accessibility', label: 'Accessibility', description: 'Is content readable and inclusive?' },
  { value: 'pedagogical-quality', label: 'Pedagogical Quality', description: 'Are instructional design principles followed?' },
  { value: 'content-gaps', label: 'Content Gaps', description: 'Are there missing topics or thin sections?' },
];

const DEFAULT_FRAMEWORKS: AnalysisFramework[] = ['blooms', 'dok', 'gagne', 'qm'];

// In-memory state store with TTL cleanup
const conversationStates = new Map<string, AnalysisCollectionState>();
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
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseUserResponse(
  response: string,
  step: AnalysisCollectionStep
): unknown {
  const trimmed = response.trim();
  const lowerResponse = trimmed.toLowerCase();

  switch (step) {
    case 'courseSelection': {
      // Accept course ID directly or course name text
      if (trimmed.length >= 2 && trimmed.length <= 200) {
        return trimmed;
      }
      return null;
    }

    case 'analysisMode': {
      const modes: AnalysisMode[] = ['quick', 'standard', 'deep', 'comprehensive'];
      for (const m of modes) {
        if (lowerResponse.includes(m)) return m;
      }
      // Common aliases
      if (lowerResponse.includes('fast') || lowerResponse.includes('brief')) return 'quick';
      if (lowerResponse.includes('normal') || lowerResponse.includes('default')) return 'standard';
      if (lowerResponse.includes('thorough') || lowerResponse.includes('detailed')) return 'deep';
      if (lowerResponse.includes('full') || lowerResponse.includes('complete') || lowerResponse.includes('everything')) return 'comprehensive';
      // Number selection
      const numMatch = lowerResponse.match(/[1-4]/);
      if (numMatch) {
        const idx = parseInt(numMatch[0], 10) - 1;
        if (idx >= 0 && idx < modes.length) return modes[idx];
      }
      return null;
    }

    case 'frameworks': {
      const allFrameworks: AnalysisFramework[] = ['blooms', 'dok', 'solo', 'fink', 'marzano', 'gagne', 'qm', 'olc'];
      if (lowerResponse.includes('all') || lowerResponse.includes('everything')) {
        return [...allFrameworks];
      }
      if (lowerResponse.includes('default') || lowerResponse.includes('recommended')) {
        return [...DEFAULT_FRAMEWORKS];
      }

      const selected: AnalysisFramework[] = [];
      // Match by name
      const nameMap: Record<string, AnalysisFramework> = {
        'bloom': 'blooms', 'blooms': 'blooms',
        'dok': 'dok', 'webb': 'dok', 'depth of knowledge': 'dok',
        'solo': 'solo',
        'fink': 'fink',
        'marzano': 'marzano',
        'gagne': 'gagne', 'gagn': 'gagne', 'nine events': 'gagne', '9 events': 'gagne',
        'qm': 'qm', 'quality matters': 'qm',
        'olc': 'olc', 'scorecard': 'olc',
      };
      for (const [keyword, framework] of Object.entries(nameMap)) {
        if (lowerResponse.includes(keyword) && !selected.includes(framework)) {
          selected.push(framework);
        }
      }
      // Number selection (1-8)
      const numbers = response.match(/[1-8]/g);
      if (numbers) {
        for (const n of numbers) {
          const idx = parseInt(n, 10) - 1;
          if (idx >= 0 && idx < allFrameworks.length && !selected.includes(allFrameworks[idx])) {
            selected.push(allFrameworks[idx]);
          }
        }
      }
      return selected.length > 0 ? selected : null;
    }

    case 'focusAreas': {
      if (lowerResponse.includes('all') || lowerResponse.includes('everything')) {
        return FOCUS_AREA_OPTIONS.map(o => o.value);
      }
      if (lowerResponse.includes('skip') || lowerResponse.includes('none') || lowerResponse.includes('no preference')) {
        return []; // Empty means analyze everything without special focus
      }

      const selected: string[] = [];
      const areaMap: Record<string, string> = {
        'depth': 'cognitive-depth', 'cognitive': 'cognitive-depth', 'bloom': 'cognitive-depth', 'higher-order': 'cognitive-depth',
        'flow': 'content-flow', 'prerequisite': 'content-flow', 'sequence': 'content-flow', 'order': 'content-flow',
        'assessment': 'assessment-alignment', 'alignment': 'assessment-alignment', 'test': 'assessment-alignment', 'quiz': 'assessment-alignment',
        'accessibility': 'accessibility', 'readable': 'accessibility', 'inclusive': 'accessibility', 'wcag': 'accessibility',
        'pedagog': 'pedagogical-quality', 'instructional': 'pedagogical-quality', 'teaching': 'pedagogical-quality', 'gagne': 'pedagogical-quality',
        'gap': 'content-gaps', 'missing': 'content-gaps', 'thin': 'content-gaps', 'empty': 'content-gaps',
      };
      for (const [keyword, area] of Object.entries(areaMap)) {
        if (lowerResponse.includes(keyword) && !selected.includes(area)) {
          selected.push(area);
        }
      }
      // Number selection (1-6)
      const numbers = response.match(/[1-6]/g);
      if (numbers) {
        for (const n of numbers) {
          const idx = parseInt(n, 10) - 1;
          if (idx >= 0 && idx < FOCUS_AREA_OPTIONS.length && !selected.includes(FOCUS_AREA_OPTIONS[idx].value)) {
            selected.push(FOCUS_AREA_OPTIONS[idx].value);
          }
        }
      }
      return selected.length > 0 ? selected : [];
    }

    default:
      return trimmed;
  }
}

function getNextQuestion(state: AnalysisCollectionState): {
  question: string;
  options?: ConversationOption[];
  hint?: string;
} {
  switch (state.step) {
    case 'courseSelection':
      return {
        question: 'Which course would you like me to analyze?',
        hint: 'Type the course name or paste the course ID. I&apos;ll find it for you.',
      };

    case 'analysisMode':
      return {
        question: 'How thorough should the analysis be?',
        options: (['quick', 'standard', 'deep', 'comprehensive'] as AnalysisMode[]).map((m, idx) => ({
          value: m,
          label: `${idx + 1}. ${m.charAt(0).toUpperCase() + m.slice(1)}`,
          description: MODE_DESCRIPTIONS[m],
        })),
        hint: 'Standard is recommended for most courses. Use Comprehensive for pre-publish review.',
      };

    case 'frameworks':
      return {
        question: 'Which analysis frameworks should I evaluate against? (select multiple)',
        options: FRAMEWORK_OPTIONS.map((f, idx) => ({
          ...f,
          label: `${idx + 1}. ${f.label}`,
        })),
        hint: 'Say "default" for Bloom&apos;s + DOK + Gagn&eacute; + QM, or "all" for everything.',
      };

    case 'focusAreas':
      return {
        question: 'Any specific areas of concern to focus on? (optional)',
        options: FOCUS_AREA_OPTIONS.map((f, idx) => ({
          ...f,
          label: `${idx + 1}. ${f.label}`,
        })),
        hint: 'Say "skip" to analyze everything equally, or select areas of concern.',
      };

    default:
      return { question: '' };
  }
}

function advanceState(state: AnalysisCollectionState, value: unknown): AnalysisCollectionState {
  const stepOrder: AnalysisCollectionStep[] = [
    'courseSelection', 'analysisMode', 'frameworks', 'focusAreas', 'complete',
  ];

  const currentIdx = stepOrder.indexOf(state.step);
  const nextStep = stepOrder[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'courseSelection':
      // Could be courseId or courseName - store as courseId for now, resolved server-side
      newCollected.courseId = value as string;
      break;
    case 'analysisMode':
      newCollected.analysisMode = value as AnalysisMode;
      break;
    case 'frameworks':
      newCollected.frameworks = value as AnalysisFramework[];
      break;
    case 'focusAreas':
      newCollected.focusAreas = value as string[];
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

function formatCollectedSummary(collected: Partial<DepthAnalyzerParams>): string {
  const parts: string[] = [];
  if (collected.courseId) parts.push(`Course: ${collected.courseId}`);
  if (collected.analysisMode) parts.push(`Mode: ${collected.analysisMode}`);
  if (collected.frameworks) parts.push(`Frameworks: ${collected.frameworks.join(', ')}`);
  if (collected.focusAreas && collected.focusAreas.length > 0) {
    parts.push(`Focus: ${collected.focusAreas.join(', ')}`);
  }
  return parts.join(' | ');
}

// =============================================================================
// HANDLER
// =============================================================================

function createDepthAnalyzerHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = DepthAnalyzerInputSchema.safeParse(input);
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

    logger.info('[DepthAnalyzer] Tool invoked', {
      action,
      conversationId,
      hasUserResponse: !!userResponse,
      currentStep,
      hasCourseId: !!directParams.courseId,
    });

    // -------------------------------------------------------------------------
    // Direct analysis (courseId provided)
    // -------------------------------------------------------------------------
    const hasMinimumParams = directParams.courseId;

    if (action === 'analyze' || hasMinimumParams) {
      const params: DepthAnalyzerParams = {
        courseId: directParams.courseId ?? '',
        analysisMode: directParams.analysisMode ?? 'standard',
        frameworks: (directParams.frameworks ?? DEFAULT_FRAMEWORKS) as AnalysisFramework[],
        focusAreas: directParams.focusAreas ?? [],
      };

      logger.info('[DepthAnalyzer] Direct analysis requested', {
        courseId: params.courseId,
        mode: params.analysisMode,
        frameworks: params.frameworks,
      });

      return {
        success: true,
        output: {
          type: 'analyze_course',
          params,
          message:
            `Starting ${params.analysisMode} analysis of your course ` +
            `using ${params.frameworks.length} frameworks...`,
          apiEndpoint: '/api/sam/depth-analysis/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();

      // If courseId was already provided, skip course selection
      const initialStep: AnalysisCollectionStep = directParams.courseId
        ? 'analysisMode'
        : 'courseSelection';
      const initialCollected: Partial<DepthAnalyzerParams> = directParams.courseId
        ? { courseId: directParams.courseId }
        : {};

      const initialState: AnalysisCollectionState = {
        step: initialStep,
        collected: initialCollected,
        conversationId: newConversationId,
        createdAt: Date.now(),
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options, hint } = getNextQuestion(initialState);

      logger.info('[DepthAnalyzer] Started new conversation', {
        conversationId: newConversationId,
        initialStep,
        courseId: directParams.courseId,
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
          message: directParams.courseId
            ? `I&apos;ll analyze your course for quality! ${question}`
            : `I&apos;d love to help you evaluate your course quality! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    let state = conversationStates.get(conversationId);

    // Stateless fallback: reconstruct state from input if Map lookup fails (serverless)
    if (!state && currentStep && inputCollected) {
      logger.info('[DepthAnalyzer] Reconstructing state from input (stateless mode)', {
        conversationId,
        currentStep,
      });
      state = {
        step: currentStep,
        collected: inputCollected as Partial<DepthAnalyzerParams>,
        conversationId: conversationId ?? generateConversationId(),
        createdAt: Date.now(),
      };
      conversationStates.set(state.conversationId, state);
    }

    if (!state) {
      logger.warn('[DepthAnalyzer] Conversation not found', { conversationId });
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message:
            'Conversation not found or expired. Let me start fresh - which course would you like me to analyze?',
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

    logger.info('[DepthAnalyzer] Advanced conversation state', {
      conversationId,
      previousStep: state.step,
      newStep: newState.step,
    });

    // Check if complete
    if (newState.step === 'complete') {
      const params: DepthAnalyzerParams = {
        courseId: newState.collected.courseId ?? '',
        analysisMode: newState.collected.analysisMode ?? 'standard',
        frameworks: newState.collected.frameworks ?? DEFAULT_FRAMEWORKS,
        focusAreas: newState.collected.focusAreas ?? [],
      };
      conversationStates.delete(conversationId);

      logger.info('[DepthAnalyzer] Conversation complete, triggering analysis', {
        conversationId,
        params: formatCollectedSummary(params),
      });

      return {
        success: true,
        output: {
          type: 'analyze_course',
          params,
          message:
            `Starting ${params.analysisMode} analysis ` +
            `with ${params.frameworks.length} frameworks...`,
          summary: formatCollectedSummary(params),
          apiEndpoint: '/api/sam/depth-analysis/orchestrate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question with friendly acknowledgment
    const { question, options, hint } = getNextQuestion(newState);

    let acknowledgment = 'Got it!';
    switch (state.step) {
      case 'courseSelection':
        acknowledgment = `I&apos;ll analyze "${parsedValue}" for you.`;
        break;
      case 'analysisMode':
        acknowledgment = `${String(parsedValue).charAt(0).toUpperCase() + String(parsedValue).slice(1)} analysis mode selected.`;
        break;
      case 'frameworks':
        acknowledgment = `Using ${(parsedValue as AnalysisFramework[]).length} framework(s) for evaluation.`;
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

export function createDepthAnalyzerTool(): ToolDefinition {
  return {
    id: 'sam-depth-analyzer',
    name: 'Course Depth Analyzer',
    description:
      'Analyze course content quality using multi-framework cognitive depth evaluation. ' +
      'Evaluates Bloom&apos;s Taxonomy, Webb&apos;s DOK, SOLO, Fink, Marzano, Gagn&eacute;&apos;s 9 Events, ' +
      'Quality Matters, and OLC standards. Identifies issues in cognitive depth, pedagogical ' +
      'alignment, content flow, and accessibility with actionable fix recommendations.',
    version: '1.0.0',
    category: ToolCategory.ANALYSIS,
    handler: createDepthAnalyzerHandler(),
    inputSchema: DepthAnalyzerInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'analyze_course']),
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
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: ['analysis', 'blooms', 'quality', 'depth', 'course-evaluation', 'pedagogy'],
    rateLimit: { maxCalls: 10, windowMs: 3_600_000, scope: 'user' },
    timeoutMs: 300_000, // 5 min (analysis can be long)
    maxRetries: 1,
  };
}
