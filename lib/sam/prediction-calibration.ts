/**
 * SAM Prediction Calibration Service
 *
 * Provides threshold tuning and calibration data management for SAM AI predictions.
 * Integrates the @sam-ai/agentic calibration module with Taxomind's Prisma stores.
 *
 * Features:
 * - Dynamic threshold adjustment based on historical accuracy
 * - Calibration bucket analysis for confidence levels
 * - Automatic threshold recommendations
 * - Multi-domain calibration (per topic, response type, etc.)
 */

import { logger } from '@/lib/logger';
import { getObservabilityStores, getStore } from './taxomind-context';
import {
  createConfidenceCalibrationTracker,
  createQualityTracker,
  type ConfidenceCalibrationTracker,
  type QualityTracker,
  type CalibrationConfig,
  type CalibrationSummary,
  type CalibrationAlert,
  TelemetryResponseType as ResponseType,
  VerificationMethod,
  ConfidenceLevel,
} from '@sam-ai/agentic';
import type {
  CalibrationMetrics,
  CalibrationBucket,
  ConfidenceFactor,
} from '@sam-ai/agentic/observability';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Threshold configuration for different confidence levels
 */
export interface ThresholdConfig {
  /** Minimum confidence to provide a direct answer */
  directAnswerThreshold: number;
  /** Threshold below which to add uncertainty caveats */
  uncertaintyThreshold: number;
  /** Threshold below which to suggest verification */
  verificationThreshold: number;
  /** Threshold below which to decline answering */
  declineThreshold: number;
}

/**
 * Domain-specific threshold adjustments
 */
export interface DomainThreshold {
  domain: string;
  adjustmentFactor: number;
  thresholds: ThresholdConfig;
  lastUpdated: Date;
  sampleSize: number;
}

/**
 * Calibration report with recommendations
 */
export interface CalibrationReport {
  userId?: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalPredictions: number;
    outcomesRecorded: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
    brierScore: number;
    verificationOverrideRate: number;
  };
  buckets: CalibrationBucket[];
  byResponseType: Record<string, {
    count: number;
    avgConfidence: number;
    avgAccuracy: number;
    error: number;
  }>;
  recommendations: ThresholdRecommendation[];
  thresholdSuggestions: ThresholdConfig;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  generatedAt: Date;
}

/**
 * Threshold adjustment recommendation
 */
export interface ThresholdRecommendation {
  type: 'increase' | 'decrease' | 'maintain';
  target: keyof ThresholdConfig;
  currentValue: number;
  suggestedValue: number;
  reason: string;
  confidence: number;
  expectedImprovement: string;
}

/**
 * Prediction calibration service configuration
 */
export interface PredictionCalibrationConfig {
  /** Default thresholds */
  defaultThresholds: ThresholdConfig;
  /** Minimum samples required for calibration */
  minSamplesForCalibration: number;
  /** Calibration window in days */
  calibrationWindowDays: number;
  /** Enable automatic threshold adjustment */
  autoAdjustThresholds: boolean;
  /** Maximum adjustment factor per calibration cycle */
  maxAdjustmentFactor: number;
  /** Alert on calibration error threshold */
  alertThreshold: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  directAnswerThreshold: 0.85,
  uncertaintyThreshold: 0.65,
  verificationThreshold: 0.45,
  declineThreshold: 0.25,
};

export const DEFAULT_CALIBRATION_CONFIG: PredictionCalibrationConfig = {
  defaultThresholds: DEFAULT_THRESHOLDS,
  minSamplesForCalibration: 20,
  calibrationWindowDays: 14,
  autoAdjustThresholds: true,
  maxAdjustmentFactor: 0.15,
  alertThreshold: 0.15,
};

// ============================================================================
// PREDICTION CALIBRATION SERVICE
// ============================================================================

/**
 * Prediction Calibration Service
 * Manages threshold tuning and calibration data for SAM AI predictions
 */
export class PredictionCalibrationService {
  private config: PredictionCalibrationConfig;
  private calibrationTracker: ConfidenceCalibrationTracker;
  private qualityTracker: QualityTracker;
  private domainThresholds: Map<string, DomainThreshold> = new Map();
  private alertListeners: Set<(alert: CalibrationAlert) => void> = new Set();

  constructor(config: Partial<PredictionCalibrationConfig> = {}) {
    this.config = { ...DEFAULT_CALIBRATION_CONFIG, ...config };

    // Get stores from TaxomindContext
    const { confidenceCalibration } = getObservabilityStores();

    // Create calibration tracker with Prisma store
    this.calibrationTracker = createConfidenceCalibrationTracker({
      store: confidenceCalibration,
      config: {
        enabled: true,
        sampleRate: 1.0,
        maxPredictions: 10000,
        bucketCount: 10,
        calibrationErrorThreshold: this.config.alertThreshold,
      },
      logger,
    });

    // Create quality tracker
    this.qualityTracker = createQualityTracker({
      logger,
    });

    // Subscribe to calibration alerts
    this.calibrationTracker.onAlert((alert) => {
      this.handleCalibrationAlert(alert);
    });

    logger.info('[PredictionCalibration] Service initialized', {
      config: this.config,
    });
  }

  // ---------------------------------------------------------------------------
  // Prediction Recording
  // ---------------------------------------------------------------------------

  /**
   * Record a confidence prediction for calibration tracking
   */
  async recordPrediction(params: {
    userId: string;
    sessionId?: string;
    responseId: string;
    responseType: ResponseType;
    predictedConfidence: number;
    factors: ConfidenceFactor[];
    domain?: string;
  }): Promise<string> {
    const predictionId = await this.calibrationTracker.recordPrediction({
      userId: params.userId,
      sessionId: params.sessionId,
      responseId: params.responseId,
      responseType: params.responseType,
      predictedConfidence: params.predictedConfidence,
      factors: params.factors,
    });

    logger.debug('[PredictionCalibration] Prediction recorded', {
      predictionId,
      responseType: params.responseType,
      confidence: params.predictedConfidence,
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
    await this.calibrationTracker.recordOutcome(predictionId, params);

    logger.debug('[PredictionCalibration] Outcome recorded', {
      predictionId,
      accurate: params.accurate,
      method: params.verificationMethod,
    });

    // Check if we should recalibrate
    if (this.config.autoAdjustThresholds) {
      await this.checkAndAdjustThresholds();
    }
  }

  /**
   * Record outcome from user feedback
   */
  async recordUserFeedback(
    predictionId: string,
    helpful: boolean,
    rating?: number
  ): Promise<void> {
    await this.calibrationTracker.recordUserFeedback(predictionId, helpful, rating);
  }

  // ---------------------------------------------------------------------------
  // Threshold Management
  // ---------------------------------------------------------------------------

  /**
   * Get current thresholds for a domain
   */
  getThresholds(domain?: string): ThresholdConfig {
    if (domain) {
      const domainThreshold = this.domainThresholds.get(domain);
      if (domainThreshold) {
        return domainThreshold.thresholds;
      }
    }
    return { ...this.config.defaultThresholds };
  }

  /**
   * Get the appropriate response action based on confidence level
   */
  getResponseAction(
    confidence: number,
    domain?: string
  ): 'direct' | 'with_caveat' | 'suggest_verification' | 'decline' {
    const thresholds = this.getThresholds(domain);

    if (confidence >= thresholds.directAnswerThreshold) {
      return 'direct';
    } else if (confidence >= thresholds.uncertaintyThreshold) {
      return 'with_caveat';
    } else if (confidence >= thresholds.verificationThreshold) {
      return 'suggest_verification';
    } else {
      return 'decline';
    }
  }

  /**
   * Update thresholds for a specific domain
   */
  async updateDomainThresholds(
    domain: string,
    thresholds: Partial<ThresholdConfig>,
    sampleSize: number = 0
  ): Promise<DomainThreshold> {
    const existing = this.domainThresholds.get(domain);
    const baseThresholds = existing?.thresholds ?? this.config.defaultThresholds;

    const updated: DomainThreshold = {
      domain,
      adjustmentFactor: existing?.adjustmentFactor ?? 1.0,
      thresholds: {
        ...baseThresholds,
        ...thresholds,
      },
      lastUpdated: new Date(),
      sampleSize,
    };

    this.domainThresholds.set(domain, updated);

    logger.info('[PredictionCalibration] Domain thresholds updated', {
      domain,
      thresholds: updated.thresholds,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Calibration Analysis
  // ---------------------------------------------------------------------------

  /**
   * Get calibration metrics for a time period
   */
  async getCalibrationMetrics(
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalibrationMetrics> {
    return this.calibrationTracker.getCalibrationMetrics(periodStart, periodEnd);
  }

  /**
   * Get recent calibration metrics
   */
  async getRecentMetrics(days: number = 7): Promise<CalibrationMetrics> {
    return this.calibrationTracker.getRecentMetrics(days);
  }

  /**
   * Get calibration summary
   */
  async getCalibrationSummary(): Promise<CalibrationSummary> {
    return this.calibrationTracker.getCalibrationSummary();
  }

  /**
   * Generate a comprehensive calibration report with recommendations
   */
  async generateCalibrationReport(
    userId?: string,
    periodDays?: number
  ): Promise<CalibrationReport> {
    const days = periodDays ?? this.config.calibrationWindowDays;
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.getCalibrationMetrics(periodStart, now);
    const summary = await this.getCalibrationSummary();

    // Generate threshold recommendations
    const recommendations = this.generateThresholdRecommendations(metrics, summary);

    // Generate suggested thresholds
    const thresholdSuggestions = this.calculateSuggestedThresholds(
      metrics,
      this.config.defaultThresholds
    );

    // Convert by-response-type data
    const byResponseType: CalibrationReport['byResponseType'] = {};
    for (const [type, data] of Object.entries(metrics.byResponseType)) {
      byResponseType[type] = {
        count: data.predictionCount,
        avgConfidence: data.avgPredictedConfidence,
        avgAccuracy: data.avgActualAccuracy,
        error: data.calibrationError,
      };
    }

    const report: CalibrationReport = {
      userId,
      period: {
        start: periodStart,
        end: now,
      },
      metrics: {
        totalPredictions: metrics.predictionCount,
        outcomesRecorded: metrics.outcomesRecorded,
        avgPredictedConfidence: metrics.avgPredictedConfidence,
        avgActualAccuracy: metrics.avgActualAccuracy,
        calibrationError: metrics.calibrationError,
        brierScore: metrics.brierScore,
        verificationOverrideRate: metrics.verificationOverrideRate,
      },
      buckets: metrics.calibrationBuckets,
      byResponseType,
      recommendations,
      thresholdSuggestions,
      overallQuality: summary.calibrationQuality,
      generatedAt: now,
    };

    logger.info('[PredictionCalibration] Report generated', {
      userId,
      periodDays: days,
      overallQuality: report.overallQuality,
      recommendationCount: recommendations.length,
    });

    return report;
  }

  // ---------------------------------------------------------------------------
  // Threshold Recommendations
  // ---------------------------------------------------------------------------

  /**
   * Generate threshold adjustment recommendations
   */
  private generateThresholdRecommendations(
    metrics: CalibrationMetrics,
    summary: CalibrationSummary
  ): ThresholdRecommendation[] {
    const recommendations: ThresholdRecommendation[] = [];
    const currentThresholds = this.config.defaultThresholds;

    // Check for overconfidence
    if (metrics.avgPredictedConfidence > metrics.avgActualAccuracy + 0.1) {
      recommendations.push({
        type: 'increase',
        target: 'directAnswerThreshold',
        currentValue: currentThresholds.directAnswerThreshold,
        suggestedValue: Math.min(
          0.95,
          currentThresholds.directAnswerThreshold + 0.05
        ),
        reason: 'System is overconfident - predicted confidence exceeds actual accuracy',
        confidence: 0.8,
        expectedImprovement: 'Reduce false confidence by ~5-10%',
      });
    }

    // Check for underconfidence
    if (metrics.avgActualAccuracy > metrics.avgPredictedConfidence + 0.1) {
      recommendations.push({
        type: 'decrease',
        target: 'uncertaintyThreshold',
        currentValue: currentThresholds.uncertaintyThreshold,
        suggestedValue: Math.max(
          0.5,
          currentThresholds.uncertaintyThreshold - 0.05
        ),
        reason: 'System is underconfident - actual accuracy exceeds predictions',
        confidence: 0.75,
        expectedImprovement: 'Reduce unnecessary uncertainty caveats by ~10-15%',
      });
    }

    // Check verification override rate
    if (metrics.verificationOverrideRate > 0.2) {
      recommendations.push({
        type: 'increase',
        target: 'verificationThreshold',
        currentValue: currentThresholds.verificationThreshold,
        suggestedValue: Math.min(
          0.6,
          currentThresholds.verificationThreshold + 0.1
        ),
        reason: 'High verification override rate indicates miscalibration',
        confidence: 0.7,
        expectedImprovement: 'Better alignment between confidence and outcomes',
      });
    }

    // Analyze problematic buckets
    for (const bucket of metrics.calibrationBuckets) {
      if (bucket.count >= 10 && bucket.error > 0.2) {
        const isOverconfident = bucket.avgPredicted > bucket.actualAccuracy;

        recommendations.push({
          type: isOverconfident ? 'increase' : 'decrease',
          target: this.determineThresholdTarget(bucket),
          currentValue: this.getThresholdForRange(
            currentThresholds,
            bucket.rangeStart
          ),
          suggestedValue: this.calculateAdjustedThreshold(
            bucket,
            isOverconfident
          ),
          reason: `${isOverconfident ? 'Overconfidence' : 'Underconfidence'} in ${(bucket.rangeStart * 100).toFixed(0)}-${(bucket.rangeEnd * 100).toFixed(0)}% range`,
          confidence: Math.min(0.9, bucket.count / 50),
          expectedImprovement: `Reduce error in this range from ${(bucket.error * 100).toFixed(1)}% to ~${((bucket.error * 0.6) * 100).toFixed(1)}%`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate suggested thresholds based on calibration data
   */
  private calculateSuggestedThresholds(
    metrics: CalibrationMetrics,
    current: ThresholdConfig
  ): ThresholdConfig {
    const adjustmentFactor = metrics.avgActualAccuracy > 0
      ? metrics.avgActualAccuracy / Math.max(0.1, metrics.avgPredictedConfidence)
      : 1;

    // Limit adjustment to configured maximum
    const clampedFactor = Math.max(
      1 - this.config.maxAdjustmentFactor,
      Math.min(1 + this.config.maxAdjustmentFactor, adjustmentFactor)
    );

    return {
      directAnswerThreshold: Math.min(
        0.95,
        Math.max(0.7, current.directAnswerThreshold / clampedFactor)
      ),
      uncertaintyThreshold: Math.min(
        0.8,
        Math.max(0.5, current.uncertaintyThreshold / clampedFactor)
      ),
      verificationThreshold: Math.min(
        0.6,
        Math.max(0.3, current.verificationThreshold / clampedFactor)
      ),
      declineThreshold: Math.min(
        0.4,
        Math.max(0.15, current.declineThreshold / clampedFactor)
      ),
    };
  }

  /**
   * Determine which threshold a bucket maps to
   */
  private determineThresholdTarget(bucket: CalibrationBucket): keyof ThresholdConfig {
    const midpoint = (bucket.rangeStart + bucket.rangeEnd) / 2;

    if (midpoint >= 0.8) return 'directAnswerThreshold';
    if (midpoint >= 0.6) return 'uncertaintyThreshold';
    if (midpoint >= 0.4) return 'verificationThreshold';
    return 'declineThreshold';
  }

  /**
   * Get the threshold value for a confidence range
   */
  private getThresholdForRange(
    thresholds: ThresholdConfig,
    rangeStart: number
  ): number {
    if (rangeStart >= 0.8) return thresholds.directAnswerThreshold;
    if (rangeStart >= 0.6) return thresholds.uncertaintyThreshold;
    if (rangeStart >= 0.4) return thresholds.verificationThreshold;
    return thresholds.declineThreshold;
  }

  /**
   * Calculate adjusted threshold for a problematic bucket
   */
  private calculateAdjustedThreshold(
    bucket: CalibrationBucket,
    isOverconfident: boolean
  ): number {
    const adjustment = bucket.error * 0.5;
    const midpoint = (bucket.rangeStart + bucket.rangeEnd) / 2;

    if (isOverconfident) {
      return Math.min(0.95, midpoint + adjustment);
    } else {
      return Math.max(0.1, midpoint - adjustment);
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-Adjustment
  // ---------------------------------------------------------------------------

  /**
   * Check calibration and adjust thresholds if needed
   */
  private async checkAndAdjustThresholds(): Promise<void> {
    const metrics = await this.getRecentMetrics(this.config.calibrationWindowDays);

    if (metrics.outcomesRecorded < this.config.minSamplesForCalibration) {
      return; // Not enough data
    }

    // Check if adjustment is needed
    if (Math.abs(metrics.calibrationError) > this.config.alertThreshold) {
      const suggestions = this.calculateSuggestedThresholds(
        metrics,
        this.config.defaultThresholds
      );

      // Update default thresholds
      this.config.defaultThresholds = suggestions;

      logger.info('[PredictionCalibration] Thresholds auto-adjusted', {
        calibrationError: metrics.calibrationError,
        newThresholds: suggestions,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Alert Handling
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to calibration alerts
   */
  onAlert(callback: (alert: CalibrationAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  /**
   * Handle calibration alerts
   */
  private handleCalibrationAlert(alert: CalibrationAlert): void {
    logger.warn('[PredictionCalibration] Calibration alert', {
      type: alert.type,
      message: alert.message,
      calibrationError: alert.calibrationError,
    });

    // Notify all listeners
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        logger.error('[PredictionCalibration] Alert listener error', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Map confidence level to numeric value
   */
  confidenceLevelToValue(level: ConfidenceLevel): number {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 0.9;
      case ConfidenceLevel.MEDIUM:
        return 0.6;
      case ConfidenceLevel.LOW:
        return 0.3;
      case ConfidenceLevel.UNCERTAIN:
        return 0.1;
      default:
        return 0.5;
    }
  }

  /**
   * Map numeric value to confidence level
   */
  valueToConfidenceLevel(value: number): ConfidenceLevel {
    if (value >= 0.8) return ConfidenceLevel.HIGH;
    if (value >= 0.5) return ConfidenceLevel.MEDIUM;
    if (value >= 0.2) return ConfidenceLevel.LOW;
    return ConfidenceLevel.UNCERTAIN;
  }

  /**
   * Get all domain thresholds
   */
  getAllDomainThresholds(): DomainThreshold[] {
    return Array.from(this.domainThresholds.values());
  }

  /**
   * Get current configuration
   */
  getConfig(): PredictionCalibrationConfig {
    return { ...this.config };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let serviceInstance: PredictionCalibrationService | null = null;

/**
 * Get the prediction calibration service singleton
 */
export function getPredictionCalibrationService(
  config?: Partial<PredictionCalibrationConfig>
): PredictionCalibrationService {
  if (!serviceInstance) {
    serviceInstance = new PredictionCalibrationService(config);
  }
  return serviceInstance;
}

/**
 * Create a new prediction calibration service instance
 * Use this for testing or isolated contexts
 */
export function createPredictionCalibrationService(
  config?: Partial<PredictionCalibrationConfig>
): PredictionCalibrationService {
  return new PredictionCalibrationService(config);
}

/**
 * Reset the service singleton (for testing)
 */
export function resetPredictionCalibrationService(): void {
  serviceInstance = null;
}
