/**
 * Knowledge Graph Engine Adapter
 *
 * Provides database persistence for KnowledgeGraphEngine from @sam-ai/educational.
 * Extends the SAMDatabaseAdapter with additional methods for concept and graph storage.
 */

import { db } from '@/lib/db';
import type {
  Concept,
  ConceptRelation,
  KnowledgeGraph,
  ConceptMastery,
  ConceptMasteryLevel,
  CourseStructureQuality,
  KnowledgeGraphRecommendation,
  GraphStats,
  ConceptType,
} from '@sam-ai/educational';
import type { BloomsLevel } from '@sam-ai/core';

// ============================================================================
// TYPES
// ============================================================================

export interface KnowledgeGraphDatabaseAdapter {
  // Concept operations
  saveConcept(concept: Concept): Promise<void>;
  getConcept(conceptId: string): Promise<Concept | null>;
  getConceptsByCourse(courseId: string): Promise<Concept[]>;
  deleteConcept(conceptId: string): Promise<void>;

  // Relation operations
  saveRelation(relation: ConceptRelation): Promise<void>;
  getRelationsByCourse(courseId: string): Promise<ConceptRelation[]>;
  deleteRelation(relationId: string): Promise<void>;

  // Graph operations
  saveGraph(graph: KnowledgeGraph): Promise<void>;
  getGraph(courseId: string): Promise<KnowledgeGraph | null>;
  deleteGraph(courseId: string): Promise<void>;

  // Mastery operations
  getMastery(userId: string, conceptId: string): Promise<ConceptMastery | null>;
  saveMastery(mastery: ConceptMastery): Promise<void>;
  getUserMasteries(userId: string, conceptIds?: string[]): Promise<ConceptMastery[]>;
}

// ============================================================================
// PRISMA ADAPTER IMPLEMENTATION
// ============================================================================

export class PrismaKnowledgeGraphDatabaseAdapter implements KnowledgeGraphDatabaseAdapter {
  // ============================================================================
  // CONCEPT OPERATIONS
  // ============================================================================

  async saveConcept(concept: Concept): Promise<void> {
    await db.sAMKnowledgeConcept.upsert({
      where: { id: concept.id },
      create: {
        id: concept.id,
        courseId: concept.sourceContext?.courseId ?? '',
        chapterId: concept.sourceContext?.chapterId,
        sectionId: concept.sourceContext?.sectionId,
        name: concept.name,
        description: concept.description,
        type: concept.type,
        bloomsLevel: concept.bloomsLevel,
        keywords: concept.keywords,
        confidence: concept.confidence,
        metadata: concept.metadata ?? {},
      },
      update: {
        name: concept.name,
        description: concept.description,
        type: concept.type,
        bloomsLevel: concept.bloomsLevel,
        keywords: concept.keywords,
        confidence: concept.confidence,
        metadata: concept.metadata ?? {},
        updatedAt: new Date(),
      },
    });
  }

  async getConcept(conceptId: string): Promise<Concept | null> {
    const record = await db.sAMKnowledgeConcept.findUnique({
      where: { id: conceptId },
    });

    if (!record) return null;

    return this.mapToConcept(record);
  }

  async getConceptsByCourse(courseId: string): Promise<Concept[]> {
    const records = await db.sAMKnowledgeConcept.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(this.mapToConcept);
  }

  async deleteConcept(conceptId: string): Promise<void> {
    await db.sAMKnowledgeConcept.delete({
      where: { id: conceptId },
    });
  }

  private mapToConcept(record: {
    id: string;
    courseId: string;
    chapterId: string | null;
    sectionId: string | null;
    name: string;
    description: string;
    type: string;
    bloomsLevel: string;
    keywords: string[];
    confidence: number;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Concept {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.type as ConceptType,
      bloomsLevel: record.bloomsLevel as BloomsLevel,
      keywords: record.keywords,
      sourceContext: {
        courseId: record.courseId,
        chapterId: record.chapterId ?? undefined,
        sectionId: record.sectionId ?? undefined,
      },
      confidence: record.confidence,
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ============================================================================
  // RELATION OPERATIONS
  // ============================================================================

  async saveRelation(relation: ConceptRelation): Promise<void> {
    await db.sAMConceptRelation.upsert({
      where: {
        sourceConceptId_targetConceptId_relationType: {
          sourceConceptId: relation.sourceConceptId,
          targetConceptId: relation.targetConceptId,
          relationType: relation.relationType,
        },
      },
      create: {
        id: relation.id,
        sourceConceptId: relation.sourceConceptId,
        targetConceptId: relation.targetConceptId,
        relationType: relation.relationType,
        strength: relation.strength,
        confidence: relation.confidence,
        description: relation.description,
      },
      update: {
        strength: relation.strength,
        confidence: relation.confidence,
        description: relation.description,
      },
    });
  }

  async getRelationsByCourse(courseId: string): Promise<ConceptRelation[]> {
    const concepts = await db.sAMKnowledgeConcept.findMany({
      where: { courseId },
      select: { id: true },
    });

    const conceptIds = concepts.map(c => c.id);

    const records = await db.sAMConceptRelation.findMany({
      where: {
        OR: [
          { sourceConceptId: { in: conceptIds } },
          { targetConceptId: { in: conceptIds } },
        ],
      },
    });

    return records.map(this.mapToRelation);
  }

  async deleteRelation(relationId: string): Promise<void> {
    await db.sAMConceptRelation.delete({
      where: { id: relationId },
    });
  }

  private mapToRelation(record: {
    id: string;
    sourceConceptId: string;
    targetConceptId: string;
    relationType: string;
    strength: number;
    confidence: number;
    description: string | null;
    createdAt: Date;
  }): ConceptRelation {
    return {
      id: record.id,
      sourceConceptId: record.sourceConceptId,
      targetConceptId: record.targetConceptId,
      relationType: record.relationType as ConceptRelation['relationType'],
      strength: record.strength,
      confidence: record.confidence,
      description: record.description ?? undefined,
      createdAt: record.createdAt,
    };
  }

  // ============================================================================
  // GRAPH OPERATIONS
  // ============================================================================

  async saveGraph(graph: KnowledgeGraph): Promise<void> {
    // Save concepts
    for (const concept of graph.concepts) {
      await this.saveConcept(concept);
    }

    // Save relations
    for (const relation of graph.relations) {
      await this.saveRelation(relation);
    }

    // Save graph metadata
    await db.sAMKnowledgeGraph.upsert({
      where: { courseId: graph.courseId },
      create: {
        id: graph.id,
        courseId: graph.courseId,
        totalConcepts: graph.stats.totalConcepts,
        totalRelations: graph.stats.totalRelations,
        maxDepth: graph.stats.maxDepth,
        averageConnections: graph.stats.averageConnections,
        rootConcepts: graph.rootConcepts,
        terminalConcepts: graph.terminalConcepts,
        stats: graph.stats as unknown as Record<string, unknown>,
      },
      update: {
        totalConcepts: graph.stats.totalConcepts,
        totalRelations: graph.stats.totalRelations,
        maxDepth: graph.stats.maxDepth,
        averageConnections: graph.stats.averageConnections,
        rootConcepts: graph.rootConcepts,
        terminalConcepts: graph.terminalConcepts,
        stats: graph.stats as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
  }

  async getGraph(courseId: string): Promise<KnowledgeGraph | null> {
    const record = await db.sAMKnowledgeGraph.findUnique({
      where: { courseId },
    });

    if (!record) return null;

    // Fetch concepts and relations
    const concepts = await this.getConceptsByCourse(courseId);
    const relations = await this.getRelationsByCourse(courseId);

    return {
      id: record.id,
      courseId: record.courseId,
      concepts,
      relations,
      rootConcepts: record.rootConcepts,
      terminalConcepts: record.terminalConcepts,
      stats: (typeof record.stats === 'object' && record.stats !== null ? record.stats : {}) as unknown as GraphStats,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async deleteGraph(courseId: string): Promise<void> {
    // Delete in correct order due to foreign keys
    const concepts = await db.sAMKnowledgeConcept.findMany({
      where: { courseId },
      select: { id: true },
    });

    const conceptIds = concepts.map(c => c.id);

    // Delete relations first
    await db.sAMConceptRelation.deleteMany({
      where: {
        OR: [
          { sourceConceptId: { in: conceptIds } },
          { targetConceptId: { in: conceptIds } },
        ],
      },
    });

    // Delete masteries
    await db.sAMConceptMastery.deleteMany({
      where: { conceptId: { in: conceptIds } },
    });

    // Delete concepts
    await db.sAMKnowledgeConcept.deleteMany({
      where: { courseId },
    });

    // Delete graph metadata
    await db.sAMKnowledgeGraph.delete({
      where: { courseId },
    }).catch(() => {
      // Graph may not exist
    });
  }

  // ============================================================================
  // MASTERY OPERATIONS
  // ============================================================================

  async getMastery(userId: string, conceptId: string): Promise<ConceptMastery | null> {
    const record = await db.sAMConceptMastery.findUnique({
      where: {
        userId_conceptId: { userId, conceptId },
      },
    });

    if (!record) return null;

    return this.mapToMastery(record);
  }

  async saveMastery(mastery: ConceptMastery): Promise<void> {
    await db.sAMConceptMastery.upsert({
      where: {
        userId_conceptId: {
          userId: mastery.userId,
          conceptId: mastery.conceptId,
        },
      },
      create: {
        userId: mastery.userId,
        conceptId: mastery.conceptId,
        masteryLevel: mastery.masteryLevel,
        score: mastery.score,
        practiceCount: mastery.practiceCount,
        evidence: mastery.evidence as unknown as Record<string, unknown>,
        lastPracticedAt: mastery.lastPracticedAt,
      },
      update: {
        masteryLevel: mastery.masteryLevel,
        score: mastery.score,
        practiceCount: mastery.practiceCount,
        evidence: mastery.evidence as unknown as Record<string, unknown>,
        lastPracticedAt: mastery.lastPracticedAt,
        updatedAt: new Date(),
      },
    });
  }

  async getUserMasteries(userId: string, conceptIds?: string[]): Promise<ConceptMastery[]> {
    const records = await db.sAMConceptMastery.findMany({
      where: {
        userId,
        ...(conceptIds ? { conceptId: { in: conceptIds } } : {}),
      },
    });

    return records.map(this.mapToMastery);
  }

  private mapToMastery(record: {
    id: string;
    userId: string;
    conceptId: string;
    masteryLevel: string;
    score: number;
    practiceCount: number;
    evidence: unknown;
    lastPracticedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ConceptMastery {
    return {
      userId: record.userId,
      conceptId: record.conceptId,
      masteryLevel: record.masteryLevel as ConceptMasteryLevel,
      score: record.score,
      practiceCount: record.practiceCount,
      evidence: (record.evidence as ConceptMastery['evidence']) ?? [],
      lastPracticedAt: record.lastPracticedAt ?? undefined,
      updatedAt: record.updatedAt,
    };
  }

  // ============================================================================
  // QUALITY OPERATIONS
  // ============================================================================

  async saveQualityAssessment(
    courseId: string,
    quality: CourseStructureQuality,
    recommendations: KnowledgeGraphRecommendation[]
  ): Promise<void> {
    await db.sAMKnowledgeGraph.update({
      where: { courseId },
      data: {
        structureQuality: quality as unknown as Record<string, unknown>,
        recommendations: recommendations as unknown as Record<string, unknown>[],
        updatedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let adapterInstance: PrismaKnowledgeGraphDatabaseAdapter | null = null;

export function getKnowledgeGraphEngineAdapter(): PrismaKnowledgeGraphDatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = new PrismaKnowledgeGraphDatabaseAdapter();
  }
  return adapterInstance;
}

export function resetKnowledgeGraphEngineAdapter(): void {
  adapterInstance = null;
}
