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
 * Bloom's distribution across levels
 */
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
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
 * Configuration for Bloom's Aligner
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
    constructor(config?: ZPDEvaluatorConfig);
    /**
     * Evaluate content for ZPD fit
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<ZPDEvaluatorResult>;
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
     */
    private predictEngagement;
    /**
     * Analyze personalization fit
     */
    private analyzePersonalizationFit;
    /**
     * Calculate overall ZPD score
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

export { type ActivityAnalysis, BLOOMS_ACTIVITIES, BLOOMS_LEVEL_ORDER, BLOOMS_VERBS, BloomsAligner, type BloomsAlignerConfig, type BloomsAlignerResult, type BloomsDistribution, type BloomsLevel, COMPLEXITY_INDICATORS, type ChallengeFactor, type ChallengeLevel, type ComplexityJump, type ComplexityProgression, DEFAULT_BLOOMS_ALIGNER_CONFIG, DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG, DEFAULT_SCAFFOLDING_CONFIG, DEFAULT_ZPD_CONFIG, DIFFICULTY_LEVEL_ORDER, type DifficultyLevel, type EngagementPrediction, GRADUAL_RELEASE_INDICATORS, type GradualReleaseAnalysis, type GradualReleasePhase, type KnowledgeGap, type LearningVelocity, type MasteryLevel, type PedagogicalContent, type PedagogicalEvaluationResult, type PedagogicalEvaluator, type PedagogicalIssue, PedagogicalPipeline, type PedagogicalPipelineConfig, type PedagogicalPipelineFullConfig, type PedagogicalPipelineResult, type PerformanceMetrics, type PersonalizationFit, type PersonalizationOpportunity, type PrerequisiteCoverage, type PriorContentSummary, SUPPORT_INDICATORS, SUPPORT_TYPES, ScaffoldingEvaluator, type ScaffoldingEvaluatorConfig, type ScaffoldingEvaluatorResult, type StudentCognitiveProfile, type SupportAdequacy, type SupportStructure, type VerbAnalysis, ZONE_ENGAGEMENT_MAP, ZPDEvaluator, type ZPDEvaluatorConfig, type ZPDEvaluatorResult, type ZPDZone, ZPD_ZONE_RANGES, createBloomsAligner, createBloomsPipeline, createLenientBloomsAligner, createLenientScaffoldingEvaluator, createLenientZPDEvaluator, createPedagogicalPipeline, createScaffoldingEvaluator, createScaffoldingPipeline, createStrictBloomsAligner, createStrictPedagogicalPipeline, createStrictScaffoldingEvaluator, createStrictZPDEvaluator, createZPDEvaluator, createZPDPipeline, evaluatePedagogically, getBloomsLevelIndex, getDifficultyLevelIndex };
