/**
 * Safety and Fairness Types
 *
 * Priority 10: Safety + Fairness Checks
 * Types for ensuring evaluation feedback avoids bias and discouraging language
 */
/**
 * Issue severity levels
 */
type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
/**
 * Issue types
 */
type SafetyIssueType = 'discouraging_language' | 'potential_bias' | 'accessibility' | 'non_constructive' | 'inappropriate_tone' | 'cultural_insensitivity' | 'gender_bias' | 'ability_bias' | 'age_bias' | 'socioeconomic_bias';
/**
 * Safety issue
 */
interface SafetyIssue {
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
interface SafetyResult {
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
interface SafetyRecommendation {
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
interface EvaluationFeedback {
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
interface DiscouragingLanguageResult {
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
interface DiscouragingMatch {
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
type DiscouragingCategory = 'absolute_negative' | 'personal_attack' | 'dismissive' | 'comparing_negatively' | 'hopelessness' | 'labeling' | 'sarcasm' | 'condescending';
/**
 * Bias detection result
 */
interface BiasDetectionResult {
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
interface BiasIndicator {
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
type BiasCategory = 'gender' | 'racial_ethnic' | 'age' | 'disability' | 'socioeconomic' | 'religious' | 'cultural' | 'linguistic' | 'educational_background' | 'neurodiversity';
/**
 * Accessibility check result
 */
interface AccessibilityResult {
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
interface AccessibilityIssue {
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
type AccessibilityIssueType = 'reading_level_too_high' | 'sentence_too_long' | 'complex_vocabulary' | 'passive_voice_overuse' | 'jargon_without_explanation' | 'ambiguous_pronouns' | 'dense_paragraphs' | 'missing_structure';
/**
 * Text statistics
 */
interface TextStatistics {
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
interface ConstructiveFramingResult {
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
interface FramingIssue {
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
type FramingIssueType = 'missing_positives' | 'criticism_without_guidance' | 'fixed_mindset_language' | 'no_next_steps' | 'vague_feedback' | 'unbalanced_criticism' | 'missing_encouragement';
/**
 * Positive element in feedback
 */
interface PositiveElement {
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
interface FairnessAuditConfig {
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
interface GroupStatistics {
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
interface DemographicAnalysis {
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
interface FairnessRecommendation {
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
interface FairnessAuditReport {
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
 * Fairness validator configuration
 */
interface FairnessValidatorConfig {
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
interface SafetyLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/**
 * Default fairness validator configuration
 */
declare const DEFAULT_FAIRNESS_CONFIG: Required<Omit<FairnessValidatorConfig, 'logger' | 'customDiscouragingPhrases' | 'customBiasPatterns'>>;
/**
 * Severity weights for scoring
 */
declare const SEVERITY_WEIGHTS: Record<SafetySeverity, number>;

/**
 * Discouraging Language Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects discouraging, demotivating, or harmful language in feedback
 */

/**
 * Pattern definition for discouraging language
 */
interface DiscouragingPattern {
    pattern: RegExp;
    category: DiscouragingCategory;
    severity: SafetySeverity;
    alternative: string;
}
/**
 * Discouraging language detector configuration
 */
interface DiscouragingLanguageDetectorConfig {
    /**
     * Additional custom patterns
     */
    customPatterns?: DiscouragingPattern[];
    /**
     * Additional custom phrases (converted to patterns)
     */
    customPhrases?: string[];
    /**
     * Minimum severity to report
     */
    minSeverity?: SafetySeverity;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Discouraging Language Detector
 * Identifies discouraging, demotivating, or harmful language in feedback
 */
declare class DiscouragingLanguageDetector {
    private readonly patterns;
    private readonly minSeverity;
    private readonly logger?;
    constructor(config?: DiscouragingLanguageDetectorConfig);
    /**
     * Detect discouraging language in text
     */
    detect(text: string): DiscouragingLanguageResult;
    /**
     * Get suggested positive alternatives for matches
     */
    suggestAlternatives(matches: DiscouragingMatch[]): Map<string, string>;
    /**
     * Rewrite text with positive alternatives
     */
    rewriteWithAlternatives(text: string, matches: DiscouragingMatch[]): string;
    /**
     * Remove duplicate/overlapping matches
     */
    private deduplicateMatches;
    /**
     * Calculate score based on matches (higher is better)
     */
    private calculateScore;
    /**
     * Escape special regex characters
     */
    private escapeRegex;
    /**
     * Get pattern count
     */
    getPatternCount(): number;
}
/**
 * Create discouraging language detector
 */
declare function createDiscouragingLanguageDetector(config?: DiscouragingLanguageDetectorConfig): DiscouragingLanguageDetector;
/**
 * Create strict detector (reports all severities)
 */
declare function createStrictDiscouragingDetector(config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>): DiscouragingLanguageDetector;
/**
 * Create lenient detector (only high/critical)
 */
declare function createLenientDiscouragingDetector(config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>): DiscouragingLanguageDetector;

/**
 * Bias Pattern Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects potential bias patterns in evaluation feedback
 */

/**
 * Bias pattern definition
 */
interface BiasPattern {
    pattern: RegExp;
    category: BiasCategory;
    confidence: number;
    explanation: string;
    neutralAlternative: string;
}
/**
 * Bias detector configuration
 */
interface BiasDetectorConfig {
    /**
     * Additional custom patterns
     */
    customPatterns?: BiasPattern[];
    /**
     * Minimum confidence threshold (0-1)
     */
    minConfidence?: number;
    /**
     * Categories to check (if not specified, all are checked)
     */
    categoriesToCheck?: BiasCategory[];
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Bias Pattern Detector
 * Identifies potential bias in evaluation feedback
 */
declare class BiasDetector {
    private readonly patterns;
    private readonly minConfidence;
    private readonly categoriesToCheck?;
    private readonly logger?;
    constructor(config?: BiasDetectorConfig);
    /**
     * Detect bias patterns in text
     */
    detect(text: string): BiasDetectionResult;
    /**
     * Get suggestions for neutralizing biased text
     */
    getSuggestions(indicators: BiasIndicator[]): Map<string, string>;
    /**
     * Check if specific category has potential bias
     */
    hasCategory(text: string, category: BiasCategory): boolean;
    /**
     * Get indicators by category
     */
    getIndicatorsByCategory(indicators: BiasIndicator[]): Map<BiasCategory, BiasIndicator[]>;
    /**
     * Calculate risk score (0-100, lower is better)
     */
    private calculateRiskScore;
    /**
     * Get pattern count
     */
    getPatternCount(): number;
    /**
     * Get supported categories
     */
    getSupportedCategories(): BiasCategory[];
}
/**
 * Create bias detector
 */
declare function createBiasDetector(config?: BiasDetectorConfig): BiasDetector;
/**
 * Create strict bias detector (low confidence threshold)
 */
declare function createStrictBiasDetector(config?: Omit<BiasDetectorConfig, 'minConfidence'>): BiasDetector;
/**
 * Create lenient bias detector (high confidence threshold)
 */
declare function createLenientBiasDetector(config?: Omit<BiasDetectorConfig, 'minConfidence'>): BiasDetector;
/**
 * Create bias detector for specific categories
 */
declare function createCategoryBiasDetector(categories: BiasCategory[], config?: Omit<BiasDetectorConfig, 'categoriesToCheck'>): BiasDetector;

/**
 * Accessibility Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Checks readability and accessibility of evaluation feedback
 */

/**
 * Accessibility checker configuration
 */
interface AccessibilityCheckerConfig {
    /**
     * Target reading grade level
     */
    targetGradeLevel?: number;
    /**
     * Maximum acceptable reading grade level
     */
    maxGradeLevel?: number;
    /**
     * Maximum sentence length (words)
     */
    maxSentenceLength?: number;
    /**
     * Maximum passive voice percentage
     */
    maxPassiveVoicePercentage?: number;
    /**
     * Maximum complex word percentage
     */
    maxComplexWordPercentage?: number;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Default configuration
 */
declare const DEFAULT_ACCESSIBILITY_CONFIG: Required<Omit<AccessibilityCheckerConfig, 'logger'>>;
/**
 * Accessibility Checker
 * Evaluates readability and accessibility of text
 */
declare class AccessibilityChecker {
    private readonly config;
    private readonly logger?;
    constructor(config?: AccessibilityCheckerConfig);
    /**
     * Check text accessibility
     */
    check(text: string, targetAudience?: number): AccessibilityResult;
    /**
     * Calculate text statistics
     */
    private calculateStatistics;
    /**
     * Identify accessibility issues
     */
    private identifyIssues;
    /**
     * Detect potentially ambiguous pronoun usage
     */
    private detectAmbiguousPronouns;
    /**
     * Get improvement suggestions
     */
    getSuggestions(result: AccessibilityResult): string[];
}
/**
 * Create accessibility checker
 */
declare function createAccessibilityChecker(config?: AccessibilityCheckerConfig): AccessibilityChecker;
/**
 * Create accessibility checker for elementary level
 */
declare function createElementaryAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;
/**
 * Create accessibility checker for high school level
 */
declare function createHighSchoolAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;
/**
 * Create accessibility checker for college level
 */
declare function createCollegeAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;

/**
 * Constructive Framing Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Ensures feedback is constructively framed with growth mindset language
 */

/**
 * Constructive framing checker configuration
 */
interface ConstructiveFramingCheckerConfig {
    /**
     * Minimum required positive elements
     */
    minPositiveElements?: number;
    /**
     * Whether to require actionable suggestions
     */
    requireActionableSuggestions?: boolean;
    /**
     * Minimum constructiveness score (0-100)
     */
    minConstructivenessScore?: number;
    /**
     * Minimum growth mindset score (0-100)
     */
    minGrowthMindsetScore?: number;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Default configuration
 */
declare const DEFAULT_CONSTRUCTIVE_CONFIG: Required<Omit<ConstructiveFramingCheckerConfig, 'logger'>>;
/**
 * Constructive Framing Checker
 * Ensures feedback uses growth mindset language and constructive framing
 */
declare class ConstructiveFramingChecker {
    private readonly config;
    private readonly logger?;
    constructor(config?: ConstructiveFramingCheckerConfig);
    /**
     * Check feedback for constructive framing
     */
    check(feedback: EvaluationFeedback): ConstructiveFramingResult;
    /**
     * Combine all text from feedback
     */
    private combineText;
    /**
     * Find positive elements in text
     */
    private findPositiveElements;
    /**
     * Check for fixed mindset language
     */
    private checkFixedMindsetLanguage;
    /**
     * Check for vague feedback
     */
    private checkVagueFeedback;
    /**
     * Check if text has actionable suggestions
     */
    private hasActionableSuggestions;
    /**
     * Check if text has encouragement
     */
    private hasEncouragement;
    /**
     * Check balance of criticism vs positives
     */
    private checkCriticismBalance;
    /**
     * Calculate constructiveness score
     */
    private calculateConstructivenessScore;
    /**
     * Calculate growth mindset score
     */
    private calculateGrowthMindsetScore;
    /**
     * Remove duplicate elements
     */
    private deduplicateElements;
    /**
     * Get improvement suggestions
     */
    getSuggestions(result: ConstructiveFramingResult): string[];
}
/**
 * Create constructive framing checker
 */
declare function createConstructiveFramingChecker(config?: ConstructiveFramingCheckerConfig): ConstructiveFramingChecker;
/**
 * Create strict constructive framing checker
 */
declare function createStrictConstructiveChecker(config?: Omit<ConstructiveFramingCheckerConfig, 'minPositiveElements' | 'minConstructivenessScore'>): ConstructiveFramingChecker;
/**
 * Create lenient constructive framing checker
 */
declare function createLenientConstructiveChecker(config?: Omit<ConstructiveFramingCheckerConfig, 'minPositiveElements' | 'requireActionableSuggestions'>): ConstructiveFramingChecker;

/**
 * Fairness Safety Validator
 *
 * Priority 10: Safety + Fairness Checks
 * Main integration that combines all safety checks
 */

/**
 * Full validator configuration
 */
interface FullFairnessValidatorConfig extends FairnessValidatorConfig {
    /**
     * Discouraging language detector config
     */
    discouragingConfig?: DiscouragingLanguageDetectorConfig;
    /**
     * Bias detector config
     */
    biasConfig?: BiasDetectorConfig;
    /**
     * Accessibility checker config
     */
    accessibilityConfig?: AccessibilityCheckerConfig;
    /**
     * Constructive framing checker config
     */
    constructiveConfig?: ConstructiveFramingCheckerConfig;
}
/**
 * Fairness Safety Validator
 * Comprehensive safety validation for evaluation feedback
 */
declare class FairnessSafetyValidator {
    private readonly config;
    private readonly logger?;
    private readonly discouragingDetector;
    private readonly biasDetector;
    private readonly accessibilityChecker;
    private readonly constructiveChecker;
    constructor(config?: FullFairnessValidatorConfig);
    /**
     * Validate feedback for safety and fairness
     */
    validateFeedback(feedback: EvaluationFeedback): Promise<SafetyResult>;
    /**
     * Quick validation (only critical checks)
     */
    quickValidate(feedback: EvaluationFeedback): Promise<{
        passed: boolean;
        criticalIssues: SafetyIssue[];
    }>;
    /**
     * Suggest improvements for feedback
     */
    suggestImprovements(feedback: EvaluationFeedback): string[];
    /**
     * Rewrite feedback with suggested improvements
     */
    rewriteFeedback(feedback: EvaluationFeedback): EvaluationFeedback;
    /**
     * Get detailed analysis
     */
    getDetailedAnalysis(feedback: EvaluationFeedback): {
        discouraging: ReturnType<DiscouragingLanguageDetector['detect']>;
        bias: ReturnType<BiasDetector['detect']>;
        accessibility: ReturnType<AccessibilityChecker['check']>;
        constructive: ReturnType<ConstructiveFramingChecker['check']>;
    };
    /**
     * Combine all text from feedback
     */
    private combineText;
    /**
     * Calculate overall safety score
     */
    private calculateOverallScore;
    /**
     * Generate recommendations based on issues
     */
    private generateRecommendations;
}
/**
 * Create fairness safety validator
 */
declare function createFairnessSafetyValidator(config?: FullFairnessValidatorConfig): FairnessSafetyValidator;
/**
 * Create strict validator (all checks enabled, low tolerance)
 */
declare function createStrictFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Create lenient validator (essential checks only)
 */
declare function createLenientFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Create quick validator (bias and discouraging only)
 */
declare function createQuickFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Get default validator instance
 */
declare function getDefaultFairnessValidator(): FairnessSafetyValidator;
/**
 * Reset default validator (for testing)
 */
declare function resetDefaultFairnessValidator(): void;

/**
 * Fairness Auditor
 *
 * Priority 10: Safety + Fairness Checks
 * Performs periodic fairness audits across multiple evaluations
 */

/**
 * Full auditor configuration
 */
interface FullFairnessAuditorConfig extends FairnessAuditConfig {
    /**
     * Validator configuration
     */
    validatorConfig?: FullFairnessValidatorConfig;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Default audit configuration
 */
declare const DEFAULT_AUDIT_CONFIG: Required<Omit<FairnessAuditConfig, 'logger'>>;
/**
 * Evaluation with optional demographic information
 */
interface EvaluationWithDemographics extends EvaluationFeedback {
    /**
     * Optional demographic group identifiers
     */
    demographics?: {
        gradeLevel?: number;
        subject?: string;
        school?: string;
        region?: string;
        learnerType?: string;
        performanceLevel?: 'low' | 'medium' | 'high';
        [key: string]: string | number | undefined;
    };
}
/**
 * Fairness Auditor
 * Performs comprehensive fairness audits across evaluation sets
 */
declare class FairnessAuditor {
    private readonly config;
    private readonly validator;
    private readonly logger?;
    constructor(config?: FullFairnessAuditorConfig);
    /**
     * Run comprehensive fairness audit
     */
    runFairnessAudit(evaluations: EvaluationWithDemographics[]): Promise<FairnessAuditReport>;
    /**
     * Validate all evaluations
     */
    private validateAllEvaluations;
    /**
     * Group evaluations by demographic indicators
     */
    private groupByDemographics;
    /**
     * Analyze demographics for disparities
     */
    private analyzeDemographics;
    /**
     * Analyze score distribution
     */
    private analyzeScoreDistribution;
    /**
     * Analyze feedback sentiment by group
     */
    private analyzeFeedbackSentiment;
    /**
     * Analyze issue patterns
     */
    private analyzeIssuePatterns;
    /**
     * Calculate overall statistics
     */
    private calculateOverallStatistics;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get action recommendation for specific issue type
     */
    private getIssueActionRecommendation;
    /**
     * Calculate fairness score
     */
    private calculateFairnessScore;
    /**
     * Calculate disparity between groups
     */
    private calculateDisparity;
    private calculateMean;
    private calculateMedian;
    private calculateStdDev;
    private calculateSkewness;
    /**
     * Run quick fairness check (critical issues only)
     */
    quickAudit(evaluations: EvaluationWithDemographics[]): Promise<{
        passed: boolean;
        criticalIssues: number;
        averageSafetyScore: number;
        recommendations: string[];
    }>;
    /**
     * Get trend analysis comparing two audit reports
     */
    compareTrends(previousReport: FairnessAuditReport, currentReport: FairnessAuditReport): {
        scoreChange: number;
        passRateChange: number;
        issueChange: number;
        improving: boolean;
        summary: string;
    };
}
/**
 * Create fairness auditor
 */
declare function createFairnessAuditor(config?: FullFairnessAuditorConfig): FairnessAuditor;
/**
 * Create strict fairness auditor
 */
declare function createStrictFairnessAuditor(config?: Omit<FullFairnessAuditorConfig, 'disparityThreshold' | 'significanceThreshold'>): FairnessAuditor;
/**
 * Create lenient fairness auditor
 */
declare function createLenientFairnessAuditor(config?: Omit<FullFairnessAuditorConfig, 'disparityThreshold' | 'minSampleSize'>): FairnessAuditor;
/**
 * Scheduled audit runner for periodic fairness checks
 */
declare class ScheduledFairnessAuditRunner {
    private readonly auditor;
    private readonly logger?;
    private auditHistory;
    constructor(config?: FullFairnessAuditorConfig);
    /**
     * Run scheduled audit and store in history
     */
    runScheduledAudit(evaluations: EvaluationWithDemographics[]): Promise<FairnessAuditReport>;
    /**
     * Get audit history
     */
    getAuditHistory(): FairnessAuditReport[];
    /**
     * Get latest audit report
     */
    getLatestAudit(): FairnessAuditReport | undefined;
    /**
     * Get trend over time
     */
    getTrend(): {
        scores: number[];
        passRates: number[];
        dates: Date[];
        overallTrend: 'improving' | 'declining' | 'stable';
    };
}

/**
 * Safe Evaluation Wrapper
 *
 * Integrates safety validation into the evaluation pipeline.
 * Wraps AI-generated feedback with safety checks and auto-correction.
 */

/**
 * Evaluation result from AI (matches SubjectiveEvaluationResult structure)
 */
interface AIEvaluationResult {
    score: number;
    maxScore: number;
    accuracy?: number;
    completeness?: number;
    relevance?: number;
    depth?: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string[];
    demonstratedBloomsLevel?: string;
    misconceptions?: string[];
}
/**
 * Safe evaluation result with safety validation
 */
interface SafeEvaluationResult extends AIEvaluationResult {
    safetyValidation: {
        passed: boolean;
        score: number;
        issueCount: number;
        wasRewritten: boolean;
        originalFeedback?: string;
        issues?: Array<{
            type: string;
            severity: string;
            description: string;
        }>;
    };
}
/**
 * Configuration for safe evaluation wrapper
 */
interface SafeEvaluationWrapperConfig {
    /**
     * Enable automatic rewriting of unsafe feedback
     * @default true
     */
    autoRewrite?: boolean;
    /**
     * Use strict validation (higher standards)
     * @default false
     */
    strictMode?: boolean;
    /**
     * Target grade level for readability
     * @default 8
     */
    targetGradeLevel?: number;
    /**
     * Skip safety validation (for testing only)
     * @default false
     */
    skipValidation?: boolean;
    /**
     * Log safety validation results
     * @default true
     */
    logResults?: boolean;
    /**
     * Custom validator instance
     */
    validator?: FairnessSafetyValidator;
}
/**
 * Safe Evaluation Wrapper
 * Ensures all AI-generated feedback passes safety checks
 */
declare class SafeEvaluationWrapper {
    private readonly validator;
    private readonly config;
    constructor(config?: SafeEvaluationWrapperConfig);
    /**
     * Wrap an AI evaluation result with safety validation
     */
    wrapEvaluation(evaluation: AIEvaluationResult, evaluationId?: string): Promise<SafeEvaluationResult>;
    /**
     * Quick check if feedback is safe (without full result)
     */
    isSafe(feedback: string): Promise<boolean>;
    /**
     * Get improvement suggestions for feedback
     */
    getSuggestions(feedback: string): string[];
    /**
     * Ensure strengths are positively framed
     */
    private ensurePositiveStrengths;
    /**
     * Ensure improvements are constructively framed
     */
    private ensureConstructiveImprovements;
    /**
     * Log safety validation result
     */
    private logSafetyResult;
}
/**
 * Create a safe evaluation wrapper
 */
declare function createSafeEvaluationWrapper(config?: SafeEvaluationWrapperConfig): SafeEvaluationWrapper;
/**
 * Create a strict safe evaluation wrapper
 */
declare function createStrictSafeEvaluationWrapper(config?: Omit<SafeEvaluationWrapperConfig, 'strictMode'>): SafeEvaluationWrapper;
/**
 * Get default safe evaluation wrapper
 */
declare function getDefaultSafeEvaluationWrapper(): SafeEvaluationWrapper;
/**
 * Reset default wrapper (for testing)
 */
declare function resetDefaultSafeEvaluationWrapper(): void;
/**
 * Wrap an AI evaluation with safety validation (using default wrapper)
 */
declare function wrapEvaluationWithSafety(evaluation: AIEvaluationResult, evaluationId?: string): Promise<SafeEvaluationResult>;
/**
 * Quick check if feedback text is safe
 */
declare function isFeedbackTextSafe(feedback: string): Promise<boolean>;
/**
 * Get suggestions for improving feedback
 */
declare function getFeedbackSuggestions(feedback: string): string[];

/**
 * @sam-ai/safety
 *
 * Safety validation for SAM AI Tutor
 * Comprehensive safety validation for AI-generated evaluation feedback
 *
 * Features:
 * - Discouraging language detection
 * - Bias pattern detection
 * - Accessibility/readability checking
 * - Constructive framing validation
 * - Fairness auditing
 */

/**
 * Quick validation using default validator
 */
declare function validateFeedbackSafety(feedback: EvaluationFeedback): Promise<SafetyResult>;
/**
 * Check if feedback passes safety validation
 */
declare function isFeedbackSafe(feedback: EvaluationFeedback): Promise<boolean>;
/**
 * Get improvement suggestions for feedback
 */
declare function getFeedbackImprovements(feedback: EvaluationFeedback): string[];
/**
 * Rewrite feedback with safety improvements
 */
declare function rewriteFeedbackSafely(feedback: EvaluationFeedback): EvaluationFeedback;

export { type AIEvaluationResult, AccessibilityChecker, type AccessibilityCheckerConfig, type AccessibilityIssue, type AccessibilityIssueType, type AccessibilityResult, type BiasCategory, type BiasDetectionResult, BiasDetector, type BiasDetectorConfig, type BiasIndicator, ConstructiveFramingChecker, type ConstructiveFramingCheckerConfig, type ConstructiveFramingResult, DEFAULT_ACCESSIBILITY_CONFIG, DEFAULT_AUDIT_CONFIG, DEFAULT_CONSTRUCTIVE_CONFIG, DEFAULT_FAIRNESS_CONFIG, type DemographicAnalysis, type DiscouragingCategory, DiscouragingLanguageDetector, type DiscouragingLanguageDetectorConfig, type DiscouragingLanguageResult, type DiscouragingMatch, type EvaluationFeedback, type EvaluationWithDemographics, type FairnessAuditConfig, type FairnessAuditReport, FairnessAuditor, type FairnessRecommendation, FairnessSafetyValidator, type FairnessValidatorConfig, type FramingIssue, type FramingIssueType, type FullFairnessAuditorConfig, type FullFairnessValidatorConfig, type GroupStatistics, type PositiveElement, SEVERITY_WEIGHTS, type SafeEvaluationResult, SafeEvaluationWrapper, type SafeEvaluationWrapperConfig, type SafetyIssue, type SafetyIssueType, type SafetyLogger, type SafetyRecommendation, type SafetyResult, type SafetySeverity, ScheduledFairnessAuditRunner, type TextStatistics, createAccessibilityChecker, createBiasDetector, createCategoryBiasDetector, createCollegeAccessibilityChecker, createConstructiveFramingChecker, createDiscouragingLanguageDetector, createElementaryAccessibilityChecker, createFairnessAuditor, createFairnessSafetyValidator, createHighSchoolAccessibilityChecker, createLenientBiasDetector, createLenientConstructiveChecker, createLenientDiscouragingDetector, createLenientFairnessAuditor, createLenientFairnessValidator, createQuickFairnessValidator, createSafeEvaluationWrapper, createStrictBiasDetector, createStrictConstructiveChecker, createStrictDiscouragingDetector, createStrictFairnessAuditor, createStrictFairnessValidator, createStrictSafeEvaluationWrapper, getDefaultFairnessValidator, getDefaultSafeEvaluationWrapper, getFeedbackImprovements, getFeedbackSuggestions, isFeedbackSafe, isFeedbackTextSafe, resetDefaultFairnessValidator, resetDefaultSafeEvaluationWrapper, rewriteFeedbackSafely, validateFeedbackSafety, wrapEvaluationWithSafety };
