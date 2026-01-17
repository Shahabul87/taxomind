/**
 * @sam-ai/adapter-prisma - Self-Evaluation Stores
 * Prisma-backed implementations for confidence scoring, verification, quality tracking, and self-critique.
 */
import { ConfidenceLevel as ConfidenceLevelConst } from '@sam-ai/agentic';
const mapConfidenceScore = (record) => ({
    id: record.id,
    responseId: record.responseId,
    userId: record.userId,
    sessionId: record.sessionId,
    overallScore: record.overallScore,
    level: record.level,
    factors: record.factors ?? [],
    responseType: record.responseType,
    topic: record.topic ?? undefined,
    complexity: record.complexity,
    shouldVerify: record.shouldVerify,
    suggestedDisclaimer: record.suggestedDisclaimer ?? undefined,
    alternativeApproaches: record.alternativeApproaches ?? undefined,
    scoredAt: record.scoredAt,
});
const mapVerificationResult = (record) => ({
    id: record.id,
    responseId: record.responseId,
    userId: record.userId,
    status: record.status,
    overallAccuracy: record.overallAccuracy,
    factChecks: record.factChecks ?? [],
    totalClaims: record.totalClaims,
    verifiedClaims: record.verifiedClaims,
    contradictedClaims: record.contradictedClaims,
    sourceValidations: record.sourceValidations ?? [],
    issues: record.issues ?? [],
    corrections: record.corrections ?? undefined,
    verifiedAt: record.verifiedAt,
    expiresAt: record.expiresAt ?? undefined,
});
const mapQualityRecord = (record) => ({
    id: record.id,
    responseId: record.responseId,
    userId: record.userId,
    sessionId: record.sessionId,
    metrics: record.metrics ?? [],
    overallQuality: record.overallQuality,
    confidenceScore: record.confidenceScore ?? undefined,
    confidenceAccuracy: record.confidenceAccuracy ?? undefined,
    studentFeedback: record.studentFeedback ?? undefined,
    expertReview: record.expertReview ?? undefined,
    learningOutcome: record.learningOutcome ?? undefined,
    recordedAt: record.recordedAt,
    updatedAt: record.updatedAt,
});
const mapCalibrationData = (record) => ({
    id: record.id,
    userId: record.userId ?? undefined,
    topic: record.topic ?? undefined,
    totalResponses: record.totalResponses,
    expectedAccuracy: record.expectedAccuracy,
    actualAccuracy: record.actualAccuracy,
    calibrationError: record.calibrationError,
    byConfidenceLevel: record.byConfidenceLevel ?? [],
    adjustmentFactor: record.adjustmentFactor,
    adjustmentDirection: record.adjustmentDirection,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    calculatedAt: record.calculatedAt,
});
const mapSelfCritique = (record) => ({
    id: record.id,
    responseId: record.responseId,
    userId: record.userId,
    overallScore: record.overallScore,
    dimensionScores: record.dimensionScores ?? [],
    findings: record.findings ?? [],
    criticalFindings: record.criticalFindings,
    majorFindings: record.majorFindings,
    minorFindings: record.minorFindings,
    improvements: record.improvements ?? [],
    topImprovements: record.topImprovements ?? [],
    iteration: record.iteration,
    previousScore: record.previousScore ?? undefined,
    scoreImprovement: record.scoreImprovement ?? undefined,
    passed: record.passed,
    passThreshold: record.passThreshold,
    requiresRevision: record.requiresRevision,
    critiquedAt: record.critiquedAt,
    processingTimeMs: record.processingTimeMs,
});
// ============================================================================
// CONFIDENCE SCORE STORE
// ============================================================================
export class PrismaConfidenceScoreStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMSelfEvaluationScore.findUnique({
            where: { id },
        });
        return record ? mapConfidenceScore(record) : null;
    }
    async getByResponse(responseId) {
        const record = await this.config.prisma.sAMSelfEvaluationScore.findFirst({
            where: { responseId },
            orderBy: { scoredAt: 'desc' },
        });
        return record ? mapConfidenceScore(record) : null;
    }
    async getByUser(userId, limit) {
        const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
            where: { userId },
            orderBy: { scoredAt: 'desc' },
            take: limit,
        });
        return records.map(mapConfidenceScore);
    }
    async create(score) {
        const record = await this.config.prisma.sAMSelfEvaluationScore.create({
            data: {
                userId: score.userId,
                sessionId: score.sessionId,
                responseId: score.responseId,
                responseType: score.responseType,
                overallScore: score.overallScore,
                level: score.level,
                factors: score.factors,
                topic: score.topic ?? null,
                complexity: score.complexity,
                shouldVerify: score.shouldVerify,
                suggestedDisclaimer: score.suggestedDisclaimer ?? null,
                alternativeApproaches: score.alternativeApproaches ?? [],
                scoredAt: score.scoredAt,
                metadata: null,
            },
        });
        return mapConfidenceScore(record);
    }
    async getAverageByTopic(topic, since) {
        const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
            where: {
                topic,
                ...(since ? { scoredAt: { gte: since } } : {}),
            },
            select: { overallScore: true },
        });
        if (records.length === 0)
            return 0;
        const total = records.reduce((sum, record) => sum + record.overallScore, 0);
        return total / records.length;
    }
    async getDistribution(userId) {
        const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
            where: userId ? { userId } : {},
            select: { level: true },
        });
        const distribution = Object.values(ConfidenceLevelConst).reduce((acc, level) => {
            acc[level] = 0;
            return acc;
        }, {});
        for (const record of records) {
            const level = record.level;
            distribution[level] = (distribution[level] ?? 0) + 1;
        }
        return distribution;
    }
}
// ============================================================================
// VERIFICATION RESULT STORE
// ============================================================================
export class PrismaVerificationResultStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMVerificationResult.findUnique({
            where: { id },
        });
        return record ? mapVerificationResult(record) : null;
    }
    async getByResponse(responseId) {
        const record = await this.config.prisma.sAMVerificationResult.findFirst({
            where: { responseId },
            orderBy: { verifiedAt: 'desc' },
        });
        return record ? mapVerificationResult(record) : null;
    }
    async getByUser(userId, limit) {
        const records = await this.config.prisma.sAMVerificationResult.findMany({
            where: { userId },
            orderBy: { verifiedAt: 'desc' },
            take: limit,
        });
        return records.map(mapVerificationResult);
    }
    async create(result) {
        const record = await this.config.prisma.sAMVerificationResult.create({
            data: {
                userId: result.userId,
                responseId: result.responseId,
                status: result.status,
                overallAccuracy: result.overallAccuracy,
                factChecks: result.factChecks,
                totalClaims: result.totalClaims,
                verifiedClaims: result.verifiedClaims,
                contradictedClaims: result.contradictedClaims,
                sourceValidations: result.sourceValidations,
                issues: result.issues,
                corrections: result.corrections ?? null,
                verifiedAt: result.verifiedAt,
                expiresAt: result.expiresAt ?? null,
            },
        });
        return mapVerificationResult(record);
    }
    async update(id, updates) {
        const record = await this.config.prisma.sAMVerificationResult.update({
            where: { id },
            data: {
                status: updates.status,
                overallAccuracy: updates.overallAccuracy,
                factChecks: updates.factChecks,
                totalClaims: updates.totalClaims,
                verifiedClaims: updates.verifiedClaims,
                contradictedClaims: updates.contradictedClaims,
                sourceValidations: updates.sourceValidations,
                issues: updates.issues,
                corrections: updates.corrections ?? null,
                verifiedAt: updates.verifiedAt,
                expiresAt: updates.expiresAt ?? null,
            },
        });
        return mapVerificationResult(record);
    }
    async getIssuesByType(type, since) {
        const records = await this.config.prisma.sAMVerificationResult.findMany({
            where: since ? { verifiedAt: { gte: since } } : {},
            select: { issues: true },
        });
        const issues = [];
        for (const record of records) {
            const recordIssues = record.issues ?? [];
            for (const issue of recordIssues) {
                if (issue.type === type) {
                    issues.push(issue);
                }
            }
        }
        return issues;
    }
}
// ============================================================================
// QUALITY RECORD STORE
// ============================================================================
export class PrismaQualityRecordStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMQualityRecord.findUnique({
            where: { id },
        });
        return record ? mapQualityRecord(record) : null;
    }
    async getByResponse(responseId) {
        const record = await this.config.prisma.sAMQualityRecord.findFirst({
            where: { responseId },
            orderBy: { recordedAt: 'desc' },
        });
        return record ? mapQualityRecord(record) : null;
    }
    async getByUser(userId, limit) {
        const records = await this.config.prisma.sAMQualityRecord.findMany({
            where: { userId },
            orderBy: { recordedAt: 'desc' },
            take: limit,
        });
        return records.map(mapQualityRecord);
    }
    async create(record) {
        const created = await this.config.prisma.sAMQualityRecord.create({
            data: {
                userId: record.userId,
                sessionId: record.sessionId,
                responseId: record.responseId,
                metrics: record.metrics,
                overallQuality: record.overallQuality,
                confidenceScore: record.confidenceScore ?? null,
                confidenceAccuracy: record.confidenceAccuracy ?? null,
                studentFeedback: record.studentFeedback ?? null,
                expertReview: record.expertReview ?? null,
                learningOutcome: record.learningOutcome ?? null,
                recordedAt: record.recordedAt,
            },
        });
        return mapQualityRecord(created);
    }
    async update(id, updates) {
        const record = await this.config.prisma.sAMQualityRecord.update({
            where: { id },
            data: {
                metrics: updates.metrics,
                overallQuality: updates.overallQuality,
                confidenceScore: updates.confidenceScore ?? null,
                confidenceAccuracy: updates.confidenceAccuracy ?? null,
                studentFeedback: updates.studentFeedback ?? null,
                expertReview: updates.expertReview ?? null,
                learningOutcome: updates.learningOutcome ?? null,
            },
        });
        return mapQualityRecord(record);
    }
    async recordFeedback(responseId, feedback) {
        const existing = await this.config.prisma.sAMQualityRecord.findFirst({
            where: { responseId },
        });
        if (!existing)
            return;
        await this.config.prisma.sAMQualityRecord.update({
            where: { id: existing.id },
            data: {
                studentFeedback: feedback,
            },
        });
    }
    async recordOutcome(responseId, outcome) {
        const existing = await this.config.prisma.sAMQualityRecord.findFirst({
            where: { responseId },
        });
        if (!existing)
            return;
        await this.config.prisma.sAMQualityRecord.update({
            where: { id: existing.id },
            data: {
                learningOutcome: outcome,
            },
        });
    }
    async getSummary(userId, periodStart, periodEnd) {
        const now = new Date();
        const start = periodStart ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = periodEnd ?? now;
        const records = await this.config.prisma.sAMQualityRecord.findMany({
            where: {
                ...(userId ? { userId } : {}),
                recordedAt: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { recordedAt: 'desc' },
        });
        const mapped = records.map(mapQualityRecord);
        const totalResponses = mapped.length;
        const averageQuality = totalResponses > 0
            ? mapped.reduce((sum, r) => sum + r.overallQuality, 0) / totalResponses
            : 0;
        const averageConfidence = totalResponses > 0
            ? mapped.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / totalResponses
            : 0;
        return {
            userId,
            periodStart: start,
            periodEnd: end,
            totalResponses,
            averageQuality,
            averageConfidence,
            calibrationScore: 1,
            byResponseType: {},
            byTopic: {},
            byComplexity: {},
            qualityTrend: 'stable',
            confidenceTrend: 'stable',
            improvementAreas: [],
            strengths: [],
        };
    }
}
// ============================================================================
// CALIBRATION STORE
// ============================================================================
export class PrismaCalibrationStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMCalibrationData.findUnique({
            where: { id },
        });
        return record ? mapCalibrationData(record) : null;
    }
    async getLatest(userId, topic) {
        const record = await this.config.prisma.sAMCalibrationData.findFirst({
            where: {
                ...(userId ? { userId } : {}),
                ...(topic ? { topic } : {}),
            },
            orderBy: { calculatedAt: 'desc' },
        });
        return record ? mapCalibrationData(record) : null;
    }
    async create(data) {
        const record = await this.config.prisma.sAMCalibrationData.create({
            data: {
                userId: data.userId ?? null,
                topic: data.topic ?? null,
                totalResponses: data.totalResponses,
                expectedAccuracy: data.expectedAccuracy,
                actualAccuracy: data.actualAccuracy,
                calibrationError: data.calibrationError,
                byConfidenceLevel: data.byConfidenceLevel,
                adjustmentFactor: data.adjustmentFactor,
                adjustmentDirection: data.adjustmentDirection,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                calculatedAt: data.calculatedAt,
            },
        });
        return mapCalibrationData(record);
    }
    async getHistory(userId, limit) {
        const records = await this.config.prisma.sAMCalibrationData.findMany({
            where: userId ? { userId } : {},
            orderBy: { calculatedAt: 'desc' },
            take: limit,
        });
        return records.map(mapCalibrationData);
    }
}
// ============================================================================
// SELF-CRITIQUE STORE
// ============================================================================
export class PrismaSelfCritiqueStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMSelfCritique.findUnique({
            where: { id },
        });
        return record ? mapSelfCritique(record) : null;
    }
    async getByResponse(responseId) {
        const records = await this.config.prisma.sAMSelfCritique.findMany({
            where: { responseId },
            orderBy: { critiquedAt: 'desc' },
        });
        return records.map(mapSelfCritique);
    }
    async getByUser(userId, limit) {
        const records = await this.config.prisma.sAMSelfCritique.findMany({
            where: { userId },
            orderBy: { critiquedAt: 'desc' },
            take: limit,
        });
        return records.map(mapSelfCritique);
    }
    async create(result) {
        const record = await this.config.prisma.sAMSelfCritique.create({
            data: {
                userId: result.userId,
                responseId: result.responseId,
                overallScore: result.overallScore,
                dimensionScores: result.dimensionScores,
                findings: result.findings,
                criticalFindings: result.criticalFindings,
                majorFindings: result.majorFindings,
                minorFindings: result.minorFindings,
                improvements: result.improvements,
                topImprovements: result.topImprovements,
                iteration: result.iteration,
                previousScore: result.previousScore ?? null,
                scoreImprovement: result.scoreImprovement ?? null,
                passed: result.passed,
                passThreshold: result.passThreshold,
                requiresRevision: result.requiresRevision,
                critiquedAt: result.critiquedAt,
                processingTimeMs: result.processingTimeMs,
            },
        });
        return mapSelfCritique(record);
    }
    async update(id, updates) {
        const record = await this.config.prisma.sAMSelfCritique.update({
            where: { id },
            data: {
                overallScore: updates.overallScore,
                dimensionScores: updates.dimensionScores,
                findings: updates.findings,
                criticalFindings: updates.criticalFindings,
                majorFindings: updates.majorFindings,
                minorFindings: updates.minorFindings,
                improvements: updates.improvements,
                topImprovements: updates.topImprovements,
                iteration: updates.iteration,
                previousScore: updates.previousScore ?? null,
                scoreImprovement: updates.scoreImprovement ?? null,
                passed: updates.passed,
                passThreshold: updates.passThreshold,
                requiresRevision: updates.requiresRevision,
                critiquedAt: updates.critiquedAt,
                processingTimeMs: updates.processingTimeMs,
            },
        });
        return mapSelfCritique(record);
    }
    async getLoopResult(responseId) {
        // Get all critique iterations for this response
        const records = await this.config.prisma.sAMSelfCritique.findMany({
            where: { responseId },
            orderBy: { iteration: 'asc' },
        });
        if (records.length === 0)
            return null;
        const critiques = records.map(mapSelfCritique);
        const firstCritique = critiques[0];
        const lastCritique = critiques[critiques.length - 1];
        // Convert SelfCritiqueResult[] to CritiqueIterationResult[]
        // Note: originalResponse/improvedResponse are not stored in DB,
        // so we reconstruct with available data
        const iterations = critiques.map((critique, index) => ({
            iteration: critique.iteration,
            originalResponse: '', // Not stored in DB
            improvedResponse: '', // Not stored in DB
            critique,
            improvements: critique.improvements?.map((s) => s.description) ?? [],
            converged: index === critiques.length - 1 && critique.passed,
            reason: critique.passed ? 'Passed quality threshold' : undefined,
        }));
        // Collect all findings from all iterations
        // Note: CritiqueFinding doesn't have a 'resolved' field, so we separate by severity
        const allFindings = critiques.flatMap((c) => c.findings ?? []);
        // Consider critical/major as unresolved, minor as resolved (heuristic)
        const resolvedFindings = allFindings.filter((f) => f.severity === 'minor');
        const unresolvedFindings = allFindings.filter((f) => f.severity !== 'minor');
        return {
            responseId,
            userId: firstCritique.userId,
            finalResponse: '', // Not stored in DB
            finalScore: lastCritique.overallScore,
            passed: lastCritique.passed,
            iterations,
            totalIterations: records.length,
            maxIterationsReached: records.length >= 3, // Assume max is 3
            initialScore: firstCritique.overallScore,
            scoreImprovement: lastCritique.overallScore - firstCritique.overallScore,
            improvementPercentage: firstCritique.overallScore > 0
                ? ((lastCritique.overallScore - firstCritique.overallScore) / firstCritique.overallScore) * 100
                : 0,
            allFindings,
            resolvedFindings,
            unresolvedFindings,
            totalProcessingTimeMs: critiques.reduce((sum, c) => sum + c.processingTimeMs, 0),
            averageIterationTimeMs: critiques.length > 0
                ? critiques.reduce((sum, c) => sum + c.processingTimeMs, 0) / critiques.length
                : 0,
            startedAt: firstCritique.critiquedAt,
            completedAt: lastCritique.critiquedAt,
        };
    }
    async saveLoopResult(result) {
        // Loop results are derived from individual critiques, so we save each iteration
        for (const iteration of result.iterations) {
            const existing = await this.config.prisma.sAMSelfCritique.findFirst({
                where: {
                    responseId: result.responseId,
                    iteration: iteration.iteration,
                },
            });
            if (!existing) {
                // Extract the SelfCritiqueResult from the CritiqueIterationResult
                await this.create(iteration.critique);
            }
        }
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createPrismaSelfEvaluationStores(config) {
    return {
        confidenceScore: new PrismaConfidenceScoreStore(config),
        verificationResult: new PrismaVerificationResultStore(config),
        qualityRecord: new PrismaQualityRecordStore(config),
        calibration: new PrismaCalibrationStore(config),
        selfCritique: new PrismaSelfCritiqueStore(config),
    };
}
//# sourceMappingURL=self-evaluation-store.js.map