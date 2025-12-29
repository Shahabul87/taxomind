/**
 * Prisma Calibration Sample Store
 *
 * Database-backed implementation for calibration samples.
 */

// ============================================================================
// TYPES (mirroring lib/sam/calibration types for portability)
// ============================================================================

export interface CalibrationSample {
  id: string;
  evaluationId: string;
  aiScore: number;
  humanScore?: number;
  aiFeedback: string;
  humanFeedback?: string;
  adjustmentReason?: string;
  context: EvaluationContext;
  evaluatedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  versionInfo: VersionInfo;
  tags?: string[];
}

export interface EvaluationContext {
  contentType: string;
  subject?: string;
  bloomsLevel?: string;
  difficulty?: string;
  studentId?: string;
  courseId?: string;
}

export interface VersionInfo {
  configVersion: string;
  promptVersion: string;
  modelVersion: string;
}

export interface HumanReview {
  score: number;
  feedback?: string;
  reason?: string;
  reviewerId?: string;
}

export interface SampleStatistics {
  totalSamples: number;
  reviewedSamples: number;
  averageAiScore: number;
  averageHumanScore?: number;
  averageDrift?: number;
  byContentType: Record<string, number>;
  bySubject: Record<string, number>;
  oldestSample?: Date;
  newestSample?: Date;
}

export interface CalibrationSampleStore {
  save(sample: CalibrationSample): Promise<void>;
  get(id: string): Promise<CalibrationSample | null>;
  getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]>;
  getPendingReview(limit: number): Promise<CalibrationSample[]>;
  getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]>;
  getByContentType(contentType: string, limit: number): Promise<CalibrationSample[]>;
  updateWithReview(id: string, review: HumanReview): Promise<CalibrationSample>;
  getStatistics(): Promise<SampleStatistics>;
  pruneOldSamples(olderThanDays: number): Promise<number>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PrismaSampleStoreConfig {
  prisma: any;
  tableName?: string;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PrismaSampleStore implements CalibrationSampleStore {
  private prisma: any;
  private tableName: string;

  constructor(config: PrismaSampleStoreConfig) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? 'calibrationSample';
  }

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

  async get(id: string): Promise<CalibrationSample | null> {
    const result = await this.prisma[this.tableName].findUnique({
      where: { id },
    });
    return result ? this.mapToSample(result) : null;
  }

  async getRecentWithHumanReview(limit: number): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      take: limit,
    });
    return results.map((r: unknown) => this.mapToSample(r));
  }

  async getPendingReview(limit: number): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: null },
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
    });
    return results.map((r: unknown) => this.mapToSample(r));
  }

  async getByDateRange(start: Date, end: Date): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        evaluatedAt: { gte: start, lte: end },
      },
      orderBy: { evaluatedAt: 'desc' },
    });
    return results.map((r: unknown) => this.mapToSample(r));
  }

  async getByContentType(contentType: string, limit: number): Promise<CalibrationSample[]> {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        context: { path: ['contentType'], equals: contentType },
      },
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
    });
    return results.map((r: unknown) => this.mapToSample(r));
  }

  async updateWithReview(id: string, review: HumanReview): Promise<CalibrationSample> {
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

  async getStatistics(): Promise<SampleStatistics> {
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

  async pruneOldSamples(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await this.prisma[this.tableName].deleteMany({
      where: { evaluatedAt: { lt: cutoff } },
    });
    return result.count;
  }

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

export function createPrismaSampleStore(config: PrismaSampleStoreConfig): PrismaSampleStore {
  return new PrismaSampleStore(config);
}
