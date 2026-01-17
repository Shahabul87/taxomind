/**
 * @sam-ai/agentic - Quality Tracker
 * Tracks response quality metrics and calibrates confidence
 */
import { QualityRecord, QualityRecordStore, QualityMetric, StudentFeedback, ExpertReview, LearningOutcome, CalibrationData, CalibrationStore, QualitySummary, SelfEvaluationLogger } from './types';
/**
 * In-memory implementation of QualityRecordStore
 */
export declare class InMemoryQualityRecordStore implements QualityRecordStore {
    private records;
    private responseIndex;
    private feedbackStore;
    private outcomeStore;
    get(id: string): Promise<QualityRecord | null>;
    getByResponse(responseId: string): Promise<QualityRecord | null>;
    getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
    create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
    update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
    recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
    private calculateCalibrationScore;
    private identifyImprovementAreas;
    private identifyStrengths;
}
/**
 * In-memory implementation of CalibrationStore
 */
export declare class InMemoryCalibrationStore implements CalibrationStore {
    private calibrations;
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
/**
 * Configuration for QualityTracker
 */
export interface QualityTrackerConfig {
    qualityStore?: QualityRecordStore;
    calibrationStore?: CalibrationStore;
    logger?: SelfEvaluationLogger;
    calibrationWindow?: number;
    minimumSamplesForCalibration?: number;
}
/**
 * Quality Tracker
 * Tracks response quality and calibrates confidence
 */
export declare class QualityTracker {
    private qualityStore;
    private calibrationStore;
    private logger;
    private calibrationWindow;
    private minimumSamplesForCalibration;
    constructor(config?: QualityTrackerConfig);
    /**
     * Record quality metrics for a response
     */
    recordQuality(responseId: string, userId: string, sessionId: string, metrics: QualityMetric[], confidenceScore?: number): Promise<QualityRecord>;
    /**
     * Record student feedback
     */
    recordFeedback(feedback: StudentFeedback): Promise<void>;
    /**
     * Record expert review
     */
    recordExpertReview(responseId: string, review: ExpertReview): Promise<void>;
    /**
     * Record learning outcome
     */
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    /**
     * Calculate calibration data
     */
    calculateCalibration(userId?: string, topic?: string): Promise<CalibrationData | null>;
    /**
     * Get quality summary
     */
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
    /**
     * Get calibration history
     */
    getCalibrationHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
    /**
     * Get latest calibration
     */
    getLatestCalibration(userId?: string, topic?: string): Promise<CalibrationData | null>;
    /**
     * Get quality record for a response
     */
    getQualityRecord(responseId: string): Promise<QualityRecord | null>;
    /**
     * Get user's quality history
     */
    getUserHistory(userId: string, limit?: number): Promise<QualityRecord[]>;
    /**
     * Create automated quality metrics from response analysis
     */
    createAutomatedMetrics(responseText: string, verificationAccuracy?: number, _confidenceScore?: number): QualityMetric[];
    private calculateOverallQuality;
    private deriveFeedbackMetrics;
    private deriveExpertMetrics;
    private deriveOutcomeMetrics;
    private calculateCalibrationBuckets;
    private analyzeClarity;
    private analyzeCompleteness;
}
/**
 * Create a new QualityTracker instance
 */
export declare function createQualityTracker(config?: QualityTrackerConfig): QualityTracker;
//# sourceMappingURL=quality-tracker.d.ts.map