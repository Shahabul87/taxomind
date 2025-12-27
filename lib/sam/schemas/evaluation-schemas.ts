/**
 * Evaluation Schemas
 *
 * Priority 3: Strict JSON Schema Validation
 * Replaces permissive parsing with Zod validation for all AI responses
 */

import { z } from 'zod';

// ============================================================================
// BLOOM'S TAXONOMY LEVELS
// ============================================================================

export const BloomsLevelSchema = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

export type BloomsLevel = z.infer<typeof BloomsLevelSchema>;

// ============================================================================
// QUESTION TYPES
// ============================================================================

export const QuestionTypeSchema = z.enum([
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
  'MATCHING',
  'ORDERING',
  'FILL_IN_BLANK',
  'CODE',
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// ============================================================================
// DIFFICULTY LEVELS
// ============================================================================

export const DifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

export type Difficulty = z.infer<typeof DifficultySchema>;

// ============================================================================
// SUBJECTIVE EVALUATION RESPONSE SCHEMA
// ============================================================================

/**
 * Schema for AI-generated subjective answer evaluation
 * Used by: parseEvaluationResponse()
 */
export const SubjectiveEvaluationResponseSchema = z.object({
  score: z.number().min(0).describe('Points earned by the student'),
  accuracy: z
    .number()
    .min(0)
    .max(100)
    .describe('How accurately the answer addresses the question (0-100)'),
  completeness: z
    .number()
    .min(0)
    .max(100)
    .describe('How completely the answer covers required points (0-100)'),
  relevance: z
    .number()
    .min(0)
    .max(100)
    .describe('How relevant the answer is to the question (0-100)'),
  depth: z
    .number()
    .min(0)
    .max(100)
    .describe('Depth of understanding demonstrated (0-100)'),
  feedback: z
    .string()
    .min(10)
    .describe('Constructive feedback for the student'),
  strengths: z
    .array(z.string())
    .min(1)
    .describe('List of answer strengths'),
  improvements: z
    .array(z.string())
    .describe('List of areas for improvement'),
  nextSteps: z
    .array(z.string())
    .describe('Suggested next steps for the student'),
  demonstratedBloomsLevel: BloomsLevelSchema.describe(
    'The Bloom\'s level demonstrated by the student'
  ),
  misconceptions: z
    .array(z.string())
    .optional()
    .describe('Detected misconceptions in the answer'),
});

export type SubjectiveEvaluationResponse = z.infer<
  typeof SubjectiveEvaluationResponseSchema
>;

// ============================================================================
// GRADING ASSISTANCE RESPONSE SCHEMA
// ============================================================================

/**
 * Schema for rubric alignment in grading assistance
 */
export const RubricAlignmentSchema = z.object({
  criterionName: z.string().describe('Name of the rubric criterion'),
  score: z.number().min(0).describe('Score for this criterion'),
  maxScore: z.number().min(0).describe('Maximum score for this criterion'),
  justification: z.string().describe('Justification for the score'),
});

export type RubricAlignment = z.infer<typeof RubricAlignmentSchema>;

/**
 * Schema for comparison to expected answer
 */
export const ComparisonToExpectedSchema = z.object({
  coveragePercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('Percentage of expected content covered'),
  missingKeyPoints: z
    .array(z.string())
    .describe('Key points missing from the answer'),
  extraneousPoints: z
    .array(z.string())
    .describe('Points included that are irrelevant'),
  accuracyScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall accuracy of the answer'),
});

export type ComparisonToExpected = z.infer<typeof ComparisonToExpectedSchema>;

/**
 * Schema for AI-generated grading assistance
 * Used by: parseGradingAssistance()
 */
export const GradingAssistanceResponseSchema = z.object({
  suggestedScore: z.number().min(0).describe('Suggested score for the answer'),
  maxScore: z.number().min(0).describe('Maximum possible score'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence level in the suggested score (0-1)'),
  reasoning: z
    .string()
    .min(20)
    .describe('Detailed reasoning for the score'),
  rubricAlignment: z
    .array(RubricAlignmentSchema)
    .describe('How the answer aligns with each rubric criterion'),
  keyStrengths: z
    .array(z.string())
    .describe('Key strengths of the answer'),
  keyWeaknesses: z
    .array(z.string())
    .describe('Key weaknesses of the answer'),
  suggestedFeedback: z
    .string()
    .min(10)
    .describe('Suggested feedback to give the student'),
  flaggedIssues: z
    .array(z.string())
    .describe('Issues that need teacher attention'),
  comparisonToExpected: ComparisonToExpectedSchema.describe(
    'Comparison to the expected answer'
  ),
  teacherTips: z
    .array(z.string())
    .describe('Tips for the teacher on addressing gaps'),
});

export type GradingAssistanceResponse = z.infer<
  typeof GradingAssistanceResponseSchema
>;

// ============================================================================
// ADAPTIVE QUESTION RESPONSE SCHEMA
// ============================================================================

/**
 * Schema for question options
 */
export const QuestionOptionSchema = z.object({
  id: z.string().describe('Unique option identifier'),
  text: z.string().describe('Option text'),
  isCorrect: z.boolean().describe('Whether this option is correct'),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

/**
 * Schema for AI-generated adaptive question
 * Used by: parseAdaptiveQuestion()
 */
export const AdaptiveQuestionResponseSchema = z.object({
  id: z.string().optional().describe('Question ID (auto-generated if not provided)'),
  text: z.string().min(10).describe('The question text'),
  questionType: QuestionTypeSchema.describe('Type of question'),
  bloomsLevel: BloomsLevelSchema.describe('Bloom\'s taxonomy level'),
  difficulty: DifficultySchema.describe('Difficulty level'),
  options: z
    .array(QuestionOptionSchema)
    .optional()
    .describe('Options for multiple choice questions'),
  correctAnswer: z.string().describe('The correct answer'),
  explanation: z.string().min(10).describe('Explanation of the correct answer'),
  hints: z.array(z.string()).optional().describe('Hints to help the student'),
  timeEstimate: z
    .number()
    .min(10)
    .max(3600)
    .optional()
    .describe('Estimated time in seconds'),
  points: z.number().min(1).optional().describe('Points for this question'),
  tags: z.array(z.string()).optional().describe('Topic tags'),
});

export type AdaptiveQuestionResponse = z.infer<
  typeof AdaptiveQuestionResponseSchema
>;

// ============================================================================
// ASSESSMENT QUESTION RESPONSE SCHEMA
// ============================================================================

/**
 * Schema for a single generated assessment question
 */
export const AssessmentQuestionSchema = z.object({
  id: z.string().optional().describe('Question ID'),
  text: z.string().min(5).describe('The question text'),
  questionType: QuestionTypeSchema.describe('Type of question'),
  bloomsLevel: BloomsLevelSchema.describe('Bloom\'s taxonomy level'),
  difficulty: DifficultySchema.optional().describe('Difficulty level'),
  options: z.array(QuestionOptionSchema).optional().describe('Answer options'),
  correctAnswer: z.string().describe('The correct answer'),
  explanation: z.string().optional().describe('Explanation of the answer'),
  hints: z.array(z.string()).optional().describe('Hints'),
  timeEstimate: z.number().optional().describe('Time estimate in seconds'),
  points: z.number().optional().describe('Point value'),
  tags: z.array(z.string()).optional().describe('Topic tags'),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

/**
 * Schema for AI-generated assessment (array of questions)
 * Used by: generateAssessment()
 */
export const AssessmentQuestionsResponseSchema = z.array(AssessmentQuestionSchema);

export type AssessmentQuestionsResponse = z.infer<
  typeof AssessmentQuestionsResponseSchema
>;

// ============================================================================
// CONTENT ANALYSIS RESPONSE SCHEMA
// ============================================================================

/**
 * Schema for content analysis (Bloom's distribution)
 */
export const ContentAnalysisResponseSchema = z.object({
  dominantLevel: BloomsLevelSchema.describe('The dominant Bloom\'s level'),
  distribution: z
    .object({
      REMEMBER: z.number().min(0).max(100),
      UNDERSTAND: z.number().min(0).max(100),
      APPLY: z.number().min(0).max(100),
      ANALYZE: z.number().min(0).max(100),
      EVALUATE: z.number().min(0).max(100),
      CREATE: z.number().min(0).max(100),
    })
    .describe('Distribution across Bloom\'s levels (should sum to 100)'),
  confidence: z.number().min(0).max(1).describe('Confidence in the analysis'),
  cognitiveDepth: z.number().min(0).max(100).describe('Overall cognitive depth score'),
  balance: z
    .enum(['well-balanced', 'bottom-heavy', 'top-heavy'])
    .describe('Balance assessment'),
  gaps: z.array(BloomsLevelSchema).describe('Levels with insufficient coverage'),
  recommendations: z
    .array(
      z.object({
        level: BloomsLevelSchema,
        action: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
      })
    )
    .describe('Recommendations for improvement'),
});

export type ContentAnalysisResponse = z.infer<typeof ContentAnalysisResponseSchema>;

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

/**
 * Validation error with context
 */
export interface ValidationError {
  /**
   * Type of validation error
   */
  type: 'PARSE_ERROR' | 'SCHEMA_ERROR' | 'NO_JSON_FOUND';

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Zod error details (if schema validation failed)
   */
  zodErrors?: z.ZodError['errors'];

  /**
   * Raw content that failed validation
   */
  rawContent: string;

  /**
   * Schema that was being validated against
   */
  schemaName: string;

  /**
   * Timestamp of the error
   */
  timestamp: string;
}

/**
 * Result of a validation attempt
 */
export type ValidationAttemptResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

/**
 * Registry of all evaluation schemas
 */
export const EvaluationSchemas = {
  SubjectiveEvaluation: SubjectiveEvaluationResponseSchema,
  GradingAssistance: GradingAssistanceResponseSchema,
  AdaptiveQuestion: AdaptiveQuestionResponseSchema,
  AssessmentQuestions: AssessmentQuestionsResponseSchema,
  ContentAnalysis: ContentAnalysisResponseSchema,
} as const;

export type SchemaName = keyof typeof EvaluationSchemas;
