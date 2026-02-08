/**
 * Course Depth Analysis V2 - Type Definitions
 *
 * Comprehensive types for the enhanced AI-powered course analysis system.
 */

// =============================================================================
// ENUMS (matching Prisma schema)
// =============================================================================

export type DepthAnalysisStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'NEEDS_REANALYSIS';

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

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
  | 'GAP';

export type IssueStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'SKIPPED'
  | 'WONT_FIX';

export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export type FixAction =
  | 'add'
  | 'modify'
  | 'remove'
  | 'reorder'
  | 'split'
  | 'merge';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CourseInput {
  id: string;
  title: string;
  description: string | null;
  courseGoals: string | null;
  whatYouWillLearn: string[];
  prerequisites: string | null;
  difficulty: string | null;
  chapters: ChapterInput[];
}

export interface ChapterInput {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  sections: SectionInput[];
}

export interface SectionInput {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  position: number;
  isPublished: boolean;
  videoUrl: string | null;
  objectives: string[];
  exams: ExamInput[];
}

export interface ExamInput {
  id: string;
  title: string;
  questions: QuestionInput[];
}

export interface QuestionInput {
  id: string;
  question: string;
  type: string;
  bloomsLevel?: BloomsLevel;
  options?: unknown;
  correctAnswer?: unknown;
}

// =============================================================================
// ANALYSIS RESULT TYPES
// =============================================================================

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface StructureAnalysisResult {
  totalChapters: number;
  totalSections: number;
  totalAssessments: number;
  emptyChapters: Array<{ id: string; title: string }>;
  emptySections: Array<{
    id: string;
    title: string;
    chapterId: string;
    chapterTitle: string;
  }>;
  unpublishedChapters: Array<{ id: string; title: string }>;
  unpublishedSections: Array<{
    id: string;
    title: string;
    chapterId: string;
  }>;
  averageSectionsPerChapter: number;
  contentDepth: {
    hasObjectives: number;
    hasContent: number;
    hasVideo: number;
    hasAssessment: number;
  };
}

export interface SectionBloomsResult {
  sectionId: string;
  sectionTitle: string;
  chapterId: string;
  chapterTitle: string;
  position: number;
  primaryLevel: BloomsLevel;
  distribution: BloomsDistribution;
  confidence: number;
  evidence: string[];
}

export interface ChapterBloomsResult {
  chapterId: string;
  chapterTitle: string;
  position: number;
  primaryLevel: BloomsLevel;
  distribution: BloomsDistribution;
  sectionResults: SectionBloomsResult[];
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
}

export interface BloomsAnalysisResult {
  courseDistribution: BloomsDistribution;
  courseBalance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  chapters: ChapterBloomsResult[];
  cognitiveDepthScore: number;
}

export interface FlowAnalysisResult {
  overallFlowScore: number;
  progressionIssues: Array<{
    fromChapter: { id: string; title: string; position: number };
    toChapter: { id: string; title: string; position: number };
    issue: string;
    severity: IssueSeverity;
    suggestion: string;
  }>;
  cognitiveJumps: Array<{
    location: {
      chapterId: string;
      chapterTitle: string;
      sectionId?: string;
      sectionTitle?: string;
    };
    fromLevel: BloomsLevel;
    toLevel: BloomsLevel;
    gap: number;
    description: string;
  }>;
  prerequisiteMap: Array<{
    conceptId: string;
    concept: string;
    introducedIn: { chapterId: string; sectionId?: string };
    usedIn: Array<{ chapterId: string; sectionId?: string }>;
    isMissing: boolean;
  }>;
}

export interface ConsistencyAnalysisResult {
  overallConsistencyScore: number;
  chapterGoalAlignment: Array<{
    chapterId: string;
    chapterTitle: string;
    alignmentScore: number;
    alignedGoals: string[];
    unalignedGoals: string[];
    suggestions: string[];
  }>;
  sectionConsistency: Array<{
    chapterId: string;
    chapterTitle: string;
    consistencyScore: number;
    depthVariation: number;
    issues: string[];
  }>;
  crossChapterConsistency: {
    styleConsistencyScore: number;
    depthConsistencyScore: number;
    lengthConsistencyScore: number;
    issues: string[];
  };
}

export interface DuplicateContent {
  id: string;
  sourceA: {
    chapterId: string;
    chapterTitle: string;
    sectionId?: string;
    sectionTitle?: string;
    content: string;
  };
  sourceB: {
    chapterId: string;
    chapterTitle: string;
    sectionId?: string;
    sectionTitle?: string;
    content: string;
  };
  similarityScore: number;
  overlappingConcepts: string[];
  recommendation: 'KEEP_A' | 'KEEP_B' | 'MERGE' | 'KEEP_BOTH';
  recommendationReason: string;
}

export interface ThinSection {
  sectionId: string;
  sectionTitle: string;
  chapterId: string;
  chapterTitle: string;
  currentWordCount: number;
  recommendedWordCount: number;
  missingElements: string[];
  suggestion: string;
}

export interface ContentAnalysisResult {
  qualityScore: number;
  duplicates: DuplicateContent[];
  thinSections: ThinSection[];
  contentGaps: Array<{
    topic: string;
    expectedIn: string;
    description: string;
    suggestedContent: string;
  }>;
}

export interface LearningOutcome {
  category: 'knowledge' | 'skill' | 'competency';
  title: string;
  description: string;
  bloomsLevel: BloomsLevel;
  confidence: number;
}

export interface OutcomesAnalysisResult {
  learningOutcomes: LearningOutcome[];
  skillsGained: Array<{
    skill: string;
    proficiencyLevel: 'awareness' | 'foundational' | 'intermediate' | 'advanced';
    developedIn: string[];
  }>;
  knowledgeGaps: Array<{
    gap: string;
    impact: string;
    suggestion: string;
  }>;
  careerAlignment: string[];
}

// =============================================================================
// ISSUE TYPES
// =============================================================================

export interface AnalysisIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;

  // Location
  location: {
    chapterId?: string;
    chapterTitle?: string;
    chapterPosition?: number;
    sectionId?: string;
    sectionTitle?: string;
    sectionPosition?: number;
    contentType?: 'title' | 'description' | 'objective' | 'content' | 'assessment';
  };

  // Problem
  title: string;
  description: string;
  evidence: string[];

  // Impact
  impact: {
    area: string;
    description: string;
  };

  // Fix
  fix: {
    action: FixAction;
    what: string;
    why: string;
    how: string;
    suggestedContent?: string;
    examples?: string[];
  };

  // Metadata
  relatedIssueIds?: string[];
}

// =============================================================================
// FINAL ANALYSIS RESULT
// =============================================================================

export interface CourseDepthAnalysisV2Result {
  // Metadata
  courseId: string;
  version: number;
  status: DepthAnalysisStatus;
  analysisMethod: 'ai' | 'rule-based' | 'hybrid';
  contentHash: string;

  // Scores
  overallScore: number;
  depthScore: number;
  consistencyScore: number;
  flowScore: number;
  qualityScore: number;

  // Bloom's Analysis
  bloomsDistribution: BloomsDistribution;
  bloomsBalance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  // Detailed Results
  structureAnalysis: StructureAnalysisResult;
  bloomsAnalysis: BloomsAnalysisResult;
  flowAnalysis: FlowAnalysisResult;
  consistencyAnalysis: ConsistencyAnalysisResult;
  contentAnalysis: ContentAnalysisResult;
  outcomesAnalysis: OutcomesAnalysisResult;

  // Issues
  issues: AnalysisIssue[];
  issueCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };

  // Chapter-level summary
  chapterAnalysis: Array<{
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
    primaryBloomsLevel: BloomsLevel;
  }>;

  // Comparison (if re-analysis)
  comparison?: {
    previousVersionId: string;
    scoreImprovement: number;
    issuesResolved: number;
    newIssues: number;
  };

  // Timestamps
  analyzedAt: Date;
}

// =============================================================================
// PROGRESS CALLBACK
// =============================================================================

export interface AnalysisProgress {
  step: number;
  totalSteps: number;
  stepName: string;
  message: string;
  percentComplete: number;
  currentResult?: unknown;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

// =============================================================================
// ANALYZER OPTIONS
// =============================================================================

export interface AnalyzerOptions {
  courseId: string;
  course: CourseInput;
  onProgress?: ProgressCallback;
  previousAnalysisId?: string;
  aiEnabled?: boolean;
}
