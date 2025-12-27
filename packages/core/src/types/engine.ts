/**
 * @sam-ai/core - Engine Types
 * Types for the engine system and orchestration
 */

import type { SAMContext, SAMSuggestion, SAMAction } from './context';

// ============================================================================
// BLOOM'S TAXONOMY
// ============================================================================

export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export const BLOOMS_LEVELS: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

export const BLOOMS_LEVEL_ORDER: Record<BloomsLevel, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface BloomsAnalysis {
  distribution: BloomsDistribution;
  dominantLevel: BloomsLevel;
  cognitiveDepth: number; // 0-100
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  gaps: BloomsLevel[];
  recommendations: string[];
  confidence?: number; // 0-1 when provided by AI-backed analyzers
  method?: 'keyword' | 'ai' | 'hybrid';
}

// ============================================================================
// ENGINE INPUT/OUTPUT
// ============================================================================

export interface EngineInput {
  context: SAMContext;
  query?: string;
  targetId?: string;
  options?: Record<string, unknown>;
  previousResults?: Record<string, EngineResult>;
}

export interface EngineResultData {
  [key: string]: unknown;
}

export interface EngineResultMetadata {
  executionTime: number;
  cached: boolean;
  version: string;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface EngineResult<T = EngineResultData> {
  engineName: string;
  success: boolean;
  data: T | null;
  metadata: EngineResultMetadata;
  error?: EngineErrorInfo;
}

export interface EngineErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

export interface EngineConfig {
  name: string;
  version: string;
  enabled: boolean;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  priority: number;
  dependencies: string[];
}

export interface EngineRegistration {
  name: string;
  version: string;
  dependencies: string[];
  config: Partial<EngineConfig>;
}

// ============================================================================
// ORCHESTRATION
// ============================================================================

export interface OrchestrationOptions {
  engines?: string[];
  parallel?: boolean;
  timeout?: number;
  includeInsights?: boolean;
  cacheResults?: boolean;
}

export interface AggregatedResponse {
  message: string;
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  insights: Record<string, unknown>;
  blooms?: BloomsAnalysis;
}

export interface OrchestrationMetadata {
  totalExecutionTime: number;
  enginesExecuted: string[];
  enginesFailed: string[];
  enginesCached: string[];
  parallelTiers: string[][];
}

export interface OrchestrationResult {
  success: boolean;
  results: Record<string, EngineResult>;
  response: AggregatedResponse;
  metadata: OrchestrationMetadata;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export type AnalysisType =
  | 'blooms'
  | 'content'
  | 'assessment'
  | 'personalization'
  | 'course-structure'
  | 'learning-path'
  | 'performance'
  | 'engagement';

export interface AnalysisRequest {
  type: AnalysisType;
  targetId: string;
  targetType: 'course' | 'chapter' | 'section' | 'user';
  options?: Record<string, unknown>;
}

export interface AnalysisResponse<T = unknown> {
  analysisId: string;
  type: AnalysisType;
  targetId: string;
  results: T;
  recommendations: SAMSuggestion[];
  timestamp: Date;
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

export type ContentType =
  | 'chapter'
  | 'section'
  | 'lesson'
  | 'quiz'
  | 'exercise'
  | 'summary'
  | 'explanation'
  | 'example';

export interface GenerationRequest {
  type: ContentType;
  context: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    bloomsLevel?: BloomsLevel;
  };
  options?: {
    length?: 'short' | 'medium' | 'long';
    style?: 'formal' | 'casual' | 'technical';
    includeExamples?: boolean;
    includeExercises?: boolean;
  };
}

export interface GenerationResponse {
  generationId: string;
  type: ContentType;
  content: string;
  metadata: {
    wordCount: number;
    bloomsLevel: BloomsLevel;
    estimatedReadTime: number;
  };
}

// ============================================================================
// ASSESSMENT
// ============================================================================

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'fill-blank';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  points: number;
  bloomsLevel: BloomsLevel;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  hints?: string[];
}

export interface AssessmentRequest {
  targetId: string;
  targetType: 'course' | 'chapter' | 'section';
  questionCount: number;
  bloomsDistribution?: Partial<BloomsDistribution>;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes?: QuestionType[];
}

export interface AssessmentResponse {
  assessmentId: string;
  questions: Question[];
  totalPoints: number;
  estimatedTime: number;
  bloomsAnalysis: BloomsAnalysis;
}
