/**
 * SAM Exam Generation Types
 *
 * Type definitions for SAM-integrated exam generation with
 * pedagogical validation, quality gates, and safety checks.
 */

import { BloomsLevel, QuestionType } from '@prisma/client';

// ============================================================================
// Request Types
// ============================================================================

/**
 * SAM-integrated exam generation request
 */
export interface SAMExamGenerationRequest {
  // Content context
  sectionId: string;
  sectionTitle: string;
  chapterTitle?: string;
  courseTitle?: string;

  // Generation parameters
  questionCount: number;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  assessmentPurpose: 'formative' | 'summative' | 'diagnostic';
  cognitiveLoadLimit: number;

  // Bloom's taxonomy distribution
  bloomsDistribution?: BloomsDistribution;
  autoOptimizeDistribution?: boolean;

  // Learning context
  learningObjectives: string[];
  prerequisiteKnowledge: string[];

  // Optional customization
  userPrompt?: string;
  contextualScenarios?: string[];
  fileContent?: string;

  // Validation options
  enableQualityValidation?: boolean;
  enableSafetyValidation?: boolean;
  enablePedagogicalValidation?: boolean;

  // User context (for ZPD evaluation)
  userId: string;
}

/**
 * Bloom's taxonomy question distribution
 */
export interface BloomsDistribution {
  REMEMBER?: number;
  UNDERSTAND?: number;
  APPLY?: number;
  ANALYZE?: number;
  EVALUATE?: number;
  CREATE?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Complete SAM exam generation result
 */
export interface SAMExamGenerationResult {
  success: boolean;
  questions: SAMEnhancedQuestion[];
  validation: ExamValidationResult;
  metadata: ExamGenerationMetadata;
  warnings?: string[];
  errors?: string[];
}

/**
 * Enhanced question with SAM validation data
 */
export interface SAMEnhancedQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: 'easy' | 'medium' | 'hard';

  // Answer data
  options?: string[];
  correctAnswer: string;
  explanation: string;

  // SAM-specific metadata
  cognitiveLoad: number;
  points: number;
  timeEstimate: number;

  // Validation results
  bloomsAlignment?: number;
  safetyScore?: number;
  qualityScore?: number;

  // Educational context
  assessmentCriteria?: string[];
  prerequisites?: string[];
  learningObjective?: string;
  hints?: string[];
  tags?: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Comprehensive exam validation result
 */
export interface ExamValidationResult {
  overall: ValidationSummary;
  schema: SchemaValidationResult;
  quality: QualityValidationResult;
  safety: SafetyValidationResult;
  pedagogical: PedagogicalValidationResult;
}

/**
 * Overall validation summary
 */
export interface ValidationSummary {
  passed: boolean;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: ValidationIssue[];
  recommendations: string[];
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  passed: boolean;
  validQuestions: number;
  invalidQuestions: number;
  errors: SchemaError[];
}

/**
 * Schema validation error
 */
export interface SchemaError {
  questionId: string;
  field: string;
  message: string;
  expected?: string;
  received?: string;
}

/**
 * Quality gates validation result
 */
export interface QualityValidationResult {
  passed: boolean;
  score: number;
  gates: QualityGateResult[];
  suggestions: string[];
}

/**
 * Individual quality gate result
 */
export interface QualityGateResult {
  gateName: string;
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Safety validation result
 */
export interface SafetyValidationResult {
  passed: boolean;
  score: number;
  biasDetected: boolean;
  discouragingLanguageDetected: boolean;
  accessibilityScore: number;
  issues: SafetyIssue[];
  questionResults: QuestionSafetyResult[];
}

/**
 * Safety issue details
 */
export interface SafetyIssue {
  type: 'bias' | 'discouraging_language' | 'accessibility' | 'constructive_framing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}

/**
 * Per-question safety result
 */
export interface QuestionSafetyResult {
  questionId: string;
  passed: boolean;
  score: number;
  issues: SafetyIssue[];
}

/**
 * Pedagogical validation result
 */
export interface PedagogicalValidationResult {
  passed: boolean;
  score: number;
  bloomsAlignment: BloomsAlignmentResult;
  scaffolding: ScaffoldingResult;
  zpd?: ZPDResult;
}

/**
 * Bloom's alignment validation result
 */
export interface BloomsAlignmentResult {
  passed: boolean;
  score: number;
  distribution: BloomsDistribution;
  targetDistribution: BloomsDistribution;
  alignmentByLevel: Record<BloomsLevel, number>;
  verbAnalysis: VerbAnalysisResult;
  suggestions: string[];
}

/**
 * Verb analysis for Bloom's level verification
 */
export interface VerbAnalysisResult {
  correctVerbs: string[];
  incorrectVerbs: string[];
  missingVerbs: string[];
  levelMismatches: LevelMismatch[];
}

/**
 * Level mismatch detail
 */
export interface LevelMismatch {
  questionId: string;
  claimedLevel: BloomsLevel;
  detectedLevel: BloomsLevel;
  confidence: number;
  evidence: string[];
}

/**
 * Scaffolding validation result
 */
export interface ScaffoldingResult {
  passed: boolean;
  score: number;
  complexityProgression: number;
  prerequisiteCoverage: number;
  supportStructures: number;
  issues: ScaffoldingIssue[];
}

/**
 * Scaffolding issue
 */
export interface ScaffoldingIssue {
  type: 'complexity_jump' | 'missing_prerequisite' | 'insufficient_support';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedQuestions: string[];
  suggestion: string;
}

/**
 * Zone of Proximal Development result
 */
export interface ZPDResult {
  passed: boolean;
  score: number;
  zone: 'too_easy' | 'optimal' | 'too_hard';
  challengeLevel: number;
  supportAdequacy: number;
  engagementPrediction: number;
  recommendations: string[];
}

/**
 * Generic validation issue
 */
export interface ValidationIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  questionId?: string;
  suggestion?: string;
}

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * Exam generation metadata
 */
export interface ExamGenerationMetadata {
  generatedAt: string;
  model: string;
  tokensUsed?: number;
  processingTimeMs: number;
  bloomsDistributionUsed: BloomsDistribution;
  validationEnabled: {
    schema: boolean;
    quality: boolean;
    safety: boolean;
    pedagogical: boolean;
  };
  telemetryId?: string;
}

// ============================================================================
// Quality Metrics Types
// ============================================================================

/**
 * Comprehensive exam quality metrics
 */
export interface ExamQualityMetrics {
  overall: number;

  // Component scores
  contentQuality: number;
  bloomsAlignment: number;
  safetyScore: number;
  pedagogicalScore: number;

  // Distribution metrics
  difficultyDistribution: DifficultyDistribution;
  bloomsDistribution: BloomsDistribution;
  questionTypeDistribution: QuestionTypeDistribution;

  // Additional metrics
  averageCognitiveLoad: number;
  estimatedCompletionTime: number;
  prerequisiteCoverage: number;
}

/**
 * Difficulty distribution
 */
export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

/**
 * Question type distribution
 */
export interface QuestionTypeDistribution {
  MULTIPLE_CHOICE: number;
  TRUE_FALSE: number;
  SHORT_ANSWER: number;
  ESSAY: number;
  FILL_IN_BLANK: number;
  MATCHING: number;
  ORDERING: number;
}

// ============================================================================
// Telemetry Types
// ============================================================================

/**
 * Exam generation telemetry event
 */
export interface ExamGenerationTelemetryEvent {
  eventType: 'generation_started' | 'generation_completed' | 'validation_completed' | 'generation_failed';
  timestamp: string;
  userId: string;
  sectionId: string;

  // Generation details
  questionCount?: number;
  questionsGenerated?: number;
  questionsValid?: number;

  // Validation scores
  qualityScore?: number;
  safetyScore?: number;
  pedagogicalScore?: number;

  // Performance
  processingTimeMs?: number;

  // Error details
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  BloomsLevel,
  QuestionType,
};
