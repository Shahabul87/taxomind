/**
 * Agentic Exam Evaluator Types
 *
 * Type definitions for the full 5-stage DIAGNOSE exam evaluation pipeline.
 * These types power the conversational tool, orchestrator, and SSE streaming.
 *
 * The DIAGNOSE framework evaluates each answer through 7 cognitive layers:
 *   D - Detect Bloom&apos;s Level
 *   I - Identify Reasoning Path
 *   A - Assess Triple Accuracy
 *   G - Gap-Map Breakdown
 *   N - Name Misconception
 *   O - Outline Improvement
 *   S - Score Multidimensional
 *   (+ Echo-Back Teaching for top impactful answers)
 */

import type { BloomsLevel } from '@prisma/client';

// Re-export for convenience
export type { BloomsLevel } from '@prisma/client';

// =============================================================================
// BLOOM'S TAXONOMY CONSTANTS (shared with exam-generation)
// =============================================================================

export const BLOOMS_LEVELS = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

export const BLOOMS_LEVEL_ORDER: Record<BloomsLevel, number> = {
  REMEMBER: 0,
  UNDERSTAND: 1,
  APPLY: 2,
  ANALYZE: 3,
  EVALUATE: 4,
  CREATE: 5,
};

// =============================================================================
// EVALUATION MODES
// =============================================================================

export type EvaluationMode = 'quick_grade' | 'standard' | 'deep_diagnostic';

// =============================================================================
// COLLECTION TYPES (4-step conversational flow)
// =============================================================================

export type EvalCollectionStep =
  | 'attemptId'
  | 'evaluationMode'
  | 'options'
  | 'confirm'
  | 'complete';

export interface EvalCollectionState {
  step: EvalCollectionStep;
  collected: Partial<ExamEvaluatorParams>;
  conversationId: string;
  createdAt: number;
}

export interface ExamEvaluatorParams {
  attemptId: string;
  evaluationMode: EvaluationMode;
  enableGapMapping: boolean;
  enableEchoBack: boolean;
  enableMisconceptionId: boolean;
  // Context
  examId?: string;
  courseId?: string;
}

// =============================================================================
// DIAGNOSE FRAMEWORK TYPES
// =============================================================================

/** Layer I: Reasoning Path classification */
export type ReasoningPath =
  | 'expert'
  | 'valid_alternative'
  | 'fragile'
  | 'partial'
  | 'wrong_model'
  | 'guessing';

/** Layer A: Triple Accuracy Diagnosis (factual x logical x structural) */
export type TripleAccuracyDiagnosis =
  | 'MASTERY'             // T T T
  | 'LEVEL_MISMATCH'      // T T F
  | 'REASONING_GAP'       // T F T
  | 'KNOWLEDGE_GAP'       // F T T
  | 'MEMORIZER'           // T F F
  | 'INTUITIVE_THINKER'   // F T F
  | 'SHAPE_WITHOUT_SUBSTANCE' // F F T
  | 'STARTING_POINT';     // F F F

/** Layer G: Breakdown type classification */
export type BreakdownType =
  | 'MISSING_KNOWLEDGE'
  | 'WRONG_CONNECTION'
  | 'OVER_SIMPLIFICATION'
  | 'OVER_COMPLICATION'
  | 'PROCEDURAL_ERROR'
  | 'TRANSFER_FAILURE';

/** Layer N: Misconception categories */
export type MisconceptionCategory =
  | 'factual'        // A1-A4
  | 'reasoning'      // B1-B5
  | 'structural'     // C1-C5
  | 'meta_cognitive'; // D1-D5

export interface MisconceptionEntry {
  id: string;            // e.g., 'A1', 'B3', 'C5'
  name: string;          // e.g., 'DEFINITION_DRIFT'
  category: MisconceptionCategory;
  description: string;
}

/** Layer D: Gap severity classification */
export type GapSeverity =
  | 'met'         // gap = 0
  | 'exceeded'    // gap < 0 (demonstrated > target)
  | 'close'       // gap = 1
  | 'struggling'  // gap = 2-3
  | 'fundamental'; // gap >= 4

// =============================================================================
// PER-ANSWER DIAGNOSIS RESULT (7 Layers)
// =============================================================================

export interface AnswerDiagnosis {
  questionId: string;

  // Layer D: Detect Bloom&apos;s Level
  targetBloomsLevel: BloomsLevel;
  demonstratedLevel: BloomsLevel;
  bloomsGap: number;             // target - demonstrated (positive = underperforming)
  gapSeverity: GapSeverity;
  bloomsEvidence: string;

  // Layer I: Identify Reasoning Path
  reasoningPath: ReasoningPath;
  reasoningPathEvidence: string;
  forkPoint?: string;            // Where reasoning diverged (for partial/wrong_model)

  // Layer A: Assess Triple Accuracy
  factualAccuracy: boolean;
  logicalAccuracy: boolean;
  structuralAccuracy: boolean;
  tripleAccuracyDiagnosis: TripleAccuracyDiagnosis;
  accuracyDetails: string;

  // Layer G: Gap-Map Breakdown
  breakdownPoint?: string;
  solidFoundation: string[];
  breakdownType?: BreakdownType;
  contaminatedSteps: string[];

  // Layer N: Name Misconception
  misconceptions: MisconceptionEntry[];

  // Layer O: Outline Improvement
  currentState: string;
  targetState: string;
  interventionSteps: Array<{
    step: number;
    action: string;
    arrowPhase?: string;
    successCriteria: string;
  }>;
  verificationQuestion: string;

  // Layer S: Score Multidimensional
  scores: AnswerScores;

  // Overall
  feedback: string;
  strengths: string[];
}

export interface AnswerScores {
  factualAccuracyScore: number;      // /10
  logicalCoherenceScore: number;     // /10
  bloomsLevelMatchScore: number;     // /10
  depthScore: number;                // /10
  communicationScore: number;        // /10
  composite: number;                 // weighted /10
}

/** Scoring weights: factual 20%, logical 25%, blooms 25%, depth 20%, communication 10% */
export const SCORING_WEIGHTS = {
  factualAccuracy: 0.20,
  logicalCoherence: 0.25,
  bloomsLevelMatch: 0.25,
  depth: 0.20,
  communication: 0.10,
} as const;

export const QUALITY_RETRY_THRESHOLD = 50;
export const MAX_QUALITY_RETRIES = 2;

// =============================================================================
// ECHO-BACK TEACHING
// =============================================================================

export interface EchoBack {
  questionId: string;
  hereIsWhatYouDid: string;
  hereIsWhereItBroke: string;
  hereIsHowExpertThinks: string;
  keyInsight: string;
  patternRecognition: string;
  practiceQuestion: string;
}

// =============================================================================
// COGNITIVE PROFILE (Aggregate)
// =============================================================================

export type BloomsMasteryStatus =
  | 'mastery'    // >= 80%
  | 'solid'      // 60-79%
  | 'developing' // 40-59%
  | 'emerging'   // 20-39%
  | 'gap';       // < 20%

export interface CognitiveProfile {
  bloomsCognitiveMap: Record<BloomsLevel, {
    score: number;
    status: BloomsMasteryStatus;
    keyFinding: string;
  }>;
  cognitiveCeiling: BloomsLevel;
  growthEdge: BloomsLevel;
  criticalGap?: BloomsLevel;
  thinkingPatternAnalysis: {
    dominantStyle: string;
    description: string;
    limitations: string[];
  };
  reasoningPathDistribution: Record<ReasoningPath, number>; // percentages
  strengthMap: string[];
  vulnerabilityMap: string[];
  misconceptionSummary: Array<{ id: string; name: string; frequency: number }>;
}

// =============================================================================
// IMPROVEMENT ROADMAP
// =============================================================================

export interface ImprovementRoadmap {
  priorities: Array<{
    priority: number;
    title: string;
    arrowPhases: string[];
    actions: string[];
    successMetric: string;
  }>;
  verificationQuestions: Array<{
    forGap: string;
    question: string;
  }>;
  estimatedTimeToNextLevel: string;
}

// =============================================================================
// ORCHESTRATION CONFIG & RESULT
// =============================================================================

export interface EvalOrchestrationConfig {
  params: ExamEvaluatorParams;
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

export interface EvalOrchestrationResult {
  success: boolean;
  attemptId?: string;
  cognitiveProfile?: CognitiveProfile;
  improvementRoadmap?: ImprovementRoadmap;
  echoBackCount?: number;
  stats?: {
    totalAnswers: number;
    averageComposite: number;
    bloomsGapAverage: number;
    misconceptionsFound: number;
    fragileCorrectCount: number;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export type EvalSSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'answer_evaluating'
  | 'answer_diagnosed'
  | 'echo_back_generated'
  | 'cognitive_profile'
  | 'improvement_roadmap'
  | 'thinking'
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
