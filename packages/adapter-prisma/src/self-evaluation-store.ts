/**
 * @sam-ai/adapter-prisma - Self-Evaluation Stores
 * Prisma-backed implementations for confidence scoring, verification, quality tracking, and self-critique.
 */

import type {
  ConfidenceScore,
  ConfidenceScoreStore,
  VerificationResult,
  VerificationResultStore,
  QualityRecord,
  QualityRecordStore,
  CalibrationData,
  CalibrationStore,
  SelfCritiqueResult,
  SelfCritiqueStore,
  SelfCritiqueLoopResult,
  CritiqueIterationResult,
  CritiqueFinding,
  IssueType,
  ConfidenceLevel,
  StudentFeedback,
  LearningOutcome,
  QualitySummary,
} from '@sam-ai/agentic';
import { ConfidenceLevel as ConfidenceLevelConst } from '@sam-ai/agentic';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PrismaSelfEvaluationStoreConfig {
  prisma: PrismaClient;
}

// Minimal Prisma client shape for self-evaluation models
type PrismaClient = {
  sAMSelfEvaluationScore: {
    create: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord>;
    findUnique: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord | null>;
    findFirst: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord[]>;
    update: (args: Record<string, unknown>) => Promise<SelfEvaluationScoreRecord>;
  };
  sAMVerificationResult: {
    create: (args: Record<string, unknown>) => Promise<VerificationResultRecord>;
    findUnique: (args: Record<string, unknown>) => Promise<VerificationResultRecord | null>;
    findFirst: (args: Record<string, unknown>) => Promise<VerificationResultRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<VerificationResultRecord[]>;
    update: (args: Record<string, unknown>) => Promise<VerificationResultRecord>;
  };
  sAMQualityRecord: {
    create: (args: Record<string, unknown>) => Promise<QualityRecordRecord>;
    findUnique: (args: Record<string, unknown>) => Promise<QualityRecordRecord | null>;
    findFirst: (args: Record<string, unknown>) => Promise<QualityRecordRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<QualityRecordRecord[]>;
    update: (args: Record<string, unknown>) => Promise<QualityRecordRecord>;
  };
  sAMCalibrationData: {
    create: (args: Record<string, unknown>) => Promise<CalibrationRecord>;
    findUnique: (args: Record<string, unknown>) => Promise<CalibrationRecord | null>;
    findFirst: (args: Record<string, unknown>) => Promise<CalibrationRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<CalibrationRecord[]>;
  };
  sAMSelfCritique: {
    create: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord>;
    findUnique: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord | null>;
    findFirst: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord[]>;
    update: (args: Record<string, unknown>) => Promise<SelfCritiqueRecord>;
  };
};

interface SelfEvaluationScoreRecord {
  id: string;
  userId: string;
  sessionId: string;
  responseId: string;
  responseType: string;
  overallScore: number;
  level: string;
  factors: unknown;
  topic: string | null;
  complexity: string;
  shouldVerify: boolean;
  suggestedDisclaimer: string | null;
  alternativeApproaches: string[];
  scoredAt: Date;
  metadata: unknown;
}

interface VerificationResultRecord {
  id: string;
  userId: string;
  responseId: string;
  status: string;
  overallAccuracy: number;
  factChecks: unknown;
  totalClaims: number;
  verifiedClaims: number;
  contradictedClaims: number;
  sourceValidations: unknown;
  issues: unknown;
  corrections: unknown;
  verifiedAt: Date;
  expiresAt: Date | null;
}

interface QualityRecordRecord {
  id: string;
  userId: string;
  sessionId: string;
  responseId: string;
  metrics: unknown;
  overallQuality: number;
  confidenceScore: number | null;
  confidenceAccuracy: number | null;
  studentFeedback: unknown;
  expertReview: unknown;
  learningOutcome: unknown;
  recordedAt: Date;
  updatedAt: Date;
}

interface CalibrationRecord {
  id: string;
  userId: string | null;
  topic: string | null;
  totalResponses: number;
  expectedAccuracy: number;
  actualAccuracy: number;
  calibrationError: number;
  byConfidenceLevel: unknown;
  adjustmentFactor: number;
  adjustmentDirection: string;
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

interface SelfCritiqueRecord {
  id: string;
  userId: string;
  responseId: string;
  overallScore: number;
  dimensionScores: unknown;
  findings: unknown;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  improvements: unknown;
  topImprovements: unknown;
  iteration: number;
  previousScore: number | null;
  scoreImprovement: number | null;
  passed: boolean;
  passThreshold: number;
  requiresRevision: boolean;
  critiquedAt: Date;
  processingTimeMs: number;
}

const mapConfidenceScore = (record: SelfEvaluationScoreRecord): ConfidenceScore => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  sessionId: record.sessionId,
  overallScore: record.overallScore,
  level: record.level as ConfidenceScore['level'],
  factors: (record.factors as ConfidenceScore['factors']) ?? [],
  responseType: record.responseType as ConfidenceScore['responseType'],
  topic: record.topic ?? undefined,
  complexity: record.complexity as ConfidenceScore['complexity'],
  shouldVerify: record.shouldVerify,
  suggestedDisclaimer: record.suggestedDisclaimer ?? undefined,
  alternativeApproaches: record.alternativeApproaches ?? undefined,
  scoredAt: record.scoredAt,
});

const mapVerificationResult = (record: VerificationResultRecord): VerificationResult => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  status: record.status as VerificationResult['status'],
  overallAccuracy: record.overallAccuracy,
  factChecks: (record.factChecks as VerificationResult['factChecks']) ?? [],
  totalClaims: record.totalClaims,
  verifiedClaims: record.verifiedClaims,
  contradictedClaims: record.contradictedClaims,
  sourceValidations: (record.sourceValidations as VerificationResult['sourceValidations']) ?? [],
  issues: (record.issues as VerificationResult['issues']) ?? [],
  corrections: (record.corrections as VerificationResult['corrections']) ?? undefined,
  verifiedAt: record.verifiedAt,
  expiresAt: record.expiresAt ?? undefined,
});

const mapQualityRecord = (record: QualityRecordRecord): QualityRecord => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  sessionId: record.sessionId,
  metrics: (record.metrics as QualityRecord['metrics']) ?? [],
  overallQuality: record.overallQuality,
  confidenceScore: record.confidenceScore ?? undefined,
  confidenceAccuracy: record.confidenceAccuracy ?? undefined,
  studentFeedback: (record.studentFeedback as QualityRecord['studentFeedback']) ?? undefined,
  expertReview: (record.expertReview as QualityRecord['expertReview']) ?? undefined,
  learningOutcome: (record.learningOutcome as QualityRecord['learningOutcome']) ?? undefined,
  recordedAt: record.recordedAt,
  updatedAt: record.updatedAt,
});

const mapCalibrationData = (record: CalibrationRecord): CalibrationData => ({
  id: record.id,
  userId: record.userId ?? undefined,
  topic: record.topic ?? undefined,
  totalResponses: record.totalResponses,
  expectedAccuracy: record.expectedAccuracy,
  actualAccuracy: record.actualAccuracy,
  calibrationError: record.calibrationError,
  byConfidenceLevel: (record.byConfidenceLevel as CalibrationData['byConfidenceLevel']) ?? [],
  adjustmentFactor: record.adjustmentFactor,
  adjustmentDirection: record.adjustmentDirection as CalibrationData['adjustmentDirection'],
  periodStart: record.periodStart,
  periodEnd: record.periodEnd,
  calculatedAt: record.calculatedAt,
});

const mapSelfCritique = (record: SelfCritiqueRecord): SelfCritiqueResult => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  overallScore: record.overallScore,
  dimensionScores: (record.dimensionScores as SelfCritiqueResult['dimensionScores']) ?? [],
  findings: (record.findings as SelfCritiqueResult['findings']) ?? [],
  criticalFindings: record.criticalFindings,
  majorFindings: record.majorFindings,
  minorFindings: record.minorFindings,
  improvements: (record.improvements as SelfCritiqueResult['improvements']) ?? [],
  topImprovements: (record.topImprovements as SelfCritiqueResult['topImprovements']) ?? [],
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

export class PrismaConfidenceScoreStore implements ConfidenceScoreStore {
  constructor(private config: PrismaSelfEvaluationStoreConfig) {}

  async get(id: string): Promise<ConfidenceScore | null> {
    const record = await this.config.prisma.sAMSelfEvaluationScore.findUnique({
      where: { id },
    });
    return record ? mapConfidenceScore(record) : null;
  }

  async getByResponse(responseId: string): Promise<ConfidenceScore | null> {
    const record = await this.config.prisma.sAMSelfEvaluationScore.findFirst({
      where: { responseId },
      orderBy: { scoredAt: 'desc' },
    });
    return record ? mapConfidenceScore(record) : null;
  }

  async getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]> {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: { userId },
      orderBy: { scoredAt: 'desc' },
      take: limit,
    });
    return records.map(mapConfidenceScore);
  }

  async create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore> {
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

  async getAverageByTopic(topic: string, since?: Date): Promise<number> {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: {
        topic,
        ...(since ? { scoredAt: { gte: since } } : {}),
      },
      select: { overallScore: true },
    });

    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + record.overallScore, 0);
    return total / records.length;
  }

  async getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>> {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: userId ? { userId } : {},
      select: { level: true },
    });

    const distribution: Record<ConfidenceLevel, number> = Object.values(ConfidenceLevelConst).reduce(
      (acc, level) => {
        acc[level as ConfidenceLevel] = 0;
        return acc;
      },
      {} as Record<ConfidenceLevel, number>
    );

    for (const record of records) {
      const level = record.level as ConfidenceLevel;
      distribution[level] = (distribution[level] ?? 0) + 1;
    }

    return distribution;
  }
}

// ============================================================================
// VERIFICATION RESULT STORE
// ============================================================================

export class PrismaVerificationResultStore implements VerificationResultStore {
  constructor(private config: PrismaSelfEvaluationStoreConfig) {}

  async get(id: string): Promise<VerificationResult | null> {
    const record = await this.config.prisma.sAMVerificationResult.findUnique({
      where: { id },
    });
    return record ? mapVerificationResult(record) : null;
  }

  async getByResponse(responseId: string): Promise<VerificationResult | null> {
    const record = await this.config.prisma.sAMVerificationResult.findFirst({
      where: { responseId },
      orderBy: { verifiedAt: 'desc' },
    });
    return record ? mapVerificationResult(record) : null;
  }

  async getByUser(userId: string, limit?: number): Promise<VerificationResult[]> {
    const records = await this.config.prisma.sAMVerificationResult.findMany({
      where: { userId },
      orderBy: { verifiedAt: 'desc' },
      take: limit,
    });
    return records.map(mapVerificationResult);
  }

  async create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult> {
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

  async update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult> {
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

  async getIssuesByType(type: IssueType, since?: Date): Promise<VerificationResult['issues']> {
    const records = await this.config.prisma.sAMVerificationResult.findMany({
      where: since ? { verifiedAt: { gte: since } } : {},
      select: { issues: true },
    });

    const issues: VerificationResult['issues'] = [];
    for (const record of records) {
      const recordIssues = (record.issues as VerificationResult['issues']) ?? [];
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

export class PrismaQualityRecordStore implements QualityRecordStore {
  constructor(private config: PrismaSelfEvaluationStoreConfig) {}

  async get(id: string): Promise<QualityRecord | null> {
    const record = await this.config.prisma.sAMQualityRecord.findUnique({
      where: { id },
    });
    return record ? mapQualityRecord(record) : null;
  }

  async getByResponse(responseId: string): Promise<QualityRecord | null> {
    const record = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId },
      orderBy: { recordedAt: 'desc' },
    });
    return record ? mapQualityRecord(record) : null;
  }

  async getByUser(userId: string, limit?: number): Promise<QualityRecord[]> {
    const records = await this.config.prisma.sAMQualityRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return records.map(mapQualityRecord);
  }

  async create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord> {
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

  async update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord> {
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

  async recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void> {
    const existing = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId },
    });
    if (!existing) return;

    await this.config.prisma.sAMQualityRecord.update({
      where: { id: existing.id },
      data: {
        studentFeedback: feedback,
      },
    });
  }

  async recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void> {
    const existing = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId },
    });
    if (!existing) return;

    await this.config.prisma.sAMQualityRecord.update({
      where: { id: existing.id },
      data: {
        learningOutcome: outcome,
      },
    });
  }

  async getSummary(
    userId?: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<QualitySummary> {
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
    const averageQuality =
      totalResponses > 0
        ? mapped.reduce((sum, r) => sum + r.overallQuality, 0) / totalResponses
        : 0;
    const averageConfidence =
      totalResponses > 0
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
      byResponseType: {} as QualitySummary['byResponseType'],
      byTopic: {},
      byComplexity: {} as QualitySummary['byComplexity'],
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

export class PrismaCalibrationStore implements CalibrationStore {
  constructor(private config: PrismaSelfEvaluationStoreConfig) {}

  async get(id: string): Promise<CalibrationData | null> {
    const record = await this.config.prisma.sAMCalibrationData.findUnique({
      where: { id },
    });
    return record ? mapCalibrationData(record) : null;
  }

  async getLatest(userId?: string, topic?: string): Promise<CalibrationData | null> {
    const record = await this.config.prisma.sAMCalibrationData.findFirst({
      where: {
        ...(userId ? { userId } : {}),
        ...(topic ? { topic } : {}),
      },
      orderBy: { calculatedAt: 'desc' },
    });
    return record ? mapCalibrationData(record) : null;
  }

  async create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData> {
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

  async getHistory(userId?: string, limit?: number): Promise<CalibrationData[]> {
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

export class PrismaSelfCritiqueStore implements SelfCritiqueStore {
  constructor(private config: PrismaSelfEvaluationStoreConfig) {}

  async get(id: string): Promise<SelfCritiqueResult | null> {
    const record = await this.config.prisma.sAMSelfCritique.findUnique({
      where: { id },
    });
    return record ? mapSelfCritique(record) : null;
  }

  async getByResponse(responseId: string): Promise<SelfCritiqueResult[]> {
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { responseId },
      orderBy: { critiquedAt: 'desc' },
    });
    return records.map(mapSelfCritique);
  }

  async getByUser(userId: string, limit?: number): Promise<SelfCritiqueResult[]> {
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { userId },
      orderBy: { critiquedAt: 'desc' },
      take: limit,
    });
    return records.map(mapSelfCritique);
  }

  async create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult> {
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

  async update(id: string, updates: Partial<SelfCritiqueResult>): Promise<SelfCritiqueResult> {
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

  async getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null> {
    // Get all critique iterations for this response
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { responseId },
      orderBy: { iteration: 'asc' },
    });

    if (records.length === 0) return null;

    const critiques = records.map(mapSelfCritique);
    const firstCritique = critiques[0];
    const lastCritique = critiques[critiques.length - 1];

    // Convert SelfCritiqueResult[] to CritiqueIterationResult[]
    // Note: originalResponse/improvedResponse are not stored in DB,
    // so we reconstruct with available data
    const iterations: CritiqueIterationResult[] = critiques.map((critique, index) => ({
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
    const allFindings: CritiqueFinding[] = critiques.flatMap((c) => c.findings ?? []);
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
      improvementPercentage:
        firstCritique.overallScore > 0
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

  async saveLoopResult(result: SelfCritiqueLoopResult): Promise<void> {
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

export function createPrismaSelfEvaluationStores(config: PrismaSelfEvaluationStoreConfig) {
  return {
    confidenceScore: new PrismaConfidenceScoreStore(config),
    verificationResult: new PrismaVerificationResultStore(config),
    qualityRecord: new PrismaQualityRecordStore(config),
    calibration: new PrismaCalibrationStore(config),
    selfCritique: new PrismaSelfCritiqueStore(config),
  };
}
