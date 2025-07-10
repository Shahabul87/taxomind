// Dynamic Content Reordering Types

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  originalPosition: number;
  currentPosition: number;
  metadata: ContentMetadata;
  adaptiveFactors: AdaptiveFactors;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType = 
  | 'video'
  | 'text'
  | 'quiz'
  | 'assignment'
  | 'interactive'
  | 'document'
  | 'discussion'
  | 'exercise';

export interface ContentMetadata {
  difficulty: DifficultyLevel;
  duration: number; // minutes
  cognitiveLoad: CognitiveLoad;
  bloomsLevel: BloomsLevel;
  learningObjectives: string[];
  tags: string[];
  prerequisites: string[];
  concepts: string[];
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CognitiveLoad = 'low' | 'medium' | 'high';
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface AdaptiveFactors {
  completionRate: number; // 0-1
  engagementScore: number; // 0-100
  difficultyRating: number; // 0-1
  timeToComplete: number; // minutes
  struggleIndicators: StruggleIndicator[];
  successRate: number; // 0-1
  skipRate: number; // 0-1
  replayRate: number; // 0-1
  feedbackScore: number; // 0-5
}

export interface StruggleIndicator {
  type: StruggleType;
  severity: number; // 0-1
  frequency: number;
  lastOccurrence: Date;
  affectedStudents: number;
}

export type StruggleType = 
  | 'high_pause_frequency'
  | 'multiple_seeks'
  | 'extended_time'
  | 'low_quiz_scores'
  | 'high_replay_count'
  | 'frequent_navigation_away'
  | 'low_engagement_signals';

export interface StudentProfile {
  id: string;
  learningStyle: LearningStyle;
  pace: LearningPace;
  preferences: LearningPreferences;
  performance: PerformanceMetrics;
  context: LearningContext;
  adaptationHistory: AdaptationRecord[];
}

export interface LearningStyle {
  visual: number; // 0-1
  auditory: number; // 0-1
  kinesthetic: number; // 0-1
  reading: number; // 0-1
  sequential: number; // 0-1
  global: number; // 0-1
}

export type LearningPace = 'slow' | 'normal' | 'fast' | 'adaptive';

export interface LearningPreferences {
  contentTypePreference: Record<ContentType, number>; // 0-1
  difficultyPreference: DifficultyLevel;
  sessionLength: number; // preferred minutes
  timeOfDay: number[]; // 24-hour distribution
  breakFrequency: number; // minutes between breaks
  interactivityLevel: number; // 0-1
}

export interface PerformanceMetrics {
  averageCompletionRate: number; // 0-1
  averageEngagementScore: number; // 0-100
  averageQuizScore: number; // 0-100
  learningVelocity: number; // concepts per day
  retentionRate: number; // 0-1
  consistencyScore: number; // 0-1
  strugglingAreas: string[];
  strengths: string[];
}

export interface LearningContext {
  currentCourse: string;
  timeConstraints: TimeConstraints;
  goals: LearningGoal[];
  distractions: DistractionLevel;
  motivation: MotivationLevel;
  energy: EnergyLevel;
  session: SessionContext;
}

export interface TimeConstraints {
  totalTimeAvailable: number; // minutes
  sessionTimeLimit: number; // minutes
  deadline?: Date;
  urgency: 'low' | 'medium' | 'high';
}

export interface LearningGoal {
  type: GoalType;
  target: string;
  priority: number; // 0-1
  deadline?: Date;
  progress: number; // 0-1
}

export type GoalType = 
  | 'completion'
  | 'mastery'
  | 'time_based'
  | 'skill_acquisition'
  | 'certification';

export type DistractionLevel = 'low' | 'medium' | 'high';
export type MotivationLevel = 'low' | 'medium' | 'high';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface SessionContext {
  startTime: Date;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  deviceType: 'desktop' | 'tablet' | 'mobile';
  location: 'home' | 'work' | 'transit' | 'other';
  networkQuality: 'poor' | 'good' | 'excellent';
}

export interface ReorderingStrategy {
  id: string;
  name: string;
  description: string;
  algorithm: ReorderingAlgorithm;
  parameters: ReorderingParameters;
  applicabilityRules: ApplicabilityRule[];
  effectiveness: EffectivenessMetrics;
}

export type ReorderingAlgorithm = 
  | 'difficulty_adaptive'
  | 'engagement_optimized'
  | 'time_constrained'
  | 'learning_style_matched'
  | 'prerequisite_optimized'
  | 'spaced_repetition'
  | 'cognitive_load_balanced'
  | 'performance_based'
  | 'hybrid_multi_factor';

export interface ReorderingParameters {
  weights: ReorderingWeights;
  constraints: ReorderingConstraints;
  optimization: OptimizationSettings;
}

export interface ReorderingWeights {
  difficulty: number; // 0-1
  engagement: number; // 0-1
  prerequisite: number; // 0-1
  learningStyle: number; // 0-1
  timeConstraint: number; // 0-1
  cognitiveLoad: number; // 0-1
  performance: number; // 0-1
  novelty: number; // 0-1
}

export interface ReorderingConstraints {
  maxPositionShift: number; // maximum positions to move
  preserveSequentialContent: boolean;
  respectHardPrerequisites: boolean;
  maintainOriginalFlow: number; // 0-1, how much to preserve
  maxCognitiveLoad: CognitiveLoad;
  sessionTimeLimit: number; // minutes
}

export interface OptimizationSettings {
  objective: OptimizationObjective;
  iterations: number;
  convergenceThreshold: number;
  randomSeed?: number;
}

export type OptimizationObjective = 
  | 'maximize_completion'
  | 'maximize_engagement'
  | 'minimize_time'
  | 'maximize_retention'
  | 'balance_load'
  | 'adaptive_goal';

export interface ApplicabilityRule {
  condition: RuleCondition;
  weight: number; // 0-1
  description: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  context?: 'student' | 'content' | 'session' | 'course';
}

export interface EffectivenessMetrics {
  completionImprovement: number; // percentage improvement
  engagementImprovement: number; // percentage improvement
  timeReduction: number; // percentage reduction
  studentSatisfaction: number; // 0-5
  usageFrequency: number; // times used per week
  successRate: number; // 0-1
}

export interface ContentSequence {
  id: string;
  studentId: string;
  courseId: string;
  originalSequence: ContentItem[];
  adaptedSequence: ContentItem[];
  strategy: ReorderingStrategy;
  adaptations: ContentAdaptation[];
  performance: SequencePerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentAdaptation {
  contentId: string;
  adaptationType: AdaptationType;
  originalPosition: number;
  newPosition: number;
  reason: AdaptationReason;
  confidence: number; // 0-1
  expectedImpact: ExpectedImpact;
  timestamp: Date;
}

export type AdaptationType = 
  | 'reorder'
  | 'substitute'
  | 'skip'
  | 'duplicate'
  | 'break_insertion'
  | 'difficulty_adjustment'
  | 'format_change';

export interface AdaptationReason {
  primary: ReasonType;
  secondary?: ReasonType[];
  description: string;
  data: Record<string, any>;
}

export type ReasonType = 
  | 'difficulty_mismatch'
  | 'learning_style_preference'
  | 'low_engagement'
  | 'time_constraint'
  | 'prerequisite_gap'
  | 'cognitive_overload'
  | 'performance_issue'
  | 'preference_alignment';

export interface ExpectedImpact {
  engagement: number; // -1 to 1
  completion: number; // -1 to 1
  comprehension: number; // -1 to 1
  time: number; // -1 to 1
  satisfaction: number; // -1 to 1
}

export interface SequencePerformance {
  completionRate: number; // 0-1
  averageEngagementScore: number; // 0-100
  totalTime: number; // minutes
  dropoffPoints: DropoffPoint[];
  satisfactionScore: number; // 0-5
  adaptationEffectiveness: number; // 0-1
}

export interface DropoffPoint {
  contentId: string;
  position: number;
  dropoffRate: number; // 0-1
  reasons: string[];
}

export interface AdaptationRecord {
  id: string;
  timestamp: Date;
  contentId: string;
  adaptationType: AdaptationType;
  reason: AdaptationReason;
  outcome: AdaptationOutcome;
  studentFeedback?: StudentFeedback;
}

export interface AdaptationOutcome {
  success: boolean;
  engagementChange: number; // -1 to 1
  completionChange: number; // -1 to 1
  timeChange: number; // -1 to 1
  satisfactionChange: number; // -1 to 1
  learnedPref: LearnedPreference[];
}

export interface LearnedPreference {
  type: PreferenceType;
  value: any;
  confidence: number; // 0-1
  context: string[];
}

export type PreferenceType = 
  | 'content_type'
  | 'difficulty_level'
  | 'session_length'
  | 'break_frequency'
  | 'interaction_style';

export interface StudentFeedback {
  rating: number; // 1-5
  helpful: boolean;
  tooEasy: boolean;
  tooHard: boolean;
  confusing: boolean;
  engaging: boolean;
  comments?: string;
  timestamp: Date;
}

export interface ReorderingRequest {
  studentId: string;
  courseId: string;
  chapterId?: string;
  sectionId?: string;
  context: RequestContext;
  constraints?: ReorderingConstraints;
  preferences?: StudentPreferences;
}

export interface RequestContext {
  sessionTime: number; // available minutes
  currentProgress: number; // 0-1
  recentPerformance: RecentPerformance;
  immediateGoals: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface RecentPerformance {
  lastSessionEngagement: number; // 0-100
  recentCompletionRate: number; // 0-1
  strugglingTopics: string[];
  strongTopics: string[];
  learningTrend: 'improving' | 'stable' | 'declining';
}

export interface StudentPreferences {
  skipCompleted: boolean;
  prioritizeDifficult: boolean;
  preferShortSessions: boolean;
  emphasizeWeakAreas: boolean;
  maintainOriginalOrder: boolean;
}

export interface ReorderingResult {
  sequence: ContentSequence;
  rationale: ReorderingRationale;
  estimatedImpact: EstimatedImpact;
  alternatives?: AlternativeSequence[];
}

export interface ReorderingRationale {
  strategy: string;
  keyFactors: KeyFactor[];
  tradeoffs: Tradeoff[];
  confidence: number; // 0-1
}

export interface KeyFactor {
  factor: string;
  importance: number; // 0-1
  influence: number; // -1 to 1
  description: string;
}

export interface Tradeoff {
  aspect: string;
  benefit: string;
  cost: string;
  netImpact: number; // -1 to 1
}

export interface EstimatedImpact {
  completionProbability: number; // 0-1
  engagementScore: number; // 0-100
  learningEfficiency: number; // 0-1
  timeToCompletion: number; // minutes
  retentionProbability: number; // 0-1
}

export interface AlternativeSequence {
  sequence: ContentItem[];
  strategy: string;
  score: number; // 0-1
  description: string;
}

export interface ReorderingAnalytics {
  totalAdaptations: number;
  successRate: number; // 0-1
  averageImprovement: ImprovementMetrics;
  strategyEffectiveness: Record<ReorderingAlgorithm, number>;
  studentSatisfaction: number; // 0-5
  adoptionRate: number; // 0-1
  trends: AnalyticsTrend[];
}

export interface ImprovementMetrics {
  engagement: number; // percentage improvement
  completion: number; // percentage improvement
  time: number; // percentage improvement
  retention: number; // percentage improvement
}

export interface AnalyticsTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // percentage per week
  significance: number; // 0-1
}