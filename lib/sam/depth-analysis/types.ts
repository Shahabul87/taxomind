/**
 * Agentic Depth Analysis V3 - Type Definitions
 *
 * Central type definitions for the agentic depth analysis pipeline.
 */

import type { AnalysisMode, AnalysisFramework } from '@/lib/sam/tools/depth-analyzer';

// Re-export tool types
export type { AnalysisMode, AnalysisFramework };

// =============================================================================
// SCORING
// =============================================================================

/** Bloom's taxonomy level weights for depth scoring */
export const BLOOMS_DEPTH_WEIGHTS = {
  REMEMBER: 0.05,
  UNDERSTAND: 0.10,
  APPLY: 0.20,
  ANALYZE: 0.25,
  EVALUATE: 0.20,
  CREATE: 0.20,
} as const;

export type BloomsLevel = keyof typeof BLOOMS_DEPTH_WEIGHTS;

/** Overall score composition weights */
export const SCORING_WEIGHTS = {
  structural: 0.10,
  cognitive: 0.30,
  pedagogical: 0.20,
  flow: 0.25,
  assessment: 0.15,
} as const;

export type ScoreDimension = keyof typeof SCORING_WEIGHTS;

// =============================================================================
// ANALYSIS RESULTS
// =============================================================================

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface DokDistribution {
  recall: number;
  skill: number;
  strategic: number;
  extended: number;
}

export interface FrameworkScores {
  blooms?: number;
  dok?: number;
  solo?: number;
  fink?: number;
  marzano?: number;
  gagne?: number;
  qm?: number;
  olc?: number;
}

export interface GagneEventCheck {
  event: string;
  present: boolean;
  quality: 'strong' | 'weak' | 'missing';
  evidence?: string;
}

export interface PrerequisiteConcept {
  concept: string;
  status: 'SATISFIED' | 'MISSING' | 'ASSUMED';
  introducedInChapter?: number;
  requiredByChapter: number;
}

export interface SectionAnalysisResult {
  sectionId: string;
  sectionTitle: string;
  sectionPosition: number;
  bloomsLevel: BloomsLevel;
  dokLevel?: number;
  gagneEvents: GagneEventCheck[];
  contentWordCount: number;
  estimatedTimeMinutes: number;
  readabilityScore?: number;
  issues: AnalysisIssue[];
  frameworkScores: FrameworkScores;
}

export interface ChapterAnalysisResult {
  chapterNumber: number;
  chapterId: string;
  chapterTitle: string;
  bloomsDistribution: BloomsDistribution;
  dokDistribution?: DokDistribution;
  frameworkScores: FrameworkScores;
  gagneCompliance: GagneEventCheck[];
  constructiveAlignmentScore: number;
  prerequisites: PrerequisiteConcept[];
  sections: SectionAnalysisResult[];
  issues: AnalysisIssue[];
  overallScore: number;
  structuralScore: number;
  cognitiveScore: number;
  pedagogicalScore: number;
  flowScore: number;
  assessmentScore: number;
  contentHash: string;
  analysisQuality: number;
  needsHealing: boolean;
  healingReason?: string;
  dataSource?: StageDataSource;
}

export interface StageDataSource {
  structural: 'rule-based';
  cognitive: 'ai' | 'ai+rules' | 'rule-based' | 'skipped';
  pedagogical: 'ai' | 'skipped' | 'failed';
  flow: 'ai' | 'skipped' | 'failed';
  assessment: 'rule-based';
  confidence: number;
}

export interface CrossChapterResult {
  flowScore: number;
  consistencyScore: number;
  progressionScore: number;
  knowledgeFlowIssues: KnowledgeFlowIssue[];
  progressionIssues: ProgressionIssue[];
  terminologyConsistency: number;
  difficultyProgression: number[];
  conceptDependencyGraph: ConceptDependency[];
  dataSource?: 'ai' | 'fallback';
}

export interface KnowledgeFlowIssue {
  type: 'MISSING_PREREQUISITE' | 'INTRODUCED_TOO_LATE' | 'ORPHANED_CONCEPT' | 'CIRCULAR_DEPENDENCY';
  concept: string;
  sourceChapter: number;
  targetChapter: number;
  severity: IssueSeverity;
  description: string;
}

export interface ProgressionIssue {
  type: 'REGRESSION' | 'PLATEAU' | 'JUMP' | 'INCONSISTENT_STYLE';
  fromChapter: number;
  toChapter: number;
  dimension: string;
  description: string;
  severity: IssueSeverity;
}

export interface ConceptDependency {
  concept: string;
  introducedIn: number;
  usedIn: number[];
  prerequisiteFor: string[];
}

// =============================================================================
// ISSUES
// =============================================================================

export type IssueType =
  | 'STRUCTURE'
  | 'CONTENT'
  | 'FLOW'
  | 'DUPLICATE'
  | 'CONSISTENCY'
  | 'DEPTH'
  | 'OBJECTIVE'
  | 'ASSESSMENT'
  | 'PREREQUISITE'
  | 'TIME'
  | 'GAP'
  | 'READABILITY'
  | 'FACTUAL'
  | 'LEARNER_EXPERIENCE'
  | 'ACCESSIBILITY'
  | 'PEDAGOGICAL';

export type IssueSeverity = 'CRITICAL' | 'MODERATE' | 'MINOR' | 'INFO';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'SKIPPED' | 'WONT_FIX';

export interface IssueEvidence {
  quotes?: string[];
  lineNumbers?: number[];
  context?: string;
  framework?: string;
  confidenceScore?: number;
}

export interface IssueImpact {
  area: string;
  description: string;
  affectedStudents?: string;
}

export interface IssueFix {
  action: string;
  what: string;
  why: string;
  how: string;
  suggestedContent?: string;
  examples?: string[];
}

export interface AnalysisIssue {
  fingerprint: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterPosition?: number;
  sectionId?: string;
  sectionTitle?: string;
  sectionPosition?: number;
  contentType?: string;
  type: IssueType;
  severity: IssueSeverity;
  framework: string;
  title: string;
  description: string;
  evidence?: IssueEvidence;
  impact?: IssueImpact;
  fix?: IssueFix;
}

// =============================================================================
// PIPELINE STATE
// =============================================================================

export interface AnalysisOptions {
  userId: string;
  courseId: string;
  analysisId?: string;
  mode: AnalysisMode;
  frameworks: AnalysisFramework[];
  focusAreas: string[];
  forceReanalyze?: boolean;
  resumeFromAnalysis?: string;
  emitSSE: SSEEmitter;
  abortSignal?: AbortSignal;
}

export interface AnalysisStepContext {
  userId: string;
  courseId: string;
  analysisId: string;
  chapterNumber: number;
  chapterId: string;
  chapterTitle: string;
  chapterContent: ChapterContentData;
  mode: AnalysisMode;
  frameworks: AnalysisFramework[];
  focusAreas: string[];
  priorChapterResults: ChapterAnalysisResult[];
  priorInsights: AnalysisMemoryContext | null;
  modelInfo: ModelInfo;
}

export interface ChapterContentData {
  id: string;
  title: string;
  position: number;
  sections: SectionContentData[];
  totalWordCount: number;
  contentHash: string;
}

export interface SectionContentData {
  id: string;
  title: string;
  position: number;
  content: string;
  contentType: string;
  learningObjectives: string[];
  wordCount: number;
}

export interface CourseDataForAnalysis {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  chapters: ChapterContentData[];
  totalChapters: number;
  totalSections: number;
  totalWords: number;
  contentHash: string;
}

export interface ModelInfo {
  isReasoningModel: boolean;
  provider: string;
  model: string;
}

// =============================================================================
// MEMORY
// =============================================================================

export interface AnalysisMemoryContext {
  priorIssues: AnalysisIssue[];
  priorScores: {
    overallScore: number;
    dimensionScores: Record<string, number>;
    analysisDate: string;
  } | null;
  teachingStyle: {
    preferredBloomsLevels: BloomsLevel[];
    averageContentDepth: number;
    commonGaps: string[];
  } | null;
  categoryPatterns: {
    typicalBloomsDistribution: BloomsDistribution;
    commonIssueTypes: string[];
  } | null;
}

// =============================================================================
// CHECKPOINT
// =============================================================================

export interface AnalysisCheckpointData {
  courseId: string;
  analysisId: string;
  goalId: string;
  planId: string;
  stepIds: string[];
  mode: AnalysisMode;
  frameworks: AnalysisFramework[];

  completedChapters: ChapterAnalysisResult[];
  currentChapterIndex: number;
  totalChapters: number;

  issuesFound: AnalysisIssue[];
  bloomsAggregation: BloomsDistribution;
  frameworkScores: Record<string, number>;

  contentHashes: Record<string, string>;
  agenticDecisions: AgenticDecision[];
  healingQueue: string[];

  tokensUsed: number;
  estimatedCost: number;
}

// =============================================================================
// AGENTIC DECISIONS
// =============================================================================

export type AgenticDecision =
  | { action: 'continue'; chapterNumber: number }
  | { action: 'deep-dive'; chapterNumber: number; sections: string[]; reason: string }
  | { action: 'reanalyze'; chapterNumber: number; chapters: number[]; reason: string }
  | { action: 'flag-healing'; chapterNumber: number; issues: string[]; reason: string }
  | { action: 'adjust-strategy'; chapterNumber: number; changes: Record<string, unknown> }
  | { action: 'skip'; chapterNumber: number; reason: string }
  | { action: 'halt'; chapterNumber: number; reason: string };

// =============================================================================
// SSE EVENTS
// =============================================================================

export type DepthAnalysisSSEEventType =
  | 'analysis_start'
  | 'strategy_planned'
  | 'stage_start'
  | 'chapter_analyzing'
  | 'framework_result'
  | 'issue_found'
  | 'thinking'
  | 'chapter_complete'
  | 'cross_chapter_start'
  | 'flow_issue_found'
  | 'healing_start'
  | 'healing_complete'
  | 'decision_made'
  | 'progress'
  | 'state_change'
  | 'post_processing'
  | 'complete'
  | 'error'
  | 'resume_hydrate'
  | 'budget_warning';

export type SSEEmitter = (event: DepthAnalysisSSEEventType, data: Record<string, unknown>) => void;

// =============================================================================
// ANALYSIS STATS
// =============================================================================

export interface AnalysisStats {
  totalChapters: number;
  totalSections: number;
  totalIssues: number;
  criticalIssues: number;
  moderateIssues: number;
  minorIssues: number;
  infoIssues: number;
  overallScore: number;
  tokensUsed: number;
  estimatedCost: number;
  analysisTimeMs: number;
  healingRuns: number;
  agenticDecisions: number;
}

export interface AnalysisReflection {
  selfAssessment: string;
  confidenceLevel: number;
  underAnalyzedChapters: number[];
  calibrationNotes: string;
  crossCuttingPatterns: string[];
}

// =============================================================================
// RESUME
// =============================================================================

export interface ResumeState {
  analysisId: string;
  goalId: string;
  planId: string;
  stepIds: string[];
  completedChapters: ChapterAnalysisResult[];
  completedChapterCount: number;
  currentChapterIndex: number;
  issuesFound: AnalysisIssue[];
  bloomsAggregation: BloomsDistribution;
  frameworkScores: Record<string, number>;
  contentHashes: Record<string, string>;
  healingQueue: string[];
  tokensUsed: number;
  estimatedCost: number;
}
