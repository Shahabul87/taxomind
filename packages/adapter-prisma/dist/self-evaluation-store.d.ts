/**
 * @sam-ai/adapter-prisma - Self-Evaluation Stores
 * Prisma-backed implementations for confidence scoring, verification, quality tracking, and self-critique.
 */
import type { ConfidenceScore, ConfidenceScoreStore, VerificationResult, VerificationResultStore, QualityRecord, QualityRecordStore, CalibrationData, CalibrationStore, SelfCritiqueResult, SelfCritiqueStore, SelfCritiqueLoopResult, IssueType, ConfidenceLevel, StudentFeedback, LearningOutcome, QualitySummary } from '@sam-ai/agentic';
export interface PrismaSelfEvaluationStoreConfig {
    prisma: PrismaClient;
}
type PrismaClient = {
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
export declare class PrismaConfidenceScoreStore implements ConfidenceScoreStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
export declare class PrismaVerificationResultStore implements VerificationResultStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationResult['issues']>;
}
export declare class PrismaQualityRecordStore implements QualityRecordStore {
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
export declare class PrismaCalibrationStore implements CalibrationStore {
    private config;
    constructor(config: PrismaSelfEvaluationStoreConfig);
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
export declare class PrismaSelfCritiqueStore implements SelfCritiqueStore {
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
export declare function createPrismaSelfEvaluationStores(config: PrismaSelfEvaluationStoreConfig): {
    confidenceScore: PrismaConfidenceScoreStore;
    verificationResult: PrismaVerificationResultStore;
    qualityRecord: PrismaQualityRecordStore;
    calibration: PrismaCalibrationStore;
    selfCritique: PrismaSelfCritiqueStore;
};
export {};
//# sourceMappingURL=self-evaluation-store.d.ts.map