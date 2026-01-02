/**
 * @sam-ai/agentic - Self-Evaluation Types
 * Types for confidence scoring, response verification, and quality tracking
 */

import { z } from 'zod';

// ============================================================================
// CONFIDENCE SCORING TYPES
// ============================================================================

/**
 * Confidence level categories
 */
export const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNCERTAIN: 'uncertain',
} as const;

export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

/**
 * Confidence factor types
 */
export const ConfidenceFactorType = {
  KNOWLEDGE_COVERAGE: 'knowledge_coverage',
  SOURCE_RELIABILITY: 'source_reliability',
  COMPLEXITY_MATCH: 'complexity_match',
  CONTEXT_RELEVANCE: 'context_relevance',
  HISTORICAL_ACCURACY: 'historical_accuracy',
  CONCEPT_CLARITY: 'concept_clarity',
  PREREQUISITE_KNOWLEDGE: 'prerequisite_knowledge',
  AMBIGUITY_LEVEL: 'ambiguity_level',
} as const;

export type ConfidenceFactorType = (typeof ConfidenceFactorType)[keyof typeof ConfidenceFactorType];

/**
 * Individual confidence factor
 */
export interface ConfidenceFactor {
  type: ConfidenceFactorType;
  score: number; // 0-1
  weight: number; // Contribution to overall score
  reasoning: string;
  metadata?: Record<string, unknown>;
}

/**
 * Confidence score result
 */
export interface ConfidenceScore {
  id: string;
  responseId: string;
  userId: string;
  sessionId: string;

  // Scores
  overallScore: number; // 0-1
  level: ConfidenceLevel;
  factors: ConfidenceFactor[];

  // Response context
  responseType: ResponseType;
  topic?: string;
  complexity: ComplexityLevel;

  // Recommendations
  shouldVerify: boolean;
  suggestedDisclaimer?: string;
  alternativeApproaches?: string[];

  // Timestamps
  scoredAt: Date;
}

/**
 * Response types for scoring
 */
export const ResponseType = {
  EXPLANATION: 'explanation',
  ANSWER: 'answer',
  HINT: 'hint',
  FEEDBACK: 'feedback',
  ASSESSMENT: 'assessment',
  RECOMMENDATION: 'recommendation',
  CLARIFICATION: 'clarification',
} as const;

export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

/**
 * Complexity levels
 */
export const ComplexityLevel = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

export type ComplexityLevel = (typeof ComplexityLevel)[keyof typeof ComplexityLevel];

/**
 * Input for confidence scoring
 */
export interface ConfidenceInput {
  responseId: string;
  userId: string;
  sessionId: string;
  responseText: string;
  responseType: ResponseType;
  topic?: string;
  context?: ResponseContext;
  sources?: SourceReference[];
}

/**
 * Response context for scoring
 */
export interface ResponseContext {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  questionText?: string;
  studentLevel?: string;
  previousAttempts?: number;
  relatedConcepts?: string[];
}

/**
 * Source reference for verification
 */
export interface SourceReference {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  reliability: number; // 0-1
  lastVerified?: Date;
}

/**
 * Source types
 */
export const SourceType = {
  COURSE_CONTENT: 'course_content',
  TEXTBOOK: 'textbook',
  DOCUMENTATION: 'documentation',
  ACADEMIC_PAPER: 'academic_paper',
  KNOWLEDGE_BASE: 'knowledge_base',
  EXPERT_REVIEW: 'expert_review',
  GENERATED: 'generated',
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

// ============================================================================
// RESPONSE VERIFICATION TYPES
// ============================================================================

/**
 * Verification status
 */
export const VerificationStatus = {
  VERIFIED: 'verified',
  PARTIALLY_VERIFIED: 'partially_verified',
  UNVERIFIED: 'unverified',
  CONTRADICTED: 'contradicted',
  PENDING: 'pending',
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

/**
 * Verification result
 */
export interface VerificationResult {
  id: string;
  responseId: string;
  userId: string;

  // Status
  status: VerificationStatus;
  overallAccuracy: number; // 0-1

  // Fact checks
  factChecks: FactCheck[];
  totalClaims: number;
  verifiedClaims: number;
  contradictedClaims: number;

  // Source validation
  sourceValidations: SourceValidation[];

  // Issues found
  issues: VerificationIssue[];
  corrections?: CorrectionSuggestion[];

  // Timestamps
  verifiedAt: Date;
  expiresAt?: Date;
}

/**
 * Individual fact check
 */
export interface FactCheck {
  id: string;
  claim: string;
  status: FactCheckStatus;
  confidence: number; // 0-1
  supportingEvidence?: string[];
  contradictingEvidence?: string[];
  sources: string[]; // Source IDs
  notes?: string;
}

/**
 * Fact check status
 */
export const FactCheckStatus = {
  CONFIRMED: 'confirmed',
  LIKELY_CORRECT: 'likely_correct',
  UNCERTAIN: 'uncertain',
  LIKELY_INCORRECT: 'likely_incorrect',
  INCORRECT: 'incorrect',
  NOT_VERIFIABLE: 'not_verifiable',
} as const;

export type FactCheckStatus = (typeof FactCheckStatus)[keyof typeof FactCheckStatus];

/**
 * Source validation result
 */
export interface SourceValidation {
  sourceId: string;
  isValid: boolean;
  reliability: number;
  lastChecked: Date;
  issues?: string[];
}

/**
 * Verification issue
 */
export interface VerificationIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  location?: string; // Where in the response
  relatedClaims?: string[];
  suggestedFix?: string;
}

/**
 * Issue types
 */
export const IssueType = {
  FACTUAL_ERROR: 'factual_error',
  OUTDATED_INFORMATION: 'outdated_information',
  OVERSIMPLIFICATION: 'oversimplification',
  MISSING_CONTEXT: 'missing_context',
  AMBIGUOUS_STATEMENT: 'ambiguous_statement',
  POTENTIAL_MISCONCEPTION: 'potential_misconception',
  INCOMPLETE_EXPLANATION: 'incomplete_explanation',
  TERMINOLOGY_ERROR: 'terminology_error',
  LOGICAL_INCONSISTENCY: 'logical_inconsistency',
} as const;

export type IssueType = (typeof IssueType)[keyof typeof IssueType];

/**
 * Issue severity
 */
export const IssueSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity];

/**
 * Correction suggestion
 */
export interface CorrectionSuggestion {
  id: string;
  issueId: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  confidence: number;
  sources?: string[];
}

/**
 * Verification input
 */
export interface VerificationInput {
  responseId: string;
  userId: string;
  responseText: string;
  claims?: string[]; // Pre-extracted claims
  sources?: SourceReference[];
  context?: ResponseContext;
  strictMode?: boolean; // More thorough checking
}

// ============================================================================
// QUALITY TRACKING TYPES
// ============================================================================

/**
 * Quality metric types
 */
export const QualityMetricType = {
  ACCURACY: 'accuracy',
  HELPFULNESS: 'helpfulness',
  CLARITY: 'clarity',
  RELEVANCE: 'relevance',
  COMPLETENESS: 'completeness',
  ENGAGEMENT: 'engagement',
  PEDAGOGICAL_EFFECTIVENESS: 'pedagogical_effectiveness',
} as const;

export type QualityMetricType = (typeof QualityMetricType)[keyof typeof QualityMetricType];

/**
 * Quality record for a response
 */
export interface QualityRecord {
  id: string;
  responseId: string;
  userId: string;
  sessionId: string;

  // Scores
  metrics: QualityMetric[];
  overallQuality: number; // 0-1

  // Confidence correlation
  confidenceScore?: number;
  confidenceAccuracy?: number; // How well confidence predicted quality

  // Feedback
  studentFeedback?: StudentFeedback;
  expertReview?: ExpertReview;

  // Outcomes
  learningOutcome?: LearningOutcome;

  // Timestamps
  recordedAt: Date;
  updatedAt: Date;
}

/**
 * Individual quality metric
 */
export interface QualityMetric {
  type: QualityMetricType;
  score: number; // 0-1
  source: MetricSource;
  confidence: number;
  notes?: string;
}

/**
 * Metric source
 */
export const MetricSource = {
  AUTOMATED: 'automated',
  STUDENT_FEEDBACK: 'student_feedback',
  EXPERT_REVIEW: 'expert_review',
  OUTCOME_BASED: 'outcome_based',
  COMPARATIVE: 'comparative',
} as const;

export type MetricSource = (typeof MetricSource)[keyof typeof MetricSource];

/**
 * Student feedback on response
 */
export interface StudentFeedback {
  id: string;
  responseId: string;
  userId: string;

  // Ratings
  helpful: boolean;
  rating?: number; // 1-5
  clarity?: number; // 1-5

  // Free-form
  comment?: string;
  didUnderstand: boolean;
  needMoreHelp: boolean;

  // Actions taken after feedback
  askedFollowUp?: boolean;
  triedAgain?: boolean;
  succeededAfter?: boolean;

  submittedAt: Date;
}

/**
 * Expert review of response
 */
export interface ExpertReview {
  id: string;
  responseId: string;
  reviewerId: string;

  // Scores
  accuracyScore: number; // 0-1
  pedagogyScore: number; // 0-1
  appropriatenessScore: number; // 0-1

  // Issues
  issuesFound: VerificationIssue[];
  suggestedImprovements: string[];

  // Verdict
  approved: boolean;
  requiresRevision: boolean;

  reviewedAt: Date;
}

/**
 * Learning outcome tracking
 */
export interface LearningOutcome {
  id: string;
  responseId: string;
  userId: string;

  // Assessment results
  subsequentAttempts: number;
  successfulAttempts: number;
  masteryImprovement: number; // Change in mastery score

  // Engagement
  timeSpentLearning: number; // minutes
  additionalResourcesUsed: number;

  // Long-term
  retentionScore?: number;
  transferScore?: number; // Applied to related topics

  measuredAt: Date;
}

/**
 * Calibration data for confidence adjustment
 */
export interface CalibrationData {
  id: string;
  userId?: string; // null for global
  topic?: string;

  // Calibration metrics
  totalResponses: number;
  expectedAccuracy: number; // Based on confidence scores
  actualAccuracy: number;
  calibrationError: number; // |expected - actual|

  // Breakdown by confidence level
  byConfidenceLevel: CalibrationBucket[];

  // Adjustment factors
  adjustmentFactor: number; // Multiply confidence by this
  adjustmentDirection: 'increase' | 'decrease' | 'none';

  // Time range
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

/**
 * Calibration bucket for a confidence level
 */
export interface CalibrationBucket {
  level: ConfidenceLevel;
  count: number;
  expectedAccuracy: number;
  actualAccuracy: number;
  isOverconfident: boolean;
  isUnderconfident: boolean;
}

/**
 * Quality summary for a time period
 */
export interface QualitySummary {
  userId?: string;
  periodStart: Date;
  periodEnd: Date;

  // Aggregate metrics
  totalResponses: number;
  averageQuality: number;
  averageConfidence: number;
  calibrationScore: number;

  // Breakdown
  byResponseType: Record<ResponseType, QualityAggregate>;
  byTopic: Record<string, QualityAggregate>;
  byComplexity: Record<ComplexityLevel, QualityAggregate>;

  // Trends
  qualityTrend: 'improving' | 'stable' | 'declining';
  confidenceTrend: 'improving' | 'stable' | 'declining';

  // Recommendations
  improvementAreas: string[];
  strengths: string[];
}

/**
 * Aggregated quality data
 */
export interface QualityAggregate {
  count: number;
  averageQuality: number;
  averageConfidence: number;
  verificationRate: number;
  issueRate: number;
}

// ============================================================================
// STORE INTERFACES
// ============================================================================

/**
 * Confidence score store
 */
export interface ConfidenceScoreStore {
  get(id: string): Promise<ConfidenceScore | null>;
  getByResponse(responseId: string): Promise<ConfidenceScore | null>;
  getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
  create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
  getAverageByTopic(topic: string, since?: Date): Promise<number>;
  getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}

/**
 * Verification result store
 */
export interface VerificationResultStore {
  get(id: string): Promise<VerificationResult | null>;
  getByResponse(responseId: string): Promise<VerificationResult | null>;
  getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
  create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
  update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
  getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
}

/**
 * Quality record store
 */
export interface QualityRecordStore {
  get(id: string): Promise<QualityRecord | null>;
  getByResponse(responseId: string): Promise<QualityRecord | null>;
  getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
  create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
  update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
  recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
  recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
  getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
}

/**
 * Calibration store
 */
export interface CalibrationStore {
  get(id: string): Promise<CalibrationData | null>;
  getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
  create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
  getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const ConfidenceInputSchema = z.object({
  responseId: z.string().min(1),
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  responseText: z.string().min(1),
  responseType: z.enum([
    'explanation',
    'answer',
    'hint',
    'feedback',
    'assessment',
    'recommendation',
    'clarification',
  ]),
  topic: z.string().optional(),
  context: z
    .object({
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      questionText: z.string().optional(),
      studentLevel: z.string().optional(),
      previousAttempts: z.number().optional(),
      relatedConcepts: z.array(z.string()).optional(),
    })
    .optional(),
  sources: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        url: z.string().optional(),
        reliability: z.number().min(0).max(1),
        lastVerified: z.date().optional(),
      })
    )
    .optional(),
});

export const VerificationInputSchema = z.object({
  responseId: z.string().min(1),
  userId: z.string().min(1),
  responseText: z.string().min(1),
  claims: z.array(z.string()).optional(),
  sources: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        url: z.string().optional(),
        reliability: z.number().min(0).max(1),
        lastVerified: z.date().optional(),
      })
    )
    .optional(),
  context: z
    .object({
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      questionText: z.string().optional(),
      studentLevel: z.string().optional(),
      previousAttempts: z.number().optional(),
      relatedConcepts: z.array(z.string()).optional(),
    })
    .optional(),
  strictMode: z.boolean().optional(),
});

export const StudentFeedbackSchema = z.object({
  responseId: z.string().min(1),
  userId: z.string().min(1),
  helpful: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  clarity: z.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  didUnderstand: z.boolean(),
  needMoreHelp: z.boolean(),
  askedFollowUp: z.boolean().optional(),
  triedAgain: z.boolean().optional(),
  succeededAfter: z.boolean().optional(),
});

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface SelfEvaluationLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
