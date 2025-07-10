// Emotion Detection and Sentiment Analysis Types

export interface EmotionDetectionResult {
  id: string;
  studentId: string;
  sessionId: string;
  courseId: string;
  contentId?: string;
  timestamp: Date;
  emotions: EmotionScore[];
  primaryEmotion: EmotionType;
  emotionalState: EmotionalState;
  sentiment: SentimentAnalysis;
  confidence: number; // 0-1
  source: DetectionSource;
  context: EmotionContext;
  metadata: EmotionMetadata;
}

export interface EmotionScore {
  emotion: EmotionType;
  intensity: number; // 0-1
  confidence: number; // 0-1
  duration: number; // milliseconds
  trend: EmotionTrend;
  triggers: EmotionTrigger[];
}

export type EmotionType = 
  | 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'surprise'
  | 'excitement' | 'frustration' | 'confusion' | 'confidence' | 'anxiety'
  | 'boredom' | 'curiosity' | 'satisfaction' | 'disappointment' | 'pride'
  | 'shame' | 'guilt' | 'relief' | 'anticipation' | 'contempt';

export interface EmotionalState {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to excited)
  dominance: number; // 0-1 (submissive to dominant)
  engagement: number; // 0-1 (disengaged to highly engaged)
  motivation: number; // 0-1 (unmotivated to highly motivated)
  stress: number; // 0-1 (relaxed to stressed)
  focus: number; // 0-1 (distracted to focused)
  flow: number; // 0-1 (not in flow to deep flow)
}

export interface SentimentAnalysis {
  overallSentiment: SentimentPolarity;
  sentimentScore: number; // -1 to 1
  confidence: number; // 0-1
  aspects: AspectSentiment[];
  emotionalTone: EmotionalTone;
  socialSentiment: SocialSentiment;
  temporalSentiment: TemporalSentiment;
}

export type SentimentPolarity = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

export interface AspectSentiment {
  aspect: SentimentAspect;
  sentiment: SentimentPolarity;
  score: number; // -1 to 1
  confidence: number; // 0-1
  evidence: string[];
}

export type SentimentAspect = 
  | 'content_quality' | 'difficulty_level' | 'pacing' | 'relevance'
  | 'instructor_quality' | 'platform_usability' | 'assessment_fairness'
  | 'feedback_quality' | 'peer_interaction' | 'technical_issues'
  | 'learning_outcomes' | 'engagement_level' | 'time_management';

export interface EmotionalTone {
  formal: number; // 0-1
  casual: number; // 0-1
  enthusiastic: number; // 0-1
  concerned: number; // 0-1
  analytical: number; // 0-1
  emotional: number; // 0-1
  urgent: number; // 0-1
  supportive: number; // 0-1
}

export interface SocialSentiment {
  peerInteraction: number; // -1 to 1
  instructorRelation: number; // -1 to 1
  groupDynamics: number; // -1 to 1
  communityFeeling: number; // -1 to 1
  collaborationWillingness: number; // 0-1
  helpSeeking: number; // 0-1
}

export interface TemporalSentiment {
  trends: SentimentTrend[];
  patterns: SentimentPattern[];
  volatility: number; // 0-1
  stability: number; // 0-1
  recovery: RecoveryMetrics;
}

export interface SentimentTrend {
  timeframe: TimeFrame;
  direction: TrendDirection;
  magnitude: number; // 0-1
  significance: number; // 0-1
  factors: TrendFactor[];
}

export type TimeFrame = 'session' | 'daily' | 'weekly' | 'monthly' | 'course';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

export interface TrendFactor {
  factor: string;
  impact: number; // -1 to 1
  evidence: string[];
  confidence: number; // 0-1
}

export interface SentimentPattern {
  id: string;
  name: string;
  description: string;
  frequency: PatternFrequency;
  contexts: PatternContext[];
  predictors: PatternPredictor[];
  interventions: PatternIntervention[];
}

export type PatternFrequency = 'rare' | 'occasional' | 'frequent' | 'very_frequent';

export interface PatternContext {
  type: ContextType;
  conditions: string[];
  probability: number; // 0-1
}

export type ContextType = 
  | 'time_of_day' | 'day_of_week' | 'content_type' | 'difficulty_level'
  | 'social_setting' | 'device_type' | 'environment' | 'prior_performance';

export interface PatternPredictor {
  feature: string;
  importance: number; // 0-1
  correlation: number; // -1 to 1
  leadTime: number; // minutes
}

export interface PatternIntervention {
  type: InterventionType;
  effectiveness: number; // 0-1
  applicability: number; // 0-1
  cost: InterventionCost;
}

export type InterventionType = 
  | 'encouragement' | 'break_suggestion' | 'difficulty_adjustment'
  | 'peer_support' | 'instructor_intervention' | 'content_modification'
  | 'pacing_change' | 'modality_switch' | 'gamification'
  | 'mindfulness_prompt' | 'goal_reminder' | 'progress_highlight';

export type InterventionCost = 'low' | 'medium' | 'high' | 'very_high';

export interface RecoveryMetrics {
  averageRecoveryTime: number; // minutes
  recoverySuccess: number; // 0-1
  recoveryStrategies: RecoveryStrategy[];
  resilience: number; // 0-1
}

export interface RecoveryStrategy {
  name: string;
  effectiveness: number; // 0-1
  timeToEffect: number; // minutes
  applicability: StrategyApplicability[];
}

export interface StrategyApplicability {
  condition: string;
  suitability: number; // 0-1
  evidence: string[];
}

export type EmotionTrend = 'increasing' | 'decreasing' | 'stable' | 'fluctuating';

export interface EmotionTrigger {
  type: TriggerType;
  source: TriggerSource;
  intensity: number; // 0-1
  duration: number; // milliseconds
  context: string;
}

export type TriggerType = 
  | 'content_complexity' | 'time_pressure' | 'feedback_received'
  | 'peer_comparison' | 'technical_difficulty' | 'achievement_unlocked'
  | 'mistake_made' | 'concept_understood' | 'progress_milestone'
  | 'social_interaction' | 'assessment_result' | 'deadline_approaching';

export type TriggerSource = 
  | 'learning_content' | 'assessment' | 'feedback' | 'social_interaction'
  | 'system_notification' | 'self_reflection' | 'external_factor'
  | 'progress_tracking' | 'peer_activity' | 'instructor_action';

export type DetectionSource = 
  | 'text_analysis' | 'facial_recognition' | 'voice_analysis'
  | 'behavioral_patterns' | 'physiological_sensors' | 'self_report'
  | 'interaction_analysis' | 'performance_correlation' | 'hybrid';

export interface EmotionContext {
  learningActivity: LearningActivity;
  socialContext: SocialContext;
  environmentalContext: EnvironmentalContext;
  temporalContext: TemporalContext;
  personalContext: PersonalContext;
}

export interface LearningActivity {
  type: ActivityType;
  difficulty: DifficultyLevel;
  duration: number; // minutes
  progress: number; // 0-1
  performance: ActivityPerformance;
  interactions: ActivityInteraction[];
}

export type ActivityType = 
  | 'reading' | 'video_watching' | 'quiz_taking' | 'discussion'
  | 'project_work' | 'simulation' | 'reflection' | 'research'
  | 'collaboration' | 'presentation' | 'practice' | 'assessment';

export type DifficultyLevel = 'very_easy' | 'easy' | 'moderate' | 'hard' | 'very_hard';

export interface ActivityPerformance {
  accuracy: number; // 0-1
  speed: number; // 0-1 (relative to expected)
  completion: number; // 0-1
  quality: number; // 0-1
  effort: number; // 0-1
}

export interface ActivityInteraction {
  type: InteractionType;
  frequency: number;
  duration: number; // milliseconds
  effectiveness: number; // 0-1
}

export type InteractionType = 
  | 'click' | 'scroll' | 'hover' | 'type' | 'voice' | 'gesture'
  | 'pause' | 'replay' | 'skip' | 'bookmark' | 'note' | 'share'
  | 'help_request' | 'hint_use' | 'feedback_request';

export interface SocialContext {
  setting: SocialSetting;
  participants: ParticipantInfo[];
  interactions: SocialInteraction[];
  atmosphere: SocialAtmosphere;
}

export type SocialSetting = 
  | 'individual' | 'pair' | 'small_group' | 'large_group'
  | 'virtual_classroom' | 'discussion_forum' | 'study_group'
  | 'mentoring_session' | 'peer_review' | 'collaborative_project';

export interface ParticipantInfo {
  role: ParticipantRole;
  relationship: RelationshipType;
  interaction_frequency: number;
  emotional_influence: number; // -1 to 1
}

export type ParticipantRole = 
  | 'student' | 'instructor' | 'teaching_assistant' | 'peer'
  | 'mentor' | 'tutor' | 'study_buddy' | 'project_partner';

export type RelationshipType = 
  | 'formal' | 'informal' | 'friendly' | 'competitive'
  | 'supportive' | 'challenging' | 'neutral' | 'conflicting';

export interface SocialInteraction {
  type: SocialInteractionType;
  sentiment: SentimentPolarity;
  impact: EmotionalImpact;
  reciprocity: number; // 0-1
}

export type SocialInteractionType = 
  | 'question_asking' | 'answer_providing' | 'feedback_giving'
  | 'encouragement' | 'criticism' | 'collaboration' | 'competition'
  | 'help_offering' | 'support_seeking' | 'knowledge_sharing';

export interface EmotionalImpact {
  magnitude: number; // 0-1
  direction: ImpactDirection;
  duration: number; // minutes
  spillover: SpilloverEffect[];
}

export type ImpactDirection = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface SpilloverEffect {
  target: SpilloverTarget;
  intensity: number; // 0-1
  timeDelay: number; // minutes
}

export type SpilloverTarget = 
  | 'motivation' | 'confidence' | 'engagement' | 'performance'
  | 'social_connection' | 'learning_attitude' | 'self_efficacy';

export interface SocialAtmosphere {
  supportiveness: number; // 0-1
  competitiveness: number; // 0-1
  inclusivity: number; // 0-1
  energy: number; // 0-1
  focus: number; // 0-1
  collaboration: number; // 0-1
}

export interface EnvironmentalContext {
  physical: PhysicalEnvironment;
  digital: DigitalEnvironment;
  distractions: DistractionInfo[];
  comfort: ComfortLevel;
}

export interface PhysicalEnvironment {
  location: LocationType;
  lighting: LightingCondition;
  noise: NoiseLevel;
  temperature: TemperatureComfort;
  space: SpaceQuality;
  privacy: PrivacyLevel;
}

export type LocationType = 
  | 'home' | 'library' | 'classroom' | 'office' | 'cafe'
  | 'outdoors' | 'transport' | 'dormitory' | 'study_hall';

export type LightingCondition = 
  | 'very_bright' | 'bright' | 'adequate' | 'dim' | 'very_dim'
  | 'natural' | 'artificial' | 'mixed' | 'glare' | 'eye_strain';

export type NoiseLevel = 
  | 'silent' | 'very_quiet' | 'quiet' | 'moderate' | 'noisy'
  | 'very_noisy' | 'distracting' | 'white_noise' | 'music';

export type TemperatureComfort = 
  | 'very_cold' | 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot' | 'very_hot';

export interface SpaceQuality {
  size: SpaceSize;
  organization: OrganizationLevel;
  ergonomics: ErgonomicQuality;
  resources: ResourceAvailability;
}

export type SpaceSize = 'cramped' | 'small' | 'adequate' | 'spacious' | 'very_spacious';
export type OrganizationLevel = 'chaotic' | 'disorganized' | 'adequate' | 'organized' | 'very_organized';
export type ErgonomicQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type ResourceAvailability = 'lacking' | 'minimal' | 'adequate' | 'abundant';
export type PrivacyLevel = 'public' | 'semi_private' | 'private' | 'isolated';

export interface DigitalEnvironment {
  platform: PlatformType;
  deviceType: DeviceType;
  connectivity: ConnectivityQuality;
  interface: InterfaceQuality;
  performance: SystemPerformance;
}

export type PlatformType = 
  | 'web_browser' | 'mobile_app' | 'desktop_app' | 'vr_platform'
  | 'ar_platform' | 'smart_tv' | 'tablet_app' | 'hybrid';

export type DeviceType = 
  | 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'smart_watch'
  | 'vr_headset' | 'ar_glasses' | 'smart_tv' | 'interactive_whiteboard';

export interface ConnectivityQuality {
  speed: ConnectionSpeed;
  stability: ConnectionStability;
  latency: LatencyLevel;
  reliability: ReliabilityLevel;
}

export type ConnectionSpeed = 'very_slow' | 'slow' | 'adequate' | 'fast' | 'very_fast';
export type ConnectionStability = 'unstable' | 'intermittent' | 'stable' | 'very_stable';
export type LatencyLevel = 'high' | 'moderate' | 'low' | 'very_low';
export type ReliabilityLevel = 'unreliable' | 'somewhat_reliable' | 'reliable' | 'very_reliable';

export interface InterfaceQuality {
  usability: UsabilityLevel;
  accessibility: AccessibilityLevel;
  responsiveness: ResponsivenessLevel;
  aesthetics: AestheticsQuality;
}

export type UsabilityLevel = 'very_poor' | 'poor' | 'fair' | 'good' | 'excellent';
export type AccessibilityLevel = 'inaccessible' | 'limited' | 'adequate' | 'good' | 'fully_accessible';
export type ResponsivenessLevel = 'unresponsive' | 'slow' | 'adequate' | 'responsive' | 'very_responsive';
export type AestheticsQuality = 'very_poor' | 'poor' | 'adequate' | 'attractive' | 'beautiful';

export interface SystemPerformance {
  loadTime: LoadTimeCategory;
  responsiveness: ResponsivenessLevel;
  reliability: ReliabilityLevel;
  errors: ErrorFrequency;
}

export type LoadTimeCategory = 'very_slow' | 'slow' | 'acceptable' | 'fast' | 'very_fast';
export type ErrorFrequency = 'frequent' | 'occasional' | 'rare' | 'very_rare' | 'none';

export interface DistractionInfo {
  type: DistractionType;
  source: DistractionSource;
  intensity: number; // 0-1
  frequency: number; // per hour
  impact: DistractionImpact;
}

export type DistractionType = 
  | 'visual' | 'auditory' | 'physical' | 'digital' | 'social'
  | 'mental' | 'emotional' | 'environmental' | 'technological';

export type DistractionSource = 
  | 'notifications' | 'people' | 'noise' | 'movement' | 'thoughts'
  | 'other_tasks' | 'physical_discomfort' | 'hunger' | 'fatigue'
  | 'anxiety' | 'external_events' | 'technology_issues';

export interface DistractionImpact {
  attention: number; // 0-1 impact on attention
  emotion: EmotionType[];
  recovery_time: number; // minutes to refocus
  frequency_increase: number; // 0-1 how much it increases frequency
}

export type ComfortLevel = 'very_uncomfortable' | 'uncomfortable' | 'neutral' | 'comfortable' | 'very_comfortable';

export interface TemporalContext {
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  seasonalContext: SeasonalContext;
  academicContext: AcademicContext;
  personalContext: PersonalTemporalContext;
}

export type TimeOfDay = 
  | 'early_morning' | 'morning' | 'late_morning' | 'noon'
  | 'early_afternoon' | 'afternoon' | 'late_afternoon' | 'evening'
  | 'night' | 'late_night';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface SeasonalContext {
  season: Season;
  weather: WeatherCondition;
  daylight: DaylightCondition;
  holidays: HolidayContext;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface WeatherCondition {
  type: WeatherType;
  intensity: WeatherIntensity;
  mood_impact: number; // -1 to 1
}

export type WeatherType = 
  | 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'
  | 'foggy' | 'windy' | 'hot' | 'cold' | 'humid';

export type WeatherIntensity = 'mild' | 'moderate' | 'severe' | 'extreme';

export interface DaylightCondition {
  hours: number;
  quality: LightQuality;
  seasonal_adjustment: SeasonalAdjustment;
}

export type LightQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type SeasonalAdjustment = 'none' | 'mild' | 'moderate' | 'significant';

export interface HolidayContext {
  is_holiday: boolean;
  holiday_type: HolidayType;
  cultural_significance: CulturalSignificance;
  emotional_association: EmotionType[];
}

export type HolidayType = 
  | 'religious' | 'national' | 'cultural' | 'personal' | 'academic'
  | 'seasonal' | 'commemorative' | 'celebratory' | 'solemn';

export type CulturalSignificance = 'none' | 'minor' | 'moderate' | 'major' | 'critical';

export interface AcademicContext {
  semester_phase: SemesterPhase;
  workload: WorkloadLevel;
  deadlines: DeadlineContext;
  exam_period: ExamContext;
}

export type SemesterPhase = 
  | 'beginning' | 'early' | 'mid_semester' | 'late' | 'finals'
  | 'break' | 'summer' | 'intensive' | 'orientation';

export type WorkloadLevel = 'very_light' | 'light' | 'moderate' | 'heavy' | 'overwhelming';

export interface DeadlineContext {
  upcoming_deadlines: number;
  urgency: UrgencyLevel;
  importance: ImportanceLevel;
  preparedness: PreparednessLevel;
}

export type UrgencyLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type ImportanceLevel = 'trivial' | 'minor' | 'moderate' | 'important' | 'critical';
export type PreparednessLevel = 'unprepared' | 'behind' | 'on_track' | 'ahead' | 'well_prepared';

export interface ExamContext {
  is_exam_period: boolean;
  exam_proximity: ExamProximity;
  exam_importance: ImportanceLevel;
  preparation_level: PreparednessLevel;
}

export type ExamProximity = 'distant' | 'approaching' | 'imminent' | 'current' | 'recent';

export interface PersonalTemporalContext {
  energy_level: EnergyLevel;
  alertness: AlertnessLevel;
  mood_patterns: MoodPattern[];
  circadian_preference: CircadianPreference;
}

export type EnergyLevel = 'depleted' | 'low' | 'moderate' | 'high' | 'peak';
export type AlertnessLevel = 'drowsy' | 'tired' | 'alert' | 'very_alert' | 'hyper_alert';

export interface MoodPattern {
  time_period: TimePeriod;
  typical_mood: EmotionType[];
  intensity: number; // 0-1
  stability: number; // 0-1
}

export type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'seasonal';
export type CircadianPreference = 'early_bird' | 'morning_person' | 'neutral' | 'evening_person' | 'night_owl';

export interface PersonalContext {
  demographics: Demographics;
  personality: PersonalityProfile;
  learning_style: LearningStyleProfile;
  motivational_state: MotivationalState;
  psychological_state: PsychologicalState;
  life_context: LifeContext;
}

export interface Demographics {
  age_group: AgeGroup;
  gender: GenderIdentity;
  cultural_background: CulturalBackground;
  education_level: EducationLevel;
  socioeconomic_status: SocioeconomicStatus;
  language_proficiency: LanguageProficiency[];
}

export type AgeGroup = 
  | 'child' | 'adolescent' | 'young_adult' | 'adult'
  | 'middle_aged' | 'senior' | 'elderly';

export type GenderIdentity = 
  | 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface CulturalBackground {
  primary_culture: string;
  cultural_values: CulturalValue[];
  communication_style: CommunicationStyle;
  learning_traditions: LearningTradition[];
}

export interface CulturalValue {
  dimension: ValueDimension;
  orientation: number; // -1 to 1
  strength: number; // 0-1
}

export type ValueDimension = 
  | 'individualism_collectivism' | 'power_distance' | 'uncertainty_avoidance'
  | 'masculinity_femininity' | 'long_term_orientation' | 'indulgence_restraint';

export interface CommunicationStyle {
  directness: number; // 0-1
  formality: number; // 0-1
  emotional_expression: number; // 0-1
  context_dependence: number; // 0-1
}

export interface LearningTradition {
  name: string;
  influence: number; // 0-1
  practices: string[];
  emotional_associations: EmotionType[];
}

export type EducationLevel = 
  | 'elementary' | 'middle_school' | 'high_school' | 'some_college'
  | 'bachelor' | 'master' | 'doctoral' | 'professional';

export type SocioeconomicStatus = 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high';

export interface LanguageProficiency {
  language: string;
  level: ProficiencyLevel;
  is_native: boolean;
  emotional_comfort: number; // 0-1
}

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'native';

export interface PersonalityProfile {
  big_five: BigFiveTraits;
  emotional_intelligence: EmotionalIntelligence;
  resilience: ResilienceProfile;
  introversion_extraversion: number; // 0-1
  stress_response: StressResponse;
}

export interface BigFiveTraits {
  openness: number; // 0-1
  conscientiousness: number; // 0-1
  extraversion: number; // 0-1
  agreeableness: number; // 0-1
  neuroticism: number; // 0-1
}

export interface EmotionalIntelligence {
  self_awareness: number; // 0-1
  self_regulation: number; // 0-1
  motivation: number; // 0-1
  empathy: number; // 0-1
  social_skills: number; // 0-1
}

export interface ResilienceProfile {
  adaptability: number; // 0-1
  recovery_speed: number; // 0-1
  stress_tolerance: number; // 0-1
  optimism: number; // 0-1
  perseverance: number; // 0-1
}

export interface StressResponse {
  triggers: StressTrigger[];
  coping_strategies: CopingStrategy[];
  typical_response: StressResponseType;
  recovery_pattern: RecoveryPattern;
}

export interface StressTrigger {
  type: StressTriggerType;
  sensitivity: number; // 0-1
  frequency: TriggerFrequency;
  impact: StressImpact;
}

export type StressTriggerType = 
  | 'time_pressure' | 'social_evaluation' | 'uncertainty' | 'complexity'
  | 'failure' | 'conflict' | 'isolation' | 'overwhelm' | 'perfectionism';

export type TriggerFrequency = 'rare' | 'occasional' | 'frequent' | 'constant';

export interface StressImpact {
  emotional: EmotionType[];
  cognitive: CognitiveImpact;
  behavioral: BehavioralImpact;
  physical: PhysicalImpact;
}

export interface CognitiveImpact {
  attention: number; // -1 to 1
  memory: number; // -1 to 1
  decision_making: number; // -1 to 1
  creativity: number; // -1 to 1
}

export interface BehavioralImpact {
  activity_level: number; // -1 to 1
  social_interaction: number; // -1 to 1
  risk_taking: number; // -1 to 1
  persistence: number; // -1 to 1
}

export interface PhysicalImpact {
  energy: number; // -1 to 1
  sleep: number; // -1 to 1
  appetite: number; // -1 to 1
  physical_symptoms: PhysicalSymptom[];
}

export interface PhysicalSymptom {
  type: SymptomType;
  severity: SeverityLevel;
  frequency: SymptomFrequency;
}

export type SymptomType = 
  | 'headache' | 'tension' | 'fatigue' | 'restlessness'
  | 'stomach_issues' | 'heart_rate' | 'breathing' | 'sweating';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'debilitating';
export type SymptomFrequency = 'rare' | 'occasional' | 'frequent' | 'constant';

export interface CopingStrategy {
  name: string;
  type: CopingType;
  effectiveness: number; // 0-1
  accessibility: number; // 0-1
  time_required: number; // minutes
}

export type CopingType = 
  | 'problem_focused' | 'emotion_focused' | 'avoidance' | 'social_support'
  | 'cognitive_reframing' | 'relaxation' | 'physical_activity' | 'creative_expression';

export type StressResponseType = 'fight' | 'flight' | 'freeze' | 'fawn' | 'adaptive';

export interface RecoveryPattern {
  typical_duration: number; // minutes
  factors: RecoveryFactor[];
  stages: RecoveryStage[];
}

export interface RecoveryFactor {
  factor: string;
  impact: number; // -1 to 1
  controllability: number; // 0-1
}

export interface RecoveryStage {
  name: string;
  duration: number; // minutes
  characteristics: string[];
  interventions: string[];
}

export interface LearningStyleProfile {
  processing_preference: ProcessingPreference;
  information_preference: InformationPreference;
  organization_preference: OrganizationPreference;
  social_preference: SocialPreference;
}

export interface ProcessingPreference {
  active_reflective: number; // 0-1
  sensing_intuitive: number; // 0-1
  visual_verbal: number; // 0-1
  sequential_global: number; // 0-1
}

export interface InformationPreference {
  concrete_abstract: number; // 0-1
  practical_theoretical: number; // 0-1
  detailed_overview: number; // 0-1
  structured_flexible: number; // 0-1
}

export interface OrganizationPreference {
  linear_nonlinear: number; // 0-1
  hierarchical_networked: number; // 0-1
  categorical_associative: number; // 0-1
}

export interface SocialPreference {
  individual_group: number; // 0-1
  competitive_collaborative: number; // 0-1
  instructor_led_self_directed: number; // 0-1
}

export interface MotivationalState {
  intrinsic_motivation: number; // 0-1
  extrinsic_motivation: number; // 0-1
  goal_orientation: GoalOrientation;
  self_efficacy: number; // 0-1
  value_perception: ValuePerception;
  expectancy: number; // 0-1
}

export interface GoalOrientation {
  mastery: number; // 0-1
  performance: number; // 0-1
  avoidance: number; // 0-1
  social: number; // 0-1
}

export interface ValuePerception {
  intrinsic_value: number; // 0-1
  utility_value: number; // 0-1
  attainment_value: number; // 0-1
  cost: number; // 0-1
}

export interface PsychologicalState {
  wellbeing: WellbeingProfile;
  mental_health: MentalHealthStatus;
  cognitive_state: CognitiveState;
  emotional_regulation: EmotionalRegulation;
}

export interface WellbeingProfile {
  life_satisfaction: number; // 0-1
  positive_affect: number; // 0-1
  negative_affect: number; // 0-1
  meaning: number; // 0-1
  engagement: number; // 0-1
  relationships: number; // 0-1
  accomplishment: number; // 0-1
}

export interface MentalHealthStatus {
  anxiety_level: number; // 0-1
  depression_indicators: number; // 0-1
  stress_level: number; // 0-1
  burnout_risk: number; // 0-1
  sleep_quality: number; // 0-1
  social_connection: number; // 0-1
}

export interface CognitiveState {
  attention_capacity: number; // 0-1
  working_memory: number; // 0-1
  processing_speed: number; // 0-1
  cognitive_flexibility: number; // 0-1
  metacognition: number; // 0-1
}

export interface EmotionalRegulation {
  awareness: number; // 0-1
  understanding: number; // 0-1
  acceptance: number; // 0-1
  regulation_strategies: RegulationStrategy[];
  effectiveness: number; // 0-1
}

export interface RegulationStrategy {
  name: string;
  type: RegulationType;
  frequency: RegulationFrequency;
  effectiveness: number; // 0-1
}

export type RegulationType = 
  | 'cognitive_reappraisal' | 'suppression' | 'distraction' | 'mindfulness'
  | 'problem_solving' | 'social_support' | 'physical_activity' | 'creative_expression';

export type RegulationFrequency = 'never' | 'rarely' | 'sometimes' | 'often' | 'always';

export interface LifeContext {
  life_stage: LifeStage;
  major_events: LifeEvent[];
  responsibilities: Responsibility[];
  support_systems: SupportSystem[];
  constraints: LifeConstraint[];
}

export type LifeStage = 
  | 'childhood' | 'adolescence' | 'young_adulthood' | 'adulthood'
  | 'middle_age' | 'older_adulthood' | 'retirement';

export interface LifeEvent {
  type: EventType;
  impact: EventImpact;
  recency: EventRecency;
  resolution: EventResolution;
}

export type EventType = 
  | 'family_change' | 'health_issue' | 'financial_change' | 'career_change'
  | 'relationship_change' | 'loss' | 'achievement' | 'relocation'
  | 'education_milestone' | 'personal_growth';

export interface EventImpact {
  emotional: number; // -1 to 1
  practical: number; // -1 to 1
  social: number; // -1 to 1
  financial: number; // -1 to 1
}

export type EventRecency = 'current' | 'recent' | 'past' | 'distant_past';
export type EventResolution = 'unresolved' | 'partially_resolved' | 'resolved' | 'ongoing';

export interface Responsibility {
  type: ResponsibilityType;
  time_commitment: number; // hours per week
  stress_level: number; // 0-1
  flexibility: number; // 0-1
}

export type ResponsibilityType = 
  | 'work' | 'family_care' | 'education' | 'household' | 'community'
  | 'health_care' | 'financial' | 'volunteer' | 'personal_development';

export interface SupportSystem {
  type: SupportType;
  strength: number; // 0-1
  availability: number; // 0-1
  quality: number; // 0-1
}

export type SupportType = 
  | 'family' | 'friends' | 'romantic_partner' | 'colleagues' | 'mentors'
  | 'professional' | 'community' | 'online' | 'spiritual' | 'institutional';

export interface LifeConstraint {
  type: ConstraintType;
  severity: number; // 0-1
  modifiability: number; // 0-1
  impact_areas: ImpactArea[];
}

export type ConstraintType = 
  | 'time' | 'financial' | 'health' | 'geographic' | 'social'
  | 'technological' | 'educational' | 'legal' | 'cultural' | 'family';

export type ImpactArea = 
  | 'learning_time' | 'learning_location' | 'learning_resources'
  | 'learning_goals' | 'learning_methods' | 'social_learning'
  | 'technology_access' | 'motivation' | 'stress_level';

export interface EmotionMetadata {
  version: string;
  model_info: ModelInfo;
  processing_info: ProcessingInfo;
  validation_info: ValidationInfo;
  privacy_info: PrivacyInfo;
}

export interface ModelInfo {
  name: string;
  version: string;
  type: ModelType;
  accuracy: number; // 0-1
  training_data: TrainingDataInfo;
  biases: BiasInfo[];
}

export type ModelType = 
  | 'neural_network' | 'machine_learning' | 'rule_based' | 'hybrid'
  | 'transformer' | 'cnn' | 'rnn' | 'ensemble';

export interface TrainingDataInfo {
  size: number;
  diversity: DiversityMetrics;
  recency: TrainingRecency;
  domains: string[];
}

export interface DiversityMetrics {
  demographic: number; // 0-1
  cultural: number; // 0-1
  linguistic: number; // 0-1
  contextual: number; // 0-1
}

export type TrainingRecency = 'current' | 'recent' | 'somewhat_dated' | 'outdated';

export interface BiasInfo {
  type: BiasType;
  severity: SeverityLevel;
  affected_groups: string[];
  mitigation: MitigationStrategy[];
}

export type BiasType = 
  | 'demographic' | 'cultural' | 'linguistic' | 'contextual'
  | 'selection' | 'confirmation' | 'availability' | 'anchoring';

export interface MitigationStrategy {
  name: string;
  effectiveness: number; // 0-1
  implementation: ImplementationLevel;
}

export type ImplementationLevel = 'none' | 'partial' | 'full' | 'enhanced';

export interface ProcessingInfo {
  timestamp: Date;
  duration: number; // milliseconds
  method: ProcessingMethod;
  quality_checks: QualityCheck[];
  confidence_factors: ConfidenceFactor[];
}

export type ProcessingMethod = 
  | 'real_time' | 'batch' | 'streaming' | 'on_demand'
  | 'edge_computing' | 'cloud_processing' | 'hybrid';

export interface QualityCheck {
  type: QualityCheckType;
  result: CheckResult;
  details: string;
}

export type QualityCheckType = 
  | 'data_completeness' | 'data_validity' | 'model_confidence'
  | 'consistency_check' | 'anomaly_detection' | 'bias_check';

export type CheckResult = 'passed' | 'warning' | 'failed' | 'skipped';

export interface ConfidenceFactor {
  factor: string;
  contribution: number; // 0-1
  reliability: number; // 0-1
}

export interface ValidationInfo {
  human_validation: HumanValidation;
  cross_validation: CrossValidation;
  temporal_validation: TemporalValidation;
}

export interface HumanValidation {
  available: boolean;
  agreement: number; // 0-1
  validator_expertise: ExpertiseLevel;
  validation_method: ValidationMethod;
}

export type ExpertiseLevel = 'novice' | 'intermediate' | 'expert' | 'specialist';
export type ValidationMethod = 'single_rater' | 'multiple_raters' | 'expert_panel' | 'crowd_sourced';

export interface CrossValidation {
  method: CrossValidationMethod;
  folds: number;
  accuracy: number; // 0-1
  stability: number; // 0-1
}

export type CrossValidationMethod = 'k_fold' | 'leave_one_out' | 'stratified' | 'time_series';

export interface TemporalValidation {
  consistency: number; // 0-1
  stability_window: number; // minutes
  trend_validation: TrendValidation;
}

export interface TrendValidation {
  expected_vs_actual: number; // 0-1
  seasonal_adjustment: boolean;
  anomaly_score: number; // 0-1
}

export interface PrivacyInfo {
  anonymization: AnonymizationLevel;
  retention_policy: RetentionPolicy;
  sharing_permissions: SharingPermission[];
  consent_status: ConsentStatus;
}

export type AnonymizationLevel = 'none' | 'pseudonymized' | 'anonymized' | 'aggregated_only';

export interface RetentionPolicy {
  duration: number; // days
  deletion_method: DeletionMethod;
  archive_policy: ArchivePolicy;
}

export type DeletionMethod = 'soft_delete' | 'hard_delete' | 'anonymize' | 'aggregate';
export type ArchivePolicy = 'no_archive' | 'anonymized_archive' | 'aggregated_archive' | 'full_archive';

export interface SharingPermission {
  recipient: RecipientType;
  data_types: DataType[];
  purpose: SharingPurpose;
  restrictions: string[];
}

export type RecipientType = 
  | 'instructor' | 'institution' | 'researcher' | 'platform_provider'
  | 'analytics_service' | 'ai_service' | 'third_party' | 'parent_guardian';

export type DataType = 
  | 'emotional_state' | 'sentiment_analysis' | 'aggregated_emotions'
  | 'patterns' | 'recommendations' | 'alerts' | 'metadata_only';

export type SharingPurpose = 
  | 'educational_improvement' | 'research' | 'analytics' | 'intervention'
  | 'assessment' | 'personalization' | 'safety' | 'compliance';

export interface ConsentStatus {
  provided: boolean;
  timestamp: Date;
  scope: ConsentScope[];
  granular_permissions: GranularPermission[];
  withdrawal_rights: WithdrawalRights;
}

export interface ConsentScope {
  area: ConsentArea;
  granted: boolean;
  timestamp: Date;
  expiry?: Date;
}

export type ConsentArea = 
  | 'emotion_detection' | 'sentiment_analysis' | 'behavioral_tracking'
  | 'data_sharing' | 'research_participation' | 'intervention_delivery'
  | 'long_term_storage' | 'cross_platform_analysis';

export interface GranularPermission {
  feature: string;
  enabled: boolean;
  conditions: string[];
  review_date?: Date;
}

export interface WithdrawalRights {
  method: WithdrawalMethod[];
  timeline: number; // days
  data_fate: DataFate;
  impact_disclosure: string;
}

export type WithdrawalMethod = 'online_form' | 'email_request' | 'verbal_request' | 'written_request';
export type DataFate = 'immediate_deletion' | 'anonymization' | 'retention_for_research' | 'archival';

// Emotion Detection Analytics Types

export interface EmotionAnalytics {
  studentId: string;
  courseId: string;
  timeRange: DateRange;
  summary: EmotionSummary;
  patterns: EmotionPattern[];
  trends: EmotionTrendAnalysis[];
  correlations: EmotionCorrelation[];
  interventions: InterventionAnalytics[];
  recommendations: EmotionRecommendation[];
  insights: EmotionInsight[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EmotionSummary {
  totalDetections: number;
  averageConfidence: number;
  emotionDistribution: EmotionDistribution[];
  sentimentDistribution: SentimentDistribution;
  emotionalWellbeing: WellbeingScore;
  riskIndicators: RiskIndicator[];
}

export interface EmotionDistribution {
  emotion: EmotionType;
  frequency: number;
  averageIntensity: number;
  duration: number; // total minutes
  contexts: EmotionContext[];
}

export interface SentimentDistribution {
  positive: number; // 0-1
  neutral: number; // 0-1
  negative: number; // 0-1
  averageScore: number; // -1 to 1
  volatility: number; // 0-1
}

export interface WellbeingScore {
  overall: number; // 0-1
  emotional_balance: number; // 0-1
  stress_level: number; // 0-1
  engagement_level: number; // 0-1
  motivation_level: number; // 0-1
  social_connection: number; // 0-1
}

export interface RiskIndicator {
  type: RiskType;
  level: RiskLevel;
  confidence: number; // 0-1
  evidence: string[];
  recommended_actions: string[];
}

export type RiskType = 
  | 'emotional_distress' | 'chronic_stress' | 'disengagement'
  | 'social_isolation' | 'academic_anxiety' | 'burnout'
  | 'low_motivation' | 'negative_sentiment' | 'emotional_volatility';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface EmotionPattern {
  id: string;
  name: string;
  description: string;
  frequency: PatternFrequency;
  reliability: number; // 0-1
  triggers: PatternTrigger[];
  outcomes: PatternOutcome[];
  interventions: PatternIntervention[];
}

export interface PatternTrigger {
  type: TriggerType;
  likelihood: number; // 0-1
  conditions: string[];
  timing: TriggerTiming;
}

export interface TriggerTiming {
  typical_delay: number; // minutes
  duration: number; // minutes
  frequency: TimingFrequency;
}

export type TimingFrequency = 'immediate' | 'short_term' | 'medium_term' | 'long_term';

export interface PatternOutcome {
  type: OutcomeType;
  probability: number; // 0-1
  impact: OutcomeImpact;
  duration: number; // minutes
}

export type OutcomeType = 
  | 'performance_change' | 'engagement_change' | 'emotional_change'
  | 'behavioral_change' | 'social_change' | 'motivational_change';

export interface OutcomeImpact {
  magnitude: number; // 0-1
  direction: ImpactDirection;
  domains: ImpactDomain[];
}

export type ImpactDomain = 
  | 'learning' | 'wellbeing' | 'social' | 'motivation' | 'performance' | 'engagement';

export interface EmotionTrendAnalysis {
  emotion: EmotionType;
  timeframe: TrendTimeframe;
  direction: TrendDirection;
  magnitude: number; // 0-1
  significance: number; // 0-1
  factors: TrendFactor[];
  predictions: TrendPrediction[];
}

export type TrendTimeframe = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'semester';

export interface TrendPrediction {
  timeframe: PredictionTimeframe;
  predicted_direction: TrendDirection;
  confidence: number; // 0-1
  factors: PredictionFactor[];
}

export type PredictionTimeframe = 'next_session' | 'next_day' | 'next_week' | 'next_month';

export interface PredictionFactor {
  factor: string;
  influence: number; // -1 to 1
  confidence: number; // 0-1
}

export interface EmotionCorrelation {
  emotion1: EmotionType;
  emotion2: EmotionType;
  correlation: number; // -1 to 1
  lag: number; // minutes
  significance: number; // 0-1
  contexts: CorrelationContext[];
}

export interface CorrelationContext {
  context_type: ContextType;
  correlation_strength: number; // -1 to 1
  frequency: number; // 0-1
}

export interface InterventionAnalytics {
  interventionType: InterventionType;
  frequency: number;
  effectiveness: InterventionEffectiveness;
  contexts: InterventionContext[];
  outcomes: InterventionOutcome[];
}

export interface InterventionEffectiveness {
  overall: number; // 0-1
  emotional_improvement: number; // 0-1
  engagement_improvement: number; // 0-1
  performance_improvement: number; // 0-1
  time_to_effect: number; // minutes
  duration_of_effect: number; // minutes
}

export interface InterventionContext {
  context: EmotionContext;
  effectiveness: number; // 0-1
  frequency: number;
  suitability: number; // 0-1
}

export interface InterventionOutcome {
  outcome_type: OutcomeType;
  success_rate: number; // 0-1
  average_improvement: number; // 0-1
  side_effects: SideEffect[];
}

export interface SideEffect {
  type: string;
  frequency: number; // 0-1
  severity: SeverityLevel;
  mitigation: string[];
}

export interface EmotionRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  expected_impact: ExpectedImpact;
  implementation: ImplementationGuide;
  evidence: Evidence[];
}

export type RecommendationType = 
  | 'intervention_suggestion' | 'environmental_change' | 'content_modification'
  | 'pacing_adjustment' | 'social_support' | 'break_recommendation'
  | 'motivation_boost' | 'stress_reduction' | 'engagement_increase';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ExpectedImpact {
  emotional_wellbeing: number; // 0-1
  learning_performance: number; // 0-1
  engagement: number; // 0-1
  time_frame: ImpactTimeframe;
}

export type ImpactTimeframe = 'immediate' | 'short_term' | 'medium_term' | 'long_term';

export interface ImplementationGuide {
  steps: ImplementationStep[];
  resources_needed: string[];
  time_required: number; // minutes
  difficulty: ImplementationDifficulty;
}

export interface ImplementationStep {
  order: number;
  description: string;
  duration: number; // minutes
  dependencies: string[];
}

export type ImplementationDifficulty = 'easy' | 'moderate' | 'difficult' | 'expert_required';

export interface Evidence {
  type: EvidenceType;
  source: string;
  strength: EvidenceStrength;
  relevance: number; // 0-1
  date: Date;
}

export type EvidenceType = 
  | 'research_study' | 'best_practice' | 'platform_data' | 'expert_opinion'
  | 'user_feedback' | 'case_study' | 'meta_analysis' | 'longitudinal_study';

export type EvidenceStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface EmotionInsight {
  id: string;
  category: InsightCategory;
  insight: string;
  confidence: number; // 0-1
  actionable: boolean;
  supporting_data: SupportingData[];
  implications: Implication[];
}

export type InsightCategory = 
  | 'emotional_pattern' | 'learning_correlation' | 'risk_identification'
  | 'improvement_opportunity' | 'strength_identification' | 'trend_analysis'
  | 'intervention_effectiveness' | 'contextual_influence';

export interface SupportingData {
  metric: string;
  value: number;
  comparison: ComparisonData;
  significance: number; // 0-1
}

export interface ComparisonData {
  baseline: number;
  target: number;
  benchmark: number;
  percentile: number; // 0-1
}

export interface Implication {
  domain: ImplicationDomain;
  description: string;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  next_steps: string[];
}

export type ImplicationDomain = 
  | 'immediate_wellbeing' | 'learning_outcomes' | 'long_term_success'
  | 'intervention_planning' | 'support_needs' | 'risk_mitigation';