/**
 * Metacognition Engine Types
 *
 * Types for self-reflection, learning awareness, study habit analysis,
 * and learning strategy recommendations.
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface MetacognitionEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  /** Enable AI-powered reflection generation */
  enableAIReflection?: boolean;
  /** Default reflection depth */
  defaultReflectionDepth?: ReflectionDepth;
  /** Enable study habit tracking */
  enableHabitTracking?: boolean;
  /** Calibration threshold for confidence accuracy */
  calibrationThreshold?: number;
}

// ============================================================================
// ENUMS AND BASIC TYPES
// ============================================================================

export type ReflectionDepth = 'SHALLOW' | 'MODERATE' | 'DEEP';

export type ReflectionType =
  | 'PRE_LEARNING'      // Before starting a topic
  | 'DURING_LEARNING'   // While learning
  | 'POST_LEARNING'     // After completing a topic
  | 'EXAM_PREP'         // Before an assessment
  | 'POST_EXAM'         // After an assessment
  | 'WEEKLY_REVIEW'     // Weekly reflection
  | 'GOAL_CHECK'        // Goal progress check
  | 'STRUGGLE_POINT';   // When encountering difficulty

export type MetacognitiveSkill =
  | 'PLANNING'          // Setting goals and strategies
  | 'MONITORING'        // Tracking understanding
  | 'EVALUATING'        // Assessing performance
  | 'REGULATING'        // Adjusting strategies
  | 'SELF_QUESTIONING'  // Asking oneself questions
  | 'ELABORATION'       // Connecting to prior knowledge
  | 'ORGANIZATION'      // Structuring information
  | 'TIME_MANAGEMENT';  // Managing study time

export type LearningStrategy =
  | 'SPACED_PRACTICE'       // Distributed practice over time
  | 'INTERLEAVING'          // Mixing different topics
  | 'RETRIEVAL_PRACTICE'    // Active recall
  | 'ELABORATIVE_INTERROGATION' // Asking why/how
  | 'SELF_EXPLANATION'      // Explaining to oneself
  | 'SUMMARIZATION'         // Creating summaries
  | 'VISUALIZATION'         // Using mental imagery
  | 'DUAL_CODING'           // Combining verbal and visual
  | 'CONCRETE_EXAMPLES'     // Using specific examples
  | 'PRACTICE_TESTING'      // Self-testing
  | 'HIGHLIGHTING'          // Marking important info (less effective)
  | 'REREADING';            // Reading again (less effective)

export type StudyHabitCategory =
  | 'TIME_ALLOCATION'
  | 'ENVIRONMENT'
  | 'FOCUS_MANAGEMENT'
  | 'BREAK_PATTERNS'
  | 'CONTENT_ENGAGEMENT'
  | 'REVIEW_FREQUENCY';

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export type CognitiveLoadLevel = 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';

// ============================================================================
// REFLECTION TYPES
// ============================================================================

/**
 * A reflection prompt for the learner
 */
export interface ReflectionPrompt {
  id: string;
  type: ReflectionType;
  depth: ReflectionDepth;
  /** The main question or prompt */
  question: string;
  /** Follow-up questions for deeper reflection */
  followUpQuestions: string[];
  /** Metacognitive skill being targeted */
  targetSkill: MetacognitiveSkill;
  /** Suggested time for reflection (minutes) */
  suggestedTimeMinutes: number;
  /** Context that triggered this reflection */
  context?: ReflectionContext;
  /** Expected response type */
  responseType: 'TEXT' | 'RATING' | 'MULTIPLE_CHOICE' | 'CHECKLIST';
  /** Options for non-text responses */
  options?: string[];
}

export interface ReflectionContext {
  courseId?: string;
  chapterId?: string;
  topicName?: string;
  activityType?: string;
  performanceLevel?: number;
  timeSpentMinutes?: number;
  difficultyEncountered?: boolean;
}

/**
 * A learner's response to a reflection prompt
 */
export interface ReflectionResponse {
  promptId: string;
  userId: string;
  response: string | number | string[];
  /** Time taken to respond (seconds) */
  responseTimeSeconds: number;
  /** Self-reported confidence in reflection quality */
  reflectionConfidence?: ConfidenceLevel;
  timestamp: Date;
}

/**
 * Analysis of a reflection response
 */
export interface ReflectionAnalysis {
  promptId: string;
  userId: string;
  /** Depth of reflection detected */
  reflectionDepth: ReflectionDepth;
  /** Metacognitive skills demonstrated */
  skillsShown: MetacognitiveSkill[];
  /** Key insights extracted */
  keyInsights: string[];
  /** Areas for growth */
  growthAreas: string[];
  /** Quality score (0-100) */
  qualityScore: number;
  /** Sentiment of reflection */
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
  /** Actionable items identified */
  actionItems: ActionItem[];
}

export interface ActionItem {
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: MetacognitiveSkill;
  suggestedDeadline?: Date;
}

// ============================================================================
// STUDY HABIT TYPES
// ============================================================================

/**
 * A study session record
 */
export interface StudySession {
  id: string;
  userId: string;
  courseId?: string;
  /** Start time */
  startedAt: Date;
  /** End time */
  endedAt?: Date;
  /** Duration in minutes */
  durationMinutes: number;
  /** Breaks taken */
  breaks: StudyBreak[];
  /** Focus level self-assessment */
  focusLevel?: ConfidenceLevel;
  /** Topics covered */
  topicsCovered: string[];
  /** Strategies used */
  strategiesUsed: LearningStrategy[];
  /** Environment factors */
  environment?: StudyEnvironment;
  /** Session outcome */
  outcome?: SessionOutcome;
}

export interface StudyBreak {
  startedAt: Date;
  durationMinutes: number;
  type: 'SHORT' | 'LONG' | 'UNPLANNED';
  activity?: string;
}

export interface StudyEnvironment {
  location: 'HOME' | 'LIBRARY' | 'CAFE' | 'CLASSROOM' | 'OTHER';
  noiseLevel: 'SILENT' | 'QUIET' | 'MODERATE' | 'NOISY';
  distractions: string[];
  deviceUsed: 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE';
  timeOfDay: 'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
}

export interface SessionOutcome {
  goalsAchieved: boolean;
  comprehensionLevel: ConfidenceLevel;
  satisfactionLevel: ConfidenceLevel;
  notesOrReflection?: string;
}

/**
 * Analysis of study habits over time
 */
export interface StudyHabitAnalysis {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  /** Total study time in hours */
  totalStudyHours: number;
  /** Average session duration */
  averageSessionMinutes: number;
  /** Sessions per week */
  sessionsPerWeek: number;
  /** Optimal study times detected */
  optimalStudyTimes: TimeSlot[];
  /** Most effective environments */
  effectiveEnvironments: StudyEnvironment[];
  /** Strategy effectiveness */
  strategyEffectiveness: StrategyEffectiveness[];
  /** Focus patterns */
  focusPatterns: FocusPattern;
  /** Break patterns */
  breakPatterns: BreakPattern;
  /** Habit scores by category */
  habitScores: Record<StudyHabitCategory, number>;
  /** Recommendations */
  recommendations: StudyHabitRecommendation[];
}

export interface TimeSlot {
  dayOfWeek: number;
  hourStart: number;
  hourEnd: number;
  effectivenessScore: number;
}

export interface StrategyEffectiveness {
  strategy: LearningStrategy;
  usageFrequency: number;
  effectivenessScore: number;
  retentionImpact: number;
  recommendedFor: BloomsLevel[];
}

export interface FocusPattern {
  averageFocusDuration: number;
  focusDeclineRate: number;
  peakFocusTime: string;
  distractionTriggers: string[];
}

export interface BreakPattern {
  averageBreakFrequency: number;
  averageBreakDuration: number;
  optimalBreakInterval: number;
  breakEffectiveness: number;
}

export interface StudyHabitRecommendation {
  category: StudyHabitCategory;
  currentState: string;
  recommendation: string;
  expectedImpact: 'high' | 'medium' | 'low';
  actionSteps: string[];
  resources?: string[];
}

// ============================================================================
// LEARNING STRATEGY TYPES
// ============================================================================

/**
 * Learning strategy profile for a user
 */
export interface StrategyProfile {
  userId: string;
  /** Preferred strategies */
  preferredStrategies: LearningStrategy[];
  /** Strategy usage history */
  strategyHistory: StrategyUsage[];
  /** Strategy effectiveness by content type */
  effectivenessByContent: ContentStrategyMatch[];
  /** Recommended strategies to try */
  recommendedStrategies: StrategyRecommendation[];
  /** Strategy diversity score */
  diversityScore: number;
  updatedAt: Date;
}

export interface StrategyUsage {
  strategy: LearningStrategy;
  courseId?: string;
  usedAt: Date;
  durationMinutes: number;
  selfRatedEffectiveness?: ConfidenceLevel;
  actualPerformanceImpact?: number;
}

export interface ContentStrategyMatch {
  contentType: string;
  bloomsLevel: BloomsLevel;
  effectiveStrategies: LearningStrategy[];
  ineffectiveStrategies: LearningStrategy[];
}

export interface StrategyRecommendation {
  strategy: LearningStrategy;
  reason: string;
  howToApply: string;
  expectedBenefit: string;
  difficultyToAdopt: 'easy' | 'moderate' | 'challenging';
  evidenceBase: 'strong' | 'moderate' | 'emerging';
}

// ============================================================================
// SELF-ASSESSMENT TYPES
// ============================================================================

/**
 * Knowledge confidence assessment
 */
export interface KnowledgeConfidenceAssessment {
  id: string;
  userId: string;
  courseId?: string;
  topicId?: string;
  /** Items being assessed */
  items: ConfidenceItem[];
  /** Overall calibration score */
  calibrationScore: number;
  /** Overconfidence or underconfidence tendency */
  confidenceBias: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'WELL_CALIBRATED';
  assessedAt: Date;
}

export interface ConfidenceItem {
  concept: string;
  /** Self-reported confidence (1-5) */
  confidence: ConfidenceLevel;
  /** Actual performance (0-100) */
  actualPerformance?: number;
  /** Calibration gap */
  calibrationGap?: number;
}

/**
 * Cognitive load self-assessment
 */
export interface CognitiveLoadAssessment {
  userId: string;
  sessionId?: string;
  /** Current cognitive load level */
  currentLoad: CognitiveLoadLevel;
  /** Factors contributing to load */
  loadFactors: CognitiveLoadFactor[];
  /** Recommendations to optimize load */
  recommendations: LoadOptimizationRecommendation[];
  assessedAt: Date;
}

export interface CognitiveLoadFactor {
  factor: string;
  type: 'INTRINSIC' | 'EXTRANEOUS' | 'GERMANE';
  impact: 'high' | 'medium' | 'low';
  isManageable: boolean;
}

export interface LoadOptimizationRecommendation {
  action: string;
  targetFactor: string;
  expectedReduction: 'significant' | 'moderate' | 'slight';
  immediacy: 'immediate' | 'short_term' | 'long_term';
}

// ============================================================================
// GOAL SETTING AND MONITORING
// ============================================================================

/**
 * A learning goal set by the user
 */
export interface LearningGoal {
  id: string;
  userId: string;
  courseId?: string;
  /** Goal description */
  description: string;
  /** Goal type */
  type: GoalType;
  /** Target metric */
  targetMetric?: GoalMetric;
  /** Deadline */
  deadline?: Date;
  /** Milestones */
  milestones: GoalMilestone[];
  /** Current progress (0-100) */
  progress: number;
  /** Status */
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'PAUSED';
  /** Reflections on this goal */
  reflections: GoalReflection[];
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType =
  | 'MASTERY'           // Master a specific topic
  | 'COMPLETION'        // Complete a course/module
  | 'PERFORMANCE'       // Achieve a score target
  | 'HABIT'             // Build a study habit
  | 'SKILL'             // Develop a skill
  | 'TIME_BASED';       // Study for X hours

export interface GoalMetric {
  metricType: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

export interface GoalMilestone {
  id: string;
  description: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface GoalReflection {
  date: Date;
  reflection: string;
  progressAtTime: number;
  obstacles?: string[];
  adjustments?: string[];
}

/**
 * Goal monitoring result
 */
export interface GoalMonitoringResult {
  goalId: string;
  currentProgress: number;
  projectedCompletion: Date | null;
  isOnTrack: boolean;
  riskFactors: string[];
  suggestions: string[];
  motivationalMessage: string;
}

// ============================================================================
// METACOGNITIVE SKILL ASSESSMENT
// ============================================================================

/**
 * Assessment of metacognitive skills
 */
export interface MetacognitiveSkillAssessment {
  userId: string;
  /** Skills breakdown */
  skills: MetacognitiveSkillScore[];
  /** Overall metacognitive ability score */
  overallScore: number;
  /** Strengths */
  strengths: MetacognitiveSkill[];
  /** Areas for development */
  developmentAreas: MetacognitiveSkill[];
  /** Recommended exercises */
  exercises: MetacognitiveExercise[];
  assessedAt: Date;
}

export interface MetacognitiveSkillScore {
  skill: MetacognitiveSkill;
  score: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  evidenceSources: string[];
}

export interface MetacognitiveExercise {
  id: string;
  title: string;
  description: string;
  targetSkill: MetacognitiveSkill;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
}

// ============================================================================
// SELF-REGULATION TYPES
// ============================================================================

/**
 * Self-regulation tracking
 */
export interface SelfRegulationProfile {
  userId: string;
  /** Emotional regulation during learning */
  emotionalRegulation: EmotionalRegulationMetrics;
  /** Motivation regulation */
  motivationRegulation: MotivationRegulationMetrics;
  /** Attention regulation */
  attentionRegulation: AttentionRegulationMetrics;
  /** Overall self-regulation score */
  overallScore: number;
  /** Intervention history */
  interventions: RegulationIntervention[];
  updatedAt: Date;
}

export interface EmotionalRegulationMetrics {
  frustrationTolerance: number;
  anxietyManagement: number;
  confidenceStability: number;
  recoveryFromSetbacks: number;
}

export interface MotivationRegulationMetrics {
  intrinsicMotivation: number;
  goalPersistence: number;
  effortRegulation: number;
  interestMaintenance: number;
}

export interface AttentionRegulationMetrics {
  focusDuration: number;
  distractionResistance: number;
  taskSwitchingEfficiency: number;
  sustainedAttention: number;
}

export interface RegulationIntervention {
  type: 'EMOTIONAL' | 'MOTIVATION' | 'ATTENTION';
  triggeredAt: Date;
  trigger: string;
  intervention: string;
  effectiveness?: ConfidenceLevel;
}

// ============================================================================
// API INPUT/OUTPUT TYPES
// ============================================================================

export interface GenerateReflectionInput {
  userId: string;
  type: ReflectionType;
  depth?: ReflectionDepth;
  context?: ReflectionContext;
  /** Previous reflections for continuity */
  previousReflections?: ReflectionResponse[];
}

export interface GenerateReflectionResult {
  prompts: ReflectionPrompt[];
  suggestedSequence: string[];
  estimatedTimeMinutes: number;
}

export interface AnalyzeReflectionInput {
  response: ReflectionResponse;
  prompt: ReflectionPrompt;
  /** Historical context for comparison */
  historicalResponses?: ReflectionResponse[];
}

export interface RecordStudySessionInput {
  userId: string;
  courseId?: string;
  startedAt: Date;
  endedAt: Date;
  topicsCovered: string[];
  strategiesUsed?: LearningStrategy[];
  breaks?: StudyBreak[];
  environment?: StudyEnvironment;
  outcome?: SessionOutcome;
}

export interface GetHabitAnalysisInput {
  userId: string;
  courseId?: string;
  periodDays?: number;
}

export interface AssessConfidenceInput {
  userId: string;
  items: Array<{
    concept: string;
    confidence: ConfidenceLevel;
  }>;
  courseId?: string;
  topicId?: string;
}

export interface SetGoalInput {
  userId: string;
  description: string;
  type: GoalType;
  courseId?: string;
  targetMetric?: GoalMetric;
  deadline?: Date;
  milestones?: Array<{
    description: string;
    targetDate?: Date;
  }>;
}

export interface UpdateGoalProgressInput {
  goalId: string;
  userId: string;
  progress?: number;
  milestoneId?: string;
  reflection?: string;
}

export interface GetMetacognitiveAssessmentInput {
  userId: string;
  courseId?: string;
  /** Include detailed breakdown */
  detailed?: boolean;
}

export interface RecommendStrategiesInput {
  userId: string;
  courseId?: string;
  contentType?: string;
  bloomsLevel?: BloomsLevel;
  currentChallenges?: string[];
}

export interface RecommendStrategiesResult {
  recommendations: StrategyRecommendation[];
  currentStrategies: LearningStrategy[];
  underutilizedStrategies: LearningStrategy[];
  overusedStrategies: LearningStrategy[];
}

export interface AssessCognitiveLoadInput {
  userId: string;
  sessionId?: string;
  currentActivity?: string;
  selfReportedLoad?: CognitiveLoadLevel;
  recentPerformance?: number;
}
