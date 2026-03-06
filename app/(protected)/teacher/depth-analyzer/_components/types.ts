/**
 * Depth Analyzer V2 - Frontend Types
 */

export interface AnalysisIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  location: {
    chapterId?: string;
    chapterTitle?: string;
    chapterPosition?: number;
    sectionId?: string;
    sectionTitle?: string;
    sectionPosition?: number;
    contentType?: string;
  };
  title: string;
  description: string;
  evidence: string[];
  impact: {
    area: string;
    description: string;
  };
  fix: {
    action: string;
    what: string;
    why: string;
    how: string;
    suggestedContent?: string;
    examples?: string[];
  };
  resolvedAt?: string;
  resolvedBy?: string;
  userNotes?: string;
  skippedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type IssueType =
  | 'STRUCTURE'
  | 'CONTENT'
  | 'FLOW'
  | 'DUPLICATE'
  | 'CONSISTENCY'
  | 'DEPTH'
  | 'OBJECTIVE'
  | 'ASSESSMENT'
  | 'TIME'
  | 'PREREQUISITE'
  | 'GAP'
  | 'READABILITY'
  | 'FACTUAL'
  | 'LEARNER_EXPERIENCE'
  | 'ACCESSIBILITY'
  | 'PEDAGOGICAL';

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MODERATE' | 'MINOR' | 'INFO';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'SKIPPED' | 'WONT_FIX';

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface ChapterAnalysis {
  chapterId: string;
  chapterTitle: string;
  position: number;
  scores: {
    depth: number;
    consistency: number;
    flow: number;
    quality: number;
  };
  issueCount: number;
  primaryBloomsLevel: string;
}

export interface IssueCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AnalysisComparison {
  previousVersionId: string;
  previousVersion: number;
  scoreImprovement: number;
  issuesResolved: number;
  newIssues: number;
}

export interface DepthAnalysisV2Result {
  id: string;
  courseId: string;
  courseTitle: string;
  version: number;
  status: string;
  analysisMethod: string;

  // Scores
  overallScore: number;
  depthScore: number;
  consistencyScore: number;
  flowScore: number;
  qualityScore: number;

  // Bloom's
  bloomsDistribution: BloomsDistribution;
  bloomsBalance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  // Chapter Analysis
  chapterAnalysis: ChapterAnalysis[];

  // Issues
  issueCount: IssueCount;
  issues: AnalysisIssue[];

  // Comparison
  comparison?: AnalysisComparison;

  // Timestamps
  analyzedAt: string;
  updatedAt: string;
}

export interface AnalysisProgress {
  step: number;
  totalSteps: number;
  stepName: string;
  message: string;
  percentComplete: number;
}

/**
 * AI Analysis Progress Event Types
 * Extended in V3 to include agentic events (decision, healing, resume, budget)
 */
export type AIProgressEventType =
  | 'analysis_start'
  | 'stage_start'
  | 'analyzing_item'
  | 'thinking'
  | 'issue_found'
  | 'stage_complete'
  | 'progress'
  | 'complete'
  | 'error'
  // V3 agentic events
  | 'strategy_planned'
  | 'chapter_analyzing'
  | 'chapter_complete'
  | 'framework_result'
  | 'cross_chapter_start'
  | 'flow_issue_found'
  | 'decision_made'
  | 'healing_start'
  | 'healing_complete'
  | 'post_processing'
  | 'resume_hydrate'
  | 'budget_warning'
  | 'state_change';

export interface AIAnalysisStartData {
  mode: 'ai' | 'rule-based';
  analysisMode?: 'full-course' | 'chapter-wise';
  estimatedTime?: string;
  courseTitle: string;
  chaptersCount: number;
}

export interface AIStageStartData {
  stage: 'overview' | 'chapters' | 'cross-chapter' | 'finalizing';
  message: string;
}

export interface AIAnalyzingItemData {
  item: string;
  chapterIndex?: number;
  totalChapters?: number;
}

export interface AIThinkingData {
  stage: string;
  chapter?: string;
  thinking: string;
}

export interface AIIssueFoundData {
  issue: AnalysisIssue;
}

export interface AIProgressData {
  percent: number;
  stage: string;
}

export interface AIStageCompleteData {
  stage: string;
  result?: unknown;
  chaptersAnalyzed?: number;
  scores?: {
    overall: number;
    depth: number;
    consistency: number;
    flow: number;
    quality: number;
  };
  issueCount?: number;
}

export interface AICompleteData {
  analysisId: string;
  overallScore: number;
  issueCount: IssueCount;
  version: number;
  analysisMethod: 'ai' | 'rule-based';
}

export interface AIErrorData {
  message: string;
  stage?: string;
}

export interface AIProgressEvent {
  type: AIProgressEventType;
  data:
    | AIAnalysisStartData
    | AIStageStartData
    | AIAnalyzingItemData
    | AIThinkingData
    | AIIssueFoundData
    | AIProgressData
    | AIStageCompleteData
    | AICompleteData
    | AIErrorData;
}

/**
 * Combined progress state for UI
 */
export interface StageWarning {
  stage: string;
  message: string;
}

export interface AnalysisProgressState {
  // Basic progress
  isAnalyzing: boolean;
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;

  // Mode info
  mode: 'ai' | 'rule-based';
  analysisMode?: 'full-course' | 'chapter-wise';
  estimatedTime?: string;

  // Current stage
  currentStage: 'overview' | 'chapters' | 'cross-chapter' | 'finalizing' | 'complete' | null;
  currentItem?: string;
  currentChapter?: number;
  totalChapters?: number;

  // Progress percentage
  percentComplete: number;

  // AI thinking (for transparency)
  thinking?: string;

  // Issues found during analysis
  issuesFound: AnalysisIssue[];
  issueCount: number;

  // Stage-level warnings (non-fatal errors from individual stages)
  stageWarnings: StageWarning[];

  // Final result
  analysisId?: string;
  overallScore?: number;

  // V3 agentic state
  canResume?: boolean;
  agenticDecisions?: AgenticDecisionEvent[];
  healingEvents?: HealingEvent[];
  completedChapterScores?: ChapterScoreSnapshot[];
  bloomsDistribution?: BloomsDistribution;
  frameworks?: string[];
}

/** Snapshot of a chapter analysis result for real-time UI updates */
export interface ChapterScoreSnapshot {
  chapterNumber: number;
  chapterTitle: string;
  overallScore: number;
  issueCount: number;
  criticalCount: number;
  bloomsDistribution?: BloomsDistribution;
}

/** Agentic decision event for UI display */
export interface AgenticDecisionEvent {
  action: string;
  chapterNumber: number;
  reason?: string;
}

/** Healing event for UI display */
export interface HealingEvent {
  chapterNumber: number;
  healedSections: string[];
  issuesAdded: number;
  scoreChange: number;
}
