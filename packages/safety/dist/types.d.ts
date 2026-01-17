/**
 * Safety and Fairness Types
 *
 * Priority 10: Safety + Fairness Checks
 * Types for ensuring evaluation feedback avoids bias and discouraging language
 */
/**
 * Issue severity levels
 */
export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
/**
 * Issue types
 */
export type SafetyIssueType = 'discouraging_language' | 'potential_bias' | 'accessibility' | 'non_constructive' | 'inappropriate_tone' | 'cultural_insensitivity' | 'gender_bias' | 'ability_bias' | 'age_bias' | 'socioeconomic_bias';
/**
 * Safety issue
 */
export interface SafetyIssue {
    /**
     * Issue type
     */
    type: SafetyIssueType;
    /**
     * Severity level
     */
    severity: SafetySeverity;
    /**
     * Detailed description
     */
    description: string;
    /**
     * Specific details/matches
     */
    details: string[];
    /**
     * Suggested alternative or fix
     */
    suggestion?: string;
    /**
     * Location in text (character offset)
     */
    location?: {
        start: number;
        end: number;
    };
    /**
     * Confidence in this detection (0-1)
     */
    confidence: number;
}
/**
 * Safety validation result
 */
export interface SafetyResult {
    /**
     * Whether validation passed (no critical/high issues)
     */
    passed: boolean;
    /**
     * Overall safety score (0-100)
     */
    score: number;
    /**
     * Detected issues
     */
    issues: SafetyIssue[];
    /**
     * Recommendations for improvement
     */
    recommendations: SafetyRecommendation[];
    /**
     * Validation timestamp
     */
    validatedAt: Date;
    /**
     * Validation duration in ms
     */
    validationTimeMs: number;
}
/**
 * Safety recommendation
 */
export interface SafetyRecommendation {
    /**
     * Priority
     */
    priority: 'low' | 'medium' | 'high';
    /**
     * Action to take
     */
    action: string;
    /**
     * Expected impact
     */
    expectedImpact: string;
    /**
     * Related issue types
     */
    relatedIssues: SafetyIssueType[];
}
/**
 * Evaluation feedback to validate
 */
export interface EvaluationFeedback {
    /**
     * Feedback ID
     */
    id: string;
    /**
     * Main feedback text
     */
    text: string;
    /**
     * Score given
     */
    score: number;
    /**
     * Maximum possible score
     */
    maxScore: number;
    /**
     * Identified strengths
     */
    strengths?: string[];
    /**
     * Suggested improvements
     */
    improvements?: string[];
    /**
     * Additional comments
     */
    comments?: string;
    /**
     * Target audience/grade level
     */
    targetGradeLevel?: number;
    /**
     * Subject area
     */
    subject?: string;
    /**
     * Student ID (for audit purposes)
     */
    studentId?: string;
    /**
     * Evaluation timestamp
     */
    evaluatedAt?: Date;
}
/**
 * Discouraging language detection result
 */
export interface DiscouragingLanguageResult {
    /**
     * Whether discouraging language was found
     */
    found: boolean;
    /**
     * Matched discouraging phrases
     */
    matches: DiscouragingMatch[];
    /**
     * Overall score (0-100, higher is better)
     */
    score: number;
}
/**
 * Discouraging language match
 */
export interface DiscouragingMatch {
    /**
     * The matched phrase
     */
    phrase: string;
    /**
     * Category of discouraging language
     */
    category: DiscouragingCategory;
    /**
     * Severity
     */
    severity: SafetySeverity;
    /**
     * Position in text
     */
    position: {
        start: number;
        end: number;
    };
    /**
     * Suggested positive alternative
     */
    alternative: string;
}
/**
 * Categories of discouraging language
 */
export type DiscouragingCategory = 'absolute_negative' | 'personal_attack' | 'dismissive' | 'comparing_negatively' | 'hopelessness' | 'labeling' | 'sarcasm' | 'condescending';
/**
 * Bias detection result
 */
export interface BiasDetectionResult {
    /**
     * Whether bias was detected
     */
    detected: boolean;
    /**
     * Detected bias indicators
     */
    indicators: BiasIndicator[];
    /**
     * Bias risk score (0-100, lower is better)
     */
    riskScore: number;
    /**
     * Bias categories detected
     */
    categories: BiasCategory[];
}
/**
 * Bias indicator
 */
export interface BiasIndicator {
    /**
     * Type of bias
     */
    type: BiasCategory;
    /**
     * Pattern or phrase that triggered detection
     */
    trigger: string;
    /**
     * Confidence in detection (0-1)
     */
    confidence: number;
    /**
     * Explanation of why this might be biased
     */
    explanation: string;
    /**
     * Suggested neutral alternative
     */
    neutralAlternative?: string;
}
/**
 * Bias categories
 */
export type BiasCategory = 'gender' | 'racial_ethnic' | 'age' | 'disability' | 'socioeconomic' | 'religious' | 'cultural' | 'linguistic' | 'educational_background' | 'neurodiversity';
/**
 * Accessibility check result
 */
export interface AccessibilityResult {
    /**
     * Whether accessibility requirements are met
     */
    passed: boolean;
    /**
     * Readability score (0-100)
     */
    readabilityScore: number;
    /**
     * Estimated reading grade level
     */
    gradeLevel: number;
    /**
     * Accessibility issues
     */
    issues: AccessibilityIssue[];
    /**
     * Text statistics
     */
    statistics: TextStatistics;
}
/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
    /**
     * Issue type
     */
    type: AccessibilityIssueType;
    /**
     * Description
     */
    description: string;
    /**
     * Severity
     */
    severity: SafetySeverity;
    /**
     * Suggestion for improvement
     */
    suggestion: string;
}
/**
 * Accessibility issue types
 */
export type AccessibilityIssueType = 'reading_level_too_high' | 'sentence_too_long' | 'complex_vocabulary' | 'passive_voice_overuse' | 'jargon_without_explanation' | 'ambiguous_pronouns' | 'dense_paragraphs' | 'missing_structure';
/**
 * Text statistics
 */
export interface TextStatistics {
    /**
     * Total word count
     */
    wordCount: number;
    /**
     * Sentence count
     */
    sentenceCount: number;
    /**
     * Average sentence length
     */
    averageSentenceLength: number;
    /**
     * Average word length (in syllables)
     */
    averageWordSyllables: number;
    /**
     * Percentage of complex words (3+ syllables)
     */
    complexWordPercentage: number;
    /**
     * Passive voice percentage
     */
    passiveVoicePercentage: number;
}
/**
 * Constructive framing check result
 */
export interface ConstructiveFramingResult {
    /**
     * Whether feedback is constructively framed
     */
    passed: boolean;
    /**
     * Constructiveness score (0-100)
     */
    score: number;
    /**
     * Issues with framing
     */
    issues: FramingIssue[];
    /**
     * Positive elements found
     */
    positiveElements: PositiveElement[];
    /**
     * Growth mindset indicators
     */
    growthMindsetScore: number;
}
/**
 * Framing issue
 */
export interface FramingIssue {
    /**
     * Issue type
     */
    type: FramingIssueType;
    /**
     * Description
     */
    description: string;
    /**
     * The problematic text
     */
    text: string;
    /**
     * Suggested reframing
     */
    suggestion: string;
}
/**
 * Framing issue types
 */
export type FramingIssueType = 'missing_positives' | 'criticism_without_guidance' | 'fixed_mindset_language' | 'no_next_steps' | 'vague_feedback' | 'unbalanced_criticism' | 'missing_encouragement';
/**
 * Positive element in feedback
 */
export interface PositiveElement {
    /**
     * Type of positive element
     */
    type: 'strength' | 'encouragement' | 'progress' | 'specific_praise' | 'growth_acknowledgment';
    /**
     * The positive text
     */
    text: string;
    /**
     * Position in feedback
     */
    position: number;
}
/**
 * Fairness audit configuration
 */
export interface FairnessAuditConfig {
    /**
     * Minimum sample size for analysis
     */
    minSampleSize?: number;
    /**
     * Statistical significance threshold
     */
    significanceThreshold?: number;
    /**
     * Disparity threshold
     */
    disparityThreshold?: number;
    /**
     * Whether to check score distribution
     */
    checkScoreDistribution?: boolean;
    /**
     * Whether to check feedback sentiment
     */
    checkFeedbackSentiment?: boolean;
    /**
     * Whether to check issue patterns
     */
    checkIssuePatterns?: boolean;
}
/**
 * Group statistics for demographic analysis
 */
export interface GroupStatistics {
    /**
     * Group name/identifier
     */
    groupName: string;
    /**
     * Sample size
     */
    sampleSize: number;
    /**
     * Average score
     */
    averageScore: number;
    /**
     * Score standard deviation
     */
    scoreStandardDeviation: number;
    /**
     * Average safety score
     */
    averageSafetyScore: number;
    /**
     * Issue rate
     */
    issueRate: number;
    /**
     * Pass rate
     */
    passRate: number;
}
/**
 * Demographic analysis result
 */
export interface DemographicAnalysis {
    /**
     * Dimension analyzed
     */
    dimension: string;
    /**
     * Groups in this dimension
     */
    groups: GroupStatistics[];
    /**
     * Disparity measure
     */
    disparity: number;
    /**
     * Whether disparity is significant
     */
    isSignificant: boolean;
}
/**
 * Fairness recommendation from audit
 */
export interface FairnessRecommendation {
    /**
     * Priority level
     */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /**
     * Category
     */
    category: string;
    /**
     * Description of the issue
     */
    description: string;
    /**
     * Recommended action
     */
    action: string;
    /**
     * Expected impact
     */
    expectedImpact: string;
    /**
     * Affected dimensions
     */
    affectedDimensions?: string[];
}
/**
 * Fairness audit report
 */
export interface FairnessAuditReport {
    /**
     * Whether the audit passed
     */
    passed: boolean;
    /**
     * Overall fairness score (0-100)
     */
    fairnessScore: number;
    /**
     * Number of evaluations analyzed
     */
    evaluationsAnalyzed: number;
    /**
     * Demographic analysis results
     */
    demographicAnalysis: DemographicAnalysis[];
    /**
     * Score distribution analysis
     */
    scoreDistribution?: {
        overall: {
            mean: number;
            median: number;
            stdDev: number;
            skewness: number;
        };
        byGroup: Map<string, {
            mean: number;
            median: number;
            stdDev: number;
        }>;
    };
    /**
     * Sentiment analysis results
     */
    sentimentAnalysis?: {
        overallPositivityRate: number;
        byGroup: Map<string, number>;
        disparities: Array<{
            dimension: string;
            disparity: number;
        }>;
    };
    /**
     * Issue pattern analysis
     */
    issuePatterns?: {
        totalIssues: number;
        issuesByType: Map<string, number>;
        issuesBySeverity: Map<string, number>;
        mostCommonIssues: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
    };
    /**
     * Overall statistics
     */
    overallStatistics: {
        totalEvaluations: number;
        averageScore: number;
        averageSafetyScore: number;
        passRate: number;
        safetyPassRate: number;
        issuesPerEvaluation: number;
    };
    /**
     * Recommendations
     */
    recommendations: FairnessRecommendation[];
    /**
     * Audit timestamp
     */
    auditedAt: Date;
    /**
     * Audit duration in milliseconds
     */
    auditDurationMs: number;
}
/**
 * Score distribution analysis
 */
export interface ScoreDistributionAnalysis {
    /**
     * Mean score
     */
    mean: number;
    /**
     * Median score
     */
    median: number;
    /**
     * Standard deviation
     */
    standardDeviation: number;
    /**
     * Score distribution by quartile
     */
    quartiles: {
        q1: number;
        q2: number;
        q3: number;
        q4: number;
    };
    /**
     * Skewness indicator
     */
    skewness: 'left' | 'normal' | 'right';
}
/**
 * Sentiment analysis
 */
export interface SentimentAnalysis {
    /**
     * Average sentiment score (-1 to 1)
     */
    averageSentiment: number;
    /**
     * Sentiment distribution
     */
    distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    /**
     * Common positive phrases
     */
    positivePatterns: string[];
    /**
     * Common negative phrases
     */
    negativePatterns: string[];
}
/**
 * Detected disparity
 */
export interface Disparity {
    /**
     * Dimension of disparity
     */
    dimension: string;
    /**
     * Groups compared
     */
    groups: string[];
    /**
     * Statistical measure
     */
    measure: 'mean_difference' | 'variance_ratio' | 'effect_size';
    /**
     * Value
     */
    value: number;
    /**
     * Whether statistically significant
     */
    significant: boolean;
    /**
     * Description
     */
    description: string;
}
/**
 * Audit recommendation
 */
export interface AuditRecommendation {
    /**
     * Priority
     */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /**
     * Category
     */
    category: 'training' | 'prompt' | 'rubric' | 'process' | 'monitoring';
    /**
     * Recommendation
     */
    action: string;
    /**
     * Expected outcome
     */
    expectedOutcome: string;
    /**
     * Effort required
     */
    effort: 'minimal' | 'moderate' | 'significant';
}
/**
 * Fairness validator configuration
 */
export interface FairnessValidatorConfig {
    /**
     * Minimum passing score (0-100)
     */
    minPassingScore?: number;
    /**
     * Whether to check for discouraging language
     */
    checkDiscouragingLanguage?: boolean;
    /**
     * Whether to check for bias
     */
    checkBias?: boolean;
    /**
     * Whether to check accessibility
     */
    checkAccessibility?: boolean;
    /**
     * Whether to check constructive framing
     */
    checkConstructiveFraming?: boolean;
    /**
     * Target reading grade level
     */
    targetGradeLevel?: number;
    /**
     * Maximum allowed reading level
     */
    maxReadingLevel?: number;
    /**
     * Custom discouraging phrases to check
     */
    customDiscouragingPhrases?: string[];
    /**
     * Custom bias patterns to check
     */
    customBiasPatterns?: RegExp[];
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Logger interface
 */
export interface SafetyLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/**
 * Default fairness validator configuration
 */
export declare const DEFAULT_FAIRNESS_CONFIG: Required<Omit<FairnessValidatorConfig, 'logger' | 'customDiscouragingPhrases' | 'customBiasPatterns'>>;
/**
 * Severity weights for scoring
 */
export declare const SEVERITY_WEIGHTS: Record<SafetySeverity, number>;
//# sourceMappingURL=types.d.ts.map