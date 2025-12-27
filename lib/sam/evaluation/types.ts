/**
 * Hardened Evaluation Types
 *
 * Priority 8: Harden Assessment Reliability
 * Types for dual-pass scoring and assessment verification
 */

import type { BloomsLevel } from '../pedagogical';

// ============================================================================
// RUBRIC TYPES
// ============================================================================

/**
 * Rubric criterion
 */
export interface RubricCriterion {
  /**
   * Criterion identifier
   */
  id: string;

  /**
   * Criterion name
   */
  name: string;

  /**
   * Description of the criterion
   */
  description: string;

  /**
   * Maximum points for this criterion
   */
  maxPoints: number;

  /**
   * Weight for this criterion (0-1)
   */
  weight: number;

  /**
   * Scoring levels for this criterion
   */
  levels: RubricLevel[];

  /**
   * Keywords that indicate this criterion is addressed
   */
  keywords?: string[];

  /**
   * Whether this criterion is required
   */
  required: boolean;
}

/**
 * Rubric scoring level
 */
export interface RubricLevel {
  /**
   * Level name (e.g., "Excellent", "Good", "Needs Improvement")
   */
  name: string;

  /**
   * Points for this level
   */
  points: number;

  /**
   * Description of what qualifies for this level
   */
  description: string;

  /**
   * Keywords that indicate this level
   */
  keywords?: string[];
}

/**
 * Complete rubric
 */
export interface Rubric {
  /**
   * Rubric identifier
   */
  id: string;

  /**
   * Rubric name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Total maximum points
   */
  maxPoints: number;

  /**
   * Criteria for evaluation
   */
  criteria: RubricCriterion[];

  /**
   * Target Bloom's level
   */
  targetBloomsLevel?: BloomsLevel;

  /**
   * Version of the rubric
   */
  version: string;

  /**
   * Created date
   */
  createdAt: Date;
}

// ============================================================================
// STUDENT RESPONSE TYPES
// ============================================================================

/**
 * Student response to evaluate
 */
export interface StudentResponse {
  /**
   * Response identifier
   */
  id: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Question/prompt identifier
   */
  questionId: string;

  /**
   * The response content
   */
  content: string;

  /**
   * Response type
   */
  type: 'essay' | 'short_answer' | 'code' | 'multiple_choice' | 'true_false';

  /**
   * Submission timestamp
   */
  submittedAt: Date;

  /**
   * Time spent in seconds
   */
  timeSpentSeconds?: number;

  /**
   * Word count
   */
  wordCount?: number;

  /**
   * Attachments (if any)
   */
  attachments?: ResponseAttachment[];
}

/**
 * Response attachment
 */
export interface ResponseAttachment {
  /**
   * Attachment identifier
   */
  id: string;

  /**
   * Attachment type
   */
  type: 'image' | 'file' | 'link';

  /**
   * URL or path
   */
  url: string;

  /**
   * Description
   */
  description?: string;
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/**
 * Scoring source
 */
export type ScoringSource = 'llm_primary' | 'llm_secondary' | 'rules' | 'aggregated' | 'human';

/**
 * Individual score result
 */
export interface ScoreResult {
  /**
   * Numerical score
   */
  score: number;

  /**
   * Maximum possible score
   */
  maxScore: number;

  /**
   * Percentage score (0-100)
   */
  percentage: number;

  /**
   * Confidence in the score (0-1)
   */
  confidence: number;

  /**
   * Source of the score
   */
  source: ScoringSource;

  /**
   * Detailed feedback
   */
  feedback: string;

  /**
   * Strengths identified
   */
  strengths: string[];

  /**
   * Areas for improvement
   */
  improvements: string[];

  /**
   * Criterion-level scores
   */
  criterionScores?: CriterionScore[];

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Model/version used (for LLM scores)
   */
  modelVersion?: string;
}

/**
 * Score for a specific criterion
 */
export interface CriterionScore {
  /**
   * Criterion identifier
   */
  criterionId: string;

  /**
   * Score awarded
   */
  score: number;

  /**
   * Maximum score
   */
  maxScore: number;

  /**
   * Level achieved
   */
  levelAchieved: string;

  /**
   * Justification
   */
  justification: string;

  /**
   * Keywords matched
   */
  keywordsMatched?: string[];
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

/**
 * Scoring agreement level
 */
export type AgreementLevel = 'strong' | 'moderate' | 'weak' | 'disagreement';

/**
 * Verification result
 */
export interface VerificationResult {
  /**
   * Whether verification passed
   */
  passed: boolean;

  /**
   * Agreement level between scorers
   */
  agreementLevel: AgreementLevel;

  /**
   * Score difference
   */
  scoreDifference: number;

  /**
   * Percentage difference
   */
  percentageDifference: number;

  /**
   * Primary score
   */
  primaryScore: ScoreResult;

  /**
   * Secondary score (if dual-pass)
   */
  secondaryScore?: ScoreResult;

  /**
   * Rules-based score
   */
  rulesScore?: ScoreResult;

  /**
   * Final aggregated score
   */
  aggregatedScore: ScoreResult;

  /**
   * Whether human review is needed
   */
  needsHumanReview: boolean;

  /**
   * Reason for human review (if needed)
   */
  humanReviewReason?: string;

  /**
   * Verification timestamp
   */
  verifiedAt: Date;
}

/**
 * Verified evaluation result
 */
export interface VerifiedEvaluation {
  /**
   * Evaluation identifier
   */
  id: string;

  /**
   * Response evaluated
   */
  responseId: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Rubric used
   */
  rubricId: string;

  /**
   * Final score
   */
  finalScore: ScoreResult;

  /**
   * Verification result
   */
  verification: VerificationResult;

  /**
   * All individual scores
   */
  allScores: ScoreResult[];

  /**
   * Human review status
   */
  humanReviewStatus: 'not_needed' | 'pending' | 'completed' | 'overridden';

  /**
   * Human review (if completed)
   */
  humanReview?: HumanReviewResult;

  /**
   * Evaluation timestamp
   */
  evaluatedAt: Date;
}

/**
 * Human review result
 */
export interface HumanReviewResult {
  /**
   * Reviewer identifier
   */
  reviewerId: string;

  /**
   * Final score after review
   */
  finalScore: number;

  /**
   * Feedback from reviewer
   */
  feedback: string;

  /**
   * Reason for override (if score changed)
   */
  overrideReason?: string;

  /**
   * Review timestamp
   */
  reviewedAt: Date;
}

// ============================================================================
// ADVERSARIAL TESTING TYPES
// ============================================================================

/**
 * Adversarial answer variation
 */
export interface AdversarialVariation {
  /**
   * Variation identifier
   */
  id: string;

  /**
   * Variation type
   */
  type: AdversarialType;

  /**
   * The varied answer content
   */
  content: string;

  /**
   * Expected outcome
   */
  expectedOutcome: 'accept' | 'reject' | 'partial';

  /**
   * Expected score range
   */
  expectedScoreRange: {
    min: number;
    max: number;
  };

  /**
   * Description of the variation
   */
  description: string;
}

/**
 * Types of adversarial variations
 */
export type AdversarialType =
  | 'correct_rephrased'
  | 'correct_verbose'
  | 'correct_concise'
  | 'partially_correct'
  | 'off_topic'
  | 'wrong_but_confident'
  | 'keyword_stuffing'
  | 'plagiarism_style'
  | 'edge_case'
  | 'ambiguous';

/**
 * Answer key verification result
 */
export interface AnswerKeyVerification {
  /**
   * Question identifier
   */
  questionId: string;

  /**
   * Expected answer
   */
  expectedAnswer: string;

  /**
   * Variations tested
   */
  variationsTested: number;

  /**
   * Results for each variation
   */
  results: AdversarialTestResult[];

  /**
   * False positives found
   */
  falsePositives: AdversarialTestResult[];

  /**
   * False negatives found
   */
  falseNegatives: AdversarialTestResult[];

  /**
   * Reliability score (0-100)
   */
  reliabilityScore: number;

  /**
   * Issues found
   */
  issues: AnswerKeyIssue[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Verification passed
   */
  passed: boolean;
}

/**
 * Result of testing an adversarial variation
 */
export interface AdversarialTestResult {
  /**
   * The variation tested
   */
  variation: AdversarialVariation;

  /**
   * Actual score received
   */
  actualScore: number;

  /**
   * Whether it matched expected outcome
   */
  matchedExpectation: boolean;

  /**
   * Whether it's a false positive
   */
  isFalsePositive: boolean;

  /**
   * Whether it's a false negative
   */
  isFalseNegative: boolean;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * Issue found with answer key
 */
export interface AnswerKeyIssue {
  /**
   * Issue type
   */
  type: 'false_positive' | 'false_negative' | 'inconsistent' | 'ambiguous';

  /**
   * Severity
   */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Description
   */
  description: string;

  /**
   * Affected variation
   */
  affectedVariation?: AdversarialVariation;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Hardened evaluator configuration
 */
export interface HardenedEvaluatorConfig {
  /**
   * Score difference tolerance (percentage points)
   */
  toleranceThreshold?: number;

  /**
   * Whether to always use dual-pass scoring
   */
  alwaysUseDualPass?: boolean;

  /**
   * Whether to use rules-based scoring
   */
  useRulesBasedScoring?: boolean;

  /**
   * Minimum confidence required
   */
  minConfidence?: number;

  /**
   * Aggregation method for multiple scores
   */
  aggregationMethod?: 'median' | 'average' | 'weighted' | 'conservative';

  /**
   * Weight for primary LLM score (if using weighted aggregation)
   */
  primaryWeight?: number;

  /**
   * Weight for secondary LLM score
   */
  secondaryWeight?: number;

  /**
   * Weight for rules-based score
   */
  rulesWeight?: number;

  /**
   * Threshold for flagging human review
   */
  humanReviewThreshold?: number;

  /**
   * Model to use for primary evaluation
   */
  primaryModel?: string;

  /**
   * Model to use for secondary evaluation
   */
  secondaryModel?: string;
}

/**
 * Default hardened evaluator configuration
 */
export const DEFAULT_HARDENED_EVALUATOR_CONFIG: Required<HardenedEvaluatorConfig> = {
  toleranceThreshold: 10, // 10 percentage points
  alwaysUseDualPass: false,
  useRulesBasedScoring: true,
  minConfidence: 0.7,
  aggregationMethod: 'weighted',
  primaryWeight: 0.5,
  secondaryWeight: 0.3,
  rulesWeight: 0.2,
  humanReviewThreshold: 15, // Flag if difference > 15%
  primaryModel: 'claude-3-5-sonnet-latest',
  secondaryModel: 'claude-3-haiku-20240307',
};

/**
 * Rules-based scorer configuration
 */
export interface RulesBasedScorerConfig {
  /**
   * Whether to check for keywords
   */
  checkKeywords?: boolean;

  /**
   * Whether to check content length
   */
  checkContentLength?: boolean;

  /**
   * Whether to check structure
   */
  checkStructure?: boolean;

  /**
   * Minimum word count for full credit
   */
  minWordCount?: number;

  /**
   * Maximum word count (penalize if exceeded)
   */
  maxWordCount?: number;

  /**
   * Required keywords (case-insensitive)
   */
  requiredKeywords?: string[];

  /**
   * Bonus keywords (add points)
   */
  bonusKeywords?: string[];

  /**
   * Penalty keywords (subtract points)
   */
  penaltyKeywords?: string[];
}

/**
 * Default rules-based scorer configuration
 */
export const DEFAULT_RULES_BASED_SCORER_CONFIG: Required<RulesBasedScorerConfig> = {
  checkKeywords: true,
  checkContentLength: true,
  checkStructure: true,
  minWordCount: 50,
  maxWordCount: 2000,
  requiredKeywords: [],
  bonusKeywords: [],
  penaltyKeywords: [],
};

/**
 * Adversarial generator configuration
 */
export interface AdversarialGeneratorConfig {
  /**
   * Number of variations to generate
   */
  variationCount?: number;

  /**
   * Types of variations to generate
   */
  variationTypes?: AdversarialType[];

  /**
   * Whether to include edge cases
   */
  includeEdgeCases?: boolean;

  /**
   * Difficulty level of adversarial cases
   */
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Default adversarial generator configuration
 */
export const DEFAULT_ADVERSARIAL_GENERATOR_CONFIG: Required<AdversarialGeneratorConfig> = {
  variationCount: 5,
  variationTypes: [
    'correct_rephrased',
    'partially_correct',
    'off_topic',
    'wrong_but_confident',
    'edge_case',
  ],
  includeEdgeCases: true,
  difficulty: 'medium',
};

// ============================================================================
// HUMAN REVIEW TYPES
// ============================================================================

/**
 * Human review request
 */
export interface HumanReviewRequest {
  /**
   * Request identifier
   */
  id: string;

  /**
   * Evaluation to review
   */
  evaluationId: string;

  /**
   * Response being reviewed
   */
  responseId: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Reason for review
   */
  reason: HumanReviewReason;

  /**
   * Priority
   */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * All scores for comparison
   */
  scores: ScoreResult[];

  /**
   * Score difference
   */
  scoreDifference: number;

  /**
   * Request timestamp
   */
  requestedAt: Date;

  /**
   * Status
   */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  /**
   * Assigned reviewer
   */
  assignedTo?: string;

  /**
   * Due date
   */
  dueBy?: Date;
}

/**
 * Reasons for human review
 */
export type HumanReviewReason =
  | 'score_disagreement'
  | 'low_confidence'
  | 'edge_case'
  | 'student_appeal'
  | 'random_sample'
  | 'quality_assurance'
  | 'new_rubric'
  | 'flagged_content';

/**
 * Human review queue statistics
 */
export interface ReviewQueueStats {
  /**
   * Total pending reviews
   */
  totalPending: number;

  /**
   * High priority pending
   */
  highPriorityPending: number;

  /**
   * Average wait time in hours
   */
  averageWaitTimeHours: number;

  /**
   * Reviews by reason
   */
  byReason: Record<HumanReviewReason, number>;

  /**
   * Reviews completed today
   */
  completedToday: number;

  /**
   * Overdue reviews
   */
  overdue: number;
}
