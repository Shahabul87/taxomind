/**
 * Pedagogical Evaluator Types
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Types for educational effectiveness validation
 */
/**
 * Bloom's taxonomy levels
 */
type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
/**
 * Bloom's level order (lowest to highest cognitive complexity)
 */
declare const BLOOMS_LEVEL_ORDER: BloomsLevel[];
/**
 * Get numeric index of a Bloom's level (0-5)
 */
declare function getBloomsLevelIndex(level: BloomsLevel): number;
/**
 * Sub-level within each Bloom's level
 * Provides finer granularity for assessment and progression tracking
 */
type BloomsSubLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
/**
 * Order of sub-levels from lowest to highest complexity
 */
declare const BLOOMS_SUB_LEVEL_ORDER: BloomsSubLevel[];
/**
 * Get numeric index of a sub-level (0-2)
 */
declare function getBloomsSubLevelIndex(subLevel: BloomsSubLevel): number;
/**
 * Indicator types for determining sub-level
 */
type SubLevelIndicatorType = 'complexity' | 'abstraction' | 'transfer' | 'novelty';
/**
 * Indicator for sub-level determination
 */
interface SubLevelIndicator {
    /**
     * Type of indicator
     */
    type: SubLevelIndicatorType;
    /**
     * Score for this indicator (0-1)
     * BASIC: 0-0.33, INTERMEDIATE: 0.34-0.66, ADVANCED: 0.67-1.0
     */
    score: number;
    /**
     * Evidence text supporting this score
     */
    evidence: string;
}
/**
 * Enhanced Bloom's result with sub-level granularity
 */
interface EnhancedBloomsResult {
    /**
     * The main Bloom's level (1-6 or REMEMBER-CREATE)
     */
    level: BloomsLevel;
    /**
     * Numeric level value (1-6)
     */
    levelNumeric: number;
    /**
     * Sub-level within the main level
     */
    subLevel: BloomsSubLevel;
    /**
     * Numeric sub-level value (0-2)
     */
    subLevelNumeric: number;
    /**
     * Combined numeric score (1.0 - 6.9)
     * Examples: 3.0 = Apply-Basic, 3.3 = Apply-Intermediate, 3.7 = Apply-Advanced
     */
    numericScore: number;
    /**
     * Confidence in the assessment (0-1)
     */
    confidence: number;
    /**
     * Indicators used to determine sub-level
     */
    indicators: SubLevelIndicator[];
    /**
     * Human-readable label (e.g., "Apply - Advanced")
     */
    label: string;
}
/**
 * Calculate numeric score from level and sub-level
 * @param level - Bloom's level (1-6)
 * @param subLevel - Sub-level
 * @returns Numeric score (1.0 - 6.9)
 */
declare function calculateBloomsNumericScore(levelOrName: number | BloomsLevel, subLevel: BloomsSubLevel): number;
/**
 * Determine sub-level from indicator scores
 * @param indicators - Array of sub-level indicators
 * @returns The determined sub-level
 */
declare function determineSubLevelFromIndicators(indicators: SubLevelIndicator[]): BloomsSubLevel;
/**
 * Create a human-readable label for the Bloom's level and sub-level
 */
declare function createBloomsLabel(level: BloomsLevel, subLevel: BloomsSubLevel): string;
/**
 * Bloom's distribution across levels
 */
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
/**
 * Difficulty levels for content
 */
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/**
 * Difficulty level order
 */
declare const DIFFICULTY_LEVEL_ORDER: DifficultyLevel[];
/**
 * Get numeric index of difficulty level (0-3)
 */
declare function getDifficultyLevelIndex(level: DifficultyLevel): number;
/**
 * Student's cognitive profile
 */
interface StudentCognitiveProfile {
    /**
     * Student's current mastery levels per topic
     */
    masteryLevels: Record<string, MasteryLevel>;
    /**
     * Student's demonstrated Bloom's levels per topic
     */
    demonstratedBloomsLevels: Record<string, BloomsLevel>;
    /**
     * Student's overall difficulty level
     */
    currentDifficultyLevel: DifficultyLevel;
    /**
     * Student's learning velocity (how fast they progress)
     */
    learningVelocity: LearningVelocity;
    /**
     * Topics the student has completed
     */
    completedTopics: string[];
    /**
     * Topics currently in progress
     */
    inProgressTopics: string[];
    /**
     * Student's identified knowledge gaps
     */
    knowledgeGaps: KnowledgeGap[];
    /**
     * Recent performance metrics
     */
    recentPerformance: PerformanceMetrics;
}
/**
 * Mastery level for a topic
 */
interface MasteryLevel {
    /**
     * Topic identifier
     */
    topicId: string;
    /**
     * Mastery percentage (0-100)
     */
    mastery: number;
    /**
     * Highest Bloom's level demonstrated
     */
    highestBloomsLevel: BloomsLevel;
    /**
     * Confidence in this assessment (0-1)
     */
    confidence: number;
    /**
     * Last assessment timestamp
     */
    lastAssessed: string;
}
/**
 * Learning velocity categories
 */
type LearningVelocity = 'slow' | 'moderate' | 'fast' | 'accelerated';
/**
 * Knowledge gap identification
 */
interface KnowledgeGap {
    /**
     * Topic with the gap
     */
    topicId: string;
    /**
     * Specific concept or skill missing
     */
    concept: string;
    /**
     * Severity of the gap
     */
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    /**
     * Prerequisites that depend on this
     */
    affectedPrerequisites: string[];
    /**
     * Suggested remediation
     */
    suggestedRemediation?: string;
}
/**
 * Recent performance metrics
 */
interface PerformanceMetrics {
    /**
     * Average score on recent assessments (0-100)
     */
    averageScore: number;
    /**
     * Trend direction
     */
    trend: 'improving' | 'stable' | 'declining';
    /**
     * Number of assessments in this period
     */
    assessmentCount: number;
    /**
     * Time spent on learning (minutes)
     */
    timeSpentMinutes: number;
    /**
     * Engagement level
     */
    engagementLevel: 'low' | 'moderate' | 'high';
}
/**
 * Content to be evaluated pedagogically
 */
interface PedagogicalContent {
    /**
     * The content text
     */
    content: string;
    /**
     * Content type
     */
    type: 'lesson' | 'explanation' | 'exercise' | 'assessment' | 'feedback';
    /**
     * Topic being covered
     */
    topic?: string;
    /**
     * Target Bloom's level
     */
    targetBloomsLevel?: BloomsLevel;
    /**
     * Target difficulty
     */
    targetDifficulty?: DifficultyLevel;
    /**
     * Prerequisites for this content
     */
    prerequisites?: string[];
    /**
     * Learning objectives
     */
    learningObjectives?: string[];
    /**
     * Prior content in the sequence (for scaffolding)
     */
    priorContent?: PriorContentSummary[];
}
/**
 * Summary of prior content for scaffolding analysis
 */
interface PriorContentSummary {
    /**
     * Topic covered
     */
    topic: string;
    /**
     * Bloom's level of prior content
     */
    bloomsLevel: BloomsLevel;
    /**
     * Difficulty of prior content
     */
    difficulty: DifficultyLevel;
    /**
     * Key concepts introduced
     */
    conceptsIntroduced: string[];
}
/**
 * Base result for all pedagogical evaluators
 */
interface PedagogicalEvaluationResult {
    /**
     * Evaluator name
     */
    evaluatorName: string;
    /**
     * Whether the content passed evaluation
     */
    passed: boolean;
    /**
     * Score (0-100)
     */
    score: number;
    /**
     * Confidence in the evaluation (0-1)
     */
    confidence: number;
    /**
     * Issues found
     */
    issues: PedagogicalIssue[];
    /**
     * Recommendations for improvement
     */
    recommendations: string[];
    /**
     * Processing time in ms
     */
    processingTimeMs: number;
    /**
     * Detailed analysis
     */
    analysis: Record<string, unknown>;
}
/**
 * Issue found by pedagogical evaluator
 */
interface PedagogicalIssue {
    /**
     * Issue type
     */
    type: string;
    /**
     * Severity
     */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /**
     * Description
     */
    description: string;
    /**
     * Impact on learning
     */
    learningImpact: string;
    /**
     * Suggested fix
     */
    suggestedFix?: string;
}
/**
 * Result from Bloom's Aligner evaluation
 */
interface BloomsAlignerResult extends PedagogicalEvaluationResult {
    evaluatorName: 'BloomsAligner';
    /**
     * Detected Bloom's distribution in content
     */
    detectedDistribution: BloomsDistribution;
    /**
     * Dominant Bloom's level
     */
    dominantLevel: BloomsLevel;
    /**
     * Target Bloom's level
     */
    targetLevel: BloomsLevel;
    /**
     * Alignment status
     */
    alignmentStatus: 'aligned' | 'below_target' | 'above_target' | 'mixed';
    /**
     * Distance from target (-5 to +5)
     */
    levelDistance: number;
    /**
     * Specific verb analysis
     */
    verbAnalysis: VerbAnalysis;
    /**
     * Activity type analysis
     */
    activityAnalysis: ActivityAnalysis;
}
/**
 * Analysis of cognitive verbs in content
 */
interface VerbAnalysis {
    /**
     * Verbs found per Bloom's level
     */
    verbsByLevel: Record<BloomsLevel, string[]>;
    /**
     * Total verb count
     */
    totalVerbs: number;
    /**
     * Dominant verb category
     */
    dominantCategory: BloomsLevel;
}
/**
 * Analysis of learning activities
 */
interface ActivityAnalysis {
    /**
     * Types of activities detected
     */
    activityTypes: string[];
    /**
     * Bloom's level of each activity
     */
    activitiesByLevel: Record<BloomsLevel, string[]>;
    /**
     * Presence of higher-order thinking activities
     */
    hasHigherOrderActivities: boolean;
}
/**
 * Result from Scaffolding Evaluator
 */
interface ScaffoldingEvaluatorResult extends PedagogicalEvaluationResult {
    evaluatorName: 'ScaffoldingEvaluator';
    /**
     * Whether content follows proper scaffolding
     */
    properlyScaffolded: boolean;
    /**
     * Complexity progression analysis
     */
    complexityProgression: ComplexityProgression;
    /**
     * Prerequisite coverage
     */
    prerequisiteCoverage: PrerequisiteCoverage;
    /**
     * Support structures present
     */
    supportStructures: SupportStructure[];
    /**
     * Gradual release analysis
     */
    gradualRelease: GradualReleaseAnalysis;
}
/**
 * Analysis of complexity progression
 */
interface ComplexityProgression {
    /**
     * Whether complexity increases appropriately
     */
    appropriate: boolean;
    /**
     * Starting complexity (0-100)
     */
    startingComplexity: number;
    /**
     * Ending complexity (0-100)
     */
    endingComplexity: number;
    /**
     * Complexity curve type
     */
    curveType: 'linear' | 'stepped' | 'exponential' | 'flat' | 'irregular';
    /**
     * Any complexity jumps detected
     */
    complexityJumps: ComplexityJump[];
}
/**
 * A sudden jump in complexity
 */
interface ComplexityJump {
    /**
     * Location in content
     */
    location: string;
    /**
     * Magnitude of jump (0-100)
     */
    magnitude: number;
    /**
     * Whether this jump is problematic
     */
    problematic: boolean;
}
/**
 * Prerequisite knowledge coverage
 */
interface PrerequisiteCoverage {
    /**
     * Required prerequisites
     */
    required: string[];
    /**
     * Prerequisites addressed in content
     */
    addressed: string[];
    /**
     * Prerequisites assumed but not addressed
     */
    assumed: string[];
    /**
     * Missing prerequisites
     */
    missing: string[];
    /**
     * Coverage percentage
     */
    coveragePercentage: number;
}
/**
 * Support structure in content
 */
interface SupportStructure {
    /**
     * Type of support
     */
    type: 'example' | 'hint' | 'scaffold' | 'prompt' | 'feedback' | 'model';
    /**
     * Description
     */
    description: string;
    /**
     * Location in content
     */
    location?: string;
    /**
     * Effectiveness rating (0-100)
     */
    effectiveness: number;
}
/**
 * Gradual release of responsibility analysis
 */
interface GradualReleaseAnalysis {
    /**
     * Phases present in content
     */
    phasesPresent: GradualReleasePhase[];
    /**
     * Whether all phases are represented
     */
    complete: boolean;
    /**
     * Balance of phases
     */
    balance: 'teacher-heavy' | 'balanced' | 'student-heavy';
}
/**
 * Gradual release phases
 */
type GradualReleasePhase = 'I_DO' | 'WE_DO' | 'YOU_DO_TOGETHER' | 'YOU_DO_ALONE';
/**
 * Result from ZPD (Zone of Proximal Development) Evaluator
 */
interface ZPDEvaluatorResult extends PedagogicalEvaluationResult {
    evaluatorName: 'ZPDEvaluator';
    /**
     * Whether content is in student's ZPD
     */
    inZPD: boolean;
    /**
     * ZPD zone assessment
     */
    zpdZone: ZPDZone;
    /**
     * Challenge level analysis
     */
    challengeLevel: ChallengeLevel;
    /**
     * Support adequacy
     */
    supportAdequacy: SupportAdequacy;
    /**
     * Engagement prediction
     */
    engagementPrediction: EngagementPrediction;
    /**
     * Personalization fit
     */
    personalizationFit: PersonalizationFit;
}
/**
 * ZPD zone classification
 */
type ZPDZone = 'TOO_EASY' | 'COMFORT_ZONE' | 'ZPD_LOWER' | 'ZPD_OPTIMAL' | 'ZPD_UPPER' | 'FRUSTRATION' | 'UNREACHABLE';
/**
 * Challenge level assessment
 */
interface ChallengeLevel {
    /**
     * Overall challenge score (0-100)
     */
    score: number;
    /**
     * Whether challenge is appropriate
     */
    appropriate: boolean;
    /**
     * Challenge factors
     */
    factors: ChallengeFactor[];
    /**
     * Recommended adjustment
     */
    recommendedAdjustment: 'decrease' | 'maintain' | 'increase';
}
/**
 * Factor contributing to challenge
 */
interface ChallengeFactor {
    /**
     * Factor name
     */
    name: string;
    /**
     * Contribution to challenge (0-100)
     */
    contribution: number;
    /**
     * Whether this factor is appropriate
     */
    appropriate: boolean;
}
/**
 * Support adequacy assessment
 */
interface SupportAdequacy {
    /**
     * Overall adequacy score (0-100)
     */
    score: number;
    /**
     * Whether support is adequate
     */
    adequate: boolean;
    /**
     * Types of support present
     */
    supportPresent: string[];
    /**
     * Types of support missing
     */
    supportMissing: string[];
    /**
     * Balance of challenge vs support
     */
    challengeSupportBalance: 'too_much_support' | 'balanced' | 'too_little_support';
}
/**
 * Engagement prediction based on ZPD fit
 */
interface EngagementPrediction {
    /**
     * Predicted engagement level (0-100)
     */
    score: number;
    /**
     * Predicted state
     */
    predictedState: 'bored' | 'comfortable' | 'engaged' | 'challenged' | 'frustrated' | 'anxious';
    /**
     * Risk of disengagement (0-1)
     */
    disengagementRisk: number;
    /**
     * Factors affecting engagement
     */
    engagementFactors: string[];
}
/**
 * Personalization fit assessment
 */
interface PersonalizationFit {
    /**
     * Overall fit score (0-100)
     */
    score: number;
    /**
     * Fit assessment
     */
    assessment: 'poor' | 'fair' | 'good' | 'excellent';
    /**
     * Personalization opportunities
     */
    opportunities: PersonalizationOpportunity[];
}
/**
 * Opportunity for personalization
 */
interface PersonalizationOpportunity {
    /**
     * Area for personalization
     */
    area: string;
    /**
     * Suggested personalization
     */
    suggestion: string;
    /**
     * Expected impact
     */
    expectedImpact: 'low' | 'medium' | 'high';
}
/**
 * Base interface for pedagogical evaluators
 */
interface PedagogicalEvaluator<T extends PedagogicalEvaluationResult> {
    /**
     * Evaluator name
     */
    readonly name: string;
    /**
     * Description of what this evaluator checks
     */
    readonly description: string;
    /**
     * Evaluate content
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<T>;
}
/**
 * Configuration for pedagogical evaluation pipeline
 */
interface PedagogicalPipelineConfig {
    /**
     * Evaluators to run
     */
    evaluators?: ('blooms' | 'scaffolding' | 'zpd')[];
    /**
     * Minimum score to pass (0-100)
     */
    threshold?: number;
    /**
     * Whether to run evaluators in parallel
     */
    parallel?: boolean;
    /**
     * Timeout for all evaluators (ms)
     */
    timeoutMs?: number;
    /**
     * Whether to require student profile for ZPD
     */
    requireStudentProfile?: boolean;
}
/**
 * Default pipeline configuration
 */
declare const DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG: Required<PedagogicalPipelineConfig>;
/**
 * Result from pedagogical pipeline
 */
interface PedagogicalPipelineResult {
    /**
     * Overall pass/fail
     */
    passed: boolean;
    /**
     * Overall score
     */
    overallScore: number;
    /**
     * Individual evaluator results
     */
    evaluatorResults: {
        blooms?: BloomsAlignerResult;
        scaffolding?: ScaffoldingEvaluatorResult;
        zpd?: ZPDEvaluatorResult;
    };
    /**
     * Aggregated issues
     */
    allIssues: PedagogicalIssue[];
    /**
     * Aggregated recommendations
     */
    allRecommendations: string[];
    /**
     * Processing metadata
     */
    metadata: {
        totalTimeMs: number;
        evaluatorsRun: string[];
        studentProfileUsed: boolean;
    };
}

/**
 * Bloom's Aligner Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content alignment with Bloom's Taxonomy cognitive levels
 */

/**
 * Cognitive verbs associated with each Bloom's level
 */
declare const BLOOMS_VERBS: Record<BloomsLevel, string[]>;
/**
 * Activity types associated with each Bloom's level
 */
declare const BLOOMS_ACTIVITIES: Record<BloomsLevel, string[]>;
/**
 * Sub-level indicator record type
 */
type SubLevelIndicatorRecord = Record<'BASIC' | 'INTERMEDIATE' | 'ADVANCED', string[]>;
/**
 * Complexity indicators for sub-level determination
 * BASIC: 0-0.33, INTERMEDIATE: 0.34-0.66, ADVANCED: 0.67-1.0
 */
declare const SUB_LEVEL_COMPLEXITY_INDICATORS: SubLevelIndicatorRecord;
/**
 * Abstraction indicators for sub-level determination
 */
declare const SUB_LEVEL_ABSTRACTION_INDICATORS: SubLevelIndicatorRecord;
/**
 * Transfer context indicators for sub-level determination
 */
declare const SUB_LEVEL_TRANSFER_INDICATORS: SubLevelIndicatorRecord;
/**
 * Novelty indicators for sub-level determination
 */
declare const SUB_LEVEL_NOVELTY_INDICATORS: SubLevelIndicatorRecord;
/**
 * Sub-Level Analyzer for determining BASIC/INTERMEDIATE/ADVANCED within Bloom&apos;s levels
 */
declare class SubLevelAnalyzer {
    /**
     * Analyze content for sub-level indicators
     */
    analyze(content: string): SubLevelIndicator[];
    /**
     * Analyze a specific indicator type
     */
    private analyzeIndicatorType;
    /**
     * Get enhanced Bloom&apos;s result with sub-level information
     */
    getEnhancedResult(level: BloomsLevel, confidence: number, content: string): EnhancedBloomsResult;
}
/**
 * Create a sub-level analyzer instance
 */
declare function createSubLevelAnalyzer(): SubLevelAnalyzer;
/**
 * Configuration for Bloom&apos;s Aligner
 */
interface BloomsAlignerConfig {
    /**
     * Minimum percentage for a level to be considered significant
     */
    significanceThreshold?: number;
    /**
     * Acceptable variance from target level (0-5)
     */
    acceptableVariance?: number;
    /**
     * Weight for verb analysis (0-1)
     */
    verbWeight?: number;
    /**
     * Weight for activity analysis (0-1)
     */
    activityWeight?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
}
/**
 * Default configuration
 */
declare const DEFAULT_BLOOMS_ALIGNER_CONFIG: Required<BloomsAlignerConfig>;
/**
 * Bloom's Aligner Evaluator
 * Analyzes content for Bloom's Taxonomy level alignment
 */
declare class BloomsAligner implements PedagogicalEvaluator<BloomsAlignerResult> {
    readonly name = "BloomsAligner";
    readonly description = "Evaluates content alignment with Bloom's Taxonomy cognitive levels";
    private readonly config;
    constructor(config?: BloomsAlignerConfig);
    /**
     * Evaluate content for Bloom's alignment
     */
    evaluate(content: PedagogicalContent): Promise<BloomsAlignerResult>;
    /**
     * Analyze cognitive verbs in content
     */
    private analyzeVerbs;
    /**
     * Analyze learning activities in content
     */
    private analyzeActivities;
    /**
     * Calculate Bloom's distribution from verb and activity analysis
     */
    private calculateDistribution;
    /**
     * Convert verbs by level to distribution
     */
    private verbsToDistribution;
    /**
     * Find dominant Bloom's level from distribution
     */
    private findDominantLevel;
    /**
     * Determine alignment status
     */
    private determineAlignmentStatus;
    /**
     * Calculate alignment score
     */
    private calculateScore;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Analyze issues and generate recommendations
     */
    private analyzeIssuesAndRecommendations;
}
/**
 * Create a Bloom's Aligner evaluator with default config
 */
declare function createBloomsAligner(config?: BloomsAlignerConfig): BloomsAligner;
/**
 * Create a strict Bloom's Aligner (no variance allowed)
 */
declare function createStrictBloomsAligner(): BloomsAligner;
/**
 * Create a lenient Bloom's Aligner (more variance allowed)
 */
declare function createLenientBloomsAligner(): BloomsAligner;

/**
 * Scaffolding Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content for proper pedagogical scaffolding
 */

/**
 * Indicators of different support structures
 */
declare const SUPPORT_INDICATORS: Record<SupportStructure['type'], string[]>;
/**
 * Gradual release phase indicators
 */
declare const GRADUAL_RELEASE_INDICATORS: Record<GradualReleasePhase, string[]>;
/**
 * Complexity indicators (words/patterns that suggest higher complexity)
 */
declare const COMPLEXITY_INDICATORS: {
    low: string[];
    medium: string[];
    high: string[];
};
/**
 * Configuration for Scaffolding Evaluator
 */
interface ScaffoldingEvaluatorConfig {
    /**
     * Maximum acceptable complexity jump (0-100)
     */
    maxComplexityJump?: number;
    /**
     * Minimum prerequisite coverage percentage
     */
    minPrerequisiteCoverage?: number;
    /**
     * Minimum number of support structures expected
     */
    minSupportStructures?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
    /**
     * Whether to require gradual release phases
     */
    requireGradualRelease?: boolean;
}
/**
 * Default configuration
 */
declare const DEFAULT_SCAFFOLDING_CONFIG: Required<ScaffoldingEvaluatorConfig>;
/**
 * Scaffolding Evaluator
 * Analyzes content for proper pedagogical scaffolding
 */
declare class ScaffoldingEvaluator implements PedagogicalEvaluator<ScaffoldingEvaluatorResult> {
    readonly name = "ScaffoldingEvaluator";
    readonly description = "Evaluates content for proper pedagogical scaffolding and progressive complexity";
    private readonly config;
    constructor(config?: ScaffoldingEvaluatorConfig);
    /**
     * Evaluate content for scaffolding quality
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<ScaffoldingEvaluatorResult>;
    /**
     * Analyze complexity progression through content
     */
    private analyzeComplexityProgression;
    /**
     * Estimate complexity of text segment
     */
    private estimateComplexity;
    /**
     * Detect sudden complexity jumps in content
     */
    private detectComplexityJumps;
    /**
     * Determine complexity curve type
     */
    private determineCurveType;
    /**
     * Analyze prerequisite coverage
     */
    private analyzePrerequisiteCoverage;
    /**
     * Analyze support structures in content
     */
    private analyzeSupportStructures;
    /**
     * Estimate effectiveness of a support structure
     */
    private estimateSupportEffectiveness;
    /**
     * Analyze gradual release of responsibility
     */
    private analyzeGradualRelease;
    /**
     * Determine if content is properly scaffolded
     */
    private determineProperScaffolding;
    /**
     * Calculate scaffolding score
     */
    private calculateScore;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Analyze issues and generate recommendations
     */
    private analyzeIssuesAndRecommendations;
}
/**
 * Create a Scaffolding Evaluator with default config
 */
declare function createScaffoldingEvaluator(config?: ScaffoldingEvaluatorConfig): ScaffoldingEvaluator;
/**
 * Create a strict Scaffolding Evaluator
 */
declare function createStrictScaffoldingEvaluator(): ScaffoldingEvaluator;
/**
 * Create a lenient Scaffolding Evaluator
 */
declare function createLenientScaffoldingEvaluator(): ScaffoldingEvaluator;

/**
 * ZPD (Zone of Proximal Development) Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content fit within student's Zone of Proximal Development
 */

/**
 * Challenge score ranges for each ZPD zone
 */
declare const ZPD_ZONE_RANGES: Record<ZPDZone, {
    min: number;
    max: number;
}>;
/**
 * Engagement predictions based on ZPD zone
 */
declare const ZONE_ENGAGEMENT_MAP: Record<ZPDZone, EngagementPrediction['predictedState']>;
/**
 * Support types that should be present
 */
declare const SUPPORT_TYPES: string[];
/**
 * Configuration for ZPD Evaluator
 */
interface ZPDEvaluatorConfig {
    /**
     * Target ZPD zone for optimal learning
     */
    targetZone?: ZPDZone;
    /**
     * Minimum challenge score (0-100)
     */
    minChallengeScore?: number;
    /**
     * Maximum challenge score (0-100)
     */
    maxChallengeScore?: number;
    /**
     * Minimum support adequacy score (0-100)
     */
    minSupportAdequacy?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
    /**
     * Weight for challenge appropriateness
     */
    challengeWeight?: number;
    /**
     * Weight for support adequacy
     */
    supportWeight?: number;
    /**
     * Weight for personalization fit
     */
    personalizationWeight?: number;
    /**
     * Whether to include cognitive load analysis (Phase 3)
     * @default true
     */
    includeCognitiveLoad?: boolean;
    /**
     * Maximum total cognitive load before ZPD adjustment (Phase 3)
     * If load exceeds this, ZPD zone is adjusted toward easier content
     * @default 70
     */
    maxCognitiveLoad?: number;
    /**
     * Weight for cognitive load in score calculation (Phase 3)
     * @default 0.15
     */
    cognitiveLoadWeight?: number;
}
/**
 * Default configuration
 */
declare const DEFAULT_ZPD_CONFIG: Required<ZPDEvaluatorConfig>;
/**
 * ZPD Evaluator
 * Analyzes content fit within student's Zone of Proximal Development
 */
declare class ZPDEvaluator implements PedagogicalEvaluator<ZPDEvaluatorResult> {
    readonly name = "ZPDEvaluator";
    readonly description = "Evaluates content fit within student's Zone of Proximal Development";
    private readonly config;
    private readonly cognitiveLoadAnalyzer;
    constructor(config?: ZPDEvaluatorConfig);
    /**
     * Evaluate content for ZPD fit
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<ZPDEvaluatorResult>;
    /**
     * Adjust challenge score based on cognitive load (Phase 3)
     * High cognitive load effectively increases the perceived challenge
     */
    private adjustChallengeForCognitiveLoad;
    /**
     * Analyze challenge level of content
     */
    private analyzeChallengeLevel;
    /**
     * Calculate difficulty factor
     */
    private calculateDifficultyFactor;
    /**
     * Calculate Bloom's level factor
     */
    private calculateBloomsFactor;
    /**
     * Calculate prerequisite factor
     */
    private calculatePrerequisiteFactor;
    /**
     * Calculate content complexity factor
     */
    private calculateComplexityFactor;
    /**
     * Determine ZPD zone based on challenge score
     */
    private determineZPDZone;
    /**
     * Check if content is within ZPD
     */
    private isInZPD;
    /**
     * Analyze support adequacy
     */
    private analyzeSupportAdequacy;
    /**
     * Predict student engagement
     * Phase 3: Now considers cognitive load impact on engagement
     */
    private predictEngagement;
    /**
     * Analyze personalization fit
     */
    private analyzePersonalizationFit;
    /**
     * Calculate overall ZPD score
     * Phase 3: Now includes cognitive load factor
     */
    private calculateScore;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Analyze issues and generate recommendations
     * Phase 3: Now includes cognitive load analysis
     */
    private analyzeIssuesAndRecommendations;
}
/**
 * Create a ZPD Evaluator with default config
 */
declare function createZPDEvaluator(config?: ZPDEvaluatorConfig): ZPDEvaluator;
/**
 * Create a strict ZPD Evaluator (requires optimal zone)
 */
declare function createStrictZPDEvaluator(): ZPDEvaluator;
/**
 * Create a lenient ZPD Evaluator (allows wider ZPD range)
 */
declare function createLenientZPDEvaluator(): ZPDEvaluator;

/**
 * Cognitive Load Analyzer
 *
 * Phase 3: Cognitive Load Integration
 * Analyzes content for cognitive load factors based on Cognitive Load Theory (CLT)
 *
 * Three types of cognitive load:
 * - Intrinsic: Inherent complexity of the material
 * - Extraneous: Unnecessary processing burden (poor design, confusing presentation)
 * - Germane: Learning-productive processing (schema building, deep understanding)
 */

/**
 * Cognitive load types based on Cognitive Load Theory
 */
type CognitiveLoadType = 'intrinsic' | 'extraneous' | 'germane';
/**
 * Individual cognitive load measurement
 */
interface CognitiveLoadMeasurement {
    /**
     * Type of cognitive load
     */
    type: CognitiveLoadType;
    /**
     * Load score (0-100)
     * Higher = more load
     */
    score: number;
    /**
     * Factors contributing to this load
     */
    factors: CognitiveLoadFactor[];
    /**
     * Confidence in the measurement (0-1)
     */
    confidence: number;
}
/**
 * Factor contributing to cognitive load
 */
interface CognitiveLoadFactor {
    /**
     * Factor name
     */
    name: string;
    /**
     * Factor contribution to load (0-100)
     */
    contribution: number;
    /**
     * Evidence for this factor
     */
    evidence: string;
    /**
     * Whether this factor can be optimized
     */
    optimizable: boolean;
}
/**
 * Complete cognitive load analysis result
 */
interface CognitiveLoadResult {
    /**
     * Overall cognitive load score (0-100)
     * Weighted combination of all load types
     */
    totalLoad: number;
    /**
     * Load category based on total load
     */
    loadCategory: 'low' | 'moderate' | 'high' | 'overload';
    /**
     * Individual load measurements
     */
    measurements: {
        intrinsic: CognitiveLoadMeasurement;
        extraneous: CognitiveLoadMeasurement;
        germane: CognitiveLoadMeasurement;
    };
    /**
     * Balance assessment
     * Ideal: low extraneous, appropriate intrinsic, high germane
     */
    balance: CognitiveLoadBalance;
    /**
     * Recommendations for optimizing cognitive load
     */
    recommendations: CognitiveLoadRecommendation[];
    /**
     * Bloom's level compatibility
     * Higher Bloom's levels require more cognitive capacity
     */
    bloomsCompatibility: BloomsCompatibility;
    /**
     * Processing metadata
     */
    metadata: {
        processingTimeMs: number;
        timestamp: string;
        contentLength: number;
    };
}
/**
 * Balance assessment of cognitive load distribution
 */
interface CognitiveLoadBalance {
    /**
     * Overall balance status
     */
    status: 'optimal' | 'suboptimal' | 'problematic';
    /**
     * Whether extraneous load is minimized
     */
    extraneousMinimized: boolean;
    /**
     * Whether germane load is maximized
     */
    germaneMaximized: boolean;
    /**
     * Whether intrinsic load matches learner level
     */
    intrinsicAppropriate: boolean;
    /**
     * Balance score (0-100)
     */
    score: number;
}
/**
 * Recommendation for optimizing cognitive load
 */
interface CognitiveLoadRecommendation {
    /**
     * Target load type
     */
    targetType: CognitiveLoadType;
    /**
     * Recommendation action
     */
    action: string;
    /**
     * Expected improvement
     */
    expectedImprovement: string;
    /**
     * Priority (1-5, 1 = highest)
     */
    priority: number;
    /**
     * Specific techniques to apply
     */
    techniques?: string[];
}
/**
 * Bloom's level compatibility with cognitive load
 */
interface BloomsCompatibility {
    /**
     * Maximum recommended Bloom's level given current load
     */
    maxRecommendedLevel: BloomsLevel;
    /**
     * Whether current load supports the target Bloom's level
     */
    supportsTargetLevel: boolean;
    /**
     * Cognitive capacity remaining after current load (0-100)
     */
    remainingCapacity: number;
    /**
     * Adjustment suggestions
     */
    adjustments?: string[];
}
/**
 * Intrinsic load indicators (content complexity)
 */
declare const INTRINSIC_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Extraneous load indicators (poor design/presentation)
 */
declare const EXTRANEOUS_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Germane load indicators (schema building)
 */
declare const GERMANE_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Cognitive Load Analyzer
 * Analyzes content for cognitive load and provides optimization recommendations
 */
declare class CognitiveLoadAnalyzer {
    /**
     * Analyze content for cognitive load
     */
    analyze(content: string, targetBloomsLevel?: BloomsLevel): CognitiveLoadResult;
    /**
     * Measure intrinsic cognitive load
     */
    private measureIntrinsicLoad;
    /**
     * Measure extraneous cognitive load
     */
    private measureExtraneousLoad;
    /**
     * Measure germane cognitive load
     */
    private measureGermaneLoad;
    /**
     * Count indicator matches in text
     */
    private countIndicators;
    /**
     * Calculate score based on indicator matches
     */
    private calculateIndicatorScore;
    /**
     * Calculate total cognitive load
     */
    private calculateTotalLoad;
    /**
     * Categorize total load
     */
    private categorizeLoad;
    /**
     * Assess cognitive load balance
     */
    private assessBalance;
    /**
     * Generate recommendations for optimizing cognitive load
     */
    private generateRecommendations;
    /**
     * Assess compatibility with Bloom's taxonomy levels
     */
    private assessBloomsCompatibility;
}
/**
 * Create a cognitive load analyzer instance
 */
declare function createCognitiveLoadAnalyzer(): CognitiveLoadAnalyzer;

/**
 * Pedagogical Evaluation Pipeline
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Combines all pedagogical evaluators into a unified pipeline
 */

/**
 * Full configuration including individual evaluator configs
 */
interface PedagogicalPipelineFullConfig extends PedagogicalPipelineConfig {
    /**
     * Bloom's Aligner configuration
     */
    bloomsConfig?: BloomsAlignerConfig;
    /**
     * Scaffolding Evaluator configuration
     */
    scaffoldingConfig?: ScaffoldingEvaluatorConfig;
    /**
     * ZPD Evaluator configuration
     */
    zpdConfig?: ZPDEvaluatorConfig;
    /**
     * Custom logger
     */
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Pedagogical Evaluation Pipeline
 * Orchestrates multiple pedagogical evaluators
 */
declare class PedagogicalPipeline {
    private readonly config;
    private readonly bloomsAligner;
    private readonly scaffoldingEvaluator;
    private readonly zpdEvaluator;
    private readonly logger?;
    constructor(config?: PedagogicalPipelineFullConfig);
    /**
     * Evaluate content through the pipeline
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<PedagogicalPipelineResult>;
    /**
     * Run evaluators in parallel
     */
    private runParallel;
    /**
     * Run evaluators sequentially
     */
    private runSequential;
    /**
     * Run an evaluator with timeout
     */
    private runWithTimeout;
    /**
     * Aggregate results from all evaluators
     */
    private aggregateResults;
    /**
     * Create an error result
     */
    private createErrorResult;
    /**
     * Get individual evaluators for direct access
     */
    getEvaluators(): {
        blooms: BloomsAligner;
        scaffolding: ScaffoldingEvaluator;
        zpd: ZPDEvaluator;
    };
}
/**
 * Create a pedagogical pipeline with default config
 */
declare function createPedagogicalPipeline(config?: PedagogicalPipelineFullConfig): PedagogicalPipeline;
/**
 * Create a Bloom's-only pipeline
 */
declare function createBloomsPipeline(config?: BloomsAlignerConfig): PedagogicalPipeline;
/**
 * Create a scaffolding-only pipeline
 */
declare function createScaffoldingPipeline(config?: ScaffoldingEvaluatorConfig): PedagogicalPipeline;
/**
 * Create a ZPD-only pipeline
 */
declare function createZPDPipeline(config?: ZPDEvaluatorConfig): PedagogicalPipeline;
/**
 * Create a strict pedagogical pipeline
 */
declare function createStrictPedagogicalPipeline(): PedagogicalPipeline;
/**
 * Convenience function to evaluate content
 */
declare function evaluatePedagogically(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile, config?: PedagogicalPipelineFullConfig): Promise<PedagogicalPipelineResult>;

export { type ActivityAnalysis, BLOOMS_ACTIVITIES, BLOOMS_LEVEL_ORDER, BLOOMS_SUB_LEVEL_ORDER, BLOOMS_VERBS, BloomsAligner, type BloomsAlignerConfig, type BloomsAlignerResult, type BloomsCompatibility, type BloomsDistribution, type BloomsLevel, type BloomsSubLevel, COMPLEXITY_INDICATORS, type ChallengeFactor, type ChallengeLevel, CognitiveLoadAnalyzer, type CognitiveLoadBalance, type CognitiveLoadFactor, type CognitiveLoadMeasurement, type CognitiveLoadRecommendation, type CognitiveLoadResult, type CognitiveLoadType, type ComplexityJump, type ComplexityProgression, DEFAULT_BLOOMS_ALIGNER_CONFIG, DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG, DEFAULT_SCAFFOLDING_CONFIG, DEFAULT_ZPD_CONFIG, DIFFICULTY_LEVEL_ORDER, type DifficultyLevel, EXTRANEOUS_LOAD_INDICATORS, type EngagementPrediction, type EnhancedBloomsResult, GERMANE_LOAD_INDICATORS, GRADUAL_RELEASE_INDICATORS, type GradualReleaseAnalysis, type GradualReleasePhase, INTRINSIC_LOAD_INDICATORS, type KnowledgeGap, type LearningVelocity, type MasteryLevel, type PedagogicalContent, type PedagogicalEvaluationResult, type PedagogicalEvaluator, type PedagogicalIssue, PedagogicalPipeline, type PedagogicalPipelineConfig, type PedagogicalPipelineFullConfig, type PedagogicalPipelineResult, type PerformanceMetrics, type PersonalizationFit, type PersonalizationOpportunity, type PrerequisiteCoverage, type PriorContentSummary, SUB_LEVEL_ABSTRACTION_INDICATORS, SUB_LEVEL_COMPLEXITY_INDICATORS, SUB_LEVEL_NOVELTY_INDICATORS, SUB_LEVEL_TRANSFER_INDICATORS, SUPPORT_INDICATORS, SUPPORT_TYPES, ScaffoldingEvaluator, type ScaffoldingEvaluatorConfig, type ScaffoldingEvaluatorResult, type StudentCognitiveProfile, SubLevelAnalyzer, type SubLevelIndicator, type SubLevelIndicatorType, type SupportAdequacy, type SupportStructure, type VerbAnalysis, ZONE_ENGAGEMENT_MAP, ZPDEvaluator, type ZPDEvaluatorConfig, type ZPDEvaluatorResult, type ZPDZone, ZPD_ZONE_RANGES, calculateBloomsNumericScore, createBloomsAligner, createBloomsLabel, createBloomsPipeline, createCognitiveLoadAnalyzer, createLenientBloomsAligner, createLenientScaffoldingEvaluator, createLenientZPDEvaluator, createPedagogicalPipeline, createScaffoldingEvaluator, createScaffoldingPipeline, createStrictBloomsAligner, createStrictPedagogicalPipeline, createStrictScaffoldingEvaluator, createStrictZPDEvaluator, createSubLevelAnalyzer, createZPDEvaluator, createZPDPipeline, determineSubLevelFromIndicators, evaluatePedagogically, getBloomsLevelIndex, getBloomsSubLevelIndex, getDifficultyLevelIndex };
