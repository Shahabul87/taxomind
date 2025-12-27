/**
 * Version Control Types
 *
 * Priority 9: Prevent Evaluation Drift
 * Types for prompt/model versioning and regression testing
 */

// ============================================================================
// EVALUATION CONFIGURATION TYPES
// ============================================================================

/**
 * Versioned evaluation configuration
 */
export interface EvaluationConfig {
  /**
   * Configuration identifier
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Configuration version (semantic versioning)
   */
  version: string;

  /**
   * Model identifier (e.g., 'claude-3-5-sonnet-20241022')
   */
  modelId: string;

  /**
   * Prompt template version
   */
  promptVersion: string;

  /**
   * Rubric version
   */
  rubricVersion: string;

  /**
   * Whether this configuration is frozen (production-locked)
   */
  frozen: boolean;

  /**
   * Date when configuration was frozen
   */
  frozenAt?: Date;

  /**
   * Configuration parameters
   */
  parameters: EvaluationParameters;

  /**
   * Creation date
   */
  createdAt: Date;

  /**
   * Last modification date
   */
  updatedAt: Date;

  /**
   * Description of this configuration
   */
  description?: string;

  /**
   * Tags for organization
   */
  tags: string[];
}

/**
 * Evaluation parameters
 */
export interface EvaluationParameters {
  /**
   * Temperature for AI model
   */
  temperature: number;

  /**
   * Maximum tokens for response
   */
  maxTokens: number;

  /**
   * Dual-pass scoring threshold
   */
  dualPassThreshold: number;

  /**
   * Minimum confidence threshold
   */
  minConfidence: number;

  /**
   * Human review score difference threshold
   */
  humanReviewThreshold: number;

  /**
   * Aggregation method
   */
  aggregationMethod: 'median' | 'average' | 'weighted' | 'conservative';

  /**
   * Custom parameters
   */
  custom?: Record<string, unknown>;
}

/**
 * Prompt template
 */
export interface PromptTemplate {
  /**
   * Template identifier
   */
  id: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Template version (semantic versioning)
   */
  version: string;

  /**
   * Template type
   */
  type: PromptType;

  /**
   * The prompt text with placeholders
   */
  template: string;

  /**
   * Required variables for this template
   */
  requiredVariables: string[];

  /**
   * Optional variables
   */
  optionalVariables?: string[];

  /**
   * Example variable values
   */
  exampleValues?: Record<string, string>;

  /**
   * Whether this prompt is frozen
   */
  frozen: boolean;

  /**
   * Frozen date
   */
  frozenAt?: Date;

  /**
   * Creation date
   */
  createdAt: Date;

  /**
   * Description
   */
  description?: string;
}

/**
 * Prompt types
 */
export type PromptType =
  | 'primary_evaluation'
  | 'secondary_evaluation'
  | 'feedback_generation'
  | 'question_generation'
  | 'content_analysis'
  | 'rubric_application'
  | 'custom';

// ============================================================================
// GOLDEN TEST CASE TYPES
// ============================================================================

/**
 * Golden test case for regression testing
 */
export interface GoldenTestCase {
  /**
   * Test case identifier
   */
  id: string;

  /**
   * Test case name
   */
  name: string;

  /**
   * Test category
   */
  category: TestCategory;

  /**
   * Input student response
   */
  input: TestInput;

  /**
   * Expected evaluation result
   */
  expected: ExpectedResult;

  /**
   * Tolerance for score comparison
   */
  tolerance: number;

  /**
   * Priority (higher = more important)
   */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Tags for filtering
   */
  tags: string[];

  /**
   * Creation date
   */
  createdAt: Date;

  /**
   * Last verification date
   */
  lastVerifiedAt?: Date;

  /**
   * Whether this test is active
   */
  active: boolean;

  /**
   * Notes about this test case
   */
  notes?: string;
}

/**
 * Test categories
 */
export type TestCategory =
  | 'scoring_accuracy'
  | 'feedback_quality'
  | 'edge_case'
  | 'boundary_condition'
  | 'consistency'
  | 'bias_detection'
  | 'performance'
  | 'regression';

/**
 * Test input
 */
export interface TestInput {
  /**
   * Student response content
   */
  content: string;

  /**
   * Response type
   */
  responseType: 'essay' | 'short_answer' | 'code' | 'multiple_choice';

  /**
   * Question/prompt
   */
  question: string;

  /**
   * Expected answer (if applicable)
   */
  expectedAnswer?: string;

  /**
   * Rubric to use
   */
  rubric: TestRubric;

  /**
   * Maximum points possible
   */
  maxPoints: number;

  /**
   * Additional context
   */
  context?: Record<string, unknown>;
}

/**
 * Simplified rubric for testing
 */
export interface TestRubric {
  /**
   * Rubric identifier
   */
  id: string;

  /**
   * Rubric name
   */
  name: string;

  /**
   * Criteria descriptions
   */
  criteria: Array<{
    name: string;
    description: string;
    maxPoints: number;
    weight: number;
  }>;
}

/**
 * Expected result from evaluation
 */
export interface ExpectedResult {
  /**
   * Expected score
   */
  score: number;

  /**
   * Score tolerance (absolute points)
   */
  scoreTolerance: number;

  /**
   * Expected percentage (0-100)
   */
  percentage: number;

  /**
   * Percentage tolerance
   */
  percentageTolerance: number;

  /**
   * Minimum expected confidence
   */
  minConfidence: number;

  /**
   * Expected feedback keywords
   */
  feedbackKeywords?: string[];

  /**
   * Expected strengths keywords
   */
  strengthsKeywords?: string[];

  /**
   * Expected improvements keywords
   */
  improvementsKeywords?: string[];

  /**
   * Should trigger human review
   */
  shouldTriggerHumanReview?: boolean;
}

// ============================================================================
// REGRESSION TEST TYPES
// ============================================================================

/**
 * Regression test result
 */
export interface RegressionTestResult {
  /**
   * Test case that was run
   */
  testCase: GoldenTestCase;

  /**
   * Whether the test passed
   */
  passed: boolean;

  /**
   * Actual score received
   */
  actualScore: number;

  /**
   * Actual percentage
   */
  actualPercentage: number;

  /**
   * Score difference from expected
   */
  scoreDifference: number;

  /**
   * Percentage difference
   */
  percentageDifference: number;

  /**
   * Actual confidence
   */
  actualConfidence: number;

  /**
   * Whether confidence met minimum
   */
  confidenceMet: boolean;

  /**
   * Feedback keywords found
   */
  feedbackKeywordsFound: string[];

  /**
   * Feedback keywords missing
   */
  feedbackKeywordsMissing: string[];

  /**
   * Execution time in milliseconds
   */
  executionTimeMs: number;

  /**
   * Failure reasons (if failed)
   */
  failureReasons: string[];

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Configuration used
   */
  configId: string;
}

/**
 * Regression report
 */
export interface RegressionReport {
  /**
   * Report identifier
   */
  id: string;

  /**
   * Configuration identifier
   */
  configId: string;

  /**
   * Configuration version
   */
  configVersion: string;

  /**
   * Total tests run
   */
  totalTests: number;

  /**
   * Tests passed
   */
  passed: number;

  /**
   * Tests failed
   */
  failed: number;

  /**
   * Pass rate percentage
   */
  passRate: number;

  /**
   * Overall drift score
   */
  driftScore: number;

  /**
   * Whether drift exceeds threshold
   */
  driftExceedsThreshold: boolean;

  /**
   * Individual test results
   */
  results: RegressionTestResult[];

  /**
   * Failed tests (for quick access)
   */
  failedTests: RegressionTestResult[];

  /**
   * Critical failures
   */
  criticalFailures: RegressionTestResult[];

  /**
   * Summary statistics
   */
  statistics: RegressionStatistics;

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Report generation timestamp
   */
  generatedAt: Date;

  /**
   * Total execution time
   */
  totalExecutionTimeMs: number;
}

/**
 * Regression statistics
 */
export interface RegressionStatistics {
  /**
   * Average score difference
   */
  averageScoreDifference: number;

  /**
   * Maximum score difference
   */
  maxScoreDifference: number;

  /**
   * Standard deviation of differences
   */
  stdDevDifference: number;

  /**
   * Average execution time
   */
  averageExecutionTimeMs: number;

  /**
   * Confidence met rate
   */
  confidenceMetRate: number;

  /**
   * Tests by category
   */
  byCategory: Record<TestCategory, {
    total: number;
    passed: number;
    failed: number;
  }>;

  /**
   * Tests by priority
   */
  byPriority: Record<string, {
    total: number;
    passed: number;
    failed: number;
  }>;
}

// ============================================================================
// DRIFT DETECTION TYPES
// ============================================================================

/**
 * Drift analysis result
 */
export interface DriftAnalysisResult {
  /**
   * Analysis identifier
   */
  id: string;

  /**
   * Configuration being analyzed
   */
  configId: string;

  /**
   * Time period analyzed
   */
  period: {
    start: Date;
    end: Date;
  };

  /**
   * Overall drift score (0-100)
   */
  driftScore: number;

  /**
   * Drift severity
   */
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';

  /**
   * Whether drift exceeds threshold
   */
  exceedsThreshold: boolean;

  /**
   * Drift by dimension
   */
  dimensions: DriftDimension[];

  /**
   * Trend analysis
   */
  trend: DriftTrend;

  /**
   * Root cause analysis
   */
  rootCauses: RootCause[];

  /**
   * Recommendations
   */
  recommendations: DriftRecommendation[];

  /**
   * Analysis timestamp
   */
  analyzedAt: Date;
}

/**
 * Drift dimension
 */
export interface DriftDimension {
  /**
   * Dimension name
   */
  name: string;

  /**
   * Current value
   */
  currentValue: number;

  /**
   * Baseline value
   */
  baselineValue: number;

  /**
   * Drift amount
   */
  drift: number;

  /**
   * Drift percentage
   */
  driftPercentage: number;

  /**
   * Whether this dimension exceeds threshold
   */
  exceedsThreshold: boolean;
}

/**
 * Drift trend
 */
export interface DriftTrend {
  /**
   * Trend direction
   */
  direction: 'improving' | 'stable' | 'degrading';

  /**
   * Trend strength (0-1)
   */
  strength: number;

  /**
   * Data points analyzed
   */
  dataPoints: number;

  /**
   * Projected drift if trend continues
   */
  projectedDrift: number;

  /**
   * Days until threshold breach (if degrading)
   */
  daysUntilThreshold?: number;
}

/**
 * Root cause for drift
 */
export interface RootCause {
  /**
   * Cause type
   */
  type: 'model_update' | 'prompt_change' | 'data_shift' | 'rubric_change' | 'unknown';

  /**
   * Confidence in this cause (0-1)
   */
  confidence: number;

  /**
   * Description
   */
  description: string;

  /**
   * Evidence
   */
  evidence: string[];
}

/**
 * Drift recommendation
 */
export interface DriftRecommendation {
  /**
   * Priority
   */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Action to take
   */
  action: string;

  /**
   * Expected impact
   */
  expectedImpact: string;

  /**
   * Effort required
   */
  effort: 'minimal' | 'moderate' | 'significant';
}

// ============================================================================
// ALERT TYPES
// ============================================================================

/**
 * Drift alert
 */
export interface DriftAlert {
  /**
   * Alert identifier
   */
  id: string;

  /**
   * Alert type
   */
  type: AlertType;

  /**
   * Severity
   */
  severity: 'info' | 'warning' | 'error' | 'critical';

  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message
   */
  message: string;

  /**
   * Related configuration
   */
  configId: string;

  /**
   * Drift data
   */
  driftData: {
    score: number;
    threshold: number;
    dimensions: DriftDimension[];
  };

  /**
   * Alert status
   */
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';

  /**
   * Created timestamp
   */
  createdAt: Date;

  /**
   * Acknowledged by
   */
  acknowledgedBy?: string;

  /**
   * Acknowledged at
   */
  acknowledgedAt?: Date;

  /**
   * Resolved at
   */
  resolvedAt?: Date;

  /**
   * Resolution notes
   */
  resolutionNotes?: string;
}

/**
 * Alert types
 */
export type AlertType =
  | 'drift_threshold_exceeded'
  | 'regression_test_failed'
  | 'critical_test_failed'
  | 'confidence_degradation'
  | 'model_version_change'
  | 'prompt_change_detected';

/**
 * Alert configuration
 */
export interface AlertConfiguration {
  /**
   * Drift threshold for alerting
   */
  driftThreshold: number;

  /**
   * Regression failure threshold (percentage)
   */
  regressionFailureThreshold: number;

  /**
   * Critical test failure count threshold
   */
  criticalFailureThreshold: number;

  /**
   * Alert channels
   */
  channels: AlertChannel[];

  /**
   * Alert frequency limits
   */
  frequencyLimits: {
    maxAlertsPerHour: number;
    cooldownMinutes: number;
  };
}

/**
 * Alert channel
 */
export interface AlertChannel {
  /**
   * Channel type
   */
  type: 'email' | 'slack' | 'webhook' | 'log';

  /**
   * Channel configuration
   */
  config: Record<string, unknown>;

  /**
   * Severity filter (only send alerts >= this severity)
   */
  minSeverity: 'info' | 'warning' | 'error' | 'critical';

  /**
   * Whether channel is enabled
   */
  enabled: boolean;
}

// ============================================================================
// CONFIGURATION DEFAULTS
// ============================================================================

/**
 * Default evaluation parameters
 */
export const DEFAULT_EVALUATION_PARAMETERS: EvaluationParameters = {
  temperature: 0.3,
  maxTokens: 2000,
  dualPassThreshold: 10,
  minConfidence: 0.7,
  humanReviewThreshold: 15,
  aggregationMethod: 'weighted',
};

/**
 * Default drift thresholds
 */
export const DEFAULT_DRIFT_THRESHOLDS = {
  /**
   * Overall drift score threshold
   */
  overallDrift: 10,

  /**
   * Score difference threshold
   */
  scoreDifference: 5,

  /**
   * Confidence degradation threshold
   */
  confidenceDegradation: 0.1,

  /**
   * Regression test failure rate threshold
   */
  regressionFailureRate: 5,
};

/**
 * Default alert configuration
 */
export const DEFAULT_ALERT_CONFIGURATION: AlertConfiguration = {
  driftThreshold: 10,
  regressionFailureThreshold: 5,
  criticalFailureThreshold: 1,
  channels: [
    {
      type: 'log',
      config: {},
      minSeverity: 'info',
      enabled: true,
    },
  ],
  frequencyLimits: {
    maxAlertsPerHour: 10,
    cooldownMinutes: 15,
  },
};
