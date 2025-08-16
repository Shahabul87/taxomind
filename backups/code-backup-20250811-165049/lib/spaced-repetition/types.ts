// Spaced Repetition Optimization Engine Types

export interface SpacedRepetitionResult {
  id: string;
  studentId: string;
  contentId: string;
  courseId: string;
  sessionId: string;
  timestamp: Date;
  repetitionState: RepetitionState;
  memoryStrength: MemoryStrength;
  reviewSchedule: ReviewSchedule;
  performanceMetrics: PerformanceMetrics;
  adaptationFactors: AdaptationFactors;
  predictions: RepetitionPredictions;
  recommendations: RepetitionRecommendations;
  metadata: RepetitionMetadata;
}

export interface RepetitionState {
  currentInterval: number; // days
  nextReviewDate: Date;
  reviewCount: number;
  totalReviews: number;
  easeFactor: number; // SuperMemo algorithm factor
  stability: number; // memory stability
  retrievability: number; // current retrievability (0-1)
  difficulty: number; // content difficulty for this student
  lastPerformance: ReviewPerformance;
  streakCount: number;
  masteryLevel: MasteryLevel;
}

export interface MemoryStrength {
  shortTermRetention: number; // 0-1
  longTermRetention: number; // 0-1
  retrievalStrength: number; // 0-1
  storageStrength: number; // 0-1
  forgettingCurve: ForgettingCurveData;
  retentionProbability: number; // 0-1
  memoryConsolidation: ConsolidationMetrics;
  interferenceLevel: number; // 0-1
}

export interface ReviewSchedule {
  scheduledDate: Date;
  optimalInterval: number; // days
  intervalRange: IntervalRange;
  priority: ReviewPriority;
  adaptiveAdjustments: ScheduleAdjustment[];
  reminders: ReminderSettings;
  batchingRecommendations: BatchingStrategy;
  contextualTiming: ContextualTimingData;
}

export interface PerformanceMetrics {
  accuracy: number; // 0-1
  responseTime: number; // milliseconds
  confidence: number; // 0-1
  effort: EffortLevel;
  retentionQuality: RetentionQuality;
  learningVelocity: number; // items per hour
  errorPattern: ErrorAnalysis;
  improvementTrend: TrendAnalysis;
}

export interface AdaptationFactors {
  personalLearningRate: number;
  cognitiveLoad: number; // 0-1
  attentionLevel: number; // 0-1
  motivationLevel: number; // 0-1
  timeOfDay: TimeOfDayFactors;
  environmentalFactors: EnvironmentalFactors;
  personalPreferences: LearningPreferences;
  biometricData: BiometricFactors;
}

export interface RepetitionPredictions {
  forgettingRisk: RiskLevel;
  optimalReviewTime: Date;
  retentionProbability24h: number;
  retentionProbability1week: number;
  retentionProbability1month: number;
  masteryTimeline: MasteryTimeline;
  difficultyProgression: QuestionDifficultyProgression;
  interferenceRisk: InterferenceRisk;
}

export interface RepetitionRecommendations {
  immediateActions: ImmediateAction[];
  studyStrategies: StudyStrategy[];
  reviewTechniques: ReviewTechnique[];
  contentModifications: ContentModification[];
  scheduleAdjustments: ScheduleAdjustment[];
  motivationalInterventions: MotivationalIntervention[];
  cognitiveSupports: CognitiveSupport[];
  metacognitiveGuidance: MetacognitiveGuidance[];
}

export interface RepetitionMetadata {
  algorithm: RepetitionAlgorithm;
  modelVersion: string;
  confidenceScore: number;
  processingTime: number;
  dataQuality: DataQualityMetrics;
  adaptationHistory: AdaptationEvent[];
  experimentalFlags: ExperimentalFeature[];
  privacySettings: PrivacySettings;
}

// Supporting types

export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';

export type ReviewPriority = 'urgent' | 'high' | 'medium' | 'low' | 'optional';

export type EffortLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'maximum';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type RepetitionAlgorithm = 'sm2' | 'sm17' | 'fsrs' | 'anki' | 'adaptive_hybrid';

export interface ReviewPerformance {
  correct: boolean;
  responseTime: number;
  confidence: number;
  difficulty: number; // subjective difficulty (1-5)
  quality: number; // response quality (0-5)
  mistakes: MistakeType[];
  hints: number;
  attempts: number;
}

export interface ForgettingCurveData {
  initialStrength: number;
  decayRate: number;
  asymptote: number;
  halfLife: number; // days
  curve: CurvePoint[];
  personalizedFactors: PersonalizedFactors;
}

export interface ConsolidationMetrics {
  consolidationStrength: number; // 0-1
  synapticStability: number; // 0-1
  interferenceResistance: number; // 0-1
  transferPotential: number; // 0-1
}

export interface IntervalRange {
  minimum: number; // days
  optimal: number; // days
  maximum: number; // days
  confidence: number; // 0-1
}

export interface ScheduleAdjustment {
  type: AdjustmentType;
  reason: AdjustmentReason;
  magnitude: number; // factor to multiply interval
  confidence: number;
  validUntil: Date;
  conditions: AdjustmentCondition[];
}

export interface ReminderSettings {
  enabled: boolean;
  preferredTimes: TimeSlot[];
  channels: ReminderChannel[];
  frequency: ReminderFrequency;
  adaptiveSpacing: boolean;
  motivationalContent: boolean;
}

export interface BatchingStrategy {
  optimalBatchSize: number;
  batchingType: BatchingType;
  interleaving: InterleavingStrategy;
  spacing: BatchSpacing;
  cognitiveLoadBalancing: boolean;
}

export interface ContextualTimingData {
  optimalDayOfWeek: number[]; // 0-6 (Sunday-Saturday)
  optimalTimeOfDay: TimeSlot[];
  durationRecommendation: number; // minutes
  breakRecommendations: BreakStrategy;
  environmentalOptimization: EnvironmentalOptimization;
}

export interface RetentionQuality {
  depth: number; // 0-1 (surface to deep)
  durability: number; // 0-1 (fragile to robust)
  flexibility: number; // 0-1 (rigid to flexible)
  transferability: number; // 0-1 (context-specific to generalizable)
}

export interface ErrorAnalysis {
  errorTypes: ErrorType[];
  errorFrequency: number;
  errorSeverity: number; // 0-1
  errorPersistence: number; // 0-1
  correctiveActions: CorrectiveAction[];
}

export interface TrendAnalysis {
  direction: TrendDirection;
  magnitude: number;
  confidence: number;
  timeframe: number; // days
  stability: number; // 0-1
}

export interface TimeOfDayFactors {
  morningPerformance: number; // 0-1
  afternoonPerformance: number; // 0-1
  eveningPerformance: number; // 0-1
  circadianAlignment: number; // 0-1
  chronotype: Chronotype;
}

export interface EnvironmentalFactors {
  noiseLevel: number; // 0-1
  lighting: LightingCondition;
  temperature: TemperatureRange;
  distraction: DistractionLevel;
  social: SocialEnvironment;
}

export interface LearningPreferences {
  preferredModality: LearningModality[];
  preferredPacing: PacingPreference;
  preferredQuestionDifficulty: QuestionDifficultyPreference;
  feedbackPreference: FeedbackPreference;
  motivationalPreference: MotivationalPreference;
}

export interface BiometricFactors {
  heartRateVariability: number;
  stressLevel: number; // 0-1
  alertnessLevel: number; // 0-1
  fatigueLevel: number; // 0-1
  cognitiveLoad: number; // 0-1
}

export interface MasteryTimeline {
  currentProgress: number; // 0-1
  estimatedCompletion: Date;
  milestones: MasteryMilestone[];
  accelerationFactors: AccelerationFactor[];
  riskFactors: RiskFactor[];
}

export interface QuestionDifficultyProgression {
  currentQuestionDifficulty: number; // 0-1
  targetQuestionDifficulty: number; // 0-1
  progression: ProgressionStep[];
  adaptiveScaling: boolean;
  prerequisiteGaps: PrerequisiteGap[];
}

export interface InterferenceRisk {
  level: RiskLevel;
  sources: InterferenceSource[];
  mitigation: InterferenceMitigation[];
  monitoring: InterferenceMonitoring;
}

// Action and strategy types

export interface ImmediateAction {
  type: ActionType;
  priority: ActionPriority;
  description: string;
  instructions: string[];
  expectedOutcome: string;
  timeframe: number; // minutes
  effort: EffortLevel;
}

export interface StudyStrategy {
  name: string;
  type: StrategyType;
  description: string;
  effectiveness: number; // 0-1
  applicability: number; // 0-1
  personalizedInstructions: string[];
  resources: LearningResource[];
}

export interface ReviewTechnique {
  technique: TechniqueType;
  description: string;
  instructions: string[];
  effectiveness: number; // 0-1
  cognitiveLoad: number; // 0-1
  timeRequired: number; // minutes
}

export interface ContentModification {
  type: ModificationType;
  description: string;
  justification: string;
  implementation: string[];
  expectedImpact: ImpactMetrics;
}

export interface MotivationalIntervention {
  type: InterventionType;
  target: MotivationalTarget;
  strategy: MotivationalStrategy;
  implementation: string[];
  successMetrics: SuccessMetric[];
}

export interface CognitiveSupport {
  type: SupportType;
  description: string;
  techniques: CognitiveTechnique[];
  tools: CognitiveTool[];
  implementation: string[];
}

export interface MetacognitiveGuidance {
  area: MetacognitiveArea;
  guidance: string[];
  reflectionPrompts: string[];
  selfAssessment: SelfAssessmentTool[];
  strategies: MetacognitiveStrategy[];
}

// Enum types

export type AdjustmentType = 'interval_increase' | 'interval_decrease' | 'schedule_shift' | 'priority_change' | 'technique_change';

export type AdjustmentReason = 'performance_improvement' | 'performance_decline' | 'cognitive_overload' | 'schedule_conflict' | 'motivation_change' | 'environmental_change';

export type ReminderChannel = 'push_notification' | 'email' | 'sms' | 'in_app' | 'calendar';

export type ReminderFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'custom';

export type BatchingType = 'homogeneous' | 'heterogeneous' | 'difficulty_based' | 'topic_based' | 'adaptive';

export type InterleavingStrategy = 'random' | 'blocked' | 'spaced' | 'adaptive' | 'difficulty_based';

export type BatchSpacing = 'massed' | 'distributed' | 'expanding' | 'contracting' | 'adaptive';

export type BreakStrategy = 'microbreaks' | 'active_rest' | 'meditation' | 'physical_activity' | 'none';

export type ErrorType = 'conceptual' | 'procedural' | 'factual' | 'application' | 'transfer' | 'attention' | 'memory';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile' | 'unknown';

export type Chronotype = 'morning_lark' | 'evening_owl' | 'intermediate' | 'unknown';

export type LightingCondition = 'natural' | 'artificial_bright' | 'artificial_dim' | 'mixed' | 'optimal';

export type DistractionLevel = 'none' | 'minimal' | 'moderate' | 'high' | 'extreme';

export type SocialEnvironment = 'alone' | 'with_peers' | 'with_instructor' | 'group_study' | 'collaborative';

export type LearningModality = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal';

export type PacingPreference = 'self_paced' | 'structured' | 'adaptive' | 'accelerated' | 'deliberate';

export type QuestionDifficultyPreference = 'gradual' | 'challenging' | 'adaptive' | 'consistent' | 'variable';

export type FeedbackPreference = 'immediate' | 'delayed' | 'detailed' | 'summary' | 'minimal';

export type MotivationalPreference = 'achievement' | 'mastery' | 'social' | 'autonomy' | 'purpose';

export type ActionType = 'review_now' | 'postpone_review' | 'change_technique' | 'seek_help' | 'take_break';

export type ActionPriority = 'immediate' | 'urgent' | 'high' | 'medium' | 'low';

export type StrategyType = 'elaboration' | 'organization' | 'rehearsal' | 'metacognitive' | 'resource_management';

export type TechniqueType = 'active_recall' | 'spaced_practice' | 'interleaving' | 'elaboration' | 'dual_coding' | 'testing_effect';

export type ModificationType = 'content_simplification' | 'content_enhancement' | 'format_change' | 'interaction_change' | 'pacing_adjustment';

export type InterventionType = 'goal_setting' | 'progress_visualization' | 'social_comparison' | 'reward_system' | 'autonomy_support';

export type MotivationalTarget = 'intrinsic_motivation' | 'extrinsic_motivation' | 'self_efficacy' | 'engagement' | 'persistence';

export type MotivationalStrategy = 'gamification' | 'personalization' | 'social_support' | 'progress_tracking' | 'choice_provision';

export type SupportType = 'memory_aid' | 'attention_support' | 'cognitive_load_reduction' | 'strategy_guidance' | 'error_prevention';

export type CognitiveTechnique = 'chunking' | 'mnemonics' | 'visualization' | 'association' | 'rehearsal';

export type CognitiveTool = 'concept_map' | 'flashcards' | 'outline' | 'diagram' | 'checklist';

export type MetacognitiveArea = 'planning' | 'monitoring' | 'evaluating' | 'strategy_selection' | 'self_awareness';

export type MetacognitiveStrategy = 'goal_setting' | 'self_questioning' | 'self_monitoring' | 'self_evaluation' | 'strategy_adjustment';

// Additional supporting interfaces

export interface CurvePoint {
  time: number; // hours since learning
  retention: number; // 0-1
}

export interface PersonalizedFactors {
  personalDecayRate: number;
  personalAsymptote: number;
  personalHalfLife: number;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  effectiveness: number; // 0-1
}

export interface AdjustmentCondition {
  parameter: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  weight: number;
}

export interface EnvironmentalOptimization {
  lighting: LightingRecommendation;
  noise: NoiseRecommendation;
  temperature: TemperatureRecommendation;
  workspace: WorkspaceRecommendation;
}

export interface MistakeType {
  category: ErrorType;
  severity: number; // 0-1
  frequency: number;
  persistence: number; // 0-1
}

export interface CorrectiveAction {
  action: string;
  priority: ActionPriority;
  effectiveness: number; // 0-1
  timeframe: number; // days
}

export interface TemperatureRange {
  min: number; // Celsius
  max: number; // Celsius
  optimal: number; // Celsius
}

export interface MasteryMilestone {
  name: string;
  description: string;
  targetDate: Date;
  completion: number; // 0-1
  prerequisites: string[];
}

export interface AccelerationFactor {
  factor: string;
  impact: number; // multiplier
  applicability: number; // 0-1
  implementation: string[];
}

export interface RiskFactor {
  factor: string;
  severity: RiskLevel;
  likelihood: number; // 0-1
  mitigation: string[];
}

export interface ProgressionStep {
  level: number;
  description: string;
  requirements: string[];
  timeframe: number; // days
}

export interface PrerequisiteGap {
  prerequisite: string;
  severity: number; // 0-1
  impact: number; // 0-1
  recommendations: string[];
}

export interface InterferenceSource {
  source: string;
  type: 'proactive' | 'retroactive' | 'lateral';
  strength: number; // 0-1
  mitigation: string[];
}

export interface InterferenceMitigation {
  strategy: string;
  effectiveness: number; // 0-1
  implementation: string[];
  monitoring: string[];
}

export interface InterferenceMonitoring {
  metrics: string[];
  frequency: string;
  thresholds: number[];
  alerts: AlertConfiguration[];
}

export interface LearningResource {
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  duration: number; // minutes
  difficulty: number; // 0-1
}

export interface ImpactMetrics {
  retentionImprovement: number; // expected % improvement
  learningSpeedIncrease: number; // expected % increase
  engagementIncrease: number; // expected % increase
  confidenceLevel: number; // 0-1
}

export interface SuccessMetric {
  metric: string;
  target: number;
  timeframe: number; // days
  measurement: string;
}

export interface SelfAssessmentTool {
  name: string;
  questions: string[];
  scale: AssessmentScale;
  frequency: string;
}

export interface DataQualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  relevance: number; // 0-1
}

export interface AdaptationEvent {
  timestamp: Date;
  trigger: string;
  change: string;
  outcome: string;
  success: boolean;
}

export interface ExperimentalFeature {
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  effectMeasurement: EffectMeasurement;
}

export interface PrivacySettings {
  dataRetention: number; // days
  anonymization: boolean;
  consentLevel: ConsentLevel;
  sharingPermissions: SharingPermission[];
}

// Additional enum types

export type ResourceType = 'video' | 'article' | 'interactive' | 'practice' | 'assessment' | 'tool';

export type AssessmentScale = 'likert_5' | 'likert_7' | 'binary' | 'slider' | 'ranking';

export type ConsentLevel = 'minimal' | 'standard' | 'enhanced' | 'full';

export type SharingPermission = 'anonymous_research' | 'personalized_recommendations' | 'peer_comparison' | 'instructor_insights';

export interface EffectMeasurement {
  metrics: string[];
  baseline: number[];
  current: number[];
  significance: number; // p-value
}

export interface LightingRecommendation {
  type: LightingCondition;
  intensity: number; // lux
  colorTemperature: number; // Kelvin
  duration: number; // minutes
}

export interface NoiseRecommendation {
  level: number; // decibels
  type: NoiseType;
  masking: boolean;
  cancellation: boolean;
}

export interface TemperatureRecommendation {
  optimal: number; // Celsius
  range: TemperatureRange;
  humidity: HumidityRange;
  airflow: AirflowRecommendation;
}

export interface WorkspaceRecommendation {
  layout: WorkspaceLayout;
  ergonomics: ErgonomicRecommendation[];
  tools: WorkspaceTool[];
  personalization: PersonalizationOption[];
}

export type NoiseType = 'white_noise' | 'pink_noise' | 'brown_noise' | 'nature_sounds' | 'silence';

export type WorkspaceLayout = 'minimalist' | 'organized' | 'personalized' | 'collaborative' | 'adaptive';

export interface HumidityRange {
  min: number; // percentage
  max: number; // percentage
  optimal: number; // percentage
}

export interface AirflowRecommendation {
  velocity: number; // m/s
  direction: string;
  circulation: boolean;
}

export interface ErgonomicRecommendation {
  aspect: string;
  recommendation: string;
  importance: number; // 0-1
  health_impact: number; // 0-1
}

export interface WorkspaceTool {
  name: string;
  category: ToolCategory;
  necessity: ToolNecessity;
  alternatives: string[];
}

export interface PersonalizationOption {
  element: string;
  options: string[];
  preference: string;
  impact: number; // 0-1
}

export type ToolCategory = 'hardware' | 'software' | 'stationery' | 'ergonomic' | 'organizational';

export type ToolNecessity = 'essential' | 'recommended' | 'optional' | 'situational';

export interface AlertConfiguration {
  threshold: number;
  message: string;
  escalation: EscalationLevel;
  actions: string[];
}

export type EscalationLevel = 'info' | 'warning' | 'alert' | 'critical';

// Analytics and reporting types

export interface SpacedRepetitionAnalytics {
  studentId: string;
  courseId: string;
  timeRange: DateRange;
  summary: RepetitionSummary;
  trends: RepetitionTrend[];
  patterns: RepetitionPattern[];
  effectiveness: EffectivenessMetrics;
  recommendations: AnalyticsRecommendation[];
  predictions: AnalyticsPrediction[];
  insights: RepetitionInsight[];
}

export interface RepetitionSummary {
  totalItems: number;
  activeItems: number;
  masteredItems: number;
  reviewsCompleted: number;
  averageRetention: number;
  averageInterval: number;
  studyTime: number; // minutes
  efficiency: EfficiencyMetrics;
}

export interface RepetitionTrend {
  metric: TrendMetric;
  direction: TrendDirection;
  magnitude: number;
  confidence: number;
  timeframe: number; // days
}

export interface RepetitionPattern {
  type: PatternType;
  description: string;
  frequency: number;
  strength: number; // 0-1
  implications: string[];
}

export interface EffectivenessMetrics {
  retentionRate: number; // 0-1
  learningVelocity: number; // items per hour
  scheduleAdherence: number; // 0-1
  algorithmAccuracy: number; // 0-1
  adaptationSuccess: number; // 0-1
}

export interface AnalyticsRecommendation {
  category: RecommendationCategory;
  priority: ActionPriority;
  description: string;
  rationale: string;
  implementation: string[];
  expectedImpact: ImpactMetrics;
}

export interface AnalyticsPrediction {
  metric: PredictionMetric;
  value: number;
  confidence: number;
  timeframe: number; // days
  factors: PredictionFactor[];
}

export interface RepetitionInsight {
  type: InsightType;
  description: string;
  significance: number; // 0-1
  actionable: boolean;
  recommendations: string[];
}

export interface EfficiencyMetrics {
  timePerItem: number; // minutes
  retentionPerMinute: number;
  masteryRate: number; // items per day
  errorRate: number; // 0-1
  cognitiveEfficiency: number; // 0-1
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PredictionFactor {
  factor: string;
  contribution: number; // -1 to 1
  confidence: number; // 0-1
}

export type TrendMetric = 'retention_rate' | 'review_frequency' | 'mastery_progress' | 'study_time' | 'efficiency';

export type PatternType = 'temporal' | 'performance' | 'behavioral' | 'cognitive' | 'environmental';

export type RecommendationCategory = 'schedule_optimization' | 'study_technique' | 'content_modification' | 'motivation' | 'environment';

export type PredictionMetric = 'retention_probability' | 'mastery_timeline' | 'optimal_interval' | 'performance_trend';

export type InsightType = 'strength' | 'weakness' | 'opportunity' | 'risk' | 'pattern';

// Export and import types

export interface SpacedRepetitionExport {
  studentId: string;
  exportDate: Date;
  format: ExportFormat;
  data: ExportData;
  metadata: ExportMetadata;
  privacy: PrivacyLevel;
}

export interface ExportData {
  repetitionResults: SpacedRepetitionResult[];
  analytics: SpacedRepetitionAnalytics;
  schedules: ReviewSchedule[];
  performance: PerformanceMetrics[];
}

export interface ExportMetadata {
  version: string;
  algorithm: RepetitionAlgorithm;
  dateRange: DateRange;
  itemCount: number;
  compressionLevel: number;
}

export type ExportFormat = 'json' | 'csv' | 'xml' | 'anki' | 'supermemo';

export type PrivacyLevel = 'full' | 'anonymized' | 'aggregated' | 'minimal';

// Real-time monitoring types

export interface RealtimeRepetitionData {
  studentId: string;
  sessionId: string;
  timestamp: Date;
  currentItem: string;
  performance: RealTimePerformance;
  state: RealTimeState;
  predictions: RealTimePredictions;
  adaptations: RealTimeAdaptation[];
}

export interface RealTimePerformance {
  responseTime: number;
  accuracy: boolean;
  confidence: number;
  effort: EffortLevel;
  engagement: number; // 0-1
}

export interface RealTimeState {
  cognitiveLoad: number; // 0-1
  fatigue: number; // 0-1
  motivation: number; // 0-1
  focus: number; // 0-1
  stress: number; // 0-1
}

export interface RealTimePredictions {
  nextPerformance: number; // 0-1
  optimalBreakTime: number; // minutes
  sessionEndPrediction: Date;
  burnoutRisk: RiskLevel;
}

export interface RealTimeAdaptation {
  trigger: AdaptationTrigger;
  action: AdaptationAction;
  magnitude: number;
  confidence: number;
  timestamp: Date;
}

export type AdaptationTrigger = 'performance_drop' | 'cognitive_overload' | 'fatigue_increase' | 'motivation_decrease' | 'time_pressure';

export type AdaptationAction = 'difficulty_decrease' | 'break_suggestion' | 'technique_change' | 'encouragement' | 'session_end';