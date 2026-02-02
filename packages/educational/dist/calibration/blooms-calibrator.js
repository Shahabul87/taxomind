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
// ============================================================================
// IMPLEMENTATION
// ============================================================================
export class BloomsCalibrator {
    config;
    store;
    // In-memory cache for fast access
    metricsCache = null;
    metricsCacheTime = 0;
    METRICS_CACHE_TTL = 60 * 60 * 1000; // 1 hour
    constructor(config = {}, store) {
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
    hashContent(content) {
        return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
    }
    /**
     * Record feedback for a classification
     */
    async recordFeedback(input) {
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
    async calculateMetrics(startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
    endDate = new Date()) {
        // Initialize metrics structure
        const accuracyByLevel = {};
        const calibrationBuckets = {};
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
            if (isCorrect === null)
                continue; // Skip entries we can't evaluate
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
            const bucketIndex = Math.min(Math.floor(entry.predictedConfidence * this.config.numConfidenceBuckets), this.config.numConfidenceBuckets - 1);
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
            delete bucket.confidenceSum;
        }
        // Calculate level adjustments
        const levelAdjustments = this.calculateLevelAdjustments(accuracyByLevel, overallAccuracy);
        // Calculate global confidence adjustment
        const confidenceAdjustment = this.calculateConfidenceAdjustment(calibrationBuckets, totalVerified);
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
    evaluateFeedback(entry) {
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
    calculateLevelAdjustments(accuracyByLevel, overallAccuracy) {
        const adjustments = {};
        for (let level = 1; level <= 6; level++) {
            const levelData = accuracyByLevel[level];
            if (levelData.total < 10) {
                // Not enough data for this level
                adjustments[level] = 0;
                continue;
            }
            // Adjustment = difference from overall accuracy, clamped
            const rawAdjustment = levelData.accuracy - overallAccuracy;
            adjustments[level] = Math.max(-this.config.maxAdjustmentFactor, Math.min(this.config.maxAdjustmentFactor, rawAdjustment));
        }
        return adjustments;
    }
    /**
     * Calculate global confidence adjustment
     */
    calculateConfidenceAdjustment(calibrationBuckets, totalSamples) {
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
        if (totalWeight === 0)
            return 0;
        const rawAdjustment = weightedSum / totalWeight;
        return Math.max(-this.config.maxAdjustmentFactor, Math.min(this.config.maxAdjustmentFactor, rawAdjustment));
    }
    /**
     * Get cached or fresh calibration metrics
     */
    async getMetrics() {
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
    async calibrate(predictedLevel, predictedConfidence) {
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
            }
            else if (nextLevel <= 6 && nextAccuracy > currentAccuracy + 0.1) {
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
    async hasEnoughData() {
        const metrics = await this.getMetrics();
        return (metrics?.totalSamples ?? 0) >= this.config.minSamplesForCalibration;
    }
    /**
     * Get calibration health status
     */
    async getHealthStatus() {
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
        let quality;
        if (metrics.totalSamples < this.config.minSamplesForCalibration) {
            quality = 'insufficient';
        }
        else if (metrics.expectedCalibrationError < 0.05) {
            quality = 'good';
        }
        else if (metrics.expectedCalibrationError < 0.15) {
            quality = 'moderate';
        }
        else {
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
    clearCache() {
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
export function createBloomsCalibrator(config, store) {
    return new BloomsCalibrator(config, store);
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Convert Bloom's level string to number
 */
export function bloomsLevelToNumber(level) {
    const mapping = {
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
export function numberToBloomsLevel(num) {
    const mapping = {
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
export function hashContent(content) {
    return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}
