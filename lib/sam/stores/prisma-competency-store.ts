/**
 * Prisma Competency Store Adapter
 * Provides database persistence for SAM Competency Engine
 */

import { db } from '@/lib/db';
import type { SAMCompetencyLevel } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CompetencyAssessment {
  id: string;
  userId: string;
  competencyFramework: string;
  assessmentData: CompetencyData[];
  overallScore: number | null;
  level: SAMCompetencyLevel;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  careerPaths: CareerPath[];
  portfolioItems: PortfolioItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetencyData {
  competencyId: string;
  competencyName: string;
  score: number;
  evidence: string[];
  assessedAt?: Date;
  assessorNotes?: string;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  requiredCompetencies: string[];
  matchScore: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  competencies: string[];
  addedAt: Date;
}

export interface CreateCompetencyInput {
  userId: string;
  competencyFramework: string;
  assessmentData: CompetencyData[];
  overallScore?: number;
  level?: SAMCompetencyLevel;
}

export interface CompetencyStore {
  create(input: CreateCompetencyInput): Promise<CompetencyAssessment>;
  getById(id: string): Promise<CompetencyAssessment | null>;
  getByUserId(userId: string, limit?: number): Promise<CompetencyAssessment[]>;
  getLatestByFramework(userId: string, framework: string): Promise<CompetencyAssessment | null>;
  updateStrengthsAndGaps(id: string, strengths: string[], gaps: string[]): Promise<CompetencyAssessment>;
  updateRecommendations(id: string, recommendations: string[]): Promise<CompetencyAssessment>;
  updateCareerPaths(id: string, careerPaths: CareerPath[]): Promise<CompetencyAssessment>;
  addPortfolioItem(id: string, item: PortfolioItem): Promise<CompetencyAssessment>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA COMPETENCY STORE
// ============================================================================

export class PrismaCompetencyStore implements CompetencyStore {
  /**
   * Create a new competency assessment
   */
  async create(input: CreateCompetencyInput): Promise<CompetencyAssessment> {
    const assessment = await db.sAMCompetencyAssessment.create({
      data: {
        userId: input.userId,
        competencyFramework: input.competencyFramework,
        assessmentData: input.assessmentData as unknown as Record<string, unknown>[],
        overallScore: input.overallScore ?? null,
        level: input.level ?? 'BEGINNER',
        strengths: [],
        gaps: [],
        recommendations: [],
        careerPaths: [],
        portfolioItems: [],
      },
    });

    return this.mapToAssessment(assessment);
  }

  /**
   * Get a competency assessment by ID
   */
  async getById(id: string): Promise<CompetencyAssessment | null> {
    const assessment = await db.sAMCompetencyAssessment.findUnique({
      where: { id },
    });

    return assessment ? this.mapToAssessment(assessment) : null;
  }

  /**
   * Get all competency assessments for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<CompetencyAssessment[]> {
    const assessments = await db.sAMCompetencyAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return assessments.map((a) => this.mapToAssessment(a));
  }

  /**
   * Get the latest assessment for a specific framework
   */
  async getLatestByFramework(userId: string, framework: string): Promise<CompetencyAssessment | null> {
    const assessment = await db.sAMCompetencyAssessment.findFirst({
      where: { userId, competencyFramework: framework },
      orderBy: { createdAt: 'desc' },
    });

    return assessment ? this.mapToAssessment(assessment) : null;
  }

  /**
   * Update strengths and gaps analysis
   */
  async updateStrengthsAndGaps(
    id: string,
    strengths: string[],
    gaps: string[]
  ): Promise<CompetencyAssessment> {
    const assessment = await db.sAMCompetencyAssessment.update({
      where: { id },
      data: { strengths, gaps },
    });

    return this.mapToAssessment(assessment);
  }

  /**
   * Update recommendations
   */
  async updateRecommendations(id: string, recommendations: string[]): Promise<CompetencyAssessment> {
    const assessment = await db.sAMCompetencyAssessment.update({
      where: { id },
      data: { recommendations },
    });

    return this.mapToAssessment(assessment);
  }

  /**
   * Update career paths
   */
  async updateCareerPaths(id: string, careerPaths: CareerPath[]): Promise<CompetencyAssessment> {
    const assessment = await db.sAMCompetencyAssessment.update({
      where: { id },
      data: {
        careerPaths: careerPaths as unknown as Record<string, unknown>[],
      },
    });

    return this.mapToAssessment(assessment);
  }

  /**
   * Add a portfolio item
   */
  async addPortfolioItem(id: string, item: PortfolioItem): Promise<CompetencyAssessment> {
    const current = await db.sAMCompetencyAssessment.findUnique({
      where: { id },
      select: { portfolioItems: true },
    });

    const currentItems = (current?.portfolioItems as unknown as PortfolioItem[]) ?? [];

    const assessment = await db.sAMCompetencyAssessment.update({
      where: { id },
      data: {
        portfolioItems: [...currentItems, item] as unknown as Record<string, unknown>[],
      },
    });

    return this.mapToAssessment(assessment);
  }

  /**
   * Delete a competency assessment
   */
  async delete(id: string): Promise<void> {
    await db.sAMCompetencyAssessment.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToAssessment(
    record: Awaited<ReturnType<typeof db.sAMCompetencyAssessment.findUnique>>
  ): CompetencyAssessment {
    if (!record) {
      throw new Error('CompetencyAssessment record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      competencyFramework: record.competencyFramework,
      assessmentData: record.assessmentData as unknown as CompetencyData[],
      overallScore: record.overallScore,
      level: record.level,
      strengths: record.strengths,
      gaps: record.gaps,
      recommendations: record.recommendations,
      careerPaths: record.careerPaths as unknown as CareerPath[],
      portfolioItems: record.portfolioItems as unknown as PortfolioItem[],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaCompetencyStore(): PrismaCompetencyStore {
  return new PrismaCompetencyStore();
}
