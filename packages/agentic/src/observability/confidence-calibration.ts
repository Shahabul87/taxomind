/**
 * @sam-ai/agentic - Confidence Calibration Tracker
 * Tracks confidence predictions vs actual outcomes for calibration
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ConfidencePrediction,
  ConfidenceOutcome,
  ConfidenceFactor,
  ConfidencePredictionStore,
  CalibrationMetrics,
  CalibrationBucket,
  TypeCalibration,
  ObservabilityLogger,
} from './types';
import { ResponseType, VerificationMethod } from './types';

// ============================================================================
// IN-MEMORY CONFIDENCE PREDICTION STORE
// ============================================================================

export class InMemoryConfidencePredictionStore implements ConfidencePredictionStore {
  private predictions: Map<string, ConfidencePrediction> = new Map();
  private readonly maxPredictions: number;

  constructor(maxPredictions: number = 10000) {
    this.maxPredictions = maxPredictions;
  }

  async record(prediction: ConfidencePrediction): Promise<void> {
    if (this.predictions.size >= this.maxPredictions) {
      const oldestKey = this.predictions.keys().next().value;
      if (oldestKey) {
        this.predictions.delete(oldestKey);
      }
    }
    this.predictions.set(prediction.predictionId, prediction);
  }

  async getById(predictionId: string): Promise<ConfidencePrediction | null> {
    return this.predictions.get(predictionId) ?? null;
  }

  async recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void> {
    const prediction = this.predictions.get(predictionId);
    if (prediction) {
      prediction.actualOutcome = outcome;
    }
  }

  async getCalibrationMetrics(
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalibrationMetrics> {
    const predictions = Array.from(this.predictions.values()).filter(
      (p) => p.predictedAt >= periodStart && p.predictedAt <= periodEnd
    );

    const withOutcomes = predictions.filter((p) => p.actualOutcome !== undefined);

    // Calculate overall metrics
    const avgPredictedConfidence =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / predictions.length
        : 0;

    const avgActualAccuracy =
      withOutcomes.length > 0
        ? withOutcomes.reduce(
            (sum, p) => sum + (p.actualOutcome!.accurate ? 1 : 0),
            0
          ) / withOutcomes.length
        : 0;

    // Calculate calibration error
    const calibrationError = Math.abs(avgPredictedConfidence - avgActualAccuracy);

    // Calculate Brier score
    const brierScore =
      withOutcomes.length > 0
        ? withOutcomes.reduce((sum, p) => {
            const actual = p.actualOutcome!.accurate ? 1 : 0;
            return sum + Math.pow(p.predictedConfidence - actual, 2);
          }, 0) / withOutcomes.length
        : 0;

    // Calculate calibration buckets
    const calibrationBuckets = this.calculateBuckets(withOutcomes);

    // Calculate verification override rate
    const verificationOverrideRate = this.calculateOverrideRate(withOutcomes);

    // Calculate by response type
    const byResponseType = this.calculateByResponseType(predictions, withOutcomes);

    return {
      predictionCount: predictions.length,
      outcomesRecorded: withOutcomes.length,
      avgPredictedConfidence,
      avgActualAccuracy,
      calibrationError,
      brierScore,
      calibrationBuckets,
      verificationOverrideRate,
      byResponseType,
      periodStart,
      periodEnd,
    };
  }

  private calculateBuckets(withOutcomes: ConfidencePrediction[]): CalibrationBucket[] {
    const buckets: CalibrationBucket[] = [];
    const bucketRanges = [
      [0.0, 0.1],
      [0.1, 0.2],
      [0.2, 0.3],
      [0.3, 0.4],
      [0.4, 0.5],
      [0.5, 0.6],
      [0.6, 0.7],
      [0.7, 0.8],
      [0.8, 0.9],
      [0.9, 1.0],
    ];

    for (const [rangeStart, rangeEnd] of bucketRanges) {
      const inBucket = withOutcomes.filter(
        (p) => p.predictedConfidence >= rangeStart && p.predictedConfidence < rangeEnd
      );

      if (inBucket.length === 0) {
        buckets.push({
          rangeStart,
          rangeEnd,
          count: 0,
          avgPredicted: 0,
          actualAccuracy: 0,
          error: 0,
        });
        continue;
      }

      const avgPredicted =
        inBucket.reduce((sum, p) => sum + p.predictedConfidence, 0) / inBucket.length;

      const actualAccuracy =
        inBucket.reduce((sum, p) => sum + (p.actualOutcome!.accurate ? 1 : 0), 0) /
        inBucket.length;

      buckets.push({
        rangeStart,
        rangeEnd,
        count: inBucket.length,
        avgPredicted,
        actualAccuracy,
        error: Math.abs(avgPredicted - actualAccuracy),
      });
    }

    return buckets;
  }

  private calculateOverrideRate(withOutcomes: ConfidencePrediction[]): number {
    // Override = high confidence but wrong, or low confidence but right
    const overrides = withOutcomes.filter((p) => {
      const confident = p.predictedConfidence >= 0.7;
      const accurate = p.actualOutcome!.accurate;
      return (confident && !accurate) || (!confident && accurate);
    });

    return withOutcomes.length > 0 ? overrides.length / withOutcomes.length : 0;
  }

  private calculateByResponseType(
    predictions: ConfidencePrediction[],
    withOutcomes: ConfidencePrediction[]
  ): Record<ResponseType, TypeCalibration> {
    const types = Object.values(ResponseType);
    const result: Record<ResponseType, TypeCalibration> = {} as Record<
      ResponseType,
      TypeCalibration
    >;

    for (const type of types) {
      const typePredictions = predictions.filter((p) => p.responseType === type);
      const typeWithOutcomes = withOutcomes.filter((p) => p.responseType === type);

      const avgPredictedConfidence =
        typePredictions.length > 0
          ? typePredictions.reduce((sum, p) => sum + p.predictedConfidence, 0) /
            typePredictions.length
          : 0;

      const avgActualAccuracy =
        typeWithOutcomes.length > 0
          ? typeWithOutcomes.reduce(
              (sum, p) => sum + (p.actualOutcome!.accurate ? 1 : 0),
              0
            ) / typeWithOutcomes.length
          : 0;

      result[type] = {
        predictionCount: typePredictions.length,
        avgPredictedConfidence,
        avgActualAccuracy,
        calibrationError: Math.abs(avgPredictedConfidence - avgActualAccuracy),
      };
    }

    return result;
  }

  clear(): void {
    this.predictions.clear();
  }
}

// ============================================================================
// CONFIDENCE CALIBRATION TRACKER
// ============================================================================

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

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  enabled: true,
  sampleRate: 1.0,
  maxPredictions: 10000,
  bucketCount: 10,
  calibrationErrorThreshold: 0.15,
};

export class ConfidenceCalibrationTracker {
  private readonly store: ConfidencePredictionStore;
  private readonly config: CalibrationConfig;
  private readonly logger: ObservabilityLogger;
  private readonly alertListeners: Set<(alert: CalibrationAlert) => void> = new Set();

  constructor(options: {
    store?: ConfidencePredictionStore;
    config?: Partial<CalibrationConfig>;
    logger?: ObservabilityLogger;
  }) {
    this.config = { ...DEFAULT_CALIBRATION_CONFIG, ...options.config };
    this.store =
      options.store ?? new InMemoryConfidencePredictionStore(this.config.maxPredictions);
    this.logger = options.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Event Recording
  // ---------------------------------------------------------------------------

  /**
   * Record a confidence prediction
   */
  async recordPrediction(params: {
    userId: string;
    sessionId?: string;
    responseId: string;
    responseType: ResponseType;
    predictedConfidence: number;
    factors: ConfidenceFactor[];
  }): Promise<string> {
    if (!this.config.enabled || !this.shouldSample()) {
      return '';
    }

    const predictionId = uuidv4();
    const prediction: ConfidencePrediction = {
      predictionId,
      userId: params.userId,
      sessionId: params.sessionId,
      responseId: params.responseId,
      responseType: params.responseType,
      predictedConfidence: params.predictedConfidence,
      factors: params.factors,
      predictedAt: new Date(),
    };

    await this.store.record(prediction);

    this.logger.debug('Confidence prediction recorded', {
      predictionId,
      responseType: params.responseType,
      predictedConfidence: params.predictedConfidence,
    });

    return predictionId;
  }

  /**
   * Record the actual outcome for a prediction
   */
  async recordOutcome(
    predictionId: string,
    params: {
      accurate: boolean;
      userVerified: boolean;
      verificationMethod: VerificationMethod;
      qualityScore?: number;
      notes?: string;
    }
  ): Promise<void> {
    const outcome: ConfidenceOutcome = {
      accurate: params.accurate,
      userVerified: params.userVerified,
      verificationMethod: params.verificationMethod,
      qualityScore: params.qualityScore,
      notes: params.notes,
      recordedAt: new Date(),
    };

    await this.store.recordOutcome(predictionId, outcome);

    // Check if this reveals calibration issues
    await this.checkCalibrationAlerts(predictionId);

    this.logger.debug('Confidence outcome recorded', {
      predictionId,
      accurate: params.accurate,
      verificationMethod: params.verificationMethod,
    });
  }

  /**
   * Record outcome from user feedback
   */
  async recordUserFeedback(
    predictionId: string,
    helpful: boolean,
    rating?: number
  ): Promise<void> {
    await this.recordOutcome(predictionId, {
      accurate: helpful,
      userVerified: true,
      verificationMethod: VerificationMethod.USER_FEEDBACK,
      qualityScore: rating ? rating / 5 : undefined,
    });
  }

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------

  async getPrediction(predictionId: string): Promise<ConfidencePrediction | null> {
    return this.store.getById(predictionId);
  }

  async getCalibrationMetrics(
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalibrationMetrics> {
    return this.store.getCalibrationMetrics(periodStart, periodEnd);
  }

  /**
   * Get metrics for the last N days
   */
  async getRecentMetrics(days: number = 7): Promise<CalibrationMetrics> {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return this.getCalibrationMetrics(start, now);
  }

  /**
   * Get calibration summary
   */
  async getCalibrationSummary(): Promise<CalibrationSummary> {
    const metrics = await this.getRecentMetrics(7);

    const calibrationQuality =
      metrics.calibrationError < 0.05
        ? 'excellent'
        : metrics.calibrationError < 0.1
          ? 'good'
          : metrics.calibrationError < 0.15
            ? 'fair'
            : 'poor';

    const recommendations: string[] = [];

    if (metrics.calibrationError > 0.1) {
      recommendations.push('Consider adjusting confidence scoring weights');
    }

    if (metrics.verificationOverrideRate > 0.2) {
      recommendations.push('High override rate indicates miscalibration');
    }

    // Find worst performing bucket
    const worstBucket = metrics.calibrationBuckets
      .filter((b) => b.count > 0)
      .sort((a, b) => b.error - a.error)[0];

    if (worstBucket && worstBucket.error > 0.2) {
      recommendations.push(
        `Focus on improving calibration in ${(worstBucket.rangeStart * 100).toFixed(0)}-${(worstBucket.rangeEnd * 100).toFixed(0)}% confidence range`
      );
    }

    return {
      calibrationQuality,
      calibrationError: metrics.calibrationError,
      brierScore: metrics.brierScore,
      sampleSize: metrics.outcomesRecorded,
      recommendations,
      lastUpdated: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  private async checkCalibrationAlerts(predictionId: string): Promise<void> {
    // Check recent calibration
    const recentMetrics = await this.getRecentMetrics(1);

    if (recentMetrics.calibrationError > this.config.calibrationErrorThreshold) {
      this.emitAlert({
        type: 'high_calibration_error',
        message: `Calibration error (${recentMetrics.calibrationError.toFixed(3)}) exceeds threshold`,
        predictionId,
        calibrationError: recentMetrics.calibrationError,
        threshold: this.config.calibrationErrorThreshold,
      });
    }
  }

  /**
   * Subscribe to calibration alerts
   */
  onAlert(callback: (alert: CalibrationAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private emitAlert(alert: CalibrationAlert): void {
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        this.logger.error('Error in calibration alert listener', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }
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

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createConfidenceCalibrationTracker(options?: {
  store?: ConfidencePredictionStore;
  config?: Partial<CalibrationConfig>;
  logger?: ObservabilityLogger;
}): ConfidenceCalibrationTracker {
  return new ConfidenceCalibrationTracker(options ?? {});
}

export function createInMemoryConfidencePredictionStore(
  maxPredictions?: number
): InMemoryConfidencePredictionStore {
  return new InMemoryConfidencePredictionStore(maxPredictions);
}
