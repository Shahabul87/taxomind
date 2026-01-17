/**
 * @sam-ai/educational - Validation Module
 * Schema validation for AI responses
 *
 * This is the canonical validation stack for SAM AI.
 * lib/sam/schemas re-exports from this module.
 */
// Schemas (all validation schemas for AI responses)
export { 
// Core Schemas
BloomsLevelSchema, BloomsDistributionSchema, 
// Evaluation Schemas
SubjectiveEvaluationResponseSchema, GradingAssistanceResponseSchema, RubricAlignmentSchema, ComparisonToExpectedSchema, 
// Question Schemas
AdaptiveQuestionResponseSchema, QuestionOptionSchema, AssessmentQuestionSchema, AssessmentQuestionsResponseSchema, 
// Analysis Schemas
ContentAnalysisResponseSchema,
// Note: RubricAlignmentSchema, ComparisonToExpectedSchema, QuestionOptionSchema,
// AssessmentQuestionSchema, and BloomsDistributionSchema are also exported above
 } from './schemas';
// Utilities - Core functions
export { 
// JSON Extraction
extractJson, extractJsonWithOptions, fixCommonJsonIssues, 
// Core Validation
parseAndValidate, validateSchema, safeParseWithDefaults, 
// Retry Logic
createRetryPrompt, executeWithRetry, DEFAULT_RETRY_CONFIG, 
// Advanced Validation
createPartialSchema, validateWithDefaults, 
// Schema-Specific Validators
validateEvaluationResponse, validateGradingAssistanceResponse, validateAdaptiveQuestionResponse, validateAssessmentQuestionsResponse, validateContentAnalysisResponse, } from './utils';
