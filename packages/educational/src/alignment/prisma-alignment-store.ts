/**
 * Prisma Alignment Matrix Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements AlignmentMatrixStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

import type {
  AlignmentMatrixStore,
  AlignmentMatrixData,
  AlignmentMatrixCreateInput,
  AlignmentMatrixUpdateInput,
  ObjectiveAlignment,
  SectionAlignment,
  AssessmentAlignment,
  AlignmentGap,
} from './types';

/**
 * Generic database interface for AlignmentMatrix operations
 * This allows the store to work with any Prisma-compatible client
 */
interface AlignmentMatrixModel {
  create(args: { data: Record<string, unknown> }): Promise<AlignmentMatrixRecord>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<AlignmentMatrixRecord>;
  upsert(args: {
    where: { courseId: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<AlignmentMatrixRecord>;
  findUnique(args: { where: { id?: string; courseId?: string } }): Promise<AlignmentMatrixRecord | null>;
  delete(args: { where: { id?: string; courseId?: string } }): Promise<AlignmentMatrixRecord>;
}

interface AlignmentMatrixRecord {
  id: string;
  courseId: string;
  objectiveAlignments: unknown;
  sectionAlignments: unknown;
  assessmentAlignments: unknown;
  coverageScore: number;
  redundancyScore: number;
  alignmentScore: number;
  gaps: unknown;
  gapCount: number;
  criticalGapCount: number;
  totalObjectives: number;
  fullyCoveredObjectives: number;
  partialObjectives: number;
  uncoveredObjectives: number;
  analysisVersion: string;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseClient {
  alignmentMatrix: AlignmentMatrixModel;
}

/**
 * Prisma Alignment Matrix Store Implementation
 */
export class PrismaAlignmentMatrixStore implements AlignmentMatrixStore {
  private db: DatabaseClient;

  constructor(prismaClient: unknown) {
    // Cast to our interface - the actual Prisma client will satisfy this
    this.db = prismaClient as DatabaseClient;
  }

  /**
   * Create a new alignment matrix record
   */
  async create(input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData> {
    const record = await this.db.alignmentMatrix.create({
      data: {
        courseId: input.courseId,
        objectiveAlignments: input.objectiveAlignments,
        sectionAlignments: input.sectionAlignments,
        assessmentAlignments: input.assessmentAlignments,
        coverageScore: input.coverageScore,
        redundancyScore: input.redundancyScore,
        alignmentScore: input.alignmentScore,
        gaps: input.gaps ?? null,
        gapCount: input.gapCount,
        criticalGapCount: input.criticalGapCount,
        totalObjectives: input.totalObjectives,
        fullyCoveredObjectives: input.fullyCoveredObjectives,
        partialObjectives: input.partialObjectives,
        uncoveredObjectives: input.uncoveredObjectives,
        analysisVersion: input.analysisVersion,
        analyzedAt: new Date(),
      },
    });

    return this.mapToData(record);
  }

  /**
   * Update an existing alignment matrix
   */
  async update(id: string, input: AlignmentMatrixUpdateInput): Promise<AlignmentMatrixData> {
    const data: Record<string, unknown> = {};

    if (input.objectiveAlignments !== undefined) data.objectiveAlignments = input.objectiveAlignments;
    if (input.sectionAlignments !== undefined) data.sectionAlignments = input.sectionAlignments;
    if (input.assessmentAlignments !== undefined) data.assessmentAlignments = input.assessmentAlignments;
    if (input.coverageScore !== undefined) data.coverageScore = input.coverageScore;
    if (input.redundancyScore !== undefined) data.redundancyScore = input.redundancyScore;
    if (input.alignmentScore !== undefined) data.alignmentScore = input.alignmentScore;
    if (input.gaps !== undefined) data.gaps = input.gaps;
    if (input.gapCount !== undefined) data.gapCount = input.gapCount;
    if (input.criticalGapCount !== undefined) data.criticalGapCount = input.criticalGapCount;
    if (input.totalObjectives !== undefined) data.totalObjectives = input.totalObjectives;
    if (input.fullyCoveredObjectives !== undefined) data.fullyCoveredObjectives = input.fullyCoveredObjectives;
    if (input.partialObjectives !== undefined) data.partialObjectives = input.partialObjectives;
    if (input.uncoveredObjectives !== undefined) data.uncoveredObjectives = input.uncoveredObjectives;
    if (input.analysisVersion !== undefined) data.analysisVersion = input.analysisVersion;
    if (input.analyzedAt !== undefined) data.analyzedAt = input.analyzedAt;

    const record = await this.db.alignmentMatrix.update({
      where: { id },
      data,
    });

    return this.mapToData(record);
  }

  /**
   * Upsert alignment matrix (create or update by courseId)
   */
  async upsert(
    courseId: string,
    input: AlignmentMatrixCreateInput
  ): Promise<AlignmentMatrixData> {
    const record = await this.db.alignmentMatrix.upsert({
      where: { courseId },
      create: {
        courseId: input.courseId,
        objectiveAlignments: input.objectiveAlignments,
        sectionAlignments: input.sectionAlignments,
        assessmentAlignments: input.assessmentAlignments,
        coverageScore: input.coverageScore,
        redundancyScore: input.redundancyScore,
        alignmentScore: input.alignmentScore,
        gaps: input.gaps ?? null,
        gapCount: input.gapCount,
        criticalGapCount: input.criticalGapCount,
        totalObjectives: input.totalObjectives,
        fullyCoveredObjectives: input.fullyCoveredObjectives,
        partialObjectives: input.partialObjectives,
        uncoveredObjectives: input.uncoveredObjectives,
        analysisVersion: input.analysisVersion,
        analyzedAt: new Date(),
      },
      update: {
        objectiveAlignments: input.objectiveAlignments,
        sectionAlignments: input.sectionAlignments,
        assessmentAlignments: input.assessmentAlignments,
        coverageScore: input.coverageScore,
        redundancyScore: input.redundancyScore,
        alignmentScore: input.alignmentScore,
        gaps: input.gaps ?? null,
        gapCount: input.gapCount,
        criticalGapCount: input.criticalGapCount,
        totalObjectives: input.totalObjectives,
        fullyCoveredObjectives: input.fullyCoveredObjectives,
        partialObjectives: input.partialObjectives,
        uncoveredObjectives: input.uncoveredObjectives,
        analysisVersion: input.analysisVersion,
        analyzedAt: new Date(),
      },
    });

    return this.mapToData(record);
  }

  /**
   * Get alignment matrix by ID
   */
  async getById(id: string): Promise<AlignmentMatrixData | null> {
    const record = await this.db.alignmentMatrix.findUnique({
      where: { id },
    });

    return record ? this.mapToData(record) : null;
  }

  /**
   * Get alignment matrix by course ID
   */
  async getByCourseId(courseId: string): Promise<AlignmentMatrixData | null> {
    const record = await this.db.alignmentMatrix.findUnique({
      where: { courseId },
    });

    return record ? this.mapToData(record) : null;
  }

  /**
   * Delete alignment matrix
   */
  async delete(id: string): Promise<void> {
    await this.db.alignmentMatrix.delete({
      where: { id },
    });
  }

  /**
   * Delete alignment matrix by course ID
   */
  async deleteByCourseId(courseId: string): Promise<void> {
    await this.db.alignmentMatrix.delete({
      where: { courseId },
    });
  }

  /**
   * Map database record to AlignmentMatrixData
   */
  private mapToData(record: AlignmentMatrixRecord): AlignmentMatrixData {
    return {
      id: record.id,
      courseId: record.courseId,
      objectiveAlignments: record.objectiveAlignments as ObjectiveAlignment[],
      sectionAlignments: record.sectionAlignments as SectionAlignment[],
      assessmentAlignments: record.assessmentAlignments as AssessmentAlignment[],
      coverageScore: record.coverageScore,
      redundancyScore: record.redundancyScore,
      alignmentScore: record.alignmentScore,
      gaps: record.gaps as AlignmentGap[] | null,
      gapCount: record.gapCount,
      criticalGapCount: record.criticalGapCount,
      totalObjectives: record.totalObjectives,
      fullyCoveredObjectives: record.fullyCoveredObjectives,
      partialObjectives: record.partialObjectives,
      uncoveredObjectives: record.uncoveredObjectives,
      analysisVersion: record.analysisVersion,
      analyzedAt: record.analyzedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

/**
 * Create a Prisma alignment matrix store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
export function createPrismaAlignmentMatrixStore(prismaClient: unknown): PrismaAlignmentMatrixStore {
  return new PrismaAlignmentMatrixStore(prismaClient);
}
