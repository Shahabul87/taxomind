// Cognitive Load Management Types

export interface CognitiveLoadAssessment {
  id: string;
  studentId: string;
  contentId: string;
  courseId: string;
  assessment: LoadAssessment;
  recommendations: LoadRecommendation[];
  adaptations: LoadAdaptation[];
  timestamp: Date;
  validUntil: Date;
}

export interface LoadAssessment {
  intrinsicLoad: IntrinsicLoad;
  extraneousLoad: ExtraneousLoad;
  germaneLoad: GermaneLoad;
  totalLoad: number; // 0-1, combined cognitive load
  loadCapacity: number; // 0-1, student's current capacity
  loadEfficiency: number; // 0-1, how efficiently load is being used
  overloadRisk: OverloadRisk;
  optimalLoadRange: LoadRange;
}

export interface IntrinsicLoad {
  value: number; // 0-1, inherent complexity of the content
  factors: IntrinsicFactor[];
  difficulty: QuestionDifficultyLevel;
  conceptDensity: number; // concepts per minute
  abstractionLevel: AbstractionLevel;
  priorKnowledgeRequirement: number; // 0-1
  interactivityLevel: number; // 0-1
}

export interface IntrinsicFactor {
  type: IntrinsicFactorType;
  impact: number; // 0-1, contribution to intrinsic load
  description: string;
  mitigation?: string;
}

export type IntrinsicFactorType = 
  | 'content_complexity'
  | 'concept_density'
  | 'abstraction_level'
  | 'mathematical_content'
  | 'language_complexity'
  | 'technical_vocabulary'
  | 'procedural_steps'
  | 'logical_relationships';

export interface ExtraneousLoad {
  value: number; // 0-1, unnecessary cognitive burden
  sources: ExtraneousSource[];
  designIssues: DesignIssue[];
  distractions: Distraction[];
  interfaceComplexity: number; // 0-1
  informationOverload: number; // 0-1
}

export interface ExtraneousSource {
  type: ExtraneousSourceType;
  severity: number; // 0-1, how much it increases load
  frequency: number; // how often it occurs
  description: string;
  fixSuggestion?: string;
}

export type ExtraneousSourceType = 
  | 'poor_interface_design'
  | 'irrelevant_information'
  | 'confusing_navigation'
  | 'split_attention'
  | 'redundant_content'
  | 'unclear_instructions'
  | 'technical_difficulties'
  | 'environmental_distractions';

export interface DesignIssue {
  element: string;
  issue: string;
  impact: number; // 0-1
  solution: string;
  priority: IssuePriority;
}

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export interface Distraction {
  type: DistractionType;
  source: DistractionSource;
  intensity: number; // 0-1
  duration: number; // minutes
  impact: number; // 0-1, impact on learning
}

export type DistractionType = 
  | 'visual' | 'auditory' | 'cognitive' | 'emotional' | 'physical';

export type DistractionSource = 
  | 'interface' | 'content' | 'environment' | 'notifications' | 'multitasking';

export interface GermaneLoad {
  value: number; // 0-1, productive cognitive effort
  learningProcesses: LearningProcess[];
  schemaConstruction: number; // 0-1, building mental models
  knowledgeIntegration: number; // 0-1, connecting new to existing
  metacognition: number; // 0-1, thinking about thinking
  transferPreparation: number; // 0-1, preparing for application
}

export interface LearningProcess {
  type: LearningProcessType;
  engagement: number; // 0-1, how engaged in this process
  effectiveness: number; // 0-1, how effective this process is
  timeAllocation: number; // percentage of time spent
}

export type LearningProcessType = 
  | 'attention_allocation'
  | 'information_encoding'
  | 'pattern_recognition'
  | 'schema_building'
  | 'knowledge_integration'
  | 'metacognitive_monitoring'
  | 'self_regulation'
  | 'transfer_preparation';

export interface OverloadRisk {
  level: RiskLevel;
  probability: number; // 0-1, likelihood of overload
  indicators: OverloadIndicator[];
  timeToOverload: number; // estimated minutes until overload
  recoverySuggestions: RecoverySuggestion[];
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface OverloadIndicator {
  type: IndicatorType;
  value: number;
  threshold: number;
  severity: number; // 0-1
  trend: 'improving' | 'stable' | 'worsening';
  lastUpdated: Date;
}

export type IndicatorType = 
  | 'response_time_increase'
  | 'error_rate_increase'
  | 'help_request_frequency'
  | 'task_switching_frequency'
  | 'attention_span_decrease'
  | 'engagement_decline'
  | 'stress_markers'
  | 'performance_degradation';

export interface RecoverySuggestion {
  type: RecoveryType;
  description: string;
  estimatedEffectiveness: number; // 0-1
  timeRequired: number; // minutes
  priority: IssuePriority;
}

export type RecoveryType = 
  | 'take_break'
  | 'reduce_complexity'
  | 'provide_scaffolding'
  | 'chunk_content'
  | 'remove_distractions'
  | 'switch_modality'
  | 'review_prerequisites'
  | 'seek_help';

export interface LoadRange {
  minimum: number; // 0-1, below this is too easy
  optimal: number; // 0-1, ideal cognitive load
  maximum: number; // 0-1, above this causes overload
  current: number; // 0-1, current position in range
}

export interface LoadRecommendation {
  id: string;
  type: RecommendationType;
  priority: IssuePriority;
  target: RecommendationTarget;
  action: string;
  rationale: string;
  expectedImpact: ExpectedImpact;
  implementationEffort: ImplementationEffort;
  timeframe: string;
}

export type RecommendationType = 
  | 'reduce_intrinsic_load'
  | 'eliminate_extraneous_load'
  | 'optimize_germane_load'
  | 'adjust_pacing'
  | 'provide_scaffolding'
  | 'chunk_content'
  | 'change_modality'
  | 'add_practice'
  | 'remove_distractions'
  | 'take_break';

export type RecommendationTarget = 
  | 'content_design'
  | 'interface_design'
  | 'pacing'
  | 'student_behavior'
  | 'environment'
  | 'instructional_strategy';

export interface ExpectedImpact {
  loadReduction: number; // 0-1, expected reduction in cognitive load
  learningImprovement: number; // 0-1, expected improvement in learning
  engagementIncrease: number; // 0-1, expected increase in engagement
  timeToEffect: number; // minutes until effect is seen
  duration: number; // minutes the effect lasts
}

export type ImplementationEffort = 'minimal' | 'low' | 'medium' | 'high' | 'extensive';

export interface LoadAdaptation {
  id: string;
  type: AdaptationType;
  trigger: AdaptationTrigger;
  changes: ContentChange[];
  effectiveness: AdaptationEffectiveness;
  timestamp: Date;
  duration?: number; // minutes the adaptation lasts
}

export type AdaptationType = 
  | 'content_chunking'
  | 'complexity_reduction'
  | 'scaffolding_addition'
  | 'pacing_adjustment'
  | 'modality_change'
  | 'distraction_removal'
  | 'break_insertion'
  | 'support_provision';

export interface AdaptationTrigger {
  type: TriggerType;
  threshold: number;
  actualValue: number;
  confidence: number; // 0-1, confidence in trigger
  source: TriggerSource;
}

export type TriggerType = 
  | 'load_threshold_exceeded'
  | 'performance_decline'
  | 'engagement_drop'
  | 'stress_increase'
  | 'error_rate_spike'
  | 'time_on_task_excessive'
  | 'help_requests_frequent'
  | 'attention_wandering';

export type TriggerSource = 
  | 'behavioral_analytics'
  | 'performance_metrics'
  | 'physiological_sensors'
  | 'self_report'
  | 'interaction_patterns'
  | 'eye_tracking'
  | 'machine_learning';

export interface ContentChange {
  element: string;
  changeType: ChangeType;
  originalValue: any;
  newValue: any;
  rationale: string;
}

export type ChangeType = 
  | 'hide_element'
  | 'simplify_language'
  | 'chunk_content'
  | 'add_scaffolding'
  | 'change_format'
  | 'adjust_timing'
  | 'provide_summary'
  | 'add_breaks';

export interface AdaptationEffectiveness {
  measured: boolean;
  loadReduction: number; // actual reduction achieved
  performanceImprovement: number; // actual improvement
  studentSatisfaction: number; // 1-5 rating
  timeToEffect: number; // actual time to see effect
  sideEffects: SideEffect[];
}

export interface SideEffect {
  type: string;
  severity: number; // 0-1
  description: string;
  mitigation?: string;
}

export interface CognitiveLoadProfile {
  studentId: string;
  courseId: string;
  profile: StudentLoadProfile;
  history: LoadHistoryEntry[];
  patterns: LoadPattern[];
  preferences: LoadPreferences;
  adaptationMemory: AdaptationMemory[];
  lastUpdated: Date;
}

export interface StudentLoadProfile {
  workingMemoryCapacity: number; // 0-1, estimated capacity
  processingSpeed: number; // 0-1, information processing rate
  attentionSpan: number; // minutes before attention declines
  multitaskingAbility: number; // 0-1, ability to handle multiple tasks
  stressResilience: number; // 0-1, resistance to cognitive stress
  learningStyle: CognitiveStyle;
  optimalLoadLevel: number; // 0-1, performs best at this load
  overloadThreshold: number; // 0-1, overload occurs above this
}

export interface CognitiveStyle {
  visualSpatial: number; // 0-1, preference for visual information
  verbalLinguistic: number; // 0-1, preference for verbal information
  analyticalSequential: number; // 0-1, step-by-step processing
  holisticRandom: number; // 0-1, big-picture processing
  reflectiveImpulsive: number; // 0-1, tendency to reflect vs act quickly
  fieldDependentIndependent: number; // 0-1, context dependency
}

export interface LoadHistoryEntry {
  timestamp: Date;
  contentId: string;
  loadAssessment: LoadAssessment;
  performance: LoadPerformance;
  adaptations: string[]; // IDs of adaptations applied
  outcome: SessionOutcome;
}

export interface LoadPerformance {
  completionRate: number; // 0-1
  accuracyRate: number; // 0-1
  timeOnTask: number; // minutes
  helpRequests: number;
  errorCount: number;
  engagementLevel: number; // 0-1
}

export interface SessionOutcome {
  success: boolean;
  learningGains: number; // 0-1, estimated learning achieved
  satisfaction: number; // 1-5, student satisfaction
  fatigueLevel: number; // 0-1, ending fatigue level
  nextSessionReadiness: number; // 0-1, readiness for next session
}

export interface LoadPattern {
  id: string;
  name: string;
  description: string;
  conditions: PatternCondition[];
  frequency: number; // times per week this pattern occurs
  reliability: number; // 0-1, how consistently this pattern holds
  implications: PatternImplication[];
}

export interface PatternCondition {
  variable: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: any;
  context?: string;
}

export interface PatternImplication {
  type: 'load_increase' | 'load_decrease' | 'performance_impact' | 'adaptation_need';
  description: string;
  strength: number; // 0-1, strength of the implication
  actionable: boolean;
}

export interface LoadPreferences {
  preferredLoadLevel: number; // 0-1, student's preferred cognitive load
  breakFrequency: number; // minutes between preferred breaks
  sessionLength: number; // preferred session length in minutes
  difficultyProgression: QuestionDifficultyProgression;
  feedbackFrequency: FeedbackFrequency;
  supportLevel: SupportLevel;
  adaptationTolerance: number; // 0-1, tolerance for system adaptations
}

export type QuestionDifficultyProgression = 'gradual' | 'steep' | 'plateau' | 'variable';
export type FeedbackFrequency = 'immediate' | 'frequent' | 'moderate' | 'minimal';
export type SupportLevel = 'high' | 'medium' | 'low' | 'autonomous';

export interface AdaptationMemory {
  adaptationId: string;
  context: AdaptationContext;
  effectiveness: number; // 0-1, how effective it was
  sideEffects: SideEffect[];
  studentReaction: StudentReaction;
  futureApplicability: number; // 0-1, likelihood to work again
}

export interface AdaptationContext {
  contentType: string;
  loadLevel: number; // 0-1, load level when adaptation was applied
  timeOfDay: number; // hour of day
  sessionLength: number; // minutes into session
  priorPerformance: number; // 0-1, performance before adaptation
  stressLevel: number; // 0-1, stress level when applied
}

export interface StudentReaction {
  immediate: ReactionType;
  delayed: ReactionType;
  verbalizationCount: number; // complaints or positive comments
  behavioralChanges: BehavioralChange[];
}

export type ReactionType = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface BehavioralChange {
  behavior: string;
  change: 'increase' | 'decrease' | 'no_change';
  magnitude: number; // 0-1, size of change
  duration: number; // minutes the change lasted
}

export interface LoadManagementStrategy {
  id: string;
  name: string;
  description: string;
  applicableContexts: StrategyContext[];
  interventions: LoadIntervention[];
  effectiveness: StrategyEffectiveness;
  prerequisites: string[];
  contraindications: string[];
}

export interface StrategyContext {
  loadType: 'intrinsic' | 'extraneous' | 'germane' | 'total';
  loadRange: LoadRange;
  studentProfile: StudentProfileCriteria;
  contentCharacteristics: ContentCriteria;
}

export interface StudentProfileCriteria {
  workingMemoryCapacity?: { min: number; max: number };
  attentionSpan?: { min: number; max: number };
  experienceLevel?: ExperienceLevel;
  learningStyle?: CognitiveStyle;
}

export type ExperienceLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';

export interface ContentCriteria {
  complexity?: QuestionDifficultyLevel;
  duration?: { min: number; max: number };
  type?: ContentType;
  interactivity?: { min: number; max: number };
}

export type QuestionDifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type AbstractionLevel = 'concrete' | 'representational' | 'abstract';
export type ContentType = 'text' | 'video' | 'interactive' | 'assessment' | 'simulation';

export interface LoadIntervention {
  id: string;
  type: InterventionType;
  timing: InterventionTiming;
  parameters: InterventionParameters;
  expectedEffect: InterventionEffect;
  risks: InterventionRisk[];
}

export type InterventionType = 
  | 'content_chunking'
  | 'scaffolding_addition'
  | 'complexity_reduction'
  | 'distraction_removal'
  | 'pacing_adjustment'
  | 'modality_change'
  | 'break_scheduling'
  | 'support_provision'
  | 'feedback_modification'
  | 'practice_insertion';

export type InterventionTiming = 
  | 'preventive' | 'immediate' | 'delayed' | 'session_end' | 'next_session';

export interface InterventionParameters {
  intensity: number; // 0-1, how strong the intervention
  duration: number; // minutes the intervention lasts
  frequency: number; // how often to apply per session
  adaptation: boolean; // whether to adapt based on response
  userControl: boolean; // whether user can override
}

export interface InterventionEffect {
  loadChange: LoadChange;
  performanceChange: PerformanceChange;
  engagementChange: EngagementChange;
  timeToEffect: number; // minutes
  effectDuration: number; // minutes
}

export interface LoadChange {
  intrinsic: number; // -1 to 1, change in intrinsic load
  extraneous: number; // -1 to 1, change in extraneous load
  germane: number; // -1 to 1, change in germane load
  total: number; // -1 to 1, change in total load
}

export interface PerformanceChange {
  accuracy: number; // -1 to 1, change in accuracy
  speed: number; // -1 to 1, change in completion speed
  retention: number; // -1 to 1, change in information retention
  transfer: number; // -1 to 1, change in transfer ability
}

export interface EngagementChange {
  attention: number; // -1 to 1, change in attention level
  motivation: number; // -1 to 1, change in motivation
  satisfaction: number; // -1 to 1, change in satisfaction
  flow: number; // -1 to 1, change in flow state
}

export interface InterventionRisk {
  type: RiskType;
  probability: number; // 0-1, likelihood of this risk
  severity: number; // 0-1, severity if it occurs
  mitigation: string;
}

export type RiskType = 
  | 'overcompensation'
  | 'learned_helplessness'
  | 'reduced_challenge'
  | 'system_dependence'
  | 'frustration_increase'
  | 'engagement_loss';

export interface StrategyEffectiveness {
  successRate: number; // 0-1, percentage of successful applications
  averageLoadReduction: number; // 0-1, average load reduction achieved
  averagePerformanceGain: number; // 0-1, average performance improvement
  studentSatisfaction: number; // 1-5, average satisfaction rating
  adoptionRate: number; // 0-1, how often students accept the strategy
  contextualVariability: number; // 0-1, how much effectiveness varies by context
}

export interface CognitiveLoadAnalytics {
  courseId: string;
  timeRange: DateRange;
  summary: LoadAnalyticsSummary;
  patterns: LoadAnalyticsPattern[];
  strategies: StrategyAnalytics[];
  recommendations: SystemLoadRecommendation[];
  trends: LoadTrend[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface LoadAnalyticsSummary {
  totalAssessments: number;
  averageLoadLevel: number; // 0-1
  overloadRate: number; // 0-1, percentage of sessions with overload
  adaptationRate: number; // 0-1, percentage of sessions with adaptations
  effectivenessScore: number; // 0-1, overall system effectiveness
  studentSatisfaction: number; // 1-5, average satisfaction
  learningOutcomes: LearningOutcomeMetrics;
}

export interface LearningOutcomeMetrics {
  completionRate: number; // 0-1
  retentionRate: number; // 0-1
  transferAbility: number; // 0-1
  timeToMastery: number; // hours
  engagementLevel: number; // 0-1
}

export interface LoadAnalyticsPattern {
  id: string;
  name: string;
  frequency: number; // occurrences per week
  contexts: string[];
  loadImpact: number; // -1 to 1, impact on cognitive load
  interventionOpportunity: boolean;
  description: string;
}

export interface StrategyAnalytics {
  strategyId: string;
  name: string;
  usage: StrategyUsage;
  effectiveness: StrategyEffectiveness;
  trends: StrategyTrend[];
  recommendations: StrategyRecommendation[];
}

export interface StrategyUsage {
  totalApplications: number;
  uniqueStudents: number;
  averageFrequency: number; // applications per student per week
  contextDistribution: Record<string, number>;
  timeDistribution: Record<number, number>; // hour of day distribution
}

export interface StrategyTrend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: number; // 0-1, strength of trend
  significance: number; // 0-1, statistical significance
  timeframe: string;
}

export interface StrategyRecommendation {
  type: 'expand_usage' | 'modify_parameters' | 'restrict_context' | 'discontinue';
  rationale: string;
  expectedImpact: number; // 0-1
  implementationEffort: ImplementationEffort;
}

export interface SystemLoadRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: IssuePriority;
  title: string;
  description: string;
  targetMetric: string;
  expectedImprovement: number; // 0-1
  implementationSteps: string[];
  timeline: string;
  resources: string[];
}

export type RecommendationCategory = 
  | 'content_design'
  | 'system_optimization'
  | 'strategy_refinement'
  | 'user_training'
  | 'analytics_enhancement';

export interface LoadTrend {
  metric: string;
  timeSeriesData: TrendDataPoint[];
  trend: TrendDirection;
  seasonality: SeasonalPattern[];
  correlations: TrendCorrelation[];
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  confidence: number; // 0-1, confidence in measurement
  context: Record<string, any>;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'cyclical';

export interface SeasonalPattern {
  period: 'daily' | 'weekly' | 'monthly';
  pattern: PatternDataPoint[];
  strength: number; // 0-1, strength of seasonal pattern
}

export interface PatternDataPoint {
  timeOffset: number; // offset within period
  averageValue: number;
  variance: number;
}

export interface TrendCorrelation {
  metric: string;
  correlation: number; // -1 to 1, correlation coefficient
  significance: number; // 0-1, statistical significance
  lagDays: number; // days of lag for maximum correlation
}

export interface LoadMonitoringConfig {
  assessmentFrequency: number; // minutes between assessments
  adaptationThresholds: AdaptationThresholds;
  interventionSettings: InterventionSettings;
  analyticsSettings: AnalyticsSettings;
  alertSettings: AlertSettings;
}

export interface AdaptationThresholds {
  overloadThreshold: number; // 0-1, trigger overload interventions
  underloadThreshold: number; // 0-1, trigger challenge increases
  performanceDropThreshold: number; // 0-1, trigger support interventions
  engagementDropThreshold: number; // 0-1, trigger engagement interventions
  stressThreshold: number; // 0-1, trigger stress reduction
}

export interface InterventionSettings {
  automaticInterventions: boolean;
  userConfirmationRequired: boolean;
  interventionCooldown: number; // minutes between interventions
  maxInterventionsPerSession: number;
  interventionIntensity: number; // 0-1, default intensity
}

export interface AnalyticsSettings {
  dataRetentionDays: number;
  aggregationFrequency: 'real_time' | 'hourly' | 'daily';
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
  anonymizationLevel: 'none' | 'partial' | 'full';
}

export interface AlertSettings {
  enableAlerts: boolean;
  alertChannels: AlertChannel[];
  thresholds: AlertThresholds;
  escalationRules: EscalationRule[];
}

export type AlertChannel = 'email' | 'sms' | 'in_app' | 'dashboard' | 'api_webhook';

export interface AlertThresholds {
  criticalOverload: number; // 0-1, immediate alert threshold
  prolongedOverload: number; // minutes, duration threshold
  systemFailure: number; // 0-1, system effectiveness threshold
  massiveIssue: number; // percentage of students affected
}

export interface EscalationRule {
  condition: string;
  delay: number; // minutes before escalation
  action: EscalationAction;
  recipient: string;
}

export type EscalationAction = 'notify' | 'disable_system' | 'apply_emergency_protocol' | 'human_intervention';