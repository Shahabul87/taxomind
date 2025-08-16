// Prerequisite Dependency Tracking Types

export interface PrerequisiteRule {
  id: string;
  sourceContentId: string;
  targetContentId: string;
  type: PrerequisiteType;
  strength: PrerequisiteStrength;
  metadata: PrerequisiteMetadata;
  conditions: PrerequisiteCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export type PrerequisiteType = 
  | 'hard_prerequisite'      // Must complete before proceeding
  | 'soft_prerequisite'      // Recommended but not required
  | 'conceptual_dependency'  // Related concepts that help understanding
  | 'skill_dependency'       // Required skills for success
  | 'knowledge_foundation'   // Background knowledge needed
  | 'sequence_dependency'    // Must follow in order
  | 'co_requisite'          // Should be learned together
  | 'alternative_path'      // Can be replaced by this content
  | 'enrichment'           // Optional enhancement content
  | 'remediation';         // Needed if struggling

export type PrerequisiteStrength = 
  | 'critical'    // Absolutely required - 100% dependency
  | 'important'   // Highly recommended - 80% dependency
  | 'helpful'     // Beneficial but optional - 60% dependency
  | 'suggested'   // Nice to have - 40% dependency
  | 'optional';   // Minimal impact - 20% dependency

export interface PrerequisiteMetadata {
  confidence: number; // 0-1, how certain we are about this dependency
  evidenceSource: EvidenceSource;
  impactOnSuccess: number; // 0-1, how much this affects success
  difficulty: QuestionDifficultyLevel;
  estimatedTime: number; // minutes to complete prerequisite
  successRate: number; // 0-1, success rate when prerequisite is met
  failureRate: number; // 0-1, failure rate when prerequisite is not met
  learningGap: number; // 0-1, gap in learning when skipped
  cognitiveLoad: CognitiveLoadImpact;
  bloomsTaxonomy: BloomsTaxonomyLevel[];
}

export type EvidenceSource = 
  | 'instructor_defined'     // Manually set by instructor
  | 'curriculum_analysis'    // Derived from curriculum structure
  | 'student_data'          // Inferred from student performance
  | 'content_analysis'      // Analyzed from content similarity
  | 'expert_knowledge'      // Domain expert input
  | 'machine_learning'      // ML-derived dependencies
  | 'peer_feedback'         // Student and instructor feedback
  | 'academic_research';    // Based on educational research

export type QuestionDifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CognitiveLoadImpact {
  intrinsic: number; // 0-1, inherent difficulty
  extraneous: number; // 0-1, unnecessary complexity
  germane: number; // 0-1, meaningful learning effort
}

export type BloomsTaxonomyLevel = 
  | 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface PrerequisiteCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  weight: number; // 0-1, importance of this condition
  description: string;
}

export type ConditionType = 
  | 'completion_status'     // Must be completed
  | 'mastery_level'        // Must achieve certain mastery
  | 'time_spent'           // Must spend minimum time
  | 'quiz_score'           // Must achieve certain score
  | 'assignment_grade'     // Must achieve certain grade
  | 'engagement_level'     // Must show engagement
  | 'attempt_count'        // Number of attempts made
  | 'help_requests'        // Help-seeking behavior
  | 'peer_interaction'     // Collaboration requirements
  | 'concept_understanding'; // Conceptual knowledge check

export type ConditionOperator = 
  | 'equals' | 'not_equals' | 'greater_than' | 'less_than' 
  | 'greater_equal' | 'less_equal' | 'contains' | 'not_contains'
  | 'in_range' | 'not_in_range' | 'matches_pattern';

export interface StudentPrerequisiteStatus {
  studentId: string;
  contentId: string;
  prerequisites: PrerequisiteCheck[];
  overallStatus: PrerequisiteStatus;
  readinessScore: number; // 0-1, how ready student is for this content
  recommendations: PrerequisiteRecommendation[];
  lastUpdated: Date;
}

export interface PrerequisiteCheck {
  prerequisiteId: string;
  sourceContentId: string;
  required: boolean;
  met: boolean;
  progress: number; // 0-1, progress toward meeting prerequisite
  timeToComplete: number; // estimated minutes to meet prerequisite
  confidence: number; // 0-1, confidence in prerequisite assessment
  evidence: CheckEvidence[];
}

export type PrerequisiteStatus = 
  | 'all_met'        // All prerequisites satisfied
  | 'mostly_met'     // Critical ones met, some optional missing
  | 'partially_met'  // Some critical prerequisites missing
  | 'not_met'        // Most/all prerequisites missing
  | 'blocked';       // Cannot proceed due to missing prerequisites

export interface CheckEvidence {
  type: EvidenceType;
  value: any;
  timestamp: Date;
  weight: number; // 0-1, how much this evidence matters
  source: string;
}

export type EvidenceType = 
  | 'completion_record' | 'quiz_score' | 'assignment_grade' 
  | 'time_spent' | 'engagement_metrics' | 'help_requests'
  | 'peer_assessment' | 'self_assessment' | 'instructor_override';

export interface PrerequisiteRecommendation {
  type: RecommendationType;
  contentId: string;
  priority: RecommendationPriority;
  reason: string;
  estimatedImpact: number; // 0-1, expected improvement
  estimatedTime: number; // minutes needed
  difficulty: QuestionDifficultyLevel;
  alternativeOptions: string[]; // Alternative content IDs
}

export type RecommendationType = 
  | 'complete_prerequisite'  // Go back and complete missing prerequisite
  | 'review_content'        // Review previously completed content
  | 'seek_help'            // Get additional support
  | 'alternative_path'     // Take different learning path
  | 'remediation'          // Take remedial content
  | 'proceed_with_caution' // Can proceed but with risk
  | 'delay_content';       // Wait before attempting

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface LearningPath {
  id: string;
  studentId: string;
  courseId: string;
  targetContentId: string;
  path: LearningPathStep[];
  totalEstimatedTime: number;
  difficultyProgression: QuestionDifficultyLevel[];
  completionProbability: number; // 0-1, likelihood of successful completion
  alternativePaths: AlternativePath[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPathStep {
  stepNumber: number;
  contentId: string;
  type: PathStepType;
  isRequired: boolean;
  estimatedTime: number;
  prerequisites: string[]; // Content IDs this step depends on
  unlocks: string[]; // Content IDs this step makes available
  difficulty: QuestionDifficultyLevel;
  cognitiveLoad: CognitiveLoadImpact;
  alternativeOptions: string[];
  adaptiveAdjustments: PathStepAdjustment[];
}

export type PathStepType = 
  | 'core_content'      // Main learning content
  | 'prerequisite'      // Required prerequisite
  | 'assessment'        // Quiz or test
  | 'practice'          // Practice exercises
  | 'review'           // Review previous content
  | 'remediation'      // Additional help content
  | 'enrichment'       // Optional advanced content
  | 'checkpoint';      // Progress validation point

export interface PathStepAdjustment {
  reason: AdjustmentReason;
  originalContentId: string;
  adjustedContentId: string;
  timestamp: Date;
  effectiveness: number; // 0-1, how well the adjustment worked
}

export type AdjustmentReason = 
  | 'prerequisite_gap' | 'difficulty_mismatch' | 'time_constraint'
  | 'learning_style' | 'performance_issue' | 'engagement_drop'
  | 'instructor_recommendation' | 'peer_suggestion';

export interface AlternativePath {
  id: string;
  name: string;
  description: string;
  path: LearningPathStep[];
  estimatedTime: number;
  difficulty: QuestionDifficultyLevel;
  suitabilityScore: number; // 0-1, how suitable for this student
  pros: string[];
  cons: string[];
}

export interface PrerequisiteGraph {
  nodes: Map<string, PrerequisiteNode>;
  edges: Map<string, PrerequisiteEdge>;
  metadata: GraphMetadata;
}

export interface PrerequisiteNode {
  id: string;
  contentId: string;
  type: ContentNodeType;
  title: string;
  description?: string;
  metadata: NodeMetadata;
  dependencies: string[]; // Node IDs this depends on
  dependents: string[]; // Node IDs that depend on this
  level: number; // Depth in prerequisite hierarchy
}

export type ContentNodeType = 
  | 'lesson' | 'chapter' | 'module' | 'course' | 'skill' | 'concept' | 'assessment';

export interface NodeMetadata {
  difficulty: QuestionDifficultyLevel;
  estimatedTime: number;
  concepts: string[];
  skills: string[];
  bloomsLevels: BloomsTaxonomyLevel[];
  cognitiveLoad: CognitiveLoadImpact;
  successRate: number;
  averageAttempts: number;
  dropoutRate: number;
}

export interface PrerequisiteEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: PrerequisiteType;
  strength: PrerequisiteStrength;
  weight: number; // 0-1, strength of dependency
  metadata: EdgeMetadata;
}

export interface EdgeMetadata {
  confidence: number;
  evidenceStrength: number;
  impactOnSuccess: number;
  created: Date;
  lastValidated: Date;
  validationSource: EvidenceSource;
}

export interface GraphMetadata {
  courseId: string;
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  averageDependencies: number;
  lastBuilt: Date;
  version: string;
}

export interface PrerequisiteAnalytics {
  courseId: string;
  timeRange: DateRange;
  summary: AnalyticsSummary;
  prerequisiteEffectiveness: PrerequisiteEffectiveness[];
  pathOptimization: PathOptimizationMetrics;
  studentOutcomes: StudentOutcomeMetrics;
  recommendations: SystemRecommendation[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsSummary {
  totalStudents: number;
  averagePathLength: number;
  completionRate: number;
  dropoutRate: number;
  averageTimeToCompletion: number;
  prerequisiteViolations: number;
  successfulPathAdaptations: number;
}

export interface PrerequisiteEffectiveness {
  prerequisiteId: string;
  sourceContentId: string;
  targetContentId: string;
  type: PrerequisiteType;
  effectiveness: EffectivenessMetrics;
  recommendations: EffectivenessRecommendation[];
}

export interface EffectivenessMetrics {
  successRateWithPrereq: number;
  successRateWithoutPrereq: number;
  improvementFactor: number;
  timeImpact: number; // Positive = increases time, negative = decreases
  engagementImpact: number;
  retentionImpact: number;
  confidenceInterval: [number, number];
}

export interface EffectivenessRecommendation {
  type: 'strengthen' | 'weaken' | 'remove' | 'modify' | 'investigate';
  reason: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PathOptimizationMetrics {
  averagePathEfficiency: number; // 0-1, how optimal current paths are
  commonBottlenecks: PathBottleneck[];
  alternativePathUsage: AlternativePathMetrics[];
  adaptationSuccess: AdaptationMetrics;
}

export interface PathBottleneck {
  contentId: string;
  title: string;
  type: BottleneckType;
  severity: number; // 0-1, how much this blocks progress
  affectedStudents: number;
  averageDelayTime: number; // minutes
  successStrategies: string[];
}

export type BottleneckType = 
  | 'difficulty_spike' | 'prerequisite_gap' | 'time_intensive'
  | 'low_engagement' | 'conceptual_leap' | 'technical_barrier';

export interface AlternativePathMetrics {
  pathId: string;
  usageFrequency: number;
  successRate: number;
  averageTime: number;
  studentSatisfaction: number;
  preferredBy: StudentSegment[];
}

export interface StudentSegment {
  criteria: string;
  percentage: number;
  averagePerformance: number;
}

export interface AdaptationMetrics {
  totalAdaptations: number;
  successfulAdaptations: number;
  adaptationTypes: Record<AdjustmentReason, number>;
  averageImprovementFromAdaptation: number;
  studentSatisfactionWithAdaptations: number;
}

export interface StudentOutcomeMetrics {
  byPrerequisiteCompliance: OutcomeByCompliance[];
  byPathType: OutcomeByPathType[];
  improvementTrends: TrendMetric[];
  riskFactors: RiskFactor[];
}

export interface OutcomeByCompliance {
  complianceLevel: 'full' | 'high' | 'medium' | 'low' | 'none';
  studentCount: number;
  averageSuccessRate: number;
  averageCompletionTime: number;
  averageSatisfaction: number;
  dropoutRate: number;
}

export interface OutcomeByPathType {
  pathType: 'standard' | 'accelerated' | 'remedial' | 'alternative' | 'adaptive';
  studentCount: number;
  outcomes: OutcomeMetrics;
}

export interface OutcomeMetrics {
  completionRate: number;
  averageGrade: number;
  timeToCompletion: number;
  engagementScore: number;
  retentionRate: number;
  satisfactionScore: number;
}

export interface TrendMetric {
  metric: string;
  timePoints: TimePoint[];
  trend: 'improving' | 'declining' | 'stable';
  significance: number; // 0-1, statistical significance
}

export interface TimePoint {
  date: Date;
  value: number;
  confidence: number;
}

export interface RiskFactor {
  factor: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedStudents: number;
  impact: string;
  mitigation: string[];
}

export interface SystemRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  metrics: string[]; // Metrics to track success
}

export interface PrerequisiteValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  overallScore: number; // 0-1, quality of prerequisite structure
}

export interface ValidationError {
  type: 'circular_dependency' | 'missing_prerequisite' | 'orphaned_content' 
       | 'invalid_sequence' | 'impossible_path';
  contentId: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  suggestedFix: string;
}

export interface ValidationWarning {
  type: 'weak_prerequisite' | 'redundant_prerequisite' | 'difficulty_jump'
       | 'long_path' | 'low_success_rate';
  contentId: string;
  message: string;
  recommendation: string;
}

export interface ValidationSuggestion {
  type: 'add_prerequisite' | 'remove_prerequisite' | 'modify_strength'
       | 'add_alternative' | 'reorder_content';
  contentId: string;
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PrerequisiteQuery {
  type: QueryType;
  contentId?: string;
  studentId?: string;
  parameters: QueryParameters;
  filters?: QueryFilter[];
}

export type QueryType = 
  | 'check_prerequisites' | 'find_path' | 'validate_sequence'
  | 'recommend_next' | 'identify_gaps' | 'optimize_path'
  | 'analyze_bottlenecks' | 'predict_success';

export interface QueryParameters {
  includeOptional?: boolean;
  maxPathLength?: number;
  timeConstraint?: number;
  difficultyPreference?: QuestionDifficultyLevel;
  considerAlternatives?: boolean;
  optimizationObjective?: OptimizationObjective;
  courseId?: string;
}

export type OptimizationObjective = 
  | 'minimize_time' | 'maximize_success' | 'minimize_difficulty'
  | 'maximize_engagement' | 'minimize_prerequisites' | 'balanced';

export interface QueryFilter {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface PrerequisiteUpdate {
  type: UpdateType;
  targetId: string;
  data: any;
  reason: string;
  source: EvidenceSource;
  timestamp: Date;
}

export type UpdateType = 
  | 'add_prerequisite' | 'remove_prerequisite' | 'modify_strength'
  | 'update_conditions' | 'add_alternative' | 'modify_metadata';