/**
 * Prisma Integrity Store Adapter
 * Provides database persistence for SAM Integrity Engine
 */

import { db } from '@/lib/db';
import type { SAMIntegrityVerdict, SAMIntegrityRisk } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface IntegrityCheck {
  id: string;
  userId: string;
  assignmentId: string | null;
  contentHash: string;
  contentLength: number;
  checkTypes: string[];
  plagiarismScore: number | null;
  plagiarismMatches: PlagiarismMatch[];
  aiDetectionScore: number | null;
  aiIndicators: AIIndicator[];
  consistencyScore: number | null;
  consistencyAnalysis: ConsistencyAnalysis | null;
  overallVerdict: SAMIntegrityVerdict;
  riskLevel: SAMIntegrityRisk;
  details: IntegrityDetails;
  recommendations: string[];
  createdAt: Date;
}

export interface PlagiarismMatch {
  sourceUrl?: string;
  sourceName: string;
  matchPercentage: number;
  matchedText: string;
  startPosition: number;
  endPosition: number;
}

export interface AIIndicator {
  type: string;
  confidence: number;
  evidence: string;
  location?: {
    start: number;
    end: number;
  };
}

export interface ConsistencyAnalysis {
  writingStyleScore: number;
  vocabularyConsistency: number;
  structureConsistency: number;
  toneConsistency: number;
  anomalies: string[];
}

export interface IntegrityDetails {
  processingTime: number;
  algorithmsUsed: string[];
  confidenceLevel: number;
  notes?: string;
}

export interface CreateIntegrityCheckInput {
  userId: string;
  assignmentId?: string;
  contentHash: string;
  contentLength: number;
  checkTypes: string[];
}

export interface IntegrityStore {
  create(input: CreateIntegrityCheckInput): Promise<IntegrityCheck>;
  getById(id: string): Promise<IntegrityCheck | null>;
  getByUserId(userId: string, limit?: number): Promise<IntegrityCheck[]>;
  getByAssignment(assignmentId: string): Promise<IntegrityCheck[]>;
  getByContentHash(contentHash: string): Promise<IntegrityCheck | null>;
  updatePlagiarismResult(id: string, score: number, matches: PlagiarismMatch[]): Promise<IntegrityCheck>;
  updateAIDetectionResult(id: string, score: number, indicators: AIIndicator[]): Promise<IntegrityCheck>;
  updateConsistencyResult(id: string, score: number, analysis: ConsistencyAnalysis): Promise<IntegrityCheck>;
  updateVerdict(id: string, verdict: SAMIntegrityVerdict, riskLevel: SAMIntegrityRisk): Promise<IntegrityCheck>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA INTEGRITY STORE
// ============================================================================

export class PrismaIntegrityStore implements IntegrityStore {
  /**
   * Create a new integrity check
   */
  async create(input: CreateIntegrityCheckInput): Promise<IntegrityCheck> {
    const check = await db.sAMIntegrityCheck.create({
      data: {
        userId: input.userId,
        assignmentId: input.assignmentId ?? null,
        contentHash: input.contentHash,
        contentLength: input.contentLength,
        checkTypes: input.checkTypes,
        overallVerdict: 'PENDING',
        riskLevel: 'LOW',
        plagiarismMatches: [],
        aiIndicators: [],
        details: {
          processingTime: 0,
          algorithmsUsed: input.checkTypes,
          confidenceLevel: 0,
        },
        recommendations: [],
      },
    });

    return this.mapToCheck(check);
  }

  /**
   * Get an integrity check by ID
   */
  async getById(id: string): Promise<IntegrityCheck | null> {
    const check = await db.sAMIntegrityCheck.findUnique({
      where: { id },
    });

    return check ? this.mapToCheck(check) : null;
  }

  /**
   * Get all integrity checks for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<IntegrityCheck[]> {
    const checks = await db.sAMIntegrityCheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return checks.map((c) => this.mapToCheck(c));
  }

  /**
   * Get integrity checks for an assignment
   */
  async getByAssignment(assignmentId: string): Promise<IntegrityCheck[]> {
    const checks = await db.sAMIntegrityCheck.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
    });

    return checks.map((c) => this.mapToCheck(c));
  }

  /**
   * Get check by content hash (for caching)
   */
  async getByContentHash(contentHash: string): Promise<IntegrityCheck | null> {
    const check = await db.sAMIntegrityCheck.findFirst({
      where: { contentHash },
      orderBy: { createdAt: 'desc' },
    });

    return check ? this.mapToCheck(check) : null;
  }

  /**
   * Update plagiarism detection results
   */
  async updatePlagiarismResult(
    id: string,
    score: number,
    matches: PlagiarismMatch[]
  ): Promise<IntegrityCheck> {
    const check = await db.sAMIntegrityCheck.update({
      where: { id },
      data: {
        plagiarismScore: score,
        plagiarismMatches: matches as unknown as Record<string, unknown>[],
      },
    });

    return this.mapToCheck(check);
  }

  /**
   * Update AI detection results
   */
  async updateAIDetectionResult(
    id: string,
    score: number,
    indicators: AIIndicator[]
  ): Promise<IntegrityCheck> {
    const check = await db.sAMIntegrityCheck.update({
      where: { id },
      data: {
        aiDetectionScore: score,
        aiIndicators: indicators as unknown as Record<string, unknown>[],
      },
    });

    return this.mapToCheck(check);
  }

  /**
   * Update consistency analysis results
   */
  async updateConsistencyResult(
    id: string,
    score: number,
    analysis: ConsistencyAnalysis
  ): Promise<IntegrityCheck> {
    const check = await db.sAMIntegrityCheck.update({
      where: { id },
      data: {
        consistencyScore: score,
        consistencyAnalysis: analysis as unknown as Record<string, unknown>,
      },
    });

    return this.mapToCheck(check);
  }

  /**
   * Update final verdict
   */
  async updateVerdict(
    id: string,
    verdict: SAMIntegrityVerdict,
    riskLevel: SAMIntegrityRisk
  ): Promise<IntegrityCheck> {
    // Generate recommendations based on verdict
    const recommendations = this.generateRecommendations(verdict, riskLevel);

    const check = await db.sAMIntegrityCheck.update({
      where: { id },
      data: {
        overallVerdict: verdict,
        riskLevel,
        recommendations,
      },
    });

    return this.mapToCheck(check);
  }

  /**
   * Delete an integrity check
   */
  async delete(id: string): Promise<void> {
    await db.sAMIntegrityCheck.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateRecommendations(
    verdict: SAMIntegrityVerdict,
    riskLevel: SAMIntegrityRisk
  ): string[] {
    const recommendations: string[] = [];

    if (verdict === 'FLAGGED' || verdict === 'FAILED') {
      if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        recommendations.push('Review submission with instructor');
        recommendations.push('Provide original drafts if available');
        recommendations.push('Explain research and writing process');
      }
      recommendations.push('Consider academic integrity guidelines');
      recommendations.push('Resubmit with proper citations');
    } else if (verdict === 'REVIEW_NEEDED') {
      recommendations.push('Review flagged sections for improvement');
      recommendations.push('Add citations where needed');
    }

    return recommendations;
  }

  private mapToCheck(
    record: Awaited<ReturnType<typeof db.sAMIntegrityCheck.findUnique>>
  ): IntegrityCheck {
    if (!record) {
      throw new Error('IntegrityCheck record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      assignmentId: record.assignmentId,
      contentHash: record.contentHash,
      contentLength: record.contentLength,
      checkTypes: record.checkTypes,
      plagiarismScore: record.plagiarismScore,
      plagiarismMatches: record.plagiarismMatches as unknown as PlagiarismMatch[],
      aiDetectionScore: record.aiDetectionScore,
      aiIndicators: record.aiIndicators as unknown as AIIndicator[],
      consistencyScore: record.consistencyScore,
      consistencyAnalysis: record.consistencyAnalysis as unknown as ConsistencyAnalysis | null,
      overallVerdict: record.overallVerdict,
      riskLevel: record.riskLevel,
      details: record.details as unknown as IntegrityDetails,
      recommendations: record.recommendations,
      createdAt: record.createdAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaIntegrityStore(): PrismaIntegrityStore {
  return new PrismaIntegrityStore();
}
