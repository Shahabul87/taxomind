/**
 * Agentic Exam Builder Types
 *
 * Type definitions for the full 5-stage agentic exam builder pipeline.
 * These types power the conversational tool, orchestrator, and SSE streaming.
 *
 * Separate from types.ts (which serves the existing non-agentic exam generator).
 */

import type { BloomsLevel } from '@prisma/client';

// =============================================================================
// BLOOM'S TAXONOMY CONSTANTS
// =============================================================================

export const BLOOMS_LEVELS = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

// =============================================================================
// COLLECTION TYPES (8-step conversational flow)
// =============================================================================

export type ExamCollectionStep =
  | 'topic'
  | 'subtopics'
  | 'studentLevel'
  | 'examPurpose'
  | 'bloomsDistribution'
  | 'questionCount'
  | 'timeLimit'
  | 'questionFormats'
  | 'complete';

export type StudentLevel = 'novice' | 'intermediate' | 'advanced' | 'research';

export type ExamPurpose =
  | 'diagnostic'
  | 'mastery'
  | 'placement'
  | 'research-readiness';

export type QuestionFormat =
  | 'mcq'
  | 'short_answer'
  | 'long_answer'
  | 'design_problem'
  | 'code_challenge';

export interface ExamBuilderParams {
  topic: string;
  subtopics: string[] | 'auto';
  studentLevel: StudentLevel;
  examPurpose: ExamPurpose;
  bloomsDistribution: Record<BloomsLevel, number> | 'auto';
  questionCount: number;
  timeLimit: number | null; // null = unlimited
  questionFormats: QuestionFormat[];
  // Context (from section page, optional)
  sectionId?: string;
  courseId?: string;
  chapterId?: string;
}

export interface ExamCollectionState {
  step: ExamCollectionStep;
  collected: Partial<ExamBuilderParams>;
  conversationId: string;
  createdAt: number;
}

// =============================================================================
// PIPELINE TYPES (5-stage orchestration)
// =============================================================================

/** Stage 1 output: a decomposed concept with pedagogical metadata */
export interface DecomposedConcept {
  name: string;
  description: string;
  prerequisites: string[];
  commonMisconceptions: string[];
  importance: 'core' | 'supporting' | 'advanced';
}

/** Stage 2 output: a planned question (concept x Bloom&apos;s level x format) */
export interface PlannedQuestion {
  concept: string;
  bloomsLevel: BloomsLevel;
  questionFormat: QuestionFormat;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTimeSeconds: number;
  points: number;
}

/** Stage 3 output: a fully generated question with rich metadata */
export interface GeneratedQuestion {
  id: string;
  stem: string;
  bloomsLevel: BloomsLevel;
  concept: string;
  questionType: QuestionFormat;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;
  estimatedTimeSeconds: number;
  // MCQ-specific
  options?: Array<{
    text: string;
    isCorrect: boolean;
    diagnosticNote: string;
  }>;
  correctAnswer: string;
  // Rich metadata (from gold standard)
  reasoningTrace: string;
  diagnosticNotes: string;
  explanation: string;
  hint?: string;
  remediationSuggestion: string;
  cognitiveSkills: string[];
  relatedConcepts: string[];
  signalVerbs: string[];
}

// =============================================================================
// QUALITY SCORING
// =============================================================================

export interface ExamQualityScore {
  bloomsAlignment: number; // 30% weight
  clarity: number; // 20% weight
  distractorQuality: number; // 20% weight
  diagnosticValue: number; // 15% weight
  cognitiveRigor: number; // 15% weight
  overall: number; // weighted average
}

export const QUALITY_WEIGHTS = {
  bloomsAlignment: 0.3,
  clarity: 0.2,
  distractorQuality: 0.2,
  diagnosticValue: 0.15,
  cognitiveRigor: 0.15,
} as const;

export const QUALITY_RETRY_THRESHOLD = 60;
export const MAX_QUALITY_RETRIES = 2; // 3 total attempts

// =============================================================================
// ASSEMBLY VALIDATION (Stage 4)
// =============================================================================

export interface AssemblyValidationCheck {
  passed: boolean;
  message: string;
}

export interface AssemblyValidation {
  conceptCoverage: AssemblyValidationCheck;
  bloomsDistributionMatch: AssemblyValidationCheck & { deviation: number };
  difficultyCurve: AssemblyValidationCheck;
  answerIndependence: AssemblyValidationCheck & { leaks: string[] };
  timeBudget: AssemblyValidationCheck & {
    totalMinutes: number;
    limitMinutes: number | null;
  };
  formatVariety: AssemblyValidationCheck;
  cognitiveLoadBalance: AssemblyValidationCheck;
}

// =============================================================================
// COGNITIVE PROFILE TEMPLATE (Stage 5)
// =============================================================================

export interface CognitiveProfileTemplate {
  bloomsLevelScoring: Record<
    BloomsLevel,
    { questionIds: string[]; maxPoints: number }
  >;
  ceilingLevelThreshold: number; // 80% default
  growthEdgeLogic: string;
  remediationMap: Record<BloomsLevel, string>;
}

// =============================================================================
// ORCHESTRATION CONFIG & RESULT
// =============================================================================

export interface ExamOrchestrationConfig {
  params: ExamBuilderParams;
  userId: string;
  onSSEEvent?: (event: {
    type: string;
    data: Record<string, unknown>;
  }) => void;
  onProgress?: (progress: {
    percentage: number;
    message: string;
  }) => void;
  abortSignal?: AbortSignal;
}

export interface ExamOrchestrationResult {
  success: boolean;
  examId?: string;
  questionCount?: number;
  bloomsProfile?: Record<BloomsLevel, number>;
  cognitiveProfileTemplate?: CognitiveProfileTemplate;
  stats?: {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    averageQualityScore: number;
    conceptsCovered: number;
    bloomsLevelsCovered: number;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export type SSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'item_generating'
  | 'item_complete'
  | 'bloom_distribution'
  | 'concept_map'
  | 'thinking'
  | 'validation_result'
  | 'progress'
  | 'complete'
  | 'error';

// =============================================================================
// STAGE PROMPT
// =============================================================================

export interface StagePrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}
