/**
 * Prisma Student Profile Store
 *
 * Database-backed implementation for student learning profiles.
 */

// ============================================================================
// TYPES
// ============================================================================

export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'proficient' | 'expert';

export interface TopicMastery {
  topicId: string;
  level: MasteryLevel;
  score: number;
  bloomsLevel: BloomsLevel;
  assessmentCount: number;
  averageScore: number;
  lastAssessedAt: Date;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
}

export interface MasteryUpdate {
  topicId: string;
  score: number;
  maxScore: number;
  bloomsLevel: BloomsLevel;
  timestamp: Date;
}

export interface PathwayStep {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
}

export interface LearningPathway {
  id: string;
  studentId: string;
  courseId: string;
  steps: PathwayStep[];
  currentStepIndex: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused';
}

export interface PathwayAdjustment {
  type: 'skip_ahead' | 'add_remediation' | 'reorder' | 'add_challenge' | 'no_change';
  newCurrentStepIndex?: number;
  stepsToAdd?: PathwayStep[];
  stepsToRemove?: string[];
  newOrder?: string[];
}

export interface PerformanceMetrics {
  overallAverageScore: number;
  totalAssessments: number;
  weeklyAssessments: number;
  currentStreak: number;
  longestStreak: number;
  topicsMastered: number;
  totalStudyTimeMinutes: number;
  averageSessionDuration: number;
  completionRate: number;
}

export interface CognitivePreferences {
  learningStyles: string[];
  contentLengthPreference: 'brief' | 'moderate' | 'detailed';
  pacePreference: 'slow' | 'moderate' | 'fast';
  challengePreference: 'easy' | 'moderate' | 'challenging';
  examplesFirst: boolean;
}

export interface StudentProfile {
  id: string;
  userId: string;
  masteryByTopic: Record<string, TopicMastery>;
  activePathways: LearningPathway[];
  cognitivePreferences: CognitivePreferences;
  performanceMetrics: PerformanceMetrics;
  overallBloomsDistribution: Record<BloomsLevel, number>;
  knowledgeGaps: string[];
  strengths: string[];
  createdAt: Date;
  lastActiveAt: Date;
  updatedAt: Date;
}

export interface StudentProfileStore {
  get(studentId: string): Promise<StudentProfile | null>;
  save(profile: StudentProfile): Promise<void>;
  updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
  getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
  updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
  getActivePathways(studentId: string): Promise<LearningPathway[]>;
  updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
  getKnowledgeGaps(studentId: string): Promise<string[]>;
  delete(studentId: string): Promise<void>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PrismaStudentProfileStoreConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  profileTableName?: string;
  masteryTableName?: string;
  pathwayTableName?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateMasteryLevel(score: number): MasteryLevel {
  if (score >= 90) return 'expert';
  if (score >= 80) return 'proficient';
  if (score >= 70) return 'intermediate';
  if (score >= 50) return 'beginner';
  return 'novice';
}

function calculateTrend(
  currentScore: number,
  previousScore: number
): 'improving' | 'stable' | 'declining' {
  const difference = currentScore - previousScore;
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

function calculateConfidence(assessmentCount: number): number {
  return Math.min(0.95, 0.5 + assessmentCount * 0.05);
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PrismaStudentProfileStore implements StudentProfileStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;
  private profileTableName: string;
  private masteryTableName: string;
  private pathwayTableName: string;

  constructor(config: PrismaStudentProfileStoreConfig) {
    this.prisma = config.prisma;
    this.profileTableName = config.profileTableName ?? 'studentProfile';
    this.masteryTableName = config.masteryTableName ?? 'topicMastery';
    this.pathwayTableName = config.pathwayTableName ?? 'learningPathway';
  }

  async get(studentId: string): Promise<StudentProfile | null> {
    const result = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId },
      include: { masteryRecords: true, pathways: true },
    });
    return result ? this.mapToProfile(result) : null;
  }

  async save(profile: StudentProfile): Promise<void> {
    await this.prisma[this.profileTableName].upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        userId: profile.userId,
        cognitivePreferences: profile.cognitivePreferences,
        performanceMetrics: profile.performanceMetrics,
        overallBloomsDistribution: profile.overallBloomsDistribution,
        knowledgeGaps: profile.knowledgeGaps,
        strengths: profile.strengths,
        createdAt: profile.createdAt,
        lastActiveAt: profile.lastActiveAt,
        updatedAt: new Date(),
      },
      update: {
        cognitivePreferences: profile.cognitivePreferences,
        performanceMetrics: profile.performanceMetrics,
        overallBloomsDistribution: profile.overallBloomsDistribution,
        knowledgeGaps: profile.knowledgeGaps,
        strengths: profile.strengths,
        lastActiveAt: profile.lastActiveAt,
        updatedAt: new Date(),
      },
    });
  }

  async updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery> {
    const scorePercent = (update.score / update.maxScore) * 100;

    const existing = await this.prisma[this.masteryTableName].findUnique({
      where: { studentId_topicId: { studentId, topicId: update.topicId } },
    });

    if (existing) {
      const newAssessmentCount = existing.assessmentCount + 1;
      const newAverageScore =
        (existing.averageScore * existing.assessmentCount + scorePercent) / newAssessmentCount;

      const result = await this.prisma[this.masteryTableName].update({
        where: { studentId_topicId: { studentId, topicId: update.topicId } },
        data: {
          level: calculateMasteryLevel(newAverageScore),
          score: newAverageScore,
          bloomsLevel: update.bloomsLevel,
          assessmentCount: newAssessmentCount,
          averageScore: newAverageScore,
          lastAssessedAt: update.timestamp,
          trend: calculateTrend(scorePercent, existing.score),
          confidence: calculateConfidence(newAssessmentCount),
        },
      });
      return this.mapToMastery(result);
    } else {
      const result = await this.prisma[this.masteryTableName].create({
        data: {
          studentId,
          topicId: update.topicId,
          level: calculateMasteryLevel(scorePercent),
          score: scorePercent,
          bloomsLevel: update.bloomsLevel,
          assessmentCount: 1,
          averageScore: scorePercent,
          lastAssessedAt: update.timestamp,
          trend: 'stable',
          confidence: calculateConfidence(1),
        },
      });
      return this.mapToMastery(result);
    }
  }

  async getMastery(studentId: string, topicId: string): Promise<TopicMastery | null> {
    const result = await this.prisma[this.masteryTableName].findUnique({
      where: { studentId_topicId: { studentId, topicId } },
    });
    return result ? this.mapToMastery(result) : null;
  }

  async updatePathway(
    studentId: string,
    pathwayId: string,
    adjustment: PathwayAdjustment
  ): Promise<LearningPathway> {
    const pathway = await this.prisma[this.pathwayTableName].findUnique({
      where: { id: pathwayId },
    });

    if (!pathway || pathway.studentId !== studentId) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }

    let steps = pathway.steps as PathwayStep[];

    switch (adjustment.type) {
      case 'add_remediation':
        if (adjustment.stepsToAdd) {
          steps = [
            ...steps.slice(0, pathway.currentStepIndex),
            ...adjustment.stepsToAdd,
            ...steps.slice(pathway.currentStepIndex),
          ];
        }
        break;
      case 'add_challenge':
        if (adjustment.stepsToAdd) {
          steps = [
            ...steps.slice(0, pathway.currentStepIndex + 1),
            ...adjustment.stepsToAdd,
            ...steps.slice(pathway.currentStepIndex + 1),
          ];
        }
        break;
      default:
        break;
    }

    const result = await this.prisma[this.pathwayTableName].update({
      where: { id: pathwayId },
      data: {
        steps,
        currentStepIndex: adjustment.newCurrentStepIndex ?? pathway.currentStepIndex,
        updatedAt: new Date(),
      },
    });

    return this.mapToPathway(result);
  }

  async getActivePathways(studentId: string): Promise<LearningPathway[]> {
    const results = await this.prisma[this.pathwayTableName].findMany({
      where: { studentId, status: 'active' },
    });
    return results.map((r: unknown) => this.mapToPathway(r));
  }

  async updateMetrics(
    studentId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<PerformanceMetrics> {
    const profile = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId },
    });

    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }

    const updatedMetrics = { ...profile.performanceMetrics, ...metrics };

    await this.prisma[this.profileTableName].update({
      where: { id: studentId },
      data: { performanceMetrics: updatedMetrics, updatedAt: new Date() },
    });

    return updatedMetrics;
  }

  async getKnowledgeGaps(studentId: string): Promise<string[]> {
    const results = await this.prisma[this.masteryTableName].findMany({
      where: { studentId, level: { in: ['novice', 'beginner'] } },
      select: { topicId: true },
    });
    return results.map((r: { topicId: string }) => r.topicId);
  }

  async delete(studentId: string): Promise<void> {
    await this.prisma[this.profileTableName].delete({ where: { id: studentId } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToProfile(result: any): StudentProfile {
    const masteryByTopic: Record<string, TopicMastery> = {};
    for (const m of result.masteryRecords ?? []) {
      masteryByTopic[m.topicId] = this.mapToMastery(m);
    }

    return {
      id: result.id,
      userId: result.userId,
      masteryByTopic,
      activePathways: (result.pathways ?? []).map((p: unknown) => this.mapToPathway(p)),
      cognitivePreferences: result.cognitivePreferences as CognitivePreferences,
      performanceMetrics: result.performanceMetrics as PerformanceMetrics,
      overallBloomsDistribution: result.overallBloomsDistribution,
      knowledgeGaps: result.knowledgeGaps ?? [],
      strengths: result.strengths ?? [],
      createdAt: result.createdAt,
      lastActiveAt: result.lastActiveAt,
      updatedAt: result.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToMastery(result: any): TopicMastery {
    return {
      topicId: result.topicId,
      level: result.level as MasteryLevel,
      score: result.score,
      bloomsLevel: result.bloomsLevel as BloomsLevel,
      assessmentCount: result.assessmentCount,
      averageScore: result.averageScore,
      lastAssessedAt: result.lastAssessedAt,
      trend: result.trend,
      confidence: result.confidence,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToPathway(result: any): LearningPathway {
    return {
      id: result.id,
      studentId: result.studentId,
      courseId: result.courseId,
      steps: result.steps,
      currentStepIndex: result.currentStepIndex,
      progress: result.progress,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      status: result.status,
    };
  }
}

export function createPrismaStudentProfileStore(
  config: PrismaStudentProfileStoreConfig
): PrismaStudentProfileStore {
  return new PrismaStudentProfileStore(config);
}
