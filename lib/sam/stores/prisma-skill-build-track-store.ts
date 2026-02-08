/**
 * Prisma Store for SkillBuildTrack Engine
 * Implements SkillBuildTrackStore interface with Prisma persistence
 */

import { db } from '@/lib/db';
import type {
  SkillBuildTrackStore,
  SkillBuildDefinition,
  SkillBuildProfile,
  SkillBuildEvidence,
  SkillBuildRoadmap,
  SkillBuildBenchmark,
  RoleBuildBenchmark,
  SkillBuildRoadmapStatus,
  SkillBuildBenchmarkSource,
  SkillDefinitionFilters,
  ProfileFilters,
  PracticeLog,
  SkillBuildAchievement,
  SkillBuildProficiencyLevel,
  SkillBuildCategory,
  SkillBuildTrend,
  SkillBuildEvidenceType,
  SkillBuildMilestoneStatus,
  SkillBuildFramework,
} from '@sam-ai/educational';

// Note: Prisma types are inferred directly from queries
// Private mapper methods have explicit inline type signatures

// ============================================================================
// TYPE MAPPERS (Prisma enums <-> Engine types)
// ============================================================================

const mapPrismaProficiency = (level: string): SkillBuildProficiencyLevel => {
  const map: Record<string, SkillBuildProficiencyLevel> = {
    NOVICE: 'NOVICE',
    BEGINNER: 'BEGINNER',
    COMPETENT: 'COMPETENT',
    PROFICIENT: 'PROFICIENT',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT',
    STRATEGIST: 'STRATEGIST',
  };
  return map[level] || 'NOVICE';
};

const mapPrismaCategory = (category: string): SkillBuildCategory => {
  const map: Record<string, SkillBuildCategory> = {
    TECHNICAL: 'TECHNICAL',
    SOFT: 'SOFT',
    DOMAIN: 'DOMAIN',
    TOOL: 'TOOL',
    METHODOLOGY: 'METHODOLOGY',
    CERTIFICATION: 'CERTIFICATION',
    LEADERSHIP: 'LEADERSHIP',
  };
  return map[category] || 'TECHNICAL';
};

const mapPrismaTrend = (trend: string): SkillBuildTrend => {
  const map: Record<string, SkillBuildTrend> = {
    ACCELERATING: 'ACCELERATING',
    STEADY: 'STEADY',
    SLOWING: 'SLOWING',
    STAGNANT: 'STAGNANT',
    DECLINING: 'DECLINING',
  };
  return map[trend] || 'STAGNANT';
};

const mapPrismaEvidenceType = (type: string): SkillBuildEvidenceType => {
  const map: Record<string, SkillBuildEvidenceType> = {
    ASSESSMENT: 'ASSESSMENT',
    PROJECT: 'PROJECT',
    CERTIFICATION: 'CERTIFICATION',
    COURSE_COMPLETION: 'COURSE_COMPLETION',
    PEER_REVIEW: 'PEER_REVIEW',
    SELF_ASSESSMENT: 'SELF_ASSESSMENT',
    PRACTICE_SESSION: 'PRACTICE_SESSION',
    REAL_WORLD: 'REAL_WORLD',
    TEACHING: 'TEACHING',
  };
  return map[type] || 'PRACTICE_SESSION';
};

const mapPrismaRoadmapStatus = (status: string): SkillBuildRoadmapStatus => {
  const map: Record<string, SkillBuildRoadmapStatus> = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    ABANDONED: 'ABANDONED',
  };
  return map[status] || 'DRAFT';
};

const mapPrismaMilestoneStatus = (status: string): SkillBuildMilestoneStatus => {
  const map: Record<string, SkillBuildMilestoneStatus> = {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    SKIPPED: 'SKIPPED',
  };
  return map[status] || 'LOCKED';
};

const mapPrismaBenchmarkSource = (source: string): SkillBuildBenchmarkSource => {
  const map: Record<string, SkillBuildBenchmarkSource> = {
    INDUSTRY: 'INDUSTRY',
    ROLE: 'ROLE',
    PEER_GROUP: 'PEER_GROUP',
    ORGANIZATION: 'ORGANIZATION',
    MARKET: 'MARKET',
  };
  return map[source] || 'INDUSTRY';
};

// ============================================================================
// PRISMA SKILL BUILD TRACK STORE
// ============================================================================

export class PrismaSkillBuildTrackStore implements SkillBuildTrackStore {
  // ---------------------------------------------------------------------------
  // Skill Definitions
  // ---------------------------------------------------------------------------

  async getSkillDefinition(skillId: string): Promise<SkillBuildDefinition | null> {
    const skill = await db.skillBuildDefinition.findUnique({
      where: { id: skillId },
    });

    if (!skill) return null;

    return this.toSkillDefinition(skill);
  }

  async getSkillDefinitions(filters?: SkillDefinitionFilters): Promise<SkillBuildDefinition[]> {
    const skills = await db.skillBuildDefinition.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.demandLevel && { demandLevel: filters.demandLevel }),
        ...(filters?.tags && filters.tags.length > 0 && {
          tags: { hasSome: filters.tags },
        }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });

    return skills.map((s) => this.toSkillDefinition(s));
  }

  async saveSkillDefinition(skill: SkillBuildDefinition): Promise<void> {
    await db.skillBuildDefinition.upsert({
      where: { id: skill.id },
      create: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        parentId: skill.parentId,
        tags: skill.tags,
        difficultyFactor: skill.learningCurve.difficultyFactor,
        retentionDifficulty: skill.learningCurve.retentionDifficulty,
        applicationComplexity: skill.learningCurve.applicationComplexity,
        demandLevel: skill.marketDemand?.level,
        demandTrend: skill.marketDemand?.trend,
        avgSalaryImpact: skill.marketDemand?.avgSalaryImpact,
        jobPostingCount: skill.marketDemand?.jobPostingCount,
        topIndustries: skill.marketDemand?.topIndustries ?? [],
        topRoles: skill.marketDemand?.topRoles ?? [],
        demandLastUpdated: skill.marketDemand?.lastUpdated,
        frameworkMappings: skill.frameworkMappings as object,
        prerequisites: skill.prerequisites ?? [],
        relatedSkills: skill.relatedSkills ?? [],
        bloomsLevels: skill.bloomsLevels ?? [],
      },
      update: {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        parentId: skill.parentId,
        tags: skill.tags,
        difficultyFactor: skill.learningCurve.difficultyFactor,
        retentionDifficulty: skill.learningCurve.retentionDifficulty,
        applicationComplexity: skill.learningCurve.applicationComplexity,
        demandLevel: skill.marketDemand?.level,
        demandTrend: skill.marketDemand?.trend,
        avgSalaryImpact: skill.marketDemand?.avgSalaryImpact,
        jobPostingCount: skill.marketDemand?.jobPostingCount,
        topIndustries: skill.marketDemand?.topIndustries ?? [],
        topRoles: skill.marketDemand?.topRoles ?? [],
        demandLastUpdated: skill.marketDemand?.lastUpdated,
        frameworkMappings: skill.frameworkMappings as object,
        prerequisites: skill.prerequisites ?? [],
        relatedSkills: skill.relatedSkills ?? [],
        bloomsLevels: skill.bloomsLevels ?? [],
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Skill Profiles
  // ---------------------------------------------------------------------------

  async getSkillProfile(userId: string, skillId: string): Promise<SkillBuildProfile | null> {
    const profile = await db.skillBuildProfile.findUnique({
      where: { userId_skillId: { userId, skillId } },
      include: {
        skill: true,
        evidence: true,
      },
    });

    if (!profile) return null;

    return this.toSkillProfile(profile);
  }

  async getUserSkillProfiles(userId: string, filters?: ProfileFilters): Promise<SkillBuildProfile[]> {
    // Build proficiency level filter based on min/max levels
    const levelOrder: SkillBuildProficiencyLevel[] = [
      'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
    ];

    let levelFilter: SkillBuildProficiencyLevel[] | undefined;
    if (filters?.minLevel || filters?.maxLevel) {
      const minIdx = filters.minLevel ? levelOrder.indexOf(filters.minLevel) : 0;
      const maxIdx = filters.maxLevel ? levelOrder.indexOf(filters.maxLevel) : levelOrder.length - 1;
      levelFilter = levelOrder.slice(minIdx, maxIdx + 1);
    }

    const profiles = await db.skillBuildProfile.findMany({
      where: {
        userId,
        ...(filters?.category && {
          skill: { category: filters.category },
        }),
        ...(levelFilter && { proficiencyLevel: { in: levelFilter } }),
        ...(filters?.riskLevel && { decayRiskLevel: filters.riskLevel }),
      },
      include: {
        skill: true,
        evidence: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return profiles.map((p) => this.toSkillProfile(p));
  }

  async saveSkillProfile(profile: SkillBuildProfile): Promise<void> {
    // Ensure the referenced skill definition exists to prevent FK constraint violations.
    // Auto-create a minimal definition if missing (e.g. for dynamically generated skill IDs).
    const skillExists = await db.skillBuildDefinition.findUnique({
      where: { id: profile.skillId },
      select: { id: true },
    });

    if (!skillExists) {
      await db.skillBuildDefinition.create({
        data: {
          id: profile.skillId,
          name: profile.skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          category: 'DOMAIN',
          description: `Auto-generated skill definition for ${profile.skillId}`,
          prerequisites: [],
          bloomsLevels: [],
          tags: ['auto-generated'],
        },
      });
    }

    await db.skillBuildProfile.upsert({
      where: { userId_skillId: { userId: profile.userId, skillId: profile.skillId } },
      create: {
        id: profile.id,
        userId: profile.userId,
        skillId: profile.skillId,
        masteryScore: profile.dimensions.mastery,
        retentionScore: profile.dimensions.retention,
        applicationScore: profile.dimensions.application,
        confidenceScore: profile.dimensions.confidence,
        calibrationScore: profile.dimensions.calibration,
        compositeScore: profile.compositeScore,
        proficiencyLevel: profile.proficiencyLevel,
        learningSpeed: profile.velocity.learningSpeed,
        sessionsToNextLevel: profile.velocity.sessionsToNextLevel,
        daysToNextLevel: profile.velocity.daysToNextLevel,
        velocityTrend: profile.velocity.trend,
        velocityAcceleration: profile.velocity.acceleration,
        recentScores: profile.velocity.recentScores,
        velocityCalculatedAt: profile.velocity.calculatedAt,
        decayRate: profile.decay.decayRate,
        daysSinceLastPractice: profile.decay.daysSinceLastPractice,
        halfLifeDays: profile.decay.halfLifeDays,
        daysUntilLevelDrop: profile.decay.daysUntilLevelDrop,
        recommendedReviewDate: profile.decay.recommendedReviewDate,
        decayRiskLevel: profile.decay.riskLevel,
        totalSessions: profile.practiceHistory.totalSessions,
        totalMinutes: profile.practiceHistory.totalMinutes,
        averageSessionMinutes: profile.practiceHistory.averageSessionMinutes,
        averageScore: profile.practiceHistory.averageScore,
        bestScore: profile.practiceHistory.bestScore,
        currentStreak: profile.practiceHistory.currentStreak,
        longestStreak: profile.practiceHistory.longestStreak,
        sessionsThisWeek: profile.practiceHistory.sessionsThisWeek,
        sessionsThisMonth: profile.practiceHistory.sessionsThisMonth,
        targetLevel: profile.targetLevel,
        progressToTarget: profile.progressToTarget,
        levelHistory: profile.levelHistory as object,
        lastPracticedAt: profile.lastPracticedAt,
      },
      update: {
        masteryScore: profile.dimensions.mastery,
        retentionScore: profile.dimensions.retention,
        applicationScore: profile.dimensions.application,
        confidenceScore: profile.dimensions.confidence,
        calibrationScore: profile.dimensions.calibration,
        compositeScore: profile.compositeScore,
        proficiencyLevel: profile.proficiencyLevel,
        learningSpeed: profile.velocity.learningSpeed,
        sessionsToNextLevel: profile.velocity.sessionsToNextLevel,
        daysToNextLevel: profile.velocity.daysToNextLevel,
        velocityTrend: profile.velocity.trend,
        velocityAcceleration: profile.velocity.acceleration,
        recentScores: profile.velocity.recentScores,
        velocityCalculatedAt: profile.velocity.calculatedAt,
        decayRate: profile.decay.decayRate,
        daysSinceLastPractice: profile.decay.daysSinceLastPractice,
        halfLifeDays: profile.decay.halfLifeDays,
        daysUntilLevelDrop: profile.decay.daysUntilLevelDrop,
        recommendedReviewDate: profile.decay.recommendedReviewDate,
        decayRiskLevel: profile.decay.riskLevel,
        totalSessions: profile.practiceHistory.totalSessions,
        totalMinutes: profile.practiceHistory.totalMinutes,
        averageSessionMinutes: profile.practiceHistory.averageSessionMinutes,
        averageScore: profile.practiceHistory.averageScore,
        bestScore: profile.practiceHistory.bestScore,
        currentStreak: profile.practiceHistory.currentStreak,
        longestStreak: profile.practiceHistory.longestStreak,
        sessionsThisWeek: profile.practiceHistory.sessionsThisWeek,
        sessionsThisMonth: profile.practiceHistory.sessionsThisMonth,
        targetLevel: profile.targetLevel,
        progressToTarget: profile.progressToTarget,
        levelHistory: profile.levelHistory as object,
        lastPracticedAt: profile.lastPracticedAt,
      },
    });
  }

  async updateSkillProfile(
    userId: string,
    skillId: string,
    update: Partial<SkillBuildProfile>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (update.dimensions) {
      updateData.masteryScore = update.dimensions.mastery;
      updateData.retentionScore = update.dimensions.retention;
      updateData.applicationScore = update.dimensions.application;
      updateData.confidenceScore = update.dimensions.confidence;
      updateData.calibrationScore = update.dimensions.calibration;
    }

    if (update.compositeScore !== undefined) updateData.compositeScore = update.compositeScore;
    if (update.proficiencyLevel) updateData.proficiencyLevel = update.proficiencyLevel;
    if (update.lastPracticedAt) updateData.lastPracticedAt = update.lastPracticedAt;

    if (update.velocity) {
      updateData.learningSpeed = update.velocity.learningSpeed;
      updateData.sessionsToNextLevel = update.velocity.sessionsToNextLevel;
      updateData.daysToNextLevel = update.velocity.daysToNextLevel;
      updateData.velocityTrend = update.velocity.trend;
      updateData.velocityAcceleration = update.velocity.acceleration;
      updateData.recentScores = update.velocity.recentScores;
      updateData.velocityCalculatedAt = update.velocity.calculatedAt;
    }

    if (update.decay) {
      updateData.decayRate = update.decay.decayRate;
      updateData.daysSinceLastPractice = update.decay.daysSinceLastPractice;
      updateData.halfLifeDays = update.decay.halfLifeDays;
      updateData.daysUntilLevelDrop = update.decay.daysUntilLevelDrop;
      updateData.recommendedReviewDate = update.decay.recommendedReviewDate;
      updateData.decayRiskLevel = update.decay.riskLevel;
    }

    if (update.practiceHistory) {
      updateData.totalSessions = update.practiceHistory.totalSessions;
      updateData.totalMinutes = update.practiceHistory.totalMinutes;
      updateData.averageSessionMinutes = update.practiceHistory.averageSessionMinutes;
      updateData.averageScore = update.practiceHistory.averageScore;
      updateData.bestScore = update.practiceHistory.bestScore;
      updateData.currentStreak = update.practiceHistory.currentStreak;
      updateData.longestStreak = update.practiceHistory.longestStreak;
      updateData.sessionsThisWeek = update.practiceHistory.sessionsThisWeek;
      updateData.sessionsThisMonth = update.practiceHistory.sessionsThisMonth;
    }

    if (update.levelHistory) updateData.levelHistory = update.levelHistory;
    if (update.targetLevel) updateData.targetLevel = update.targetLevel;
    if (update.progressToTarget !== undefined) updateData.progressToTarget = update.progressToTarget;

    await db.skillBuildProfile.update({
      where: { userId_skillId: { userId, skillId } },
      data: updateData,
    });
  }

  // ---------------------------------------------------------------------------
  // Evidence
  // ---------------------------------------------------------------------------

  async addEvidence(userId: string, skillId: string, evidence: SkillBuildEvidence): Promise<void> {
    await db.skillBuildEvidence.create({
      data: {
        id: evidence.id,
        profile: {
          connect: {
            userId_skillId: { userId, skillId },
          },
        },
        type: evidence.type,
        title: evidence.title,
        description: evidence.description,
        sourceId: evidence.sourceId,
        sourceUrl: evidence.sourceUrl,
        score: evidence.score,
        maxScore: evidence.maxScore,
        demonstratedLevel: evidence.demonstratedLevel,
        verified: evidence.verified,
        verifiedBy: evidence.verifiedBy,
        verifiedAt: evidence.verifiedAt,
        date: evidence.date,
        expiresAt: evidence.expiresAt,
      },
    });
  }

  async getEvidence(userId: string, skillId: string): Promise<SkillBuildEvidence[]> {
    const profile = await db.skillBuildProfile.findUnique({
      where: { userId_skillId: { userId, skillId } },
      include: { evidence: true },
    });

    if (!profile) return [];

    return profile.evidence.map((e) => this.toEvidence(e));
  }

  // ---------------------------------------------------------------------------
  // Roadmaps
  // ---------------------------------------------------------------------------

  async getRoadmap(roadmapId: string): Promise<SkillBuildRoadmap | null> {
    const roadmap = await db.skillBuildRoadmap.findUnique({
      where: { id: roadmapId },
      include: { milestones: { orderBy: { order: 'asc' } } },
    });

    if (!roadmap) return null;

    return this.toRoadmap(roadmap);
  }

  async getUserRoadmaps(
    userId: string,
    status?: SkillBuildRoadmapStatus
  ): Promise<SkillBuildRoadmap[]> {
    const roadmaps = await db.skillBuildRoadmap.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: { milestones: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });

    return roadmaps.map((r) => this.toRoadmap(r));
  }

  async saveRoadmap(roadmap: SkillBuildRoadmap): Promise<void> {
    await db.$transaction(async (tx) => {
      // Upsert roadmap
      await tx.skillBuildRoadmap.upsert({
        where: { id: roadmap.id },
        create: {
          id: roadmap.id,
          userId: roadmap.userId,
          title: roadmap.title,
          description: roadmap.description,
          status: roadmap.status,
          targetOutcome: roadmap.targetOutcome as object,
          totalEstimatedHours: roadmap.totalEstimatedHours,
          completionPercentage: roadmap.completionPercentage,
          startedAt: roadmap.startedAt,
          targetCompletionDate: roadmap.targetCompletionDate,
          completedAt: roadmap.completedAt,
          adjustments: roadmap.adjustments as object,
        },
        update: {
          title: roadmap.title,
          description: roadmap.description,
          status: roadmap.status,
          targetOutcome: roadmap.targetOutcome as object,
          totalEstimatedHours: roadmap.totalEstimatedHours,
          completionPercentage: roadmap.completionPercentage,
          startedAt: roadmap.startedAt,
          targetCompletionDate: roadmap.targetCompletionDate,
          completedAt: roadmap.completedAt,
          adjustments: roadmap.adjustments as object,
        },
      });

      // Delete existing milestones and recreate
      await tx.skillBuildRoadmapMilestone.deleteMany({
        where: { roadmapId: roadmap.id },
      });

      // Create milestones
      for (const milestone of roadmap.milestones) {
        await tx.skillBuildRoadmapMilestone.create({
          data: {
            id: milestone.id,
            roadmapId: roadmap.id,
            order: milestone.order,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status,
            skills: milestone.skills as object,
            estimatedHours: milestone.estimatedHours,
            actualHours: milestone.actualHours,
            targetDate: milestone.targetDate,
            completedAt: milestone.completedAt,
            prerequisites: milestone.prerequisites,
            resources: milestone.resources as object,
            assessmentRequired: milestone.assessmentRequired ?? false,
          },
        });
      }
    });
  }

  async updateRoadmap(roadmapId: string, update: Partial<SkillBuildRoadmap>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (update.title) updateData.title = update.title;
    if (update.description) updateData.description = update.description;
    if (update.status) updateData.status = update.status;
    if (update.completionPercentage !== undefined)
      updateData.completionPercentage = update.completionPercentage;
    if (update.startedAt) updateData.startedAt = update.startedAt;
    if (update.targetCompletionDate) updateData.targetCompletionDate = update.targetCompletionDate;
    if (update.completedAt) updateData.completedAt = update.completedAt;
    if (update.adjustments) updateData.adjustments = update.adjustments;

    await db.skillBuildRoadmap.update({
      where: { id: roadmapId },
      data: updateData,
    });
  }

  // ---------------------------------------------------------------------------
  // Benchmarks
  // ---------------------------------------------------------------------------

  async getSkillBenchmark(
    skillId: string,
    source: SkillBuildBenchmarkSource
  ): Promise<SkillBuildBenchmark | null> {
    const benchmark = await db.skillBuildBenchmarkData.findUnique({
      where: { skillId_source: { skillId, source } },
      include: { skill: true },
    });

    if (!benchmark) return null;

    return {
      skillId: benchmark.skillId,
      skillName: benchmark.skill.name,
      source: mapPrismaBenchmarkSource(benchmark.source),
      distribution: benchmark.distribution as unknown as SkillBuildBenchmark['distribution'],
      levelDistribution: benchmark.levelDistribution as unknown as Record<SkillBuildProficiencyLevel, number>,
      timeToLevel: benchmark.timeToLevel as unknown as Partial<Record<SkillBuildProficiencyLevel, number>>,
      sampleSize: benchmark.sampleSize,
      lastUpdated: benchmark.lastUpdated,
    };
  }

  async getRoleBenchmark(
    roleId: string,
    source: SkillBuildBenchmarkSource
  ): Promise<RoleBuildBenchmark | null> {
    // Role benchmarks would require a separate model - returning null for now
    // This could be implemented by aggregating skill benchmarks for a role
    return null;
  }

  async saveBenchmarkData(benchmark: SkillBuildBenchmark | RoleBuildBenchmark): Promise<void> {
    if ('skillId' in benchmark && !('roleId' in benchmark)) {
      await db.skillBuildBenchmarkData.upsert({
        where: { skillId_source: { skillId: benchmark.skillId, source: benchmark.source } },
        create: {
          skillId: benchmark.skillId,
          source: benchmark.source,
          distribution: benchmark.distribution as object,
          levelDistribution: benchmark.levelDistribution as object,
          timeToLevel: benchmark.timeToLevel as object,
          sampleSize: benchmark.sampleSize,
          lastUpdated: benchmark.lastUpdated,
        },
        update: {
          distribution: benchmark.distribution as object,
          levelDistribution: benchmark.levelDistribution as object,
          timeToLevel: benchmark.timeToLevel as object,
          sampleSize: benchmark.sampleSize,
          lastUpdated: benchmark.lastUpdated,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Practice Logs
  // ---------------------------------------------------------------------------

  async savePracticeLog(log: PracticeLog): Promise<void> {
    const profile = await db.skillBuildProfile.findUnique({
      where: { userId_skillId: { userId: log.userId, skillId: log.skillId } },
    });

    if (!profile) {
      throw new Error(`Profile not found for user ${log.userId} and skill ${log.skillId}`);
    }

    await db.skillBuildPracticeLog.create({
      data: {
        id: log.id,
        userId: log.userId,
        profileId: profile.id,
        skillId: log.skillId,
        durationMinutes: log.durationMinutes,
        score: log.score,
        maxScore: log.maxScore,
        isAssessment: log.isAssessment,
        completed: log.completed,
        sourceId: log.sourceId,
        sourceType: log.sourceType,
        notes: log.notes,
        dimensionChanges: log.dimensionChanges as object,
        compositeScoreChange: log.compositeScoreChange,
        timestamp: log.timestamp,
      },
    });
  }

  async getPracticeLogs(userId: string, skillId: string, limit = 50): Promise<PracticeLog[]> {
    const logs = await db.skillBuildPracticeLog.findMany({
      where: { userId, skillId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      skillId: log.skillId,
      durationMinutes: log.durationMinutes,
      score: log.score ?? undefined,
      maxScore: log.maxScore ?? undefined,
      isAssessment: log.isAssessment,
      completed: log.completed,
      sourceId: log.sourceId ?? undefined,
      sourceType: log.sourceType ?? undefined,
      notes: log.notes ?? undefined,
      dimensionChanges: (log.dimensionChanges as Record<string, number>) ?? {},
      compositeScoreChange: log.compositeScoreChange,
      timestamp: log.timestamp,
    }));
  }

  // ---------------------------------------------------------------------------
  // Achievements
  // ---------------------------------------------------------------------------

  async saveAchievement(userId: string, achievement: SkillBuildAchievement): Promise<void> {
    await db.skillBuildAchievement.create({
      data: {
        id: achievement.id,
        userId,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        skillId: achievement.skillId,
        skillName: achievement.skillName,
        level: achievement.level,
        rarity: achievement.rarity,
        earnedAt: achievement.earnedAt,
      },
    });
  }

  async getUserAchievements(userId: string): Promise<SkillBuildAchievement[]> {
    const achievements = await db.skillBuildAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    return achievements.map((a) => ({
      id: a.id,
      type: a.type as SkillBuildAchievement['type'],
      title: a.title,
      description: a.description ?? '',
      skillId: a.skillId ?? undefined,
      skillName: a.skillName ?? undefined,
      level: a.level ? mapPrismaProficiency(a.level) : undefined,
      earnedAt: a.earnedAt,
      rarity: a.rarity as SkillBuildAchievement['rarity'],
    }));
  }

  // ---------------------------------------------------------------------------
  // Private Mappers
  // ---------------------------------------------------------------------------

  private toSkillDefinition(skill: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    parentId: string | null;
    tags: string[];
    difficultyFactor: number;
    retentionDifficulty: number;
    applicationComplexity: string;
    demandLevel: string | null;
    demandTrend: string | null;
    avgSalaryImpact: number | null;
    jobPostingCount: number | null;
    topIndustries: string[];
    topRoles: string[];
    demandLastUpdated: Date | null;
    frameworkMappings: unknown;
    prerequisites: string[];
    relatedSkills: string[];
    bloomsLevels: string[];
    createdAt: Date;
    updatedAt: Date;
  }): SkillBuildDefinition {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description ?? '',
      category: mapPrismaCategory(skill.category),
      parentId: skill.parentId ?? undefined,
      tags: skill.tags,
      frameworkMappings: skill.frameworkMappings as SkillBuildDefinition['frameworkMappings'],
      learningCurve: {
        hoursToLevel: {},
        difficultyFactor: skill.difficultyFactor,
        retentionDifficulty: skill.retentionDifficulty,
        applicationComplexity: skill.applicationComplexity as 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH',
      },
      marketDemand: skill.demandLevel
        ? {
            level: skill.demandLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            trend: (skill.demandTrend as 'DECLINING' | 'STABLE' | 'GROWING' | 'EMERGING') ?? 'STABLE',
            avgSalaryImpact: skill.avgSalaryImpact ?? undefined,
            jobPostingCount: skill.jobPostingCount ?? undefined,
            topIndustries: skill.topIndustries,
            topRoles: skill.topRoles,
            lastUpdated: skill.demandLastUpdated ?? new Date(),
          }
        : undefined,
      prerequisites: skill.prerequisites,
      relatedSkills: skill.relatedSkills,
      bloomsLevels: skill.bloomsLevels as SkillBuildDefinition['bloomsLevels'],
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }

  private toSkillProfile(profile: {
    id: string;
    userId: string;
    skillId: string;
    skill: { id: string; name: string; description: string | null; category: string } | null;
    masteryScore: number;
    retentionScore: number;
    applicationScore: number;
    confidenceScore: number;
    calibrationScore: number;
    compositeScore: number;
    proficiencyLevel: string;
    learningSpeed: number;
    sessionsToNextLevel: number;
    daysToNextLevel: number;
    velocityTrend: string;
    velocityAcceleration: number;
    recentScores: number[];
    velocityCalculatedAt: Date | null;
    decayRate: number;
    daysSinceLastPractice: number;
    halfLifeDays: number;
    daysUntilLevelDrop: number | null;
    recommendedReviewDate: Date | null;
    decayRiskLevel: string;
    totalSessions: number;
    totalMinutes: number;
    averageSessionMinutes: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
    targetLevel: string | null;
    progressToTarget: number | null;
    levelHistory: unknown;
    evidence?: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      sourceId: string | null;
      sourceUrl: string | null;
      score: number | null;
      maxScore: number | null;
      demonstratedLevel: string;
      verified: boolean;
      verifiedBy: string | null;
      verifiedAt: Date | null;
      date: Date;
      expiresAt: Date | null;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
    lastPracticedAt: Date | null;
  }): SkillBuildProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      skillId: profile.skillId,
      skill: profile.skill
        ? {
            id: profile.skill.id,
            name: profile.skill.name,
            description: profile.skill.description ?? '',
            category: mapPrismaCategory(profile.skill.category),
            tags: [],
            learningCurve: {
              hoursToLevel: {},
              difficultyFactor: 1,
              retentionDifficulty: 1,
              applicationComplexity: 'MEDIUM',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
      dimensions: {
        mastery: profile.masteryScore,
        retention: profile.retentionScore,
        application: profile.applicationScore,
        confidence: profile.confidenceScore,
        calibration: profile.calibrationScore,
      },
      compositeScore: profile.compositeScore,
      proficiencyLevel: mapPrismaProficiency(profile.proficiencyLevel),
      velocity: {
        learningSpeed: profile.learningSpeed,
        sessionsToNextLevel: profile.sessionsToNextLevel,
        daysToNextLevel: profile.daysToNextLevel,
        trend: mapPrismaTrend(profile.velocityTrend),
        acceleration: profile.velocityAcceleration,
        recentScores: profile.recentScores,
        calculatedAt: profile.velocityCalculatedAt ?? new Date(),
      },
      decay: {
        decayRate: profile.decayRate,
        daysSinceLastPractice: profile.daysSinceLastPractice,
        predictedDecay: [],
        halfLifeDays: profile.halfLifeDays,
        daysUntilLevelDrop: profile.daysUntilLevelDrop ?? undefined,
        recommendedReviewDate: profile.recommendedReviewDate ?? new Date(),
        riskLevel: profile.decayRiskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      },
      evidence: profile.evidence?.map((e) => this.toEvidence(e)) ?? [],
      practiceHistory: {
        totalSessions: profile.totalSessions,
        totalMinutes: profile.totalMinutes,
        averageSessionMinutes: profile.averageSessionMinutes,
        averageScore: profile.averageScore,
        bestScore: profile.bestScore,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        lastSessionDate: profile.lastPracticedAt ?? undefined,
        sessionsThisWeek: profile.sessionsThisWeek,
        sessionsThisMonth: profile.sessionsThisMonth,
      },
      targetLevel: profile.targetLevel
        ? mapPrismaProficiency(profile.targetLevel)
        : undefined,
      progressToTarget: profile.progressToTarget ?? undefined,
      levelHistory: (profile.levelHistory as SkillBuildProfile['levelHistory']) ?? [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastPracticedAt: profile.lastPracticedAt ?? undefined,
    };
  }

  private toEvidence(evidence: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    sourceId: string | null;
    sourceUrl: string | null;
    score: number | null;
    maxScore: number | null;
    demonstratedLevel: string;
    verified: boolean;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    date: Date;
    expiresAt: Date | null;
    createdAt: Date;
  }): SkillBuildEvidence {
    return {
      id: evidence.id,
      type: mapPrismaEvidenceType(evidence.type),
      title: evidence.title,
      description: evidence.description ?? '',
      sourceId: evidence.sourceId ?? undefined,
      sourceUrl: evidence.sourceUrl ?? undefined,
      score: evidence.score ?? undefined,
      maxScore: evidence.maxScore ?? undefined,
      demonstratedLevel: mapPrismaProficiency(evidence.demonstratedLevel),
      verified: evidence.verified,
      verifiedBy: evidence.verifiedBy ?? undefined,
      verifiedAt: evidence.verifiedAt ?? undefined,
      date: evidence.date,
      expiresAt: evidence.expiresAt ?? undefined,
      createdAt: evidence.createdAt,
    };
  }

  private toRoadmap(roadmap: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    status: string;
    targetOutcome: unknown;
    totalEstimatedHours: number;
    completionPercentage: number;
    startedAt: Date | null;
    targetCompletionDate: Date | null;
    completedAt: Date | null;
    adjustments: unknown;
    milestones: Array<{
      id: string;
      roadmapId: string;
      order: number;
      title: string;
      description: string | null;
      status: string;
      skills: unknown;
      estimatedHours: number;
      actualHours: number | null;
      targetDate: Date | null;
      completedAt: Date | null;
      prerequisites: string[];
      resources: unknown;
      assessmentRequired: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): SkillBuildRoadmap {
    return {
      id: roadmap.id,
      userId: roadmap.userId,
      title: roadmap.title,
      description: roadmap.description ?? '',
      status: mapPrismaRoadmapStatus(roadmap.status),
      targetOutcome: roadmap.targetOutcome as SkillBuildRoadmap['targetOutcome'],
      milestones: roadmap.milestones.map((m) => ({
        id: m.id,
        roadmapId: m.roadmapId,
        order: m.order,
        title: m.title,
        description: m.description ?? '',
        status: mapPrismaMilestoneStatus(m.status),
        skills: (m.skills as SkillBuildRoadmap['milestones'][0]['skills']) ?? [],
        estimatedHours: m.estimatedHours,
        actualHours: m.actualHours ?? undefined,
        targetDate: m.targetDate ?? undefined,
        completedAt: m.completedAt ?? undefined,
        prerequisites: m.prerequisites,
        resources: (m.resources as SkillBuildRoadmap['milestones'][0]['resources']) ?? [],
        assessmentRequired: m.assessmentRequired,
      })),
      totalEstimatedHours: roadmap.totalEstimatedHours,
      completionPercentage: roadmap.completionPercentage,
      startedAt: roadmap.startedAt ?? undefined,
      targetCompletionDate: roadmap.targetCompletionDate ?? undefined,
      completedAt: roadmap.completedAt ?? undefined,
      adjustments: (roadmap.adjustments as SkillBuildRoadmap['adjustments']) ?? [],
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaSkillBuildTrackStore(): PrismaSkillBuildTrackStore {
  return new PrismaSkillBuildTrackStore();
}
