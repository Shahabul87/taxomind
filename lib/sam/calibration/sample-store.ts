/**
 * Calibration Sample Store
 *
 * Priority 6: Add Calibration Loop
 * Storage implementations for calibration samples
 */

import type {
  CalibrationSample,
  CalibrationSampleStore,
  HumanReview,
  SampleStatistics,
} from './types';

// ============================================================================
// IN-MEMORY SAMPLE STORE
// ============================================================================

/**
 * In-memory implementation of CalibrationSampleStore
 * Suitable for development and testing
 */
export class InMemorySampleStore implements CalibrationSampleStore {
  private samples: Map<string, CalibrationSample> = new Map();

  /**
   * Save a calibration sample
   */
  async save(sample: CalibrationSample): Promise<void> {
    this.samples.set(sample.id, { ...sample });
  }

  /**
   * Get a sample by ID
   */
  async get(id: string): Promise<CalibrationSample | null> {
    return this.samples.get(id) ?? null;
  }

  /**
   * Get samples with human review
   */
  async getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]> {
    const reviewed = Array.from(this.samples.values())
      .filter((s) => s.humanScore !== undefined)
      .sort(
        (a, b) =>
          (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0)
      );

    return reviewed.slice(0, limit);
  }

  /**
   * Get samples pending human review
   */
  async getPendingReview(limit: number): Promise<CalibrationSample[]> {
    const pending = Array.from(this.samples.values())
      .filter((s) => s.humanScore === undefined)
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime());

    return pending.slice(0, limit);
  }

  /**
   * Get samples by date range
   */
  async getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]> {
    return Array.from(this.samples.values()).filter(
      (s) => s.evaluatedAt >= start && s.evaluatedAt <= end
    );
  }

  /**
   * Get samples by content type
   */
  async getByContentType(
    contentType: string,
    limit: number
  ): Promise<CalibrationSample[]> {
    const filtered = Array.from(this.samples.values())
      .filter((s) => s.context.contentType === contentType)
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime());

    return filtered.slice(0, limit);
  }

  /**
   * Update a sample with human review
   */
  async updateWithReview(
    id: string,
    review: HumanReview
  ): Promise<CalibrationSample> {
    const sample = this.samples.get(id);
    if (!sample) {
      throw new Error(`Sample not found: ${id}`);
    }

    const updated: CalibrationSample = {
      ...sample,
      humanScore: review.score,
      humanFeedback: review.feedback,
      adjustmentReason: review.reason,
      reviewedAt: new Date(),
      reviewerId: review.reviewerId,
    };

    this.samples.set(id, updated);
    return updated;
  }

  /**
   * Get sample statistics
   */
  async getStatistics(): Promise<SampleStatistics> {
    const allSamples = Array.from(this.samples.values());
    const reviewed = allSamples.filter((s) => s.humanScore !== undefined);

    // Calculate averages
    const avgAiScore =
      allSamples.length > 0
        ? allSamples.reduce((sum, s) => sum + s.aiScore, 0) / allSamples.length
        : 0;

    const avgHumanScore =
      reviewed.length > 0
        ? reviewed.reduce((sum, s) => sum + (s.humanScore ?? 0), 0) /
          reviewed.length
        : undefined;

    const avgDrift =
      reviewed.length > 0
        ? reviewed.reduce(
            (sum, s) => sum + Math.abs(s.aiScore - (s.humanScore ?? s.aiScore)),
            0
          ) / reviewed.length
        : undefined;

    // Group by content type
    const byContentType: Record<string, number> = {};
    for (const sample of allSamples) {
      const type = sample.context.contentType;
      byContentType[type] = (byContentType[type] ?? 0) + 1;
    }

    // Group by subject
    const bySubject: Record<string, number> = {};
    for (const sample of allSamples) {
      const subject = sample.context.subject ?? 'unknown';
      bySubject[subject] = (bySubject[subject] ?? 0) + 1;
    }

    // Find date range
    const dates = allSamples.map((s) => s.evaluatedAt.getTime());
    const oldestSample =
      dates.length > 0 ? new Date(Math.min(...dates)) : undefined;
    const newestSample =
      dates.length > 0 ? new Date(Math.max(...dates)) : undefined;

    return {
      totalSamples: allSamples.length,
      reviewedSamples: reviewed.length,
      averageAiScore: avgAiScore,
      averageHumanScore: avgHumanScore,
      averageDrift: avgDrift,
      byContentType,
      bySubject,
      oldestSample,
      newestSample,
    };
  }

  /**
   * Delete old samples
   */
  async pruneOldSamples(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let deleted = 0;
    for (const [id, sample] of this.samples) {
      if (sample.evaluatedAt < cutoff) {
        this.samples.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all samples (for testing)
   */
  clear(): void {
    this.samples.clear();
  }

  /**
   * Get all samples (for testing)
   */
  getAll(): CalibrationSample[] {
    return Array.from(this.samples.values());
  }
}

// ============================================================================
// PRISMA-READY SAMPLE STORE
// ============================================================================

/**
 * Configuration for Prisma-based sample store
 */
export interface PrismaSampleStoreConfig {
  /**
   * Prisma client instance (type any to avoid tight coupling)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;

  /**
   * Table/model name for calibration samples
   */
  tableName?: string;
}

/**
 * Prisma-based implementation of CalibrationSampleStore
 * Ready for database integration
 */
export class PrismaSampleStore implements CalibrationSampleStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;
  private tableName: string;

  constructor(config: PrismaSampleStoreConfig) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? 'calibrationSample';
  }

  /**
   * Save a calibration sample
   */
  async save(sample: CalibrationSample): Promise<void> {
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

  /**
   * Get a sample by ID
   */
  async get(id: string): Promise<CalibrationSample | null> {
    const result = await this.prisma[this.tableName].findUnique({
      where: { id },
    });

    return result ? this.mapToSample(result) : null;
  }

  /**
   * Get samples with human review
   */
  async getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      take: limit,
    });

    return results.map(this.mapToSample);
  }

  /**
   * Get samples pending human review
   */
  async getPendingReview(limit: number): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: null },
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
    });

    return results.map(this.mapToSample);
  }

  /**
   * Get samples by date range
   */
  async getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        evaluatedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { evaluatedAt: 'desc' },
    });

    return results.map(this.mapToSample);
  }

  /**
   * Get samples by content type
   */
  async getByContentType(
    contentType: string,
    limit: number
  ): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        context: {
          path: ['contentType'],
          equals: contentType,
        },
      },
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
    });

    return results.map(this.mapToSample);
  }

  /**
   * Update a sample with human review
   */
  async updateWithReview(
    id: string,
    review: HumanReview
  ): Promise<CalibrationSample> {
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

  /**
   * Get sample statistics
   */
  async getStatistics(): Promise<SampleStatistics> {
    const [
      totalSamples,
      reviewedSamples,
      avgAiScore,
      avgHumanScore,
      contentTypeCounts,
    ] = await Promise.all([
      this.prisma[this.tableName].count(),
      this.prisma[this.tableName].count({
        where: { humanScore: { not: null } },
      }),
      this.prisma[this.tableName].aggregate({
        _avg: { aiScore: true },
      }),
      this.prisma[this.tableName].aggregate({
        _avg: { humanScore: true },
        where: { humanScore: { not: null } },
      }),
      this.prisma[this.tableName].groupBy({
        by: ['context'],
        _count: true,
      }),
    ]);

    // Calculate average drift from reviewed samples
    const reviewedWithScores = await this.prisma[this.tableName].findMany({
      where: { humanScore: { not: null } },
      select: { aiScore: true, humanScore: true },
    });

    const avgDrift =
      reviewedWithScores.length > 0
        ? reviewedWithScores.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sum: number, s: any) =>
              sum + Math.abs(s.aiScore - (s.humanScore ?? s.aiScore)),
            0
          ) / reviewedWithScores.length
        : undefined;

    // Get date range
    const dates = await this.prisma[this.tableName].aggregate({
      _min: { evaluatedAt: true },
      _max: { evaluatedAt: true },
    });

    // Build content type counts
    const byContentType: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of contentTypeCounts as any[]) {
      const type = item.context?.contentType ?? 'unknown';
      byContentType[type] = (byContentType[type] ?? 0) + item._count;
    }

    return {
      totalSamples,
      reviewedSamples,
      averageAiScore: avgAiScore._avg.aiScore ?? 0,
      averageHumanScore: avgHumanScore._avg.humanScore ?? undefined,
      averageDrift: avgDrift,
      byContentType,
      bySubject: {}, // Would need additional query
      oldestSample: dates._min.evaluatedAt ?? undefined,
      newestSample: dates._max.evaluatedAt ?? undefined,
    };
  }

  /**
   * Delete old samples
   */
  async pruneOldSamples(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await this.prisma[this.tableName].deleteMany({
      where: {
        evaluatedAt: { lt: cutoff },
      },
    });

    return result.count;
  }

  /**
   * Map database result to CalibrationSample
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSample(result: any): CalibrationSample {
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

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an in-memory sample store
 */
export function createInMemorySampleStore(): InMemorySampleStore {
  return new InMemorySampleStore();
}

/**
 * Create a Prisma-based sample store
 */
export function createPrismaSampleStore(
  config: PrismaSampleStoreConfig
): PrismaSampleStore {
  return new PrismaSampleStore(config);
}

/**
 * Singleton in-memory store for development
 */
let defaultStore: InMemorySampleStore | null = null;

/**
 * Get the default sample store (singleton)
 */
export function getDefaultSampleStore(): InMemorySampleStore {
  if (!defaultStore) {
    defaultStore = createInMemorySampleStore();
  }
  return defaultStore;
}

/**
 * Reset the default sample store (for testing)
 */
export function resetDefaultSampleStore(): void {
  defaultStore = null;
}
