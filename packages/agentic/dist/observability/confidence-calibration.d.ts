/**
 * @sam-ai/agentic - Confidence Calibration Tracker
 * Tracks confidence predictions vs actual outcomes for calibration
 */
import type { ConfidencePrediction, ConfidenceOutcome, ConfidenceFactor, ConfidencePredictionStore, CalibrationMetrics, ObservabilityLogger } from './types';
import { ResponseType, VerificationMethod } from './types';
export declare class InMemoryConfidencePredictionStore implements ConfidencePredictionStore {
    private predictions;
    private readonly maxPredictions;
    constructor(maxPredictions?: number);
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    private calculateBuckets;
    private calculateOverrideRate;
    private calculateByResponseType;
    clear(): void;
}
export interface CalibrationConfig {
    /** Enable tracking */
    enabled: boolean;
    /** Sample rate (0-1) */
    sampleRate: number;
    /** Max predictions to store */
    maxPredictions: number;
    /** Number of buckets for calibration */
    bucketCount: number;
    /** Alert on high calibration error */
    calibrationErrorThreshold: number;
}
export declare const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig;
export declare class ConfidenceCalibrationTracker {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly alertListeners;
    constructor(options: {
        store?: ConfidencePredictionStore;
        config?: Partial<CalibrationConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Record a confidence prediction
     */
    recordPrediction(params: {
        userId: string;
        sessionId?: string;
        responseId: string;
        responseType: ResponseType;
        predictedConfidence: number;
        factors: ConfidenceFactor[];
    }): Promise<string>;
    /**
     * Record the actual outcome for a prediction
     */
    recordOutcome(predictionId: string, params: {
        accurate: boolean;
        userVerified: boolean;
        verificationMethod: VerificationMethod;
        qualityScore?: number;
        notes?: string;
    }): Promise<void>;
    /**
     * Record outcome from user feedback
     */
    recordUserFeedback(predictionId: string, helpful: boolean, rating?: number): Promise<void>;
    getPrediction(predictionId: string): Promise<ConfidencePrediction | null>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    /**
     * Get metrics for the last N days
     */
    getRecentMetrics(days?: number): Promise<CalibrationMetrics>;
    /**
     * Get calibration summary
     */
    getCalibrationSummary(): Promise<CalibrationSummary>;
    private checkCalibrationAlerts;
    /**
     * Subscribe to calibration alerts
     */
    onAlert(callback: (alert: CalibrationAlert) => void): () => void;
    private emitAlert;
    private shouldSample;
}
export interface CalibrationSummary {
    calibrationQuality: 'excellent' | 'good' | 'fair' | 'poor';
    calibrationError: number;
    brierScore: number;
    sampleSize: number;
    recommendations: string[];
    lastUpdated: Date;
}
export interface CalibrationAlert {
    type: 'high_calibration_error' | 'calibration_drift';
    message: string;
    predictionId?: string;
    calibrationError: number;
    threshold: number;
}
export declare function createConfidenceCalibrationTracker(options?: {
    store?: ConfidencePredictionStore;
    config?: Partial<CalibrationConfig>;
    logger?: ObservabilityLogger;
}): ConfidenceCalibrationTracker;
export declare function createInMemoryConfidencePredictionStore(maxPredictions?: number): InMemoryConfidencePredictionStore;
//# sourceMappingURL=confidence-calibration.d.ts.map