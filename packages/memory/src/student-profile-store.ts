/**
 * Student Profile Store
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Storage implementations for student profiles
 */

import type {
  StudentProfile,
  StudentProfileStore,
  TopicMastery,
  MasteryUpdate,
  MasteryLevel,
  LearningPathway,
  PathwayAdjustment,
  PerformanceMetrics,
  CognitivePreferences,
  BloomsLevel,
} from './types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate mastery level from score
 */
function calculateMasteryLevel(score: number): MasteryLevel {
  if (score >= 90) return 'expert';
  if (score >= 80) return 'proficient';
  if (score >= 70) return 'intermediate';
  if (score >= 50) return 'beginner';
  return 'novice';
}

/**
 * Calculate trend from score history
 */
function calculateTrend(
  currentScore: number,
  previousScore: number
): 'improving' | 'stable' | 'declining' {
  const difference = currentScore - previousScore;
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate confidence based on assessment count
 */
function calculateConfidence(assessmentCount: number): number {
  // Confidence increases with more assessments, asymptotically approaching 1
  return Math.min(0.95, 0.5 + assessmentCount * 0.05);
}

/**
 * Create default student profile
 */
function createDefaultProfile(studentId: string, userId: string): StudentProfile {
  const now = new Date();
  return {
    id: studentId,
    userId,
    masteryByTopic: {},
    activePathways: [],
    cognitivePreferences: {
      learningStyles: ['visual', 'reading'],
      contentLengthPreference: 'moderate',
      pacePreference: 'moderate',
      challengePreference: 'moderate',
      examplesFirst: true,
    },
    performanceMetrics: {
      overallAverageScore: 0,
      totalAssessments: 0,
      weeklyAssessments: 0,
      currentStreak: 0,
      longestStreak: 0,
      topicsMastered: 0,
      totalStudyTimeMinutes: 0,
      averageSessionDuration: 0,
      completionRate: 0,
    },
    overallBloomsDistribution: {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    },
    knowledgeGaps: [],
    strengths: [],
    createdAt: now,
    lastActiveAt: now,
    updatedAt: now,
  };
}

/**
 * Create default topic mastery
 */
function createDefaultTopicMastery(
  topicId: string,
  update: MasteryUpdate
): TopicMastery {
  const scorePercent = (update.score / update.maxScore) * 100;
  return {
    topicId,
    level: calculateMasteryLevel(scorePercent),
    score: scorePercent,
    bloomsLevel: update.bloomsLevel,
    assessmentCount: 1,
    averageScore: scorePercent,
    lastAssessedAt: update.timestamp,
    trend: 'stable',
    confidence: calculateConfidence(1),
  };
}

// ============================================================================
// IN-MEMORY STUDENT PROFILE STORE
// ============================================================================

/**
 * In-memory implementation of StudentProfileStore
 * Suitable for development and testing
 */
export class InMemoryStudentProfileStore implements StudentProfileStore {
  private profiles: Map<string, StudentProfile> = new Map();

  /**
   * Get a student profile
   */
  async get(studentId: string): Promise<StudentProfile | null> {
    return this.profiles.get(studentId) ?? null;
  }

  /**
   * Create or update a student profile
   */
  async save(profile: StudentProfile): Promise<void> {
    this.profiles.set(profile.id, { ...profile, updatedAt: new Date() });
  }

  /**
   * Update mastery for a topic
   */
  async updateMastery(
    studentId: string,
    update: MasteryUpdate
  ): Promise<TopicMastery> {
    let profile = this.profiles.get(studentId);

    if (!profile) {
      // Create new profile
      profile = createDefaultProfile(studentId, studentId);
      this.profiles.set(studentId, profile);
    }

    const existingMastery = profile.masteryByTopic[update.topicId];
    const scorePercent = (update.score / update.maxScore) * 100;

    if (existingMastery) {
      // Update existing mastery
      const newAssessmentCount = existingMastery.assessmentCount + 1;
      const newAverageScore =
        (existingMastery.averageScore * existingMastery.assessmentCount +
          scorePercent) /
        newAssessmentCount;

      const updatedMastery: TopicMastery = {
        ...existingMastery,
        level: calculateMasteryLevel(newAverageScore),
        score: newAverageScore,
        bloomsLevel: this.higherBloomsLevel(
          existingMastery.bloomsLevel,
          update.bloomsLevel
        ),
        assessmentCount: newAssessmentCount,
        averageScore: newAverageScore,
        lastAssessedAt: update.timestamp,
        trend: calculateTrend(scorePercent, existingMastery.score),
        confidence: calculateConfidence(newAssessmentCount),
      };

      profile.masteryByTopic[update.topicId] = updatedMastery;
      profile.updatedAt = new Date();
      profile.lastActiveAt = new Date();

      this.updateOverallMetrics(profile);

      return updatedMastery;
    } else {
      // Create new mastery record
      const newMastery = createDefaultTopicMastery(update.topicId, update);
      profile.masteryByTopic[update.topicId] = newMastery;
      profile.updatedAt = new Date();
      profile.lastActiveAt = new Date();

      this.updateOverallMetrics(profile);

      return newMastery;
    }
  }

  /**
   * Get mastery for a topic
   */
  async getMastery(
    studentId: string,
    topicId: string
  ): Promise<TopicMastery | null> {
    const profile = this.profiles.get(studentId);
    return profile?.masteryByTopic[topicId] ?? null;
  }

  /**
   * Update learning pathway
   */
  async updatePathway(
    studentId: string,
    pathwayId: string,
    adjustment: PathwayAdjustment
  ): Promise<LearningPathway> {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }

    const pathwayIndex = profile.activePathways.findIndex(
      (p) => p.id === pathwayId
    );
    if (pathwayIndex === -1) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }

    const pathway = profile.activePathways[pathwayIndex];

    // Apply adjustment
    switch (adjustment.type) {
      case 'skip_ahead':
        if (adjustment.newCurrentStepIndex !== undefined) {
          pathway.currentStepIndex = adjustment.newCurrentStepIndex;
        }
        break;

      case 'add_remediation':
        if (adjustment.stepsToAdd) {
          // Insert remediation steps at current position
          pathway.steps.splice(
            pathway.currentStepIndex,
            0,
            ...adjustment.stepsToAdd
          );
        }
        break;

      case 'reorder':
        if (adjustment.newOrder) {
          const stepMap = new Map(pathway.steps.map((s) => [s.id, s]));
          pathway.steps = adjustment.newOrder
            .map((id) => stepMap.get(id))
            .filter((s): s is NonNullable<typeof s> => s !== undefined);
        }
        break;

      case 'add_challenge':
        if (adjustment.stepsToAdd) {
          // Add challenge steps after current position
          pathway.steps.splice(
            pathway.currentStepIndex + 1,
            0,
            ...adjustment.stepsToAdd
          );
        }
        break;

      case 'no_change':
        // Do nothing
        break;
    }

    // Remove steps if specified
    if (adjustment.stepsToRemove && adjustment.stepsToRemove.length > 0) {
      const removeSet = new Set(adjustment.stepsToRemove);
      pathway.steps = pathway.steps.filter((s) => !removeSet.has(s.id));
    }

    // Recalculate progress
    const completedSteps = pathway.steps.filter(
      (s) => s.status === 'completed'
    ).length;
    pathway.progress =
      pathway.steps.length > 0
        ? (completedSteps / pathway.steps.length) * 100
        : 0;

    pathway.updatedAt = new Date();
    profile.updatedAt = new Date();

    return pathway;
  }

  /**
   * Get active pathways for a student
   */
  async getActivePathways(studentId: string): Promise<LearningPathway[]> {
    const profile = this.profiles.get(studentId);
    return profile?.activePathways.filter((p) => p.status === 'active') ?? [];
  }

  /**
   * Update performance metrics
   */
  async updateMetrics(
    studentId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<PerformanceMetrics> {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }

    profile.performanceMetrics = {
      ...profile.performanceMetrics,
      ...metrics,
    };
    profile.updatedAt = new Date();

    return profile.performanceMetrics;
  }

  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(studentId: string): Promise<string[]> {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      return [];
    }

    // Find topics with low mastery
    const gaps: string[] = [];
    for (const [topicId, mastery] of Object.entries(profile.masteryByTopic)) {
      if (mastery.level === 'novice' || mastery.level === 'beginner') {
        gaps.push(topicId);
      }
    }

    return gaps;
  }

  /**
   * Delete a student profile
   */
  async delete(studentId: string): Promise<void> {
    this.profiles.delete(studentId);
  }

  /**
   * Compare Bloom's levels and return higher one
   */
  private higherBloomsLevel(a: BloomsLevel, b: BloomsLevel): BloomsLevel {
    const order: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return indexA >= indexB ? a : b;
  }

  /**
   * Update overall metrics after mastery change
   */
  private updateOverallMetrics(profile: StudentProfile): void {
    const masteryRecords = Object.values(profile.masteryByTopic);

    if (masteryRecords.length === 0) {
      return;
    }

    // Calculate overall average score
    profile.performanceMetrics.overallAverageScore =
      masteryRecords.reduce((sum, m) => sum + m.averageScore, 0) /
      masteryRecords.length;

    // Count topics mastered (proficient or expert)
    profile.performanceMetrics.topicsMastered = masteryRecords.filter(
      (m) => m.level === 'proficient' || m.level === 'expert'
    ).length;

    // Update Bloom's distribution
    const distribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    for (const mastery of masteryRecords) {
      distribution[mastery.bloomsLevel]++;
    }

    // Convert to percentages
    const total = masteryRecords.length;
    for (const level of Object.keys(distribution) as BloomsLevel[]) {
      distribution[level] = (distribution[level] / total) * 100;
    }

    profile.overallBloomsDistribution = distribution;

    // Update strengths and gaps
    profile.strengths = masteryRecords
      .filter((m) => m.level === 'proficient' || m.level === 'expert')
      .map((m) => m.topicId);

    profile.knowledgeGaps = masteryRecords
      .filter((m) => m.level === 'novice' || m.level === 'beginner')
      .map((m) => m.topicId);
  }

  /**
   * Clear all profiles (for testing)
   */
  clear(): void {
    this.profiles.clear();
  }

  /**
   * Get all profiles (for testing)
   */
  getAll(): StudentProfile[] {
    return Array.from(this.profiles.values());
  }
}

// ============================================================================
// PRISMA-READY STUDENT PROFILE STORE
// ============================================================================

/**
 * Configuration for Prisma-based student profile store
 */
export interface PrismaStudentProfileStoreConfig {
  /**
   * Prisma client instance
   */
  prisma: any;

  /**
   * Table/model name for student profiles
   */
  profileTableName?: string;

  /**
   * Table/model name for topic mastery
   */
  masteryTableName?: string;

  /**
   * Table/model name for learning pathways
   */
  pathwayTableName?: string;
}

/**
 * Prisma-based implementation of StudentProfileStore
 * Ready for database integration
 */
export class PrismaStudentProfileStore implements StudentProfileStore {
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

  /**
   * Get a student profile
   */
  async get(studentId: string): Promise<StudentProfile | null> {
    const result = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId },
      include: {
        masteryRecords: true,
        pathways: true,
      },
    });

    return result ? this.mapToProfile(result) : null;
  }

  /**
   * Create or update a student profile
   */
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

  /**
   * Update mastery for a topic
   */
  async updateMastery(
    studentId: string,
    update: MasteryUpdate
  ): Promise<TopicMastery> {
    const scorePercent = (update.score / update.maxScore) * 100;

    // Get existing mastery
    const existing = await this.prisma[this.masteryTableName].findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId: update.topicId,
        },
      },
    });

    if (existing) {
      const newAssessmentCount = existing.assessmentCount + 1;
      const newAverageScore =
        (existing.averageScore * existing.assessmentCount + scorePercent) /
        newAssessmentCount;

      const result = await this.prisma[this.masteryTableName].update({
        where: {
          studentId_topicId: {
            studentId,
            topicId: update.topicId,
          },
        },
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
      // Create new mastery record
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

  /**
   * Get mastery for a topic
   */
  async getMastery(
    studentId: string,
    topicId: string
  ): Promise<TopicMastery | null> {
    const result = await this.prisma[this.masteryTableName].findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId,
        },
      },
    });

    return result ? this.mapToMastery(result) : null;
  }

  /**
   * Update learning pathway
   */
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

    let steps = pathway.steps as unknown[];

    // Apply adjustment
    switch (adjustment.type) {
      case 'skip_ahead':
        // Update current step index
        break;
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
      case 'reorder':
      case 'no_change':
        // Handle accordingly
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

  /**
   * Get active pathways for a student
   */
  async getActivePathways(studentId: string): Promise<LearningPathway[]> {
    const results = await this.prisma[this.pathwayTableName].findMany({
      where: {
        studentId,
        status: 'active',
      },
    });

    return results.map((r: unknown) => this.mapToPathway(r));
  }

  /**
   * Update performance metrics
   */
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

    const updatedMetrics = {
      ...profile.performanceMetrics,
      ...metrics,
    };

    await this.prisma[this.profileTableName].update({
      where: { id: studentId },
      data: {
        performanceMetrics: updatedMetrics,
        updatedAt: new Date(),
      },
    });

    return updatedMetrics;
  }

  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(studentId: string): Promise<string[]> {
    const results = await this.prisma[this.masteryTableName].findMany({
      where: {
        studentId,
        level: { in: ['novice', 'beginner'] },
      },
      select: { topicId: true },
    });

    return results.map((r: { topicId: string }) => r.topicId);
  }

  /**
   * Delete a student profile
   */
  async delete(studentId: string): Promise<void> {
    await this.prisma[this.profileTableName].delete({
      where: { id: studentId },
    });
  }

  /**
   * Map database result to StudentProfile
   */
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

  /**
   * Map database result to TopicMastery
   */
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

  /**
   * Map database result to LearningPathway
   */
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

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an in-memory student profile store
 */
export function createInMemoryStudentProfileStore(): InMemoryStudentProfileStore {
  return new InMemoryStudentProfileStore();
}

/**
 * Create a Prisma-based student profile store
 */
export function createPrismaStudentProfileStore(
  config: PrismaStudentProfileStoreConfig
): PrismaStudentProfileStore {
  return new PrismaStudentProfileStore(config);
}

/**
 * Singleton in-memory store for development
 */
let defaultProfileStore: InMemoryStudentProfileStore | null = null;

/**
 * Get the default student profile store (singleton)
 */
export function getDefaultStudentProfileStore(): InMemoryStudentProfileStore {
  if (!defaultProfileStore) {
    defaultProfileStore = createInMemoryStudentProfileStore();
  }
  return defaultProfileStore;
}

/**
 * Reset the default student profile store (for testing)
 */
export function resetDefaultStudentProfileStore(): void {
  defaultProfileStore = null;
}
