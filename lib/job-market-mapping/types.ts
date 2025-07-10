// Job Market Skill Mapping System Types

export interface JobMarketMapping {
  id: string;
  studentId: string;
  timestamp: Date;
  skillAnalysis: SkillAnalysis;
  jobMarketData: JobMarketData;
  careerPathways: CareerPathway[];
  skillGaps: SkillGap[];
  recommendations: CareerRecommendation[];
  marketTrends: MarketTrend[];
  competencyMatrix: CompetencyMatrix;
  metadata: MappingMetadata;
}

export interface SkillAnalysis {
  assessedSkills: AssessedSkill[];
  skillProficiencyLevels: SkillProficiency[];
  skillCategorization: SkillCategory[];
  emergingSkills: EmergingSkill[];
  transferableSkills: TransferableSkill[];
  technicalSkills: TechnicalSkill[];
  softSkills: SoftSkill[];
  industrySpecificSkills: IndustrySkill[];
  certifications: Certification[];
  portfolioAssets: PortfolioAsset[];
}

export interface JobMarketData {
  jobPostings: JobPosting[];
  salaryTrends: SalaryTrend[];
  demandMetrics: DemandMetric[];
  locationAnalysis: LocationAnalysis[];
  industryGrowth: IndustryGrowth[];
  skillDemand: SkillDemand[];
  emergingRoles: EmergingRole[];
  roleEvolution: RoleEvolution[];
  competitorAnalysis: CompetitorAnalysis[];
  marketSegmentation: MarketSegment[];
}

export interface CareerPathway {
  id: string;
  title: string;
  description: string;
  targetRoles: TargetRole[];
  milestones: CareerMilestone[];
  timeline: PathwayTimeline;
  requiredSkills: RequiredSkill[];
  experienceLevel: ExperienceLevel;
  salaryProgression: SalaryProgression;
  educationRequirements: EducationRequirement[];
  certificationPath: CertificationPath[];
  networkingOpportunities: NetworkingOpportunity[];
  mentorshipPrograms: MentorshipProgram[];
  successProbability: number; // 0-1
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  gapSeverity: GapSeverity;
  urgency: GapUrgency;
  marketDemand: MarketDemandLevel;
  closingStrategy: GapClosingStrategy;
  estimatedTime: TimeEstimate;
  learningResources: LearningResource[];
  practicalApplications: PracticalApplication[];
  assessmentMethods: AssessmentMethod[];
}

export interface CareerRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  actionItems: ActionItem[];
  timeline: RecommendationTimeline;
  expectedImpact: ImpactMetrics;
  prerequisites: Prerequisite[];
  resources: RecommendationResource[];
  successMetrics: SuccessMetric[];
  riskFactors: RiskFactor[];
  alternatives: AlternativeOption[];
}

export interface MarketTrend {
  id: string;
  trendType: TrendType;
  category: TrendCategory;
  title: string;
  description: string;
  impact: TrendImpact;
  timeline: TrendTimeline;
  affectedSkills: string[];
  affectedRoles: string[];
  affectedIndustries: string[];
  adoptionRate: number; // 0-1
  disruptionLevel: DisruptionLevel;
  geographicScope: GeographicScope;
  dataSource: DataSource[];
  confidence: number; // 0-1
}

export interface CompetencyMatrix {
  studentId: string;
  jobRoleId: string;
  overallMatch: number; // 0-1
  competencyAreas: CompetencyArea[];
  strengthAreas: StrengthArea[];
  developmentAreas: DevelopmentArea[];
  criticalGaps: CriticalGap[];
  readinessScore: ReadinessScore;
  improvementPlan: ImprovementPlan;
  benchmarkComparison: BenchmarkComparison;
}

// Core skill and assessment types

export interface AssessedSkill {
  skillId: string;
  skillName: string;
  category: SkillCategoryType;
  proficiencyLevel: ProficiencyLevel;
  assessmentMethod: AssessmentMethodType;
  assessmentDate: Date;
  confidence: number; // 0-1
  evidenceSource: EvidenceSource[];
  validatedBy: ValidationSource;
  lastUpdated: Date;
  improvementTrend: TrendDirection;
}

export interface SkillProficiency {
  skillId: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  proficiencyScore: number; // 0-100
  competencyIndicators: CompetencyIndicator[];
  assessmentHistory: AssessmentRecord[];
  learningProgress: LearningProgress;
  practicalExperience: PracticalExperience;
  peerComparison: PeerComparison;
}

export interface SkillCategory {
  categoryId: string;
  categoryName: string;
  categoryType: SkillCategoryType;
  skillCount: number;
  averageProficiency: number;
  marketRelevance: number; // 0-1
  futureProjection: FutureProjection;
  recommendedFocus: RecommendedFocus;
}

export interface EmergingSkill {
  skillId: string;
  skillName: string;
  emergenceDate: Date;
  adoptionRate: number; // 0-1
  marketDemand: MarketDemandLevel;
  relevanceScore: number; // 0-1
  learningDifficulty: LearningDifficulty;
  timeToMastery: TimeEstimate;
  relatedSkills: string[];
  industry: Industry[];
}

// Job market and demand types

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  industry: Industry;
  location: Location;
  salaryRange: SalaryRange;
  requiredSkills: RequiredSkillMatch[];
  preferredSkills: PreferredSkillMatch[];
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  postDate: Date;
  applicationDeadline?: Date;
  matchScore: number; // 0-1
  sourceUrl: string;
  dataSource: DataSource;
}

export interface DemandMetric {
  skillId: string;
  skillName: string;
  demandLevel: MarketDemandLevel;
  demandGrowth: GrowthRate;
  supplyDemandRatio: number;
  averageSalary: number;
  jobOpenings: number;
  hireRate: number; // 0-1
  timeToFill: number; // days
  competitionLevel: CompetitionLevel;
  geographicConcentration: GeographicData[];
  industryDistribution: IndustryDistribution[];
}

export interface SalaryTrend {
  skillId?: string;
  roleId?: string;
  industry: Industry;
  location: Location;
  currentSalary: SalaryRange;
  historicalTrends: HistoricalSalaryData[];
  projectedGrowth: SalaryProjection;
  experiencePremium: ExperiencePremium[];
  skillPremium: SkillPremium[];
  benefitsValue: BenefitsValuation;
  totalCompensation: CompensationPackage;
}

export interface SkillDemand {
  skillId: string;
  demandScore: number; // 0-100
  trendDirection: TrendDirection;
  demandDrivers: DemandDriver[];
  supplyConstraints: SupplyConstraint[];
  regionalVariation: RegionalDemandData[];
  industryDemand: IndustryDemandData[];
  futureProjection: DemandProjection;
  replacementRisk: ReplacementRisk;
}

// Career pathway and planning types

export interface TargetRole {
  roleId: string;
  title: string;
  level: RoleLevel;
  industry: Industry;
  matchScore: number; // 0-1
  salaryRange: SalaryRange;
  growthPotential: GrowthPotential;
  workLifeBalance: WorkLifeBalance;
  remoteWorkOptions: RemoteWorkOptions;
  jobSecurity: JobSecurity;
  skillAlignment: SkillAlignment[];
}

export interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  skillRequirements: SkillRequirement[];
  experienceRequirements: ExperienceRequirement[];
  deliverables: Deliverable[];
  successCriteria: SuccessCriterion[];
  dependencies: MilestoneDependency[];
  resources: MilestoneResource[];
  riskMitigation: RiskMitigation[];
}

export interface PathwayTimeline {
  totalDuration: TimeEstimate;
  phases: PathwayPhase[];
  criticalPath: CriticalPathElement[];
  flexibilityPoints: FlexibilityPoint[];
  accelerationOptions: AccelerationOption[];
  checkpoints: Checkpoint[];
}

export interface RequiredSkill {
  skillId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  importance: SkillImportance;
  marketDemand: MarketDemandLevel;
  acquisitionDifficulty: LearningDifficulty;
  timeToAcquire: TimeEstimate;
  learningPath: LearningPath;
  assessmentCriteria: AssessmentCriterion[];
}

// Learning and development types

export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  provider: string;
  format: LearningFormat;
  duration: TimeEstimate;
  difficulty: LearningDifficulty;
  cost: CostStructure;
  rating: number; // 0-5
  skillsAddressed: string[];
  prerequisites: string[];
  learningOutcomes: LearningOutcome[];
  completionRate: number; // 0-1
  effectiveness: EffectivenessMetric;
  accessibility: AccessibilityInfo;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetSkills: string[];
  modules: LearningModule[];
  totalDuration: TimeEstimate;
  difficulty: LearningDifficulty;
  prerequisites: string[];
  learningObjectives: LearningObjective[];
  assessmentStrategy: AssessmentStrategy;
  adaptiveFeatures: AdaptiveFeature[];
  personalization: PersonalizationOption[];
}

export interface PracticalApplication {
  id: string;
  title: string;
  type: ApplicationType;
  description: string;
  skillsReinforced: string[];
  complexity: ComplexityLevel;
  duration: TimeEstimate;
  resources: ApplicationResource[];
  outcomes: ApplicationOutcome[];
  feedback: FeedbackMechanism[];
  realWorldRelevance: number; // 0-1
}

// Assessment and validation types

export interface AssessmentMethod {
  id: string;
  name: string;
  type: AssessmentType;
  description: string;
  skillsAssessed: string[];
  validityScore: number; // 0-1
  reliabilityScore: number; // 0-1
  duration: TimeEstimate;
  format: AssessmentFormat;
  scoringCriteria: ScoringCriterion[];
  industryRecognition: IndustryRecognition;
  costEffectiveness: CostEffectiveness;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  level: CertificationLevel;
  skillsValidated: string[];
  industryRecognition: IndustryRecognition;
  marketValue: MarketValue;
  expirationPeriod?: TimeEstimate;
  renewalRequirements: RenewalRequirement[];
  prerequisiteSkills: string[];
  cost: CostStructure;
  passingScore: number;
  preparationTime: TimeEstimate;
}

// Market analysis and trends

export interface IndustryGrowth {
  industryId: string;
  industryName: string;
  growthRate: GrowthRate;
  marketSize: MarketSize;
  employmentTrends: EmploymentTrend[];
  skillDemandChanges: SkillDemandChange[];
  disruptionFactors: DisruptionFactor[];
  investmentTrends: InvestmentTrend[];
  regulatoryImpact: RegulatoryImpact[];
  competitiveLandscape: CompetitiveLandscape;
  futureOutlook: FutureOutlook;
}

export interface EmergingRole {
  roleId: string;
  title: string;
  description: string;
  industry: Industry[];
  emergenceDrivers: EmergenceDriver[];
  skillRequirements: SkillRequirement[];
  salaryProjection: SalaryProjection;
  adoptionTimeline: AdoptionTimeline;
  geographicAvailability: GeographicAvailability[];
  prerequisiteRoles: string[];
  careerProgression: CareerProgression;
}

export interface RoleEvolution {
  roleId: string;
  currentState: RoleState;
  evolutionDrivers: EvolutionDriver[];
  skillChanges: SkillChange[];
  responsibilityChanges: ResponsibilityChange[];
  toolChanges: ToolChange[];
  futureState: FutureRoleState;
  transitionStrategy: TransitionStrategy;
  impactAssessment: ImpactAssessment;
}

// Enums and basic types

export type SkillCategoryType = 
  | 'technical' | 'soft' | 'industry_specific' | 'transferable' 
  | 'emerging' | 'core' | 'specialized' | 'leadership' | 'communication';

export type ProficiencyLevel = 
  | 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export type GapSeverity = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export type GapUrgency = 'immediate' | 'urgent' | 'moderate' | 'low' | 'future';

export type MarketDemandLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';

export type LearningDifficulty = 'very_easy' | 'easy' | 'moderate' | 'hard' | 'very_hard';

export type RecommendationType = 
  | 'skill_development' | 'career_change' | 'certification' | 'education'
  | 'networking' | 'experience' | 'portfolio' | 'mentorship';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type TrendType = 
  | 'technology' | 'market' | 'economic' | 'social' | 'regulatory' 
  | 'demographic' | 'environmental' | 'political';

export type TrendCategory = 
  | 'skill_demand' | 'job_creation' | 'automation' | 'globalization'
  | 'remote_work' | 'gig_economy' | 'sustainability' | 'digitalization';

export type DisruptionLevel = 'transformative' | 'significant' | 'moderate' | 'minimal';

export type GeographicScope = 'global' | 'regional' | 'national' | 'local';

export type ExperienceLevel = 
  | 'entry_level' | 'junior' | 'mid_level' | 'senior' | 'executive' | 'expert';

export type EducationLevel = 
  | 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctoral' 
  | 'certification' | 'bootcamp' | 'self_taught';

export type Industry = 
  | 'technology' | 'healthcare' | 'finance' | 'education' | 'manufacturing'
  | 'retail' | 'consulting' | 'media' | 'government' | 'non_profit' | 'automotive'
  | 'aerospace' | 'energy' | 'telecommunications' | 'biotechnology';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export type CompetitionLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';

export type GrowthRate = {
  percentage: number;
  period: TimePeriod;
  confidence: number; // 0-1
};

export type ResourceType = 
  | 'course' | 'tutorial' | 'book' | 'certification' | 'workshop'
  | 'bootcamp' | 'mentorship' | 'project' | 'internship' | 'conference';

export type LearningFormat = 
  | 'online' | 'in_person' | 'hybrid' | 'self_paced' | 'instructor_led'
  | 'peer_learning' | 'hands_on' | 'simulation' | 'case_study';

export type AssessmentType = 
  | 'practical' | 'theoretical' | 'portfolio' | 'interview' | 'peer_review'
  | 'self_assessment' | 'certification_exam' | 'project_based';

export type CertificationLevel = 
  | 'entry' | 'associate' | 'professional' | 'expert' | 'master' | 'specialty';

export type RoleLevel = 
  | 'individual_contributor' | 'team_lead' | 'manager' | 'director' 
  | 'vp' | 'c_level' | 'founder' | 'consultant';

// Complex supporting types

export interface TimeEstimate {
  min: number; // hours/days/months depending on context
  max: number;
  average: number;
  unit: TimeUnit;
  confidence: number; // 0-1
}

export interface SalaryRange {
  min: number;
  max: number;
  median: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
  benefits?: BenefitsPackage;
}

export interface Location {
  country: string;
  state?: string;
  city?: string;
  remote: boolean;
  hybrid: boolean;
  relocatable: boolean;
  costOfLiving: number; // index
}

export interface RequiredSkillMatch {
  skillId: string;
  skillName: string;
  requiredLevel: ProficiencyLevel;
  studentLevel: ProficiencyLevel;
  match: number; // 0-1
  critical: boolean;
}

export interface PreferredSkillMatch {
  skillId: string;
  skillName: string;
  preferredLevel: ProficiencyLevel;
  studentLevel: ProficiencyLevel;
  match: number; // 0-1
  advantageScore: number; // 0-1
}

export interface DataSource {
  name: string;
  type: 'job_board' | 'company_site' | 'api' | 'survey' | 'government' | 'research';
  url?: string;
  reliability: number; // 0-1
  lastUpdated: Date;
  updateFrequency: string;
}

export interface EvidenceSource {
  type: 'project' | 'course' | 'work' | 'assessment' | 'certification' | 'peer_review';
  source: string;
  date: Date;
  weight: number; // 0-1
  verification: VerificationStatus;
}

export interface LearningProgress {
  startDate: Date;
  currentProgress: number; // 0-1
  milestones: ProgressMilestone[];
  learningVelocity: number;
  consistencyScore: number; // 0-1
  challenges: LearningChallenge[];
  successes: LearningSuccess[];
}

export interface CompetencyIndicator {
  indicator: string;
  description: string;
  achieved: boolean;
  evidenceRequired: string[];
  assessmentMethod: string;
  weight: number; // 0-1
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  estimatedEffort: TimeEstimate;
  dependencies: string[];
  resources: ActionResource[];
  successCriteria: string[];
  deadline?: Date;
}

export interface ImpactMetrics {
  salaryIncrease: number; // percentage
  jobOpportunityIncrease: number; // percentage
  skillGapReduction: number; // percentage
  careerAdvancement: number; // 0-1
  marketability: number; // 0-1
  confidence: number; // 0-1
}

export interface SkillAlignment {
  skillId: string;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  alignmentScore: number; // 0-1
  importance: SkillImportance;
  developmentPath: string[];
}

export interface MappingMetadata {
  version: string;
  dataFreshness: DataFreshness;
  analysisDepth: AnalysisDepth;
  confidenceLevel: number; // 0-1
  lastUpdated: Date;
  dataSource: DataSource[];
  algorithm: AlgorithmInfo;
  customizations: CustomizationSetting[];
}

// Additional enums

export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type TimeUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'disputed';

export type ActionPriority = 'immediate' | 'high' | 'medium' | 'low';

export type SkillImportance = 'critical' | 'important' | 'nice_to_have' | 'optional';

export type DataFreshness = 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type AnalysisDepth = 'surface' | 'standard' | 'deep' | 'comprehensive';

// Supporting interface definitions

export interface TechnicalSkill extends AssessedSkill {
  techCategory: TechCategory;
  complexity: ComplexityLevel;
  toolsPlatforms: string[];
  versionSpecific: boolean;
  industry: Industry[];
}

export interface SoftSkill extends AssessedSkill {
  behavioralIndicators: BehavioralIndicator[];
  situationalApplication: SituationalContext[];
  culturalRelevance: CulturalRelevance;
  developmentApproach: DevelopmentApproach[];
}

export interface IndustrySkill extends AssessedSkill {
  industry: Industry;
  regulatoryRequirements: RegulatoryRequirement[];
  specialization: SpecializationArea;
  transferability: TransferabilityScore;
}

export interface TransferableSkill extends AssessedSkill {
  transferabilityScore: number; // 0-1
  applicableIndustries: Industry[];
  applicableRoles: RoleLevel[];
  adaptationRequirements: AdaptationRequirement[];
}

export interface PortfolioAsset {
  id: string;
  type: PortfolioAssetType;
  title: string;
  description: string;
  skillsDemonstrated: string[];
  creationDate: Date;
  lastUpdated: Date;
  visibility: VisibilityLevel;
  quality: QualityScore;
  marketRelevance: number; // 0-1
  verificationStatus: VerificationStatus;
}

export interface GapClosingStrategy {
  approach: ClosingApproach;
  phases: ClosingPhase[];
  resources: LearningResource[];
  timeline: TimeEstimate;
  milestones: GapMilestone[];
  costEstimate: CostEstimate;
  successProbability: number; // 0-1
  riskFactors: string[];
}

export interface CompetencyArea {
  areaId: string;
  areaName: string;
  currentScore: number; // 0-100
  targetScore: number; // 0-100
  weight: number; // 0-1
  subCompetencies: SubCompetency[];
  assessmentResults: AssessmentResult[];
  developmentPlan: DevelopmentPlan;
}

export interface ReadinessScore {
  overall: number; // 0-100
  technical: number; // 0-100
  experience: number; // 0-100
  cultural: number; // 0-100
  leadership: number; // 0-100
  adaptability: number; // 0-100
  confidence: number; // 0-1
  recommendedAction: RecommendedAction;
}

export interface BenchmarkComparison {
  peerGroup: PeerGroup;
  percentileRank: number; // 0-100
  strengthsVsPeers: string[];
  gapsVsPeers: string[];
  competitiveAdvantages: string[];
  improvementAreas: string[];
  marketPosition: MarketPosition;
}

// Additional complex types

export type TechCategory = 
  | 'programming' | 'data_science' | 'cloud' | 'security' | 'ai_ml' 
  | 'mobile' | 'web' | 'database' | 'devops' | 'blockchain';

export type ComplexityLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export type PortfolioAssetType = 
  | 'project' | 'publication' | 'presentation' | 'code_sample' 
  | 'case_study' | 'testimonial' | 'achievement' | 'certification';

export type VisibilityLevel = 'public' | 'private' | 'professional' | 'selective';

export type QualityScore = {
  technical: number; // 0-100
  presentation: number; // 0-100
  impact: number; // 0-100
  innovation: number; // 0-100
  overall: number; // 0-100
};

export type ClosingApproach = 
  | 'formal_education' | 'online_learning' | 'practical_experience' 
  | 'mentorship' | 'certification' | 'project_based' | 'peer_learning';

export type RecommendedAction = 
  | 'ready_to_apply' | 'short_term_preparation' | 'medium_term_development'
  | 'long_term_planning' | 'career_pivot_needed';

export type MarketPosition = 'top_tier' | 'competitive' | 'average' | 'below_average' | 'entry_level';

export interface BehavioralIndicator {
  behavior: string;
  frequency: 'always' | 'often' | 'sometimes' | 'rarely' | 'never';
  context: string[];
  evidence: string[];
  development: boolean;
}

export interface SituationalContext {
  situation: string;
  application: string;
  effectiveness: number; // 0-1
  improvement: string[];
}

export interface CulturalRelevance {
  cultures: string[];
  adaptability: number; // 0-1
  considerations: string[];
}

export interface DevelopmentApproach {
  method: string;
  effectiveness: number; // 0-1
  timeframe: TimeEstimate;
  resources: string[];
}

export interface RegulatoryRequirement {
  requirement: string;
  authority: string;
  compliance: ComplianceStatus;
  renewalPeriod?: TimeEstimate;
}

export interface SpecializationArea {
  area: string;
  depth: number; // 0-1
  breadth: number; // 0-1
  marketValue: number; // 0-1
}

export interface TransferabilityScore {
  overall: number; // 0-1
  industry: number; // 0-1
  role: number; // 0-1
  geography: number; // 0-1
}

export interface AdaptationRequirement {
  requirement: string;
  effort: EffortLevel;
  timeline: TimeEstimate;
  resources: string[];
}

export interface ClosingPhase {
  phase: string;
  duration: TimeEstimate;
  objectives: string[];
  activities: string[];
  resources: string[];
  outcomes: string[];
}

export interface GapMilestone {
  milestone: string;
  targetDate: Date;
  criteria: string[];
  measurement: string[];
}

export interface CostEstimate {
  min: number;
  max: number;
  currency: string;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  description: string;
}

export interface SubCompetency {
  name: string;
  weight: number; // 0-1
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  evidence: string[];
}

export interface AssessmentResult {
  assessmentId: string;
  date: Date;
  score: number; // 0-100
  assessor: string;
  method: string;
  notes: string;
}

export interface DevelopmentPlan {
  activities: DevelopmentActivity[];
  timeline: TimeEstimate;
  resources: string[];
  milestones: string[];
  success: string[];
}

export interface DevelopmentActivity {
  activity: string;
  type: ActivityType;
  duration: TimeEstimate;
  resources: string[];
  outcomes: string[];
}

export interface PeerGroup {
  definition: string;
  size: number;
  criteria: string[];
  characteristics: string[];
}

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';

export type EffortLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'intensive';

export type ActivityType = 'learning' | 'practice' | 'assessment' | 'reflection' | 'application';

// Analytics and reporting types

export interface JobMarketAnalytics {
  studentId: string;
  timeRange: DateRange;
  summary: MarketSummary;
  skillAnalytics: SkillMarketAnalytics;
  careerAnalytics: CareerMarketAnalytics;
  opportunityAnalytics: OpportunityAnalytics;
  competitiveAnalytics: CompetitiveAnalytics;
  trendAnalytics: TrendAnalytics;
  recommendations: AnalyticsRecommendation[];
  insights: MarketInsight[];
}

export interface MarketSummary {
  totalOpportunities: number;
  matchingOpportunities: number;
  averageMatchScore: number;
  salaryPotential: SalaryRange;
  skillGapCount: number;
  careerReadiness: number; // 0-1
  marketPosition: MarketPosition;
  improvementPotential: number; // 0-1
}

export interface SkillMarketAnalytics {
  topDemandSkills: SkillDemandMetric[];
  emergingSkills: EmergingSkillMetric[];
  skillGapAnalysis: SkillGapAnalysis;
  skillPortfolioValue: SkillPortfolioValue;
  competencyBenchmarks: CompetencyBenchmark[];
  skillTrends: SkillTrendAnalysis[];
}

export interface CareerMarketAnalytics {
  targetRoleAnalysis: TargetRoleAnalysis[];
  pathwayViability: PathwayViabilityAnalysis[];
  careerProgression: CareerProgressionAnalysis;
  industryAnalysis: IndustryAnalysis[];
  locationAnalysis: LocationMarketAnalysis[];
  salaryAnalysis: SalaryMarketAnalysis;
}

export interface OpportunityAnalytics {
  currentOpportunities: OpportunityMetric[];
  futureOpportunities: FutureOpportunityMetric[];
  geographicDistribution: GeographicOpportunityData[];
  industryDistribution: IndustryOpportunityData[];
  experienceDistribution: ExperienceOpportunityData[];
  opportunityTrends: OpportunityTrend[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Additional metric types for comprehensive analytics

export interface SkillDemandMetric {
  skillId: string;
  skillName: string;
  demandScore: number; // 0-100
  growthRate: number; // percentage
  opportunityCount: number;
  averageSalaryImpact: number;
  supplyDemandRatio: number;
  timeToMaster: TimeEstimate;
}

export interface EmergingSkillMetric {
  skillId: string;
  skillName: string;
  emergenceScore: number; // 0-100
  adoptionVelocity: number;
  marketPenetration: number; // 0-1
  futureRelevance: number; // 0-1
  learningAccessibility: number; // 0-1
}

export interface SkillGapAnalysis {
  totalGaps: number;
  criticalGaps: number;
  averageGapSize: number;
  gapsByCategory: CategoryGapMetric[];
  closingTimeline: TimeEstimate;
  investmentRequired: CostEstimate;
}

export interface SkillPortfolioValue {
  currentValue: number;
  potentialValue: number;
  marketability: number; // 0-1
  uniqueness: number; // 0-1
  futureProofing: number; // 0-1
  portfolioBalance: PortfolioBalance;
}

export interface PortfolioBalance {
  technical: number; // 0-1
  soft: number; // 0-1
  industry: number; // 0-1
  leadership: number; // 0-1
  emerging: number; // 0-1
  diversification: number; // 0-1
}

export interface CompetencyBenchmark {
  competency: string;
  studentScore: number; // 0-100
  industryAverage: number; // 0-100
  topPerformerScore: number; // 0-100
  gap: number;
  improvement: string[];
}

export interface TargetRoleAnalysis {
  roleId: string;
  roleName: string;
  matchScore: number; // 0-1
  readinessLevel: ReadinessLevel;
  requiredDevelopment: DevelopmentRequirement[];
  timeToReadiness: TimeEstimate;
  opportunityCount: number;
  competitionLevel: CompetitionLevel;
}

export interface PathwayViabilityAnalysis {
  pathwayId: string;
  pathwayName: string;
  viabilityScore: number; // 0-1
  successProbability: number; // 0-1
  timeToGoal: TimeEstimate;
  investmentRequired: CostEstimate;
  riskFactors: RiskFactor[];
  accelerationOptions: AccelerationOption[];
}

export interface CareerProgressionAnalysis {
  currentLevel: ExperienceLevel;
  nextLevel: ExperienceLevel;
  progressionProbability: number; // 0-1
  timeToPromotion: TimeEstimate;
  requiredSkills: RequiredSkill[];
  competitionAnalysis: CompetitionAnalysis;
  accelerators: ProgressionAccelerator[];
}

export type ReadinessLevel = 'ready' | 'mostly_ready' | 'developing' | 'early_stage' | 'not_ready';

export interface DevelopmentRequirement {
  area: string;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  priority: RecommendationPriority;
  developmentPath: string[];
}

export interface ProgressionAccelerator {
  accelerator: string;
  impact: number; // 0-1
  feasibility: number; // 0-1
  timeReduction: TimeEstimate;
  requirements: string[];
}

export interface CompetitionAnalysis {
  competitorCount: number;
  strengthComparison: StrengthComparison[];
  differentiationOpportunities: string[];
  competitiveAdvantages: string[];
  marketPositioning: MarketPositioning;
}

export interface StrengthComparison {
  area: string;
  studentStrength: number; // 0-1
  competitorAverage: number; // 0-1
  advantage: number; // -1 to 1
}

export interface MarketPositioning {
  position: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}