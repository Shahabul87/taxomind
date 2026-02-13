/**
 * SAM Sequential Course Creation Types
 *
 * This module defines all types for the 3-stage course creation process:
 * Stage 1: Chapter Generation
 * Stage 2: Section Generation
 * Stage 3: Detail Generation
 */

// ============================================================================
// Bloom's Taxonomy Reference
// ============================================================================

export const BLOOMS_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;
export type BloomsLevel = (typeof BLOOMS_LEVELS)[number];

export const BLOOMS_TAXONOMY: Record<BloomsLevel, {
  level: number;
  verbs: string[];
  description: string;
  cognitiveProcess: string;
}> = {
  REMEMBER: {
    level: 1,
    verbs: ['Define', 'List', 'Recall', 'Identify', 'Name', 'State', 'Recognize', 'Describe', 'Retrieve', 'Label'],
    description: 'Retrieving relevant knowledge from long-term memory',
    cognitiveProcess: 'Recognition, recall of facts and basic concepts',
  },
  UNDERSTAND: {
    level: 2,
    verbs: ['Explain', 'Summarize', 'Interpret', 'Classify', 'Compare', 'Discuss', 'Distinguish', 'Illustrate', 'Paraphrase', 'Predict'],
    description: 'Constructing meaning from instructional messages',
    cognitiveProcess: 'Interpreting, exemplifying, classifying, summarizing',
  },
  APPLY: {
    level: 3,
    verbs: ['Apply', 'Demonstrate', 'Implement', 'Execute', 'Use', 'Solve', 'Practice', 'Calculate', 'Operate', 'Show'],
    description: 'Carrying out or using a procedure in a given situation',
    cognitiveProcess: 'Executing, implementing procedures to solve problems',
  },
  ANALYZE: {
    level: 4,
    verbs: ['Analyze', 'Differentiate', 'Organize', 'Examine', 'Investigate', 'Categorize', 'Deconstruct', 'Contrast', 'Diagram', 'Outline'],
    description: 'Breaking material into parts and determining relationships',
    cognitiveProcess: 'Differentiating, organizing, attributing causes',
  },
  EVALUATE: {
    level: 5,
    verbs: ['Evaluate', 'Judge', 'Assess', 'Critique', 'Justify', 'Recommend', 'Validate', 'Prioritize', 'Defend', 'Argue'],
    description: 'Making judgments based on criteria and standards',
    cognitiveProcess: 'Checking, critiquing based on standards',
  },
  CREATE: {
    level: 6,
    verbs: ['Create', 'Design', 'Develop', 'Construct', 'Produce', 'Formulate', 'Compose', 'Generate', 'Invent', 'Build'],
    description: 'Putting elements together to form a coherent whole',
    cognitiveProcess: 'Generating, planning, producing original work',
  },
};

// ============================================================================
// Content Types
// ============================================================================

export const CONTENT_TYPES = ['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

// ============================================================================
// Stage 1: Course Context (Input to Chapter Generation)
// ============================================================================

export interface CourseContext {
  // Core course information (from wizard)
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  courseSubcategory?: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  courseLearningObjectives: string[];

  // Structure preferences
  totalChapters: number;
  sectionsPerChapter: number;
  bloomsFocus: BloomsLevel[];

  // Quality settings
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;

  // Optional
  courseIntent?: string;
  includeAssessments?: boolean;
  preferredContentTypes?: ContentType[];
}

// ============================================================================
// Stage 1: Chapter Generation
// ============================================================================

export interface Stage1Input {
  courseContext: CourseContext;
  currentChapterNumber: number;
  previousChapters: GeneratedChapter[];
}

export interface GeneratedChapter {
  position: number;
  title: string;
  description: string;
  bloomsLevel: BloomsLevel;
  learningObjectives: string[];
  keyTopics: string[];
  prerequisites: string;
  estimatedTime: string;
  topicsToExpand: string[]; // Topics that become sections in Stage 2
  conceptsIntroduced?: string[]; // 3-7 new concepts this chapter introduces
}

export interface Stage1Output {
  chapter: GeneratedChapter;
  thinking: string; // SAM's reasoning for transparency
  qualityScore: number;
}

// ============================================================================
// Stage 2: Section Generation
// ============================================================================

export interface Stage2Input {
  courseContext: CourseContext;
  allChapters: GeneratedChapter[];
  currentChapter: GeneratedChapter & { id: string };
  currentSectionNumber: number;
  previousSections: GeneratedSection[];
  allExistingSectionTitles: string[]; // For uniqueness check
}

export interface GeneratedSection {
  position: number;
  title: string;
  contentType: ContentType;
  estimatedDuration: string;
  topicFocus: string; // Specific topic from chapter
  parentChapterContext: {
    title: string;
    bloomsLevel: BloomsLevel;
    relevantObjectives: string[];
  };
  conceptsIntroduced?: string[]; // New concepts this section introduces
  conceptsReferenced?: string[]; // Existing concepts this section builds on
}

export interface Stage2Output {
  section: GeneratedSection;
  thinking: string;
  qualityScore: number;
  uniquenessValidated: boolean;
}

// ============================================================================
// Stage 3: Detail Generation
// ============================================================================

export interface Stage3Input {
  courseContext: CourseContext;
  chapter: GeneratedChapter & { id: string };
  chapterSections: GeneratedSection[];
  currentSection: GeneratedSection & { id: string };
}

export interface SectionDetails {
  description: string;
  learningObjectives: string[];
  keyConceptsCovered: string[];
  practicalActivity: string;
  resources?: string[];
}

export interface Stage3Output {
  details: SectionDetails;
  thinking: string;
  qualityScore: number;
}

// ============================================================================
// Creation State Machine
// ============================================================================

export type CreationStage = 1 | 2 | 3;
export type CreationPhase =
  | 'idle'
  | 'creating_course'
  | 'generating_chapter'
  | 'saving_chapter'
  | 'generating_section'
  | 'saving_section'
  | 'generating_details'
  | 'saving_details'
  | 'complete'
  | 'error';

export interface CreationState {
  stage: CreationStage;
  phase: CreationPhase;
  currentChapter: number;
  totalChapters: number;
  currentSection: number;
  totalSections: number;
  error?: string;
}

export interface CreationProgress {
  state: CreationState;
  percentage: number;
  message: string;
  currentItem?: string;
  thinking?: string;
  completedItems: {
    chapters: { position: number; title: string; id?: string; qualityScore?: number }[];
    sections: { chapterPosition: number; position: number; title: string; id?: string; qualityScore?: number }[];
  };
  /** SAM Goal ID for this creation session */
  goalId?: string;
  /** Timing data for ETA display */
  timing?: {
    elapsedMs: number;
    estimatedRemainingMs: number | null;
    averageItemMs: number | null;
    itemsCompleted: number;
    totalItems: number;
  };
}

// ============================================================================
// SSE Event Types
// ============================================================================

export type SSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'item_generating'
  | 'item_saving'
  | 'item_complete'
  | 'thinking'
  | 'thinking_chunk'
  | 'progress'
  | 'error'
  | 'complete';

export interface SSEEvent {
  type: SSEEventType;
  timestamp: string;
  data: {
    stage?: CreationStage;
    chapter?: number;
    section?: number;
    title?: string;
    message?: string;
    thinking?: string;
    percentage?: number;
    error?: string;
    result?: unknown;
  };
}

// ============================================================================
// Quality Validation
// ============================================================================

export interface QualityScore {
  uniqueness: number;      // 0-100: How unique across course
  specificity: number;     // 0-100: How specific (not generic)
  bloomsAlignment: number; // 0-100: Proper verb usage
  completeness: number;    // 0-100: Has all required fields
  depth: number;           // 0-100: Content depth beyond surface level
  overall: number;         // Weighted average
}

export interface ValidationResult {
  valid: boolean;
  score: QualityScore;
  issues: string[];
  suggestions: string[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface Stage1Request {
  courseContext: CourseContext;
  previousChapters?: GeneratedChapter[];
}

export interface Stage1Response {
  success: boolean;
  chapter?: GeneratedChapter;
  thinking?: string;
  qualityScore?: number;
  error?: string;
}

export interface Stage2Request {
  courseId: string;
  chapterId: string;
  courseContext: CourseContext;
  allChapters: GeneratedChapter[];
  currentChapter: GeneratedChapter;
  previousSections?: GeneratedSection[];
  allExistingSectionTitles?: string[];
}

export interface Stage2Response {
  success: boolean;
  section?: GeneratedSection;
  thinking?: string;
  qualityScore?: number;
  uniquenessValidated?: boolean;
  error?: string;
}

export interface Stage3Request {
  courseId: string;
  chapterId: string;
  sectionId: string;
  courseContext: CourseContext;
  chapter: GeneratedChapter;
  chapterSections: GeneratedSection[];
  currentSection: GeneratedSection;
}

export interface Stage3Response {
  success: boolean;
  details?: SectionDetails;
  thinking?: string;
  qualityScore?: number;
  error?: string;
}

// ============================================================================
// Orchestration Types
// ============================================================================

export interface SequentialCreationConfig {
  // Simplified config (can be used directly from form)
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalChapters: number;
  sectionsPerChapter: number;
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;
  courseGoals: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
  category?: string;
  subcategory?: string;

  // Optional callbacks
  onProgress?: (progress: CreationProgress) => void;
  onThinking?: (thinking: string) => void;
  onStageComplete?: (stage: CreationStage, items: unknown[]) => void;
  onError?: (error: string, canRetry: boolean) => void;
}

export interface SequentialCreationResult {
  success: boolean;
  courseId?: string;
  chaptersCreated?: number;
  sectionsCreated?: number;
  stats?: {
    totalChapters: number;
    totalSections: number;
    totalTime: number;
    averageQualityScore: number;
  };
  error?: string;
  /** SAM Goal ID for this creation session (Phase 3: goal tracking) */
  goalId?: string;
  /** SAM ExecutionPlan ID for this creation session (Phase 3: goal tracking) */
  planId?: string;
}

// ============================================================================
// Concept Tracking (Pipeline Context Enrichment)
// ============================================================================

/** Tracks a single concept introduced during course generation */
export interface ConceptEntry {
  concept: string;
  introducedInChapter: number;
  introducedInSection?: number;
  bloomsLevel: BloomsLevel;
}

/** Running inventory of concepts, vocabulary, and skills across the pipeline */
export interface ConceptTracker {
  concepts: Map<string, ConceptEntry>;
  vocabulary: string[];
  skillsBuilt: string[];
}

// ============================================================================
// Depth-First Pipeline: Completed Chapter/Section Types
// ============================================================================

/** A section with its Stage 3 details filled in */
export interface CompletedSection extends GeneratedSection {
  id: string;
  details?: SectionDetails;
}

/** A fully completed chapter — all sections generated and detailed */
export interface CompletedChapter extends GeneratedChapter {
  id: string;
  sections: CompletedSection[];
}

/** Rich context passed to Stage 2 and 3 prompt builders */
export interface EnrichedChapterContext {
  allChapters: GeneratedChapter[];
  conceptTracker: ConceptTracker;
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
}

/** Return type for prompt builders — splits system identity from user instructions */
export interface StagePrompt {
  systemPrompt: string;
  userPrompt: string;
}

/** Input for content-aware Bloom's level assignment */
export interface ContentAwareBloomsInput {
  chapterNumber: number;
  totalChapters: number;
  focusLevels: BloomsLevel[];
  difficulty: CourseContext['difficulty'];
  isFoundational: boolean;
  isCapstone: boolean;
  previousBloomsLevels: BloomsLevel[];
}

// ============================================================================
// Checkpoint / Resume Types
// ============================================================================

/** Serializable checkpoint data saved after each completed chapter/section */
export interface CheckpointData {
  /** Serialized ConceptTracker.concepts as array (Map not JSON-serializable) */
  conceptEntries: Array<[string, ConceptEntry]>;
  vocabulary: string[];
  skillsBuilt: string[];
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
  allSectionTitles: string[];
  completedChapterCount: number;
  config: Omit<SequentialCreationConfig, 'onProgress' | 'onThinking' | 'onStageComplete' | 'onError'>;
  qualityScores: QualityScore[];
  goalId: string;
  planId: string;
  stepIds: string[];
  savedAt: string;

  // === Mid-chapter recovery fields ===
  /** The last completed stage within the current chapter (1=chapter, 2=sections, 3=details) */
  lastCompletedStage?: 1 | 2 | 3;
  /** For stage 2/3: index of the last completed section (0-based) within the partial chapter */
  lastCompletedSectionIndex?: number;
  /** Chapter number being worked on when checkpoint was saved (1-based) */
  currentChapterNumber?: number;

  // === UI-visible progress fields (Phase 3: Progress Persistence) ===
  /** Course ID for cross-device resume */
  courseId?: string;
  /** Total chapters configured */
  totalChapters?: number;
  /** Completion percentage (0-100) */
  percentage?: number;
  /** Completed chapters with metadata for resume banner */
  completedChapters?: Array<{ position: number; title: string; id: string; qualityScore?: number }>;
  /** Completed sections with metadata */
  completedSections?: Array<{ chapterPosition: number; position: number; title: string; id: string; qualityScore?: number }>;
  /** Current pipeline status */
  status?: 'in_progress' | 'paused' | 'error' | 'completed';
  /** Last error message if status is 'error' */
  errorMessage?: string;
  /** Failure reason (preserved from failCourseCreation — merged, not overwritten) */
  failureReason?: string;
  /** Timestamp when failure occurred */
  failedAt?: string;
}

/**
 * State threaded into the pipeline for resuming a failed course creation.
 * Built by resumeCourseCreation() from checkpoint + DB data.
 */
export interface ResumeState {
  /** Existing course ID to continue (skip db.course.create) */
  courseId: string;
  /** Existing SAM Goal ID */
  goalId: string;
  /** Existing SAM Plan ID */
  planId: string;
  /** Existing SAM step IDs */
  stepIds: string[];
  /** Chapters already fully completed (all 3 stages done) */
  completedChapters: CompletedChapter[];
  /** Reconstructed concept tracker from checkpoint */
  conceptTracker: ConceptTracker;
  /** Bloom's progression from completed chapters */
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
  /** All section titles generated so far (for uniqueness) */
  allSectionTitles: string[];
  /** Quality scores from completed work */
  qualityScores: QualityScore[];
  /** Number of fully completed chapters (start loop from this + 1) */
  completedChapterCount: number;
  /** Section IDs in the partial chapter that already have descriptions (skip Stage 3 for these) */
  sectionsWithDetails: Set<string>;
  /** DB chapter IDs that exist for the partial chapter (skip Stage 1+2 if present) */
  partialChapterDbId?: string;
  /** DB section records for the partial chapter (skip Stage 2 if all present) */
  partialChapterSectionIds?: string[];
}
