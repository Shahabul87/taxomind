/**
 * Memory Integration Types
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Types for evaluation outcomes to update student profiles
 */
/**
 * Bloom's Taxonomy cognitive level
 */
type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
/**
 * Mastery level for a specific topic/concept
 */
type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'proficient' | 'expert';
/**
 * Mastery record for a topic
 */
interface TopicMastery {
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
interface MasteryUpdate {
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
/**
 * Learning pathway step
 */
interface PathwayStep {
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
interface LearningPathway {
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
interface PathwayAdjustment {
    /**
     * Type of adjustment
     */
    type: 'skip_ahead' | 'add_remediation' | 'reorder' | 'add_challenge' | 'no_change';
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
/**
 * Review priority level
 */
type ReviewPriority = 'urgent' | 'high' | 'medium' | 'low';
/**
 * Spaced repetition schedule entry
 */
interface ReviewScheduleEntry {
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
interface SpacedRepetitionConfig {
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
declare const DEFAULT_SPACED_REPETITION_CONFIG: Required<SpacedRepetitionConfig>;
/**
 * Learning style preference
 */
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';
/**
 * Cognitive preferences
 */
interface CognitivePreferences {
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
interface PerformanceMetrics {
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
interface StudentProfile {
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
/**
 * Evaluation result to be recorded
 */
interface EvaluationOutcome {
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
interface OutcomeRecordingResult {
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
/**
 * Memory entry type
 */
type MemoryEntryType = 'EVALUATION_OUTCOME' | 'MASTERY_UPDATE' | 'PATHWAY_CHANGE' | 'LEARNING_MILESTONE' | 'STRUGGLE_POINT' | 'BREAKTHROUGH';
/**
 * Memory entry importance level
 */
type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
/**
 * Long-term memory entry
 */
interface MemoryEntry {
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
/**
 * Student profile store interface
 */
interface StudentProfileStore {
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
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    /**
     * Get active pathways for a student
     */
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    /**
     * Update performance metrics
     */
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
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
interface ReviewScheduleStore {
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
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
    updateReview(entryId: string, update: Partial<ReviewScheduleEntry>): Promise<ReviewScheduleEntry>;
    /**
     * Complete a review
     */
    completeReview(entryId: string, score: number, timestamp?: Date): Promise<ReviewScheduleEntry>;
    /**
     * Get review history for a topic
     */
    getReviewHistory(studentId: string, topicId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Delete old completed reviews
     */
    pruneCompleted(olderThanDays: number): Promise<number>;
}
/**
 * Memory store interface
 */
interface MemoryStore {
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
    getByType(studentId: string, type: MemoryEntryType, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Search memories by topic
     */
    getByTopic(studentId: string, topicId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get recent memories
     */
    getRecent(studentId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get important memories
     */
    getImportant(studentId: string, minImportance: ImportanceLevel): Promise<MemoryEntry[]>;
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
/**
 * Memory integration configuration
 */
interface MemoryIntegrationConfig {
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
declare const DEFAULT_MEMORY_INTEGRATION_CONFIG: Required<MemoryIntegrationConfig>;
/**
 * Evaluation memory integration interface
 */
interface EvaluationMemoryIntegration {
    /**
     * Record an evaluation outcome
     */
    recordEvaluationOutcome(outcome: EvaluationOutcome): Promise<OutcomeRecordingResult>;
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
    getRelevantMemories(studentId: string, topicId: string): Promise<MemoryEntry[]>;
    /**
     * Recalculate learning pathway
     */
    recalculatePathway(studentId: string, pathwayId: string): Promise<LearningPathway>;
}

/**
 * Student Profile Store
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Storage implementations for student profiles
 */

/**
 * In-memory implementation of StudentProfileStore
 * Suitable for development and testing
 */
declare class InMemoryStudentProfileStore implements StudentProfileStore {
    private profiles;
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
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    /**
     * Get active pathways for a student
     */
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    /**
     * Update performance metrics
     */
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    /**
     * Get knowledge gaps
     */
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    /**
     * Delete a student profile
     */
    delete(studentId: string): Promise<void>;
    /**
     * Compare Bloom's levels and return higher one
     */
    private higherBloomsLevel;
    /**
     * Update overall metrics after mastery change
     */
    private updateOverallMetrics;
    /**
     * Clear all profiles (for testing)
     */
    clear(): void;
    /**
     * Get all profiles (for testing)
     */
    getAll(): StudentProfile[];
}
/**
 * Configuration for Prisma-based student profile store
 */
interface PrismaStudentProfileStoreConfig {
    /**
     * Prisma client instance
     */
    prisma: any;
    /**
     * Table/model name for student profiles
     */
    profileTableName?: string;
    /**
     * Table/model name for topic mastery
     */
    masteryTableName?: string;
    /**
     * Table/model name for learning pathways
     */
    pathwayTableName?: string;
}
/**
 * Prisma-based implementation of StudentProfileStore
 * Ready for database integration
 */
declare class PrismaStudentProfileStore implements StudentProfileStore {
    private prisma;
    private profileTableName;
    private masteryTableName;
    private pathwayTableName;
    constructor(config: PrismaStudentProfileStoreConfig);
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
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    /**
     * Get active pathways for a student
     */
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    /**
     * Update performance metrics
     */
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    /**
     * Get knowledge gaps
     */
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    /**
     * Delete a student profile
     */
    delete(studentId: string): Promise<void>;
    /**
     * Map database result to StudentProfile
     */
    private mapToProfile;
    /**
     * Map database result to TopicMastery
     */
    private mapToMastery;
    /**
     * Map database result to LearningPathway
     */
    private mapToPathway;
}
/**
 * Create an in-memory student profile store
 */
declare function createInMemoryStudentProfileStore(): InMemoryStudentProfileStore;
/**
 * Create a Prisma-based student profile store
 */
declare function createPrismaStudentProfileStore(config: PrismaStudentProfileStoreConfig): PrismaStudentProfileStore;
/**
 * Get the default student profile store (singleton)
 */
declare function getDefaultStudentProfileStore(): InMemoryStudentProfileStore;
/**
 * Reset the default student profile store (for testing)
 */
declare function resetDefaultStudentProfileStore(): void;

/**
 * Mastery Tracker
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Tracks and updates student mastery levels based on evaluations
 */

/**
 * Configuration for mastery tracking
 */
interface MasteryTrackerConfig {
    /**
     * Weight given to recent assessments vs historical (0-1)
     * Higher value = more weight on recent
     */
    recencyWeight?: number;
    /**
     * Minimum assessments before mastery is considered stable
     */
    minAssessmentsForStability?: number;
    /**
     * Score thresholds for each mastery level
     */
    levelThresholds?: {
        beginner: number;
        intermediate: number;
        proficient: number;
        expert: number;
    };
    /**
     * Bloom's level weights for mastery calculation
     */
    bloomsWeights?: Record<BloomsLevel, number>;
    /**
     * Decay rate for unused topics (per day)
     */
    decayRatePerDay?: number;
    /**
     * Days before decay starts
     */
    decayStartDays?: number;
}
/**
 * Default mastery tracker configuration
 */
declare const DEFAULT_MASTERY_TRACKER_CONFIG: Required<MasteryTrackerConfig>;
/**
 * Result of mastery update
 */
interface MasteryUpdateResult {
    /**
     * Previous mastery record (if existed)
     */
    previousMastery?: TopicMastery;
    /**
     * Updated mastery record
     */
    currentMastery: TopicMastery;
    /**
     * Whether mastery level changed
     */
    levelChanged: boolean;
    /**
     * Direction of change
     */
    changeDirection?: 'improved' | 'declined' | 'unchanged';
    /**
     * Score difference
     */
    scoreDifference: number;
    /**
     * Whether mastery is now stable
     */
    isStable: boolean;
    /**
     * Recommendations based on mastery
     */
    recommendations: MasteryRecommendation[];
}
/**
 * Mastery-based recommendation
 */
interface MasteryRecommendation {
    /**
     * Recommendation type
     */
    type: 'practice_more' | 'advance_level' | 'review_basics' | 'challenge_increase' | 'maintain';
    /**
     * Recommendation message
     */
    message: string;
    /**
     * Priority (1-5, 1 = highest)
     */
    priority: number;
    /**
     * Suggested action
     */
    action?: string;
}
/**
 * Mastery Tracker
 * Tracks and updates student mastery levels
 */
declare class MasteryTracker {
    private readonly config;
    private readonly profileStore;
    constructor(profileStore: StudentProfileStore, config?: MasteryTrackerConfig);
    /**
     * Process an evaluation outcome and update mastery
     */
    processEvaluation(outcome: EvaluationOutcome): Promise<MasteryUpdateResult>;
    /**
     * Get mastery for a topic
     */
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    /**
     * Calculate mastery level from score
     */
    calculateMasteryLevel(score: number): MasteryLevel;
    /**
     * Apply decay to unused topics
     */
    applyDecay(studentId: string, topicId: string, currentDate?: Date): Promise<TopicMastery | null>;
    /**
     * Get topics needing review (mastery below threshold)
     */
    getTopicsNeedingReview(studentId: string, threshold?: number): Promise<TopicMastery[]>;
    /**
     * Get mastery summary for a student
     */
    getMasterySummary(studentId: string): Promise<MasterySummary>;
    /**
     * Determine change direction between mastery levels
     */
    private determineChangeDirection;
    /**
     * Generate recommendations based on mastery
     */
    private generateRecommendations;
}
/**
 * Mastery summary for a student
 */
interface MasterySummary {
    /**
     * Total number of topics tracked
     */
    totalTopics: number;
    /**
     * Average mastery score across all topics
     */
    averageMastery: number;
    /**
     * Distribution of mastery levels
     */
    levelDistribution: Record<MasteryLevel, number>;
    /**
     * Distribution of highest Bloom's levels achieved
     */
    bloomsDistribution: Record<BloomsLevel, number>;
    /**
     * Recent overall trend
     */
    recentTrend: 'improving' | 'stable' | 'declining';
    /**
     * Topics needing attention
     */
    topicsNeedingAttention: string[];
    /**
     * Strong topics
     */
    strengths: string[];
}
/**
 * Create a mastery tracker
 */
declare function createMasteryTracker(profileStore: StudentProfileStore, config?: MasteryTrackerConfig): MasteryTracker;

/**
 * Learning Pathway Calculator
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Calculates and adjusts learning pathways based on evaluation outcomes
 */

/**
 * Configuration for pathway calculation
 */
interface PathwayCalculatorConfig {
    /**
     * Score threshold to skip ahead
     */
    skipAheadThreshold?: number;
    /**
     * Score threshold to add remediation
     */
    remediationThreshold?: number;
    /**
     * Maximum steps to skip at once
     */
    maxSkipSteps?: number;
    /**
     * Maximum remediation steps to add
     */
    maxRemediationSteps?: number;
    /**
     * Minimum mastery level to skip a topic
     */
    skipMasteryLevel?: MasteryLevel;
    /**
     * Bloom's level progression order
     */
    bloomsProgression?: BloomsLevel[];
}
/**
 * Default pathway calculator configuration
 */
declare const DEFAULT_PATHWAY_CALCULATOR_CONFIG: Required<PathwayCalculatorConfig>;
/**
 * Pathway adjustment result
 */
interface PathwayAdjustmentResult {
    /**
     * The adjustment made
     */
    adjustment: PathwayAdjustment;
    /**
     * Updated pathway
     */
    updatedPathway: LearningPathway;
    /**
     * Steps added
     */
    stepsAdded: PathwayStep[];
    /**
     * Steps removed
     */
    stepsRemoved: PathwayStep[];
    /**
     * Steps skipped
     */
    stepsSkipped: PathwayStep[];
    /**
     * New estimated completion time (minutes)
     */
    newEstimatedTime: number;
    /**
     * Explanation for the adjustment
     */
    explanation: string;
}
/**
 * Remediation step template
 */
interface RemediationTemplate {
    /**
     * Topic ID for remediation
     */
    topicId: string;
    /**
     * Target Bloom's level
     */
    targetBloomsLevel: BloomsLevel;
    /**
     * Estimated duration in minutes
     */
    estimatedDuration: number;
    /**
     * Description of remediation
     */
    description: string;
}
/**
 * Learning Pathway Calculator
 * Adjusts learning pathways based on evaluation outcomes
 */
declare class PathwayCalculator {
    private readonly config;
    private readonly profileStore;
    constructor(profileStore: StudentProfileStore, config?: PathwayCalculatorConfig);
    /**
     * Calculate pathway adjustment based on evaluation outcome
     */
    calculateAdjustment(studentId: string, pathwayId: string, outcome: EvaluationOutcome): Promise<PathwayAdjustmentResult>;
    /**
     * Recalculate entire pathway based on current mastery
     */
    recalculatePathway(studentId: string, pathwayId: string): Promise<LearningPathway>;
    /**
     * Create a new pathway for a course
     */
    createPathway(studentId: string, courseId: string, topics: {
        topicId: string;
        targetBloomsLevel: BloomsLevel;
        estimatedDuration: number;
    }[]): Promise<LearningPathway>;
    /**
     * Determine adjustment type based on outcome
     */
    private determineAdjustmentType;
    /**
     * Calculate skip ahead adjustment
     */
    private calculateSkipAhead;
    /**
     * Calculate remediation adjustment
     */
    private calculateRemediation;
    /**
     * Calculate challenge adjustment
     */
    private calculateChallenge;
    /**
     * Apply adjustment to pathway
     */
    private applyAdjustment;
    /**
     * Check if step should be marked completed based on mastery
     */
    private shouldMarkCompleted;
    /**
     * Check if step should be skipped based on mastery
     */
    private shouldSkip;
    /**
     * Get mastery level index
     */
    private masteryLevelIndex;
    /**
     * Get Bloom's level index
     */
    private bloomsLevelIndex;
}
/**
 * Create a pathway calculator
 */
declare function createPathwayCalculator(profileStore: StudentProfileStore, config?: PathwayCalculatorConfig): PathwayCalculator;

/**
 * Spaced Repetition Scheduler
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Implements SM-2 algorithm for optimal review scheduling
 */

/**
 * Review scheduling result
 */
interface SchedulingResult {
    /**
     * The scheduled review entry
     */
    entry: ReviewScheduleEntry;
    /**
     * Days until next review
     */
    daysUntilReview: number;
    /**
     * Whether this is a new schedule or update
     */
    isNew: boolean;
    /**
     * Performance quality (0-5, SM-2 scale)
     */
    quality: number;
    /**
     * Explanation of scheduling decision
     */
    explanation: string;
}
/**
 * Review session result
 */
interface ReviewSessionResult {
    /**
     * Reviews completed
     */
    completed: number;
    /**
     * Reviews skipped
     */
    skipped: number;
    /**
     * Average score
     */
    averageScore: number;
    /**
     * Topics reviewed
     */
    topicsReviewed: string[];
    /**
     * Next review dates by topic
     */
    nextReviewDates: Record<string, Date>;
}
/**
 * Spaced Repetition Scheduler
 * Implements SM-2 algorithm for optimal review scheduling
 */
declare class SpacedRepetitionScheduler {
    private readonly config;
    private readonly store;
    constructor(store: ReviewScheduleStore, config?: SpacedRepetitionConfig);
    /**
     * Schedule a review based on evaluation outcome
     */
    scheduleFromEvaluation(outcome: EvaluationOutcome): Promise<SchedulingResult>;
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    /**
     * Get overdue reviews for a student
     */
    getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Complete a review
     */
    completeReview(entryId: string, score: number): Promise<SchedulingResult>;
    /**
     * Get review statistics for a student
     */
    getReviewStats(studentId: string): Promise<ReviewStats>;
    /**
     * Calculate quality score (0-5) from percentage score
     * SM-2 quality scale:
     * 5 - perfect response
     * 4 - correct response after hesitation
     * 3 - correct response with serious difficulty
     * 2 - incorrect response but easy to recall
     * 1 - incorrect response but remembered upon seeing
     * 0 - complete blackout
     */
    private calculateQuality;
    /**
     * Calculate next interval using SM-2 algorithm
     */
    private calculateNextInterval;
    /**
     * Calculate review priority
     */
    private calculatePriority;
    /**
     * Generate explanation for scheduling decision
     */
    private generateExplanation;
    /**
     * Group entries by priority
     */
    private groupByPriority;
}
/**
 * Review statistics
 */
interface ReviewStats {
    /**
     * Total pending reviews
     */
    totalPending: number;
    /**
     * Overdue reviews count
     */
    overdueCount: number;
    /**
     * Reviews due today
     */
    dueTodayCount: number;
    /**
     * Reviews due this week
     */
    dueThisWeekCount: number;
    /**
     * Average easiness factor
     */
    averageEasinessFactor: number;
    /**
     * Current streak in days
     */
    streakDays: number;
    /**
     * Topics grouped by priority
     */
    topicsByPriority: Record<ReviewPriority, string[]>;
}
/**
 * In-memory implementation of ReviewScheduleStore
 */
declare class InMemoryReviewScheduleStore implements ReviewScheduleStore {
    private entries;
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
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
    updateReview(entryId: string, update: Partial<ReviewScheduleEntry>): Promise<ReviewScheduleEntry>;
    /**
     * Complete a review
     */
    completeReview(entryId: string, score: number, timestamp?: Date): Promise<ReviewScheduleEntry>;
    /**
     * Get review history for a topic
     */
    getReviewHistory(studentId: string, topicId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Delete old completed reviews
     */
    pruneCompleted(olderThanDays: number): Promise<number>;
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Get all entries (for testing)
     */
    getAll(): ReviewScheduleEntry[];
}
/**
 * Create a spaced repetition scheduler
 */
declare function createSpacedRepetitionScheduler(store: ReviewScheduleStore, config?: SpacedRepetitionConfig): SpacedRepetitionScheduler;
/**
 * Create an in-memory review schedule store
 */
declare function createInMemoryReviewScheduleStore(): InMemoryReviewScheduleStore;
/**
 * Get the default review schedule store (singleton)
 */
declare function getDefaultReviewScheduleStore(): InMemoryReviewScheduleStore;
/**
 * Reset the default review schedule store (for testing)
 */
declare function resetDefaultReviewScheduleStore(): void;

/**
 * In-memory implementation of MemoryStore
 */
declare class InMemoryMemoryStore implements MemoryStore {
    private entries;
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
    getByType(studentId: string, type: MemoryEntryType, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Search memories by topic
     */
    getByTopic(studentId: string, topicId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get recent memories
     */
    getRecent(studentId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get important memories
     */
    getImportant(studentId: string, minImportance: ImportanceLevel): Promise<MemoryEntry[]>;
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
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Get all entries (for testing)
     */
    getAll(): MemoryEntry[];
}
/**
 * Configuration for EvaluationMemoryIntegrationImpl
 */
interface EvaluationMemoryIntegrationImplConfig extends MemoryIntegrationConfig {
    /**
     * Student profile store
     */
    profileStore: StudentProfileStore;
    /**
     * Review schedule store
     */
    reviewStore: ReviewScheduleStore;
    /**
     * Memory store
     */
    memoryStore: MemoryStore;
    /**
     * Optional logger
     */
    logger?: MemoryIntegrationLogger;
}
/**
 * Logger interface for memory integration
 */
interface MemoryIntegrationLogger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
/**
 * Evaluation Memory Integration Implementation
 * Connects evaluation outcomes to student profiles and learning systems
 */
declare class EvaluationMemoryIntegrationImpl implements EvaluationMemoryIntegration {
    private readonly config;
    private readonly profileStore;
    private readonly memoryStore;
    private readonly masteryTracker;
    private readonly pathwayCalculator;
    private readonly spacedRepetitionScheduler;
    private readonly logger;
    constructor(implConfig: EvaluationMemoryIntegrationImplConfig);
    /**
     * Record an evaluation outcome
     */
    recordEvaluationOutcome(outcome: EvaluationOutcome): Promise<OutcomeRecordingResult>;
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
    getRelevantMemories(studentId: string, topicId: string): Promise<MemoryEntry[]>;
    /**
     * Recalculate learning pathway
     */
    recalculatePathway(studentId: string, pathwayId: string): Promise<LearningPathway>;
    /**
     * Get mastery summary for a student
     */
    getMasterySummary(studentId: string): Promise<MasterySummary>;
    /**
     * Get review statistics
     */
    getReviewStats(studentId: string): Promise<ReviewStats>;
    /**
     * Create memory entries for an evaluation
     */
    private createMemoryEntries;
    /**
     * Calculate importance of an evaluation outcome
     */
    private calculateImportance;
}
/**
 * Create an in-memory memory store
 */
declare function createInMemoryMemoryStore(): InMemoryMemoryStore;
/**
 * Create an evaluation memory integration
 */
declare function createEvaluationMemoryIntegration(config: EvaluationMemoryIntegrationImplConfig): EvaluationMemoryIntegrationImpl;
/**
 * Get the default memory store (singleton)
 */
declare function getDefaultMemoryStore(): InMemoryMemoryStore;
/**
 * Reset the default memory store (for testing)
 */
declare function resetDefaultMemoryStore(): void;

/**
 * Memory Summary Builder
 *
 * Creates compact memory summaries for prompt injection.
 */

interface MemorySummaryResult {
    masterySummary: MasterySummary;
    reviewStats: ReviewStats;
    memorySummary?: string;
    reviewSummary?: string;
}
interface MemorySummaryOptions {
    studentId: string;
    masteryTracker: MasteryTracker;
    spacedRepScheduler: SpacedRepetitionScheduler;
    maxTopics?: number;
}
declare function buildMemorySummary(options: MemorySummaryOptions): Promise<MemorySummaryResult>;

export { type BloomsLevel, type CognitivePreferences, DEFAULT_MASTERY_TRACKER_CONFIG, DEFAULT_MEMORY_INTEGRATION_CONFIG, DEFAULT_PATHWAY_CALCULATOR_CONFIG, DEFAULT_SPACED_REPETITION_CONFIG, type EvaluationMemoryIntegration, EvaluationMemoryIntegrationImpl, type EvaluationMemoryIntegrationImplConfig, type EvaluationOutcome, type ImportanceLevel, InMemoryMemoryStore, InMemoryReviewScheduleStore, InMemoryStudentProfileStore, type LearningPathway, type LearningStyle, type MasteryLevel, type MasteryRecommendation, type MasterySummary, MasteryTracker, type MasteryTrackerConfig, type MasteryUpdate, type MasteryUpdateResult, type MemoryEntry, type MemoryEntryType, type MemoryIntegrationConfig, type MemoryIntegrationLogger, type MemoryStore, type MemorySummaryOptions, type MemorySummaryResult, type OutcomeRecordingResult, type PathwayAdjustment, type PathwayAdjustmentResult, PathwayCalculator, type PathwayCalculatorConfig, type PathwayStep, type PerformanceMetrics, PrismaStudentProfileStore, type PrismaStudentProfileStoreConfig, type RemediationTemplate, type ReviewPriority, type ReviewScheduleEntry, type ReviewScheduleStore, type ReviewSessionResult, type ReviewStats, type SchedulingResult, type SpacedRepetitionConfig, SpacedRepetitionScheduler, type StudentProfile, type StudentProfileStore, type TopicMastery, buildMemorySummary, createEvaluationMemoryIntegration, createInMemoryMemoryStore, createInMemoryReviewScheduleStore, createInMemoryStudentProfileStore, createMasteryTracker, createPathwayCalculator, createPrismaStudentProfileStore, createSpacedRepetitionScheduler, getDefaultMemoryStore, getDefaultReviewScheduleStore, getDefaultStudentProfileStore, resetDefaultMemoryStore, resetDefaultReviewScheduleStore, resetDefaultStudentProfileStore };
