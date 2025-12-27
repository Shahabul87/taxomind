/**
 * Memory Integration Types
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Types for evaluation outcomes to update student profiles
 */

// ============================================================================
// BLOOM'S LEVEL TYPE (defined locally to avoid circular deps)
// ============================================================================

/**
 * Bloom's Taxonomy cognitive level
 */
export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

// ============================================================================
// MASTERY TYPES
// ============================================================================

/**
 * Mastery level for a specific topic/concept
 */
export type MasteryLevel =
  | 'novice'
  | 'beginner'
  | 'intermediate'
  | 'proficient'
  | 'expert';

/**
 * Mastery record for a topic
 */
export interface TopicMastery {
  /**
   * Topic identifier
   */
  topicId: string;

  /**
   * Current mastery level
   */
  level: MasteryLevel;

  /**
   * Numerical mastery score (0-100)
   */
  score: number;

  /**
   * Bloom's taxonomy level achieved
   */
  bloomsLevel: BloomsLevel;

  /**
   * Number of assessments taken
   */
  assessmentCount: number;

  /**
   * Average score across assessments
   */
  averageScore: number;

  /**
   * Last assessment date
   */
  lastAssessedAt: Date;

  /**
   * Trend direction
   */
  trend: 'improving' | 'stable' | 'declining';

  /**
   * Confidence in mastery estimate (0-1)
   */
  confidence: number;
}

/**
 * Mastery update from an evaluation
 */
export interface MasteryUpdate {
  /**
   * Topic identifier
   */
  topicId: string;

  /**
   * Bloom's level demonstrated
   */
  bloomsLevel: BloomsLevel;

  /**
   * Score achieved
   */
  score: number;

  /**
   * Maximum possible score
   */
  maxScore: number;

  /**
   * Timestamp of evaluation
   */
  timestamp: Date;

  /**
   * Context of the evaluation
   */
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    assessmentType?: string;
  };
}

// ============================================================================
// LEARNING PATHWAY TYPES
// ============================================================================

/**
 * Learning pathway step
 */
export interface PathwayStep {
  /**
   * Step identifier
   */
  id: string;

  /**
   * Topic to learn
   */
  topicId: string;

  /**
   * Target Bloom's level
   */
  targetBloomsLevel: BloomsLevel;

  /**
   * Step order in pathway
   */
  order: number;

  /**
   * Status of completion
   */
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';

  /**
   * Prerequisites (other step IDs)
   */
  prerequisites: string[];

  /**
   * Estimated duration in minutes
   */
  estimatedDuration: number;

  /**
   * Actual duration spent (if completed)
   */
  actualDuration?: number;

  /**
   * Mastery achieved (if completed)
   */
  masteryAchieved?: MasteryLevel;
}

/**
 * Complete learning pathway
 */
export interface LearningPathway {
  /**
   * Pathway identifier
   */
  id: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Course identifier (if course-specific)
   */
  courseId?: string;

  /**
   * Pathway steps
   */
  steps: PathwayStep[];

  /**
   * Current step index
   */
  currentStepIndex: number;

  /**
   * Overall progress (0-100)
   */
  progress: number;

  /**
   * Pathway creation date
   */
  createdAt: Date;

  /**
   * Last update date
   */
  updatedAt: Date;

  /**
   * Pathway status
   */
  status: 'active' | 'completed' | 'paused' | 'abandoned';
}

/**
 * Pathway adjustment based on evaluation
 */
export interface PathwayAdjustment {
  /**
   * Type of adjustment
   */
  type:
    | 'skip_ahead'
    | 'add_remediation'
    | 'reorder'
    | 'add_challenge'
    | 'no_change';

  /**
   * Reason for adjustment
   */
  reason: string;

  /**
   * Steps to add
   */
  stepsToAdd?: PathwayStep[];

  /**
   * Steps to remove (by ID)
   */
  stepsToRemove?: string[];

  /**
   * New step order (if reordering)
   */
  newOrder?: string[];

  /**
   * New current step index
   */
  newCurrentStepIndex?: number;
}

// ============================================================================
// SPACED REPETITION TYPES
// ============================================================================

/**
 * Review priority level
 */
export type ReviewPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Spaced repetition schedule entry
 */
export interface ReviewScheduleEntry {
  /**
   * Entry identifier
   */
  id: string;

  /**
   * Topic to review
   */
  topicId: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Scheduled review date
   */
  scheduledFor: Date;

  /**
   * Review priority
   */
  priority: ReviewPriority;

  /**
   * Current interval in days
   */
  intervalDays: number;

  /**
   * Number of successful reviews
   */
  successfulReviews: number;

  /**
   * Easiness factor (SM-2 algorithm)
   */
  easinessFactor: number;

  /**
   * Last review date
   */
  lastReviewedAt?: Date;

  /**
   * Last review score
   */
  lastReviewScore?: number;

  /**
   * Is overdue
   */
  isOverdue: boolean;

  /**
   * Entry status
   */
  status: 'pending' | 'completed' | 'skipped';
}

/**
 * Spaced repetition configuration
 */
export interface SpacedRepetitionConfig {
  /**
   * Initial interval in days for new topics
   */
  initialIntervalDays?: number;

  /**
   * Minimum easiness factor
   */
  minEasinessFactor?: number;

  /**
   * Maximum interval in days
   */
  maxIntervalDays?: number;

  /**
   * Score threshold for "good" review (0-100)
   */
  goodScoreThreshold?: number;

  /**
   * Score threshold for "easy" review (0-100)
   */
  easyScoreThreshold?: number;

  /**
   * Days before a review becomes urgent
   */
  urgentThresholdDays?: number;
}

/**
 * Default spaced repetition configuration
 */
export const DEFAULT_SPACED_REPETITION_CONFIG: Required<SpacedRepetitionConfig> =
  {
    initialIntervalDays: 1,
    minEasinessFactor: 1.3,
    maxIntervalDays: 365,
    goodScoreThreshold: 70,
    easyScoreThreshold: 90,
    urgentThresholdDays: 7,
  };

// ============================================================================
// STUDENT PROFILE TYPES
// ============================================================================

/**
 * Learning style preference
 */
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

/**
 * Cognitive preferences
 */
export interface CognitivePreferences {
  /**
   * Preferred learning styles (ranked)
   */
  learningStyles: LearningStyle[];

  /**
   * Preferred content length
   */
  contentLengthPreference: 'concise' | 'moderate' | 'detailed';

  /**
   * Pace preference
   */
  pacePreference: 'slow' | 'moderate' | 'fast';

  /**
   * Challenge preference
   */
  challengePreference: 'easy' | 'moderate' | 'challenging';

  /**
   * Prefers examples first vs theory first
   */
  examplesFirst: boolean;
}

/**
 * Student performance metrics
 */
export interface PerformanceMetrics {
  /**
   * Overall average score
   */
  overallAverageScore: number;

  /**
   * Total assessments completed
   */
  totalAssessments: number;

  /**
   * Assessments completed this week
   */
  weeklyAssessments: number;

  /**
   * Current streak (consecutive days active)
   */
  currentStreak: number;

  /**
   * Longest streak ever
   */
  longestStreak: number;

  /**
   * Topics mastered
   */
  topicsMastered: number;

  /**
   * Total study time in minutes
   */
  totalStudyTimeMinutes: number;

  /**
   * Average session duration in minutes
   */
  averageSessionDuration: number;

  /**
   * Completion rate (started vs completed)
   */
  completionRate: number;
}

/**
 * Complete student profile
 */
export interface StudentProfile {
  /**
   * Student identifier
   */
  id: string;

  /**
   * User ID reference
   */
  userId: string;

  /**
   * Mastery records by topic
   */
  masteryByTopic: Record<string, TopicMastery>;

  /**
   * Active learning pathways
   */
  activePathways: LearningPathway[];

  /**
   * Cognitive preferences
   */
  cognitivePreferences: CognitivePreferences;

  /**
   * Performance metrics
   */
  performanceMetrics: PerformanceMetrics;

  /**
   * Current Bloom's distribution across all topics
   */
  overallBloomsDistribution: Record<BloomsLevel, number>;

  /**
   * Knowledge gaps (topics needing attention)
   */
  knowledgeGaps: string[];

  /**
   * Strengths (topics with high mastery)
   */
  strengths: string[];

  /**
   * Profile creation date
   */
  createdAt: Date;

  /**
   * Last activity date
   */
  lastActiveAt: Date;

  /**
   * Profile last updated
   */
  updatedAt: Date;
}

// ============================================================================
// EVALUATION OUTCOME TYPES
// ============================================================================

/**
 * Evaluation result to be recorded
 */
export interface EvaluationOutcome {
  /**
   * Evaluation identifier
   */
  evaluationId: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Topic evaluated
   */
  topicId: string;

  /**
   * Course context
   */
  courseId?: string;

  /**
   * Chapter context
   */
  chapterId?: string;

  /**
   * Section context
   */
  sectionId?: string;

  /**
   * Score achieved (0-100)
   */
  score: number;

  /**
   * Maximum possible score
   */
  maxScore: number;

  /**
   * Bloom's level demonstrated
   */
  bloomsLevel: BloomsLevel;

  /**
   * Type of assessment
   */
  assessmentType: 'quiz' | 'exam' | 'assignment' | 'practice' | 'review';

  /**
   * Time spent in minutes
   */
  timeSpentMinutes: number;

  /**
   * Strengths identified
   */
  strengths: string[];

  /**
   * Areas for improvement
   */
  areasForImprovement: string[];

  /**
   * Feedback provided
   */
  feedback: string;

  /**
   * Evaluation timestamp
   */
  evaluatedAt: Date;
}

/**
 * Outcome recording result
 */
export interface OutcomeRecordingResult {
  /**
   * Whether recording was successful
   */
  success: boolean;

  /**
   * Updated mastery level
   */
  newMasteryLevel?: MasteryLevel;

  /**
   * Mastery change
   */
  masteryChange?: number;

  /**
   * Pathway adjustments made
   */
  pathwayAdjustments?: PathwayAdjustment[];

  /**
   * Spaced repetition updates
   */
  spacedRepetitionUpdates?: {
    topicId: string;
    nextReviewDate: Date;
    priority: ReviewPriority;
  }[];

  /**
   * Memory entries created
   */
  memoryEntriesCreated?: number;

  /**
   * Errors encountered
   */
  errors?: string[];
}

// ============================================================================
// MEMORY ENTRY TYPES
// ============================================================================

/**
 * Memory entry type
 */
export type MemoryEntryType =
  | 'EVALUATION_OUTCOME'
  | 'MASTERY_UPDATE'
  | 'PATHWAY_CHANGE'
  | 'LEARNING_MILESTONE'
  | 'STRUGGLE_POINT'
  | 'BREAKTHROUGH';

/**
 * Memory entry importance level
 */
export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Long-term memory entry
 */
export interface MemoryEntry {
  /**
   * Entry identifier
   */
  id: string;

  /**
   * Student identifier
   */
  studentId: string;

  /**
   * Entry type
   */
  type: MemoryEntryType;

  /**
   * Entry content
   */
  content: Record<string, unknown>;

  /**
   * Importance level
   */
  importance: ImportanceLevel;

  /**
   * Related topic IDs
   */
  relatedTopics: string[];

  /**
   * Tags for searchability
   */
  tags: string[];

  /**
   * Entry creation timestamp
   */
  createdAt: Date;

  /**
   * Last accessed timestamp
   */
  lastAccessedAt?: Date;

  /**
   * Access count
   */
  accessCount: number;

  /**
   * Time-to-live in days (undefined = permanent)
   */
  ttlDays?: number;
}

// ============================================================================
// STORE INTERFACES
// ============================================================================

/**
 * Student profile store interface
 */
export interface StudentProfileStore {
  /**
   * Get a student profile
   */
  get(studentId: string): Promise<StudentProfile | null>;

  /**
   * Create or update a student profile
   */
  save(profile: StudentProfile): Promise<void>;

  /**
   * Update mastery for a topic
   */
  updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;

  /**
   * Get mastery for a topic
   */
  getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;

  /**
   * Update learning pathway
   */
  updatePathway(
    studentId: string,
    pathwayId: string,
    adjustment: PathwayAdjustment
  ): Promise<LearningPathway>;

  /**
   * Get active pathways for a student
   */
  getActivePathways(studentId: string): Promise<LearningPathway[]>;

  /**
   * Update performance metrics
   */
  updateMetrics(
    studentId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<PerformanceMetrics>;

  /**
   * Get knowledge gaps
   */
  getKnowledgeGaps(studentId: string): Promise<string[]>;

  /**
   * Delete a student profile
   */
  delete(studentId: string): Promise<void>;
}

/**
 * Review schedule store interface
 */
export interface ReviewScheduleStore {
  /**
   * Get pending reviews for a student
   */
  getPendingReviews(
    studentId: string,
    limit?: number
  ): Promise<ReviewScheduleEntry[]>;

  /**
   * Get overdue reviews
   */
  getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]>;

  /**
   * Schedule a review
   */
  scheduleReview(entry: Omit<ReviewScheduleEntry, 'id'>): Promise<ReviewScheduleEntry>;

  /**
   * Update a review entry
   */
  updateReview(
    entryId: string,
    update: Partial<ReviewScheduleEntry>
  ): Promise<ReviewScheduleEntry>;

  /**
   * Complete a review
   */
  completeReview(
    entryId: string,
    score: number,
    timestamp?: Date
  ): Promise<ReviewScheduleEntry>;

  /**
   * Get review history for a topic
   */
  getReviewHistory(
    studentId: string,
    topicId: string
  ): Promise<ReviewScheduleEntry[]>;

  /**
   * Delete old completed reviews
   */
  pruneCompleted(olderThanDays: number): Promise<number>;
}

/**
 * Memory store interface
 */
export interface MemoryStore {
  /**
   * Store a memory entry
   */
  store(entry: Omit<MemoryEntry, 'id' | 'accessCount'>): Promise<MemoryEntry>;

  /**
   * Get a memory entry by ID
   */
  get(entryId: string): Promise<MemoryEntry | null>;

  /**
   * Search memories by type
   */
  getByType(
    studentId: string,
    type: MemoryEntryType,
    limit?: number
  ): Promise<MemoryEntry[]>;

  /**
   * Search memories by topic
   */
  getByTopic(
    studentId: string,
    topicId: string,
    limit?: number
  ): Promise<MemoryEntry[]>;

  /**
   * Get recent memories
   */
  getRecent(studentId: string, limit?: number): Promise<MemoryEntry[]>;

  /**
   * Get important memories
   */
  getImportant(
    studentId: string,
    minImportance: ImportanceLevel
  ): Promise<MemoryEntry[]>;

  /**
   * Update access timestamp
   */
  recordAccess(entryId: string): Promise<void>;

  /**
   * Prune expired entries
   */
  pruneExpired(): Promise<number>;

  /**
   * Delete entries for a student
   */
  deleteForStudent(studentId: string): Promise<number>;
}

// ============================================================================
// INTEGRATION INTERFACE
// ============================================================================

/**
 * Memory integration configuration
 */
export interface MemoryIntegrationConfig {
  /**
   * Whether to update mastery on evaluation
   */
  updateMasteryOnEvaluation: boolean;

  /**
   * Whether to adjust pathway on evaluation
   */
  adjustPathwayOnEvaluation: boolean;

  /**
   * Whether to update spaced repetition schedule
   */
  updateSpacedRepetition: boolean;

  /**
   * Whether to store in long-term memory
   */
  storeInMemory: boolean;

  /**
   * Spaced repetition configuration
   */
  spacedRepetitionConfig: SpacedRepetitionConfig;

  /**
   * Minimum score to consider mastery improving
   */
  masteryImprovementThreshold: number;

  /**
   * Score below which to add remediation
   */
  remediationThreshold: number;

  /**
   * Score above which to skip ahead
   */
  skipAheadThreshold: number;
}

/**
 * Default memory integration configuration
 */
export const DEFAULT_MEMORY_INTEGRATION_CONFIG: Required<MemoryIntegrationConfig> =
  {
    updateMasteryOnEvaluation: true,
    adjustPathwayOnEvaluation: true,
    updateSpacedRepetition: true,
    storeInMemory: true,
    spacedRepetitionConfig: DEFAULT_SPACED_REPETITION_CONFIG,
    masteryImprovementThreshold: 70,
    remediationThreshold: 50,
    skipAheadThreshold: 90,
  };

/**
 * Evaluation memory integration interface
 */
export interface EvaluationMemoryIntegration {
  /**
   * Record an evaluation outcome
   */
  recordEvaluationOutcome(
    outcome: EvaluationOutcome
  ): Promise<OutcomeRecordingResult>;

  /**
   * Get student profile
   */
  getStudentProfile(studentId: string): Promise<StudentProfile | null>;

  /**
   * Get pending reviews for a student
   */
  getPendingReviews(studentId: string): Promise<ReviewScheduleEntry[]>;

  /**
   * Get relevant memories for context
   */
  getRelevantMemories(
    studentId: string,
    topicId: string
  ): Promise<MemoryEntry[]>;

  /**
   * Recalculate learning pathway
   */
  recalculatePathway(
    studentId: string,
    pathwayId: string
  ): Promise<LearningPathway>;
}
