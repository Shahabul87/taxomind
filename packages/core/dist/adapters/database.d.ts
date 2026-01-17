/**
 * SAM Database Adapter Interface
 *
 * This adapter abstracts database operations to make @sam-ai/core portable.
 * Implement this interface to connect SAM to any database system.
 */
/**
 * Common query options for database operations
 */
export interface QueryOptions {
    /** Include related entities */
    include?: Record<string, boolean | object>;
    /** Select specific fields */
    select?: Record<string, boolean>;
    /** Limit number of results */
    limit?: number;
    /** Skip results for pagination */
    offset?: number;
    /** Order by fields */
    orderBy?: Record<string, 'asc' | 'desc'>;
}
/**
 * Result of count operations
 */
export interface CountResult {
    count: number;
}
/**
 * Basic user information for SAM context
 */
export interface SAMUser {
    id: string;
    name: string | null;
    email: string | null;
    role?: string;
    preferences?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Course entity for educational context
 */
export interface SAMCourse {
    id: string;
    title: string;
    description: string | null;
    imageUrl?: string | null;
    categoryId?: string | null;
    userId: string;
    isPublished: boolean;
    chapters?: SAMChapter[];
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Chapter entity (also called Section in some systems)
 */
export interface SAMChapter {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    courseId: string;
    sections?: SAMSection[];
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Section entity for granular content organization
 */
export interface SAMSection {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    position: number;
    isPublished: boolean;
    chapterId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Question from question bank
 */
export interface SAMQuestion {
    id: string;
    question: string;
    answer?: string | null;
    options?: string[] | null;
    questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank';
    bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    courseId: string;
    chapterId?: string | null;
    sectionId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Student progress on Bloom's taxonomy levels
 */
export interface SAMBloomsProgress {
    id: string;
    userId: string;
    courseId: string;
    rememberScore: number;
    understandScore: number;
    applyScore: number;
    analyzeScore: number;
    evaluateScore: number;
    createScore: number;
    overallScore: number;
    assessmentCount: number;
    lastAssessedAt?: Date;
    updatedAt?: Date;
}
/**
 * Cognitive skill progress for adaptive learning
 */
export interface SAMCognitiveProgress {
    id: string;
    userId: string;
    skillType: string;
    proficiencyLevel: number;
    totalAttempts: number;
    successfulAttempts: number;
    averageTimeSeconds: number;
    lastPracticedAt?: Date;
    updatedAt?: Date;
}
/**
 * SAM interaction log for analytics
 */
export interface SAMInteractionLog {
    id: string;
    userId: string;
    sessionId?: string | null;
    pageType: string;
    pagePath: string;
    query: string;
    response: string;
    enginesUsed: string[];
    responseTimeMs: number;
    tokenCount?: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
/**
 * Course-level Bloom's analysis
 */
export interface SAMCourseAnalysis {
    id: string;
    courseId: string;
    rememberPercentage: number;
    understandPercentage: number;
    applyPercentage: number;
    analyzePercentage: number;
    evaluatePercentage: number;
    createPercentage: number;
    totalObjectives: number;
    overallScore: number;
    recommendations?: string[];
    gaps?: string[];
    analyzedAt: Date;
    updatedAt?: Date;
}
/**
 * SAM Database Adapter Interface
 *
 * Implement this interface to connect SAM to your database system.
 * All methods return promises and use platform-agnostic types.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { SAMDatabaseAdapter } from '@sam-ai/core';
 *
 * export class PrismaSAMAdapter implements SAMDatabaseAdapter {
 *   constructor(private prisma: PrismaClient) {}
 *
 *   async findUser(id: string) {
 *     return this.prisma.user.findUnique({ where: { id } });
 *   }
 *   // ... implement other methods
 * }
 * ```
 */
export interface SAMDatabaseAdapter {
    /**
     * Find a user by ID
     */
    findUser(id: string, options?: QueryOptions): Promise<SAMUser | null>;
    /**
     * Find multiple users
     */
    findUsers(filter: Partial<SAMUser>, options?: QueryOptions): Promise<SAMUser[]>;
    /**
     * Update user data
     */
    updateUser(id: string, data: Partial<SAMUser>): Promise<SAMUser>;
    /**
     * Find a course by ID with optional includes
     */
    findCourse(id: string, options?: QueryOptions): Promise<SAMCourse | null>;
    /**
     * Find multiple courses
     */
    findCourses(filter: Partial<SAMCourse>, options?: QueryOptions): Promise<SAMCourse[]>;
    /**
     * Find a chapter by ID
     */
    findChapter(id: string, options?: QueryOptions): Promise<SAMChapter | null>;
    /**
     * Find chapters by course ID
     */
    findChaptersByCourse(courseId: string, options?: QueryOptions): Promise<SAMChapter[]>;
    /**
     * Find a section by ID
     */
    findSection(id: string, options?: QueryOptions): Promise<SAMSection | null>;
    /**
     * Find sections by chapter ID
     */
    findSectionsByChapter(chapterId: string, options?: QueryOptions): Promise<SAMSection[]>;
    /**
     * Find questions by filter criteria
     */
    findQuestions(filter: Partial<SAMQuestion>, options?: QueryOptions): Promise<SAMQuestion[]>;
    /**
     * Create a new question
     */
    createQuestion(data: Omit<SAMQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<SAMQuestion>;
    /**
     * Update an existing question
     */
    updateQuestion(id: string, data: Partial<SAMQuestion>): Promise<SAMQuestion>;
    /**
     * Delete a question
     */
    deleteQuestion(id: string): Promise<void>;
    /**
     * Find student's Bloom's progress for a course
     */
    findBloomsProgress(userId: string, courseId: string): Promise<SAMBloomsProgress | null>;
    /**
     * Create or update Bloom's progress
     */
    upsertBloomsProgress(userId: string, courseId: string, data: Partial<SAMBloomsProgress>): Promise<SAMBloomsProgress>;
    /**
     * Find cognitive skill progress
     */
    findCognitiveProgress(userId: string, skillType: string): Promise<SAMCognitiveProgress | null>;
    /**
     * Create or update cognitive progress
     */
    upsertCognitiveProgress(userId: string, skillType: string, data: Partial<SAMCognitiveProgress>): Promise<SAMCognitiveProgress>;
    /**
     * Log a SAM interaction
     */
    logInteraction(data: Omit<SAMInteractionLog, 'id' | 'createdAt'>): Promise<SAMInteractionLog>;
    /**
     * Find interactions by user
     */
    findInteractions(userId: string, options?: QueryOptions): Promise<SAMInteractionLog[]>;
    /**
     * Count interactions with optional filter
     */
    countInteractions(filter?: {
        userId?: string;
        pageType?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<number>;
    /**
     * Find course-level Bloom's analysis
     */
    findCourseAnalysis(courseId: string): Promise<SAMCourseAnalysis | null>;
    /**
     * Create or update course analysis
     */
    upsertCourseAnalysis(courseId: string, data: Partial<SAMCourseAnalysis>): Promise<SAMCourseAnalysis>;
    /**
     * Check if database connection is healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Begin a database transaction (optional)
     * Returns a transaction context that can be passed to other methods
     */
    beginTransaction?(): Promise<TransactionContext>;
    /**
     * Commit a transaction (optional)
     */
    commitTransaction?(context: TransactionContext): Promise<void>;
    /**
     * Rollback a transaction (optional)
     */
    rollbackTransaction?(context: TransactionContext): Promise<void>;
}
/**
 * Transaction context for database operations
 */
export interface TransactionContext {
    id: string;
    startedAt: Date;
    /** Platform-specific transaction object */
    _internal?: unknown;
}
/**
 * Options for creating a database adapter
 */
export interface DatabaseAdapterOptions {
    /** Enable debug logging */
    debug?: boolean;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Maximum number of connections (for pool-based adapters) */
    maxConnections?: number;
    /** Retry configuration */
    retry?: {
        maxAttempts: number;
        delayMs: number;
    };
}
/**
 * No-operation database adapter for testing or when no database is available.
 * All read operations return null/empty, all write operations are no-ops.
 */
export declare class NoopDatabaseAdapter implements SAMDatabaseAdapter {
    findUser(): Promise<null>;
    findUsers(): Promise<SAMUser[]>;
    updateUser(_id: string, data: Partial<SAMUser>): Promise<SAMUser>;
    findCourse(): Promise<null>;
    findCourses(): Promise<SAMCourse[]>;
    findChapter(): Promise<null>;
    findChaptersByCourse(): Promise<SAMChapter[]>;
    findSection(): Promise<null>;
    findSectionsByChapter(): Promise<SAMSection[]>;
    findQuestions(): Promise<SAMQuestion[]>;
    createQuestion(data: Omit<SAMQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<SAMQuestion>;
    updateQuestion(id: string, data: Partial<SAMQuestion>): Promise<SAMQuestion>;
    deleteQuestion(): Promise<void>;
    findBloomsProgress(): Promise<null>;
    upsertBloomsProgress(userId: string, courseId: string, data: Partial<SAMBloomsProgress>): Promise<SAMBloomsProgress>;
    findCognitiveProgress(): Promise<null>;
    upsertCognitiveProgress(userId: string, skillType: string, data: Partial<SAMCognitiveProgress>): Promise<SAMCognitiveProgress>;
    logInteraction(data: Omit<SAMInteractionLog, 'id' | 'createdAt'>): Promise<SAMInteractionLog>;
    findInteractions(): Promise<SAMInteractionLog[]>;
    countInteractions(): Promise<number>;
    findCourseAnalysis(): Promise<null>;
    upsertCourseAnalysis(courseId: string, data: Partial<SAMCourseAnalysis>): Promise<SAMCourseAnalysis>;
    healthCheck(): Promise<boolean>;
}
/**
 * Create a no-operation database adapter
 */
export declare function createNoopDatabaseAdapter(): SAMDatabaseAdapter;
//# sourceMappingURL=database.d.ts.map