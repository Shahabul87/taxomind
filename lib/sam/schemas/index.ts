/**
 * Schema Validation Module
 *
 * Priority 3: Strict JSON Schema Validation
 * Replaces permissive parsing with Zod validation for all AI responses
 *
 * NOTE: This module re-exports from @sam-ai/educational for core validation,
 * ensuring a single canonical validation stack. The error-tracker module
 * remains unique to this location for app-specific error tracking.
 */

// ============================================================================
// RE-EXPORT FROM @sam-ai/educational (Canonical Source)
// ============================================================================

import { z } from 'zod';
import {
  RubricAlignmentSchema as _RubricAlignmentSchema,
  ComparisonToExpectedSchema as _ComparisonToExpectedSchema,
  QuestionOptionSchema as _QuestionOptionSchema,
  AssessmentQuestionSchema as _AssessmentQuestionSchema,
} from '@sam-ai/educational';

// Infer types from schemas for backward compatibility
export type RubricAlignment = z.infer<typeof _RubricAlignmentSchema>;
export type ComparisonToExpected = z.infer<typeof _ComparisonToExpectedSchema>;
export type QuestionOption = z.infer<typeof _QuestionOptionSchema>;
export type AssessmentQuestion = z.infer<typeof _AssessmentQuestionSchema>;

export {
  // Schemas
  BloomsLevelSchema,
  SubjectiveEvaluationResponseSchema,
  GradingAssistanceResponseSchema,
  RubricAlignmentSchema,
  ComparisonToExpectedSchema,
  AdaptiveQuestionResponseSchema,
  QuestionOptionSchema,
  AssessmentQuestionSchema,
  AssessmentQuestionsResponseSchema,
  BloomsDistributionSchema,
  ContentAnalysisResponseSchema,
  // Schema Types
  type BloomsLevel,
  type SubjectiveEvaluationResponse,
  type GradingAssistanceResponse,
  type AdaptiveQuestionResponse,
  type AssessmentQuestionsResponse,
  type ContentAnalysisResponse,
  // JSON Extraction
  extractJson,
  extractJsonWithOptions,
  fixCommonJsonIssues,
  type JsonExtractionOptions,
  type JsonExtractionResult,
  // Core Validation
  parseAndValidate,
  validateSchema,
  safeParseWithDefaults,
  // Retry Logic
  createRetryPrompt,
  executeWithRetry,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  type RetryOptions,
  // Advanced Validation
  createPartialSchema,
  validateWithDefaults,
  // Schema-Specific Validators
  validateEvaluationResponse,
  validateGradingAssistanceResponse,
  validateAdaptiveQuestionResponse,
  validateAssessmentQuestionsResponse,
  validateContentAnalysisResponse,
  // Types
  type ValidationResult,
  type ValidationError,
} from '@sam-ai/educational';

// ============================================================================
// APP-SPECIFIC SCHEMAS (Not in npm package)
// ============================================================================

export {
  // Question Types (app-specific)
  QuestionTypeSchema,
  type QuestionType,
  // Difficulty (app-specific)
  DifficultySchema,
  type Difficulty,
  // Extended Validation Types
  type ValidationAttemptResult,
  // Schema Registry
  EvaluationSchemas,
  type SchemaName,
} from './evaluation-schemas';

// Aliases for backward compatibility
export {
  validateEvaluationResponse as validateSubjectiveEvaluation,
  validateGradingAssistanceResponse as validateGradingAssistance,
  validateAdaptiveQuestionResponse as validateAdaptiveQuestion,
  validateAssessmentQuestionsResponse as validateAssessmentQuestions,
  validateContentAnalysisResponse as validateContentAnalysis,
} from '@sam-ai/educational';

// ============================================================================
// ERROR TRACKING (App-specific, not in npm package)
// ============================================================================

export {
  // Types
  type ErrorSeverity,
  type ErrorCategory,
  type TrackedError,
  type ErrorContext,
  type ErrorMetrics,
  type AlertConfig,
  type ErrorAlert,
  type TrackedValidationOptions,
  type ExecuteWithRetryFn,
  // Error Tracker
  ValidationErrorTracker,
  getErrorTracker,
  createErrorTracker,
  DEFAULT_ALERT_CONFIG,
  // Integration
  createTrackedExecutor,
} from './error-tracker';
