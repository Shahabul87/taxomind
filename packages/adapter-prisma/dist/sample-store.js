/**
 * Prisma Calibration Sample Store
 *
 * Database-backed implementation for calibration samples.
 */
// ============================================================================
// IMPLEMENTATION
// ============================================================================
export class PrismaSampleStore {
    prisma;
    tableName;
    constructor(config) {
        this.prisma = config.prisma;
        this.tableName = config.tableName ?? 'calibrationSample';
    }
    async save(sample) {
        await this.prisma[this.tableName].create({
            data: {
                id: sample.id,
                evaluationId: sample.evaluationId,
                aiScore: sample.aiScore,
                humanScore: sample.humanScore,
                aiFeedback: sample.aiFeedback,
                humanFeedback: sample.humanFeedback,
                adjustmentReason: sample.adjustmentReason,
                context: sample.context,
                evaluatedAt: sample.evaluatedAt,
                reviewedAt: sample.reviewedAt,
                reviewerId: sample.reviewerId,
                versionInfo: sample.versionInfo,
                tags: sample.tags ?? [],
            },
        });
    }
    async get(id) {
        const result = await this.prisma[this.tableName].findUnique({
            where: { id },
        });
        return result ? this.mapToSample(result) : null;
    }
    async getRecentWithHumanReview(limit) {
        const results = await this.prisma[this.tableName].findMany({
            where: { humanScore: { not: null } },
            orderBy: { reviewedAt: 'desc' },
            take: limit,
        });
        return results.map((r) => this.mapToSample(r));
    }
    async getPendingReview(limit) {
        const results = await this.prisma[this.tableName].findMany({
            where: { humanScore: null },
            orderBy: { evaluatedAt: 'desc' },
            take: limit,
        });
        return results.map((r) => this.mapToSample(r));
    }
    async getByDateRange(start, end) {
        const results = await this.prisma[this.tableName].findMany({
            where: {
                evaluatedAt: { gte: start, lte: end },
            },
            orderBy: { evaluatedAt: 'desc' },
        });
        return results.map((r) => this.mapToSample(r));
    }
    async getByContentType(contentType, limit) {
        const results = await this.prisma[this.tableName].findMany({
            where: {
                context: { path: ['contentType'], equals: contentType },
            },
            orderBy: { evaluatedAt: 'desc' },
            take: limit,
        });
        return results.map((r) => this.mapToSample(r));
    }
    async updateWithReview(id, review) {
        const result = await this.prisma[this.tableName].update({
            where: { id },
            data: {
                humanScore: review.score,
                humanFeedback: review.feedback,
                adjustmentReason: review.reason,
                reviewedAt: new Date(),
                reviewerId: review.reviewerId,
            },
        });
        return this.mapToSample(result);
    }
    async getStatistics() {
        const [totalSamples, reviewedSamples, avgAiScore, avgHumanScore] = await Promise.all([
            this.prisma[this.tableName].count(),
            this.prisma[this.tableName].count({ where: { humanScore: { not: null } } }),
            this.prisma[this.tableName].aggregate({ _avg: { aiScore: true } }),
            this.prisma[this.tableName].aggregate({
                _avg: { humanScore: true },
                where: { humanScore: { not: null } },
            }),
        ]);
        return {
            totalSamples,
            reviewedSamples,
            averageAiScore: avgAiScore._avg.aiScore ?? 0,
            averageHumanScore: avgHumanScore._avg.humanScore ?? undefined,
            byContentType: {},
            bySubject: {},
        };
    }
    async pruneOldSamples(olderThanDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        const result = await this.prisma[this.tableName].deleteMany({
            where: { evaluatedAt: { lt: cutoff } },
        });
        return result.count;
    }
    mapToSample(result) {
        return {
            id: result.id,
            evaluationId: result.evaluationId,
            aiScore: result.aiScore,
            humanScore: result.humanScore ?? undefined,
            aiFeedback: result.aiFeedback,
            humanFeedback: result.humanFeedback ?? undefined,
            adjustmentReason: result.adjustmentReason ?? undefined,
            context: result.context,
            evaluatedAt: result.evaluatedAt,
            reviewedAt: result.reviewedAt ?? undefined,
            reviewerId: result.reviewerId ?? undefined,
            versionInfo: result.versionInfo,
            tags: result.tags ?? undefined,
        };
    }
}
export function createPrismaSampleStore(config) {
    return new PrismaSampleStore(config);
}
//# sourceMappingURL=sample-store.js.map