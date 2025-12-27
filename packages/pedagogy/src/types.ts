/**
 * Pedagogical Evaluator Types
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Types for educational effectiveness validation
 */

// ============================================================================
// BLOOM'S TAXONOMY TYPES
// ============================================================================

/**
 * Bloom's taxonomy levels
 */
export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

/**
 * Bloom's level order (lowest to highest cognitive complexity)
 */
export const BLOOMS_LEVEL_ORDER: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

/**
 * Get numeric index of a Bloom's level (0-5)
 */
export function getBloomsLevelIndex(level: BloomsLevel): number {
  return BLOOMS_LEVEL_ORDER.indexOf(level);
}

/**
 * Bloom's distribution across levels
 */
export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

// ============================================================================
// DIFFICULTY TYPES
// ============================================================================

/**
 * Difficulty levels for content
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Difficulty level order
 */
export const DIFFICULTY_LEVEL_ORDER: DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];

/**
 * Get numeric index of difficulty level (0-3)
 */
export function getDifficultyLevelIndex(level: DifficultyLevel): number {
  return DIFFICULTY_LEVEL_ORDER.indexOf(level);
}

// ============================================================================
// STUDENT PROFILE TYPES
// ============================================================================

/**
 * Student's cognitive profile
 */
export interface StudentCognitiveProfile {
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
export interface MasteryLevel {
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
export type LearningVelocity = 'slow' | 'moderate' | 'fast' | 'accelerated';

/**
 * Knowledge gap identification
 */
export interface KnowledgeGap {
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
export interface PerformanceMetrics {
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

// ============================================================================
// CONTENT ANALYSIS TYPES
// ============================================================================

/**
 * Content to be evaluated pedagogically
 */
export interface PedagogicalContent {
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
export interface PriorContentSummary {
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

// ============================================================================
// EVALUATOR RESULT TYPES
// ============================================================================

/**
 * Base result for all pedagogical evaluators
 */
export interface PedagogicalEvaluationResult {
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
export interface PedagogicalIssue {
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

// ============================================================================
// BLOOM'S ALIGNER TYPES
// ============================================================================

/**
 * Result from Bloom's Aligner evaluation
 */
export interface BloomsAlignerResult extends PedagogicalEvaluationResult {
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
export interface VerbAnalysis {
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
export interface ActivityAnalysis {
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

// ============================================================================
// SCAFFOLDING EVALUATOR TYPES
// ============================================================================

/**
 * Result from Scaffolding Evaluator
 */
export interface ScaffoldingEvaluatorResult extends PedagogicalEvaluationResult {
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
export interface ComplexityProgression {
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
export interface ComplexityJump {
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
export interface PrerequisiteCoverage {
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
export interface SupportStructure {
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
export interface GradualReleaseAnalysis {
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
export type GradualReleasePhase =
  | 'I_DO'           // Teacher models
  | 'WE_DO'          // Guided practice
  | 'YOU_DO_TOGETHER' // Collaborative
  | 'YOU_DO_ALONE';   // Independent

// ============================================================================
// ZPD EVALUATOR TYPES
// ============================================================================

/**
 * Result from ZPD (Zone of Proximal Development) Evaluator
 */
export interface ZPDEvaluatorResult extends PedagogicalEvaluationResult {
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
export type ZPDZone =
  | 'TOO_EASY'       // Below current ability, boring
  | 'COMFORT_ZONE'   // Slightly below, easy practice
  | 'ZPD_LOWER'      // Lower ZPD, achievable with minimal help
  | 'ZPD_OPTIMAL'    // Optimal ZPD, challenging but achievable
  | 'ZPD_UPPER'      // Upper ZPD, challenging, needs support
  | 'FRUSTRATION'    // Above ZPD, too difficult
  | 'UNREACHABLE';   // Way beyond current ability

/**
 * Challenge level assessment
 */
export interface ChallengeLevel {
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
export interface ChallengeFactor {
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
export interface SupportAdequacy {
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
export interface EngagementPrediction {
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
export interface PersonalizationFit {
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
export interface PersonalizationOpportunity {
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

// ============================================================================
// EVALUATOR INTERFACE
// ============================================================================

/**
 * Base interface for pedagogical evaluators
 */
export interface PedagogicalEvaluator<T extends PedagogicalEvaluationResult> {
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
  evaluate(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): Promise<T>;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/**
 * Configuration for pedagogical evaluation pipeline
 */
export interface PedagogicalPipelineConfig {
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
export const DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG: Required<PedagogicalPipelineConfig> = {
  evaluators: ['blooms', 'scaffolding', 'zpd'],
  threshold: 70,
  parallel: true,
  timeoutMs: 10000,
  requireStudentProfile: false,
};

/**
 * Result from pedagogical pipeline
 */
export interface PedagogicalPipelineResult {
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
