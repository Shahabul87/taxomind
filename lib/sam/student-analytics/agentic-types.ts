/**
 * Student Analytics PRISM Agent Types
 *
 * Type definitions for the 5-stage PRISM student analytics pipeline.
 * Powers the conversational tool, orchestrator, and SSE streaming.
 *
 * PRISM Framework (Student Level):
 *   P - Profile learner&apos;s cognitive state
 *   R - Reveal patterns in performance
 *   I - Identify growth opportunities
 *   S - Suggest prescriptions
 *   M - Monitor progress over time
 *
 * Stages 1-2 are ALWAYS pure computation (no AI).
 * AI only interprets pre-computed data in Stages 3-5.
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

export type AnalysisDepth = 'quick_snapshot' | 'standard' | 'deep_analysis';
export type CourseScope = 'all_courses' | 'specific_course' | 'recent_activity';
export type TimeRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

// =============================================================================
// COLLECTION TYPES (4-step conversational flow)
// =============================================================================

export type StudentAnalyticsCollectionStep =
  | 'analysisDepth'
  | 'courseScope'
  | 'timeRange'
  | 'confirm'
  | 'complete';

export interface StudentAnalyticsCollectionState {
  step: StudentAnalyticsCollectionStep;
  collected: Partial<StudentAnalyticsParams>;
  conversationId: string;
  createdAt: number;
}

export interface StudentAnalyticsParams {
  analysisDepth: AnalysisDepth;
  courseScope: CourseScope;
  timeRange: TimeRange;
  courseId?: string;
}

// =============================================================================
// REASONING PATH (from DIAGNOSE data)
// =============================================================================

export type ReasoningPath =
  | 'expert'
  | 'valid_alternative'
  | 'fragile'
  | 'partial'
  | 'wrong_model'
  | 'guessing';

// =============================================================================
// STAGE 1: PERFORMANCE SNAPSHOT (Pure Computation)
// =============================================================================

export interface BloomsSkillData {
  conceptId: string;
  rememberMastery: number;
  understandMastery: number;
  applyMastery: number;
  analyzeMastery: number;
  evaluateMastery: number;
  createMastery: number;
  overallMastery: number;
  currentBloomsLevel: BloomsLevel;
  totalAttempts: number;
  trend: string | null;
  confidence: number | null;
}

export interface ExamAttemptData {
  attemptId: string;
  examId: string;
  scorePercentage: number | null;
  isPassed: boolean | null;
  totalQuestions: number;
  correctAnswers: number;
  startedAt: Date;
  timeSpent: number | null;
}

export interface DiagnoseData {
  answerId: string;
  targetBloomsLevel: BloomsLevel;
  demonstratedLevel: BloomsLevel;
  score: number;
  accuracy: number;
  completeness: number;
  depth: number;
  misconceptions: unknown;
  feedback: string;
}

export interface EngagementData {
  totalSessions: number;
  totalDurationMinutes: number;
  avgSessionDurationMinutes: number;
  enrolledCourses: number;
  activeCourses: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  recentActivityCount: number;
  practiceSessionCount: number;
  spacedRepetitionDueCount: number;
}

export interface PerformanceSnapshot {
  userId: string;
  collectedAt: Date;
  timeRange: TimeRange;
  courseScope: CourseScope;

  // Group A: Cognitive
  bloomsSkills: BloomsSkillData[];
  bloomsMetrics: Array<{
    bloomsLevel: BloomsLevel;
    accuracy: number;
    totalAttempts: number;
    improvementRate: number;
  }>;

  // Group B: Assessment
  examAttempts: ExamAttemptData[];
  diagnoseRecords: DiagnoseData[];

  // Group C: Engagement
  engagement: EngagementData;
}

// =============================================================================
// STAGE 2: BLOOM'S COGNITIVE MAP (Pure Computation)
// =============================================================================

export type BloomsMasteryStatus =
  | 'mastery'    // >= 80%
  | 'solid'      // 60-79%
  | 'developing' // 40-59%
  | 'emerging'   // 20-39%
  | 'gap';       // < 20%

export interface BloomsCognitiveMap {
  /** Per-level mastery scores and status */
  levelMastery: Record<BloomsLevel, {
    score: number;
    status: BloomsMasteryStatus;
    skillCount: number;
  }>;

  /** Highest Bloom&apos;s level with >= 80% mastery */
  cognitiveCeiling: BloomsLevel;

  /** Next level to target (ceiling + 1) */
  growthEdge: BloomsLevel;

  /** Bloom&apos;s levels gained per month */
  velocity: number;

  /** Reasoning path distribution from DIAGNOSE data */
  reasoningDistribution: Record<ReasoningPath, number>;

  /** Questions answered correctly but with fragile/partial reasoning */
  fragileKnowledgeCount: number;
  fragileKnowledgePercentage: number;

  /** Overall cognitive health score (0-100) */
  cognitiveHealthScore: number;

  /** Concepts with declining mastery */
  decliningConcepts: string[];

  /** Concepts with improving mastery */
  improvingConcepts: string[];
}

// =============================================================================
// COGNITIVE CLUSTERS
// =============================================================================

export type CognitiveCluster =
  | 'fast_starter'
  | 'slow_but_deep'
  | 'inconsistent_engager'
  | 'surface_skimmer'
  | 'self_directed_expert';

// =============================================================================
// STAGE 3: AI INTERPRETIVE ANALYSIS
// =============================================================================

export interface InterpretiveAnalysis {
  cognitiveCluster: CognitiveCluster;
  clusterDescription: string;
  patternInsights: string[];
  strengthSummary: string;
  gapSummary: string;
  keyFinding: string;
}

// =============================================================================
// STAGE 4: PRESCRIPTIONS & ALERTS
// =============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface StudentAlert {
  severity: AlertSeverity;
  title: string;
  description: string;
  actionRequired: boolean;
}

export interface Prescription {
  priority: number;
  title: string;
  description: string;
  why: string;
  effortLevel: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  arrowPhase?: string;
  suggestedActions: string[];
}

export interface PrescriptionOutput {
  alerts: StudentAlert[];
  prescriptions: Prescription[];
}

// =============================================================================
// STAGE 5: PRISM REPORT
// =============================================================================

export interface PRISMReport {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  verificationQuestions: Array<{
    concept: string;
    question: string;
  }>;
  nextSteps: string[];
}

// =============================================================================
// ORCHESTRATION CONFIG & RESULT
// =============================================================================

export interface StudentAnalyticsOrchestrationConfig {
  params: StudentAnalyticsParams;
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

export interface StudentAnalyticsOrchestrationResult {
  success: boolean;
  report?: PRISMReport;
  cognitiveMap?: BloomsCognitiveMap;
  prescriptions?: PrescriptionOutput;
  interpretiveAnalysis?: InterpretiveAnalysis;
  stats?: {
    totalSkills: number;
    totalExamAttempts: number;
    cognitiveHealthScore: number;
    fragileKnowledgePercentage: number;
    cognitiveCluster: CognitiveCluster;
  };
  error?: string;
  goalId?: string;
  planId?: string;
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export type StudentAnalyticsSSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'thinking'
  | 'progress'
  | 'cognitive_map_computed'
  | 'blooms_profile'
  | 'interpretive_insight'
  | 'fragile_knowledge_alert'
  | 'prescription_generated'
  | 'alert_generated'
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

// =============================================================================
// CACHE
// =============================================================================

export interface AnalyticsCacheEntry {
  key: string;
  data: StudentAnalyticsOrchestrationResult;
  createdAt: number;
  expiresAt: number;
}
