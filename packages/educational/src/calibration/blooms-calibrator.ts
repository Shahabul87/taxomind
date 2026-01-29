/**
 * Bloom's Classification Calibrator
 *
 * Phase 5: Confidence Calibration Learning Loop
 * - Collects feedback on Bloom's classifications (explicit, implicit, expert)
 * - Calculates calibration metrics (ECE, MCE)
 * - Computes adjustment factors to improve classification accuracy
 * - Provides calibrated confidence scores
 */

import { createHash } from 'crypto';
import type { BloomsLevel } from '@sam-ai/core';

// ============================================================================
// TYPES
// ============================================================================

export type BloomsFeedbackType = 'EXPLICIT' | 'IMPLICIT' | 'EXPERT';

export interface BloomsFeedbackInput {
  /**
   * The content that was classified
   */
  content: string;

  /**
   * Predicted Bloom's level (1-6)
   */
  predictedLevel: number;

  /**
   * Predicted sub-level (if available)
   */
  predictedSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

  /**
   * Confidence score of the prediction (0-1)
   */
  predictedConfidence: number;

  /**
   * Actual Bloom's level (user-provided correction, 1-6)
   */
  actualLevel?: number;

  /**
   * Actual sub-level (user-provided)
   */
  actualSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

  /**
   * Assessment outcome score (0-1), for implicit feedback
   */
  assessmentOutcome?: number;

  /**
   * Type of feedback
   */
  feedbackType: BloomsFeedbackType;

  /**
   * User who provided feedback
   */
  userId?: string;

  /**
   * Course context
   */
  courseId?: string;

  /**
   * Section context
   */
  sectionId?: string;

  /**
   * Analysis method used
   */
  analysisMethod?: 'keyword' | 'ai' | 'hybrid';
}

export interface CalibrationMetrics {
  /**
   * Total samples in the calibration period
   */
  totalSamples: number;

  /**
   * Overall accuracy (correct predictions / total verified)
   */
  overallAccuracy: number;

  /**
   * Expected Calibration Error (ECE)
   * Lower is better (0 = perfectly calibrated)
   */
  expectedCalibrationError: number;

  /**
   * Maximum Calibration Error (MCE)
   * Worst-case calibration error across buckets
   */
  maxCalibrationError: number;

  /**
   * Accuracy breakdown by Bloom's level
   */
  accuracyByLevel: Record<number, { correct: number; total: number; accuracy: number }>;

  /**
   * Calibration by confidence bucket
   */
  calibrationBuckets: Record<string, {
    correct: number;
    total: number;
    avgConfidence: number;
    avgAccuracy: number;
  }>;

  /**
   * Computed adjustment factors per level
   */
  levelAdjustments: Record<number, number>;

  /**
   * Global confidence adjustment
   */
  confidenceAdjustment: number;
}

export interface CalibratedResult {
  /**
   * Original predicted level
   */
  originalLevel: number;

  /**
   * Calibrated level (may differ if adjustments suggest it)
   */
  calibratedLevel: number;

  /**
   * Original confidence
   */
  originalConfidence: number;

  /**
   * Calibrated confidence (adjusted based on historical accuracy)
   */
  calibratedConfidence: number;

  /**
   * Level-specific adjustment applied
   */
  levelAdjustment: number;

  /**
   * Whether calibration was applied
   */
  calibrationApplied: boolean;
}

export interface BloomsCalibratorConfig {
  /**
   * Minimum samples required for calibration
   * @default 100
   */
  minSamplesForCalibration?: number;

  /**
   * Number of confidence buckets for ECE calculation
   * @default 10
   */
  numConfidenceBuckets?: number;

  /**
   * Maximum adjustment factor (prevents wild swings)
   * @default 0.3
   */
  maxAdjustmentFactor?: number;

  /**
   * Weight for expert feedback vs other types
   * @default 3.0
   */
  expertFeedbackWeight?: number;

  /**
   * Assessment outcome threshold for implicit positive feedback
   * @default 0.7
   */
  implicitPositiveThreshold?: number;
}

/**
 * Store interface for persisting feedback and metrics
 */
export interface BloomsCalibratorStore {
  /**
   * Save feedback to the store
   */
  saveFeedback(feedback: BloomsFeedbackInput & { contentHash: string }): Promise<string>;

  /**
   * Get feedback for a specific content hash
   */
  getFeedbackByHash(contentHash: string): Promise<Array<BloomsFeedbackInput & { id: string; createdAt: Date }>>;

  /**
   * Get all feedback in a time range
   */
  getFeedbackInRange(startDate: Date, endDate: Date): Promise<Array<BloomsFeedbackInput & {
    id: string;
    contentHash: string;
    createdAt: Date;
  }>>;

  /**
   * Save calibration metrics
   */
  saveMetrics(metrics: CalibrationMetrics & {
    periodStart: Date;
    periodEnd: Date;
    periodType: string;
  }): Promise<string>;

  /**
   * Get the latest calibration metrics
   */
  getLatestMetrics(periodType?: string): Promise<CalibrationMetrics | null>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class BloomsCalibrator {
  private readonly config: Required<BloomsCalibratorConfig>;
  private readonly store: BloomsCalibratorStore | null;

  // In-memory cache for fast access
  private metricsCache: CalibrationMetrics | null = null;
  private metricsCacheTime: number = 0;
  private readonly METRICS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(config: BloomsCalibratorConfig = {}, store?: BloomsCalibratorStore) {
    this.config = {
      minSamplesForCalibration: config.minSamplesForCalibration ?? 100,
      numConfidenceBuckets: config.numConfidenceBuckets ?? 10,
      maxAdjustmentFactor: config.maxAdjustmentFactor ?? 0.3,
      expertFeedbackWeight: config.expertFeedbackWeight ?? 3.0,
      implicitPositiveThreshold: config.implicitPositiveThreshold ?? 0.7,
    };
    this.store = store ?? null;
  }

  /**
   * Generate a content hash for deduplication
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
  }

  /**
   * Record feedback for a classification
   */
  async recordFeedback(input: BloomsFeedbackInput): Promise<string | null> {
    if (!this.store) {
      return null;
    }

    const contentHash = this.hashContent(input.content);
    const feedbackId = await this.store.saveFeedback({
      ...input,
      contentHash,
    });

    // Invalidate metrics cache
    this.metricsCache = null;

    return feedbackId;
  }

  /**
   * Calculate calibration metrics from feedback data
   */
  async calculateMetrics(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
    endDate: Date = new Date()
  ): Promise<CalibrationMetrics> {
    // Initialize metrics structure
    const accuracyByLevel: Record<number, { correct: number; total: number; accuracy: number }> = {};
    const calibrationBuckets: Record<string, {
      correct: number;
      total: number;
      avgConfidence: number;
      avgAccuracy: number;
      confidenceSum: number;
    }> = {};

    // Initialize levels 1-6
    for (let level = 1; level <= 6; level++) {
      accuracyByLevel[level] = { correct: 0, total: 0, accuracy: 0 };
    }

    // Initialize confidence buckets
    for (let i = 0; i < this.config.numConfidenceBuckets; i++) {
      const bucketStart = i / this.config.numConfidenceBuckets;
      const bucketEnd = (i + 1) / this.config.numConfidenceBuckets;
      const key = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;
      calibrationBuckets[key] = {
        correct: 0,
        total: 0,
        avgConfidence: 0,
        avgAccuracy: 0,
        confidenceSum: 0,
      };
    }

    // Get feedback data
    const feedback = this.store
      ? await this.store.getFeedbackInRange(startDate, endDate)
      : [];

    let totalCorrect = 0;
    let totalVerified = 0;

    // Process each feedback entry
    for (const entry of feedback) {
      const isCorrect = this.evaluateFeedback(entry);
      if (isCorrect === null) continue; // Skip entries we can't evaluate

      const weight = entry.feedbackType === 'EXPERT' ? this.config.expertFeedbackWeight : 1;

      // Update level accuracy
      if (accuracyByLevel[entry.predictedLevel]) {
        accuracyByLevel[entry.predictedLevel].total += weight;
        if (isCorrect) {
          accuracyByLevel[entry.predictedLevel].correct += weight;
          totalCorrect += weight;
        }
        totalVerified += weight;
      }

      // Update confidence buckets
      const bucketIndex = Math.min(
        Math.floor(entry.predictedConfidence * this.config.numConfidenceBuckets),
        this.config.numConfidenceBuckets - 1
      );
      const bucketStart = bucketIndex / this.config.numConfidenceBuckets;
      const bucketEnd = (bucketIndex + 1) / this.config.numConfidenceBuckets;
      const bucketKey = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;

      if (calibrationBuckets[bucketKey]) {
        calibrationBuckets[bucketKey].total += weight;
        calibrationBuckets[bucketKey].confidenceSum += entry.predictedConfidence * weight;
        if (isCorrect) {
          calibrationBuckets[bucketKey].correct += weight;
        }
      }
    }

    // Calculate final metrics
    const overallAccuracy = totalVerified > 0 ? totalCorrect / totalVerified : 0;

    // Calculate accuracy for each level
    for (const level of Object.keys(accuracyByLevel)) {
      const levelData = accuracyByLevel[parseInt(level)];
      levelData.accuracy = levelData.total > 0 ? levelData.correct / levelData.total : 0;
    }

    // Calculate ECE and MCE
    let ece = 0;
    let mce = 0;

    for (const key of Object.keys(calibrationBuckets)) {
      const bucket = calibrationBuckets[key];
      if (bucket.total > 0) {
        bucket.avgConfidence = bucket.confidenceSum / bucket.total;
        bucket.avgAccuracy = bucket.correct / bucket.total;

        const calibrationError = Math.abs(bucket.avgAccuracy - bucket.avgConfidence);
        const bucketWeight = bucket.total / (totalVerified || 1);

        ece += calibrationError * bucketWeight;
        mce = Math.max(mce, calibrationError);
      }
      // Remove temp field
      delete (bucket as Record<string, unknown>).confidenceSum;
    }

    // Calculate level adjustments
    const levelAdjustments = this.calculateLevelAdjustments(accuracyByLevel, overallAccuracy);

    // Calculate global confidence adjustment
    const confidenceAdjustment = this.calculateConfidenceAdjustment(
      calibrationBuckets,
      totalVerified
    );

    return {
      totalSamples: feedback.length,
      overallAccuracy,
      expectedCalibrationError: ece,
      maxCalibrationError: mce,
      accuracyByLevel,
      calibrationBuckets,
      levelAdjustments,
      confidenceAdjustment,
    };
  }

  /**
   * Evaluate if a feedback entry indicates correct prediction
   */
  private evaluateFeedback(entry: BloomsFeedbackInput): boolean | null {
    switch (entry.feedbackType) {
      case 'EXPLICIT':
      case 'EXPERT':
        // User explicitly provided actual level
        if (entry.actualLevel !== undefined) {
          return entry.predictedLevel === entry.actualLevel;
        }
        return null;

      case 'IMPLICIT':
        // Infer from assessment outcome
        if (entry.assessmentOutcome !== undefined) {
          return entry.assessmentOutcome >= this.config.implicitPositiveThreshold;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Calculate level-specific adjustments
   */
  private calculateLevelAdjustments(
    accuracyByLevel: Record<number, { correct: number; total: number; accuracy: number }>,
    overallAccuracy: number
  ): Record<number, number> {
    const adjustments: Record<number, number> = {};

    for (let level = 1; level <= 6; level++) {
      const levelData = accuracyByLevel[level];
      if (levelData.total < 10) {
        // Not enough data for this level
        adjustments[level] = 0;
        continue;
      }

      // Adjustment = difference from overall accuracy, clamped
      const rawAdjustment = levelData.accuracy - overallAccuracy;
      adjustments[level] = Math.max(
        -this.config.maxAdjustmentFactor,
        Math.min(this.config.maxAdjustmentFactor, rawAdjustment)
      );
    }

    return adjustments;
  }

  /**
   * Calculate global confidence adjustment
   */
  private calculateConfidenceAdjustment(
    calibrationBuckets: Record<string, { avgConfidence: number; avgAccuracy: number; total: number }>,
    totalSamples: number
  ): number {
    if (totalSamples < this.config.minSamplesForCalibration) {
      return 0;
    }

    // Weighted average of (avgAccuracy - avgConfidence) across buckets
    let weightedSum = 0;
    let totalWeight = 0;

    for (const bucket of Object.values(calibrationBuckets)) {
      if (bucket.total > 0) {
        const diff = bucket.avgAccuracy - bucket.avgConfidence;
        weightedSum += diff * bucket.total;
        totalWeight += bucket.total;
      }
    }

    if (totalWeight === 0) return 0;

    const rawAdjustment = weightedSum / totalWeight;
    return Math.max(
      -this.config.maxAdjustmentFactor,
      Math.min(this.config.maxAdjustmentFactor, rawAdjustment)
    );
  }

  /**
   * Get cached or fresh calibration metrics
   */
  async getMetrics(): Promise<CalibrationMetrics | null> {
    // Check cache
    if (this.metricsCache && Date.now() - this.metricsCacheTime < this.METRICS_CACHE_TTL) {
      return this.metricsCache;
    }

    // Try to get from store
    if (this.store) {
      const storedMetrics = await this.store.getLatestMetrics();
      if (storedMetrics) {
        this.metricsCache = storedMetrics;
        this.metricsCacheTime = Date.now();
        return storedMetrics;
      }
    }

    // Calculate fresh metrics
    const metrics = await this.calculateMetrics();
    this.metricsCache = metrics;
    this.metricsCacheTime = Date.now();

    return metrics;
  }

  /**
   * Apply calibration to a classification result
   */
  async calibrate(
    predictedLevel: number,
    predictedConfidence: number
  ): Promise<CalibratedResult> {
    const metrics = await this.getMetrics();

    if (!metrics || metrics.totalSamples < this.config.minSamplesForCalibration) {
      // Not enough data for calibration
      return {
        originalLevel: predictedLevel,
        calibratedLevel: predictedLevel,
        originalConfidence: predictedConfidence,
        calibratedConfidence: predictedConfidence,
        levelAdjustment: 0,
        calibrationApplied: false,
      };
    }

    // Get level-specific adjustment
    const levelAdjustment = metrics.levelAdjustments[predictedLevel] || 0;

    // Calculate calibrated confidence
    let calibratedConfidence = predictedConfidence + metrics.confidenceAdjustment + levelAdjustment;
    calibratedConfidence = Math.max(0, Math.min(1, calibratedConfidence));

    // Determine if level should change (only if confidence significantly differs)
    let calibratedLevel = predictedLevel;

    // If calibrated confidence is very low, consider adjacent levels
    if (calibratedConfidence < 0.3 && metrics.levelAdjustments[predictedLevel] < -0.1) {
      // Check if adjacent levels have better accuracy
      const prevLevel = predictedLevel - 1;
      const nextLevel = predictedLevel + 1;

      const prevAccuracy = metrics.accuracyByLevel[prevLevel]?.accuracy || 0;
      const nextAccuracy = metrics.accuracyByLevel[nextLevel]?.accuracy || 0;
      const currentAccuracy = metrics.accuracyByLevel[predictedLevel]?.accuracy || 0;

      if (prevLevel >= 1 && prevAccuracy > currentAccuracy + 0.1) {
        calibratedLevel = prevLevel;
      } else if (nextLevel <= 6 && nextAccuracy > currentAccuracy + 0.1) {
        calibratedLevel = nextLevel;
      }
    }

    return {
      originalLevel: predictedLevel,
      calibratedLevel,
      originalConfidence: predictedConfidence,
      calibratedConfidence,
      levelAdjustment,
      calibrationApplied: true,
    };
  }

  /**
   * Check if enough data exists for reliable calibration
   */
  async hasEnoughData(): Promise<boolean> {
    const metrics = await this.getMetrics();
    return (metrics?.totalSamples ?? 0) >= this.config.minSamplesForCalibration;
  }

  /**
   * Get calibration health status
   */
  async getHealthStatus(): Promise<{
    hasEnoughData: boolean;
    totalSamples: number;
    overallAccuracy: number;
    calibrationQuality: 'good' | 'moderate' | 'poor' | 'insufficient';
    expectedCalibrationError: number;
  }> {
    const metrics = await this.getMetrics();

    if (!metrics) {
      return {
        hasEnoughData: false,
        totalSamples: 0,
        overallAccuracy: 0,
        calibrationQuality: 'insufficient',
        expectedCalibrationError: 1,
      };
    }

    let quality: 'good' | 'moderate' | 'poor' | 'insufficient';
    if (metrics.totalSamples < this.config.minSamplesForCalibration) {
      quality = 'insufficient';
    } else if (metrics.expectedCalibrationError < 0.05) {
      quality = 'good';
    } else if (metrics.expectedCalibrationError < 0.15) {
      quality = 'moderate';
    } else {
      quality = 'poor';
    }

    return {
      hasEnoughData: metrics.totalSamples >= this.config.minSamplesForCalibration,
      totalSamples: metrics.totalSamples,
      overallAccuracy: metrics.overallAccuracy,
      calibrationQuality: quality,
      expectedCalibrationError: metrics.expectedCalibrationError,
    };
  }

  /**
   * Clear the metrics cache
   */
  clearCache(): void {
    this.metricsCache = null;
    this.metricsCacheTime = 0;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new BloomsCalibrator instance
 */
export function createBloomsCalibrator(
  config?: BloomsCalibratorConfig,
  store?: BloomsCalibratorStore
): BloomsCalibrator {
  return new BloomsCalibrator(config, store);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Bloom's level string to number
 */
export function bloomsLevelToNumber(level: BloomsLevel): number {
  const mapping: Record<BloomsLevel, number> = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 3,
    ANALYZE: 4,
    EVALUATE: 5,
    CREATE: 6,
  };
  return mapping[level] || 1;
}

/**
 * Convert number to Bloom's level string
 */
export function numberToBloomsLevel(num: number): BloomsLevel {
  const mapping: Record<number, BloomsLevel> = {
    1: 'REMEMBER',
    2: 'UNDERSTAND',
    3: 'APPLY',
    4: 'ANALYZE',
    5: 'EVALUATE',
    6: 'CREATE',
  };
  return mapping[num] || 'REMEMBER';
}

/**
 * Generate a content hash for deduplication
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}
