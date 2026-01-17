/**
 * In-Memory SAM Database Adapter
 *
 * A memory-based implementation of SAMDatabaseAdapter for:
 * - Testing and development
 * - Standalone SAM usage without a database
 * - Prototyping and demos
 */
import type { SAMDatabaseAdapter, SAMUser, SAMCourse, SAMChapter, SAMSection, SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress, SAMInteractionLog, SAMCourseAnalysis, QueryOptions, TransactionContext } from './database';
export interface InMemoryDatabaseOptions {
    /** Seed data to initialize with */
    seed?: {
        users?: SAMUser[];
        courses?: SAMCourse[];
        questions?: SAMQuestion[];
    };
    /** Enable persistence to localStorage (browser only) */
    persistToLocalStorage?: boolean;
    /** localStorage key prefix */
    storageKeyPrefix?: string;
}
/**
 * In-memory implementation of SAMDatabaseAdapter
 *
 * Stores all data in memory maps. Useful for:
 * - Unit testing
 * - Local development without database
 * - Standalone SAM demos
 *
 * @example
 * ```typescript
 * const dbAdapter = new InMemoryDatabaseAdapter({
 *   seed: {
 *     users: [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }],
 *   },
 * });
 * ```
 */
export declare class InMemoryDatabaseAdapter implements SAMDatabaseAdapter {
    private users;
    private courses;
    private chapters;
    private sections;
    private questions;
    private bloomsProgress;
    private cognitiveProgress;
    private interactions;
    private courseAnalysis;
    private idCounter;
    private options;
    constructor(options?: InMemoryDatabaseOptions);
    private generateId;
    findUser(id: string): Promise<SAMUser | null>;
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
    /**
     * Clear all data from memory
     */
    clear(): void;
    /**
     * Add a user to the store
     */
    addUser(user: SAMUser): void;
    /**
     * Add a course to the store
     */
    addCourse(course: SAMCourse): void;
    /**
     * Get all stored data (for debugging/export)
     */
    getData(): {
        users: SAMUser[];
        courses: SAMCourse[];
        questions: SAMQuestion[];
        interactions: SAMInteractionLog[];
    };
    private applyQueryOptions;
    private persist;
    private loadFromStorage;
}
/**
 * Create an in-memory SAM database adapter
 *
 * @example
 * ```typescript
 * // Simple usage
 * const dbAdapter = createInMemoryDatabase();
 *
 * // With seed data
 * const dbAdapter = createInMemoryDatabase({
 *   seed: {
 *     users: [{ id: 'demo-user', name: 'Demo', email: 'demo@example.com' }],
 *   },
 * });
 *
 * // With localStorage persistence (browser)
 * const dbAdapter = createInMemoryDatabase({
 *   persistToLocalStorage: true,
 * });
 * ```
 */
export declare function createInMemoryDatabase(options?: InMemoryDatabaseOptions): InMemoryDatabaseAdapter;
export default InMemoryDatabaseAdapter;
//# sourceMappingURL=memory-database.d.ts.map