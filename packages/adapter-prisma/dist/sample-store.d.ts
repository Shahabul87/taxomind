/**
 * Prisma Calibration Sample Store
 *
 * Database-backed implementation for calibration samples.
 */
export interface CalibrationSample {
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
export interface EvaluationContext {
    contentType: string;
    subject?: string;
    bloomsLevel?: string;
    difficulty?: string;
    studentId?: string;
    courseId?: string;
}
export interface VersionInfo {
    configVersion: string;
    promptVersion: string;
    modelVersion: string;
}
export interface HumanReview {
    score: number;
    feedback?: string;
    reason?: string;
    reviewerId?: string;
}
export interface SampleStatistics {
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
export interface CalibrationSampleStore {
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
export interface PrismaSampleStoreConfig {
    prisma: any;
    tableName?: string;
}
export declare class PrismaSampleStore implements CalibrationSampleStore {
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
export declare function createPrismaSampleStore(config: PrismaSampleStoreConfig): PrismaSampleStore;
//# sourceMappingURL=sample-store.d.ts.map