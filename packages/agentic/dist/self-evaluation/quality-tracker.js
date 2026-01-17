/**
 * @sam-ai/agentic - Quality Tracker
 * Tracks response quality metrics and calibrates confidence
 */
import { v4 as uuidv4 } from 'uuid';
import { QualityMetricType, MetricSource, StudentFeedbackSchema, ConfidenceLevel, } from './types';
// ============================================================================
// IN-MEMORY STORES
// ============================================================================
/**
 * In-memory implementation of QualityRecordStore
 */
export class InMemoryQualityRecordStore {
    records = new Map();
    responseIndex = new Map();
    feedbackStore = new Map();
    outcomeStore = new Map();
    async get(id) {
        return this.records.get(id) ?? null;
    }
    async getByResponse(responseId) {
        const recordId = this.responseIndex.get(responseId);
        if (!recordId)
            return null;
        return this.records.get(recordId) ?? null;
    }
    async getByUser(userId, limit) {
        const userRecords = Array.from(this.records.values())
            .filter((record) => record.userId === userId)
            .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
        return limit ? userRecords.slice(0, limit) : userRecords;
    }
    async create(record) {
        const newRecord = {
            ...record,
            id: uuidv4(),
        };
        this.records.set(newRecord.id, newRecord);
        this.responseIndex.set(newRecord.responseId, newRecord.id);
        return newRecord;
    }
    async update(id, updates) {
        const record = this.records.get(id);
        if (!record) {
            throw new Error(`Quality record not found: ${id}`);
        }
        const updatedRecord = {
            ...record,
            ...updates,
            id: record.id,
            updatedAt: new Date(),
        };
        this.records.set(id, updatedRecord);
        return updatedRecord;
    }
    async recordFeedback(responseId, feedback) {
        this.feedbackStore.set(responseId, feedback);
        // Update the quality record if it exists
        const recordId = this.responseIndex.get(responseId);
        if (recordId) {
            const record = this.records.get(recordId);
            if (record) {
                record.studentFeedback = feedback;
                record.updatedAt = new Date();
                this.records.set(recordId, record);
            }
        }
    }
    async recordOutcome(responseId, outcome) {
        this.outcomeStore.set(responseId, outcome);
        // Update the quality record if it exists
        const recordId = this.responseIndex.get(responseId);
        if (recordId) {
            const record = this.records.get(recordId);
            if (record) {
                record.learningOutcome = outcome;
                record.updatedAt = new Date();
                this.records.set(recordId, record);
            }
        }
    }
    async getSummary(userId, periodStart, periodEnd) {
        const now = new Date();
        const start = periodStart ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = periodEnd ?? now;
        let records = Array.from(this.records.values()).filter((r) => r.recordedAt >= start && r.recordedAt <= end);
        if (userId) {
            records = records.filter((r) => r.userId === userId);
        }
        const totalResponses = records.length;
        const averageQuality = totalResponses > 0
            ? records.reduce((sum, r) => sum + r.overallQuality, 0) / totalResponses
            : 0;
        const averageConfidence = totalResponses > 0
            ? records.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / totalResponses
            : 0;
        // Calculate calibration score
        const calibrationScore = this.calculateCalibrationScore(records);
        // Calculate trends
        const midpoint = new Date((start.getTime() + end.getTime()) / 2);
        const firstHalf = records.filter((r) => r.recordedAt < midpoint);
        const secondHalf = records.filter((r) => r.recordedAt >= midpoint);
        const firstQuality = firstHalf.length > 0
            ? firstHalf.reduce((sum, r) => sum + r.overallQuality, 0) / firstHalf.length
            : 0;
        const secondQuality = secondHalf.length > 0
            ? secondHalf.reduce((sum, r) => sum + r.overallQuality, 0) / secondHalf.length
            : 0;
        const qualityTrend = secondQuality > firstQuality + 0.05
            ? 'improving'
            : secondQuality < firstQuality - 0.05
                ? 'declining'
                : 'stable';
        const firstConfidence = firstHalf.length > 0
            ? firstHalf.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / firstHalf.length
            : 0;
        const secondConfidence = secondHalf.length > 0
            ? secondHalf.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / secondHalf.length
            : 0;
        const confidenceTrend = secondConfidence > firstConfidence + 0.05
            ? 'improving'
            : secondConfidence < firstConfidence - 0.05
                ? 'declining'
                : 'stable';
        return {
            userId,
            periodStart: start,
            periodEnd: end,
            totalResponses,
            averageQuality,
            averageConfidence,
            calibrationScore,
            byResponseType: {},
            byTopic: {},
            byComplexity: {},
            qualityTrend,
            confidenceTrend,
            improvementAreas: this.identifyImprovementAreas(records),
            strengths: this.identifyStrengths(records),
        };
    }
    calculateCalibrationScore(records) {
        const withBoth = records.filter((r) => r.confidenceScore !== undefined && r.overallQuality !== undefined);
        if (withBoth.length === 0)
            return 1;
        const errors = withBoth.map((r) => Math.abs((r.confidenceScore ?? 0) - r.overallQuality));
        const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
        return Math.max(0, 1 - avgError);
    }
    identifyImprovementAreas(records) {
        const areas = [];
        // Analyze metrics across records
        const metricTotals = {};
        for (const record of records) {
            for (const metric of record.metrics) {
                if (!metricTotals[metric.type]) {
                    metricTotals[metric.type] = { sum: 0, count: 0 };
                }
                metricTotals[metric.type].sum += metric.score;
                metricTotals[metric.type].count++;
            }
        }
        for (const [type, data] of Object.entries(metricTotals)) {
            const avg = data.sum / data.count;
            if (avg < 0.6) {
                areas.push(`Improve ${type.replace(/_/g, ' ')}`);
            }
        }
        return areas.slice(0, 3);
    }
    identifyStrengths(records) {
        const strengths = [];
        const metricTotals = {};
        for (const record of records) {
            for (const metric of record.metrics) {
                if (!metricTotals[metric.type]) {
                    metricTotals[metric.type] = { sum: 0, count: 0 };
                }
                metricTotals[metric.type].sum += metric.score;
                metricTotals[metric.type].count++;
            }
        }
        for (const [type, data] of Object.entries(metricTotals)) {
            const avg = data.sum / data.count;
            if (avg >= 0.8) {
                strengths.push(`Strong ${type.replace(/_/g, ' ')}`);
            }
        }
        return strengths.slice(0, 3);
    }
}
/**
 * In-memory implementation of CalibrationStore
 */
export class InMemoryCalibrationStore {
    calibrations = new Map();
    async get(id) {
        return this.calibrations.get(id) ?? null;
    }
    async getLatest(userId, topic) {
        let matching = Array.from(this.calibrations.values());
        if (userId) {
            matching = matching.filter((c) => c.userId === userId);
        }
        if (topic) {
            matching = matching.filter((c) => c.topic === topic);
        }
        matching.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
        return matching[0] ?? null;
    }
    async create(data) {
        const newData = {
            ...data,
            id: uuidv4(),
        };
        this.calibrations.set(newData.id, newData);
        return newData;
    }
    async getHistory(userId, limit) {
        let history = Array.from(this.calibrations.values());
        if (userId) {
            history = history.filter((c) => c.userId === userId);
        }
        history.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
        return limit ? history.slice(0, limit) : history;
    }
}
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
/**
 * Quality Tracker
 * Tracks response quality and calibrates confidence
 */
export class QualityTracker {
    qualityStore;
    calibrationStore;
    logger;
    calibrationWindow;
    minimumSamplesForCalibration;
    constructor(config = {}) {
        this.qualityStore = config.qualityStore ?? new InMemoryQualityRecordStore();
        this.calibrationStore = config.calibrationStore ?? new InMemoryCalibrationStore();
        this.logger = config.logger ?? defaultLogger;
        this.calibrationWindow = config.calibrationWindow ?? 30;
        this.minimumSamplesForCalibration = config.minimumSamplesForCalibration ?? 10;
    }
    /**
     * Record quality metrics for a response
     */
    async recordQuality(responseId, userId, sessionId, metrics, confidenceScore) {
        this.logger.info('Recording quality metrics', { responseId, metricsCount: metrics.length });
        const overallQuality = this.calculateOverallQuality(metrics);
        const confidenceAccuracy = confidenceScore !== undefined
            ? 1 - Math.abs(confidenceScore - overallQuality)
            : undefined;
        const record = {
            id: '',
            responseId,
            userId,
            sessionId,
            metrics,
            overallQuality,
            confidenceScore,
            confidenceAccuracy,
            recordedAt: new Date(),
            updatedAt: new Date(),
        };
        const savedRecord = await this.qualityStore.create(record);
        this.logger.info('Quality recorded', {
            responseId,
            overallQuality,
            confidenceAccuracy,
        });
        return savedRecord;
    }
    /**
     * Record student feedback
     */
    async recordFeedback(feedback) {
        const validated = StudentFeedbackSchema.parse(feedback);
        this.logger.info('Recording student feedback', {
            responseId: validated.responseId,
            helpful: validated.helpful,
        });
        const feedbackWithId = {
            ...validated,
            id: uuidv4(),
            submittedAt: new Date(),
        };
        await this.qualityStore.recordFeedback(validated.responseId, feedbackWithId);
        // Update quality metrics based on feedback
        const record = await this.qualityStore.getByResponse(validated.responseId);
        if (record) {
            const feedbackMetrics = this.deriveFeedbackMetrics(feedbackWithId);
            const updatedMetrics = [...record.metrics, ...feedbackMetrics];
            const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
            await this.qualityStore.update(record.id, {
                metrics: updatedMetrics,
                overallQuality: newOverallQuality,
                studentFeedback: feedbackWithId,
            });
        }
    }
    /**
     * Record expert review
     */
    async recordExpertReview(responseId, review) {
        this.logger.info('Recording expert review', { responseId, approved: review.approved });
        const record = await this.qualityStore.getByResponse(responseId);
        if (record) {
            const reviewMetrics = this.deriveExpertMetrics(review);
            const updatedMetrics = [...record.metrics, ...reviewMetrics];
            const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
            await this.qualityStore.update(record.id, {
                metrics: updatedMetrics,
                overallQuality: newOverallQuality,
                expertReview: review,
            });
        }
    }
    /**
     * Record learning outcome
     */
    async recordOutcome(responseId, outcome) {
        this.logger.info('Recording learning outcome', {
            responseId,
            masteryImprovement: outcome.masteryImprovement,
        });
        await this.qualityStore.recordOutcome(responseId, outcome);
        // Update quality metrics based on outcome
        const record = await this.qualityStore.getByResponse(responseId);
        if (record) {
            const outcomeMetrics = this.deriveOutcomeMetrics(outcome);
            const updatedMetrics = [...record.metrics, ...outcomeMetrics];
            const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
            await this.qualityStore.update(record.id, {
                metrics: updatedMetrics,
                overallQuality: newOverallQuality,
                learningOutcome: outcome,
            });
        }
    }
    /**
     * Calculate calibration data
     */
    async calculateCalibration(userId, topic) {
        this.logger.info('Calculating calibration', { userId, topic });
        const now = new Date();
        const windowStart = new Date(now.getTime() - this.calibrationWindow * 24 * 60 * 60 * 1000);
        let records = await this.qualityStore.getByUser(userId ?? '');
        if (!userId) {
            // Get all records for global calibration
            const summary = await this.qualityStore.getSummary(undefined, windowStart, now);
            if (summary.totalResponses < this.minimumSamplesForCalibration) {
                this.logger.warn('Insufficient samples for calibration', {
                    samples: summary.totalResponses,
                    required: this.minimumSamplesForCalibration,
                });
                return null;
            }
        }
        records = records.filter((r) => r.recordedAt >= windowStart &&
            r.confidenceScore !== undefined &&
            (!topic || r.metrics.some((m) => m.notes?.includes(topic))));
        if (records.length < this.minimumSamplesForCalibration) {
            this.logger.warn('Insufficient samples for calibration', {
                samples: records.length,
                required: this.minimumSamplesForCalibration,
            });
            return null;
        }
        // Calculate expected vs actual accuracy
        const expectedAccuracy = records.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / records.length;
        const actualAccuracy = records.reduce((sum, r) => sum + r.overallQuality, 0) / records.length;
        const calibrationError = Math.abs(expectedAccuracy - actualAccuracy);
        // Calculate by confidence level
        const buckets = this.calculateCalibrationBuckets(records);
        // Determine adjustment
        const adjustmentFactor = actualAccuracy > 0 ? actualAccuracy / Math.max(0.1, expectedAccuracy) : 1;
        const adjustmentDirection = adjustmentFactor > 1.1 ? 'increase' : adjustmentFactor < 0.9 ? 'decrease' : 'none';
        const calibration = {
            id: '',
            userId,
            topic,
            totalResponses: records.length,
            expectedAccuracy,
            actualAccuracy,
            calibrationError,
            byConfidenceLevel: buckets,
            adjustmentFactor: Math.max(0.5, Math.min(1.5, adjustmentFactor)),
            adjustmentDirection,
            periodStart: windowStart,
            periodEnd: now,
            calculatedAt: now,
        };
        const saved = await this.calibrationStore.create(calibration);
        this.logger.info('Calibration calculated', {
            expectedAccuracy: expectedAccuracy.toFixed(2),
            actualAccuracy: actualAccuracy.toFixed(2),
            adjustmentFactor: adjustmentFactor.toFixed(2),
        });
        return saved;
    }
    /**
     * Get quality summary
     */
    async getSummary(userId, periodStart, periodEnd) {
        return this.qualityStore.getSummary(userId, periodStart, periodEnd);
    }
    /**
     * Get calibration history
     */
    async getCalibrationHistory(userId, limit) {
        return this.calibrationStore.getHistory(userId, limit);
    }
    /**
     * Get latest calibration
     */
    async getLatestCalibration(userId, topic) {
        return this.calibrationStore.getLatest(userId, topic);
    }
    /**
     * Get quality record for a response
     */
    async getQualityRecord(responseId) {
        return this.qualityStore.getByResponse(responseId);
    }
    /**
     * Get user's quality history
     */
    async getUserHistory(userId, limit) {
        return this.qualityStore.getByUser(userId, limit);
    }
    /**
     * Create automated quality metrics from response analysis
     */
    createAutomatedMetrics(responseText, verificationAccuracy, _confidenceScore) {
        const metrics = [];
        // Accuracy metric from verification
        if (verificationAccuracy !== undefined) {
            metrics.push({
                type: QualityMetricType.ACCURACY,
                score: verificationAccuracy,
                source: MetricSource.AUTOMATED,
                confidence: 0.8,
                notes: 'Based on response verification',
            });
        }
        // Clarity metric from text analysis
        const clarityScore = this.analyzeClarity(responseText);
        metrics.push({
            type: QualityMetricType.CLARITY,
            score: clarityScore,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
            notes: 'Based on text structure analysis',
        });
        // Completeness metric from text analysis
        const completenessScore = this.analyzeCompleteness(responseText);
        metrics.push({
            type: QualityMetricType.COMPLETENESS,
            score: completenessScore,
            source: MetricSource.AUTOMATED,
            confidence: 0.6,
            notes: 'Based on content coverage analysis',
        });
        return metrics;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    calculateOverallQuality(metrics) {
        if (metrics.length === 0)
            return 0;
        // Weight metrics by source and confidence
        let totalWeight = 0;
        let weightedSum = 0;
        const sourceWeights = {
            [MetricSource.EXPERT_REVIEW]: 1.0,
            [MetricSource.OUTCOME_BASED]: 0.9,
            [MetricSource.STUDENT_FEEDBACK]: 0.8,
            [MetricSource.COMPARATIVE]: 0.7,
            [MetricSource.AUTOMATED]: 0.6,
        };
        for (const metric of metrics) {
            const sourceWeight = sourceWeights[metric.source];
            const weight = sourceWeight * metric.confidence;
            weightedSum += metric.score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    deriveFeedbackMetrics(feedback) {
        const metrics = [];
        // Helpfulness metric
        metrics.push({
            type: QualityMetricType.HELPFULNESS,
            score: feedback.helpful ? (feedback.rating ? feedback.rating / 5 : 0.8) : 0.3,
            source: MetricSource.STUDENT_FEEDBACK,
            confidence: 0.9,
            notes: feedback.comment ?? undefined,
        });
        // Clarity metric
        if (feedback.clarity !== undefined) {
            metrics.push({
                type: QualityMetricType.CLARITY,
                score: feedback.clarity / 5,
                source: MetricSource.STUDENT_FEEDBACK,
                confidence: 0.85,
            });
        }
        // Understanding metric (pedagogical effectiveness)
        metrics.push({
            type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
            score: feedback.didUnderstand ? 0.9 : feedback.needMoreHelp ? 0.4 : 0.5,
            source: MetricSource.STUDENT_FEEDBACK,
            confidence: 0.8,
        });
        return metrics;
    }
    deriveExpertMetrics(review) {
        const metrics = [];
        metrics.push({
            type: QualityMetricType.ACCURACY,
            score: review.accuracyScore,
            source: MetricSource.EXPERT_REVIEW,
            confidence: 0.95,
        });
        metrics.push({
            type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
            score: review.pedagogyScore,
            source: MetricSource.EXPERT_REVIEW,
            confidence: 0.95,
        });
        metrics.push({
            type: QualityMetricType.RELEVANCE,
            score: review.appropriatenessScore,
            source: MetricSource.EXPERT_REVIEW,
            confidence: 0.95,
        });
        return metrics;
    }
    deriveOutcomeMetrics(outcome) {
        const metrics = [];
        // Calculate success rate
        const successRate = outcome.subsequentAttempts > 0
            ? outcome.successfulAttempts / outcome.subsequentAttempts
            : 0.5;
        metrics.push({
            type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
            score: successRate,
            source: MetricSource.OUTCOME_BASED,
            confidence: 0.9,
            notes: `${outcome.successfulAttempts}/${outcome.subsequentAttempts} successful`,
        });
        // Mastery improvement
        if (outcome.masteryImprovement !== undefined) {
            const improvementScore = Math.min(1, Math.max(0, 0.5 + outcome.masteryImprovement / 20));
            metrics.push({
                type: QualityMetricType.HELPFULNESS,
                score: improvementScore,
                source: MetricSource.OUTCOME_BASED,
                confidence: 0.85,
                notes: `Mastery improved by ${outcome.masteryImprovement}%`,
            });
        }
        // Engagement
        if (outcome.timeSpentLearning > 0) {
            const engagementScore = Math.min(1, outcome.timeSpentLearning / 30); // 30 min = 1.0
            metrics.push({
                type: QualityMetricType.ENGAGEMENT,
                score: engagementScore,
                source: MetricSource.OUTCOME_BASED,
                confidence: 0.7,
            });
        }
        return metrics;
    }
    calculateCalibrationBuckets(records) {
        const buckets = [];
        const levelRanges = [
            { level: ConfidenceLevel.HIGH, min: 0.8, max: 1.0 },
            { level: ConfidenceLevel.MEDIUM, min: 0.4, max: 0.8 },
            { level: ConfidenceLevel.LOW, min: 0.2, max: 0.4 },
            { level: ConfidenceLevel.UNCERTAIN, min: 0, max: 0.2 },
        ];
        for (const range of levelRanges) {
            const levelRecords = records.filter((r) => (r.confidenceScore ?? 0) >= range.min && (r.confidenceScore ?? 0) < range.max);
            if (levelRecords.length === 0) {
                buckets.push({
                    level: range.level,
                    count: 0,
                    expectedAccuracy: (range.min + range.max) / 2,
                    actualAccuracy: 0,
                    isOverconfident: false,
                    isUnderconfident: false,
                });
                continue;
            }
            const expectedAccuracy = levelRecords.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) /
                levelRecords.length;
            const actualAccuracy = levelRecords.reduce((sum, r) => sum + r.overallQuality, 0) / levelRecords.length;
            buckets.push({
                level: range.level,
                count: levelRecords.length,
                expectedAccuracy,
                actualAccuracy,
                isOverconfident: expectedAccuracy > actualAccuracy + 0.1,
                isUnderconfident: actualAccuracy > expectedAccuracy + 0.1,
            });
        }
        return buckets;
    }
    analyzeClarity(text) {
        let score = 0.7;
        // Check for structure
        if (text.includes('\n') || text.includes(':') || text.includes('-')) {
            score += 0.1;
        }
        // Check for explanation markers
        const explanationMarkers = ['because', 'therefore', 'for example', 'in other words'];
        if (explanationMarkers.some((m) => text.toLowerCase().includes(m))) {
            score += 0.1;
        }
        // Penalize very long sentences
        const sentences = text.split(/[.!?]+/);
        const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
        if (avgLength > 30) {
            score -= 0.15;
        }
        // Penalize excessive jargon without explanation
        const technicalTerms = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? [];
        if (technicalTerms.length > 5) {
            score -= 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    analyzeCompleteness(text) {
        let score = 0.6;
        // Check for comprehensive coverage indicators
        const wordCount = text.split(/\s+/).length;
        if (wordCount >= 50)
            score += 0.1;
        if (wordCount >= 100)
            score += 0.1;
        // Check for examples
        if (/(?:for example|such as|e\.g\.|like|consider)/i.test(text)) {
            score += 0.1;
        }
        // Check for conclusion or summary
        if (/(?:in summary|to summarize|therefore|in conclusion|overall)/i.test(text)) {
            score += 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new QualityTracker instance
 */
export function createQualityTracker(config) {
    return new QualityTracker(config);
}
//# sourceMappingURL=quality-tracker.js.map