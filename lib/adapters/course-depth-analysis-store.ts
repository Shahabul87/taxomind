import type {
  CourseDepthAnalysisCacheEntry,
  CourseDepthAnalysisHistoryEntry,
  CourseDepthAnalysisSnapshotInput,
  CourseDepthAnalysisStore,
  BloomsDistribution,
  LearningPathway,
  LearningGap,
  EnhancedRecommendations,
  StudentImpactAnalysis,
} from '@sam-ai/educational/depth-analysis';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/** Alias for the skills matrix type */
type SkillsMatrix = StudentImpactAnalysis['skillsDeveloped'];

/**
 * Type guard to check if a value is a valid BloomsDistribution
 */
function isBloomsDistribution(value: Prisma.JsonValue): value is BloomsDistribution & Prisma.JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Prisma.JsonObject;
  return (
    typeof obj.REMEMBER === 'number' &&
    typeof obj.UNDERSTAND === 'number' &&
    typeof obj.APPLY === 'number' &&
    typeof obj.ANALYZE === 'number' &&
    typeof obj.EVALUATE === 'number' &&
    typeof obj.CREATE === 'number'
  );
}

/**
 * Type guard to check if a value is a valid LearningPathway
 */
function isLearningPathway(value: Prisma.JsonValue): value is LearningPathway & Prisma.JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Prisma.JsonObject;
  return (
    typeof obj.current === 'object' &&
    typeof obj.recommended === 'object' &&
    Array.isArray(obj.gaps) &&
    Array.isArray(obj.milestones)
  );
}

/**
 * Type guard to check if a value is a valid SkillsMatrix array
 */
function isSkillsMatrix(value: Prisma.JsonValue): value is SkillsMatrix & Prisma.JsonArray {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }
    const skill = item as Prisma.JsonObject;
    return typeof skill.name === 'string' && typeof skill.proficiency === 'number';
  });
}

/**
 * Type guard to check if a value is a valid LearningGap array
 */
function isGapAnalysis(value: Prisma.JsonValue): value is LearningGap[] & Prisma.JsonArray {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }
    const gap = item as Prisma.JsonObject;
    return typeof gap.level === 'string' && typeof gap.severity === 'string';
  });
}

/**
 * Type guard to check if a value is a valid EnhancedRecommendations
 */
function isRecommendations(value: Prisma.JsonValue): value is EnhancedRecommendations & Prisma.JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Prisma.JsonObject;
  return (
    Array.isArray(obj.immediate) &&
    Array.isArray(obj.shortTerm) &&
    Array.isArray(obj.longTerm)
  );
}

export class PrismaCourseDepthAnalysisStore implements CourseDepthAnalysisStore {
  async getCachedAnalysis(courseId: string): Promise<CourseDepthAnalysisCacheEntry | null> {
    const existing = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!existing) {
      return null;
    }

    // Validate and convert JSON fields with type guards
    const bloomsDistribution = existing.bloomsDistribution;
    const learningPathway = existing.learningPathway;
    const skillsMatrix = existing.skillsMatrix;
    const gapAnalysis = existing.gapAnalysis;
    const recommendations = existing.recommendations;

    if (!isBloomsDistribution(bloomsDistribution)) {
      return null;
    }

    if (!isLearningPathway(learningPathway)) {
      return null;
    }

    if (!isSkillsMatrix(skillsMatrix)) {
      return null;
    }

    if (!isGapAnalysis(gapAnalysis)) {
      return null;
    }

    if (!isRecommendations(recommendations)) {
      return null;
    }

    return {
      courseId: existing.courseId,
      contentHash: existing.contentHash ?? null,
      analyzedAt: existing.analyzedAt,
      bloomsDistribution,
      cognitiveDepth: Number(existing.cognitiveDepth),
      learningPathway,
      skillsMatrix,
      gapAnalysis,
      recommendations,
    };
  }

  async saveAnalysis(courseId: string, data: CourseDepthAnalysisCacheEntry): Promise<void> {
    await db.courseBloomsAnalysis.upsert({
      where: { courseId },
      update: {
        bloomsDistribution: data.bloomsDistribution,
        cognitiveDepth: data.cognitiveDepth,
        learningPathway: data.learningPathway,
        skillsMatrix: data.skillsMatrix,
        gapAnalysis: data.gapAnalysis,
        recommendations: data.recommendations,
        contentHash: data.contentHash,
        analyzedAt: data.analyzedAt,
      },
      create: {
        courseId,
        bloomsDistribution: data.bloomsDistribution,
        cognitiveDepth: data.cognitiveDepth,
        learningPathway: data.learningPathway,
        skillsMatrix: data.skillsMatrix,
        gapAnalysis: data.gapAnalysis,
        recommendations: data.recommendations,
        contentHash: data.contentHash,
        analyzedAt: data.analyzedAt,
      },
    });
  }

  async listHistoricalSnapshots(courseId: string, limit: number): Promise<CourseDepthAnalysisHistoryEntry[]> {
    const snapshots = await db.courseAnalysisHistory.findMany({
      where: { courseId },
      orderBy: { snapshotAt: 'desc' },
      take: limit,
      select: {
        id: true,
        snapshotAt: true,
        cognitiveDepth: true,
        balanceScore: true,
        completenessScore: true,
        totalChapters: true,
        totalObjectives: true,
      },
    });

    return snapshots.map(snapshot => ({
      id: snapshot.id,
      snapshotAt: snapshot.snapshotAt,
      cognitiveDepth: Number(snapshot.cognitiveDepth),
      balanceScore: Number(snapshot.balanceScore),
      completenessScore: Number(snapshot.completenessScore),
      totalChapters: snapshot.totalChapters,
      totalObjectives: snapshot.totalObjectives,
    }));
  }

  async hasRecentSnapshot(courseId: string, since: Date): Promise<boolean> {
    const existing = await db.courseAnalysisHistory.findFirst({
      where: {
        courseId,
        snapshotAt: {
          gte: since,
        },
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async createHistoricalSnapshot(snapshot: CourseDepthAnalysisSnapshotInput): Promise<void> {
    await db.courseAnalysisHistory.create({
      data: {
        courseId: snapshot.courseId,
        snapshotAt: snapshot.snapshotAt,
        cognitiveDepth: snapshot.cognitiveDepth,
        balanceScore: snapshot.balanceScore,
        completenessScore: snapshot.completenessScore,
        totalChapters: snapshot.totalChapters,
        totalObjectives: snapshot.totalObjectives,
        metadata: snapshot.metadata,
      },
    });
  }
}
