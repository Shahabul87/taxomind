/**
 * Creator Analytics PRISM Agent Types
 *
 * Type definitions for the 6-stage PRISM creator analytics pipeline.
 * Powers the conversational tool, orchestrator, and SSE streaming.
 *
 * PRISM Framework (Course/Cohort Level):
 *   P - Profile cohort cognitive state
 *   R - Reveal content and assessment quality patterns
 *   I - Identify root causes of student outcomes
 *   S - Suggest prescriptions for course improvement
 *   M - Monitor and predict cohort trajectory
 *
 * Stages 1-2 are ALWAYS pure computation (no AI).
 * AI interprets pre-computed data in Stages 3-6.
 */

import type { BloomsLevel } from '@prisma/client';

export type { BloomsLevel } from '@prisma/client';

// =============================================================================
// BLOOM'S TAXONOMY CONSTANTS
// =============================================================================

export const BLOOMS_LEVELS = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

export const BLOOMS_LEVEL_ORDER: Record<BloomsLevel, number> = {
  REMEMBER: 0,
  UNDERSTAND: 1,
  APPLY: 2,
  ANALYZE: 3,
  EVALUATE: 4,
  CREATE: 5,
};

// =============================================================================
// ANALYSIS MODES
// =============================================================================

export type CreatorAnalysisDepth = 'overview' | 'standard' | 'deep_dive';
export type CreatorFocusArea =
  | 'cognitive_health'
  | 'engagement'
  | 'content_quality'
  | 'predictions'
  | 'comprehensive';
export type TimeRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

// =============================================================================
// COLLECTION TYPES (5-step conversational flow)
// =============================================================================

export type CreatorAnalyticsCollectionStep =
  | 'courseSelection'
  | 'timeRange'
  | 'focusArea'
  | 'analysisDepth'
  | 'confirm'
  | 'complete';

export interface CreatorAnalyticsCollectionState {
  step: CreatorAnalyticsCollectionStep;
  collected: Partial<CreatorAnalyticsParams>;
  conversationId: string;
  createdAt: number;
}

export interface CreatorAnalyticsParams {
  courseId: string;
  courseName?: string;
  timeRange: TimeRange;
  focusArea: CreatorFocusArea;
  analysisDepth: CreatorAnalysisDepth;
}

// =============================================================================
// STAGE 1: CREATOR DATA SNAPSHOT (Pure Computation)
// =============================================================================

export interface EnrollmentSummary {
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  droppedCount: number;
}

export interface CohortBloomsData {
  level: BloomsLevel;
  avgMastery: number;
  studentCount: number;
}

export interface ExamPerformanceSummary {
  examId: string;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  avgTimeSpent: number | null;
}

export interface EngagementSummary {
  avgSessionsPerStudent: number;
  avgDurationMinutes: number;
  totalActiveSessions: number;
  lastActiveDistribution: {
    within7Days: number;
    within30Days: number;
    over30Days: number;
    over90Days: number;
  };
}

export interface ContentCompletionData {
  chapterId: string;
  chapterTitle: string;
  completionRate: number;
  avgTimeSpent: number;
}

export interface MisconceptionFrequency {
  misconceptionId: string;
  name: string;
  category: string;
  frequency: number;
  affectedStudents: number;
}

export interface CreatorDataSnapshot {
  courseId: string;
  courseName: string;
  collectedAt: Date;
  timeRange: TimeRange;

  // Enrollment
  enrollment: EnrollmentSummary;

  // Cognitive (aggregated)
  cohortBlooms: CohortBloomsData[];

  // Exams
  examPerformance: ExamPerformanceSummary[];

  // Engagement
  engagement: EngagementSummary;

  // Content
  contentCompletion: ContentCompletionData[];

  // DIAGNOSE data (aggregated)
  misconceptionFrequencies: MisconceptionFrequency[];
  avgDiagnoseAccuracy: number;
  avgDiagnoseDepth: number;
  totalDiagnoseRecords: number;
}

// =============================================================================
// STAGE 2: COHORT COGNITIVE ANALYSIS (Pure Computation)
// =============================================================================

export type BloomsMasteryStatus =
  | 'mastery'
  | 'solid'
  | 'developing'
  | 'emerging'
  | 'gap';

export type EngagementTier = 'highly_engaged' | 'moderate' | 'disengaging' | 'inactive';

export interface CohortCognitiveAnalysis {
  /** Bloom&apos;s distribution: % of students at each cognitive ceiling */
  bloomsDistribution: Record<BloomsLevel, {
    studentCount: number;
    percentage: number;
  }>;

  /** Whether cohort is splitting into distinct groups */
  isBimodal: boolean;
  bimodalDescription?: string;

  /** Average Bloom&apos;s level advancement rate for cohort */
  cohortVelocity: number;

  /** % of cohort with >30% fragile correct answers */
  fragileKnowledgeAlarm: {
    percentage: number;
    affectedStudents: number;
    isAlarming: boolean;
  };

  /** Engagement tier distribution */
  engagementDistribution: Record<EngagementTier, {
    count: number;
    percentage: number;
  }>;

  /** Concept-level heatmap: high mastery vs widespread failure */
  conceptHeatmap: Array<{
    conceptId: string;
    avgMastery: number;
    status: BloomsMasteryStatus;
  }>;

  /** Students at risk of dropout */
  dropoutRisk: {
    highRiskCount: number;
    mediumRiskCount: number;
    totalAtRisk: number;
  };

  /** Overall cohort health score (0-100) */
  cohortHealthScore: number;
}

// =============================================================================
// STAGE 3: CONTENT & ASSESSMENT QUALITY (AI)
// =============================================================================

export interface ContentQualityReport {
  moduleAnalysis: Array<{
    moduleId: string;
    moduleName: string;
    achievementRate: number;
    engagementLevel: 'high' | 'medium' | 'low';
    issues: string[];
  }>;
  assessmentAnalysis: Array<{
    examId: string;
    discriminationIndex: number;
    difficultyBalance: string;
    bloomsAlignmentScore: number;
    issues: string[];
  }>;
  overallAlignmentScore: number;
  arrowPhaseCoverage: Record<string, number>;
}

// =============================================================================
// STAGE 4: ROOT CAUSE & RISK ANALYSIS (AI)
// =============================================================================

export type RootCauseCategory =
  | 'CONTENT'
  | 'PEDAGOGY'
  | 'ASSESSMENT'
  | 'STUDENT'
  | 'SYSTEM';

export interface RootCauseAnalysis {
  rootCauses: Array<{
    category: RootCauseCategory;
    symptom: string;
    causalChain: string[];
    rootCause: string;
    confidence: number;
    affectedStudents: number;
  }>;
  dropoutPredictions: Array<{
    riskLevel: 'high' | 'medium' | 'low';
    studentCount: number;
    predictedTimeframe: string;
    interventionWindow: string;
  }>;
  cohortTrajectory: {
    withIntervention: string;
    withoutIntervention: string;
  };
}

// =============================================================================
// STAGE 5: PRESCRIPTIONS (AI)
// =============================================================================

export interface CreatorPrescription {
  priority: number;
  title: string;
  description: string;
  why: string;
  effortLevel: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  reach: number; // % of students affected
  roi: number; // (impact * reach) / effort
  arrowPhase?: string;
  verificationMethod: string;
  suggestedActions: string[];
}

export interface CreatorPrescriptions {
  prescriptions: CreatorPrescription[];
  assessmentRedesign: Array<{
    examId: string;
    issue: string;
    suggestion: string;
  }>;
  cohortSplittingStrategy?: string;
}

// =============================================================================
// STAGE 6: REPORT (AI)
// =============================================================================

export interface CreatorPRISMReport {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  keyMetrics: Array<{
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  nextSteps: string[];
}

// =============================================================================
// ORCHESTRATION CONFIG & RESULT
// =============================================================================

export interface CreatorAnalyticsOrchestrationConfig {
  params: CreatorAnalyticsParams;
  userId: string;
  onSSEEvent?: (event: {
    type: string;
    data: Record<string, unknown>;
  }) => void;
  onProgress?: (progress: {
    percentage: number;
    message: string;
  }) => void;
  abortSignal?: AbortSignal;
}

export interface CreatorAnalyticsOrchestrationResult {
  success: boolean;
  report?: CreatorPRISMReport;
  cohortAnalysis?: CohortCognitiveAnalysis;
  contentQuality?: ContentQualityReport;
  rootCauseAnalysis?: RootCauseAnalysis;
  prescriptions?: CreatorPrescriptions;
  stats?: {
    totalEnrolled: number;
    cohortHealthScore: number;
    isBimodal: boolean;
    atRiskCount: number;
    prescriptionCount: number;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export type CreatorAnalyticsSSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'thinking'
  | 'progress'
  | 'cohort_distribution'
  | 'student_weakness_heatmap'
  | 'content_effectiveness'
  | 'assessment_quality'
  | 'dropout_risk_analysis'
  | 'fragile_knowledge_alarm'
  | 'root_cause_identified'
  | 'prescription_generated'
  | 'report_section'
  | 'complete'
  | 'error';

// =============================================================================
// STAGE PROMPT
// =============================================================================

export interface StagePrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}
