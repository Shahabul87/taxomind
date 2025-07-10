// Microlearning Content Segmentation Types

export interface MicrolearningSegmentation {
  id: string;
  contentId: string;
  courseId: string;
  originalContent: ContentBlock;
  segments: MicrolearningSegment[];
  segmentationStrategy: SegmentationStrategy;
  learningObjectives: LearningObjective[];
  cognitiveLoadProfile: SegmentLoadProfile;
  adaptiveConfiguration: AdaptiveConfig;
  performance: SegmentationPerformance;
  metadata: SegmentationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentBlock {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  duration: number; // estimated minutes
  complexity: ComplexityLevel;
  prerequisites: string[];
  learningGoals: string[];
  assessmentCriteria: AssessmentCriterion[];
  mediaElements: MediaElement[];
  interactiveElements: InteractiveElement[];
  metadata: ContentMetadata;
}

export type ContentType = 
  | 'text' | 'video' | 'audio' | 'interactive' | 'assessment' 
  | 'simulation' | 'infographic' | 'case_study' | 'tutorial';

export type ComplexityLevel = 
  | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AssessmentCriterion {
  id: string;
  description: string;
  weight: number; // 0-1
  type: AssessmentType;
  passingScore: number; // 0-1
}

export type AssessmentType = 
  | 'knowledge_check' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';

export interface MediaElement {
  id: string;
  type: MediaType;
  url: string;
  duration?: number;
  transcript?: string;
  accessibility: AccessibilityFeatures;
  processingHints: ProcessingHints;
}

export type MediaType = 
  | 'image' | 'video' | 'audio' | 'animation' | 'infographic' | 'diagram' | 'chart';

export interface AccessibilityFeatures {
  altText?: string;
  captions?: boolean;
  audioDescription?: boolean;
  highContrast?: boolean;
  keyboardNavigation?: boolean;
}

export interface ProcessingHints {
  cognitiveLoad: number; // 0-1
  attentionRequired: AttentionLevel;
  processingTime: number; // seconds
  modalityPreference: ModalityType[];
}

export type AttentionLevel = 'low' | 'medium' | 'high' | 'critical';
export type ModalityType = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

export interface InteractiveElement {
  id: string;
  type: InteractionType;
  trigger: InteractionTrigger;
  response: InteractionResponse;
  feedback: FeedbackConfiguration;
  analytics: InteractionAnalytics;
}

export type InteractionType = 
  | 'click' | 'hover' | 'drag_drop' | 'input' | 'selection' | 'navigation' | 'assessment';

export interface InteractionTrigger {
  event: string;
  condition?: string;
  timing?: TimingConfiguration;
  contextual?: boolean;
}

export interface InteractionResponse {
  immediate: ResponseAction[];
  delayed: ResponseAction[];
  adaptive: AdaptiveResponse[];
}

export interface ResponseAction {
  type: ActionType;
  parameters: Record<string, any>;
  condition?: string;
  priority: number;
}

export type ActionType = 
  | 'show_content' | 'hide_content' | 'navigate' | 'provide_feedback' 
  | 'update_progress' | 'trigger_assessment' | 'adjust_difficulty';

export interface AdaptiveResponse {
  profileCondition: string;
  performanceThreshold: number;
  action: ResponseAction;
  duration: number; // minutes
}

export interface FeedbackConfiguration {
  immediate: boolean;
  delayed: boolean;
  adaptive: boolean;
  multimodal: boolean;
  personalized: boolean;
  corrective: boolean;
}

export interface InteractionAnalytics {
  trackingEnabled: boolean;
  metricsCollected: AnalyticsMetric[];
  realTimeProcessing: boolean;
  aggregationLevel: AggregationLevel;
}

export type AnalyticsMetric = 
  | 'time_spent' | 'interaction_count' | 'success_rate' | 'error_patterns' 
  | 'engagement_level' | 'cognitive_load' | 'difficulty_perception';

export type AggregationLevel = 'individual' | 'segment' | 'course' | 'system';

export interface ContentMetadata {
  language: string;
  readingLevel: ReadingLevel;
  culturalContext: string[];
  domainSpecific: boolean;
  updateFrequency: UpdateFrequency;
  versionControl: VersionInfo;
}

export type ReadingLevel = 'elementary' | 'middle' | 'high_school' | 'college' | 'graduate';
export type UpdateFrequency = 'static' | 'quarterly' | 'monthly' | 'weekly' | 'dynamic';

export interface VersionInfo {
  version: string;
  lastUpdated: Date;
  changeLog: string[];
  deprecated: boolean;
}

export interface MicrolearningSegment {
  id: string;
  order: number;
  title: string;
  content: SegmentContent;
  duration: OptimalDuration;
  learningObjectives: LearningObjective[];
  prerequisites: PrerequisiteCheck[];
  assessments: MicroAssessment[];
  transitions: SegmentTransition[];
  adaptations: SegmentAdaptation[];
  performance: SegmentPerformance;
  metadata: SegmentMetadata;
}

export interface SegmentContent {
  core: CoreContent;
  supplementary: SupplementaryContent[];
  alternatives: AlternativeContent[];
  scaffolding: ScaffoldingContent[];
  extensions: ExtensionContent[];
}

export interface CoreContent {
  id: string;
  type: ContentType;
  content: string;
  mediaElements: MediaElement[];
  interactiveElements: InteractiveElement[];
  processingRequirements: ProcessingRequirements;
}

export interface ProcessingRequirements {
  cognitiveLoad: number; // 0-1
  workingMemoryDemand: number; // 0-1
  attentionSustainment: number; // minutes
  priorKnowledgeActivation: KnowledgeActivation[];
  metacognitiveDemands: MetacognitiveDemand[];
}

export interface KnowledgeActivation {
  concept: string;
  activationLevel: number; // 0-1
  activationStrategy: ActivationStrategy;
  timeRequired: number; // minutes
}

export type ActivationStrategy = 
  | 'recall_prompt' | 'analogy' | 'example' | 'visual_cue' | 'contextual_reminder';

export interface MetacognitiveDemand {
  type: MetacognitiveType;
  complexity: number; // 0-1
  scaffoldingAvailable: boolean;
  autonomyLevel: number; // 0-1
}

export type MetacognitiveType = 
  | 'planning' | 'monitoring' | 'evaluating' | 'reflecting' | 'strategizing';

export interface SupplementaryContent {
  id: string;
  type: SupplementaryType;
  content: string;
  trigger: ContentTrigger;
  relevance: number; // 0-1
  optional: boolean;
}

export type SupplementaryType = 
  | 'definition' | 'example' | 'context' | 'application' | 'connection' | 'elaboration';

export interface ContentTrigger {
  condition: TriggerCondition;
  timing: TriggerTiming;
  personalization: PersonalizationRule[];
  analytics: TriggerAnalytics;
}

export interface TriggerCondition {
  type: ConditionType;
  threshold: number;
  metric: string;
  operator: ComparisonOperator;
}

export type ConditionType = 
  | 'performance' | 'time' | 'engagement' | 'cognitive_load' | 'difficulty' | 'preference';

export type ComparisonOperator = 'equals' | 'greater_than' | 'less_than' | 'between' | 'pattern_match';

export interface TriggerTiming {
  delay: number; // milliseconds
  duration: number; // milliseconds
  frequency: FrequencyPattern;
  contextual: boolean;
}

export interface FrequencyPattern {
  type: FrequencyType;
  interval: number;
  limit: number;
  adaptive: boolean;
}

export type FrequencyType = 'once' | 'interval' | 'event_based' | 'adaptive' | 'user_driven';

export interface PersonalizationRule {
  profileAttribute: string;
  value: any;
  operator: ComparisonOperator;
  weight: number; // 0-1
}

export interface TriggerAnalytics {
  effectiveness: number; // 0-1
  utilization: number; // 0-1
  userSatisfaction: number; // 0-1
  performanceImpact: number; // -1 to 1
}

export interface AlternativeContent {
  id: string;
  type: AlternativeType;
  content: string;
  targetProfile: LearnerProfile;
  equivalenceScore: number; // 0-1
  conversionRules: ConversionRule[];
}

export type AlternativeType = 
  | 'modality_change' | 'complexity_reduction' | 'language_simplification' 
  | 'cultural_adaptation' | 'format_change' | 'pace_adjustment';

export interface LearnerProfile {
  cognitiveStyle: CognitiveStyle;
  learningPreferences: LearningPreference[];
  accessibility: AccessibilityRequirement[];
  performance: PerformanceProfile;
  context: LearningContext;
}

export interface CognitiveStyle {
  processingPreference: ProcessingPreference;
  informationOrganization: OrganizationStyle;
  attentionPattern: AttentionPattern;
  memoryStrength: MemoryStrength;
}

export interface ProcessingPreference {
  sequential: number; // 0-1
  global: number; // 0-1
  visual: number; // 0-1
  verbal: number; // 0-1
  active: number; // 0-1
  reflective: number; // 0-1
}

export interface OrganizationStyle {
  hierarchical: number; // 0-1
  network: number; // 0-1
  linear: number; // 0-1
  spatial: number; // 0-1
}

export interface AttentionPattern {
  sustained: number; // 0-1
  selective: number; // 0-1
  divided: number; // 0-1
  alternating: number; // 0-1
}

export interface MemoryStrength {
  shortTerm: number; // 0-1
  longTerm: number; // 0-1
  working: number; // 0-1
  episodic: number; // 0-1
  semantic: number; // 0-1
}

export interface LearningPreference {
  dimension: PreferenceDimension;
  value: number; // 0-1
  strength: number; // 0-1
  context: string[];
}

export type PreferenceDimension = 
  | 'pace' | 'difficulty' | 'feedback_frequency' | 'social_interaction' 
  | 'autonomy' | 'structure' | 'multimedia' | 'gamification';

export interface AccessibilityRequirement {
  type: AccessibilityType;
  severity: AccessibilitySeverity;
  accommodations: Accommodation[];
  assistiveTechnology: AssistiveTechnology[];
}

export type AccessibilityType = 
  | 'visual' | 'auditory' | 'motor' | 'cognitive' | 'learning' | 'attention';

export type AccessibilitySeverity = 'mild' | 'moderate' | 'severe' | 'profound';

export interface Accommodation {
  type: AccommodationType;
  implementation: string;
  effectiveness: number; // 0-1
  cost: ImplementationCost;
}

export type AccommodationType = 
  | 'time_extension' | 'format_change' | 'assistive_tech' | 'environmental' 
  | 'presentation' | 'response' | 'setting' | 'timing';

export type ImplementationCost = 'low' | 'medium' | 'high' | 'very_high';

export interface AssistiveTechnology {
  name: string;
  type: AssistiveTechType;
  compatibility: string[];
  configuration: Record<string, any>;
}

export type AssistiveTechType = 
  | 'screen_reader' | 'magnifier' | 'voice_recognition' | 'switch_interface' 
  | 'eye_tracking' | 'alternative_keyboard' | 'cognitive_aid';

export interface PerformanceProfile {
  strengths: PerformanceArea[];
  challenges: PerformanceArea[];
  trends: PerformanceTrend[];
  predictions: PerformancePrediction[];
}

export interface PerformanceArea {
  domain: PerformanceDomain;
  score: number; // 0-1
  confidence: number; // 0-1
  evidence: Evidence[];
}

export type PerformanceDomain = 
  | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation' 
  | 'memory' | 'attention' | 'processing_speed' | 'metacognition';

export interface Evidence {
  type: EvidenceType;
  source: string;
  weight: number; // 0-1
  timestamp: Date;
  context: string;
}

export type EvidenceType = 
  | 'assessment_score' | 'time_on_task' | 'error_pattern' | 'help_seeking' 
  | 'engagement_metric' | 'self_report' | 'peer_evaluation' | 'expert_observation';

export interface PerformanceTrend {
  metric: string;
  direction: TrendDirection;
  strength: number; // 0-1
  timeframe: TimeFrame;
  significance: number; // 0-1
}

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'fluctuating';

export interface TimeFrame {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
}

export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface PerformancePrediction {
  metric: string;
  predictedValue: number;
  confidence: number; // 0-1
  timeHorizon: number; // days
  assumptions: string[];
  risks: PredictionRisk[];
}

export interface PredictionRisk {
  factor: string;
  probability: number; // 0-1
  impact: number; // -1 to 1
  mitigation: string;
}

export interface LearningContext {
  environment: EnvironmentContext;
  social: SocialContext;
  temporal: TemporalContext;
  motivational: MotivationalContext;
  cultural: CulturalContext;
}

export interface EnvironmentContext {
  location: LocationType;
  deviceType: DeviceType;
  connectivity: ConnectivityLevel;
  distractions: DistractionLevel;
  lighting: LightingCondition;
  noise: NoiseLevel;
}

export type LocationType = 'home' | 'school' | 'work' | 'library' | 'public' | 'mobile';
export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'mixed';
export type ConnectivityLevel = 'high' | 'medium' | 'low' | 'intermittent';
export type DistractionLevel = 'minimal' | 'moderate' | 'high' | 'extreme';
export type LightingCondition = 'optimal' | 'adequate' | 'poor' | 'variable';
export type NoiseLevel = 'quiet' | 'moderate' | 'noisy' | 'variable';

export interface SocialContext {
  learningMode: LearningMode;
  peerPresence: PeerPresence;
  instructorAvailability: InstructorAvailability;
  collaborationLevel: CollaborationLevel;
  supportNetwork: SupportNetwork;
}

export type LearningMode = 'individual' | 'small_group' | 'large_group' | 'mixed';
export type PeerPresence = 'none' | 'virtual' | 'physical' | 'hybrid';
export type InstructorAvailability = 'immediate' | 'delayed' | 'scheduled' | 'unavailable';
export type CollaborationLevel = 'independent' | 'cooperative' | 'collaborative' | 'competitive';

export interface SupportNetwork {
  peers: PeerSupport[];
  mentors: MentorSupport[];
  family: FamilySupport;
  professional: ProfessionalSupport[];
}

export interface PeerSupport {
  type: PeerSupportType;
  availability: AvailabilityLevel;
  effectiveness: number; // 0-1
  relationship: RelationshipStrength;
}

export type PeerSupportType = 'study_buddy' | 'tutor' | 'discussion_partner' | 'accountability_partner';
export type AvailabilityLevel = 'always' | 'scheduled' | 'on_demand' | 'limited';
export type RelationshipStrength = 'strong' | 'moderate' | 'weak' | 'new';

export interface MentorSupport {
  type: MentorType;
  expertise: ExpertiseLevel;
  availability: AvailabilityLevel;
  communication: CommunicationStyle;
}

export type MentorType = 'academic' | 'professional' | 'life' | 'peer';
export type ExpertiseLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';
export type CommunicationStyle = 'directive' | 'collaborative' | 'supportive' | 'challenging';

export interface FamilySupport {
  level: SupportLevel;
  understanding: number; // 0-1
  encouragement: number; // 0-1
  resources: ResourceAvailability;
}

export type SupportLevel = 'high' | 'medium' | 'low' | 'none';
export type ResourceAvailability = 'abundant' | 'adequate' | 'limited' | 'scarce';

export interface ProfessionalSupport {
  type: ProfessionalType;
  availability: AvailabilityLevel;
  cost: CostLevel;
  effectiveness: number; // 0-1
}

export type ProfessionalType = 'tutor' | 'counselor' | 'therapist' | 'coach' | 'specialist';
export type CostLevel = 'free' | 'low' | 'medium' | 'high' | 'very_high';

export interface TemporalContext {
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  season: Season;
  urgency: UrgencyLevel;
  deadline: DeadlineInfo;
}

export type TimeOfDay = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DeadlineInfo {
  hasDeadline: boolean;
  timeRemaining: number; // hours
  flexibility: FlexibilityLevel;
  consequences: ConsequenceLevel;
}

export type FlexibilityLevel = 'none' | 'minimal' | 'moderate' | 'high';
export type ConsequenceLevel = 'none' | 'low' | 'medium' | 'high' | 'severe';

export interface MotivationalContext {
  intrinsicMotivation: number; // 0-1
  extrinsicMotivation: number; // 0-1
  goalsAlignment: number; // 0-1
  selfefficacy: number; // 0-1
  interest: number; // 0-1
  relevance: number; // 0-1
  challenge: number; // 0-1
}

export interface CulturalContext {
  background: CulturalBackground;
  values: CulturalValue[];
  communication: CommunicationPattern;
  learningTraditions: LearningTradition[];
  languageProfile: LanguageProfile;
}

export interface CulturalBackground {
  primary: string;
  secondary: string[];
  generational: GenerationalCohort;
  socioeconomic: SocioeconomicLevel;
}

export type GenerationalCohort = 'gen_z' | 'millennial' | 'gen_x' | 'boomer' | 'silent' | 'other';
export type SocioeconomicLevel = 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high';

export interface CulturalValue {
  dimension: ValueDimension;
  orientation: number; // -1 to 1
  strength: number; // 0-1
  context: string[];
}

export type ValueDimension = 
  | 'individualism_collectivism' | 'power_distance' | 'uncertainty_avoidance' 
  | 'long_term_orientation' | 'masculinity_femininity' | 'indulgence_restraint';

export interface CommunicationPattern {
  directness: number; // 0-1
  contextDependence: number; // 0-1
  formalityPreference: number; // 0-1
  nonverbalImportance: number; // 0-1
}

export interface LearningTradition {
  name: string;
  influence: number; // 0-1
  practices: string[];
  adaptations: string[];
}

export interface LanguageProfile {
  native: string[];
  proficient: LanguageProficiency[];
  preferred: string;
  supportNeeds: LanguageSupport[];
}

export interface LanguageProficiency {
  language: string;
  level: ProficiencyLevel;
  skills: LanguageSkill[];
}

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'proficient' | 'native';

export interface LanguageSkill {
  type: SkillType;
  level: ProficiencyLevel;
  confidence: number; // 0-1
}

export type SkillType = 'listening' | 'speaking' | 'reading' | 'writing' | 'comprehension';

export interface LanguageSupport {
  type: LanguageSupportType;
  availability: AvailabilityLevel;
  effectiveness: number; // 0-1
  cost: CostLevel;
}

export type LanguageSupportType = 'translation' | 'interpretation' | 'bilingual_content' | 'native_support';

export interface ConversionRule {
  condition: string;
  transformation: ContentTransformation;
  quality: QualityMetric;
  validation: ValidationRule;
}

export interface ContentTransformation {
  type: TransformationType;
  parameters: TransformationParameters;
  reversible: boolean;
  fidelity: number; // 0-1
}

export type TransformationType = 
  | 'text_to_speech' | 'speech_to_text' | 'visual_to_text' | 'text_to_visual' 
  | 'complex_to_simple' | 'abstract_to_concrete' | 'formal_to_informal';

export interface TransformationParameters {
  algorithm: string;
  settings: Record<string, any>;
  quality: QualityLevel;
  speed: ProcessingSpeed;
}

export type QualityLevel = 'draft' | 'standard' | 'high' | 'premium';
export type ProcessingSpeed = 'real_time' | 'fast' | 'standard' | 'thorough';

export interface QualityMetric {
  accuracy: number; // 0-1
  completeness: number; // 0-1
  clarity: number; // 0-1
  coherence: number; // 0-1
  usability: number; // 0-1
}

export interface ValidationRule {
  type: ValidationType;
  criteria: ValidationCriteria;
  threshold: number; // 0-1
  action: ValidationAction;
}

export type ValidationType = 'automatic' | 'manual' | 'hybrid' | 'peer_review' | 'expert_review';

export interface ValidationCriteria {
  structural: StructuralCriteria;
  semantic: SemanticCriteria;
  pedagogical: PedagogicalCriteria;
  accessibility: AccessibilityCriteria;
}

export interface StructuralCriteria {
  format: boolean;
  length: boolean;
  organization: boolean;
  references: boolean;
}

export interface SemanticCriteria {
  meaning: boolean;
  context: boolean;
  accuracy: boolean;
  relevance: boolean;
}

export interface PedagogicalCriteria {
  objectives: boolean;
  difficulty: boolean;
  engagement: boolean;
  assessment: boolean;
}

export interface AccessibilityCriteria {
  wcag: boolean;
  universal: boolean;
  assistive: boolean;
  inclusive: boolean;
}

export type ValidationAction = 'approve' | 'reject' | 'revise' | 'flag' | 'escalate';

export interface ScaffoldingContent {
  id: string;
  type: ScaffoldingType;
  content: string;
  trigger: ScaffoldingTrigger;
  fading: FadingStrategy;
  effectiveness: ScaffoldingEffectiveness;
}

export type ScaffoldingType = 
  | 'hint' | 'prompt' | 'example' | 'template' | 'checklist' | 'guide' 
  | 'model' | 'analogy' | 'visual_aid' | 'conceptual_map';

export interface ScaffoldingTrigger {
  condition: TriggerCondition;
  delay: number; // milliseconds
  persistence: PersistenceLevel;
  adaptation: AdaptationLevel;
}

export type PersistenceLevel = 'temporary' | 'session' | 'topic' | 'permanent';
export type AdaptationLevel = 'static' | 'basic' | 'advanced' | 'intelligent';

export interface FadingStrategy {
  type: FadingType;
  timeline: FadingTimeline;
  triggers: FadingTrigger[];
  reversibility: boolean;
}

export type FadingType = 'gradual' | 'stepped' | 'conditional' | 'adaptive' | 'learner_controlled';

export interface FadingTimeline {
  initial: number; // percentage of scaffolding
  intermediate: FadingStep[];
  final: number; // percentage of scaffolding
  duration: number; // total fading time in minutes
}

export interface FadingStep {
  trigger: FadingTrigger;
  reduction: number; // percentage reduction
  validation: ValidationMethod;
}

export interface FadingTrigger {
  type: FadingTriggerType;
  threshold: number;
  metric: string;
  confidence: number; // 0-1
}

export type FadingTriggerType = 
  | 'performance_improvement' | 'time_based' | 'mastery_demonstration' 
  | 'confidence_increase' | 'independence_shown' | 'request_made';

export type ValidationMethod = 'automatic' | 'assessment' | 'observation' | 'self_report';

export interface ScaffoldingEffectiveness {
  learningGain: number; // 0-1
  independenceGain: number; // 0-1
  confidenceGain: number; // 0-1
  timeReduction: number; // 0-1
  errorReduction: number; // 0-1
  satisfaction: number; // 0-1
}

export interface ExtensionContent {
  id: string;
  type: ExtensionType;
  content: string;
  difficulty: DifficultyAdjustment;
  connections: ContentConnection[];
  exploration: ExplorationPath[];
}

export type ExtensionType = 
  | 'enrichment' | 'challenge' | 'application' | 'connection' | 'exploration' 
  | 'project' | 'research' | 'creativity' | 'collaboration';

export interface DifficultyAdjustment {
  level: number; // 0-1, higher than core content
  type: DifficultyType;
  scaffolding: ScaffoldingLevel;
  support: SupportLevel;
}

export type DifficultyType = 'cognitive' | 'procedural' | 'conceptual' | 'metacognitive';
export type ScaffoldingLevel = 'none' | 'minimal' | 'moderate' | 'full';

export interface ContentConnection {
  type: ConnectionType;
  target: string;
  relationship: RelationshipType;
  strength: number; // 0-1
  bidirectional: boolean;
}

export type ConnectionType = 'prerequisite' | 'corequisite' | 'extension' | 'application' | 'analogy';
export type RelationshipType = 'builds_on' | 'applies_to' | 'contrasts_with' | 'extends' | 'exemplifies';

export interface ExplorationPath {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 0-1
  duration: number; // minutes
  prerequisites: string[];
  outcomes: LearningOutcome[];
}

export interface LearningOutcome {
  id: string;
  description: string;
  type: OutcomeType;
  level: BloomLevel;
  assessment: AssessmentMethod;
  evidence: EvidenceRequirement[];
}

export type OutcomeType = 'knowledge' | 'skill' | 'attitude' | 'behavior' | 'competency';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type AssessmentMethod = 'formative' | 'summative' | 'authentic' | 'performance' | 'portfolio';

export interface EvidenceRequirement {
  type: EvidenceType;
  quantity: number;
  quality: QualityStandard;
  context: string[];
}

export type QualityStandard = 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';

export interface OptimalDuration {
  target: number; // minutes
  minimum: number; // minutes
  maximum: number; // minutes
  flexible: boolean;
  adaptationRules: DurationAdaptation[];
}

export interface DurationAdaptation {
  condition: string;
  adjustment: number; // percentage change
  rationale: string;
  evidence: string[];
}

export interface LearningObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  level: CognitiveLevel;
  domain: LearningDomain;
  measurable: boolean;
  assessment: ObjectiveAssessment;
  prerequisites: string[];
  connections: ObjectiveConnection[];
}

export type ObjectiveType = 'primary' | 'secondary' | 'enabling' | 'terminal';
export type CognitiveLevel = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
export type LearningDomain = 'cognitive' | 'affective' | 'psychomotor' | 'social' | 'metacognitive';

export interface ObjectiveAssessment {
  method: AssessmentMethod;
  criteria: AssessmentCriterion[];
  rubric: RubricLevel[];
  automation: AutomationLevel;
}

export interface RubricLevel {
  level: QualityStandard;
  description: string;
  indicators: string[];
  points: number;
}

export type AutomationLevel = 'manual' | 'semi_automated' | 'automated' | 'ai_assisted';

export interface ObjectiveConnection {
  type: ConnectionType;
  target: string;
  strength: number; // 0-1
  direction: ConnectionDirection;
}

export type ConnectionDirection = 'prerequisite' | 'corequisite' | 'successor' | 'parallel';

export interface PrerequisiteCheck {
  id: string;
  type: PrerequisiteType;
  condition: PrerequisiteCondition;
  validation: PrerequisiteValidation;
  remediation: RemediationStrategy;
}

export type PrerequisiteType = 'knowledge' | 'skill' | 'attitude' | 'experience' | 'resource';

export interface PrerequisiteCondition {
  description: string;
  measurable: boolean;
  threshold: number; // 0-1
  evidence: EvidenceRequirement[];
}

export interface PrerequisiteValidation {
  method: ValidationMethod;
  frequency: ValidationFrequency;
  accuracy: number; // 0-1
  cost: CostLevel;
}

export type ValidationFrequency = 'once' | 'periodic' | 'continuous' | 'on_demand';

export interface RemediationStrategy {
  type: RemediationType;
  resources: RemediationResource[];
  duration: number; // minutes
  effectiveness: number; // 0-1
}

export type RemediationType = 'review' | 'practice' | 'tutorial' | 'assessment' | 'support';

export interface RemediationResource {
  id: string;
  type: ResourceType;
  url: string;
  description: string;
  difficulty: ComplexityLevel;
  duration: number; // minutes
}

export type ResourceType = 'video' | 'article' | 'interactive' | 'quiz' | 'simulation' | 'game';

export interface MicroAssessment {
  id: string;
  type: MicroAssessmentType;
  content: AssessmentContent;
  scoring: ScoringMethod;
  feedback: AssessmentFeedback;
  adaptive: AdaptiveAssessment;
  analytics: AssessmentAnalytics;
}

export type MicroAssessmentType = 
  | 'knowledge_check' | 'comprehension_check' | 'application_check' | 'reflection_prompt' 
  | 'self_assessment' | 'peer_assessment' | 'formative_quiz' | 'skill_demonstration';

export interface AssessmentContent {
  instructions: string;
  items: AssessmentItem[];
  timeLimit: number; // minutes
  attempts: number;
  randomization: RandomizationSettings;
}

export interface AssessmentItem {
  id: string;
  type: ItemType;
  stem: string;
  options: ItemOption[];
  correctAnswer: any;
  explanation: string;
  difficulty: number; // 0-1
  discrimination: number; // 0-1
  metadata: ItemMetadata;
}

export type ItemType = 
  | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' 
  | 'drag_drop' | 'hotspot' | 'fill_blank' | 'ordering' | 'simulation';

export interface ItemOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  weight: number; // 0-1
}

export interface ItemMetadata {
  keywords: string[];
  difficulty: ComplexityLevel;
  estimatedTime: number; // seconds
  learningObjectives: string[];
  cognitiveLevel: CognitiveLevel;
}

export interface RandomizationSettings {
  items: boolean;
  options: boolean;
  parameters: boolean;
  seed: number;
}

export interface ScoringMethod {
  type: ScoringType;
  weighting: WeightingMethod;
  partial: boolean;
  normalization: NormalizationMethod;
  penalization: PenalizationPolicy;
}

export type ScoringType = 'dichotomous' | 'polytomous' | 'continuous' | 'categorical';
export type WeightingMethod = 'equal' | 'difficulty' | 'importance' | 'discrimination' | 'custom';
export type NormalizationMethod = 'none' | 'linear' | 'percentage' | 'z_score' | 'percentile';

export interface PenalizationPolicy {
  wrongAnswer: number; // points deducted
  noAnswer: number; // points deducted
  timeExceeded: number; // percentage penalty
  multipleAttempts: number; // percentage penalty per attempt
}

export interface AssessmentFeedback {
  immediate: FeedbackConfiguration;
  delayed: FeedbackConfiguration;
  correctiveDetail: CorrectiveDetail;
  explanatoryDetail: ExplanatoryDetail;
  motivationalElements: MotivationalElement[];
}

export interface CorrectiveDetail {
  provided: boolean;
  specificity: SpecificityLevel;
  remediation: RemediationStrategy;
  progress: ProgressIndicator;
}

export type SpecificityLevel = 'general' | 'specific' | 'detailed' | 'comprehensive';

export interface ExplanatoryDetail {
  rationale: boolean;
  examples: boolean;
  connections: boolean;
  alternatives: boolean;
}

export interface MotivationalElement {
  type: MotivationType;
  trigger: MotivationTrigger;
  message: string;
  effect: MotivationEffect;
}

export type MotivationType = 'encouragement' | 'progress' | 'achievement' | 'challenge' | 'social';

export interface MotivationTrigger {
  condition: string;
  threshold: number;
  frequency: FrequencyPattern;
  personalization: PersonalizationLevel;
}

export type PersonalizationLevel = 'generic' | 'demographic' | 'behavioral' | 'individual';

export interface MotivationEffect {
  expected: MotivationOutcome;
  measurement: MotivationMeasurement;
  duration: number; // minutes
  sustainability: SustainabilityLevel;
}

export interface MotivationOutcome {
  engagement: number; // -1 to 1
  persistence: number; // -1 to 1
  performance: number; // -1 to 1
  satisfaction: number; // -1 to 1
}

export interface MotivationMeasurement {
  method: MeasurementMethod;
  frequency: MeasurementFrequency;
  accuracy: number; // 0-1
  validity: ValidityLevel;
}

export type MeasurementMethod = 'self_report' | 'behavioral' | 'physiological' | 'performance' | 'observational';
export type MeasurementFrequency = 'continuous' | 'periodic' | 'event_based' | 'random';
export type ValidityLevel = 'low' | 'medium' | 'high' | 'very_high';
export type SustainabilityLevel = 'temporary' | 'short_term' | 'medium_term' | 'long_term';

export interface ProgressIndicator {
  type: ProgressType;
  visualization: ProgressVisualization;
  granularity: ProgressGranularity;
  comparison: ProgressComparison;
}

export type ProgressType = 'completion' | 'mastery' | 'time' | 'effort' | 'achievement';
export type ProgressVisualization = 'bar' | 'circle' | 'line' | 'tree' | 'path' | 'badge';
export type ProgressGranularity = 'micro' | 'segment' | 'topic' | 'module' | 'course';
export type ProgressComparison = 'none' | 'self' | 'peer' | 'standard' | 'adaptive';

export interface AdaptiveAssessment {
  enabled: boolean;
  algorithm: AdaptiveAlgorithm;
  parameters: AdaptiveParameters;
  termination: TerminationCriteria;
  calibration: CalibrationMethod;
}

export type AdaptiveAlgorithm = 'cat' | 'multistage' | 'linear_on_the_fly' | 'shadow_testing';

export interface AdaptiveParameters {
  startingDifficulty: number; // 0-1
  stepSize: number; // 0-1
  precisionTarget: number; // 0-1
  contentBalancing: boolean;
  exposureControl: boolean;
}

export interface TerminationCriteria {
  maxItems: number;
  minItems: number;
  precisionThreshold: number; // 0-1
  confidenceLevel: number; // 0-1
  timeLimit: number; // minutes
}

export interface CalibrationMethod {
  type: CalibrationType;
  sampleSize: number;
  frequency: CalibrationFrequency;
  accuracy: number; // 0-1
}

export type CalibrationType = 'classical' | 'irt' | 'machine_learning' | 'expert_judgment';
export type CalibrationFrequency = 'initial' | 'periodic' | 'continuous' | 'on_demand';

export interface AssessmentAnalytics {
  tracking: AnalyticsTracking;
  metrics: AnalyticsMetric[];
  realtime: boolean;
  privacy: PrivacyLevel;
  retention: RetentionPolicy;
}

export interface AnalyticsTracking {
  responses: boolean;
  timing: boolean;
  patterns: boolean;
  attempts: boolean;
  navigation: boolean;
  help_seeking: boolean;
}

export type PrivacyLevel = 'public' | 'institutional' | 'private' | 'anonymous';

export interface RetentionPolicy {
  duration: number; // days
  aggregation: AggregationLevel;
  deletion: DeletionMethod;
  compliance: ComplianceFramework[];
}

export type DeletionMethod = 'automatic' | 'manual' | 'user_initiated' | 'policy_based';
export type ComplianceFramework = 'gdpr' | 'ferpa' | 'coppa' | 'hipaa' | 'custom';

export interface SegmentTransition {
  id: string;
  type: TransitionType;
  condition: TransitionCondition;
  animation: TransitionAnimation;
  timing: TransitionTiming;
  validation: TransitionValidation;
}

export type TransitionType = 
  | 'automatic' | 'manual' | 'conditional' | 'timed' | 'performance_based' 
  | 'choice_based' | 'adaptive' | 'mastery_based';

export interface TransitionCondition {
  type: ConditionType;
  threshold: number;
  operator: ComparisonOperator;
  logic: LogicalOperator;
  dependencies: ConditionDependency[];
}

export type LogicalOperator = 'and' | 'or' | 'not' | 'xor';

export interface ConditionDependency {
  type: DependencyType;
  target: string;
  relationship: DependencyRelationship;
  strength: number; // 0-1
}

export type DependencyType = 'prerequisite' | 'corequisite' | 'inhibitor' | 'enabler';
export type DependencyRelationship = 'requires' | 'suggests' | 'prevents' | 'enhances';

export interface TransitionAnimation {
  type: AnimationType;
  duration: number; // milliseconds
  easing: EasingFunction;
  direction: AnimationDirection;
  effects: AnimationEffect[];
}

export type AnimationType = 'fade' | 'slide' | 'zoom' | 'flip' | 'dissolve' | 'none';
export type EasingFunction = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'bounce';
export type AnimationDirection = 'left' | 'right' | 'up' | 'down' | 'in' | 'out';

export interface AnimationEffect {
  property: string;
  startValue: any;
  endValue: any;
  delay: number; // milliseconds
}

export interface TransitionTiming {
  delay: number; // milliseconds
  duration: number; // milliseconds
  scheduling: SchedulingMethod;
  optimization: TimingOptimization;
}

export type SchedulingMethod = 'immediate' | 'batched' | 'queued' | 'priority' | 'adaptive';

export interface TimingOptimization {
  cognitiveLoad: boolean;
  attention: boolean;
  memory: boolean;
  fatigue: boolean;
  engagement: boolean;
}

export interface TransitionValidation {
  required: boolean;
  method: ValidationMethod;
  criteria: ValidationCriteria;
  fallback: FallbackStrategy;
}

export interface FallbackStrategy {
  type: FallbackType;
  action: FallbackAction;
  notification: boolean;
  logging: boolean;
}

export type FallbackType = 'retry' | 'skip' | 'alternative' | 'manual' | 'abort';
export type FallbackAction = 'continue' | 'repeat' | 'redirect' | 'pause' | 'exit';

export interface SegmentAdaptation {
  id: string;
  type: AdaptationType;
  trigger: AdaptationTrigger;
  implementation: AdaptationImplementation;
  evaluation: AdaptationEvaluation;
  rollback: RollbackStrategy;
}

export interface AdaptationTrigger {
  condition: TriggerCondition;
  frequency: TriggerFrequency;
  sensitivity: number; // 0-1
  delay: number; // milliseconds
}

export interface TriggerFrequency {
  type: FrequencyType;
  interval: number;
  limit: number;
  cooldown: number; // milliseconds
}

export interface AdaptationImplementation {
  method: ImplementationMethod;
  parameters: ImplementationParameters;
  validation: ImplementationValidation;
  monitoring: ImplementationMonitoring;
}

export type ImplementationMethod = 'immediate' | 'gradual' | 'batched' | 'queued' | 'scheduled';

export interface ImplementationParameters {
  intensity: number; // 0-1
  scope: AdaptationScope;
  duration: number; // milliseconds
  persistence: PersistenceLevel;
}

export type AdaptationScope = 'element' | 'segment' | 'sequence' | 'session' | 'course';

export interface ImplementationValidation {
  precheck: boolean;
  postcheck: boolean;
  continuous: boolean;
  rollback: boolean;
}

export interface ImplementationMonitoring {
  metrics: MonitoringMetric[];
  frequency: MonitoringFrequency;
  alerts: MonitoringAlert[];
  reporting: MonitoringReporting;
}

export interface MonitoringMetric {
  name: string;
  type: MetricType;
  threshold: number;
  direction: MetricDirection;
}

export type MetricType = 'performance' | 'engagement' | 'satisfaction' | 'efficiency' | 'error';
export type MetricDirection = 'higher_better' | 'lower_better' | 'target_value' | 'stable';
export type MonitoringFrequency = 'real_time' | 'periodic' | 'event_based' | 'on_demand';

export interface MonitoringAlert {
  condition: string;
  severity: AlertSeverity;
  action: AlertAction;
  escalation: AlertEscalation;
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertAction = 'log' | 'notify' | 'pause' | 'rollback' | 'escalate';

export interface AlertEscalation {
  enabled: boolean;
  delay: number; // milliseconds
  levels: EscalationLevel[];
  termination: EscalationTermination;
}

export interface EscalationLevel {
  threshold: number;
  action: EscalationAction;
  recipient: string;
  timeout: number; // milliseconds
}

export interface EscalationTermination {
  maxLevels: number;
  timeout: number; // milliseconds
  fallback: EscalationAction;
}

export interface MonitoringReporting {
  enabled: boolean;
  frequency: ReportingFrequency;
  format: ReportingFormat;
  distribution: ReportingDistribution;
}

export type ReportingFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type ReportingFormat = 'json' | 'csv' | 'xml' | 'html' | 'pdf';

export interface ReportingDistribution {
  channels: ReportingChannel[];
  recipients: ReportingRecipient[];
  filters: ReportingFilter[];
}

export type ReportingChannel = 'email' | 'dashboard' | 'api' | 'file' | 'database';

export interface ReportingRecipient {
  id: string;
  type: RecipientType;
  preferences: RecipientPreferences;
  authorization: AuthorizationLevel;
}

export type RecipientType = 'user' | 'role' | 'group' | 'system' | 'external';

export interface RecipientPreferences {
  frequency: ReportingFrequency;
  format: ReportingFormat;
  detail: DetailLevel;
  language: string;
}

export type DetailLevel = 'summary' | 'standard' | 'detailed' | 'comprehensive';
export type AuthorizationLevel = 'read' | 'write' | 'admin' | 'super_admin';

export interface ReportingFilter {
  type: FilterType;
  criteria: FilterCriteria;
  inclusion: boolean;
  priority: number;
}

export type FilterType = 'metric' | 'time' | 'user' | 'content' | 'performance';

export interface FilterCriteria {
  field: string;
  operator: ComparisonOperator;
  value: any;
  sensitivity: number; // 0-1
}

export interface AdaptationEvaluation {
  metrics: EvaluationMetric[];
  criteria: EvaluationCriteria;
  method: EvaluationMethod;
  frequency: EvaluationFrequency;
}

export interface EvaluationMetric {
  name: string;
  type: MetricType;
  weight: number; // 0-1
  target: number;
  tolerance: number; // percentage
}

export interface EvaluationCriteria {
  success: SuccessCriteria;
  failure: FailureCriteria;
  neutral: NeutralCriteria;
}

export interface SuccessCriteria {
  threshold: number;
  duration: number; // milliseconds
  consistency: number; // 0-1
  significance: number; // 0-1
}

export interface FailureCriteria {
  threshold: number;
  duration: number; // milliseconds
  severity: number; // 0-1
  impact: number; // 0-1
}

export interface NeutralCriteria {
  range: NumberRange;
  variance: number; // 0-1
  trend: TrendDirection;
  stability: number; // 0-1
}

export interface NumberRange {
  min: number;
  max: number;
  optimal: number;
}

export type EvaluationMethod = 'statistical' | 'heuristic' | 'machine_learning' | 'expert_system';
export type EvaluationFrequency = 'continuous' | 'periodic' | 'triggered' | 'on_demand';

export interface RollbackStrategy {
  enabled: boolean;
  triggers: RollbackTrigger[];
  method: RollbackMethod;
  validation: RollbackValidation;
}

export interface RollbackTrigger {
  condition: string;
  threshold: number;
  timeout: number; // milliseconds
  automatic: boolean;
}

export type RollbackMethod = 'immediate' | 'gradual' | 'partial' | 'complete' | 'selective';

export interface RollbackValidation {
  required: boolean;
  method: ValidationMethod;
  criteria: ValidationCriteria;
  approval: ApprovalRequirement;
}

export interface ApprovalRequirement {
  required: boolean;
  level: ApprovalLevel;
  timeout: number; // milliseconds
  fallback: ApprovalFallback;
}

export type ApprovalLevel = 'user' | 'instructor' | 'admin' | 'system' | 'automatic';
export type ApprovalFallback = 'approve' | 'reject' | 'escalate' | 'defer' | 'timeout';

export interface SegmentPerformance {
  engagement: EngagementMetrics;
  completion: CompletionMetrics;
  comprehension: ComprehensionMetrics;
  efficiency: EfficiencyMetrics;
  satisfaction: SatisfactionMetrics;
}

export interface EngagementMetrics {
  duration: number; // actual time spent
  interactions: number;
  attention: number; // 0-1
  participation: number; // 0-1
  revisits: number;
}

export interface CompletionMetrics {
  rate: number; // 0-1
  time: number; // minutes
  attempts: number;
  success: boolean;
  quality: number; // 0-1
}

export interface ComprehensionMetrics {
  accuracy: number; // 0-1
  depth: number; // 0-1
  transfer: number; // 0-1
  retention: number; // 0-1
  connections: number;
}

export interface EfficiencyMetrics {
  timeToCompletion: number; // minutes
  errorRate: number; // 0-1
  helpSeeking: number;
  redundancy: number; // 0-1
  optimization: number; // 0-1
}

export interface SatisfactionMetrics {
  rating: number; // 1-5
  difficulty: number; // 1-5
  relevance: number; // 1-5
  clarity: number; // 1-5
  recommendation: number; // 1-5
}

export interface SegmentMetadata {
  version: string;
  author: string;
  created: Date;
  modified: Date;
  tags: string[];
  categories: string[];
  language: string;
  accessibility: AccessibilityLevel;
  copyright: CopyrightInfo;
}

export type AccessibilityLevel = 'none' | 'basic' | 'enhanced' | 'full';

export interface CopyrightInfo {
  owner: string;
  license: LicenseType;
  usage: UsageRights;
  attribution: AttributionRequirement;
}

export type LicenseType = 'public_domain' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'proprietary';

export interface UsageRights {
  commercial: boolean;
  educational: boolean;
  modification: boolean;
  distribution: boolean;
  attribution: boolean;
}

export interface AttributionRequirement {
  required: boolean;
  format: string;
  placement: AttributionPlacement;
  visibility: AttributionVisibility;
}

export type AttributionPlacement = 'inline' | 'footer' | 'separate' | 'metadata';
export type AttributionVisibility = 'prominent' | 'standard' | 'minimal' | 'hidden';

export interface SegmentationStrategy {
  id: string;
  name: string;
  description: string;
  type: SegmentationStrategyType;
  parameters: SegmentationParameters;
  rules: SegmentationRule[];
  evaluation: StrategyEvaluation;
  optimization: StrategyOptimization;
}

export type SegmentationStrategyType = 
  | 'time_based' | 'content_based' | 'cognitive_load' | 'learning_objective' 
  | 'difficulty_progression' | 'attention_span' | 'adaptive' | 'hybrid';

export interface SegmentationParameters {
  maxDuration: number; // minutes
  minDuration: number; // minutes
  targetDuration: number; // minutes
  maxCognitiveLoad: number; // 0-1
  overlapAllowed: boolean;
  bufferTime: number; // minutes
}

export interface SegmentationRule {
  id: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  weight: number; // 0-1
  active: boolean;
}

export interface RuleCondition {
  type: ConditionType;
  operator: ComparisonOperator;
  value: any;
  context: RuleContext;
}

export interface RuleContext {
  scope: ContextScope;
  variables: ContextVariable[];
  constraints: ContextConstraint[];
}

export type ContextScope = 'global' | 'course' | 'module' | 'content' | 'user';

export interface ContextVariable {
  name: string;
  type: VariableType;
  source: VariableSource;
  default: any;
}

export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';
export type VariableSource = 'user' | 'content' | 'system' | 'analytics' | 'external';

export interface ContextConstraint {
  type: ConstraintType;
  condition: string;
  enforcement: EnforcementLevel;
  penalty: number; // 0-1
}

export type ConstraintType = 'hard' | 'soft' | 'preference' | 'optimization';
export type EnforcementLevel = 'strict' | 'moderate' | 'lenient' | 'advisory';

export interface RuleAction {
  type: ActionType;
  parameters: ActionParameters;
  conditions: ActionCondition[];
  effects: ActionEffect[];
}

export interface ActionParameters {
  intensity: number; // 0-1
  duration: number; // milliseconds
  scope: ActionScope;
  persistence: PersistenceLevel;
}

export type ActionScope = 'immediate' | 'segment' | 'sequence' | 'session' | 'global';

export interface ActionCondition {
  type: ConditionType;
  requirement: string;
  optional: boolean;
  weight: number; // 0-1
}

export interface ActionEffect {
  target: string;
  change: EffectChange;
  duration: number; // milliseconds
  reversible: boolean;
}

export interface EffectChange {
  type: ChangeType;
  magnitude: number; // 0-1
  direction: ChangeDirection;
  confidence: number; // 0-1
}

export type ChangeDirection = 'increase' | 'decrease' | 'maintain' | 'optimize';

export interface StrategyEvaluation {
  effectiveness: number; // 0-1
  efficiency: number; // 0-1
  satisfaction: number; // 0-1
  robustness: number; // 0-1
  adaptability: number; // 0-1
  scalability: number; // 0-1
}

export interface StrategyOptimization {
  enabled: boolean;
  method: OptimizationMethod;
  objectives: OptimizationObjective[];
  constraints: OptimizationConstraint[];
  frequency: OptimizationFrequency;
}

export type OptimizationMethod = 'genetic' | 'gradient' | 'simulated_annealing' | 'particle_swarm' | 'bayesian';
export type OptimizationFrequency = 'real_time' | 'periodic' | 'triggered' | 'manual';

export interface OptimizationObjective {
  name: string;
  type: ObjectiveType;
  weight: number; // 0-1
  target: number;
  tolerance: number; // percentage
}

export interface OptimizationConstraint {
  name: string;
  type: ConstraintType;
  condition: string;
  priority: number;
  flexibility: number; // 0-1
}

export interface SegmentLoadProfile {
  intrinsic: LoadProfile;
  extraneous: LoadProfile;
  germane: LoadProfile;
  total: LoadProfile;
  capacity: CapacityProfile;
}

export interface LoadProfile {
  baseline: number; // 0-1
  peak: number; // 0-1
  average: number; // 0-1
  variability: number; // 0-1
  trend: TrendDirection;
}

export interface CapacityProfile {
  maximum: number; // 0-1
  available: number; // 0-1
  utilization: number; // 0-1
  efficiency: number; // 0-1
  fatigue: number; // 0-1
}

export interface AdaptiveConfig {
  enabled: boolean;
  sensitivity: number; // 0-1
  responsiveness: number; // 0-1
  stability: number; // 0-1
  learning: LearningConfig;
  personalization: PersonalizationConfig;
}

export interface LearningConfig {
  enabled: boolean;
  algorithm: LearningAlgorithm;
  parameters: LearningParameters;
  validation: LearningValidation;
}

export type LearningAlgorithm = 'reinforcement' | 'supervised' | 'unsupervised' | 'ensemble';

export interface LearningParameters {
  learningRate: number; // 0-1
  explorationRate: number; // 0-1
  memorySize: number;
  updateFrequency: number; // milliseconds
}

export interface LearningValidation {
  method: ValidationMethod;
  criteria: ValidationCriteria;
  frequency: ValidationFrequency;
  threshold: number; // 0-1
}

export interface PersonalizationConfig {
  dimensions: PersonalizationDimension[];
  weighting: PersonalizationWeighting;
  update: PersonalizationUpdate;
  privacy: PersonalizationPrivacy;
}

export interface PersonalizationDimension {
  name: string;
  type: DimensionType;
  range: NumberRange;
  default: number;
  sensitivity: number; // 0-1
}

export type DimensionType = 'cognitive' | 'behavioral' | 'preferential' | 'contextual';

export interface PersonalizationWeighting {
  method: WeightingMethod;
  decay: number; // 0-1
  recency: number; // 0-1
  reliability: number; // 0-1
}

export interface PersonalizationUpdate {
  frequency: UpdateFrequency;
  trigger: UpdateTrigger[];
  validation: UpdateValidation;
  rollback: UpdateRollback;
}

export type UpdateFrequency = 'real_time' | 'session' | 'daily' | 'weekly' | 'monthly';

export interface UpdateTrigger {
  condition: string;
  threshold: number;
  delay: number; // milliseconds
  priority: number;
}

export interface UpdateValidation {
  required: boolean;
  method: ValidationMethod;
  criteria: ValidationCriteria;
  approval: ApprovalRequirement;
}

export interface UpdateRollback {
  enabled: boolean;
  triggers: RollbackTrigger[];
  method: RollbackMethod;
  retention: number; // days
}

export interface PersonalizationPrivacy {
  level: PrivacyLevel;
  consent: ConsentRequirement;
  anonymization: AnonymizationMethod;
  retention: RetentionPolicy;
}

export interface ConsentRequirement {
  required: boolean;
  granular: boolean;
  revocable: boolean;
  expiration: number; // days
}

export type AnonymizationMethod = 'none' | 'pseudonymization' | 'aggregation' | 'differential_privacy';

export interface SegmentationPerformance {
  effectiveness: PerformanceMetric;
  efficiency: PerformanceMetric;
  quality: PerformanceMetric;
  satisfaction: PerformanceMetric;
  scalability: PerformanceMetric;
}

export interface PerformanceMetric {
  current: number; // 0-1
  target: number; // 0-1
  trend: TrendDirection;
  variance: number; // 0-1
  reliability: number; // 0-1
}

export interface SegmentationMetadata {
  version: string;
  algorithm: string;
  parameters: Record<string, any>;
  created: Date;
  updated: Date;
  usage: UsageStatistics;
  feedback: FeedbackSummary;
}

export interface UsageStatistics {
  totalUsers: number;
  activeUsers: number;
  completionRate: number; // 0-1
  averageTime: number; // minutes
  errorRate: number; // 0-1
}

export interface FeedbackSummary {
  ratings: RatingDistribution;
  comments: CommentSummary;
  suggestions: SuggestionSummary;
  issues: IssueSummary;
}

export interface RatingDistribution {
  average: number; // 1-5
  distribution: Record<number, number>;
  total: number;
  trend: TrendDirection;
}

export interface CommentSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  themes: CommentTheme[];
}

export interface CommentTheme {
  theme: string;
  frequency: number;
  sentiment: SentimentScore;
  examples: string[];
}

export interface SentimentScore {
  positive: number; // 0-1
  negative: number; // 0-1
  neutral: number; // 0-1
  compound: number; // -1 to 1
}

export interface SuggestionSummary {
  total: number;
  categories: SuggestionCategory[];
  priority: PrioritySummary;
  feasibility: FeasibilitySummary;
}

export interface SuggestionCategory {
  name: string;
  count: number;
  priority: number; // 0-1
  examples: string[];
}

export interface PrioritySummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface FeasibilitySummary {
  easy: number;
  moderate: number;
  difficult: number;
  total: number;
}

export interface IssueSummary {
  total: number;
  resolved: number;
  pending: number;
  critical: number;
  categories: IssueCategory[];
}

export interface IssueCategory {
  name: string;
  count: number;
  severity: IssueSeverity;
  examples: string[];
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TimingConfiguration {
  delay: number; // milliseconds
  duration: number; // milliseconds
  repeat: boolean;
  interval: number; // milliseconds
}

// Microlearning Analytics Types
export interface MicrolearningAnalytics {
  segmentationId: string;
  timeRange: DateRange;
  performance: AnalyticsPerformance;
  engagement: AnalyticsEngagement;
  learning: AnalyticsLearning;
  adaptation: AnalyticsAdaptation;
  recommendations: AnalyticsRecommendation[];
}

export interface AnalyticsPerformance {
  completion: CompletionAnalytics;
  accuracy: AccuracyAnalytics;
  efficiency: EfficiencyAnalytics;
  progression: ProgressionAnalytics;
}

export interface CompletionAnalytics {
  overall: number; // 0-1
  bySegment: Record<string, number>;
  byUser: Record<string, number>;
  trends: CompletionTrend[];
}

export interface CompletionTrend {
  period: string;
  rate: number; // 0-1
  change: number; // percentage
  significance: number; // 0-1
}

export interface AccuracyAnalytics {
  overall: number; // 0-1
  bySegment: Record<string, number>;
  byObjective: Record<string, number>;
  errorPatterns: ErrorPattern[];
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  severity: number; // 0-1
  segments: string[];
  remediation: string;
}

export interface EfficiencyAnalytics {
  timeToCompletion: TimeAnalytics;
  resourceUtilization: ResourceAnalytics;
  cognitiveLoad: LoadAnalytics;
  optimization: OptimizationAnalytics;
}

export interface TimeAnalytics {
  average: number; // minutes
  median: number; // minutes
  distribution: TimeDistribution;
  trends: TimeTrend[];
}

export interface TimeDistribution {
  bins: TimeBin[];
  outliers: OutlierInfo[];
  percentiles: PercentileData;
}

export interface TimeBin {
  range: NumberRange;
  count: number;
  percentage: number; // 0-1
}

export interface OutlierInfo {
  value: number;
  type: OutlierType;
  frequency: number;
  investigation: string;
}

export type OutlierType = 'high' | 'low' | 'anomaly';

export interface PercentileData {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface TimeTrend {
  period: string;
  direction: TrendDirection;
  magnitude: number; // 0-1
  acceleration: number; // -1 to 1
}

export interface ResourceAnalytics {
  content: ResourceUtilization;
  features: FeatureUtilization;
  support: SupportUtilization;
  efficiency: UtilizationEfficiency;
}

export interface ResourceUtilization {
  accessed: number;
  completed: number;
  repeated: number;
  abandoned: number;
  effectiveness: number; // 0-1
}

export interface FeatureUtilization {
  interactive: number;
  multimedia: number;
  assessment: number;
  scaffolding: number;
  adaptation: number;
}

export interface SupportUtilization {
  hints: number;
  examples: number;
  explanations: number;
  remediation: number;
  human: number;
}

export interface UtilizationEfficiency {
  contentToOutcome: number; // 0-1
  timeToMastery: number; // 0-1
  supportToIndependence: number; // 0-1
  overallEfficiency: number; // 0-1
}

export interface LoadAnalytics {
  intrinsic: LoadMetrics;
  extraneous: LoadMetrics;
  germane: LoadMetrics;
  total: LoadMetrics;
  optimization: LoadOptimization;
}

export interface LoadMetrics {
  average: number; // 0-1
  peak: number; // 0-1
  variability: number; // 0-1
  distribution: LoadDistribution;
  patterns: LoadPattern[];
}

export interface LoadDistribution {
  low: number; // percentage
  optimal: number; // percentage
  high: number; // percentage
  overload: number; // percentage
}

export interface LoadPattern {
  id: string;
  description: string;
  frequency: number;
  conditions: string[];
  implications: string[];
}

export interface LoadOptimization {
  opportunities: OptimizationOpportunity[];
  implemented: OptimizationImplemented[];
  effectiveness: OptimizationEffectiveness;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationOpportunity {
  type: OptimizationType;
  potential: number; // 0-1
  effort: ImplementationEffort;
  priority: number; // 0-1
}

export type OptimizationType = 'reduce_intrinsic' | 'eliminate_extraneous' | 'enhance_germane' | 'balance_total';

export interface OptimizationImplemented {
  id: string;
  type: OptimizationType;
  timestamp: Date;
  effectiveness: number; // 0-1
  sideEffects: string[];
}

export interface OptimizationEffectiveness {
  loadReduction: number; // 0-1
  performanceGain: number; // 0-1
  satisfactionImprovement: number; // 0-1
  timeReduction: number; // 0-1
}

export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  description: string;
  priority: number; // 0-1
  effort: ImplementationEffort;
  impact: number; // 0-1
}

export interface ProgressionAnalytics {
  mastery: MasteryAnalytics;
  sequence: SequenceAnalytics;
  adaptation: AdaptationAnalytics;
  prediction: PredictionAnalytics;
}

export interface MasteryAnalytics {
  overall: number; // 0-1
  byObjective: Record<string, number>;
  bySegment: Record<string, number>;
  progression: MasteryProgression[];
}

export interface MasteryProgression {
  timestamp: Date;
  objective: string;
  level: number; // 0-1
  evidence: string[];
  confidence: number; // 0-1
}

export interface SequenceAnalytics {
  completion: SequenceCompletion;
  efficiency: SequenceEfficiency;
  patterns: SequencePattern[];
  optimization: SequenceOptimization;
}

export interface SequenceCompletion {
  linear: number; // 0-1
  nonLinear: number; // 0-1
  abandoned: number; // 0-1
  repeated: number; // 0-1
}

export interface SequenceEfficiency {
  optimal: number; // 0-1
  redundant: number; // 0-1
  gaps: number; // 0-1
  jumps: number; // 0-1
}

export interface SequencePattern {
  id: string;
  description: string;
  frequency: number;
  efficiency: number; // 0-1
  outcomes: string[];
}

export interface SequenceOptimization {
  opportunities: string[];
  implemented: string[];
  effectiveness: number; // 0-1
  recommendations: string[];
}

export interface AnalyticsEngagement {
  attention: AttentionAnalytics;
  interaction: InteractionAnalytics;
  motivation: MotivationAnalytics;
  satisfaction: SatisfactionAnalytics;
}

export interface AttentionAnalytics {
  duration: number; // minutes
  focus: number; // 0-1
  distractions: number;
  patterns: AttentionPattern[];
  predictions: AttentionPrediction[];
}

export interface AttentionPrediction {
  timestamp: Date;
  level: number; // 0-1
  confidence: number; // 0-1
  factors: string[];
}

export interface InteractionAnalytics {
  frequency: number;
  diversity: number; // 0-1
  quality: number; // 0-1
  patterns: InteractionPattern[];
  effectiveness: InteractionEffectiveness;
}

export interface InteractionPattern {
  type: string;
  frequency: number;
  context: string[];
  outcomes: string[];
  optimization: string[];
}

export interface InteractionEffectiveness {
  learningGain: number; // 0-1
  engagementIncrease: number; // 0-1
  satisfactionImprovement: number; // 0-1
  timeEfficiency: number; // 0-1
}

export interface MotivationAnalytics {
  intrinsic: number; // 0-1
  extrinsic: number; // 0-1
  persistence: number; // 0-1
  trends: MotivationTrend[];
  factors: MotivationFactor[];
}

export interface MotivationTrend {
  period: string;
  direction: TrendDirection;
  magnitude: number; // 0-1
  sustainability: number; // 0-1
}

export interface MotivationFactor {
  type: string;
  impact: number; // -1 to 1
  controllable: boolean;
  interventions: string[];
}

export interface SatisfactionAnalytics {
  overall: number; // 1-5
  dimensions: SatisfactionDimension[];
  trends: SatisfactionTrend[];
  feedback: SatisfactionFeedback;
}

export interface SatisfactionDimension {
  name: string;
  score: number; // 1-5
  importance: number; // 0-1
  performance: number; // 0-1
}

export interface SatisfactionTrend {
  period: string;
  score: number; // 1-5
  change: number; // percentage
  drivers: string[];
}

export interface SatisfactionFeedback {
  positive: string[];
  negative: string[];
  suggestions: string[];
  sentiment: SentimentScore;
}

export interface AnalyticsLearning {
  outcomes: LearningOutcomeAnalytics;
  transfer: TransferAnalytics;
  retention: RetentionAnalytics;
  metacognition: MetacognitionAnalytics;
}

export interface LearningOutcomeAnalytics {
  achievement: AchievementAnalytics;
  quality: QualityAnalytics;
  efficiency: LearningEfficiency;
  sustainability: SustainabilityAnalytics;
}

export interface AchievementAnalytics {
  rate: number; // 0-1
  level: number; // 0-1
  distribution: AchievementDistribution;
  predictors: AchievementPredictor[];
}

export interface AchievementDistribution {
  byObjective: Record<string, number>;
  bySegment: Record<string, number>;
  byUser: Record<string, number>;
  overall: DistributionStatistics;
}

export interface DistributionStatistics {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
}

export interface AchievementPredictor {
  factor: string;
  correlation: number; // -1 to 1
  importance: number; // 0-1
  actionable: boolean;
}

export interface QualityAnalytics {
  depth: number; // 0-1
  breadth: number; // 0-1
  integration: number; // 0-1
  application: number; // 0-1
  evidence: QualityEvidence[];
}

export interface QualityEvidence {
  type: string;
  score: number; // 0-1
  reliability: number; // 0-1
  validity: number; // 0-1
}

export interface LearningEfficiency {
  timeToMastery: number; // hours
  resourceUtilization: number; // 0-1
  cognitiveEfficiency: number; // 0-1
  supportDependency: number; // 0-1
}

export interface SustainabilityAnalytics {
  retention: number; // 0-1
  transfer: number; // 0-1
  application: number; // 0-1
  motivation: number; // 0-1
}

export interface TransferAnalytics {
  near: number; // 0-1
  far: number; // 0-1
  contexts: TransferContext[];
  effectiveness: TransferEffectiveness;
}

export interface TransferContext {
  type: string;
  similarity: number; // 0-1
  success: number; // 0-1
  factors: string[];
}

export interface TransferEffectiveness {
  preparation: number; // 0-1
  recognition: number; // 0-1
  application: number; // 0-1
  adaptation: number; // 0-1
}

export interface RetentionAnalytics {
  shortTerm: number; // 0-1
  longTerm: number; // 0-1
  decay: RetentionDecay;
  factors: RetentionFactor[];
}

export interface RetentionDecay {
  rate: number; // 0-1
  halfLife: number; // days
  asymptote: number; // 0-1
  curve: DecayCurve;
}

export interface DecayCurve {
  type: CurveType;
  parameters: Record<string, number>;
  fit: number; // 0-1
  prediction: number; // 0-1
}

export type CurveType = 'exponential' | 'power' | 'logarithmic' | 'linear';

export interface RetentionFactor {
  name: string;
  impact: number; // -1 to 1
  modifiable: boolean;
  interventions: string[];
}

export interface MetacognitionAnalytics {
  awareness: number; // 0-1
  regulation: number; // 0-1
  strategies: StrategyAnalytics[];
  development: MetacognitionDevelopment;
}

export interface StrategyAnalytics {
  name: string;
  usage: number; // 0-1
  effectiveness: number; // 0-1
  appropriateness: number; // 0-1
  development: number; // 0-1
}

export interface MetacognitionDevelopment {
  trajectory: DevelopmentTrajectory;
  milestones: DevelopmentMilestone[];
  predictions: DevelopmentPrediction[];
  support: DevelopmentSupport;
}

export interface DevelopmentTrajectory {
  current: number; // 0-1
  target: number; // 0-1
  rate: number; // 0-1
  timeline: number; // days
}

export interface DevelopmentMilestone {
  name: string;
  achieved: boolean;
  timestamp: Date;
  evidence: string[];
}

export interface DevelopmentPrediction {
  milestone: string;
  probability: number; // 0-1
  timeline: number; // days
  requirements: string[];
}

export interface DevelopmentSupport {
  current: string[];
  needed: string[];
  effectiveness: number; // 0-1
  recommendations: string[];
}

export interface AnalyticsAdaptation {
  frequency: number;
  effectiveness: number; // 0-1
  types: AdaptationType[];
  triggers: AdaptationTriggerAnalytics[];
  outcomes: AdaptationOutcomeAnalytics;
}

export interface AdaptationTriggerAnalytics {
  type: string;
  frequency: number;
  accuracy: number; // 0-1
  responsiveness: number; // 0-1
  optimization: string[];
}

export interface AdaptationOutcomeAnalytics {
  success: number; // 0-1
  improvement: number; // 0-1
  satisfaction: number; // 0-1
  sideEffects: string[];
}

export interface AnalyticsRecommendation {
  id: string;
  type: RecommendationType;
  priority: number; // 0-1
  description: string;
  rationale: string;
  evidence: string[];
  implementation: ImplementationGuide;
  impact: ImpactEstimate;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  resources: string[];
  timeline: number; // days
  effort: ImplementationEffort;
}

export interface ImplementationStep {
  order: number;
  description: string;
  duration: number; // hours
  dependencies: string[];
  validation: string;
}

export interface ImpactEstimate {
  learning: number; // 0-1
  engagement: number; // 0-1
  efficiency: number; // 0-1
  satisfaction: number; // 0-1
  confidence: number; // 0-1
}

// Date range utility type
export interface DateRange {
  start: Date;
  end: Date;
}