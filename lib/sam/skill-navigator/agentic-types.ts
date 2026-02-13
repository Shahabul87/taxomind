/**
 * NAVIGATOR Skill Builder - Type Definitions
 *
 * All types for the 6-stage NAVIGATOR pipeline:
 * 1. Data Collection (no AI)
 * 2. Need Analysis + Skill Audit (AI)
 * 3. Validate + Skill Graph (AI)
 * 4. Gap Analysis + Path Architecture (AI)
 * 5. Resource Optimization + Checkpoints (AI)
 * 6. Report Assembly + Persistence (no AI)
 */

// =============================================================================
// COLLECTION TYPES
// =============================================================================

export type NavigatorGoalType =
  | 'career_switch'
  | 'job_interview'
  | 'research'
  | 'build_product'
  | 'hobby'
  | 'job_requirement'
  | 'teaching';

export type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

export type NavigatorCollectionStep =
  | 'skillName'
  | 'goalOutcome'
  | 'goalType'
  | 'currentLevel'
  | 'hoursPerWeek'
  | 'deadline'
  | 'confirm'
  | 'complete';

export interface NavigatorCollectionState {
  step: NavigatorCollectionStep;
  collected: Partial<NavigatorCollectedParams>;
  conversationId: string;
  createdAt: number;
}

export interface NavigatorCollectedParams {
  skillName: string;
  goalOutcome: string;
  goalType: NavigatorGoalType;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  hoursPerWeek: number;
  deadline: string;
  learningStyle: string;
}

export interface NavigatorConversationOption {
  value: string;
  label: string;
  description?: string;
}

// =============================================================================
// STAGE 1: DATA COLLECTION (NO AI)
// =============================================================================

export interface ExistingSkillProfile {
  profileId: string;
  skillName: string;
  masteryScore: number;
  retentionScore: number;
  applicationScore: number;
  confidenceScore: number;
  compositeScore: number;
  proficiencyLevel: string;
  totalSessions: number;
  totalMinutes: number;
  averageScore: number;
  currentStreak: number;
  lastPracticedAt: string | null;
  velocityTrend: string;
}

export interface RelatedSkillLevel {
  skillName: string;
  compositeScore: number;
  proficiencyLevel: string;
  bloomsLevels: string[];
}

export interface EnrollmentRecord {
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: string;
}

export interface DiagnosticInsight {
  conceptId: string;
  overallMastery: number;
  currentBloomsLevel: string;
  bloomsBreakdown: Record<string, number>;
  trend: string;
  totalAttempts: number;
  lastAttemptDate: string | null;
}

export interface PracticeRecord {
  date: string;
  durationMinutes: number;
  score: number | null;
  skillName: string;
}

export interface NavigatorDataSnapshot {
  existingSkillProfile: ExistingSkillProfile | null;
  relatedSkillLevels: RelatedSkillLevel[];
  enrollmentHistory: EnrollmentRecord[];
  diagnosticInsights: DiagnosticInsight[];
  practiceHistory: PracticeRecord[];
  collectedAt: string;
}

// =============================================================================
// STAGE 2: NEED ANALYSIS + SKILL AUDIT
// =============================================================================

export interface GoalDNA {
  depthNeeded: 'shallow' | 'moderate' | 'deep' | 'expert';
  speedNeeded: 'relaxed' | 'moderate' | 'aggressive' | 'urgent';
  breadthNeeded: 'narrow' | 'moderate' | 'broad';
}

export interface RefinedGoal {
  original: string;
  refined: string;
  measurableOutcomes: string[];
}

export interface FragileKnowledge {
  skillDimension: string;
  claimedLevel: string;
  estimatedActualLevel: string;
  evidence: string;
  risk: 'low' | 'medium' | 'high';
}

export interface NeedAnalysisResult {
  goalDNA: GoalDNA;
  refinedGoal: RefinedGoal;
  goalClassification: NavigatorGoalType;
  constraints: {
    totalHoursAvailable: number;
    weeklyHours: number;
    deadlineWeeks: number | null;
    hardDeadline: boolean;
  };
  learningContext: {
    hasExistingKnowledge: boolean;
    hasPlatformHistory: boolean;
    previousAttempts: number;
    preferredStyle: string;
  };
}

export interface BloomsAssessment {
  dimension: string;
  currentLevel: string;
  bloomsLevel: string;
  confidence: 'verified' | 'estimated' | 'self_reported';
  evidence: string;
}

export interface SkillAuditResult {
  overallAssessment: string;
  bloomsAssessments: BloomsAssessment[];
  fragileKnowledge: FragileKnowledge[];
  strengths: string[];
  gapsIdentified: string[];
}

// =============================================================================
// STAGE 3: VALIDATE + SKILL GRAPH
// =============================================================================

export interface FeasibilityResult {
  feasible: boolean;
  totalHoursNeeded: number;
  totalHoursAvailable: number;
  utilizationPercent: number;
  verdict: string;
  reframingOptions: string[];
}

export type SkillNodeType = 'BLOCKER' | 'ACCELERATOR' | 'CORE' | 'OPTIONAL' | 'PARALLEL';

export interface SkillNode {
  id: string;
  name: string;
  layer: 'foundation' | 'core' | 'applied' | 'advanced' | 'meta';
  type: SkillNodeType;
  currentLevel: string;
  targetLevel: string;
  estimatedHours: number;
  dependencies: string[];
  enablesSkills: string[];
}

export interface SkillGraph {
  nodes: SkillNode[];
  criticalPath: string[];
  parallelGroups: string[][];
  totalNodes: number;
  blockerCount: number;
  acceleratorCount: number;
}

export interface MilestoneSubGoal {
  id: string;
  title: string;
  description: string;
  exitRamp: string;
  skillsCovered: string[];
  estimatedHours: number;
  verificationCriteria: string[];
}

export interface ValidationResult {
  feasibility: FeasibilityResult;
  skillGraph: SkillGraph;
  milestones: MilestoneSubGoal[];
}

// =============================================================================
// STAGE 4: GAP ANALYSIS + PATH ARCHITECTURE
// =============================================================================

export type GapAction = 'SKIP' | 'VERIFY' | 'STRENGTHEN' | 'LEARN' | 'HEAVY_LEARN';

export interface GapEntry {
  skillDimension: string;
  currentLevel: string;
  targetLevel: string;
  gap: string;
  action: GapAction;
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface WeeklyRhythm {
  weekNumber: number;
  theme: string;
  activities: {
    learn: string[];
    build: string[];
    review: string[];
  };
  hoursPlanned: number;
}

export interface ContingencyPlan {
  scenario: string;
  trigger: string;
  action: string;
  adjustments: string[];
}

export interface PhaseArchitecture {
  phaseNumber: number;
  title: string;
  description: string;
  bloomsLevel: string;
  difficulty: string;
  estimatedHours: number;
  durationWeeks: number;
  skills: string[];
  weeklyRhythm: WeeklyRhythm[];
  exitRamp: string;
}

export interface GapAnalysis {
  gapTable: GapEntry[];
  totalGapHours: number;
  criticalGaps: string[];
}

export interface PathArchitecture {
  phases: PhaseArchitecture[];
  contingencyPlans: ContingencyPlan[];
  totalWeeks: number;
  totalHours: number;
  timeSplit: {
    learn: number;
    build: number;
    review: number;
  };
}

// =============================================================================
// STAGE 5: RESOURCE OPTIMIZATION + CHECKPOINTS
// =============================================================================

export interface ResourceSuggestion {
  phaseNumber: number;
  courseTitle: string;
  courseDescription: string;
  difficulty: string;
  estimatedHours: number;
  learningOutcomes: string[];
  keyTopics: string[];
  reason: string;
}

export interface CheckpointCriteria {
  knowledgeCheck: string;
  buildCheck: string;
  explainCheck: string;
  transferCheck: string;
}

export interface MilestoneCheckpoint {
  milestoneId: string;
  milestoneTitle: string;
  checkpoint: CheckpointCriteria;
  exitRampDescription: string;
}

export interface MotivationArchitecture {
  firstWeekWin: string;
  biWeeklyWows: string[];
  postHardTopicWins: string[];
}

export interface ResourceMap {
  resources: ResourceSuggestion[];
  totalSuggestedCourses: number;
}

export interface CheckpointDesign {
  checkpoints: MilestoneCheckpoint[];
  motivationArchitecture: MotivationArchitecture;
}

// =============================================================================
// STAGE 6: REPORT ASSEMBLY + PERSISTENCE
// =============================================================================

export interface MatchedCourse {
  suggestedTitle: string;
  matchedCourseId: string | null;
  matchedCourseTitle: string | null;
  matchConfidence: 'exact' | 'partial' | 'none';
}

export interface NavigatorRoadmapResult {
  roadmapId: string;
  title: string;
  description: string;
  totalEstimatedHours: number;
  milestoneCount: number;
  milestones: Array<{
    id: string;
    order: number;
    title: string;
    status: string;
    estimatedHours: number;
    exitRamp: string;
  }>;
  matchedCourses: number;
  totalCourses: number;
  skillGraphSummary: {
    totalNodes: number;
    criticalPath: string[];
    blockerCount: number;
  };
  gapHighlights: {
    criticalGaps: string[];
    totalGapHours: number;
  };
  contingencyPlans: ContingencyPlan[];
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export type NavigatorSSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'thinking'
  | 'progress'
  | 'need_profile_generated'
  | 'skill_audit_complete'
  | 'feasibility_check'
  | 'skill_graph_built'
  | 'gap_analysis_complete'
  | 'path_sequenced'
  | 'resource_matched'
  | 'checkpoint_designed'
  | 'course_matched'
  | 'roadmap_saved'
  | 'complete'
  | 'error';

export interface NavigatorSSEEvent {
  type: NavigatorSSEEventType;
  stage?: number;
  stageName?: string;
  data?: Record<string, unknown>;
  message?: string;
  percent?: number;
  timestamp: number;
}

// =============================================================================
// ORCHESTRATOR TYPES
// =============================================================================

export interface NavigatorOrchestratorInput {
  userId: string;
  params: NavigatorCollectedParams;
  signal?: AbortSignal;
}

export interface NavigatorStageResult<T> {
  data: T;
  durationMs: number;
  stage: number;
  stageName: string;
}

export interface NavigatorPipelineResult {
  dataSnapshot: NavigatorDataSnapshot;
  needAnalysis: NeedAnalysisResult;
  skillAudit: SkillAuditResult;
  validation: ValidationResult;
  gapAnalysis: GapAnalysis;
  pathArchitecture: PathArchitecture;
  resourceMap: ResourceMap;
  checkpointDesign: CheckpointDesign;
  roadmapResult: NavigatorRoadmapResult;
}

// =============================================================================
// NAVIGATOR STAGES
// =============================================================================

export const NAVIGATOR_STAGES = [
  { number: 1, name: 'Data Collection', hasAI: false },
  { number: 2, name: 'Need Analysis & Skill Audit', hasAI: true },
  { number: 3, name: 'Validation & Skill Graph', hasAI: true },
  { number: 4, name: 'Gap Analysis & Path Architecture', hasAI: true },
  { number: 5, name: 'Resource Optimization & Checkpoints', hasAI: true },
  { number: 6, name: 'Report Assembly & Persistence', hasAI: false },
] as const;

// =============================================================================
// GOAL TYPE → TARGET LEVEL MAPPING
// =============================================================================

export const GOAL_TYPE_TARGET_LEVEL: Record<NavigatorGoalType, ProficiencyLevel> = {
  career_switch: 'PROFICIENT',
  job_interview: 'PROFICIENT',
  research: 'EXPERT',
  build_product: 'ADVANCED',
  hobby: 'COMPETENT',
  job_requirement: 'PROFICIENT',
  teaching: 'EXPERT',
};

export const GOAL_TYPE_LABELS: Record<NavigatorGoalType, string> = {
  career_switch: 'Career Switch',
  job_interview: 'Job Interview Prep',
  research: 'Research / Deep Expertise',
  build_product: 'Build a Product',
  hobby: 'Hobby / Personal Interest',
  job_requirement: 'Job Requirement',
  teaching: 'Teaching / Mentoring Others',
};

export const DEADLINE_LABELS: Record<string, string> = {
  '1_month': '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '1_year': '1 Year',
  flexible: 'Flexible / No deadline',
};

export const DEADLINE_WEEKS: Record<string, number | null> = {
  '1_month': 4,
  '3_months': 13,
  '6_months': 26,
  '1_year': 52,
  flexible: null,
};
