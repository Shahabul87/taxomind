/**
 * Prisma Review Schedule Store
 *
 * Database-backed implementation for spaced repetition review schedules.
 */
export interface ReviewScheduleEntry {
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
export interface ReviewScheduleStore {
    save(entry: ReviewScheduleEntry): Promise<void>;
    get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null>;
    getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]>;
    delete(studentId: string, topicId: string): Promise<void>;
}
export interface PrismaReviewScheduleStoreConfig {
    prisma: any;
    tableName?: string;
}
export declare class PrismaReviewScheduleStore implements ReviewScheduleStore {
    private prisma;
    private tableName;
    constructor(config: PrismaReviewScheduleStoreConfig);
    save(entry: ReviewScheduleEntry): Promise<void>;
    get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null>;
    getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]>;
    delete(studentId: string, topicId: string): Promise<void>;
}
export declare function createPrismaReviewScheduleStore(config: PrismaReviewScheduleStoreConfig): PrismaReviewScheduleStore;
//# sourceMappingURL=review-schedule-store.d.ts.map