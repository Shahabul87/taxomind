/**
 * Calibration System Types
 *
 * Priority 6: Add Calibration Loop
 * Types for continuous improvement through human feedback
 */

// ============================================================================
// EVALUATION SAMPLE TYPES
// ============================================================================

/**
 * A single evaluation sample for calibration
 */
export interface CalibrationSample {
  /**
   * Unique sample identifier
   */
  id: string;

  /**
   * Related evaluation ID
   */
  evaluationId: string;

  /**
   * AI-generated score (0-100)
   */
  aiScore: number;

  /**
   * Human-reviewed score (0-100), if available
   */
  humanScore?: number;

  /**
   * AI-generated feedback
   */
  aiFeedback: string;

  /**
   * Human-reviewed feedback adjustments
   */
  humanFeedback?: string;

  /**
   * Reason for human adjustment (if any)
   */
  adjustmentReason?: string;

  /**
   * Evaluation context
   */
  context: EvaluationContext;

  /**
   * Timestamp of the original evaluation
   */
  evaluatedAt: Date;

  /**
   * Timestamp of human review (if reviewed)
   */
  reviewedAt?: Date;

  /**
   * Reviewer ID (if reviewed)
   */
  reviewerId?: string;

  /**
   * Model and prompt version info
   */
  versionInfo: VersionInfo;

  /**
   * Tags for categorization
   */
  tags?: string[];
}

/**
 * Context of the evaluation
 */
export interface EvaluationContext {
  /**
   * Type of content being evaluated
   */
  contentType: 'essay' | 'code' | 'short_answer' | 'multiple_choice' | 'project';

  /**
   * Subject area
   */
  subject?: string;

  /**
   * Topic being evaluated
   */
  topic?: string;

  /**
   * Target Bloom's level
   */
  bloomsLevel?: string;

  /**
   * Difficulty level
   */
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /**
   * Maximum points possible
   */
  maxPoints: number;

  /**
   * Rubric used (if any)
   */
  rubricId?: string;

  /**
   * Course ID (if applicable)
   */
  courseId?: string;

  /**
   * Assignment ID (if applicable)
   */
  assignmentId?: string;
}

/**
 * Version information for traceability
 */
export interface VersionInfo {
  /**
   * AI model ID used
   */
  modelId: string;

  /**
   * Prompt version
   */
  promptVersion: string;

  /**
   * Rubric version (if applicable)
   */
  rubricVersion?: string;

  /**
   * Calibration config version
   */
  configVersion: string;
}

// ============================================================================
// HUMAN REVIEW TYPES
// ============================================================================

/**
 * Human review submission
 */
export interface HumanReview {
  /**
   * Evaluation ID being reviewed
   */
  evaluationId: string;

  /**
   * Reviewer's corrected score
   */
  score: number;

  /**
   * Reviewer's feedback adjustments
   */
  feedback?: string;

  /**
   * Reason for adjustment
   */
  reason: AdjustmentReason;

  /**
   * Detailed explanation (optional)
   */
  explanation?: string;

  /**
   * Confidence in the adjustment (0-1)
   */
  confidence: number;

  /**
   * Reviewer ID
   */
  reviewerId: string;

  /**
   * Time taken to review (seconds)
   */
  reviewTimeSeconds?: number;
}

/**
 * Reasons for human adjustment
 */
export type AdjustmentReason =
  | 'AI_TOO_LENIENT'      // AI scored too high
  | 'AI_TOO_STRICT'       // AI scored too low
  | 'MISUNDERSTOOD_RUBRIC' // AI didn't follow rubric correctly
  | 'CONTEXT_MISSING'     // AI lacked context to evaluate properly
  | 'TECHNICAL_ERROR'     // AI made a factual/technical error
  | 'FEEDBACK_QUALITY'    // Score OK, but feedback needs improvement
  | 'BIAS_DETECTED'       // Potential bias in evaluation
  | 'OTHER';              // Other reason

// ============================================================================
// DRIFT ANALYSIS TYPES
// ============================================================================

/**
 * Result of drift analysis
 */
export interface DriftAnalysis {
  /**
   * Correlation between AI and human scores (0-1)
   */
  correlation: number;

  /**
   * Mean absolute drift (average difference)
   */
  meanDrift: number;

  /**
   * Standard deviation of drift
   */
  standardDeviation: number;

  /**
   * Whether drift exceeds threshold
   */
  driftExceedsThreshold: boolean;

  /**
   * Number of samples analyzed
   */
  samplesAnalyzed: number;

  /**
   * Analysis period
   */
  periodStart: Date;
  periodEnd: Date;

  /**
   * Breakdown by content type
   */
  byContentType: Record<string, ContentTypeDrift>;

  /**
   * Breakdown by subject
   */
  bySubject: Record<string, number>;

  /**
   * Most common adjustment reasons
   */
  topAdjustmentReasons: AdjustmentReasonCount[];

  /**
   * Trend direction
   */
  trend: 'improving' | 'stable' | 'worsening';

  /**
   * Recommendations for improvement
   */
  recommendations: DriftRecommendation[];
}

/**
 * Drift metrics for a specific content type
 */
export interface ContentTypeDrift {
  /**
   * Content type
   */
  contentType: string;

  /**
   * Mean drift for this type
   */
  meanDrift: number;

  /**
   * Sample count
   */
  sampleCount: number;

  /**
   * Correlation
   */
  correlation: number;
}

/**
 * Count of adjustment reasons
 */
export interface AdjustmentReasonCount {
  /**
   * The reason
   */
  reason: AdjustmentReason;

  /**
   * Count of occurrences
   */
  count: number;

  /**
   * Percentage of total adjustments
   */
  percentage: number;
}

/**
 * Recommendation for addressing drift
 */
export interface DriftRecommendation {
  /**
   * Priority level
   */
  priority: 'high' | 'medium' | 'low';

  /**
   * Category of recommendation
   */
  category: 'prompt' | 'rubric' | 'model' | 'training' | 'threshold';

  /**
   * Specific recommendation
   */
  recommendation: string;

  /**
   * Expected impact if implemented
   */
  expectedImpact: string;

  /**
   * Related context (content type, subject, etc.)
   */
  context?: Record<string, string>;
}

// ============================================================================
// CALIBRATION RESULT TYPES
// ============================================================================

/**
 * Result of a calibration run
 */
export interface CalibrationResult {
  /**
   * Whether calibration was performed
   */
  calibrated: boolean;

  /**
   * Calibration ID
   */
  calibrationId: string;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Drift analysis before calibration
   */
  preDriftAnalysis: DriftAnalysis;

  /**
   * Adjustments made
   */
  adjustments: CalibrationAdjustment[];

  /**
   * Alerts generated
   */
  alerts: CalibrationAlert[];

  /**
   * Next scheduled calibration
   */
  nextCalibration: Date;

  /**
   * Summary of actions taken
   */
  summary: string;
}

/**
 * A specific adjustment made during calibration
 */
export interface CalibrationAdjustment {
  /**
   * Type of adjustment
   */
  type: 'threshold' | 'weight' | 'prompt' | 'rubric_guidance';

  /**
   * What was adjusted
   */
  target: string;

  /**
   * Previous value
   */
  previousValue: string | number;

  /**
   * New value
   */
  newValue: string | number;

  /**
   * Reason for adjustment
   */
  reason: string;

  /**
   * Expected impact
   */
  expectedImpact: string;
}

/**
 * Alert generated during calibration
 */
export interface CalibrationAlert {
  /**
   * Severity level
   */
  severity: 'info' | 'warning' | 'critical';

  /**
   * Alert type
   */
  type: 'drift_threshold' | 'sample_shortage' | 'correlation_drop' | 'bias_detected';

  /**
   * Alert message
   */
  message: string;

  /**
   * Recommended action
   */
  action: string;

  /**
   * Related data
   */
  data?: Record<string, unknown>;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for the calibration system
 */
export interface CalibrationConfig {
  /**
   * Drift threshold that triggers alerts (0-1, default 0.15 = 15%)
   */
  driftThreshold?: number;

  /**
   * Minimum samples required for analysis
   */
  minSamplesForAnalysis?: number;

  /**
   * Days to include in analysis window
   */
  analysisWindowDays?: number;

  /**
   * Target correlation coefficient
   */
  targetCorrelation?: number;

  /**
   * Whether to auto-apply adjustments
   */
  autoApplyAdjustments?: boolean;

  /**
   * Maximum auto-adjustment magnitude
   */
  maxAutoAdjustment?: number;

  /**
   * Calibration frequency in hours
   */
  calibrationFrequencyHours?: number;

  /**
   * Sample selection strategy
   */
  sampleSelectionStrategy?: 'random' | 'stratified' | 'worst_performers';

  /**
   * Number of samples per calibration run
   */
  samplesPerRun?: number;

  /**
   * Alert notification settings
   */
  alertSettings?: AlertSettings;
}

/**
 * Alert notification settings
 */
export interface AlertSettings {
  /**
   * Whether to send email alerts
   */
  emailEnabled?: boolean;

  /**
   * Email recipients
   */
  emailRecipients?: string[];

  /**
   * Whether to send Slack alerts
   */
  slackEnabled?: boolean;

  /**
   * Slack webhook URL
   */
  slackWebhook?: string;

  /**
   * Minimum severity for notification
   */
  minSeverity?: 'info' | 'warning' | 'critical';
}

/**
 * Default calibration configuration
 */
export const DEFAULT_CALIBRATION_CONFIG: Required<
  Omit<CalibrationConfig, 'alertSettings'>
> = {
  driftThreshold: 0.15,
  minSamplesForAnalysis: 30,
  analysisWindowDays: 30,
  targetCorrelation: 0.85,
  autoApplyAdjustments: false,
  maxAutoAdjustment: 0.1,
  calibrationFrequencyHours: 168, // Weekly
  sampleSelectionStrategy: 'stratified',
  samplesPerRun: 100,
};

// ============================================================================
// CALIBRATION LOOP INTERFACE
// ============================================================================

/**
 * Interface for calibration loop implementations
 */
export interface CalibrationLoop {
  /**
   * Collect an evaluation sample
   */
  collectSample(
    evaluation: EvaluationSampleInput,
    humanReview?: HumanReview
  ): Promise<CalibrationSample>;

  /**
   * Analyze drift between AI and human ratings
   */
  analyzeDrift(options?: DriftAnalysisOptions): Promise<DriftAnalysis>;

  /**
   * Run calibration process
   */
  calibrate(): Promise<CalibrationResult>;

  /**
   * Get calibration status
   */
  getStatus(): Promise<CalibrationStatus>;
}

/**
 * Input for creating a calibration sample
 */
export interface EvaluationSampleInput {
  /**
   * Evaluation ID
   */
  evaluationId: string;

  /**
   * AI score
   */
  aiScore: number;

  /**
   * AI feedback
   */
  aiFeedback: string;

  /**
   * Evaluation context
   */
  context: EvaluationContext;

  /**
   * Version info
   */
  versionInfo: VersionInfo;

  /**
   * Optional tags
   */
  tags?: string[];
}

/**
 * Options for drift analysis
 */
export interface DriftAnalysisOptions {
  /**
   * Start date for analysis
   */
  startDate?: Date;

  /**
   * End date for analysis
   */
  endDate?: Date;

  /**
   * Filter by content type
   */
  contentType?: string;

  /**
   * Filter by subject
   */
  subject?: string;

  /**
   * Minimum sample count
   */
  minSamples?: number;
}

/**
 * Current calibration status
 */
export interface CalibrationStatus {
  /**
   * Whether calibration is enabled
   */
  enabled: boolean;

  /**
   * Last calibration result
   */
  lastCalibration?: CalibrationResult;

  /**
   * Next scheduled calibration
   */
  nextCalibration: Date;

  /**
   * Current drift level
   */
  currentDrift: number;

  /**
   * Total samples collected
   */
  totalSamples: number;

  /**
   * Samples with human review
   */
  reviewedSamples: number;

  /**
   * Pending reviews count
   */
  pendingReviews: number;

  /**
   * Health status
   */
  health: 'healthy' | 'needs_attention' | 'critical';

  /**
   * Active alerts
   */
  activeAlerts: CalibrationAlert[];
}

// ============================================================================
// SAMPLE STORE INTERFACE
// ============================================================================

/**
 * Interface for calibration sample storage
 */
export interface CalibrationSampleStore {
  /**
   * Save a calibration sample
   */
  save(sample: CalibrationSample): Promise<void>;

  /**
   * Get a sample by ID
   */
  get(id: string): Promise<CalibrationSample | null>;

  /**
   * Get samples with human review
   */
  getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]>;

  /**
   * Get samples pending human review
   */
  getPendingReview(limit: number): Promise<CalibrationSample[]>;

  /**
   * Get samples by date range
   */
  getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]>;

  /**
   * Get samples by content type
   */
  getByContentType(contentType: string, limit: number): Promise<CalibrationSample[]>;

  /**
   * Update a sample with human review
   */
  updateWithReview(id: string, review: HumanReview): Promise<CalibrationSample>;

  /**
   * Get sample statistics
   */
  getStatistics(): Promise<SampleStatistics>;

  /**
   * Delete old samples
   */
  pruneOldSamples(olderThanDays: number): Promise<number>;
}

/**
 * Sample statistics
 */
export interface SampleStatistics {
  /**
   * Total samples
   */
  totalSamples: number;

  /**
   * Samples with human review
   */
  reviewedSamples: number;

  /**
   * Average AI score
   */
  averageAiScore: number;

  /**
   * Average human score (where available)
   */
  averageHumanScore?: number;

  /**
   * Average drift (where human review exists)
   */
  averageDrift?: number;

  /**
   * Samples by content type
   */
  byContentType: Record<string, number>;

  /**
   * Samples by subject
   */
  bySubject: Record<string, number>;

  /**
   * Oldest sample date
   */
  oldestSample?: Date;

  /**
   * Newest sample date
   */
  newestSample?: Date;
}
