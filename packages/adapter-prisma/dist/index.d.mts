import { SAMDatabaseAdapter, QueryOptions, SAMUser, SAMCourse, SAMChapter, SAMSection, SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress, SAMInteractionLog, SAMCourseAnalysis, TransactionContext } from '@sam-ai/core';

/**
 * Prisma SAM Database Adapter
 *
 * Generic implementation of SAMDatabaseAdapter using Prisma Client.
 * Works with any Prisma schema that includes the required SAM models.
 */

/**
 * Minimal Prisma model delegate interface.
 * Uses bivariant method syntax to be compatible with Prisma's generic methods.
 */
interface PrismaModelDelegate {
    findUnique(args: never): Promise<object | null>;
    findMany(args?: never): Promise<object[]>;
    create(args: never): Promise<object>;
    update(args: never): Promise<object>;
    upsert(args: never): Promise<object>;
    delete(args: never): Promise<object>;
    count(args?: never): Promise<number>;
}
/**
 * Minimal type constraint for any Prisma client that has the required models.
 *
 * Your Prisma client must have these models:
 * - user, course, chapter, section (required)
 * - questionBank, studentBloomsProgress, cognitiveSkillProgress, sAMInteraction, courseBloomsAnalysis (optional)
 *
 * This is a structural type that accepts any Prisma client with the required models.
 */
interface PrismaClientLike {
    user: PrismaModelDelegate;
    course: PrismaModelDelegate;
    chapter: PrismaModelDelegate;
    section: PrismaModelDelegate;
    questionBank?: PrismaModelDelegate;
    studentBloomsProgress?: PrismaModelDelegate;
    cognitiveSkillProgress?: PrismaModelDelegate;
    sAMInteraction?: PrismaModelDelegate;
    courseBloomsAnalysis?: PrismaModelDelegate;
    $queryRaw: <T>(query: TemplateStringsArray) => Promise<T>;
}
/**
 * Configuration for PrismaSAMAdapter
 */
interface PrismaSAMAdapterConfig {
    /**
     * Prisma client instance
     */
    prisma: PrismaClientLike;
    /**
     * Enable debug logging
     */
    debug?: boolean;
    /**
     * Model name overrides (if your schema uses different names)
     */
    modelNames?: {
        user?: string;
        course?: string;
        chapter?: string;
        section?: string;
        questionBank?: string;
        studentBloomsProgress?: string;
        cognitiveSkillProgress?: string;
        samInteraction?: string;
        courseBloomsAnalysis?: string;
    };
}
/**
 * Prisma implementation of SAMDatabaseAdapter
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { PrismaSAMAdapter } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const dbAdapter = new PrismaSAMAdapter({ prisma });
 * ```
 */
declare class PrismaSAMAdapter implements SAMDatabaseAdapter {
    private prisma;
    private debug;
    constructor(config: PrismaSAMAdapterConfig);
    findUser(id: string, options?: QueryOptions): Promise<SAMUser | null>;
    findUsers(filter: Partial<SAMUser>, options?: QueryOptions): Promise<SAMUser[]>;
    updateUser(id: string, data: Partial<SAMUser>): Promise<SAMUser>;
    findCourse(id: string, options?: QueryOptions): Promise<SAMCourse | null>;
    findCourses(filter: Partial<SAMCourse>, options?: QueryOptions): Promise<SAMCourse[]>;
    findChapter(id: string, options?: QueryOptions): Promise<SAMChapter | null>;
    findChaptersByCourse(courseId: string, options?: QueryOptions): Promise<SAMChapter[]>;
    findSection(id: string): Promise<SAMSection | null>;
    findSectionsByChapter(chapterId: string, options?: QueryOptions): Promise<SAMSection[]>;
    findQuestions(filter: Partial<SAMQuestion>, options?: QueryOptions): Promise<SAMQuestion[]>;
    createQuestion(data: Omit<SAMQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<SAMQuestion>;
    updateQuestion(id: string, data: Partial<SAMQuestion>): Promise<SAMQuestion>;
    deleteQuestion(id: string): Promise<void>;
    findBloomsProgress(userId: string, courseId: string): Promise<SAMBloomsProgress | null>;
    upsertBloomsProgress(userId: string, courseId: string, data: Partial<SAMBloomsProgress>): Promise<SAMBloomsProgress>;
    findCognitiveProgress(userId: string, skillType: string): Promise<SAMCognitiveProgress | null>;
    upsertCognitiveProgress(userId: string, skillType: string, data: Partial<SAMCognitiveProgress>): Promise<SAMCognitiveProgress>;
    logInteraction(data: Omit<SAMInteractionLog, 'id' | 'createdAt'>): Promise<SAMInteractionLog>;
    findInteractions(userId: string, options?: QueryOptions): Promise<SAMInteractionLog[]>;
    countInteractions(filter?: {
        userId?: string;
        pageType?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<number>;
    findCourseAnalysis(courseId: string): Promise<SAMCourseAnalysis | null>;
    upsertCourseAnalysis(courseId: string, data: Partial<SAMCourseAnalysis>): Promise<SAMCourseAnalysis>;
    healthCheck(): Promise<boolean>;
    beginTransaction(): Promise<TransactionContext>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    private logDebug;
    private mapCourse;
    private mapChapter;
    private mapSection;
    private mapQuestion;
    private mapBloomsProgress;
    private mapCognitiveProgress;
    private mapInteractionLog;
    private mapCourseAnalysis;
    private buildUserFilter;
    private buildCourseFilter;
    private buildQuestionFilter;
    private mapSelectFields;
    private mapOrderBy;
    private mapQuestionType;
    private reverseQuestionType;
    private mapBloomsLevel;
    private reverseBloomsLevel;
    private mapDifficulty;
    private reverseDifficulty;
}
/**
 * Create a Prisma SAM Database Adapter
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const dbAdapter = createPrismaSAMAdapter({ prisma });
 * ```
 */
declare function createPrismaSAMAdapter(config: PrismaSAMAdapterConfig): SAMDatabaseAdapter;

/**
 * Prisma Calibration Sample Store
 *
 * Database-backed implementation for calibration samples.
 */
interface CalibrationSample {
    id: string;
    evaluationId: string;
    aiScore: number;
    humanScore?: number;
    aiFeedback: string;
    humanFeedback?: string;
    adjustmentReason?: string;
    context: EvaluationContext;
    evaluatedAt: Date;
    reviewedAt?: Date;
    reviewerId?: string;
    versionInfo: VersionInfo;
    tags?: string[];
}
interface EvaluationContext {
    contentType: string;
    subject?: string;
    bloomsLevel?: string;
    difficulty?: string;
    studentId?: string;
    courseId?: string;
}
interface VersionInfo {
    configVersion: string;
    promptVersion: string;
    modelVersion: string;
}
interface HumanReview {
    score: number;
    feedback?: string;
    reason?: string;
    reviewerId?: string;
}
interface SampleStatistics {
    totalSamples: number;
    reviewedSamples: number;
    averageAiScore: number;
    averageHumanScore?: number;
    averageDrift?: number;
    byContentType: Record<string, number>;
    bySubject: Record<string, number>;
    oldestSample?: Date;
    newestSample?: Date;
}
interface CalibrationSampleStore {
    save(sample: CalibrationSample): Promise<void>;
    get(id: string): Promise<CalibrationSample | null>;
    getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]>;
    getPendingReview(limit: number): Promise<CalibrationSample[]>;
    getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]>;
    getByContentType(contentType: string, limit: number): Promise<CalibrationSample[]>;
    updateWithReview(id: string, review: HumanReview): Promise<CalibrationSample>;
    getStatistics(): Promise<SampleStatistics>;
    pruneOldSamples(olderThanDays: number): Promise<number>;
}
interface PrismaSampleStoreConfig {
    prisma: any;
    tableName?: string;
}
declare class PrismaSampleStore implements CalibrationSampleStore {
    private prisma;
    private tableName;
    constructor(config: PrismaSampleStoreConfig);
    save(sample: CalibrationSample): Promise<void>;
    get(id: string): Promise<CalibrationSample | null>;
    getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]>;
    getPendingReview(limit: number): Promise<CalibrationSample[]>;
    getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]>;
    getByContentType(contentType: string, limit: number): Promise<CalibrationSample[]>;
    updateWithReview(id: string, review: HumanReview): Promise<CalibrationSample>;
    getStatistics(): Promise<SampleStatistics>;
    pruneOldSamples(olderThanDays: number): Promise<number>;
    private mapToSample;
}
declare function createPrismaSampleStore(config: PrismaSampleStoreConfig): PrismaSampleStore;

/**
 * Prisma Student Profile Store
 *
 * Database-backed implementation for student learning profiles.
 */
type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'proficient' | 'expert';
interface TopicMastery {
    topicId: string;
    level: MasteryLevel;
    score: number;
    bloomsLevel: BloomsLevel;
    assessmentCount: number;
    averageScore: number;
    lastAssessedAt: Date;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
}
interface MasteryUpdate {
    topicId: string;
    score: number;
    maxScore: number;
    bloomsLevel: BloomsLevel;
    timestamp: Date;
}
interface PathwayStep {
    id: string;
    title: string;
    type: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
}
interface LearningPathway {
    id: string;
    studentId: string;
    courseId: string;
    steps: PathwayStep[];
    currentStepIndex: number;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'paused';
}
interface PathwayAdjustment {
    type: 'skip_ahead' | 'add_remediation' | 'reorder' | 'add_challenge' | 'no_change';
    newCurrentStepIndex?: number;
    stepsToAdd?: PathwayStep[];
    stepsToRemove?: string[];
    newOrder?: string[];
}
interface PerformanceMetrics {
    overallAverageScore: number;
    totalAssessments: number;
    weeklyAssessments: number;
    currentStreak: number;
    longestStreak: number;
    topicsMastered: number;
    totalStudyTimeMinutes: number;
    averageSessionDuration: number;
    completionRate: number;
}
interface CognitivePreferences {
    learningStyles: string[];
    contentLengthPreference: 'brief' | 'moderate' | 'detailed';
    pacePreference: 'slow' | 'moderate' | 'fast';
    challengePreference: 'easy' | 'moderate' | 'challenging';
    examplesFirst: boolean;
}
interface StudentProfile {
    id: string;
    userId: string;
    masteryByTopic: Record<string, TopicMastery>;
    activePathways: LearningPathway[];
    cognitivePreferences: CognitivePreferences;
    performanceMetrics: PerformanceMetrics;
    overallBloomsDistribution: Record<BloomsLevel, number>;
    knowledgeGaps: string[];
    strengths: string[];
    createdAt: Date;
    lastActiveAt: Date;
    updatedAt: Date;
}
interface StudentProfileStore {
    get(studentId: string): Promise<StudentProfile | null>;
    save(profile: StudentProfile): Promise<void>;
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    delete(studentId: string): Promise<void>;
}
interface PrismaStudentProfileStoreConfig {
    prisma: any;
    profileTableName?: string;
    masteryTableName?: string;
    pathwayTableName?: string;
}
declare class PrismaStudentProfileStore implements StudentProfileStore {
    private prisma;
    private profileTableName;
    private masteryTableName;
    private pathwayTableName;
    constructor(config: PrismaStudentProfileStoreConfig);
    get(studentId: string): Promise<StudentProfile | null>;
    save(profile: StudentProfile): Promise<void>;
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    delete(studentId: string): Promise<void>;
    private mapToProfile;
    private mapToMastery;
    private mapToPathway;
}
declare function createPrismaStudentProfileStore(config: PrismaStudentProfileStoreConfig): PrismaStudentProfileStore;

/**
 * Prisma Memory Store
 *
 * Database-backed implementation for memory entries (long-term storage).
 */
interface MemoryEntry {
    id: string;
    studentId: string;
    type: 'insight' | 'preference' | 'milestone' | 'feedback' | 'context';
    importance: 'low' | 'medium' | 'high' | 'critical';
    content: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface MemoryStore {
    save(entry: MemoryEntry): Promise<void>;
    get(id: string): Promise<MemoryEntry | null>;
    getByStudent(studentId: string, options?: {
        type?: string;
        limit?: number;
    }): Promise<MemoryEntry[]>;
    search(studentId: string, query: string): Promise<MemoryEntry[]>;
    delete(id: string): Promise<void>;
    pruneExpired(): Promise<number>;
}
interface PrismaMemoryStoreConfig {
    prisma: any;
    tableName?: string;
}
declare class PrismaMemoryStore implements MemoryStore {
    private prisma;
    private tableName;
    constructor(config: PrismaMemoryStoreConfig);
    save(entry: MemoryEntry): Promise<void>;
    get(id: string): Promise<MemoryEntry | null>;
    getByStudent(studentId: string, options?: {
        type?: string;
        limit?: number;
    }): Promise<MemoryEntry[]>;
    search(studentId: string, query: string): Promise<MemoryEntry[]>;
    delete(id: string): Promise<void>;
    pruneExpired(): Promise<number>;
}
declare function createPrismaMemoryStore(config: PrismaMemoryStoreConfig): PrismaMemoryStore;

/**
 * Prisma Review Schedule Store
 *
 * Database-backed implementation for spaced repetition review schedules.
 */
interface ReviewScheduleEntry {
    id: string;
    studentId: string;
    topicId: string;
    nextReviewAt: Date;
    interval: number;
    easeFactor: number;
    repetitions: number;
    lastReviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface ReviewScheduleStore {
    save(entry: ReviewScheduleEntry): Promise<void>;
    get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null>;
    getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]>;
    delete(studentId: string, topicId: string): Promise<void>;
}
interface PrismaReviewScheduleStoreConfig {
    prisma: any;
    tableName?: string;
}
declare class PrismaReviewScheduleStore implements ReviewScheduleStore {
    private prisma;
    private tableName;
    constructor(config: PrismaReviewScheduleStoreConfig);
    save(entry: ReviewScheduleEntry): Promise<void>;
    get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null>;
    getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]>;
    delete(studentId: string, topicId: string): Promise<void>;
}
declare function createPrismaReviewScheduleStore(config: PrismaReviewScheduleStoreConfig): PrismaReviewScheduleStore;

/**
 * Prisma Golden Test Store
 *
 * Database-backed implementation for golden test cases (version control).
 */
interface GoldenTestCase {
    id: string;
    name: string;
    description?: string;
    category: string;
    input: {
        question: string;
        studentResponse: string;
        rubric?: unknown;
        context?: Record<string, unknown>;
    };
    expectedResult: {
        score: number;
        scoreTolerance?: number;
        feedbackContains?: string[];
        feedbackExcludes?: string[];
        bloomsLevel?: string;
    };
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface GoldenTestStore {
    save(testCase: GoldenTestCase): Promise<void>;
    get(id: string): Promise<GoldenTestCase | null>;
    getByCategory(category: string): Promise<GoldenTestCase[]>;
    getActive(): Promise<GoldenTestCase[]>;
    search(query: string): Promise<GoldenTestCase[]>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
}
interface PrismaGoldenTestStoreConfig {
    prisma: any;
    tableName?: string;
}
declare class PrismaGoldenTestStore implements GoldenTestStore {
    private prisma;
    private tableName;
    constructor(config: PrismaGoldenTestStoreConfig);
    save(testCase: GoldenTestCase): Promise<void>;
    get(id: string): Promise<GoldenTestCase | null>;
    getByCategory(category: string): Promise<GoldenTestCase[]>;
    getActive(): Promise<GoldenTestCase[]>;
    search(query: string): Promise<GoldenTestCase[]>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
}
declare function createPrismaGoldenTestStore(config: PrismaGoldenTestStoreConfig): PrismaGoldenTestStore;

/**
 * Unified SAM Prisma Adapters Factory
 *
 * Creates all SAM Prisma adapters with a single configuration.
 */

interface SAMPrismaAdaptersConfig {
    /**
     * Prisma client instance
     */
    prisma: PrismaClientLike;
    /**
     * Enable debug logging
     */
    debug?: boolean;
    /**
     * Model name overrides for custom schemas
     */
    modelNames?: {
        calibrationSample?: string;
        studentProfile?: string;
        topicMastery?: string;
        learningPathway?: string;
        memoryEntry?: string;
        reviewSchedule?: string;
        goldenTestCase?: string;
    };
}
/**
 * Collection of all SAM Prisma adapters
 */
interface SAMPrismaAdapters {
    /**
     * Core database adapter implementing SAMDatabaseAdapter
     */
    database: PrismaSAMAdapter;
    /**
     * Calibration sample store for evaluation quality tracking
     */
    calibration: PrismaSampleStore;
    /**
     * Student profile store for learning profiles and mastery
     */
    studentProfiles: PrismaStudentProfileStore;
    /**
     * Memory store for long-term context
     */
    memory: PrismaMemoryStore;
    /**
     * Review schedule store for spaced repetition
     */
    reviewSchedules: PrismaReviewScheduleStore;
    /**
     * Golden test store for version control
     */
    goldenTests: PrismaGoldenTestStore;
}
/**
 * Create all SAM Prisma adapters with unified configuration
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { createSAMPrismaAdapters } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const adapters = createSAMPrismaAdapters({ prisma });
 *
 * // Use in SAM configuration
 * const samConfig = createSAMConfig({
 *   ai: aiAdapter,
 *   database: adapters.database,
 *   // ...
 * });
 *
 * // Use student profiles
 * const profile = await adapters.studentProfiles.get(studentId);
 *
 * // Use calibration
 * await adapters.calibration.save(sample);
 * ```
 */
declare function createSAMPrismaAdapters(config: SAMPrismaAdaptersConfig): SAMPrismaAdapters;

/**
 * Prisma Schema Helpers
 *
 * Utility functions for generating SAM-compatible Prisma schemas.
 */
/**
 * Required Prisma models for SAM AI
 */
declare const SAM_PRISMA_MODELS: {
    /**
     * Core models (required)
     */
    readonly core: readonly ["User", "Course", "Chapter", "Section"];
    /**
     * SAM-specific models (optional but recommended)
     */
    readonly sam: readonly ["SAMInteraction", "StudentBloomsProgress", "CognitiveSkillProgress", "CourseBloomsAnalysis", "QuestionBank"];
    /**
     * Calibration models (for quality tracking)
     */
    readonly calibration: readonly ["CalibrationSample"];
    /**
     * Memory models (for adaptive learning)
     */
    readonly memory: readonly ["StudentProfile", "TopicMastery", "LearningPathway", "MemoryEntry", "ReviewSchedule"];
    /**
     * Version control models (for testing)
     */
    readonly versionControl: readonly ["GoldenTestCase"];
};
/**
 * Generate a Prisma schema snippet for SAM models
 *
 * @param options Schema generation options
 * @returns Prisma schema string
 */
declare function generatePrismaSchema(options?: {
    includeCalibration?: boolean;
    includeMemory?: boolean;
    includeVersionControl?: boolean;
}): string;

/**
 * @sam-ai/adapter-prisma
 *
 * Prisma database adapter for SAM AI - connects SAM to any Prisma-supported database.
 * Provides implementations for all SAM storage interfaces.
 *
 * @packageDocumentation
 */

declare const VERSION = "0.1.0";

export { type PrismaClientLike, PrismaGoldenTestStore, type PrismaGoldenTestStoreConfig, PrismaMemoryStore, type PrismaMemoryStoreConfig, PrismaReviewScheduleStore, type PrismaReviewScheduleStoreConfig, PrismaSAMAdapter, type PrismaSAMAdapterConfig, PrismaSampleStore, type PrismaSampleStoreConfig, PrismaStudentProfileStore, type PrismaStudentProfileStoreConfig, type SAMPrismaAdapters, type SAMPrismaAdaptersConfig, SAM_PRISMA_MODELS, VERSION, createPrismaGoldenTestStore, createPrismaMemoryStore, createPrismaReviewScheduleStore, createPrismaSAMAdapter, createPrismaSampleStore, createPrismaStudentProfileStore, createSAMPrismaAdapters, generatePrismaSchema };
