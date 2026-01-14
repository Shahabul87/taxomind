import { SAMDatabaseAdapter, QueryOptions, SAMUser, SAMCourse, SAMChapter, SAMSection, SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress, SAMInteractionLog, SAMCourseAnalysis, TransactionContext } from '@sam-ai/core';
import { ConfidenceScoreStore, ConfidenceScore, ConfidenceLevel, VerificationResultStore, VerificationResult, IssueType, QualityRecordStore, QualityRecord, StudentFeedback, LearningOutcome, QualitySummary, CalibrationStore, CalibrationData, SelfCritiqueStore, SelfCritiqueResult, SelfCritiqueLoopResult, LearningPatternStore, LearningPattern, MetaLearningInsightStore, MetaLearningInsight, InsightType, InsightPriority, LearningStrategyStore, LearningStrategy, LearningEventStore, LearningEvent, AnalyticsPeriod, EventStats, JourneyTimelineStore, JourneyTimeline, JourneyEvent, JourneyEventType, JourneyMilestone, PresenceStore, UserPresence, PresenceStatus, PushQueueStore, PushDeliveryRequest, PushDeliveryResult, PushQueueStats, ToolExecutionEvent, ToolMetrics, ConfidencePredictionStore, ConfidencePrediction, ConfidenceOutcome, CalibrationMetrics, MemoryRetrievalEvent, MemoryQualityMetrics, PlanLifecycleEvent } from '@sam-ai/agentic';

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
 * @sam-ai/adapter-prisma - Self-Evaluation Stores
 * Prisma-backed implementations for confidence scoring, verification, quality tracking, and self-critique.
 */

interface PrismaSelfEvaluationStoreConfig {
    prisma: PrismaClient$5;
}
type PrismaClient$5 = {
    sAMSelfEvaluationScore: {
        create: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord | null>;
        findFirst: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord[]>;
        update: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord>;
    };
    sAMVerificationResult: {
        create: (args: Record<string, unknown>) => Promise<VerificationResultRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<VerificationResultRecord | null>;
        findFirst: (args: Record<string, unknown>) => Promise<VerificationResultRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<VerificationResultRecord[]>;
        update: (args: Record<string, unknown>) => Promise<VerificationResultRecord>;
    };
    sAMQualityRecord: {
        create: (args: Record<string, unknown>) => Promise<QualityRecordRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<QualityRecordRecord | null>;
        findFirst: (args: Record<string, unknown>) => Promise<QualityRecordRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<QualityRecordRecord[]>;
        update: (args: Record<string, unknown>) => Promise<QualityRecordRecord>;
    };
    sAMCalibrationData: {
        create: (args: Record<string, unknown>) => Promise<CalibrationRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<CalibrationRecord | null>;
        findFirst: (args: Record<string, unknown>) => Promise<CalibrationRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<CalibrationRecord[]>;
    };
    sAMSelfCritique: {
        create: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord | null>;
        findFirst: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord[]>;
        update: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord>;
    };
};
interface SelfEvaluationScoreRecord {
    id: string;
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: string;
    overallScore: number;
    level: string;
    factors: unknown;
    topic: string | null;
    complexity: string;
    shouldVerify: boolean;
    suggestedDisclaimer: string | null;
    alternativeApproaches: string[];
    scoredAt: Date;
    metadata: unknown;
}
interface VerificationResultRecord {
    id: string;
    userId: string;
    responseId: string;
    status: string;
    overallAccuracy: number;
    factChecks: unknown;
    totalClaims: number;
    verifiedClaims: number;
    contradictedClaims: number;
    sourceValidations: unknown;
    issues: unknown;
    corrections: unknown;
    verifiedAt: Date;
    expiresAt: Date | null;
}
interface QualityRecordRecord {
    id: string;
    userId: string;
    sessionId: string;
    responseId: string;
    metrics: unknown;
    overallQuality: number;
    confidenceScore: number | null;
    confidenceAccuracy: number | null;
    studentFeedback: unknown;
    expertReview: unknown;
    learningOutcome: unknown;
    recordedAt: Date;
    updatedAt: Date;
}
interface CalibrationRecord {
    id: string;
    userId: string | null;
    topic: string | null;
    totalResponses: number;
    expectedAccuracy: number;
    actualAccuracy: number;
    calibrationError: number;
    byConfidenceLevel: unknown;
    adjustmentFactor: number;
    adjustmentDirection: string;
    periodStart: Date;
    periodEnd: Date;
    calculatedAt: Date;
}
interface SelfCritiqueRecord {
    id: string;
    userId: string;
    responseId: string;
    overallScore: number;
    dimensionScores: unknown;
    findings: unknown;
    criticalFindings: number;
    majorFindings: number;
    minorFindings: number;
    improvements: unknown;
    topImprovements: unknown;
    iteration: number;
    previousScore: number | null;
    scoreImprovement: number | null;
    passed: boolean;
    passThreshold: number;
    requiresRevision: boolean;
    critiquedAt: Date;
    processingTimeMs: number;
}
declare class PrismaConfidenceScoreStore implements ConfidenceScoreStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
declare class PrismaVerificationResultStore implements VerificationResultStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationResult['issues']>;
}
declare class PrismaQualityRecordStore implements QualityRecordStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<QualityRecord | null>;
    getByResponse(responseId: string): Promise<QualityRecord | null>;
    getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
    create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
    update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
    recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
}
declare class PrismaCalibrationStore implements CalibrationStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
declare class PrismaSelfCritiqueStore implements SelfCritiqueStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<SelfCritiqueResult | null>;
    getByResponse(responseId: string): Promise<SelfCritiqueResult[]>;
    getByUser(userId: string, limit?: number): Promise<SelfCritiqueResult[]>;
    create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult>;
    update(id: string, updates: Partial<SelfCritiqueResult>): Promise<SelfCritiqueResult>;
    getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null>;
    saveLoopResult(result: SelfCritiqueLoopResult): Promise<void>;
}
declare function createPrismaSelfEvaluationStores(config: PrismaSelfEvaluationStoreConfig): {
    confidenceScore: PrismaConfidenceScoreStore;
    verificationResult: PrismaVerificationResultStore;
    qualityRecord: PrismaQualityRecordStore;
    calibration: PrismaCalibrationStore;
    selfCritique: PrismaSelfCritiqueStore;
};

/**
 * @sam-ai/adapter-prisma - Meta-Learning Stores
 * Prisma-backed implementations for meta-learning analytics.
 */

interface PrismaMetaLearningStoreConfig {
    prisma: PrismaClient$4;
}
type PrismaClient$4 = {
    sAMLearningPattern: {
        create: (args: Record<string, unknown>) => Promise<LearningPatternRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningPatternRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningPatternRecord[]>;
        update: (args: Record<string, unknown>) => Promise<LearningPatternRecord>;
    };
    sAMMetaLearningInsight: {
        create: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord[]>;
        update: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord>;
    };
    sAMLearningStrategy: {
        create: (args: Record<string, unknown>) => Promise<LearningStrategyRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningStrategyRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningStrategyRecord[]>;
        update: (args: Record<string, unknown>) => Promise<LearningStrategyRecord>;
    };
    sAMLearningEvent: {
        create: (args: Record<string, unknown>) => Promise<LearningEventRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningEventRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningEventRecord[]>;
    };
};
interface LearningPatternRecord {
    id: string;
    category: string;
    name: string;
    description: string;
    confidence: string;
    confidenceScore: number;
    occurrenceCount: number;
    sampleSize: number;
    significanceLevel: number;
    contexts: unknown;
    triggers: string[];
    outcomes: unknown;
    successRate: number;
    avgImpact: number;
    consistency: number;
    firstObserved: Date;
    lastObserved: Date;
    trend: string;
}
interface MetaLearningInsightRecord {
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    evidence: string[];
    recommendations: unknown;
    confidence: number;
    expectedImpact: number;
    affectedAreas: string[];
    timeframe: string;
    generatedAt: Date;
    validUntil: Date | null;
    processedAt: Date | null;
}
interface LearningStrategyRecord {
    id: string;
    name: string;
    description: string;
    effectivenessScore: number;
    successRate: number;
    engagementImpact: number;
    bestFor: unknown;
    notRecommendedFor: unknown;
    usageCount: number;
    lastUsed: Date;
    trend: string;
    avgOutcome: number;
    stdDevOutcome: number;
}
interface LearningEventRecord {
    id: string;
    userId: string;
    sessionId: string;
    eventType: string;
    timestamp: Date;
    courseId: string | null;
    sectionId: string | null;
    topic: string | null;
    duration: number | null;
    outcome: string | null;
    confidence: number | null;
    strategyId: string | null;
    strategyApplied: string | null;
    responseQuality: number | null;
    studentSatisfaction: number | null;
    metadata: unknown;
}
declare class PrismaLearningPatternStore implements LearningPatternStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningPattern | null>;
    getByCategory(category: LearningPattern['category']): Promise<LearningPattern[]>;
    getHighConfidence(minConfidence?: number): Promise<LearningPattern[]>;
    create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern>;
    update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
    getRecent(limit?: number): Promise<LearningPattern[]>;
}
declare class PrismaMetaLearningInsightStore implements MetaLearningInsightStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<MetaLearningInsight | null>;
    getByType(type: InsightType): Promise<MetaLearningInsight[]>;
    getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]>;
    getActive(): Promise<MetaLearningInsight[]>;
    create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight>;
    markProcessed(id: string): Promise<void>;
}
declare class PrismaLearningStrategyStore implements LearningStrategyStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningStrategy | null>;
    getAll(): Promise<LearningStrategy[]>;
    getTopPerforming(limit?: number): Promise<LearningStrategy[]>;
    create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
    update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy>;
    recordUsage(id: string, outcome: number): Promise<void>;
}
declare class PrismaLearningEventStore implements LearningEventStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningEvent | null>;
    getByUser(userId: string, since?: Date): Promise<LearningEvent[]>;
    create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
    getBySession(sessionId: string): Promise<LearningEvent[]>;
    getStats(userId?: string, period?: typeof AnalyticsPeriod[keyof typeof AnalyticsPeriod]): Promise<EventStats>;
}
declare function createPrismaMetaLearningStores(config: PrismaMetaLearningStoreConfig): {
    learningPattern: PrismaLearningPatternStore;
    metaLearningInsight: PrismaMetaLearningInsightStore;
    learningStrategy: PrismaLearningStrategyStore;
    learningEvent: PrismaLearningEventStore;
};

/**
 * @sam-ai/adapter-prisma - Journey Timeline Store
 * Prisma-backed implementation for learning journey timelines.
 */

interface PrismaJourneyTimelineStoreConfig {
    prisma: PrismaClient$3;
}
type PrismaClient$3 = {
    sAMJourneyTimeline: {
        findFirst: (args: Record<string, unknown>) => Promise<JourneyTimelineRecordWithRelations | null>;
        findUnique: (args: Record<string, unknown>) => Promise<JourneyTimelineRecordWithRelations | null>;
        create: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
        update: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
        delete: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
    };
    sAMJourneyEvent: {
        create: (args: Record<string, unknown>) => Promise<JourneyEventRecord>;
        findMany: (args: Record<string, unknown>) => Promise<JourneyEventRecord[]>;
    };
    sAMJourneyMilestone: {
        create: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord>;
        update: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord>;
        findMany: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord[]>;
    };
};
interface JourneyTimelineRecord {
    id: string;
    userId: string;
    courseId: string | null;
    currentPhase: string;
    statistics: unknown;
    createdAt: Date;
    updatedAt: Date;
}
interface JourneyEventRecord {
    id: string;
    timelineId: string;
    type: string;
    timestamp: Date;
    data: unknown;
    impact: unknown;
    relatedEntities: string[];
}
interface JourneyMilestoneRecord {
    id: string;
    timelineId: string;
    type: string;
    title: string;
    description: string;
    achievedAt: Date | null;
    progress: number;
    requirements: unknown;
    rewards: unknown;
}
interface JourneyTimelineRecordWithRelations extends JourneyTimelineRecord {
    events?: JourneyEventRecord[];
    milestones?: JourneyMilestoneRecord[];
}
declare class PrismaJourneyTimelineStore implements JourneyTimelineStore {
    private config;
    constructor(config: PrismaJourneyTimelineStoreConfig);
    getById(id: string): Promise<JourneyTimeline | null>;
    get(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    create(timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimeline>;
    update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline>;
    delete(id: string): Promise<boolean>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(_timelineId: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
}
declare function createPrismaJourneyTimelineStore(config: PrismaJourneyTimelineStoreConfig): PrismaJourneyTimelineStore;

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
 * @sam-ai/adapter-prisma - Presence Store
 * Database-backed implementation for user presence tracking
 */

interface PrismaPresenceStoreConfig {
    /** Prisma client instance */
    prisma: PrismaClient$2;
}
type PrismaClient$2 = {
    sAMUserPresence: {
        findUnique: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord[]>;
        upsert: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        update: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        delete: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
    };
};
interface PrismaPresenceRecord {
    id: string;
    userId: string;
    connectionId: string | null;
    status: string;
    lastActivityAt: Date;
    connectedAt: Date | null;
    deviceType: string;
    browser: string | null;
    os: string | null;
    pageUrl: string | null;
    courseId: string | null;
    chapterId: string | null;
    sectionId: string | null;
    planId: string | null;
    stepId: string | null;
    goalId: string | null;
    subscriptions: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare class PrismaPresenceStore implements PresenceStore {
    private prisma;
    constructor(config: PrismaPresenceStoreConfig);
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    deleteByConnection(connectionId: string): Promise<boolean>;
    getOnline(): Promise<UserPresence[]>;
    getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
    cleanup(olderThan: Date): Promise<number>;
}
declare function createPrismaPresenceStore(config: PrismaPresenceStoreConfig): PrismaPresenceStore;

/**
 * @sam-ai/adapter-prisma - Push Queue Store
 * Database-backed implementation for persistent push notification queue
 */

interface PrismaPushQueueStoreConfig {
    /** Prisma client instance */
    prisma: PrismaClient$1;
}
type PrismaClient$1 = {
    sAMPushQueue: {
        create: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord[]>;
        findUnique: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord | null>;
        update: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        updateMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
        delete: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
        count: (args?: Record<string, unknown>) => Promise<number>;
    };
    sAMPushDeliveryResult: {
        create: (args: Record<string, unknown>) => Promise<PrismaPushDeliveryResultRecord>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPushDeliveryResultRecord[]>;
        aggregate: (args: Record<string, unknown>) => Promise<{
            _avg: {
                processingTimeMs: number | null;
            };
        }>;
    };
};
interface PrismaPushQueueRecord {
    id: string;
    userId: string;
    eventType: string;
    eventPayload: unknown;
    eventId: string;
    priority: string;
    channels: string[];
    fallbackChannels: string[];
    status: string;
    attempts: number;
    maxAttempts: number;
    queuedAt: Date;
    processingAt: Date | null;
    lastAttemptAt: Date | null;
    expiresAt: Date | null;
    deliveredVia: string | null;
    deliveredAt: Date | null;
    acknowledgedAt: Date | null;
    error: string | null;
    metadata: unknown;
}
interface PrismaPushDeliveryResultRecord {
    id: string;
    queueItemId: string;
    userId: string;
    success: boolean;
    deliveredVia: string | null;
    attemptedChannels: string[];
    error: string | null;
    deliveredAt: Date;
    acknowledgedAt: Date | null;
    processingTimeMs: number | null;
}
declare class PrismaPushQueueStore implements PushQueueStore {
    private prisma;
    constructor(config: PrismaPushQueueStoreConfig);
    enqueue(request: PushDeliveryRequest): Promise<void>;
    dequeue(count: number): Promise<PushDeliveryRequest[]>;
    peek(count: number): Promise<PushDeliveryRequest[]>;
    acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
    requeue(request: PushDeliveryRequest): Promise<void>;
    getStats(): Promise<PushQueueStats>;
    cleanup(olderThan: Date): Promise<number>;
    /**
     * Get queue items for a specific user
     */
    getByUser(userId: string, status?: string): Promise<PushDeliveryRequest[]>;
    /**
     * Get a specific queue item by ID
     */
    get(id: string): Promise<PushDeliveryRequest | null>;
    /**
     * Cancel a pending queue item
     */
    cancel(id: string): Promise<boolean>;
}
declare function createPrismaPushQueueStore(config: PrismaPushQueueStoreConfig): PrismaPushQueueStore;

/**
 * @sam-ai/adapter-prisma - Observability Store
 * Database-backed implementation for metrics, tool telemetry, and confidence calibration
 */

interface PrismaObservabilityStoreConfig {
    prisma: PrismaClient;
}
type PrismaClient = {
    sAMMetric: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
        groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
    };
    sAMToolExecution: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        update: (args: Record<string, unknown>) => Promise<unknown>;
        findUnique: (args: Record<string, unknown>) => Promise<ToolExecutionRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<ToolExecutionRecord[]>;
        count: (args: Record<string, unknown>) => Promise<number>;
        aggregate: (args: Record<string, unknown>) => Promise<unknown>;
        groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
    };
    sAMConfidenceScore: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        update: (args: Record<string, unknown>) => Promise<unknown>;
        findUnique: (args: Record<string, unknown>) => Promise<ConfidenceRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<ConfidenceRecord[]>;
        count: (args: Record<string, unknown>) => Promise<number>;
        aggregate: (args: Record<string, unknown>) => Promise<unknown>;
    };
    sAMMemoryRetrieval: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        update: (args: Record<string, unknown>) => Promise<unknown>;
        findMany: (args: Record<string, unknown>) => Promise<MemoryRetrievalRecord[]>;
        count: (args: Record<string, unknown>) => Promise<number>;
        aggregate: (args: Record<string, unknown>) => Promise<unknown>;
        groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
    };
    sAMPlanLifecycleEvent: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
        findMany: (args: Record<string, unknown>) => Promise<PlanEventRecord[]>;
        count: (args: Record<string, unknown>) => Promise<number>;
        groupBy: (args: Record<string, unknown>) => Promise<unknown[]>;
    };
    sAMAggregatedMetrics: {
        upsert: (args: Record<string, unknown>) => Promise<unknown>;
        findMany: (args: Record<string, unknown>) => Promise<AggregatedMetricsRecord[]>;
    };
};
interface ToolExecutionRecord {
    id: string;
    toolId: string;
    toolName: string;
    userId: string;
    sessionId: string | null;
    planId: string | null;
    stepId: string | null;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    durationMs: number | null;
    confirmationRequired: boolean;
    confirmationGiven: boolean | null;
    inputSummary: string | null;
    outputSummary: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    errorRetryable: boolean | null;
    tags: Record<string, string> | null;
    createdAt: Date;
}
interface ConfidenceRecord {
    id: string;
    userId: string;
    sessionId: string | null;
    responseId: string;
    responseType: string;
    predictedConfidence: number;
    factors: unknown;
    predictedAt: Date;
    accurate: boolean | null;
    userVerified: boolean | null;
    verificationMethod: string | null;
    qualityScore: number | null;
    outcomeRecordedAt: Date | null;
    outcomeNotes: string | null;
    metadata: unknown;
}
interface MemoryRetrievalRecord {
    id: string;
    userId: string;
    sessionId: string | null;
    query: string;
    source: string;
    resultCount: number;
    topRelevanceScore: number;
    avgRelevanceScore: number;
    cacheHit: boolean;
    latencyMs: number;
    feedbackHelpful: boolean | null;
    feedbackRating: number | null;
    feedbackComment: string | null;
    feedbackProvidedAt: Date | null;
    metadata: unknown;
    timestamp: Date;
}
interface PlanEventRecord {
    id: string;
    planId: string;
    userId: string;
    eventType: string;
    stepId: string | null;
    previousState: string | null;
    newState: string | null;
    metadata: unknown;
    timestamp: Date;
}
interface AggregatedMetricsRecord {
    id: string;
    metricType: string;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    data: unknown;
    createdAt: Date;
}
declare class PrismaToolTelemetryStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordExecution(event: ToolExecutionEvent): Promise<void>;
    updateExecution(executionId: string, updates: Partial<ToolExecutionEvent>): Promise<void>;
    getExecution(executionId: string): Promise<ToolExecutionEvent | null>;
    getMetrics(periodStart: Date, periodEnd: Date, toolId?: string): Promise<ToolMetrics>;
    /**
     * Query tool executions with filters
     */
    queryExecutions(options: {
        startTime?: Date;
        endTime?: Date;
        toolId?: string;
        toolName?: string;
        userId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ToolExecutionEvent[]>;
    /**
     * Count tool executions matching filters
     */
    countExecutions(options: {
        startTime?: Date;
        endTime?: Date;
        toolId?: string;
        userId?: string;
        status?: string;
    }): Promise<number>;
    private mapRecordToEvent;
}
declare class PrismaConfidenceCalibrationStore implements ConfidencePredictionStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    private calculateCalibrationBuckets;
    private calculateMetricsByType;
}
declare class PrismaMemoryQualityStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordRetrieval(event: MemoryRetrievalEvent): Promise<void>;
    recordFeedback(retrievalId: string, helpful: boolean, rating?: number, comment?: string): Promise<void>;
    getQualityMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    private calculateSourceMetrics;
}
declare class PrismaPlanLifecycleStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordEvent(event: PlanLifecycleEvent): Promise<void>;
    getEvents(planId: string, limit?: number): Promise<PlanLifecycleEvent[]>;
    getUserEvents(userId: string, periodStart: Date, periodEnd: Date): Promise<PlanLifecycleEvent[]>;
    private mapRecordToEvent;
}
declare class PrismaMetricsStore {
    private prisma;
    constructor(config: PrismaObservabilityStoreConfig);
    recordMetric(name: string, value: number, labels?: Record<string, string>, userId?: string, sessionId?: string): Promise<void>;
    getMetrics(name: string, periodStart: Date, periodEnd: Date, userId?: string): Promise<Array<{
        value: number;
        timestamp: Date;
        labels: Record<string, string>;
    }>>;
    cleanup(olderThan: Date): Promise<number>;
}
declare function createPrismaObservabilityStores(config: PrismaObservabilityStoreConfig): {
    toolTelemetry: PrismaToolTelemetryStore;
    confidenceCalibration: PrismaConfidenceCalibrationStore;
    memoryQuality: PrismaMemoryQualityStore;
    planLifecycle: PrismaPlanLifecycleStore;
    metrics: PrismaMetricsStore;
};

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

export { PrismaCalibrationStore, type PrismaClientLike, PrismaConfidenceCalibrationStore, PrismaConfidenceScoreStore, PrismaGoldenTestStore, type PrismaGoldenTestStoreConfig, PrismaJourneyTimelineStore, type PrismaJourneyTimelineStoreConfig, PrismaLearningEventStore, PrismaLearningPatternStore, PrismaLearningStrategyStore, PrismaMemoryQualityStore, PrismaMemoryStore, type PrismaMemoryStoreConfig, PrismaMetaLearningInsightStore, type PrismaMetaLearningStoreConfig, PrismaMetricsStore, type PrismaObservabilityStoreConfig, PrismaPlanLifecycleStore, PrismaPresenceStore, type PrismaPresenceStoreConfig, PrismaPushQueueStore, type PrismaPushQueueStoreConfig, PrismaQualityRecordStore, PrismaReviewScheduleStore, type PrismaReviewScheduleStoreConfig, PrismaSAMAdapter, type PrismaSAMAdapterConfig, PrismaSampleStore, type PrismaSampleStoreConfig, PrismaSelfCritiqueStore, type PrismaSelfEvaluationStoreConfig, PrismaStudentProfileStore, type PrismaStudentProfileStoreConfig, PrismaToolTelemetryStore, PrismaVerificationResultStore, type SAMPrismaAdapters, type SAMPrismaAdaptersConfig, SAM_PRISMA_MODELS, VERSION, createPrismaGoldenTestStore, createPrismaJourneyTimelineStore, createPrismaMemoryStore, createPrismaMetaLearningStores, createPrismaObservabilityStores, createPrismaPresenceStore, createPrismaPushQueueStore, createPrismaReviewScheduleStore, createPrismaSAMAdapter, createPrismaSampleStore, createPrismaSelfEvaluationStores, createPrismaStudentProfileStore, createSAMPrismaAdapters, generatePrismaSchema };
