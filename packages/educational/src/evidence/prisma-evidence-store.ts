/**
 * Prisma Analysis Evidence Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements AnalysisEvidenceStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

import type {
  AnalysisEvidenceStore,
  AnalysisEvidenceData,
  AnalysisEvidenceInput,
  EvidenceQuery,
  EvidenceSummary,
  EvidenceSourceType,
  TextPosition,
} from './types';

/**
 * Generic database interface for AnalysisEvidence operations
 * This allows the store to work with any Prisma-compatible client
 */
interface AnalysisEvidenceModel {
  create(args: { data: Record<string, unknown> }): Promise<AnalysisEvidenceRecord>;
  createMany(args: { data: Array<Record<string, unknown>> }): Promise<{ count: number }>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, string> | Array<Record<string, string>>;
    take?: number;
  }): Promise<AnalysisEvidenceRecord[]>;
  findUnique(args: { where: { id: string } }): Promise<AnalysisEvidenceRecord | null>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>;
  count(args: { where: Record<string, unknown> }): Promise<number>;
  groupBy(args: {
    by: string[];
    where?: Record<string, unknown>;
    _count?: { _all?: boolean };
    _avg?: Record<string, boolean>;
  }): Promise<Array<Record<string, unknown>>>;
}

interface AnalysisEvidenceRecord {
  id: string;
  analysisId: string;
  sourceType: string;
  sourceId: string;
  classification: string;
  confidence: number;
  triggerPatterns: string[];
  highlightedText: string | null;
  textPosition: unknown;
  context: string | null;
  createdAt: Date;
}

interface DatabaseClient {
  analysisEvidence: AnalysisEvidenceModel;
  $transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
}

/**
 * Prisma Analysis Evidence Store Implementation
 */
export class PrismaAnalysisEvidenceStore implements AnalysisEvidenceStore {
  private db: DatabaseClient;

  constructor(prismaClient: unknown) {
    // Cast to our interface - the actual Prisma client will satisfy this
    this.db = prismaClient as DatabaseClient;
  }

  /**
   * Store multiple evidence records for an analysis
   */
  async storeEvidence(
    analysisId: string,
    evidence: AnalysisEvidenceInput[]
  ): Promise<AnalysisEvidenceData[]> {
    // Use transaction to ensure all evidence is stored
    const createdRecords: AnalysisEvidenceData[] = [];

    // Create records one by one to get IDs (createMany doesn't return records)
    for (const e of evidence) {
      const record = await this.db.analysisEvidence.create({
        data: {
          analysisId,
          sourceType: e.sourceType,
          sourceId: e.sourceId,
          classification: e.classification,
          confidence: e.confidence,
          triggerPatterns: e.triggerPatterns,
          highlightedText: e.highlightedText ?? null,
          textPosition: e.textPosition ?? null,
          context: e.context ?? null,
        },
      });
      createdRecords.push(this.mapToData(record));
    }

    return createdRecords;
  }

  /**
   * Get all evidence for an analysis
   */
  async getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]> {
    const records = await this.db.analysisEvidence.findMany({
      where: { analysisId },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get evidence by classification
   */
  async getEvidenceByClassification(
    analysisId: string,
    classification: string
  ): Promise<AnalysisEvidenceData[]> {
    const records = await this.db.analysisEvidence.findMany({
      where: {
        analysisId,
        classification,
      },
      orderBy: { confidence: 'desc' },
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get evidence for a specific source
   */
  async getEvidenceForSource(
    sourceType: EvidenceSourceType,
    sourceId: string
  ): Promise<AnalysisEvidenceData[]> {
    const records = await this.db.analysisEvidence.findMany({
      where: {
        sourceType,
        sourceId,
      },
      orderBy: { confidence: 'desc' },
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Query evidence with filters
   */
  async queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]> {
    const where: Record<string, unknown> = {};

    if (query.analysisId) {
      where.analysisId = query.analysisId;
    }

    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }

    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }

    if (query.classification) {
      where.classification = query.classification;
    }

    if (query.minConfidence !== undefined) {
      where.confidence = { gte: query.minConfidence };
    }

    const records = await this.db.analysisEvidence.findMany({
      where,
      orderBy: { confidence: 'desc' },
      take: query.limit,
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get evidence summary for an analysis
   */
  async getSummary(analysisId: string): Promise<EvidenceSummary> {
    // Get all evidence for this analysis
    const evidence = await this.getEvidenceForAnalysis(analysisId);

    // Calculate summary
    const byClassification: Record<string, number> = {};
    const bySourceType: Record<EvidenceSourceType, number> = {} as Record<EvidenceSourceType, number>;
    let totalConfidence = 0;
    let highConfidenceCount = 0;
    let lowConfidenceCount = 0;

    for (const e of evidence) {
      // By classification
      byClassification[e.classification] = (byClassification[e.classification] || 0) + 1;

      // By source type
      const sourceType = e.sourceType as EvidenceSourceType;
      bySourceType[sourceType] = (bySourceType[sourceType] || 0) + 1;

      // Confidence stats
      totalConfidence += e.confidence;
      if (e.confidence >= 0.8) {
        highConfidenceCount++;
      }
      if (e.confidence < 0.5) {
        lowConfidenceCount++;
      }
    }

    const totalEvidence = evidence.length;
    const averageConfidence = totalEvidence > 0 ? totalConfidence / totalEvidence : 0;

    return {
      totalEvidence,
      byClassification,
      bySourceType,
      averageConfidence,
      highConfidenceCount,
      lowConfidenceCount,
    };
  }

  /**
   * Delete evidence for an analysis
   */
  async deleteEvidenceForAnalysis(analysisId: string): Promise<number> {
    const result = await this.db.analysisEvidence.deleteMany({
      where: { analysisId },
    });

    return result.count;
  }

  /**
   * Get evidence by ID
   */
  async getById(id: string): Promise<AnalysisEvidenceData | null> {
    const record = await this.db.analysisEvidence.findUnique({
      where: { id },
    });

    return record ? this.mapToData(record) : null;
  }

  /**
   * Map database record to AnalysisEvidenceData
   */
  private mapToData(record: AnalysisEvidenceRecord): AnalysisEvidenceData {
    return {
      id: record.id,
      analysisId: record.analysisId,
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      classification: record.classification,
      confidence: record.confidence,
      triggerPatterns: record.triggerPatterns,
      highlightedText: record.highlightedText,
      textPosition: record.textPosition as TextPosition | null,
      context: record.context,
      createdAt: record.createdAt,
    };
  }
}

/**
 * Create a Prisma analysis evidence store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
export function createPrismaAnalysisEvidenceStore(prismaClient: unknown): PrismaAnalysisEvidenceStore {
  return new PrismaAnalysisEvidenceStore(prismaClient);
}
