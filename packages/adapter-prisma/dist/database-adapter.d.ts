/**
 * Prisma SAM Database Adapter
 *
 * Generic implementation of SAMDatabaseAdapter using Prisma Client.
 * Works with any Prisma schema that includes the required SAM models.
 */
import type { SAMDatabaseAdapter, SAMUser, SAMCourse, SAMChapter, SAMSection, SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress, SAMInteractionLog, SAMCourseAnalysis, QueryOptions, TransactionContext } from '@sam-ai/core';
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
export interface PrismaClientLike {
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
export interface PrismaSAMAdapterConfig {
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
export declare class PrismaSAMAdapter implements SAMDatabaseAdapter {
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
export declare function createPrismaSAMAdapter(config: PrismaSAMAdapterConfig): SAMDatabaseAdapter;
export {};
//# sourceMappingURL=database-adapter.d.ts.map