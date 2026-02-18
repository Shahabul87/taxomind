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
// Chapter DNA Template Types
// ============================================================================

export type TemplateSectionRole =
  | 'HOOK' | 'INTUITION' | 'FORMALIZATION' | 'WALKTHROUGH' | 'VISUALIZATION'
  | 'PITFALLS' | 'PRACTICE' | 'CONNECTION' | 'SUMMARY' | 'CHECKPOINT'
  | 'PLAYGROUND' | 'PROVOCATION' | 'INTUITION_ENGINE' | 'DERIVATION'
  | 'LABORATORY' | 'DEPTH_DIVE' | 'SYNTHESIS' | 'OPEN_QUESTION'
  | 'FIRST_PRINCIPLES' | 'ANALYSIS' | 'DESIGN_STUDIO' | 'FRONTIER';

/** Composed prompt blocks for template injection into Stage 1/2/3 prompts */
export interface ComposedTemplatePrompt {
  stage1Block: string;
  stage2Block: string;
  stage3Block: string;
  totalSections: number;
}

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
  duration?: string;
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
  templateRole?: TemplateSectionRole; // Chapter DNA role this section fills
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
  creatorGuidelines: string;
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
  | 'resuming'
  | 'paused'
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
  /** Quality flags from agentic flag_for_review decisions */
  qualityFlags?: CourseQualityFlag[];
  /** Server-side completed item count (accurate, incremented by orchestrator) */
  serverCompletedItems?: number;
  /** Server-side total item count */
  serverTotalItems?: number;
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
  | 'complete'
  // Agentic events (Phase 2+)
  | 'state_change'
  | 'agentic_decision'
  | 'quality_flag'
  | 'prompt_budget_alert'
  | 'semantic_duplicate_detected'
  | 'replan_start'
  | 'replan_complete'
  | 'pipeline_paused'
  // Healing events (Phase 3)
  | 'healing_start'
  | 'healing_chapter'
  | 'healing_complete'
  // Inline healing events (agentic pipeline)
  | 'inline_healing'
  | 'inline_healing_complete'
  // Bridge content events
  | 'bridge_content'
  // Agentic gap closure events
  | 'chapter_count_adjusted'    // Blueprint recommended different chapter count
  | 'chapter_skipped'           // AI decided to skip a redundant chapter
  | 'healing_diagnosis'         // AI diagnosis before healing
  | 'ai_reflection';            // AI-enhanced reflection results

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
  blueprintAlignment?: number; // 0-100: How well chapter matches blueprint entry (Stage 1 only)
  overall: number;         // Weighted average
  /** Which chapter this score belongs to (for precise grouping in reflector) */
  chapterNumber?: number;
  /** Which pipeline stage produced this score: 1=chapter, 2=section, 3=details */
  stage?: 1 | 2 | 3;
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

  // Optional wizard fields
  courseIntent?: string;
  includeAssessments?: boolean;
  duration?: string;

  // Optional callbacks
  onProgress?: (progress: CreationProgress) => void;
  onThinking?: (thinking: string) => void;
  onStageComplete?: (stage: CreationStage, items: unknown[]) => void;
  onError?: (error: string, canRetry: boolean) => void;

  /** Enable human escalation gate — pauses pipeline on quality flags for approval */
  enableEscalationGate?: boolean;

  /**
   * Fallback handling policy:
   * - haltRateThreshold: stop pipeline when fallback usage rate exceeds this value
   * - haltOnExcessiveFallbacks: disable hard stop (not recommended) for diagnostic runs
   */
  fallbackPolicy?: {
    haltRateThreshold?: number;
    haltOnExcessiveFallbacks?: boolean;
  };
}

// ============================================================================
// Human Escalation Gate Types
// ============================================================================

/** Decision options for human escalation gate */
export type EscalationDecision = 'approve_continue' | 'approve_heal' | 'reject_abort';

/** Pipeline pause request emitted when escalation gate triggers */
export interface PipelinePauseRequest {
  courseId: string;
  chapterPosition: number;
  chapterTitle: string;
  reason: string;
  severity: 'high' | 'critical';
  qualityScore: number;
  timestamp: string;
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
  fallbackSummary?: {
    count: number;
    rate: number;
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
  budgetTelemetry?: {
    stage: 1 | 2 | 3;
    truncated: boolean;
    droppedHighPrioritySections: string[];
    truncatedSections: string[];
    originalTokens: number;
    finalTokens: number;
  };
}

// ============================================================================
// Agentic Planning Types
// ============================================================================

/** AI-generated course blueprint created before generation starts */
export interface CourseBlueprintPlan {
  /** Optimal chapter sequence with reasoning */
  chapterPlan: ChapterPlanEntry[];
  /** Expected concept dependency graph */
  conceptDependencies: Array<{ concept: string; dependsOn: string[] }>;
  /** Bloom's progression strategy */
  bloomsStrategy: Array<{ level: BloomsLevel; chapters: number[] }>;
  /** Risk areas identified by the planner */
  riskAreas: string[];
  /** Overall confidence in this plan (0-100) */
  planConfidence: number;
  /** AI-recommended chapter count (may differ from user's totalChapters by ±2) */
  recommendedChapterCount?: number;
}

export interface ChapterPlanEntry {
  position: number;
  suggestedTitle: string;
  primaryFocus: string;
  bloomsLevel: BloomsLevel;
  keyConcepts: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  rationale: string;
  /** AI-recommended section count for this chapter (optional, bounded 5-10) */
  recommendedSections?: number;
}

// ============================================================================
// Agentic Decision Types
// ============================================================================

/** Actions the agentic decision engine can recommend */
export type AgenticAction =
  | 'continue'
  | 'adjust_strategy'
  | 'flag_for_review'
  | 'regenerate_chapter'     // Trigger immediate regeneration
  | 'inject_bridge_content'  // Add scaffolding between chapters
  | 'replan_remaining'       // Revise blueprint for remaining chapters
  | 'skip_next_chapter';     // Skip redundant chapter (max 1 per course)

/** Decision made after each chapter completes */
export interface AgenticDecision {
  action: AgenticAction;
  reasoning: string;
  adjustments?: {
    temperatureShift?: number;
    additionalGuidance?: string;
    conceptsToEmphasize?: string[];
  };
  /** Structured payload for actionable decisions (Phase 2: Actionable Agentic Decisions) */
  actionPayload?: {
    targetChapter?: number;
    strategyOverrides?: Partial<import('./adaptive-strategy').GenerationStrategy>;
    conceptGaps?: string[];
    bloomsCorrection?: BloomsLevel;
    /** Bridge content for inject_bridge_content action */
    bridgeContent?: string;
  };
}

/** Quality flag persisted to the Course record when flag_for_review fires */
export interface CourseQualityFlag {
  chapterPosition: number;
  chapterTitle: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  action: 'auto_healed' | 'pending_review';
  healingStrategy?: string;
  timestamp: string;
}

/** AI-driven decision response from LLM reasoning */
export interface AIDecisionResponse {
  action: AgenticAction;
  reasoning: string;
  confidence: number;
  conceptGaps?: string[];
  bridgeContentSuggestion?: string;
  strategyAdjustments?: {
    temperatureShift?: number;
    additionalGuidance?: string;
    conceptsToEmphasize?: string[];
  };
}

/** Quality trend analysis for decision-making */
export interface QualityTrend {
  trend: 'improving' | 'stable' | 'declining';
  recentAverage: number;
  overallAverage: number;
  consecutiveLow: number;
  consecutiveHigh: number;
}

// ============================================================================
// State Machine Integration Types (Phase 1: Agentic Foundation)
// ============================================================================

/** Context passed to generateSingleChapter() for state machine step execution */
export interface ChapterStepContext {
  chapterNumber: number;
  courseId: string;
  courseContext: CourseContext;
  conceptTracker: ConceptTracker;
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
  allSectionTitles: string[];
  qualityScores: QualityScore[];
  completedChapters: CompletedChapter[];
  generatedChapters: (GeneratedChapter & { id: string })[];
  blueprintPlan: CourseBlueprintPlan | null;
  lastAgenticDecision: AgenticDecision | null;
  recalledMemory: import('./memory-recall').RecalledMemory | null;
  strategyMonitor: import('./adaptive-strategy').AdaptiveStrategyMonitor;
  chapterTemplate: import('./chapter-templates').ChapterTemplate;
  categoryPrompt: import('./category-prompts').ComposedCategoryPrompt;
  /** Raw enhancer for per-chapter Bloom's-filtered composition */
  categoryEnhancer?: import('./category-prompts').CategoryPromptEnhancer;
  experimentVariant?: string;
  /** Bridge content to scaffold concept gaps from prior chapter */
  bridgeContent?: string;
  /** Correlation ID for end-to-end tracing across AI calls */
  runId?: string;
  /** Optional runtime cost budget tracker */
  budgetTracker?: import('./pipeline-budget').PipelineBudgetTracker;
  /** Tracks fallback usage — halts pipeline when rate exceeds threshold */
  fallbackTracker?: import('./response-parsers').FallbackTracker;
}

/** Result of generating a single chapter (all 3 stages) */
export interface ChapterStepResult {
  completedChapter: CompletedChapter;
  qualityScores: QualityScore[];
  agenticDecision: AgenticDecision | null;
  chaptersCreated: number;
  sectionsCreated: number;
}

// ============================================================================
// Healing Loop Types (Phase 3: Autonomous Healing)
// ============================================================================

/** Configuration for the autonomous healing loop */
export interface HealingLoopConfig {
  userId: string;
  courseId: string;
  /** Maximum healing iterations (default: 2, capped to prevent infinite loops) */
  maxHealingIterations: number;
  /** Minimum coherence score — skip healing if above (default: 70) */
  minCoherenceScore: number;
  /** Severity threshold for selecting chapters to heal (default: 'high') */
  severityThreshold: 'high' | 'medium' | 'low';
}

/** Result of the autonomous healing loop */
export interface HealingResult {
  healed: boolean;
  iterationsRun: number;
  chaptersRegenerated: number[];
  finalCoherenceScore: number;
  improvementDelta: number;
  /** Chapters that exhausted all healing attempts without meeting quality threshold */
  healingExhaustedChapters?: number[];
}

// ============================================================================
// Pipeline Error Codes
// ============================================================================

/** Canonical error codes for SSE `type: 'error'` events */
export const PipelineErrorCode = {
  CHAPTER_GENERATION_FAILED: 'CHAPTER_GENERATION_FAILED',
  CHAPTER_TIMEOUT: 'CHAPTER_TIMEOUT',
  FALLBACK_RATE_EXCEEDED: 'FALLBACK_RATE_EXCEEDED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  HEALING_EXHAUSTED: 'HEALING_EXHAUSTED',
  PIPELINE_PAUSED: 'PIPELINE_PAUSED',
  RESUME_FAILED: 'RESUME_FAILED',
  ORCHESTRATOR_ERROR: 'ORCHESTRATOR_ERROR',
  ABORT_SIGNAL: 'ABORT_SIGNAL',
} as const;

export type PipelineErrorCode = (typeof PipelineErrorCode)[keyof typeof PipelineErrorCode];

/** Typed payload for SSE error events */
export interface PipelineSSEError {
  code: PipelineErrorCode;
  message: string;
  chapter?: number;
  courseId?: string;
  chaptersCreated?: number;
  sectionsCreated?: number;
  canRetry?: boolean;
  fallbackSummary?: { count: number; rate: number };
}

// ============================================================================
// Course Reflection Types
// ============================================================================

/** Result of post-generation course-level reflection */
export interface CourseReflection {
  /** Overall coherence score (0-100) */
  coherenceScore: number;
  /** Bloom's progression analysis */
  bloomsProgression: {
    isMonotonic: boolean;
    gaps: Array<{ fromChapter: number; toChapter: number; issue: string }>;
  };
  /** Concept coverage analysis */
  conceptCoverage: {
    totalConcepts: number;
    coveredByMultipleChapters: number;
    orphanedConcepts: string[];
    missingPrerequisites: string[];
  };
  /** Chapters flagged for potential improvement */
  flaggedChapters: Array<{ position: number; reason: string; severity: 'low' | 'medium' | 'high' }>;
  /** Summary for the user */
  summary: string;
}

// ============================================================================
// Content-Aware Bloom's Input
// ============================================================================

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

  /** Per-chapter section counts — actual sections generated per completed chapter (1-indexed by position) */
  chapterSectionCounts?: number[];

  /** Adaptive strategy performance history for resume seeding */
  strategyHistory?: import('./adaptive-strategy').GenerationPerformance[];

  /** Full adaptive strategy state (temperature/token adjustments) for precise resume */
  strategyState?: import('./adaptive-strategy').AdaptiveStrategyState;

  /** Prompt template version used during generation */
  promptVersion?: string;

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
  /** Optional approval window deadline for resume flows (ISO string) */
  resumeDeadline?: string;
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
  /** Per-chapter section counts — actual sections generated per completed chapter */
  chapterSectionCounts: number[];
  /** Section IDs in the partial chapter that already have descriptions (skip Stage 3 for these) */
  sectionsWithDetails: Set<string>;
  /** Adaptive strategy history from checkpoint for seeding the monitor on resume */
  strategyHistory?: import('./adaptive-strategy').GenerationPerformance[];
  /** Full adaptive strategy state (temperature/token adjustments) for precise resume */
  strategyState?: import('./adaptive-strategy').AdaptiveStrategyState;
  /** Prompt template version from checkpoint for observability continuity */
  promptVersion?: string;
  /** DB chapter IDs that exist for the partial chapter (skip Stage 1+2 if present) */
  partialChapterDbId?: string;
  /** DB section records for the partial chapter (skip Stage 2 if all present) */
  partialChapterSectionIds?: string[];
}

// ============================================================================
// AI-Guided Healing Types
// ============================================================================

/** Healing strategy types for targeted regeneration */
export type HealingStrategyType =
  | 'full_regeneration'     // Current behavior — regenerate all 3 stages
  | 'sections_only'         // Keep chapter metadata, regenerate sections (Stage 2+3)
  | 'details_only'          // Keep chapter + section structure, regenerate details (Stage 3)
  | 'targeted_sections'     // Regenerate specific sections by position
  | 'skip_healing';         // AI determines chapter is actually fine (false positive)

// ============================================================================
// Pipeline Budget Types
// ============================================================================

/** Snapshot of pipeline token/cost budget state */
export interface PipelineRunBudget {
  maxCostUSD: number;
  maxTotalTokens: number;
  accumulatedCostUSD: number;
  accumulatedTokens: number;
  callCount: number;
  exceeded: boolean;
}

/** AI-diagnosed healing strategy for a flagged chapter */
export interface HealingStrategy {
  type: HealingStrategyType;
  reasoning: string;
  /** Section positions to regenerate (for 'targeted_sections' type) */
  targetSections?: number[];
  /** Extra prompt guidance for the regeneration AI call */
  guidanceForRegeneration?: string;
}
